# Tiny Diorama (#04)

- **id:** `tiny-diorama`
- **Category:** Spaces and journeys
- **Use:** explainer
- **Reference duration:** 8 s
- **Google Fonts:** Fredoka
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`

## Style card

- **Look:** A whole little world on one floating tile, like a designer's model on a desk: chunky rounded buildings, a toy van, peg people and lollipop trees in a few matte paint colours, on a thick slab of ground whose cut sides show soil, clay and rock.
- **Motion:** Small life at small scale: one vehicle drives the route with weight (it squats, leans and nods when it brakes), doors roll and swing, smoke puffs, peg people hop, lights come on, and each stop's sign flips to the accent colour when its part is done. The tile turns slowly the whole time.
- **Light:** One soft warm sun from the front left that sinks and warms through the clip, a cool sky that darkens every crease and contact, and a few tiny lamps that take over at the end.
- **Materials:** Matte painted-model surfaces, flocked grass with a soft sheen, a hand-painted cross-section of earth with real stones pressed into it, card signs. One accent colour is kept for the thing the story follows.
- **Camera:** Long lens, three-quarter view from above, close enough that the tile fills the frame. The tile turns on its turntable to show each stop in order while the camera makes one slow rise and push-in; neither ever stops.
- **Finish:** Strong tilt-shift: a wide-open lens keeps a thin band sharp around the action and melts the near and far edges of the tile, which is what makes it read as a miniature. The band travels with the story and the lens stops down a little for the final picture. True colours, slightly rich, light vignette, almost no grain.
- **Good for:** Places, systems and journeys: anything with a few stops and something that travels between them (a supply chain, a commute, how a request moves through a company). Each stop is a little building with a sign; the traveller links them in order.

## Reference

- **Sample topic:** How your parcel gets to you
- **Gallery description:** A whole little world on one floating tile, like a designer's model on a desk: chunky rounded buildings, a toy van, peg people and lollipop trees in a few matte paint colours, on a thick slab of ground whose cut sides show soil, clay and rock.
- **Shown in the sample clip:** How your parcel gets to you

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/tiny-diorama.js`)

```js
{
  // ---------------------------------------------------------------- content (change this block for a new topic)
  // Three stops on one tile. Each stop has a sign that starts grey and flips to the accent colour when its part of
  // the story is done. Positions are tile coordinates: x runs left to right, z runs back (-) to front (+), y is up
  // and 0 is the grass.
  const SIGNS = [
    { word: 'PACKED', at: [-3.2, -2.9], h: 2.85 },       // stands on the depot roof
    { word: 'ON THE WAY', at: [0.05, -2.5], h: 1.62 },   // beside the first stretch of road
    { word: 'DELIVERED', at: [3.65, -0.9], h: 3.0 },     // behind the house
  ];
  const TILE = { w: 12.6, d: 8.2, r: 1.0 }, FLOOR = -3.5;   // FLOOR: how far below the grass the backdrop paper lies
  // centre line of the road: it leaves the depot at the back left, snakes forward and runs off the front right edge
  const ROAD = [[-2.4, -1.7], [-1.2, -1.7], [0.0, -1.7], [1.0, -1.55], [1.75, -0.85], [1.8, 0.1], [1.15, 0.9], [0.75, 1.75], [1.25, 2.5], [2.3, 2.7], [3.6, 2.7], [5.0, 2.7], [6.38, 2.7]];
  const VAN_START_X = -0.55, VAN_STOP_X = 2.4;      // where on the first and last straight the van waits
  const DEPOT = { x: -3.9, z: -1.8, w: 3.0, d: 3.2, h: 1.5 }, DOOR_Z = -1.7;
  const HOME = { x: 4.6, z: 0.5, w: 2.0, d: 1.9, h: 1.35 };
  const MAT = [4.6, 1.86];                           // the doormat, where the parcel ends up

  // a restrained box of paints: neutrals, two greens, earth, and ONE accent that only the parcel's journey may use
  const PAL = {
    backdrop: '#b4d2de', evening: '#93b0cf', grass: '#9fc47c', leaf: ['#5fa574', '#3f866c', '#84ba6b'], trunk: '#8b5b3e',
    earth: ['#5c4135', '#8f6248', '#c9955f', '#7c7f8e'], stone: ['#a9a9b0', '#d9cdb8', '#8d8f9c'],
    cream: '#f6ebd8', slate: '#44718a', mustard: '#f0b040', accent: '#e9573f', glass: '#2c4658', dark: '#272b36',
    road: '#6e7080', kraft: '#cb9c68', skin: '#f2c8a2', smoke: '#ffffff', water: '#8fd0e0', lampGlow: '#ffc56e',
  };
  const FONT = '600 160px "Fredoka"';

  // ---------------------------------------------------------------- one schedule for picture and sound
  const T = {
    push: 0.25, inVan: 0.95,         // the parcel rolls off the conveyor into the van
    shut: 1.15,                      // the hatch slams
    go: 1.45, arrive: 4.55,          // the drive
    rollDown: [1.7, 2.4],            // the depot door closes behind it
    out: 4.72,                       // the courier jumps out with the parcel on his head
    hops: [4.96, 5.24], hopLen: 0.22,
    drop: 5.66,                      // the parcel lands on the doormat
    back: 5.78,                      // the courier steps back
    lamp: 5.1, open: 5.95, lights: 6.03, greet: 6.12,
    cheer: [6.5, 6.8],
  };
  const FLIPS = [T.shut + 0.1, 2.15, T.greet + 0.1];   // when sign 1, 2, 3 flip to "done"

  // ---------------------------------------------------------------- the diorama kit (nothing below knows about parcels until `build`)
  const D2R = Math.PI / 180;
  const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);

  // SHAPES ----------------------------------------------------------
  // A rounded rectangle lying on the ground, as a loop of points with outward normals and the distance walked so far.
  function ring(w, d, r, n = 10) {
    const pts = [], hx = w / 2 - r, hz = d / 2 - r; let u = 0, px = 0, pz = 0;
    for (let k = 0; k < 4; k++) for (let i = 0; i <= n; i++) {
      const a = (k + i / n) * Math.PI / 2, x = (k === 0 || k === 3 ? hx : -hx) + r * Math.cos(a), z = (k < 2 ? hz : -hz) + r * Math.sin(a);
      if (pts.length) u += Math.hypot(x - px, z - pz);
      px = x; pz = z; pts.push({ x, z, nx: Math.cos(a), nz: Math.sin(a), u });
    }
    pts.push({ ...pts[0], u: u + Math.hypot(pts[0].x - px, pts[0].z - pz) });
    pts.around = pts[pts.length - 1].u;
    return pts;
  }
  // Sweep a side profile around that loop: this is how the tile, its grass cap, plinths and ponds are made.
  // profile = [[inset, y, slope?], ...] from the top edge down; slope is the normal's angle from straight up
  // (0 = up, PI/2 = out, PI = down) and is worked out from the neighbours when left out. Group 0 = sides, 1 = top.
  function loft(loop, profile, cap = true) {
    const P = profile.map(([inset, y, a], j) => { const p0 = profile[Math.max(0, j - 1)], p1 = profile[Math.min(profile.length - 1, j + 1)]; return [inset, y, a == null ? Math.atan2(p0[1] - p1[1], p0[0] - p1[0]) : a]; });
    const M = loop.length, pos = [], nor = [], uv = [], idx = [], y0 = P[0][1], y1 = P[P.length - 1][1];
    for (const [inset, y, a] of P) for (const p of loop) { pos.push(p.x - p.nx * inset, y, p.z - p.nz * inset); nor.push(p.nx * Math.sin(a), Math.cos(a), p.nz * Math.sin(a)); uv.push(p.u / loop.around, (y - y1) / (y0 - y1 || 1)); }
    for (let j = 0; j < P.length - 1; j++) for (let i = 0; i < M - 1; i++) { const a = j * M + i, b = a + 1, c = a + M, d = c + 1; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(), sideCount = idx.length;
    if (cap) {
      const base = pos.length / 3; pos.push(0, y0, 0); nor.push(0, 1, 0); uv.push(0, 0);
      for (const p of loop) { const x = p.x - p.nx * P[0][0], z = p.z - p.nz * P[0][0]; pos.push(x, y0, z); nor.push(0, 1, 0); uv.push(x, z); }
      for (let i = 0; i < M - 1; i++) idx.push(base, base + 2 + i, base + 1 + i);
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.addGroup(0, sideCount, 0); if (cap) g.addGroup(sideCount, idx.length - sideCount, 1);
    return g;
  }
  const lip = (r, y, n = 5) => Array.from({ length: n + 1 }, (_, i) => { const a = i / n * Math.PI / 2; return [r * (1 - Math.sin(a)), y - r * (1 - Math.cos(a)), a]; });   // a quarter-round top edge
  // A flat outline with rounded corners, pushed out into a solid with soft edges: roofs, the van body, anything with a silhouette.
  function prism(pts, r, depth, bevel = 0.04) {
    const s = new THREE.Shape(), n = pts.length;
    pts.forEach((p, i) => {
      const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n], da = Math.hypot(a[0] - p[0], a[1] - p[1]), db = Math.hypot(b[0] - p[0], b[1] - p[1]), k = Math.min(Array.isArray(r) ? r[i] : r, da / 2, db / 2);
      const p0 = [p[0] + (a[0] - p[0]) * k / da, p[1] + (a[1] - p[1]) * k / da], p1 = [p[0] + (b[0] - p[0]) * k / db, p[1] + (b[1] - p[1]) * k / db];
      if (i === 0) s.moveTo(p0[0], p0[1]); else s.lineTo(p0[0], p0[1]);
      s.quadraticCurveTo(p[0], p[1], p1[0], p1[1]);
    });
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: depth - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: 3, curveSegments: 6 });
    g.translate(0, 0, -(depth - 2 * bevel) / 2);
    return g;
  }

  // PAINT -----------------------------------------------------------
  // Everything is matte model paint. One material per colour, shared.
  const paints = new Map();
  const paint = (hex, rough = 0.86) => { const key = hex + rough; if (!paints.has(key)) paints.set(key, new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: 0 })); return paints.get(key); };
  // something that can light up: dark glass by day, a warm lamp when `.emissiveIntensity` is raised
  const lampPaint = (hex = PAL.glass, glow = PAL.lampGlow) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.45, emissive: glow, emissiveIntensity: 0 });
  function put(parent, geo, mat, p = [0, 0, 0], r, cast = true) {
    const m = new THREE.Mesh(geo, typeof mat === 'string' ? paint(mat) : mat); m.position.set(p[0], p[1], p[2]); if (r) m.rotation.set(r[0], r[1], r[2]);
    m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m;
  }
  const box = (parent, w, h, d, color, p, r = 0.06, rot) => put(parent, K.roundedBox(w, h, d, r, 4), color, p, rot);
  const decal = (parent, w, h, r, mat, p, rot) => put(parent, K.roundedRect(w, h, r), mat, p, rot, false);   // a flat painted panel just off a surface

  // THE TILE --------------------------------------------------------
  // A thick slab cut out of the ground: a grass cap with a soft lip, then the cut side showing topsoil, clay and
  // rock, tapering away underneath so it reads as floating. Returns the group everything else is planted on.
  function tile(parent, { w, d, r }) {
    const g = new THREE.Group(); parent.add(g);
    const rr = K.rng(7);
    const grass = K.canvasTex(1024, 1024, (ctx, W) => {            // flock: soft blotches of two greens and a fine speckle
      ctx.fillStyle = PAL.grass; ctx.fillRect(0, 0, W, W);
      for (let i = 0; i < 90; i++) { const x = rr.range(0, W), y = rr.range(0, W), s = rr.range(60, 190), c = rr.chance(0.5) ? '255,246,190' : '60,120,70'; for (const ox of [-W, 0, W]) for (const oy of [-W, 0, W]) { const gr = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, s); gr.addColorStop(0, `rgba(${c},0.11)`); gr.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = gr; ctx.fillRect(x + ox - s, y + oy - s, 2 * s, 2 * s); } }
      for (let i = 0; i < 26000; i++) { ctx.fillStyle = rr.chance(0.5) ? 'rgba(255,255,210,0.10)' : 'rgba(40,90,50,0.10)'; ctx.fillRect(rr.range(0, W), rr.range(0, W), 2, 2); }
    }, { repeat: [1 / 5, 1 / 5] });
    const grassMat = new THREE.MeshPhysicalMaterial({ map: grass, roughness: 0.95, sheen: 0.6, sheenRoughness: 0.7, sheenColor: new THREE.Color('#e8f5b0') });
    const cap = put(g, loft(ring(w + 0.18, d + 0.18, r + 0.09, 12), [...lip(0.11, 0), [0, -0.19, Math.PI / 2], [0.1, -0.27, Math.PI]]), [grassMat, grassMat]);
    cap.material[0] = new THREE.MeshPhysicalMaterial({ color: PAL.grass, roughness: 0.95, sheen: 0.6, sheenRoughness: 0.7, sheenColor: new THREE.Color('#e8f5b0') });   // the lip has no flat UVs, so it gets the plain colour

    // the cut: a painted cross-section that wraps twice around the tile
    const H = 1.8, strata = K.canvasTex(2048, 512, (ctx, W, Hh) => {
      const wave = (base, amp, k, ph) => (x) => base + amp * Math.sin(x / W * Math.PI * 2 * k + ph) + amp * 0.5 * Math.sin(x / W * Math.PI * 2 * (k * 2 + 1) + ph * 2.3);
      const band = (top, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, Hh); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, top(x)); ctx.lineTo(W, Hh); ctx.fill(); };
      ctx.fillStyle = PAL.earth[0]; ctx.fillRect(0, 0, W, Hh);
      band(wave(44, 7, 5, 0.4), PAL.earth[1]); band(wave(170, 14, 3, 1.9), PAL.earth[2]); band(wave(292, 16, 2, 4.0), PAL.earth[3]);
      const blob = (x, y, a, b, rot, color) => { for (const ox of [-W, 0, W]) { ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x + ox, y, a, b, rot, 0, 7); ctx.fill(); } };
      for (let i = 0; i < 6; i++) { ctx.strokeStyle = 'rgba(255,240,205,0.28)'; ctx.lineWidth = 5; ctx.beginPath(); const f = wave(194 + i * 15, 12, 3, 1.9 + i * 0.25); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, f(x)); ctx.stroke(); }   // seams in the clay
      for (let i = 0; i < 46; i++) blob(rr.range(0, W), rr.range(66, 160), rr.range(7, 20), rr.range(5, 12), rr.range(-0.5, 0.5), rr.pick(['#d7c4a6', '#a88a70', '#6f4c3b']));   // pebbles in the soil
      for (let i = 0; i < 30; i++) blob(rr.range(0, W), rr.range(322, 500), rr.range(24, 70), rr.range(10, 24), rr.range(-0.3, 0.3), rr.pick(['#8b8e9d', '#6e7181', '#73768a']));   // rock faces
      for (let i = 0; i < 40; i++) { const x = rr.range(0, W); ctx.strokeStyle = 'rgba(60,40,30,0.5)'; ctx.lineWidth = rr.range(2, 4); ctx.beginPath(); ctx.moveTo(x, 0); ctx.quadraticCurveTo(x + rr.range(-18, 18), 30, x + rr.range(-26, 26), rr.range(40, 90)); ctx.stroke(); }   // roots
    }, { repeat: [2, 1] });
    put(g, loft(ring(w, d, r, 12), [[0, -0.19, Math.PI / 2], [0, -1.32, Math.PI / 2], [0.07, -1.52], [0.3, -1.76], [0.62, -1.9], [0.95, -H - 0.19]], false), new THREE.MeshStandardMaterial({ map: strata, roughness: 0.9 }));
    put(g, loft(ring(w - 1.9, d - 1.9, 0.3), [[0, -H - 0.17, 0]]), PAL.earth[3]);   // closes the underside
    // stones pressed half-way into the cut, so the side is not only paint
    const loop = ring(w, d, r, 12), stones = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), paint('#ffffff', 0.9), 30); stones.castShadow = stones.receiveShadow = true; g.add(stones);
    for (let i = 0; i < stones.count; i++) {
      const at = rr.range(0, loop.around), j = loop.findIndex((q) => q.u >= at), a = loop[Math.max(0, j - 1)], b = loop[j], f = (at - a.u) / (b.u - a.u || 1), p = { x: K.lerp(a.x, b.x, f), z: K.lerp(a.z, b.z, f), nx: b.nx, nz: b.nz }, y = rr.range(-0.45, -1.25), s = rr.range(0.05, 0.11);
      K.place(stones, i, [p.x - p.nx * s * 0.25, y, p.z - p.nz * s * 0.25], [rr.range(0, 3), rr.range(0, 3), 0], [s * rr.range(1, 1.7), s * rr.range(0.6, 1), s]);
      stones.setColorAt(i, new THREE.Color(y > -1.0 ? rr.pick(PAL.stone) : PAL.stone[2]));
    }
    g.userData.grass = cap.material[0];
    return g;
  }
  // A raised ribbon along a path (road, river, track). Returns the curve so things can travel on it.
  function ribbon(parent, pts, { width = 1.1, height = 0.05, texture, period = 1 }) {
    const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal'); curve.arcLengthDivisions = 600;
    const len = curve.getLength(), n = Math.ceil(len * 14), pos = [], uv = [], idx = [], cross = [[-width / 2, 0, 0], [-width / 2 + 0.05, height, 0.06], [width / 2 - 0.05, height, 0.94], [width / 2, 0, 1]];
    for (let i = 0; i <= n; i++) {
      const p = curve.getPointAt(i / n), tg = curve.getTangentAt(i / n);
      for (const [o, y, v] of cross) { pos.push(p.x - tg.z * o, y, p.z + tg.x * o); uv.push(i / n * len / period, v); }
      if (i < n) for (let k = 0; k < 3; k++) { const a = i * 4 + k; idx.push(a, a + 1, a + 4, a + 1, a + 5, a + 4); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    put(parent, g, new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9 }), [0, 0, 0], null, false);
    return Object.assign(curve, { len });
  }

  // BUILDING BLOCKS -------------------------------------------------
  const gable = (w, h, len, r = 0.1) => prism([[-w / 2, 0], [w / 2, 0], [0, h]], [r, r, r * 1.6], len, 0.05);   // ridge along z
  // a window: a frame with a pane that can light up. Returns the pane's material.
  function windowPane(parent, w, h, p, rotY = 0, frame = PAL.cream) {
    const g = new THREE.Group(); g.position.set(p[0], p[1], p[2]); g.rotation.y = rotY; parent.add(g);
    box(g, w + 0.12, h + 0.12, 0.07, frame, [0, 0, 0], 0.03);
    const m = lampPaint(); decal(g, w, h, 0.04, m, [0, 0, 0.04]); box(g, 0.035, h, 0.02, frame, [0, 0, 0.045], 0.008);
    return m;
  }
  // tiny people are turned wooden pegs: a body, a ball for a head and one prop that says who they are
  function peg(parent, color, hat) {
    const g = new THREE.Group(); parent.add(g);
    const body = new THREE.LatheGeometry([[0, 0], [0.15, 0], [0.185, 0.04], [0.17, 0.3], [0.12, 0.43], [0, 0.46]].map(([x, y]) => new THREE.Vector2(x, y)), 20);
    put(g, body, color); put(g, new THREE.SphereGeometry(0.15, 20, 14), PAL.skin, [0, 0.58, 0]);
    if (hat === 'cap') { put(g, new THREE.SphereGeometry(0.158, 20, 10, 0, 7, 0, 1.25), color, [0, 0.6, 0]); box(g, 0.2, 0.03, 0.14, color, [0, 0.64, 0.15], 0.012); }
    if (hat === 'helmet') put(g, new THREE.SphereGeometry(0.17, 20, 10, 0, 7, 0, 1.5), PAL.mustard, [0, 0.6, 0]);
    if (hat === 'hair') put(g, new THREE.SphereGeometry(0.162, 20, 10, 0, 7, 0, 1.75), PAL.trunk, [0, 0.59, -0.012], [-0.35, 0, 0]);
    return g;
  }
  function tree(parent, x, z, s, kind, y = 0) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); parent.add(g);
    put(g, new THREE.CylinderGeometry(0.06, 0.09, 0.6, 10), PAL.trunk, [0, 0.3, 0]);
    if (kind === 'fir') {      // a gumdrop
      // profile runs bottom to top: the other way round the faces point inwards and the trunk shows through
      put(g, new THREE.LatheGeometry([[0, 0.38], [0.4, 0.4], [0.5, 0.52], [0.47, 0.72], [0.3, 1.2], [0.1, 1.68], [0, 1.75]].map(([a, b]) => new THREE.Vector2(a, b)), 22), PAL.leaf[1]);
    } else {                   // a lollipop with a smaller ball on its shoulder
      put(g, new THREE.SphereGeometry(0.52, 24, 16), PAL.leaf[kind === 'pale' ? 2 : 0], [0, 0.98, 0]).scale.set(1, 0.92, 1);
      put(g, new THREE.SphereGeometry(0.3, 20, 14), PAL.leaf[kind === 'pale' ? 2 : 0], [0.3, 0.74, 0.22]);
    }
    return g;
  }
  // The label of a stop: a card on a pin that always turns to face the lens. One side is grey ("not yet"), the other
  // is the accent colour ("done"); `flip` is the part to rotate about x by PI to change state.
  function sign(parent, word, number) {
    const g = new THREE.Group(), flip = new THREE.Group(); parent.add(g); g.add(flip);
    const PX = 380, SPACING = 0.05, m = document.createElement('canvas').getContext('2d'); m.font = FONT; m.letterSpacing = SPACING * 160 + 'px';
    const capPx = m.measureText('H').actualBoundingBoxAscent, k = 0.3 * PX / capPx, textW = m.measureText(word).width * k / PX;     // letters 0.3 units tall
    const bh = 0.62, coin = 0.4, bw = textW + coin * 2 + 0.34, tx = -bw / 2 + coin * 2 + 0.08;
    const face = (bg, fg) => new THREE.MeshStandardMaterial({ roughness: 0.8, map: K.canvasTex(Math.round(bw * PX), Math.round(bh * PX), (ctx, W, Hh) => {
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, Hh); ctx.fillStyle = fg; ctx.font = FONT.replace('160px', 160 * k + 'px'); ctx.letterSpacing = SPACING * 160 * k + 'px'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(word, (tx + bw / 2) * PX, Hh / 2 + 0.15 * PX);
    }) });
    const disc = (bg, fg) => new THREE.MeshStandardMaterial({ roughness: 0.8, map: K.canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = bg; ctx.fillRect(0, 0, 256, 256); ctx.fillStyle = fg; ctx.font = FONT.replace('160px', '190px'); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      const mm = ctx.measureText(String(number)); ctx.fillText(String(number), 128, 128 + mm.actualBoundingBoxAscent / 2);
    }) });
    box(flip, bw, bh, 0.1, PAL.cream, [0, 0, 0], 0.05);
    put(flip, new THREE.CylinderGeometry(coin + 0.07, coin + 0.07, 0.16, 40), PAL.cream, [-bw / 2 + coin, 0, 0], [Math.PI / 2, 0, 0]);
    for (const [side, bg, fg, cbg, cfg] of [[1, '#ece8df', '#7d8996', '#aab3bd', '#f4f1ea'], [-1, PAL.accent, '#fff6e6', '#fff6e6', PAL.accent]]) {
      const s = new THREE.Group(); s.rotation.x = side > 0 ? 0 : Math.PI; flip.add(s);
      decal(s, bw - 0.09, bh - 0.09, 0.03, face(bg, fg), [0, 0, 0.052]);
      put(s, new THREE.CircleGeometry(coin, 40), disc(cbg, cfg), [-bw / 2 + coin, 0, 0.082], null, false);
    }
    const pole = put(g, new THREE.CylinderGeometry(0.05, 0.06, 1, 12), PAL.cream, [0, 0, -0.1]);
    put(g, new THREE.CylinderGeometry(0.13, 0.15, 0.08, 16), PAL.slate, [0, 0.04, -0.1]);
    return { g, flip, pole, setHeight(h) { flip.position.y = h; pole.scale.y = h; pole.position.y = h / 2; } };
  }
  // The vehicle: a silhouette pushed out sideways, four wheels, glass, lamps and a hatch. x is forward.
  function van(parent, color) {
    const g = new THREE.Group(), body = new THREE.Group(); parent.add(g); g.add(body);
    put(body, prism([[-0.92, 0.2], [0.92, 0.2], [0.94, 0.52], [0.68, 0.61], [0.4, 1.05], [-0.92, 1.05]], [0.08, 0.1, 0.1, 0.05, 0.14, 0.12], 0.86, 0.06), color);
    const glass = paint(PAL.glass, 0.6), n = new THREE.Vector3(0.44, 0.28, 0).normalize();
    const ws = decal(body, 0.66, 0.38, 0.07, glass, [0.54 + n.x * 0.012, 0.835 + n.y * 0.012, 0]); ws.lookAt(ws.position.clone().add(n));
    for (const s of [1, -1]) {
      const rot = [0, s > 0 ? 0 : Math.PI, 0];
      decal(body, 0.3, 0.26, 0.05, glass, [0.2, 0.83, s * 0.432], rot);
      decal(body, 1.5, 0.09, 0.03, PAL.cream, [-0.1, 0.44, s * 0.432], rot);
      decal(body, 0.46, 0.34, 0.05, PAL.cream, [-0.42, 0.78, s * 0.432], rot);
      box(body, 0.2, 0.15, 0.012, PAL.kraft, [-0.42, 0.765, s * 0.436], 0.005); box(body, 0.045, 0.152, 0.014, color, [-0.42, 0.765, s * 0.437], 0.004);   // a parcel painted on the side
    }
    box(body, 0.09, 0.1, 0.82, PAL.slate, [0.93, 0.27, 0], 0.03); box(body, 0.09, 0.1, 0.82, PAL.slate, [-0.92, 0.25, 0], 0.03);
    const lamps = lampPaint('#fff3d6', '#fff0c8'); for (const s of [1, -1]) put(body, new THREE.CylinderGeometry(0.065, 0.065, 0.04, 16), lamps, [0.945, 0.42, s * 0.28], [0, 0, Math.PI / 2]);
    decal(body, 0.72, 0.62, 0.05, PAL.dark, [-0.923, 0.64, 0], [0, -Math.PI / 2, 0]);              // the dark inside, seen when the hatch is up
    const hatch = new THREE.Group(); hatch.position.set(-0.94, 1.0, 0); body.add(hatch);
    box(hatch, 0.05, 0.74, 0.76, color, [0, -0.37, 0], 0.025); box(hatch, 0.02, 0.2, 0.44, PAL.glass, [-0.02, -0.2, 0], 0.01);
    const wheels = [];
    for (const [x, z] of [[0.56, 0.37], [0.56, -0.37], [-0.56, 0.37], [-0.56, -0.37]]) {
      const w = new THREE.Group(); w.position.set(x, 0.2, z); g.add(w); wheels.push(w);
      put(w, new THREE.CylinderGeometry(0.2, 0.2, 0.17, 24), PAL.dark, [0, 0, 0], [Math.PI / 2, 0, 0]);
      put(w, new THREE.CylinderGeometry(0.1, 0.1, 0.19, 16), PAL.cream, [0, 0, 0], [Math.PI / 2, 0, 0]);
      put(w, new THREE.CylinderGeometry(0.028, 0.028, 0.2, 8), PAL.dark, [0.055, 0, 0], [Math.PI / 2, 0, 0]);   // one off-centre dot so the spin shows
    }
    return { g, body, hatch, wheels, lamps };
  }
  // Puffs: matte white balls that swell, drift and shrink away. `list` = [{ at:[x,y,z], t0, life, size, rise, drift }]
  function puffs(parent, count) {
    const m = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 12), paint(PAL.smoke, 0.95), count); m.castShadow = true; m.frustumCulled = false; parent.add(m);
    return { mesh: m, set(i, at, age, o) {      // age 0..1
      const s = age <= 0 || age >= 1 ? 0 : o.size * K.smooth(0, 0.3, age) * (1 - K.smooth(0.55, 1, age)) * (0.7 + 0.5 * age);
      K.place(m, i, [at[0] + (o.drift || 0) * age * age, at[1] + o.rise * age, at[2] + (o.driftZ || 0) * age], null, Math.max(s, 1e-4));
    } };
  }

  // MOTION ----------------------------------------------------------
  // distance travelled for a move that speeds up for `a` of the time, cruises, and brakes for `b` of it (0..1 in, 0..1 out)
  const trap = (u, a, b) => { u = K.clamp(u); const v = 1 / (1 - a / 2 - b / 2); return u < a ? v * u * u / (2 * a) : u < 1 - b ? v * (u - a / 2) : 1 - v * (1 - u) * (1 - u) / (2 * b); };
  // a hop from one spot to another: returns [x, y, z, squash] (squash > 0 just after landing)
  const hop = (t, t0, len, from, to, height) => { const u = K.clamp((t - t0) / len), e = K.ease.inOut(u), land = t - t0 - len; return [from[0] + (to[0] - from[0]) * e, height * Math.sin(Math.PI * u), from[1] + (to[1] - from[1]) * e, land > 0 ? Math.exp(-land * 14) * Math.sin(land * 30) * 0.12 : 0]; };

  registerStyle({
    id: 'tiny-diorama',
    name: 'Tiny Diorama',
    family: 'Spaces and journeys',
    look: 'A whole little world on one floating tile, like a designer\'s model on a desk: chunky rounded buildings, a toy van, peg people and lollipop trees in a few matte paint colours, on a thick slab of ground whose cut sides show soil, clay and rock.',
    motion: 'Small life at small scale: one vehicle drives the route with weight (it squats, leans and nods when it brakes), doors roll and swing, smoke puffs, peg people hop, lights come on, and each stop\'s sign flips to the accent colour when its part is done. The tile turns slowly the whole time.',
    light: 'One soft warm sun from the front left that sinks and warms through the clip, a cool sky that darkens every crease and contact, and a few tiny lamps that take over at the end.',
    materials: 'Matte painted-model surfaces, flocked grass with a soft sheen, a hand-painted cross-section of earth with real stones pressed into it, card signs. One accent colour is kept for the thing the story follows.',
    camera: 'Long lens, three-quarter view from above, close enough that the tile fills the frame. The tile turns on its turntable to show each stop in order while the camera makes one slow rise and push-in; neither ever stops.',
    post: 'Strong tilt-shift: a wide-open lens keeps a thin band sharp around the action and melts the near and far edges of the tile, which is what makes it read as a miniature. The band travels with the story and the lens stops down a little for the final picture. True colours, slightly rich, light vignette, almost no grain.',
    explains: 'Places, systems and journeys: anything with a few stops and something that travels between them (a supply chain, a commute, how a request moves through a company). Each stop is a little building with a sign; the traveller links them in order.',
    topic: 'How your parcel gets to you',
    duration: 8,
    fonts: [FONT],
    render: { samples: 72, shutter: 0.5, tone: 'neutral', exposure: 1.0, bloom: 0.3, bloomThreshold: 1.05, vignette: 0.2, grain: 0.01, saturation: 1.08, contrast: 1.03, fov: 20, near: 1, far: 300, background: PAL.backdrop },

    build(S) {
      const { THREE, K, scene, camera } = S;

      // ---- light and backdrop: a model on a plain sweep of paper, under one soft sun
      K.env(S, { top: '#c4dcf2', horizon: '#f2e8da', bottom: '#9db39a', intensity: 0.4 });
      const sun = K.sun(S, { pos: [-9, 13, 9], color: '#ffe3c0', power: 3.3, size: 12, soft: 1.3, mapSize: 4096, far: 70 });
      const sky = K.skyLight(S, { color: '#bcd3ff', power: 0.95, size: 11, center: [0, 0, 0], mapSize: 2048 });
      const paper = new THREE.MeshBasicMaterial({ color: PAL.backdrop }); put(scene, new THREE.PlaneGeometry(300, 300), paper, [0, FLOOR, 0], [-Math.PI / 2, 0, 0], false);
      // the tile's shadow on the paper is painted, not cast: it stays one clean soft shape however the lights move
      const shade = put(scene, new THREE.PlaneGeometry(TILE.w + 8, TILE.d + 8), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, map: K.canvasTex(512, 512, (ctx, W) => {
        const sx = W / (TILE.w + 8), sz = W / (TILE.d + 8); ctx.filter = 'blur(26px)'; ctx.fillStyle = 'rgba(38,62,92,0.55)';
        ctx.beginPath(); ctx.roundRect(4 * sx, 4 * sz, TILE.w * sx, TILE.d * sz, 50); ctx.fill();
      }) }), [1.6, FLOOR + 0.02, -1.0], [-Math.PI / 2, 0, 0], false);

      // ---- the tile and its road
      const world = new THREE.Group(); scene.add(world);        // everything on the tile turns with it
      const land = tile(world, TILE);
      const roadTex = K.canvasTex(256, 128, (ctx, W, H) => { ctx.fillStyle = PAL.road; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#f3ead8'; ctx.fillRect(40, H / 2 - 5, 120, 10); ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(0, 12, W, 5); ctx.fillRect(0, H - 17, W, 5); }, { repeat: [1, 1] });
      roadTex.wrapS = THREE.RepeatWrapping;
      const road = ribbon(land, ROAD, { width: 1.14, texture: roadTex, period: 0.8 });
      const distAtX = (x, from, to) => { let a = from, b = to; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (road.getPointAt(m / road.len).x < x) a = m; else b = m; } return a; };
      const S0 = distAtX(VAN_START_X, 0, 3), S1 = distAtX(VAN_STOP_X, road.len - 4.5, road.len);

      // ---- stop 1: the depot. A big plain shed with a saw-tooth roof, a roller door and a conveyor.
      const depot = new THREE.Group(); depot.position.set(DEPOT.x, 0, DEPOT.z); land.add(depot);
      put(depot, loft(ring(DEPOT.w + 0.24, DEPOT.d + 0.24, 0.16), [...lip(0.05, 0.12), [0, 0, Math.PI / 2]]), PAL.slate);
      box(depot, DEPOT.w, DEPOT.h, DEPOT.d, PAL.cream, [0, DEPOT.h / 2 + 0.08, 0], 0.09);
      const depotGlass = lampPaint(PAL.glass, '#ffe2a8');
      for (let i = -1; i <= 1; i++) {
        put(depot, prism([[-0.52, 0], [0.52, 0], [0.52, 0.56]], [0.05, 0.07, 0.08], DEPOT.d + 0.12, 0.05), PAL.slate, [i * 1.0, DEPOT.h + 0.06, 0]);
        decal(depot, DEPOT.d - 0.5, 0.26, 0.05, depotGlass, [i * 1.0 + 0.525, DEPOT.h + 0.34, 0], [0, Math.PI / 2, 0]);
      }
      const fx = DEPOT.w / 2, dz = DOOR_Z - DEPOT.z;       // the door is on the side that faces the road (+x)
      box(depot, 0.12, 1.34, 1.72, PAL.mustard, [fx, 0.75, dz], 0.05);
      decal(depot, 1.44, 1.14, 0.04, PAL.dark, [fx + 0.062, 0.69, dz], [0, Math.PI / 2, 0]);
      const slats = K.canvasTex(64, 64, (ctx) => { ctx.fillStyle = '#e9dcc4'; ctx.fillRect(0, 0, 64, 64); ctx.fillStyle = 'rgba(90,70,50,0.35)'; ctx.fillRect(0, 0, 64, 9); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(0, 9, 64, 6); }, { repeat: [1, 7] });
      const rollGeo = new THREE.PlaneGeometry(1.44, 1.14); rollGeo.translate(0, -0.57, 0);
      const roll = put(depot, rollGeo, new THREE.MeshStandardMaterial({ map: slats, roughness: 0.7 }), [fx + 0.068, 1.26, dz], [0, Math.PI / 2, 0], false);
      box(depot, 0.2, 0.2, 1.76, PAL.mustard, [fx + 0.03, 1.36, dz], 0.06);
      const zf = DEPOT.d / 2;                               // the long wall that faces front: two windows and a parcel mark
      const depotWin = [windowPane(depot, 0.5, 0.42, [-0.95, 0.98, zf + 0.01]), windowPane(depot, 0.5, 0.42, [-0.2, 0.98, zf + 0.01])];
      decal(depot, 0.78, 0.78, 0.12, PAL.slate, [0.85, 0.85, zf + 0.004]); box(depot, 0.44, 0.36, 0.03, PAL.kraft, [0.85, 0.83, zf + 0.012], 0.02); box(depot, 0.09, 0.365, 0.034, PAL.cream, [0.85, 0.83, zf + 0.012], 0.01);
      put(depot, new THREE.CylinderGeometry(0.13, 0.15, 0.8, 16), PAL.slate, [-1.25, DEPOT.h + 0.6, 1.05]); put(depot, new THREE.CylinderGeometry(0.17, 0.17, 0.07, 16), PAL.cream, [-1.25, DEPOT.h + 1.0, 1.05]);
      const STACK = [DEPOT.x - 1.25, DEPOT.h + 1.08, DEPOT.z + 1.05];
      // conveyor from the door to where the van backs up
      const CONV = { x0: DEPOT.x + fx + 0.1, x1: -1.56, y: 0.5 }, conv = new THREE.Group(); land.add(conv);
      box(conv, CONV.x1 - CONV.x0, 0.1, 0.62, PAL.slate, [(CONV.x0 + CONV.x1) / 2, CONV.y - 0.07, DOOR_Z], 0.04);
      for (const x of [CONV.x0 + 0.12, CONV.x1 - 0.1]) for (const s of [1, -1]) box(conv, 0.07, CONV.y - 0.1, 0.07, PAL.slate, [x, (CONV.y - 0.1) / 2, DOOR_Z + s * 0.24], 0.02);
      const rollers = []; for (let i = 0; i < 6; i++) rollers.push(put(conv, new THREE.CylinderGeometry(0.045, 0.045, 0.56, 12), PAL.cream, [CONV.x0 + 0.1 + i * (CONV.x1 - CONV.x0 - 0.2) / 5, CONV.y - 0.01, DOOR_Z], [Math.PI / 2, 0, 0]));
      // spare parcels waiting by the wall, and the worker
      const parcelGeo = K.roundedBox(0.42, 0.32, 0.36, 0.035, 3), tapeGeo = K.roundedBox(0.1, 0.326, 0.366, 0.01, 2);
      const parcelAt = (parent, p, ry = 0, s = 1) => { const g = new THREE.Group(); g.position.set(p[0], p[1], p[2]); g.rotation.y = ry; g.scale.setScalar(s); parent.add(g); put(g, parcelGeo, PAL.kraft); put(g, tapeGeo, PAL.cream); return g; };
      parcelAt(land, [-4.55, 0.16, 0.12], 0.3); parcelAt(land, [-5.05, 0.16, 0.2], -0.15, 1.1); parcelAt(land, [-4.8, 0.5, 0.15], 0.1, 0.9); parcelAt(land, [-3.75, 0.16, 0.25], 0.5, 1.15);
      const worker = peg(land, PAL.slate, 'helmet');

      // ---- stop 3: the house
      const home = new THREE.Group(); home.position.set(HOME.x, 0, HOME.z); land.add(home);
      put(home, loft(ring(HOME.w + 0.22, HOME.d + 0.22, 0.16), [...lip(0.05, 0.1), [0, 0, Math.PI / 2]]), PAL.stone[1]);
      box(home, HOME.w, HOME.h, HOME.d, PAL.cream, [0, HOME.h / 2 + 0.06, 0], 0.09);
      put(home, gable(HOME.d + 0.5, 1.0, HOME.w + 0.34), PAL.slate, [0, HOME.h - 0.02, 0], [0, Math.PI / 2, 0]);
      box(home, 0.3, 0.75, 0.3, PAL.cream, [0.82, HOME.h + 0.45, -0.25], 0.05); box(home, 0.38, 0.09, 0.38, PAL.slate, [0.82, HOME.h + 0.85, -0.25], 0.03);
      const CHIM = [HOME.x + 0.82, HOME.h + 0.93, HOME.z - 0.25];
      const hz = HOME.d / 2, homeWin = [windowPane(home, 0.4, 0.42, [-0.62, 0.8, hz + 0.01], 0, PAL.slate), windowPane(home, 0.4, 0.42, [0.62, 0.8, hz + 0.01], 0, PAL.slate)];
      box(home, 0.7, 1.0, 0.08, PAL.slate, [0, 0.55, hz + 0.01], 0.04);
      const doorway = lampPaint(PAL.dark, '#ffca7a'); decal(home, 0.54, 0.88, 0.04, doorway, [0, 0.52, hz + 0.052]);
      const door = new THREE.Group(); door.position.set(-0.27, 0.52, hz + 0.06); home.add(door);
      box(door, 0.54, 0.88, 0.05, PAL.mustard, [0.27, 0, 0], 0.025); put(door, new THREE.SphereGeometry(0.035, 10, 8), PAL.cream, [0.45, -0.02, 0.035]);
      box(land, 1.05, 0.07, 0.55, PAL.stone[1], [MAT[0] - 0.07, 0.035, MAT[1] - 0.05], 0.03); box(land, 0.84, 0.03, 0.36, PAL.slate, [MAT[0] - 0.08, 0.08, MAT[1]], 0.012);   // step and doormat
      const lamp = new THREE.Group(); lamp.position.set(3.55, 0, 1.95); land.add(lamp);
      put(lamp, new THREE.CylinderGeometry(0.04, 0.055, 1.25, 10), PAL.slate, [0, 0.625, 0]); put(lamp, new THREE.CylinderGeometry(0.1, 0.07, 0.07, 12), PAL.slate, [0, 1.27, 0]);
      const bulb = lampPaint('#fff4dd', PAL.lampGlow); put(lamp, new THREE.SphereGeometry(0.13, 16, 12), bulb, [0, 1.42, 0]);
      const lampLight = new THREE.PointLight(PAL.lampGlow, 0, 5, 2); lampLight.position.set(3.55, 1.42, 1.95); land.add(lampLight);
      const doorLight = new THREE.PointLight('#ffb866', 0, 4, 2); doorLight.position.set(MAT[0], 1.3, MAT[1] + 0.5); land.add(doorLight);
      const resident = peg(land, PAL.mustard, 'hair');

      // ---- the land in between: a hill, trees, bushes, a pond
      const hill = put(land, new THREE.SphereGeometry(1, 40, 20), land.userData.grass, [2.2, -0.75, -3.05]); hill.scale.set(2.3, 1.45, 1.25);
      const hillY = (x, z) => -0.75 + 1.45 * Math.sqrt(Math.max(0, 1 - ((x - 2.2) / 2.3) ** 2 - ((z + 3.05) / 1.25) ** 2));
      for (const [x, z, s, kind] of [[1.9, -3.3, 1.0, 'fir'], [2.8, -3.25, 1.25, 'fir'], [3.7, -2.9, 0.9, 'round'], [5.4, -2.5, 1.0, 'fir'], [5.75, -1.2, 0.7, 'pale'],
        [-5.5, 1.0, 1.1, 'round'], [-4.7, 2.3, 0.95, 'fir'], [-5.3, 3.0, 0.8, 'pale'], [-0.4, 3.2, 0.9, 'round'], [3.0, 0.6, 1.0, 'round'], [0.2, 0.0, 0.8, 'fir'], [5.75, 3.35, 0.7, 'pale'], [-0.6, -0.35, 0.6, 'pale']]) tree(land, x, z, s, kind, Math.max(0, hillY(x, z) - 0.05));
      for (const [x, z, s] of [[3.75, 1.75, 0.3], [5.45, 1.75, 0.34], [5.75, 1.2, 0.26], [-2.9, -0.05, 0.26], [2.6, -0.1, 0.28], [-3.6, 3.3, 0.32], [0.6, 3.55, 0.26], [4.2, 3.6, 0.3]]) put(land, new THREE.SphereGeometry(1, 18, 12), PAL.leaf[x > 3 ? 0 : 2], [x, s * 0.55, z]).scale.set(s * 1.25, s, s * 1.1);
      const pond = new THREE.Group(); pond.position.set(-3.05, 0, 1.95); pond.rotation.y = 0.2; land.add(pond);
      put(pond, loft(ring(2.5, 1.5, 0.74), [...lip(0.04, 0.05), [0, 0, Math.PI / 2]]), PAL.stone[1]);
      put(pond, loft(ring(2.24, 1.24, 0.61), [[0, 0.062, 0]]), new THREE.MeshStandardMaterial({ color: PAL.water, roughness: 0.3 }), [0, 0, 0], null, false);
      for (const [x, z, s] of [[-0.5, 0.2, 0.15], [-0.28, 0.32, 0.1], [0.55, -0.2, 0.13]]) put(pond, new THREE.CylinderGeometry(s, s, 0.02, 14), PAL.leaf[2], [x, 0.07, z]);
      for (const [x, z, s] of [[-1.45, 2.85, 0.16], [-4.45, 1.3, 0.2], [1.7, 3.5, 0.14], [-1.0, -2.75, 0.15]]) put(land, new THREE.SphereGeometry(1, 12, 8), PAL.stone[0], [x, s * 0.4, z]).scale.set(s * 1.3, s * 0.8, s);
      const duck = new THREE.Group(); pond.add(duck); put(duck, new THREE.SphereGeometry(0.1, 14, 10), '#ffffff', [0, 0.12, 0]).scale.set(1.3, 0.8, 1); put(duck, new THREE.SphereGeometry(0.065, 12, 8), '#ffffff', [0.1, 0.23, 0]); box(duck, 0.07, 0.03, 0.05, PAL.mustard, [0.17, 0.22, 0], 0.012);
      const bench = new THREE.Group(); bench.position.set(-3.1, 0, 3.2); bench.rotation.y = 0.15; land.add(bench);
      box(bench, 0.85, 0.06, 0.28, PAL.kraft, [0, 0.24, 0], 0.025); box(bench, 0.85, 0.2, 0.06, PAL.kraft, [0, 0.42, 0.13], 0.025); for (const x of [-0.32, 0.32]) box(bench, 0.07, 0.24, 0.26, PAL.slate, [x, 0.12, 0], 0.02);
      box(land, 0.08, 0.5, 0.08, PAL.slate, [5.15, 0.25, 2.0], 0.02); box(land, 0.3, 0.22, 0.2, PAL.mustard, [5.15, 0.58, 2.0], 0.06);                // letterbox, then a fence to the edge
      for (let i = 0; i < 3; i++) box(land, 0.08, 0.32, 0.08, PAL.cream, [5.5 + i * 0.3, 0.16, 2.0], 0.025); box(land, 0.8, 0.06, 0.05, PAL.cream, [5.8, 0.24, 2.0], 0.02);
      const flowers = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), paint('#ffffff', 0.8), 78), fr = K.rng(21); flowers.castShadow = flowers.receiveShadow = true; land.add(flowers);
      [[-4.2, 3.35], [-1.9, 3.5], [-0.25, 2.1], [2.75, 1.55], [2.6, 3.65], [5.0, 3.55], [-1.7, 0.2], [0.9, -2.9], [4.4, -2.3], [5.95, 0.3], [-5.75, -0.1], [-4.0, 0.95], [0.1, 1.1]].forEach(([x, z], c) => {
        for (let i = 0; i < 6; i++) { const a = fr.range(0, 6.3), d = fr.range(0.05, 0.38), s = fr.range(0.035, 0.055); K.place(flowers, c * 6 + i, [x + Math.cos(a) * d, Math.max(0, hillY(x, z)) + s * 0.7, z + Math.sin(a) * d], null, [s, s * 0.7, s]); flowers.setColorAt(c * 6 + i, new THREE.Color(fr.pick(['#fff7ea', '#fff7ea', PAL.mustard, '#f7c9c0']))); }
      });
      const walker = peg(land, PAL.leaf[1], 'hair'); walker.position.set(-1.6, 0, 2.55); walker.rotation.y = 0.9;

      // ---- the traveller and what it carries
      const car = van(land, PAL.accent), courier = peg(land, PAL.accent, 'cap'), parcel = parcelAt(land, [0, 0, 0], 0, 1.2);
      const smoke = puffs(land, 20), EXH = 8;
      const exhaust = Array.from({ length: EXH }, (_, i) => T.go + 0.04 + i * 0.13);

      // ---- the signs
      const signs = SIGNS.map((s, i) => { const o = sign(land, s.word, i + 1); o.g.position.set(s.at[0], Math.max(0, hillY(s.at[0], s.at[1])), s.at[1]); o.setHeight(s.h); return o; });

      // ---- where things are at time t (pure functions of t, shared by the picture, the lens and the camera)
      const vanDist = (t) => S0 + (S1 - S0) * trap((t - T.go) / (T.arrive - T.go), 0.26, 0.3);
      const vanAt = (t) => { const u = vanDist(t) / road.len, p = road.getPointAt(u), tg = road.getTangentAt(u); return { p, tg, yaw: Math.atan2(-tg.z, tg.x) }; };
      const COURIER = [[3.05, 2.4], [3.65, 2.15], [3.88, 2.2], [4.08, 2.24], [3.72, 2.46]];     // out of the cab, two hops to the door, one step back
      const turn = (t) => { const u = t / 8; return (-14 + 24 * u * (1.3 - 0.3 * u)) * D2R; };   // the turntable: slows but never stops
      const toWorld = (p, th) => [p[0] * Math.cos(th) + p[2] * Math.sin(th), p[1], -p[0] * Math.sin(th) + p[2] * Math.cos(th)];
      const cam = {
        orbit: K.path([[0, [-5, 24, 27]], [8, [3, 27.5, 25.4]]]),      // degrees round, degrees up, distance
        aim: K.path([[0, [-0.3, 0.4, 0]], [8, [0.0, -0.05, 0.1]]]),
      };
      const sunCol = new THREE.Color(), cA = new THREE.Color('#ffe6c6'), cB = new THREE.Color('#ffcb9a'), skyA = new THREE.Color('#bcd3ff'), skyB = new THREE.Color('#a9b8f5'), paperA = new THREE.Color(PAL.backdrop), paperB = new THREE.Color(PAL.evening);

      return {
        update(t) {
          const th = turn(t); world.rotation.y = th;
          const dusk = K.seg(t, 2.6, 6.4, K.ease.inOut);

          // light: the sun sinks and warms, the sky cools
          sun.position.set(-9 - 2 * dusk, 13 - 3.5 * dusk, 9); sun.intensity = 3.3 - 0.3 * dusk; paper.color.copy(paperA).lerp(paperB, dusk); sun.color.copy(sunCol.copy(cA).lerp(cB, dusk));
          sky.intensity = 0.95; sky.color.copy(sunCol.copy(skyA).lerp(skyB, dusk));

          // stop 1: parcel down the rollers, hatch shut, door rolls down
          const slide = K.seg(t, T.push, T.inVan, K.ease.inOut), open = 1 - K.seg(t, T.rollDown[0], T.rollDown[1], K.ease.inOut);
          roll.scale.y = Math.max(0.02, 1 - open * 0.96); slats.repeat.y = 7 * roll.scale.y; slats.offset.y = -slats.repeat.y;
          rollers.forEach((r) => { r.rotation.y = -slide * 7; });
          const lean = Math.sin(Math.PI * K.seg(t, T.push - 0.18, T.push + 0.3)) * 0.22;
          worker.position.set(-2.12 + lean * 0.35, 0, DOOR_Z + 0.62); worker.rotation.set(-lean * 1.2, Math.PI, 0);
          const shut = K.seg(t, T.shut - 0.17, T.shut, K.ease.in), settle = t > T.shut ? Math.exp(-(t - T.shut) * 9) * Math.cos((t - T.shut) * 26) : 0;
          car.hatch.rotation.z = -1.78 * (1 - shut) - 0.05 * settle * (t < T.go ? 1 : 0);

          // the drive: position on the road, then weight on top of it (nose up when pulling away, down when braking, a lean in bends)
          const v = vanAt(t), w = 0.14, acc = (vanDist(t + w) - 2 * vanDist(t) + vanDist(t - w)) / (w * w), speed = (vanDist(t + 0.02) - vanDist(t - 0.02)) / 0.04;
          const bend = (vanAt(t + 0.08).yaw - vanAt(t - 0.08).yaw) / 0.16;
          const loadDip = (slide >= 1 ? Math.exp(-(t - T.inVan) * 10) * Math.sin((t - T.inVan) * 24) * 0.02 : 0) + settle * 0.02, stopRock = t > T.arrive ? Math.exp(-(t - T.arrive) * 7) * Math.sin((t - T.arrive) * 19) * 0.03 : 0;
          car.g.position.set(v.p.x, 0.045, v.p.z); car.g.rotation.y = v.yaw;
          car.body.position.y = -loadDip + Math.abs(Math.sin(vanDist(t) * 5.3)) * 0.008 * K.clamp(speed);
          car.body.rotation.set(K.clamp(bend * speed * 0.012, -0.1, 0.1), 0, K.clamp(acc * 0.011, -0.085, 0.085) - stopRock);
          car.wheels.forEach((wh) => { wh.rotation.z = -vanDist(t) / 0.2; });
          car.lamps.emissiveIntensity = 2.6 * K.seg(t, T.go - 0.12, T.go - 0.04);

          // stop 3: the courier hops to the door, the parcel lands on the mat, the door opens, the lights come on
          const cpos = (tt) => {
            if (tt < T.hops[0]) return hop(tt, T.out, 0.22, COURIER[0], COURIER[1], 0.3);
            if (tt >= T.back) return hop(tt, T.back, 0.24, COURIER[3], COURIER[4], 0.14);
            const i = tt >= T.hops[1] ? 1 : 0; return hop(tt, T.hops[i], T.hopLen, COURIER[i + 1], COURIER[i + 2], 0.2);
          };
          const c = cpos(t), cs = K.seg(t, T.out, T.out + 0.16, K.ease.outBack), bow = Math.sin(Math.PI * K.seg(t, T.drop - 0.24, T.drop + 0.14)) * 0.5;
          courier.visible = t >= T.out; courier.position.set(c[0], c[1], c[2]); courier.scale.set(cs * (1 + c[3]), cs * (1 - c[3]), cs * (1 + c[3]));
          courier.rotation.set(0, 0, 0); courier.rotation.y = t < T.back ? 1.3 : K.lerp(1.3, 2.4, K.seg(t, T.back, T.back + 0.24)); courier.rotateX(bow);
          const onHead = [c[0], c[1] + 0.9 * cs, c[2]], onMat = [MAT[0] - 0.27, 0.29, MAT[1]];
          if (t < T.inVan + 0.02) { parcel.visible = true; parcel.position.set(K.lerp(CONV.x0 + 0.3, v.p.x - 0.45, slide), CONV.y + 0.2 - 0.06 * K.seg(slide, 0.75, 1), DOOR_Z); parcel.rotation.set(0, 0, -0.25 * K.seg(slide, 0.7, 0.9) * (1 - K.seg(slide, 0.9, 1))); parcel.scale.setScalar(1.2); }
          else if (t < T.out) parcel.visible = false;      // riding inside the van
          else {
            const d = K.seg(t, T.drop - 0.2, T.drop, K.ease.in), b = t > T.drop ? Math.exp(-(t - T.drop) * 10) * Math.abs(Math.sin((t - T.drop) * 17)) * 0.1 : 0, p = mix(onHead, onMat, d);
            parcel.visible = true; parcel.position.set(p[0], p[1] + Math.sin(Math.PI * d) * 0.12 + b, p[2]); parcel.rotation.set(0, K.lerp(1.3, 0, d), (1 - d) * Math.sin(t * 21) * 0.06); parcel.scale.setScalar(Math.max(0.01, 1.2 * cs));
          }
          const sw = K.spring(t - T.open, 2.2, 0.6); door.rotation.y = 1.85 * sw;
          const blink = (t0) => (t < t0 ? 0 : t < t0 + 0.05 ? 0.7 : t < t0 + 0.1 ? 0.25 : 1);      // a lamp that catches, dips and holds
          homeWin[0].emissiveIntensity = 3.2 * blink(T.lights); homeWin[1].emissiveIntensity = 3.2 * blink(T.lights + 0.12); doorway.emissiveIntensity = 1.5 * K.seg(t, T.open, T.open + 0.25);
          doorLight.intensity = 1.3 * K.seg(t, T.open, T.open + 0.3); bulb.emissiveIntensity = 5 * blink(T.lamp); lampLight.intensity = 4 * blink(T.lamp);
          depotWin.forEach((m) => { m.emissiveIntensity = 0.6 + 1.6 * dusk; }); depotGlass.emissiveIntensity = 0.5 + 1.2 * dusk;
          const out = K.seg(t, T.greet, T.greet + 0.3, K.ease.out), joy = T.cheer.reduce((a, t0) => a + hop(t, t0, 0.24, [0, 0], [0, 0], 0.2)[1], 0);
          resident.position.set(HOME.x + 0.13, 0.06 + joy, K.lerp(HOME.z + 0.3, HOME.z + hz + 0.2, out));
          duck.position.set(0.25 + 0.55 * Math.cos(0.5 + t * 0.22), 0, 0.12 * Math.sin(0.5 + t * 0.22)); duck.rotation.y = -(0.5 + t * 0.22) - Math.PI / 2;
          walker.rotation.y = K.lerp(0.9, 2.2, K.seg(t, 2.6, 3.6, K.ease.inOut));      // someone watches the van go by

          // smoke: two chimneys that never stop, and the van's exhaust left behind on the road
          for (let i = 0; i < 6; i++) { const age = ((t + 10) / 2.2 + i / 6) % 1; smoke.set(i, CHIM, age, { size: 0.26, rise: 1.5, drift: 0.7, driftZ: -0.15 + 0.1 * K.hash(i, Math.floor((t + 10) / 2.2 + i / 6)) }); }
          for (let i = 0; i < 6; i++) { const age = ((t + 10) / 2.6 + i / 6 + 0.4) % 1; smoke.set(6 + i, STACK, age, { size: 0.22, rise: 1.05, drift: 0.15, driftZ: 0.1 }); }
          exhaust.forEach((t0, i) => { const e = vanAt(t0); smoke.set(12 + i, [e.p.x - e.tg.x * 0.98, 0.25, e.p.z - e.tg.z * 0.98], (t - t0) / 0.75, { size: 0.14 - i * 0.008, rise: 0.4, drift: 0 }); });
          smoke.mesh.instanceMatrix.needsUpdate = true;

          // camera and lens: one drift across the tile; the thin sharp band stays on whatever the story is about
          const [az, el, dist] = cam.orbit(t), ca = cam.aim(t), cp = [ca[0] + dist * Math.sin(az * D2R) * Math.cos(el * D2R), ca[1] + dist * Math.sin(el * D2R), ca[2] + dist * Math.cos(az * D2R) * Math.cos(el * D2R)];
          shade.rotation.z = th;
          const subject = mix([v.p.x, 0.5, v.p.z], [MAT[0] - 0.3, 0.6, MAT[1] - 0.3], K.seg(t, T.arrive, T.arrive + 1.2, K.ease.inOut));
          K.look(camera, cp, ca); K.focus(camera, toWorld(subject, th), K.lerp(0.36, 0.24, K.seg(t, 5.6, 7.2, K.ease.inOut)));

          // signs face the lens, and flip when their stop is done
          signs.forEach((s, i) => {
            const wp = toWorld([s.g.position.x, 0, s.g.position.z], th), f = t - FLIPS[i];
            s.g.rotation.y = Math.atan2(cp[0] - wp[0], cp[2] - wp[2]) - th;
            s.flip.rotation.x = -0.3 + Math.PI * (f > 0 ? K.spring(f, 2.0, 0.5) : 0);
            s.flip.position.y = SIGNS[i].h + (f > 0 ? Math.exp(-f * 7) * Math.sin(f * 14) * 0.16 : 0);
          });
        },
      };
    },

    sound(k) {
      // a quiet room, a soft pad, and one small sound for every contact on the tile; the three sign flips ring C, E, G
      k.bed('room', 0, 8, { gain: 0.7 });
      k.music('pad', 0, 8, { bpm: 120, gain: 0.7, chords: [['C4', 'E4', 'G4', 'B4'], ['A3', 'C4', 'E4', 'G4'], ['F3', 'A3', 'C4', 'E4'], ['G3', 'B3', 'D4', 'G4']] });
      k.play('roller', T.push, { gain: 0.45, dur: T.inVan - T.push, pan: -0.35 });
      k.play('tock', T.inVan, { gain: 0.4, f: 420, pan: -0.3 });
      k.play('thud', T.shut, { gain: 0.45, pan: -0.3 }); k.play('click', T.shut, { gain: 0.5, pan: -0.3 });
      FLIPS.forEach((t, i) => { k.play('swish', t, { gain: 0.45, pan: [-0.4, 0, 0.3][i] }); k.play('tock', t + 0.2, { gain: 0.5, f: 760, pan: [-0.4, 0, 0.3][i] }); k.play('ding', t + 0.2, { gain: i === 2 ? 0.75 : 0.5, f: ['C6', 'E6', 'G6'][i], pan: [-0.4, 0, 0.3][i] }); });
      // the van: a small engine that climbs, cruises and comes down, with puffs of exhaust on the way out
      const d = T.arrive - T.go;
      for (const [f, g] of [[1, 0.04], [2.02, 0.018]]) k.tone(T.go - 0.1, { f: [[0, 58 * f], [d * 0.3, 118 * f], [d * 0.7, 108 * f], [d + 0.15, 52 * f]], type: 'sawtooth', dur: d + 0.3, a: 0.12, hold: d - 0.2, gain: g, filter: 'lowpass', f2: 520, q: 2, pan: 0 });
      k.noise(T.go, { dur: d, color: 'brown', filter: 'bandpass', f: 300, q: 0.8, gain: 0.06, a: 0.5, hold: d - 1.2 });
      k.withMinor(() => { for (let i = 0; i < 5; i++) k.play('pop', T.go + 0.04 + i * 0.13, { gain: 0.16, f: 240 - i * 12, pan: -0.25 }); });
      k.play('roller', T.rollDown[0], { gain: 0.22, dur: T.rollDown[1] - T.rollDown[0], pan: -0.5 }); k.play('tock', T.rollDown[1], { gain: 0.3, f: 300, pan: -0.5 });
      k.play('swish', T.arrive - 0.35, { gain: 0.25, dur: 0.3, pan: 0.3 });
      // the doorstep
      k.play('pop', T.out, { gain: 0.5, pan: 0.4 });
      [T.out + 0.22, T.hops[0] + T.hopLen, T.hops[1] + T.hopLen, T.back + 0.24].forEach((t, i) => k.play('tock', t, { gain: 0.3, f: 520 + i * 50, pan: 0.4 }));
      k.play('click', T.lamp, { gain: 0.35, pan: 0.35 });
      k.play('thud', T.drop, { gain: 0.45, f: 170, pan: 0.4 }); k.play('paper', T.drop, { gain: 0.3, dur: 0.12, pan: 0.4 });
      k.play('click', T.open, { gain: 0.6, pan: 0.45 }); k.play('blip', T.lights, { gain: 0.3, f: 'E6', type: 'sine', pan: 0.45 }); k.play('blip', T.lights + 0.12, { gain: 0.3, f: 'G6', type: 'sine', pan: 0.5 });
      T.cheer.forEach((t) => k.play('tock', t + 0.24, { gain: 0.25, f: 640, pan: 0.45 }));
      k.play('success', FLIPS[2] + 0.42, { gain: 0.5, f: 'C6' });
    },
  });
}
```
