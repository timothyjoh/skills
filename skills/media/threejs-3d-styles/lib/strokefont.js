/*
 * strokefont.js - a single-stroke (centre-line) rounded sans for tube lettering.
 *
 * Classic script, no dependencies. Sets a global `STROKEFONT` (browser and Node).
 *
 *   STROKEFONT.layout(text, opts) -> { strokes, width, height, glyphs }
 *     opts.size     cap height in output units (1)
 *     opts.spacing  extra gap between letters, fraction of size (0.18)
 *     opts.lineGap  gap between lines, fraction of size (0.45)
 *     opts.align    'left' | 'center' | 'right' ('center'); x = 0 is the left
 *                   edge, the centre or the right edge of the block. The block
 *                   is always centred on y = 0. y is up.
 *     opts.round    corner fillet radius, fraction of size (0.09)
 *     opts.step     max distance between output points, fraction of size (0.03)
 *     strokes[i] = { points: [[x, y], ...], closed, glyph, char }
 *                   points are centre-line samples, evenly spaced by arc length
 *                   between corner tips, corners already filleted. A closed
 *                   stroke does not repeat its first point. `glyph` is the
 *                   index of the character in `text`.
 *     glyphs[i]  = { char, x, y, w, strokeIndexes }  one per character of
 *                   `text` (line breaks included, so glyphs[stroke.glyph]
 *                   works); x, y = left end of the baseline, w = ink width.
 *     width, height = size of the block of centre lines (add the tube width).
 *   STROKEFONT.length(stroke) -> arc length of a stroke (or of a points array)
 *   STROKEFONT.glyphs -> { 'A': { d, w, strokes }, ... }  d = path in the DSL
 *                   below, w = ink width, strokes = number of strokes
 *
 * Characters: A-Z (lowercase maps to uppercase), 0-9, . , ! ? - + : ' / & % # @ =
 * and space. Anything else leaves a space.
 *
 * Glyphs live on a grid where the cap height is 1 and the baseline is y = 0
 * (y up). Every glyph is a few centre-line strokes written in a small DSL:
 *
 *   M x y                 start a new stroke at a point
 *   L x y                 line to a point (the corner there gets filleted)
 *   A cx cy rx ry a0 a1   elliptical arc, degrees, a1 > a0 = counter-clockwise
 *   CW  cx cy rx ry       wrap around an ellipse clockwise / counter-clockwise,
 *   CCW cx cy rx ry       like a belt round a pulley: it is entered and left
 *                         along tangents worked out from its neighbours
 *   FROM a / TO a         start / end a wrapped ellipse at a fixed angle
 *   X x y                 join two wrapped ellipses at their crossing nearest
 *                         (x, y) instead of along a tangent (the waist of a 3)
 *   R k                   scale the fillet of the corner just drawn (0 = sharp)
 *   Z                     close the stroke
 *   ;                     end the stroke (the next arc starts a new one)
 */
(function (root) {
  'use strict';

  var DEG = Math.PI / 180, TAU = Math.PI * 2;

  // Letter fitting, in cap heights. `target` is the gap between two straight
  // stems before the caller's `spacing` is added.
  var FIT = { target: 0.27, depth: 0.36, min: 0.19, bands: 21, band: 0.06, space: 0.46, round: 0.09 };

  var DEFS = {
    'A': 'M 0 0 L .41 1.03 L .82 0  M .119 .3 L .701 .3',
    'B': 'M 0 .53 CW .37 .265 .25 .265 L 0 0 L 0 1 CW .335 .765 .225 .235 TO -90',
    'C': 'A .44 .5 .44 .512 46 314',
    'D': 'M 0 .5 L 0 1 CW .30 .5 .46 .5 L 0 0 Z',
    'E': 'M .56 1 L 0 1 L 0 0 L .56 0  M 0 .52 L .47 .52',
    'F': 'M .54 1 L 0 1 L 0 0  M 0 .5 L .44 .5',
    'G': 'A .44 .5 .44 .512 46 356 R .4 L .46 .464',
    'H': 'M 0 0 L 0 1  M .70 0 L .70 1  M 0 .51 L .70 .51',
    'I': 'M 0 0 L 0 1',
    'J': 'M .44 1 CW .215 .258 .225 .27 TO 200',
    'K': 'M 0 0 L 0 1  M .60 1 L 0 .47 L .66 0',
    'L': 'M 0 1 L 0 0 L .52 0',
    'M': 'M 0 0 L 0 1.03 L .46 .18 L .92 1.03 L .92 0',
    'N': 'M 0 0 L 0 1.03 L .74 -.03 L .74 1',
    'O': 'A .44 .5 .44 .512 90 450 Z',
    'P': 'M 0 0 L 0 1 CW .345 .735 .255 .265 L 0 .47',
    'Q': 'A .44 .5 .44 .512 90 450 Z  M .54 .27 L .88 -.07',
    'R': 'M 0 0 L 0 1 CW .345 .745 .255 .255 L 0 .49  M .30 .49 L .62 0',
    'S': 'CCW .30 .786 .262 .226 FROM 38 CW .30 .238 .30 .25 TO 218',
    'T': 'M 0 1 L .72 1  M .36 1 L .36 0',
    'U': 'M 0 1 CCW .35 .338 .35 .35 L .70 1',
    'V': 'M 0 1 L .40 -.03 L .80 1',
    'W': 'M 0 1 L .30 -.03 L .60 1.03 L .90 -.03 L 1.20 1',
    'X': 'M 0 0 L .72 1  M 0 1 L .72 0',
    'Y': 'M 0 1 L .38 .44 L .76 1  M .38 .44 L .38 0',
    'Z': 'M 0 1 L .68 1 L 0 0 L .68 0',
    '0': 'A .31 .5 .31 .512 90 450 Z',
    '1': 'M 0 .77 L .24 1.01 L .24 0',
    '2': 'CW .29 .715 .29 .297 FROM 155 L 0 0 L .60 0',
    '3': 'CW .28 .765 .26 .247 FROM 150 X .2 .52 CW .29 .263 .30 .275 TO 210',
    '4': 'M .50 0 L .50 1.03 L 0 .3 L .70 .3',
    '5': 'M .55 1 L .085 1 L .071 .538 CW .29 .31 .31 .322 TO 210',
    '6': 'A .35 .312 .35 .70 48 180 A .31 .312 .31 .324 180 540',
    '7': 'M 0 1 L .60 1 L .20 0',
    '8': 'A .30 .771 .25 .241 -90 270 A .30 .259 .30 .271 90 -270 Z',
    '9': 'A .27 .688 .35 .70 228 360 A .31 .688 .31 .324 0 360',
    '.': 'A .03 .03 .03 .03 0 360 Z',
    ',': 'M .08 .05 L 0 -.16',
    '!': 'M .03 1 L .03 .36 ; A .03 .03 .03 .03 0 360 Z',
    '?': 'CW .245 .767 .245 .245 FROM 160 CCW .395 .40 .15 .15 L .245 .37 ; A .245 .03 .03 .03 0 360 Z',
    '-': 'M 0 .44 L .34 .44',
    '+': 'M 0 .46 L .50 .46  M .25 .71 L .25 .21',
    ':': 'A .03 .03 .03 .03 0 360 Z  A .03 .60 .03 .03 0 360 Z',
    '\'': 'M 0 1 L 0 .76',
    '/': 'M 0 0 L .38 1',
    '&': 'M .72 0 CW .31 .812 .17 .20 CCW .29 .258 .29 .27 L .70 .50',
    '%': 'A .155 .815 .155 .185 90 450 Z  A .895 .185 .155 .185 90 450 Z  M .31 0 L .74 1',
    '#': 'M .17 0 L .29 1  M .53 0 L .65 1  M .03 .33 L .75 .33  M .07 .67 L .79 .67',
    '@': 'M .6796 .69 L .6796 .5 A .4896 .5 .19 .19 0 -360 L .6796 .33 A .8296 .33 .15 .15 180 332 A .51 .5 .512 .512 -28 300',
    '=': 'M 0 .64 L .50 .64  M 0 .30 L .50 .30'
  };

  var ALIAS = { '’': '\'', '‘': '\'', '–': '-', '—': '-', '−': '-', '×': 'X' };

  // ---------------------------------------------------------------- parser

  function parse(d) {
    var tok = d.trim().split(/[\s,]+/), i = 0, strokes = [], cur = null, last = null;
    function num() { return parseFloat(tok[i++]); }
    function add(node) {
      if (!cur) { cur = { nodes: [], closed: false }; strokes.push(cur); }
      node.k = 1; cur.nodes.push(node); last = node;
    }
    while (i < tok.length) {
      var c = tok[i++];
      if (c === 'M') { cur = null; add({ t: 'P', x: num(), y: num() }); }
      else if (c === 'L') add({ t: 'P', x: num(), y: num() });
      else if (c === 'A') add({ t: 'A', cx: num(), cy: num(), rx: num(), ry: num(), a0: num() * DEG, a1: num() * DEG });
      else if (c === 'CW' || c === 'CCW') add({ t: 'B', cx: num(), cy: num(), rx: num(), ry: num(), dir: c === 'CCW' ? 1 : -1 });
      else if (c === 'FROM') last.from = num() * DEG;
      else if (c === 'TO') last.to = num() * DEG;
      else if (c === 'X') last.cusp = [num(), num()];
      else if (c === 'R') last.k = num();
      else if (c === 'Z') { cur.closed = true; cur = null; }
      else if (c === ';') cur = null;
      else if (c !== '') throw new Error('strokefont: bad token "' + c + '" in "' + d + '"');
    }
    return strokes;
  }

  // -------------------------------------------------------------- geometry

  function ept(e, a) { return [e.cx + e.rx * Math.cos(a), e.cy + e.ry * Math.sin(a)]; }

  // Angle at which a tangent through point p touches ellipse e, for a path that
  // runs round e in direction dir and is arriving from p (entering) or leaving
  // towards p.
  function tangentAngle(e, p, dir, entering) {
    var ux = (p[0] - e.cx) / e.rx, uy = (p[1] - e.cy) / e.ry;
    var D = Math.sqrt(ux * ux + uy * uy), beta = D > 1 ? Math.acos(1 / D) : 0;
    return Math.atan2(uy, ux) + (entering ? dir : -dir) * beta;
  }

  // Common tangent from ellipse e1 (leaving) to ellipse e2 (arriving).
  function mutual(e1, e2) {
    var a2 = Math.atan2(e1.cy - e2.cy, e1.cx - e2.cx), a1 = 0;
    for (var i = 0; i < 80; i++) {
      a1 = tangentAngle(e1, ept(e2, a2), e1.dir, false);
      a2 = tangentAngle(e2, ept(e1, a1), e2.dir, true);
    }
    return [a1, a2];
  }

  // Crossing of two ellipses nearest to a hint point, as an angle on each.
  function crossing(e1, e2, hint) {
    function f(a) {
      var p = ept(e1, a), u = (p[0] - e2.cx) / e2.rx, v = (p[1] - e2.cy) / e2.ry;
      return u * u + v * v - 1;
    }
    var N = 720, best = null, bestD = Infinity;
    for (var i = 0; i < N; i++) {
      var lo = i * TAU / N, hi = (i + 1) * TAU / N, flo = f(lo);
      if (flo * f(hi) > 0) continue;
      for (var j = 0; j < 50; j++) {
        var mid = (lo + hi) / 2;
        if (flo * f(mid) <= 0) hi = mid; else { lo = mid; flo = f(lo); }
      }
      var p = ept(e1, lo), d = Math.pow(p[0] - hint[0], 2) + Math.pow(p[1] - hint[1], 2);
      if (d < bestD) { bestD = d; best = [lo, Math.atan2((p[1] - e2.cy) / e2.ry, (p[0] - e2.cx) / e2.rx)]; }
    }
    if (!best) throw new Error('strokefont: ellipses do not cross');
    return best;
  }

  function nodeEnd(n) { return n.t === 'P' ? [n.x, n.y] : ept(n, n.a1); }
  function nodeStart(n) { return n.t === 'P' ? [n.x, n.y] : ept(n, n.a0); }

  // Turn one parsed stroke into line / arc segments.
  function segments(stroke) {
    var nodes = stroke.nodes, n = nodes.length, closed = stroke.closed, i, nd;
    for (i = 0; i < n; i++) {
      nd = nodes[i];
      if (nd.t !== 'B') continue;
      var prev = i > 0 ? nodes[i - 1] : (closed ? nodes[n - 1] : null);
      var next = i < n - 1 ? nodes[i + 1] : (closed ? nodes[0] : null);
      var a0, a1;
      if (nd.from != null) a0 = nd.from;
      else if (prev.t === 'B') a0 = (prev.cusp ? crossing(prev, nd, prev.cusp) : mutual(prev, nd))[1];
      else a0 = tangentAngle(nd, nodeEnd(prev), nd.dir, true);
      if (nd.to != null) a1 = nd.to;
      else if (next.t === 'B') a1 = (nd.cusp ? crossing(nd, next, nd.cusp) : mutual(nd, next))[0];
      else a1 = tangentAngle(nd, next.t === 'P' ? [next.x, next.y] : ept(next, next.a0), nd.dir, false);
      if (nd.dir > 0) { while (a1 < a0 - 1e-9) a1 += TAU; while (a1 > a0 + TAU + 1e-9) a1 -= TAU; }
      else { while (a1 > a0 + 1e-9) a1 -= TAU; while (a1 < a0 - TAU - 1e-9) a1 += TAU; }
      nd.a0 = a0; nd.a1 = a1;
    }
    var segs = [], pen = null, start = null, prevK = 1;
    function line(p, q, k) {
      if (Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) > 2e-3) segs.push({ p0: p, p1: q, k: k });
      else if (segs.length) segs[segs.length - 1].k = k;
    }
    for (i = 0; i < n; i++) {
      nd = nodes[i];
      if (nd.t === 'P') {
        var p = [nd.x, nd.y];
        if (pen) line(pen, p, nd.k); else start = p;
        pen = p;
      } else {
        var s = nodeStart(nd);
        if (pen) line(pen, s, prevK); else start = s;
        segs.push({ e: nd, a0: nd.a0, a1: nd.a1, k: nd.k });
        pen = nodeEnd(nd);
      }
      prevK = nd.k;
    }
    if (closed) line(pen, start, nodes[0].k);
    return segs;
  }

  function segTangent(s, atEnd) {
    var x, y;
    if (s.e) {
      var a = atEnd ? s.a1 : s.a0, sg = s.a1 >= s.a0 ? 1 : -1;
      x = -s.e.rx * Math.sin(a) * sg; y = s.e.ry * Math.cos(a) * sg;
    } else { x = s.p1[0] - s.p0[0]; y = s.p1[1] - s.p0[1]; }
    var l = Math.sqrt(x * x + y * y) || 1;
    return [x / l, y / l];
  }

  // Segments -> fine polyline plus the list of corners that need a fillet.
  function flatten(segs, closed) {
    var pts = [], corners = [];
    function push(p) {
      var q = pts[pts.length - 1];
      if (!q || Math.abs(q[0] - p[0]) + Math.abs(q[1] - p[1]) > 1e-7) pts.push(p);
    }
    for (var j = 0; j < segs.length; j++) {
      var s = segs[j];
      if (s.e) {
        var sweep = s.a1 - s.a0, m = Math.max(4, Math.ceil(Math.abs(sweep) / (1.5 * DEG)));
        for (var i = 0; i <= m; i++) push(ept(s.e, s.a0 + sweep * i / m));
      } else { push(s.p0); push(s.p1); }
      var nx = j < segs.length - 1 ? segs[j + 1] : (closed ? segs[0] : null);
      if (!nx) continue;
      var din = segTangent(s, true), dout = segTangent(nx, false);
      var dot = Math.max(-1, Math.min(1, din[0] * dout[0] + din[1] * dout[1]));
      if (Math.acos(dot) > 1.5 * DEG) corners.push({ i: j < segs.length - 1 ? pts.length - 1 : 0, k: s.k, phi: Math.acos(dot) });
    }
    if (closed && pts.length > 1) {
      var a = pts[0], b = pts[pts.length - 1];
      if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) < 1e-7) pts.pop();
    }
    corners.sort(function (p, q) { return p.i - q.i; });
    return { pts: pts, corners: corners };
  }

  // Round the corners of a polyline. Right-angle and open corners get radius
  // `round`; sharper ones get a smaller radius chosen so the tip never pulls
  // back further than a right-angle corner does, which keeps A, V, M, N crisp.
  function fillet(pts, corners, round, closed) {
    var i, anchors = [];
    if (closed) {
      if (corners.length && corners[0].i === 0) {          // never start on a corner
        var mid = [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2];
        pts = [mid].concat(pts.slice(1), [pts[0]]);
        corners = corners.map(function (c) { return { i: c.i === 0 ? pts.length - 1 : c.i, k: c.k, phi: c.phi }; });
        corners.sort(function (a, b) { return a.i - b.i; });
      }
      pts = pts.concat([pts[0]]);
    }
    var n = pts.length, S = [0];
    for (i = 1; i < n; i++) S.push(S[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    function at(s, before) {
      var j = 1;
      while (j < n - 1 && (before ? S[j] < s - 1e-12 : S[j] <= s + 1e-12)) j++;
      var l = S[j] - S[j - 1] || 1, u = (s - S[j - 1]) / l;
      var a = pts[j - 1], b = pts[j];
      return { p: [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u], d: [(b[0] - a[0]) / l, (b[1] - a[1]) / l] };
    }
    var out = [];
    function push(p) {
      var q = out[out.length - 1];
      if (!q || Math.abs(q[0] - p[0]) + Math.abs(q[1] - p[1]) > 1e-7) out.push(p);
    }
    function copy(s0, s1) {
      push(at(s0, false).p);
      for (var j = 0; j < n; j++) if (S[j] > s0 + 1e-9 && S[j] < s1 - 1e-9) push(pts[j]);
      push(at(s1, true).p);
    }
    var cursor = 0;
    for (var c = 0; c < corners.length; c++) {
      var cr = corners[c], sc = S[cr.i];
      var before = sc - (c > 0 ? S[corners[c - 1].i] : 0), after = (c < corners.length - 1 ? S[corners[c + 1].i] : S[n - 1]) - sc;
      var limIn = c > 0 ? before / 2 : before * (closed ? 1 : 0.9);
      var limOut = c < corners.length - 1 ? after / 2 : after * (closed ? 1 : 0.9);
      var theta = Math.PI - cr.phi, r = round * cr.k, t = 0;
      if (r > 0) {
        if (theta < Math.PI / 2) r = Math.min(r, r * (Math.SQRT2 - 1) / (1 / Math.sin(theta / 2) - 1));
        t = Math.min(r / Math.tan(theta / 2), limIn, limOut);
      }
      if (t < 1e-4) { copy(cursor, sc); anchors.push(out.length - 1); cursor = sc; continue; }
      var A = at(sc - t, true), B = at(sc + t, false);
      copy(cursor, sc - t);
      var cross = A.d[0] * B.d[1] - A.d[1] * B.d[0], X = pts[cr.i];
      if (Math.abs(cross) > 1e-6) {
        var u = ((B.p[0] - A.p[0]) * B.d[1] - (B.p[1] - A.p[1]) * B.d[0]) / cross;
        if (u > 0) X = [A.p[0] + A.d[0] * u, A.p[1] + A.d[1] * u];
      }
      var psi = Math.acos(Math.max(-1, Math.min(1, A.d[0] * B.d[0] + A.d[1] * B.d[1])));
      var w = Math.cos(psi / 2), m = 2 * Math.ceil(psi / (8 * DEG)) + 1;
      for (i = 1; i <= m; i++) {
        var v = i / (m + 1), b0 = (1 - v) * (1 - v), b1 = 2 * v * (1 - v) * w, b2 = v * v, q = b0 + b1 + b2;
        push([(b0 * A.p[0] + b1 * X[0] + b2 * B.p[0]) / q, (b0 * A.p[1] + b1 * X[1] + b2 * B.p[1]) / q]);
        if (i === (m + 1) / 2) anchors.push(out.length - 1);
      }
      cursor = sc + t;
    }
    copy(cursor, S[n - 1]);
    if (closed) out.pop();
    return { pts: out, anchors: anchors, closed: closed };
  }

  // Evenly spaced points by arc length, never more than `step` apart. Corner
  // tips (anchors) are always kept, so spacing is even between corners.
  function resample(st, step) {
    var P = st.closed ? st.pts.concat([st.pts[0]]) : st.pts, last = P.length - 1;
    var bounds = [0].concat(st.anchors.filter(function (a) { return a > 0 && a < last; }), [last]), res = [];
    for (var b = 0; b < bounds.length - 1; b++) {
      var i0 = bounds[b], i1 = bounds[b + 1], S = [0], i;
      for (i = i0 + 1; i <= i1; i++) S.push(S[S.length - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
      var len = S[S.length - 1];
      if (len < 1e-9) continue;
      var cnt = Math.max(1, Math.ceil(len / step - 1e-9)), j = 1;
      for (i = 0; i < cnt; i++) {
        var s = len * i / cnt;
        while (j < S.length - 1 && S[j] < s) j++;
        var u = (s - S[j - 1]) / (S[j] - S[j - 1] || 1), a = P[i0 + j - 1], c = P[i0 + j];
        res.push([a[0] + (c[0] - a[0]) * u, a[1] + (c[1] - a[1]) * u]);
      }
    }
    if (!st.closed) res.push(P[last].slice());
    return res;
  }

  // ---------------------------------------------------------- glyph caches

  var parsed = {}, built = {}, sampled = {}, profiles = {}, pairs = {};

  function buildGlyph(ch, round) {
    var key = ch + '|' + round;
    if (built[key]) return built[key];
    if (!parsed[ch]) parsed[ch] = parse(DEFS[ch]);
    var strokes = parsed[ch].map(function (st) {
      var f = flatten(segments(st), st.closed);
      return fillet(f.pts, f.corners, round, st.closed);
    });
    // ink box comes from the unrounded outline so metrics do not move with `round`
    var x0 = Infinity, x1 = -Infinity;
    parsed[ch].forEach(function (st) {
      flatten(segments(st), st.closed).pts.forEach(function (p) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; });
    });
    strokes.forEach(function (st) { st.pts.forEach(function (p) { p[0] -= x0; }); });
    return (built[key] = { strokes: strokes, w: x1 - x0 });
  }

  function sampleGlyph(ch, round, step) {
    var key = ch + '|' + round + '|' + step;
    if (sampled[key]) return sampled[key];
    var g = buildGlyph(ch, round);
    return (sampled[key] = { w: g.w, strokes: g.strokes.map(function (st) { return { pts: resample(st, step), closed: st.closed }; }) });
  }

  // How far the ink sits in from the glyph's left and right edges, per height band.
  function profile(ch) {
    if (profiles[ch]) return profiles[ch];
    var g = sampleGlyph(ch, FIT.round, 0.01), n = FIT.bands, L = [], R = [], i;
    for (i = 0; i < n; i++) { L.push(Infinity); R.push(Infinity); }
    g.strokes.forEach(function (st) {
      st.pts.forEach(function (p) {
        var y = Math.max(0, Math.min(1, p[1]));
        for (i = 0; i < n; i++) {
          if (Math.abs(y - i / (n - 1)) > FIT.band) continue;
          if (p[0] < L[i]) L[i] = p[0];
          if (g.w - p[0] < R[i]) R[i] = g.w - p[0];
        }
      });
    });
    return (profiles[ch] = { L: L, R: R });
  }

  // Gap between the ink boxes of glyph a and the glyph b that follows it.
  // Open shapes (A V, L T, T .) are drawn together by averaging how deep the
  // white space runs between the pair; a clearance oval around every point of
  // the centre lines then stops anything getting closer than FIT.min sideways
  // or twice that vertically.
  function pairGap(a, b) {
    var key = a + b;
    if (pairs[key] != null) return pairs[key];
    var A = profile(a).R, B = profile(b).L, sum = 0, i, j;
    for (i = 0; i < FIT.bands; i++) sum += Math.min(A[i] + B[i], FIT.depth);
    var d = FIT.target - sum / FIT.bands;
    var ga = sampleGlyph(a, FIT.round, 0.02), gb = sampleGlyph(b, FIT.round, 0.02), pa = [], pb = [];
    ga.strokes.forEach(function (st) { st.pts.forEach(function (p) { pa.push(p); }); });
    gb.strokes.forEach(function (st) { st.pts.forEach(function (p) { pb.push(p); }); });
    var m = FIT.min, my = FIT.min * 2;
    for (i = 0; i < pa.length; i++) {
      for (j = 0; j < pb.length; j++) {
        var dy = (pa[i][1] - pb[j][1]) / my;
        if (dy > -1 && dy < 1) {
          var need = m * Math.sqrt(1 - dy * dy) - (ga.w - pa[i][0]) - pb[j][0];
          if (need > d) d = need;
        }
      }
    }
    return (pairs[key] = d);
  }

  function glyphKey(c) {
    if (ALIAS[c]) c = ALIAS[c];
    c = c.toUpperCase();
    return DEFS.hasOwnProperty(c) ? c : null;
  }

  // ------------------------------------------------------------------ API

  function layout(text, opts) {
    opts = opts || {};
    text = String(text == null ? '' : text);
    var size = opts.size != null ? opts.size : 1;
    var spacing = opts.spacing != null ? opts.spacing : 0.18;
    var lineGap = opts.lineGap != null ? opts.lineGap : 0.45;
    var align = opts.align || 'center';
    var round = Math.max(0, opts.round != null ? opts.round : 0.09);
    var step = Math.max(1e-3, opts.step != null ? opts.step : 0.03);

    // pass 1: place every character on its line, in cap heights
    var lines = [], line = { items: [], width: 0 }, prev = null, x = 0, i;
    lines.push(line);
    var chars = [];
    for (i = 0; i < text.length; i++) {
      var raw = text[i];
      if (raw === '\n') {
        chars.push({ char: '\n', nl: true, line: lines.length - 1 });
        line = { items: [], width: 0 }; lines.push(line); prev = null; x = 0;
        continue;
      }
      var key = glyphKey(raw), w = key ? buildGlyph(key, round).w : FIT.space;
      if (line.items.length) x += (key && prev ? pairGap(prev, key) : 0) + spacing;
      var item = { char: key || ' ', key: key, x: x, w: w, line: lines.length - 1 };
      chars.push(item); line.items.push(item);
      x += w; line.width = x; prev = key;
    }
    var width = 0;
    lines.forEach(function (l) { if (l.width > width) width = l.width; });
    var height = lines.length + (lines.length - 1) * lineGap;

    // pass 2: emit strokes
    var strokes = [], glyphs = [];
    for (i = 0; i < chars.length; i++) {
      var c = chars[i];
      var ln = lines[c.line];
      var ox = align === 'left' ? 0 : align === 'right' ? -ln.width : -ln.width / 2;
      var oy = height / 2 - 1 - c.line * (1 + lineGap);
      if (c.nl) {
        glyphs.push({ char: '\n', x: (ox + ln.width) * size, y: oy * size, w: 0, strokeIndexes: [] });
        continue;
      }
      var rec = { char: c.char, x: (ox + c.x) * size, y: oy * size, w: c.w * size, strokeIndexes: [] };
      if (c.key) {
        var g = sampleGlyph(c.key, round, step);
        for (var s = 0; s < g.strokes.length; s++) {
          var src = g.strokes[s].pts, pts = new Array(src.length);
          for (var p = 0; p < src.length; p++) pts[p] = [(ox + c.x + src[p][0]) * size, (oy + src[p][1]) * size];
          rec.strokeIndexes.push(strokes.length);
          strokes.push({ points: pts, closed: g.strokes[s].closed, glyph: i, char: c.char });
        }
      }
      glyphs.push(rec);
    }
    return { strokes: strokes, width: width * size, height: height * size, glyphs: glyphs };
  }

  function length(stroke) {
    var pts = stroke && stroke.points ? stroke.points : stroke, len = 0;
    if (!pts || pts.length < 2) return 0;
    for (var i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (stroke.closed) len += Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]);
    return len;
  }

  var glyphs = { ' ': { d: '', w: FIT.space, strokes: 0 } };
  Object.keys(DEFS).forEach(function (ch) {
    var g = buildGlyph(ch, FIT.round);
    glyphs[ch] = { d: DEFS[ch], w: Math.round(g.w * 1e4) / 1e4, strokes: g.strokes.length };
  });

  var STROKEFONT = { glyphs: glyphs, layout: layout, length: length };

  root.STROKEFONT = STROKEFONT;
  if (typeof module !== 'undefined' && module.exports) module.exports = STROKEFONT;
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
