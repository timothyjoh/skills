# Exploded View (#08)

- **id:** `exploded-view`
- **Category:** Diagrams with depth
- **Use:** explainer
- **Reference duration:** 8 s
- **Google Fonts:** IBM Plex Mono, Space Grotesk
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`

## Style card

- **Look:** A product teardown film: one object hangs over a pale seamless floor, comes apart along its axis into its parts, and every part gets a numbered callout in ink blue.
- **Motion:** The object unscrews and pulls apart along its axis into sub-assemblies, they park as two tiers, then each spreads into its parts one after another; every part overshoots its place, settles and keeps a slight tilt of its own. Callouts draw on as the focus reaches each part, then everything returns in reverse and seats with a click.
- **Light:** One very large soft top light, so every part drops a soft shadow on the floor, with sky light for the contact shading. Black cards in the reflections give chrome its dark streaks and clear plastic its edges.
- **Materials:** Real finishes, one per part: clear plastic, chrome, turned brass, a steel spring wound as a true helix, dimpled black rubber, milky tube with blue ink, one orange moulded piece.
- **Camera:** A long lens on a slow crane, looking down the axis so the row recedes: close on the object, back and up as it opens, creeping in while a shallow focus travels from part to part, then close again as it shuts. One continuous move.
- **Finish:** Depth of field and motion blur from the lens itself, neutral colour, almost no bloom, a light vignette. Labels and leader lines are drawn on top so they stay sharp.
- **Good for:** How something is built or what is inside it: any object made of parts. Each part is one named item, the order of the row is the order of assembly, and putting it back together shows where everything goes.

## Reference

- **Sample topic:** What's inside a ballpoint pen
- **Gallery description:** A product teardown film: one object hangs over a pale seamless floor, comes apart along its axis into its parts, and every part gets a numbered callout in ink blue.
- **Shown in the sample clip:** What's inside a ballpoint pen

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/exploded-view.js`)

```js
{
  // ---------------------------------------------------------------- content (change this block for a new topic)
  const TITLE = ["WHAT'S INSIDE", 'A BALLPOINT PEN'];
  const PAYOFF = ['SEVEN PARTS', 'ONE CLICK'];
  // The parts list, in the order they are named. `open` / `shut` = where the label sits in the 1920 x 1080 frame
  // while the object is apart / back together (the leader line follows the part); `side` = text right (1) or
  // left (-1) of the number.
  const PARTS = [
    { id: 'grip', name: 'GRIP', side: -1, open: [388, 560], shut: [485, 307] },
    { id: 'spring', name: 'SPRING', side: 1, open: [715, 980], shut: [545, 955] },
    { id: 'tip', name: 'TIP', side: 1, open: [1080, 850], shut: [150, 900] },
    { id: 'tube', name: 'INK TUBE', side: 1, open: [1425, 738], shut: [1005, 762] },
    { id: 'barrel', name: 'BARREL', side: -1, open: [592, 227], shut: [778, 210] },
    { id: 'clip', name: 'CLIP', side: -1, open: [825, 128], shut: [1113, 120] },
    { id: 'clicker', name: 'CLICKER', side: 1, open: [1385, 183], shut: [1492, 232] },
  ];
  // The timeline, shared by picture and sound.
  const T = { click: 0.3, unscrew: 0.6, pull: 0.95, stack: 1.32, spread: 1.55, labels: 2.1, gather: 4.9, unstack: 5.38, push: 5.88, screw: 6.3, click2: 6.82, payoff: 7.0 };
  const STAGGER = 0.085, LABEL_EVERY = 0.22;
  const leaveAt = (i) => T.spread + i * STAGGER;                              // part i starts to its own place
  const homeAt = (i) => T.gather + (PARTS.length - 1 - i) * 0.06 + 0.42;       // part i is back in its sub-assembly
  const labelAt = (i) => T.labels + i * LABEL_EVERY;
  const INK = '#1b2f8c', PAPER = '#fbf7ee';

  // ---------------------------------------------------------------- reusable piece 1: turned parts and helices
  // A turned part: an outline of [x, radius] points spun around the X axis, like work on a lathe. Every straight run
  // keeps its own flat normal, so steps and chamfers catch a crisp highlight (THREE.LatheGeometry would smooth them
  // into a blob). A third value of 1 marks a point as part of a curve: the surface runs smoothly through it.
  // `bevel` cuts every hard corner with a small chamfer. Walk the outline front face up, outside to the back, back
  // face down, bore to the front: then all faces point outwards.
  function turned(outline, { seg = 72, bevel = 0 } = {}) {
    let P = outline.map((p) => ({ x: p[0], r: p[1], s: !!p[2] }));
    if (bevel) {
      const Q = [];
      P.forEach((p, i) => {
        const a = P[i - 1], b = P[i + 1];
        if (!a || !b || p.s) { Q.push(p); return; }
        const cut = (q) => { const d = Math.hypot(q.x - p.x, q.r - p.r), c = Math.min(bevel, d * 0.4); return { x: p.x + (q.x - p.x) * c / d, r: p.r + (q.r - p.r) * c / d, s: false }; };
        Q.push(cut(a), cut(b));
      });
      P = Q;
    }
    const n = P.length - 1, N = [], pos = [], nor = [], uv = [], idx = [];
    for (let i = 0; i < n; i++) { const dx = P[i + 1].x - P[i].x, dr = P[i + 1].r - P[i].r, l = Math.hypot(dx, dr) || 1; N.push([-dr / l, dx / l]); }
    const mix = (a, b) => { const x = a[0] + b[0], r = a[1] + b[1], l = Math.hypot(x, r) || 1; return [x / l, r / l]; };
    const x0 = Math.min(...P.map((p) => p.x)), x1 = Math.max(...P.map((p) => p.x));
    for (let i = 0; i < n; i++) {
      const ends = [[P[i], i > 0 && P[i].s ? mix(N[i - 1], N[i]) : N[i]], [P[i + 1], i < n - 1 && P[i + 1].s ? mix(N[i], N[i + 1]) : N[i]]];
      const base = pos.length / 3;
      for (const [p, m] of ends) for (let k = 0; k <= seg; k++) {
        const a = k / seg * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
        pos.push(p.x, p.r * c, p.r * s); nor.push(m[0], m[1] * c, m[1] * s); uv.push(k / seg, (p.x - x0) / (x1 - x0 || 1));
      }
      for (let k = 0; k < seg; k++) { const a = base + k, b = a + 1, c = base + seg + 1 + k, d = c + 1; idx.push(a, b, c, b, d, c); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    return g;
  }
  // A real helix along X, starting at x = 0: a spring (with `dead` closed coils at each end) or a screw thread.
  function helix({ radius, wire, turns, length, dead = 0, seg = 26 }) {
    const pitch = (length - dead * 4 * wire) / Math.max(1e-3, turns - dead * 2);
    class Coil extends THREE.Curve {
      getPoint(u, v = new THREE.Vector3()) {
        const a = u * turns, lead = Math.min(a, dead), tail = Math.max(0, a - (turns - dead)), mid = a - lead - tail;
        return v.set((lead + tail) * 2 * wire + mid * pitch, radius * Math.cos(a * Math.PI * 2), radius * Math.sin(a * Math.PI * 2));
      }
    }
    return new THREE.TubeGeometry(new Coil(), Math.round(turns * seg), wire, 8, false);
  }
  // A ring whose back edge is cut into teeth (cams, ratchets, crown gears). wave: 'saw' or 'tri'.
  function crown(r, x0, x1, teeth, depth, wave = 'saw', front = false) {
    const g = new THREE.CylinderGeometry(r, r, 1, 72, 1); g.rotateZ(-Math.PI / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const rad = Math.hypot(p.getY(i), p.getZ(i)), ph = ((Math.atan2(p.getZ(i), p.getY(i)) / (Math.PI * 2) * teeth) % 1 + 1) % 1;
      const w = rad < 1e-3 ? 0.5 : wave === 'saw' ? ph : 1 - Math.abs(ph * 2 - 1), cut = (p.getX(i) > 0) !== front;
      p.setX(i, cut ? (front ? x0 - depth * w : x1 + depth * w) : front ? x1 : x0);
    }
    g.computeVertexNormals();
    return g;
  }

  // ---------------------------------------------------------------- reusable piece 2: the studio and the finishes
  // A pale seamless floor under one big soft top light, plus sky light for the contact shading. The reflections come
  // from the environment: a large soft box overhead, a strip to the side, and two black cards. The black cards are
  // what give chrome its dark streaks and clear plastic its dark edges; without them both vanish on a pale set.
  function studio(S) {
    const { scene } = S;
    K.env(S, { top: '#f3f1ec', horizon: '#d9d8d4', bottom: '#b8b4ac', intensity: 0.44, panels: [
      { pos: [-2, 16, 5], size: [30, 12], color: '#ffffff', power: 5.5 },
      { pos: [-20, 5, 10], size: [3, 14], color: '#fff3df', power: 6 },
      { pos: [0, 13, 13], size: [34, 1.1], color: '#ffffff', power: 16 },         // a thin strip: the crisp line of light along every round part
      { pos: [20, 3, 12], size: [10, 12], color: '#050505', power: 1 },
      { pos: [14, -9, -14], size: [34, 16], color: '#060606', power: 1 },     // behind and below the set, where the lens points: the dark edges
      { pos: [-22, 1, -6], size: [8, 6], color: '#080808', power: 1 },
      { pos: [-15, -2.5, 17], size: [40, 3.2], color: '#0a0a0a', power: 1 },     // a dark line low in front: the horizon in the chrome
    ] });
    K.sun(S, { pos: [-9, 26, 13], target: [0, 0, 0], color: '#fffaf2', power: 2.9, size: 16, soft: 2.6, mapSize: 4096 });
    K.skyLight(S, { color: '#eef2ff', power: 0.7, size: 16, mapSize: 2048 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ color: '#dedbd5', roughness: 0.95, metalness: 0 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    scene.fog = new THREE.Fog(PAPER, 45, 160);
  }
  function finishes() {
    const P = THREE.MeshPhysicalMaterial, M = THREE.MeshStandardMaterial;
    // fine rings around the axis, as a lathe tool leaves them: used as bump and roughness on the turned metal
    const rings = K.canvasTex(8, 512, (ctx, w, h) => { const r = K.rng(3); for (let y = 0; y < h; y++) { const v = 150 + Math.floor(r() * 90); ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(0, y, w, 1); } }, { data: true, repeat: [1, 2] });
    // small dimples for the rubber
    const dimples = K.canvasTex(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, w, h);
      for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { const x = (i + (j % 2) * 0.5) * 32 + 8, y = j * 32 + 16, g = ctx.createRadialGradient(x, y, 1, x, y, 11); g.addColorStop(0, '#000'); g.addColorStop(1, '#808080'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, 7, 11, 0, 0, 7); ctx.fill(); }
    }, { data: true, repeat: [9, 2] });
    return {
      chrome: new M({ color: '#e6e8ec', metalness: 1, roughness: 0.12 }),
      chromeBoth: new M({ color: '#e6e8ec', metalness: 1, roughness: 0.12, side: THREE.DoubleSide }),
      steel: new M({ color: '#c9ccd1', metalness: 1, roughness: 0.26 }),
      satin: new M({ color: '#b9bcc2', metalness: 1, roughness: 0.42, bumpMap: rings, bumpScale: 0.4 }),
      brass: new M({ color: '#d8a445', metalness: 1, roughness: 0.3, roughnessMap: rings, bumpMap: rings, bumpScale: 0.5 }),
      carbide: new M({ color: '#7d8087', metalness: 1, roughness: 0.14 }),
      rubber: new P({ color: '#17181b', roughness: 0.78, metalness: 0, sheen: 0.6, sheenColor: new THREE.Color('#8a8f9a'), sheenRoughness: 0.55, bumpMap: dimples, bumpScale: 1.6 }),
      clear: new P({ color: '#ffffff', metalness: 0, roughness: 0.06, transmission: 1, thickness: 0.22, ior: 1.5, attenuationColor: new THREE.Color('#9fbfdd'), attenuationDistance: 0.4, envMapIntensity: 1.5, clearcoat: 1, clearcoatRoughness: 0.05 }),
      nylon: new P({ color: '#f1eee6', roughness: 0.5, metalness: 0, clearcoat: 0.2 }),
      orange: new P({ color: '#f2641f', roughness: 0.42, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.3 }),
      // the refill tube: milky plastic with the ink column printed into its colour map (front of the tube = bottom of the map)
      tube: new P({ roughness: 0.3, metalness: 0, clearcoat: 0.8, clearcoatRoughness: 0.2, map: K.canvasTex(32, 1024, (ctx, w, h) => {
        const y = (f) => h - f * h;                                    // f = 0 at the tip end of the tube
        ctx.fillStyle = '#dfe6ea'; ctx.fillRect(0, 0, w, h);
        const ink = ctx.createLinearGradient(0, y(0.78), 0, y(0)); ink.addColorStop(0, '#16257c'); ink.addColorStop(0.08, '#101a5c'); ink.addColorStop(1, '#0b1247');
        ctx.fillStyle = ink; ctx.fillRect(0, y(0.78), w, y(0) - y(0.78));
        ctx.fillStyle = '#d9c48a'; ctx.fillRect(0, y(0.83), w, y(0.78) - y(0.83));        // the grease plug that follows the ink down
        ctx.fillStyle = 'rgba(120,135,150,0.5)'; ctx.fillRect(0, y(0.835), w, 3);
      }) }),
      // casts a shadow but is never drawn: the thick rims of clear parts, so clear plastic throws a light, hollow shadow
      shadowOnly: new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }),
    };
  }

  // ---------------------------------------------------------------- the object (this is the part that changes)
  // A retractable ballpoint pen, modelled along X with the ball at x = 0, drawn with the tip out. One unit is about a
  // centimetre. Returns { parts: { id: { node, span: [front, back], anchor, tilt, ... } }, rows, live(t, out) }.
  //   rows: the sub-assemblies. The object first pulls apart into these along its axis (`pull`), they park side by
  //         side as tiers (`lift`: up and towards the camera), then every row spreads into its parts around `centre`.
  //         A compact object needs one row and no lift; a long thin one like a pen fills the frame far better in two.
  //   live: the object's own mechanism (here: the click), called every frame with how far out each part is (0..1).
  function ballpointPen(fin) {
    const mesh = (geo, mat, shadow = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = true; return m; };
    const group = (...kids) => { const g = new THREE.Group(); g.add(...kids); return g; };
    const at = (m, x, y = 0, z = 0) => { m.position.set(x, y, z); return m; };

    // 1 GRIP: chrome nose cone, a clear window (you can see the spring through it), the rubber sleeve, a threaded stub
    const sleeve = [[2.56, 0.37], [2.56, 0.555]];
    for (let i = 0; i <= 70; i++) { const s = i / 70, rib = Math.max(0, 1 - Math.abs(((s * 7.5 + 0.25) % 1) - 0.5) * 7); sleeve.push([2.6 + s * 1.31, 0.59 - 0.035 * Math.sin(Math.PI * s) - 0.024 * rib * K.smooth(0, 0.08, s) * K.smooth(1, 0.92, s), 1]); }
    sleeve.push([3.95, 0.555], [3.95, 0.43]);
    const grip = group(
      mesh(turned([[0.42, 0.15], [0.42, 0.2], [0.6, 0.278, 1], [0.8, 0.348, 1], [1.0, 0.407, 1], [1.2, 0.456, 1], [1.38, 0.493], [1.38, 0.525], [1.5, 0.525], [1.5, 0.37]], { bevel: 0.012 }), fin.chromeBoth),
      mesh(turned([[1.5, 0.37], [1.5, 0.5], [2.56, 0.5], [2.56, 0.37], [1.5, 0.37]]), fin.clear, false),
      mesh(turned(sleeve), fin.rubber),
      mesh(turned([[3.95, 0.43], [4.35, 0.43], [4.35, 0.36], [2.56, 0.36]], { bevel: 0.012 }), fin.satin),
      at(mesh(helix({ radius: 0.436, wire: 0.02, turns: 4.5, length: 0.32 }), fin.satin), 3.99),
    );
    // 2 SPRING: sits around the front of the refill and pushes it back into the pen
    const coil = mesh(helix({ radius: 0.285, wire: 0.034, turns: 9, length: 1.6, dead: 1.25 }), fin.steel);
    // 3 TIP: a brass cone that holds the ball; its plug presses into the ink tube
    const tip = group(
      mesh(turned([[0.06, 0.0], [0.075, 0.056], [0.2, 0.086], [0.78, 0.16], [0.8, 0.19], [1.2, 0.19], [1.22, 0.235], [1.45, 0.235], [1.47, 0.17], [1.8, 0.17], [1.8, 0]], { bevel: 0.01 }), fin.brass),
      at(mesh(new THREE.SphereGeometry(0.056, 24, 16), fin.carbide), 0.058),
    );
    // 4 INK TUBE, with the two crimps the spring pushes against
    const tube = mesh(turned([[1.47, 0], [1.47, 0.21], [2.73, 0.21], [2.76, 0.3], [2.84, 0.3], [2.87, 0.21], [7.3, 0.21], [7.3, 0.15], [6.6, 0.15]], { bevel: 0.008 }), fin.tube);
    // 5 BARREL: clear plastic. Its rims cast the shadow (see finishes.shadowOnly).
    const rim = (x) => at(mesh(new THREE.TorusGeometry(0.5, 0.05, 6, 40).rotateY(Math.PI / 2), fin.shadowOnly), x);
    const rail = (z) => at(mesh(new THREE.CylinderGeometry(0.035, 0.035, 5.8, 6).rotateZ(Math.PI / 2), fin.shadowOnly), 6.85, 0, z);
    const barrel = group(
      mesh(turned([[3.95, 0.46], [3.95, 0.56], [9.1, 0.56], [9.4, 0.548, 1], [9.75, 0.49], [9.75, 0.44], [9.3, 0.44], [9.3, 0.46], [3.95, 0.46]], { bevel: 0.012 }), fin.clear, false),
      rim(4.0), rim(9.7), rail(0.5), rail(-0.5), rail(0.25), rail(-0.25),
    );
    // 6 CLIP: sprung chrome arm on a C-shaped band that snaps over the barrel from above
    const side = new THREE.Shape();
    side.moveTo(9.15, 0.86); side.lineTo(6.75, 0.8); side.quadraticCurveTo(6.4, 0.79, 6.38, 0.7); side.quadraticCurveTo(6.4, 0.585, 6.58, 0.6); side.quadraticCurveTo(6.7, 0.7, 6.9, 0.72);
    side.lineTo(8.72, 0.77); side.lineTo(8.72, 0.6); side.lineTo(9.15, 0.6); side.closePath();
    const arm = new THREE.ExtrudeGeometry(side, { depth: 0.24, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3, curveSegments: 16 }); arm.translate(0, 0, -0.12);
    const gap = 1.25;                                                    // the opening of the band, underneath
    const band = new THREE.LatheGeometry([[0.566, 8.72], [0.62, 8.72], [0.62, 9.15], [0.566, 9.15], [0.566, 8.72]].map((p) => new THREE.Vector2(p[0], p[1])), 48, Math.PI / 2 + gap / 2, Math.PI * 2 - gap); band.rotateZ(-Math.PI / 2);
    const bandMat = fin.chrome.clone(); bandMat.side = THREE.DoubleSide;
    const clip = group(mesh(arm, fin.chrome), mesh(band, bandMat));
    // 7 CLICKER: the cam that turns and locks the tube forward or back, and the push button that drives it
    const cam = group(mesh(turned([[7.9, 0.24], [7.2, 0.24], [7.2, 0.36], [7.9, 0.36]], { bevel: 0.012 }), fin.nylon), mesh(crown(0.36, 7.9, 7.95, 4, 0.25), fin.nylon));
    const ribs = [0, 1, 2, 3].map((i) => { const a = i * Math.PI / 2 + Math.PI / 4, m = mesh(K.roundedBox(0.62, 0.1, 0.12, 0.03, 2), fin.orange); m.position.set(8.75, Math.cos(a) * 0.37, Math.sin(a) * 0.37); m.rotation.x = a; return m; });
    const button = group(
      mesh(crown(0.36, 8.5, 9.05, 4, 0.25, 'tri', true), fin.orange), ...ribs,
      mesh(turned([[9.05, 0.36], [9.3, 0.36], [9.3, 0.435], [9.74, 0.435], [9.74, 0.3], [10.5, 0.3], [10.62, 0.27, 1], [10.69, 0.18, 1], [10.7, 0.0]], { bevel: 0.012 }), fin.chrome),
    );
    const clicker = group(cam, button);

    const parts = {
      grip: { node: grip, span: [0.42, 4.35], anchor: [3.2, 0.57, 0.1], tilt: [0, 0.1, -0.035] },
      spring: { node: group(coil), span: [1.5, 2.75], openLength: 1.95, anchor: [2.1, 0.3, 0.05], tilt: [0.5, -0.12, 0.05] },
      tip: { node: group(tip), span: [0, 1.8], anchor: [0.3, 0.1, 0.03], tilt: [0.3, 0.14, -0.06] },
      tube: { node: group(tube), span: [1.47, 7.3], anchor: [5.4, 0.21, 0.05], tilt: [0.2, -0.03, 0.012] },
      barrel: { node: barrel, span: [3.95, 9.75], anchor: [5.2, 0.56, 0.05], tilt: [0, 0.03, -0.012] },
      clip: { node: clip, span: [6.38, 9.15], rides: 'barrel', off: [0.35, 1.1, 0], anchor: [7.6, 0.84, 0], tilt: [-0.16, 0.06, 0.05] },   // rides with the barrel, lifts off it
      clicker: { node: clicker, span: [7.2, 10.7], openLength: 3.9, anchor: [10.2, 0.3, 0.1], tilt: [0.25, -0.08, 0.03] },
    };
    const rows = [
      { parts: ['grip', 'spring', 'tip', 'tube'], gap: 0.5, pull: -2.0, centre: 4.6, lift: [-0.85, 0.75], unscrew: { part: 'grip', turns: 1.25, travel: 0.3 } },
      { parts: ['barrel', 'clicker'], gap: 0.6, pull: 2.0, centre: 7.4, lift: [1.2, -0.75] },
    ];

    // the click: `ext` is how far the tip is out (1 = writing). Each press of the button flips it and turns the cam.
    const press = (t, tc) => K.seg(t, tc, tc + 0.06, K.ease.out) * (1 - K.seg(t, tc + 0.1, tc + 0.22, K.ease.inOut));
    const ext = (t) => 1 + 0.22 * press(t, T.click) - K.spring(t - T.click - 0.1, 5, 0.42) + K.spring(t - T.click2 - 0.015, 6, 0.42);
    const live = (t, out) => {
      const e = ext(t), back = 0.45 * (1 - e), o = (id) => K.smooth(0, 1, out[id]);
      tip.position.x = back * (1 - o('tip')); tube.position.x = back * (1 - o('tube'));
      // the spring: squeezed between the nose and the crimps while it is in the pen, free (and ringing) once it is out
      const s = o('spring'), ring = t - leaveAt(1) - 0.12, L = K.lerp(1.25 + back, 1.95, s) + (ring > 0 ? 0.3 * Math.exp(-5 * ring) * Math.sin(ring * 34) : 0);
      coil.scale.x = L / 1.6; coil.position.x = K.lerp(1.5, 2.125 - L / 2, s);
      const c = o('clicker'), p = press(t, T.click) + press(t, T.click2);
      cam.position.x = back * (1 - c) - 0.3 * p * (1 - c) - 0.4 * c;
      cam.rotation.x = Math.PI / 4 * (K.seg(t, T.click + 0.02, T.click + 0.2, K.ease.out) + K.seg(t, T.click2 + 0.02, T.click2 + 0.2, K.ease.out));
      button.position.x = (0.25 * (1 - e) - 0.34 * p) * (1 - c);
    };
    return { parts, rows, live, length: 10.7 };
  }

  // ---------------------------------------------------------------- reusable piece 3: the choreography
  // Puts every part on a pivot at its own centre, lays the rows out, and returns pose(t), which places everything
  // for time t: pull the sub-assemblies apart along the axis -> park them as tiers -> spread each into its parts
  // (staggered, each overshoots its place, settles and keeps a slight tilt of its own) -> and the same in reverse.
  function explodeRig(root, object) {
    const { parts, rows } = object, list = PARTS.map((c, i) => Object.assign(parts[c.id], c, { index: i }));
    for (const p of list) {
      p.centre = (p.span[0] + p.span[1]) / 2; p.pivot = new THREE.Group(); p.pivot.position.x = p.centre;
      p.node.position.x = -p.centre; p.pivot.add(p.node); root.add(p.pivot);
      p.anchorLocal = new THREE.Vector3(p.anchor[0] - p.centre, p.anchor[1], p.anchor[2]);
    }
    for (const row of rows) {
      const mem = row.parts.map((id) => parts[id]), len = (p) => p.openLength || p.span[1] - p.span[0];
      const total = mem.reduce((s, p) => s + len(p), 0) + row.gap * (mem.length - 1);
      const rest = (Math.min(...mem.map((p) => p.span[0])) + Math.max(...mem.map((p) => p.span[1]))) / 2;
      row.park = [row.centre - rest - row.pull, row.lift[0], row.lift[1]];
      let x = row.centre - total / 2;
      for (const p of mem) { p.row = row; p.spread = [x + len(p) / 2 - p.centre - row.pull - row.park[0], 0, 0]; x += len(p) + row.gap; }
    }
    for (const p of list) if (p.rides) { const host = parts[p.rides]; p.row = host.row; p.spread = host.spread.map((v, k) => v + p.off[k]); }

    const out = {};
    // thin dash-dot centre lines through each row and up to every part that lifts off the axis: the drawing
    // convention that says "these belong on one axis"
    const dash = K.canvasTex(64, 4, (ctx) => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 34, 4); ctx.fillRect(44, 0, 8, 4); }, { repeat: [1, 1] });
    const guide = () => {
      const tex = dash.clone(); tex.needsUpdate = true;
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1, 6, 1, true).rotateZ(Math.PI / 2), new THREE.MeshBasicMaterial({ color: INK, alphaMap: tex, alphaTest: 0.5 }));
      m.geometry.attributes.uv.array.forEach((v, i, a) => { if (i % 2 === 0) a[i] = a[i + 1]; });      // run the dash pattern along the line
      root.add(m); return m;
    };
    rows.forEach((row) => { row.guide = guide(); });
    list.filter((p) => p.rides).forEach((p) => { p.guide = guide(); });
    const span = (m, a, b, k) => {             // stretch a guide from a to b; k = how visible (0..1)
      const d = b.clone().sub(a), l = d.length(); m.visible = k > 0.02 && l > 0.05; if (!m.visible) return;
      m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), d.normalize());
      m.scale.set(l, k, k); m.material.alphaMap.repeat.x = l / 0.42;
    };

    const backOut = (u) => K.ease.outBack(u, 1.1);
    function pose(t) {
      // 0 = together, 1 = done, for each of the three moves
      const ka = K.seg(t, T.pull, T.pull + 0.45, K.ease.inOut) - K.seg(t, T.push, T.push + 0.42, K.ease.inOut);
      const kb = K.seg(t, T.stack, T.stack + 0.62, backOut) - K.seg(t, T.unstack, T.unstack + 0.55, K.ease.inOut);
      for (const p of list) {
        const i = p.index, row = p.row;
        // out: a spring past the mark and back. home: a small wind-up, then straight in, so it arrives with speed.
        const kc = K.spring(t - leaveAt(i), 1.7, 0.56) * (1 - K.ease.inBack(K.seg(t, homeAt(i) - 0.42, homeAt(i)), 1.2));
        out[p.id] = K.clamp(kc);
        let x = p.centre + row.pull * ka + row.park[0] * kb + p.spread[0] * kc, y = row.park[1] * kb + p.spread[1] * kc, z = row.park[2] * kb + p.spread[2] * kc, turn = 0;
        if (row.unscrew) {                 // the row creeps out on its thread while one part turns, before the pull
          const u = K.seg(t, T.unscrew, T.pull + 0.05, K.ease.inOut) - K.seg(t, T.screw, T.screw + 0.36, K.ease.inOut);
          x -= row.unscrew.travel * u; if (row.unscrew.part === p.id) turn = -row.unscrew.turns * Math.PI * 2 * u;
        }
        // while apart, every part floats a little on its own
        const f = out[p.id], ph = i * 1.7;
        p.pivot.position.set(x + 0.03 * f * Math.sin(t * 0.9 + ph), y + 0.04 * f * Math.sin(t * 1.1 + ph * 2), z);
        p.pivot.rotation.set(p.tilt[0] * kc + turn, p.tilt[1] * kc + 0.02 * f * Math.sin(t * 0.8 + ph), p.tilt[2] * kc + 0.012 * f * Math.sin(t * 1.3 + ph));
      }
      object.live(t, out);
      for (const row of rows) { const a = parts[row.parts[0]], b = parts[row.parts[row.parts.length - 1]]; span(row.guide, a.pivot.position, b.pivot.position, Math.min(out[a.id], out[b.id])); }
      for (const p of list) if (p.guide) { const h = parts[p.rides].pivot.position, a = p.pivot.position; span(p.guide, new THREE.Vector3(a.x, h.y, h.z), a, out[p.id]); }
    }
    return { list, pose };
  }

  // ---------------------------------------------------------------- reusable piece 4: callouts
  // Numbered balloons with leader lines, drawn in the 2D overlay so they stay perfectly sharp while the lens is
  // shallow. Each leader starts at a point on its part, re-projected every frame, so it follows the part while the
  // label itself keeps its place in the frame and glides to a second layout when the object closes.
  function callouts(S, list) {
    const { camera, W, H } = S, v = new THREE.Vector3(), R = 34, NAME_FONT = '600 70px "IBM Plex Mono"';
    const screen = (p) => { p.pivot.updateWorldMatrix(true, false); v.copy(p.anchorLocal).applyMatrix4(p.pivot.matrixWorld).project(camera); return [(v.x * 0.5 + 0.5) * W, (0.5 - v.y * 0.5) * H]; };
    const halo = (ctx, draw) => { ctx.save(); ctx.strokeStyle = 'rgba(242,238,229,0.9)'; ctx.lineJoin = 'round'; draw(true); ctx.restore(); draw(false); };
    return (ctx, t) => {
      camera.updateMatrixWorld();
      const shut = K.seg(t, T.gather, T.screw + 0.4, K.ease.inOut);
      ctx.textBaseline = 'middle'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const p of list) {
        const u = t - labelAt(p.index); if (u <= 0) continue;
        const side = p.side, [ax, ay] = screen(p), bx = K.lerp(p.open[0], p.shut[0], shut), by = K.lerp(p.open[1], p.shut[1], shut);
        // leader: from the part straight to the balloon, stopping at its edge
        const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy), k = K.seg(u, 0.04, 0.3, K.ease.out), l = Math.max(0, d - R) * k;
        halo(ctx, (h) => { ctx.lineWidth = h ? 9 : 3; if (!h) ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + dx / d * l, ay + dy / d * l); ctx.stroke(); });
        const dot = K.ease.outBack(K.seg(u, 0, 0.16));
        ctx.fillStyle = '#f2eee5'; ctx.beginPath(); ctx.arc(ax, ay, 10 * dot, 0, 7); ctx.fill(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(ax, ay, 6.5 * dot, 0, 7); ctx.fill();
        // balloon with the part number
        const b = K.ease.outBack(K.seg(u, 0.22, 0.42));
        if (b > 0) {
          ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(bx, by, R * b, 0, 7); ctx.fill();
          ctx.fillStyle = '#ffffff'; ctx.font = `600 ${Math.round(40 * b)}px "IBM Plex Mono"`; ctx.letterSpacing = '0px'; ctx.textAlign = 'center'; ctx.fillText(String(p.index + 1), bx, by + 2);
        }
        // name: wipes in from the balloon
        const w = K.seg(u, 0.3, 0.6, K.ease.out);
        if (w > 0) {
          ctx.font = NAME_FONT; ctx.letterSpacing = '2px'; ctx.textAlign = side > 0 ? 'left' : 'right';
          const tw = ctx.measureText(p.name).width, tx = bx + side * (R + 18);
          ctx.save(); ctx.beginPath(); if (side > 0) ctx.rect(tx - 8, by - 55, (tw + 20) * w, 110); else ctx.rect(tx + 8 - (tw + 20) * w, by - 55, (tw + 20) * w, 110); ctx.clip();
          halo(ctx, (h) => { if (h) { ctx.lineWidth = 12; ctx.strokeText(p.name, tx, by + 3); } else { ctx.fillStyle = '#131a3d'; ctx.fillText(p.name, tx, by + 3); } });
          ctx.restore(); ctx.letterSpacing = '0px';
        }
      }
    };
  }

  registerStyle({
    id: 'exploded-view',
    name: 'Exploded View',
    family: 'Diagrams with depth',
    look: 'A product teardown film: one object hangs over a pale seamless floor, comes apart along its axis into its parts, and every part gets a numbered callout in ink blue.',
    motion: 'The object unscrews and pulls apart along its axis into sub-assemblies, they park as two tiers, then each spreads into its parts one after another; every part overshoots its place, settles and keeps a slight tilt of its own. Callouts draw on as the focus reaches each part, then everything returns in reverse and seats with a click.',
    light: 'One very large soft top light, so every part drops a soft shadow on the floor, with sky light for the contact shading. Black cards in the reflections give chrome its dark streaks and clear plastic its edges.',
    materials: 'Real finishes, one per part: clear plastic, chrome, turned brass, a steel spring wound as a true helix, dimpled black rubber, milky tube with blue ink, one orange moulded piece.',
    camera: 'A long lens on a slow crane, looking down the axis so the row recedes: close on the object, back and up as it opens, creeping in while a shallow focus travels from part to part, then close again as it shuts. One continuous move.',
    post: 'Depth of field and motion blur from the lens itself, neutral colour, almost no bloom, a light vignette. Labels and leader lines are drawn on top so they stay sharp.',
    explains: 'How something is built or what is inside it: any object made of parts. Each part is one named item, the order of the row is the order of assembly, and putting it back together shows where everything goes.',
    topic: "What's inside a ballpoint pen",
    duration: 8,
    fonts: ['600 70px "IBM Plex Mono"', '500 40px "IBM Plex Mono"', '700 92px "Space Grotesk"'],
    render: { samples: 48, shutter: 0.5, tone: 'neutral', exposure: 1.0, bloom: 0.12, bloomThreshold: 1.2, vignette: 0.2, grain: 0.012, fov: 30, background: PAPER },

    build(S) {
      const { THREE, K, scene, camera } = S;
      studio(S);
      const pen = ballpointPen(finishes());
      const root = new THREE.Group(); root.position.set(-pen.length / 2, 2.1, 0); scene.add(root);
      const rig = explodeRig(root, pen), labels = callouts(S, rig.list);

      // where each part ends up while apart: the focus travels through these points, in label order
      rig.pose((T.labels + T.gather) / 2); root.updateMatrixWorld(true);
      const spots = rig.list.map((p) => p.pivot.getWorldPosition(new THREE.Vector3()).toArray());
      const cam = {
        pos: K.path([[0, [-8.3, 4.3, 6.9]], [1.5, [-12.6, 5.9, 9.8]], [2.3, [-14.8, 6.6, 11.2]], [4.9, [-13.4, 6.1, 12.4]], [7.0, [-8.8, 4.9, 8.6]], [9.6, [-8.0, 4.5, 8.2]]]),
        aim: K.path([[0, [-1.6, 1.9, 0]], [1.5, [-0.9, 2.2, 0]], [2.3, [-0.5, 2.25, 0]], [4.9, [-0.3, 2.25, 0]], [7.0, [-0.5, 2.2, 0]], [9.6, [-0.4, 2.15, 0]]]),
        focus: K.path([[0, [-4.2, 2.2, 0.4]], [T.pull + 0.4, [-3, 2.1, 0]], ...spots.map((s, i) => [labelAt(i) + 0.2, s]), [labelAt(PARTS.length) + 0.4, [-1, 2.2, 0]], [T.gather + 0.3, [-1, 2.2, 0]], [T.payoff, [-2.5, 2.1, 0.4]], [8.2, [-2.5, 2.1, 0.4]]]),
        lens: K.track([[0, 0.085], [T.stack, 0.11], [labelAt(PARTS.length - 1), 0.11], [labelAt(PARTS.length) + 0.4, 0.04], [T.payoff, 0.045]]),
      };
      const heading = (ctx, t) => {
        const a = 1 - K.seg(t, T.stack - 0.1, T.stack + 0.3), b = K.seg(t, T.payoff, T.payoff + 0.3, K.ease.out);
        ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
        if (a > 0) {
          ctx.globalAlpha = a; ctx.fillStyle = INK; ctx.font = '500 40px "IBM Plex Mono"'; ctx.letterSpacing = '6px'; ctx.fillText(TITLE[0], 96, 116);
          ctx.fillStyle = '#131a3d'; ctx.font = '700 92px "Space Grotesk"'; ctx.letterSpacing = '0px'; ctx.fillText(TITLE[1], 92, 212);
        }
        if (b > 0) {
          ctx.globalAlpha = b; ctx.textAlign = 'right'; ctx.fillStyle = '#131a3d'; ctx.font = '700 92px "Space Grotesk"';
          ctx.fillText(PAYOFF[0], 1920 - 96, 912); ctx.fillStyle = INK; ctx.fillText(PAYOFF[1], 1920 - 96, 1002);
        }
        ctx.globalAlpha = 1;
      };

      return {
        update(t) {
          rig.pose(t);
          K.look(camera, cam.pos(t), cam.aim(t)); K.focus(camera, cam.focus(t), cam.lens(t));
        },
        overlay(ctx, t, W, H) { labels(ctx, t); heading(ctx, t); },
      };
    },

    sound(k) {
      const n = PARTS.length, pan = (i) => -0.5 + i / (n - 1);
      const thread = (t0, d, up) => k.withMinor(() => { for (let i = 0; i < 9; i++) k.play('tick', t0 + d * i / 9, { gain: 0.3, f: 2600 + (up ? i : 8 - i) * 160, pan: -0.3 }); });
      const press = (t, g) => { k.play('click', t, { gain: g, f: 1500 }); k.play('tock', t + 0.012, { gain: g * 0.7, f: 1150 }); k.play('click', t + 0.13, { gain: g * 0.6, f: 2100 }); };
      k.bed('room', 0, 8, { gain: 0.8 });
      press(T.click, 0.9);
      thread(T.unscrew, T.pull - T.unscrew, true);
      k.play('swish', T.pull + 0.05, { gain: 0.55, dur: 0.4 });                         // the core slides out of the barrel
      k.play('whoosh', T.stack, { gain: 0.3, dur: 0.6, top: 1700 });                    // the two halves park as tiers
      PARTS.forEach((p, i) => {
        k.withMinor(() => k.play('swish', leaveAt(i), { gain: 0.22, dur: 0.22, pan: pan(i) }));
        k.play('tick', labelAt(i), { gain: 0.3, f: 5200, pan: pan(i) * 0.6 });
        k.play('pop', labelAt(i) + 0.22, { gain: 0.45, f: 560 + i * 45, pan: pan(i) * 0.6 });
        k.play('tock', homeAt(i), { gain: 0.5, f: [700, 1900, 1500, 520, 430, 1700, 900][i % 7], pan: pan(i) * 0.6 });   // each part seats: rubber, steel, brass, plastic...
      });
      // the spring rings as it comes free (the same 5.4 Hz as its wobble in the picture)
      for (const f of [1244, 1249.4]) k.tone(leaveAt(1) + 0.12, { f, type: 'sine', dur: 0.75, gain: 0.035, pan: pan(1), verb: 0.2 });
      k.play('whoosh', T.unstack, { gain: 0.28, dur: 0.55, top: 1500 });
      k.play('swish', T.push, { gain: 0.5, dur: 0.38 });
      k.play('thud', T.push + 0.42, { gain: 0.35, f: 150 }); k.play('tock', T.push + 0.42, { gain: 0.6, f: 480 });
      thread(T.screw, 0.34, false);
      k.play('tock', T.screw + 0.36, { gain: 0.55, f: 620 });
      press(T.click2, 1.1);
      k.play('ding', T.payoff, { gain: 0.45, f: 'E6' });
    },
  });
}
```
