# White Model (#17)

- **id:** `white-model`
- **Category:** Diagrams with depth
- **Use:** explainer
- **Reference duration:** 8 s
- **Google Fonts:** Inter, IBM Plex Mono
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`

## Style card

- **Look:** An architect's presentation model: everything is matte white card and foam on a white site board, and one saturated accent colour is reserved for the thing being explained.
- **Motion:** Nothing in the model moves. Only the accent moves: it starts at the source and travels through the model along thin conduits, switching each part on as it arrives, and a numbered label with a thin leader line draws in at every stop.
- **Light:** Soft daylight from one side plus sky light with real occlusion, so creases, window reveals and the ground under things darken gently and form does the work colour normally does. The accent glows a little and throws its own colour onto the white around it.
- **Materials:** Four slightly different whites (warm card, cool foam, bright paper, rough plaster) with a fine paper grain and a tiny bevel on every edge; scored pencil lines on the board; a mid-grey table behind, so the white reads as white.
- **Camera:** Long lens with shallow focus, like a photograph of a small model. One slow continuous crane: it starts low and close on the source and rises and pulls back until the whole path is in frame.
- **Finish:** Neutral tone mapping so the whites stay clean and the accent stays true, a light bloom on the accent only, soft vignette, almost no grain.
- **Good for:** How something flows through a system: energy, water, money, data, people. Build the system as a white model, lay the path through it as conduits, and let the accent travel the path in the right order while labels name each stop.

## Reference

- **Sample topic:** How rooftop solar powers a home: sunlight, panels, inverter, home, and the surplus going out to the grid
- **Gallery description:** An architect's presentation model: everything is matte white card and foam on a white site board, and one saturated accent colour is reserved for the thing being explained.
- **Shown in the sample clip:** How rooftop solar powers a home: sunlight, panels, inverter, home, and the surplus going out to the grid

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/white-model.js`)

```js
{
  // ---------------------------------------------------------------- content (change this block for a new topic)
  const ACCENT = '#ff6a00';   // the ONE colour. It only ever means "the thing being explained" (here: energy).
  const TITLE = ['ROOFTOP SOLAR', 'How it powers a home'];
  // One schedule drives the picture and the sound: when the accent reaches each part of the model.
  const T = {
    rays: -0.7, hit: 0.45,          // sunlight leaves the sun and reaches the roof (it is already on its way on frame one)
    panels: 0.5, panelStep: 0.08,   // the array switches on panel by panel
    dc: [1.45, 2.4],                // DC runs from the array down to the inverter
    ac: [2.7, 4.05],                // AC runs along the house to the meter box
    home: [3.5, 3.72, 3.92],        // the rooms light up as the AC passes them
    out: [4.2, 5.3],                // the surplus leaves through the meter and crosses to the pole
    grid: [5.3, 6.9],               // and travels away down the line
  };
  // The labels, in the order the accent reaches them. `at` = when the label draws in; `off` = where the label sits,
  // in pixels from the point on the model it names (the model points themselves are set in build, under "labels").
  const STEPS = [
    { key: 'sun', name: 'SUNLIGHT', note: 'hits the roof', at: -1, off: [118, -92] },
    { key: 'panels', name: 'SOLAR PANELS', note: 'make DC power', at: T.panels + 0.45, off: [-275, -168] },
    { key: 'inverter', name: 'INVERTER', note: 'turns DC into AC', at: T.dc[1], off: [-215, 235] },
    { key: 'home', name: 'HOME', note: 'uses it first', at: T.home[0] + 0.1, off: [-60, 228] },
    { key: 'grid', name: 'GRID', note: 'gets the surplus', at: T.grid[0], off: [-232, 232] },
  ];
  const TITLE_OUT = 4.5;
  const COLS = 6, ROWS = 2;   // the solar array
  const panelAt = (c, r) => T.panels + ((COLS - 1 - c) + r * 0.6) * T.panelStep;   // the wave runs toward the cable

  registerStyle({
    id: 'white-model',
    name: 'White Model',
    family: 'Diagrams with depth',
    look: 'An architect\'s presentation model: everything is matte white card and foam on a white site board, and one saturated accent colour is reserved for the thing being explained.',
    motion: 'Nothing in the model moves. Only the accent moves: it starts at the source and travels through the model along thin conduits, switching each part on as it arrives, and a numbered label with a thin leader line draws in at every stop.',
    light: 'Soft daylight from one side plus sky light with real occlusion, so creases, window reveals and the ground under things darken gently and form does the work colour normally does. The accent glows a little and throws its own colour onto the white around it.',
    materials: 'Four slightly different whites (warm card, cool foam, bright paper, rough plaster) with a fine paper grain and a tiny bevel on every edge; scored pencil lines on the board; a mid-grey table behind, so the white reads as white.',
    camera: 'Long lens with shallow focus, like a photograph of a small model. One slow continuous crane: it starts low and close on the source and rises and pulls back until the whole path is in frame.',
    post: 'Neutral tone mapping so the whites stay clean and the accent stays true, a light bloom on the accent only, soft vignette, almost no grain.',
    explains: 'How something flows through a system: energy, water, money, data, people. Build the system as a white model, lay the path through it as conduits, and let the accent travel the path in the right order while labels name each stop.',
    topic: 'How rooftop solar powers a home: sunlight, panels, inverter, home, and the surplus going out to the grid',
    duration: 8,
    fonts: ['700 50px "Inter"', '700 44px "Inter"', '500 38px "Inter"', '600 30px "IBM Plex Mono"'],
    render: { samples: 64, shutter: 0.5, tone: 'neutral', exposure: 1.0, bloom: 0.32, bloomThreshold: 1.1, vignette: 0.3, grain: 0.012, contrast: 1.05, fov: 24, background: '#b4b8bd' },

    build(S) {
      const { THREE, K, scene, camera } = S;
      const accent = new THREE.Color(ACCENT), V = (p) => new THREE.Vector3(p[0], p[1], p[2]);

      // ================================================================ 1. THE KIT: whites, daylight, set (reuse as is)
      // Four whites. The differences are tiny, but they are what lets one white form separate from the next.
      const grain = K.canvasTex(256, 256, (ctx, w, h) => {
        const r = K.rng(3), im = ctx.createImageData(w, h);
        for (let i = 0; i < w * h; i++) { const v = 128 + r.gauss() * 26; im.data.set([v, v, v, 255], i * 4); }
        ctx.putImageData(im, 0, 0);
      }, { data: true, repeat: [3, 3] });
      const white = (color, roughness = 0.92) => new THREE.MeshStandardMaterial({ color, roughness, bumpMap: grain, bumpScale: 0.4 });
      const M = { card: white('#f8f6f0'), foam: white('#eef3f8', 0.8), paper: white('#fcfbf8'), plaster: white('#eeebe6', 1) };

      const put = (geo, mat, pos = [0, 0, 0], rot, parent = scene) => { const m = new THREE.Mesh(geo, mat); m.position.set(...pos); if (rot) m.rotation.set(...rot); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
      const box = (w, h, d, mat, pos, rot, parent) => put(K.roundedBox(w, h, d, 0.012, 2), mat, pos, rot, parent);   // crisp, with a tiny bevel
      const cyl = (r, h, mat, pos, parent, rTop = r) => put(new THREE.CylinderGeometry(rTop, r, h, 28), mat, pos, null, parent);
      // a sheet of card cut to an outline ([x, y] points) with rectangular openings ([x0, x1, y0, y1]): walls, figures, contours
      const cut = (outline, holes = [], depth = 0.08) => {
        const s = new THREE.Shape(outline.map((p) => new THREE.Vector2(p[0], p[1])));
        for (const [x0, x1, y0, y1] of holes) s.holes.push(new THREE.Path([[x0, y0], [x0, y1], [x1, y1], [x1, y0]].map((p) => new THREE.Vector2(p[0], p[1]))));
        return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 1, curveSegments: 24 });
      };

      // Daylight: a soft sun from the left for the shadows, sky light for the darkened creases, a pale environment for fill.
      K.env(S, { top: '#ffffff', horizon: '#e6eaef', bottom: '#b8b4ad', intensity: 0.36 });
      K.sun(S, { pos: [-14.5, 19.6, 18], target: [0.5, 1, 0], color: '#fff7ec', power: 2.4, size: 13, soft: 1.6, mapSize: 4096 });
      K.skyLight(S, { color: '#e6eeff', power: 1.35, size: 12, center: [0.5, 1, -1], mapSize: 2048 });

      // The set: a grey table and a white site board with scored lines. The far edge of the board shows behind the model.
      const BOARD = { x0: -15, x1: 15, z0: -9.4, z1: 8, th: 0.3, ppu: 150 };
      put(new THREE.PlaneGeometry(500, 500), new THREE.MeshStandardMaterial({ color: '#a9adb3', roughness: 1 }), [0, -BOARD.th, 0], [-Math.PI / 2, 0, 0]).castShadow = false;
      const bw = BOARD.x1 - BOARD.x0, bd = BOARD.z1 - BOARD.z0, bcx = (BOARD.x0 + BOARD.x1) / 2, bcz = (BOARD.z0 + BOARD.z1) / 2;
      box(bw, BOARD.th, bd, M.foam, [bcx, -BOARD.th / 2 - 0.002, bcz]);
      const hillR = (a, k) => (3.3 - k * 0.5) * (1 + 0.16 * Math.sin(a * 2 + 0.6 + k * 0.3) + 0.09 * Math.sin(a * 3 + 2 + k) + 0.05 * Math.sin(a * 5 + k * 2));
      const HILL = [-5.2, -5.0], TREES = [[-3.3, -1.5, 0.5, 1.55], [-2.3, -3.3, 0.4, 1.25], [3.4, -2.6, 0.56, 1.7], [2.3, -4.1, 0.42, 1.3], [7.9, -3.2, 0.5, 1.5], [-7.4, 0.2, 0.55, 1.6], [0.3, -6.3, 0.46, 1.4]];
      const scored = K.canvasTex(Math.round(bw * BOARD.ppu), Math.round(bd * BOARD.ppu), (ctx, w, h) => {
        const X = (x) => (x - BOARD.x0) * BOARD.ppu, Z = (z) => (z - BOARD.z0) * BOARD.ppu;
        const line = (pts, a = 0.4, lw = 1.7, dash) => { ctx.strokeStyle = `rgba(52,58,66,${a})`; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Z(p[1])) : ctx.moveTo(X(p[0]), Z(p[1])))); ctx.stroke(); };
        const rect = (x0, z0, x1, z1, a, lw, dash) => line([[x0, z0], [x1, z0], [x1, z1], [x0, z1], [x0, z0]], a, lw, dash);
        const ring = (x, z, r, a = 0.3, lw = 1.6) => { ctx.strokeStyle = `rgba(52,58,66,${a})`; ctx.lineWidth = lw; ctx.setLineDash([]); ctx.beginPath(); ctx.arc(X(x), Z(z), r * BOARD.ppu, 0, 7); ctx.stroke(); };
        ctx.fillStyle = '#fbfaf6'; ctx.fillRect(0, 0, w, h);
        for (let x = Math.ceil(BOARD.x0); x < BOARD.x1; x++) line([[x, BOARD.z0], [x, BOARD.z1]], 0.1, 1.2);            // a faint drawing grid
        for (let z = Math.ceil(BOARD.z0); z < BOARD.z1; z++) line([[BOARD.x0, z], [BOARD.x1, z]], 0.1, 1.2);
        rect(-3.6, -3.4, 4.15, 4.3, 0.34, 2.2); rect(-3.5, -3.3, 4.05, 4.2, 0.16, 1.2);                                   // the plot
        rect(-1.95, -1.65, 2.75, 1.65, 0.3, 1.5, [10, 7]);                                                               // roof outline, dashed
        line([[-0.56, 1.4], [-0.56, 4.3]], 0.3); line([[-0.12, 1.4], [-0.12, 4.3]], 0.3);                                 // path to the door
        rect(2.75, -0.45, 5.75, 1.2, 0.36, 1.6);                                                                          // drive
        for (const x of [5.75, 7.6]) line([[x, BOARD.z0], [x, BOARD.z1]], 0.36, 2.4);                                     // road
        line([[6.675, BOARD.z0], [6.675, BOARD.z1]], 0.3, 2, [46, 34]);
        for (let k = -2; k < 0; k++) line(Array.from({ length: 121 }, (_, i) => { const a = i / 120 * Math.PI * 2, r = hillR(a, k); return [HILL[0] + r * Math.cos(a), HILL[1] + r * Math.sin(a)]; }), 0.26, 1.5);
        for (const [x, z, r] of TREES) { ring(x, z, r + 0.12, 0.26); ring(x, z, 0.03, 0.4, 3); }
        ring(-4.75, 3.35, 0.5, 0.26); line([[-5.45, 3.35], [-4.05, 3.35]], 0.22, 1.2); line([[-4.75, 2.65], [-4.75, 4.05]], 0.22, 1.2);
      });
      put(new THREE.PlaneGeometry(bw, bd), new THREE.MeshStandardMaterial({ map: scored, roughness: 0.94 }), [bcx, 0, bcz], [-Math.PI / 2, 0, 0]).castShadow = false;

      // ================================================================ 2. THE ACCENT RULE (reuse as is)
      // Everything that can carry the accent is white until the accent reaches it. Three kinds of carrier:
      //   run(curve, t0, t1)  a conduit that fills with the accent from one end, then keeps pulsing in the flow direction
      //   glow(material)      a part that switches from white to the accent: call it(k) with k = 0..1 in update
      //   the bead            a small bright head that rides the front of the flow and lights the white around it
      const runs = [];
      let laid = 0;   // total conduit length so far, so the pulses stay in step from one run to the next
      const run = (curve, t0, t1, radius = 0.032) => {
        const len = curve.getLength(), u = { uHead: { value: 0 }, uTime: { value: 0 }, uLen: { value: len }, uOff: { value: laid }, uAccent: { value: accent } };
        const mat = new THREE.MeshStandardMaterial({ color: '#f1efea', roughness: 0.75 });
        mat.onBeforeCompile = (sh) => {
          Object.assign(sh.uniforms, u);
          sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vAlong;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvAlong = uv.x;');
          sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uHead, uTime, uLen, uOff; uniform vec3 uAccent; varying float vAlong;')
            .replace('#include <color_fragment>', '#include <color_fragment>\nfloat on = step(vAlong, uHead - 0.0001);\ndiffuseColor.rgb = mix(diffuseColor.rgb, uAccent, on);')
            .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
              float d = fract((uOff + vAlong * uLen - uTime * 2.2) / 0.6);            // dashes 0.6 apart, running at 2.2 units a second
              totalEmissiveRadiance += uAccent * on * (0.4 + 0.9 * smoothstep(0.0, 0.1, d) * smoothstep(0.42, 0.3, d));`);
        };
        put(new THREE.TubeGeometry(curve, Math.ceil(len * 36), radius, 10), mat);
        runs.push({ curve, t0, t1, u }); laid += len;
        return curve;
      };
      // conduit that turns its corners with a small radius, through a list of points
      const conduit = (pts, r = 0.07) => {
        const P = pts.map(V), path = new THREE.CurvePath(); let prev = P[0];
        for (let i = 1; i < P.length - 1; i++) {
          const a = P[i].clone().add(P[i - 1].clone().sub(P[i]).setLength(Math.min(r, P[i].distanceTo(P[i - 1]) * 0.45)));
          const b = P[i].clone().add(P[i + 1].clone().sub(P[i]).setLength(Math.min(r, P[i].distanceTo(P[i + 1]) * 0.45)));
          path.add(new THREE.LineCurve3(prev, a)); path.add(new THREE.QuadraticBezierCurve3(a, P[i], b)); prev = b;
        }
        path.add(new THREE.LineCurve3(prev, P[P.length - 1]));
        return path;
      };
      // a wire hanging between two points
      const hang = (a, b, sag) => new THREE.CatmullRomCurve3(Array.from({ length: 9 }, (_, i) => { const u = i / 8; return V([K.lerp(a[0], b[0], u), K.lerp(a[1], b[1], u) - sag * 4 * u * (1 - u), K.lerp(a[2], b[2], u)]); }));
      const glow = (mat, base = 0.25) => { const c0 = mat.color.clone(); return (k, flash = 0) => { mat.color.copy(c0).lerp(accent, k); mat.emissive.copy(accent).multiplyScalar(k * base + flash); }; };
      const bead = put(new THREE.SphereGeometry(0.075, 20, 12), new THREE.MeshBasicMaterial({ color: accent.clone().multiplyScalar(2.0) })); bead.castShadow = bead.receiveShadow = false;
      const beadLight = new THREE.PointLight(accent, 0, 3.2, 2); scene.add(beadLight);

      // ================================================================ 3. THE MODEL (this is the topic: rebuild for a new one)
      // ---- the house: walls cut from card with real openings, a floor inside, a gable roof
      const HX = 0.4, HW = 4.2, HD = 2.8, EAVE = 2.3, PITCH = 32 * Math.PI / 180, WT = 0.09, RIDGE = EAVE + HD / 2 * Math.tan(PITCH), ROOF_T = 0.08, FZ = HD / 2;
      const SLOPE = HD / 2 / Math.cos(PITCH) + 0.22;                // length of one roof slope, ridge to edge
      const house = new THREE.Group(); house.position.x = HX; scene.add(house);
      const hp = (x, y, z) => [x + HX, y, z];                        // house coordinates -> world
      // roof coordinates -> world: x along the ridge, s down the front slope from the ridge, h above the roof surface
      const roofPt = (x, s, h = 0) => [x + HX, RIDGE - s * Math.sin(PITCH) + (ROOF_T + h) * Math.cos(PITCH), s * Math.cos(PITCH) + (ROOF_T + h) * Math.sin(PITCH)];
      const WIN = { living: [-0.15, 1.25, 0.32, 1.05], door: [-0.95, -0.53, 0.03, 0.95], up: [[-1.2, -0.6, 1.5, 2.05], [-0.1, 0.5, 1.5, 2.05], [0.95, 1.55, 1.5, 2.05]] };
      const rectPts = (x0, x1, y0, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
      const gable = [[-FZ, 0], [FZ, 0], [FZ, EAVE], [0, RIDGE], [-FZ, EAVE]];
      put(cut(rectPts(-HW / 2, HW / 2, 0, EAVE), [WIN.living, WIN.door, ...WIN.up], WT), M.card, [0, 0, FZ - WT], null, house);                      // front
      put(cut(rectPts(-HW / 2, HW / 2, 0, EAVE), [], WT), M.card, [0, 0, -FZ], null, house);                                                         // back
      put(cut(gable, [[-0.5, 0.35, 0.4, 1.0], [-0.5, 0.35, 1.5, 2.05]], WT), M.plaster, [-HW / 2 + WT, 0, 0], [0, -Math.PI / 2, 0], house);          // left
      put(cut(gable, [], WT), M.plaster, [HW / 2, 0, 0], [0, -Math.PI / 2, 0], house);                                                               // right
      box(HW - 0.1, 0.08, HD - 0.1, M.paper, [0, 1.18, 0], null, house);                                                                             // upper floor
      box(HW - 0.1, 0.06, HD - 0.1, M.paper, [0, EAVE - 0.03, 0], null, house);                                                                      // ceiling
      box(HW - 0.1, 0.02, HD - 0.1, M.paper, [0, 0.012, 0], null, house);                                                                            // ground floor
      box(0.07, 1.1, HD - 0.2, M.paper, [-0.36, 0.58, 0], null, house); box(0.07, 1.05, HD - 0.2, M.paper, [0.72, 1.75, 0], null, house);            // partitions
      box(1.0, 0.2, 0.42, M.foam, [0.6, 0.12, -0.5], null, house); box(1.0, 0.36, 0.12, M.foam, [0.6, 0.2, -0.76], null, house);                     // sofa
      box(0.6, 0.16, 0.9, M.foam, [-0.4, 1.31, -0.6], null, house); box(0.5, 0.16, 0.9, M.foam, [1.3, 1.31, -0.6], null, house);                     // beds
      box(0.4, 0.9, 0.03, M.foam, [-0.74, 0.49, FZ - 0.07], null, house); box(0.03, 0.03, 0.05, M.plaster, [-0.6, 0.48, FZ - 0.04], null, house);    // door
      for (const [x0, x1, y0, y1] of [WIN.living, ...WIN.up]) {      // glazing bars and a sill in every window
        const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, n = x1 - x0 > 1 ? 3 : 1;
        for (let i = 1; i <= n; i++) box(0.024, y1 - y0, 0.03, M.paper, [x0 + (x1 - x0) * i / (n + 1), cy, FZ - WT / 2], null, house);
        box(x1 - x0, 0.024, 0.03, M.paper, [cx, y0 + (y1 - y0) * 0.62, FZ - WT / 2], null, house);
        box(x1 - x0 + 0.12, 0.035, 0.08, M.paper, [cx, y0 - 0.018, FZ + 0.03], null, house);
      }
      for (const sgn of [1, -1]) {                                   // roof: two slabs resting on the gables, and a ridge cap
        const sc = (SLOPE - 0.04) / 2;
        box(HW + 0.5, ROOF_T, SLOPE + 0.04, M.foam, [0, RIDGE - sc * Math.sin(PITCH) + ROOF_T / 2 * Math.cos(PITCH), sgn * (sc * Math.cos(PITCH) + ROOF_T / 2 * Math.sin(PITCH))], [sgn * PITCH, 0, 0], house);
      }
      box(HW + 0.52, 0.05, 0.14, M.paper, [0, RIDGE + ROOF_T + 0.03, 0], null, house);
      box(0.36, 0.95, 0.36, M.plaster, [1.25, RIDGE - 0.1, -0.62], null, house); box(0.44, 0.05, 0.44, M.paper, [1.25, RIDGE + 0.39, -0.62], null, house);   // chimney

      // ---- the solar array: frames on rails, each with a face that can take the accent
      const roofG = new THREE.Group(); roofG.position.set(...roofPt(0, 0, -ROOF_T)); roofG.rotation.x = PITCH; scene.add(roofG);
      const PW = 0.42, PH = 0.7, GAP = 0.03, AX = -0.1, AS = 0.17, PY = ROOF_T + 0.06;
      const cells = K.canvasTex(252, 420, (ctx, w, h) => {
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = 'rgba(40,48,58,0.32)'; ctx.lineWidth = 2.5;
        for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(i * w / 6, 0); ctx.lineTo(i * w / 6, h); ctx.stroke(); }
        for (let j = 1; j < 10; j++) { ctx.beginPath(); ctx.moveTo(0, j * h / 10); ctx.lineTo(w, j * h / 10); ctx.stroke(); }
      });
      const panels = [];
      for (let r = 0; r < ROWS; r++) {
        const s = AS + PH / 2 + r * (PH + GAP);
        for (const ds of [-0.2, 0.2]) box(COLS * (PW + GAP) + 0.1, 0.035, 0.035, M.plaster, [AX, ROOF_T + 0.02, s + ds], null, roofG);
        for (let c = 0; c < COLS; c++) {
          const x = AX + (c - (COLS - 1) / 2) * (PW + GAP);
          box(PW, 0.035, PH, M.foam, [x, PY, s], null, roofG);
          const face = put(new THREE.PlaneGeometry(PW - 0.03, PH - 0.03), new THREE.MeshStandardMaterial({ color: '#f4f6f8', map: cells, roughness: 0.6 }), [x, PY + 0.019, s], [-Math.PI / 2, 0, 0], roofG);
          face.castShadow = false;
          panels.push({ set: glow(face.material, 0.3), at: panelAt(c, r) });
        }
      }
      const arrayLeft = AX - COLS / 2 * (PW + GAP);

      // ---- inverter and meter box on the front wall, each with a small sign that takes the accent
      const sign = (draw, size, pos) => {
        const tex = K.canvasTex(128, 128, (ctx) => { ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.lineWidth = 11; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; draw(ctx); });
        const m = put(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: tex, transparent: true, color: '#b9bec4' }), pos, null, house); m.castShadow = m.receiveShadow = false;
        return (k) => m.material.color.set('#b9bec4').lerp(accent, k).multiplyScalar(1 + 0.9 * k);
      };
      const WZ = FZ + 0.045;                                          // conduits run just proud of the front wall
      box(0.42, 0.58, 0.13, M.foam, [-1.6, 0.88, FZ + 0.065], null, house);
      for (let i = 0; i < 7; i++) box(0.02, 0.2, 0.03, M.paper, [-1.6 + (i - 3) * 0.05, 0.71, FZ + 0.14], null, house);       // cooling fins
      const invSign = sign((ctx) => { ctx.beginPath(); for (let i = 0; i <= 40; i++) ctx.lineTo(14 + i * 2.5, 64 - Math.sin(i / 40 * Math.PI * 2) * 30); ctx.stroke(); }, 0.26, [-1.6, 1.0, FZ + 0.133]);   // the AC wave
      box(0.36, 0.38, 0.11, M.foam, [1.72, 0.9, FZ + 0.055], null, house);
      const meterSign = sign((ctx) => { ctx.beginPath(); ctx.arc(64, 64, 40, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(64, 64); ctx.lineTo(88, 44); ctx.stroke(); }, 0.24, [1.72, 0.9, FZ + 0.113]);
      cyl(0.045, 0.1, M.paper, hp(2.0, 1.95, WZ));                      // the bracket where the line leaves the house

      // ---- lamps in the rooms: a small shade and a real light in the accent colour
      const lamps = [[0.55, 0.92, 0.25, 0], [-0.9, 2.02, 0.25, 1], [0.2, 2.02, 0.25, 1], [1.25, 2.02, 0.25, 2]].map(([x, y, z, room]) => {
        const top = y > 1.2 ? EAVE - 0.06 : 1.14;
        box(0.012, top - y, 0.012, M.paper, [x, (top + y) / 2, z], null, house);
        const shade = put(new THREE.SphereGeometry(0.085, 20, 12), new THREE.MeshStandardMaterial({ color: '#f4f2ee', roughness: 0.6 }), [x, y, z], null, house); shade.castShadow = false;
        return { set: glow(shade.material, 1.5), at: T.home[room] };
      });
      const roomLights = [[0.5, 0.8, 0.2], [-0.5, 1.9, 0.2], [1.3, 1.9, 0.2]].map((p, i) => { const l = new THREE.PointLight(accent, 0, 2.8, 2); l.position.set(...hp(...p)); scene.add(l); return { l, at: T.home[i] }; });

      // ---- the grid: poles along the road with two wires
      const PX = 5.05, POLES = [1.6, -1.5, -4.6, -7.7], WIRE_Y = 3.22, tap = [PX - 0.36, WIRE_Y, POLES[0]];
      for (const z of POLES) {
        cyl(0.06, 3.2, M.card, [PX, 1.6, z], scene, 0.045); box(0.98, 0.07, 0.08, M.card, [PX, 3.06, z]);
        for (const dx of [-0.36, 0.36]) cyl(0.035, 0.12, M.paper, [PX + dx, 3.155, z]);
      }
      cyl(0.16, 0.42, M.foam, [PX + 0.2, 2.55, POLES[0]]);            // a transformer can on the first pole
      for (let i = 0; i + 1 < POLES.length; i++) put(new THREE.TubeGeometry(hang([PX + 0.36, WIRE_Y, POLES[i]], [PX + 0.36, WIRE_Y, POLES[i + 1]], 0.2), 24, 0.02, 8), M.paper);

      // ---- scale cues: the sun on its stand, contour hill, trees, figures, a car
      const SUN = [-3.95, 4.5, 3.0], SUN_R = 0.5;
      const sunBall = put(new THREE.SphereGeometry(SUN_R, 48, 32), new THREE.MeshStandardMaterial({ color: accent, roughness: 0.55, emissive: accent, emissiveIntensity: 0.6 }), SUN); sunBall.castShadow = false;
      const sunLight = new THREE.PointLight(accent, 5, 5, 2); sunLight.position.set(...SUN); scene.add(sunLight);
      put(K.tube([[-4.75, 0, 3.35], [-5.08, 1.7, 3.3], [-4.97, 3.3, 3.18], [-4.37, 4.2, 3.04]], 0.03, { segments: 60 }), M.paper); cyl(0.34, 0.05, M.card, [-4.75, 0.025, 3.35]); cyl(0.07, 0.12, M.paper, [-4.75, 0.08, 3.35]);
      for (let k = 0; k < 6; k++) {
        const pts = Array.from({ length: 96 }, (_, i) => { const a = i / 96 * Math.PI * 2, r = hillR(a, k); return [HILL[0] + r * Math.cos(a), -(HILL[1] + r * Math.sin(a))]; });
        put(cut(pts, [], 0.1), k % 2 ? M.paper : M.card, [0, k * 0.112, 0], [-Math.PI / 2, 0, 0]);
      }
      for (const [x, z, r, h] of [...TREES, [-5.6, -4.6, 0.5, 1.5 + 0.67], [-4.3, -5.9, 0.38, 1.2 + 0.67]]) { cyl(0.03, h, M.paper, [x, h / 2, z]); put(new THREE.SphereGeometry(r, 32, 20), M.plaster, [x, h, z]); }
      const figure = (x, z, h, ry = 0) => {
        const body = new THREE.Shape([[-0.07, 0], [0.07, 0], [0.15, 0.72], [0.1, 0.78], [-0.1, 0.78], [-0.15, 0.72]].map((p) => new THREE.Vector2(p[0] * h, p[1] * h))), head = new THREE.Shape(); head.absarc(0, 0.9 * h, 0.1 * h, 0, Math.PI * 2);
        put(new THREE.ExtrudeGeometry([body, head], { depth: 0.03, bevelEnabled: false, curveSegments: 20 }), M.paper, [x, 0, z], [0, ry, 0]);
      };
      figure(-3.15, 2.2, 0.72, 0.3); figure(-2.8, 2.35, 0.46, -0.2); figure(3.0, 1.35, 0.7, -0.5);
      box(1.7, 0.3, 0.72, M.foam, [3.95, 0.3, 0.38]); box(0.92, 0.25, 0.62, M.paper, [3.87, 0.56, 0.38]);
      for (const [dx, dz] of [[-0.52, 0.33], [0.52, 0.33], [-0.52, -0.33], [0.52, -0.33]]) put(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 24), M.plaster, [3.95 + dx, 0.15, 0.38 + dz], [Math.PI / 2, 0, 0]);

      // ================================================================ 4. THE PATH: where the accent goes, and when
      // sunlight: dashes that fly from the sun to points on the array
      const rays = [[-1.05, 0.45], [-0.5, 1.2], [0.05, 0.5], [0.6, 1.25], [1.05, 0.6]].map(([x, s]) => {
        const b = V(roofPt(AX + x, s, 0.1)), dir = b.clone().sub(V(SUN)).normalize(), a = V(SUN).addScaledVector(dir, SUN_R + 0.12);
        return { a, dir, len: a.distanceTo(b), q: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir) };
      });
      const RAY_GAP = 0.62, RAY_SPEED = 4.2, perRay = Math.ceil(Math.max(...rays.map((r) => r.len)) / RAY_GAP) + 1;
      const dashes = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 8), new THREE.MeshBasicMaterial({ color: accent.clone().multiplyScalar(1.5) }), rays.length * perRay);
      dashes.frustumCulled = false; scene.add(dashes);
      // electricity: array -> inverter (DC), inverter -> meter box (AC), meter box -> pole -> down the line (surplus)
      run(conduit([roofPt(arrayLeft, 0.88, 0.03), roofPt(-1.6, 0.88, 0.03), roofPt(-1.6, SLOPE + 0.03, 0.03), hp(-1.6, EAVE - 0.32, WZ), hp(-1.6, 1.17, WZ)]), ...T.dc);
      run(conduit([hp(-1.39, 0.9, WZ), hp(-1.2, 0.9, WZ), hp(-1.2, 1.3, WZ), hp(1.72, 1.3, WZ), hp(1.72, 1.09, WZ)]), ...T.ac);
      const lift = 1.16, drop = V(hp(2.0, 1.95, WZ)).distanceTo(V(tap)), outEnd = K.lerp(T.out[0], T.out[1], lift / (lift + drop));
      run(conduit([hp(1.9, 0.9, WZ), hp(2.0, 0.9, WZ), hp(2.0, 1.95, WZ)]), T.out[0], outEnd);
      run(hang(hp(2.0, 1.95, WZ), tap, 0.16), outEnd, T.out[1], 0.026);
      for (let i = 0; i + 1 < POLES.length; i++) run(hang([tap[0], WIRE_Y, POLES[i]], [tap[0], WIRE_Y, POLES[i + 1]], 0.2), K.lerp(T.grid[0], T.grid[1], i / 3), K.lerp(T.grid[0], T.grid[1], (i + 1) / 3), 0.026);

      // ================================================================ 5. LABELS: numbered, with thin leader lines (drawn in the overlay so they stay sharp)
      const anchors = { sun: [SUN[0] + 0.3, SUN[1] + 0.42, SUN[2]], panels: roofPt(AX + 0.25, AS + 0.1, 0.1), inverter: hp(-1.72, 0.66, FZ + 0.13), home: hp(0.55, 0.42, FZ), grid: [PX, 0.45, POLES[0]] };
      const INK = '#1b1e22', pv = new THREE.Vector3();
      const px = (p, W, H) => { pv.set(p[0], p[1], p[2]).project(camera); return [(pv.x * 0.5 + 0.5) * W, (-pv.y * 0.5 + 0.5) * H]; };
      const halo = (ctx, text, x, y) => { ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.strokeText(text, x, y); ctx.fillStyle = INK; ctx.fillText(text, x, y); };
      function label(ctx, step, i, t, W, H) {
        const p = K.seg(t, step.at, step.at + 0.6); if (p <= 0) return;
        ctx.font = '700 50px "Inter"'; ctx.letterSpacing = '3px'; const wName = ctx.measureText(step.name).width;
        ctx.font = '500 38px "Inter"'; ctx.letterSpacing = '0px'; const wText = Math.max(wName, ctx.measureText(step.note).width), R = 25;
        const a = px(anchors[step.key], W, H), c = [K.clamp(a[0] + step.off[0], 60 + R, W - 60 - R - 18 - wText), K.clamp(a[1] + step.off[1], 60 + R, H - 110)];
        const d = Math.hypot(a[0] - c[0], a[1] - c[1]), ux = (a[0] - c[0]) / d, uy = (a[1] - c[1]) / d;
        const grow = K.ease.out(K.clamp(p / 0.45)), ex = a[0] - ux * (d - R) * grow, ey = a[1] - uy * (d - R) * grow;     // the leader grows from the model to the label
        ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(a[0], a[1], 6, 0, 7); ctx.fill();
        const pop = K.ease.outBack(K.clamp((p - 0.35) / 0.4)); if (pop <= 0) return;
        ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.beginPath(); ctx.arc(c[0], c[1], R * pop, 0, 7); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
        ctx.globalAlpha = K.clamp((p - 0.45) / 0.3); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '600 30px "IBM Plex Mono"'; ctx.fillStyle = INK; ctx.fillText(String(i + 1), c[0], c[1] + 2);
        const tx = c[0] + R + 18 - (1 - K.ease.out(K.clamp((p - 0.4) / 0.5))) * 14;
        ctx.textAlign = 'left'; ctx.font = '700 50px "Inter"'; ctx.letterSpacing = '3px'; halo(ctx, step.name, tx, c[1] + 2);
        ctx.font = '500 38px "Inter"'; ctx.letterSpacing = '0px'; halo(ctx, step.note, tx, c[1] + 50);
        ctx.globalAlpha = 1;
      }

      // ================================================================ 6. CAMERA: one slow crane, low and close on the source -> the whole path
      // keys: [azimuth deg, elevation deg, distance, aim x, y, z, aperture, focus depth]. The last key lies after the end, so the move never stops.
      const cam = K.path([[0, [-21, 12, 12.6, -1.5, 2.6, 1.6, 0.085, 1.9]], [2.7, [-14, 15.5, 13.2, -0.7, 2.25, 1.45, 0.08, FZ]], [5.4, [-8.5, 19, 15.6, 0.05, 1.98, 1.4, 0.075, FZ]], [8.9, [-5, 20.5, 16.6, 0.2, 1.9, 1.4, 0.07, FZ]]]);
      const m4 = new THREE.Matrix4(), sc = new THREE.Vector3(), ps = new THREE.Vector3();

      return {
        update(t) {
          // sunlight
          const front = (t - T.rays) * RAY_SPEED;
          rays.forEach((r, k) => {
            for (let j = 0; j < perRay; j++) {
              const s = ((j * RAY_GAP + t * RAY_SPEED + k * 0.23) % (perRay * RAY_GAP) + perRay * RAY_GAP) % (perRay * RAY_GAP);
              const vis = s < r.len && s < front ? K.smooth(0, 0.3, s) * K.smooth(r.len, r.len - 0.25, s) : 0;
              dashes.setMatrixAt(k * perRay + j, m4.compose(ps.copy(r.a).addScaledVector(r.dir, s), r.q, sc.set(vis, 0.3, vis)));
            }
          });
          dashes.instanceMatrix.needsUpdate = true;
          sunBall.material.emissiveIntensity = 0.6 + 0.05 * Math.sin(t * 2.4);
          // the array, panel by panel: a short flash on arrival, then the steady accent
          for (const p of panels) p.set(K.seg(t, p.at, p.at + 0.22, K.ease.out), 0.5 * K.seg(t, p.at, p.at + 0.08) * (1 - K.seg(t, p.at + 0.08, p.at + 0.6, K.ease.out)));
          // conduits fill from their start, and the bead rides the front
          let live = null;
          for (const r of runs) { const u = K.seg(t, r.t0, r.t1); r.u.uHead.value = u * 1.001; r.u.uTime.value = t; if (t >= r.t0 && t < r.t1) live = [r, u]; }
          if (live) { bead.position.copy(live[0].curve.getPointAt(live[1])); beadLight.position.copy(bead.position); beadLight.position.z += 0.4; }
          bead.visible = !!live; beadLight.intensity = live ? 0.45 : 0;
          invSign(K.seg(t, T.dc[1], T.dc[1] + 0.3, K.ease.out)); meterSign(K.seg(t, T.ac[1], T.ac[1] + 0.25, K.ease.out));
          // the home: lamps come on with a small overshoot, and their light fills the rooms
          for (const l of lamps) l.set(K.clamp(K.spring(t - l.at, 2.4, 0.55), 0, 1.3));
          for (const r of roomLights) r.l.intensity = 5 * K.spring(t - r.at, 2.4, 0.55);
          // camera
          const c = cam(t), a = c[0] * Math.PI / 180, e = c[1] * Math.PI / 180, aim = [c[3], c[4], c[5]];
          K.look(camera, [aim[0] + c[2] * Math.sin(a) * Math.cos(e), aim[1] + c[2] * Math.sin(e), aim[2] + c[2] * Math.cos(a) * Math.cos(e)], aim);
          K.focus(camera, [aim[0], 1.4, c[7]], c[6]);
        },
        overlay(ctx, t, W, H) {
          camera.updateMatrixWorld();
          STEPS.forEach((s, i) => label(ctx, s, i, t, W, H));
          // title block, top right
          ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = INK;
          const ta = 1 - K.seg(t, TITLE_OUT, TITLE_OUT + 0.5);          // the title makes room for the last label
          ctx.font = '600 30px "IBM Plex Mono"'; ctx.letterSpacing = '5px'; ctx.globalAlpha = 0.7 * ta; ctx.fillText(TITLE[0], W - 64, 86);
          ctx.font = '700 44px "Inter"'; ctx.letterSpacing = '0px'; ctx.globalAlpha = ta; ctx.fillText(TITLE[1], W - 66, 140); ctx.globalAlpha = 1;
        },
      };
    },

    sound(k) {
      k.bed('room', 0, 8, { gain: 0.8 });
      k.music('pad', 0, 8, { bpm: 60, chords: [['D4', 'F#4', 'A4', 'C#5'], ['B3', 'D4', 'F#4', 'A4']], gain: 0.55 });
      // sunlight: a soft bright air, already there on frame one
      k.noise(0, { dur: 1.7, color: 'pink', filter: 'bandpass', f: [[0, 2400], [1.7, 4200]], q: 1.4, gain: 0.05, a: 0.25, hold: 1.0, pan: -0.5, verb: 0.3 });
      // the array: one card tick and one soft note per panel, climbing
      const SCALE = ['D5', 'E5', 'F#5', 'A5', 'B5', 'D6', 'E6', 'F#6', 'A6', 'B6', 'D7', 'E7'], times = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) times.push(panelAt(c, r));
      k.withMinor(() => times.sort((a, b) => a - b).forEach((t, i) => { k.play('tick', t, { gain: 0.6, f: 2400 + i * 160, pan: -0.15 }); k.tone(t, { f: SCALE[i % SCALE.length], dur: 0.25, gain: 0.075, pan: -0.15, verb: 0.3 }); }));
      // DC is one steady note; after the inverter clicks in, AC is the same note with a slow beat in it
      k.tone(T.dc[0], { f: 'D4', dur: T.dc[1] - T.dc[0], gain: 0.04, a: 0.08, hold: T.dc[1] - T.dc[0] - 0.2, pan: -0.25 });
      k.play('click', T.dc[1], { gain: 0.9, pan: -0.25 }); k.play('tock', T.dc[1] + 0.04, { gain: 0.6, f: 520, pan: -0.25 });
      for (const f of [293.7, 299.7]) k.tone(T.ac[0], { f, dur: T.ac[1] - T.ac[0] + 0.1, gain: 0.024, a: 0.1, hold: T.ac[1] - T.ac[0] - 0.2, pan: 0.05 });
      k.bed('hum', T.dc[1], 8, { gain: 0.3 });
      // the home: a switch and a warm note for each room
      T.home.forEach((t, i) => { k.play('click', t, { gain: 0.5, f: 1500, pan: 0.1 }); k.play('ding', t + 0.02, { gain: 0.65, f: ['A5', 'D6', 'F#6'][i], pan: 0.1 }); });
      // the surplus: through the meter, across the wire and away down the line to the right
      k.play('tock', T.ac[1], { gain: 0.5, f: 700, pan: 0.3 });
      k.play('whoosh', T.out[0] + 0.3, { gain: 0.45, dur: 0.9, top: 2200, pan: 0.5 });
      k.play('whoosh', T.grid[0], { gain: 0.5, dur: T.grid[1] - T.grid[0], top: 3200, pan: 0.8 });
      k.play('success', T.grid[1] - 0.1, { gain: 0.38, f: 'D6', pan: 0.3 });
      // each label lands with a small pop
      k.withMinor(() => STEPS.forEach((s, i) => { if (s.at > 0) k.play('pop', s.at + 0.35, { gain: 0.35, f: 520 + i * 40 }); }));
    },
  });
}
```
