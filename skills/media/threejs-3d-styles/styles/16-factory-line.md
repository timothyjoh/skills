# Factory Line (#16)

- **id:** `factory-line`
- **Category:** Machines that explain
- **Use:** explainer
- **Reference duration:** 9 s
- **Google Fonts:** Fredoka, Inter
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`

## Style card

- **Look:** A toy-grade production line on a clean studio floor: chunky cobalt machine housings with big white labels, safety-orange moving parts, a dark rubber belt and one white page riding an orange tray.
- **Motion:** The belt indexes: the tray glides to a station, stops, the machine does one heavy mechanical thing to it (a press slams, a light bar sweeps, a roller prints, a stamper punches), a lamp turns green and the belt moves on.
- **Light:** One low, warm key from the front-left so light reaches under the machine heads and every tool throws a soft shadow on the page, plus a cool sky light that darkens the gaps under the housings. Working tools add their own coloured light.
- **Materials:** Clear-coated enamel in cobalt, orange and cream; brushed steel rods and bolts; matte ribbed rubber; uncoated white paper with printed ink.
- **Camera:** A dolly beside the line that travels with the tray, looking down at about 35 degrees so the page stays readable. It drifts from just behind the tray to just ahead of it, then drops down in front of the finished page for the hold.
- **Finish:** Real motion blur (the world streaks past while the tray stays sharp), gentle depth of field, soft bloom only on lamps and the scanner light, true colours (neutral tone map), light vignette, almost no grain.
- **Good for:** Any step-by-step process: the raw input rides a belt, each labelled station is one step and visibly changes the item, and the finished result is presented at the end.

## Reference

- **Sample topic:** How an AI agent finishes a task: plan, search, write, check
- **Gallery description:** A toy-grade production line on a clean studio floor: chunky cobalt machine housings with big white labels, safety-orange moving parts, a dark rubber belt and one white page riding an orange tray.
- **Shown in the sample clip:** How an AI agent finishes a task: plan, search, write, check

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/factory-line.js`)

```js
{
  // ---------------------------------------------------------------- content (change this for a new topic)
  // One tray rides the belt past four stations. Each station does one thing to the page on the tray:
  //   PLAN   a press stamps the outline (section headings with empty frames)
  //   SEARCH a scanner sweeps light over it and the frames fill with blue source cards
  //   WRITE  a print roller turns the frames into finished text
  //   CHECK  an inspection lamp ticks every section, turns green and a stamper adds the seal
  // For a new topic keep the four tools and change the words: the request, the station names and the headings.
  const REQUEST = ['Find the best', 'YouTube camera'];       // the raw request card that goes in
  const STEPS = ['PLAN', 'SEARCH', 'WRITE', 'CHECK'];        // station labels, in belt order
  const SECTIONS = ['Shortlist', 'Compare', 'Verdict'];      // what the PLAN press stamps on the page
  const END_LABEL = 'DONE';                                  // the tilt table at the end of the line

  // ---------------------------------------------------------------- the schedule (picture and sound both read this)
  const DUR = 9;
  const SP = 4.6;                                            // distance between stations
  const STATION_X = [0, SP, 2 * SP, 3 * SP], OUT_X = 3 * SP + 3.9, START_X = -2.5;
  const T = {
    plan: { arrive: 1.15, hit: 1.42, lift: 1.56, leave: 1.85 },
    search: { arrive: 2.7, sweep: [2.78, 3.3], leave: 3.45 },
    write: { feed: [4.3, 5.3], arrive: 6.15 },               // the tray never stops here: it slows and feeds under the roller
    check: { ticks: [6.3, 6.43, 6.56], pass: 6.68, seal: 6.82, leave: 6.98 },
    done: { arrive: 7.7, tilt: [7.6, 8.12] },
  };
  const GREEN = [T.plan.hit + 0.16, T.search.sweep[1] + 0.03, T.write.feed[1] + 0.12, T.check.pass, T.done.tilt[1] - 0.08];   // when each lamp turns green
  // The belt is an indexing conveyor: it carries the tray to a station, stops, and goes again. Each leg is a speed
  // curve [time, relative speed]; the legs are integrated once into a position table so the tray lands exactly on
  // every station and can crawl at a steady feed under the print roller.
  const LEGS = [
    { to: STATION_X[0], speed: [[0.35, 0], [0.72, 1], [T.plan.arrive, 0]] },
    { to: STATION_X[1], speed: [[T.plan.leave, 0], [2.28, 1], [T.search.arrive, 0]] },
    { to: STATION_X[3], speed: [[T.search.leave, 0], [3.88, 1], [T.write.feed[0], 0.2], [T.write.feed[1], 0.2], [5.72, 1], [T.write.arrive, 0]] },
    { to: OUT_X, speed: [[T.check.leave, 0], [7.32, 1], [T.done.arrive, 0]] },
  ];
  function makeRide(K) {
    const dt = 1 / 240, t0 = -1, n = Math.round((DUR + 2) / dt), xs = new Float32Array(n + 1);
    const at = (sp, t) => { if (t <= sp[0][0] || t >= sp[sp.length - 1][0]) return 0; for (let i = 1; i < sp.length; i++) if (t <= sp[i][0]) return K.lerp(sp[i - 1][1], sp[i][1], K.smooth(sp[i - 1][0], sp[i][0], t)); return 0; };
    let from = START_X;
    const gain = LEGS.map((leg) => { let a = 0; for (let i = 0; i < n; i++) a += at(leg.speed, t0 + (i + 0.5) * dt) * dt; const g = (leg.to - from) / a; from = leg.to; return g; });
    let x = START_X;
    for (let i = 0; i <= n; i++) { xs[i] = x; LEGS.forEach((leg, j) => { x += gain[j] * at(leg.speed, t0 + (i + 0.5) * dt) * dt; }); }
    return (t) => { const f = K.clamp((t - t0) / dt, 0, n - 0.001), i = Math.floor(f); return xs[i] + (xs[i + 1] - xs[i]) * (f - i); };
  }

  // ---------------------------------------------------------------- sizes
  const BELT_Y = 0.9, BELT_HALF = 1.25;                      // belt surface height and half width
  const TRAY = [2.0, 0.12, 2.3], PW = 1.7, PD = 2.05, PX = 600;   // tray size; page size in world units; texture pixels per unit
  const PAGE_Y = BELT_Y + TRAY[1] + 0.004;                   // world height of the page surface
  const HEAD_W = 2.7, HEAD_Y0 = 2.5, HEAD_H = 0.85, HEAD_FRONT = 1.0, TOWER_H = 3.75, TOWER_FRONT = -1.6;
  const ROLLER_R = 0.27;
  const INK = '#23262d', BLUE_INK = '#2a6cf0';
  const SEC_Y = 414, SEC_H = 236;                            // where the first section starts on the page texture, and the pitch between sections (pixels)

  // The page, drawn at four stages: 0 blank, 1 outline, 2 outline + sources, 3 written.
  function drawPage(ctx, stage, K) {
    const w = PW * PX, h = PD * PX, r = K.rng(7);
    ctx.fillStyle = '#fbfaf5'; ctx.fillRect(0, 0, w, h);
    if (!stage) return;
    SECTIONS.forEach((name, i) => {
      const y = SEC_Y + i * SEC_H, cy = y + 112, ch = 104, cw = i === 2 ? 590 : w - 140;   // the last frame is shorter: the seal lands beside it
      ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.beginPath(); ctx.roundRect(70, y + 4, 84, 84, 18); ctx.stroke();
      ctx.fillStyle = INK; ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.font = '800 56px "Inter"'; ctx.fillText(String(i + 1), 112, y + 49);
      ctx.textAlign = 'left'; ctx.font = '800 84px "Inter"'; ctx.fillText(name, 186, y + 50);
      if (stage === 1) {            // empty frame: to be filled
        ctx.setLineDash([22, 16]); ctx.lineWidth = 6; ctx.strokeStyle = '#a3a7b0'; ctx.beginPath(); ctx.roundRect(73, cy, cw - 6, ch, 18); ctx.stroke(); ctx.setLineDash([]);
      } else if (stage === 2) {     // source cards
        const n = i === 2 ? 2 : 3, gap = 20, sw = (cw - gap * (n - 1)) / n;
        for (let k = 0; k < n; k++) {
          const x = 70 + k * (sw + gap);
          ctx.fillStyle = '#d6e4ff'; ctx.strokeStyle = BLUE_INK; ctx.lineWidth = 7; ctx.beginPath(); ctx.roundRect(x, cy, sw, ch, 18); ctx.fill(); ctx.stroke();
          ctx.fillStyle = BLUE_INK; ctx.beginPath(); ctx.arc(x + 50, cy + ch / 2, 25, 0, 7); ctx.fill();
          ctx.beginPath(); ctx.roundRect(x + 92, cy + 26, sw - 120, 18, 9); ctx.fill();
          ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.roundRect(x + 92, cy + 60, (sw - 120) * r.range(0.45, 0.8), 16, 8); ctx.fill(); ctx.globalAlpha = 1;
        }
      } else {                      // written text, with a blue citation mark at the end of some lines
        const tw = i === 1 ? 560 : cw;
        for (let l = 0; l < 3; l++) {
          let x = 70; const end = 70 + tw * (l === 2 ? r.range(0.5, 0.75) : r.range(0.88, 0.96));
          ctx.fillStyle = '#353a45';
          while (x < end - 30) { const ww = Math.min(r.range(50, 170), end - x); ctx.beginPath(); ctx.roundRect(x, cy + 4 + l * 37, ww, 21, 10); ctx.fill(); x += ww + 16; }
          if (l < 2) { ctx.fillStyle = BLUE_INK; ctx.beginPath(); ctx.roundRect(x, cy + 1 + l * 37, 27, 27, 8); ctx.fill(); }
        }
        if (i === 1) [0.5, 0.78, 1].forEach((v, k) => { ctx.fillStyle = k === 2 ? BLUE_INK : '#9fb8ee'; ctx.beginPath(); ctx.roundRect(672 + k * 92, cy + ch - ch * v, 70, ch * v, 12); ctx.fill(); });   // a small chart in the comparison
      }
    });
  }

  registerStyle({
    id: 'factory-line',
    name: 'Factory Line',
    family: 'Machines that explain',
    look: 'A toy-grade production line on a clean studio floor: chunky cobalt machine housings with big white labels, safety-orange moving parts, a dark rubber belt and one white page riding an orange tray.',
    motion: 'The belt indexes: the tray glides to a station, stops, the machine does one heavy mechanical thing to it (a press slams, a light bar sweeps, a roller prints, a stamper punches), a lamp turns green and the belt moves on.',
    light: 'One low, warm key from the front-left so light reaches under the machine heads and every tool throws a soft shadow on the page, plus a cool sky light that darkens the gaps under the housings. Working tools add their own coloured light.',
    materials: 'Clear-coated enamel in cobalt, orange and cream; brushed steel rods and bolts; matte ribbed rubber; uncoated white paper with printed ink.',
    camera: 'A dolly beside the line that travels with the tray, looking down at about 35 degrees so the page stays readable. It drifts from just behind the tray to just ahead of it, then drops down in front of the finished page for the hold.',
    post: 'Real motion blur (the world streaks past while the tray stays sharp), gentle depth of field, soft bloom only on lamps and the scanner light, true colours (neutral tone map), light vignette, almost no grain.',
    explains: 'Any step-by-step process: the raw input rides a belt, each labelled station is one step and visibly changes the item, and the finished result is presented at the end.',
    topic: 'How an AI agent finishes a task: plan, search, write, check',
    duration: DUR,
    fonts: ['700 200px "Fredoka"', '800 84px "Inter"'],
    render: { samples: 48, shutter: 0.5, tone: 'neutral', exposure: 1.0, bloom: 0.35, bloomThreshold: 1.15, vignette: 0.3, grain: 0.012, fov: 30, background: '#d9d1c4' },

    build(S) {
      const { THREE, K, scene, camera } = S;
      const ride = makeRide(K);
      // the dolly follows a smoothed copy of the tray, so the camera glides while the tray stops and goes
      const dollyX = (t) => { let s = 0, w = 0; for (let j = -9; j <= 9; j++) { const g = Math.exp(-j * j / 18); s += g * ride(t + j * 0.05); w += g; } return s / w; };

      // ---- light: a low warm key that follows the dolly (so its shadow map stays sharp), a sky light for occlusion
      const envTex = K.env(S, { top: '#e6e0d5', horizon: '#b9b1a4', bottom: '#5f5a52', intensity: 0.38, panels: [
        { pos: [-9, 12, 11], size: [16, 9], color: '#fff3e0', power: 5 },
        { pos: [14, 7, -6], size: [10, 6], color: '#dce8ff', power: 2.5 },
        { pos: [2, 14, 2], size: [10, 4], color: '#ffffff', power: 3 },
        { pos: [0, 2.5, 16], size: [26, 5], color: '#fff6ea', power: 1.6 },   // a long front softbox: gives the steel and the clear coat something to reflect
      ] });
      const key = K.sun(S, { color: '#ffeed6', power: 3.6, size: 9.5, soft: 0.8 });
      const sky = K.skyLight(S, { color: '#dfe8ff', power: 0.65, size: 9.5 });

      // ---- materials
      const paint = (color, o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color, roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.25 }, o));
      const cobalt = paint('#1a45d2'), orange = paint('#ff641a'), cream = paint('#f1eada'), graphite = paint('#2c3038', { roughness: 0.6, clearcoat: 0.15 });
      const steel = new THREE.MeshStandardMaterial({ color: '#c4c8cf', metalness: 1, roughness: 0.3, envMap: envTex, envMapIntensity: 1.25 });   // its own, brighter copy of the environment so the rods read as polished
      const rubber = new THREE.MeshStandardMaterial({ color: '#1e2024', roughness: 0.88 });
      const dark = new THREE.MeshStandardMaterial({ color: '#0d0e10', roughness: 0.9 });
      const hazard = K.canvasTex(512, 64, (ctx, w, h) => { ctx.fillStyle = '#ffc61a'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#1b1c1f'; for (let x = -h; x < w + h; x += 64) { ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + 32, h); ctx.lineTo(x + 32 + h, 0); ctx.lineTo(x + h, 0); ctx.fill(); } });
      const hazardMat = new THREE.MeshStandardMaterial({ map: hazard, roughness: 0.55 });

      const add = (parent, geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
      const rod = (parent, r, len, mat, x, y, z, axis = 'y') => { const g = new THREE.CylinderGeometry(r, r, len, 32); if (axis === 'z') g.rotateX(Math.PI / 2); if (axis === 'x') g.rotateZ(Math.PI / 2); return add(parent, g, mat, x, y, z); };
      const boltGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.03, 6);
      const bolt = (parent, x, y, z, front) => { const m = add(parent, boltGeo, steel, x, y, z); if (front) m.rotation.x = Math.PI / 2; return m; };   // a hex bolt head, on a top face or (front) on a front face
      const lampMat = () => new THREE.MeshStandardMaterial({ color: '#7a4d14', emissive: '#ffffff', emissiveIntensity: 0, roughness: 0.3 });
      const AMBER = new THREE.Color('#ff9a1a'), GREENC = new THREE.Color('#25f070'), tmpCol = new THREE.Color();
      // a lamp is dark, blinks amber while its station works, then stays green
      const setLamp = (mat, t, work0, green) => {
        if (t >= green) { mat.emissive.copy(GREENC); mat.emissiveIntensity = 2.4 + 4 * Math.exp(-(t - green) * 6); }
        else if (t >= work0) { mat.emissive.copy(AMBER); mat.emissiveIntensity = 1.2 + 1.8 * (0.5 + 0.5 * Math.sin((t - work0) * 34)); }
        else { mat.emissive.copy(AMBER); mat.emissiveIntensity = 0.05; }
      };

      // ---- the room: a painted studio floor that curves up into a back wall, so the machines throw shadows behind them
      const mottle = K.canvasTex(512, 512, (ctx, w, h) => {
        const n = K.noise(5), img = ctx.createImageData(w, h);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const a = x / w * 6.283, b = y / h * 6.283, v = 240 + 9 * n.fbm(Math.cos(a) * 1.4, Math.sin(a) * 1.4 + Math.cos(b) * 1.4, Math.sin(b) * 1.4, 4) + 4 * K.hash(x, y), i = (y * w + x) * 4; img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255; }
        ctx.putImageData(img, 0, 0);
      }, { repeat: [14, 5] });
      const roomMat = new THREE.MeshStandardMaterial({ color: '#dcd4c7', roughness: 0.8, map: mottle, vertexColors: true });
      const WALL_Z = -5.2, COVE = 1.6;
      const room = new THREE.Shape(); room.moveTo(14, 0); room.lineTo(WALL_Z + COVE, 0); room.absarc(WALL_Z + COVE, COVE, COVE, -Math.PI / 2, -Math.PI, true); room.lineTo(WALL_Z, 14);
      const roomGeo = new THREE.BufferGeometry(), rp = room.getPoints(24), pos = [], uv = [], col = [], idx = [];
      let len = 0; rp.forEach((q, i) => { if (i) len += q.distanceTo(rp[i - 1]); pos.push(-50, q.y, q.x, 70, q.y, q.x); uv.push(0, len / 28, 1, len / 28);
        const shade = K.lerp(1, 0.5, K.smooth(-1.5, WALL_Z - 4, q.x - q.y)); col.push(shade, shade, shade, shade, shade, shade);   // the light pool falls off towards the back wall
        if (i) idx.push(i * 2 - 2, i * 2 - 1, i * 2, i * 2 - 1, i * 2 + 1, i * 2); });
      roomGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); roomGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); roomGeo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); roomGeo.setIndex(idx); roomGeo.computeVertexNormals();
      add(scene, roomGeo, roomMat).castShadow = false;
      const FX0 = -14, FX1 = 30, FP = 80;                       // one painted safety line along the front of the belt
      const line = add(scene, new THREE.PlaneGeometry(FX1 - FX0, 0.12), new THREE.MeshStandardMaterial({ transparent: true, roughness: 0.7, map: K.canvasTex((FX1 - FX0) * FP, 16, (ctx, w, h) => {
        ctx.fillStyle = '#f2b90f'; ctx.fillRect(0, 0, w, h); ctx.globalCompositeOperation = 'destination-out'; const r = K.rng(3);
        for (let i = 0; i < 500; i++) { ctx.fillStyle = `rgba(0,0,0,${r.range(0.2, 0.7)})`; ctx.fillRect(r.range(0, w), r.range(0, h), r.range(3, 30), r.range(1, 3)); }
      }) }), (FX0 + FX1) / 2, 0.004, 2.15); line.rotation.x = -Math.PI / 2; line.castShadow = false;

      // ---- the conveyor: ribbed rubber belt between graphite rails, with a spinning axle cap for every roller
      const BX0 = -16, BX1 = OUT_X - 1.62, BL = BX1 - BX0, RAIL_Z = BELT_HALF + 0.09;
      const beltTex = K.canvasTex(256, 256, (ctx, w, h) => {
        ctx.fillStyle = '#25272c'; ctx.fillRect(0, 0, w, h);
        const r = K.rng(2); for (let i = 0; i < 900; i++) { ctx.fillStyle = `rgba(255,255,255,${r.range(0.01, 0.05)})`; ctx.fillRect(r.range(0, w), r.range(0, h), r.range(1, 5), 1); }
        for (let x = 0; x < w; x += 64) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(x, 0, 5, h); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x + 5, 0, 3, h); }   // cross ribs, so the belt reads as moving
      }, { repeat: [BL / 1.6, 1] });
      const beltMat = new THREE.MeshStandardMaterial({ map: beltTex, roughness: 0.82 });
      add(scene, new THREE.BoxGeometry(BL, 0.1, BELT_HALF * 2), beltMat, (BX0 + BX1) / 2, BELT_Y - 0.05, 0);
      add(scene, new THREE.BoxGeometry(BL - 0.4, 0.3, BELT_HALF * 2 - 0.1), dark, (BX0 + BX1) / 2, BELT_Y - 0.26, 0);
      const drum = rod(scene, 0.21, BELT_HALF * 2, beltMat, BX1, BELT_Y - 0.21, 0, 'z');
      for (const s of [-1, 1]) {
        add(scene, K.roundedBox(BL + 0.5, 0.34, 0.18, 0.06, 4), graphite, (BX0 + BX1) / 2, BELT_Y - 0.1, s * RAIL_Z);
        for (let x = -SP * 2.5; x < BX1 - 1; x += SP) { add(scene, K.roundedBox(0.2, BELT_Y - 0.3, 0.2, 0.04, 3), graphite, x, (BELT_Y - 0.3) / 2, s * (RAIL_Z - 0.05)); rod(scene, 0.2, 0.05, steel, x, 0.025, s * (RAIL_Z - 0.05)); }
      }
      const CAP_N = Math.floor((BL - 1) / 0.46), capGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.04, 6); capGeo.rotateX(Math.PI / 2);
      const caps = new THREE.InstancedMesh(capGeo, steel, CAP_N); caps.castShadow = true; caps.receiveShadow = true; caps.frustumCulled = false; scene.add(caps);

      // ---- a station housing: tower behind the belt, head reaching over it (open at the front so the work is visible)
      function housing(X, label, i) {
        const g = new THREE.Group(); g.position.x = X; scene.add(g);
        add(g, K.roundedBox(HEAD_W, TOWER_H, 1.3, 0.18, 6), cobalt, 0, TOWER_H / 2, TOWER_FRONT - 0.65);
        add(g, K.roundedBox(HEAD_W + 0.12, 0.12, 1.42, 0.05, 3), cream, 0, 0.06, TOWER_FRONT - 0.65);            // plinth
        for (let v = 0; v < 5; v++) add(g, K.roundedBox(1.3, 0.07, 0.04, 0.02, 2), dark, 0, 1.4 + v * 0.16, TOWER_FRONT + 0.005).castShadow = false;   // vents
        const head = new THREE.Group(); g.add(head);            // separate group: the press makes it recoil
        const hz = (HEAD_FRONT + TOWER_FRONT - 0.1) / 2, hd = HEAD_FRONT - TOWER_FRONT + 0.1, hy = HEAD_Y0 + HEAD_H / 2, top = HEAD_Y0 + HEAD_H;
        add(head, K.roundedBox(HEAD_W, HEAD_H, hd, 0.18, 6), cobalt, 0, hy, hz);
        add(head, K.roundedBox(1.3, 0.05, 1.15, 0.03, 3), cream, -0.35, top + 0.02, hz - 0.15);                  // service hatch
        for (const [bx, bz] of [[-0.88, -0.6], [0.18, -0.6], [-0.88, 0.3], [0.18, 0.3]]) bolt(head, bx, top + 0.05, hz + bz);
        const text = K.textPlane(label, { font: '700 200px "Fredoka"', height: 0.62, color: '#ffffff', lit: true, roughness: 0.5, letterSpacing: 6 });
        text.scale.setScalar(Math.min(1, (HEAD_W - 0.45) / text.userData.size[0]));
        text.position.set(0, hy - 0.02, HEAD_FRONT + 0.004); text.receiveShadow = true; head.add(text);
        for (const sx of [-1, 1]) for (const sy of [-1, 1]) bolt(head, sx * (HEAD_W / 2 - 0.2), hy + sy * (HEAD_H / 2 - 0.19), HEAD_FRONT + 0.004, true);
        const lamp = lampMat();
        rod(head, 0.15, 0.07, steel, HEAD_W / 2 - 0.36, top + 0.03, HEAD_FRONT - 0.36);
        add(head, new THREE.SphereGeometry(0.125, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), lamp, HEAD_W / 2 - 0.36, top + 0.06, HEAD_FRONT - 0.36).castShadow = false;
        rod(g, 0.17, 0.12, steel, 0, TOWER_H + 0.1, TOWER_FRONT - 0.65, 'x');                                   // saddle for the conduit
        // station number plate on the belt rail, where the tray stops
        add(g, K.roundedBox(0.66, 0.3, 0.05, 0.012, 2), cream, 0, BELT_Y - 0.1, RAIL_Z + 0.11);
        const num = K.textPlane('0' + (i + 1), { font: '700 200px "Fredoka"', height: 0.25, color: '#1a2f7a', lit: true, roughness: 0.6 });
        num.position.set(0, BELT_Y - 0.105, RAIL_Z + 0.137); g.add(num);
        return { g, head, lamp };
      }
      const st = STATION_X.map((x, i) => housing(x, STEPS[i], i));
      rod(scene, 0.1, 70, cream, 8, TOWER_H + 0.1, TOWER_FRONT - 0.65, 'x');                                     // one conduit ties the machines into a line

      // ---- station 1, PLAN: a press. A steel ram and two guide rods carry an orange platen with a rubber pad.
      const press = new THREE.Group(); st[0].g.add(press);
      add(press, K.roundedBox(2.2, 0.24, 2.4, 0.08, 4), orange, 0, 0.17, 0);
      add(press, new THREE.BoxGeometry(2.0, 0.05, 2.2), rubber, 0, 0.025, 0);
      add(press, new THREE.PlaneGeometry(2.04, 0.11), hazardMat, 0, 0.17, 1.201).castShadow = false;
      rod(press, 0.2, 1.7, steel, 0, 1.1, -0.1);
      for (const sx of [-1, 1]) rod(press, 0.065, 1.7, steel, sx * 0.85, 1.1, -0.85);
      rod(st[0].head, 0.27, 0.07, steel, 0, HEAD_Y0 + HEAD_H + 0.03, -0.1); for (const sx of [-1, 1]) rod(st[0].head, 0.11, 0.06, steel, sx * 0.85, HEAD_Y0 + HEAD_H + 0.03, -0.85);   // collars where the rods come through the head
      const PRESS_UP = HEAD_Y0 - 0.3, PRESS_DOWN = PAGE_Y + 0.02;

      // ---- station 2, SEARCH: a light bar on two rails that sweeps from the back of the page to the front
      const scanner = new THREE.Group(); st[1].g.add(scanner);
      for (const sx of [-1, 1]) { rod(st[1].g, 0.045, 2.6, steel, sx * 1.15, HEAD_Y0 - 0.17, -0.3, 'z'); add(st[1].g, K.roundedBox(0.2, 0.26, 0.14, 0.04, 3), cobalt, sx * 1.15, HEAD_Y0 - 0.1, HEAD_FRONT - 0.09); }
      add(scanner, K.roundedBox(2.5, 0.17, 0.36, 0.06, 4), orange, 0, HEAD_Y0 - 0.27, -0.12);   // the light strip sits at the carriage's front edge, so it clears the page without leaving the rails
      const scanGlow = new THREE.MeshBasicMaterial({ color: '#ffffff' });
      add(scanner, new THREE.BoxGeometry(1.8, 0.04, 0.08), scanGlow, 0, HEAD_Y0 - 0.365, 0).castShadow = false;
      const beamTex = K.canvasTex(8, 128, (ctx, w, h) => { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0.25)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); });
      const beam = (geo) => { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); m.frustumCulled = false; return m; };
      const FAN_TOP = HEAD_Y0 - 0.385, fan = beam(new THREE.PlaneGeometry(1.76, FAN_TOP - PAGE_Y)); fan.position.set(0, (FAN_TOP + PAGE_Y) / 2, 0); scanner.add(fan);
      const scanLight = new THREE.PointLight('#48c8ff', 0, 4, 2); scanLight.position.set(0, 1.6, 0); scanner.add(scanLight);
      const SCAN_Z = PD / 2 + 0.05, SCAN_ON = new THREE.Color(1.4, 5, 7);

      // ---- station 3, WRITE: a print cylinder on an axle from the tower, with a steel ink roller riding on top
      const RX = STATION_X[2], RY = PAGE_Y + 0.016 + ROLLER_R, RL = TRAY[2] + 0.1, INK_R = 0.12;
      const rollTex = K.canvasTex(1024, 512, (ctx, w, h) => {
        ctx.fillStyle = '#17203a'; ctx.fillRect(0, 0, w, h);
        const r = K.rng(9); ctx.fillStyle = '#26386a';
        for (let y = 40; y < h - 30; y += 34) { let x = 70; while (x < w - 60) { const ww = r.range(40, 170); ctx.beginPath(); ctx.roundRect(x, y, Math.min(ww, w - 40 - x), 15, 7); ctx.fill(); x += ww + 18; } }
        ctx.fillStyle = '#d5d8dd'; ctx.fillRect(0, 0, 30, h);   // the plate clamp: a bright seam that shows the cylinder turning
      });
      const rollGeo = new THREE.CylinderGeometry(ROLLER_R, ROLLER_R, RL, 56); rollGeo.rotateX(Math.PI / 2);
      const roller = add(st[2].g, rollGeo, new THREE.MeshStandardMaterial({ map: rollTex, roughness: 0.45 }), 0, RY, 0);
      const hub = new THREE.Group(); hub.position.set(0, RY, RL / 2 + 0.01); st[2].g.add(hub);
      rod(hub, ROLLER_R - 0.07, 0.06, orange, 0, 0, 0, 'z'); rod(hub, 0.075, 0.1, steel, 0, 0, 0.02, 'z'); add(hub, new THREE.BoxGeometry(0.28, 0.055, 0.03), steel, 0, 0, 0.045);
      rod(st[2].g, 0.11, 0.6, steel, 0, RY, TOWER_FRONT + 0.25, 'z'); rod(st[2].g, 0.3, 0.1, cream, 0, RY, TOWER_FRONT + 0.03, 'z');
      const inkPos = [-(ROLLER_R + INK_R) * 0.5, RY + (ROLLER_R + INK_R) * 0.866];
      const inkRoller = rod(st[2].g, INK_R, RL - 0.6, steel, inkPos[0], inkPos[1], -0.3, 'z');
      add(st[2].g, K.roundedBox(0.3, HEAD_Y0 - inkPos[1] + 0.12, 0.08, 0.03, 3), orange, inkPos[0], (HEAD_Y0 + inkPos[1]) / 2 - 0.02, -RL / 2 + 0.02);   // hanger for the ink roller (back end only, so the front stays open)
      add(st[2].g, K.roundedBox(0.8, 0.16, RL - 0.5, 0.05, 3), orange, inkPos[0], HEAD_Y0 - 0.08, -0.3);                                              // ink duct under the head

      // ---- station 4, CHECK: an inspection lamp over the page and a small stamper for the seal
      const SEAL = [0.5, 0.76];                                 // seal centre on the page (x, z from the page centre)
      const CX = STATION_X[3], LX = -0.2, LZ = -0.2, LENS_Y = HEAD_Y0 - 0.66;
      rod(st[3].g, 0.07, 0.4, steel, LX, HEAD_Y0 - 0.15, LZ);
      add(st[3].g, new THREE.CylinderGeometry(0.2, 0.52, 0.36, 40, 1, true), paint('#ff641a', { side: THREE.DoubleSide }), LX, LENS_Y + 0.17, LZ);
      rod(st[3].g, 0.2, 0.05, orange, LX, LENS_Y + 0.36, LZ);
      const lensMat = new THREE.MeshBasicMaterial({ color: '#000000' });
      const lens = add(st[3].g, new THREE.CircleGeometry(0.42, 40), lensMat, LX, LENS_Y + 0.04, LZ); lens.rotation.x = Math.PI / 2; lens.castShadow = false;
      const cone = beam(new THREE.CylinderGeometry(0.44, 1.15, LENS_Y - PAGE_Y, 48, 1, true)); cone.position.set(LX, (LENS_Y + PAGE_Y) / 2, LZ); st[3].g.add(cone);
      const checkLight = new THREE.SpotLight('#ffffff', 0, 5, 0.85, 0.7, 2); checkLight.position.set(CX + LX, LENS_Y, LZ); checkLight.target.position.set(CX + LX * 0.5, 0, 0); checkLight.castShadow = false; scene.add(checkLight, checkLight.target);
      const stamper = new THREE.Group(); stamper.position.set(SEAL[0], 0, SEAL[1]); st[3].g.add(stamper);
      rod(stamper, 0.25, 0.16, orange, 0, 0.1, 0); rod(stamper, 0.21, 0.03, rubber, 0, 0.015, 0); rod(stamper, 0.06, 1.5, steel, 0, 0.9, 0);
      rod(st[3].head, 0.11, 0.06, steel, SEAL[0], HEAD_Y0 + HEAD_H + 0.03, SEAL[1]);
      const STAMP_UP = HEAD_Y0 - 0.22;

      // ---- the end of the line: a tilt table that stands the finished page up to face the camera
      const PIVOT = [OUT_X, BELT_Y, TRAY[2] / 2 + 0.16];
      add(scene, K.roundedBox(3.0, 0.72, 2.8, 0.16, 6), cobalt, OUT_X, 0.44, 0);
      add(scene, K.roundedBox(3.1, 0.1, 2.9, 0.04, 3), cream, OUT_X, 0.05, 0);
      const table = new THREE.Group(); table.position.set(...PIVOT); scene.add(table);
      add(table, K.roundedBox(2.5, 0.07, PIVOT[2] * 2, 0.03, 3), cream, 0, -0.035, -PIVOT[2]);
      add(table, K.roundedBox(2.5, 0.16, 0.1, 0.03, 3), orange, 0, 0.045, -0.05);                              // the lip the tray rests on
      for (const sx of [-1, 1]) add(table, K.roundedBox(0.1, 0.12, PIVOT[2] * 2, 0.03, 3), orange, sx * 1.2, 0.025, -PIVOT[2]);   // side guides
      rod(scene, 0.07, 2.7, steel, OUT_X, BELT_Y - 0.06, PIVOT[2], 'x');
      const endText = K.textPlane(END_LABEL, { font: '700 200px "Fredoka"', height: 0.44, color: '#ffffff', lit: true, roughness: 0.5, letterSpacing: 6 });
      endText.position.set(OUT_X - 0.25, 0.44, 1.404); endText.receiveShadow = true; scene.add(endText);
      const endLamp = lampMat();
      rod(scene, 0.16, 0.05, steel, OUT_X + 1.0, 0.44, 1.41, 'z');
      const endDome = add(scene, new THREE.SphereGeometry(0.13, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), endLamp, OUT_X + 1.0, 0.44, 1.42); endDome.rotation.x = Math.PI / 2; endDome.castShadow = false;

      // ---- the item: an orange tray carrying one page, with the yellow request card on top of it
      const item = new THREE.Group(); scene.add(item);
      add(item, K.roundedBox(TRAY[0], TRAY[1], TRAY[2], 0.05, 4), paint('#ff5a12', { clearcoat: 0.15, roughness: 0.5 }), 0, TRAY[1] / 2, 0);   // less gloss than the machines, so it keeps its colour when it tilts to the light
      const stage = [0, 1, 2, 3].map((s) => K.canvasTex(PW * PX, PD * PX, (ctx) => drawPage(ctx, s, K)));
      // One material shows all four stages. The stamp swaps the whole page (hidden under the platen), the scanner
      // reveals along the page's length where its light line has passed, the roller reveals across its width.
      const pu = { tPlan: { value: stage[1] }, tFound: { value: stage[2] }, tDone: { value: stage[3] }, uPlan: { value: 0 }, uScan: { value: 2 }, uWrite: { value: 2 }, uGlow: { value: 0 } };
      const pageMat = new THREE.MeshStandardMaterial({ map: stage[0], roughness: 0.8 });
      pageMat.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, pu);
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tPlan, tFound, tDone; uniform float uPlan, uScan, uWrite, uGlow;')
          .replace('#include <map_fragment>', `vec4 pg = mix(texture2D(map, vMapUv), texture2D(tPlan, vMapUv), uPlan);
            pg = mix(pg, texture2D(tFound, vMapUv), step(uScan, vMapUv.y));
            pg = mix(pg, texture2D(tDone, vMapUv), step(uWrite, vMapUv.x));
            diffuseColor *= pg;`)
          .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(0.3, 0.85, 1.0) * uGlow * smoothstep(0.022, 0.0, abs(vMapUv.y - uScan));');
      };
      const page = add(item, new THREE.PlaneGeometry(PW, PD), pageMat, 0, TRAY[1] + 0.004, 0); page.rotation.x = -Math.PI / 2; page.castShadow = false;
      const CARD = [1.54, 0.6];
      const card = new THREE.Group(); card.position.set(0, TRAY[1] + 0.005, -0.66); card.rotation.y = 0.03; item.add(card);
      add(card, K.roundedBox(CARD[0], 0.014, CARD[1], 0.006, 2), paint('#ffd033', { clearcoat: 0 }), 0, 0.007, 0);
      const cardFace = add(card, K.roundedRect(CARD[0] - 0.02, CARD[1] - 0.02, 0.03), new THREE.MeshStandardMaterial({ roughness: 0.75, map: K.canvasTex(CARD[0] * PX, CARD[1] * PX, (ctx, w, h) => {
        ctx.fillStyle = '#ffd033'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = INK; ctx.beginPath(); ctx.roundRect(40, 30, 236, 58, 29); ctx.fill();
        ctx.fillStyle = '#ffd033'; ctx.font = '800 34px "Inter"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = '4px'; ctx.fillText('REQUEST', 160, 61);
        ctx.letterSpacing = '0px'; ctx.fillStyle = INK; ctx.textAlign = 'left';
        let px = 104; ctx.font = `800 ${px}px "Inter"`; const widest = Math.max(...REQUEST.map((l) => ctx.measureText(l).width)); px = Math.min(px, px * (w - 80) / widest); ctx.font = `800 ${px}px "Inter"`;
        REQUEST.forEach((l, i) => ctx.fillText(l, 40, 160 + i * px * 1.1));
      }) }), 0, 0.0155, 0); cardFace.rotation.x = -Math.PI / 2; cardFace.castShadow = false;
      // green ticks over the section numbers, and the seal
      const tickTex = K.canvasTex(128, 128, (ctx) => { ctx.fillStyle = '#17a84b'; ctx.beginPath(); ctx.roundRect(4, 4, 120, 120, 26); ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 17; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(32, 66); ctx.lineTo(54, 88); ctx.lineTo(96, 40); ctx.stroke(); });
      const ticks = SECTIONS.map((_, i) => { const m = add(item, new THREE.PlaneGeometry(0.17, 0.17), new THREE.MeshStandardMaterial({ map: tickTex, transparent: true, roughness: 0.6 }), 112 / PX - PW / 2, TRAY[1] + 0.007, (SEC_Y + i * SEC_H + 46) / PX - PD / 2); m.rotation.x = -Math.PI / 2; m.castShadow = false; return m; });
      const sealTex = K.canvasTex(320, 320, (ctx) => {
        ctx.translate(160, 160); ctx.rotate(-0.2);
        ctx.fillStyle = '#17a84b'; ctx.beginPath(); ctx.arc(0, 0, 118, 0, 7); ctx.fill();
        ctx.strokeStyle = '#17a84b'; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(0, 0, 142, 0, 7); ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 30; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-58, 6); ctx.lineTo(-16, 48); ctx.lineTo(60, -44); ctx.stroke();
        ctx.globalCompositeOperation = 'destination-out'; const r = K.rng(4);   // uneven ink, like a real rubber stamp
        for (let i = 0; i < 260; i++) { ctx.fillStyle = `rgba(0,0,0,${r.range(0.15, 0.6)})`; ctx.beginPath(); ctx.arc(r.range(-150, 150), r.range(-150, 150), r.range(0.6, 2.4), 0, 7); ctx.fill(); }
      });
      const seal = add(item, new THREE.PlaneGeometry(0.52, 0.52), new THREE.MeshStandardMaterial({ map: sealTex, transparent: true, roughness: 0.6 }), SEAL[0], TRAY[1] + 0.008, SEAL[1]); seal.rotation.x = -Math.PI / 2; seal.castShadow = false;

      // ---- camera: offsets from the dolly. It opens close on the request behind the tray, slowly overtakes it along
      // the line (so the freshly printed side of the page is always in view) and ends in front of the finished page.
      const rig = {
        pos: K.track([[0, [0.9, 5.7, 6.2]], [1.7, [-0.5, 5.9, 6.5], 'inOut'], [4.4, [0.8, 5.9, 6.5], 'inOut'], [6.9, [0.8, 5.9, 6.5]], [8.35, [0.4, 3.2, 7.4], 'inOut']]),
        aim: K.track([[0, [1.05, 1.5, 0]], [1.7, [0.2, 1.65, 0], 'inOut'], [4.4, [-0.1, 1.65, 0], 'inOut'], [6.9, [-0.1, 1.65, 0]], [8.35, [0.0, 1.52, 0.6], 'inOut']]),
      };

      return {
        update(t) {
          const x = ride(t), dx = dollyX(t);

          // belt, drum and axle caps turn with the tray's travel
          beltTex.offset.x = -x / 1.6; drum.rotation.z = -x / 0.21;
          for (let i = 0; i < CAP_N; i++) { const cx = BX0 + 0.8 + i * 0.46; K.place(caps, i, [cx, BELT_Y - 0.1, RAIL_Z + 0.1], [0, 0, -x / 0.3 + i], STATION_X.some((sx) => Math.abs(cx - sx) < 0.45) ? 0 : 1); }   // none behind the number plates
          caps.instanceMatrix.needsUpdate = true;

          // 1 PLAN: the platen winds up a little, falls faster and faster, rests on the page, then lifts on air
          const p = T.plan, fall = K.seg(t, p.arrive - 0.02, p.hit), liftK = K.seg(t, p.lift, p.lift + 0.5, K.ease.inOut);
          const windup = fall < 0.35 ? 0.07 * Math.sin(Math.PI * fall / 0.35) : 0, down = fall < 0.35 ? 0 : Math.pow((fall - 0.35) / 0.65, 2.4);
          press.position.y = t < p.lift ? K.lerp(PRESS_UP, PRESS_DOWN, down) + windup : K.lerp(PRESS_DOWN, PRESS_UP, liftK);
          const since = t - p.hit;
          st[0].head.position.y = since > 0 ? -0.035 * Math.exp(-since * 9) * Math.cos(since * 40) : 0;       // the whole head recoils from the hit
          pu.uPlan.value = t >= p.hit ? 1 : 0;

          // 2 SEARCH: the light bar sweeps from the back of the page to the front, then parks at the back again
          const s = T.search, sweep = K.seg(t, s.sweep[0], s.sweep[1], K.ease.inOut), park = K.seg(t, s.sweep[1] + 0.05, s.sweep[1] + 0.45, K.ease.inOut);
          const sz = K.lerp(-SCAN_Z, SCAN_Z, sweep - park), on = K.smooth(s.sweep[0] - 0.08, s.sweep[0], t) * (1 - K.smooth(s.sweep[1], s.sweep[1] + 0.08, t));
          scanner.position.z = sz;
          scanGlow.color.setScalar(0.25).lerp(SCAN_ON, on); fan.material.color.setRGB(0.08 * on, 0.3 * on, 0.45 * on); fan.visible = on > 0.001;
          scanLight.intensity = 1.6 * on;
          pu.uScan.value = t < s.sweep[0] ? 2 : t < s.sweep[1] ? 0.5 - sz / PD : -1; pu.uGlow.value = 4 * on;

          // 3 WRITE: everything that has passed under the cylinder is printed
          pu.uWrite.value = 0.5 + (RX - x) / PW;
          const turn = K.clamp(x - RX, -1.9, 1.9) / ROLLER_R + 0.5 * t;   // geared to the page while it feeds, idling otherwise
          roller.rotation.z = turn; hub.rotation.z = turn; inkRoller.rotation.z = -turn * ROLLER_R / INK_R;

          // 4 CHECK: amber while it inspects, a tick per section, green when it passes, then the seal
          const c = T.check, lit = K.smooth(T.write.arrive - 0.15, T.write.arrive + 0.05, t) * (1 - K.smooth(c.leave + 0.1, c.leave + 0.5, t));
          const pulse = t < c.pass ? 0.75 + 0.25 * Math.sin((t - T.write.arrive) * 30) : 1;
          tmpCol.copy(AMBER).lerp(GREENC, K.seg(t, c.pass, c.pass + 0.08));
          lensMat.color.copy(tmpCol).multiplyScalar(4 * lit * pulse); cone.material.color.copy(tmpCol).multiplyScalar(0.14 * lit * pulse); cone.visible = lit > 0.001;
          checkLight.color.copy(tmpCol); checkLight.intensity = 5 * lit * pulse;
          ticks.forEach((m, i) => { m.scale.setScalar(Math.max(K.spring(t - c.ticks[i], 5, 0.5), 1e-4)); m.visible = t >= c.ticks[i]; });
          const punch = t < c.seal ? Math.pow(K.seg(t, c.seal - 0.11, c.seal), 2) : 1 - K.seg(t, c.seal + 0.05, c.seal + 0.3, K.ease.out);
          stamper.position.y = K.lerp(STAMP_UP, PAGE_Y + 0.006, punch);
          seal.visible = t >= c.seal;

          // lamps
          setLamp(st[0].lamp, t, p.arrive - 0.05, GREEN[0]); setLamp(st[1].lamp, t, s.sweep[0], GREEN[1]);
          setLamp(st[2].lamp, t, T.write.feed[0] - 0.2, GREEN[2]); setLamp(st[3].lamp, t, T.write.arrive, GREEN[3]); setLamp(endLamp, t, 99, GREEN[4]);

          // the tray: on the belt, then stood up by the tilt table (it slides down onto the lip as the table rises)
          const d = T.done, tilt = 1.02 * K.seg(t, d.tilt[0], d.tilt[1], (u) => K.ease.outBack(K.ease.inOut(u), 0.9));
          table.rotation.x = tilt;
          const oz = -PIVOT[2] + 0.06 * K.seg(t, d.tilt[0] + 0.1, d.tilt[0] + 0.4, K.ease.in);
          item.position.set(x, PIVOT[1] - oz * Math.sin(tilt), PIVOT[2] + oz * Math.cos(tilt)); item.rotation.x = tilt;

          // light and camera ride with the dolly
          key.position.set(dx - 7, 7.5, 9); key.target.position.set(dx, 1, 0); sky.target.position.set(dx, 1, 0);
          key.intensity = 3.6 - 1.1 * K.seg(t, d.tilt[0], d.tilt[1] + 0.1, K.ease.inOut);   // the page turns to face the key, so the key comes down to keep the orange and yellow from washing out
          const cp = rig.pos(t), ca = rig.aim(t);
          K.look(camera, [dx + cp[0], cp[1], cp[2]], [dx + ca[0], ca[1], ca[2]]);
          K.focus(camera, [item.position.x, item.position.y + 0.3, item.position.z], 0.02);
        },
      };
    },

    sound(k) {
      k.bed('room', 0, DUR, { gain: 0.9 }); k.bed('hum', 0, DUR, { gain: 0.45 });
      k.play('click', LEGS[0].speed[0][0] - 0.03, { gain: 0.5 });
      LEGS.forEach((leg) => { const a = leg.speed[0][0], b = leg.speed[leg.speed.length - 1][0]; k.play('roller', a, { dur: b - a, gain: 0.5 }); k.play('tock', b - 0.02, { gain: 0.35, f: 240 }); });   // belt motor, and the clunk as it stops
      const notes = ['C6', 'D6', 'E6', 'G6'];
      GREEN.slice(0, 4).forEach((g, i) => k.play('ding', g, { gain: 0.55, f: notes[i], pan: -0.2 + i * 0.13 }));   // each green lamp is one step up the scale
      // PLAN: air rushes in, the platen lands, air bleeds off as it lifts
      k.noise(T.plan.arrive, { dur: T.plan.hit - T.plan.arrive, filter: 'highpass', f: [[0, 1800], [0.25, 5200]], gain: 0.1, a: 0.12 });
      k.play('impact', T.plan.hit, { gain: 1 }); k.play('stamp', T.plan.hit, { gain: 1 });
      k.noise(T.plan.lift, { dur: 0.4, filter: 'highpass', f: [[0, 6000], [0.35, 2500]], gain: 0.09, a: 0.02 });
      // SEARCH: a rising scanner tone and a blip per row it finds
      const [s0, s1] = T.search.sweep;
      k.tone(s0 - 0.05, { f: [[0, 420], [s1 - s0, 1250]], type: 'triangle', dur: s1 - s0 + 0.12, gain: 0.08, a: 0.06, hold: s1 - s0 - 0.1, verb: 0.2 });
      SECTIONS.forEach((_, i) => k.play('blip', s0 + (s1 - s0) * (0.42 + i * 0.17), { gain: 0.8, f: ['A5', 'C6', 'E6'][i % 3], type: 'sine' }));
      // WRITE: the cylinder rumbles and the print chatters while the page feeds through
      const [w0, w1] = T.write.feed;
      k.play('roller', w0 - 0.25, { dur: w1 - w0 + 0.5, gain: 0.8 });
      k.withMinor(() => { for (let x = w0 - 0.1, i = 0; x < w1 + 0.1; x += 0.055, i++) k.play('tick', x, { gain: 0.32, f: 2600 + (i * 577 % 1500), pan: 0.1 }); });
      // CHECK: three ticks, the pass, the seal
      T.check.ticks.forEach((x, i) => k.play('pop', x, { gain: 0.6, f: 700 + i * 110 }));
      k.play('stamp', T.check.seal, { gain: 0.75 });
      // DONE: a servo stands the page up and it settles against the lip
      const [d0, d1] = T.done.tilt;
      k.tone(d0, { f: [[0, 180], [d1 - d0 - 0.1, 420]], type: 'sawtooth', dur: d1 - d0, gain: 0.05, a: 0.05, hold: d1 - d0 - 0.2, filter: 'lowpass', f2: 1400 });
      k.play('thud', d0 + 0.42, { gain: 0.4 });
      k.play('success', GREEN[4], { gain: 0.8, f: 'C6' });
    },
  });
}
```
