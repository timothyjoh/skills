# Floating Screens (#31)

- **id:** `floating-screens`
- **Category:** Products and screens
- **Use:** explainer
- **Reference duration:** 8 s
- **Google Fonts:** Fraunces, Inter
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`

## Style card

- **Look:** Screens as objects: white cards printed with a real interface, each backed by a block of clear glass, hanging one in front of the other in a bright, warm room. The newest card is always nearest and sharpest; the ones before it stay behind it, softly out of focus.
- **Motion:** A card swings in from the side like a heavy door, slides to its place and settles. Buttons sink when pressed and the whole card gives a little. A thin cable draws itself from the pressed button to the edge of the next card, and at the end one highlight runs through the whole chain.
- **Light:** One big soft window light from the upper right in front, so every card throws a soft shadow onto the card behind it and a softer one onto the wall, and every raised button and tile has its own small shadow. A bright room fills the shadows: nothing goes dark.
- **Materials:** Matt printed card stock on thick glass with polished, slightly green edges; raised interface pieces in the same card; a painted plaster wall. Warm paper, dark ink and exactly one accent colour.
- **Camera:** Long lens on a dolly that rolls past the row at one steady speed and never stops. It pans to stay on the newest card, hands over to the next one as it flies in, and finally cranes back until the whole sequence is in frame. Focus always sits on the newest card.
- **Finish:** Neutral tone mapping so interface colours stay exact, real depth of field and motion blur, a faint vignette, almost no grain. Bloom is set so that only a glass edge that lights up glows.
- **Good for:** Anything made of steps or screens: an app flow, a workflow, a process, a set of stats or quotes. One card per step, the action on each card acted out, a cable from each step to the next.

## Reference

- **Sample topic:** Ordering bread online from a small bakery in three steps: choose the loaf, check the basket, order confirmed
- **Gallery description:** Screens as objects: white cards printed with a real interface, each backed by a block of clear glass, hanging one in front of the other in a bright, warm room. The newest card is always nearest and sharpest; the ones before it stay behind it, softly out of focus.
- **Shown in the sample clip:** Ordering bread online from a small bakery in three steps: choose the loaf, check the basket, order confirmed

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/floating-screens.js`)

```js
{
  // ---------------------------------------------------------------- content (change this for a new topic)
  // Three screens of one small story. Every word and number on the cards comes from this block.
  const SHOP = { name: 'Tin Robin', kind: 'BAKERY', street: '14 Mill Lane' };
  const ITEM = { title: ['Country', 'Sourdough'], name: 'Country Sourdough', tag: 'BAKED THIS MORNING', note: 'Slow-fermented for 24 hours', price: 8 };
  const ORDER = { from: 1, to: 2, day: 'Saturday', time: '8:00 am', number: 'Order no. 1042' };
  const STEPS = ['Choose', 'Basket', 'Confirmed'];               // the little tag on the corner of each card
  const money = (v) => '$' + v.toFixed(2);
  // warm paper, dark ink and ONE accent colour that is only used for "the thing you press" and "done"
  const C = { paper: '#ffffff', ink: '#1f1b16', muted: '#8b8376', line: '#e9e2d6', tile: '#f5efe5', crumb: '#f1e3c9', accent: '#14805a', soft: '#dcefe5', wall: '#e2c6ad' };

  // ---------------------------------------------------------------- the schedule (picture and sound share it)
  const T = {
    A: -0.75,              // card 1 slides in just before the clip starts, so frame one catches it settling
    add: 1.1,              // "Add to basket" is pressed
    B: 1.4,                // card 2 slides in
    plus: 2.75,            // "+" is pressed: 1 loaf becomes 2, the total rolls up
    order: 3.5,            // "Place order" is pressed
    C: 3.8,                // card 3 slides in
    tick: 4.85,            // the tick lands
    wide: [5.55, 7.0],     // the camera pulls back to show all three steps
    recap: 6.45,           // a highlight runs through the whole flow once
  };
  const LINK = [[T.add + 0.15, T.B + 1.0], [T.order + 0.15, T.C + 1.0]];   // when each connector draws itself (it lands as the next card settles)
  const HOP = 0.3;                                                         // recap: seconds from one card to the next
  // the moments each card's glass edge lights up: when its cable plugs in, and once more in the recap
  const FLASH = [[T.recap], [LINK[0][1], T.recap + HOP], [LINK[1][1], T.recap + 2 * HOP]];

  // ---------------------------------------------------------------- the cards (world units: 1 point of interface = 1 cm)
  const PT = 0.01, CW = 480, CH = 330, RAD = 26;       // every card is designed on a 480 x 330 point grid
  const PX = 4;                                        // texture pixels per point
  const SHEET = 0.024, GLASS = 0.16, RIM = 0.13;       // printed sheet, the glass block behind it, how far the glass shows around the sheet
  const STEP = [3.5, -0.3, 2.2];                       // each card sits this far from the one before: right, a little lower, nearer
  const YAW = [0.08, 0.02, -0.05];                     // a slight fan, so the cards are not parallel like a spreadsheet
  const FROM = { pos: [6.0, -0.4, 1.2], rot: [0.1, -0.8, 0.09] };   // where a card flies in from, relative to its place, and how it is turned
  const BTN = { x: 32, y: 262, w: 196, h: 46 };        // the main button sits in the same place on every card: that is where the connector leaves
  const PORT_Y = 255;                                  // height (points) at which a connector plugs into the next card's left edge

  // ---------------------------------------------------------------- canvas helpers (all drawing is in points)
  const say = (c, str, x, y, font, color, align = 'left', spacing = 0) => { c.font = font; c.fillStyle = color; c.textAlign = align; c.textBaseline = 'middle'; c.letterSpacing = spacing + 'px'; c.fillText(str, x, y); c.letterSpacing = '0px'; };
  const pill = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
  const mix = (a, b, k) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), K.clamp(k)).getHexString();
  // a tick that draws itself: p = 0..1
  const tick = (c, x, y, s, p = 1, color = '#fff') => {
    if (p <= 0.01) return;
    c.beginPath(); c.moveTo(x - 0.42 * s, y + 0.04 * s); c.lineTo(x - 0.12 * s, y + 0.33 * s); c.lineTo(x + 0.45 * s, y - 0.3 * s);
    c.lineWidth = s * 0.2; c.lineCap = c.lineJoin = 'round'; c.strokeStyle = color; c.setLineDash([s * 1.32 * p, s * 3]); c.stroke(); c.setLineDash([]);
  };
  // the product "photo", as a flat drawing: a round loaf with a scored ear of wheat
  const loaf = (c, x, y, s) => {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = 'rgba(120,78,26,0.2)'; c.beginPath(); c.ellipse(4, 41, 60, 10, 0, 0, 7); c.fill();                 // its shadow on the table
    const g = c.createRadialGradient(-18, -22, 4, 0, 2, 70);
    g.addColorStop(0, '#f0c47c'); g.addColorStop(0.5, '#d89a45'); g.addColorStop(1, '#a8632a');
    c.beginPath(); c.ellipse(0, 0, 63, 45, 0, 0, 7); c.fillStyle = g; c.fill();                                       // the crust
    c.save(); c.clip();
    c.strokeStyle = 'rgba(255,243,214,0.55)'; c.lineWidth = 2.2; c.lineCap = 'round';                                 // flour rings from the proving basket
    for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(0, 4, 20 + i * 11, 13 + i * 8, 0, Math.PI * 1.06, Math.PI * 1.94); c.stroke(); }
    c.restore();
    c.lineCap = 'round';
    const cut = (x0, y0, x1, y1, w) => { c.beginPath(); c.moveTo(x0, y0 + 1.6); c.lineTo(x1, y1 + 1.6); c.lineWidth = w + 2.5; c.strokeStyle = '#9a5a25'; c.stroke(); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineWidth = w; c.strokeStyle = '#f9ebcb'; c.stroke(); };
    const dx = 0.9, dy = -0.436;                                                                                      // direction of the long cut
    cut(-32, 15, 28, -14, 4.2);
    for (let i = 0; i < 4; i++) for (const side of [-1, 1]) {                                                         // short cuts leaning forward on both sides
      const bx = -22 + i * 13 * dx, by = 10.2 + i * 13 * dy, a = side * 0.85, lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a);
      cut(bx + lx * 5, by + ly * 5, bx + lx * 16, by + ly * 16, 3.2);
    }
    c.restore();
  };
  const basketIcon = (c, x, y, color) => { c.strokeStyle = color; c.lineWidth = 1.8; c.lineCap = c.lineJoin = 'round'; c.beginPath(); c.moveTo(x - 9, y - 3); c.lineTo(x + 9, y - 3); c.lineTo(x + 6.5, y + 8); c.lineTo(x - 6.5, y + 8); c.closePath(); c.stroke(); c.beginPath(); c.arc(x, y - 3, 5.5, Math.PI, 0); c.stroke(); };
  const wordmark = (c, x, y) => { c.beginPath(); c.arc(x + 7, y, 7, 0, 7); c.fillStyle = C.accent; c.fill(); say(c, SHOP.name, x + 22, y + 1, '600 19px "Fraunces"', C.ink); say(c, SHOP.kind, x + 22 + 96, y + 1.5, '600 10px "Inter"', C.muted, 'left', 1.6); };

  // ---------------------------------------------------------------- the three screens
  // Each screen is a static face plus a few raised pieces (see `card.piece` below). A piece is drawn by a function
  // (c, state, w, h): the state is whatever that piece animates (a press, a count), so the face itself never repaints.

  // any button: accent with a white label, turning into a soft "done" state. state: { on: 0..1, rip: 0..1 (the touch ripple) }
  const button = (label, done) => (c, s, w, h) => {
    c.fillStyle = mix(C.accent, C.soft, s.on); c.fillRect(0, 0, w, h);
    if (s.rip > 0 && s.rip < 1) { c.beginPath(); c.arc(w * 0.5, h * 0.5, w * 0.62 * K.ease.out(s.rip), 0, 7); c.fillStyle = `rgba(255,255,255,${0.34 * (1 - s.rip)})`; c.fill(); }
    c.globalAlpha = K.clamp(1 - s.on * 1.6); say(c, label, w / 2, h / 2 + 0.5, '600 17px "Inter"', '#ffffff', 'center');
    c.globalAlpha = K.clamp(s.on * 1.6 - 0.6); say(c, done, w / 2 + 11, h / 2 + 0.5, '600 17px "Inter"', C.accent, 'center');
    c.font = '600 17px "Inter"'; tick(c, w / 2 - c.measureText(done).width / 2 - 3, h / 2, 13, 1, C.accent);
    c.globalAlpha = 1;
  };
  // the step tag on a card's corner. state: { on: 0..1 }
  const chip = (n, label) => (c, s, w, h) => {
    c.fillStyle = mix(C.paper, C.accent, s.on); c.fillRect(0, 0, w, h);
    c.beginPath(); c.arc(h / 2, h / 2, h / 2 - 5, 0, 7); c.fillStyle = mix(C.tile, '#0c6646', s.on); c.fill();
    say(c, String(n), h / 2, h / 2 + 0.5, '700 13px "Inter"', mix(C.muted, '#ffffff', s.on), 'center');
    say(c, label, h + 1, h / 2 + 0.5, '600 14px "Inter"', mix(C.ink, '#ffffff', s.on));
  };

  // 1. the product page
  const drawProduct = (c) => {
    c.fillStyle = C.paper; c.fillRect(0, 0, CW, CH);
    wordmark(c, 32, 40);
    say(c, 'Bread', 318, 41, '500 13px "Inter"', C.ink); say(c, 'Pastry', 366, 41, '500 13px "Inter"', C.muted);
    basketIcon(c, 438, 40, C.ink);
    say(c, ITEM.tag, 33, 96, '600 11px "Inter"', C.accent, 'left', 1.5);
    say(c, ITEM.title[0], 30, 133, '600 40px "Fraunces"', C.ink); say(c, ITEM.title[1], 30, 174, '600 40px "Fraunces"', C.ink);
    say(c, ITEM.note, 32, 209, '400 13.5px "Inter"', C.muted);
    say(c, money(ITEM.price), 32, 240, '700 22px "Inter"', C.ink);
  };
  const drawPhoto = (c, s, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#f6ead3'); g.addColorStop(0.62, '#f1e0c2'); g.addColorStop(0.62, '#e9d3ae'); g.addColorStop(1, '#e4cba2');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    loaf(c, w / 2, h * 0.5, 1.22);
    pill(c, 14, h - 40, 62, 26, 13); c.fillStyle = 'rgba(255,253,248,0.92)'; c.fill(); say(c, '800 g', 45, h - 26.5, '600 12px "Inter"', C.ink, 'center');
  };
  const drawBadge = (c, s, w, h) => { c.fillStyle = C.accent; c.fillRect(0, 0, w, h); say(c, String(ORDER.from), w / 2, h / 2 + 0.5, '700 11px "Inter"', '#fff', 'center'); };

  // 2. the basket
  const drawBasket = (c) => {
    c.fillStyle = C.paper; c.fillRect(0, 0, CW, CH);
    say(c, 'Your basket', 30, 44, '600 28px "Fraunces"', C.ink);
    say(c, 'TOTAL', 33, 190, '600 11px "Inter"', C.muted, 'left', 1.5);
  };
  // the item row. state: { roll: 0..1 (the quantity rolling from one number to the next), rip: 0..1 (ripple on "+") }
  const drawItem = (c, s, w, h) => {
    c.fillStyle = C.tile; c.fillRect(0, 0, w, h);
    pill(c, 14, 14, 64, 64, 14); c.fillStyle = C.crumb; c.fill(); loaf(c, 46, 43, 0.44);
    say(c, ITEM.name, 92, 31, '600 16px "Inter"', C.ink);
    say(c, money(ITEM.price) + ' each', 92, 55, '400 13px "Inter"', C.muted);
    const X = 198, Y = 47, SW = 92, SH = 32, PXc = X + SW - 16, PYc = Y + SH / 2;
    pill(c, X, Y, SW, SH, SH / 2); c.fillStyle = C.paper; c.fill(); c.lineWidth = 1; c.strokeStyle = C.line; c.stroke();
    c.fillStyle = C.muted; c.fillRect(X + 11, PYc - 0.9, 10, 1.8);                                                 // minus
    if (s.rip > 0 && s.rip < 1) { c.beginPath(); c.arc(PXc, PYc, 11 + 15 * K.ease.out(s.rip), 0, 7); c.fillStyle = `rgba(20,128,90,${0.3 * (1 - s.rip)})`; c.fill(); }
    c.beginPath(); c.arc(PXc, PYc, 11, 0, 7); c.fillStyle = C.accent; c.fill();                                    // plus
    c.fillStyle = '#fff'; c.fillRect(PXc - 5, PYc - 0.9, 10, 1.8); c.fillRect(PXc - 0.9, PYc - 5, 1.8, 10);
    c.save(); c.beginPath(); c.rect(X + 28, Y + 3, 34, SH - 6); c.clip();                                          // the number rolls upward behind a little window
    say(c, String(ORDER.from), X + 45, PYc + 0.5 - s.roll * 24, '700 16px "Inter"', C.ink, 'center');
    say(c, String(ORDER.to), X + 45, PYc + 24.5 - s.roll * 24, '700 16px "Inter"', C.ink, 'center');
    c.restore();
  };
  const drawTotal = (c, s, w, h) => say(c, money(s.v), 2, h / 2, '700 36px "Inter"', C.ink);                      // state: { v: the amount shown }
  const drawPickup = (c, s, w, h) => {
    c.fillStyle = C.tile; c.fillRect(0, 0, w, h);
    c.strokeStyle = C.accent; c.lineWidth = 2; c.beginPath(); c.arc(28, 34, 12, 0, 7); c.stroke(); c.beginPath(); c.moveTo(28, 27); c.lineTo(28, 34); c.lineTo(33, 37); c.lineCap = 'round'; c.stroke();   // a clock
    say(c, 'PICKUP', 16, 70, '600 10.5px "Inter"', C.muted, 'left', 1.5);
    say(c, ORDER.day, 15, 93, '600 17px "Inter"', C.ink); say(c, ORDER.time, 15, 116, '600 17px "Inter"', C.ink);
    c.fillStyle = C.line; c.fillRect(16, 140, w - 32, 1);
    say(c, SHOP.name, 16, 162, '600 12.5px "Inter"', C.ink); say(c, SHOP.street, 16, 181, '400 12.5px "Inter"', C.muted);
  };

  // 3. order confirmed
  const DISC = { x: 100, y: 165, r: 60 };
  const drawDone = (c) => {
    c.fillStyle = C.paper; c.fillRect(0, 0, CW, CH);
    c.beginPath(); c.arc(DISC.x, DISC.y, DISC.r - 1, 0, 7); c.lineWidth = 2; c.strokeStyle = C.line; c.setLineDash([5, 6]); c.stroke(); c.setLineDash([]);   // where the tick will land
    say(c, 'Order confirmed', 188, 104, '600 33px "Fraunces"', C.ink);
    say(c, `${ORDER.to} × ${ITEM.name}   ·   ${money(ORDER.to * ITEM.price)}`, 190, 139, '500 14px "Inter"', C.muted);
    say(c, ORDER.number, 190, 291, '500 12.5px "Inter"', C.muted);
  };
  const drawTick = (c, s, w, h) => { c.fillStyle = C.accent; c.fillRect(0, 0, w, h); tick(c, w / 2, h / 2 + 2, w * 0.36, s.p); };   // state: { p: 0..1 }
  const drawWhen = (c, s, w, h) => {
    c.fillStyle = C.tile; c.fillRect(0, 0, w, h);
    say(c, 'PICKUP', 20, 25, '600 10.5px "Inter"', C.accent, 'left', 1.5);
    say(c, `${ORDER.day}, ${ORDER.time}`, 19, 51, '600 21px "Inter"', C.ink);
    say(c, `${SHOP.name} Bakery  ·  ${SHOP.street}`, 20, 77, '400 13px "Inter"', C.muted);
  };

  registerStyle({
    id: 'floating-screens',
    name: 'Floating Screens',
    family: 'Products and screens',
    look: 'Screens as objects: white cards printed with a real interface, each backed by a block of clear glass, hanging one in front of the other in a bright, warm room. The newest card is always nearest and sharpest; the ones before it stay behind it, softly out of focus.',
    motion: 'A card swings in from the side like a heavy door, slides to its place and settles. Buttons sink when pressed and the whole card gives a little. A thin cable draws itself from the pressed button to the edge of the next card, and at the end one highlight runs through the whole chain.',
    light: 'One big soft window light from the upper right in front, so every card throws a soft shadow onto the card behind it and a softer one onto the wall, and every raised button and tile has its own small shadow. A bright room fills the shadows: nothing goes dark.',
    materials: 'Matt printed card stock on thick glass with polished, slightly green edges; raised interface pieces in the same card; a painted plaster wall. Warm paper, dark ink and exactly one accent colour.',
    camera: 'Long lens on a dolly that rolls past the row at one steady speed and never stops. It pans to stay on the newest card, hands over to the next one as it flies in, and finally cranes back until the whole sequence is in frame. Focus always sits on the newest card.',
    post: 'Neutral tone mapping so interface colours stay exact, real depth of field and motion blur, a faint vignette, almost no grain. Bloom is set so that only a glass edge that lights up glows.',
    explains: 'Anything made of steps or screens: an app flow, a workflow, a process, a set of stats or quotes. One card per step, the action on each card acted out, a cable from each step to the next.',
    topic: 'Ordering bread online from a small bakery in three steps: choose the loaf, check the basket, order confirmed',
    duration: 8,
    fonts: ['600 40px "Fraunces"', '400 16px "Inter"', '500 16px "Inter"', '600 16px "Inter"', '700 16px "Inter"'],
    render: { samples: 96, shutter: 0.5, tone: 'neutral', exposure: 1.06, bloom: 0.35, bloomThreshold: 1.3, vignette: 0.16, grain: 0.012, fov: 28, near: 0.5, far: 120, background: C.wall },

    build(S) {
      const { THREE, K, scene, camera } = S;

      // ============================================================ the room: a bright wall and one window light
      // The sky of the environment is the fill light (it is what keeps shadows pale), the panels are what the glass
      // edges reflect. The sun is the window: big and soft, low enough that shadows land on the card behind.
      const room = K.env(S, { top: '#ffffff', horizon: '#fbfaf7', bottom: '#e2ddd6', intensity: 0.66, panels: [
        { pos: [16, 10, 14], size: [12, 12], color: '#fffaf2', power: 5 },
        { pos: [-18, 2, 8], size: [3, 20], color: '#eef5ff', power: 3 },
        { pos: [0, 20, 4], size: [24, 6], color: '#ffffff', power: 3 },
      ] });
      const SUN = [0.5, 0.42, 1].map((v) => v * 24);
      K.sun(S, { pos: [SUN[0], SUN[1], SUN[2] - 1], target: [0, 0, -1], color: '#fffaf4', power: 1.75, size: 11.5, soft: 1.9, mapSize: 4096, normalBias: 0.004, bias: -0.0002 });
      const WALL_Z = -STEP[2] - 4.2;
      const wallTex = K.canvasTex(4096, 2048, (c, w, h) => {
        const u = w / 72;                                                                        // pixels per world unit
        c.fillStyle = C.wall; c.fillRect(0, 0, w, h);
        // light from a tall window, leaning the way the sun falls: soft panes with the shadow of the frame between them
        c.save(); c.translate(w / 2 - 1.2 * u, h / 2 - 0.4 * u); c.transform(1, 0, -0.32, 1, 0, 0); c.filter = `blur(${Math.round(0.42 * u)}px)`;
        c.fillStyle = 'rgba(255,243,228,0.62)';
        for (const [x, y, pw, ph] of [[-8.6, -5.4, 5.6, 4.9], [-2.6, -5.4, 5.6, 4.9], [3.4, -5.4, 5.6, 4.9], [-8.6, 0.1, 5.6, 4.9], [-2.6, 0.1, 5.6, 4.9], [3.4, 0.1, 5.6, 4.9]]) c.fillRect(x * u, y * u, pw * u, ph * u);
        c.restore();
      });
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(72, 36), new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.95 }));
      wall.position.set(0, 0.5, WALL_Z); wall.receiveShadow = true; scene.add(wall);

      // ============================================================ reusable pieces
      // a rounded-rectangle slab with a small bevel: back on z = 0, front on z = depth, texture mapped flat across it.
      // Material 0 is the two faces, material 1 the edge.
      const slab = (w, h, r, depth, bevel) => {
        const x = w / 2 - bevel, y = h / 2 - bevel, q = Math.max(0.001, Math.min(r - bevel, x - 1e-4, y - 1e-4)), s = new THREE.Shape();
        s.moveTo(-x + q, -y); s.lineTo(x - q, -y); s.absarc(x - q, -y + q, q, -Math.PI / 2, 0); s.lineTo(x, y - q); s.absarc(x - q, y - q, q, 0, Math.PI / 2);
        s.lineTo(-x + q, y); s.absarc(-x + q, y - q, q, Math.PI / 2, Math.PI); s.lineTo(-x, -y + q); s.absarc(-x + q, -y + q, q, Math.PI, Math.PI * 1.5);
        const g = new THREE.ExtrudeGeometry(s, { depth: depth - 2 * bevel, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 5, curveSegments: 20 });
        g.translate(0, 0, bevel);
        const p = g.attributes.position, uv = g.attributes.uv;
        for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
        return g;
      };
      const solid = (geo, mat, parent, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
      // a canvas drawn in points that repaints only when its state changes, so update(t) can call show() freely
      const paper = (w, h, draw) => {
        const tex = K.canvasTex(Math.round(w * PX), Math.round(h * PX)); let key = null;
        tex.show = (state) => {
          const k = JSON.stringify(state); if (k === key) return; key = k;
          const c = tex.ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, w * PX, h * PX); c.setTransform(PX, 0, 0, PX, 0, 0);
          draw(c, state, w, h); tex.needsUpdate = true;
        };
        return tex;
      };
      const printed = (tex) => new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.55, metalness: 0, specularIntensity: 0.3 });   // low specular: no grey veil over the ink
      const cardEdge = new THREE.MeshStandardMaterial({ color: '#f3eee5', roughness: 0.6 });
      // the glass block: its two big faces are clear (you see the wall and the card behind through the margin), its
      // polished edge is the pale green of thick glass seen edge-on and glows a little, the way a lit glass edge does
      const glass = [
        new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.03, metalness: 0, transmission: 1, thickness: GLASS, ior: 1.45, attenuationColor: new THREE.Color('#cfeee3'), attenuationDistance: 1.2, envMap: room, envMapIntensity: 1.2 }),
        new THREE.MeshPhysicalMaterial({ color: '#bfe9db', roughness: 0.28, metalness: 0, transmission: 0.55, thickness: 0.4, ior: 1.45, emissive: new THREE.Color('#8fd6c0'), emissiveIntensity: 0.22, envMap: room, envMapIntensity: 1.6 }),
      ];

      // THE CARD. makeCard(i, drawFace) builds a glass-backed card at step i of the row and returns:
      //   card.piece({ x, y, w, h, r, lift, thick, draw, state, edge, flat })   a raised piece of interface, placed in points
      //       -> { mesh, show(state), lift(z) }. `flat: true` makes it a transparent label lying on the face instead.
      //   card.world(x, y, z)   where a point of the face is in the world right now (for connectors)
      const makeCard = (i, drawFace) => {
        const g = new THREE.Group(); scene.add(g);
        const W = CW * PT, H = CH * PT, R = RAD * PT;
        const rim = glass[1].clone();                                    // its own edge material, so each card can light up alone
        solid(slab(W + 2 * RIM, H + 2 * RIM, R + RIM * 0.8, GLASS, 0.03), [glass[0], rim], g, 0, 0, -GLASS);
        const face = paper(CW, CH, drawFace); face.show({});
        solid(slab(W, H, R, SHEET, 0.006), [printed(face), cardEdge], g);
        const at = (x, y, z = 0) => [(x - CW / 2) * PT, (CH / 2 - y) * PT, SHEET + z];
        const v = new THREE.Vector3();
        return {
          group: g, rim, t0: 0, rest: STEP.map((s) => s * (i - 1)), yaw: YAW[i], at,
          world: (x, y, z = 0, out = v) => { g.updateMatrixWorld(); return out.set(...at(x, y, z)).applyMatrix4(g.matrixWorld); },
          piece({ x, y, w, h, r = 14, lift = 0.03, thick = 0.02, draw, state = {}, edge = '#f3eee5', flat = false }) {
            const tex = paper(w, h, draw); tex.show(state);
            const [px, py, pz] = at(x + w / 2, y + h / 2);
            const m = flat
              ? new THREE.Mesh(new THREE.PlaneGeometry(w * PT, h * PT), new THREE.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, roughness: 0.55 }))
              : solid(slab(w * PT, h * PT, Math.min(r, w / 2 - 0.05, h / 2 - 0.05) * PT, thick, Math.min(0.006, thick * 0.3)), [printed(tex), new THREE.MeshStandardMaterial({ color: edge, roughness: 0.6 })], g);
            if (flat) { m.receiveShadow = true; g.add(m); lift = 0.0015; }
            m.position.set(px, py, pz + lift);
            return { mesh: m, show: tex.show, lift: (z) => { m.position.z = pz + z; } };
          },
        };
      };

      // THE CONNECTOR: a cable between two points that can both move. Its shape is recomputed on every update
      // (a bezier that leaves `a` along `da` and arrives at `b` along `db`) and it is drawn up to `p` of its length.
      const Y = new THREE.Vector3(0, 1, 0);
      const cable = (radius, mat, N = 80, M = 10) => {
        const pos = new Float32Array((N + 1) * M * 3), nor = new Float32Array((N + 1) * M * 3), idx = [];
        for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const a = i * M + j, b = i * M + (j + 1) % M; idx.push(a, a + M, b, b, a + M, b + M); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setIndex(idx);
        const mesh = new THREE.Mesh(g, mat); mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false; scene.add(mesh);
        const curve = new THREE.CubicBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3());
        const pt = new THREE.Vector3(), tan = new THREE.Vector3(), side = new THREE.Vector3(), up = new THREE.Vector3();
        return {
          mesh, curve,
          shape(a, da, b, db, p) {
            curve.v0.copy(a); curve.v1.copy(a).add(da); curve.v2.copy(b).sub(db); curve.v3.copy(b);
            for (let i = 0; i <= N; i++) {
              curve.getPoint(i / N, pt); curve.getTangent(i / N, tan); side.crossVectors(tan, Y).normalize(); up.crossVectors(side, tan);
              for (let j = 0; j < M; j++) {
                const an = (j / M) * Math.PI * 2, cs = Math.cos(an), sn = Math.sin(an), o = (i * M + j) * 3;
                nor[o] = side.x * cs + up.x * sn; nor[o + 1] = side.y * cs + up.y * sn; nor[o + 2] = side.z * cs + up.z * sn;
                pos[o] = pt.x + nor[o] * radius; pos[o + 1] = pt.y + nor[o + 1] * radius; pos[o + 2] = pt.z + nor[o + 2] * radius;
              }
            }
            g.attributes.position.needsUpdate = true; g.attributes.normal.needsUpdate = true;
            g.setDrawRange(0, Math.round(K.clamp(p) * N) * M * 6); mesh.visible = p > 0.004;
          },
        };
      };

      // ============================================================ the three cards and what is on them
      const cards = [makeCard(0, drawProduct), makeCard(1, drawBasket), makeCard(2, drawDone)];
      const [A, B, Cc] = cards; A.t0 = T.A; B.t0 = T.B; Cc.t0 = T.C;
      const measure = document.createElement('canvas').getContext('2d'); measure.font = '600 14px "Inter"';
      const chips = cards.map((card, i) => card.piece({ x: -14, y: -17, w: Math.ceil(measure.measureText(STEPS[i]).width) + 50, h: 34, r: 17, lift: 0.1, thick: 0.035, draw: chip(i + 1, STEPS[i]), state: { on: 0 }, edge: '#e9e4da' }));
      // the socket on the left edge where the cable from the card before plugs in
      const sockets = [B, Cc].map((card) => { const [x, y] = card.at(0, PORT_Y); const m = solid(new THREE.SphereGeometry(0.062, 24, 16), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4 }), card.group, x - RIM, y, -GLASS / 2); m.scale.z = 0.7; return m; });

      // screen 1
      A.piece({ x: 262, y: 70, w: 190, h: 238, r: 20, lift: 0.06, thick: 0.022, draw: drawPhoto, edge: '#e6d6b8' });
      const addBtn = A.piece({ ...BTN, r: 23, thick: 0.03, draw: button('Add to basket', 'Added'), state: { on: 0, rip: 0 }, edge: '#0f6d4c' });
      const badge = A.piece({ x: 441, y: 23, w: 17, h: 17, r: 8.5, lift: 0.012, thick: 0.012, draw: drawBadge, edge: C.accent });
      // screen 2
      const item = B.piece({ x: 28, y: 70, w: 304, h: 92, r: 18, lift: 0.04, thick: 0.02, draw: drawItem, state: { roll: 0, rip: 0 }, edge: '#e6dfd2' });
      const total = B.piece({ x: 30, y: 201, w: 220, h: 46, draw: drawTotal, state: { v: ITEM.price }, flat: true });
      const orderBtn = B.piece({ ...BTN, r: 23, thick: 0.03, draw: button('Place order', 'Order placed'), state: { on: 0, rip: 0 }, edge: '#0f6d4c' });
      B.piece({ x: 348, y: 70, w: 104, h: 238, r: 18, lift: 0.03, thick: 0.02, draw: drawPickup, edge: '#e6dfd2' });
      // screen 3
      const disc = Cc.piece({ x: DISC.x - DISC.r, y: DISC.y - DISC.r, w: DISC.r * 2, h: DISC.r * 2, r: DISC.r, lift: 0.07, thick: 0.04, draw: drawTick, state: { p: 0 }, edge: '#0f6d4c' });
      Cc.piece({ x: 188, y: 166, w: 264, h: 98, r: 18, lift: 0.035, thick: 0.02, draw: drawWhen, edge: '#e6dfd2' });
      const ring = new THREE.Mesh(new THREE.RingGeometry(DISC.r * PT * 0.96, DISC.r * PT, 96), new THREE.MeshBasicMaterial({ color: C.accent, transparent: true, depthWrite: false }));
      ring.position.set(...Cc.at(DISC.x, DISC.y, 0.003)); Cc.group.add(ring);

      // connectors: from the right end of a card's button to the socket of the next card
      const cableMat = new THREE.MeshStandardMaterial({ color: C.accent, roughness: 0.42, side: THREE.DoubleSide });
      const links = [[A, B], [B, Cc]].map(([from, to], i) => {
        const bead = solid(new THREE.SphereGeometry(0.06, 24, 16), new THREE.MeshStandardMaterial({ color: C.accent, roughness: 0.3 }), scene);
        const glint = new THREE.Mesh(new THREE.SphereGeometry(0.085, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.6, 1.5) })); scene.add(glint);
        return { from, to, bead, glint, socket: sockets[i], cable: cable(0.024, cableMat), a: new THREE.Vector3(), b: new THREE.Vector3(), da: new THREE.Vector3(0.45, -0.2, 0.5), db: new THREE.Vector3(0.45, 0.2, 0.6) };
      });

      // ============================================================ motion
      // how far a button is pushed in around time t0: down in 0.08 s, then back up with a small bounce
      const pressed = (t, t0) => { const u = t - t0; return u <= 0 ? 0 : u < 0.08 ? K.ease.out(u / 0.08) : 1 - K.spring(u - 0.08, 3.4, 0.5); };
      const kicks = [[T.add], [T.plus, T.order], [T.tick + 0.02]];           // the moments each card is touched: it gives a little
      const q = (v, n = 80) => Math.round(v * n) / n;                         // round animated values so canvases repaint a sensible number of times
      // A card arrives like a heavy door: its position has no bounce (it is heavy), its rotation swings past and settles.
      const pose = (card, i, t) => {
        const u = t - card.t0, p = 1 - K.spring(u, 1.2, 1), s = 1 - K.spring(u, 1.2, 0.5), g = card.group;
        let k = 0; for (const t0 of kicks[i]) k += pressed(t, t0) * (t0 === T.plus ? 0.45 : 1);
        let f = 0; for (const t0 of FLASH[i]) { const d = t - t0; if (d > 0) f += Math.min(1, d / 0.06) * Math.exp(-d * 4.5); }
        card.rim.emissiveIntensity = 0.22 + 5 * f;                      // light runs into the glass and fades
        k -= 0.9 * f * (t > T.recap ? 1 : 0);                             // in the recap the card also leans toward the camera a little
        g.visible = u > 0;
        g.position.set(card.rest[0] + FROM.pos[0] * p, card.rest[1] + FROM.pos[1] * p, card.rest[2] + FROM.pos[2] * p - 0.07 * k);
        g.rotation.set(FROM.rot[0] * s + 0.012 * k, card.yaw + FROM.rot[1] * s - 0.014 * k, FROM.rot[2] * s);
      };

      // The camera is on a dolly that rolls past the row at one steady speed and never stops (the keys before 0 and
      // after 8 keep it moving through the first and last frame). It pans to stay locked on the newest card, hands
      // over to the next one while that card flies in, and at the end cranes back until all three are in frame.
      const P = cards.map((c) => c.rest), rel = (i, o) => [P[i][0] + o[0], P[i][1] + o[1], P[i][2] + o[2]];
      const HAND = [[T.add - 0.05, T.B + 0.7], [T.order - 0.05, T.C + 0.7]];            // the two hand-overs: the pan leads, so the card's settle is seen sharp
      const cam = {
        pos: K.path([[-1.5, rel(0, [-4.0, 0.45, 8.3])], [0, rel(0, [-1.9, 0.4, 8.4])], [T.wide[0] / 2, rel(1, [-1.45, 0.3, 8.8])], [T.wide[0], rel(2, [-1.0, 0.2, 9.5])], [T.wide[1], rel(2, [-2.3, 0.3, 13.2])], [9.5, rel(2, [-2.0, 0.32, 13.5])]]),
        aim: K.track([[0, rel(0, [-0.1, 0.05, 0])], [HAND[0][0], rel(0, [-0.1, 0.05, 0])], [HAND[0][1], rel(1, [-0.15, 0.05, 0])], [HAND[1][0], rel(1, [-0.15, 0.05, 0])], [HAND[1][1], rel(2, [-0.15, 0.05, 0])], [T.wide[0], rel(2, [-0.15, 0.05, 0])], [T.wide[1], rel(2, [-2.7, 0.1, 0])]]),
        // the lens closes for the fast middle of each hand-over, so the pan blurs as one clean streak
        ap: K.track([[0, 0.075], [HAND[0][0], 0.12], [HAND[0][0] + 0.3, 0], [HAND[0][1] - 0.4, 0], [HAND[0][1], 0.12], [HAND[1][0], 0.12], [HAND[1][0] + 0.3, 0], [HAND[1][1] - 0.4, 0], [HAND[1][1], 0.12], [T.wide[0], 0.12], [T.wide[1], 0.05]]),
      };
      const v3 = new THREE.Vector3(), white = new THREE.Color('#ffffff'), accent = new THREE.Color(C.accent);

      return {
        update(t) {
          cards.forEach((card, i) => pose(card, i, t));
          chips[0].show({ on: 1 });
          chips[1].show({ on: q(K.seg(t, LINK[0][1] - 0.05, LINK[0][1] + 0.2)) });
          chips[2].show({ on: q(K.seg(t, LINK[1][1] - 0.05, LINK[1][1] + 0.2)) });

          // screen 1: the button sinks, turns into "Added", the basket gets its badge
          addBtn.lift(0.045 - 0.04 * pressed(t, T.add));
          addBtn.show({ on: q(K.seg(t, T.add + 0.1, T.add + 0.4)), rip: q(K.seg(t, T.add, T.add + 0.5)) });
          badge.mesh.scale.setScalar(Math.max(0.001, K.spring(t - T.add - 0.22, 3, 0.45)));

          // screen 2: "+" is pressed, the number rolls, the total counts up; then the order is placed
          item.lift(0.04 - 0.02 * pressed(t, T.plus));
          item.show({ roll: q(K.seg(t, T.plus + 0.04, T.plus + 0.42, K.ease.outBack), 120), rip: q(K.seg(t, T.plus, T.plus + 0.45)) });
          total.show({ v: Math.round(ITEM.price * (ORDER.from + (ORDER.to - ORDER.from) * K.seg(t, T.plus + 0.1, T.plus + 0.55, K.ease.out)) * 20) / 20 });
          orderBtn.lift(0.045 - 0.04 * pressed(t, T.order));
          orderBtn.show({ on: q(K.seg(t, T.order + 0.1, T.order + 0.4)), rip: q(K.seg(t, T.order, T.order + 0.5)) });

          // screen 3: the disc pops out of the card, the tick draws, one ring spreads
          disc.mesh.scale.setScalar(Math.max(0.001, K.spring(t - T.tick, 2.6, 0.5)));
          disc.show({ p: q(K.seg(t, T.tick + 0.1, T.tick + 0.45, K.ease.out), 120) });
          const rg = K.seg(t, T.tick + 0.08, T.tick + 0.85, K.ease.out);
          ring.scale.setScalar(1 + 0.75 * rg); ring.material.opacity = t > T.tick + 0.08 ? 0.5 * (1 - rg) : 0;

          // connectors: each one draws from the pressed button to the next card, with a bead at its head.
          // In the recap a bright bead runs through both, one after the other.
          links.forEach((L, i) => {
            const p = K.seg(t, LINK[i][0], LINK[i][1], K.ease.inOut);
            L.from.world(BTN.x + BTN.w - 4, BTN.y + BTN.h / 2, 0.03, L.a);
            L.to.group.updateMatrixWorld(); L.b.set(L.to.at(0, PORT_Y)[0] - RIM - 0.03, L.to.at(0, PORT_Y)[1], -GLASS / 2).applyMatrix4(L.to.group.matrixWorld);
            L.cable.shape(L.a, L.da, L.b, L.db, p);
            L.bead.visible = p > 0.004 && p < 1; L.cable.curve.getPoint(p, L.bead.position);
            L.socket.material.color.copy(white).lerp(accent, K.seg(t, LINK[i][1] - 0.04, LINK[i][1] + 0.1));
            const r = (t - T.recap) / HOP - i;
            L.glint.visible = r > 0 && r < 1; if (L.glint.visible) L.cable.curve.getPoint(K.ease.inOut(r), L.glint.position);
          });
          // the chips nod as the highlight reaches them
          chips.forEach((ch, i) => { const u = t - (T.recap + i * HOP); ch.lift(0.1 + (u > 0 ? 0.07 * Math.exp(-u * 7) * Math.sin(u * 16) : 0)); });

          K.look(camera, cam.pos(t), cam.aim(t));
          // focus sits on the newest card and follows it while it is still flying in
          v3.copy(A.group.position).lerp(B.group.position, K.seg(t, T.B, T.B + 0.35, K.ease.inOut)).lerp(Cc.group.position, K.seg(t, T.C, T.C + 0.35, K.ease.inOut));
          K.focus(camera, [v3.x, v3.y, v3.z], cam.ap(t));
        },
      };
    },

    sound(k) {
      k.bed('room', 0, 8, { gain: 0.5 });
      k.music('pad', 0, 8, { bpm: 60, gain: 0.7, chords: [['F3', 'C4', 'E4', 'A4'], ['G3', 'D4', 'E4', 'B4']] });
      // cards: air as they swing in, then glass and weight as they stop
      [T.B, T.C].forEach((t, i) => {
        k.play('whoosh', t + 0.02, { gain: 0.5, dur: 0.6, top: 1700, pan: 0.45 - i * 0.1 });
        k.play('thud', t + 0.52, { gain: 0.3, f: 95, pan: 0.15 });
        k.play('tock', t + 0.52, { gain: 0.35, f: 1500, pan: 0.15 });
      });
      // presses
      [T.add, T.order].forEach((t) => { k.play('click', t, { gain: 1, pan: -0.15 }); k.play('pop', t + 0.11, { gain: 0.55, f: 480, pan: -0.15 }); });
      k.play('click', T.plus, { gain: 0.8, f: 2300 }); k.play('blip', T.plus + 0.12, { gain: 0.8, f: 'A5', type: 'sine', dur: 0.09 });
      k.withMinor(() => { for (let i = 0; i < 6; i++) k.play('count', T.plus + 0.14 + i * 0.065, { gain: 0.5 }); });
      // connectors: a soft rising line, and a note as each one plugs in
      LINK.forEach(([a, b], i) => {
        k.tone(a, { f: [[0, 330], [b - a, 660]], type: 'sine', dur: b - a, gain: 0.05, a: 0.2, verb: 0.3, pan: -0.1 + i * 0.2 });
        k.play('swish', a, { gain: 0.5, dur: 0.3 });
        k.play('ding', b, { gain: 0.5, f: i ? 'G5' : 'E5' });
      });
      k.play('success', T.tick + 0.1, { gain: 0.9, f: 'C6' });
      k.play('pop', T.tick, { gain: 0.6, f: 380 });
      // recap: three small notes as the highlight passes the chips, and a low one to close
      ['C5', 'E5', 'G5'].forEach((n, i) => k.tone(T.recap + i * HOP, { f: n, type: 'triangle', dur: 0.9, gain: 0.08, a: 0.005, filter: 'lowpass', f2: 2200, verb: 0.35 }));
      k.tone(T.recap + 2 * HOP, { f: 'C3', type: 'sine', dur: 1.4, gain: 0.1, a: 0.03, verb: 0.3 });
    },
  });
}
```
