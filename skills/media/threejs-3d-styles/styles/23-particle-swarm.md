# Particle Swarm (#23)

- **id:** `particle-swarm`
- **Category:** Flat content made physical
- **Use:** explainer
- **Reference duration:** 10 s
- **Google Fonts:** Inter
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`

## Style card

- **Look:** Sixty thousand tiny glass beads hanging in front of a matte paper wall. They pile into plump, rounded models of things (a seed, a drop, a cell, an organ, a heap) that fill most of the frame and throw a soft shadow on the wall, change colour and strain while they hold, then let go and fly on to the next formation.
- **Motion:** Beads arrive as a stream, overshoot their place and settle. A formed shape never freezes: it breathes, a colour change can run through it as a front, loose beads inside it buzz like a gas, and it can swell and tremble. When it lets go, a front crosses it or it bursts from the centre: beads are thrown outwards, curl along a flow field in ribbons and veils, then land in the next shape, with a few stragglers arriving late.
- **Light:** One soft, warm key from the upper left, like a window, so every bead has a lit side, a small glint and a shadow on its neighbours, and the whole shape drops a soft shadow on the wall. Warm fill from all round. Heat is shown as light: hot beads glow by themselves and an orange lamp comes up from below.
- **Materials:** Polished glass seed beads, uneven in size and shade, each with a sharp highlight and a glow on its far side: golden corn, blue water, white steam, cream popcorn. Matte paper wall in a deep, dull teal that all of them stand out from.
- **Camera:** Long lens with shallow focus on the shape, so beads that fly towards the camera go soft. One slow continuous dolly: close and a little to one side of the small first shape, drifting back and round to square-on while it changes, pulled back by the burst to hold the big last shape.
- **Finish:** Real motion blur and depth of field from accumulation (96 sub-renders), neutral tone mapping to keep the colours true, a touch of bloom on the glints and the hot beads only, a soft vignette, almost no grain. Captions are a crisp 2D overlay.
- **Good for:** Processes where stuff flows, gathers, splits, grows, heats up or bursts, and things that are made of many units (cells, molecules, people, grains, data points). The beads are the stuff itself: a beat is either a new formation the swarm flows into or a change that runs through a formation while it holds (it warms from one side, something inside it comes loose, it swells). Populations keep their colour and identity from start to finish, so the viewer can follow where each kind of thing ends up. One short caption per beat names what is happening; the beads never form words or numbers.

## Reference

- **Sample topic:** Why popcorn pops
- **Gallery description:** Sixty thousand tiny glass beads hanging in front of a matte paper wall. They pile into plump, rounded models of things (a seed, a drop, a cell, an organ, a heap) that fill most of the frame and throw a soft shadow on the wall, change colour and strain while they hold, then let go and fly on to the next formation.
- **Shown in the sample clip:** Why popcorn pops

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/particle-swarm.js`)

```js
{
  // ---------------------------------------------------------------- content (change this for a new topic)
  // The swarm acts out a process. It never spells anything: the beads ARE the stuff the story is about, and each beat
  // is a formation they flow into, or a change that runs through a formation while it holds (it heats up, strains,
  // lets something loose inside). The words are four small captions.
  //
  // Each target is a drawing on a 960 x 540 canvas (the frame): where the drawing is opaque the beads settle, and the
  // paint colour there becomes the bead colour. A swarm can be several populations that keep their identity through
  // the whole clip (here the corn and the water inside it): SHARE says how the beads are split, and every target gives
  // one drawing per population under `parts`. Parts stack like thick paint: a later part lies on top of the earlier ones.
  //   puff          the drawing is blown up like a balloon: every separate patch of paint becomes a smooth bulge.
  //                 1 = as thick as half its width (a round blob), less = flatter, 0 = flat
  //   body          also blow the part up as one mass underneath (gaps of a few pixels between patches are bridged),
  //                 so the patches become bumps on a heap instead of separate blobs lying side by side
  //   float         beads hover up to this far above the surface (a haze instead of a skin)
  //   restless      how far each bead buzzes around its place, times the `shake` dial
  //   glow          how strongly the beads light up by themselves, 0..1 (a number, or (x, y) => number in canvas pixels)
  //   cloud         no drawing: a loose cloud { at, size } to arrive from or to leave into
  //   swell         (per target) how much the whole shape follows the `swell` dial
  // A part drawn with the same outline in two targets gets the same bead places in both, so across that flight its
  // beads stay where they are and only change colour. That is how a formation heats up without falling apart.
  const DURATION = 10;
  const WALL = '#2a5a63';                          // the paper behind the swarm: pick one every bead colour stands out from
  const SHARE = { corn: 0.96, water: 0.04 };
  const T = { heat: 1.9, press: 4.5, pop: 6.8 };   // the three turns of the story (seconds); picture and sound both use them

  // the kernel: a round crown on top, a pointed tip at the bottom, leaning a little. s < 1 gives the space inside the hull
  const KX = 480, KY = 236, TILT = -0.16;
  const kernelPath = (ctx, s = 1) => {
    ctx.beginPath();
    for (let i = 0; i <= 160; i++) { const a = i / 160 * Math.PI * 2, c = Math.cos(a); ctx.lineTo(s * 188 * Math.sin(a) * Math.pow(Math.sin(a / 2), 0.6), s * (c > 0 ? 226 : 170) * c); }
    ctx.closePath();
  };
  const tilted = (ctx, fn) => { ctx.save(); ctx.translate(KX, KY); ctx.rotate(TILT); fn(); ctx.restore(); };
  const ramp = (ctx, y0, y1, colors) => { const g = ctx.createLinearGradient(0, y0, 0, y1); colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c)); return g; };
  // the whole kernel: body colours from crown to tip, the paler germ rising from the tip (what makes a seed look like
  // corn), a darker band just inside the outline (the hull) and the pale tip cap
  const kernel = (body, hull, cap, germ) => (ctx) => tilted(ctx, () => {
    kernelPath(ctx); ctx.fillStyle = ramp(ctx, -170, 226, body); ctx.fill();
    ctx.save(); ctx.translate(0, 113); ctx.fillStyle = germ; kernelPath(ctx, 0.5); ctx.fill(); ctx.restore();
    kernelPath(ctx); ctx.clip(); ctx.strokeStyle = hull; ctx.lineWidth = 44; ctx.stroke();
    ctx.fillStyle = cap; ctx.beginPath(); ctx.arc(0, 232, 54, 0, 7); ctx.fill();
  });
  const drop = (ctx, cx, cy, r) => {               // the water: one drop, point up
    ctx.fillStyle = ramp(ctx, cy - 2 * r, cy + r, ['#7cc4ff', '#1d7fe6', '#1463c8']); ctx.beginPath(); ctx.moveTo(cx, cy - 1.9 * r);
    ctx.bezierCurveTo(cx + 0.35 * r, cy - 1.1 * r, cx + r, cy - 0.55 * r, cx + r, cy); ctx.arc(cx, cy, r, 0, Math.PI);
    ctx.bezierCurveTo(cx - r, cy - 0.55 * r, cx - 0.35 * r, cy - 1.1 * r, cx, cy - 1.9 * r); ctx.fill();
  };
  const steam = (inner, outer) => (ctx) => tilted(ctx, () => {   // steam fills the hull, or (inner > 0) crowds against it
    ctx.fillStyle = '#f2f8ff'; kernelPath(ctx, outer); ctx.fill();
    if (inner) { ctx.globalCompositeOperation = 'destination-out'; kernelPath(ctx, inner); ctx.fill(); }
  });
  // the popped corn: fat, wobbly lobes [x, y, rx, ry, turn], drawn back to front. Each lobe first rubs out a thin ring
  // around itself, so every lobe keeps its own edge and becomes its own bulge, with a crease where two of them meet.
  const LOBES = [[212, 262, 66, 58, 0], [742, 248, 72, 62, 0], [476, 102, 78, 62, 0], [466, 404, 84, 58, 0],
    [330, 172, 114, 84, 0.49], [636, 154, 122, 88, -0.56], [304, 348, 108, 80, -0.51], [646, 358, 104, 76, 0.57],
    [410, 256, 122, 106, -0.2], [566, 246, 116, 110, 0.3], [498, 346, 54, 46, 0.2]];
  const lobe = (ctx, [x, y, rx, ry, turn], k, grow) => {
    ctx.beginPath();
    for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, w = 1 + 0.09 * Math.sin(3 * a + k * 2.4) + 0.06 * Math.sin(5 * a + k * 4.1), c = Math.cos(turn), s = Math.sin(turn), px = (rx * w + grow) * Math.cos(a), py = (ry * w + grow) * Math.sin(a); ctx.lineTo(x + px * c - py * s, y + px * s + py * c); }
    ctx.closePath(); ctx.fill();
  };
  const popcorn = (ctx) => {
    LOBES.forEach((l, k) => {
      ctx.globalCompositeOperation = 'destination-out'; lobe(ctx, l, k, 3);
      ctx.globalCompositeOperation = 'source-over';
      const [x, y, rx, ry] = l, g = ctx.createRadialGradient(x - rx * 0.15, y - ry * 0.2, ry * 0.25, x, y, rx * 1.05); g.addColorStop(0, '#ffffff'); g.addColorStop(0.8, '#fff6dc'); g.addColorStop(1, '#f5d88c');
      ctx.fillStyle = g; lobe(ctx, l, k, 0);
    });
    // what is left of the hull: two curled amber shards caught in the crease where the big lobes meet
    ctx.lineCap = 'round';
    for (const [x, y, r, a0, a1, w, c] of [[566, 246, 104, 2.75, 3.4, 13, '#a04e0a'], [410, 256, 112, -0.62, -0.3, 10, '#c06c14']]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(x, y, r, a0, a1); ctx.stroke(); }
  };
  const hotGlow = (lo, hi) => (x, y) => lo + (hi - lo) * Math.min(1, Math.max(0, (y - 60) / 400));   // hotter towards the tip, where the heat comes from

  const TARGETS = [
    { id: 'cloud', cloud: { at: [2.5, 0.8, 4.5], size: [5.5, 3.0, 3.5] } },
    { id: 'kernel', swell: 1, parts: {
      corn: { puff: 0.62, draw: kernel(['#e69612', '#f3b422', '#f8cc4c'], '#bd680e', '#f6e6b4', '#fadc80') },
      water: { puff: 0.6, restless: 0.012, draw: (ctx) => drop(ctx, KX + 12, KY - 30, 43) } } },
    { id: 'hot', swell: 1, parts: {
      corn: { puff: 0.62, glow: hotGlow(0.0, 0.8), draw: kernel(['#eb9c18', '#ee7410', '#e8440c'], '#b84a0a', '#f7a860', '#f6b040') },
      water: { puff: 0, float: 0.4, restless: 0.06, draw: steam(0, 0.8) } } },
    { id: 'strained', swell: 1, parts: {
      corn: { puff: 0.62, glow: hotGlow(0.4, 1), draw: kernel(['#f08a14', '#ee5c0e', '#e2340a'], '#b83808', '#ffb470', '#f89a30') },
      water: { puff: 0, float: 0.3, restless: 0.05, draw: steam(0.62, 0.86) } } },
    { id: 'popcorn', parts: {
      corn: { puff: 0.48, body: 0.42, glow: 0.4, draw: popcorn },
      water: { cloud: { at: [0.8, 8.5, 1.0], size: [3.0, 0.9, 0.8] } } } },      // the steam is free: up and out of the frame
  ];

  // The edit: which target the swarm goes to, and when it lets go of the one before (t0, seconds).
  //   dur      flight time of one bead. Each bead also waits its turn, so the whole move takes about spread + dur
  //   spread   how long the front takes to cross the old shape; waves > 1 lifts the beads off in that many batches
  //   wave     [dx, dy, radial]: the front travels along (dx, dy), or outwards from the centre when radial = 1.
  //            Beads that stay put change colour as the front passes: [0, 1, 0] warms a shape from below
  //   push     how far the front throws the beads downwind, flow = how far the flow field then carries them,
  //            lift = how far a few of them come towards the lens, swirl = turn of the swarm around the centre (radians)
  //   scatter  extra random wait per bead, so they leave one by one (water boiling off) instead of as a front
  //   late     extra wait of the last stragglers. Everything must have landed before the next t0.
  const FLIGHTS = [
    { to: 'kernel', t0: -1.45, dur: 1.2, spread: 0.6, waves: 3, wave: [-1, 0.3, 0], push: 1.2, flow: 1.4, lift: 5, swirl: 0.5, late: 0.5 },
    { to: 'hot', t0: T.heat, dur: 0.9, spread: 1.1, waves: 1, wave: [0, 1, 0], push: 0, flow: 0.25, lift: 0, swirl: 0, scatter: 0.6, late: 0 },
    { to: 'strained', t0: T.press, dur: 0.9, spread: 0.7, waves: 1, wave: [0, 1, 0], push: 0, flow: 0.15, lift: 0, swirl: 0, scatter: 0.5, late: 0 },
    { to: 'popcorn', t0: T.pop, dur: 1.05, spread: 0.14, waves: 1, wave: [0, 0, 1], push: 0.9, flow: 0.45, lift: 2, swirl: 0.2, late: 0.4 },
  ];

  // Dials: things that change over time while a formation holds. All are plain functions of t.
  const DIALS = {
    // strain: the shape grows from its centre, trembling harder and harder, with one last heave before it gives
    swell: (t) => { const u = K.seg(t, T.press, T.pop); return 0.075 * Math.pow(u, 1.4) + 0.011 * u * u * Math.sin(t * 2 * Math.PI * 9) + 0.05 * K.seg(t, T.pop - 0.22, T.pop, K.ease.in); },
    shake: (t) => K.seg(t, T.heat - 0.3, T.heat + 0.8) * (1 + 1.3 * K.seg(t, T.press, T.pop)),       // calm, simmering, frantic
    heat: (t) => K.seg(t, T.heat - 0.4, T.heat + 1.2, K.ease.inOut) * (1 + 0.5 * K.seg(t, T.press, T.pop)) * (1 - 0.8 * K.seg(t, T.pop, T.pop + 1.6, K.ease.out)),   // the glow from below
  };

  // One short line per beat. They name what the picture is doing and are never the subject.
  const CAPTIONS = [
    { t0: 0.25, t1: T.heat - 0.05, text: 'Every popcorn kernel holds a little water' },
    { t0: T.heat + 0.2, t1: T.press - 0.05, text: 'Heat turns that water into steam' },
    { t0: T.press + 0.2, t1: T.pop - 0.1, text: 'The hard hull holds it in, so pressure builds' },
    { t0: T.pop + 0.8, t1: 99, text: 'At about 180 °C the hull bursts and the starch puffs out' },
  ];

  registerStyle({
    id: 'particle-swarm',
    name: 'Particle Swarm',
    family: 'Flat content made physical',
    look: 'Sixty thousand tiny glass beads hanging in front of a matte paper wall. They pile into plump, rounded models of things (a seed, a drop, a cell, an organ, a heap) that fill most of the frame and throw a soft shadow on the wall, change colour and strain while they hold, then let go and fly on to the next formation.',
    motion: 'Beads arrive as a stream, overshoot their place and settle. A formed shape never freezes: it breathes, a colour change can run through it as a front, loose beads inside it buzz like a gas, and it can swell and tremble. When it lets go, a front crosses it or it bursts from the centre: beads are thrown outwards, curl along a flow field in ribbons and veils, then land in the next shape, with a few stragglers arriving late.',
    light: 'One soft, warm key from the upper left, like a window, so every bead has a lit side, a small glint and a shadow on its neighbours, and the whole shape drops a soft shadow on the wall. Warm fill from all round. Heat is shown as light: hot beads glow by themselves and an orange lamp comes up from below.',
    materials: 'Polished glass seed beads, uneven in size and shade, each with a sharp highlight and a glow on its far side: golden corn, blue water, white steam, cream popcorn. Matte paper wall in a deep, dull teal that all of them stand out from.',
    camera: 'Long lens with shallow focus on the shape, so beads that fly towards the camera go soft. One slow continuous dolly: close and a little to one side of the small first shape, drifting back and round to square-on while it changes, pulled back by the burst to hold the big last shape.',
    post: 'Real motion blur and depth of field from accumulation (96 sub-renders), neutral tone mapping to keep the colours true, a touch of bloom on the glints and the hot beads only, a soft vignette, almost no grain. Captions are a crisp 2D overlay.',
    explains: 'Processes where stuff flows, gathers, splits, grows, heats up or bursts, and things that are made of many units (cells, molecules, people, grains, data points). The beads are the stuff itself: a beat is either a new formation the swarm flows into or a change that runs through a formation while it holds (it warms from one side, something inside it comes loose, it swells). Populations keep their colour and identity from start to finish, so the viewer can follow where each kind of thing ends up. One short caption per beat names what is happening; the beads never form words or numbers.',
    topic: 'Why popcorn pops',
    duration: DURATION,
    fonts: ['600 50px "Inter"'],
    render: { samples: 96, shutter: 0.45, tone: 'neutral', exposure: 1.0, bloom: 0.25, bloomThreshold: 1.3, vignette: 0.4, grain: 0.004, fov: 30, background: WALL },

    build(S) {
      const { THREE, K, scene, camera, renderer } = S;
      const TW = 256, TH = 240, N = TW * TH;     // 61,440 beads; bead i lives at texel (i % TW, i / TW) of every data texture
      const FW = 32 / 3, FH = 6, UNIT = 90;      // the 960 x 540 drawing covers 10.67 x 6 world units
      const RADIUS = 0.026;
      const PARTS = Object.keys(SHARE), COUNT = PARTS.map((id) => Math.round(N * SHARE[id]));
      COUNT[0] += N - COUNT.reduce((a, b) => a + b, 0);

      // ---------------------------------------------------------------- 1. drawings -> bead positions
      // For every part: read the drawing back, blow it up into a bulge (that becomes thickness), spread the part's
      // beads evenly over the ink, and sort them left to right so a bead keeps roughly its place from one target to
      // the next: neighbours stay neighbours, which is what makes the swarm move in ribbons, not as static. The
      // random numbers depend only on the part, so the same outline gives the same places.
      const W = 960, H = 540, HW = W / 2, HH = H / 2;
      // Inflation: solve "curvature = constant, height 0 at the edge" on the inked pixels (at half resolution, by
      // over-relaxation) and take the square root. A disc becomes exactly half a ball, any other patch a smooth
      // balloon of the same kind, without the ridges a distance-to-edge profile would leave. World units.
      function inflate(px, bridge = 0) {
        let m = new Uint8Array(HW * HH), x0 = HW, x1 = 0, y0 = HH, y1 = 0; const u = new Float32Array(HW * HH);
        for (let y = 1; y < HH - 1; y++) for (let x = 1; x < HW - 1; x++) {
          const i = (2 * y * W + 2 * x) * 4 + 3;
          if (px[i] > 127 && px[i + 4] > 127 && px[i + W * 4] > 127 && px[i + W * 4 + 4] > 127) { m[y * HW + x] = 1; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
        }
        for (let b = 0; b < bridge; b++) {            // grow the mask by a pixel: closes thin gaps, so the patches count as one
          const g = m.slice(); x0 = Math.max(1, x0 - 1); y0 = Math.max(1, y0 - 1); x1 = Math.min(HW - 2, x1 + 1); y1 = Math.min(HH - 2, y1 + 1);
          for (let y = y0; y <= y1; y++) for (let x = x0, i = y * HW + x0; x <= x1; x++, i++) if (m[i - 1] || m[i + 1] || m[i - HW] || m[i + HW]) g[i] = 1;
          m = g;
        }
        for (let n = 0; n < 500; n++) for (let y = y0; y <= y1; y++) for (let x = x0, i = y * HW + x0; x <= x1; x++, i++) if (m[i]) u[i] += 1.93 * ((u[i - 1] + u[i + 1] + u[i - HW] + u[i + HW]) / 4 + 1 - u[i]);
        return (i) => 2 * Math.sqrt(u[(Math.floor(i / W) >> 1) * HW + ((i % W) >> 1)]) / UNIT;
      }
      function sample(tg) {
        const top = new Float32Array(W * H), box = [1e9, 1e9, -1e9, -1e9], all = [];
        PARTS.forEach((id, pi) => {
          const part = tg.parts ? tg.parts[id] : tg, n = COUNT[pi], r = K.rng(20 + pi), pts = [];
          if (part.cloud) {
            const { at, size } = part.cloud;
            for (let i = 0; i < n; i++) pts.push({ x: at[0] + r.gauss() * size[0], y: at[1] + r.gauss() * size[1], z: at[2] + r.gauss() * size[2], w: -r.range(0.3, 0.9), c: null, g: 0 });
          } else {
            const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
            const ctx = cv.getContext('2d', { willReadFrequently: true }); part.draw(ctx, W, H);
            const px = ctx.getImageData(0, 0, W, H).data, ink = [];
            for (let i = 0; i < W * H; i++) if (px[i * 4 + 3] > 127) ink.push(i);
            const bulge = part.puff ? inflate(px) : () => 0, whole = part.body ? inflate(px, 3) : () => 0, height = (i) => (part.puff || 0) * bulge(i) + (part.body || 0) * whole(i);
            // an even spread: every inked pixel gets n / ink.length beads, the fraction decided by a low-discrepancy dither
            const per = n / ink.length, picks = [];
            for (const i of ink) { let m = Math.floor(per + ((i % W) * 0.7548776662 + Math.floor(i / W) * 0.5698402909) % 1); while (m-- > 0) picks.push(i); }
            for (let i = picks.length - 1; i > 0; i--) { const j = r.int(0, i); [picks[i], picks[j]] = [picks[j], picks[i]]; }
            while (picks.length < n) picks.push(r.pick(ink));
            for (let k = 0; k < n; k++) {
              const i = picks[k], x = (i % W) + r(), y = Math.floor(i / W) + r(), h = height(i);
              // most beads sit in the skin of the bulge (the part you see), the rest fill it in behind. `top` is the
              // surface of the parts drawn before this one, so this part lies on them
              const z = top[i] + h - Math.min(h, 0.5) * Math.pow(r(), 3) + (part.float || 0) * r();
              pts.push({ x: x / UNIT - FW / 2, y: FH / 2 - y / UNIT, z, w: part.restless || 0, c: [px[i * 4], px[i * 4 + 1], px[i * 4 + 2]], g: typeof part.glow === 'function' ? part.glow(x, y) : part.glow || 0 });
            }
            for (const i of ink) { top[i] += height(i); const x = i % W, y = Math.floor(i / W); box[0] = Math.min(box[0], x); box[1] = Math.min(box[1], y); box[2] = Math.max(box[2], x); box[3] = Math.max(box[3], y); }
          }
          for (const p of pts) p.key = p.x + 0.45 * r.gauss();
          all.push(...pts.sort((a, b) => a.key - b.key));
        });
        // the shape's middle and half-size in world units (fronts and the swell are measured from them); a cloud counts as the whole frame
        const drawn = box[2] > box[0], cx = drawn ? (box[0] + box[2]) / 2 : W / 2, cy = drawn ? (box[1] + box[3]) / 2 : H / 2;
        const hx = drawn ? (box[2] - box[0]) / 2 / UNIT : FW / 2, hy = drawn ? (box[3] - box[1]) / 2 / UNIT : FH / 2;
        return { pts: all, centre: [(cx - W / 2) / UNIT, (H / 2 - cy) / UNIT, 0], half: [hx, hy, drawn ? Math.max(hx, hy) : 3] };
      }
      const pos = new Float32Array(N * TARGETS.length * 4), col = new Uint8Array(N * TARGETS.length * 4);
      const sets = TARGETS.map(sample);
      sets.forEach((set, k) => set.pts.forEach((p, i) => {
        const o = (k * N + i) * 4, c = p.c || (k + 1 < sets.length && sets[k + 1].pts[i].c) || sets[k - 1].pts[i].c;   // a cloud borrows the colours of the next target (or the one before)
        pos[o] = p.x; pos[o + 1] = p.y; pos[o + 2] = p.z; pos[o + 3] = p.w;
        col[o] = c[0]; col[o + 1] = c[1]; col[o + 2] = c[2]; col[o + 3] = Math.round(255 * Math.min(1, Math.max(0, p.g)));
      }));
      // both textures stack the targets: target k is rows k * TH .. (k + 1) * TH. Places: xyz, w = restless (or, negative,
      // the drift of a cloud bead). Colours: rgb = paint, a = glow.
      const posTex = new THREE.DataTexture(pos, TW, TH * TARGETS.length, THREE.RGBAFormat, THREE.FloatType); posTex.needsUpdate = true;
      const colTex = new THREE.DataTexture(col, TW, TH * TARGETS.length, THREE.RGBAFormat, THREE.UnsignedByteType); colTex.colorSpace = THREE.SRGBColorSpace; colTex.needsUpdate = true;
      const index = (id) => TARGETS.findIndex((tg) => tg.id === id);

      // ---------------------------------------------------------------- 2. the motion: where bead i is at time t
      // A small render pass writes every bead's position into a float texture, once per sub-frame. It is a pure
      // function of (bead, time): nothing is stepped or remembered, so any frame can be rendered alone, and motion
      // blur falls out of the stage calling update() at many sub-frame times.
      const U = {
        uTargets: { value: posTex }, uColors: { value: colTex }, uFrom: { value: 0 }, uTo: { value: 1 }, uTime: { value: 0 },
        uT0: { value: 0 }, uDur: { value: 1 }, uSpread: { value: 0.3 }, uWave: { value: new THREE.Vector3() }, uFlow: { value: 1 }, uLift: { value: 1 }, uSwirl: { value: 0 }, uLate: { value: 0.5 }, uScatter: { value: 0 }, uPush: { value: 1 }, uWaves: { value: 3 }, uSeed: { value: 0 },
        uCa: { value: new THREE.Vector3() }, uCb: { value: new THREE.Vector3() }, uHalfA: { value: new THREE.Vector3() }, uSwellA: { value: 0 }, uSwellB: { value: 0 }, uShake: { value: 0 },
      };
      const motion = new THREE.ShaderMaterial({ uniforms: U, depthTest: false, depthWrite: false, vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }', fragmentShader: `
        precision highp float; precision highp int; precision highp sampler2D;
        uniform sampler2D uTargets; uniform int uFrom, uTo;
        uniform float uTime, uT0, uDur, uSpread, uFlow, uLift, uSwirl, uLate, uScatter, uPush, uWaves, uSeed, uSwellA, uSwellB, uShake; uniform vec3 uWave, uCa, uCb, uHalfA;
        float hash(float n){ return fract(sin(n * 12.9898) * 43758.5453); }
        // simplex noise with its gradient (Ian McEwan / Stefan Gustavson, MIT), used to build a swirling flow field
        vec4 permute(vec4 x){ x = ((x * 34.0) + 1.0) * x; return x - floor(x / 289.0) * 289.0; }
        float snoise(vec3 v, out vec3 grad){
          const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i = floor(v + dot(v, C.yyy)), x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz), l = 1.0 - g, i1 = min(g.xyz, l.zxy), i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + C.xxx, x2 = x0 - i2 + C.yyy, x3 = x0 - D.yyy;
          i = i - floor(i / 289.0) * 289.0;
          vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          vec3 ns = 0.142857142857 * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z), x_ = floor(j * ns.z), y_ = floor(j - 7.0 * x_);
          vec4 x = x_ * ns.x + ns.yyyy, y = y_ * ns.x + ns.yyyy, h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy), b1 = vec4(x.zw, y.zw), s0 = floor(b0) * 2.0 + 1.0, s1 = floor(b1) * 2.0 + 1.0, sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy, a1 = b1.xzyw + s1.xzyw * sh.zzww;
          vec3 p0 = vec3(a0.xy, h.x), p1 = vec3(a0.zw, h.y), p2 = vec3(a1.xy, h.z), p3 = vec3(a1.zw, h.w);
          vec4 norm = 1.79284291400159 - 0.85373472095314 * vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3));
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0), m2 = m * m, m4 = m2 * m2;
          vec4 pdx = vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)), tmp = m2 * m * pdx;
          grad = 42.0 * (-8.0 * (tmp.x * x0 + tmp.y * x1 + tmp.z * x2 + tmp.w * x3) + m4.x * p0 + m4.y * p1 + m4.z * p2 + m4.w * p3);
          return 42.0 * dot(m4, pdx);
        }
        // curl of a noise potential: a field without sources or sinks, so beads swirl along it instead of bunching up
        vec3 curl(vec3 p){
          vec3 a, b, c; snoise(p, a); snoise(p + vec3(31.4, 17.2, 47.9), b); snoise(p + vec3(-23.7, 61.1, 9.3), c);
          return vec3(c.y - b.z, a.z - c.x, b.x - a.y);
        }
        // where a bead rests while it belongs to a target: its place, pushed out from the centre when the shape swells,
        // riding a slow wave so the shape breathes, buzzing around if it is restless, and shivering a little on its own
        vec3 rest(vec4 T, vec3 c, float swell, float t, vec4 rnd){
          vec3 p = T.xyz;
          if (T.w < 0.0) return p - T.w * sin(t * vec3(0.37, 0.29, 0.23) + rnd.xyz * 6.283);   // a cloud bead just drifts
          p += (p - c) * swell;
          p.z += 0.035 * sin(dot(p.xy, vec2(0.9, 0.6)) - t * 1.3);
          p.xy += 0.012 * sin(p.yx * 1.7 + t * vec2(0.9, 1.1));
          p += T.w * uShake * (sin(t * (4.0 + 6.0 * rnd.xyz) + rnd.yzw * 40.0) + 0.6 * sin(t * (10.0 + 7.0 * rnd.zxy) + rnd.wxy * 23.0));
          return p + 0.003 * sin(t * (2.0 + 3.0 * rnd.xyz) + rnd.yzw * 40.0);
        }
        void main(){
          ivec2 px = ivec2(gl_FragCoord.xy);
          float id = float(px.x + px.y * ${TW});
          vec4 rnd = vec4(hash(id * 1.31 + uSeed), hash(id * 2.17 + 13.0 + uSeed), hash(id * 3.71 + 29.0), hash(id * 5.03 + 41.0));
          vec4 TA = texelFetch(uTargets, ivec2(px.x, px.y + uFrom * ${TH}), 0), TB = texelFetch(uTargets, ivec2(px.x, px.y + uTo * ${TH}), 0);
          vec3 a = rest(TA, uCa, uSwellA, uTime, rnd), b = rest(TB, uCb, uSwellB, uTime, rnd);
          float moves = smoothstep(0.0, 0.04, distance(TA.xyz, TB.xyz));   // 0 for a bead that has the same place in both targets

          // when this bead's turn comes: a front crosses the old shape (in a few waves if asked), with some disorder,
          // and a few stragglers hang back
          vec2 dir = normalize(uWave.xy + 1e-5), out2 = TA.xy - uCa.xy;
          float front = mix(clamp(dot(out2, dir) / (2.0 * dot(abs(dir), uHalfA.xy)) + 0.5, 0.0, 1.0), clamp(length(out2) / uHalfA.z, 0.0, 1.0), uWave.z);
          vec3 wind = normalize(mix(vec3(dir, 0.35), vec3(out2, 1.3), uWave.z));   // downwind: along the front, or out from behind the centre
          front += 0.06 * sin(dot(TA.xy, vec2(2.3, 1.7)) + uSeed) + 0.08 * rnd.x;
          if (uWaves > 1.5) front = (floor(front * uWaves) + smoothstep(0.0, 0.45, fract(front * uWaves))) / uWaves;
          float wait = uSpread * front + moves * uScatter * rnd.x + (rnd.y > 0.975 ? uLate * (0.4 + 0.6 * rnd.z) : 0.0);
          float u = clamp((uTime - uT0 - wait) / (uDur * mix(0.75, 1.0, rnd.w)), 0.0, 1.0);

          // along the straight line it starts slowly, then behaves like a spring: it shoots past its place and settles
          float w = pow(u, 2.2), s = 1.0 - exp(-6.5 * w) * (cos(8.67 * w) + 0.75 * sin(8.67 * w));
          s = mix(s, 1.0, smoothstep(0.85, 1.0, u));
          vec3 p = mix(a, b, s);

          // off the line: thrown downwind by the front (fast, then slowing), then carried along the streamlines of the
          // flow field. Each bead goes a different distance, so neighbours string out into ribbons. E lets go again
          // before the landing.
          float E = moves * (u < 0.3 ? 1.0 - pow(1.0 - u / 0.3, 3.0) : 1.0 - smoothstep(0.3, 0.68, u));
          float far = 0.5 + 0.5 * rnd.z, hero = pow(rnd.w, 6.0);
          float sw = uSwirl * E * far, cs = cos(sw), sn = sin(sw);
          p.xy = mat2(cs, sn, -sn, cs) * p.xy;
          p += E * wind * (uPush * far + uLift * hero);
          vec3 q = p;
          for (int i = 0; i < 3; i++) q += E * uFlow * far * 0.33 * curl(q * 0.22 + vec3(uSeed * 7.0, 0.0, uTime * 0.15));
          p = q;
          gl_FragColor = vec4(p, smoothstep(0.03, 0.45, u));   // w: how far the colour has changed to the new target's
        }` });
      const posRT = new THREE.WebGLRenderTarget(TW, TH, { type: THREE.FloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false });
      const pass = new THREE.Scene(), passCam = new THREE.Camera(); pass.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), motion));

      // ---------------------------------------------------------------- 3. the beads
      // One low-poly sphere drawn N times. The vertex shader only looks up where its bead is and what colour it has;
      // the shadow pass uses the same lookup, so beads shade each other and the wall.
      const geo = new THREE.InstancedBufferGeometry().copy(new THREE.SphereGeometry(1, 8, 6)); geo.instanceCount = N;
      const KEY = [-8.5, 8.5, 8.5];
      const BU = { uPos: { value: posRT.texture }, uColors: U.uColors, uFrom: U.uFrom, uTo: U.uTo, uRadius: { value: RADIUS }, uKey: { value: new THREE.Vector3(...KEY).normalize() }, uGlow: { value: 0.4 }, uHot: { value: 0.45 } };
      const head = `uniform sampler2D uPos, uColors; uniform int uFrom, uTo; uniform float uRadius; varying vec3 vBead; varying float vHot;
        float beadHash(float n){ return fract(sin(n * 78.233) * 43758.5453); }`;
      const body = `ivec2 bt = ivec2(gl_InstanceID % ${TW}, gl_InstanceID / ${TW}); vec4 bp = texelFetch(uPos, bt, 0);
        vec3 transformed = position * uRadius * mix(0.65, 1.0, beadHash(float(gl_InstanceID))) * (1.0 + 0.6 * pow(beadHash(float(gl_InstanceID) + 0.25), 8.0)) + bp.xyz;
        vec4 ca = texelFetch(uColors, ivec2(bt.x, bt.y + uFrom * ${TH}), 0), cb = texelFetch(uColors, ivec2(bt.x, bt.y + uTo * ${TH}), 0);
        vBead = mix(ca.rgb, cb.rgb, bp.w) * mix(0.7, 1.12, beadHash(float(gl_InstanceID) + 0.5)); vHot = mix(ca.a, cb.a, bp.w);
        vBead.g += 0.012 * pow(beadHash(float(gl_InstanceID) + 0.75), 3.0);   // a few lean towards orange`;
      const beadify = (mat, lit) => {
        mat.onBeforeCompile = (sh) => {
          Object.assign(sh.uniforms, BU);
          sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + head).replace('#include <begin_vertex>', body);
          if (!lit) return;
          // glass, not clay: the paint colour tints the bead, light that enters it comes out as a glow on the side away
          // from the lamp, and the highlight stays a sharp glint. Hot beads also glow all over. (three.js roughens tiny
          // curved surfaces to stop them sparkling; here the sparkle is the point and the sub-renders already
          // anti-alias it, so that is taken out.)
          sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vBead; varying float vHot; uniform vec3 uKey; uniform float uGlow, uHot;')
            .replace('#include <color_fragment>', 'diffuseColor.rgb *= vBead;')
            .replace('#include <emissivemap_fragment>', 'totalEmissiveRadiance += vBead * (uGlow * pow(saturate(-dot(normal, normalize((viewMatrix * vec4(uKey, 0.0)).xyz))), 1.5) + uHot * vHot);')
            .replace('#include <lights_physical_fragment>', THREE.ShaderChunk.lights_physical_fragment.replaceAll('+= geometryRoughness', '+= 0.0'));
        };
        return mat;
      };
      const beads = new THREE.Mesh(geo, beadify(new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.07 }), true));
      beads.customDepthMaterial = beadify(new THREE.MeshDepthMaterial(), false);
      beads.castShadow = beads.receiveShadow = true; beads.frustumCulled = false; scene.add(beads);

      // ---------------------------------------------------------------- 4. the room: paper wall and light
      const paper = K.canvasTex(1024, 1024, (ctx, w, h) => {
        ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, w, h); const r = K.rng(3);
        for (let i = 0; i < 26000; i++) { const v = r.int(96, 160); ctx.strokeStyle = `rgba(${v},${v},${v},0.5)`; ctx.lineWidth = r.range(0.5, 1.4); const x = r.range(0, w), y = r.range(0, h), a = r.range(0, 6.28), l = r.range(3, 16); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke(); }
      }, { data: true, repeat: [10, 6] });
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(80, 48), new THREE.MeshStandardMaterial({ color: WALL, roughness: 0.93, bumpMap: paper, bumpScale: 0.6 }));
      wall.position.z = -0.4; wall.receiveShadow = true; scene.add(wall);

      K.env(S, { top: '#c9b499', horizon: '#9c8468', bottom: '#4f3f30', intensity: 0.32, panels: [
        { pos: [-9, 8, 11], size: [11, 8], color: '#fff2df', power: 7 },      // the window the beads reflect
        { pos: [12, -2, 6], size: [1.5, 9], color: '#dfe9ff', power: 14 },       // a thin cool strip for a rim glint
      ] });
      K.spot(S, { pos: KEY, target: [-0.8, 0.8, 0], color: '#fff0dc', power: 1150, angle: 0.56, penumbra: 1, soft: 1.3, mapSize: 4096, near: 4, far: 40, bias: -0.0002, normalBias: 0.006 });
      K.skyLight(S, { color: '#ffdfbd', power: 0.5, size: 7.5, mapSize: 4096, bias: -0.0003, normalBias: 0.006 });   // soft light from everywhere, blocked in the gaps between beads
      const stove = K.spot(S, { pos: [0.4, -6.5, 4.5], target: [0, -0.6, 0], color: '#ff6a1c', power: 0, angle: 0.75, penumbra: 1, shadow: false });   // the heat, as light from below

      // ---------------------------------------------------------------- 5. camera: one slow dolly
      const cam = {
        pos: K.path([[0, [-3.4, -1.0, 10.2]], [T.heat, [-2.4, -0.8, 10.5]], [T.press, [-1.3, -0.6, 10.9]], [T.pop, [-0.2, -0.4, 11.9]], [T.pop + 1.0, [0.5, -0.2, 13.0]], [DURATION, [0.2, -0.15, 12.3]]]),
        aim: K.path([[0, [0.0, -0.2, 0.4]], [T.pop, [0.0, -0.2, 0.4]], [T.pop + 1.0, [0, -0.08, 0.3]], [DURATION, [0, -0.08, 0.3]]]),
        ap: K.track([[0, 0.1], [T.pop, 0.085], [T.pop + 1.5, 0.065], [DURATION, 0.065]]),
      };

      return {
        update(t) {
          // the flight that is under way (or the last one that finished): from the target before it to its own
          let k = 0; while (k < FLIGHTS.length - 1 && FLIGHTS[k + 1].t0 <= t) k++;
          const f = FLIGHTS[k], from = k ? index(FLIGHTS[k - 1].to) : 0, to = index(f.to), swell = DIALS.swell(t);
          U.uTime.value = t; U.uFrom.value = from; U.uTo.value = to; U.uSeed.value = k + 1;
          U.uT0.value = f.t0; U.uDur.value = f.dur; U.uSpread.value = f.spread; U.uWave.value.fromArray(f.wave); U.uFlow.value = f.flow; U.uLift.value = f.lift; U.uSwirl.value = f.swirl; U.uLate.value = f.late; U.uScatter.value = f.scatter || 0; U.uPush.value = f.push; U.uWaves.value = f.waves;
          U.uCa.value.fromArray(sets[from].centre); U.uCb.value.fromArray(sets[to].centre); U.uHalfA.value.fromArray(sets[from].half);
          U.uSwellA.value = swell * (TARGETS[from].swell || 0); U.uSwellB.value = swell * (TARGETS[to].swell || 0); U.uShake.value = DIALS.shake(t);
          renderer.setRenderTarget(posRT); renderer.render(pass, passCam); renderer.setRenderTarget(null);   // every bead's place at time t
          stove.intensity = 110 * DIALS.heat(t);
          K.look(camera, cam.pos(t), cam.aim(t)); K.focus(camera, cam.aim(t), cam.ap(t));
        },
        // captions: small, crisp, bottom centre. Each fades up with a short rise and fades out before the next one
        overlay(ctx, t, W, H) {
          ctx.font = '600 50px "Inter"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          for (const c of CAPTIONS) {
            const up = K.seg(t, c.t0, c.t0 + 0.35, K.ease.out), a = up * (1 - K.seg(t, c.t1 - 0.25, c.t1));
            if (a <= 0) continue;
            ctx.globalAlpha = a; ctx.shadowColor = 'rgba(6, 22, 26, 0.6)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 2;
            ctx.fillStyle = '#f8eeda'; ctx.fillText(c.text, W / 2, H - 84 + (1 - up) * 16);
          }
        },
      };
    },

    sound(k) {
      const K = globalThis.K, r = K.rng(8);
      k.bed('room', 0, DURATION, { gain: 0.9 });
      // every flight in which the swarm really travels: a breath of air as the beads lift off, the hiss of glass in
      // the air, then a rain of tiny clicks as they land
      FLIGHTS.filter((f) => f.push > 0).forEach((f, i) => {
        const start = Math.max(0, f.t0), len = f.t0 + f.spread + f.dur - start, land0 = f.t0 + 0.4 * f.dur, land1 = f.t0 + f.spread + 0.7 * f.dur;
        k.noise(start, { dur: len, color: 'pink', filter: 'bandpass', f: [[0, 1200], [len * 0.45, 4200], [len, 2200]], q: 0.7, gain: 0.3, a: len * 0.35, verb: 0.1 });
        k.withMinor(() => {
          for (let j = 0; j < 220; j++) {
            const t = land0 + (land1 - land0) * Math.pow(r(), 0.8) + (r() < 0.12 ? r.range(0.1, f.late + 0.2) : 0);
            if (t < 0 || t > DURATION - 0.1) continue;
            if (j % 3) k.noise(t, { dur: 0.012, filter: 'bandpass', f: r.range(4500, 9000), q: 3, gain: r.range(0.12, 0.4), pan: r.range(-0.7, 0.7) });
            else k.tone(t, { f: r.range(2600, 5200), dur: 0.035, gain: r.range(0.03, 0.08), a: 0.001, pan: r.range(-0.7, 0.7), verb: 0.15 });
          }
        });
      });
      // heat: a low burner hum comes up, and the water starts to sizzle as its beads boil off one by one
      const cook = T.pop - T.heat;
      k.tone(T.heat - 0.3, { f: [[0, 55], [cook, 78]], type: 'triangle', dur: cook + 0.3, gain: 0.045, a: cook * 0.8, hold: cook * 0.2, filter: 'lowpass', f2: 300 });
      k.noise(T.heat + 0.4, { dur: cook - 0.4, color: 'pink', filter: 'highpass', f: [[0, 5200], [cook - 0.4, 3200]], gain: 0.055, a: cook * 0.7, hold: cook * 0.3 - 0.45 });
      k.withMinor(() => { for (let j = 0; j < 46; j++) { const t = T.heat + 0.6 + 2.0 * r(); k.play('pop', t, { gain: r.range(0.1, 0.22), f: r.range(900, 1900), pan: r.range(-0.4, 0.4) }); } });
      // pressure: the hull creaks, faster and faster, under a rising whine; then a breath of nothing before it gives
      const strain = T.pop - T.press;
      k.tone(T.press, { f: [[0, 190], [strain, 620]], type: 'sine', dur: strain - 0.06, gain: 0.05, a: strain * 0.8, verb: 0.2 });
      k.play('riser', T.press + 0.5, { gain: 0.42, dur: strain - 0.58 });
      for (let t = T.press + 0.25, gap = 0.34; t < T.pop - 0.1; t += gap, gap = Math.max(0.07, gap * 0.86)) k.play('tock', t, { gain: 0.2 + 0.3 * K.seg(t, T.press, T.pop), f: r.range(240, 380), pan: r.range(-0.3, 0.3) });
      // pop: a sharp crack with body under it and a burst of steam
      k.play('pop', T.pop, { gain: 2.2, f: 420 }); k.play('thud', T.pop, { gain: 0.8, f: 150 });
      k.noise(T.pop, { dur: 0.05, filter: 'highpass', f: 1800, gain: 0.7, a: 0.001 });
      k.noise(T.pop + 0.02, { dur: 0.9, color: 'pink', filter: 'highpass', f: [[0, 2600], [0.9, 6500]], gain: 0.2, a: 0.03, verb: 0.3 });   // steam getting away
      k.play('whoosh', T.pop + 0.02, { gain: 0.5, dur: 0.75, top: 2400 });
      const last = FLIGHTS[FLIGHTS.length - 1];
      k.play('ding', last.t0 + last.spread + 0.8 * last.dur, { gain: 0.3, f: 'D5' });   // the popcorn has set
    },
  });
}
```
