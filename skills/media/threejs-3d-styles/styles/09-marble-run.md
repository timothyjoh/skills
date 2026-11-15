# Marble Run (#09)

- **id:** `marble-run`
- **Category:** Machines that explain
- **Use:** explainer
- **Reference duration:** 8 s
- **Google Fonts:** Oswald
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`

## Style card

- **Look:** A handmade wooden marble run shot like a product film: a walnut board carrying pale maple rails on brass pins, brass paddle gates, swirled glass marbles and three glass jars on a maple plinth with the labels burnt into the wood, in front of a shaded seamless backdrop.
- **Motion:** Marbles are let go one at a time, pick up speed as they drop, clack against brass gates that flip to sort them, fall into their jar and settle into a pile. Nothing is eased by hand: speed comes from the height each marble has lost, and the piles are a small physics run.
- **Light:** Warm daylight from the upper left, kept off the backdrop so the wall sits in soft shade behind the sunlit wood. Rails and marbles throw soft shadows onto the board, and every marble drops a small glint of its own colour into its shadow.
- **Materials:** Satin maple and walnut with drawn grain, polished brass that picks up the window, coloured glass with a white vein that glows on the side away from the light, thick clear jar glass with bright edges.
- **Camera:** Long lens, shallow focus, one continuous shot that stays close. It rides beside one marble from the hopper, gets to the first gate just ahead of it and waits for the clack, follows it across the second gate, then travels down as it drops into its jar, opens just far enough to hold all three jars and pushes slowly in on the jars, their counters and their names.
- **Finish:** Real motion blur and depth of field, colours kept true (neutral tone curve), a small bloom on brass and glass glints, light vignette, fine grain.
- **Good for:** Sorting, routing and filtering: anything where many items take different paths through the same rules. The hopper is what comes in, each gate is one rule, each jar is one outcome with a counter under it, and how full the jars end up is the result.

## Reference

- **Sample topic:** How your inbox sorts email
- **Gallery description:** A handmade wooden marble run shot like a product film: a walnut board carrying pale maple rails on brass pins, brass paddle gates, swirled glass marbles and three glass jars on a maple plinth with the labels burnt into the wood, in front of a shaded seamless backdrop.
- **Shown in the sample clip:** How your inbox sorts email

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/marble-run.js`)

```js
{
  // ---------------------------------------------------------------- content (change this for a new topic)
  const SOURCE = 'NEW MAIL';                       // engraved on the hopper
  const BINS = [                                   // the three jars, left to right
    { label: 'INBOX', glass: '#3f78ff' },
    { label: 'PROMOTIONS', glass: '#22c36e' },
    { label: 'SPAM', glass: '#ff453a' },
  ];
  const GATE_TAGS = ['SPAM?', 'PROMO?'];           // the question each brass gate asks
  // One digit per marble, in the order they leave the hopper: the jar it belongs in. About half of all email is spam,
  // so the SPAM jar ends up the fullest and INBOX the emptiest: the jars are the chart.
  const ORDER = '22101221201212' + '0' + '21012010211222';
  const HERO = 14;                                 // the marble the camera follows
  const T_HERO = 0.25, EVERY = 0.32;                // when the hero is released, and the gap between releases (seconds)

  // ---------------------------------------------------------------- the machine (all in one vertical plane, z = Z0)
  // Marbles ride on two maple rails. Rail 1 runs right from the hopper to gate 1. A gate is a brass paddle on an axle
  // in a gap of the track: lying flat it is a bridge, standing up it is a wall that knocks the marble down through the
  // gap. Gate 1 lets SPAM cross to the far jar and drops the rest onto rail 2, which runs back left; gate 2 drops
  // PROMOTIONS into the middle jar and lets INBOX roll on to the end.
  const R = 0.23, ROD = 0.06, GAUGE = 0.28, Z0 = 0.7;             // marble radius, rail radius, rail spacing, track plane
  const RIDE = Math.sqrt((R + ROD) ** 2 - (GAUGE / 2) ** 2);      // marble centre above the rail centre-line
  const ROLL = RIDE * R / (R + ROD);                              // rolling radius on two rails (smaller than R: it spins faster)
  const KROLL = 1 / (1 + 0.4 * R * R / (ROLL * ROLL));            // share of gravity that becomes speed; the rest goes into spin
  const G = 35;                                                   // gravity in world units: about 2.3x slow motion for a 19 mm marble
  const JARX = [-3.75, 0, 3.75];
  const JAR = { rin: 0.6, rneck: 0.47, floor: 0.1, sh0: 1.4, sh1: 1.72, rim: 1.95 };   // inside of a jar: radius, neck radius, floor, shoulder, rim
  const PIN = [-3.95, 5.475], FEED = [0.743, -0.669];               // where the front marble waits, and the direction of the feed chute
  const M1 = -0.1, GAP1 = [2.15, 3.15], Y1 = 4.565;                // rail 1: slope, the gap of gate 1, height at the gap
  const M2 = 0.1, GAP2 = [0, -1], Y2 = 3.177, START2 = 2.95;       // rail 2 runs right to left
  const y1 = (x) => Y1 + M1 * (x - GAP1[0]), y2 = (x) => Y2 + M2 * (x - GAP2[0]);
  const END1 = JARX[2] + 0.02, END2 = JARX[0] - 0.02;             // where the end plates turn a marble down into its jar
  const PL = 0.95, PT = 0.06, OPEN = 1.08;                         // paddle length, thickness and how far it swings (radians)
  const up = (m) => { const k = Math.hypot(1, m); return [-m / k, 1 / k]; };
  const gate = (gap, yf, m, dir) => {                             // dir = +1 when marbles arrive moving right
    const xm = (gap[0] + gap[1]) / 2, n = up(m), a0 = Math.atan(m), a1 = a0 - dir * OPEN;
    const pivot = [xm - n[0] * (R + PT / 2), yf(xm) - n[1] * (R + PT / 2)];
    return { pivot, a0, a1, dir, n: [Math.sin(a1), -Math.cos(a1)] };   // n faces the arriving marble
  };
  const GATE1 = gate(GAP1, y1, M1, 1), GATE2 = gate(GAP2, y2, M2, -1);
  const plate = (x, y, dir) => { const a = -dir * 1.134; return { a, n: [Math.sin(a), -Math.cos(a)], hit: [x, y] }; };   // fixed end plates lean 25 deg toward the marble
  const PLATE1 = plate(END1, y1(END1), 1), PLATE2 = plate(END2, y2(END2), -1);
  const slot = (j) => [PIN[0] - FEED[0] * j * 2 * R, PIN[1] - FEED[1] * j * 2 * R];   // queue places up the feed chute
  const heap = (k) => {                                           // places inside the hopper, bottom to top, in rows of four
    if (k <= 0) return [...slot(3), Z0];
    const r = Math.floor((k - 1) / 4), c = (k - 1) % 4, cc = r % 2 ? 3 - c : c;
    return [-4.76 - cc * 0.3, 6.6 + 0.34 * r, Z0 + (cc % 2 ? 0.24 : -0.24) * (r % 2 ? -1 : 1)];
  };
  const mkPath = (pts) => {
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const at = (s) => { let i = 1; while (i < pts.length - 1 && cum[i] < s) i++; const a = pts[i - 1], b = pts[i], d = cum[i] - cum[i - 1], u = (s - cum[i - 1]) / d; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, (b[0] - a[0]) / d, (b[1] - a[1]) / d]; };
    return { pts, L: cum[cum.length - 1], at };
  };
  // rail 1 starts steep at the pin and bends into the long shallow run
  const BEND = (() => {
    const s = (y1(PIN[0]) - PIN[1]) / (FEED[1] - M1 * FEED[0]), c = [PIN[0] + FEED[0] * s, PIN[1] + FEED[1] * s], k = Math.hypot(1, M1), b = [c[0] + 0.6 / k, c[1] + 0.6 * M1 / k], out = [];
    for (let i = 0; i <= 14; i++) { const u = i / 14, v = 1 - u; out.push([v * v * PIN[0] + 2 * u * v * c[0] + u * u * b[0], v * v * PIN[1] + 2 * u * v * c[1] + u * u * b[1]]); }
    return out;
  })();
  const rail1 = (xEnd) => mkPath([...BEND, [xEnd, y1(xEnd)]]), rail2 = (xEnd) => mkPath([[START2, y2(START2)], [xEnd, y2(xEnd)]]);

  // ---------------------------------------------------------------- the run, pre-computed
  // Every marble's whole trip is worked out once, in small time steps, and stored as samples; update(t) only reads
  // them. On the rails a marble is tied to its path and its speed comes from the height it has dropped. In the air it
  // falls freely and bounces off the brass plates. In the jars it is a small rigid-body pile (floor, glass wall,
  // other marbles). The same pass writes the event list (clacks, landings, glass hits) that the sound is scored from.
  const DUR = 8, H = 1 / 960, SR = 240, S0 = -0.25;
  let memo = null;
  function schedule(K) {
    if (memo) return memo;
    const rng = K.rng(21), n = ORDER.length, bin = [...ORDER].map(Number), T = bin.map((_, i) => T_HERO + (i - HERO) * EVERY);
    const R1a = rail1(GAP1[0]), R1b = rail1(END1), R2a = rail2(GAP2[0]), R2b = rail2(END2);
    const NS = Math.ceil((DUR + 0.3 - S0) * SR) + 2, data = new Float32Array(n * NS * 7), ev = [], g1 = [], g2 = [], ins = BINS.map(() => []);
    const qmul = (a, b) => [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0], a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
    const M = bin.map((b, i) => {
      const a = rng.range(0, 6.28), c = rng.range(-1, 1), s = Math.sqrt(1 - c * c), h = rng.range(0, 3.14);
      return { i, bin: b, mode: 'wait', x: 0, y: 0, z: Z0, vx: 0, vy: 0, vz: 0, w: [0, 0, 0], q0: [Math.cos(a) * s * Math.sin(h), Math.sin(a) * s * Math.sin(h), c * Math.sin(h), Math.cos(h)], q: [0, 0, 0, 1], path: null, s: 0, v: 0, gate: null, struck: false, jar: -1, asleep: false, calm: 0, last: -9, touch: false };
    });
    const hit = (m, k, g, t) => { if (g > 1.1 && t - m.last > 0.045) { ev.push({ t, k, x: m.x, g, i: m.i }); m.last = t; } };
    const bounce = (m, nrm, e) => { const vn = m.vx * nrm[0] + m.vy * nrm[1]; m.vx -= (1 + e) * vn * nrm[0]; m.vy -= (1 + e) * vn * nrm[1]; return -vn; };
    const toJar = (m, j) => { m.mode = 'jar'; m.jar = j; m.vz = rng.range(-0.3, 0.3); m.vx += rng.range(-0.12, 0.12); };
    const aFeed = KROLL * G * -FEED[1], tFeed = Math.sqrt(4 * R / aFeed);      // the queue rolls one place forward in tFeed seconds
    const TS = S0 - Math.ceil((S0 - T[0] + 0.4) * SR) / SR;      // start before the first release, on the sample grid
    let next = 0, ns = 0;
    for (let step = 0; ; step++) {
      const t = TS + step * H;
      if (t > DUR + 0.3) break;
      while (next < n && T[next] <= t) { const m = M[next++]; m.mode = 'rail'; m.path = m.bin === 2 ? R1b : R1a; m.s = 0; m.v = 0; ev.push({ t, k: 'release', x: PIN[0], g: 1, i: m.i }); if (next < n) ev.push({ t: t + 0.07 + tFeed, k: 'queue', x: PIN[0], g: 1 }); }
      for (const m of M) {
        m.touch = false;
        if (m.mode === 'wait') {
          // place in the queue, as a fraction while the line rolls forward (it starts a beat after the release, like a real escapement)
          let f = m.i - next;
          if (next > 0) { const u = (t - T[next - 1] - 0.07) / tFeed; f += 1 - K.clamp(u, 0, 1) ** 2; }
          let p;
          if (f <= 3) p = [...slot(f), Z0];
          else { const k = f - 3, k0 = Math.floor(k), a = heap(k0), b = heap(k0 + 1), u = K.smooth(0, 1, k - k0); p = [K.lerp(a[0], b[0], u), K.lerp(a[1], b[1], u), K.lerp(a[2], b[2], u)]; }
          m.x = p[0]; m.y = p[1]; m.z = p[2];
          const th = (m.i - f) * 2 * R / ROLL; m.q = qmul([0, 0, -Math.sin(th / 2), Math.cos(th / 2)], m.q0);
          continue;
        }
        if (m.mode === 'rail') {
          const [, , tx, ty] = m.path.at(m.s);
          m.v += -KROLL * G * ty * H; m.s += m.v * H;
          const p = m.path.at(Math.min(m.s, m.path.L));
          const xo = m.x; m.x = p[0]; m.y = p[1]; m.vx = m.v * p[2]; m.vy = m.v * p[3]; m.w = [0, 0, -m.v * Math.sign(p[2]) / ROLL];
          if (m.path === R1b && xo < GAP1[0] && m.x >= GAP1[0]) g1.push({ t, open: false, i: m.i });
          if (m.path === R2b && xo > GAP2[0] && m.x <= GAP2[0]) g2.push({ t, open: false, i: m.i });
          if (m.s >= m.path.L) {
            if (m.path === R1a) { m.mode = 'air'; m.gate = GATE1; m.struck = false; g1.push({ t, open: true, i: m.i }); }
            else if (m.path === R2a) { m.mode = 'air'; m.gate = GATE2; m.struck = false; g2.push({ t, open: true, i: m.i }); }
            else { const P = m.path === R1b ? PLATE1 : PLATE2; const g = bounce(m, P.n, 0.3); m.w[2] *= 0.3; ev.push({ t, k: 'plate', x: m.x, g, i: m.i }); toJar(m, m.path === R1b ? 2 : 0); }
          }
        } else if (m.mode === 'air') {
          m.vy -= G * H; m.x += m.vx * H; m.y += m.vy * H;
          const g = m.gate, dx = m.x - g.pivot[0], dy = m.y - g.pivot[1];
          if (!m.struck && dx * g.n[0] + dy * g.n[1] <= R + PT / 2 && m.vx * g.n[0] + m.vy * g.n[1] < 0) {
            const s = bounce(m, g.n, 0.3); m.struck = true; m.w[2] *= 0.3; ev.push({ t, k: 'paddle', x: m.x, g: s, gate: g === GATE1 ? 1 : 2, i: m.i });
            if (g === GATE2) toJar(m, 1);
          } else if (m.struck && m.vy < 0 && m.y <= y2(m.x)) {
            m.mode = 'rail'; m.path = m.bin === 1 ? R2a : R2b; m.s = (START2 - m.x) * Math.hypot(1, M2); m.y = y2(m.x);
            const [, , tx, ty] = m.path.at(m.s); ev.push({ t, k: 'land', x: m.x, g: -m.vy, i: m.i }); m.v = Math.max(0.5, m.vx * tx + m.vy * ty);
          }
        } else if (!m.asleep) {
          m.vy -= G * H; m.x += m.vx * H; m.y += m.vy * H; m.z += m.vz * H;
        }
        const wl = Math.hypot(m.w[0], m.w[1], m.w[2]);
        if (wl > 1e-6) { const a = wl * H / 2, s = Math.sin(a) / wl; m.q = qmul([m.w[0] * s, m.w[1] * s, m.w[2] * s, Math.cos(a)], m.q); }
      }
      // the jars: floor, glass wall and marble against marble
      for (let it = 0; it < 2; it++) {
        for (const m of M) {
          if (m.mode !== 'jar' || m.asleep) continue;
          const jx = JARX[m.jar];
          if (m.y < JAR.rim) {
            if (!m.inside) { m.inside = true; ins[m.jar].push(t); }             // it has dropped through the neck: the counter under the jar ticks
            const lim = K.lerp(JAR.rin, JAR.rneck, K.clamp((m.y - JAR.sh0) / (JAR.sh1 - JAR.sh0))) - R, dx = m.x - jx, dz = m.z - Z0, d = Math.hypot(dx, dz);
            if (d > lim) { const nx = dx / d, nz = dz / d, vn = m.vx * nx + m.vz * nz; m.x = jx + nx * lim; m.z = Z0 + nz * lim; m.touch = true; if (vn > 0) { const e = vn > 0.8 ? 0.35 : 0; m.vx -= (1 + e) * vn * nx; m.vz -= (1 + e) * vn * nz; hit(m, 'glass', vn, t); } }
          }
          if (m.y < JAR.floor + R) { m.y = JAR.floor + R; m.touch = true; if (m.vy < 0) { const vn = -m.vy; m.vy = vn > 0.8 ? 0.36 * vn : 0; hit(m, 'glass', vn, t); } }
        }
        for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) {
          const p = M[a], q = M[b];
          if (p.mode !== 'jar' || q.mode !== 'jar' || p.jar !== q.jar || (p.asleep && q.asleep)) continue;
          const dx = p.x - q.x, dy = p.y - q.y, dz = p.z - q.z, d2 = dx * dx + dy * dy + dz * dz;
          if (d2 >= 4 * R * R || d2 < 1e-9) continue;
          const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, nz = dz / d, vn = (p.vx - q.vx) * nx + (p.vy - q.vy) * ny + (p.vz - q.vz) * nz;
          if (vn < -1.4) { p.asleep = q.asleep = false; p.calm = q.calm = 0; }          // a real knock wakes a resting marble
          const wp = p.asleep ? 0 : 1, wq = q.asleep ? 0 : 1, ws = wp + wq, o = (2 * R - d) / ws;
          p.x += nx * o * wp; p.y += ny * o * wp; p.z += nz * o * wp; q.x -= nx * o * wq; q.y -= ny * o * wq; q.z -= nz * o * wq; p.touch = q.touch = true;
          if (vn < 0) { const e = vn < -0.8 ? 0.3 : 0, j = -(1 + e) * vn / ws; p.vx += j * nx * wp; p.vy += j * ny * wp; p.vz += j * nz * wp; q.vx -= j * nx * wq; q.vy -= j * ny * wq; q.vz -= j * nz * wq; hit(p, 'clink', -vn, t); }
        }
      }
      for (const m of M) {
        if (m.mode !== 'jar' || m.asleep) continue;
        if (m.touch) {                                                               // rolling resistance, spin follows the roll, then rest
          const k = 1 - 2.2 * H; m.vx *= k; m.vy *= k; m.vz *= k;
          const b = Math.min(1, 25 * H); m.w[0] += (m.vz / R - m.w[0]) * b; m.w[1] *= 1 - b; m.w[2] += (-m.vx / R - m.w[2]) * b;
          m.calm = Math.hypot(m.vx, m.vy, m.vz) < 0.22 ? m.calm + H : 0;
          if (m.calm > 0.2) { m.asleep = true; m.vx = m.vy = m.vz = 0; m.w = [0, 0, 0]; }
        } else m.calm = 0;
      }
      if (step % (1 / H / SR) === 0 && t >= S0 - 1e-9 && ns < NS) { for (const m of M) data.set([m.x, m.y, m.z, m.q[0], m.q[1], m.q[2], m.q[3]], (m.i * NS + ns) * 7); ns++; }
    }
    // read one marble at time t: position into p[0..2], rotation into q[0..3]
    const pose = (i, t, p, q) => {
      const f = K.clamp((t - S0) * SR, 0, ns - 1.001), k = Math.floor(f), u = f - k, o = (i * NS + k) * 7;
      for (let c = 0; c < 3; c++) p[c] = data[o + c] + (data[o + 7 + c] - data[o + c]) * u;
      if (q) { const dot = data[o + 3] * data[o + 10] + data[o + 4] * data[o + 11] + data[o + 5] * data[o + 12] + data[o + 6] * data[o + 13], s = dot < 0 ? -1 : 1; for (let c = 0; c < 4; c++) q[c] = data[o + 3 + c] + (s * data[o + 10 + c] - data[o + 3 + c]) * u; }
      return p;
    };
    // a paddle as a function of time: 0 = flat (bridge), 1 = up (wall). It turns just before the marble that needs it,
    // overshoots and settles like sprung brass, and shudders when a marble strikes it.
    const paddle = (arr, kicks) => {
      const sw = []; let s = arr[0].open ? 1 : 0; const init = s;
      for (let i = 1; i < arr.length; i++) { const w = arr[i].open ? 1 : 0; if (w !== s) { sw.push([Math.max(arr[i].t - 0.17, arr[i - 1].t + (s ? 0.08 : 0.15)), w - s]); s = w; } }
      const f = (t) => { let u = init, k = 0; for (const [ts, d] of sw) if (t > ts) u += d * K.spring(t - ts, 8, 0.5); for (const tk of kicks) { const a = t - tk; if (a > 0 && a < 0.5) k += Math.exp(-a * 12) * Math.sin(a * 62); } return u + 0.07 * k; };
      f.switches = sw; return f;
    };
    const kicks = (gt) => ev.filter((e) => e.k === 'paddle' && e.gate === gt).map((e) => e.t);
    memo = { n, bin, T, pose, ev, ins, g2, gate1: paddle(g1, kicks(1)), gate2: paddle(g2, kicks(2)) };
    return memo;
  }

  registerStyle({
    id: 'marble-run',
    name: 'Marble Run',
    family: 'Machines that explain',
    look: 'A handmade wooden marble run shot like a product film: a walnut board carrying pale maple rails on brass pins, brass paddle gates, swirled glass marbles and three glass jars on a maple plinth with the labels burnt into the wood, in front of a shaded seamless backdrop.',
    motion: 'Marbles are let go one at a time, pick up speed as they drop, clack against brass gates that flip to sort them, fall into their jar and settle into a pile. Nothing is eased by hand: speed comes from the height each marble has lost, and the piles are a small physics run.',
    light: 'Warm daylight from the upper left, kept off the backdrop so the wall sits in soft shade behind the sunlit wood. Rails and marbles throw soft shadows onto the board, and every marble drops a small glint of its own colour into its shadow.',
    materials: 'Satin maple and walnut with drawn grain, polished brass that picks up the window, coloured glass with a white vein that glows on the side away from the light, thick clear jar glass with bright edges.',
    camera: 'Long lens, shallow focus, one continuous shot that stays close. It rides beside one marble from the hopper, gets to the first gate just ahead of it and waits for the clack, follows it across the second gate, then travels down as it drops into its jar, opens just far enough to hold all three jars and pushes slowly in on the jars, their counters and their names.',
    post: 'Real motion blur and depth of field, colours kept true (neutral tone curve), a small bloom on brass and glass glints, light vignette, fine grain.',
    explains: 'Sorting, routing and filtering: anything where many items take different paths through the same rules. The hopper is what comes in, each gate is one rule, each jar is one outcome with a counter under it, and how full the jars end up is the result.',
    topic: 'How your inbox sorts email',
    duration: DUR,
    fonts: ['500 150px "Oswald"', '700 100px "Oswald"'],
    render: { samples: 48, shutter: 0.5, tone: 'neutral', exposure: 1.0, bloom: 0.3, bloomThreshold: 1.25, vignette: 0.3, grain: 0.02, fov: 28, background: '#6f8a8e', contrast: 1.04 },

    build(S) {
      const { THREE, K, scene, camera } = S;
      const run = schedule(K);
      const SUN = [-6, 10, 14], AIM = [0, 3.2, 0];

      // ---- light: one warm window, a cool sky, and a bright environment for the brass and glass to reflect
      K.env(S, { top: '#dfe8f2', horizon: '#efe6d8', bottom: '#8d7a66', intensity: 0.6, panels: [
        { pos: [-11, 10, 9], size: [9, 9], color: '#fff2dc', power: 7 },
        { pos: [12, 5, 7], size: [3, 10], color: '#dbe8ff', power: 2.2 },
        { pos: [0, 14, 2], size: [14, 5], color: '#ffffff', power: 2.5 },
      ] });
      K.sun(S, { pos: SUN, target: AIM, color: '#ffe6c0', power: 3.9, size: 20, soft: 0.8, mapSize: 4096, normalBias: 0.01, bias: -0.0003 });
      K.skyLight(S, { color: '#dfe9ff', power: 0.6, size: 9, center: AIM, mapSize: 2048, normalBias: 0.012 });
      // a flag: an unseen panel just behind the machine keeps the sun off the backdrop, so the wall falls into soft
      // shade and the sunlit maple stands out against it (it draws nothing, it only casts a shadow)
      { const flag = new THREE.Mesh(new THREE.PlaneGeometry(160, 60), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, side: THREE.DoubleSide })); flag.position.set(0, 28.5, -1.2); flag.castShadow = true; scene.add(flag); }

      // ---- materials
      const wood = (w, h, seed, base, lines, dk = '125,82,36', lt = '255,244,220', sheen = 1) => K.canvasTex(w, h, (ctx) => {
        const r = K.rng(seed); ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 46; i++) { ctx.fillStyle = r.chance(0.5) ? `rgba(${dk},${r.range(0.03, 0.1)})` : `rgba(${lt},${r.range(0.04, 0.1)})`; ctx.fillRect(0, r.range(-20, h), w, r.range(h * 0.01, h * 0.09)); }   // broad bands of tone
        for (let i = 0; i < lines; i++) {                                                                                    // fine grain lines, a little wavy, tileable along x
          const y0 = r.range(0, h), amp = r.range(0, 7), ph = r.range(0, 6.28), fr = r.int(1, 3);
          ctx.strokeStyle = `rgba(${dk},${r.range(0.02, 0.13) * r()})`; ctx.lineWidth = r.range(0.5, 2.6); ctx.beginPath();
          for (let x = 0; x <= w; x += 24) { const y = y0 + Math.sin(x / w * 6.283 * fr + ph) * amp; if (x) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
          ctx.stroke();
        }
        for (let i = 0; i < lines * 3; i++) { ctx.fillStyle = `rgba(${dk},${r.range(0.05, 0.18)})`; ctx.fillRect(r.range(0, w), r.range(0, h), r.range(4, 26), 1); }   // pores
        for (let i = 0; i < 26; i++) { const x = r.range(0, w), g = ctx.createLinearGradient(x, 0, x + r.range(20, 70), 0); g.addColorStop(0, `rgba(${lt},0)`); g.addColorStop(0.5, `rgba(${lt},${r.range(0.03, 0.08) * sheen})`); g.addColorStop(1, `rgba(${lt},0)`); ctx.fillStyle = g; ctx.fillRect(x, 0, 70, h); }   // the cross-grain shimmer of maple
      });
      const boardTex = wood(2048, 1400, 3, '#80563a', 300, '40,21,9', '200,150,104', 0.35);
      const railTex = wood(1024, 256, 8, '#e8cc9c', 150); railTex.wrapS = railTex.wrapT = THREE.RepeatWrapping;
      const maple = (rx, ry) => { const t = railTex.clone(); t.needsUpdate = true; t.repeat.set(rx, ry); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.52, bumpMap: t, bumpScale: 0.35 }); };
      const boardMat = new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.56 });
      const brass = new THREE.MeshStandardMaterial({ color: '#d6ad58', metalness: 1, roughness: 0.27 });
      const add = (geo, mat, x, y, z, o = {}) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (o.rot) m.rotation.set(...o.rot); m.castShadow = o.cast !== false; m.receiveShadow = o.receive !== false; (o.parent || scene).add(m); return m; };

      // ---- the seamless backdrop: floor, a wide curve, wall
      const YF = -1.45;
      {
        const g = new THREE.PlaneGeometry(140, 1, 1, 80), p = g.attributes.position, L1 = 34, L2 = Math.PI * 1.75, L3 = 30, LT = L1 + L2 + L3;
        for (let i = 0; i < p.count; i++) {
          const s = (0.5 - p.getY(i)) * LT; let y, z;
          if (s < L1) { y = YF; z = 30 - s; } else if (s < L1 + L2) { const a = (s - L1) / 3.5; y = YF + 3.5 - 3.5 * Math.cos(a); z = -4 - 3.5 * Math.sin(a); } else { y = YF + 3.5 + (s - L1 - L2); z = -7.5; }
          p.setXYZ(i, p.getX(i), y, z);
        }
        g.computeVertexNormals();
        add(g, new THREE.MeshStandardMaterial({ color: '#7d9a9d', roughness: 0.94, side: THREE.DoubleSide }), 0, 0, 0, { cast: false });
      }

      // ---- plinth, back board and the engraved jar labels
      add(K.roundedBox(12.9, 1.45, 2.25, 0.07, 4), maple(4, 1), 0, -0.725, 0.425);
      add(K.roundedBox(12.1, 7.3, 0.3, 0.05, 3), boardMat, 0, 3.65, -0.15);
      // under each jar: a two-wheel counter in a brass bezel, and the jar's name burnt into the wood below it
      const digits = (idle) => K.canvasTex(160, 2560, (ctx) => {        // one wheel: ten numerals top to bottom (the tens wheel shows its 0 dimmed)
        ctx.fillStyle = '#17110c'; ctx.fillRect(0, 0, 160, 2560); ctx.fillStyle = '#f4ead6'; ctx.font = '700 100px "Oswald"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.save(); ctx.scale(1.9, 1.9); for (let i = 0; i < 10; i++) { ctx.fillStyle = i || !idle ? '#f4ead6' : '#5d5246'; ctx.fillText(i, 80 / 1.9, (i * 256 + 136) / 1.9); } ctx.restore();
      });
      const tensTex = digits(true), onesTex = digits(false), shadeTex = K.canvasTex(8, 128, (ctx) => { const g = ctx.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, 'rgba(0,0,0,0.75)'); g.addColorStop(0.3, 'rgba(0,0,0,0)'); g.addColorStop(0.7, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.75)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 8, 128); });
      const wheels = BINS.map((b, j) => {
        const l = K.textPlane(b.label, { font: '500 150px "Oswald"', height: 0.4, color: '#3b2614', lit: true, letterSpacing: 16, roughness: 0.7 });
        l.position.set(JARX[j] + 0.03, -1.08, 1.553); l.receiveShadow = true; scene.add(l);
        add(K.roundedBox(1.02, 0.78, 0.07, 0.03, 3), brass, JARX[j], -0.45, 1.565);
        const pair = [tensTex, onesTex].map((src, k) => {
          const t = src.clone(); t.needsUpdate = true; t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 0.1);
          add(new THREE.PlaneGeometry(0.4, 0.62), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }), JARX[j] + (k - 0.5) * 0.41, -0.45, 1.603, { cast: false });
          return t;
        });
        add(new THREE.PlaneGeometry(0.82, 0.62), new THREE.MeshBasicMaterial({ map: shadeTex, transparent: true, depthWrite: false }), JARX[j], -0.45, 1.605, { cast: false, receive: false });   // the wheels curve away at top and bottom
        return pair;
      });
      for (const [x, y] of [[-5.78, 0.32], [5.78, 0.32], [-5.78, 7.07], [5.78, 7.07]]) {       // brass screws in the corners of the board
        add(new THREE.CylinderGeometry(0.075, 0.085, 0.035, 20), brass, x, y, 0.017, { rot: [Math.PI / 2, 0, 0] });
        add(new THREE.BoxGeometry(0.11, 0.016, 0.01), new THREE.MeshStandardMaterial({ color: '#3a2a10', roughness: 0.6 }), x, y, 0.036, { rot: [0, 0, 0.6 + x + y], cast: false });
      }

      // ---- rails: two maple dowels per run, brass ferrules on the ends, brass pins from the board to carry them
      const pins = [];
      const rails = (pts) => {                                    // pts: the marble's centre line; the dowels sit RIDE below it
        const line = pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], k = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / k * Math.sign(b[0] - a[0]), ny = Math.abs(b[0] - a[0]) / k; return [p[0] - nx * RIDE, p[1] - ny * RIDE]; });
        let len = 0; for (let i = 1; i < line.length; i++) len += Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]);
        const mat = maple(len / 1.6, 1);
        for (const dz of [-GAUGE / 2, GAUGE / 2]) {
          add(K.tube(line.map((p) => [p[0], p[1], Z0 + dz]), ROD, { segments: Math.ceil(len * 14), radial: 12 }), mat, 0, 0, 0);
          for (const e of [0, line.length - 1]) { const p = line[e], q = line[e ? e - 1 : 1]; add(new THREE.CylinderGeometry(ROD + 0.009, ROD + 0.009, 0.1, 16), brass, p[0], p[1], Z0 + dz, { rot: [0, 0, Math.atan2(q[1] - p[1], q[0] - p[0]) + Math.PI / 2] }); }
        }
        return line;
      };
      const straight = (x0, x1, yf, step = 0.9) => { const out = [], k = Math.max(1, Math.round(Math.abs(x1 - x0) / step)); for (let i = 0; i <= k; i++) { const x = x0 + (x1 - x0) * i / k; out.push([x, yf(x)]); } return out; };
      const lineY = (line, x) => { for (let i = 1; i < line.length; i++) { const a = line[i - 1], b = line[i]; if ((x - a[0]) * (x - b[0]) <= 0) return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); } return line[0][1]; };
      const railA = rails([slot(3.3), slot(2), slot(1), ...BEND.filter((_, i) => i % 2 === 0), ...straight(BEND[14][0] + 0.5, GAP1[0] - 0.03, y1)]);
      // the last rails stop a good marble radius short of their end plates, so a marble that is turned down by the plate drops past the rail ends, not through them
      const railA2 = rails(straight(GAP1[1] + 0.03, END1 - 0.3, y1));
      const railB = rails(straight(START2 + 0.14, GAP2[0] + 0.03, y2));
      const railB2 = rails(straight(GAP2[1] - 0.03, END2 + 0.3, y2));
      for (const x of [-3.72, -2.6, -1.4, -0.2, 1.0, 1.98]) pins.push([x, lineY(railA, x)]);
      pins.push([3.32, lineY(railA2, 3.32)]);
      for (const x of [2.95, 1.55, 0.2]) pins.push([x, lineY(railB, x)]);
      for (const x of [-1.2, -2.4, -3.3]) pins.push([x, lineY(railB2, x)]);
      {
        const PLn = Z0 + GAUGE / 2 + 0.11;
        const rod = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.03, 0.03, PLn, 12).rotateX(Math.PI / 2), brass, pins.length);
        const cap = new THREE.InstancedMesh(new THREE.SphereGeometry(0.044, 16, 12), brass, pins.length);
        const foot = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.085, 0.03, 20).rotateX(Math.PI / 2), brass, pins.length);
        pins.forEach(([x, y], i) => { const yy = y - ROD - 0.03; K.place(rod, i, [x, yy, PLn / 2]); K.place(cap, i, [x, yy, PLn]); K.place(foot, i, [x, yy, 0.015]); });
        for (const m of [rod, cap, foot]) { m.castShadow = m.receiveShadow = true; scene.add(m); }
      }

      // ---- gates: a brass paddle on an axle with a knob in front; and the two fixed plates at the ends of the rails
      const plateGeo = K.roundedBox(PL, PT, 0.54, 0.02, 3), dark = new THREE.MeshStandardMaterial({ color: '#2b1d0b', roughness: 0.6 });
      const mkGate = (g) => {
        const grp = new THREE.Group(); grp.position.set(g.pivot[0], g.pivot[1], Z0); scene.add(grp);
        add(plateGeo, brass, 0, 0, 0, { parent: grp });
        add(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 16), brass, 0, 0, 0, { rot: [Math.PI / 2, 0, 0], parent: grp });
        add(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 32), brass, 0, 0, 0.42, { rot: [Math.PI / 2, 0, 0], parent: grp });
        add(new THREE.BoxGeometry(0.24, 0.036, 0.012), dark, 0, 0, 0.462, { parent: grp, cast: false });
        add(new THREE.CylinderGeometry(0.032, 0.032, Z0 + 0.4, 12), brass, g.pivot[0], g.pivot[1], (Z0 + 0.4) / 2, { rot: [Math.PI / 2, 0, 0] });
        add(new THREE.CylinderGeometry(0.09, 0.105, 0.035, 24), brass, g.pivot[0], g.pivot[1], 0.017, { rot: [Math.PI / 2, 0, 0] });
        return grp;
      };
      const gate1 = mkGate(GATE1), gate2 = mkGate(GATE2);
      for (const P of [PLATE1, PLATE2]) {
        const d = [Math.cos(P.a), Math.sin(P.a)], dn = -0.14 * Math.sign(d[1]), c = [P.hit[0] - P.n[0] * (R + PT / 2) + d[0] * dn, P.hit[1] - P.n[1] * (R + PT / 2) + d[1] * dn];   // the marble strikes the upper half
        add(K.roundedBox(0.78, PT, 0.54, 0.02, 3), brass, c[0], c[1], Z0, { rot: [0, 0, P.a] });
        for (const k of [-0.24, 0.24]) { const x = c[0] + d[0] * k - P.n[0] * 0.05, y = c[1] + d[1] * k - P.n[1] * 0.05; add(new THREE.CylinderGeometry(0.03, 0.03, Z0 + 0.2, 12), brass, x, y, (Z0 + 0.2) / 2, { rot: [Math.PI / 2, 0, 0] }); add(new THREE.CylinderGeometry(0.07, 0.085, 0.03, 20), brass, x, y, 0.015, { rot: [Math.PI / 2, 0, 0] }); }
      }
      // the escapement: a brass finger that holds the front marble and dips to let one go
      const NF = [-FEED[1], FEED[0]], fingerAt = [PIN[0] + FEED[0] * (R + 0.035) - NF[0] * 0.38, PIN[1] + FEED[1] * (R + 0.035) - NF[1] * 0.38];
      const finger = new THREE.Group(); finger.position.set(fingerAt[0], fingerAt[1], Z0); scene.add(finger);
      add(K.roundedBox(0.05, 0.56, 0.1, 0.02, 3).translate(0, 0.26, 0), brass, 0, 0, 0, { parent: finger });
      add(new THREE.CylinderGeometry(0.045, 0.045, 0.3, 14), brass, 0, 0, 0, { rot: [Math.PI / 2, 0, 0], parent: finger });
      add(new THREE.CylinderGeometry(0.03, 0.03, Z0 + 0.15, 12), brass, fingerAt[0], fingerAt[1], (Z0 + 0.15) / 2, { rot: [Math.PI / 2, 0, 0] });
      const fingerRest = Math.atan2(NF[1], NF[0]) - Math.PI / 2;

      // ---- engraved brass plates
      const plaque = (text, w, h, x, y, z) => {
        const tex = K.canvasTex(1024, Math.round(1024 * h / w), (ctx, W, Hh) => {
          const g = ctx.createLinearGradient(0, 0, 0, Hh); g.addColorStop(0, '#e6c06c'); g.addColorStop(1, '#cfa24c'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, Hh);
          const r = K.rng(text.length * 7 + 1); for (let i = 0; i < 500; i++) { ctx.fillStyle = r.chance(0.5) ? `rgba(255,244,205,${r.range(0.03, 0.09)})` : `rgba(120,80,20,${r.range(0.03, 0.08)})`; ctx.fillRect(r.range(-200, W), r.range(0, Hh), r.range(80, 500), 1.5); }   // brushed
          ctx.strokeStyle = 'rgba(70,44,10,0.55)'; ctx.lineWidth = 6; ctx.strokeRect(26, 26, W - 52, Hh - 52);
          ctx.fillStyle = '#2a1a08'; ctx.font = `700 ${Math.round(Hh * 0.56)}px "Oswald"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = Math.round(Hh * 0.05) + 'px';
          ctx.fillText(text, W / 2 + Hh * 0.025, Hh * 0.535);
        });
        const face = new THREE.MeshStandardMaterial({ map: tex, metalness: 0.75, roughness: 0.42 });
        return add(K.roundedBox(w, h, 0.045, 0.012, 2), [brass, brass, brass, brass, face, brass], x, y, z);
      };
      plaque(SOURCE, 1.0, 0.34, -5.21, 6.3, 1.31);
      plaque(GATE_TAGS[0], 1.0, 0.36, GATE1.pivot[0] + 0.02, GATE1.pivot[1] + 0.88, 0.022);
      plaque(GATE_TAGS[1], 1.06, 0.36, GATE2.pivot[0] - 0.02, GATE2.pivot[1] + 0.88, 0.022);

      // ---- the hopper: a maple box; marbles leave through a doorway low on its right side
      add(K.roundedBox(1.38, 1.32, 1.3, 0.05, 4), maple(0.7, 2), -5.21, 6.26, 0.65);
      add(K.roundedRect(0.6, 0.68, 0.27), new THREE.MeshBasicMaterial({ color: '#150d06' }), -4.518, 6.03, Z0, { rot: [0, Math.PI / 2, 0], cast: false, receive: false });

      // ---- jars: lathe-turned glass. three.js glass cannot show glass through glass, so the jars are a clear
      // reflective shell whose opacity follows the viewing angle (bright edges, clear middle) and the marbles are true glass.
      const jarMat = new THREE.MeshPhysicalMaterial({ color: '#e9f4ee', roughness: 0.14, metalness: 0, transparent: true, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.5 });
      jarMat.onBeforeCompile = (sh) => {
        sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', `
          float gEdge = pow(1.0 - saturate(abs(dot(normalize(vViewPosition), normal))), 3.0);
          float gSpec = max(max(totalSpecular.r, totalSpecular.g), totalSpecular.b);
          gl_FragColor = vec4(outgoingLight, clamp(0.02 + 0.42 * gEdge + 0.75 * smoothstep(0.35, 1.6, gSpec), 0.0, 0.95));`);
      };
      const jarGeo = new THREE.LatheGeometry([[0, 0], [0.56, 0], [0.63, 0.02], [0.65, 0.08], [0.65, 1.38], [0.63, 1.54], [0.56, 1.67], [0.52, 1.73], [0.52, 1.84], [0.555, 1.88], [0.565, 1.92], [0.545, 1.95], [0.49, 1.95], [0.47, 1.91], [0.47, 1.76], [0.53, 1.62], [0.59, 1.48], [0.6, 1.38], [0.6, 0.2], [0.56, 0.12], [0.45, 0.1], [0, 0.1]].map((p) => new THREE.Vector2(p[0], p[1])), 72);
      const ghost = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });      // draws nothing, but still casts a shadow
      JARX.forEach((x) => {
        const j = add(jarGeo, jarMat, x, 0, Z0, { cast: false, receive: false }); j.renderOrder = 5;
        add(new THREE.CylinderGeometry(0.63, 0.63, 0.1, 40), ghost, x, 0.05, Z0, { receive: false });
      });

      // ---- marbles: coloured glass with an opaque vein around them, so you can see them roll
      const sunDir = new THREE.Vector3(SUN[0] - AIM[0], SUN[1] - AIM[1], SUN[2] - AIM[2]).normalize();
      const vein = K.canvasTex(512, 256, (ctx, w, h) => {            // white = clear glass, black = vein (used as the transmission map)
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#000'; ctx.shadowColor = '#000'; ctx.shadowBlur = 5;
        const band = (amp, amp2, ph, wide) => {                      // a ribbon that wanders round the ball and swells and thins
          const top = [], bot = [];
          for (let i = 0; i <= 96; i++) { const a = i / 96 * 6.2832, y = h * (0.5 + amp * Math.sin(2 * a + ph) + amp2 * Math.sin(3 * a + ph * 2)), hw = wide * (0.2 + 0.8 * (0.5 + 0.5 * Math.sin(a + ph)) ** 2); top.push([i / 96 * w, y - hw]); bot.push([i / 96 * w, y + hw]); }
          ctx.beginPath(); top.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); bot.reverse().forEach(([x, y]) => ctx.lineTo(x, y)); ctx.closePath(); ctx.fill();
        };
        band(0.2, 0.07, 0.4, 12); band(0.13, 0.06, 2.6, 4.5);
      }, { data: true });
      const white = new THREE.Color('#ffffff');
      const mkGlass = (hex) => {
        const c = new THREE.Color(hex), deep = new THREE.Color(c.r * c.r, c.g * c.g, c.b * c.b);
        const m = new THREE.MeshPhysicalMaterial({ color: white.clone().lerp(c, 0.3), roughness: 0.04, metalness: 0, transmission: 1, transmissionMap: vein, thickness: 0.3, ior: 1.5, attenuationColor: c, attenuationDistance: 0.3, envMapIntensity: 1.3 });
        // Light gathers on the far side of a glass ball: add that glow in a deeper shade of the marble's colour. The
        // sun's own highlight is dropped (a soft light on a mirror-smooth ball renders as dots); the window in the
        // environment gives the glint instead.
        m.onBeforeCompile = (sh) => {
          sh.uniforms.uSun = { value: sunDir }; sh.uniforms.uDeep = { value: deep };
          sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uSun, uDeep;')
            .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n{ vec3 sv = normalize((viewMatrix * vec4(uSun, 0.0)).xyz); float far = max(dot(normal, -sv), 0.0); totalEmissiveRadiance += uDeep * (0.16 + 2.0 * far * far * far); }')
            .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\nreflectedLight.directSpecular *= 0.0;');
        };
        return m;
      };
      const ballGeo = new THREE.SphereGeometry(R, 48, 32), where = [], tints = run.bin.map((b) => new THREE.Color(BINS[b].glass)), tint = new THREE.Color();
      const balls = BINS.map((b, j) => { const m = new THREE.InstancedMesh(ballGeo, mkGlass(b.glass), run.bin.filter((x) => x === j).length); m.castShadow = m.receiveShadow = true; m.frustumCulled = false; scene.add(m); return m; });
      { const count = [0, 0, 0]; run.bin.forEach((b, i) => { where[i] = [balls[b], count[b]++]; }); }
      // the bright coloured spot a glass ball throws into the middle of its own shadow
      const spotTex = K.canvasTex(64, 64, (ctx) => { const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, '#fff'); g.addColorStop(0.4, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64); });
      const spots = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: spotTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), run.n);
      for (let i = 0; i < run.n; i++) spots.setColorAt(i, tints[i]);
      spots.frustumCulled = false; scene.add(spots);

      // ---- camera: one shot in three parts. (A) ride beside the hero and reach gate 1 just before it does; (B) follow it
      // along rail 2 and across gate 2; (C) let it run ahead into its jar while the frame opens to the three jars (never
      // wider than the board) and then pushes slowly in on jars, counters and names.
      // Each part gives [centre x, centre y, width of the frame at the track, camera offset x, y]; the parts cross-fade.
      const tG = run.ev.find((e) => e.k === 'paddle' && e.i === HERO).t, t2 = run.g2.find((e) => e.i === HERO).t, GP = [GATE1.pivot[0] - 0.2, GATE1.pivot[1] - 0.08];
      const hp = [0, 0, 0], acc = [0, 0, 0], LENS = 2 * Math.tan(14 * Math.PI / 180) * 16 / 9;       // frame width per unit of distance at fov 28
      const hero = (t, cap) => { acc[0] = acc[1] = acc[2] = 0; let ws = 0; for (let k = -6; k <= 6; k++) { const w = 7 - Math.abs(k); run.pose(HERO, Math.min(t + k * 0.04, cap), hp); acc[0] += hp[0] * w; acc[1] += hp[1] * w; acc[2] += hp[2] * w; ws += w; } return [acc[0] / ws, acc[1] / ws, acc[2] / ws]; };
      const cam = {
        lead: K.track([[0, 0.25], [1.2, 1.3, 'inOut']]),
        rise: K.track([[0, 0.45], [1.0, -0.1, 'inOut']]),
        off: K.track([[0, [1.1, 0.2, 5.5]], [tG - 0.2, [0.45, 0.3, 6.3], 'inOut']]),
        jars: K.path([[t2, [-0.7, y2(0) + 0.25, 5.6, -0.35, 0.3]], [t2 + 1.25, [-1.5, 1.35, 8.8, 0, 0.3]], [t2 + 2.4, [0, 1.85, 12.3, 0.4, 0.3]], [DUR, [0, 1.15, 10.9, 0.3, 0.25]]]),
        ap: K.track([[0, 0.05], [tG, 0.055], [t2 + 1, 0.055], [DUR, 0.035]]),
        mix: (a, b, w) => a.map((v, i) => v + (b[i] - v) * w),
      };
      const mtx = new THREE.Matrix4(), vp = new THREE.Vector3(), vq = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), p = [0, 0, 0], q = [0, 0, 0, 1];

      return {
        update(t) {
          for (let i = 0; i < run.n; i++) {
            run.pose(i, t, p, q); vp.set(p[0], p[1], p[2]); vq.set(q[0], q[1], q[2], q[3]).normalize();
            mtx.compose(vp, vq, one); where[i][0].setMatrixAt(where[i][1], mtx);
            const k = p[0] < -4.5 || p[1] < JAR.rim ? 0 : 0.45, d = p[2] / sunDir.z;      // (not from inside the hopper or a jar)
            K.place(spots, i, [p[0] - sunDir.x * d, p[1] - sunDir.y * d, 0.006], null, 0.28); spots.setColorAt(i, tint.copy(tints[i]).multiplyScalar(k));
          }
          for (const b of balls) b.instanceMatrix.needsUpdate = true;
          spots.instanceMatrix.needsUpdate = spots.instanceColor.needsUpdate = true;
          gate1.rotation.z = K.lerp(GATE1.a0, GATE1.a1, run.gate1(t)); gate2.rotation.z = K.lerp(GATE2.a0, GATE2.a1, run.gate2(t));
          let dip = 0; for (const T of run.T) { const a = t - T + 0.04; if (a > 0 && a < 0.6) dip += K.spring(a, 9, 0.6) - K.spring(a - 0.17, 7, 0.5); }
          finger.rotation.z = fingerRest - 1.25 * dip;

          // counters: every marble that has dropped into a jar rolls its wheel on by one
          wheels.forEach((pair, j) => {
            let v = 0; for (const ti of run.ins[j]) v += K.seg(t, ti + 0.03, ti + 0.25, K.ease.out);
            const ones = v % 10, tens = Math.floor(v / 10) + K.clamp(ones - 9);
            pair[0].offset.y = 0.9 - tens / 10; pair[1].offset.y = 0.9 - ones / 10;
          });

          // (A) the hero plus some lead room, easing to a stop on gate 1 as the hero nears it
          const h = hero(t, tG), ahead = h[0] + cam.lead(t), o = cam.off(t);
          const A = [GP[0] - 0.6 * Math.log(1 + Math.exp((GP[0] - ahead) / 0.6)), K.lerp(h[1] + cam.rise(t), GP[1], K.smooth(GP[0] - 3.2, GP[0] + 0.4, ahead)), o[2] * LENS, o[0], o[1]];
          // (B) the hero again, now rolling left, seen from a little ahead of it
          const hb = hero(t, DUR), B = [hb[0] - 0.7, hb[1] + 0.25, 5.6, -0.35, 0.3];
          const v = cam.mix(cam.mix(A, B, K.smooth(tG + 0.05, tG + 0.8, t)), cam.jars(t), K.smooth(t2 - 0.35, t2 + 0.45, t));
          K.look(camera, [v[0] + v[3], v[1] + v[4], Z0 + v[2] / LENS], [v[0], v[1], Z0]);
          K.focus(camera, [v[0], v[1], K.lerp(Z0, 1.3, K.smooth(t2 + 1, DUR, t))], cam.ap(t));
        },
      };
    },

    sound(k) {
      // wood, brass and glass only: every sound is one of the events the run wrote down, at the time it happens
      const K = globalThis.K, run = schedule(K), pan = (x) => K.clamp(x / 7, -0.8, 0.8), on = (e) => e.t >= 0 && e.t < DUR - 0.05;
      const lead = (e) => (e.i === HERO ? 1.5 : 1);                 // the marble the camera follows is mixed a little forward
      k.bed('room', 0, DUR, { gain: 0.9 });
      k.withMinor(() => {
        for (const e of run.ev.filter(on)) {
          const g = K.clamp(e.g / 8, 0.15, 1) * lead(e), p = pan(e.x);
          if (e.k === 'release') { k.play('click', e.t, { gain: 0.5, f: 2400, pan: p }); k.noise(e.t, { dur: 1.5, color: 'brown', filter: 'bandpass', f: [[0, 240], [1.5, 700]], q: 1.4, gain: 0.09 * lead(e) ** 3, a: 0.5, pan: -0.15 }); }   // let go, and the roll that rises as it speeds up
          else if (e.k === 'queue') k.play('tock', e.t, { gain: 0.35, f: 1500, pan: p });                              // the next marble stops against the finger
          else if (e.k === 'land') k.play('tock', e.t, { gain: 0.7 * g + 0.2, f: 520, pan: p });                       // onto the lower rail: wood
          else if (e.k === 'glass') { k.tone(e.t, { f: 2500 + (e.x * 131 + e.t * 977) % 900, dur: 0.16, gain: 0.16 * g, a: 0.001, pan: p, verb: 0.2 }); k.play('tick', e.t, { gain: 0.5 * g, f: 5200, pan: p }); k.play('thud', e.t, { gain: 0.25 * g, f: 150, pan: p }); }   // into the jar
          else if (e.k === 'clink') { k.tone(e.t, { f: 3800 + (e.t * 1733) % 1500, dur: 0.07, gain: 0.1 * g, a: 0.001, pan: p }); k.play('tick', e.t, { gain: 0.4 * g, f: 6500, pan: p }); }   // marble on marble
        }
      });
      for (const e of run.ev.filter(on)) {                         // brass rings when a marble strikes a paddle or an end plate
        if (e.k !== 'paddle' && e.k !== 'plate') continue;
        const g = K.clamp(e.g / 7, 0.3, 1) * lead(e), p = pan(e.x), f = e.k === 'paddle' ? 1650 : 1320;
        k.play('tock', e.t, { gain: 0.8 * g, f: 1100, pan: p });
        k.tone(e.t, { f, dur: 0.35, gain: 0.07 * g, a: 0.001, pan: p, verb: 0.3 }); k.tone(e.t, { f: f * 2.41, dur: 0.18, gain: 0.035 * g, a: 0.001, pan: p, verb: 0.3 });
      }
      k.withMinor(() => run.ins.forEach((list, j) => list.forEach((ti) => { if (ti > 0 && ti < DUR - 0.1) k.play('tick', ti + 0.06, { gain: 0.35, f: 2100, pan: pan(JARX[j]) }); })));   // a counter wheel rolling on
      for (const [f, x] of [[run.gate1, GATE1.pivot[0]], [run.gate2, GATE2.pivot[0]]]) for (const [ts] of f.switches) if (ts > 0 && ts < DUR) { k.play('click', ts + 0.03, { gain: 0.55, f: 1700, pan: pan(x) }); k.play('tick', ts + 0.03, { gain: 0.3, f: 3000, pan: pan(x) }); }   // a paddle flipping
    },
  });
}
```
