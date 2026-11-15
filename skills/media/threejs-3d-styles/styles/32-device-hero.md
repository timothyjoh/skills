# Device Hero (#32)

- **id:** `device-hero`
- **Category:** Products and screens
- **Use:** product
- **Reference duration:** 8 s
- **Google Fonts:** Fraunces, Inter
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`

## Style card

- **Look:** A phone filmed like a launch video: a titanium body with a polished frame standing on black gloss in a dark studio, its screen the brightest thing in the room. Then the screen fills the frame and the interface becomes white cards floating over the glass.
- **Motion:** The phone turns to face the lens while strip lights slide across its glass. The camera dollies into the screen in one move and the interface peels off in layers, the top of each stack first. Inside, things behave the way the app would: a press sinks the card, the ring sweeps round, the digits roll.
- **Light:** Studio half: nothing lights the phone directly; it is shaped by tall strip lights and a soft box reflected in metal and glass. Screen half: one large soft light from the upper left, so every floating layer drops a soft shadow down and to the right that grows with its height.
- **Materials:** Satin titanium, black cover glass with a real reflection, a mirror-gloss floor. The interface is a canvas texture that glows like a display in the studio and turns into thin, bevelled white card stock once it lifts.
- **Camera:** Long lens. A low, slow drift past the standing phone, one continuous push that drops below the screen and looks up along it, then a slow arc so the layers slide against each other. Focus follows the action: the checkbox, then the number.
- **Finish:** Neutral tone mapping so interface colours stay exact, soft bloom only on metal highlights, shallow depth of field, a light vignette, almost no grain.
- **Good for:** An app, a feature or any on-screen moment: show the device first so the viewer knows what they are looking at, then go inside and let two or three interface elements act out the one thing the feature does.

## Reference

- **Sample topic:** Streak, a habit tracker: ticking off today's last habit closes the ring and turns a 29-day streak into 30
- **Gallery description:** A phone filmed like a launch video: a titanium body with a polished frame standing on black gloss in a dark studio, its screen the brightest thing in the room. Then the screen fills the frame and the interface becomes white cards floating over the glass.
- **Shown in the sample clip:** Streak, a habit tracker: ticking off today's last habit closes the ring and turns a 29-day streak into 30

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/device-hero.js`)

```js
{
  // ---------------------------------------------------------------- content (change this for a new topic)
  // The app on the screen. Everything the viewer reads comes from this block.
  const APP = {
    date: 'TUESDAY 10 NOVEMBER',
    title: 'Today',
    from: 29, to: 30,                       // the streak counter rolls from one to the other
    unit: 'DAY STREAK',
    before: '2 of 3 done today', after: 'All 3 done today',
    week: ['W', 'T', 'F', 'S', 'S', 'M', 'T'],   // the last seven days, today last
  };
  const HABITS = [                          // the first one is ticked off in the clip, the others are already done
    { title: 'Read 20 pages', sub: 'Evening', icon: 'book' },
    { title: 'Meditate', sub: 'Morning  ·  10 min', icon: 'focus' },
    { title: 'Walk 8,000 steps', sub: 'All day', icon: 'steps' },
  ];
  // one accent colour, used only for progress and done states
  const C = { paper: '#f1eee8', card: '#ffffff', ink: '#1b1a18', muted: '#8d877e', line: '#e6e0d7', tile: '#f4f0ea', accent: '#ff5a1f', soft: '#ffe5d9' };

  // ---------------------------------------------------------------- the schedule (picture and sound share it)
  const T = {
    turnEnd: 3.0,          // the phone finishes turning to face the lens
    push: [2.15, 4.2],     // the camera travels from the studio into the screen
    lift: 2.95,            // interface layers start to leave the glass
    touch: 4.45,           // the fingertip lands on the checkbox
    tick: 4.65,            // it lets go: the box fills and the tick draws
    ring: [4.85, 5.65],    // today's ring closes
    roll: 5.65,            // the counter rolls
  };
  // every piece of interface that lifts off the screen: height above the glass and its delay after T.lift.
  // The top of each stack leaves first (number, ring, then its card), so nothing ever passes through what it sits on.
  const LIFT = { number: [0.44, 0], unit: [0.39, 0.03], ring: [0.32, 0.07], hero: [0.16, 0.15], row0: [0.2, 0.2], row1: [0.13, 0.28], row2: [0.09, 0.36], check: 0.07 };

  // ---------------------------------------------------------------- the device (world units: 1 = 2 cm)
  const PW = 3.8, PH = 7.9, PD = 0.42, PR = 0.62;           // body width, height, depth, corner radius
  const SW = PW - 0.3, SH = PH - 0.3, SR = PR - 0.15;      // the lit screen inside its black border
  // the interface is designed in points like a real phone screen (390 wide), then mapped onto the glass
  const PT = SW / 390, HPT = SH / PT;
  const sx = (x) => (x - 195) * PT, sy = (y) => (HPT / 2 - y) * PT;
  const HERO = { x: 16, y: 150, w: 358, h: 276, r: 32 }, RING = { x: 195, y: 284, out: 98, in: 80 };
  const ROW = (i) => ({ x: 16, y: 438 + i * 76, w: 358, h: 66, r: 22 }), CHECK_X = 340, CHECK_R = 15;

  registerStyle({
    id: 'device-hero',
    name: 'Device Hero',
    family: 'Products and screens',
    look: 'A phone filmed like a launch video: a titanium body with a polished frame standing on black gloss in a dark studio, its screen the brightest thing in the room. Then the screen fills the frame and the interface becomes white cards floating over the glass.',
    motion: 'The phone turns to face the lens while strip lights slide across its glass. The camera dollies into the screen in one move and the interface peels off in layers, the top of each stack first. Inside, things behave the way the app would: a press sinks the card, the ring sweeps round, the digits roll.',
    light: 'Studio half: nothing lights the phone directly; it is shaped by tall strip lights and a soft box reflected in metal and glass. Screen half: one large soft light from the upper left, so every floating layer drops a soft shadow down and to the right that grows with its height.',
    materials: 'Satin titanium, black cover glass with a real reflection, a mirror-gloss floor. The interface is a canvas texture that glows like a display in the studio and turns into thin, bevelled white card stock once it lifts.',
    camera: 'Long lens. A low, slow drift past the standing phone, one continuous push that drops below the screen and looks up along it, then a slow arc so the layers slide against each other. Focus follows the action: the checkbox, then the number.',
    post: 'Neutral tone mapping so interface colours stay exact, soft bloom only on metal highlights, shallow depth of field, a light vignette, almost no grain.',
    explains: 'An app, a feature or any on-screen moment: show the device first so the viewer knows what they are looking at, then go inside and let two or three interface elements act out the one thing the feature does.',
    topic: 'Streak, a habit tracker: ticking off today\'s last habit closes the ring and turns a 29-day streak into 30',
    duration: 8,
    fonts: ['600 300px "Fraunces"', '400 16px "Inter"', '500 16px "Inter"', '600 16px "Inter"'],
    render: { samples: 72, shutter: 0.5, tone: 'neutral', exposure: 1.06, bloom: 0.32, bloomThreshold: 1.5, vignette: 0.3, grain: 0.012, fov: 24, near: 0.5, far: 160, background: '#050506' },

    build(S) {
      const { THREE, K, scene, camera } = S;

      // ============================================================ small builders the kit does not have
      const rr = (w, h, r) => {
        const s = new THREE.Shape(), x = w / 2, y = h / 2;
        s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.absarc(x - r, -y + r, r, -Math.PI / 2, 0); s.lineTo(x, y - r); s.absarc(x - r, y - r, r, 0, Math.PI / 2);
        s.lineTo(-x + r, y); s.absarc(-x + r, y - r, r, Math.PI / 2, Math.PI); s.lineTo(-x, -y + r); s.absarc(-x + r, -y + r, r, Math.PI, Math.PI * 1.5);
        return s;
      };
      // a rounded-rectangle slab with rounded edges: back on z = 0, front on z = depth, texture mapped flat across it
      const slab = (w, h, r, depth, bevel, curve = 20) => {
        const g = new THREE.ExtrudeGeometry(rr(w - 2 * bevel, h - 2 * bevel, Math.max(0.001, r - bevel)), { depth: depth - 2 * bevel, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 5, curveSegments: curve });
        g.translate(0, 0, bevel);
        const p = g.attributes.position, uv = g.attributes.uv;
        for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
        return g;
      };
      // a flat chamfered ring lying in XY. Its triangles are ordered clockwise from 12 o'clock, so
      // geometry.setDrawRange(0, n * g.userData.perSeg) shows the first n segments: that is how the ring fills.
      const band = (rIn, rOut, h, b, segs = 240) => {
        const prof = [[rIn, 0], [rIn, h - b], [rIn + b, h], [rOut - b, h], [rOut, h - b], [rOut, 0], [rIn, 0]], pos = [];   // closed underneath: shadows are drawn from the faces turned away from the light
        const pt = (j, a) => [Math.sin(a) * prof[j][0], Math.cos(a) * prof[j][0], prof[j][1]];
        for (let i = 0; i < segs; i++) {
          const a0 = (i / segs) * Math.PI * 2, a1 = ((i + 1) / segs) * Math.PI * 2;
          for (let j = 0; j < prof.length - 1; j++) { const A = pt(j, a0), B = pt(j + 1, a0), Cc = pt(j + 1, a1), D = pt(j, a1); pos.push(...A, ...Cc, ...B, ...A, ...D, ...Cc); }
        }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
        g.userData = { segs, perSeg: (prof.length - 1) * 6 };
        return g;
      };
      // a chamfered disc (buttons of the interface, ring end caps, lens rings): axis along z, back on z = 0
      const puck = (r, h, b, seg = 48) => new THREE.LatheGeometry([[0, 0], [r, 0], [r, h - b], [r - b, h], [0, h]].map(([x, y]) => new THREE.Vector2(x, y)), seg).rotateX(Math.PI / 2);
      const mesh = (geo, mat, parent, x = 0, y = 0, z = 0, shadow = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = shadow; parent.add(m); return m; };

      // ============================================================ the studio
      // Metal and glass are lit only by what they reflect, so the "lights" are bright panels in the environment:
      // two thin strips at front left that slide across the glass as the phone turns (their angles decide when),
      // wider ones at both sides for the frame, a rim behind and a soft box overhead. Nothing sits behind the
      // camera, so the glass is clean once the phone faces the lens. `blur` is kept low so the strips stay strips. (three.js ignores a material's envMapIntensity unless the material holds the
      // environment map itself, so materials that need their own reflection strength get `envMap: studio`.)
      const studio = K.env(S, { top: '#08090b', horizon: '#0b0c0e', bottom: '#020202', intensity: 1, blur: 0.004, panels: [
        { pos: [-18.3, 2, 8.1], size: [0.6, 26], color: '#fff3e2', power: 14 },
        { pos: [-11.8, 2, 16.2], size: [0.25, 26], color: '#ffffff', power: 14 },
        { pos: [-20, 2, -1], size: [2, 26], color: '#fff3e2', power: 8 },
        { pos: [19.5, 2, -3], size: [2.6, 26], color: '#ffffff', power: 6 },
        { pos: [-11, 5, -16], size: [2.5, 20], color: '#f3efe8', power: 7 },
        { pos: [2, 20, 3], size: [18, 7], color: '#fff6ea', power: 5 },
      ] });
      // backdrop: a painted pool of light on a dark wall, plus a strip light and a soft box far behind, out of focus
      const wall = K.canvasTex(1024, 512, (ctx, w, h) => {
        ctx.fillStyle = '#050506'; ctx.fillRect(0, 0, w, h);
        const g = ctx.createRadialGradient(w * 0.5, h * 0.7, 0, w * 0.5, h * 0.7, w * 0.26);
        g.addColorStop(0, '#4b463f'); g.addColorStop(0.3, '#2a2724'); g.addColorStop(0.65, '#111010'); g.addColorStop(1, 'rgba(5,5,6,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      });
      mesh(new THREE.PlaneGeometry(190, 95), new THREE.MeshBasicMaterial({ map: wall }), scene, 0, 24, -46, false);
      const bar = K.canvasTex(64, 512, (ctx, w, h) => {   // a strip light with soft ends and edges
        const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,236,214,0)'); g.addColorStop(0.2, 'rgba(255,236,214,1)'); g.addColorStop(0.8, 'rgba(255,236,214,1)'); g.addColorStop(1, 'rgba(255,236,214,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        const e = ctx.createLinearGradient(0, 0, w, 0); e.addColorStop(0, 'rgba(0,0,0,0)'); e.addColorStop(0.5, '#000'); e.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalCompositeOperation = 'destination-in'; ctx.fillStyle = e; ctx.fillRect(0, 0, w, h);
      });
      const strip = new THREE.MeshBasicMaterial({ map: bar, transparent: true, depthWrite: false, color: new THREE.Color(1.5, 1.5, 1.5) });
      mesh(new THREE.PlaneGeometry(0.9, 17), strip, scene, -15, 9.5, -30, false);
      mesh(new THREE.PlaneGeometry(7, 15), new THREE.MeshBasicMaterial({ map: bar, transparent: true, depthWrite: false, color: new THREE.Color(0.3, 0.3, 0.3) }), scene, 12.5, 9, -38, false);
      K.mirrorFloor(S, { y: 0, color: '#070708', roughness: 0.16, surfaceRoughness: 0.42, strength: 0.75, fresnel: true, material: { envMap: studio, envMapIntensity: 0.12 } });
      // The only real light: a big soft source for the interface, switched on from update() once the camera is inside
      // the screen. SUN is its strength, GLOW how much of the display's own light the interface keeps under it;
      // together they add up to the same white the screen had in the studio, so the hand-over is invisible.
      const SUN = 2.45, GLOW = 0.5;
      const sun = K.sun(S, { pos: [-6.5, PH / 2 + 7.5, 9.5], target: [0, PH / 2 + 0.9, 0], color: '#fffaf3', power: 0, size: 4.4, soft: 1.4, mapSize: 4096 });

      // ============================================================ the phone
      const phone = new THREE.Group(); phone.position.set(0, PH / 2, 0); scene.add(phone);
      const titanium = new THREE.MeshStandardMaterial({ color: '#bcb6ad', roughness: 0.2, metalness: 1 });
      const seam = new THREE.MeshStandardMaterial({ color: '#77736d', roughness: 0.6, metalness: 0.2 });
      const blackGlass = new THREE.MeshPhysicalMaterial({ color: '#020203', roughness: 0.05, metalness: 0, ior: 1.6 });
      const backGlass = new THREE.MeshPhysicalMaterial({ color: '#a9a39a', roughness: 0.42, metalness: 0.35, clearcoat: 0.4, clearcoatRoughness: 0.3 });
      mesh(slab(PW, PH, PR, PD, 0.075, 40), titanium, phone, 0, 0, -PD / 2);                                   // the frame: one bevelled block
      mesh(K.roundedRect(PW - 0.15, PH - 0.15, PR - 0.075, 16), blackGlass, phone, 0, 0, PD / 2 + 0.0008);      // black border under the cover glass
      const back = mesh(K.roundedRect(PW - 0.15, PH - 0.15, PR - 0.075, 16), backGlass, phone, 0, 0, -PD / 2 - 0.0008); back.rotation.y = Math.PI;
      // buttons and antenna seams: the small things the eye checks to decide it is a real phone
      mesh(K.roundedBox(0.07, 1.0, 0.15, 0.03, 3), titanium, phone, PW / 2 + 0.012, 0.9, 0);
      [[2.05, 0.34], [1.28, 0.62], [0.52, 0.62]].forEach(([y, len]) => mesh(K.roundedBox(0.07, len, 0.15, 0.03, 3), titanium, phone, -PW / 2 - 0.012, y, 0));
      [-1, 1].forEach((s) => { mesh(new THREE.BoxGeometry(PW + 0.003, 0.03, PD - 0.16), seam, phone, 0, s * (PH / 2 - 1.0), 0, false); mesh(new THREE.BoxGeometry(0.03, PH + 0.003, PD - 0.16), seam, phone, s * (PW / 2 - 1.0), 0, 0, false); });
      // camera bump on the back
      const bump = new THREE.Group(); bump.position.set(0.82, PH / 2 - 1.12, -PD / 2); bump.rotation.y = Math.PI; phone.add(bump);
      mesh(slab(1.72, 1.72, 0.5, 0.085, 0.03), backGlass, bump);
      const lensGlass = new THREE.MeshPhysicalMaterial({ color: '#05060a', roughness: 0.04, clearcoat: 1, ior: 1.7 });
      [[0.4, 0.4], [0.4, -0.4], [-0.42, 0]].forEach(([x, y]) => { mesh(puck(0.36, 0.075, 0.02), titanium, bump, x, y, 0.085); mesh(puck(0.28, 0.082, 0.01), lensGlass, bump, x, y, 0.085); mesh(puck(0.11, 0.086, 0.005), blackGlass, bump, x, y, 0.085); });
      mesh(puck(0.1, 0.09, 0.01), new THREE.MeshStandardMaterial({ color: '#fff2c9', roughness: 0.5 }), bump, -0.45, 0.52, 0);

      // ============================================================ the interface
      // Everything on the screen uses one kind of material: it glows with its own colour (a display) and can also be
      // lit (a physical card). update() slides between the two, so the same UI is a screen in the studio and paper
      // inside the push-in. `base` is a texture or a colour.
      const uiMats = [];
      const ui = (base) => {
        const m = new THREE.MeshStandardMaterial({ roughness: 0.82, metalness: 0, envMap: studio, envMapIntensity: 0.3 });
        if (base.isTexture) { m.map = base; m.emissiveMap = base; }
        m.userData.base = new THREE.Color(base.isTexture ? '#ffffff' : base);
        uiMats.push(m); return m;
      };
      // canvas helpers: draw in points; `scale` sets the texture resolution
      const sheet = (w, h, scale, draw) => { const tex = K.canvasTex(Math.round(w * scale), Math.round(h * scale), null); tex.paint = (...a) => { const c = tex.ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, tex.canvas2d.width, tex.canvas2d.height); c.setTransform(scale, 0, 0, scale, 0, 0); draw(c, ...a); tex.needsUpdate = true; }; tex.key = null; return tex; };
      const repaint = (tex, key, ...a) => { if (tex.key !== key) { tex.key = key; tex.paint(...a); } };   // redraw only when what it shows changes
      const say = (c, str, x, y, font, color, align = 'left', spacing = 0) => { c.font = font; c.fillStyle = color; c.textAlign = align; c.textBaseline = 'middle'; c.letterSpacing = spacing + 'px'; c.fillText(str, x, y); c.letterSpacing = '0px'; };
      const pill = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
      const tickPath = (c, x, y, r, p = 1) => { c.beginPath(); c.moveTo(x - 0.42 * r, y + 0.04 * r); c.lineTo(x - 0.12 * r, y + 0.33 * r); c.lineTo(x + 0.45 * r, y - 0.3 * r); c.lineWidth = r * 0.2; c.lineCap = c.lineJoin = 'round'; c.setLineDash([r * 1.3 * p, r * 3]); if (p > 0.01) c.stroke(); c.setLineDash([]); };
      const ICON = {
        book: (c) => { c.beginPath(); c.moveTo(20, 14); c.quadraticCurveTo(14, 10.5, 9, 12.5); c.lineTo(9, 27); c.quadraticCurveTo(14, 25, 20, 28.5); c.quadraticCurveTo(26, 25, 31, 27); c.lineTo(31, 12.5); c.quadraticCurveTo(26, 10.5, 20, 14); c.lineTo(20, 28.5); c.stroke(); },
        focus: (c) => { c.beginPath(); c.arc(20, 20, 10, 0, 7); c.stroke(); c.beginPath(); c.arc(20, 20, 3.2, 0, 7); c.fill(); },
        steps: (c) => { [[15, 23, -0.25], [25, 16, 0.25]].forEach(([x, y, a]) => { c.beginPath(); c.ellipse(x, y, 3.6, 6.4, a, 0, 7); c.fill(); }); },
        home: (c) => { c.beginPath(); c.moveTo(-11, -1); c.lineTo(0, -11); c.lineTo(11, -1); c.lineTo(11, 11); c.lineTo(3.5, 11); c.lineTo(3.5, 3); c.lineTo(-3.5, 3); c.lineTo(-3.5, 11); c.lineTo(-11, 11); c.closePath(); c.fill(); },
        chart: (c) => { [[-10, 2, 9], [-2.5, -10, 21], [5, -3, 14]].forEach(([x, y, h]) => { pill(c, x, y, 5.5, h, 2); c.fill(); }); },
        person: (c) => { c.beginPath(); c.arc(0, -5, 5.5, 0, 7); c.fill(); c.beginPath(); c.arc(0, 15, 11, Math.PI, 0); c.fill(); },
      };

      // --- layer 0: the screen itself. Header, week strip and tab bar stay on the glass.
      const WEEK_Y = 734, weekX = (i) => 39 + i * 52;
      const screenTex = sheet(390, HPT, 3.6, (c) => {
        c.fillStyle = C.paper; c.fillRect(0, 0, 390, HPT);
        pill(c, 139, 13, 112, 33, 16.5); c.fillStyle = '#000'; c.fill();                                        // camera island
        c.beginPath(); c.arc(229, 29.5, 5, 0, 7); c.fillStyle = '#0b0d14'; c.fill();
        say(c, '9:41', 52, 30, '600 16px "Inter"', C.ink, 'center');
        c.fillStyle = C.ink; [0, 1, 2, 3].forEach((i) => { pill(c, 292 + i * 5.5, 34 - i * 2.6, 3.6, 4 + i * 2.6, 1); c.fill(); });   // signal
        pill(c, 322, 23.5, 26, 13, 4); c.globalAlpha = 0.4; c.lineWidth = 1.2; c.strokeStyle = C.ink; c.stroke(); c.globalAlpha = 1; pill(c, 324, 25.5, 17, 9, 2.2); c.fill(); pill(c, 349.5, 27.5, 2, 5, 1); c.fill();   // battery
        say(c, APP.date, 25, 62, '600 11.5px "Inter"', C.muted, 'left', 1.3);
        say(c, APP.title, 23, 87, '600 31px "Fraunces"', C.ink);
        c.beginPath(); c.arc(349, 78, 19, 0, 7); c.fillStyle = C.line; c.fill(); c.save(); c.translate(349, 78); c.beginPath(); c.arc(0, 0, 19, 0, 7); c.clip(); c.scale(0.95, 0.95); c.fillStyle = C.muted; ICON.person(c); c.restore();
        say(c, 'LAST 7 DAYS', 25, 685, '600 11.5px "Inter"', C.muted, 'left', 1.3);
        APP.week.forEach((d, i) => {
          const x = weekX(i), last = i === APP.week.length - 1;
          say(c, d, x, 708, '600 11.5px "Inter"', last ? C.ink : C.muted, 'center');
          c.beginPath(); c.arc(x, WEEK_Y, 15, 0, 7);
          if (!last) { c.fillStyle = C.soft; c.fill(); c.strokeStyle = C.accent; tickPath(c, x, WEEK_Y, 13); return; }
          c.fillStyle = C.card; c.fill(); c.lineWidth = 1.6; c.strokeStyle = '#d6cfc5'; c.setLineDash([3.2, 3.2]); c.stroke(); c.setLineDash([]);
        });
        c.fillStyle = C.line; c.fillRect(0, 769, 390, 1);
        [['home', 75, C.ink], ['chart', 195, '#b9b2a8'], ['person', 315, '#b9b2a8']].forEach(([n, x, col]) => { c.save(); c.translate(x, 797); c.fillStyle = col; ICON[n](c); c.restore(); });
        pill(c, 128, 832, 134, 5, 2.5); c.fillStyle = C.ink; c.fill();
      });
      screenTex.paint();
      const gui = new THREE.Group(); gui.position.z = PD / 2 + 0.0016; phone.add(gui);   // origin = centre of the screen, z = height above it
      const screen = mesh(K.roundedRect(SW, SH, SR, 16), ui(screenTex), gui); screen.castShadow = false;
      // the cover glass: black and additive, so it adds only its reflections on top of whatever is under it
      const GLASS_Z = 0.014;
      const glass = mesh(K.roundedRect(SW, SH, SR, 16), new THREE.MeshPhysicalMaterial({ color: '#000000', roughness: 0.045, ior: 1.6, envMap: studio, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), gui, 0, 0, GLASS_Z, false);
      glass.renderOrder = 10;

      // --- lifting layers. `rest` is where a layer sits while the UI is still flat (stacked a hair apart under the glass).
      const layers = [];
      const layer = (m, [lift, delay], rest, o = {}) => { m.position.z = rest; layers.push(Object.assign({ m, lift, delay, rest, y0: m.position.y }, o)); return m; };
      const TH = 0.034;   // card thickness
      // flat artwork that floats on its own (text, ticks): alpha-blended, casts a shadow through its texture
      const decal = (tex, w, h, x, y, cast = true) => {
        const m = mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }), gui, x, y, 0, false);
        if (cast) { m.castShadow = true; m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 }); }
        return m;
      };

      // hero card with the caption under the ring. `f` (0..1) swaps the caption.
      const heroTex = sheet(HERO.w, HERO.h, 3, (c, f) => {
        c.fillStyle = C.card; c.fillRect(0, 0, HERO.w, HERO.h);
        const out = K.clamp(f * 2), inn = K.clamp(f * 2 - 1);   // the old line leaves before the new one arrives
        c.globalAlpha = 1 - out; say(c, APP.before, HERO.w / 2, 254 - 6 * out, '500 14px "Inter"', C.muted, 'center');
        c.globalAlpha = inn; say(c, APP.after, HERO.w / 2, 254 + 6 * (1 - inn), '600 14px "Inter"', C.accent, 'center'); c.globalAlpha = 1;
      });
      const cx = (b) => sx(b.x + b.w / 2), cy = (b) => sy(b.y + b.h / 2);
      layer(mesh(slab(HERO.w * PT, HERO.h * PT, HERO.r * PT, TH, 0.007), ui(heroTex), gui, cx(HERO), cy(HERO)), LIFT.hero, 0.002, { thick: true });

      // the ring: a pale track, the accent arc that fills, and a round cap at each end of the arc
      const ring = new THREE.Group(); ring.position.set(sx(RING.x), sy(RING.y), 0); gui.add(ring);
      const RT = 0.03, rMid = (RING.out + RING.in) / 2 * PT, rHalf = (RING.out - RING.in) / 2 * PT, accentMat = ui(C.accent);
      mesh(band(RING.in * PT, RING.out * PT, RT * 0.6, 0.006), ui('#ece7df'), ring);
      const arc = mesh(band(RING.in * PT, RING.out * PT, RT, 0.008), accentMat, ring);
      mesh(puck(rHalf, RT, 0.008), accentMat, ring, 0, rMid, 0);
      const capB = mesh(puck(rHalf, RT, 0.008), accentMat, ring);
      layer(ring, LIFT.ring, 0.004, { thick: true });
      // a thin ripple that leaves the ring when it closes
      const ripple = decal(K.canvasTex(512, 512, (c) => { c.strokeStyle = C.accent; c.lineWidth = 9; c.beginPath(); c.arc(256, 256, 244, 0, 7); c.stroke(); }), 2, 2, sx(RING.x), sy(RING.y), false);

      // the counter: two digit columns that roll. u = [tens, units] progress 0..1 (above 1 while overshooting)
      const NPX = 300, NW = 720, NH = 420, NB = 318, numPt = 82;
      const numTex = sheet(NW, NH, 1, (c, u) => {
        c.font = '600 300px "Fraunces"'; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = C.ink;
        const a = String(APP.from), b = String(APP.to), xa = NW / 2 - c.measureText(a).width / 2, xb = NW / 2 - c.measureText(b).width / 2;
        for (let i = 0; i < a.length; i++) {
          const same = a[i] === b[i], ui_ = same ? 0 : u[i];
          if (ui_ < 1.2) c.fillText(a[i], xa + c.measureText(a.slice(0, i)).width, NB - ui_ * NPX);                  // old digit leaves upward
          if (ui_ > 0) c.fillText(b[i], xb + c.measureText(b.slice(0, i)).width, NB + (1 - ui_) * NPX);              // new digit arrives from below
        }
        // soft top and bottom to the window the digits roll through
        const g = c.createLinearGradient(0, 0, 0, NH); g.addColorStop(0.05, 'rgba(0,0,0,0)'); g.addColorStop(0.17, '#000'); g.addColorStop(0.83, '#000'); g.addColorStop(0.95, 'rgba(0,0,0,0)');
        c.globalCompositeOperation = 'destination-in'; c.fillStyle = g; c.fillRect(0, 0, NW, NH); c.globalCompositeOperation = 'source-over';
      });
      const nUnit = numPt * PT / NPX;
      const number = layer(decal(numTex, NW * nUnit, NH * nUnit, sx(RING.x), sy(RING.y - 9) + (NB - NH / 2 - 105) * nUnit), LIFT.number, 0.008, { blend: true });
      const unit = K.textPlane(APP.unit, { font: '600 44px "Inter"', height: 11 * PT, color: C.muted, letterSpacing: 7 });
      unit.position.set(sx(RING.x) + 0.012, sy(RING.y + 44), 0); gui.add(unit); layer(unit, LIFT.unit, 0.008, { blend: true });

      // habit rows: card, icon tile and words in one texture; the checkbox is its own little object above the card
      const tickTex = sheet(64, 64, 4, (c, p) => { c.strokeStyle = '#fff'; tickPath(c, 32, 32, 27, p); });
      const tickDone = sheet(64, 64, 4, (c) => { c.strokeStyle = '#fff'; tickPath(c, 32, 32, 27, 1); }); tickDone.paint();
      const rows = HABITS.map((hb, i) => {
        const b = ROW(i), tex = sheet(b.w, b.h, 3.6, (c) => {
          c.fillStyle = C.card; c.fillRect(0, 0, b.w, b.h);
          pill(c, 14, 13, 40, 40, 12); c.fillStyle = C.tile; c.fill();
          c.save(); c.translate(14, 13); c.strokeStyle = c.fillStyle = C.ink; c.lineWidth = 1.9; c.lineJoin = c.lineCap = 'round'; ICON[hb.icon](c); c.restore();
          say(c, hb.title, 68, 24.5, '600 16px "Inter"', C.ink); say(c, hb.sub, 68, 44.5, '400 13px "Inter"', C.muted);
        });
        tex.paint();
        const lift = LIFT['row' + i], x = sx(CHECK_X), y = cy(b), r = CHECK_R * PT;
        const card = layer(mesh(slab(b.w * PT, b.h * PT, b.r * PT, TH, 0.007), ui(tex), gui, cx(b), y), lift, 0.002, { thick: true, row: i });
        const chk = [lift[0] + LIFT.check, lift[1] - 0.05], o = { thick: true, row: i };
        if (i > 0) {   // already done: accent disc and a white tick
          layer(mesh(puck(r, 0.022, 0.006), accentMat, gui, x, y), chk, 0.004, o);
          layer(decal(tickDone, r * 2, r * 2, x, y, false), [chk[0] + 0.024, chk[1]], 0.007, { blend: true, row: i });
          return { card };
        }
        // not done yet: an empty circle (grey rim, white centre), then the accent disc that grows over it and the tick that draws
        layer(mesh(puck(r, 0.016, 0.005), ui('#d8d1c7'), gui, x, y), chk, 0.004, o);
        layer(mesh(puck(r * 0.86, 0.018, 0.004), ui(C.card), gui, x, y), chk, 0.0045, o);
        const fill = layer(mesh(puck(r, 0.024, 0.006), accentMat, gui, x, y), chk, 0.005, o);
        const tick = layer(decal(tickTex, r * 2, r * 2, x, y, false), [chk[0] + 0.026, chk[1]], 0.007, { blend: true, row: i });
        return { card, fill, tick, x, y };
      });
      // the fingertip: a soft translucent dot, the way phone makers show a touch
      const touch = decal(K.canvasTex(256, 256, (c) => {
        const g = c.createRadialGradient(128, 128, 0, 128, 128, 126); g.addColorStop(0, 'rgba(60,54,48,0.42)'); g.addColorStop(0.86, 'rgba(60,54,48,0.46)'); g.addColorStop(1, 'rgba(60,54,48,0)');
        c.fillStyle = g; c.fillRect(0, 0, 256, 256);
      }), 0.52, 0.52, rows[0].x, rows[0].y, false);
      touch.renderOrder = 30;

      // ============================================================ motion
      const kick = (x, f, d) => (x > 0 ? Math.exp(-d * x) * Math.sin(2 * Math.PI * f * x) : 0);   // a short ring-down that starts and ends at 0
      const yaw = K.track([[-1.2, -0.74], [T.turnEnd, 0, 'inOut']]);
      const WY = PH / 2, FRONT = PD / 2;
      const numberAt = [sx(RING.x), WY + sy(RING.y), FRONT + LIFT.number[0]], checkAt = [rows[0].x, WY + rows[0].y, FRONT + LIFT.row0[0] + LIFT.check];
      const aimB = [0.04, WY + sy(352.5), FRONT + 0.2];
      const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
      const focusAt = K.track([[T.touch - 0.35, numberAt], [T.touch, checkAt, 'inOut'], [T.tick + 0.25, checkAt], [T.ring[1] - 0.2, numberAt, 'inOut']]);

      return {
        update(t) {
          const inside = K.seg(t, T.push[0], T.push[1], K.ease.inOut);    // 0 in the studio, 1 inside the screen
          const paper = K.seg(t, T.lift - 0.4, T.lift + 0.4, K.ease.inOut);               // display glow hands over to studio light
          phone.rotation.y = yaw(t);
          for (const m of uiMats) { m.color.copy(m.userData.base).multiplyScalar(paper); m.emissive.copy(m.userData.base).multiplyScalar(K.lerp(1, GLOW, paper)); }
          sun.intensity = SUN * paper;
          sun.position.x = -7.2 + 0.4 * (t - T.lift);   // the light keeps drifting, so the shadows are never frozen
          glass.material.envMapIntensity = K.lerp(1, 0.25, paper); scene.environmentIntensity = K.lerp(1, 0.45, paper);   // the studio dims as the interface takes over

          // --- the interaction
          const press = K.seg(t, T.touch, T.touch + 0.13, K.ease.out) * (1 - K.spring(t - T.tick, 3.4, 0.36));   // the card sinks under the finger, then springs back
          const done = K.spring(t - T.tick, 3.2, 0.42);
          const ringFill = (2 / 3) * K.seg(t, -0.5, 1.6, K.ease.out) + (1 / 3) * K.seg(t, T.ring[0], T.ring[1], K.ease.inOut);
          const pop = kick(t - T.roll, 2.6, 6.5);

          // --- layers leave the glass, each with its own delay and height
          for (const L of layers) {
            const p = K.spring(t - T.lift - L.delay, 1.45, 0.6);
            L.m.position.z = L.rest + L.lift * p - (L.row === 0 ? 0.075 * press : 0);
            if (L.thick) L.m.scale.z = K.clamp(p, 0.02, 1);                    // flat as a pixel on the screen, a real slab in the air
            if (L.blend) L.m.renderOrder = L.m.position.z > GLASS_Z ? 20 : 5;   // under the glass its reflection covers it, above it does not
          }
          // ring: show the first part of the arc and park the end cap on its tip
          const g = arc.geometry, a = ringFill * Math.PI * 2;
          g.setDrawRange(0, Math.round(ringFill * g.userData.segs) * g.userData.perSeg);
          capB.position.set(Math.sin(a) * rMid, Math.cos(a) * rMid, 0);
          ring.scale.x = ring.scale.y = 1 + 0.07 * pop; ring.position.z += 0.05 * pop;
          const rp = K.seg(t, T.roll, T.roll + 0.7, K.ease.out);
          ripple.position.z = ring.position.z + 0.01; ripple.scale.setScalar((RING.out * PT) * (1 + 0.42 * rp)); ripple.material.opacity = 0.55 * (1 - rp) * (t > T.roll ? 1 : 0); ripple.renderOrder = 20;
          // counter: units first, tens a beat later, both overshoot and settle; drawn again only while they move
          const u = [K.ease.outBack(K.seg(t, T.roll + 0.07, T.roll + 0.5), 1.25), K.ease.outBack(K.seg(t, T.roll, T.roll + 0.43), 1.25)];
          repaint(numTex, u.map((v) => Math.round(v * 500)).join(), u);
          number.position.z += 0.07 * kick(t - T.roll - 0.3, 2.2, 6);
          // checkbox and caption
          const r0 = rows[0];
          r0.fill.scale.x = r0.fill.scale.y = Math.max(0.001, done); r0.fill.visible = t > T.tick;
          repaint(tickTex, Math.round(K.seg(t, T.tick + 0.05, T.tick + 0.3, K.ease.inOut) * 40), K.seg(t, T.tick + 0.05, T.tick + 0.3, K.ease.inOut));
          const cap = Math.round(K.seg(t, T.roll + 0.1, T.roll + 0.45, K.ease.inOut) * 12) / 12; repaint(heroTex, cap, cap);
          // fingertip: drifts in from below right, lands, rides the card down, lifts away
          const arrive = K.seg(t, T.touch - 0.42, T.touch, K.ease.out), leave = K.seg(t, T.tick, T.tick + 0.3, K.ease.inOut);
          touch.position.set(r0.x + 0.5 * (1 - arrive), r0.y - 0.62 * (1 - arrive), r0.card.position.z + TH + LIFT.check + 0.05 + 0.22 * (1 - arrive) + 0.3 * leave);
          touch.scale.setScalar(1 + 0.25 * (1 - arrive) - 0.12 * K.seg(t, T.touch, T.touch + 0.13) * (1 - leave) + 0.3 * leave);
          touch.material.opacity = arrive * (1 - leave);

          // --- camera: a slow drift in the studio, a slow arc inside the screen, one eased blend between the two.
          // Both ends keep moving, so the camera never comes to a dead stop.
          const s = t - T.push[1], az = 0.13 - 0.05 * s, el = -0.54, d = 6.77 - 0.012 * s;
          const posA = [2.6 - 0.4 * t, 3.3 + 0.35 * t, 22.3 - 1.1 * t], aimA = [-1.2, 4.0, 0];
          const posB = [aimB[0] + d * Math.sin(az) * Math.cos(el), aimB[1] + d * Math.sin(el), aimB[2] + d * Math.cos(az) * Math.cos(el)];
          const pos = mix(posA, posB, inside), aim = mix(aimA, aimB, inside);
          K.look(camera, pos, aim);
          K.focus(camera, mix([0, WY, 0], focusAt(t), inside), K.lerp(0.5, 0.085, inside));
        },
      };
    },

    sound(k) {
      // a quiet room and a held chord; the push-in is air, the layers are small glassy pops rising in pitch,
      // the touch is a soft tap, the ring a rising tone that the counter answers with a two-note chime
      k.bed('room', 0, 8, { gain: 0.5 });
      k.music('pad', 0, 8, { bpm: 60, gain: 0.45, chords: [['D3', 'A3', 'E4', 'F#4'], ['G3', 'D4', 'F#4', 'A4']] });
      k.play('swish', 0.42, { gain: 0.22, dur: 0.3 }); k.play('swish', 1.0, { gain: 0.16, dur: 0.26 });   // light sliding over the glass
      k.play('whoosh', T.push[0] + 0.2, { gain: 0.9, dur: 1.8, top: 1500 });
      k.withMinor(() => Object.entries(LIFT).filter(([, v]) => Array.isArray(v)).forEach(([, [h, delay]], i) => k.play('pop', T.lift + delay + 0.05, { gain: 0.45, f: 520 + h * 900, pan: i % 2 ? 0.25 : -0.25 })));
      k.play('tock', T.touch, { gain: 0.65, f: 420 });
      k.play('click', T.tick, { gain: 0.85 }); k.play('pop', T.tick + 0.02, { gain: 0.75, f: 880 });
      k.tone(T.ring[0], { f: [[0, 294], [T.ring[1] - T.ring[0], 587]], type: 'sine', dur: T.ring[1] - T.ring[0] + 0.1, gain: 0.1, a: 0.35, verb: 0.2 });
      k.noise(T.ring[0], { dur: T.ring[1] - T.ring[0], color: 'pink', filter: 'bandpass', f: [[0, 900], [T.ring[1] - T.ring[0], 3200]], q: 1.4, gain: 0.05, a: 0.5 });
      k.withMinor(() => [0, 0.08, 0.16, 0.24].forEach((d, i) => k.play('tick', T.roll + 0.04 + d, { gain: 0.35, f: 3000 + i * 300 })));
      k.play('success', T.roll + 0.3, { gain: 0.9, f: 'D6' });
      k.play('thud', T.roll + 0.3, { gain: 0.3, f: 110 });
    },
  });
}
```
