# Circuit City (#14)

- **id:** `circuit-city`
- **Category:** Spaces and journeys
- **Use:** explainer
- **Reference duration:** 8 s
- **Google Fonts:** IBM Plex Mono
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`

## Style card

- **Look:** A real circuit board filmed as a city at night: matte black chips are the buildings, aluminium capacitors the towers, gold tracks the streets, and white silkscreen print names each district. Deep green solder mask, gold and tinned metal, warm signal light.
- **Motion:** A pulse of light races along the gold tracks from stop to stop and each landmark wakes as it arrives: chips glow from underneath, the processor dies light up in a diagonal wave. The camera flies low and forward after it, like a helicopter shot, and rises once over the big chip.
- **Light:** Night. The signals are the main light: a warm glow that travels with the pulse and throws moving shadows from every part. A soft cool moonlight from the back left rims the parts and rakes the board so metal glints and textures read; a few tiny indicator LEDs.
- **Materials:** Semi-gloss solder mask with fine grain and raised copper under it, satin gold tracks and pads, bright tinned pins, moulded black epoxy with laser-etched markings, brushed aluminium cans, iridescent bare silicon.
- **Camera:** Macro lens, very shallow focus that rides with the pulse. One continuous forward flight that starts low at the edge of the board, sways gently after the pulse, cranes up over the processor and glides on to settle above the last stop.
- **Finish:** Real depth of field and motion blur, bloom only on the signal and LEDs, filmic contrast with deep blacks, slight lens fringing, vignette, fine grain.
- **Good for:** Journeys and pipelines: something travels through a system and each stage does its part. Every stage is a landmark with a printed label; the pulse and the camera carry the order.

## Reference

- **Sample topic:** A prompt's trip across a chip: PROMPT, MEMORY, PROCESSOR, ANSWER
- **Gallery description:** A real circuit board filmed as a city at night: matte black chips are the buildings, aluminium capacitors the towers, gold tracks the streets, and white silkscreen print names each district. Deep green solder mask, gold and tinned metal, warm signal light.
- **Shown in the sample clip:** A prompt's trip across a chip: PROMPT, MEMORY, PROCESSOR, ANSWER

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/circuit-city.js`)

```js
{
  // ---------------------------------------------------------------- content (change this for a new topic)
  // Four stops on the board. Each one is a landmark with its name printed next to it in white silkscreen, and the
  // pulse visits them in order. REFS are the small reference designators a real board prints beside every part.
  const STOPS = ['PROMPT', 'MEMORY', 'PROCESSOR', 'ANSWER'];
  const REFS = ['J1', 'U1-U4', 'U5', 'J2'];
  const CORES = 4;                 // the processor carries CORES x CORES dies, which light up in a diagonal wave
  // The schedule in seconds. Picture and sound both read it.
  const T = { launch: 0.3, memEnd: 2.0, memOut: 2.35, cpu: 3.55, wave: 3.7, waveLen: 1.35, cpuOut: 5.65, answer: 6.5 };

  // ---------------------------------------------------------------- the map
  // x = right, z = towards the camera. The flight heads away from the camera (to -z), so every label is printed with
  // its top edge towards -z and reads the right way up for the whole trip.
  const K = globalThis.K;
  const BOARD = { x0: -12, x1: 12, zNear: 1.6, zFar: -38.4 };
  const PORT_IN = [2.2, 0.55], PORT_OUT = [5.5, -37.3];
  const MEM = { z: -11.5, xs: [-3.45, -1.15, 1.15, 3.45], w: 1.9, d: 2.8 };
  const CPU = { x: 1.5, z: -26, size: 9 };

  // polyline helpers. A track is a list of [x, z] points with 45-degree bends, like real PCB routing.
  const measure = (pts) => {
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const len = cum[cum.length - 1];
    const at = (s) => { s = K.clamp(s, 0, len); let i = 1; while (i < pts.length - 1 && cum[i] < s) i++; const f = (s - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]); return [K.lerp(pts[i - 1][0], pts[i][0], f), K.lerp(pts[i - 1][1], pts[i][1], f)]; };
    return { pts, cum, len, at };
  };
  // the same polyline moved sideways by d, with mitred corners (used for ribbon edges and for bundles of parallel tracks)
  const offset = (pts, d) => pts.map((p, i) => {
    const dir = (a, b) => { const x = b[0] - a[0], z = b[1] - a[1], l = Math.hypot(x, z) || 1; return [x / l, z / l]; };
    const a = dir(pts[Math.max(0, i - 1)], pts[Math.max(1, i)]), b = dir(pts[Math.min(pts.length - 2, i)], pts[Math.min(pts.length - 1, i + 1)]);
    const mx = -a[1] - b[1], mz = a[0] + b[0], ml = Math.hypot(mx, mz) || 1, k = d / ((mx / ml) * -a[1] + (mz / ml) * a[0]);
    return [p[0] + mx / ml * k, p[1] + mz / ml * k];
  });
  // one pulse run along a track: leaves at t0, arrives at t1 and gathers speed on the way (power ease)
  const run = (len, t0, t1, p = 1.3) => ({ t0, t1, timeAt: (s) => t0 + (t1 - t0) * Math.pow(K.clamp(s / len), 1 / p), sAt: (t) => len * Math.pow(K.clamp((t - t0) / (t1 - t0)), p) });

  // The route of the signal, shared by the picture and the score.
  function plan() {
    const pinNear = MEM.z + MEM.d / 2 + 0.33, pinFar = MEM.z - MEM.d / 2 - 0.33, lane = pinNear + 0.5;
    // leg A: out of the back of the PROMPT port, one long diagonal across the board, then along a lane that passes in
    // front of all four memory chips
    const a = measure([[PORT_IN[0], PORT_IN[1] - 1.5], [PORT_IN[0], PORT_IN[1] - 1.75], [-4.9, PORT_IN[1] - 1.75 - (PORT_IN[0] + 4.9)], [-4.9, lane + 0.7], [-4.2, lane], [MEM.xs[3] - 0.255, lane]]);
    const runA = run(a.len, T.launch, T.memEnd, 1.25);
    const tapS = MEM.xs.map((x) => a.len - (MEM.xs[3] - x)), tapT = tapS.map(runA.timeAt);       // when the pulse reaches each chip
    const taps = MEM.xs.map((x, i) => ({ path: measure([[x - 0.255, lane], [x - 0.255, pinNear]]), run: run(0.5, tapT[i], tapT[i] + 0.05, 1) }));
    // leg B: two data lines leave every chip and merge into one eight-lane bus that enters the processor near its corner
    const busX = CPU.x - CPU.size / 2 + 0.9, za = pinFar - 0.6, bus = [];
    for (let j = 0; j < 8; j++) {
      const x0 = MEM.xs[j >> 1] + (j & 1 ? 0.255 : -0.255), xs = busX + (j - 3.5) * 0.2;
      const path = measure([[x0, pinFar], [x0, za], [xs, za - Math.abs(xs - x0)], [xs, CPU.z + CPU.size / 2 - 0.05]]);
      bus.push({ path, run: run(path.len, T.memOut + 0.035 * j, T.cpu + 0.02 * j, 1.3) });
    }
    // leg C: one line out of the far corner of the processor to the ANSWER port
    const c = measure([[CPU.x + 3.1, CPU.z - CPU.size / 2 + 0.05], [CPU.x + 3.1, -32.6], [PORT_OUT[0], -33.5], [PORT_OUT[0], PORT_OUT[1] + 1.5]]);
    const runC = run(c.len, T.cpuOut, T.answer, 1.2);
    // the wave across the cores: i counts from the left, j from the near edge, so it starts where the bus comes in
    const coreT = (i, j) => T.wave + T.waveLen * (i + j) / (2 * (CORES - 1));
    return { a, runA, taps, tapT, bus, c, runC, coreT, lane, pinNear, pinFar, busX };
  }

  registerStyle({
    id: 'circuit-city',
    name: 'Circuit City',
    family: 'Spaces and journeys',
    look: 'A real circuit board filmed as a city at night: matte black chips are the buildings, aluminium capacitors the towers, gold tracks the streets, and white silkscreen print names each district. Deep green solder mask, gold and tinned metal, warm signal light.',
    motion: 'A pulse of light races along the gold tracks from stop to stop and each landmark wakes as it arrives: chips glow from underneath, the processor dies light up in a diagonal wave. The camera flies low and forward after it, like a helicopter shot, and rises once over the big chip.',
    light: 'Night. The signals are the main light: a warm glow that travels with the pulse and throws moving shadows from every part. A soft cool moonlight from the back left rims the parts and rakes the board so metal glints and textures read; a few tiny indicator LEDs.',
    materials: 'Semi-gloss solder mask with fine grain and raised copper under it, satin gold tracks and pads, bright tinned pins, moulded black epoxy with laser-etched markings, brushed aluminium cans, iridescent bare silicon.',
    camera: 'Macro lens, very shallow focus that rides with the pulse. One continuous forward flight that starts low at the edge of the board, sways gently after the pulse, cranes up over the processor and glides on to settle above the last stop.',
    post: 'Real depth of field and motion blur, bloom only on the signal and LEDs, filmic contrast with deep blacks, slight lens fringing, vignette, fine grain.',
    explains: 'Journeys and pipelines: something travels through a system and each stage does its part. Every stage is a landmark with a printed label; the pulse and the camera carry the order.',
    topic: "A prompt's trip across a chip: PROMPT, MEMORY, PROCESSOR, ANSWER",
    duration: 8,
    fonts: ['600 200px "IBM Plex Mono"', '500 64px "IBM Plex Mono"'],
    render: { samples: 64, shutter: 0.5, tone: 'filmic', exposure: 1.15, bloom: 0.7, bloomThreshold: 1.3, vignette: 0.42, grain: 0.03, ca: 0.012, fov: 32, near: 0.2, far: 160, background: '#010304' },

    build(S) {
      const { THREE, scene, camera } = S, P = plan(), rnd = K.rng(4);
      scene.fog = new THREE.FogExp2('#02060a', 0.016);

      // ---------------------------------------------------------------- light
      // Moonlight from the back left, well off the flight axis: it rims every part and rakes the copper under the mask,
      // but its mirror glare on the semi-gloss board falls outside the frame, so blacks stay deep and the labels stay
      // out of the long shadows of the ports. Thin bright strips in the environment make the glints on metal.
      K.env(S, { top: '#0a1422', horizon: '#04070b', bottom: '#000000', intensity: 0.75, panels: [
        { pos: [8, 18, -30], size: [28, 12], color: '#a9c8ff', power: 1.4 },
        { pos: [-22, 5, -14], size: [1.4, 10], color: '#cfe0ff', power: 7 },
        { pos: [22, 4, 6], size: [1.2, 8], color: '#ffd9a8', power: 3 },
      ] });
      K.sun(S, { pos: [-24, 18, -28], target: [0, 0, -18], color: '#b9d0ff', power: 1.3, size: 27, soft: 1.0, mapSize: 4096 });
      // The signal's own light. One warm point light with shadows rides with the pulse for the whole trip.
      const hero = new THREE.PointLight('#ffac5a', 0, 0, 2);
      hero.castShadow = true; hero.shadow.mapSize.setScalar(1024); hero.shadow.camera.near = 0.05; hero.shadow.camera.far = 40; hero.shadow.bias = -0.004; hero.shadow.normalBias = 0.03;
      scene.add(hero);

      // ---------------------------------------------------------------- materials
      const std = (o) => new THREE.MeshStandardMaterial(o);
      const grain = K.canvasTex(256, 256, (c) => { const r = K.rng(3), d = c.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { d.data[i] = d.data[i + 1] = d.data[i + 2] = 90 + r() * 120; d.data[i + 3] = 255; } c.putImageData(d, 0, 0); }, { data: true });
      const M = {
        gold: std({ color: '#d9a546', metalness: 1, roughness: 0.36 }),
        tin: std({ color: '#b9bdc3', metalness: 1, roughness: 0.34 }),
        steel: std({ color: '#878c93', metalness: 1, roughness: 0.4 }),
        alu: std({ color: '#c3c7cc', metalness: 1, roughness: 0.27 }),
        epoxy: std({ color: '#0c0c0d', roughness: 0.7, bumpMap: grain, bumpScale: 0.5 }),
        plastic: std({ color: '#070708', roughness: 0.5 }),
        ceramic: std({ color: '#ffffff', roughness: 0.62 }),          // tinted per instance: tan capacitors, black resistors
      };
      const col = new THREE.Color();
      const add = (geo, mat, x, y, z, cast = true, parent = scene) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; };
      // an InstancedMesh you can keep adding to: b.put(position, rotation, scale, colour)
      const batch = (geo, mat, max, cast = true) => {
        const m = new THREE.InstancedMesh(geo, mat, max); m.count = 0; m.castShadow = cast; m.receiveShadow = true; m.frustumCulled = false; scene.add(m);
        m.put = (p, r, s, c) => { K.place(m, m.count, p, r, s); if (c) m.setColorAt(m.count, col.set(c)); m.count++; };
        return m;
      };
      // gull-wing pin, unit size: reaches 1 along +x, shoulder at height 1. Scaled per chip.
      const gull = (() => { const s = new THREE.Shape(), th = 0.15; s.moveTo(-0.15, 1); s.lineTo(0.3, 1); s.lineTo(0.56, th); s.lineTo(1, th); s.lineTo(1, 0); s.lineTo(0.47, 0); s.lineTo(0.21, 1 - th); s.lineTo(-0.15, 1 - th); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false }); g.translate(0, 0, -0.5); return g; })();
      const pins = batch(gull, M.tin, 1400), pads = batch(new THREE.BoxGeometry(1, 0.012, 1), M.gold, 2600, false);
      const bodies = batch(K.roundedBox(1, 1, 1, 0.1, 2), M.ceramic, 500), caps = batch(K.roundedBox(1, 1, 1, 0.12, 2), M.tin, 1000);

      // what is where: parts claim their footprint so the random dressing never lands on the route or on a label
      const taken = [], silk = [], printed = [];
      const claim = (x, z, w, d, pad = 0.12) => taken.push([x - w / 2 - pad, z - d / 2 - pad, x + w / 2 + pad, z + d / 2 + pad]);
      const free = (x, z, w, d) => x - w / 2 > BOARD.x0 + 0.4 && x + w / 2 < BOARD.x1 - 0.4 && z + d / 2 < BOARD.zNear - 0.4 && z - d / 2 > BOARD.zFar + 0.4 && !taken.some((b) => x + w / 2 > b[0] && x - w / 2 < b[2] && z + d / 2 > b[1] && z - d / 2 < b[3]);
      const claimLine = (pts, half) => { const m = measure(pts); for (let s = 0; s <= m.len; s += 0.25) { const p = m.at(s); claim(p[0], p[1], half * 2, half * 2, 0); } };

      // ---------------------------------------------------------------- parts
      // The top of a moulded package: speckle, a pin-1 dimple and laser-etched lines (a lighter, matt grey).
      const etched = (lines, w, d, o = {}) => K.canvasTex(512, Math.round(512 * d / w), (c, W, H) => {
        c.fillStyle = o.base || '#141415'; c.fillRect(0, 0, W, H);
        const r = K.rng(lines.join('') + w); for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(255,255,255,${r.range(0.01, 0.05)})`; c.fillRect(r() * W, r() * H, 1.5, 1.5); }
        c.strokeStyle = 'rgba(255,255,255,0.05)'; c.lineWidth = 3; c.strokeRect(14, 14, W - 28, H - 28);
        const g = c.createRadialGradient(46, H - 46, 2, 46, H - 46, 18); g.addColorStop(0, '#050505'); g.addColorStop(0.8, '#0a0a0a'); g.addColorStop(1, '#1e1e1f');
        c.fillStyle = g; c.beginPath(); c.arc(46, H - 46, 18, 0, 7); c.fill();
        c.fillStyle = o.ink || '#7b7972'; c.textAlign = 'center'; c.textBaseline = 'middle';
        const px = Math.min(H / (lines.length + 1.1), W * 0.8 / (0.6 * Math.max(...lines.map((l) => l.length))));
        lines.forEach((l, i) => { c.font = `${i ? 500 : 600} ${Math.round(px * (i ? 0.6 : 1))}px "IBM Plex Mono"`; c.fillText(l, W / 2, H / 2 + (i - (lines.length - 1) / 2) * px * 0.95); });
      });
      // K.roundedBox squeezes its UVs into the rounded corners, so printed tops get a flat projection from above instead
      const flatTop = (g, w, d) => { const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, 0.5 - p.getZ(i) / d); return g; };
      const SIDE = { '+z': -Math.PI / 2, '-z': Math.PI / 2, '+x': 0, '-x': Math.PI };
      let nU = 5, nC = 0, nL = 0;
      function chip(x, z, w, d, h, o = {}) {
        const top = std({ map: etched(o.mark || ['FX' + (200 + nU * 7)], w, d), roughness: 0.6, bumpMap: grain, bumpScale: 0.5 });
        add(flatTop(K.roundedBox(w, h, d, 0.03, 2), w, d), [M.epoxy, M.epoxy, top, M.epoxy, M.epoxy, M.epoxy], x, 0.05 + h / 2, z);
        const pitch = o.pitch || 0.17, hs = 0.05 + h * 0.6;
        for (const side of o.pins || ['+z', '-z']) {
          const alongX = side[1] === 'z', span = alongX ? w : d, n = Math.floor((span - 0.2) / pitch), sg = side[0] === '+' ? 1 : -1;
          for (let i = 0; i < n; i++) {
            const u = (i - (n - 1) / 2) * pitch, px = alongX ? x + u : x + sg * w / 2, pz = alongX ? z + sg * d / 2 : z + u;
            pins.put([px, 0.014, pz], [0, SIDE[side], 0], [0.3, hs, pitch * 0.42]);
            pads.put([px + (alongX ? 0 : sg * 0.2), 0.006, pz + (alongX ? sg * 0.2 : 0)], [0, SIDE[side], 0], [0.32, 1, pitch * 0.58]);
          }
        }
        silk.push([x, z, w + (o.pins && o.pins.includes('+x') ? 0.9 : 0.16), d + (!o.pins || o.pins.includes('+z') ? 0.9 : 0.16), o.ref || 'U' + ++nU]);
        claim(x, z, w + 0.8, d + 0.8);
      }
      // surface-mount electrolytic capacitor: a black plastic base, an aluminium can with a crimp, a printed top
      const canTop = K.canvasTex(256, 256, (c) => {
        c.fillStyle = '#a3a8ae'; c.fillRect(0, 0, 256, 256);
        c.strokeStyle = 'rgba(255,255,255,0.10)'; for (let r = 8; r < 128; r += 5) { c.beginPath(); c.arc(128, 128, r, 0, 7); c.stroke(); }
        c.fillStyle = '#0a0a0b'; c.beginPath(); c.arc(128, 128, 126, Math.PI * 0.72, Math.PI * 1.28); c.fill();      // polarity mark
        c.font = '600 46px "IBM Plex Mono"'; c.textAlign = 'center'; c.fillText('220', 150, 118); c.font = '500 34px "IBM Plex Mono"'; c.fillText('16V', 150, 160);
      });
      const canTopMat = std({ map: canTop, metalness: 1, roughness: 0.42 }), canGeo = {};
      function can(x, z, r, h) {
        const key = r + '/' + h;
        canGeo[key] = canGeo[key] || new THREE.LatheGeometry([[0, h], [r - 0.07, h], [r - 0.02, h - 0.025], [r, h - 0.08], [r, 0.3], [r - 0.045, 0.26], [r - 0.045, 0.2], [r, 0.16], [r, 0]].reverse().map(([a, b]) => new THREE.Vector2(a, b)), 48);   // bottom to top, so the faces point outwards
        add(K.roundedBox(r * 2 + 0.14, 0.18, r * 2 + 0.14, 0.04, 2), M.plastic, x, 0.11, z);
        add(canGeo[key], M.alu, x, 0.2, z);
        const t = add(new THREE.CircleGeometry(r - 0.08, 40), canTopMat, x, 0.2 + h + 0.002, z, false); t.rotation.x = -Math.PI / 2; t.rotation.z = rnd.range(-0.3, 0.3);
        for (const e of [-1, 1]) { caps.put([x + e * (r + 0.16), 0.03, z], null, [0.3, 0.035, 0.4]); pads.put([x + e * (r + 0.14), 0.006, z], null, [0.55, 1, 0.6]); }
        silk.push([x, z, r * 2 + 0.34, r * 2 + 0.34, 'C' + ++nC, true]); claim(x, z, r * 2 + 0.9, r * 2 + 0.5);
      }
      // the small bricks: ceramic capacitors (tan) and resistors (black), each with tinned end caps on gold pads
      function brick(x, z, len, wid, h, ry, color) {
        const c = Math.cos(ry), s = Math.sin(ry);
        bodies.put([x, 0.014 + h / 2, z], [0, ry, 0], [len * 0.62, h, wid], color);
        for (const e of [-1, 1]) { caps.put([x + e * c * len * 0.39, 0.014 + h / 2, z - e * s * len * 0.39], [0, ry, 0], [len * 0.24, h * 1.07, wid * 1.07]); pads.put([x + e * c * len * 0.44, 0.006, z - e * s * len * 0.44], [0, ry, 0], [len * 0.4, 1, wid * 1.25]); }
      }
      const TAN = ['#8c6a48', '#7d5c3e', '#987650'], bricks = (x, z, n, dx, dz, kind) => { for (let i = 0; i < n; i++) brick(x + dx * i, z + dz * i, 0.5, 0.26, kind ? 0.14 : 0.24, dx ? Math.PI / 2 : 0, kind ? '#0b0b0c' : rnd.pick(TAN)); const w = Math.abs(dx) * (n - 1) + (dx ? 0.3 : 0.6), d = Math.abs(dz) * (n - 1) + (dx ? 0.6 : 0.3); claim(x + dx * (n - 1) / 2, z + dz * (n - 1) / 2, w, d, 0.1); };
      // a shielded power inductor: a squat grey block with a printed value
      function inductor(x, z, s) {
        const top = std({ map: etched([rnd.pick(['4R7', '100', '2R2'])], 1, 1, { base: '#2a2b2e', ink: '#b9b9b4' }), roughness: 0.85 }), side = std({ color: '#232427', roughness: 0.85 });
        add(flatTop(K.roundedBox(s, s * 0.62, s, 0.1, 3), s, s), [side, side, top, side, side, side], x, 0.02 + s * 0.31, z);
        for (const e of [-1, 1]) { caps.put([x + e * s * 0.5, 0.07, z], null, [0.12, 0.14, s * 0.6]); pads.put([x + e * s * 0.52, 0.006, z], null, [0.4, 1, s * 0.75]); }
        silk.push([x, z, s + 0.5, s + 0.24, 'L' + ++nL]); claim(x, z, s + 0.8, s + 0.4);
      }
      // an indicator LED: a milky brick that lights up, with a small light of its own
      function led(x, z, color, lamp = true) {
        const mat = std({ color: '#d9dde0', roughness: 0.35, emissive: color, emissiveIntensity: 0 });
        add(K.roundedBox(0.3, 0.17, 0.24, 0.05, 2), mat, x, 0.1, z, false);
        for (const e of [-1, 1]) { caps.put([x + e * 0.2, 0.08, z], null, [0.12, 0.15, 0.26]); pads.put([x + e * 0.24, 0.006, z], null, [0.24, 1, 0.32]); }
        claim(x, z, 0.9, 0.5); if (!lamp) { mat.emissiveIntensity = 9; return null; }
        const l = new THREE.PointLight(color, 0, 7, 2); l.position.set(x, 0.5, z); scene.add(l);
        return (k) => { mat.emissiveIntensity = 16 * k; l.intensity = 1.6 * k; };
      }
      // a metal-shell port. face = +1: mouth towards the camera, -1: mouth away. Returns (k) => set the glow inside.
      function port(x, z, face) {
        const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = face > 0 ? 0 : Math.PI; scene.add(g);
        const W = 2.6, H = 0.9, D = 2.2, y = H / 2 + 0.03;
        const rr = (w, h, r, s) => { const a = w / 2, b = h / 2; s.moveTo(-a + r, -b); s.lineTo(a - r, -b); s.absarc(a - r, -b + r, r, -Math.PI / 2, 0); s.lineTo(a, b - r); s.absarc(a - r, b - r, r, 0, Math.PI / 2); s.lineTo(-a + r, b); s.absarc(-a + r, b - r, r, Math.PI / 2, Math.PI); s.lineTo(-a, -b + r); s.absarc(-a + r, -b + r, r, Math.PI, Math.PI * 1.5); return s; };
        const tube = rr(W, H, 0.28, new THREE.Shape()); tube.holes.push(rr(W - 0.13, H - 0.13, 0.22, new THREE.Path()));
        add(new THREE.ExtrudeGeometry(tube, { depth: D, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2, curveSegments: 10 }), M.steel, 0, y, -D / 2, true, g);
        add(new THREE.ExtrudeGeometry(rr(W - 0.14, H - 0.14, 0.21, new THREE.Shape()), { depth: D * 0.4, bevelEnabled: false, curveSegments: 8 }), M.plastic, 0, y, -D / 2 + 0.02, false, g);   // the back wall
        add(new THREE.BoxGeometry(W * 0.7, 0.1, D * 0.5), std({ color: '#121214', roughness: 0.5 }), 0, y, D * 0.16, false, g);                                                  // the tongue
        const glow = std({ color: '#d9a546', metalness: 1, roughness: 0.3, emissive: '#ffb25e', emissiveIntensity: 0 });
        add(new THREE.ExtrudeGeometry(rr(W - 0.14, H - 0.14, 0.21, new THREE.Shape()), { depth: 0.03, bevelEnabled: false, curveSegments: 8 }), M.steel, 0, y, -D / 2 - 0.005, false, g);              // the closed rear of the shell
        for (let i = 0; i < 10; i++) add(new THREE.BoxGeometry(0.085, 0.014, D * 0.38), glow, (i - 4.5) * 0.17, y + 0.055, D * 0.2, false, g);                               // the contacts
        for (const sx of [-0.62, 0.62]) add(new THREE.BoxGeometry(0.5, 0.012, 0.32), M.plastic, sx, H + 0.03, 0.25, false, g);                                                // stamped windows in the shell
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) { add(K.roundedBox(0.16, 0.36, 0.42, 0.04, 2), M.tin, sx * (W / 2 + 0.03), 0.18, sz * D * 0.28, true, g); pads.put([x + sx * (W / 2 + 0.12), 0.006, z + sz * D * 0.28], null, [0.5, 1, 0.7]); }
        for (let i = 0; i < 9; i++) { const px = x + (i - 4) * 0.2, pz = z - face * (D / 2 - 0.02); pins.put([px, 0.014, pz], [0, face * Math.PI / 2, 0], [0.34, 0.24, 0.085]); pads.put([px, 0.006, pz - face * 0.24], null, [0.12, 1, 0.34]); }
        const l = new THREE.PointLight('#ffb060', 0, 9, 2); l.position.set(0, y + 0.1, D * 0.25); g.add(l);
        const spill = new THREE.SpotLight('#ffb060', 0, 16, 0.8, 1, 2); spill.position.set(0, y, D / 2 - 0.3); spill.target.position.set(0, face > 0 ? -1.6 : -0.7, D / 2 + (face > 0 ? 4 : 6)); g.add(spill, spill.target);   // light falling out of the mouth onto the desk
        claim(x, z, W + 1.2, D + 1.4);
        return (k) => { glow.emissiveIntensity = 9 * k; l.intensity = 2.4 * k; spill.intensity = (face > 0 ? 60 : 800) * k; };
      }

      // ---------------------------------------------------------------- the landmarks
      const portIn = port(PORT_IN[0], PORT_IN[1], 1), portOut = port(PORT_OUT[0], PORT_OUT[1], -1);
      MEM.xs.forEach((x, i) => chip(x, MEM.z, MEM.w, MEM.d, 0.3, { mark: ['FX8G', 'DR5-2611 M' + (i + 1)], ref: 'U' + (i + 1) }));
      // glow that leaks out from under a working chip: a soft additive patch on the board, with the pins in silhouette
      const haze = K.canvasTex(256, 256, (c) => { c.filter = 'blur(26px)'; c.fillStyle = '#fff'; c.fillRect(64, 64, 128, 128); });
      const underglow = (x, z, w, d) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w * 2, d * 2), new THREE.MeshBasicMaterial({ map: haze, color: 0, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.02, z); scene.add(m); return m.material.color; };
      const memGlow = MEM.xs.map((x) => underglow(x, MEM.z, MEM.w + 0.5, MEM.d + 0.9));

      // The processor: a dark substrate in a nickel frame carrying a grid of bare silicon dies. Each die has a floorplan
      // that reads as iridescent metal when idle and as a lit city block when the core is working.
      const floorplan = (lit) => K.canvasTex(512, 512, (c) => {
        const r = K.rng(77); c.fillStyle = lit ? '#000' : '#6a7180'; c.fillRect(0, 0, 512, 512);
        const split = (x, y, w, h, n) => {
          if (n > 0 && (w > 230 || h > 230 || r.chance(0.5))) { const f = r.range(0.35, 0.65); if (w > h) { split(x, y, w * f, h, n - 1); split(x + w * f, y, w * (1 - f), h, n - 1); } else { split(x, y, w, h * f, n - 1); split(x, y + h * f, w, h * (1 - f), n - 1); } return; }
          const b = r.range(0.25, 1), hatch = r.chance(0.7), vert = r.chance(0.5);
          if (lit) {
            c.fillStyle = `rgba(255,255,255,${hatch ? b * 0.1 : b * 0.3})`; c.fillRect(x + 4, y + 4, w - 8, h - 8);
            c.strokeStyle = `rgba(255,255,255,${0.5 + b * 0.5})`; c.lineWidth = 4; c.strokeRect(x + 6, y + 6, w - 12, h - 12);
            if (hatch) { c.fillStyle = `rgba(255,255,255,${b})`; for (let k = 12; k < (vert ? w : h) - 14; k += 14) vert ? c.fillRect(x + k, y + 12, 6, h - 24) : c.fillRect(x + 12, y + k, w - 24, 6); }
            else for (let k = 0; k < w * h / 700; k++) c.fillRect(x + 12 + Math.floor(r() * (w - 30) / 12) * 12, y + 12 + Math.floor(r() * (h - 30) / 12) * 12, 7, 7);
          } else { c.fillStyle = r.pick(['#59606e', '#7a7468', '#566d6d', '#72688a', '#8a8f9a']); c.fillRect(x + 3, y + 3, w - 6, h - 6); }
        };
        split(26, 26, 460, 460, 4);
        c.fillStyle = lit ? 'rgba(255,255,255,0.9)' : '#b9a36a'; for (let k = 0; k < 30; k++) for (const [x, y] of [[20 + k * 16.3, 10], [20 + k * 16.3, 496], [10, 20 + k * 16.3], [496, 20 + k * 16.3]]) c.fillRect(x - 3, y - 3, 6, 6);   // bond pads
      });
      const planDim = floorplan(false), planLit = floorplan(true), dieSide = std({ color: '#17181b', metalness: 0.6, roughness: 0.4 }), cores = [];
      {
        const { x, z, size: s } = CPU, inner = s - 2.1, pitch = (inner - 0.3) / CORES, die = pitch * 0.85;
        const subTop = std({ roughness: 0.55, map: K.canvasTex(1024, 1024, (c) => {
          const r = K.rng(9); c.fillStyle = '#14130f'; c.fillRect(0, 0, 1024, 1024);
          c.strokeStyle = 'rgba(190,150,70,0.22)'; c.lineWidth = 2; for (let k = 0; k < 220; k++) { const a = r() * 6.283, d0 = r.range(120, 360), d1 = d0 + r.range(60, 160); c.beginPath(); c.moveTo(512 + Math.cos(a) * d0, 512 + Math.sin(a) * d0); c.lineTo(512 + Math.cos(a) * d1, 512 + Math.sin(a) * d1); c.stroke(); }
          c.fillStyle = '#b08a3e'; for (let k = 0; k < 60; k++) for (const [px, py] of [[32 + k * 16.3, 14], [32 + k * 16.3, 1010], [14, 32 + k * 16.3], [1010, 32 + k * 16.3]]) { c.beginPath(); c.arc(px, py, 4, 0, 7); c.fill(); }
          c.beginPath(); c.moveTo(30, 994); c.lineTo(74, 994); c.lineTo(30, 950); c.fill();
        }) });
        const sub = std({ color: '#12110e', roughness: 0.6 });
        add(flatTop(K.roundedBox(s, 0.14, s, 0.03, 2), s, s), [sub, sub, subTop, sub, sub, sub], x, 0.12, z);
        const ring = new THREE.Shape(), a = s / 2 - 0.22, b = inner / 2;
        ring.moveTo(-a, -a); ring.lineTo(a, -a); ring.lineTo(a, a); ring.lineTo(-a, a); ring.closePath();
        const hole = new THREE.Path(); hole.moveTo(-b, -b); hole.lineTo(-b, b); hole.lineTo(b, b); hole.lineTo(b, -b); hole.closePath(); ring.holes.push(hole);
        const frame = add(new THREE.ExtrudeGeometry(ring, { depth: 0.1, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 2 }), std({ color: '#3a3d43', metalness: 1, roughness: 0.48 }), x, 0.215, z); frame.rotation.x = -Math.PI / 2;
        for (let i = 0; i < CORES; i++) for (let j = 0; j < CORES; j++) {
          const top = new THREE.MeshPhysicalMaterial({ map: planDim, color: '#aab2c4', metalness: 1, roughness: 0.26, emissive: '#ff8a2a', emissiveMap: planLit, emissiveIntensity: 0, iridescence: 1, iridescenceIOR: 1.7, iridescenceThicknessRange: [220, 420] });
          const cx = x + (i - (CORES - 1) / 2) * pitch, cz = z - (j - (CORES - 1) / 2) * pitch;
          add(new THREE.BoxGeometry(die + 0.12, 0.04, die + 0.12), M.plastic, cx, 0.2, cz, false);                           // underfill
          const m = add(flatTop(K.roundedBox(die, 0.1, die, 0.012, 1), die, die), [dieSide, dieSide, top, dieSide, dieSide, dieSide], cx, 0.26, cz); m.rotation.y = Math.floor(K.hash(i, j) * 4) * Math.PI / 2;
          cores.push({ top, t0: P.coreT(i, j), seed: i * 7 + j });
        }
        silk.push([x, z, s + 0.3, s + 0.3, '']); claim(x, z, s + 1.0, s + 1.0);
      }
      const cpuGlow = underglow(CPU.x, CPU.z, CPU.size * 0.78, CPU.size * 0.78), outGlow = underglow(PORT_OUT[0], PORT_OUT[1] + 0.3, 2.6, 2.4);
      // how bright a core is: it flashes on when the wave reaches it, shimmers while it works, and all cores beat once
      // together at the moment the answer leaves
      const coreLevel = (c, t) => {
        const a = t - c.t0; if (a <= 0) return 0;
        const on = 1 - Math.exp(-a / 0.04), flash = Math.exp(-a / 0.22), work = 0.5 + 0.22 * Math.sin(t * 31 + c.seed * 2.4) * Math.sin(t * 13.7 + c.seed);
        const out = t - T.cpuOut, beat = out > -0.12 ? (out < 0 ? K.smooth(-0.12, 0, out) * 0.9 : 0.9 * Math.exp(-out / 0.35)) : 0;
        return on * (work * (out > 0 ? 0.55 + 0.45 * Math.exp(-out / 0.5) : 1) + 1.1 * flash + beat);
      };

      // ---------------------------------------------------------------- the printed labels
      // White silkscreen, stretched along the direction of flight like road markings so it still reads from a low camera.
      const STRETCH = 1.4;
      const label = (text, ref, x, z, align) => {
        const m = K.textPlane(text, { font: '600 200px "IBM Plex Mono"', height: 1.0, color: '#eceadf', lit: true, letterSpacing: 6, roughness: 0.78, pad: 20 });
        const r = K.rng(text), c = m.userData.tex.ctx; c.globalCompositeOperation = 'destination-out';       // pinholes and thin patches, as in real screen print
        for (let i = 0; i < 500; i++) { c.fillStyle = `rgba(0,0,0,${r.range(0.15, 0.9)})`; c.beginPath(); c.arc(r() * c.canvas.width, r() * c.canvas.height, r.range(0.6, 2.4), 0, 7); c.fill(); }
        m.userData.tex.needsUpdate = true;
        const w = m.userData.size[0], d = m.userData.size[1] * STRETCH, cx = align === 'left' ? x + w / 2 : align === 'right' ? x - w / 2 : x;
        m.rotation.x = -Math.PI / 2; m.scale.y = STRETCH; m.position.set(cx, 0.006, z); m.receiveShadow = true; scene.add(m);
        const s = K.textPlane(ref, { font: '500 64px "IBM Plex Mono"', height: 0.3, color: '#eceadf', lit: true, roughness: 0.78 });
        s.rotation.x = -Math.PI / 2; s.scale.y = STRETCH; s.position.set(cx - w / 2 + s.userData.size[0] / 2 + 0.1, 0.006, z - d / 2 + 0.02); s.receiveShadow = true; scene.add(s);
        claim(cx, z - 0.15, w, d + 0.5, 0.2); printed.push([cx, z - 0.12, w + 0.3, d + 0.55]);
        return m;
      };
      label(STOPS[0], REFS[0], PORT_IN[0] - 1.9, 0.5, 'right');
      label(STOPS[1], REFS[1], 0.2, P.lane + 1.15, 'center');
      label(STOPS[2], REFS[2], P.busX + 1.1, CPU.z + CPU.size / 2 + 1.45, 'left');
      label(STOPS[3], REFS[3], PORT_OUT[0] - 1.8, PORT_OUT[1] - 0.05, 'right');

      // ---------------------------------------------------------------- the streets
      // Every gold track is a flat ribbon. Each vertex stores the time a pulse passes it (aT) plus [strength, repeat
      // period, position across the track] (aK); the shader lights each bit of track from its own clock: a white-hot
      // head, an amber tail that cools in a third of a second and a faint ember. Motion blur comes for free.
      const rib = { pos: [], aT: [], aK: [], idx: [] };
      const track = (pts, width, timeAt, amp = 1, period = 0) => {
        const L = offset(pts, width / 2), R = offset(pts, -width / 2), m = measure(pts);
        for (let i = 0; i < pts.length - 1; i++) {
          const n = Math.max(1, Math.ceil((m.cum[i + 1] - m.cum[i]) / 0.12));
          for (let k = 0; k <= n; k++) {
            const f = k / n, s = K.lerp(m.cum[i], m.cum[i + 1], f), tt = timeAt ? timeAt(s) : 1e4, v = rib.pos.length / 3;
            rib.pos.push(K.lerp(L[i][0], L[i + 1][0], f), 0.011, K.lerp(L[i][1], L[i + 1][1], f), K.lerp(R[i][0], R[i + 1][0], f), 0.011, K.lerp(R[i][1], R[i + 1][1], f));
            rib.aT.push(tt, tt); rib.aK.push(amp, period, 0, amp, period, 1);
            if (k < n) rib.idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
          }
        }
        claimLine(pts, width / 2 + 0.18);
      };
      track(P.a.pts, 0.13, P.runA.timeAt);
      P.taps.forEach((q) => track(q.path.pts, 0.1, q.run.timeAt));
      P.bus.forEach((q) => track(q.path.pts, 0.09, q.run.timeAt));
      track(P.c.pts, 0.13, P.runC.timeAt);
      // side streets: bundles of parallel tracks fanning out of the big chips, with a little dim traffic of their own
      const STREETS = [
        { n: 7, pts: [[CPU.x - 4.55, -24.6], [-5.4, -24.6], [-7.6, -22.4], [-7.6, -16.5], [-9.6, -14.5], [-9.6, -7.3]] },
        { n: 6, pts: [[CPU.x + 4.55, -24.0], [7.9, -24.0], [9.6, -22.3], [9.6, -13.2]] },
        { n: 5, pts: [[-0.6, CPU.z - 4.55], [-0.6, -32.4], [-2.4, -34.2], [-9.6, -34.2]] },
        { n: 4, pts: [[CPU.x + 4.55, -27.9], [8.3, -27.9], [9.5, -29.1], [9.5, -33.4]] },
        { n: 6, pts: [[5.4, P.pinNear + 0.1], [5.4, -8.2], [7.2, -6.4], [7.2, -2.4]] },
      ];
      STREETS.forEach((b, bi) => { for (let k = 0; k < b.n; k++) { const pts = offset(b.pts, (k - (b.n - 1) / 2) * 0.2), live = K.hash(bi, k) < 0.4, len = measure(pts).len, ph = K.hash(k, bi) * 3, dir = K.hash(bi, k, 3) < 0.5; track(pts, 0.075, live ? (s) => ph + (dir ? s : len - s) / 7 : null, 0.22, 2.4 + K.hash(bi, k, 9)); } });
      const uTime = { value: 0 }, ribbons = new THREE.BufferGeometry();
      ribbons.setAttribute('position', new THREE.Float32BufferAttribute(rib.pos, 3)); ribbons.setAttribute('aT', new THREE.Float32BufferAttribute(rib.aT, 1)); ribbons.setAttribute('aK', new THREE.Float32BufferAttribute(rib.aK, 3));
      ribbons.setAttribute('normal', new THREE.Float32BufferAttribute(rib.pos.map((_, i) => (i % 3 === 1 ? 1 : 0)), 3)); ribbons.setIndex(rib.idx);
      const trackMat = M.gold.clone(); trackMat.side = THREE.DoubleSide;
      trackMat.onBeforeCompile = (sh) => {
        sh.uniforms.uTime = uTime;
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aT; attribute vec3 aK; varying float vT; varying vec3 vK;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvT = aT; vK = aK;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uTime; varying float vT; varying vec3 vK;').replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          float age = uTime - vT; if (vK.y > 0.0) age = mod(age, vK.y);
          float a = max(age, 0.0), front = age < 0.0 ? exp(age / 0.006) : 1.0;
          float heat = front * (10.0 * exp(-a / 0.035) + 1.5 * exp(-a / 0.3) + (vK.y > 0.0 ? 0.0 : 0.22));
          float across = 1.0 - 0.5 * pow(abs(vK.z * 2.0 - 1.0), 3.0);
          totalEmissiveRadiance += mix(vec3(1.0, 0.42, 0.09), vec3(1.0, 0.8, 0.52), exp(-a / 0.05)) * heat * vK.x * across;`);
      };
      const streets = new THREE.Mesh(ribbons, trackMat); streets.receiveShadow = true; streets.frustumCulled = false; scene.add(streets);

      // ---------------------------------------------------------------- the rest of the city
      // hand-placed where the camera looks, then a seeded scatter fills the outskirts
      const pwr = led(PORT_IN[0] + 2.1, -0.4, '#35ff7a'), act = led(MEM.xs[3] + 1.9, P.lane + 0.1, '#ffb347'), done = led(PORT_OUT[0] - 1.75, PORT_OUT[1] + 2.1, '#35ff7a');
      const far1 = led(-9.2, -20.5, '#ff3b30'), far2 = led(10.2, -30.2, '#ff3b30');
      claim(3, -34.2, 8.5, 3.8);                                                       // keep the ground in front of the last stop clear for the final frame
      for (let i = 0, n = 0; i < 300 && n < 18; i++) { const x = rnd.range(BOARD.x0, BOARD.x1), z = rnd.range(BOARD.zFar, -5); if (Math.abs(x - 1) > 6 && free(x, z, 0.9, 0.5)) { led(x, z, rnd.pick(['#ffb347', '#ffb347', '#35ff7a', '#ff3b30']), false); n++; } }   // distant windows: they turn into bokeh
      chip(4.6, -3.6, 1.3, 1.1, 0.26, { pins: ['-x', '+x'], pitch: 0.24 });
      chip(-9.6, -5.9, 2.4, 1.7, 0.3, { pitch: 0.2 }); chip(9.6, -11.8, 2.2, 1.7, 0.3, { pitch: 0.2 }); chip(7.2, -1.0, 2.0, 1.6, 0.3, { pitch: 0.2 }); chip(-10.3, -34.2, 1.6, 2.2, 0.3, { pins: ['+x', '-x'], pitch: 0.2 }); chip(9.5, -34.6, 2.2, 1.6, 0.3, { pitch: 0.2 });
      bricks(MEM.xs[0] - 1.5, MEM.z - 0.9, 4, 0, 0.6, 0); bricks(MEM.xs[3] + 1.5, MEM.z - 0.9, 4, 0, 0.6, 0);
      bricks(CPU.x + CPU.size / 2 + 0.55, CPU.z + 3.2, 5, 0, -0.55, 0); bricks(CPU.x - CPU.size / 2 - 0.55, CPU.z - 1.2, 5, 0, -0.55, 0); bricks(CPU.x - 3.4, CPU.z - CPU.size / 2 - 0.5, 6, 0.6, 0, 0);
      bricks(-2.6, -1.5, 3, 0.6, 0, 1); bricks(PORT_OUT[0] + 1.9, PORT_OUT[1] + 1.9, 3, 0.6, 0, 1);
      [[-7.0, -2.3, 0.75, 2.0], [-8.9, -1.4, 0.6, 1.5], [-7.4, -10.6, 0.9, 2.6], [-9.4, -11.2, 0.75, 2.0], [7.3, -9.9, 0.75, 2.0], [6.6, -16.2, 0.9, 2.6], [8.7, -16.8, 0.9, 2.6], [7.6, -18.9, 0.75, 2.0], [-6.1, -19.6, 0.75, 2.0], [-5.6, -30.6, 0.9, 2.6], [-7.6, -29.8, 0.75, 2.0], [8.2, -36.2, 0.75, 2.0], [10.2, -37.0, 0.6, 1.5], [-3.6, -36.6, 0.75, 2.0]].forEach((c) => can(...c));
      inductor(10.3, -18.4, 1.5); inductor(-10.2, -17.2, 1.5); inductor(-10.4, -27.0, 1.3);
      for (let i = 0, n = 0; i < 900 && n < 70; i++) {
        const x = rnd.range(BOARD.x0, BOARD.x1), z = rnd.range(BOARD.zFar, BOARD.zNear), k = rnd();
        if (k < 0.2 && Math.abs(x - 1) > 6.5) { const r = rnd.pick([0.6, 0.75, 0.9]); if (free(x, z, r * 2 + 0.9, r * 2 + 0.5)) { can(x, z, r, r === 0.9 ? 2.6 : r === 0.6 ? 1.5 : 2.0); n++; } }
        else if (k < 0.4 && Math.abs(x - 1) > 5) { const w = rnd.range(1.2, 2.2), d = rnd.range(1.0, 1.7); if (free(x, z, w + 0.8, d + 0.8)) { chip(x, z, w, d, 0.28, { pitch: 0.2 }); n++; } }
        else if (k < 0.47 && Math.abs(x - 1) > 6.5) { if (free(x, z, 2.2, 1.8)) { inductor(x, z, 1.3); n++; } }
        else { const m = rnd.int(2, 5), horiz = rnd.chance(0.5), w = horiz ? m * 0.6 : 0.6, d = horiz ? 0.6 : m * 0.55; if (free(x + (horiz ? (m - 1) * 0.3 : 0), z + (horiz ? 0 : (m - 1) * 0.275), w, d)) { bricks(x, z, m, horiz ? 0.6 : 0, horiz ? 0 : 0.55, rnd.chance(0.35) ? 1 : 0); n++; } }
      }

      // ---------------------------------------------------------------- the board itself
      // Two canvases painted from the same drawing: colour, and a data map with height in red (the copper under the
      // mask stands a little proud, which is what catches the raking light) and roughness in green.
      const PPU = 128, BW = BOARD.x1 - BOARD.x0, BD = BOARD.zNear - BOARD.zFar, r2 = K.rng(21), inner = [], vias = [];
      for (let b = 0; b < 54; b++) {
        let x = r2.range(BOARD.x0, BOARD.x1), z = r2.range(BOARD.zFar, BOARD.zNear), dir = r2.int(0, 7); const n = r2.int(2, 7), pts = [[x, z]];
        for (let s = r2.int(2, 4); s > 0; s--) { const l = r2.range(1.5, 7); x += Math.cos(dir * Math.PI / 4) * l; z += Math.sin(dir * Math.PI / 4) * l; pts.push([x, z]); dir += r2.pick([-1, 1]); }
        for (let k = 0; k < n; k++) { const o = offset(pts, (k - (n - 1) / 2) * 0.17); inner.push(o); vias.push(o[0], o[o.length - 1]); }
      }
      const gold = [P.a.pts, P.c.pts, ...P.taps.map((q) => q.path.pts), ...P.bus.map((q) => q.path.pts), ...STREETS.flatMap((b) => Array.from({ length: b.n }, (_, k) => offset(b.pts, (k - (b.n - 1) / 2) * 0.2)))];
      const paint = (c, scale, data) => {
        c.scale(scale, scale); c.lineJoin = 'miter'; c.lineCap = 'butt';
        const X = (x) => (x - BOARD.x0) * PPU, Z = (z) => (z - BOARD.zFar) * PPU;
        const line = (pts, w, style) => { c.strokeStyle = style; c.lineWidth = w * PPU; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(X(p[0]), Z(p[1])) : c.moveTo(X(p[0]), Z(p[1])))); c.stroke(); };
        c.fillStyle = data ? 'rgb(0,92,0)' : '#063a22'; c.fillRect(0, 0, BW * PPU, BD * PPU);
        if (!data) { const r = K.rng(5); for (let i = 0; i < 70; i++) { const x = r() * BW * PPU, y = r() * BD * PPU, s = r.range(200, 700), g = c.createRadialGradient(x, y, 0, x, y, s); g.addColorStop(0, `rgba(${r.chance(0.5) ? '4,20,14' : '16,58,40'},0.35)`); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - s, y - s, s * 2, s * 2); } }
        if (data) c.globalCompositeOperation = 'lighter';
        inner.forEach((p) => line(p, 0.075, data ? 'rgb(110,0,0)' : 'rgba(38,112,76,0.55)'));                         // copper under the mask
        c.globalCompositeOperation = 'source-over';
        c.fillStyle = data ? 'rgb(0,92,0)' : '#063a22'; printed.forEach(([x, z, w, d]) => c.fillRect(X(x - w / 2), Z(z - d / 2), w * PPU, d * PPU));   // nothing runs under the big labels
        gold.forEach((p) => line(p, 0.3, data ? 'rgb(0,92,0)' : '#063a22'));                                           // clearance around the gold streets
        if (!data) gold.forEach((p) => line(p, 0.08, '#6b4f1c'));                                                      // (their geometry sits on top; this shows in the mirrored outskirts)
        vias.forEach(([x, z]) => { if (printed.some(([px, pz, pw, pd]) => Math.abs(x - px) < pw / 2 + 0.1 && Math.abs(z - pz) < pd / 2 + 0.1)) return; c.fillStyle = data ? 'rgb(150,40,0)' : '#b98d3a'; c.beginPath(); c.arc(X(x), Z(z), 0.085 * PPU, 0, 7); c.fill(); c.fillStyle = data ? 'rgb(0,200,0)' : '#020403'; c.beginPath(); c.arc(X(x), Z(z), 0.035 * PPU, 0, 7); c.fill(); });
        // silkscreen: an outline and a reference designator for every part
        c.strokeStyle = c.fillStyle = data ? 'rgb(120,190,0)' : '#dddbd0'; c.lineWidth = 0.035 * PPU; c.font = `500 ${0.3 * PPU}px "IBM Plex Mono"`; c.textBaseline = 'bottom';
        silk.forEach(([x, z, w, d, ref, round]) => {
          c.beginPath(); if (round) { c.arc(X(x), Z(z), w / 2 * PPU, 0.25, Math.PI - 0.25); c.moveTo(X(x) + Math.cos(Math.PI + 0.25) * w / 2 * PPU, Z(z) + Math.sin(Math.PI + 0.25) * w / 2 * PPU); c.arc(X(x), Z(z), w / 2 * PPU, Math.PI + 0.25, -0.25); } else c.rect(X(x - w / 2), Z(z - d / 2), w * PPU, d * PPU); c.stroke();
          if (ref) c.fillText(ref, X(x - w / 2), Z(z - d / 2) - 0.06 * PPU);
        });
      };
      const boardMap = K.canvasTex(BW * PPU, BD * PPU, (c) => paint(c, 1, false));
      const boardData = K.canvasTex(BW * PPU / 2, BD * PPU / 2, (c, w, h) => {
        paint(c, 0.5, true); c.setTransform(1, 0, 0, 1, 0, 0);
        const d = c.getImageData(0, 0, w, h), r = K.rng(8);                                                             // fine grain: tiny bumps and roughness speckle
        for (let i = 0; i < d.data.length; i += 4) { const n = r(); d.data[i] = Math.min(255, d.data[i] + n * 16); d.data[i + 1] = Math.min(255, d.data[i + 1] + (r() - 0.5) * 34); }
        c.putImageData(d, 0, 0);
      }, { data: true });
      for (const tx of [boardMap, boardData]) { tx.wrapS = THREE.MirroredRepeatWrapping; tx.repeat.set(2, 1); tx.offset.set(-0.5, 0); }
      // the board is twice as wide as its drawing: the outskirts are the same drawing mirrored, far out of focus
      const floor = K.mirrorFloor(S, { size: 1, color: '#ffffff', surfaceRoughness: 1, roughness: 0.3, strength: 1, fresnel: true, material: { map: boardMap, bumpMap: boardData, bumpScale: 1.2, roughnessMap: boardData } });
      floor.scale.set(BW * 2, BD, 1); floor.position.set(0, 0, (BOARD.zNear + BOARD.zFar) / 2);
      add(new THREE.BoxGeometry(BW * 2, 0.5, BD), std({ color: '#3e4a2b', roughness: 0.7 }), 0, -0.252, (BOARD.zNear + BOARD.zFar) / 2, false);    // the laminate edge
      const desk = add(new THREE.PlaneGeometry(400, 400), std({ color: '#101114', roughness: 0.82, bumpMap: grain, bumpScale: 0.4 }), 0, -0.5, 0, false); desk.rotation.x = -Math.PI / 2;   // a dark bench mat under the board

      // ---------------------------------------------------------------- flight plan
      const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
      const busHead = (t) => { const a = P.bus[3], b = P.bus[4]; return mix(a.path.at(a.run.sAt(t)), b.path.at(b.run.sAt(t)), 0.5); };
      // where the travelling light is: on the pulse while it runs, hovering over a chip while it works
      const heroAt = (t) => {
        const a = P.a.at(P.runA.sAt(t)), b = busHead(t), c = P.c.at(P.runC.sAt(t));
        let p = [a[0], 0.35, a[1]];
        p = mix(p, [0, 0.9, MEM.z + 0.4], K.seg(t, T.memEnd - 0.15, T.memOut, K.ease.inOut));
        p = mix(p, [b[0], 0.4, b[1]], K.seg(t, T.memOut - 0.05, T.memOut + 0.3, K.ease.inOut));
        p = mix(p, [CPU.x, 2.4, CPU.z], K.seg(t, T.cpu, T.wave + T.waveLen * 0.8, K.ease.inOut));
        p = mix(p, [c[0], 0.35, c[1]], K.seg(t, T.cpuOut - 0.1, T.cpuOut + 0.2, K.ease.inOut));
        return mix(p, [PORT_OUT[0], 0.6, PORT_OUT[1] + 1.8], K.seg(t, T.answer - 0.05, T.answer + 0.3, K.ease.out));
      };
      const heroPower = K.track([[0, 0], [T.launch - 0.05, 0], [T.launch + 0.12, 7], [T.memEnd, 7], [T.memOut, 5], [T.cpu, 7], [T.wave + T.waveLen, 16], [T.cpuOut, 15], [T.cpuOut + 0.25, 7], [T.answer, 7], [T.answer + 0.5, 5], [8, 4.5]]);
      // A flight through keyframes [t, [x, y, z]] that never stops on the way: a monotone cubic, so the camera keeps
      // gliding through every key without overshoot and only comes to rest on the last one.
      const fly = (keys) => (t) => {
        const n = keys.length; let i = 1; while (i < n - 1 && keys[i][0] < t) i++;
        const [t0, p0] = keys[i - 1], [t1, p1] = keys[i], h = t1 - t0, u = K.clamp((t - t0) / h), u2 = u * u, u3 = u2 * u;
        const seg = (j, k) => (keys[j + 1][1][k] - keys[j][1][k]) / (keys[j + 1][0] - keys[j][0]);
        const slope = (j, k) => { if (j === 0) return seg(0, k); if (j === n - 1) return 0; const a = seg(j - 1, k), b = seg(j, k); return a * b <= 0 ? 0 : 2 * a * b / (a + b); };
        return p0.map((a, k) => (2 * u3 - 3 * u2 + 1) * a + (u3 - 2 * u2 + u) * h * slope(i - 1, k) + (3 * u2 - 2 * u3) * p1[k] + (u3 - u2) * h * slope(i, k));
      };
      const cam = {
        pos: fly([[0, [0.2, 2.6, 8.8]], [0.7, [0.0, 2.9, 7.6]], [1.3, [-0.6, 3.8, 4.4]], [2.0, [-0.6, 4.7, 1.2]], [2.6, [-0.3, 5.2, -0.6]], [4.0, [1.3, 9.6, -10.3]], [5.5, [1.5, 9.3, -12.0]], [6.9, [3.25, 6.5, -29.8]], [8, [3.3, 6.4, -30.5]]]),
        aim: fly([[0, [0.2, 0.85, -0.6]], [0.7, [-0.3, 0.6, -1.8]], [1.3, [-1.8, 0.2, -7.2]], [2.0, [0, 0.2, -10.8]], [2.6, [0.2, 0.2, -12.0]], [4.0, [1.5, 0, -24.3]], [5.5, [1.6, 0, -25.0]], [6.9, [3.35, 0, -36.8]], [8, [3.35, 0, -36.9]]]),
        focus: fly([[0, [0.2, 0.3, 0.8]], [0.7, [0.5, 0.2, -1.5]], [1.3, [-4, 0.2, -7.5]], [2.0, [0, 0.2, -9.0]], [2.6, [0, 0.2, -9.4]], [4.0, [1.5, 0.2, -21.0]], [5.5, [1.6, 0.3, -22.0]], [6.9, [3.5, 0.3, -36.9]], [8, [3.5, 0.3, -36.9]]]),
        ap: K.track([[0, 0.13], [1.9, 0.12], [4.0, 0.1], [5.5, 0.09], [6.9, 0.11], [8, 0.11]]),
      };
      const portInGlow = K.track([[0, 0.6], [T.launch - 0.04, 1.1, 'in'], [T.launch + 0.6, 0.22, 'out'], [8, 0.22]]);
      const portOutGlow = K.track([[T.answer - 0.06, 0], [T.answer + 0.12, 1.3, 'out'], [T.answer + 0.7, 0.85, 'inOut'], [8, 0.8]]);
      const amber = new THREE.Color('#ff9a3c');

      return {
        update(t) {
          uTime.value = t;
          const h = heroAt(t); hero.position.set(h[0], h[1], h[2]); hero.intensity = heroPower(t);
          // memory: each chip glows from underneath from the moment the pulse reaches it until its data has left
          MEM.xs.forEach((_, i) => { const k = K.seg(t, P.tapT[i] + 0.04, P.tapT[i] + 0.12, K.ease.out) * (1 - 0.85 * K.seg(t, T.memOut + 0.07 * i, T.memOut + 0.07 * i + 0.4)) * (0.85 + 0.15 * Math.sin(t * 47 + i * 2)); memGlow[i].copy(amber).multiplyScalar(1.5 * k); });
          let sum = 0; for (const c of cores) { const k = coreLevel(c, t); sum += k; c.top.emissiveIntensity = 4.6 * k; }
          cpuGlow.copy(amber).multiplyScalar(0.9 * sum / cores.length);
          portIn(portInGlow(t)); portOut(portOutGlow(t)); outGlow.copy(amber).multiplyScalar(1.1 * portOutGlow(t));
          pwr(0.9 + 0.1 * Math.sin(t * 9)); act(t > P.tapT[0] && t < T.memOut + 0.3 ? (Math.sin(t * 60) > -0.2 ? 1 : 0.1) : 0.04); done(K.seg(t, T.answer + 0.12, T.answer + 0.2));
          far1(0.6); far2(0.6);
          K.look(camera, cam.pos(t), cam.aim(t)); K.focus(camera, cam.focus(t), cam.ap(t));
        },
      };
    },

    sound(k) {
      const P = plan(), pan = (x) => K.clamp(x / 9, -0.7, 0.7), rr = K.rng(12);
      // a pulse on a track: a short electric zip that rises as the pulse gathers speed
      const zip = (t0, t1, gain, f, x0, x1) => {
        const d = t1 - t0;
        k.tone(t0, { f: [[0, f], [d, f * 2.5]], type: 'sawtooth', dur: d, gain: 0.05 * gain, a: d * 0.35, hold: d * 0.5, filter: 'bandpass', f2: [[0, 500], [d, 2600]], q: 3, verb: 0.2, pan: pan((x0 + x1) / 2) });
        k.noise(t0, { dur: d, color: 'pink', filter: 'bandpass', f: [[0, 600], [d, 3200]], q: 1.4, gain: 0.17 * gain, a: d * 0.6, verb: 0.2, pan: pan((x0 + x1) / 2) });
      };
      k.bed('room', 0, 8, { gain: 0.9 }); k.bed('hum', 0, 8, { gain: 0.4 });
      k.music('pad', 0, 8, { bpm: 60, chords: [['D3', 'A3', 'D4', 'F#4'], ['D3', 'A3', 'E4', 'G4']], gain: 0.55 });
      // PROMPT: the port charges, a relay clicks, the pulse leaves
      k.tone(0, { f: [[0, 90], [T.launch, 230]], type: 'triangle', dur: T.launch + 0.05, gain: 0.12, a: 0.22, pan: pan(PORT_IN[0]) });
      k.play('click', T.launch, { gain: 1, pan: pan(PORT_IN[0]) }); k.play('thud', T.launch, { gain: 0.35, pan: pan(PORT_IN[0]) });
      zip(T.launch, P.tapT[0], 1, 280, PORT_IN[0], -5);
      // MEMORY: one note per chip as the pulse reaches it, then the chatter of a read
      P.tapT.forEach((t, i) => { k.play('blip', t + 0.04, { f: ['E5', 'G5', 'B5', 'D6'][i], type: 'triangle', dur: 0.12, gain: 1.6, pan: pan(MEM.xs[i]) }); k.play('tock', t + 0.04, { gain: 0.5, f: 700 + i * 90, pan: pan(MEM.xs[i]) }); });
      k.withMinor(() => { for (let t = P.tapT[0] + 0.1; t < T.memOut + 0.25; t += 0.04 + rr() * 0.03) k.play('tick', t, { gain: 0.3 + rr() * 0.3, f: 3200 + rr() * 2600, pan: pan(rr.range(-4, 4)) }); });
      // the bus: eight lines leave one after the other
      k.withMinor(() => P.bus.forEach((q, j) => k.play('tick', q.run.t0, { gain: 0.6, f: 2400 + j * 220, pan: pan(MEM.xs[j >> 1]) })));
      zip(T.memOut, T.cpu, 1.25, 220, 1, P.busX);
      // PROCESSOR: a low thump as the bus lands, one soft bell per core rising with the wave, a swell while it works
      k.play('thud', T.cpu + 0.03, { gain: 0.7, pan: pan(P.busX) });
      const scale = ['D4', 'F#4', 'A4', 'B4', 'D5', 'F#5', 'A5'];
      for (let i = 0; i < CORES; i++) for (let j = 0; j < CORES; j++) { const t = P.coreT(i, j), x = CPU.x + (i - (CORES - 1) / 2) * 1.7; k.tone(t, { f: scale[Math.min(scale.length - 1, i + j)], type: 'triangle', dur: 0.55, gain: 0.07, a: 0.004, verb: 0.4, pan: pan(x) }); k.withMinor(() => k.play('tick', t, { gain: 0.35, f: 5200, pan: pan(x) })); }
      const d = T.cpuOut - T.wave; k.tone(T.wave, { f: [[0, 73.4], [d, 110]], type: 'sawtooth', dur: d + 0.1, gain: 0.07, a: d * 0.9, filter: 'lowpass', f2: [[0, 250], [d, 1500]], verb: 0.2 });
      // out: all cores beat together and the answer leaves; the camera dives after it
      k.play('impact', T.cpuOut, { gain: 0.6, pan: pan(CPU.x) }); zip(T.cpuOut, T.answer, 1.3, 340, CPU.x + 3, PORT_OUT[0]);
      k.play('whoosh', T.cpuOut + 0.1, { dur: 1.0, gain: 0.45, top: 1800 });
      // ANSWER: the pulse lands in the port, the green LED comes on
      k.play('tock', T.answer, { gain: 0.9, f: 520, pan: pan(PORT_OUT[0]) }); k.play('click', T.answer + 0.12, { gain: 0.7, pan: 0.2 });
      k.play('ding', T.answer + 0.12, { f: 'D6', gain: 1, pan: 0.2 }); k.play('ding', T.answer + 0.24, { f: 'A6', gain: 0.6, pan: 0.3 });
    },
  });
}
```
