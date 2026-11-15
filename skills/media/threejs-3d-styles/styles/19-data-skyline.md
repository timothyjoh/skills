# Data Skyline (#19)

- **id:** `data-skyline`
- **Category:** Diagrams with depth
- **Use:** explainer
- **Reference duration:** 8.5 s
- **Google Fonts:** Space Grotesk, IBM Plex Mono, Fraunces
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`

## Style card

- **Look:** A bar chart built as an architect's model: towers of stacked pale stone blocks on a printed plinth, with one tower in vermilion, tiny trees and people for scale, and thin drawn annotations on top.
- **Motion:** Towers push up out of the plinth one after another on a heavy spring, overshoot a little and settle while their value counts up on the roof. Taller towers take longer, so size is felt as time.
- **Light:** A low warm sun from the side, so every tower throws its shadow onto the next one and the last shadow runs long across the ground; cool sky light fills the shaded fronts and warm haze swallows the horizon.
- **Materials:** Honed limestone with fine strata and pores, the same stone stained vermilion for the accent tower, dark printed ink for scales, footprints and labels, a mid-grey ground so the pale model stands out.
- **Camera:** Starts at ground level beside the first tower, dollies along the row while the towers rise, tilts up as the tallest one climbs past the lens, then cranes up and back until the whole comparison is in frame.
- **Finish:** Shallow focus at ground level like a macro photo of a model, real motion blur, gentle bloom on the sunlit faces, soft filmic contrast, light vignette and fine grain.
- **Good for:** Any list of labelled values: a comparison, a ranking or a series over time. Each value is a tower, the label is printed at its foot, the unit is stacked in countable blocks and one accent colour marks the bar that matters.

## Reference

- **Sample topic:** World population by the billion: 1 billion in 1804, 2 in 1927, 4 in 1974, 8 in 2022
- **Gallery description:** A bar chart built as an architect's model: towers of stacked pale stone blocks on a printed plinth, with one tower in vermilion, tiny trees and people for scale, and thin drawn annotations on top.
- **Shown in the sample clip:** World population by the billion: 1 billion in 1804, 2 in 1927, 4 in 1974, 8 in 2022

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/data-skyline.js`)

```js
{
  // ---------------------------------------------------------------- content (change this block for a new chart)
  const KICKER = 'WORLD POPULATION';                 // small line above the headline
  const TITLE = ['Counted by', 'the billion'];       // headline while the towers rise
  const TAKEAWAY = ['The last 4 billion', 'took 48 years.'];   // headline once the whole chart is in view
  const UNIT = 'BILLION';                            // printed on the plinth beside every footprint
  const DATA = [                                     // one tower per row, left to right
    { label: '1804', value: 1 },
    { label: '1927', value: 2 },
    { label: '1974', value: 4 },
    { label: '2022', value: 8 },
  ];
  const HERO = 3;                                    // the tower that gets the accent colour
  const STEP = 1;                                    // one stacked block per STEP units, so a tower can be counted
  const GAPS = ['123 years', '47 years', '48 years'];   // optional: what lies between neighbours (drawn as dimension lines)
  const fmt = (v, landed) => (landed ? String(v) : v.toFixed(1));   // the value while it counts up, and at rest

  // ---------------------------------------------------------------- the model
  const N = DATA.length, VMAX = Math.max(...DATA.map((d) => d.value));
  const PITCH = 2.8, TW = 1.8;                       // tower spacing and footprint, world units
  const U = 4.8 / VMAX;                              // world height of one data unit: the tallest tower is 4.8 high
  const JOINT = 0.04;                                // shadow gap between stacked blocks
  const PT = 0.6, FRONT = 1.65, CHAMFER = 0.6, BACK = -2.0;   // plinth: thickness, front edge of the top, sloped label face
  const PW = (N - 1) * PITCH + TW + 2.2;             // plinth length
  const towerX = (i) => (i - (N - 1) / 2) * PITCH;
  const INK = '#2a2622', STONE = '#e9e1d2', PLINTH = '#ddd3c1', ACCENT = '#e2512b';

  // Every tower rises on a damped spring: it starts from rest, overshoots a few percent and settles. Taller towers
  // get a slower spring, so they travel at about the same speed as the small ones and feel much heavier.
  const DAMP = 0.72, STARTS = [-0.5, 0.85, 1.95, 3.05];
  const T_WIDE = 6.3;                                // the camera has pulled back: annotations start here
  function schedule(K) {
    return DATA.map((d, i) => {
      const t0 = STARTS[i] != null ? STARTS[i] : STARTS[STARTS.length - 1] + (i - STARTS.length + 1) * 1.1;
      const freq = 1.25 / Math.pow(d.value / DATA[0].value, 0.48);
      let land = 0; while (K.spring(land, freq, DAMP) < 1) land += 1 / 240;   // first time the top reaches full height
      return { t0, freq, land: t0 + land, h: d.value * U };
    });
  }

  registerStyle({
    id: 'data-skyline',
    name: 'Data Skyline',
    family: 'Diagrams with depth',
    look: 'A bar chart built as an architect\'s model: towers of stacked pale stone blocks on a printed plinth, with one tower in vermilion, tiny trees and people for scale, and thin drawn annotations on top.',
    motion: 'Towers push up out of the plinth one after another on a heavy spring, overshoot a little and settle while their value counts up on the roof. Taller towers take longer, so size is felt as time.',
    light: 'A low warm sun from the side, so every tower throws its shadow onto the next one and the last shadow runs long across the ground; cool sky light fills the shaded fronts and warm haze swallows the horizon.',
    materials: 'Honed limestone with fine strata and pores, the same stone stained vermilion for the accent tower, dark printed ink for scales, footprints and labels, a mid-grey ground so the pale model stands out.',
    camera: 'Starts at ground level beside the first tower, dollies along the row while the towers rise, tilts up as the tallest one climbs past the lens, then cranes up and back until the whole comparison is in frame.',
    post: 'Shallow focus at ground level like a macro photo of a model, real motion blur, gentle bloom on the sunlit faces, soft filmic contrast, light vignette and fine grain.',
    explains: 'Any list of labelled values: a comparison, a ranking or a series over time. Each value is a tower, the label is printed at its foot, the unit is stacked in countable blocks and one accent colour marks the bar that matters.',
    topic: 'World population by the billion: 1 billion in 1804, 2 in 1927, 4 in 1974, 8 in 2022',
    duration: 8.5,
    fonts: ['700 200px "Space Grotesk"', '500 40px "Space Grotesk"', '500 30px "IBM Plex Mono"', '600 80px "Fraunces"'],
    render: { samples: 48, shutter: 0.5, tone: 'filmic', exposure: 1.0, bloom: 0.3, bloomThreshold: 1.15, vignette: 0.3, grain: 0.016, fov: 34, background: '#e8d5bc' },

    build(S) {
      const { THREE, K, scene, camera } = S;
      const plan = schedule(K);
      const HAZE = '#ead8c0';

      // ---------------------------------------------------------------- sky, haze and light
      // The sky is a plain gradient dome whose lower half is exactly the fog colour, so the floor melts into it.
      scene.fog = new THREE.FogExp2(HAZE, 0.011);
      const skyTex = K.canvasTex(8, 512, (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#5f8cc4'); g.addColorStop(0.2, '#8fb0d4'); g.addColorStop(0.36, '#cdd3d6'); g.addColorStop(0.48, HAZE); g.addColorStop(1, HAZE);
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      });
      const dome = new THREE.Mesh(new THREE.SphereGeometry(150, 32, 24), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false }));
      scene.add(dome);
      K.env(S, { top: '#7fa8dc', horizon: '#e9dccb', bottom: '#8a8a8c', intensity: 0.3, panels: [{ pos: [-34, 13, 11], size: [26, 12], color: '#ffd9a6', power: 3 }] });
      // A low sun from the left and slightly behind the row: sunlit sides, cool shaded fronts, and every tower throws
      // its shadow onto the next, taller one, so each left face shows how high the previous value reached.
      const SUN = [-20.2, 7.5, -4.3];
      K.sun(S, { pos: SUN, target: [0, 0, 0], color: '#ffcf9a', power: 4.5, size: 15, soft: 1.2, mapSize: 4096, far: 90 });
      K.skyLight(S, { color: '#aec8f7', power: 0.7, size: 13, center: [0, 1, 0], mapSize: 2048 });

      // ---------------------------------------------------------------- stone
      // One light, speckled limestone texture; the colour comes from each material, so the accent tower is the same
      // stone in another colour. It doubles as the bump map.
      const stoneDraw = (seed, base) => (ctx, w, h) => {
        const r = K.rng(seed);
        ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 46; i++) {   // soft strata
          const y = r.range(0, h), t = r.range(2, 22);
          ctx.fillStyle = r.chance(0.5) ? `rgba(255,255,255,${r.range(0.03, 0.1)})` : `rgba(96,80,60,${r.range(0.02, 0.07)})`;
          ctx.fillRect(0, y, w, t);
        }
        for (let i = 0; i < 5200; i++) {   // grains and pores
          const x = r.range(0, w), y = r.range(0, h), s = r.range(0.6, 2.2);
          ctx.fillStyle = r.chance(0.4) ? `rgba(255,255,255,${r.range(0.08, 0.3)})` : `rgba(70,56,40,${r.range(0.05, 0.22)})`;
          ctx.fillRect(x, y, s * r.range(1, 4), s);
        }
      };
      const stoneTex = K.canvasTex(1024, 1024, stoneDraw(3, '#f6f3ee'), { repeat: [1, 1] });
      const stoneMat = (color, k) => {
        const map = stoneTex.clone(); map.repeat.set(0.8, 0.3); map.offset.set(K.hash(k, 1) * 0.2, K.hash(k, 2) * 0.7); map.needsUpdate = true;
        return new THREE.MeshStandardMaterial({ color, map, bumpMap: map, bumpScale: 0.6, roughness: 0.86 });
      };
      const add = (geo, mat, x, y, z, parent = scene, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; };

      // ---------------------------------------------------------------- floor and plinth
      const floorTex = K.canvasTex(512, 512, (ctx, w, h) => {
        const r = K.rng(9); ctx.fillStyle = '#8e8c87'; ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 2600; i++) { ctx.fillStyle = r.chance(0.5) ? `rgba(255,255,255,${r.range(0.02, 0.05)})` : `rgba(70,60,50,${r.range(0.02, 0.05)})`; ctx.beginPath(); ctx.arc(r.range(0, w), r.range(0, h), r.range(0.6, 4), 0, 7); ctx.fill(); }
      }, { repeat: [150, 150] });
      const floor = add(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.92 }), 0, -PT, 0, scene, false);
      floor.rotation.x = -Math.PI / 2;

      // the plinth is one extruded profile: a slab with a sloped front face that carries the labels
      const prof = new THREE.Shape();   // drawn in (-z, y), then turned so the extrusion runs along x
      prof.moveTo(-BACK, -PT); prof.lineTo(-BACK, 0); prof.lineTo(-FRONT, 0); prof.lineTo(-(FRONT + CHAMFER), -PT + 0.06); prof.lineTo(-(FRONT + CHAMFER), -PT); prof.closePath();
      const plinthGeo = new THREE.ExtrudeGeometry(prof, { depth: PW, bevelEnabled: false });
      plinthGeo.translate(0, 0, -PW / 2); plinthGeo.rotateY(Math.PI / 2);
      { const p = plinthGeo.attributes.position, uv = plinthGeo.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) * 0.31, (p.getZ(i) - p.getY(i)) * 0.31); }
      const plinthTex = K.canvasTex(1024, 1024, stoneDraw(21, '#f6f3ee'), { repeat: [1, 1] });
      add(plinthGeo, new THREE.MeshStandardMaterial({ color: PLINTH, map: plinthTex, bumpMap: plinthTex, bumpScale: 0.4, roughness: 0.9 }), 0, 0, 0);

      // the printed sheet on top: grid, centre line, footprints, edge scale, a scale bar. All ink, all generated from DATA.
      const PX = 300, TOPW = PW - 0.24, TOPD = FRONT - BACK - 0.24, topZ = (FRONT + BACK) / 2;
      const topTex = K.canvasTex(Math.round(TOPW * PX), Math.round(TOPD * PX), (ctx, w, h) => {
        stoneDraw(22, '#f6f3ee')(ctx, w, h);
        const X = (x) => (x + TOPW / 2) * PX, Z = (z) => (z - topZ + TOPD / 2) * PX;
        const line = (x0, z0, x1, z1, lw, a, dash) => { ctx.strokeStyle = `rgba(42,38,34,${a})`; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.beginPath(); ctx.moveTo(X(x0), Z(z0)); ctx.lineTo(X(x1), Z(z1)); ctx.stroke(); ctx.setLineDash([]); };
        const x0 = -TOPW / 2 + 0.1, x1 = TOPW / 2 - 0.1, z0 = topZ - TOPD / 2 + 0.1, z1 = topZ + TOPD / 2 - 0.1;
        ctx.strokeStyle = 'rgba(42,38,34,0.55)'; ctx.lineWidth = 3; ctx.strokeRect(X(x0), Z(z0), (x1 - x0) * PX, (z1 - z0) * PX);
        for (let x = Math.ceil(x0 / 0.23) * 0.23; x < x1; x += 0.23) line(x, z0, x, z1, 1.4, 0.15);          // fine grid
        for (let z = Math.ceil(z0 / 0.23) * 0.23; z < z1; z += 0.23) line(x0, z, x1, z, 1.4, 0.15);
        line(x0, 0, x1, 0, 2.5, 0.5, [46, 12, 6, 12]);                                                          // centre line of the row
        ctx.font = '500 30px "IBM Plex Mono"'; ctx.textBaseline = 'middle';
        DATA.forEach((d, i) => {
          const x = towerX(i), f = TW / 2 + 0.13;
          line(x, z0, x, z1, 2.5, 0.38, [46, 12, 6, 12]);
          ctx.strokeStyle = 'rgba(42,38,34,0.75)'; ctx.lineWidth = 4; ctx.strokeRect(X(x - f), Z(-f), 2 * f * PX, 2 * f * PX);   // footprint
          for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { line(x + sx * f, sz * (f + 0.05), x + sx * f, sz * (f + 0.2), 3, 0.75); line(x + sx * (f + 0.05), sz * f, x + sx * (f + 0.2), sz * f, 3, 0.75); }
          ctx.fillStyle = 'rgba(42,38,34,0.8)'; ctx.textAlign = 'left';
          ctx.fillText(String(i + 1).padStart(2, '0'), X(x - f), Z(-f - 0.3));
          ctx.textAlign = 'right'; ctx.fillText(`${d.value} ${UNIT}`, X(x + f), Z(-f - 0.3));
        });
        for (let k = 0, x = x0; x <= x1 + 1e-6; k++, x = x0 + k * PITCH / 20) line(x, z1, x, z1 - (k % 10 === 0 ? 0.2 : k % 5 === 0 ? 0.14 : 0.08), k % 5 === 0 ? 3 : 2, 0.7);   // edge scale
        // scale bar: how tall one block is
        const sx = x0 + 0.25, sz = z0 + 0.3;
        for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? 'rgba(42,38,34,0.0)' : 'rgba(42,38,34,0.8)'; ctx.fillRect(X(sx + k * U * STEP / 4), Z(sz - 0.05), U * STEP / 4 * PX, 0.1 * PX); }
        ctx.strokeStyle = 'rgba(42,38,34,0.8)'; ctx.lineWidth = 3; ctx.strokeRect(X(sx), Z(sz - 0.05), U * STEP * PX, 0.1 * PX);
        ctx.fillStyle = 'rgba(42,38,34,0.8)'; ctx.textAlign = 'left'; ctx.fillText(`1 BLOCK = ${STEP} ${UNIT}`, X(sx), Z(sz + 0.22));
      });
      const top = add(new THREE.PlaneGeometry(TOPW, TOPD), new THREE.MeshStandardMaterial({ color: PLINTH, map: topTex, roughness: 0.9 }), 0, 0.002, topZ, scene, false);
      top.rotation.x = -Math.PI / 2;

      // labels printed on the sloped front face, one under each tower
      const slope = Math.atan2(CHAMFER, PT - 0.06);   // how far the sloped face leans back from vertical
      DATA.forEach((d, i) => {
        const lab = K.textPlane(d.label, { font: '700 200px "Space Grotesk"', height: 0.72, color: i === HERO ? ACCENT : INK, lit: true, roughness: 0.7, letterSpacing: 6 });
        lab.position.set(towerX(i), -(PT - 0.06) / 2 + 0.006, FRONT + CHAMFER / 2 + 0.006); lab.rotation.x = -slope; lab.receiveShadow = true; lab.material.polygonOffset = true; lab.material.polygonOffsetFactor = -2;
        scene.add(lab);
      });

      // ---------------------------------------------------------------- towers
      const blockGeo = K.roundedBox(TW, U * STEP - JOINT, TW, 0.035, 3);
      const jointMat = new THREE.MeshStandardMaterial({ color: '#4a4138', roughness: 1 });
      const collarMat = new THREE.MeshStandardMaterial({ color: '#cfc4b1', roughness: 0.85 });
      const LW = 1024, LH = 512, NUM_H = 1.3;   // value label canvas, and its height in the world
      const towers = DATA.map((d, i) => {
        const g = new THREE.Group(); g.position.x = towerX(i); scene.add(g);
        const color = i === HERO ? ACCENT : STONE, blocks = Math.ceil(d.value / STEP - 1e-9);
        for (let k = 0; k < blocks; k++) {
          const bh = Math.min(STEP, d.value - k * STEP) * U;
          const m = stoneMat(color, i * 31 + k); m.color.offsetHSL(0, 0, (K.hash(i, k) - 0.5) * 0.035);   // no two blocks are quite the same
          add(bh > U * STEP - 1e-6 ? blockGeo : K.roundedBox(TW, bh - JOINT, TW, 0.035, 3), m, 0, k * STEP * U + JOINT + (bh - JOINT) / 2, 0, g);
          add(new THREE.BoxGeometry(TW - 0.1, JOINT, TW - 0.1), jointMat, 0, k * STEP * U + JOINT / 2, 0, g, false);
        }
        // a low collar around the slot the tower rises through
        const c = TW / 2 + 0.05;
        for (const [x, z, w, dp] of [[0, c, TW + 0.2, 0.1], [0, -c, TW + 0.2, 0.1], [c, 0, 0.1, TW], [-c, 0, 0.1, TW]]) add(K.roundedBox(w, 0.05, dp, 0.012, 2), collarMat, towerX(i) + x, 0.025, z);
        // the value stands on the roof as cut-out numerals (a few stacked planes give them thickness)
        const tex = K.canvasTex(LW, LH, null); tex.generateMipmaps = false; tex.minFilter = THREE.LinearFilter;   // alpha-tested text stays clean without mipmaps
        const mat = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 });
        const label = new THREE.Group(); label.position.set(0, d.value * U, TW / 2 - 0.2); g.add(label);
        for (let k = 0; k < 10; k++) add(new THREE.PlaneGeometry(NUM_H * LW / LH, NUM_H), mat, 0, NUM_H / 2 - NUM_H * 62 / LH, -k * 0.006, label, false).receiveShadow = false;
        return { g, label, tex, shown: null, d, i };
      });
      const drawValue = (tw, text) => {
        if (tw.shown === text) return;
        tw.shown = text;
        tw.tex.redraw((ctx, w, h) => {
          ctx.fillStyle = tw.i === HERO ? '#b93a1b' : INK; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
          ctx.font = '700 520px "Space Grotesk"'; ctx.fillText(text, w / 2, h - 62);
        });
      };

      // ---------------------------------------------------------------- scale cues: model trees and people
      const rr = K.rng(4), trees = [], people = [];
      for (let i = 0; i <= N; i++) { const x = towerX(i) - PITCH / 2; trees.push([x + rr.range(-0.15, 0.15), BACK + 0.45 + rr.range(-0.1, 0.1), rr.range(0.8, 1.25)]); if (rr.chance(0.6)) trees.push([x + rr.range(0.25, 0.5), BACK + 0.75 + rr.range(-0.1, 0.1), rr.range(0.6, 0.85)]); }
      trees.push([towerX(0) - TW / 2 - 0.55, 1.1, 1.1], [towerX(0) - TW / 2 - 0.85, 1.35, 0.75], [towerX(N - 1) + TW / 2 + 0.55, 0.8, 1.0]);
      for (let i = 0; i < N; i++) { const n = 2 + (i === 0 ? 2 : rr.int(0, 2)); for (let k = 0; k < n; k++) people.push([towerX(i) + rr.range(-0.85, 0.85), rr.range(TW / 2 + 0.28, FRONT - 0.2)]); }
      for (let i = 0; i < N - 1; i++) people.push([towerX(i) + PITCH / 2 + rr.range(-0.2, 0.2), rr.range(-0.5, 0.6)]);
      const inst = (geo, mat, list, fn) => { const m = new THREE.InstancedMesh(geo, mat, list.length); list.forEach((p, k) => fn(m, k, p)); m.castShadow = true; m.receiveShadow = true; scene.add(m); return m; };
      const sage = new THREE.MeshStandardMaterial({ color: '#a9b08f', roughness: 0.95 }), twig = new THREE.MeshStandardMaterial({ color: '#6d5f50', roughness: 0.9 }), figure = new THREE.MeshStandardMaterial({ color: '#2f2b28', roughness: 0.7 });
      inst(new THREE.IcosahedronGeometry(0.15, 2), sage, trees, (m, k, [x, z, s]) => K.place(m, k, [x, 0.16 + 0.15 * s, z], [0, k, 0], s));
      inst(new THREE.CylinderGeometry(0.011, 0.016, 0.2, 6), twig, trees, (m, k, [x, z]) => K.place(m, k, [x, 0.1, z]));
      inst(new THREE.CapsuleGeometry(0.019, 0.07, 3, 8), figure, people, (m, k, [x, z]) => K.place(m, k, [x, 0.054, z]));
      inst(new THREE.SphereGeometry(0.017, 10, 8), figure, people, (m, k, [x, z]) => K.place(m, k, [x, 0.132, z]));

      // ---------------------------------------------------------------- camera: one continuous crane move
      // 0-1.9 s: a slow creep on the first two towers (time to read the title). 3.1: beside the third. 3.9-4.6: at the
      // foot of the hero tower, looking up while it climbs. 6.7: the wide three-quarter view from the sunlit side, then a
      // slow push until the end. The wide lens at the low point (46 degrees) is what makes the tall tower loom.
      const hTop = DATA[HERO].value * U, xh = towerX(HERO);
      // the closing three-quarter view, from the sunlit side, on a long lens so the plinth fills the width. Its last key
      // lies after the end of the clip, so the slow push is still moving on the final frame.
      const WIDE_AIM = [0.15, 2.0, 0], WIDE_AZ = 24 * Math.PI / 180;
      const wide = (d) => [WIDE_AIM[0] - Math.sin(WIDE_AZ) * d, 3.4, Math.cos(WIDE_AZ) * d];
      const cam = {
        pos: K.path([[0, [towerX(0) - 3.0, 0.8, 6.1]], [1.9, [towerX(0) - 2.3, 0.72, 6.4]], [3.1, [towerX(2) - 3.6, 0.55, 7.3]], [4.5, [xh - 5.2, 0.42, 6.9]], [6.7, wide(22.4)], [8.5, wide(21.0)], [10, wide(20.2)]]),
        aim: K.path([[0, [towerX(0) + 1.1, 0.6, 0]], [1.9, [towerX(0) + 1.45, 0.75, 0]], [3.1, [towerX(2) + 0.1, 1.9, 0]], [3.9, [xh - 0.7, hTop * 0.66, 0]], [4.6, [xh - 0.6, hTop * 0.7, 0]], [6.7, WIDE_AIM], [10, WIDE_AIM]]),
        fov: K.track([[0, 34], [3.1, 36], [4.5, 46], [6.7, 24], [8.5, 24]]),
        ap: K.track([[0, 0.02], [3.1, 0.02], [4.5, 0.014], [6.7, 0.012], [8.5, 0.012]]),
      };

      // screen position of a world point, for the drawn annotations
      const v = new THREE.Vector3();
      const proj = (x, y, z, W, H) => { v.set(x, y, z).project(camera); return [(v.x * 0.5 + 0.5) * W, (0.5 - v.y * 0.5) * H]; };

      return {
        update(t) {
          towers.forEach((tw, i) => {
            const p = plan[i], s = K.spring(t - p.t0, p.freq, DAMP);
            tw.g.position.y = (s - 1) * p.h - (t < p.t0 ? 0.012 : 0);         // before it starts, the roof sits just under the collar
            // the count is read once per frame, so the digits do not smear into each other inside one exposure
            const tf = Math.round(t * 30) / 30, landed = tf >= p.land;
            drawValue(tw, fmt(landed ? tw.d.value : tw.d.value * K.clamp(K.spring(tf - p.t0, p.freq, DAMP)), landed));
            const pop = K.seg(t, p.t0 + 0.05, p.t0 + 0.4, K.ease.outBack);
            tw.label.scale.set(1, Math.max(pop, 1e-3), 1); tw.label.visible = pop > 0;
          });
          const aim = cam.aim(t);
          K.look(camera, cam.pos(t), aim, cam.fov(t)); K.focus(camera, [aim[0], aim[1], TW / 2], cam.ap(t));   // focus on the front faces
          dome.position.copy(camera.position);
        },

        // Drawn annotations, crisp at any size: the headline, and dimension lines between the labels once the
        // whole chart is in view. They are anchored to points on the model, so they follow the camera.
        overlay(ctx, t, W, H) {
          camera.updateMatrixWorld(true);
          const ink = 'rgba(38,34,30,';
          const head = (lines, a, x, dy, accentLast) => {
            if (a <= 0) return;
            ctx.save(); ctx.globalAlpha = a; ctx.translate(x, 118 + dy);
            ctx.fillStyle = ink + '0.9)'; ctx.fillRect(0, 0, 64, 5);
            ctx.font = '500 30px "IBM Plex Mono"'; ctx.letterSpacing = '7px'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = ink + '0.85)'; ctx.fillText(KICKER, 0, 58);
            ctx.letterSpacing = '-1px'; ctx.font = '600 88px "Fraunces"';
            lines.forEach((l, k) => { ctx.fillStyle = accentLast && k === lines.length - 1 ? '#c8401f' : ink + '0.96)'; ctx.fillText(l, -3, 152 + k * 96); });
            ctx.restore();
          };
          head(TITLE, 1 - K.seg(t, 1.9, 2.3), 112, -14 * K.seg(t, 1.9, 2.3, K.ease.in), false);
          const k2 = K.seg(t, T_WIDE + 0.65, T_WIDE + 1.1, K.ease.out);
          head(TAKEAWAY, k2, 112, 14 * (1 - k2), true);

          // dimension lines between neighbouring labels, along the floor in front of the plinth
          GAPS.forEach((text, i) => {
            const a = K.seg(t, T_WIDE + i * 0.25, T_WIDE + i * 0.25 + 0.4, K.ease.out);
            if (a <= 0 || i >= N - 1) return;
            const z = FRONT + CHAMFER + 0.3, p0 = proj(towerX(i), -PT, z, W, H), p1 = proj(towerX(i + 1), -PT, z, W, H);
            const ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]), len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) * a, hero = i + 1 === HERO;
            ctx.save(); ctx.translate(p0[0], p0[1]); ctx.rotate(ang);
            ctx.strokeStyle = hero ? '#c8401f' : ink + '0.9)'; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, 0); ctx.moveTo(0, -16); ctx.lineTo(0, 16); if (a >= 1) { ctx.moveTo(len, -16); ctx.lineTo(len, 16); } ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-9, 9); ctx.lineTo(9, -9); if (a >= 1) { ctx.moveTo(len - 9, 9); ctx.lineTo(len + 9, -9); } ctx.lineWidth = 4; ctx.stroke();   // architect's ticks
            ctx.globalAlpha = K.seg(a, 0.5, 1); ctx.font = `${hero ? 700 : 500} 40px "Space Grotesk"`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillText(text.toUpperCase(), Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / 2, 16);
            ctx.restore();
          });
        },
      };
    },

    sound(k) {
      const K = globalThis.K, plan = schedule(K);
      k.bed('room', 0, 8.5, { gain: 1.1 });
      k.noise(0, { dur: 8.5, color: 'pink', filter: 'bandpass', f: [[0, 500], [4.4, 420], [6.7, 900], [8.5, 800]], q: 0.5, gain: 0.035, a: 0.6, hold: 7, bus: 'amb' });   // open air
      plan.forEach((p, i) => {
        if (p.land < 0.2) return;   // already standing when the clip opens
        const t0 = p.t0, d = p.land - t0, pan = K.clamp(towerX(i) / 6, -0.6, 0.6), big = DATA[i].value / VMAX;
        // stone sliding up through the slot: a low grind that brightens as it speeds up, then the landing
        k.noise(t0, { dur: d + 0.12, color: 'brown', filter: 'bandpass', f: [[0, 90], [d * 0.7, 240 + 120 * big], [d + 0.1, 110]], q: 1.1, gain: 0.3 + 0.25 * big, a: d * 0.4, hold: d * 0.45, pan, verb: 0.15 });
        k.noise(t0, { dur: d, color: 'pink', filter: 'bandpass', f: [[0, 900], [d, 2400]], q: 2, gain: 0.05 + 0.05 * big, a: d * 0.5, hold: d * 0.4, pan });
        // one knock for every block that clears the plinth
        k.withMinor(() => {
          for (let b = 1; b * STEP < DATA[i].value + 1e-6; b++) {
            let x = 0; while (K.spring(x, p.freq, DAMP) * DATA[i].value < b * STEP && x < 5) x += 1 / 240;
            k.play('tock', p.t0 + x, { gain: 0.38, f: 300 + 45 * b, pan });
          }
        });
        k.play('thud', p.land, { gain: 0.7 + 0.4 * big, f: 120 - 40 * big, pan });
        if (i === HERO) { k.play('impact', p.land, { gain: 1.4, f: 105, pan }); k.play('stamp', p.land, { gain: 0.8, pan }); }   // the one that matters lands hardest
        k.play('tock', p.land + 0.01, { gain: 0.6, f: 420 + 60 * i, pan });
      });
      k.play('thud', 0.06, { gain: 0.5, f: 110, pan: -0.5 });
      GAPS.forEach((_, i) => k.play('click', T_WIDE + i * 0.25 + 0.05, { gain: 0.9, f: 1500 + i * 250, pan: -0.2 + i * 0.25 }));   // a pen tick for every dimension line
      k.play('ding', T_WIDE + 0.7, { gain: 0.55, f: 'D5' });
      k.music('pad', 4.5, 8.5, { bpm: 60, chords: [['D3', 'A3', 'F#4', 'A4']], gain: 0.9 });
    },
  });
}
```
