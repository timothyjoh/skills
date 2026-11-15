// TEXT3D: solid 3D letters from any CSS font, with no font-parsing library. Classic script; needs the globals THREE
// (core only) and K (lib/stage.js). The font must already be loaded by the page (await document.fonts.load(font)).
//
//   K.textShapes(text, opts)    -> { letters: [{ char, index, line, shapes: THREE.Shape[], x, y, w }], width, height, bounds }
//   K.text3d(text, opts)        -> one merged BufferGeometry (position, normal, uv, uv1, index) for the whole text
//   K.text3dLetters(text, opts) -> [{ char, index, line, geometry, x, y, w }], one geometry per letter, origin at its centre
//
// opts (all optional):
//   font           CSS font with a px size, default '800 200px "Inter"' (the px size itself does not matter)
//   size           world height of the font's em, default 1
//   align          'left' | 'center' | 'right', default 'center': where the origin sits on every line (start, middle, end)
//   lineHeight     line pitch in em, default 1.1; lines split on '\n'; the block is centred on y = 0, y is up
//   letterSpacing  extra space between letters in em, default 0
//   detail         tracing resolution in pixels per em, default 320
//   curveSegments  least number of segments a full circle gets, default 48 (curves get more where they are big)
//   depth          thickness in world units, default 0.2 * size (the bevels are inside it); centred on z = 0
//   bevel          bevel width in world units, default 0.02 * size, 0 = none; at most depth / 2
//   bevelSegments  steps of the bevel's quarter-round, default 3
//
// How it works: every glyph is drawn once on a 2D canvas with the CSS font, the outline of its alpha channel is traced
// at sub-pixel accuracy (marching squares on the anti-aliased coverage), corners are found and rebuilt sharp, the rest
// is smoothed and reduced to as few points as the curve allows. The extruder here (not THREE.ExtrudeGeometry) gives
// smooth normals on curves, hard edges at corners and a rounded bevel that narrows where a stroke is too thin for it.
// Glyph outlines and glyph solids are cached, so a letter that repeats costs almost nothing.
(function (root) {
  const THREE = root.THREE, K = root.K || (root.K = {});

  // ---------------------------------------------------------------- tuning (pixels are tracing pixels: `detail` per em)
  const STEP = 0.5;          // spacing of the dense outline samples, px
  const SIGMA = 1.0;         // smoothing of the dense outline, px (removes pixel noise; corners are rebuilt separately)
  const TRIM = 2.0;          // dense samples closer than this to a corner are dropped (anti-aliasing rounds them off)
  const FIT0 = 3.0, FIT1 = 11.0;   // a corner is the meeting point of two curves fitted to the outline this far from it
  const TOL_EM = 0.0004;     // how far a straight segment may cut inside the true curve, in em (at curveSegments 48)
  const LIN_DEG = 1.2;       // a segment may not mix a straight part and a bend: tangent must turn evenly within this
  const rad = Math.PI / 180;

  // ---------------------------------------------------------------- 1. draw a glyph and read its coverage
  let rcv = null, rctx = null, mctx = null;
  const measureCtx = (font) => { if (!mctx) mctx = document.createElement('canvas').getContext('2d'); mctx.font = font; mctx.textBaseline = 'alphabetic'; mctx.textAlign = 'left'; return mctx; };
  const fontPx = (font) => { const m = /(\d*\.?\d+)px/.exec(font); if (!m) throw new Error('K.text3d: the font needs a px size, like \'800 200px "Inter"\''); return +m[1]; };

  function raster(font, px, ch, detail) {
    const mt = measureCtx(font).measureText(ch), k = detail / px;
    const l = mt.actualBoundingBoxLeft, r = mt.actualBoundingBoxRight, a = mt.actualBoundingBoxAscent, d = mt.actualBoundingBoxDescent;
    if (!(l + r > 0) || !(a + d > 0)) return null;                      // a space, or a glyph with no ink
    for (let pad = Math.ceil(detail * 0.1) + 6, tries = 0; tries < 3; tries++, pad *= 3) {
      const W = Math.ceil((l + r) * k) + 2 * pad, H = Math.ceil((a + d) * k) + 2 * pad, ox = pad + Math.ceil(l * k), oy = pad + Math.ceil(a * k);
      if (!rcv) { rcv = document.createElement('canvas'); rcv.width = 16; rcv.height = 16; }
      if (rcv.width < W || rcv.height < H || !rctx) { rcv.width = Math.max(rcv.width, W); rcv.height = Math.max(rcv.height, H); rctx = rcv.getContext('2d', { willReadFrequently: true }); }   // CPU canvas: exact analytic coverage
      rctx.setTransform(1, 0, 0, 1, 0, 0); rctx.clearRect(0, 0, rcv.width, rcv.height);
      rctx.setTransform(k, 0, 0, k, ox, oy);                             // the font keeps its own px size (and optical size); the canvas is scaled
      rctx.font = font; rctx.textBaseline = 'alphabetic'; rctx.textAlign = 'left'; rctx.fillStyle = '#000';
      rctx.fillText(ch, 0, 0);
      const data = rctx.getImageData(0, 0, W, H).data, A = new Uint8Array(W * H);
      let edge = false;
      for (let i = 0, n = W * H; i < n; i++) A[i] = data[4 * i + 3];
      for (let i = 0; i < W && !edge; i++) edge = A[i] > 0 || A[(H - 1) * W + i] > 0;
      for (let j = 0; j < H && !edge; j++) edge = A[j * W] > 0 || A[j * W + W - 1] > 0;
      if (!edge) return { A, W, H, ox, oy };                             // ink reached the border: the font's bounding box lied, try with more room
    }
    return null;
  }

  // Marching squares on the coverage, threshold one half, crossing points placed by linear interpolation. Returns
  // closed loops [x0, y0, x1, y1, ...] in glyph pixels (origin on the baseline at the pen position, y up), each
  // walked with the ink on its left: outer contours come out counter-clockwise, holes clockwise.
  function traceLoops(R) {
    const { A, W, H, ox, oy } = R, TH = 127.5, next = new Int32Array(2 * W * H).fill(-1);
    for (let j = 0; j < H - 1; j++) for (let i = 0; i < W - 1; i++) {
      const p = j * W + i, c = (A[p] > TH ? 8 : 0) | (A[p + 1] > TH ? 4 : 0) | (A[p + W + 1] > TH ? 2 : 0) | (A[p + W] > TH ? 1 : 0);
      if (c === 0 || c === 15) continue;
      const T = 2 * p, B = 2 * (p + W), L = 2 * p + 1, Rt = 2 * (p + 1) + 1;      // ids of the four cell edges
      const mid = c === 5 || c === 10 ? A[p] + A[p + 1] + A[p + W] + A[p + W + 1] > 4 * TH : false;
      switch (c) {
        case 1: next[L] = B; break; case 2: next[B] = Rt; break; case 4: next[Rt] = T; break; case 8: next[T] = L; break;
        case 3: next[L] = Rt; break; case 6: next[B] = T; break; case 12: next[Rt] = L; break; case 9: next[T] = B; break;
        case 7: next[L] = T; break; case 11: next[T] = Rt; break; case 13: next[Rt] = B; break; case 14: next[B] = L; break;
        case 5: if (mid) { next[L] = T; next[Rt] = B; } else { next[L] = B; next[Rt] = T; } break;
        case 10: if (mid) { next[T] = Rt; next[B] = L; } else { next[T] = L; next[B] = Rt; } break;
      }
    }
    const loops = [];
    for (let e0 = 0; e0 < next.length; e0++) {
      if (next[e0] < 0) continue;
      const pts = [];
      for (let e = e0, guard = 0; e >= 0 && next[e] >= 0 && guard < next.length; guard++) {
        // Where the outline crosses the line between two pixel centres. Coverage is an area, so across a clean edge the
        // sum of the coverage along that line IS the edge position, exactly, for any straight edge up to 45 degrees
        // from square to the line. Steeper crossings are less exact and the other axis has better ones: skip them.
        const p = e >> 1, i = p % W, j = (p - i) / W, d = e & 1 ? W : 1, o = e & 1 ? 1 : W, a0 = A[p - d], a1 = A[p], a2 = A[p + d], a3 = A[p + 2 * d];
        let t = null;
        if (a1 > a2 ? a0 >= 254 && a3 <= 1 : a0 <= 1 && a3 >= 254) t = a1 > a2 ? (a0 + a1 + a2 + a3) / 255 - 1.5 : 2.5 - (a0 + a1 + a2 + a3) / 255;
        else if (Math.abs(A[p + o] + A[p + d + o] - A[p - o] - A[p + d - o]) <= 6 * Math.abs(a2 - a1)) t = (TH - a1) / (a2 - a1);
        if (t !== null) { if (e & 1) pts.push(i + 0.5 - ox, oy - (j + 0.5 + t)); else pts.push(i + 0.5 + t - ox, oy - (j + 0.5)); }
        const n = next[e]; next[e] = -2; e = n;
        if (e === e0) break;
      }
      if (pts.length < 6) continue;
      const rev = new Array(pts.length);                                 // the walk above keeps the ink on its right: turn it round
      for (let i = 0, n = pts.length; i < n; i += 2) { rev[i] = pts[n - 2 - i]; rev[i + 1] = pts[n - 1 - i]; }
      loops.push(rev);
    }
    return loops;
  }

  // ---------------------------------------------------------------- 2. from a pixel-noisy loop to a clean outline
  const loopArea = (p) => { let a = 0; for (let i = 0, n = p.length; i < n; i += 2) { const j = (i + 2) % n; a += p[i] * p[j + 1] - p[j] * p[i + 1]; } return a / 2; };

  function resample(pts) {                       // closed polyline -> n points evenly spaced along it
    const m = pts.length / 2, len = new Float64Array(m); let P = 0;
    for (let i = 0; i < m; i++) { const j = (i + 1) % m; len[i] = Math.hypot(pts[2 * j] - pts[2 * i], pts[2 * j + 1] - pts[2 * i + 1]); P += len[i]; }
    const n = Math.max(12, Math.round(P / STEP)), step = P / n, X = new Float64Array(n), Y = new Float64Array(n);
    for (let k = 0, seg = 0, acc = 0; k < n; k++) {
      const s = k * step;
      while (seg < m - 1 && acc + len[seg] < s) { acc += len[seg]; seg++; }
      const j = (seg + 1) % m, t = len[seg] > 0 ? Math.min(1, (s - acc) / len[seg]) : 0;
      X[k] = pts[2 * seg] + (pts[2 * j] - pts[2 * seg]) * t; Y[k] = pts[2 * seg + 1] + (pts[2 * j + 1] - pts[2 * seg + 1]) * t;
    }
    return { X, Y, n, step };
  }
  function smoothLoop(X, n, sig) {               // circular Gaussian
    const r = Math.ceil(sig * 3), w = []; let sum = 0;
    for (let k = -r; k <= r; k++) { const g = Math.exp(-k * k / (2 * sig * sig)); w.push(g); sum += g; }
    const out = new Float64Array(n);
    for (let i = 0; i < n; i++) { let a = 0; for (let k = -r; k <= r; k++) a += w[k + r] * X[((i + k) % n + n) % n]; out[i] = a / sum; }
    return out;
  }
  // A corner is where the outline turns sharply within a pixel or two. Two scales tell a corner from a tight curve:
  // across a real corner the turn measured over 2 px is almost the turn measured over 4 px, on a curve it is half.
  function findCorners(X, Y, n, step) {
    const k2 = Math.max(2, Math.round(2 / step)), k4 = 2 * k2;
    if (n < 5 * k4) return [];
    const turn = (i, k) => { const a = (i - k + n) % n, b = (i + k) % n, ux = X[i] - X[a], uy = Y[i] - Y[a], vx = X[b] - X[i], vy = Y[b] - Y[i]; return Math.abs(Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)); };
    const cand = [];
    for (let i = 0; i < n; i++) {
      const t2 = turn(i, k2); if (t2 < 15 * rad) continue;
      if (t2 >= 45 * rad) { cand.push([t2, i]); continue; }
      const t4 = turn(i, k4); if (t4 >= 20 * rad && t2 >= 0.72 * t4) cand.push([t2, i]);
    }
    cand.sort((a, b) => b[0] - a[0] || a[1] - b[1]);
    const taken = [], gap = Math.round(2.5 / step);
    for (const [, i] of cand) if (taken.every((j) => { const d = Math.abs(i - j); return Math.min(d, n - d) >= gap; })) taken.push(i);
    return taken.sort((a, b) => a - b);
  }
  // least-squares line or parabola v(s); returned centred on the mean of s for stability
  function polyFit(s, v, deg) {
    const n = s.length; let sm = 0; for (const a of s) sm += a; sm /= n;
    let S2 = 0, S3 = 0, S4 = 0, b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < n; i++) { const t = s[i] - sm, t2 = t * t; S2 += t2; S3 += t2 * t; S4 += t2 * t2; b0 += v[i]; b1 += t * v[i]; b2 += t2 * v[i]; }
    if (deg < 2) return { sm, c: [b0 / n, b1 / S2, 0] };
    const c2 = (b2 - S3 * b1 / S2 - S2 * b0 / n) / (S4 - S3 * S3 / S2 - S2 * S2 / n);
    return { sm, c: [(b0 - S2 * c2) / n, (b1 - S3 * c2) / S2, c2] };
  }
  const ev = (f, s) => { const t = s - f.sm; return f.c[0] + f.c[1] * t + f.c[2] * t * t; }, dv = (f, s) => f.c[1] + 2 * f.c[2] * (s - f.sm);

  // Reduce a dense run of points (with tangent angles PHI and arc lengths S) to the fewest vertices such that every
  // segment stays within eps of the run, turns less than maxTurn, and its tangent turns evenly (so one segment never
  // covers a straight part plus the start of a bend, which would shade the straight part wrongly).
  function simplifyRun(PX, PY, PHI, S, M, eps, maxTurn) {
    const lin = LIN_DEG * rad;
    const ok = (i, j) => {
      if (j === i + 1) return true;
      const dphi = PHI[j] - PHI[i]; if (Math.abs(dphi) > maxTurn) return false;
      const dx = PX[j] - PX[i], dy = PY[j] - PY[i], L = Math.hypot(dx, dy), ds = S[j] - S[i]; if (L < 1e-9) return false;
      for (let k = i + 1; k < j; k++) {
        if (Math.abs((PX[k] - PX[i]) * dy - (PY[k] - PY[i]) * dx) > eps * L) return false;
        if (Math.abs(PHI[k] - PHI[i] - dphi * (S[k] - S[i]) / ds) > lin) return false;
      }
      return true;
    };
    const keep = [0];
    for (let i = 0; i < M - 1;) {
      let lo = i + 1, hi = M;
      for (let g = 2; ; g *= 2) { const j = Math.min(M - 1, i + g); if (j <= lo) break; if (ok(i, j)) { lo = j; if (j === M - 1) break; } else { hi = j; break; } }
      while (hi < M && hi - lo > 1) { const mid = (lo + hi) >> 1; if (ok(i, mid)) lo = mid; else hi = mid; }
      keep.push(lo); i = lo;
    }
    return keep;
  }

  // One traced loop -> outline vertices { x, y, tangent in, tangent out, corner flag } in glyph pixels.
  function processLoop(pts, eps, maxTurn, dbg, raw) {
    if (Math.abs(loopArea(pts)) < 1.5) return null;                      // a stray speck
    const { X: RX, Y: RY, n, step } = resample(pts);
    const SX = smoothLoop(RX, n, SIGMA / step), SY = smoothLoop(RY, n, SIGMA / step);
    const corners = findCorners(RX, RY, n, step), m = corners.length;
    const D = Math.max(1, Math.round(TRIM / step)), k0 = Math.round(FIT0 / step), kmax = Math.round(FIT1 / step), kq = Math.round(4 / step);
    const o = { x: [], y: [], tix: [], tiy: [], tox: [], toy: [], corner: [], cid: [] };
    const push = (x, y, ax, ay, bx, by, c, id) => { o.x.push(x); o.y.push(y); o.tix.push(ax); o.tiy.push(ay); o.tox.push(bx); o.toy.push(by); o.corner.push(c); o.cid.push(c ? id : -1); };
    const wrap = (i) => ((i % n) + n) % n;
    const run = (PX, PY, TX, TY, M) => {                                 // tangent angles (unwrapped), arc length, then reduce
      const PHI = new Float64Array(M), S = new Float64Array(M);
      for (let q = 0; q < M; q++) {
        let a = Math.atan2(TY[q], TX[q]);
        if (q) { while (a - PHI[q - 1] > Math.PI) a -= 2 * Math.PI; while (a - PHI[q - 1] < -Math.PI) a += 2 * Math.PI; S[q] = S[q - 1] + Math.hypot(PX[q] - PX[q - 1], PY[q] - PY[q - 1]); }
        PHI[q] = a;
      }
      return simplifyRun(PX, PY, PHI, S, M, eps, maxTurn);
    };
    if (dbg) dbg.push({ RX, RY, SX, SY, corners });

    if (!m) {                                                            // a smooth closed loop (an O): start at its top
      let s0 = 0; for (let i = 1; i < n; i++) if (SY[i] > SY[s0] || (SY[i] === SY[s0] && SX[i] < SX[s0])) s0 = i;
      const M = n + 1, PX = new Float64Array(M), PY = new Float64Array(M), TX = new Float64Array(M), TY = new Float64Array(M), w = Math.max(1, Math.min(6, (n - 1) >> 1));
      for (let q = 0; q < M; q++) { const i = wrap(s0 + q), a = wrap(i - w), b = wrap(i + w); PX[q] = SX[i]; PY[q] = SY[i]; TX[q] = SX[b] - SX[a]; TY[q] = SY[b] - SY[a]; }
      const keep = run(PX, PY, TX, TY, M);
      for (let q = 0; q < keep.length - 1; q++) { const i = keep[q], L = Math.hypot(TX[i], TY[i]) || 1; push(PX[i], PY[i], TX[i] / L, TY[i] / L, TX[i] / L, TY[i] / L, 0); }
      return o.x.length >= 3 ? o : null;
    }

    // rebuild each corner: fit a curve to the clean outline on both sides (away from the rounded tip) and intersect.
    // Near a sharp tip the two edges are so close that pixels see both, so the clean part starts further out: `from`.
    const fit = (c, dir, gap, from) => {
      const f0 = Math.round(from / step), k1 = Math.min(f0 + kmax - k0, gap - D), cnt = k1 - f0 + 1;
      if (cnt >= 3) {
        const s = [], vx = [], vy = [];
        for (let k = f0; k <= k1; k++) { const i = wrap(c + dir * k); s.push(k * step); vx.push(SX[i]); vy.push(SY[i]); }
        // a straight line if the side is straight (so straight edges stay exactly straight), a parabola if it bends
        const lx = polyFit(s, vx, 1), ly = polyFit(s, vy, 1); if (cnt < 9) return { fx: lx, fy: ly, k1 };
        let r = 0; for (let q = 0; q < cnt; q++) r += Math.pow(ev(lx, s[q]) - vx[q], 2) + Math.pow(ev(ly, s[q]) - vy[q], 2);
        const w = Math.min(1, Math.max(0, (Math.sqrt(r / cnt) - 0.01) / 0.02)); if (w === 0) return { fx: lx, fy: ly, k1 };
        const qx = polyFit(s, vx, 2), qy = polyFit(s, vy, 2), mix = (a, b) => ({ sm: a.sm, c: a.c.map((v, q) => v + (b.c[q] - v) * w) });
        return { fx: mix(lx, qx), fy: mix(ly, qy), k1 };
      }
      const e = wrap(c + dir * gap), dx = RX[e] - RX[c], dy = RY[e] - RY[c], L = Math.hypot(dx, dy) || 1;   // next corner is very close: a straight line to it
      return { fx: { sm: 0, c: [RX[c], dx / L, 0] }, fy: { sm: 0, c: [RY[c], dy / L, 0] }, k1: 0 };
    };
    const C = corners.map((c, j) => {
      const gp = ((c - corners[(j + m - 1) % m] + n) % n) || n, gn = ((corners[(j + 1) % m] - c + n) % n) || n;
      const solve = (from) => {
        const A = fit(c, -1, gp, from), B = fit(c, 1, gn, from);
        let s = 0, u = 0, good = false;
        for (let it = 0; it < 14; it++) {
          const f0 = ev(A.fx, s) - ev(B.fx, u), f1 = ev(A.fy, s) - ev(B.fy, u), a = dv(A.fx, s), b = -dv(B.fx, u), cc = dv(A.fy, s), d = -dv(B.fy, u), det = a * d - b * cc;
          if (Math.abs(det) < 1e-6) break;
          const ds = (f0 * d - b * f1) / det, du = (a * f1 - cc * f0) / det; s -= ds; u -= du;
          if (Math.abs(ds) + Math.abs(du) < 1e-8) { good = true; break; }
          if (!(Math.abs(s) < 50 && Math.abs(u) < 50)) break;
        }
        const tan = (ss, uu) => { const ax = -dv(A.fx, ss), ay = -dv(A.fy, ss), bx = dv(B.fx, uu), by = dv(B.fy, uu), la = Math.hypot(ax, ay) || 1, lb = Math.hypot(bx, by) || 1; return [ax / la, ay / la, bx / lb, by / lb]; };
        let t = tan(s, u), px = ev(A.fx, s), py = ev(A.fy, s);
        const half = (Math.PI - Math.abs(Math.atan2(t[0] * t[3] - t[1] * t[2], t[0] * t[2] + t[1] * t[3]))) / 2, lim = 0.7 / Math.max(0.1, Math.sin(half)) + 1.2;
        if (!(good && s > -16 && s < 3 && u > -16 && u < 3 && Math.hypot(px - RX[c], py - RY[c]) <= lim) || (raw && raw.has(c))) { s = 0; u = 0; t = tan(0, 0); px = RX[c]; py = RY[c]; good = false; }
        return { c, px, py, t, A, B, s, u, gn, half, good, from, Dk: Math.max(D, Math.round((from - 1) / step)) };
      };
      let r = solve(FIT0);
      const need = Math.min(14, 1.75 / Math.max(0.05, Math.tan(r.half)) + 1.5);       // where both edges are clear of each other
      if (need > FIT0 + 0.5) { const r2 = solve(need); if (r2.good || !r.good) r = r2; }
      return r;
    });
    for (let j = 0; j < m; j++) {
      const c0 = C[j], c1 = C[(j + 1) % m], gap = c0.gn;
      const PX = [c0.px], PY = [c0.py], TX = [c0.t[2]], TY = [c0.t[3]];
      for (let k = c0.Dk; k <= gap - c1.Dk; k++) {
        const k2 = gap - k; if (k * step <= c0.u + 0.75 || k2 * step <= c1.s + 0.75) continue;
        const i = wrap(c0.c + k); let tx, ty;
        if (c0.B.k1 > 0 && k <= Math.min(c0.B.k1, c0.Dk + kq)) { tx = dv(c0.B.fx, k * step); ty = dv(c0.B.fy, k * step); }
        else if (c1.A.k1 > 0 && k2 <= Math.min(c1.A.k1, c1.Dk + kq)) { tx = -dv(c1.A.fx, k2 * step); ty = -dv(c1.A.fy, k2 * step); }
        else { const w = Math.max(1, Math.min(6, k - c0.Dk, k2 - c1.Dk)), a = wrap(i - w), b = wrap(i + w); tx = SX[b] - SX[a]; ty = SY[b] - SY[a]; }
        PX.push(SX[i]); PY.push(SY[i]); TX.push(tx); TY.push(ty);
      }
      PX.push(c1.px); PY.push(c1.py); TX.push(c1.t[0]); TY.push(c1.t[1]);
      const keep = run(PX, PY, TX, TY, PX.length);
      push(c0.px, c0.py, c0.t[0], c0.t[1], c0.t[2], c0.t[3], 1, c0.c);
      for (let q = 1; q < keep.length - 1; q++) { const i = keep[q], L = Math.hypot(TX[i], TY[i]) || 1; push(PX[i], PY[i], TX[i] / L, TY[i] / L, TX[i] / L, TY[i] / L, 0); }
    }
    return o.x.length >= 3 ? o : null;
  }

  // ---------------------------------------------------------------- 3. glyphs (cached) and layout
  const glyphs = new Map();
  let DBG = null;
  const pointIn = (c, x, y) => { let inside = false; for (let i = 0, n = c.x.length, j = n - 1; i < n; j = i++) if ((c.y[i] > y) !== (c.y[j] > y) && x < (c.x[j] - c.x[i]) * (y - c.y[i]) / (c.y[j] - c.y[i]) + c.x[i]) inside = !inside; return inside; };
  // A glyph: contours in em units (origin on the baseline at the pen position, y up) grouped into shapes = one outer
  // contour plus the holes directly inside it. Parts of a letter (the dot of an i, both rings of a %) are separate shapes.
  function getGlyph(font, px, ch, detail, cs) {
    const key = font + '|' + detail + '|' + cs + '|' + ch; let g = glyphs.get(key);
    if (g && !DBG) return g;
    g = { key, contours: [], shapes: [], bbox: [0, 0, 0, 0], points: 0 };
    const R = raster(font, px, ch, detail);
    if (R) {
      const eps = Math.max(0.05, TOL_EM * detail * Math.pow(48 / cs, 2)), maxTurn = 2 * Math.PI / cs, loops = traceLoops(R), raw = loops.map(() => new Set());
      const build = (li) => {
        const c = processLoop(loops[li], eps, maxTurn, DBG, raw[li]); if (!c) return null;
        for (let i = c.x.length - 1; i >= 0; i--) {                      // drop repeated points
          const j = i + 1; if (j < c.x.length && Math.hypot(c.x[j] - c.x[i], c.y[j] - c.y[i]) < 1e-4) { c.tox[i] = c.tox[j]; c.toy[i] = c.toy[j]; if (c.corner[j] && !c.corner[i]) { c.corner[i] = 1; c.cid[i] = c.cid[j]; } for (const k in c) c[k].splice(j, 1); }
        }
        return c.x.length >= 3 ? c : null;
      };
      let cs0 = loops.map((_, li) => build(li));
      // Rebuilt corners can overshoot where two parts of a letter only just touch (the arm of a K against its stem,
      // the petals of an asterisk). Wherever the outline then crosses or touches itself, those corners go back to
      // where the pixels put them, which never crosses.
      for (let round = 0; round < 4; round++) {
        const S = []; cs0.forEach((c, li) => { if (c) for (let i = 0, n = c.x.length; i < n; i++) S.push([c.x[i], c.y[i], c.x[(i + 1) % n], c.y[(i + 1) % n], li, i, n]); });
        const redo = new Set(), near = 0.2, flag = (a) => { const c = cs0[a[4]]; for (const i of [a[5], (a[5] + 1) % a[6]]) if (c.corner[i] && !raw[a[4]].has(c.cid[i])) { raw[a[4]].add(c.cid[i]); redo.add(a[4]); } };
        const dps = (px, py, a) => { const ex = a[2] - a[0], ey = a[3] - a[1], t = Math.max(0, Math.min(1, ((px - a[0]) * ex + (py - a[1]) * ey) / (ex * ex + ey * ey || 1))); return Math.hypot(px - a[0] - t * ex, py - a[1] - t * ey); };
        const side = (a, px, py) => (a[2] - a[0]) * (py - a[1]) - (a[3] - a[1]) * (px - a[0]);
        for (let p = 0; p < S.length; p++) for (let q = p + 1; q < S.length; q++) {
          const a = S[p], b = S[q];
          if (a[4] === b[4]) { const d = b[5] - a[5]; if (d === 1 || d === a[6] - 1) continue; }
          if (Math.max(a[0], a[2]) + near < Math.min(b[0], b[2]) || Math.max(b[0], b[2]) + near < Math.min(a[0], a[2]) || Math.max(a[1], a[3]) + near < Math.min(b[1], b[3]) || Math.max(b[1], b[3]) + near < Math.min(a[1], a[3])) continue;
          const cross = side(a, b[0], b[1]) * side(a, b[2], b[3]) < 0 && side(b, a[0], a[1]) * side(b, a[2], a[3]) < 0;
          if (cross || Math.min(dps(a[0], a[1], b), dps(a[2], a[3], b), dps(b[0], b[1], a), dps(b[2], b[3], a)) < near) { flag(a); flag(b); }
        }
        if (!redo.size) break;
        for (const li of redo) cs0[li] = build(li);
      }
      for (const c of cs0) {
        if (!c) continue;
        for (let i = 0; i < c.x.length; i++) { c.x[i] /= detail; c.y[i] /= detail; }
        let a = 0; for (let i = 0, n = c.x.length; i < n; i++) { const j = (i + 1) % n; a += c.x[i] * c.y[j] - c.x[j] * c.y[i]; }
        c.area = a / 2; if (Math.abs(c.area) < 1e-7) continue;
        g.contours.push(c); g.points += c.x.length;
      }
      const outers = g.contours.filter((c) => c.area > 0);
      const bb = [Infinity, Infinity, -Infinity, -Infinity];
      for (const c of outers) { g.shapes.push({ outer: c, holes: [] }); for (let i = 0; i < c.x.length; i++) { bb[0] = Math.min(bb[0], c.x[i]); bb[1] = Math.min(bb[1], c.y[i]); bb[2] = Math.max(bb[2], c.x[i]); bb[3] = Math.max(bb[3], c.y[i]); } }
      for (const h of g.contours) if (h.area < 0) {                      // a hole belongs to the smallest outer contour around it
        let best = null; for (const s of g.shapes) if (pointIn(s.outer, h.x[0], h.y[0]) && (!best || s.outer.area < best.outer.area)) best = s;
        if (best) best.holes.push(h);
      }
      g.contours = []; for (const s of g.shapes) g.contours.push(s.outer, ...s.holes);
      if (outers.length) g.bbox = bb;
    }
    if (!DBG) glyphs.set(key, g);
    return g;
  }

  const clampN = (v, a, b) => Math.min(b, Math.max(a, v));
  function layout(text, o = {}) {
    const font = o.font || '800 200px "Inter"', px = fontPx(font), size = o.size == null ? 1 : o.size, align = o.align || 'center';
    const lh = (o.lineHeight == null ? 1.1 : o.lineHeight) * size, ls = (o.letterSpacing || 0) * px, unit = size / px;
    const detail = Math.round(clampN(o.detail || 320, 48, 1200)), cs = Math.round(clampN(o.curveSegments || 48, 6, 256));
    if (document.fonts && !document.fonts.check(font)) console.warn('K.text3d: font not loaded yet, the fallback font will be traced: ' + font);
    const m = measureCtx(font), fm = m.measureText('Hg');
    const asc = (fm.fontBoundingBoxAscent == null ? fm.actualBoundingBoxAscent : fm.fontBoundingBoxAscent) * unit, desc = (fm.fontBoundingBoxDescent == null ? fm.actualBoundingBoxDescent : fm.fontBoundingBoxDescent) * unit;
    const lines = String(text).split('\n'), H = lines.length * lh, letters = [], B = [Infinity, Infinity, -Infinity, -Infinity];
    let width = 0, index = 0;
    lines.forEach((line, li) => {
      const chars = Array.from(line), row = []; let acc = '', lw = 0;
      // pen positions come from the widths of the growing string, so kerning between neighbours is included
      chars.forEach((ch, i) => { acc += ch; const W = m.measureText(acc).width, adv = m.measureText(ch).width; row.push({ char: ch, index: index++, line: li, px: W - adv + i * ls, adv }); lw = W + i * ls; });
      index++;                                                           // the line break counts as a character
      const x0 = align === 'left' ? 0 : align === 'right' ? -lw * unit : -lw * unit / 2;
      const y = H / 2 - li * lh - (lh - asc - desc) / 2 - asc;           // baseline: the font's ascent + descent box sits centred in its line
      width = Math.max(width, lw * unit);
      for (const r of row) {
        const g = /\s/.test(r.char) ? null : getGlyph(font, px, r.char, detail, cs), x = x0 + r.px * unit;
        if (g && g.shapes.length) { B[0] = Math.min(B[0], x + g.bbox[0] * size); B[1] = Math.min(B[1], y + g.bbox[1] * size); B[2] = Math.max(B[2], x + g.bbox[2] * size); B[3] = Math.max(B[3], y + g.bbox[3] * size); }
        letters.push({ char: r.char, index: r.index, line: r.line, x, y, w: r.adv * unit, glyph: g });
      }
    });
    const bounds = B[0] <= B[2] ? { minX: B[0], minY: B[1], maxX: B[2], maxY: B[3] } : { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    return { letters, width, height: H, bounds, size };
  }

  // K.textShapes(text, { font, size, align, lineHeight, letterSpacing, detail, curveSegments })
  // -> { letters: [{ char, index, line, shapes, x, y, w }], width, height, bounds }. Shapes are THREE.Shape with holes,
  // already placed in block coordinates (y up). x = left edge of the letter's advance box, y = its baseline, w = advance.
  K.textShapes = (text, opts) => {
    const L = layout(text, opts), s = L.size, V = (c, x, y) => c.x.map((_, i) => new THREE.Vector2(x + c.x[i] * s, y + c.y[i] * s));
    return {
      letters: L.letters.map((l) => ({ char: l.char, index: l.index, line: l.line, x: l.x, y: l.y, w: l.w,
        shapes: l.glyph ? l.glyph.shapes.map((sh) => { const S = new THREE.Shape(V(sh.outer, l.x, l.y)); S.holes = sh.holes.map((h) => new THREE.Path(V(h, l.x, l.y))); return S; }) : [] })),
      width: L.width, height: L.height, bounds: L.bounds,
    };
  };

  // ---------------------------------------------------------------- 4. extrude one glyph (em units, cached)
  // Walls get the outline's true tangents as normals (smooth curves, hard corners). The bevel is a quarter-round that
  // insets the outline. Every outline point gets its own bevel width: the asked one where the stroke is wide enough,
  // 80% of the way to the middle of the stroke where it is not, changing gently in between, so the two sides of a thin
  // stroke never run into each other. Outward corners are mitered: nearby points follow the corner's miter line.
  const solids = new Map();
  function buildSolid(g, depth, bevel, segs) {
    const key = g.key + '|' + depth.toFixed(6) + '|' + bevel.toFixed(6) + '|' + segs; let out = solids.get(key); if (out) return out;
    const src = g.contours, hd = depth / 2; bevel = Math.min(bevel, hd);
    let NS = 0; for (const c of src) NS += c.x.length;
    const SA = new Float64Array(4 * NS);
    for (let ci = 0, s = 0; ci < src.length; ci++) { const c = src[ci]; for (let i = 0, n = c.x.length; i < n; i++, s++) { const j = (i + 1) % n; SA[4 * s] = c.x[i]; SA[4 * s + 1] = c.y[i]; SA[4 * s + 2] = c.x[j]; SA[4 * s + 3] = c.y[j]; } }
    // How deep can the point p be inset along m before it meets the middle of the stroke? Picture a disc that starts
    // at p and travels inwards along m, growing so that it always just touches p's own edges (radius own * depth).
    // The depth at which it first touches any other part of the outline is the answer: an exact, noise-free
    // "half-width of the stroke as seen from p". skipA / skipB = the outline segments that p itself sits on.
    const nearSeg = new Uint8Array(NS);                                  // set for the few segments next to p on the same smooth curve
    const contact = (px, py, mx, my, own, skipA, skipB) => {
      const e = Math.max(0, mx * mx + my * my - own * own), se = Math.sqrt(e), reach = Math.hypot(mx, my) + own; let best = Infinity;
      const at = (x, y) => { const dx = x - px, dy = y - py, X = dx * dx + dy * dy, Y = dx * mx + dy * my, g = Y - se * Math.sqrt(X); return g <= 0 || Y <= 0 ? 1e9 - g : X / (Y + Math.sqrt(Math.max(0, Y * Y - e * X))); };
      for (let k = 0; k < NS; k++) {
        if (k === skipA || k === skipB) continue;
        const s = 4 * k, ax = SA[s], ay = SA[s + 1], ex = SA[s + 2] - ax, ey = SA[s + 3] - ay;
        const u0 = Math.max(0, Math.min(1, ((px - ax) * ex + (py - ay) * ey) / (ex * ex + ey * ey || 1)));
        if (Math.hypot(ax + u0 * ex - px, ay + u0 * ey - py) >= best * reach) continue;      // too far away to matter
        // p's close neighbours on a curve stand for the true curve through their end points (their chords cut inside
        // it and would make a round end look tighter than it is): end points only
        if (nearSeg[k]) { const t = Math.min(at(ax, ay), at(ax + ex, ay + ey)); if (t < best) best = t; continue; }
        let lo = 0, hi = 1;                                               // the depth is quasi-convex along a segment: ternary search
        for (let it = 0; it < 16; it++) { const u1 = lo + (hi - lo) / 3, u2 = hi - (hi - lo) / 3; if (at(ax + u1 * ex, ay + u1 * ey) <= at(ax + u2 * ex, ay + u2 * ey)) hi = u2; else lo = u1; }
        const um = (lo + hi) / 2, t = Math.min(at(ax, ay), at(ax + ex, ay + ey), at(ax + um * ex, ay + um * ey));
        if (t < best) best = t;
      }
      return best;
    };
    const limit = (rho) => (rho >= bevel * 1.25 ? bevel : Math.min(bevel, 0.8 * rho));       // keep 80% of the way to the middle
    // The direction an inset moves an outline point: the miter of its two edges (limited at very sharp corners).
    // `own` = how far the moved point then is from its own edges, per unit of inset.
    const miter = (c, i) => {
      const n = c.x.length, p = (i + n - 1) % n, q = (i + 1) % n;
      let e1x = c.x[i] - c.x[p], e1y = c.y[i] - c.y[p], e2x = c.x[q] - c.x[i], e2y = c.y[q] - c.y[i];
      const l1 = Math.hypot(e1x, e1y) || 1, l2 = Math.hypot(e2x, e2y) || 1; e1x /= l1; e1y /= l1; e2x /= l2; e2y /= l2;
      if (!c.corner[i]) return [-c.toy[i], c.tox[i], 1, l2, Math.atan2(e1x * e2y - e1y * e2x, e1x * e2x + e1y * e2y)];   // a smooth point moves along the curve's true normal
      let bx = -e1y - e2y, by = e1x + e2x, L = Math.hypot(bx, by); const dot = e1x * e2x + e1y * e2y;
      if (L < 1e-3) { bx = e2x - e1x; by = e2y - e1y; L = Math.hypot(bx, by) || 1; }
      const cr = e1x * e2y - e1y * e2x, ml = Math.min(cr < 0 ? 2.5 : 60, Math.sqrt(2 / Math.max(1e-6, 1 + dot)));
      return [bx / L * ml, by / L * ml, cr < 0 ? ml : ml * Math.sqrt(Math.max(0, (1 + dot) / 2)), l2, Math.atan2(cr, dot)];
    };
    // Around a narrow place the bevel opens up again gently: flat at first, then no faster than G (a parabola running
    // into a straight line), so the inner edge of the bevel has no kinks.
    const G = 0.4, R = 2 * Math.max(bevel, 1e-6), D0 = G * R, rise = (d) => (d < D0 ? d * d / (2 * R) : G * d - G * G * R / 2), DMAX = (bevel + G * G * R / 2) / G;
    // Working outline: the glyph's points plus, on long straight edges, extra points wherever the bevel has to narrow
    // part-way along (under the notch of a V, beside a nearby stroke).
    // Points close to an outward corner are special: their own inset runs into the corner's miter line before it is
    // complete, and from there they simply follow the corner (`hip` = that corner, `join` = the depth where they meet).
    const KEYS = ['x', 'y', 'tix', 'tiy', 'tox', 'toy', 'corner'], LONG = Math.min(0.06, Math.max(0.02, bevel));
    const base = []; { let k = 0; for (const c of src) { base.push(k); k += c.x.length; } }
    const cons = src.map((c, ci) => {
      const n = c.x.length, o = { x: [], y: [], tix: [], tiy: [], tox: [], toy: [], corner: [], b: [], hip: [], join: [] };
      if (!(bevel > 0)) { for (const k of KEYS) o[k] = c[k].slice(); o.b = new Array(n).fill(0); o.hip = new Array(n).fill(-1); o.join = new Array(n).fill(Infinity); return o; }
      const M = c.x.map((_, i) => miter(c, i)), isHip = M.map((m, i) => !!c.corner[i] && m[4] > 20 * rad);
      // depth at which the inset of point (x, y), moving along (nx, ny), reaches the miter line of corner h
      const meet = (x, y, nx, ny, h) => {
        const mx = M[h][0], my = M[h][1], dx = c.x[h] - x, dy = c.y[h] - y, det = -nx * my + ny * mx; if (Math.abs(det) < 1e-9) return Infinity;
        const r = (-dx * my + dy * mx) / det, l = (nx * dy - ny * dx) / det;
        return r > 0 && l > 0 && Math.abs(r - l) < 0.25 * Math.max(r, l) ? Math.min(r, l) : Infinity;   // both must agree: only true close to the corner
      };
      const nearHip = (i, x, y, nx, ny, skipSelf) => {                    // the outward corner (before or after point i) that this point runs into first
        let best = -1, join = Infinity;
        for (const dir of [1, -1]) {
          let d = 0;
          for (let k = skipSelf ? 1 : 0, j = dir > 0 ? (skipSelf ? i + 1 : i + 1) % n : i; k < n; k++) {
            j = ((dir > 0 ? i + (skipSelf ? k : k + 1) : i - k) % n + n) % n;
            if (c.corner[j] || isHip[j]) { if (isHip[j]) { const r = meet(x, y, nx, ny, j); if (r < join) { join = r; best = j; } } break; }
            d += M[j][3]; if (d > 14 * bevel) break;
          }
        }
        return [best, join];
      };
      const B = new Float64Array(n), H = new Int32Array(n).fill(-1), J = new Float64Array(n).fill(Infinity);
      for (let i = 0; i < n; i++) {
        if (!c.corner[i]) { const h = nearHip(i, c.x[i], c.y[i], M[i][0], M[i][1], true); if (h[1] < bevel) { H[i] = h[0]; J[i] = h[1]; } }
        const near = [];
        if (!c.corner[i]) {
          for (let k = 1; k <= 5; k++) { const j = (i + k) % n; if (c.corner[j]) break; near.push(base[ci] + j); if (c.corner[(j + 1) % n]) break; }
          for (let k = 2; k <= 6; k++) { const j = (i - k + 2 * n) % n; if (c.corner[(j + 1) % n]) break; near.push(base[ci] + j); if (c.corner[j]) break; }
        }
        for (const k of near) nearSeg[k] = 1;
        const rho = contact(c.x[i], c.y[i], M[i][0], M[i][1], M[i][2], base[ci] + i, base[ci] + (i + n - 1) % n);
        for (const k of near) nearSeg[k] = 0;
        B[i] = rho >= 0.97 * J[i] ? bevel : limit(rho);                  // meeting the corner's miter line first is fine: it will follow the corner
      }
      const map = new Int32Array(n);
      for (let i = 0; i < n; i++) {
        map[i] = o.x.length; for (const k of KEYS) o[k].push(c[k][i]); o.b.push(B[i]); o.hip.push(H[i]); o.join.push(J[i]);
        const j = (i + 1) % n, ex = c.x[j] - c.x[i], ey = c.y[j] - c.y[i], L = Math.hypot(ex, ey);
        const cand = [], keep = [], nx = -ey / L, ny = ex / L;
        const probe = (f) => {
          const x = c.x[i] + ex * f, y = c.y[i] + ey * f, ri = isHip[i] ? meet(x, y, nx, ny, i) : Infinity, rj = isHip[j] ? meet(x, y, nx, ny, j) : Infinity, r = Math.min(ri, rj), rho = contact(x, y, nx, ny, 1, base[ci] + i, -1);
          return [f, r < bevel && rho >= 0.97 * r ? bevel : limit(rho), r < bevel ? (ri < rj ? i : j) : -1, r < bevel ? r : Infinity];
        };
        // look inside the edge wherever it is long, or wherever the bevel differs a lot between two samples (halving
        // towards the place where a thin stroke opens into a thick one)
        const scan = (f0, b0, f1, b1) => {
          const len = (f1 - f0) * L; if (!(len > LONG * 1.5 || (Math.abs(b0 - b1) > 0.15 * bevel && len > 0.005))) return;
          const m = probe((f0 + f1) / 2); scan(f0, b0, m[0], m[1]); cand.push(m); scan(m[0], m[1], f1, b1);
        };
        scan(0, B[i], 1, B[j]);
        if (!cand.length) continue;
        // Keep the candidates that matter: work out roughly what the bevel will be along this edge once it has been
        // smoothed (see relax below) and keep the points a straight ramp between its neighbours would miss.
        const pts = [[0, B[i]], ...cand, [1, B[j]]], env = pts.map((p) => { let e = p[1]; for (const q of pts) e = Math.min(e, q[1] + rise(Math.abs(p[0] - q[0]) * L)); return e; });
        const pick = (lo, hi) => {
          let worst = -1, wv = 0.03 * bevel;
          for (let q = lo + 1; q < hi; q++) { const v = Math.abs(env[lo] + (env[hi] - env[lo]) * (pts[q][0] - pts[lo][0]) / (pts[hi][0] - pts[lo][0]) - env[q]); if (v > wv) { wv = v; worst = q; } }
          if (worst < 0) return;
          pick(lo, worst); keep.push(worst - 1); pick(worst, hi);
        };
        pick(0, pts.length - 1);
        for (let guard = 0; guard < cand.length; guard++) {              // and never let a ramp between kept points climb over a dropped point's limit
          const kk = [0, ...keep.map((q) => q + 1).sort((a, b) => a - b), pts.length - 1], e2 = kk.map((a) => { let e = pts[a][1]; for (const q of kk) e = Math.min(e, pts[q][1] + rise(Math.abs(pts[a][0] - pts[q][0]) * L)); return e; });
          let worst = -1, wv = 0.02 * bevel;
          for (let t = 0; t + 1 < kk.length; t++) for (let q = kk[t] + 1; q < kk[t + 1]; q++) { const v = e2[t] + (e2[t + 1] - e2[t]) * (pts[q][0] - pts[kk[t]][0]) / (pts[kk[t + 1]][0] - pts[kk[t]][0]) - pts[q][1]; if (v > wv) { wv = v; worst = q; } }
          if (worst < 0) break;
          keep.push(worst - 1);
        }
        keep.sort((a, b) => a - b);
        for (const q of keep) { const f = cand[q][0]; o.x.push(c.x[i] + ex * f); o.y.push(c.y[i] + ey * f); o.tix.push(ex / L); o.tiy.push(ey / L); o.tox.push(ex / L); o.toy.push(ey / L); o.corner.push(0); o.b.push(cand[q][1]); o.hip.push(cand[q][2]); o.join.push(cand[q][3]); }
      }
      for (let i = 0; i < o.hip.length; i++) if (o.hip[i] >= 0) o.hip[i] = map[o.hip[i]];
      return o;
    });
    const info = cons.map((c) => {
      const n = c.x.length, mx = new Float64Array(n), my = new Float64Array(n), lim = Float64Array.from(c.b), b = Float64Array.from(c.b), len = new Float64Array(n), fx = Float64Array.from(c.x), fy = Float64Array.from(c.y), on = new Uint8Array(n);
      for (let i = 0; i < n; i++) { const m = miter(c, i); mx[i] = m[0]; my[i] = m[1]; len[i] = m[3]; }
      const settle = () => {                                             // who follows a corner, given the corner's bevel
        for (let i = 0; i < n; i++) { const h = c.hip[i]; if (h >= 0 && c.join[i] < b[h] && c.b[i] < b[h]) b[h] = Math.max(c.b[i], c.join[i]); }
        for (let i = 0; i < n; i++) { const h = c.hip[i]; on[i] = h >= 0 && c.join[i] < b[h] ? 1 : 0; }
        for (let h = 0; h < n; h++) if (c.corner[h]) for (const dir of [1, -1]) {      // followers form one unbroken run next to their corner
          let live = true;
          for (let k = 1; k < n; k++) { const i = ((h + dir * k) % n + n) % n; if (c.corner[i]) break; if (c.hip[i] !== h || !on[i]) live = false; if (!live && c.hip[i] === h) on[i] = 0; }
        }
        // the others stop short of the miter line: level with the corner's bevel where that fits, 80% of the way otherwise
        for (let i = 0; i < n; i++) { const h = c.hip[i]; if (h >= 0) b[i] = on[i] ? b[h] : Math.min(b[i], Math.max(0.8 * c.join[i], Math.min(0.97 * c.join[i], b[h]))); }
      };
      const same = (i, q) => (on[i] && (c.hip[i] === q || (on[q] && c.hip[q] === c.hip[i]))) || (on[q] && c.hip[q] === i);
      const place = () => { for (let i = 0; i < n; i++) { const h = on[i] ? c.hip[i] : i; fx[i] = c.x[h] + mx[h] * b[h]; fy[i] = c.y[h] + my[h] * b[h]; } };
      const snap = new Float64Array(n);
      const relax = () => {
        if (!(bevel > 0)) return;
        b.set(lim); settle(); snap.set(b);
        for (let i = 0; i < n; i++) {
          let v = snap[i];
          for (let k = 1, d = 0; k < n; k++) { const j = (i + k) % n; d += len[(j + n - 1) % n]; if (d > DMAX) break; v = Math.min(v, snap[j] + rise(d)); }
          for (let k = 1, d = 0; k < n; k++) { const j = (i - k + n) % n; d += len[j]; if (d > DMAX) break; v = Math.min(v, snap[j] + rise(d)); }
          b[i] = v;
        }
        settle();
        for (let it = 0; it < 12; it++) {                                // no edge may flip over when inset
          let bad = false; place();
          for (let i = 0; i < n; i++) { const q = (i + 1) % n; if (same(i, q)) continue; const ex = c.x[q] - c.x[i], ey = c.y[q] - c.y[i]; if ((fx[q] - fx[i]) * ex + (fy[q] - fy[i]) * ey <= 0.02 * (ex * ex + ey * ey)) { const gi = on[i] ? c.hip[i] : i, gq = on[q] ? c.hip[q] : q; if (!c.corner[gq] || c.corner[gi]) b[gi] *= 0.6; if (!c.corner[gi] || c.corner[gq]) b[gq] *= 0.6; bad = true; } }
          if (!bad) break;
          for (let i = 0; i < n; i++) if (on[i]) b[i] = b[c.hip[i]];
        }
        place();
      };
      relax();
      const pinch = (i) => { const g = on[i] ? c.hip[i] : i; lim[g] = Math.min(lim[g], b[g]) * 0.5; };   // used below when two insets still collide: narrow the bevel just there
      const scale = (k) => { for (let i = 0; i < n; i++) lim[i] *= k; };
      return { mx, my, b, len, fx, fy, on, relax, pinch, scale };
    });
    // safety net: if two inset outlines still cross (strokes a pixel or two wide), narrow the bevel at that spot and
    // try again; as a last resort shrink the whole letter's bevel
    let NV = 0; for (const c of cons) NV += c.x.length;
    const crossing = () => {
      const Q = new Float64Array(4 * NV), id = new Int32Array(3 * NV);
      for (let ci = 0, s = 0; ci < cons.length; ci++) { const f = info[ci], n = f.fx.length; for (let i = 0; i < n; i++, s++) { const j = (i + 1) % n; Q[4 * s] = f.fx[i]; Q[4 * s + 1] = f.fy[i]; Q[4 * s + 2] = f.fx[j]; Q[4 * s + 3] = f.fy[j]; id[3 * s] = ci; id[3 * s + 1] = n; id[3 * s + 2] = i; } }
      const side = (ax, ay, bx, by, px, py) => (bx - ax) * (py - ay) - (by - ay) * (px - ax);
      for (let s = 0; s < NV; s++) {
        for (let r = s + 1; r < NV; r++) {
          if (id[3 * r] === id[3 * s]) { const d = r - s, n = id[3 * s + 1]; if (d === 1 || d === n - 1) continue; }
          const a = 4 * s, c = 4 * r;
          if (Math.max(Q[a], Q[a + 2]) < Math.min(Q[c], Q[c + 2]) || Math.max(Q[c], Q[c + 2]) < Math.min(Q[a], Q[a + 2]) || Math.max(Q[a + 1], Q[a + 3]) < Math.min(Q[c + 1], Q[c + 3]) || Math.max(Q[c + 1], Q[c + 3]) < Math.min(Q[a + 1], Q[a + 3])) continue;
          if (side(Q[a], Q[a + 1], Q[a + 2], Q[a + 3], Q[c], Q[c + 1]) * side(Q[a], Q[a + 1], Q[a + 2], Q[a + 3], Q[c + 2], Q[c + 3]) < 0 && side(Q[c], Q[c + 1], Q[c + 2], Q[c + 3], Q[a], Q[a + 1]) * side(Q[c], Q[c + 1], Q[c + 2], Q[c + 3], Q[a + 2], Q[a + 3]) < 0) return [[id[3 * s], id[3 * s + 2], id[3 * s + 1]], [id[3 * r], id[3 * r + 2], id[3 * r + 1]]];
        }
      }
      return null;
    };
    let shrunk = 0, pinched = 0, hit = null;
    if (bevel > 0) while ((hit = crossing())) {
      if (pinched < 24) { pinched++; for (const [ci, i, n] of hit) { info[ci].pinch(i); info[ci].pinch((i + 1) % n); } for (const ci of new Set(hit.map((h) => h[0]))) info[ci].relax(); continue; }
      if (shrunk >= 9) break;
      shrunk++;
      info.forEach((f) => { f.scale(shrunk < 9 ? 0.7 : 0); f.relax(); });
    }

    const P = [], N = [], UV = [], UM = [], I = [];
    const vert = (x, y, z, nx, ny, nz, u, v, m) => { P.push(x, y, z); N.push(nx, ny, nz); UV.push(u, v); UM.push(m); return UM.length - 1; };
    const quad = (a, b, c, d) => { I.push(a, b, c, a, c, d); };
    const n = bevel > 0 ? segs : 0, capF = [], capB = [];
    cons.forEach((c, ci) => {
      const { mx, my, b, len, on } = info[ci], nv = c.x.length;
      // a column = all vertices above one outline point that share a wall normal: wall bottom and top, then the bevel rings
      const column = (i, tx, ty, u) => {
        const nx = ty, ny = -tx, x = c.x[i], y = c.y[i], bi = b[i], bz = Math.min(bi, hd);
        const col = { wb: vert(x, y, -hd + bz, nx, ny, 0, u, -hd + bz, 0), wt: vert(x, y, hd - bz, nx, ny, 0, u, hd - bz, 0), f: [], k: [] };
        if (!n) return col;
        const ins = [], zz = [], rem = new Array(n + 1).fill(0);
        for (let k = 0; k <= n; k++) { const a = k / n * Math.PI / 2; ins.push(bi * (1 - Math.cos(a))); zz.push(bz * Math.sin(a)); }
        for (let k = n - 1; k >= 0; k--) rem[k] = rem[k + 1] + Math.hypot(ins[k + 1] - ins[k], zz[k + 1] - zz[k]);
        const h = on[i] ? c.hip[i] : i, ex = c.x[h] + mx[h] * bi, ey = c.y[h] + my[h] * bi;
        for (let k = 0; k <= n; k++) {
          const g = h !== i && ins[k] >= c.join[i] ? h : i;                // past the join depth this point rides on its corner's miter line
          const a = k / n * Math.PI / 2, ca = k === n ? 0 : Math.cos(a), sa = Math.sin(a), px = c.x[g] + mx[g] * ins[k], py = c.y[g] + my[g] * ins[k], u2 = ex + nx * rem[k], v2 = ey + ny * rem[k];   // uv: the bevel unrolled outwards from the face
          col.f.push(vert(px, py, hd - bz + zz[k], nx * ca, ny * ca, sa, u2, v2, 1));
          col.k.push(vert(px, py, -hd + bz - zz[k], nx * ca, ny * ca, -sa, u2, v2, 1));
        }
        return col;
      };
      const outCol = new Array(nv), inCol = new Array(nv); let u = 0;
      for (let i = 0; i < nv; i++) {
        const split = c.corner[i] || c.tix[i] * c.tox[i] + c.tiy[i] * c.toy[i] < 0.9998;
        if (i === 0) outCol[0] = column(0, c.tox[0], c.toy[0], 0);
        else if (split) { inCol[i] = column(i, c.tix[i], c.tiy[i], u); outCol[i] = column(i, c.tox[i], c.toy[i], u); }
        else inCol[i] = outCol[i] = column(i, c.tox[i], c.toy[i], u);
        u += len[i];
      }
      inCol[0] = column(0, c.tix[0], c.tiy[0], u);                       // the seam: the first point again, at the end of the wall's u
      for (let i = 0; i < nv; i++) {
        const A = outCol[i], B = inCol[(i + 1) % nv];
        quad(A.wb, B.wb, B.wt, A.wt);
        for (let k = 0; k < n; k++) { quad(A.f[k], B.f[k], B.f[k + 1], A.f[k + 1]); quad(A.k[k + 1], B.k[k + 1], B.k[k], A.k[k]); }
      }
      const f = [], k = [];
      for (let i = 0; i < nv; i++) { if (n) { f.push(outCol[i].f[n]); k.push(outCol[i].k[n]); } else { f.push(vert(c.x[i], c.y[i], hd, 0, 0, 1, c.x[i], c.y[i], 1)); k.push(vert(c.x[i], c.y[i], -hd, 0, 0, -1, c.x[i], c.y[i], 1)); } }
      capF.push(f); capB.push(k);
    });
    // faces: triangulate each shape (with its holes) on the inset outline
    let capErr = 0;
    for (const sh of g.shapes) {
      const list = [sh.outer, ...sh.holes], F = [], Bk = [], rings = []; let want = 0, got = 0;
      for (const c of list) {                                           // points that share a position (corner followers) go in once
        const ci = src.indexOf(c), f = info[ci], m = f.fx.length, r = [], ids = [];
        for (let i = 0; i < m; i++) { const l = r[r.length - 1]; if (l && Math.abs(l.x - f.fx[i]) < 1e-9 && Math.abs(l.y - f.fy[i]) < 1e-9) continue; r.push(new THREE.Vector2(f.fx[i], f.fy[i])); ids.push(i); }
        while (r.length > 1 && Math.abs(r[0].x - r[r.length - 1].x) < 1e-9 && Math.abs(r[0].y - r[r.length - 1].y) < 1e-9) { r.pop(); ids.pop(); }
        for (let i = 0, q = r.length; i < q; i++) { const j = (i + 1) % q; want += (r[i].x * r[j].y - r[j].x * r[i].y) / 2; }
        if (r.length < 3 && c !== sh.outer) continue;
        rings.push(r); for (const i of ids) { F.push(capF[ci][i]); Bk.push(capB[ci][i]); }
      }
      if (rings[0].length < 3) continue;
      const all = [].concat(...rings), faces = THREE.ShapeUtils.triangulateShape(rings[0].slice(), rings.slice(1).map((r) => r.slice()));
      for (const [a, b, c] of faces) {
        const ar = (all[b].x - all[a].x) * (all[c].y - all[a].y) - (all[b].y - all[a].y) * (all[c].x - all[a].x);
        if (ar === 0) continue; got += Math.abs(ar) / 2;
        if (ar > 0) { I.push(F[a], F[b], F[c], Bk[a], Bk[c], Bk[b]); } else { I.push(F[a], F[c], F[b], Bk[a], Bk[b], Bk[c]); }
      }
      capErr = Math.max(capErr, Math.abs(got - want) / Math.max(1e-9, Math.abs(want)));
    }
    out = { pos: new Float32Array(P), nrm: new Float32Array(N), uv: new Float32Array(UV), um: new Uint8Array(UM), idx: new Uint32Array(I), nv: UM.length, capErr, shrunk, pinched };
    if (K.text3d.keepInset) out.inset = cons.map((c, ci) => ({ x: c.x, y: c.y, corner: c.corner, hip: c.hip, fx: info[ci].fx, fy: info[ci].fy, b: info[ci].b, on: info[ci].on }));
    solids.set(key, out);
    return out;
  }

  // ---------------------------------------------------------------- 5. geometry (merged by hand)
  function assemble(parts, size, bounds) {
    let nv = 0, ni = 0; for (const p of parts) { nv += p.solid.nv; ni += p.solid.idx.length; }
    const pos = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), uv1 = new Float32Array(nv * 2), idx = new Uint32Array(ni);
    const bw = Math.max(1e-9, bounds.maxX - bounds.minX), bh = Math.max(1e-9, bounds.maxY - bounds.minY);
    let v0 = 0, i0 = 0;
    for (const p of parts) {
      const s = p.solid;
      for (let k = 0; k < s.nv; k++) {
        const x = s.pos[3 * k] * size, y = s.pos[3 * k + 1] * size, v = v0 + k;
        pos[3 * v] = x + p.dx; pos[3 * v + 1] = y + p.dy; pos[3 * v + 2] = s.pos[3 * k + 2] * size;
        uv[2 * v] = s.uv[2 * k] + s.um[k] * p.ox / size; uv[2 * v + 1] = s.uv[2 * k + 1] + s.um[k] * p.oy / size;
        uv1[2 * v] = (x + p.ox - bounds.minX) / bw; uv1[2 * v + 1] = (y + p.oy - bounds.minY) / bh;
      }
      nrm.set(s.nrm, v0 * 3);
      for (let k = 0; k < s.idx.length; k++) idx[i0 + k] = s.idx[k] + v0;
      p.start = i0; p.count = s.idx.length; v0 += s.nv; i0 += s.idx.length;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setAttribute('uv1', new THREE.BufferAttribute(uv1, 2));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.computeBoundingBox(); geo.computeBoundingSphere();
    return geo;
  }
  const solidOf = (g, o, size) => {
    const depth = Math.max(1e-4, (o.depth == null ? 0.2 * size : o.depth) / size), bevel = Math.max(0, (o.bevel == null ? 0.02 * size : o.bevel) / size);
    return buildSolid(g, depth, bevel, bevel > 0 ? Math.round(clampN(o.bevelSegments == null ? 3 : o.bevelSegments, 1, 16)) : 0);
  };

  // K.text3d(text, { ...textShapes options, depth, bevel, bevelSegments }) -> BufferGeometry of the whole text, centred
  // in z. uv: 1 unit = 1 em (faces and bevels planar, walls = distance along the outline x depth); uv1: 0..1 across the
  // text's bounding box. geometry.userData = { width, height, bounds, letters: [{ char, index, line, x, y, w, start, count }] }.
  K.text3d = (text, opts = {}) => {
    const L = layout(text, opts), parts = [], meta = [];
    for (const l of L.letters) if (l.glyph && l.glyph.shapes.length) { const p = { solid: solidOf(l.glyph, opts, L.size), ox: l.x, oy: l.y, dx: l.x, dy: l.y }; parts.push(p); meta.push([l, p]); }
    const geo = assemble(parts, L.size, L.bounds);
    geo.userData = { width: L.width, height: L.height, bounds: L.bounds, letters: meta.map(([l, p]) => ({ char: l.char, index: l.index, line: l.line, x: l.x, y: l.y, w: l.w, start: p.start, count: p.count })) };
    return geo;
  };
  // K.text3dLetters(text, opts) -> [{ char, index, line, geometry, x, y, w }]: one geometry per visible letter with its
  // origin at the centre of the letter's own bounding box; (x, y) is where that centre sits in the block.
  K.text3dLetters = (text, opts = {}) => {
    const L = layout(text, opts), out = [];
    for (const l of L.letters) if (l.glyph && l.glyph.shapes.length) {
      const bb = l.glyph.bbox, cx = (bb[0] + bb[2]) / 2 * L.size, cy = (bb[1] + bb[3]) / 2 * L.size;
      out.push({ char: l.char, index: l.index, line: l.line, geometry: assemble([{ solid: solidOf(l.glyph, opts, L.size), ox: l.x, oy: l.y, dx: -cx, dy: -cy }], L.size, L.bounds), x: l.x + cx, y: l.y + cy, w: l.w });
    }
    return out;
  };
  // for tests: K.text3d.debug(font, char, detail, curveSegments) -> { glyph, dense } without touching the caches
  K.text3d.debug = (font, ch, detail = 320, cs = 48) => { DBG = []; let g; try { g = getGlyph(font, fontPx(font), ch, detail, cs); } finally { var d = DBG; DBG = null; } return { glyph: g, dense: d }; };
  K.text3d.solid = (font, ch, o = {}) => { const g = getGlyph(font, fontPx(font), ch, o.detail || 320, o.curveSegments || 48); return { glyph: g, solid: solidOf(g, o, 1) }; };
  K.text3d.clearCache = () => { glyphs.clear(); solids.clear(); };
})(typeof window !== 'undefined' ? window : globalThis);
