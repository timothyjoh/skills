# X-Ray (#10)

- **id:** `x-ray`
- **Category:** Filters over 3D
- **Use:** explainer
- **Reference duration:** 8 s
- **Google Fonts:** Space Grotesk, IBM Plex Mono
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`

## Style card

- **Look:** A radiograph you can move around: the object turns into glowing film on a dark scanner bed, every wall brightest where you look through the most material, with one warm accent for the part that matters right now.
- **Motion:** The object starts solid. A scanning plane sweeps along it, the cut face glows as a live cross-section, and everything behind the plane is left see-through. Then the inner parts light up one at a time as something (here heat) runs into them.
- **Light:** Before the scan, a soft overhead key and long strip reflections on brushed steel. After it the room dims and the picture is made of emitted light only: film, accent and a faintly lit grid.
- **Materials:** Brushed steel and black plastic for the solid; for the X-ray one material that adds up the true path length through each closed part, so edges, rims and overlaps brighten by themselves.
- **Camera:** Long lens. One continuous crane from a low three-quarter view of the cut face up to a near plan view, like the plate of a radiograph, then a slow push that never stops.
- **Finish:** Gentle bloom on the brightest edges and the accent, neutral tone mapping so the two colours stay true, fine grain, a soft vignette. Callouts are crisp 2D type on poles that track points on the model.
- **Good for:** What is inside something and how it works: anatomy, machines, products, buildings. Up to three inner parts, each lit and named in turn, with a simple flow (heat, air, current, force) shown acting on them.

## Reference

- **Sample topic:** Why a vacuum flask keeps drinks hot
- **Gallery description:** A radiograph you can move around: the object turns into glowing film on a dark scanner bed, every wall brightest where you look through the most material, with one warm accent for the part that matters right now.
- **Shown in the sample clip:** Why a vacuum flask keeps drinks hot

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/x-ray.js`)

```js
{
  // ---------------------------------------------------------------- content (change this for a new topic)
  const TITLE = ['WHY A VACUUM FLASK', 'KEEPS DRINKS HOT'];
  const OVERLINE = 'X-RAY  /  SECTION SCAN';
  // The parts that light up one at a time. `at` is when heat reaches the part and it flares; the callout follows.
  const PARTS = [
    { name: 'VACUUM', note: 'stops conduction + convection', at: 3.5 },
    { name: 'REFLECTIVE LINING', note: 'bounces radiant heat back', at: 4.95 },
    { name: 'STOPPER', note: 'seals the opening', at: 6.3 },
  ];
  const SCAN = [0.7, 2.75];          // the scanning plane sweeps the object between these times
  const COOL = '#b0d0ec', ACCENT = '#ff9a22';   // the whole palette: one cool film tone, one warm accent
  const MM = 28;                     // millimetres per world unit, for the grid, scale bar and scan readout (the flask is 235 mm long)

  // ---------------------------------------------------------------- the object, as profiles of revolution
  // Everything is described lying along its own axis: [radius, height] from the base (0) to the cup (8.4).
  // Wall gaps are drawn wider than in a real flask so the vacuum reads on a phone.
  const LEN = 8.4, HALF = LEN / 2, AXIS_Y = 1.64;      // the flask lies on the scanner bed, base to the left
  const OUTER = [[0, 0.2], [0.6, 0.2], [0.95, 0.2], [1.08, 0.1], [1.2, 0.035], [1.38, 0.035], [1.5, 0.09], [1.555, 0.22], [1.565, 0.4], [1.565, 1.5], [1.565, 3], [1.565, 4.5], [1.565, 5.25], [1.55, 5.55], [1.47, 5.85], [1.3, 6.1], [1.1, 6.27], [0.98, 6.42], [0.95, 6.6], [0.95, 6.9], [0.95, 7.2]];
  const INNER = [[0, 0.62], [0.4, 0.63], [0.75, 0.68], [1.0, 0.78], [1.16, 0.95], [1.22, 1.2], [1.22, 2], [1.22, 3.5], [1.22, 5.0], [1.22, 5.35], [1.17, 5.65], [1.02, 5.92], [0.84, 6.13], [0.745, 6.35], [0.72, 6.6], [0.72, 6.9], [0.72, 7.2]];
  const CUP = [[1.5, 5.95], [1.5, 6.6], [1.5, 7.65], [1.485, 7.98], [1.4, 8.22], [1.22, 8.34], [0.9, 8.37], [0.45, 8.37], [0, 8.37]];
  const STOPPER = [[0, 6.38], [0.6, 6.38], [0.67, 6.45], [0.67, 7.3], [1.02, 7.3], [1.06, 7.36], [1.06, 7.62], [1.0, 7.7], [0.5, 7.7], [0.42, 7.86], [0, 7.86]];
  const T_OUT = 0.07, T_IN = 0.06, R_GAP = [1.25, 1.53];   // wall thicknesses, and the radii where the vacuum starts and ends
  const u = (h) => h - HALF;                                 // height along the flask -> world x

  // ---------------------------------------------------------------- the heat (shared by picture and sound)
  // Three tries to leave, one per part. Rays are drawn in the flat plane through the axis that faces the camera,
  // as [x along the axis, signed distance from the axis].
  const HEAT = (() => {
    const rays = [], wave = (a, b, c) => {            // a wavy ray a -> b -> c (radiation), the wiggle dies at the ends
      const pts = [];
      for (const [p, q] of [[a, b], [b, c]]) {
        const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy), n = 44;
        for (let i = pts.length ? 1 : 0; i <= n; i++) { const f = i / n, w = Math.sin(f * l / 0.2 * 2 * Math.PI) * 0.055 * Math.min(1, f * l / 0.16, (1 - f) * l / 0.16); pts.push([p[0] + dx * f - dy / l * w, p[1] + dy * f + dx / l * w]); }
      }
      return pts;
    };
    // 1 conduction and convection: straight, through the inner wall, and no further: there is nothing in the gap to carry it
    [1.5, 2.4, 3.3, 4.2, 5.05].forEach((h, i) => rays.push({ part: 0, pts: [[u(h), 0.38], [u(h), R_GAP[0]]], t0: PARTS[0].at - 0.42 + i * 0.05, dur: 0.42 - i * 0.05 + i * 0.045, bar: [u(h), R_GAP[0] + 0.03, 0] }));
    // 2 radiation: crosses the vacuum (light needs no air) and is mirrored back by the lining
    [1.45, 2.4, 3.35, 4.3].forEach((h, i) => rays.push({ part: 1, pts: wave([u(h), -0.38], [u(h + 0.27), -(R_GAP[1] - 0.02)], [u(h + 0.54), -0.38]), t0: PARTS[1].at - 0.42 + i * 0.07, dur: 0.9, hit: 0.5, bar: [u(h + 0.27), -(R_GAP[1] + 0.012), 0] }));
    // 3 the open mouth: the plug closes the one way out
    [-0.3, 0, 0.3].forEach((r, i) => rays.push({ part: 2, pts: [[u(5.15), r], [u(6.36), r]], t0: PARTS[2].at - 0.38 + Math.abs(i - 1) * 0.05, dur: 0.38 - Math.abs(i - 1) * 0.05, bar: [u(6.39), r, 1] }));
    rays.forEach((r) => { r.stop = r.t0 + r.dur * (r.hit || 1); });   // the moment the ray meets its part
    return rays;
  })();

  registerStyle({
    id: 'x-ray',
    name: 'X-Ray',
    family: 'Filters over 3D',
    look: 'A radiograph you can move around: the object turns into glowing film on a dark scanner bed, every wall brightest where you look through the most material, with one warm accent for the part that matters right now.',
    motion: 'The object starts solid. A scanning plane sweeps along it, the cut face glows as a live cross-section, and everything behind the plane is left see-through. Then the inner parts light up one at a time as something (here heat) runs into them.',
    light: 'Before the scan, a soft overhead key and long strip reflections on brushed steel. After it the room dims and the picture is made of emitted light only: film, accent and a faintly lit grid.',
    materials: 'Brushed steel and black plastic for the solid; for the X-ray one material that adds up the true path length through each closed part, so edges, rims and overlaps brighten by themselves.',
    camera: 'Long lens. One continuous crane from a low three-quarter view of the cut face up to a near plan view, like the plate of a radiograph, then a slow push that never stops.',
    post: 'Gentle bloom on the brightest edges and the accent, neutral tone mapping so the two colours stay true, fine grain, a soft vignette. Callouts are crisp 2D type on poles that track points on the model.',
    explains: 'What is inside something and how it works: anatomy, machines, products, buildings. Up to three inner parts, each lit and named in turn, with a simple flow (heat, air, current, force) shown acting on them.',
    topic: 'Why a vacuum flask keeps drinks hot',
    duration: 8,
    fonts: ['700 78px "Space Grotesk"', '500 44px "Space Grotesk"', '500 30px "IBM Plex Mono"'],
    render: { samples: 48, shutter: 0.5, tone: 'neutral', exposure: 1.0, bloom: 0.5, bloomThreshold: 0.9, vignette: 0.34, grain: 0.025, fov: 22, background: '#050607' },

    build(S) {
      const { THREE, K, scene, camera, renderer } = S;
      renderer.localClippingEnabled = true;

      // ================================================================ the X-ray kit (reusable for any object)
      // ONE CUT PLANE divides the world: solid, lit things live on its positive side, the X-ray on the other.
      const cutPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);          // lit materials are clipped by this
      const CUT = { value: new THREE.Vector4() }, REF = { value: new THREE.Vector4(0, 1, 0, 0) };
      const setCut = (x) => { cutPlane.constant = -x; CUT.value.set(-1, 0, 0, x); };

      // 1. THE FILM. Give it to any CLOSED mesh. Back faces add their distance from the eye, front faces subtract
      // theirs, so what is left in the (float) frame is the length of the ray inside the part: a real radiograph.
      // Thin walls come out as bright rims with a faint skin, solids glow from the middle, overlaps add up, and none
      // of it needs normals, sorting or depth. The cut plane is applied by clamping the distance, so a cut part
      // stays "closed". Distances are measured from a reference plane through the object to keep the numbers small.
      // Rules: the mesh must be watertight with faces pointing outward (every core three.js solid is); the film is
      // drawn over everything (no depth test), so keep the camera on the X-ray side of the cut; `density` is brightness
      // per world unit of material, around 0.1-0.2 for bulky solids and 0.7-1 for thin walls.
      // For open sheets (a plane, a cloth, a label) pass `sheet` = its thickness: then each surface adds
      // thickness / cos(view angle), the same thing for a wall too thin to model.
      const xray = (color, density, sheet = 0) => new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(color) }, uK: { value: density }, uSheet: { value: sheet }, uCut: CUT, uRef: REF },
        vertexShader: 'varying vec3 vW, vN; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = mat3(modelMatrix) * normal; gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: `uniform vec3 uColor; uniform float uK, uSheet; uniform vec4 uCut, uRef; varying vec3 vW, vN;
          void main(){
            vec3 ro = cameraPosition, rd = vW - ro; float d = length(rd), len; rd /= d;
            if (uSheet > 0.0) {
              if (dot(uCut.xyz, vW) + uCut.w < 0.0) discard;
              len = uSheet / max(abs(dot(normalize(vN), rd)), 0.07);
            } else {
              float dn = dot(uCut.xyz, rd); dn = abs(dn) < 1e-5 ? 1e-5 : dn;
              float sc = -(dot(uCut.xyz, ro) + uCut.w) / dn;              // where this ray meets the cut plane
              d = dn > 0.0 ? max(d, sc) : min(d, sc);                     // only count the part on the X-ray side
              len = (gl_FrontFacing ? -1.0 : 1.0) * (d + (dot(uRef.xyz, ro) + uRef.w) / dot(uRef.xyz, rd));
            }
            gl_FragColor = vec4(uColor * uK * len, 1.0);
          }`,
        side: THREE.DoubleSide, transparent: true, depthTest: false, depthWrite: false,
        blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
      });

      // 2. THE SECTION CUT. A lit, closed mesh is clipped by the cut plane, and its back faces are drawn in a flat
      // glowing colour. Seen through the cut, the back faces of a closed solid cover exactly the area where the
      // plane passes through material, so this IS the cap: a clean cross-section with no stencil buffer. (Parts must
      // not overlap each other; nested parts, like a bottle inside a bottle, are fine.)
      const sectioned = (geo, mat, capColor, capGain) => {
        mat.clippingPlanes = [cutPlane]; mat.clipShadows = true;
        const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true;
        const cap = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(capColor).multiplyScalar(capGain), side: THREE.BackSide, clippingPlanes: [cutPlane] }));
        m.add(cap); return m;
      };

      // 3. CLOSED SOLIDS OF REVOLUTION. revolve(loop) spins a closed outline of [radius, height] points; wall(line, t)
      // gives the outline of a wall of thickness t around a centre line; offset(line, d) shifts a line sideways.
      const fine = (pts, n = 150) => new THREE.CatmullRomCurve3(pts.map(([r, y]) => new THREE.Vector3(r, y, 0)), false, 'centripetal').getSpacedPoints(n).map((v) => [Math.max(0, v.x), v.y]);
      const offset = (line, d) => line.map((p, i) => { const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [Math.max(0, p[0] + dy / l * d), p[1] - dx / l * d]; });
      const wall = (line, t) => offset(line, t / 2).concat(offset(line, -t / 2).reverse());
      const revolve = (loop, seg = 128) => {
        let area = 0; loop.forEach((p, i) => { const q = loop[(i + 1) % loop.length]; area += p[0] * q[1] - q[0] * p[1]; });
        const pts = (area < 0 ? loop.slice().reverse() : loop).map(([r, y]) => new THREE.Vector2(r, y));   // counter-clockwise = faces outward
        if (pts[0].x > 1e-6 || pts[pts.length - 1].x > 1e-6) pts.push(pts[0].clone());
        return new THREE.LatheGeometry(pts, seg);
      };

      // ================================================================ the scene
      K.env(S, { top: '#0b0d11', horizon: '#08090c', bottom: '#020203', panels: [
        { pos: [0, 12, 5], size: [20, 2.6], color: '#eef4ff', power: 7 },       // a long strip overhead: the highlight that runs down the steel
        { pos: [0, 15, -2], size: [26, 12], color: '#dfe8f5', power: 1.1 },      // a big soft ceiling so the steel is never black
        { pos: [-13, 4, 3], size: [3, 7], color: '#cfe0ff', power: 6 },
        { pos: [5, 4, -13], size: [12, 3], color: '#8fb6ff', power: 2.2 },
      ] });
      const key = K.spot(S, { pos: [-5, 11, 7.5], target: [0, 1, 0], color: '#fff3e2', power: 1500, angle: 0.62, penumbra: 0.95, soft: 0.8 });

      // the scanner bed: dark anodised plate, and a layer of fine printed marks (grid, plate outline, centre line, scale bar)
      const bed = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ color: '#0e1115', roughness: 0.62, metalness: 0.2 }));
      bed.rotation.x = -Math.PI / 2; bed.receiveShadow = true; scene.add(bed);
      const BW = 26, PX = 4096 / BW;
      const marksTex = K.canvasTex(4096, 4096, (c) => {
        const X = (x) => (x + BW / 2) * PX, Z = X, line = (x0, z0, x1, z1, a, w = 2) => { c.strokeStyle = `rgba(168,207,242,${a})`; c.lineWidth = w; c.beginPath(); c.moveTo(X(x0), Z(z0)); c.lineTo(X(x1), Z(z1)); c.stroke(); };
        c.fillStyle = '#000'; c.fillRect(0, 0, 4096, 4096);
        const step = 10 / MM, x0 = -HALF;                                        // a 10 mm grid that starts at the base of the flask
        for (let i = -30; i <= 60; i++) { const major = i % 5 === 0, x = x0 + i * step; if (Math.abs(x) < 9.5) line(x, -5.5, x, 5.5, major ? 0.13 : 0.05, major ? 2 : 1.5); }
        for (let i = -15; i <= 15; i++) { const major = i % 5 === 0, z = i * step; line(-9.5, z, 9.5, z, major ? 0.13 : 0.05, major ? 2 : 1.5); }
        c.setLineDash([36, 10, 6, 10]); line(-6.2, 0, 6.2, 0, 0.5, 2); c.setLineDash([]);     // the centre line of the part
        // the detector plate: outline and corner brackets, and a registration cross on every 50 mm node
        const px = 5.7, pz = 3.6; c.strokeStyle = 'rgba(168,207,242,0.3)'; c.lineWidth = 2; c.strokeRect(X(-px), Z(-pz), 2 * px * PX, 2 * pz * PX);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) { line(sx * px, sz * pz, sx * (px - 0.45), sz * pz, 0.85, 5); line(sx * px, sz * pz, sx * px, sz * (pz - 0.45), 0.85, 5); }
        for (let i = -5; i <= 30; i += 5) for (let j = -10; j <= 10; j += 5) { const x = x0 + i * step, z = j * step; if (Math.abs(x) < px) { line(x - 0.07, z, x + 0.07, z, 0.32, 2.5); line(x, z - 0.07, x, z + 0.07, 0.32, 2.5); } }
        // a scale bar, as on any radiograph
        const bx = 2.45, bz = 2.42, bl = 50 / MM; line(bx, bz, bx + bl, bz, 0.9, 4); line(bx, bz - 0.09, bx, bz + 0.09, 0.9, 4); line(bx + bl, bz - 0.09, bx + bl, bz + 0.09, 0.9, 4);
        c.font = '500 44px "IBM Plex Mono"'; c.textAlign = 'left'; c.textBaseline = 'bottom'; c.fillStyle = 'rgba(168,207,242,0.9)'; c.fillText('50 mm', X(bx), Z(bz - 0.12));
      });
      const marks = new THREE.Mesh(new THREE.PlaneGeometry(BW, BW), new THREE.MeshBasicMaterial({ map: marksTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
      marks.rotation.x = -Math.PI / 2; marks.position.y = 0.004; scene.add(marks);

      // brushed metal: fine rings around the axis, used for roughness and a slight bump
      const brush = K.canvasTex(64, 2048, (c) => { const r = K.rng(3); for (let y = 0; y < 2048; y++) { const v = Math.round(160 + r.range(-22, 22) + (r.chance(0.03) ? r.range(-30, 25) : 0)); c.fillStyle = `rgb(${v},${v},${v})`; c.fillRect(0, y, 64, 1); } }, { data: true });
      const steel = (color, rough) => new THREE.MeshStandardMaterial({ color, metalness: 0.9, roughness: rough, roughnessMap: brush, bumpMap: brush, bumpScale: 0.03 });
      const plastic = (color) => new THREE.MeshStandardMaterial({ color, metalness: 0, roughness: 0.42 });

      // ---- the flask. Each part is one closed geometry with two looks: lit and sectioned, and X-ray film.
      const flask = new THREE.Group(); flask.rotation.z = -Math.PI / 2; flask.position.set(-HALF, AXIS_Y, 0); scene.add(flask);
      const lit = new THREE.Group(), film = new THREE.Group(); flask.add(lit, film);
      const WALL_K = 0.7, LINING_K = 1.0, DRINK_K = 0.155, STOP_K = 0.2;                     // film densities of the parts that get animated
      const X = {};                                                             // the film material of every part, by name
      // part(name, closed geometry, lit material or null, colour and brightness of its cut face, film density, film colour)
      const part = (name, geo, litMat, cap, capGain, density, color = COOL) => {
        if (litMat) lit.add(sectioned(geo, litMat, cap, capGain));
        X[name] = xray(color, density); const m = new THREE.Mesh(geo, X[name]); m.frustumCulled = false; film.add(m); return m;
      };
      const outer = fine(OUTER), inner = fine(INNER);
      const ring = (r0, r1, y0, y1) => revolve([[r0, y0], [r1, y0], [r1, y1], [r0, y1]]);
      const torus = (r, tube, y) => { const g = new THREE.TorusGeometry(r, tube, 12, 96); g.rotateX(Math.PI / 2); g.translate(0, y, 0); return g; };
      part('outer', revolve(wall(outer, T_OUT)), steel('#c4c8ce', 0.55), COOL, 1.7, WALL_K);
      part('inner', revolve(wall(inner, T_IN)), steel('#b9bdc4', 0.5), COOL, 1.7, WALL_K);
      part('rim', ring(0.69, 0.985, 7.19, 7.27), steel('#c4c8ce', 0.5), COOL, 1.7, WALL_K);          // where the two walls are welded together
      // the reflective lining: a thin coat on both faces of the gap, up to the neck (copper on the inner bottle in the solid view)
      part('liningIn', revolve(wall(offset(inner, T_IN / 2 + 0.008).slice(0, 118), 0.014)), new THREE.MeshStandardMaterial({ color: '#d98a54', metalness: 1, roughness: 0.3 }), ACCENT, 1.0, LINING_K);
      part('liningOut', revolve(wall(offset(outer, -T_OUT / 2 - 0.008).slice(0, 118), 0.014)), null, null, 0, LINING_K);
      const drink = offset(inner, -T_IN / 2 - 0.012).filter((p) => p[1] < 6.3);
      part('drink', revolve(drink.concat([[0, drink[drink.length - 1][1]]])), new THREE.MeshStandardMaterial({ color: '#2a1408', roughness: 0.25 }), ACCENT, 0.85, DRINK_K, ACCENT);
      part('stopper', revolve(STOPPER), plastic('#15171a'), COOL, 0.5, STOP_K);
      part('gasket', torus(0.675, 0.05, 6.6), plastic('#0c0d0f'), COOL, 0.9, 1.1);
      [6.72, 6.9, 7.08].forEach((y, i) => part('thread' + i, torus(1.0, 0.04, y), steel('#c4c8ce', 0.5), COOL, 1.7, 0.8));   // the screw thread on the neck
      part('cup', revolve(wall(fine(CUP, 90), 0.05)), steel('#d2d5da', 0.48), COOL, 1.7, 0.65);
      part('collar', revolve([[1.57, 5.42], [1.635, 5.42], [1.635, 5.62], [1.55, 5.95], [1.45, 5.95], [1.45, 5.9], [1.57, 5.6]]), plastic('#121416'), COOL, 0.7, 0.35);
      part('tip', revolve([[0, 0.235], [0.1, 0.235], [0.06, 0.4], [0, 0.44]]), steel('#c4c8ce', 0.5), COOL, 1.7, 1.6);   // the sealed-off pumping stub in the base

      // ---- the scanning plane: a faint sheet with a bright frame, and its line on the bed
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 4.1), new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(COOL) }, uGain: { value: 1 } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `uniform vec3 uColor; uniform float uGain; varying vec2 vUv;
          void main(){ vec2 e = min(vUv, 1.0 - vUv) * vec2(6.2, 4.1); float frame = smoothstep(0.035, 0.0, min(e.x, e.y)) * 1.6, floorLine = smoothstep(0.07, 0.0, vUv.y * 4.1) * 3.0;
            gl_FragColor = vec4(uColor * uGain * (0.035 + 0.05 * (1.0 - vUv.y) + frame + floorLine), 1.0); }`,
        side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      }));
      sheet.rotation.y = Math.PI / 2; scene.add(sheet);

      // ---- heat: ribbons, arrow heads and the small bars where a ray is stopped, all in one plane that turns to face the camera
      const heat = new THREE.Group(); heat.matrixAutoUpdate = false; scene.add(heat);
      const HOT = new THREE.Color(ACCENT).lerp(new THREE.Color('#ffffff'), 0.4);      // rays are the accent, a step whiter so they read on the warm drink
      const glow = (gain = 1) => new THREE.MeshBasicMaterial({ color: HOT.clone().multiplyScalar(gain), blending: THREE.AdditiveBlending, transparent: true, depthTest: false, depthWrite: false });
      const ribbon = (pts, w) => {
        const pos = [], aS = [], aV = [], idx = [], acc = [0];
        for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
        pts.forEach((p, i) => {
          const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, s = acc[i] / acc[acc.length - 1];
          pos.push(p[0] - dy / l * w / 2, p[1] + dx / l * w / 2, 0, p[0] + dy / l * w / 2, p[1] - dx / l * w / 2, 0); aS.push(s, s); aV.push(1, -1);
          if (i) idx.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i);
        });
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(aS, 1)); g.setAttribute('aV', new THREE.Float32BufferAttribute(aV, 1)); g.setIndex(idx);
        return { g, acc };
      };
      const rayMat = () => new THREE.ShaderMaterial({
        uniforms: { uColor: { value: HOT }, uHead: { value: 0 }, uGain: { value: 1 }, uFlow: { value: 0 } },
        vertexShader: 'attribute float aS, aV; varying float vS, vV; void main(){ vS = aS; vV = aV; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `uniform vec3 uColor; uniform float uHead, uGain, uFlow; varying float vS, vV;
          void main(){ if (vS > uHead) discard;
            float tip = exp(-(uHead - vS) * 7.0), pulse = pow(0.5 + 0.5 * sin(6.2832 * (vS * 2.0 - uFlow)), 6.0);   // a hot tip, and slow pulses that keep pushing
            gl_FragColor = vec4(uColor * uGain * (1.0 - vV * vV) * (1.7 + 2.5 * tip + 1.6 * pulse), 1.0); }`,
        side: THREE.DoubleSide, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
      });
      const headGeo = new THREE.BufferGeometry(); headGeo.setAttribute('position', new THREE.Float32BufferAttribute([0.04, 0, 0, -0.16, 0.085, 0, -0.16, -0.085, 0], 3));
      const rays = HEAT.map((r) => {
        const { g, acc } = ribbon(r.pts, r.part === 1 ? 0.05 : 0.07), mat = rayMat();
        const line = new THREE.Mesh(g, mat), head = new THREE.Mesh(headGeo, glow(3.2)), bar = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.055), glow(1));
        head.material.side = THREE.DoubleSide; bar.material.side = THREE.DoubleSide;
        bar.position.set(r.bar[0], r.bar[1], 0); bar.rotation.z = r.bar[2] ? Math.PI / 2 : 0;
        for (const m of [line, head, bar]) { m.frustumCulled = false; m.renderOrder = 5; heat.add(m); }
        const at = (f) => {                                                       // point and direction at a fraction of the length
          const d = f * acc[acc.length - 1]; let i = 1; while (i < acc.length - 1 && acc[i] < d) i++;
          const a = r.pts[i - 1], b = r.pts[i], k = (d - acc[i - 1]) / (acc[i] - acc[i - 1] || 1), n = r.pts.length - 1, m = r.hit ? n / 2 : n;   // the head points along the leg it is on, not along the wiggle
          const j0 = r.pts[i - 1 < m ? 0 : m], j1 = r.pts[i - 1 < m ? m : n];
          return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, Math.atan2(j1[1] - j0[1], j1[0] - j0[0])];
        };
        return { r, mat, head, bar, at };
      });

      // The vacuum has nothing in it to light up, so its turn is shown as a hatched band: the gap between the walls as
      // cut by that same camera-facing plane (the way a drawing hatches a section).
      const gapLoop = offset(outer, -T_OUT / 2 - 0.02).concat(offset(inner, T_IN / 2 + 0.02).reverse());
      const gapBand = new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(COOL) }, uGain: { value: 0 } },
        vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform vec3 uColor; uniform float uGain; varying vec2 vP; void main(){ float s = fract((vP.x + abs(vP.y)) * 9.0); gl_FragColor = vec4(uColor * uGain * (0.22 + 0.78 * smoothstep(0.0, 0.1, s) * smoothstep(0.5, 0.4, s)), 1.0); }',
        side: THREE.DoubleSide, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
      });
      for (const side of [1, -1]) { const m = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(gapLoop.map(([r, h]) => new THREE.Vector2(u(h), side * r)))), gapBand); m.frustumCulled = false; m.renderOrder = 4; heat.add(m); }

      // ---- camera: [azimuth, elevation, distance, target x, y, z]. One move, still travelling on the last frame.
      const camPath = K.path([[0, [-50, 22, 15.0, -0.75, 1.5, 0]], [1.4, [-44, 31, 13.6, -0.3, 1.4, 0]], [3.2, [-9, 65, 15.6, 0, 1.6, 0.05]], [5.4, [-2, 72, 15.9, 0, 1.64, 0.1]], [9.2, [0.4, 80, 14.3, 0, 1.64, 0.1]]]);
      const camAt = (t) => { const [az, el, d, tx, ty, tz] = camPath(t), a = az * Math.PI / 180, e = el * Math.PI / 180; return { pos: [tx + d * Math.cos(e) * Math.sin(a), ty + d * Math.sin(e), tz + d * Math.cos(e) * Math.cos(a)], aim: [tx, ty, tz] }; };

      // ---- timing helpers
      const scanX = (t) => { const k = K.seg(t, SCAN[0], SCAN[1]); return K.lerp(-HALF - 0.55, HALF + 0.55, 0.45 * k + 0.55 * k * k * (3 - 2 * k)); };
      const flare = (t, t0, rest = 0.5) => (t < t0 ? 0 : K.seg(t, t0, t0 + 0.1) * (rest + (1 - rest) * Math.exp(-(t - t0 - 0.1) * 2.4)));   // a part lights up, then settles to `rest`
      const cool = new THREE.Color(COOL), accent = new THREE.Color(ACCENT), AX = new THREE.Vector3(1, 0, 0), C = new THREE.Vector3(0, AXIS_Y, 0);
      const toCam = new THREE.Vector3(), up2 = new THREE.Vector3(), v3 = new THREE.Vector3();

      return {
        update(t) {
          const cam = camAt(t); K.look(camera, cam.pos, cam.aim); K.focus(camera, cam.aim, K.lerp(0.022, 0.03, K.seg(t, 0, 3.5)));

          // the scan: the cut plane travels, the solid side is lit and capped, the other side is film
          const sx = scanX(t), done = t >= SCAN[1];
          setCut(sx); lit.visible = !done; film.visible = t > SCAN[0];
          sheet.position.set(sx, 2.05, 0); sheet.material.uniforms.uGain.value = K.seg(t, SCAN[0] - 0.3, SCAN[0] + 0.05) * (1 - K.seg(t, SCAN[1] - 0.12, SCAN[1] + 0.3));
          // the room dims as the picture turns into emitted light
          const dim = K.seg(t, SCAN[0] + 0.9, SCAN[1] + 0.4, K.ease.inOut);
          key.intensity = 1500 * (1 - 0.93 * dim); scene.environmentIntensity = 1 - 0.8 * dim; marks.material.color.setScalar(0.55 + 0.5 * dim);

          // the flat plane through the axis that faces the camera: rays and callouts live in it, and film distances are measured from it
          toCam.set(cam.pos[0], cam.pos[1], cam.pos[2]).sub(C); toCam.x = 0; toCam.normalize(); up2.crossVectors(toCam, AX);
          heat.matrix.makeBasis(AX, up2, toCam).setPosition(C); heat.matrixWorldNeedsUpdate = true;
          REF.value.set(toCam.x, toCam.y, toCam.z, -toCam.dot(C));

          // the parts light up one at a time, then settle so the finished picture keeps all three
          const fl = flare(t, PARTS[1].at, 0.5), fs = flare(t, PARTS[2].at, 0.3);
          gapBand.uniforms.uGain.value = 1.6 * flare(t, PARTS[0].at, 0.26); gapBand.uniforms.uColor.value.copy(cool).lerp(accent, flare(t, PARTS[0].at, 0));
          for (const n of ['liningIn', 'liningOut']) { X[n].uniforms.uColor.value.copy(cool).lerp(accent, Math.min(1, fl * 1.5)); X[n].uniforms.uK.value = LINING_K * (1 + 3 * fl); }
          X.stopper.uniforms.uColor.value.copy(cool).lerp(accent, Math.min(1, fs * 1.4)); X.stopper.uniforms.uK.value = STOP_K * (1 + 1.2 * fs);
          X.gasket.uniforms.uColor.value.copy(cool).lerp(accent, Math.min(1, fs * 1.4));
          X.drink.uniforms.uK.value = DRINK_K * (1 + 0.035 * Math.sin(t * 2.6));

          for (const { r, mat, head, bar, at } of rays) {
            const f = K.seg(t, r.t0, r.t0 + r.dur), on = t > r.t0, hit = K.seg(t, r.stop, r.stop + 0.09), age = Math.max(0, t - r.stop);
            mat.uniforms.uHead.value = on ? f : -1; mat.uniforms.uFlow.value = t * 0.9 - r.t0; mat.uniforms.uGain.value = 1.15 - 0.4 * K.seg(t, r.t0 + r.dur, r.t0 + r.dur + 0.8);
            const [hx, hy, ha] = at(f); head.visible = on; head.position.set(hx, hy, 0); head.rotation.z = ha;
            bar.visible = hit > 0; bar.scale.set(K.lerp(0.3, 1, K.ease.outBack(hit)), 1 + 2.2 * Math.exp(-age * 9) * hit, 1); bar.material.color.copy(HOT).multiplyScalar(1.5 + 5 * Math.exp(-age * 6));
          }
        },

        // Callouts: a pole from a point on the model to a label, both ends tracked in 3D (projected each frame).
        overlay(ctx, t, W, H) {
          camera.updateMatrixWorld();
          const P = (x, r) => { v3.copy(C).addScaledVector(AX, x).addScaledVector(up2, r).project(camera); return [(v3.x * 0.5 + 0.5) * W, (0.5 - v3.y * 0.5) * H]; };
          const s = H / 1080, mix = (k) => `rgb(${Math.round(K.lerp(214, 255, k))},${Math.round(K.lerp(232, 150, k))},${Math.round(K.lerp(247, 60, k))})`;
          ctx.textBaseline = 'alphabetic'; ctx.lineCap = 'butt';

          // title, on while the object is still solid
          const ta = 1 - K.seg(t, 1.45, 1.9);
          if (ta > 0) {
            ctx.globalAlpha = ta; ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 18 * s;
            ctx.fillStyle = ACCENT; ctx.font = `500 ${26 * s}px "IBM Plex Mono"`; ctx.letterSpacing = `${3 * s}px`; ctx.fillText(OVERLINE, 92 * s, 92 * s);
            ctx.fillStyle = '#f2f6fa'; ctx.font = `700 ${68 * s}px "Space Grotesk"`; ctx.letterSpacing = `${1 * s}px`;
            TITLE.forEach((l, i) => ctx.fillText(l, 90 * s, (170 + i * 76) * s));
          }
          // the position readout that rides on the scanning plane
          const sa = K.seg(t, SCAN[0] - 0.1, SCAN[0] + 0.2) * (1 - K.seg(t, SCAN[1] - 0.25, SCAN[1]));
          if (sa > 0) {
            v3.set(scanX(t), 4.1, 3.1).project(camera); const mm = Math.round(K.clamp((scanX(t) + HALF) * MM, 0, LEN * MM));
            ctx.globalAlpha = sa; ctx.fillStyle = '#d6e8f7'; ctx.font = `500 ${34 * s}px "IBM Plex Mono"`; ctx.letterSpacing = '0px'; ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 10 * s;
            const label = String(mm).padStart(3, '0') + ' mm';                     // held inside the frame when the plane's corner leaves it
            ctx.fillText(label, Math.min((v3.x * 0.5 + 0.5) * W + 14 * s, W - ctx.measureText(label).width - 40 * s), (0.5 - v3.y * 0.5) * H - 12 * s);
          }

          const call = (p, anchor, dir, len) => {                                 // dir -1 = label above the part, 1 = below
            const k = K.seg(t, p.at - 0.08, p.at + 0.3, K.ease.out), kn = K.seg(t, p.at + 0.02, p.at + 0.35, K.ease.out), ko = K.seg(t, p.at + 0.22, p.at + 0.6, K.ease.out);
            if (k <= 0) return;
            const hot = flare(t, p.at, 0.0) , [ax, ay] = P(anchor[0], anchor[1]), tip = ay + dir * len * s * k, col = mix(Math.min(1, hot * 1.3));
            ctx.globalAlpha = 1; ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 14 * s; ctx.strokeStyle = col; ctx.fillStyle = col;
            ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.moveTo(ax, ay + dir * 11 * s); ctx.lineTo(ax, tip); ctx.stroke();
            ctx.beginPath(); ctx.arc(ax, ay, 10 * s, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(ax, ay, 3.5 * s, 0, 7); ctx.fill();
            // text block beside the far end of the pole: name, then note
            const end = ay + dir * len * s, top = dir < 0 ? end : end - 126 * s, tx = ax + 22 * s;
            ctx.globalAlpha = kn; ctx.fillStyle = '#f4f8fb'; ctx.font = `700 ${78 * s}px "Space Grotesk"`; ctx.letterSpacing = `${2 * s}px`; ctx.fillText(p.name, tx + (1 - kn) * 26 * s, top + 57 * s);
            ctx.globalAlpha = ko; ctx.fillStyle = '#a9c7df'; ctx.font = `500 ${44 * s}px "Space Grotesk"`; ctx.letterSpacing = `${0.5 * s}px`; ctx.fillText(p.note, tx + (1 - ko) * 18 * s, top + 114 * s);
          };
          call(PARTS[0], [u(0.98), (R_GAP[0] + R_GAP[1]) / 2], -1, 204);
          call(PARTS[1], [u(1.0), -(R_GAP[1] - 0.012)], 1, 196);
          call(PARTS[2], [u(6.62), 0.5], -1, 372);
          ctx.globalAlpha = 1; ctx.shadowBlur = 0;
        },
      };
    },

    sound(k) {
      const K = globalThis.K;
      k.bed('room', 0, 8, { gain: 0.9 }); k.bed('hum', 0, 8, { gain: 0.45 });
      // the scanner: a motor that winds up and a band of noise that rises with it, a tick at every 50 mm on the ruler
      const d = SCAN[1] - SCAN[0];
      k.play('click', SCAN[0] - 0.02, { gain: 0.9 });
      k.tone(SCAN[0], { f: [[0, 92], [d, 138]], type: 'sawtooth', dur: d + 0.1, gain: 0.07, a: 0.12, hold: d - 0.25, filter: 'lowpass', f2: 700 });
      k.noise(SCAN[0], { dur: d + 0.15, color: 'pink', filter: 'bandpass', f: [[0, 700], [d, 2400]], q: 2.2, gain: 0.1, a: 0.2, hold: d - 0.4, verb: 0.15 });
      k.withMinor(() => { for (let i = 1; i <= 9; i++) k.play('tick', SCAN[0] + d * i / 10, { gain: 0.45, f: 5200, pan: -0.6 + i * 0.12 }); });
      k.play('tock', SCAN[1], { gain: 0.7, f: 420 }); k.play('thud', SCAN[1] + 0.02, { gain: 0.3 });
      // heat meeting each part: dull knocks at the vacuum, glassy pings off the mirror, one soft thump at the plug
      for (const r of HEAT) {
        const pan = K.clamp(r.pts[0][0] / 5, -0.7, 0.7);
        if (r.part === 0) k.play('tock', r.stop, { gain: 0.55, f: 300 + 25 * pan, pan });
        if (r.part === 1) { k.withMinor(() => k.play('swish', r.t0, { gain: 0.35, pan })); k.play('ding', r.stop, { gain: 0.3, f: 1568 + 180 * pan, pan }); }
        if (r.part === 2) k.play('thud', r.stop, { gain: 0.42, f: 150, pan: 0.5 });
      }
      k.play('whoosh', PARTS[0].at - 0.45, { gain: 0.35, dur: 0.45 }); k.play('whoosh', PARTS[2].at - 0.4, { gain: 0.3, dur: 0.4, pan: 0.4 });
      PARTS.forEach((p, i) => { k.play('click', p.at + 0.06, { gain: 0.6, pan: i === 2 ? 0.4 : -0.3 }); k.tone(p.at, { f: [110, 98, 82][i], dur: 0.9, gain: 0.14, a: 0.02 }); });
      k.play('ding', 6.95, { gain: 0.35, f: 'D6' }); k.play('ding', 7.05, { gain: 0.3, f: 'A6' });
    },
  });
}
```
