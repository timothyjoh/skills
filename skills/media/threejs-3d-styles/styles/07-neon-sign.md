# Neon Sign (#07)

- **id:** `neon-sign`
- **Category:** Flat content made physical
- **Use:** explainer
- **Reference duration:** 11.5 s
- **Google Fonts:** none
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`, `lib/strokefont.js`

## Style card

- **Look:** A line drawing bent out of real glass tube and mounted on a painted brick wall at night: bright cores, coloured gas, black-painted returns into rubber boots, clear standoffs, every unlit tube waiting as milky glass. Small tube lettering for captions. Wet ground at the foot of the wall mirrors the end of it.
- **Motion:** Neon never fades and never slides. A section snaps on, drops out and snaps again before it holds a touch over-bright and settles; one tube buzzes with the glow crawling along the glass before it catches. Things move the way real animated signs do it: by swapping between sets of tubes (pose A, pose B, pose C) and by lighting the segments of a path one after another, so light appears to travel.
- **Light:** The tubes are the only real light: each one throws its own colour on the brick, hot right behind the glass and falling off across the wall, and every flicker moves the whole scene. A faint cold street light keeps the unlit glass readable.
- **Materials:** Milky glass tube, semi-gloss paint over rough brick with soot and rain streaks, black rubber and matte blockout paint, clear acrylic standoffs, galvanised conduit, wet asphalt with puddles.
- **Camera:** Long lens, one slow continuous crane. It starts a little oblique so the glass stands off the wall, drifts in on the part of the drawing that is lighting, then follows the light down the wall and settles low and square on the result, over its reflection in the wet ground. It is still drifting on the last frame.
- **Finish:** Wide soft bloom from the over-bright cores, filmic contrast with deep blacks, slight depth of field, light vignette, fine grain, a trace of chromatic aberration.
- **Good for:** How something works, as a diagram that switches on in the order it happens: light, electricity, signals, water, traffic, money, a recipe, a journey. A beat is a group of tubes that strikes on because the one before it did. Outlines are the things, a chase of short segments is whatever flows between them, alternating poses are whatever repeats (rain, flames, wheels, a heartbeat), and colour carries meaning, so use it for the part of the idea that really is about colour, state or category. One small tube caption per beat names what just lit; the last thing to light is the result, and it holds.

## Reference

- **Sample topic:** How a rainbow forms
- **Gallery description:** A line drawing bent out of real glass tube and mounted on a painted brick wall at night: bright cores, coloured gas, black-painted returns into rubber boots, clear standoffs, every unlit tube waiting as milky glass. Small tube lettering for captions. Wet ground at the foot of the wall mirrors the end of it.
- **Shown in the sample clip:** How a rainbow forms

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/neon-sign.js`)

```js
{
  // ---------------------------------------------------------------- content (change this block for a new topic)
  // A neon explainer is a line drawing on a wall, made of SECTIONS. A section is everything that switches together:
  // one outline, one pose of an animation, one segment of a path, one caption. The story is the order they light in.
  const CAPTIONS = ['SUNLIGHT MEETS RAIN', 'IT BENDS GOING IN', 'REFLECTS, THEN SPLITS', ['RED AT 42°', 'VIOLET AT 40°']];   // one short line per beat
  const DURATION = 11.5;
  const SPECTRUM = ['red', 'orange', 'yellow', 'green', 'blue', 'violet'];
  const COLORS = {              // [gas colour at the glass, hot core, colour of the light it throws on the wall]
    sun: ['#ff8a00', '#ffc46a', '#ffab26'],      // amber
    cloud: ['#6aa8ff', '#d4e6ff', '#8cc0ff'],    // cold white
    rain: ['#0a84ff', '#8ccaff', '#2a98ff'],
    drop: ['#00c8a8', '#8dffe4', '#18e6c6'],     // argon turquoise
    white: ['#ffe2b8', '#ffffff', '#fff0da'],    // sunlight
    note: ['#ffb070', '#ffe0c0', '#ffc898'],     // captions: warm white, run dimmer than the drawing
    red: ['#ff1403', '#ff3a1c', '#ff3414'],      // the six bands keep their cores close to the gas colour: here colour is the content
    orange: ['#ff5200', '#ff7a20', '#ff7214'],
    yellow: ['#ffbe00', '#ffd83a', '#ffd21e'],
    green: ['#0cd030', '#40f060', '#28e84c'],
    blue: ['#0b56ff', '#3c84ff', '#2a78ff'],
    violet: ['#8220ff', '#a050ff', '#9a40ff'],
  };
  // when things happen, in seconds. Picture and sound both read this.
  const T = {
    shine: 0.45,                                   // the sun's two sets of rays swap this often (pose A, pose B)
    cloud: 0.45, rain: 1.15, rainStep: 0.14,       // beat 1: the cloud struggles on like lightning, then three sets of drops chase downward
    drop: 2.6, ray: 3.1, rayStep: 0.14,            // beat 2: one drop, and a white ray that travels into it segment by segment
    bounce: 5.2, fan: 5.75, fanStep: 0.11,         // beat 3: off the back of the drop, out as six colours
    land: 8.0, bow: 8.5, bowStep: 0.26,            // beat 4: the bow, band by band, red first; its two labels light with their bands
    notes: [1.3, 4.3, 6.5],
    pulse: 6.6, pulseStep: 0.06, pulseLoop: 30,    // afterwards a brighter pulse keeps running along the light path
  };
  // where things are on the wall (x right, y up, wall at z = 0, ground at y = 0). The drawing is taller than one frame:
  // the camera cranes down it, following the light from the sky to the ground.
  const DROP = { x: 1.9, y: 8.0, r: 1.3 }, CLOUD = { x: 1.9, y: 11.2, s: 1.15 }, SUN = { x: -3.8, r: 0.72 }, BOW = { x: 0, y: 0.62, r: 3.9, gap: 0.24 };
  const NOTE = 0.24, FAN_STEP = 2.8 * Math.PI / 180, FAN_LEN = 2.4;

  // The rainbow ray through a round drop, by Snell's law, for sunlight travelling along +x. It bends going in at p1,
  // reflects once off the back at p2 and bends again leaving at p3. `out` is the direction it leaves in: back toward
  // the sun, turned 4r - 2i from the incoming line. For water that is 42.4 degrees in red (n = 1.331) and about 40.5 in
  // violet (n = 1.344), which is why red is the outer band. The drawing uses n = 1.333 for the path and then spreads
  // the six colours 2.8 degrees apart (about eight times wider than life) so that six tubes fit side by side.
  function rainbowRay(c, R, n = 1.333) {
    const i = Math.acos(Math.sqrt((n * n - 1) / 3)), r = Math.asin(Math.sin(i) / n);   // incidence of least deviation, and its refraction
    const at = (a) => [c[0] + R * Math.cos(a), c[1] + R * Math.sin(a)], a1 = Math.PI - i, chord = Math.PI - 2 * r;
    return { p1: at(a1), p2: at(a1 - chord), p3: at(a1 - 2 * chord), out: Math.PI + 4 * r - 2 * i };
  }

  // ---------------------------------------------------------------- the drawing, as flat centre-lines
  function drawing(K) {
    const sections = [], tubes = [];
    // sec(name, colour, { on: strike time (-1 = already burning) | cycle: [start, step, poses, pose], r: tube radius,
    //   lift: distance off the wall, gain: brightness, snap: no stutter, lamp: which point light it feeds, ... })
    const sec = (name, color, o = {}) => { const s = Object.assign({ name, color, tubes: [], r: 0.05, lift: 0.18, gain: 1, on: 1e9, lamp: null }, o); sections.push(s); return s; };
    const tube = (s, pts, o = {}) => { const tb = Object.assign({ sec: s, pts, closed: false, radius: s.r, lift: s.lift }, o); tubes.push(tb); s.tubes.push(tb); };
    const arc = (cx, cy, r, a0, a1, n = 48) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
    const ring = (cx, cy, r, n = 72) => arc(cx, cy, r, 0, Math.PI * 2 * (1 - 1 / n), n - 1);
    const poly = (corners, closed) => {   // straight runs with a point every few centimetres, so the glass keeps its corners
      const out = [], n = corners.length;
      for (let i = 0; i < (closed ? n : n - 1); i++) { const a = corners[i], b = corners[(i + 1) % n], m = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.07)); for (let k = 0; k < m; k++) out.push([K.lerp(a[0], b[0], k / m), K.lerp(a[1], b[1], k / m)]); }
      if (!closed) out.push(corners[n - 1]);
      return out;
    };
    const along = (a, b, u) => [K.lerp(a[0], b[0], u), K.lerp(a[1], b[1], u)];
    const C = [DROP.x, DROP.y], ray = rainbowRay(C, DROP.r), sunY = ray.p1[1];

    // ---- beat 1: sun, cloud, rain
    const sun = sec('sun', 'sun', { on: -1, r: 0.055, lamp: 'sun' });
    tube(sun, ring(SUN.x, sunY, SUN.r), { closed: true, cut: [SUN.x - SUN.r, sunY] });
    for (let k = 0; k < 2; k++) {          // two sets of rays on the same eight spokes, inner and outer: lit in turn, the sun radiates
      const s = sec('shine' + k, 'sun', { cycle: [0, T.shine, 2, k], r: 0.042, lamp: 'sun' });
      for (let j = 0; j < 8; j++) { const a = j / 8 * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a), r0 = 0.97 + k * 0.33; tube(s, [[SUN.x + c * r0, sunY + sn * r0], [SUN.x + c * (r0 + 0.26), sunY + sn * (r0 + 0.26)]]); }
    }
    const puffs = [[-1.15, -0.15, 0.55], [-0.35, 0.3, 0.72], [0.62, 0.14, 0.62], [1.32, -0.25, 0.45]].map(([x, y, r]) => [CLOUD.x + x * CLOUD.s, CLOUD.y + y * CLOUD.s, r * CLOUD.s]);
    const meet = (a, b) => { const d = Math.hypot(b[0] - a[0], b[1] - a[1]), l = (a[2] * a[2] - b[2] * b[2] + d * d) / (2 * d), h = Math.sqrt(a[2] * a[2] - l * l), ux = (b[0] - a[0]) / d, uy = (b[1] - a[1]) / d; return [a[0] + ux * l - uy * h, a[1] + uy * l + ux * h]; };   // upper crossing of two circles
    const cloudPts = [];
    puffs.forEach((p, i) => {               // over the top of each puff from left to right; the flat base closes the loop
      const from = i ? meet(puffs[i - 1], p) : [p[0], p[1] - p[2]], to = i < puffs.length - 1 ? meet(p, puffs[i + 1]) : [p[0], p[1] - p[2]];
      let a0 = Math.atan2(from[1] - p[1], from[0] - p[0]), a1 = Math.atan2(to[1] - p[1], to[0] - p[0]);
      if (i === 0) a0 = Math.PI * 1.5; if (i === puffs.length - 1) a1 = -Math.PI / 2;
      while (a1 > a0) a1 -= Math.PI * 2;
      cloudPts.push(...arc(p[0], p[1], p[2], a0, a1, Math.ceil((a0 - a1) * 9)).slice(i ? 1 : 0));
    });
    const baseY = puffs[0][1] - puffs[0][2];
    cloudPts.push(...poly([[puffs[3][0], baseY], [puffs[0][0], baseY]]).slice(1, -1));
    tube(sec('cloud', 'cloud', { on: T.cloud, struggle: 0.55, r: 0.055, lamp: 'cloud', thump: 0.5 }), cloudPts, { closed: true });
    // rain: every column holds three sets of short tubes. Lit in turn (0, 1, 2, 0, ...) the drops fall.
    const fanMid = [ray.p3[0] + Math.cos(ray.out) * 1.5, ray.p3[1] + Math.sin(ray.out) * 1.5];
    const keepOut = (x, y) => Math.hypot(x - C[0], y - C[1]) < DROP.r + 0.3 || (Math.abs(y - sunY) < 0.3 && x < C[0]) || Math.hypot(x - fanMid[0], y - fanMid[1]) < 1.75;
    const rain = [0, 1, 2].map((k) => sec('rain' + k, 'rain', { cycle: [T.rain, T.rainStep, 3, k], r: 0.032, lift: 0.14, lamp: 'cloud' }));
    for (let col = 0; col < 8; col++) {
      const x = CLOUD.x - 1.925 + col * 0.55, phase = K.hash(col, 3) * 0.96;
      for (let y = baseY - 0.22 - phase, n = 0; y > 6.2; y -= 0.32, n++) if (!keepOut(x, y) && !keepOut(x, y - 0.22)) tube(rain[n % 3], [[x, y], [x, y - 0.22]]);
    }

    // ---- beat 2: one drop (round, as small raindrops are) and the white ray that travels into it
    tube(sec('drop', 'drop', { on: T.drop, r: 0.06, lamp: 'drop', thump: 0.5 }), ring(C[0], C[1], DROP.r, 96), { closed: true, cut: [C[0] + DROP.r * 0.57, C[1] + DROP.r * 0.82] });
    const light = (name, pts, on, order, lamp) => tube(sec(name, 'white', { on, snap: true, order, r: 0.04, lift: 0.26, lamp, tick: true }), pts);
    const x0 = SUN.x + 1.66, x1 = ray.p1[0] - 0.13, N = 5, len = (x1 - x0) / N;
    for (let j = 0; j < N; j++) light('ray' + j, [[x0 + j * len, sunY], [x0 + (j + 1) * len - 0.07, sunY]], T.ray + j * T.rayStep, j, 'ray');
    const inA = along(ray.p1, ray.p2, 0.07), inB = along(ray.p1, ray.p2, 0.66), backA = along(ray.p1, ray.p2, 0.7), back = along(ray.p2, C, 0.07), backB = along(ray.p2, ray.p3, 0.34), outA = along(ray.p2, ray.p3, 0.38), outB = along(ray.p2, ray.p3, 0.93);
    light('bend', poly([inA, inB]), T.ray + N * T.rayStep + 0.05, N, 'drop');                 // the first leg inside: the bend is the kink between this and the ray

    // ---- beat 3: one reflection off the back, then out, fanned from red to violet
    light('bounce', poly([backA, back, backB]), T.bounce, N + 1, 'drop');                      // one bent tube: the reflection
    light('leave', poly([outA, outB]), T.bounce + 0.16, N + 2, 'drop');
    const apex = [ray.p3[0] - Math.cos(ray.out) * 2, ray.p3[1] - Math.sin(ray.out) * 2];         // the six rays spread from one point behind the exit
    SPECTRUM.forEach((name, k) => {
      const a = ray.out + (2.5 - k) * FAN_STEP, d = [Math.cos(a), Math.sin(a)], w = [apex[0] - C[0], apex[1] - C[1]], wd = w[0] * d[0] + w[1] * d[1];
      const s0 = -wd + Math.sqrt(wd * wd - (w[0] * w[0] + w[1] * w[1] - (DROP.r + 0.13) ** 2));   // where this ray clears the glass of the drop
      tube(sec('fan:' + name, name, { on: T.fan + k * T.fanStep, snap: true, order: N + 3, r: 0.032, lift: 0.22, lamp: 'fan', chime: ['C5', 'D5', 'E5', 'G5', 'A5', 'C6'][k], chimeGain: 0.35 }),
        [[apex[0] + d[0] * s0, apex[1] + d[1] * s0], [apex[0] + d[0] * (s0 + FAN_LEN), apex[1] + d[1] * (s0 + FAN_LEN)]]);
    });

    // ---- beat 4: the bow over a small landscape, red on the outside
    const hill = (x) => BOW.y + 0.3 + 0.5 * Math.cos(K.clamp((x + 1.25) / 1.5, -1, 1) * Math.PI / 2) ** 2 + 0.34 * Math.cos(K.clamp((x - 1.1) / 1.3, -1, 1) * Math.PI / 2) ** 2;
    const land = sec('land', 'drop', { on: T.land, r: 0.04, lift: 0.14, gain: 0.7, lamp: 'land', thump: 0.3 });
    tube(land, Array.from({ length: 61 }, (_, i) => { const x = -2.3 + i * 4.6 / 60; return [x, hill(x)]; }));
    const hx = 1.25, hy = hill(1.25) + 0.12;
    tube(sec('house', 'sun', { on: T.land + 0.25, r: 0.03, lift: 0.14, gain: 0.8, lamp: 'land' }), poly([[hx - 0.24, hy], [hx + 0.24, hy], [hx + 0.24, hy + 0.3], [hx, hy + 0.52], [hx - 0.24, hy + 0.3]], true), { closed: true });
    SPECTRUM.forEach((name, k) => tube(sec('bow:' + name, name, { on: T.bow + k * T.bowStep, r: 0.06, lift: 0.2, lamp: 'bow', thump: 0.22, chime: ['A3', 'C#4', 'E4', 'A4', 'C#5', 'E5'][k], chimeGain: 0.7, feet: true }),
      arc(BOW.x, BOW.y, BOW.r - k * BOW.gap, 0, Math.PI, 64)));

    // ---- captions: small tube lettering. '°' is not in the stroke font, so it is added as a small ring.
    const note = (text, x, y, align, on, off) => {     // `off`: a caption goes dark when the next one lights, so one line is burning at a time
      const s = sec('note:' + text, 'note', { on, off, r: 0.018, lift: 0.1, gain: 0.62, note: true });
      const L = STROKEFONT.layout(text.replace(/°/g, ' '), { size: NOTE, align, step: 0.07 });
      for (const st of L.strokes) tube(s, st.points.map((p) => [p[0] + x, p[1] + y]), { closed: st.closed });
      [...text].forEach((ch, i) => { if (ch === '°') tube(s, ring(x + L.glyphs[i].x + NOTE * 0.06, y + L.glyphs[i].y + NOTE * 0.82, NOTE * 0.2, 16), { closed: true, loop: true }); });
    };
    note(CAPTIONS[0], -2.9, sunY + 2.1, 'center', T.notes[0], T.notes[1]);
    note(CAPTIONS[1], -0.4, sunY - 1.78, 'right', T.notes[1], T.notes[2]);
    note(CAPTIONS[2], 0.3, 6.0, 'right', T.notes[2]);
    CAPTIONS[3].forEach((line, i) => note(line, 0.1, 2.78 - i * 0.58, 'center', T.bow + i * 5 * T.bowStep + 0.12));

    for (const s of sections) {
      const xs = s.tubes.flatMap((tb) => tb.pts.map((p) => p[0])), ys = s.tubes.flatMap((tb) => tb.pts.map((p) => p[1]));
      s.box = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
      s.x = (s.box[0] + s.box[2]) / 2; s.y = (s.box[1] + s.box[3]) / 2;
      s.length = s.tubes.reduce((a, tb) => a + STROKEFONT.length(tb.pts), 0);
    }
    return { sections, tubes };
  }

  // ---------------------------------------------------------------- how neon comes on
  // Each section gets a list of [time, brightness] steps (it holds each value until the next), then `hold`: the moment
  // it finally catches, flashes a little over-bright and settles. A cold tube never fades up: it snaps, drops, snaps.
  function schedule(K) {
    const plan = drawing(K), r = K.rng(7), zaps = [];
    const strikes = [[[0, 0.9], [0.05, 0]], [[0, 0.6], [0.04, 0], [0.09, 1.0], [0.13, 0.1]], [[0, 1.0], [0.06, 0.15]], [[0, 0.5], [0.05, 0]]];
    plan.sections.forEach((s, i) => {
      s.steps = []; s.hold = 1e9; s.worm = [0, 0];
      if (s.cycle) return;                         // a pose of an animation: plain on and off, see level()
      if (s.on < 0) { s.hold = -9; return; }       // has been on all night
      if (s.snap) s.hold = s.on;                   // a segment of a chase just switches, driven by the flasher
      else if (s.struggle) {                       // tries, buzzes with the glow crawling along the glass, dies, then catches
        s.steps = [[s.on, 0.9], [s.on + 0.06, 0]];
        let t = s.on + 0.14; const end = s.on + s.struggle - 0.1;
        while (t < end) { const on = r.range(0.035, 0.085); s.steps.push([t, r.range(0.35, 0.95)], [t + on, r.range(0, 0.12)]); t += on + r.range(0.03, 0.07); }
        s.steps.push([end, 0]); s.worm = [s.on + 0.12, end]; s.hold = s.on + s.struggle;
      } else { const pat = strikes[(i * 3 + 1) % strikes.length]; s.steps = pat.map(([dt, v]) => [s.on + dt, v]); s.hold = s.on + pat[pat.length - 1][0] + 0.07 + r.range(0, 0.03); }
      // every time a tube snaps on it makes a noise: collect those moments for the score
      let was = 0;
      for (let k = 0; k < s.steps.length; k++) { const [ts, v] = s.steps[k]; if (v > 0.3 && was <= 0.3) zaps.push({ t: ts, dur: (s.steps[k + 1] ? s.steps[k + 1][0] : s.hold) - ts, x: s.x, v, s }); was = v; }
      zaps.push({ t: s.hold, dur: 0.14, x: s.x, v: 1, hold: true, s });
    });
    return Object.assign(plan, { zaps });
  }
  function level(s, t) {
    if (s.cycle) { const [t0, step, n, k] = s.cycle; return t >= t0 && Math.floor((t - t0) / step) % n === k ? 1 : 0; }
    if (t >= s.off) return 0.5 * Math.exp(-(t - s.off) / 0.04);
    if (t >= s.hold) {
      // once the whole light path is lit, a brighter pulse keeps running along it, segment after segment
      const p = s.order != null && t >= T.pulse ? 0.55 * Math.max(0, 1 - Math.abs(((t - T.pulse) / T.pulseStep) % T.pulseLoop - s.order * 1.4) / 1.6) : 0;
      return 1 + 0.4 * Math.exp(-(t - s.hold) / 0.28) + p;
    }
    let v = 0; for (const st of s.steps) { if (t < st[0]) break; v = st[1]; }
    return v;
  }

  registerStyle({
    id: 'neon-sign',
    name: 'Neon Sign',
    family: 'Flat content made physical',
    look: 'A line drawing bent out of real glass tube and mounted on a painted brick wall at night: bright cores, coloured gas, black-painted returns into rubber boots, clear standoffs, every unlit tube waiting as milky glass. Small tube lettering for captions. Wet ground at the foot of the wall mirrors the end of it.',
    motion: 'Neon never fades and never slides. A section snaps on, drops out and snaps again before it holds a touch over-bright and settles; one tube buzzes with the glow crawling along the glass before it catches. Things move the way real animated signs do it: by swapping between sets of tubes (pose A, pose B, pose C) and by lighting the segments of a path one after another, so light appears to travel.',
    light: 'The tubes are the only real light: each one throws its own colour on the brick, hot right behind the glass and falling off across the wall, and every flicker moves the whole scene. A faint cold street light keeps the unlit glass readable.',
    materials: 'Milky glass tube, semi-gloss paint over rough brick with soot and rain streaks, black rubber and matte blockout paint, clear acrylic standoffs, galvanised conduit, wet asphalt with puddles.',
    camera: 'Long lens, one slow continuous crane. It starts a little oblique so the glass stands off the wall, drifts in on the part of the drawing that is lighting, then follows the light down the wall and settles low and square on the result, over its reflection in the wet ground. It is still drifting on the last frame.',
    post: 'Wide soft bloom from the over-bright cores, filmic contrast with deep blacks, slight depth of field, light vignette, fine grain, a trace of chromatic aberration.',
    explains: 'How something works, as a diagram that switches on in the order it happens: light, electricity, signals, water, traffic, money, a recipe, a journey. A beat is a group of tubes that strikes on because the one before it did. Outlines are the things, a chase of short segments is whatever flows between them, alternating poses are whatever repeats (rain, flames, wheels, a heartbeat), and colour carries meaning, so use it for the part of the idea that really is about colour, state or category. One small tube caption per beat names what just lit; the last thing to light is the result, and it holds.',
    topic: 'How a rainbow forms',
    duration: DURATION,
    fonts: [],
    render: { samples: 36, shutter: 0.4, tone: 'filmic', exposure: 1.0, bloom: 0.75, bloomThreshold: 1.25, vignette: 0.4, grain: 0.011, ca: 0.0012, fov: 30, background: '#020203' },

    build(S) {
      const { THREE, K, scene, camera, renderer } = S;
      const plan = schedule(K), { sections, tubes } = plan, rnd = K.rng(3);
      const col = (hex) => new THREE.Color(hex);
      const add = (geo, mat, x = 0, y = 0, z = 0, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; scene.add(m); return m; };

      // ------------------------------------------------------------ night: almost nothing but the sign
      K.env(S, { top: '#05070b', horizon: '#0a0d13', bottom: '#020203', intensity: 0.7, panels: [
        { pos: [-16, 9, 14], size: [2, 2], color: '#ffd9a8', power: 9 },      // a far street lamp, only there to glint on glass and water
        { pos: [10, 12, 16], size: [8, 3], color: '#8fa9d6', power: 1.2 },
      ] });
      K.spot(S, { pos: [-9, 13, 11], target: [0, 5.5, 0], color: '#93a9cf', power: 400, angle: 0.72, penumbra: 1, soft: 0.5 });
      scene.fog = new THREE.FogExp2('#020203', 0.012);

      // ------------------------------------------------------------ the wall: semi-gloss paint over brick
      const TW = 4096, TH = 2048, NX = 18, NY = 26, BW = TW / NX, BH = TH / NY, MORTAR = 10;
      const bricks = [];
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) bricks.push({ x: (i + (j % 2) * 0.5) * BW, y: j * BH, tone: rnd.range(-1, 1), lift: rnd.range(-1, 1) });
      const eachBrick = (ctx, fn) => bricks.forEach((b) => { for (const dx of [0, -TW]) { ctx.save(); ctx.translate(b.x + dx, b.y); fn(b); ctx.restore(); } });
      const brickPath = (ctx, inset) => { ctx.beginPath(); ctx.roundRect(MORTAR / 2 + inset, MORTAR / 2 + inset, BW - MORTAR - inset * 2, BH - MORTAR - inset * 2, 5); };
      const wallMap = K.canvasTex(TW, TH, (ctx) => {
        ctx.fillStyle = '#35322f'; ctx.fillRect(0, 0, TW, TH);                                   // mortar, painted over and dirty
        eachBrick(ctx, (b) => { ctx.fillStyle = `hsl(${24 + b.tone * 8}, 5%, ${27 + b.tone * 2.6}%)`; brickPath(ctx, 0); ctx.fill(); });
        for (let i = 0; i < 260; i++) {                                                          // patchy repaints and soot
          const x = rnd() * TW, y = rnd() * TH, s = rnd.range(80, 420), g = ctx.createRadialGradient(x, y, 0, x, y, s);
          g.addColorStop(0, rnd.chance(0.6) ? 'rgba(10,9,8,0.16)' : 'rgba(120,112,100,0.07)'); g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g; ctx.fillRect(x - s, y - s, s * 2, s * 2);
        }
        for (let i = 0; i < 70; i++) {                                                           // rain streaks running down
          const x = rnd() * TW, y = rnd() * TH, h = rnd.range(200, 700), w = rnd.range(8, 30), g = ctx.createLinearGradient(0, y, 0, y + h);
          g.addColorStop(0, 'rgba(8,8,8,0.22)'); g.addColorStop(1, 'rgba(8,8,8,0)'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
        }
        for (let i = 0; i < 26000; i++) { ctx.fillStyle = rnd.chance(0.5) ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.035)'; ctx.fillRect(rnd() * TW, rnd() * TH, rnd.range(1, 4), rnd.range(1, 4)); }
      }, { repeat: [3, 3] });
      const wallBump = K.canvasTex(TW, TH, (ctx) => {
        ctx.fillStyle = '#3a3a3a'; ctx.fillRect(0, 0, TW, TH);
        ctx.filter = 'blur(3px)';
        eachBrick(ctx, (b) => { const v = 150 + b.lift * 34; ctx.fillStyle = `rgb(${v},${v},${v})`; brickPath(ctx, 1); ctx.fill(); });
        ctx.filter = 'none';
        for (let i = 0; i < 60000; i++) { const v = rnd.chance(0.5) ? 0 : 255; ctx.fillStyle = `rgba(${v},${v},${v},0.07)`; ctx.fillRect(rnd() * TW, rnd() * TH, rnd.range(1, 5), rnd.range(1, 5)); }   // pitted brick under the paint
      }, { data: true, repeat: [3, 3] });
      const wallRough = K.canvasTex(TW / 2, TH / 2, (ctx) => {   // roughness lives in the green channel: paint is satin, mortar is dull
        ctx.scale(0.5, 0.5); ctx.fillStyle = 'rgb(0,225,0)'; ctx.fillRect(0, 0, TW, TH);
        eachBrick(ctx, (b) => { ctx.fillStyle = `rgb(0,${118 + b.tone * 22},0)`; brickPath(ctx, 2); ctx.fill(); });
      }, { data: true, repeat: [3, 3] });
      const wallMat = new THREE.MeshStandardMaterial({ map: wallMap, bumpMap: wallBump, bumpScale: 2.2, roughnessMap: wallRough, roughness: 1, metalness: 0 });

      // Light on the wall right behind the glass. Point lights cannot draw the shape of a tube, so the near glow is a
      // light map: every section has a blurred picture of its own tubes (a sprite), and on every update the sprites
      // are added up, each times its section's colour and current brightness, into one float texture that the wall
      // adds to its diffuse light. Any number of sections can flicker for the price of one texture read.
      const GLOW = { x: -8, y: -1, w: 16, h: 14, px: 48, res: 72, pad: 1.7, gain: 20 };
      const glowRT = new THREE.WebGLRenderTarget(GLOW.w * GLOW.res, GLOW.h * GLOW.res, { type: THREE.HalfFloatType, depthBuffer: false });
      const glowScene = new THREE.Scene(), glowCam = new THREE.OrthographicCamera(GLOW.x, GLOW.x + GLOW.w, GLOW.y + GLOW.h, GLOW.y, -1, 1);
      glowScene.background = new THREE.Color(0x000000);
      for (const s of sections) {
        const bx = s.box[0] - GLOW.pad, by = s.box[1] - GLOW.pad, bw = s.box[2] - s.box[0] + GLOW.pad * 2, bh = s.box[3] - s.box[1] + GLOW.pad * 2, k = s.r / 0.055;   // thin tubes throw less light
        const tex = K.canvasTex(Math.ceil(bw * GLOW.px), Math.ceil(bh * GLOW.px), (ctx, w, h) => {
          const line = document.createElement('canvas'); line.width = w; line.height = h; const lc = line.getContext('2d');
          ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h); ctx.globalCompositeOperation = 'lighter';
          for (const [sigma, width, alpha] of [[0.07, 0.13, 0.5], [0.2, 0.32, 0.34], [0.5, 0.85, 0.22]]) {   // tight core, soft shoulder, wide skirt
            lc.clearRect(0, 0, w, h); lc.strokeStyle = '#fff'; lc.lineCap = lc.lineJoin = 'round'; lc.lineWidth = width * GLOW.px * Math.max(0.5, k);
            for (const tb of s.tubes) { lc.beginPath(); tb.pts.forEach((p, i) => lc[i ? 'lineTo' : 'moveTo']((p[0] - bx) * GLOW.px, (by + bh - p[1]) * GLOW.px)); if (tb.closed) lc.closePath(); lc.stroke(); }
            ctx.filter = `blur(${sigma * GLOW.px}px)`; ctx.globalAlpha = alpha * Math.min(1, k); ctx.drawImage(line, 0, 0);
          }
        }, { data: true });
        s.spill = new THREE.Vector3();
        const sprite = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), new THREE.ShaderMaterial({
          uniforms: { map: { value: tex }, uColor: { value: s.spill } }, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true,
          vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
          fragmentShader: 'uniform sampler2D map; uniform vec3 uColor; varying vec2 vUv; void main(){ float a = texture2D(map, vUv).r; gl_FragColor = vec4(uColor * a * a, 1.0); }',   // stored as a square root: finer steps in the dark
        }));
        sprite.position.set(bx + bw / 2, by + bh / 2, 0); glowScene.add(sprite);
      }
      wallMat.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, { tGlow: { value: glowRT.texture }, uGlowBox: { value: new THREE.Vector4(GLOW.x, GLOW.y, GLOW.w, GLOW.h) } });
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vWallXY;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWallXY = (modelMatrix * vec4(transformed, 1.0)).xy;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tGlow; uniform vec4 uGlowBox; varying vec2 vWallXY;')
          .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
          { vec2 g = (vWallXY - uGlowBox.xy) / uGlowBox.zw;
            if (g.x > 0.0 && g.x < 1.0 && g.y > 0.0 && g.y < 1.0) reflectedLight.directDiffuse += diffuseColor.rgb * texture2D(tGlow, g).rgb; }`);
      };
      add(new THREE.PlaneGeometry(48, 24), wallMat, 0, 10, 0, false);

      // ------------------------------------------------------------ wet ground: a real mirror, crisp in the puddles, dull between them
      const pn = K.noise(4);
      const puddles = K.canvasTex(768, 768, (ctx, w, h) => {   // r = standing water, g/b = small ripple offsets for the damp asphalt
        const im = ctx.createImageData(w, h);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const u = x / w * 24, v = y / h * 24, i = (y * w + x) * 4;
          im.data[i] = 255 * K.smooth(-0.04, 0.1, pn.fbm(u * 0.33, v * 0.22, 0, 4) + 0.1 * pn.n2(u * 1.7, v * 1.7));
          im.data[i + 1] = 128 + 127 * pn.fbm(u * 3.1, v * 3.1, 5, 3) * 1.6; im.data[i + 2] = 128 + 127 * pn.fbm(u * 3.1, v * 3.1, 9, 3) * 1.6; im.data[i + 3] = 255;
        }
        ctx.putImageData(im, 0, 0);
      }, { data: true });
      puddles.flipY = false;
      const grit = K.canvasTex(512, 512, (ctx, w, h) => { ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { const v = rnd.chance(0.5) ? 0 : 255; ctx.fillStyle = `rgba(${v},${v},${v},${rnd.range(0.05, 0.3)})`; ctx.beginPath(); ctx.arc(rnd() * w, rnd() * h, rnd.range(0.6, 2.6), 0, 7); ctx.fill(); } }, { data: true, repeat: [44, 44] });
      const floor = K.mirrorFloor(S, { y: 0, color: '#0d0e10', roughness: 0.12, strength: 1, fresnel: true, surfaceRoughness: 0.42, material: { bumpMap: grit, bumpScale: 0.6 } });
      // Puddles. K.mirrorFloor reflects with one strength everywhere, so this adds a correction right after the kit's
      // own mirror code: it reads the mirror again, rippled and blurred where the ground is only damp, and swaps that in.
      // It depends on names the kit's mirror shader declares (tMirror, vMirrorCoord, vMirrorWorld, uMirrorBlur, mRefl, mK)
      // and on three's '#include <common>' and '#include <opaque_fragment>'. If any of them is gone the patch is skipped
      // and the floor stays the kit's plain mirror, turned down a little so it still reads as wet ground.
      const kitCompile = floor.material.onBeforeCompile, mirror = S.mirrors[S.mirrors.length - 1];
      floor.material.onBeforeCompile = (sh, rdr) => {
        kitCompile(sh, rdr);
        const frag = sh.fragmentShader, names = ['tMirror', 'vMirrorCoord', 'vMirrorWorld', 'uMirrorBlur', 'mRefl', 'mK'];
        if (!names.every((n) => new RegExp('\\b' + n + '\\b').test(frag)) || !frag.includes('#include <common>') || !frag.includes('#include <opaque_fragment>')) {
          if (mirror && mirror.u && mirror.u.uMirrorStrength) mirror.u.uMirrorStrength.value = 0.6;
          console.warn('neon-sign: the kit mirror shader changed, puddles skipped (plain mirror floor)');
          return;
        }
        sh.uniforms.tPuddle = { value: puddles };
        sh.fragmentShader = frag.replace('#include <common>', '#include <common>\nuniform sampler2D tPuddle;').replace('#include <opaque_fragment>', `{
          vec4 pud = texture2D(tPuddle, (vMirrorWorld.xz + vec2(12.0, 4.0)) / 24.0);
          vec4 mc = vMirrorCoord; mc.xy += (pud.gb - 0.5) * mc.w * 0.02 * (1.0 - pud.r);
          vec3 damp = min(texture2DProj(tMirror, mc, uMirrorBlur + (1.0 - pud.r) * 2.6).rgb, vec3(12.0));
          outgoingLight += (damp * mix(0.34, 1.0, pud.r) - mRefl) * mK; }
          #include <opaque_fragment>`);
      };

      // ------------------------------------------------------------ glass
      // One material per section. Unlit it is milky coated glass; lit, the middle of the tube burns hot and the rim
      // keeps the gas colour. uWorm makes bands of glow crawl along the glass (a tube that will not catch).
      const glass = (key) => {
        const [gas, core] = COLORS[key], hot = SPECTRUM.includes(key) ? 1.6 : 2.4;   // a white-hot core would bleach the six colours
        const m = new THREE.MeshPhysicalMaterial({ color: '#a39f98', roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.12 });
        const u = m.userData.u = { uOn: { value: 0 }, uWorm: { value: 0 }, uPhase: { value: 0 }, uGas: { value: col(gas).multiplyScalar(1.9) }, uCore: { value: col(core).multiplyScalar(hot) } };
        m.onBeforeCompile = (sh) => {
          Object.assign(sh.uniforms, u);
          sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vAlong;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvAlong = uv.x;');
          sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uOn, uWorm, uPhase; uniform vec3 uGas, uCore; varying float vAlong;')
            .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
            float facing = saturate(dot(normal, normalize(vViewPosition)));
            float crawl = 1.0 - uWorm * (0.5 + 0.5 * sin(vAlong * 24.0 - uPhase)) * 0.92;
            totalEmissiveRadiance += mix(uGas, uCore, pow(facing, 2.6)) * uOn * crawl;`);
        };
        return m;
      };
      // a flat centre-line becomes glass: lifted off the wall, both ends turned back toward it. A closed loop is cut
      // (at its lowest point, or nearest to `cut`), because a real tube needs two ends.
      const bend = (tb) => {
        const rb = tb.radius * (tb.radius < 0.03 ? 1.15 : 1.5), zt = tb.lift;
        let P = tb.pts.map((p) => [p[0], p[1]]);
        if (tb.loop) return { pts: P.map((p) => [p[0], p[1], zt]), ends: [[P[0][0], P[0][1], zt - tb.radius]], at: () => P[0], s0: 0, s1: 0, L: STROKEFONT.length(P) };   // a ring too small to cut: one leg behind it
        if (tb.closed) { let k = 0; const d = (p) => (tb.cut ? Math.hypot(p[0] - tb.cut[0], p[1] - tb.cut[1]) : p[1]); P.forEach((p, i) => { if (d(p) < d(P[k])) k = i; }); P = P.slice(k).concat(P.slice(0, k)); P.push(P[0].slice()); }
        const cum = [0]; for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
        const L = cum[cum.length - 1];
        const at = (s) => { s = K.clamp(s, 0, L); let i = 1; while (i < P.length - 1 && cum[i] < s) i++; const u = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1); return [K.lerp(P[i - 1][0], P[i][0], u), K.lerp(P[i - 1][1], P[i][1], u)]; };
        const s0 = Math.min(rb + (tb.closed ? tb.radius * 1.2 : 0), L * 0.2), s1 = L - s0;
        const body = [at(s0)]; for (let i = 0; i < P.length; i++) if (cum[i] > s0 + 0.012 && cum[i] < s1 - 0.012) body.push(P[i]); body.push(at(s1));
        const dir = (p, q) => { const d = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1; return [(q[0] - p[0]) / d, (q[1] - p[1]) / d]; };
        const arc = (p, d) => [1, 2, 3, 4].map((k) => { const a = k * Math.PI / 8; return [p[0] + d[0] * rb * Math.sin(a), p[1] + d[1] * rb * Math.sin(a), zt - rb * (1 - Math.cos(a))]; });
        const e = Math.min(0.03, L * 0.05), head = arc(body[0], dir(at(s0 + e), at(s0))).reverse(), tail = arc(body[body.length - 1], dir(at(s1 - e), at(s1)));
        return { pts: [...head, ...body.map((p) => [p[0], p[1], zt]), ...tail], ends: [head[0], tail[3]], at, s0, s1, L };
      };
      const ends = [], posts = [];   // where the electrode boots and the standoffs go
      for (const s of sections) s.mat = glass(s.color);
      for (const tb of tubes) {
        const b = tb.bent = bend(tb), g = K.tube(b.pts, tb.radius, { segments: Math.min(400, b.pts.length * 2), radial: tb.radius < 0.03 ? 8 : 12, closed: !!tb.loop });
        const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * b.L);   // uv.x in world units along the glass, for the crawling bands
        add(g, tb.sec.mat);
        b.ends.forEach((e) => ends.push({ p: e, r: tb.radius }));
        const n = b.L < 0.9 ? 0 : Math.max(1, Math.round(b.L / 1.25));
        for (let i = 0; i < n; i++) { const sp = b.s0 + (b.s1 - b.s0) * (i + 0.5) / n, p = b.at(sp), q = b.at(sp + 0.02); posts.push({ p, a: Math.atan2(q[1] - p[1], q[0] - p[0]), z: tb.lift, r: tb.radius }); }
      }
      // black-painted returns into rubber boots at the wall (the wiring runs behind it), and clear standoffs with a clip round the glass
      const inst = (geo, mat, n) => { const m = new THREE.InstancedMesh(geo, mat, n); m.castShadow = m.receiveShadow = true; m.frustumCulled = false; scene.add(m); return m; };
      const zCyl = (r, seg = 14) => new THREE.CylinderGeometry(r, r, 1, seg).rotateX(Math.PI / 2).translate(0, 0, 0.5);   // unit length along +z from the wall
      const paint = new THREE.MeshStandardMaterial({ color: '#070707', roughness: 0.85 }), rubber = new THREE.MeshStandardMaterial({ color: '#0d0d0e', roughness: 0.55 });
      const legs = inst(zCyl(1), paint, ends.length), boots = inst(zCyl(1), rubber, ends.length), collars = inst(zCyl(1), rubber, ends.length);
      ends.forEach((e, i) => {
        K.place(legs, i, [e.p[0], e.p[1], 0.03], null, [e.r * 1.07, e.r * 1.07, Math.max(0.01, e.p[2] - 0.025)]);
        K.place(boots, i, [e.p[0], e.p[1], 0], null, [e.r * 1.75, e.r * 1.75, Math.min(0.075, e.p[2] * 0.8)]);
        K.place(collars, i, [e.p[0], e.p[1], Math.min(0.07, e.p[2] * 0.75)], null, [e.r * 1.35, e.r * 1.35, 0.03]);
      });
      const acrylic = new THREE.MeshPhysicalMaterial({ color: '#8f9aa0', roughness: 0.2, clearcoat: 1, transparent: true, opacity: 0.8 });
      const stems = inst(zCyl(1, 10), acrylic, posts.length), bases = inst(zCyl(1, 16), acrylic, posts.length), clips = inst(new THREE.TorusGeometry(1, 0.22, 8, 20).rotateY(Math.PI / 2), acrylic, posts.length);
      posts.forEach((q, i) => {
        K.place(stems, i, [q.p[0], q.p[1], 0], null, [0.017, 0.017, q.z - q.r]);
        K.place(bases, i, [q.p[0], q.p[1], 0], null, [0.05, 0.05, 0.02]);
        K.place(clips, i, [q.p[0], q.p[1], q.z], [0, 0, q.a], q.r * 1.12);
      });

      // ------------------------------------------------------------ conduit along the foot of the wall, and the leads that drop into it
      const PIPE_Y = 0.3, zinc = new THREE.MeshStandardMaterial({ color: '#4a4e52', roughness: 0.5, metalness: 0.8 }), cableMat = new THREE.MeshStandardMaterial({ color: '#0a0a0b', roughness: 0.5 });
      add(new THREE.CylinderGeometry(0.045, 0.045, 24, 16).rotateZ(Math.PI / 2), zinc, 0, PIPE_Y, 0.06);
      for (let x = -11.2; x < 12; x += 1.55) add(K.roundedBox(0.07, 0.19, 0.07, 0.015, 2), zinc, x, PIPE_Y, 0.085);
      for (const tb of tubes) if (tb.sec.feet) for (const e of tb.bent.ends) {
        const j = rnd.range(-0.03, 0.03);
        add(K.tube([[e[0], e[1], 0.06], [e[0] + j, (e[1] + PIPE_Y) / 2 + 0.04, 0.024], [e[0] + j, PIPE_Y + 0.03, 0.06]], 0.015, { segments: 14, radial: 7 }), cableMat);
        add(new THREE.CylinderGeometry(0.028, 0.028, 0.07, 10), zinc, e[0] + j, PIPE_Y + 0.06, 0.06);
      }

      // ------------------------------------------------------------ the light the tubes throw further out
      // Far glow, the ground and every glint come from real point lights. Sections share them: each lamp takes the
      // summed colour and brightness of the sections that name it, so thirty tubes cost a handful of lights.
      const lamps = {};
      for (const s of sections) if (s.lamp) { const g = lamps[s.lamp] = lamps[s.lamp] || { box: [1e9, 1e9, -1e9, -1e9], sum: new THREE.Color(), lights: [] }; g.box = [Math.min(g.box[0], s.box[0]), Math.min(g.box[1], s.box[1]), Math.max(g.box[2], s.box[2]), Math.max(g.box[3], s.box[3])]; }
      for (const g of Object.values(lamps)) {
        const n = g.box[2] - g.box[0] > 5 ? 3 : 1;
        for (let i = 0; i < n; i++) { const l = new THREE.PointLight(0xffffff, 0, 0, 2); l.position.set(K.lerp(g.box[0], g.box[2], (i + 0.5) / n), K.lerp(g.box[1], g.box[3], 0.55), 1.4); scene.add(l); g.lights.push(l); }
      }

      // ------------------------------------------------------------ camera: one continuous crane
      // A little oblique and high on the wall at first, drifting in on the drop while the ray travels, then down the
      // wall after the coloured rays to the bow and the wet ground. The last key lies after the end of the clip, so
      // the camera is still moving on the final frame.
      const cam = {
        pos: K.path([[0, [-3.2, 9.9, 11.0]], [3.3, [-1.1, 9.05, 10.2]], [6.4, [0.75, 7.3, 9.75]], [8.7, [0.6, 3.5, 10.5]], [10.0, [0.45, 1.6, 11.35]], [14.5, [0.1, 1.45, 11.0]]]),
        aim: K.path([[0, [-0.85, 9.65, 0]], [3.3, [-0.45, 8.95, 0]], [6.4, [0.2, 7.38, 0]], [8.7, [0.1, 4.3, 0]], [10.0, [0, 2.2, 0]], [14.5, [0, 2.08, 0]]]),
      };
      const tint = new THREE.Color();

      return {
        update(t) {
          for (const g of Object.values(lamps)) g.sum.setRGB(0, 0, 0);
          sections.forEach((s, i) => {
            const worm = t >= s.worm[0] && t < s.worm[1] ? 1 : 0;
            let lv = level(s, t) * s.gain * (worm ? 0.6 : 1);
            lv *= 1 + 0.035 * Math.sin(t * 41 + i * 1.7) * Math.sin(t * 13.3 + i);            // the gas never burns perfectly steady
            const u = s.mat.userData.u;
            u.uOn.value = lv; u.uWorm.value = worm; u.uPhase.value = t * 34;
            tint.set(COLORS[s.color][2]);
            s.spill.set(tint.r, tint.g, tint.b).multiplyScalar(GLOW.gain * lv);
            if (s.lamp) { const w = lv * s.length * s.r / 0.055; lamps[s.lamp].sum.r += tint.r * w; lamps[s.lamp].sum.g += tint.g * w; lamps[s.lamp].sum.b += tint.b * w; }
          });
          for (const g of Object.values(lamps)) {
            const peak = Math.max(g.sum.r, g.sum.g, g.sum.b, 1e-6);
            for (const l of g.lights) { l.color.copy(g.sum).multiplyScalar(1 / peak); l.intensity = 1.1 * Math.pow(peak, 0.8) / g.lights.length; }   // a little compressed: thirty metres of glass must not wash the wall out
          }
          // add the glow sprites up into the wall's light map for this instant
          const target = renderer.getRenderTarget(), auto = renderer.autoClear;
          renderer.autoClear = true; renderer.setRenderTarget(glowRT); renderer.render(glowScene, glowCam); renderer.setRenderTarget(target); renderer.autoClear = auto;
          const aim = cam.aim(t);
          K.look(camera, cam.pos(t), aim); K.focus(camera, aim, 0.025);
        },
      };
    },

    sound(k) {
      const K = globalThis.K, plan = schedule(K), D = DURATION, pan = (x) => K.clamp(x / 6, -0.8, 0.8);
      k.bed('room', 0, D, { gain: 1.0 });
      // the transformer hum gets a layer thicker with every section that holds
      const hum = (t, g) => { k.tone(t, { f: 120, type: 'sawtooth', dur: D - t, a: 0.06, hold: D - t - 0.5, gain: 0.008 * g, filter: 'lowpass', f2: 520, bus: 'amb' }); k.tone(t, { f: 60, dur: D - t, a: 0.06, hold: D - t - 0.5, gain: 0.03 * g, bus: 'amb' }); };
      hum(0, 1);
      for (const z of plan.zaps) {
        const s = z.s, p = pan(z.x);
        if (!z.hold) k.withMinor(() => { k.play('neon', z.t, { dur: K.clamp(z.dur, 0.04, 0.2), gain: (0.5 + 0.6 * z.v) * (s.note ? 0.4 : 1), pan: p }); k.play('tick', z.t, { gain: s.note ? 0.2 : 0.35, f: 6400, pan: p }); });
        else if (s.tick) k.play(s.name === 'bounce' ? 'tock' : 'tick', z.t, { gain: s.name === 'bounce' ? 0.9 : 0.75, f: s.name === 'bounce' ? 1500 : 2600 + s.order * 260, pan: p });   // the flasher relay stepping the ray along
        else if (s.note) k.withMinor(() => k.play('tick', z.t, { gain: 0.3, f: 5200, pan: p }));
        else {                                                  // caught: a crack, a glass tick, a low thump from the transformer
          k.play('neon', z.t, { dur: 0.1, gain: s.chime ? 0.3 : 0.5, pan: p }); k.play('tick', z.t + 0.01, { gain: 0.5, f: 5200, pan: p });
          if (s.thump) { k.play('thud', z.t, { gain: s.thump, f: 95, pan: p }); hum(z.t, s.thump); }
          if (s.chime) k.play('ding', z.t, { f: s.chime, gain: s.chimeGain, pan: p });   // each colour rings its own note
        }
      }
      const cloud = plan.sections.find((s) => s.struggle);
      k.play('buzz', cloud.worm[0], { dur: cloud.worm[1] - cloud.worm[0], gain: 0.6, f: 118, pan: pan(cloud.x) });   // the cloud's tube struggling to catch
      k.withMinor(() => { for (let n = 0, t = T.rain; t < 8.2; n++, t += T.rainStep) k.play('tick', t, { gain: 0.2 * K.clamp((8.2 - t) / 2.5), f: 3000 + (n % 3) * 180, pan: 0.4 }); });   // the relay that steps the rain, fading as the camera leaves it
      k.music('pad', T.bow, D, { bpm: 60, chords: [['A2', 'E3', 'A3', 'C#4']], gain: 1.0 });   // the bow: let the room breathe out
    },
  });
}
```
