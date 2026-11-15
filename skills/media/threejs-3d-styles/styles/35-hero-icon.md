# Hero Icon (#35)

- **id:** `hero-icon`
- **Category:** Products and screens
- **Use:** title
- **Reference duration:** 8 s
- **Google Fonts:** Fredoka
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`

## Style card

- **Look:** One big, chunky app-icon tile floats in a bright seamless studio of a single colour. A raised symbol built from thick rounded pieces sits on its face, and the whole thing looks like a toy you could pick up.
- **Motion:** Tactile and mechanical. The tile winds up, flips over and clicks home a few degrees past the mark; then the parts of the new symbol slide, hinge, drop and press into place one after another, and every contact knocks the tile back a little. Each landing sends the next colour across the studio from behind the tile.
- **Light:** One large soft key from the upper right, so a big soft shadow of the tile falls on the backdrop down to the left. Softboxes above and at the sides give the gloss, a dark flag behind the camera keeps the face clean, and the backdrop bounces its colour up into the white parts.
- **Materials:** Clear-coated plastic for the tile and the coloured parts, matt soft-touch white for paper-like parts, a polished metal band around the waist of the tile and metal pins where a symbol has them. Every edge is rounded over.
- **Camera:** Long lens, almost square on, a little above and to the right of the tile so its top and side show. A very slow push in while the symbols change, then one pull back and sideways track that leaves room for the words.
- **Finish:** Clean and colour-true: neutral tone mapping, real motion blur on the flips, a faint bloom on the brightest highlights, almost no vignette or grain.
- **Good for:** A tool, product or idea as one object. Each thing it does (or each option, or each step) becomes one symbol on the tile with its own colour; the last face is the brand mark or the answer, with a short line of raised lettering on the wall beside it.

## Reference

- **Sample topic:** Otto, a made-up assistant app that handles mail, calendar and notes
- **Gallery description:** One big, chunky app-icon tile floats in a bright seamless studio of a single colour. A raised symbol built from thick rounded pieces sits on its face, and the whole thing looks like a toy you could pick up.
- **Shown in the sample clip:** Otto, a made-up assistant app that handles mail, calendar and notes

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/hero-icon.js`)

```js
{
  // ---------------------------------------------------------------- content (change this for a new topic)
  // Each beat is one face of the tile: a symbol, the tile's colour and the studio's colour. `at` is when the tile
  // starts turning to it, `flip` is how ('x' tips over like a flap, 'y' turns like a door) and `turns` adds whole
  // extra turns for a bigger move. The last beat is the resolve: the brand's own mark, with the wordmark beside it.
  const BEATS = [
    { symbol: 'mail', tile: '#1b5ee6', studio: '#5aa8ff' },
    { symbol: 'calendar', tile: '#e5412d', studio: '#ff8c6c', at: 1.6, flip: 'x' },
    { symbol: 'note', tile: '#f0a000', studio: '#ffd05c', at: 3.25, flip: 'y' },
    { symbol: 'mark', tile: '#131418', studio: '#efe7d9', at: 4.9, flip: 'y', turns: 1 },
  ];
  const BRAND = 'Otto.';
  const LINE = ['One assistant', 'for all of it.'];
  const INK = '#16171b';

  // ---------------------------------------------------------------- timing, shared by picture and sound
  // When each part of a symbol moves, in seconds after its face has clicked home.
  const MAIL = { letter: [0.1, 0.5], flap: [0.45, 0.74], seal: 1.0 };
  const CAL = { header: [0.03, 0.25], rings: [0.29, 0.37], days: 0.46, dayStep: 0.03, today: 0.84 };
  const NOTE = { lines: [0.1, 0.23, 0.36], fold: [0.6, 0.9] };
  const MARK = { arcs: [0.04, 0.17, 0.3], dot: 0.56, brand: 0.72, brandStep: 0.065, line: 1.14, lineStep: 0.075 };
  const SNAP = 0.137;   // how long a part's spring takes to first reach its seat (K.spring at 3 Hz, damping 0.55)

  // The flip is one damped spring: slow off the mark, fast through the middle, a few degrees past and back.
  const flipAngle = (b, s) => Math.PI * (K.spring(s, 1.3, 0.65) + 2 * (b.turns || 0) * K.seg(s, 0, 0.5, K.ease.inOut));
  const landOf = (b) => { if (!b.at) return 0; let s = 0; while (flipAngle(b, s) < Math.PI * (1 + 2 * (b.turns || 0))) s += 0.002; return b.at + s; };
  const WORDS = LINE.flatMap((l, row) => l.split(' ').map((w) => ({ w, row })));

  // Every contact in the clip: [time, sound, options, kick]. `kick` is how hard it knocks the tile back, so the
  // tile flinches on exactly the frames that make a sound.
  function cues() {
    const L = BEATS.map(landOf), q = [], add = (t, name, opts, kick = 0) => q.push({ t, name, opts, kick });
    BEATS.forEach((b, i) => {
      if (!i) return;
      add(b.at - 0.05, 'whoosh', { gain: b.turns ? 0.75 : 0.5, dur: b.turns ? 0.55 : 0.42, top: 1900 + i * 350 });
      add(L[i], 'tock', { gain: 1, f: 380 }, 1); add(L[i], 'thud', { gain: 0.4, f: 110 }); add(L[i] + 0.012, 'click', { gain: 0.7, f: 1500 });
    });
    add(L[0] + MAIL.letter[0], 'swish', { gain: 0.5, dur: 0.3 });
    add(L[0] + MAIL.flap[1], 'slap', { gain: 0.55 }, 0.6); add(L[0] + MAIL.flap[1], 'tock', { gain: 0.5, f: 700 });
    add(L[0] + MAIL.seal + 0.02, 'pop', { gain: 0.9, f: 700 }, 0.3);
    add(L[1] + CAL.header[1], 'tock', { gain: 0.8, f: 560 }, 0.5); add(L[1] + CAL.header[1], 'click', { gain: 0.6 });
    CAL.rings.forEach((r, i) => add(L[1] + r + 0.12, 'tick', { gain: 0.9, f: 6200 + i * 600, pan: i ? 0.2 : -0.2 }, 0.2));
    for (let i = 0; i < 8; i++) add(L[1] + CAL.days + i * CAL.dayStep + 0.03, 'tick', { gain: 0.45, f: 3000 + i * 160, minor: true });
    add(L[1] + CAL.today + 0.02, 'pop', { gain: 0.9, f: 880 }, 0.35);
    NOTE.lines.forEach((s, i) => add(L[2] + s + 0.1, 'tick', { gain: 0.7, f: 2400 + i * 300 }, 0.12));
    add(L[2] + NOTE.fold[0], 'paper', { gain: 0.5, dur: 0.25 }); add(L[2] + NOTE.fold[1], 'slap', { gain: 0.5 }, 0.5);
    MARK.arcs.forEach((s, i) => add(L[3] + s + SNAP, 'tock', { gain: 0.85, f: [520, 660, 780][i], pan: [0.25, -0.25, 0][i] }, 0.35));
    add(L[3] + MARK.dot + 0.03, 'click', { gain: 1 }, 0.9); add(L[3] + MARK.dot + 0.03, 'thud', { gain: 0.5 });
    add(L[3] + MARK.dot + 0.05, 'success', { gain: 0.7, f: 'C6' });
    [...BRAND].forEach((_, i) => add(L[3] + MARK.brand + i * MARK.brandStep + 0.03, 'pop', { gain: 0.5, f: 420 + i * 45, minor: true }));
    WORDS.forEach((_, i) => add(L[3] + MARK.line + i * MARK.lineStep + 0.03, 'tick', { gain: 0.4, f: 2600, minor: true }));
    return { L, q };
  }

  registerStyle({
    id: 'hero-icon',
    name: 'Hero Icon',
    family: 'Products and screens',
    look: 'One big, chunky app-icon tile floats in a bright seamless studio of a single colour. A raised symbol built from thick rounded pieces sits on its face, and the whole thing looks like a toy you could pick up.',
    motion: 'Tactile and mechanical. The tile winds up, flips over and clicks home a few degrees past the mark; then the parts of the new symbol slide, hinge, drop and press into place one after another, and every contact knocks the tile back a little. Each landing sends the next colour across the studio from behind the tile.',
    light: 'One large soft key from the upper right, so a big soft shadow of the tile falls on the backdrop down to the left. Softboxes above and at the sides give the gloss, a dark flag behind the camera keeps the face clean, and the backdrop bounces its colour up into the white parts.',
    materials: 'Clear-coated plastic for the tile and the coloured parts, matt soft-touch white for paper-like parts, a polished metal band around the waist of the tile and metal pins where a symbol has them. Every edge is rounded over.',
    camera: 'Long lens, almost square on, a little above and to the right of the tile so its top and side show. A very slow push in while the symbols change, then one pull back and sideways track that leaves room for the words.',
    post: 'Clean and colour-true: neutral tone mapping, real motion blur on the flips, a faint bloom on the brightest highlights, almost no vignette or grain.',
    explains: 'A tool, product or idea as one object. Each thing it does (or each option, or each step) becomes one symbol on the tile with its own colour; the last face is the brand mark or the answer, with a short line of raised lettering on the wall beside it.',
    topic: 'Otto, a made-up assistant app that handles mail, calendar and notes',
    duration: 8,
    fonts: ['700 300px "Fredoka"', '500 300px "Fredoka"'],
    render: { samples: 64, shutter: 0.55, tone: 'neutral', exposure: 1, bloom: 0.12, bloomThreshold: 1.05, vignette: 0.1, grain: 0.01, fov: 26, near: 2, far: 120, background: '#5aa8ff' },

    build(S) {
      const { THREE, K, scene, camera } = S;
      const { L, q } = cues();
      const kicks = q.filter((c) => c.kick);
      const WALL = -2.4, FLOOR = -4.4, T = 0.84, R = 1.7;   // backdrop distance, floor height, tile thickness and half-size

      // ------------------------------------------------------------ making thick rounded pieces
      // Smooth shading for extruded shapes: flat faces stay flat, rounded edges blend. (ExtrudeGeometry alone gives
      // faceted bevels, which ruins a glossy highlight.)
      const smooth = (g, crease = 50) => {
        if (g.index) g = g.toNonIndexed();
        const p = g.attributes.position.array, nf = p.length / 9, fn = new Float32Array(nf * 3), at = new Map(), cos = Math.cos(crease * Math.PI / 180);
        const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
        const key = (i) => Math.round(p[i] * 2e3) + ',' + Math.round(p[i + 1] * 2e3) + ',' + Math.round(p[i + 2] * 2e3);
        for (let f = 0; f < nf; f++) {
          a.fromArray(p, f * 9); b.fromArray(p, f * 9 + 3).sub(a); c.fromArray(p, f * 9 + 6).sub(a); b.cross(c).toArray(fn, f * 3);   // length = area, so big faces weigh more
          for (let v = 0; v < 3; v++) { const k = key(f * 9 + v * 3); if (!at.has(k)) at.set(k, []); at.get(k).push(f); }
        }
        const out = new Float32Array(p.length);
        for (let f = 0; f < nf; f++) {
          a.fromArray(fn, f * 3).normalize(); const cap = Math.abs(a.z) > 0.999;
          for (let v = 0; v < 3; v++) {
            c.set(0, 0, 0); let flat = cap ? a.z : 0;
            if (!cap) for (const o of at.get(key(f * 9 + v * 3))) {
              b.fromArray(fn, o * 3); const len = b.length(); if (len < 1e-12 || b.dot(a) / len < cos) continue;
              if (Math.abs(b.z / len) > 0.999) flat = b.z; else c.add(b);   // a rounded edge leaves a flat face along the face's own normal: no crease
            }
            if (flat) c.set(0, 0, Math.sign(flat)); else if (c.lengthSq() < 1e-20) c.copy(a);
            c.normalize().toArray(out, f * 9 + v * 3);
          }
        }
        g.setAttribute('normal', new THREE.BufferAttribute(out, 3));
        return g;
      };
      // chunk(): the one shape-maker of this style. A flat outline becomes a thick piece with rounded-over edges,
      // its back resting on z = 0 so it can be placed straight onto a surface.
      const chunk = (shape, depth, bevel = 0.05, o = {}) => {
        bevel = Math.min(bevel, depth / 2 - 0.002);
        const g = new THREE.ExtrudeGeometry(shape, { depth: depth - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: o.round || 5, curveSegments: o.curve || 20, steps: o.steps || 1 });
        g.translate(0, 0, bevel);
        return smooth(g);
      };
      // outlines: a polygon with softened corners (r = how much of each corner is cut, one value or one per point)
      const poly = (pts, r) => {
        const s = new THREE.Shape(), n = pts.length;
        pts.forEach((p, i) => {
          const pa = pts[(i + n - 1) % n], pb = pts[(i + 1) % n], rr = Array.isArray(r) ? r[i] : r;
          const da = Math.hypot(pa[0] - p[0], pa[1] - p[1]), db = Math.hypot(pb[0] - p[0], pb[1] - p[1]), ka = Math.min(rr, da / 2) / da, kb = Math.min(rr, db / 2) / db;
          const x0 = p[0] + (pa[0] - p[0]) * ka, y0 = p[1] + (pa[1] - p[1]) * ka;
          if (i) s.lineTo(x0, y0); else s.moveTo(x0, y0);
          s.quadraticCurveTo(p[0], p[1], p[0] + (pb[0] - p[0]) * kb, p[1] + (pb[1] - p[1]) * kb);
        });
        s.closePath(); return s;
      };
      const rect = (w, h, r) => poly([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], r);
      const disc = (r) => new THREE.Shape().absarc(0, 0, r, 0, Math.PI * 2);
      // an arc-shaped band. Each curve starts and ends with one step longer than the rounded edge chunk() gives it:
      // finer steps right next to a sharp corner make ExtrudeGeometry's bevel fold over itself and tear the end.
      const arc = (ro, ri, a0, a1, n = 80, end = 0.1) => {
        const pts = [];
        for (const [r, from, to] of [[ro, a0, a1], [ri, a1, a0]]) {
          const pad = end / r * Math.sign(to - from);
          for (let i = 0; i <= n; i++) { const a = i === 0 ? from : i === n ? to : from + pad + (to - from - 2 * pad) * (i - 1) / (n - 2); pts.push(new THREE.Vector2(r * Math.cos(a), r * Math.sin(a))); }
        }
        return new THREE.Shape(pts);
      };
      // the app-icon outline: a superellipse, rounder than a rounded square and with no visible start of the corner
      const squircle = (r, n = 4.6) => new THREE.Shape(Array.from({ length: 160 }, (_, i) => { const a = i / 160 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); return new THREE.Vector2(r * Math.sign(c) * Math.pow(Math.abs(c), 2 / n), r * Math.sign(s) * Math.pow(Math.abs(s), 2 / n)); }));

      // ------------------------------------------------------------ materials
      // Clear-coated plastic. Its gloss comes only from the environment's softboxes: the coat's mirror-sharp highlight
      // of the key light is removed, because a soft light shows up in it as a cluster of dots.
      const envGloss = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <lights_physical_pars_fragment>', THREE.ShaderChunk.lights_physical_pars_fragment.replace(/clearcoatSpecularDirect \+= ccIrradiance[^;]*;/, '')); };
      const plastic = (color, o = {}) => { const m = new THREE.MeshPhysicalMaterial(Object.assign({ color, roughness: 0.45, clearcoat: 1, clearcoatRoughness: 0.06 }, o)); m.onBeforeCompile = envGloss; return m; };
      const soft = (color, o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color, roughness: 0.7, sheen: 0.5, sheenRoughness: 0.45, sheenColor: new THREE.Color('#ffffff') }, o));   // soft-touch
      const metal = new THREE.MeshStandardMaterial({ color: '#eef0f3', metalness: 1, roughness: 0.2 });
      const put = (parent, geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
      const group = (parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
      const pop = (s, f = 3, d = 0.55) => K.spring(s, f, d);   // 0 -> 1 with a little overshoot
      const grow = (m, k, axis) => { m.visible = k > 0.01; if (axis) m.scale[axis] = Math.max(k, 0.01); else m.scale.setScalar(Math.max(k, 0.01)); };   // scale a part up from nothing

      // ------------------------------------------------------------ the studio
      // a seamless backdrop: floor, a curved sweep and a wall, in one piece
      const sweep = new THREE.PlaneGeometry(120, 1, 1, 80), sp = sweep.attributes.position, RAD = 2.2;
      for (let i = 0; i < sp.count; i++) {
        const v = 1 - sweep.attributes.uv.getY(i), d = v * 80;          // distance along the profile, from the front of the floor
        const flat = 40, bend = RAD * Math.PI / 2;
        let y, z;
        if (d < flat) { y = FLOOR; z = WALL + RAD + (flat - d); }
        else if (d < flat + bend) { const a = (d - flat) / RAD; y = FLOOR + RAD - Math.cos(a) * RAD; z = WALL + RAD - Math.sin(a) * RAD; }
        else { y = FLOOR + RAD + (d - flat - bend); z = WALL; }
        sp.setXYZ(i, sp.getX(i), y, z);
      }
      sweep.computeVertexNormals();
      // the studio changes colour as a wave that spreads over the backdrop from behind the tile
      const wave = { uOld: { value: new THREE.Color() }, uNew: { value: new THREE.Color() }, uCentre: { value: new THREE.Vector3(0, 0, WALL) }, uRadius: { value: 0 } };
      const paper = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.94, side: THREE.DoubleSide });
      paper.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, wave);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWave;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWave = (modelMatrix * vec4(transformed, 1.0)).xyz;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uOld, uNew, uCentre; uniform float uRadius; varying vec3 vWave;')
          .replace('#include <color_fragment>', '#include <color_fragment>\nfloat wv = smoothstep(uRadius - 0.35, uRadius, distance(vWave, uCentre)); diffuseColor.rgb = mix(uNew, uOld, wv) + 0.1 * (1.0 - abs(2.0 * wv - 1.0));');
      };
      const backdrop = new THREE.Mesh(sweep, paper); backdrop.receiveShadow = true; scene.add(backdrop);

      // light: softboxes for the gloss, a black flag behind the camera so flat glossy faces stay deep, one big key
      K.env(S, { top: '#d9dde3', horizon: '#9aa0a8', bottom: '#6d7076', intensity: 0.55, panels: [
        { pos: [0, 4, 40], size: [90, 70], color: '#000000', power: 1 },
        { pos: [3, 22, 6], size: [26, 16], color: '#ffffff', power: 3.2 },
        { pos: [22, 9, 12], size: [10, 20], color: '#fff6ea', power: 2.6 },
        { pos: [-20, 5, 9], size: [5, 22], color: '#eaf2ff', power: 2.2 },
        { pos: [-18.6, 3, 23.4], size: [22, 22], round: true, color: '#ffffff', power: 1.4 },   // a round softbox behind the camera: its edge is the sheen that slides over the tile's face
      ] });
      K.spot(S, { pos: [7.5, 9.5, 11.5], target: [1.4, -0.2, -1], color: '#fff8ee', power: 1250, angle: 0.82, penumbra: 1, soft: 1.5, mapSize: 4096 });
      const bounce = new THREE.HemisphereLight('#ffffff', '#ffffff', 0.8); scene.add(bounce);   // ground colour follows the studio: the colour bounce

      // ------------------------------------------------------------ the tile
      const tile = group(scene);
      const half = [plastic('#ffffff'), plastic('#ffffff')];   // front and back half: during a flip they are two colours
      const body = chunk(squircle(R), T, 0.2, { round: 9, steps: 2 }); body.translate(0, 0, -T / 2);
      { // split the body into its front and back half so each can take its own colour
        const p = body.attributes.position.array, n = body.attributes.normal.array, order = [[], []];
        for (let f = 0; f < p.length / 9; f++) order[p[f * 9 + 2] + p[f * 9 + 5] + p[f * 9 + 8] > 0 ? 0 : 1].push(f);
        const P = new Float32Array(p.length), N = new Float32Array(n.length); let w = 0;
        for (const f of order.flat()) { P.set(p.subarray(f * 9, f * 9 + 9), w); N.set(n.subarray(f * 9, f * 9 + 9), w); w += 9; }
        body.setAttribute('position', new THREE.BufferAttribute(P, 3)); body.setAttribute('normal', new THREE.BufferAttribute(N, 3)); body.deleteAttribute('uv');
        body.addGroup(0, order[0].length * 3, 0); body.addGroup(order[0].length * 3, order[1].length * 3, 1);
      }
      put(tile, body, half);
      put(tile, chunk(squircle(R + 0.016), 0.09, 0.03), metal, 0, 0, -0.045);   // the polished band around the waist

      // ------------------------------------------------------------ the symbols
      // Each symbol is a group of chunks standing on the tile's face plus pose(s), which sets its parts for
      // s = seconds since its face clicked home (negative while it is still coming round).
      const SYMBOLS = {
        // an open envelope: the letter slides in, the flap falls shut, a seal is pressed on
        mail(g) {
          const W = 2.12, H = 1.46, F = H / 2 + 0.2;
          put(g, chunk(rect(W, H, 0.24), 0.08, 0.03), soft('#c9d3e3'));                                         // inside of the envelope
          const letter = put(g, chunk(rect(W - 0.34, H - 0.1, 0.1), 0.04, 0.015), soft('#ffffff'), 0, 0, 0.105);
          [0.44, 0.22].forEach((y, i) => put(letter, chunk(rect(i ? 0.8 : 1.2, 0.09, 0.045), 0.02, 0.008), soft('#8fa8d6'), i ? -0.2 : 0, y, 0.04));
          put(g, chunk(poly([[-W / 2, -H / 2], [W / 2, -H / 2], [W / 2, H / 2], [0, -0.08], [-W / 2, H / 2]], [0.24, 0.24, 0.1, 0.16, 0.1]), 0.15, 0.05), soft('#e6ebf3'), 0, 0, 0.15);   // the pocket
          const hinge = group(g, 0, H / 2, 0.3), flapMat = soft('#ffffff'), inside = new THREE.Color('#cfd8e8'), outside = new THREE.Color('#ffffff');
          const flap = put(hinge, chunk(poly([[-W / 2, 0], [W / 2, 0], [0, -F]], [0.1, 0.1, 0.22]), 0.09, 0.035), flapMat);
          const seal = put(flap, chunk(disc(0.2), 0.11, 0.05, { curve: 32 }), plastic('#ff5a3a'), 0, -F + 0.36, 0.085);
          return (s) => {
            letter.position.y = 0.66 * (1 - K.seg(s, MAIL.letter[0], MAIL.letter[1], K.ease.inOut));
            const u = s - MAIL.flap[1];   // the flap falls faster and faster, then bounces once on the pocket
            const shut = K.seg(s, MAIL.flap[0], MAIL.flap[1], K.ease.in);
            hinge.rotation.x = u < 0 ? -Math.PI * (1 - shut) : -0.16 * Math.exp(-u * 11) * Math.abs(Math.sin(u * 17));
            hinge.position.z = K.lerp(0.1, 0.3, shut);   // open, the flap lies behind the letter; shut, it lies on the pocket
            flapMat.color.copy(inside).lerp(outside, K.smooth(0.3, 0.7, shut));
            g.position.y = -0.3 * (1 - K.seg(s, 0.3, 0.85, K.ease.inOut));
            grow(seal, pop(s - MAIL.seal, 3.2, 0.45));
          };
        },
        // a calendar: the header slots down onto the page, two pins drop in, the days pop up, one day is picked
        calendar(g) {
          const W = 2.04, HH = 0.62;
          const top = (w, h, flip) => poly([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], flip ? [0.3, 0.3, 0.05, 0.05] : [0.05, 0.05, 0.3, 0.3]);
          put(g, chunk(top(W, W - HH, true), 0.13, 0.05), soft('#ffffff'), 0, -HH / 2);
          const header = put(g, chunk(top(W, HH), 0.18, 0.06), plastic('#e03a27'));
          const rings = [-0.5, 0.5].map((x) => put(g, chunk(rect(0.17, 0.52, 0.085), 0.17, 0.07), metal, x, W / 2 - 0.02));
          const days = [];
          for (let i = 0; i < 8; i++) days.push(put(g, chunk(rect(0.31, 0.31, 0.1), 0.07, 0.03), soft('#cfd4dc'), (i % 4 - 1.5) * 0.44, i < 4 ? 0.03 : -0.45, 0.125));
          const today = put(days[6], chunk(rect(0.37, 0.37, 0.12), 0.1, 0.04), plastic('#e03a27'), 0, 0, 0.005);
          return (s) => {
            const e = K.seg(s, CAL.header[0], CAL.header[1], K.ease.in), b = Math.max(0, s - CAL.header[1]);
            header.position.set(0, W / 2 - HH / 2 + 0.4 * (1 - e) + 0.03 * Math.exp(-b * 13) * Math.abs(Math.sin(b * 24)), 0);   // slides down the face and knocks against the page
            rings.forEach((r, i) => { const d = K.seg(s, CAL.rings[i], CAL.rings[i] + 0.12, K.ease.in); r.position.z = 0.1 + 0.9 * (1 - d); grow(r, K.seg(s, CAL.rings[i] - 0.03, CAL.rings[i] + 0.05)); });
            days.forEach((d, i) => grow(d, pop(s - CAL.days - i * CAL.dayStep, 3.4, 0.5)));
            grow(today, pop(s - CAL.today, 3.2, 0.42));
          };
        },
        // a note: three lines are written from the left, then the corner folds over
        note(g) {
          const W = 2.04, C = 0.6, h = W / 2, D = C / Math.SQRT2;
          put(g, chunk(poly([[-h, -h], [h, -h], [h, h - C], [h - C, h], [-h, h]], [0.3, 0.3, 0.05, 0.05, 0.3]), 0.13, 0.05), soft('#fffdf6'));
          const lines = [[1.0, 0.2, 0.36, '#f0a000'], [1.42, 0.14, -0.1, '#b9bec8'], [1.02, 0.14, -0.48, '#b9bec8']].map(([w, t, y, col]) => {
            const m = put(g, chunk(rect(w, t, t / 2), 0.07, 0.03), col === '#f0a000' ? plastic(col) : soft(col), -0.72, y, 0.125);
            m.geometry.translate(w / 2, 0, 0); return m;   // grows from its left end
          });
          const turn = group(g, h - C / 2, h - C / 2, 0.13); turn.rotation.z = -Math.PI / 4;   // the fold line, corner to corner
          const hinge = group(turn);
          const earMat = soft('#fffdf6'); put(hinge, chunk(poly([[-D, 0], [D, 0], [0, D]], [0.04, 0.04, 0.24]), 0.05, 0.02), earMat, 0, 0, -0.05);
          const front = new THREE.Color('#fffdf6'), back = new THREE.Color('#e4dcc6');
          return (s) => {
            lines.forEach((l, i) => grow(l, K.seg(s, NOTE.lines[i], NOTE.lines[i] + 0.2, K.ease.outBack), 'x'));
            const u = s - NOTE.fold[1];
            hinge.rotation.x = u < 0 ? Math.PI * K.seg(s, NOTE.fold[0], NOTE.fold[1], K.ease.inOut) : Math.PI - 0.2 * Math.exp(-u * 11) * Math.abs(Math.sin(u * 17));
            earMat.color.copy(front).lerp(back, K.smooth(1.2, 1.9, hinge.rotation.x));   // we see the back of the paper once it is over
          };
        },
        // the brand mark: three arcs in the three colours close into one ring, and a button is pressed into its centre
        mark(g) {
          const RO = 1.02, RI = 0.58, GAP = 0.06;
          const arcs = [BEATS[0].tile, BEATS[1].tile, BEATS[2].tile].map((col, i) => {
            const a0 = Math.PI / 2 - i * Math.PI * 2 / 3, mid = a0 - Math.PI / 3, pivot = group(g);
            const m = put(pivot, chunk(arc(RO, RI, a0 - Math.PI * 2 / 3 + GAP, a0 - GAP), 0.24, 0.085, { curve: 40 }), plastic(new THREE.Color(col).lerp(new THREE.Color('#ffffff'), 0.03)));
            return { pivot, m, dir: [Math.cos(mid), Math.sin(mid)] };
          });
          const dot = put(g, chunk(disc(0.27), 0.2, 0.09, { curve: 40 }), soft('#ffffff'));
          return (s) => {
            arcs.forEach(({ pivot, m, dir }, i) => {
              const u = pop(s - MARK.arcs[i]), open = 1 - Math.min(u, 1);
              m.position.set(dir[0] * 0.42 * (1 - u), dir[1] * 0.42 * (1 - u), 0.4 * open);
              pivot.rotation.z = -0.75 * (1 - u);
            });
            const d = s - MARK.dot;
            grow(dot, K.seg(d, -0.06, 0.02));
            dot.position.z = 0.6 * (1 - K.seg(d, -0.06, 0.03, K.ease.in)) - 0.05 * Math.exp(-Math.max(0, d - 0.03) * 12) * Math.sin(Math.max(0, d - 0.03) * 26);
          };
        },
      };
      const faces = BEATS.map((b) => { const pivot = group(tile), g = group(pivot, 0, 0, T / 2), pose = SYMBOLS[b.symbol](g); return { pivot, pose }; });

      // ------------------------------------------------------------ raised lettering on the wall
      // Any text in any font with real thickness: each piece (a letter or a word) is a canvas texture cut out with
      // alphaTest and stacked in layers, so it catches light on top and throws a shadow. Returns the pieces so each
      // can be pushed out of the wall on its own.
      const raised = (text, { font, size, depth, x, y, by = 'letter', layers = 9 }) => {
        const px = +/(\d+)px/.exec(font)[1], unit = size / px, m = document.createElement('canvas').getContext('2d'); m.font = font;
        const parts = by === 'word' ? text.split(/(?<= )/) : [...text], out = []; let x0 = 0;   // pieces are measured one by one, so ligatures cannot shift them
        const top = new THREE.Color(INK), side = new THREE.Color(INK).lerp(new THREE.Color('#8c8a86'), 0.35);
        for (const part of parts) {
          const glyph = part.trim(), xp = x0; x0 += m.measureText(part).width;
          if (!glyph) continue;
          const tex = K.textPlane(glyph, { font, height: size, color: '#ffffff' }), [w, h] = tex.userData.size;
          const g = group(scene, x + (xp + m.measureText(glyph).width / 2) * unit, y, WALL + 0.004), geo = new THREE.PlaneGeometry(w, h);
          const slices = Array.from({ length: layers }, (_, i) => {
            const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex.userData.tex, alphaTest: 0.5, color: i === layers - 1 ? top : side, roughness: 0.5, shadowSide: THREE.FrontSide }));
            mesh.castShadow = i === layers - 1; mesh.receiveShadow = true; g.add(mesh); return mesh;
          });
          out.push({ g, set(e) { g.visible = e > 0.001; g.scale.set(0.8 + 0.2 * Math.min(1, e), 0.8 + 0.2 * Math.min(1, e), 1); slices.forEach((sl, i) => { sl.position.z = depth * e * i / (layers - 1); }); } });
        }
        return out;
      };
      const TX = 2.95;
      const brand = raised(BRAND, { font: '700 300px "Fredoka"', size: 1.95, depth: 0.26, x: TX - 0.08, y: 0.72, layers: 13 });
      const words = LINE.flatMap((l, row) => raised(l, { font: '500 300px "Fredoka"', size: 0.62, depth: 0.09, x: TX, y: -0.72 - row * 0.74, by: 'word', layers: 6 }));

      // ------------------------------------------------------------ per-frame state
      const tileCol = BEATS.map((b) => new THREE.Color(b.tile)), studioCol = BEATS.map((b) => new THREE.Color(b.studio));
      const qBase = new THREE.Quaternion(), qFlip = new THREE.Quaternion(), eul = new THREE.Euler(0, 0, 0, 'YXZ'), AX = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0) };
      const WIND = 0.4;   // a flip owns the tile from this long before it starts (the wind-up)
      const windUp = (t, at) => Math.exp(-Math.pow((t - (at - 0.07)) / 0.11, 2));
      const knock = (u) => (u <= 0 ? 0 : Math.exp(-u * 8.5) * Math.sin(u * 21));

      return {
        update(t) {
          // which flip is in charge: beat c is coming to the front, beat c - 1 is leaving
          let c = 0; for (let i = 1; i < BEATS.length; i++) if (t >= BEATS[i].at - WIND) c = i;
          const b = BEATS[c], s = c ? t - b.at : 0, wind = c ? windUp(t, b.at) : 0;
          const angle = c ? flipAngle(b, s) - 0.2 * wind : 0;

          // colours. At rest the tile is one colour; the half that is out of sight changes just before it comes round.
          const out = Math.max(0, c - 1);
          half[0].color.copy(tileCol[out]).lerp(tileCol[c], c ? K.seg(t, L[c] + 0.02, L[c] + 0.2) : 0);
          half[1].color.copy(tileCol[out]).lerp(tileCol[c], c ? K.seg(s, 0, 0.06) : 0);
          wave.uOld.value.copy(studioCol[out]); wave.uNew.value.copy(studioCol[c]);
          wave.uRadius.value = c ? 26 * K.seg(s, 0.1, 0.75) : 26;
          bounce.groundColor.copy(studioCol[out]).lerp(studioCol[c], c ? K.seg(s, 0.1, 0.5) : 1);

          // the tile: a slow float, the flip, and a knock back from every contact
          let k = 0; for (const e of kicks) k += e.kick * knock(t - e.t);
          const w = K.seg(t, 4.95, 6.5, K.ease.inOut);   // 0 = the symbols, 1 = the resolve
          eul.set(0.1 + 0.03 * Math.sin(t * 0.9) + 0.035 * k, K.lerp(-0.25, -0.1, w) + 0.04 * Math.sin(t * 0.7 + 1), 0.015 * Math.sin(t * 0.8 + 2));
          qBase.setFromEuler(eul); qFlip.setFromAxisAngle(AX[b.flip || 'y'], angle);
          tile.quaternion.copy(qBase).multiply(qFlip);
          tile.position.set(0, 0.15 + 0.05 * Math.sin(t * 1.3), -0.3 * wind - 0.16 * k);

          faces.forEach((f, i) => {
            f.pivot.visible = i === c || i === c - 1;
            if (!f.pivot.visible) return;
            f.pivot.rotation.set(0, 0, 0);
            if (i === c && c) f.pivot.rotation[b.flip] = Math.PI;   // the coming symbol waits on the back, the right way up for this flip
            f.pose(t - L[i]);
          });

          brand.forEach((p, i) => p.set(pop(t - L[3] - MARK.brand - i * MARK.brandStep, 2.6, 0.5)));
          words.forEach((p, i) => p.set(pop(t - L[3] - MARK.line - i * MARK.lineStep, 2.8, 0.6)));

          // camera: a slow push while the symbols change, then back and to the right to make room for the words
          const pos = [K.lerp(0.9 - 0.06 * t, 3.05 - 0.06 * (t - 6), w), K.lerp(0.75, 0.5, w), K.lerp(12.9 - 0.22 * t, 13.75 - 0.12 * (t - 6), w)];
          const aim = [K.lerp(0, 2.62, w), K.lerp(0.12, 0.0, w), K.lerp(0, -0.8, w)];
          K.look(camera, pos, aim); K.focus(camera, [aim[0] * 0.5, 0, -0.6 * w], 0.04);
        },
      };
    },

    sound(k) {
      for (const c of cues().q) k.play(c.name, c.t, c.opts);
      // one soft note per face, climbing to the resolve
      const L = BEATS.map(landOf);
      ['G4', 'B4', 'D5'].forEach((n, i) => k.tone(L[i + 1] + 0.02, { f: n, type: 'triangle', dur: 1.1, gain: 0.07, a: 0.01, filter: 'lowpass', f2: 1800, verb: 0.3 }));
      k.tone(L[3] + MARK.dot + 0.05, { f: 'G3', type: 'sine', dur: 1.8, gain: 0.1, a: 0.02, verb: 0.3 });
      k.bed('room', 0, 8, { gain: 0.7 });
    },
  });
}
```
