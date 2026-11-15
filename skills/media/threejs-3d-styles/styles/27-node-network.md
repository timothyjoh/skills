# Node Network (#27)

- **id:** `node-network`
- **Category:** Diagrams with depth
- **Use:** explainer
- **Reference duration:** 8 s
- **Google Fonts:** Oswald, Fraunces
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`

## Style card

- **Look:** A physical model of a network mounted on a painted wall: glazed porcelain tokens in brass rings, joined by thin brass rods, like a museum's molecular model. Each token is two-sided and turns over to its coloured enamel face when the news reaches it.
- **Motion:** It is constructed link by link: a rod extends from a token carrying an empty ring, a blank token drops into the ring with a click, a bead of light slides along the rod and the token spins over to its coloured side. Each ring of the model goes faster than the last, and a number plaque clicks on when a ring is complete.
- **Light:** One warm, soft gallery spot from above, so every rod and token throws a soft shadow down the wall, longer the further it stands off. The pool of light opens as the model grows and always falls off to the corners.
- **Materials:** Ivory glazed porcelain, one enamel colour (cobalt), polished brass, enamel number plaques, and a terracotta plaster wall with a hand-painted title.
- **Camera:** Long lens. Starts close on the first token with the wall out of focus, then one continuous pull-back that keeps pace with the growing model while drifting from left to right. It ends with the finished model filling the frame edge to edge and keeps drifting slowly through the hold.
- **Finish:** Real depth of field and motion blur, neutral tone mapping to keep the enamel colour true, light vignette, very fine grain.
- **Good for:** Anything that is things and the connections between them: spread, referrals, teams, systems, flows. Nodes sit in oval rings around a centre, sized so the finished model fills a 16:9 frame; links are rods, a pulse travelling along a link is the story, and a number plaque per ring carries the count.

## Reference

- **Sample topic:** How word of mouth grows a small business: 1 happy customer, then 3, 9, 27
- **Gallery description:** A physical model of a network mounted on a painted wall: glazed porcelain tokens in brass rings, joined by thin brass rods, like a museum's molecular model. Each token is two-sided and turns over to its coloured enamel face when the news reaches it.
- **Shown in the sample clip:** How word of mouth grows a small business: 1 happy customer, then 3, 9, 27

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/node-network.js`)

```js
{
  // ---------------------------------------------------------------- content (change this for a new topic)
  // The whole clip is driven by a list of nodes and a list of links. The first node is the centre; everything else is
  // placed around it by how many links away it is. Each node is a two-sided token: `off` is the icon on its plain
  // side, `on` the icon on its enamel side (it turns over when the pulse reaches it). Use `label: 'TEXT'` instead of
  // an icon for a short word. `group` picks the enamel colour.
  const TITLE = 'Word of\nmouth';                 // painted in the top left corner once the whole model is in frame
  const GROUPS = { customer: '#15369c' };          // one accent colour; add more groups only if the story needs them
  const NODES = [{ id: 'n0', off: 'person', on: 'smile', group: 'customer' }];
  const LINKS = [];
  // this topic's graph: one customer tells three friends, three rounds running (1, 3, 9, 27)
  for (let round = 1, tellers = ['n0']; round <= 3; round++) {
    const told = [];
    for (const a of tellers) for (let i = 0; i < 3; i++) { const id = 'n' + NODES.length; NODES.push({ id, off: 'person', on: 'smile', group: 'customer' }); LINKS.push([a, id]); told.push(id); }
    tellers = told;
  }

  // ---------------------------------------------------------------- the layout (reusable for any graph)
  // Rings by distance from the centre. Each ring is an oval and the outer one is as wide as a 16:9 frame, so the
  // finished model fills the picture edge to edge. Each ring sits closer to the wall than the one inside it: the model
  // is a shallow cone pointing at the camera and its shadows fan out. `size` is the token radius on that ring.
  const RING = [
    { rx: 0, ry: 0, z: 2.2, size: 0.85 },
    { rx: 2.9, ry: 1.75, z: 1.65, size: 0.62 },
    { rx: 5.6, ry: 3.3, z: 1.1, size: 0.5 },
    { rx: 8.6, ry: 4.7, z: 0.6, size: 0.42 },
  ];
  // Air between neighbours on the outer ring: 1 between siblings, more between cousins, most between the main
  // branches. That is what keeps families readable, and the widest gap (centred on the right) is the corridor where
  // the count plaques sit.
  const AIR = [1, 1.5, 3.7];
  // Pace per ring (seconds): wait after the teller has turned, stagger between its links, rod extension, pause once
  // the token has clicked in, travel time of the pulse.
  const TEMPO = [
    { wait: 0.35, stagger: 0.2, rod: 0.6, hold: 0.4, pulse: 0.7 },
    { wait: 0.55, stagger: 0.13, rod: 0.46, hold: 0.26, pulse: 0.52 },
    { wait: 0.55, stagger: 0.09, rod: 0.4, hold: 0.22, pulse: 0.46 },
  ];
  const ring = (d) => RING[Math.min(d, RING.length - 1)];
  // The point a fraction u (0..1) of the way round a ring, measured along the oval (not by angle), so neighbours keep
  // the same spacing on the flat top as on the tight ends and the tokens can be as large as the spacing allows.
  function along(r, u) {
    if (!r.arc) { r.arc = [0]; for (let i = 1; i <= 720; i++) { const a = i / 720 * 2 * Math.PI, b = (i - 1) / 720 * 2 * Math.PI; r.arc.push(r.arc[i - 1] + Math.hypot(r.rx * (Math.cos(a) - Math.cos(b)), r.ry * (Math.sin(a) - Math.sin(b)))); } }
    const s = (u - Math.floor(u)) * r.arc[720]; let i = 1; while (i < 720 && r.arc[i] < s) i++;
    const a = (i - 1 + (s - r.arc[i - 1]) / Math.max(1e-9, r.arc[i] - r.arc[i - 1])) / 720 * 2 * Math.PI;
    return [r.rx * Math.cos(a), r.ry * Math.sin(a), r.z];
  }

  function layout() {
    const byId = new Map(NODES.map((n) => [n.id, { ...n, kids: [], parent: null, depth: 0 }]));
    const root = byId.get(NODES[0].id), order = [root], seen = new Set([root.id]), tree = new Set();
    // breadth-first from the centre: the first link that reaches a node makes it that node's child (any other link
    // between two placed nodes is a cross-link: it gets a thinner rod and no pulse)
    for (let q = 0; q < order.length; q++) {
      const n = order[q];
      for (const l of LINKS) {
        const o = l[0] === n.id ? l[1] : l[1] === n.id ? l[0] : null;
        if (o && !seen.has(o)) { seen.add(o); tree.add(l); const c = byId.get(o); c.parent = n; c.depth = n.depth + 1; n.kids.push(c); order.push(c); }
      }
    }
    // places round the ring: walk the leaves in order and leave more air where two neighbours are less closely related
    const leaves = []; (function walk(n) { if (n.kids.length) n.kids.forEach(walk); else leaves.push(n); })(root);
    const apart = (a, b) => { let h = 0; while (a !== b) { if (a.depth >= b.depth) a = a.parent; else b = b.parent; h++; } return Math.ceil(h / 2); };
    const air = leaves.map((l, i) => AIR[Math.min(AIR.length, Math.max(1, apart(l, leaves[(i + 1) % leaves.length]))) - 1]);
    const unit = 1 / air.reduce((s, x) => s + x, 0);
    let u = air[air.length - 1] * unit / 2;
    leaves.forEach((l, i) => { l.u = u; u += air[i] * unit; });
    (function settle(n) { if (!n.kids.length) return; n.kids.forEach(settle); n.u = (n.kids[0].u + n.kids[n.kids.length - 1].u) / 2; })(root);   // a parent sits in the middle of its children
    for (const n of order) { const r = ring(n.depth); n.R = r.size; n.p = along(r, n.u); }
    const cross = LINKS.filter((l) => !tree.has(l) && seen.has(l[0]) && seen.has(l[1])).map((l) => ({ a: byId.get(l[0]), b: byId.get(l[1]) }));
    return { root, order, cross };
  }

  // One schedule for picture and sound. Per node: rod0..rod1 its rod extends from the teller (carrying the empty
  // ring), land = the token clicks into the ring, pulse0..pulse1 the bead slides along the rod, flip = it turns over.
  function schedule() {
    const g = layout();
    g.root.flip = -0.6; g.root.land = -1;
    for (const n of g.order.slice(1)) {
      const T = TEMPO[Math.min(n.depth, TEMPO.length) - 1];
      n.rod0 = n.parent.flip + T.wait + n.parent.kids.indexOf(n) * T.stagger;
      n.rod1 = n.rod0 + T.rod; n.land = n.rod1 + 0.05;
      n.pulse0 = n.land + T.hold; n.pulse1 = n.pulse0 + T.pulse; n.flip = n.pulse1;
    }
    for (const x of g.cross) { x.rod0 = Math.max(x.a.flip, x.b.flip) + 0.3; x.rod1 = x.rod0 + 0.5; }
    // the tally: one plaque per ring with the number of nodes on it, landing just after the last one has turned. They
    // share the corridor from the centre token to just past the outer ring, evenly spaced; the last one is the big one.
    const depth = Math.max(...g.order.map((n) => n.depth));
    g.tally = Array.from({ length: depth + 1 }, (_, d) => {
      const ns = g.order.filter((n) => n.depth === d), text = String(ns.length), h = d === depth ? 1.8 : 1 + 0.125 * d;
      const land = d ? Math.max(...ns.map((n) => n.flip)) + 0.36 : -1;
      return { text, land, rod0: land - 0.45, w: h * (0.5 + 0.5 * text.length), h, z: ring(d).z - 0.12 };
    });
    const from = RING[0].size + 0.12, gap = (ring(depth).rx + 0.72 - from - g.tally.reduce((sum, q) => sum + q.w, 0)) / g.tally.length;
    g.tally.reduce((left, q) => { q.x = left + gap + q.w / 2; return left + gap + q.w; }, from);
    return g;
  }

  // icons are drawn in a box from -1 to 1 with fill and stroke colour already set (stroke width 0.17, round caps)
  const ICONS = {
    person: (c) => { c.beginPath(); c.arc(0, -0.34, 0.31, 0, 7); c.fill(); c.beginPath(); c.arc(0, 0.84, 0.66, Math.PI, 0); c.closePath(); c.fill(); },
    smile: (c) => { for (const x of [-0.31, 0.31]) { c.beginPath(); c.arc(x, -0.24, 0.12, 0, 7); c.fill(); } c.beginPath(); c.arc(0, -0.02, 0.52, 0.17 * Math.PI, 0.83 * Math.PI); c.stroke(); },
    heart: (c) => { c.beginPath(); c.moveTo(0, 0.62); c.bezierCurveTo(-1.1, -0.1, -0.5, -0.9, 0, -0.34); c.bezierCurveTo(0.5, -0.9, 1.1, -0.1, 0, 0.62); c.fill(); },
    check: (c) => { c.beginPath(); c.moveTo(-0.48, 0.02); c.lineTo(-0.14, 0.38); c.lineTo(0.5, -0.36); c.stroke(); },
    dot: (c) => { c.beginPath(); c.arc(0, 0, 0.3, 0, 7); c.fill(); },
  };

  registerStyle({
    id: 'node-network',
    name: 'Node Network',
    family: 'Diagrams with depth',
    look: 'A physical model of a network mounted on a painted wall: glazed porcelain tokens in brass rings, joined by thin brass rods, like a museum\'s molecular model. Each token is two-sided and turns over to its coloured enamel face when the news reaches it.',
    motion: 'It is constructed link by link: a rod extends from a token carrying an empty ring, a blank token drops into the ring with a click, a bead of light slides along the rod and the token spins over to its coloured side. Each ring of the model goes faster than the last, and a number plaque clicks on when a ring is complete.',
    light: 'One warm, soft gallery spot from above, so every rod and token throws a soft shadow down the wall, longer the further it stands off. The pool of light opens as the model grows and always falls off to the corners.',
    materials: 'Ivory glazed porcelain, one enamel colour (cobalt), polished brass, enamel number plaques, and a terracotta plaster wall with a hand-painted title.',
    camera: 'Long lens. Starts close on the first token with the wall out of focus, then one continuous pull-back that keeps pace with the growing model while drifting from left to right. It ends with the finished model filling the frame edge to edge and keeps drifting slowly through the hold.',
    post: 'Real depth of field and motion blur, neutral tone mapping to keep the enamel colour true, light vignette, very fine grain.',
    explains: 'Anything that is things and the connections between them: spread, referrals, teams, systems, flows. Nodes sit in oval rings around a centre, sized so the finished model fills a 16:9 frame; links are rods, a pulse travelling along a link is the story, and a number plaque per ring carries the count.',
    topic: 'How word of mouth grows a small business: 1 happy customer, then 3, 9, 27',
    duration: 8,
    fonts: ['700 340px "Oswald"', '600 200px "Fraunces"'],
    render: { samples: 48, shutter: 0.5, tone: 'neutral', exposure: 1.08, bloom: 0.35, bloomThreshold: 1.3, vignette: 0.3, grain: 0.012, fov: 26, background: '#7c4230' },

    build(S) {
      const { THREE, K, scene, camera } = S;
      const g = schedule();
      const IVORY = '#f3eee2', INK = '#717d8e', WALL = '#935a47';

      // ---- light: a warm key with a real size (soft shadows that open up with distance from the wall), sky fill
      K.env(S, { top: '#8f8983', horizon: '#5f544c', bottom: '#241b17', intensity: 0.95, panels: [
        { pos: [-12, 22, 30], size: [30, 14], color: '#fff3e2', power: 6 },       // big softbox above the camera: fill, and the sheen on rims and brass
        { pos: [30, 4, 14], size: [4, 24], color: '#dfe9ff', power: 6 },          // cool strip on the right: the edge light on the brass
        { pos: [-30, -6, 12], size: [4, 18], color: '#ffd9b0', power: 3 },
        { pos: [0, -26, 18], size: [30, 8], color: '#e39270', power: 1.4 },       // warm bounce from below, as if off a terracotta floor
      ] });
      const key = K.spot(S, { pos: [-4, 16, 19], target: [0.3, 0, 0], color: '#fff0dc', power: 4200, angle: 0.43, penumbra: 1, soft: 1.0, mapSize: 4096 });

      // ---- materials
      const glaze = { roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.17 };
      const porcelain = new THREE.MeshPhysicalMaterial({ color: IVORY, ...glaze });
      const brass = new THREE.MeshStandardMaterial({ color: '#c8a257', metalness: 1, roughness: 0.24 });
      const beadMat = new THREE.MeshStandardMaterial({ color: '#2f5fe0', emissive: '#2a5cff', emissiveIntensity: 4, roughness: 0.25 });
      const add = (geo, mat, parent = scene) => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };

      // ---- the wall. Fine plaster tooth as a height map: soft noise, several texels per grain
      const tooth = K.canvasTex(512, 512, (c, w, h) => {
        const r = K.rng(8), small = document.createElement('canvas'); small.width = small.height = 128;
        const sc = small.getContext('2d'), im = sc.createImageData(128, 128);
        for (let i = 0; i < 128 * 128; i++) { im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = r() * 255; im.data[i * 4 + 3] = 255; }
        sc.putImageData(im, 0, 0); c.imageSmoothingQuality = 'high'; c.filter = 'blur(3px)'; c.drawImage(small, 0, 0, w, h); c.filter = 'none';
      }, { data: true, repeat: [14, 9] });
      tooth.wrapS = tooth.wrapT = THREE.MirroredRepeatWrapping;
      // The uneven, hand-painted colour is stored per vertex, not in a texture: a faint 8-bit texture shows its texel grid
      // on a big flat surface in the close shots, vertex colours are smooth at any distance.
      const wallGeo = new THREE.PlaneGeometry(60, 40, 180, 120), wp = wallGeo.attributes.position, tint = new Float32Array(wp.count * 3), nz = K.noise(3);
      for (let i = 0; i < wp.count; i++) { const x = wp.getX(i), y = wp.getY(i), v = 1 + 0.16 * nz.fbm(x * 0.22, y * 0.22, 0, 4) + 0.07 * nz.fbm(x * 0.9, y * 0.9, 7, 3); tint.set([v, v * (1 - 0.02 * nz.n2(x * 0.15, y * 0.15 + 9)), v], i * 3); }
      wallGeo.setAttribute('color', new THREE.BufferAttribute(tint, 3));
      const wall = add(wallGeo, new THREE.MeshStandardMaterial({ color: WALL, vertexColors: true, bumpMap: tooth, roughness: 0.93 })); wall.castShadow = false; wall.position.x = 1;

      // lettering painted on the wall (it takes the light and the shadows like the wall does)
      const paintText = (text, o, x, y) => { const m = K.textPlane(text, { color: '#fbf3e4', lit: true, roughness: 0.85, align: 'left', ...o }); m.position.set(x + m.userData.size[0] / 2, y, 0.004); m.receiveShadow = true; scene.add(m); return m; };
      const title = paintText(TITLE, { font: '600 200px "Fraunces"', height: 0.92, lineHeight: 1.0 }, -9.75, 4.42);

      // ---- token faces: one canvas per (icon or label, colour), shared by every token that uses it
      const faces = new Map();
      const face = (icon, label, field) => {
        const id = [icon, label, field].join('|');
        if (!faces.has(id)) {
          const tex = K.canvasTex(512, 512, (c) => {
            c.fillStyle = IVORY; c.fillRect(0, 0, 512, 512);
            if (field) {   // enamel side: the colour pools a little darker toward its edge, as fired enamel does
              const gr = c.createRadialGradient(256, 236, 40, 256, 256, 232); gr.addColorStop(0, field); gr.addColorStop(0.8, field); gr.addColorStop(1, 'rgba(0,0,20,0.35)');
              c.fillStyle = field; c.beginPath(); c.arc(256, 256, 230, 0, 7); c.fill(); c.fillStyle = gr; c.fill();
            } else { c.strokeStyle = 'rgba(138,148,163,0.45)'; c.lineWidth = 7; c.beginPath(); c.arc(256, 256, 222, 0, 7); c.stroke(); }
            c.translate(256, 256); c.fillStyle = c.strokeStyle = field ? IVORY : INK;
            if (label) { c.font = '700 340px "Oswald"'; c.textAlign = 'center'; c.textBaseline = 'middle'; const k = Math.min(1, 380 / c.measureText(label).width) * 0.6; c.scale(k, k); c.fillText(label, 0, 12); }
            else { c.scale(150, 150); c.lineWidth = 0.17; c.lineCap = 'round'; (ICONS[icon] || ICONS.dot)(c); }
          });
          faces.set(id, new THREE.MeshPhysicalMaterial({ map: tex, ...glaze }));
        }
        return faces.get(id);
      };

      // ---- token geometry: a porcelain coin with a rounded rim and two slightly domed faces (the dome is what makes
      // the glaze catch a moving highlight when it spins)
      const coin = (R) => {
        const h = 0.1 + 0.07 * R, b = h * 0.48, Rf = R - b, prof = [];
        for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI / 2; prof.push(new THREE.Vector2(Rf + b * Math.sin(a), h / 2 - b + b * Math.cos(a))); }
        for (let i = 0; i <= 8; i++) { const a = (1 - i / 8) * Math.PI / 2; prof.push(new THREE.Vector2(Rf + b * Math.sin(a), -h / 2 + b - b * Math.cos(a))); }
        const rim = new THREE.LatheGeometry(prof.reverse(), 64).rotateX(Math.PI / 2);   // a lathe profile must run bottom to top (y rising), or its faces point inwards
        // the face is built ring by ring so the dome has a real curve (a CircleGeometry is a flat fan)
        const rings = 8, seg = 64, pos = [], uv = [], idx = [];
        for (let j = 0; j <= rings; j++) for (let i = 0; i <= seg; i++) { const r = Rf * j / rings, a = i / seg * Math.PI * 2, x = r * Math.cos(a), y = r * Math.sin(a); pos.push(x, y, h / 2 + 0.05 * R * (1 - (r / Rf) ** 2)); uv.push(x / (2 * Rf) + 0.5, y / (2 * Rf) + 0.5); }
        for (let j = 0; j < rings; j++) for (let i = 0; i < seg; i++) { const a = j * (seg + 1) + i, c = a + seg + 1; idx.push(a, c, a + 1, a + 1, c, c + 1); }
        const cap = new THREE.BufferGeometry(); cap.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); cap.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); cap.setIndex(idx); cap.computeVertexNormals();
        return { rim, cap, h };
      };
      const coins = new Map(), coinFor = (R) => { if (!coins.has(R)) coins.set(R, coin(R)); return coins.get(R); };
      const rodGeo = new THREE.CylinderGeometry(1, 1, 1, 14).translate(0, 0.5, 0);   // a unit rod that grows from its base
      const ballGeo = new THREE.SphereGeometry(1, 20, 14), UP = new THREE.Vector3(0, 1, 0);
      const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
      // a rod from point a towards point b; set(k) shows the first k (0..1) of it and returns where its tip is
      const makeRod = (a, b, r) => {
        const dir = b.clone().sub(a), len = dir.length(); dir.normalize();
        const m = add(rodGeo, brass); m.position.copy(a); m.quaternion.setFromUnitVectors(UP, dir);
        const tip = new THREE.Vector3();
        return { dir, len, set(k) { m.visible = k > 0; m.scale.set(r, Math.max(1e-4, len * k), r); return tip.copy(a).addScaledVector(dir, len * k); } };
      };

      // ---- build every node: brass ring with two pivot pins, and the token that spins inside it
      for (const n of g.order) {
        const R = n.R, tube = 0.026 + 0.014 * R, c = coinFor(R);
        n.grip = R + 0.045 + tube;                                  // distance from the centre to where rods meet the ring
        n.ring = new THREE.Group(); n.ring.position.set(...n.p); scene.add(n.ring);
        add(new THREE.TorusGeometry(R + 0.045, tube, 14, 72), brass, n.ring);
        for (const s of [1, -1]) add(new THREE.CylinderGeometry(tube * 0.6, tube * 0.6, 0.07, 10), brass, n.ring).position.y = s * (R + 0.01);
        n.token = new THREE.Group(); n.ring.add(n.token);
        add(c.rim, porcelain, n.token);
        add(c.cap, face(n.off, null, null), n.token);
        add(c.cap, face(n.on, n.label, GROUPS[n.group] || Object.values(GROUPS)[0]), n.token).rotation.y = Math.PI;
      }
      for (const n of g.order.slice(1)) {
        const a = V(n.parent.p), b = V(n.p), dir = b.clone().sub(a).normalize(), rr = 0.02 + 0.03 * n.R;
        n.rod = makeRod(a.clone().addScaledVector(dir, n.parent.grip), b.clone().addScaledVector(dir, -n.grip), rr);
        n.bead = add(ballGeo, beadMat); n.beadR = 0.06 + 0.16 * n.R; n.from = a.clone().addScaledVector(dir, n.parent.grip);
        n.spin = dir.x >= 0 ? 1 : -1;
      }
      for (const x of g.cross) { const a = V(x.a.p), b = V(x.b.p), dir = b.clone().sub(a).normalize(); x.rod = makeRod(a.addScaledVector(dir, x.a.grip), b.addScaledVector(dir, -x.b.grip), 0.022); }
      // the centre hangs in a brass yoke on a post from the wall, like a desk globe
      const root = g.root, yr = root.R + 0.045;
      add(new THREE.TorusGeometry(yr, 0.04, 12, 48, Math.PI).rotateZ(Math.PI / 2).rotateY(-Math.PI / 2), brass, root.ring);
      add(new THREE.CylinderGeometry(0.065, 0.065, root.p[2] - yr, 16).rotateX(Math.PI / 2), brass).position.set(0, 0, (root.p[2] - yr) / 2);
      add(new THREE.CylinderGeometry(0.34, 0.38, 0.07, 40).rotateX(Math.PI / 2), brass).position.set(0, 0, 0.035);

      // ---- the tally: enamel number plaques on a brass rail in the wide gap on the right, one per ring. The rail
      // extends to the next position and the plaque clicks on, the same way the nodes are built.
      g.tally.forEach((q, d) => {
        q.group = new THREE.Group(); scene.add(q.group); q.pos = new THREE.Vector3(q.x, 0, q.z);
        add(K.roundedBox(q.w, q.h, 0.09, 0.04, 4), porcelain, q.group);
        const tex = K.canvasTex(Math.round(512 * q.w / q.h), 512, (c, w, h) => {
          c.fillStyle = Object.values(GROUPS)[0]; c.fillRect(0, 0, w, h);
          c.strokeStyle = IVORY; c.lineWidth = 10; c.beginPath(); c.roundRect(30, 30, w - 60, h - 60, 20); c.stroke();
          c.fillStyle = IVORY; c.font = '700 340px "Oswald"'; c.textAlign = 'center';
          const m = c.measureText(q.text); c.fillText(q.text, w / 2, h / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
        });
        const front = add(K.roundedRect(q.w - 0.07, q.h - 0.07, 0.03), new THREE.MeshPhysicalMaterial({ map: tex, ...glaze }), q.group); front.position.z = 0.052; front.castShadow = false;
        if (d) { const p = g.tally[d - 1]; q.rail = makeRod(new THREE.Vector3(p.x + p.w / 2 - 0.02, 0, p.z - 0.02), new THREE.Vector3(q.x - q.w / 2 + 0.02, 0, q.z - 0.02), 0.03); }
        else q.rail = makeRod(new THREE.Vector3(root.grip, 0, root.p[2]), new THREE.Vector3(q.x - q.w / 2 + 0.02, 0, q.z - 0.02), 0.03);
      });

      // ---- camera: one continuous pull-back that stays just ahead of the growing model and ends with the model
      // filling the frame. The last key is after the end of the clip so the camera is still drifting on the final frame.
      const cam = {
        pos: K.path([[-0.6, [-3.6, -0.6, 9.8]], [0, [-3.5, -0.7, 10.7]], [0.9, [-3.2, -1.0, 14.8]], [1.7, [-2.8, -0.9, 15.8]], [2.6, [-1.6, -0.5, 19.9]], [4.3, [0.8, 0.3, 25.4]], [6.2, [2.2, 0.6, 25.5]], [8, [3.1, 0.75, 25.0]], [9.5, [3.6, 0.8, 24.7]]]),
        aim: K.path([[-0.6, [0.2, 0.5, 2.1]], [0, [0.2, 0.45, 2.1]], [0.9, [0.4, 0, 1.8]], [1.7, [0.45, 0, 1.7]], [2.6, [0.3, 0, 1.3]], [4.3, [0.4, 0, 0.9]], [6.2, [0.5, 0, 0.9]], [8, [0.55, 0, 0.9]], [9.5, [0.58, 0, 0.9]]]),
        ap: K.track([[0, 0.11], [3, 0.09], [6.2, 0.07], [8, 0.07]]),
        pool: K.path([[0, 0.2], [1.7, 0.3], [3.0, 0.4], [4.6, 0.47], [8, 0.47]]),
      };
      // the ring wobble after a click: a short damped ring-down
      const wobble = (s) => (s > 0 ? Math.exp(-7 * s) * Math.sin(2 * Math.PI * 4.5 * s) : 0);

      // the last plaque lands with a knock that runs through the whole model, ring by ring
      const knock = g.tally[g.tally.length - 1].land + 0.04;

      return {
        update(t) {
          for (const n of g.order) {
            if (n.parent) {
              // 1. the rod extends from the teller, carrying the empty ring on its tip
              const ext = K.seg(t, n.rod0, n.rod1, K.ease.inOut), tip = n.rod.set(ext);
              n.ring.visible = ext > 0;
              const open = K.lerp(0.3, 1, K.ease.out(Math.min(1, ext * 1.5)));      // the ring opens up as it travels
              n.ring.position.copy(tip).addScaledVector(n.rod.dir, n.grip * open);
              n.ring.scale.setScalar(open);
              // 3. the pulse: a bead slides along the rod
              const u = K.seg(t, n.pulse0, n.pulse1, K.ease.inOut);
              n.bead.visible = u > 0 && u < 1;
              n.bead.position.copy(n.from).addScaledVector(n.rod.dir, n.rod.len * u);
              n.bead.scale.setScalar(n.beadR * Math.min(1, Math.sin(Math.PI * u) * 5));
            }
            // 2. the blank token drops in from the camera side and clicks into the ring
            const fly = K.seg(t, n.land - 0.36, n.land);
            n.token.visible = fly > 0;
            n.token.position.z = 1.8 * (1 - fly * fly);
            n.token.scale.setScalar(K.ease.out(Math.min(1, fly * 3)));
            // 4. it turns over on its pivots when the bead arrives, overshoots and settles
            n.token.rotation.y = (n.spin || 1) * (Math.PI * K.spring(t - n.flip, 2.3, 0.42) + 0.45 * wobble(t - n.land) - 0.9 * (1 - fly) + 0.22 * wobble((t - knock - n.depth * 0.05) * 1.5));
          }
          for (const x of g.cross) x.rod.set(K.seg(t, x.rod0, x.rod1, K.ease.inOut));
          for (const q of g.tally) {
            const fly = K.seg(t, q.land - 0.34, q.land);
            q.rail.set(K.seg(t, q.rod0, q.land - 0.08, K.ease.inOut));
            q.group.visible = fly > 0;
            q.group.position.copy(q.pos); q.group.position.z += 2.4 * (1 - fly * fly) - 0.06 * wobble(t - q.land);
            q.group.scale.setScalar(K.ease.out(Math.min(1, fly * 3)));
            q.group.rotation.y = 0.5 * (1 - fly) + 0.1 * wobble(t - q.land);
          }
          // the plaster tooth comes up as the wall comes into focus (fine relief under a strong lens blur shows as a weave)
          wall.material.bumpScale = 1.9 * K.smooth(0.5, 2.6, t);
          // the pool of light opens with the model, so the wall always falls off toward the edges of the frame
          key.angle = cam.pool(t);
          title.material.opacity = K.seg(t, 4.1, 4.8, K.ease.inOut);     // the title is painted in once its corner is in frame
          const p = cam.pos(t), a = cam.aim(t);
          K.look(camera, p, a); K.focus(camera, a, cam.ap(t));
        },
      };
    },

    sound(k) {
      const g = schedule(), pan = (x) => Math.max(-0.8, Math.min(0.8, x / 10));
      const scale = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6', 'G6', 'A6'];
      k.bed('room', 0, 8, { gain: 0.9 });
      g.order.slice(1).forEach((n, i) => {
        const d = n.depth, quiet = 1 / Math.sqrt(d), x = pan(n.p[0]);
        k.withMinor(() => {
          k.noise(n.rod0, { dur: n.rod1 - n.rod0, filter: 'bandpass', f: [[0, 1400], [n.rod1 - n.rod0, 3200]], q: 3, gain: 0.05 * quiet, a: 0.08, pan: x });      // brass sliding out
          k.tone(n.pulse0, { f: [[0, 520 * d], [n.pulse1 - n.pulse0, 780 * d]], dur: n.pulse1 - n.pulse0 + 0.05, gain: 0.035 * quiet, a: 0.1, pan: x });           // the bead on the rod
        });
        k.play('click', n.land, { gain: (d < 3 ? 0.7 : 0.5) * quiet, pan: x, f: 2400 });                                         // porcelain into brass
        k.play('tock', n.land, { gain: 0.45 * quiet, pan: x, f: 1500 + 250 * d });
        // the token turns: a small glazed bell. Every one rings on the first two rings; on the crowded ones only every
        // fifth rings out and the rest are a short soft tap, so the ending stays clear instead of a wash of bells
        const note = scale[Math.min(scale.length - 1, (d - 1) * 3 + (i * 2) % 4)], clear = d < 3 || i % 5 === 0;
        if (clear) k.play('ding', n.flip, { gain: d === 1 ? 0.55 : d === 2 ? 0.36 : 0.3, pan: x, f: note });
        else k.tone(n.flip, { f: note, dur: 0.16, gain: 0.02, pan: x, minor: true });
        k.play('tick', n.flip + 0.02, { gain: (clear ? 0.3 : 0.14) * quiet, pan: x });
      });
      g.tally.forEach((q, d) => { if (!d) return; k.play('tock', q.land, { gain: 0.9, f: 420 + 60 * d, pan: 0.3 }); k.play('click', q.land, { gain: 0.8, pan: 0.3 }); });
      const last = g.tally[g.tally.length - 1];
      k.play('success', last.land + 0.02, { gain: 0.6, f: 'C5' });
      k.play('thud', last.land, { gain: 0.35 });
      k.play('sparkle', last.land + 0.1, { gain: 0.3, n: 5 });         // the knock running out through the tokens
    },
  });
}
```
