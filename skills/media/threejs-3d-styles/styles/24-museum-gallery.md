# Museum Gallery (#24)

- **id:** `museum-gallery`
- **Category:** Spaces and journeys
- **Use:** explainer
- **Reference duration:** 9 s
- **Google Fonts:** DM Serif Display, Oswald, Space Mono
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`

## Style card

- **Look:** A dark gallery hall at night: gilt-framed posters on a deep green damask wall, each in its own tight pool of warm spotlight with the beam hanging in the air, a brass plaque beside every frame, a rope barrier and a polished stone floor that mirrors it all.
- **Motion:** One unbroken dolly move in three kinds of shot: it opens wide and oblique on the first exhibit with the others waiting down the wall, tracks past the middle ones at medium distance, and ends pushing in on the last. Each exhibit's lamps click on just before the gaze leaves for it, and the ones already seen sink back to a glow.
- **Light:** One tight ceiling spot per artwork and a smaller one per plaque, warm, with deep shadow between the pools and no ambient light. Lamps that are off still glow faintly so the frames ahead read in the dark. The last exhibit swells to one and a half times the light of the others during the final push-in.
- **Materials:** Flat poster-style prints (drawn in 2D) in black-and-gold frames with real depth, engraved brushed brass, brass posts with velvet rope, woven wall fabric, dark polished stone.
- **Camera:** A long lens on a low dolly, shallow focus pulled from exhibit to exhibit. The gaze lingers on each exhibit and travels quickly between them while the dolly itself never stops; the frame and its plaque fill most of the picture, with a strip of mirror floor underneath.
- **Finish:** Real depth of field and soft shadows, gentle bloom on the brightest print, filmic contrast with true blacks, a clear vignette and fine grain.
- **Good for:** Lists and timelines of three to five points: each point is one framed poster with a plaque (a year or number, plus a few words), visited in order, with the last one as the conclusion.

## Reference

- **Sample topic:** Four moments that led to AI today: Turing's question, Deep Blue, AlphaGo and ChatGPT
- **Gallery description:** A dark gallery hall at night: gilt-framed posters on a deep green damask wall, each in its own tight pool of warm spotlight with the beam hanging in the air, a brass plaque beside every frame, a rope barrier and a polished stone floor that mirrors it all.
- **Shown in the sample clip:** Four moments that led to AI today: Turing's question, Deep Blue, AlphaGo and ChatGPT

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/museum-gallery.js`)

```js
{
  // ---------------------------------------------------------------- content (change this for a new topic)
  // One exhibit per point of the list or timeline: a big number or word for the plaque, a few words under it, and a
  // poster drawn on a 2D canvas (see POSTERS below). The last exhibit is the point of the story and is lit brightest.
  const EXHIBITS = [
    { year: '1950', lines: ['ALAN TURING ASKS', '“CAN MACHINES THINK?”'], art: 'question' },
    { year: '1997', lines: ['DEEP BLUE BEATS', 'KASPAROV AT CHESS'], art: 'chess' },
    { year: '2016', lines: ['ALPHAGO BEATS', 'LEE SEDOL AT GO'], art: 'go' },
    { year: '2022', lines: ['CHATGPT', 'LAUNCHES'], art: 'chat' },
  ];

  // ---------------------------------------------------------------- the walk (picture and sound share these times)
  const DUR = 9, N = EXHIBITS.length, LAST = N - 1;
  const GAP = 7.4;                                  // distance between exhibits along the wall
  const PASS = [1.2, 3.2, 5.3, 7.1];                // when the gaze is square on each exhibit (first: when it leaves; last: when it arrives)
  const LINGER = 0.55;                              // the gaze almost stops for this long either side of that moment
  const LIGHT_ON = EXHIBITS.map((_, i) => (i === 0 ? -9 : i === 1 ? PASS[0] - 0.3 : PASS[i - 1] + LINGER - 0.25));   // each exhibit's lamps click on just before the gaze leaves for it
  const LABEL_LAG = 0.14;                           // the plaque lamp follows the picture lamp
  const SWELL = [PASS[LAST] - 0.5, DUR - 0.6];      // the last exhibit keeps brightening while the camera pushes in
  const STANDBY = 0.07;                             // lamps that are off still glow a little, so the frames ahead read in the dark
  const exX = (i) => i * GAP;                       // centre of exhibit i (frame on the left, plaque on the right)
  // a lamp switched on dt seconds ago: 0 before, a fast rise, one flicker as it catches, a small overshoot, then steady
  const lamp = (dt) => (dt <= 0 ? 0 : (1 - Math.exp(-dt / 0.09)) * (1 + 0.3 * Math.exp(-dt / 0.22)) * (dt > 0.07 && dt < 0.12 ? 0.35 : 1));

  // ---------------------------------------------------------------- the artworks: bold 2D posters on canvas
  // Each poster is flat shapes in three or four inks, 1024 x 1280. The 3D scene only frames and lights them.
  const CREAM = '#efe5cc', INK = '#15141a', RED = '#e2492a';
  const LIGHT_PAPER = ['go', 'chat'];               // posters with a pale ground get a dark keyline instead of a cream one
  const king = (c, x, y, s, fill, shade) => {       // a chess king, base centre at (x, y), s = height in px
    c.save(); c.translate(x, y); c.scale(s, -s);
    for (const side of [1, -1]) {
      c.save(); c.scale(side, 1); c.beginPath();
      c.moveTo(-0.004, 0); c.lineTo(0.3, 0); c.lineTo(0.3, 0.05); c.quadraticCurveTo(0.29, 0.1, 0.21, 0.12); c.lineTo(0.235, 0.15); c.lineTo(0.19, 0.18);
      c.quadraticCurveTo(0.09, 0.32, 0.105, 0.56); c.lineTo(0.175, 0.575); c.lineTo(0.175, 0.615); c.lineTo(0.115, 0.63);
      c.quadraticCurveTo(0.11, 0.72, 0.2, 0.8); c.quadraticCurveTo(0.12, 0.86, 0.04, 0.855);
      c.lineTo(0.04, 0.9); c.lineTo(0.09, 0.9); c.lineTo(0.09, 0.955); c.lineTo(0.04, 0.955); c.lineTo(0.04, 1); c.lineTo(-0.004, 1); c.closePath();
      c.fillStyle = side > 0 && shade ? shade : fill; c.fill(); c.restore();     // one half a shade darker, like cut paper
    }
    c.restore();
  };
  const gear = (c, x, y, r, teeth, fill, hole) => {
    c.save(); c.translate(x, y); c.fillStyle = fill; c.beginPath();
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2, w = Math.PI / teeth;
      c.lineTo(Math.cos(a - w * 0.55) * r * 0.78, Math.sin(a - w * 0.55) * r * 0.78); c.lineTo(Math.cos(a - w * 0.3) * r, Math.sin(a - w * 0.3) * r);
      c.lineTo(Math.cos(a + w * 0.3) * r, Math.sin(a + w * 0.3) * r); c.lineTo(Math.cos(a + w * 0.55) * r * 0.78, Math.sin(a + w * 0.55) * r * 0.78);
    }
    c.closePath(); c.fill(); c.fillStyle = hole; c.beginPath(); c.arc(0, 0, r * 0.3, 0, 7); c.fill(); c.restore();
  };
  const bubble = (c, x, y, w, h, r, fill, tail) => {   // a chat bubble with a small tail at one bottom corner
    c.fillStyle = fill; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill();
    const tx = tail < 0 ? x + r * 0.9 : x + w - r * 0.9;
    c.beginPath(); c.moveTo(tx - 60, y + h - 30); c.lineTo(tx + 60, y + h - 30); c.lineTo(tx + tail * 95, y + h + 80); c.closePath(); c.fill();
  };
  const POSTERS = {
    // 1950: a question mark whose dot is one cell of a Turing-machine tape
    question(c, w, h) {
      c.fillStyle = '#0f4a4d'; c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(255,255,255,0.055)'; c.lineWidth = 34;
      for (let r = 150; r < 1100; r += 105) { c.beginPath(); c.arc(w / 2, 1010, r, 0, 7); c.stroke(); }
      const cx = w / 2, cy = 430, R = 205;
      c.strokeStyle = CREAM; c.lineWidth = 150; c.lineJoin = 'round'; c.beginPath();
      c.arc(cx, cy, R, Math.PI * 1.02, Math.PI * 0.28);
      c.quadraticCurveTo(cx, cy + R * 1.0, cx, cy + R * 1.5); c.lineTo(cx, cy + R * 1.95); c.stroke();
      c.fillStyle = CREAM; c.fillRect(-10, 925, w + 20, 170);                                   // the tape
      c.fillStyle = '#0f4a4d'; c.font = '700 112px "Space Mono"'; c.textAlign = 'center'; c.textBaseline = 'middle';
      for (let k = -3; k <= 3; k++) {
        c.fillRect(cx + (k - 0.5) * 170 - 3, 925, 6, 170);
        if (k) c.fillText('101 011'[k + 3], cx + k * 170, 1016);
        c.beginPath(); c.arc(cx + k * 170, 944, 6, 0, 7); c.fill(); c.beginPath(); c.arc(cx + (k + 0.5) * 170, 944, 6, 0, 7); c.fill();   // sprocket holes
      }
      gear(c, cx, 1016, 62, 9, RED, CREAM);
    },
    // 1997: the machine's king stands, the champion's king lies on the board
    chess(c, w, h) {
      const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2553dc'); g.addColorStop(1, '#17389f');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(255,255,255,0.075)';
      for (let i = 0; i < 16; i += 2) { c.beginPath(); c.moveTo(380, 600); c.arc(380, 600, 1500, (i / 16) * Math.PI * 2, ((i + 1) / 16) * Math.PI * 2); c.closePath(); c.fill(); }
      const vp = [512, 520], rows = [880, 938, 1014, 1118, 1262, 1460], colX = (j, y) => vp[0] + (j * 262) * (y - vp[1]) / (1280 - vp[1]);
      for (let r = 0; r < rows.length - 1; r++) for (let j = -5; j < 5; j++) {
        c.fillStyle = (r + j) & 1 ? CREAM : '#0d1f66';
        c.beginPath(); c.moveTo(colX(j, rows[r]), rows[r]); c.lineTo(colX(j + 1, rows[r]), rows[r]); c.lineTo(colX(j + 1, rows[r + 1]), rows[r + 1]); c.lineTo(colX(j, rows[r + 1]), rows[r + 1]); c.closePath(); c.fill();
      }
      c.fillStyle = 'rgba(5,10,40,0.45)'; c.beginPath(); c.ellipse(420, 1068, 260, 42, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(770, 1196, 250, 34, 0, 0, 7); c.fill();
      king(c, 380, 1062, 760, CREAM, '#d5c8a8');
      c.save(); c.translate(545, 1150); c.rotate(1.66); king(c, 0, 0, 440, RED, '#b93518'); c.restore();
    },
    // 2016: a close crop of a Go board with one stone ringed (the move nobody expected)
    go(c, w, h) {
      c.fillStyle = '#e2ae55'; c.fillRect(0, 0, w, h);
      const r = K.rng(3);
      c.strokeStyle = 'rgba(120,66,14,0.13)'; c.lineWidth = 5;
      for (let i = 0; i < 40; i++) { const y = r.range(-50, h + 50), a = r.range(8, 30); c.beginPath(); c.moveTo(-20, y); c.bezierCurveTo(w * 0.3, y + a, w * 0.6, y - a, w + 20, y + r.range(-20, 20)); c.stroke(); }
      c.save(); c.translate(w / 2, h / 2); c.rotate(-0.1);
      const G = 158, P = (i, j) => [(i - 3) * G, (j - 4) * G];
      c.strokeStyle = '#1b140c'; c.lineWidth = 7; c.beginPath();
      for (let i = -3; i <= 9; i++) { c.moveTo(P(i, 0)[0], -1100); c.lineTo(P(i, 0)[0], 1100); }
      for (let j = -3; j <= 11; j++) { c.moveTo(-1100, P(0, j)[1]); c.lineTo(1100, P(0, j)[1]); }
      c.stroke();
      c.fillStyle = '#1b140c'; c.beginPath(); c.arc(...P(5, 2), 17, 0, 7); c.fill();
      const stone = (i, j, black) => {
        const [x, y] = P(i, j), R = 68;
        c.fillStyle = 'rgba(70,35,0,0.35)'; c.beginPath(); c.arc(x + 9, y + 12, R, 0, 7); c.fill();
        c.fillStyle = black ? INK : '#f8f3e7'; c.beginPath(); c.arc(x, y, R, 0, 7); c.fill();
        c.strokeStyle = black ? 'rgba(255,255,255,0.3)' : 'rgba(60,40,10,0.22)'; c.lineWidth = 9; c.beginPath(); c.arc(x, y, R - 17, black ? 3.5 : 0.3, black ? 4.8 : 1.6); c.stroke();
      };
      [[2, 2], [3, 2], [4, 3], [1, 4], [2, 5], [5, 6], [3, 7], [1, 1], [5, 3]].forEach(([i, j]) => stone(i, j, false));
      [[2, 3], [3, 3], [3, 4], [4, 4], [2, 6], [1, 6], [4, 7], [5, 1]].forEach(([i, j]) => stone(i, j, true));
      stone(4, 5, true);
      c.strokeStyle = RED; c.lineWidth = 15; c.beginPath(); c.arc(...P(4, 5), 31, 0, 7); c.stroke();       // the last-move marker
      c.lineWidth = 9; c.beginPath(); c.arc(...P(4, 5), 80, 0, 7); c.stroke();
      c.restore();
    },
    // 2022: a prompt and an answer being typed
    chat(c, w, h) {
      c.fillStyle = '#efeadc'; c.fillRect(0, 0, w, h);
      bubble(c, 400, 170, 500, 250, 80, INK, 1);
      c.fillStyle = '#f6f2e8'; c.beginPath(); c.roundRect(470, 245, 360, 34, 17); c.fill(); c.beginPath(); c.roundRect(470, 310, 230, 34, 17); c.fill();
      bubble(c, 120, 560, 760, 470, 120, '#11a37f', -1);
      c.fillStyle = '#f6f2e8'; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(330 + k * 170, 795, 50 - k * 4, 0, 7); c.fill(); }
    },
  };
  // print finish shared by all posters: a keyline, a series numeral, a little ink speckle
  const drawPoster = (K, name, index) => K.canvasTex(1024, 1280, (c, w, h) => {
    POSTERS[name](c, w, h);
    const line = LIGHT_PAPER.includes(name) ? 'rgba(21,20,26,0.85)' : 'rgba(239,229,204,0.9)', roman = ['I', 'II', 'III', 'IV', 'V', 'VI'];
    c.strokeStyle = line; c.lineWidth = 6; c.strokeRect(44, 44, w - 88, h - 88);
    c.fillStyle = line; c.font = '400 54px "DM Serif Display"'; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText(roman[index] + ' / ' + roman[LAST], 74, h - 76);
    const r = K.rng(20 + index);
    for (let i = 0; i < 5000; i++) { c.fillStyle = r.chance(0.5) ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'; c.fillRect(r.range(0, w), r.range(0, h), r.range(1, 3.5), r.range(1, 3.5)); }
  });
  // the brass plaque: brushed metal with the year and the caption engraved and filled dark
  const drawPlaque = (K, ex) => K.canvasTex(1300, 950, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#d2ab62'); g.addColorStop(1, '#bd9349');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const r = K.rng('brass' + ex.year);
    for (let i = 0; i < 2600; i++) { c.fillStyle = r.chance(0.5) ? `rgba(255,236,190,${r.range(0.02, 0.09)})` : `rgba(70,40,5,${r.range(0.02, 0.08)})`; c.fillRect(r.range(-200, w), r.range(0, h), r.range(80, 520), r.range(1, 2.5)); }   // brushing
    const engrave = (fn) => { c.save(); c.translate(2, 3); c.fillStyle = c.strokeStyle = 'rgba(255,240,200,0.55)'; fn(); c.restore(); c.fillStyle = c.strokeStyle = '#1c1206'; fn(); };   // a light lower edge makes it read as cut in
    engrave(() => { c.lineWidth = 5; c.strokeRect(38, 38, w - 76, h - 76); });
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    engrave(() => { c.font = '400 440px "DM Serif Display"'; c.fillText(ex.year, w / 2, 470); });
    engrave(() => { c.fillRect(w / 2 - 300, 540, 240, 5); c.fillRect(w / 2 + 60, 540, 240, 5); c.save(); c.translate(w / 2, 542); c.rotate(Math.PI / 4); c.fillRect(-13, -13, 26, 26); c.restore(); });
    engrave(() => { c.font = '500 118px "Oswald"'; c.letterSpacing = '5px'; ex.lines.forEach((l, i) => c.fillText(l, w / 2 + 2, 700 + i * 150)); });
  });

  registerStyle({
    id: 'museum-gallery',
    name: 'Museum Gallery',
    family: 'Spaces and journeys',
    look: 'A dark gallery hall at night: gilt-framed posters on a deep green damask wall, each in its own tight pool of warm spotlight with the beam hanging in the air, a brass plaque beside every frame, a rope barrier and a polished stone floor that mirrors it all.',
    motion: 'One unbroken dolly move in three kinds of shot: it opens wide and oblique on the first exhibit with the others waiting down the wall, tracks past the middle ones at medium distance, and ends pushing in on the last. Each exhibit\'s lamps click on just before the gaze leaves for it, and the ones already seen sink back to a glow.',
    light: 'One tight ceiling spot per artwork and a smaller one per plaque, warm, with deep shadow between the pools and no ambient light. Lamps that are off still glow faintly so the frames ahead read in the dark. The last exhibit swells to one and a half times the light of the others during the final push-in.',
    materials: 'Flat poster-style prints (drawn in 2D) in black-and-gold frames with real depth, engraved brushed brass, brass posts with velvet rope, woven wall fabric, dark polished stone.',
    camera: 'A long lens on a low dolly, shallow focus pulled from exhibit to exhibit. The gaze lingers on each exhibit and travels quickly between them while the dolly itself never stops; the frame and its plaque fill most of the picture, with a strip of mirror floor underneath.',
    post: 'Real depth of field and soft shadows, gentle bloom on the brightest print, filmic contrast with true blacks, a clear vignette and fine grain.',
    explains: 'Lists and timelines of three to five points: each point is one framed poster with a plaque (a year or number, plus a few words), visited in order, with the last one as the conclusion.',
    topic: 'Four moments that led to AI today: Turing\'s question, Deep Blue, AlphaGo and ChatGPT',
    duration: DUR,
    fonts: ['400 440px "DM Serif Display"', '500 118px "Oswald"', '700 112px "Space Mono"'],
    render: { samples: 40, shutter: 0.25, tone: 'filmic', exposure: 1.1, bloom: 0.35, bloomThreshold: 1.4, vignette: 0.4, grain: 0.015, fov: 30, background: '#020203' },

    build(S) {
      const { THREE, K, scene, camera } = S;
      const add = (geo, mat, x, y, z, cast = true, parent = scene) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; };
      const MID = exX(LAST) / 2;

      // ---- the hall: almost no ambient light, so everything between the pools falls to black
      // The reflection environment is given to the metals only (envMap), not to the whole scene: matte surfaces then get
      // no ambient light at all and an unlit exhibit stays a dim shape until its lamp comes on.
      const envMap = K.env(S, { top: '#040506', horizon: '#080a0e', bottom: '#010101', panels: [
        { pos: [0, 16, 9], size: [34, 1.6], color: '#ffd9a6', power: 6 },      // the lamp track, for the brass and gilt to reflect
        { pos: [-18, 7, 10], size: [3, 9], color: '#7fa2dc', power: 1.2 },        // a tall night window somewhere down the hall
      ] });
      scene.environment = null;
      const night = new THREE.DirectionalLight('#6f93d6', 0.12); night.position.set(-25, 9, 9); night.target.position.set(0, 1, 0); scene.add(night, night.target);   // a little moonlight from behind the camera

      // wall: woven damask, a pattern you only see where a lamp hits it
      const damask = K.canvasTex(512, 512, (c, w) => {
        c.fillStyle = '#1b3a31'; c.fillRect(0, 0, w, w);
        const leaf = (x, y, s, fill) => { c.fillStyle = fill; c.beginPath(); c.moveTo(x, y - 150 * s); c.quadraticCurveTo(x + 105 * s, y - 30 * s, x, y + 150 * s); c.quadraticCurveTo(x - 105 * s, y - 30 * s, x, y - 150 * s); c.fill(); };
        for (const [x, y] of [[256, 256], [0, 0], [512, 0], [0, 512], [512, 512]]) {
          leaf(x, y, 1.25, 'rgba(255,255,255,0.035)'); leaf(x, y, 0.95, 'rgba(0,0,0,0.13)'); leaf(x, y + 14, 0.55, 'rgba(255,255,255,0.04)'); leaf(x, y + 20, 0.22, 'rgba(0,0,0,0.14)');
          c.fillStyle = 'rgba(255,255,255,0.04)'; c.beginPath(); c.arc(x, y - 215, 15, 0, 7); c.fill(); c.beginPath(); c.arc(x, y + 215, 15, 0, 7); c.fill();
        }
        c.fillStyle = 'rgba(0,0,0,0.1)'; for (let y = 0; y < w; y += 4) c.fillRect(0, y, w, 1.5);     // the weave
      }, { repeat: [80 / 0.8, 10 / 0.8] });
      add(new THREE.PlaneGeometry(80, 10), new THREE.MeshStandardMaterial({ map: damask, roughness: 0.93 }), MID, 5, 0, false);
      const wood = new THREE.MeshStandardMaterial({ color: '#3a2314', roughness: 0.3, envMap, envMapIntensity: 0.6 });
      add(K.roundedBox(80, 0.24, 0.1, 0.03, 3), wood, MID, 0.12, 0.05);                               // walnut skirting board

      // floor: polished dark stone laid on the diagonal, a real mirror
      const stone = K.canvasTex(512, 512, (c, w) => {
        const r = K.rng(8);
        for (let i = 0; i < 4; i++) { c.fillStyle = (i % 3) ? '#2b2a2a' : '#1a1a1b'; c.fillRect((i & 1) * 256, (i >> 1) * 256, 256, 256); }
        c.strokeStyle = 'rgba(255,255,255,0.05)'; c.lineWidth = 2;
        for (let i = 0; i < 26; i++) { const x = r.range(0, w), y = r.range(0, w); c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + r.range(-90, 90), y + r.range(-90, 90), x + r.range(-160, 160), y + r.range(-160, 160), x + r.range(-240, 240), y + r.range(-240, 240)); c.stroke(); }
        c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(0, 0, w, 3); c.fillRect(0, 256, w, 3); c.fillRect(0, 0, 3, w); c.fillRect(256, 0, 3, w);
      }, { repeat: [40, 40] });
      stone.rotation = Math.PI / 4;
      const floor = K.mirrorFloor(S, { y: 0, size: 140, color: '#ffffff', surfaceRoughness: 0.42, roughness: 0.05, strength: 0.55, fresnel: false, material: { map: stone } });
      floor.position.x = MID;

      // ---- one exhibit: frame with depth, print, plaque, two lamps and their beams
      const ART_W = 2.5, ART_H = 3.125, FRAME = 0.3, ART_Y = 2.4, PLQ_W = 2.6, PLQ_H = 1.9;
      const FW = ART_W + FRAME * 2, FH = ART_H + FRAME * 2, UNIT = FW + 0.4 + PLQ_W;
      const LAMP_Y = 8.2, LAMP_Z = 3.3;
      const gilt = new THREE.MeshStandardMaterial({ color: '#c69a4c', metalness: 0.85, roughness: 0.36, envMap });
      const lacquer = new THREE.MeshStandardMaterial({ color: '#0b0908', roughness: 0.28, envMap, envMapIntensity: 0.5 });
      const brass = new THREE.MeshStandardMaterial({ color: '#c8a050', metalness: 1, roughness: 0.3, envMap, envMapIntensity: 1.3 });
      const ring = (ow, oh, iw, ih, depth, bevel) => {        // a rectangular moulding: outer size, opening, depth, rounded edge
        const s = new THREE.Shape(); s.moveTo(-ow / 2, -oh / 2); s.lineTo(ow / 2, -oh / 2); s.lineTo(ow / 2, oh / 2); s.lineTo(-ow / 2, oh / 2); s.closePath();
        const o = new THREE.Path(); o.moveTo(-iw / 2, -ih / 2); o.lineTo(-iw / 2, ih / 2); o.lineTo(iw / 2, ih / 2); o.lineTo(iw / 2, -ih / 2); o.closePath(); s.holes.push(o);
        return new THREE.ExtrudeGeometry(s, { depth: depth - bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: 4 });
      };
      // the visible light cone: an additive shell that is brightest where you look along it and fades toward the wall
      const beam = (pos, target, angle, color) => {
        const dir = new THREE.Vector3(...target).sub(new THREE.Vector3(...pos)), len = dir.length() * 0.97, g = new THREE.ConeGeometry(Math.tan(angle) * len, len, 64, 1, true);
        g.translate(0, -len / 2, 0);
        const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
          uniforms: { uColor: { value: new THREE.Color(color) }, uGain: { value: 0 }, uLen: { value: len } },
          vertexShader: 'varying vec3 vN, vV, vP; varying float vH; uniform float uLen; void main(){ vP = position; vH = -position.y / uLen; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalMatrix * normal; vV = -mv.xyz; gl_Position = projectionMatrix * mv; }',
          fragmentShader: `varying vec3 vN, vV, vP; varying float vH; uniform vec3 uColor; uniform float uGain;
            void main(){ float edge = pow(abs(dot(normalize(vN), normalize(vV))), 2.4);
              float a = atan(vP.z, vP.x), dust = 0.82 + 0.18 * sin(a * 7.0 + 2.0 * sin(a * 3.0 + vH * 5.0));
              float fall = pow(max(0.0, 1.0 - vH * 1.4), 1.4) / (0.35 + 2.2 * vH);
              gl_FragColor = vec4(uColor * uGain * edge * fall * dust, 1.0); }`,
        }));
        m.position.set(...pos); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.normalize()); m.frustumCulled = false; scene.add(m);
        return m.material.uniforms.uGain;
      };
      const plate = K.roundedBox(PLQ_W, PLQ_H, 0.06, 0.015, 2);
      for (let i = 0, p = plate.attributes.position; i < p.count; i++) plate.attributes.uv.setXY(i, p.getX(i) / PLQ_W + 0.5, p.getY(i) / PLQ_H + 0.5);   // map the face edge to edge
      const exhibits = EXHIBITS.map((ex, i) => {
        const ax = exX(i) - UNIT / 2 + FW / 2, px = exX(i) + UNIT / 2 - PLQ_W / 2, hero = i === LAST;
        const grp = new THREE.Group(); grp.position.set(ax, ART_Y, 0); scene.add(grp);
        add(ring(FW - 0.05, FH - 0.05, ART_W + 0.04, ART_H + 0.04, 0.1, 0.012), lacquer, 0, 0, 0.02, true, grp);        // flat black body
        add(ring(FW, FH, FW - 0.2, FH - 0.2, 0.2, 0.045), gilt, 0, 0, 0.02, true, grp);                                  // raised gilt outer edge
        add(ring(ART_W + 0.18, ART_H + 0.18, ART_W - 0.03, ART_H - 0.03, 0.135, 0.03), gilt, 0, 0, 0.02, true, grp);       // gilt bead round the opening
        add(new THREE.PlaneGeometry(ART_W, ART_H), new THREE.MeshPhysicalMaterial({ map: drawPoster(K, ex.art, i), color: '#c0c0c0', roughness: 0.8, specularIntensity: 0.08 }), 0, 0, 0.055, true, grp);
        const face = new THREE.MeshStandardMaterial({ map: drawPlaque(K, ex), metalness: 0.6, roughness: 0.42, envMap, envMapIntensity: 0.9 });
        add(plate, face, px, ART_Y, 0.05);
        for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const s = add(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 16), brass, px + sx * (PLQ_W / 2 - 0.1), ART_Y + sy * (PLQ_H / 2 - 0.1), 0.085, false); s.rotation.x = Math.PI / 2; }
        const kp = [ax, LAMP_Y, LAMP_Z], kt = [ax, ART_Y - 0.1, 0], lp = [px, LAMP_Y, LAMP_Z], lt = [px, ART_Y, 0];
        const ka = hero ? 0.4 : 0.36;
        return {
          key: K.spot(S, { pos: kp, target: kt, color: '#ffdfb8', power: 0, angle: ka, penumbra: 0.5, soft: 0.22, near: 2, far: 14, mapSize: 1024 }),
          label: K.spot(S, { pos: lp, target: lt, color: '#ffdfb8', power: 0, angle: 0.21, penumbra: 0.75, shadow: false }),
          keyBeam: beam(kp, kt, ka * 0.86, '#ffd9aa'), labelBeam: beam(lp, lt, 0.17, '#ffd9aa'),
        };
      });

      // ---- the rope barrier in front of the wall
      const post = new THREE.LatheGeometry([[0, 0], [0.19, 0], [0.19, 0.02], [0.16, 0.045], [0.07, 0.075], [0.036, 0.11], [0.036, 0.57], [0.058, 0.58], [0.058, 0.61], [0.036, 0.62], [0.036, 0.64], [0.05, 0.655], [0.064, 0.69], [0.05, 0.725], [0, 0.74]].map(([x, y]) => new THREE.Vector2(x, y)), 28);
      const velvet = new THREE.MeshPhysicalMaterial({ color: '#4d0c14', roughness: 0.95, sheen: 1, sheenColor: new THREE.Color('#c0404c'), sheenRoughness: 0.45 });
      const ROPE_Z = 2.4, posts = [];
      for (let x = exX(0) - GAP * 1.5 + 0.2; x < exX(LAST) + GAP * 1.6; x += GAP / 2) posts.push(x);
      posts.forEach((x, k) => {
        add(post, brass, x, 0, ROPE_Z);
        if (k) { const x0 = posts[k - 1], pts = []; for (let u = 0; u <= 10; u++) { const f = u / 10; pts.push([x0 + (x - x0) * f, 0.595 - 0.24 * 4 * f * (1 - f), ROPE_Z]); } add(K.tube(pts, 0.03, { segments: 40 }), velvet, 0, 0, 0); }
      });

      // ---- the dolly: one continuous move in three kinds of shot. K.path flows through its keys without stopping.
      // It opens wide and oblique on the first exhibit with the others receding down the wall, tracks past the middle
      // ones at medium distance, and ends pushing in on the last. The gaze has three keys per middle exhibit (just
      // before, on, just after), which makes it linger there and travel quickly in between.
      const camKeys = [[0, [exX(0) - 5.8, 1.15, 10.8]]], gazeKeys = [[0, [exX(0) + 2.3, 2.0]], [PASS[0], [exX(0) + 1.4, 1.95]]];
      for (let i = 1; i < LAST; i++) {
        camKeys.push([PASS[i], [exX(i) - 0.8, 1.15, 10.4]]);
        gazeKeys.push([PASS[i] - LINGER, [exX(i) - 0.3, 1.85]], [PASS[i], [exX(i) + 0.15, 1.85]], [PASS[i] + LINGER, [exX(i) + 0.6, 1.85]]);
      }
      camKeys.push([PASS[LAST], [exX(LAST) - 1.3, 1.15, 10.4]], [DUR, [exX(LAST) + 0.2, 1.1, 9.7]]);
      gazeKeys.push([PASS[LAST], [exX(LAST) - 1.1, 1.85]], [DUR, [exX(LAST) + 0.15, 1.85]]);
      const cam = K.path(camKeys), gaze = K.path(gazeKeys);
      const warm = new THREE.Color('#ff9a4a'), full = new THREE.Color('#ffdfb8');

      return {
        update(t) {
          exhibits.forEach((e, i) => {
            const a = lamp(t - LIGHT_ON[i]), b = lamp(t - LIGHT_ON[i] - LABEL_LAG);
            const level = i === LAST ? 1 + 0.5 * K.smooth(SWELL[0], SWELL[1], t) : 1 - K.seg(t, LIGHT_ON[i + 1] + 0.25, LIGHT_ON[i + 1] + 1.6, K.ease.inOut);   // exhibits already seen fade back to standby
            e.key.intensity = 430 * Math.max(STANDBY, a * level); e.label.intensity = 300 * Math.max(STANDBY, b * level);
            e.key.color.copy(warm).lerp(full, K.clamp(a * level)); e.label.color.copy(warm).lerp(full, K.clamp(b * level));   // a dim filament is orange
            e.keyBeam.value = 0.5 * a * level; e.labelBeam.value = 0.32 * b * level;
          });
          const g = gaze(t);
          K.look(camera, cam(t), [g[0], g[1], 0]);
          const open = 1 - K.smooth(0, PASS[0] + 0.6, t);                                  // in the wide opening, hold focus on the first frame and stop down a little
          K.focus(camera, [g[0] - 2.6 * open, ART_Y, 0], 0.13 - 0.06 * open);
        },
      };
    },

    sound(k) {
      // a hushed hall: the dolly rolling, a relay and a filament for every lamp, and one soft note per exhibit that
      // stacks into a chord when the last one lights
      const notes = ['D3', 'A3', 'F#4', 'D5'], END = LIGHT_ON[LAST];
      k.bed('room', 0, DUR, { gain: 0.55 }); k.bed('hum', 0, DUR, { gain: 0.1 });
      k.noise(0, { dur: DUR - 0.6, color: 'brown', filter: 'lowpass', f: 170, gain: 0.16, a: 0.25, hold: 5.6, bus: 'amb' });      // dolly wheels, fading as it settles
      k.tone(0.05, { f: notes[0], type: 'triangle', dur: 3.4, gain: 0.1, a: 0.5, hold: 1.3, verb: 0.5, bus: 'music', filter: 'lowpass', f2: 1200 });
      EXHIBITS.forEach((_, i) => {
        if (!i) return;
        const t = LIGHT_ON[i], pan = 0.5, hero = i === LAST;
        k.play('tock', t, { gain: 1, f: 380, pan }); k.play('click', t, { gain: 0.8, pan });              // picture lamp relay
        k.play('neon', t + 0.02, { gain: hero ? 0.5 : 0.35, dur: 0.14, pan });                            // the filament catching
        k.play('tock', t + LABEL_LAG, { gain: 0.6, f: 520, pan: 0.65 }); k.play('click', t + LABEL_LAG, { gain: 0.5, pan: 0.65 });   // plaque lamp
        k.play('thud', t, { gain: hero ? 0.7 : 0.35, f: 85 });
        k.tone(t + 0.03, { f: notes[i % notes.length], type: 'triangle', dur: hero ? 4 : 3.2, gain: hero ? 0.16 : 0.12, a: 0.2, hold: hero ? 1.8 : 1, verb: 0.55, bus: 'music', filter: 'lowpass', f2: 1700, pan: 0.2 });
        k.play('whoosh', t + 0.35, { gain: 0.12, dur: 1.2, top: 800 });                             // air as the camera swings to the next one
      });
      k.play('ding', END + 0.08, { gain: 0.3, f: 'A5', pan: 0.2 });
      // the push-in: the lamps swell and the chord opens up under them
      const up = SWELL[0], len = DUR - up;
      k.tone(up, { f: 'D2', type: 'sine', dur: len, gain: 0.16, a: 0.9, hold: len - 1.6, bus: 'music' });
      k.tone(up, { f: 'A4', type: 'sine', dur: len, gain: 0.07, a: 0.9, hold: len - 1.6, verb: 0.5, bus: 'music' });
      k.tone(up + 0.3, { f: 'F#5', type: 'sine', dur: len - 0.3, gain: 0.05, a: 0.9, hold: len - 2, verb: 0.5, bus: 'music', pan: -0.2 });
      k.play('ding', SWELL[1] - 0.5, { gain: 0.4, f: 'D6', pan: -0.1 });
    },
  });
}
```
