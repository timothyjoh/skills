# LED Wall (#11)

- **id:** `led-wall`
- **Category:** Flat content made physical
- **Use:** story
- **Reference duration:** 12 s
- **Google Fonts:** none
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`

## Style card

- **Look:** A giant outdoor screen made of real lamps: thousands of frosted round LEDs in black louvred cabinets on a steel gantry at night. From far away it is a crisp bright picture; close up it falls apart into single glowing lamps, each with a red, a green and a blue chip under its lens.
- **Motion:** The wall plays pixel animation at one pixel per lamp and 30 pictures a second: characters built from a few flat colours with a dark outline walk, run, stop and react in real cycles, the ground scrolls under them lamp by lamp with slower hills behind, and one short caption per beat pushes up into a ticker strip along the bottom. The camera does the opposite of the content: one slow continuous pull from a single lamp to the whole wall, still drifting at the end.
- **Light:** The wall is the light. Its own colours spill onto the louvres and the black plastic between the lamps, glow in the haze around it, tint the steel and paint the wet ground, and all of it changes when the picture changes. One cold floodlight from behind gives the steel a rim; everything else is night.
- **Materials:** Frosted dome lenses in black collars, satin black louvres and cabinet faces with seams and screws, galvanised lattice steel, rubber cable, wet tarmac with dry patches and a painted line.
- **Camera:** Long lens. Starts as a macro shot at a low angle across the lamps with very shallow focus, pulls back and swings round to face the wall while the story waits on its opening pose, has the wall in frame by the time the first story event happens, and then keeps drifting back and across, low over the wet ground, to the last frame.
- **Finish:** Soft bloom from the lamps, true-colour (neutral) tone mapping so the LED colours stay saturated, light vignette, very little grain. No scanline or pixel filters: the dots are real geometry.
- **Good for:** Any 2D animation, diagram or story that can be drawn at lamp resolution: a fable with two characters, a process with parts that move along a track, a chart that grows, a map with a route, a game-like sequence. Draw it on a small canvas with one pixel per lamp. A beat is something happening in that picture (a character sets off, stops, is overtaken, arrives); a label is one short dot-font line in the ticker strip; what moves is the pixel picture, while the wall, its housing and the light it throws stay the same and take their colour from whatever is playing.

## Reference

- **Sample topic:** The Tortoise and the Hare, as a pixel cartoon playing on the lamp wall
- **Gallery description:** A giant outdoor screen made of real lamps: thousands of frosted round LEDs in black louvred cabinets on a steel gantry at night. From far away it is a crisp bright picture; close up it falls apart into single glowing lamps, each with a red, a green and a blue chip under its lens.
- **Shown in the sample clip:** The Tortoise and the Hare, as a pixel cartoon playing on the lamp wall

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/led-wall.js`)

```js
{
  // ---------------------------------------------------------------- content (change this for a new topic)
  // The picture is a tiny canvas with ONE PIXEL PER LAMP. Whatever drawContent() paints on it, the wall plays.
  // Here it plays a pixel cartoon: The Tortoise and the Hare, on a two-lane running track that scrolls sideways.
  const K = globalThis.K;
  const COLS = 180, ROWS = 72, CAB = 18;       // lamps across and down, and the size of one cabinet (18 x 18 lamps)
  const REFRESH = 30;                          // the wall shows 30 pictures a second, like real hardware
  // the story: times in seconds, places in lamps along the track (the track is longer than the wall, so the view scrolls)
  const T_GO = 2.2;                                                    // the flag drops
  const T_STOP = 3.5, T_LOOK = 3.8, T_YAWN = 4.8, T_DOWN = 5.6, T_SLEEP = 6.3;   // the hare brakes at the tree, looks back, yawns, lies down, sleeps
    const X_START = 80, X_NAP = 215, X_FINISH = 267;                     // start line, the hare's spot under the tree, finish line
  const PLOD = 29;                                                     // the tortoise's speed, lamps a second: never changes
  const T_WIN = T_GO + 0.35 + (X_FINISH - (X_START - 4)) / PLOD;       // his nose reaches the line (about 9.1 s)
  const T_WAKE = T_WIN - 0.2, T_DASH = T_WAKE + 0.42;                  // the hare wakes with a start as the tortoise reaches the line, and dashes: too late
  // one short line per beat: [start time, text, optional times at which its words appear one by one]
  const CAPTIONS = [[0, 'READY... SET... GO!', [0, T_GO - 0.9, T_GO]], [T_GO + 0.7, 'THE HARE SHOOTS AHEAD'], [T_YAWN - 0.1, 'HE STOPS FOR A NAP'], [7.0, 'THE TORTOISE PLODS PAST'], [T_WIN, 'SLOW AND STEADY WINS']];
  const HERO = [68, 17];                       // the lamp the clip opens on: column, row (the pink inside of the hare's ear)
  // rows of the picture, top to bottom: sky and hills, grass verge, the hare's lane, the tortoise's lane, caption strip
  const HORIZON = 25, TRACK = 30, LANE = 45, TRACK_END = 60, STRIP = 61, HARE_Y = 39, TORT_Y = 58;

  // how far the tortoise has walked by time t: slow off the mark, then dead steady, and a short stop past the line
  const WALK_END = X_FINISH + 38 - (X_START - 4);
  function plodded(t) {
    const s = t - T_GO - 0.2;
    if (s <= 0) return 0;
    const d = s < 0.3 ? PLOD * s * s / 0.6 : PLOD * (s - 0.15), brake = WALK_END - PLOD * 0.25;
    if (d <= brake) return d;
    const u = Math.min(0.5, (d - brake) / PLOD); return brake + PLOD * (u - u * u);
  }
  // where the hare's nose is: two sprints that start flat out and end in a skid
  const sprint = (t, t0, t1, x0, x1) => x0 + (x1 - x0) * (1 - (1 - K.seg(t, t0, t1)) ** 2);
  const hareNose = (t) => (t < T_DASH ? sprint(t, T_GO + 0.08, T_STOP, X_START - 3, X_NAP) : sprint(t, T_DASH, T_DASH + 0.6, X_NAP, X_FINISH - 16));
  // the view: follows the hare to his tree, waits there, then travels with the tortoise to the finish
  const scrollAt = K.track([[T_GO + 0.1, 0], [T_STOP + 0.15, 92, 'inOut'], [6.4, 92], [T_WIN + 0.8, 162, 'inOut']]);

  // ---------------------------------------------------------------- pixel tools: everything lands on whole lamps
  // (canvas circles and lines are anti-aliased, which turns to mush at this size, so shapes are filled lamp by lamp)
  const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const mixHex = (a, b, u) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * u)).join(',')})`; };
  const wrap = (x, n) => ((x % n) + n) % n;
  function blob(ctx, cx, cy, rx, ry, color) {            // a filled ellipse
    ctx.fillStyle = color;
    for (let y = Math.ceil(cy - ry); y <= cy + ry; y++) { const hw = rx * Math.sqrt(Math.max(0, 1 - ((y - cy) / ry) ** 2)), x0 = Math.round(cx - hw), x1 = Math.round(cx + hw); if (x1 > x0) ctx.fillRect(x0, y, x1 - x0, 1); }
  }
  function pixmap(ctx, rows, x, y, colors) {             // a little picture typed as text, one character per lamp
    rows.forEach((row, j) => [...row].forEach((ch, i) => { if (colors[ch]) { ctx.fillStyle = colors[ch]; ctx.fillRect(x + i, y + j, 1, 1); } }));
  }
  // Small type: web fonts turn to mush under about 9 lamps, so text uses the classic 5 x 7 dot font
  // (five column bytes per character, lowest bit on top), one lamp per dot.
  const DOTS = Object.fromEntries(("A7E1111117E B7F49494936 C3E41414122 D7F4141221C E7F49494941 F7F09090901 G3E4149497A H7F0808087F I00417F4100 J2040413F01 K7F08142241 L7F40404040 M7F020C027F " +
    "N7F0408107F O3E4141413E P7F09090906 Q3E4151215E R7F09192946 S4649494931 T01017F0101 U3F4040403F V1F2040201F W3F4038403F X6314081463 Y0708700807 Z6151494543 " +
    "03E5149453E 100427F4000 24261514946 32141454B31 41814127F10 52745454539 63C4A494930 70171090503 83649494936 90649291E00 :0036360000 -0808080808 .0060600000 !00005F0000 '0005030000").split(' ').map((s) => [s[0], s.slice(1).match(/../g).map((h) => parseInt(h, 16))]));
  function dotText(ctx, text, x, y, color, size = 1) {
    ctx.fillStyle = color;
    for (const ch of text) { const g = DOTS[ch]; if (g) for (let c = 0; c < 5; c++) for (let r = 0; r < 7; r++) if ((g[c] >> r) & 1) ctx.fillRect(x + c * size, y + r * size, size, size); x += 6 * size; }
  }
  const dotWidth = (text) => text.length * 6 - 1;

  // ---------------------------------------------------------------- puppets
  // A character is a puppet: a few ovals and limbs filled into a small grid of colour numbers, posed by a handful of
  // values (body height, lean, where each foot is, ear angle). Because a pose is only numbers, poses can be blended
  // and cycled, which gives real walk and run cycles without drawing frames by hand. The grid is then stamped on the
  // wall with a one-lamp dark outline: that outline is what keeps a character readable from across the car park.
  function makeSprite(w, h) {
    const g = new Uint8Array(w * h);
    const fill = (x0, y0, x1, y1, test, c) => { for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(h - 1, Math.ceil(y1)); y++) for (let x = Math.max(0, Math.floor(x0)); x <= Math.min(w - 1, Math.ceil(x1)); x++) if (test(x, y)) g[y * w + x] = c; };
    return {
      g, w, h,
      clear() { g.fill(0); },
      fill,
      dot(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < w && y < h) g[y * w + x] = c; },
      // an ellipse; `a` tips its long axis up at the front
      oval(cx, cy, rx, ry, c, a = 0) { const co = Math.cos(a), si = Math.sin(a), r = Math.max(rx, ry); fill(cx - r, cy - r, cx + r, cy + r, (x, y) => { const dx = x - cx, dy = y - cy; return ((dx * co - dy * si) / rx) ** 2 + ((dx * si + dy * co) / ry) ** 2 <= 1; }, c); },
      // a round-ended stroke from one point to another (legs, ears, necks)
      limb(x0, y0, x1, y1, r, c) { const dx = x1 - x0, dy = y1 - y0, L = dx * dx + dy * dy || 1; fill(Math.min(x0, x1) - r, Math.min(y0, y1) - r, Math.max(x0, x1) + r, Math.max(y0, y1) + r, (x, y) => { const k = K.clamp(((x - x0) * dx + (y - y0) * dy) / L); return Math.hypot(x - x0 - k * dx, y - y0 - k * dy) <= r; }, c); },
    };
  }
  // stamp a sprite so that its foot point (ax, ay in the sprite) lands on lamp (x, y). pal[0] is the outline colour
  function stamp(ctx, sp, ax, ay, x, y, pal, flip) {
    const { g, w, h } = sp;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const c = g[j * w + i];
      if (!c && !((i > 0 && g[j * w + i - 1]) || (i < w - 1 && g[j * w + i + 1]) || (j > 0 && g[j * w + i - w]) || (j < h - 1 && g[j * w + i + w]))) continue;
      ctx.fillStyle = pal[c]; ctx.fillRect(x + (flip ? ax - i : i - ax), y + j - ay, 1, 1);
    }
  }
  const mixPose = (A, B, u) => Object.fromEntries(Object.keys(A).map((k) => [k, Array.isArray(A[k]) ? A[k].map((v, i) => v + (B[k][i] - v) * u) : A[k] + (B[k] - A[k]) * u]));

  // ---- the hare: long ears, a white puff of a tail and big hind legs carry the likeness
  const HARE_PAL = ['#2b1206', '#fff3da', '#cdb99b', '#ff6f9c', '#1a0e16', '#ffffff', '#2b1206'], FUR = 1, FAR = 2, PINK = 3, DARK = 4, TAIL = 5, EDGE = 6;
  const hareSprite = makeSprite(54, 42), HARE_AX = 24, HARE_AY = 39;
  // a pose: h body height, pitch lean (front up), len/fat body size, head offset from the chest, ear angle from upright
  // (positive = laid back) and the spread between the two ears, hind [heel forward of the hip, heel height, toe angle],
  // fore [paw forward of the shoulder, paw height], eye (0 open, 1 shut, 2 wide), mouth (1 open)
  const HARE = {
    ready: { h: 9.5, pitch: -0.12, len: 9.5, fat: 6.3, head: [3, -4], ear: 0.15, spread: 0.45, hind: [3, 0, 0], fore: [1, 0], eye: 0, mouth: 0 },
    set: { h: 8, pitch: -0.32, len: 9, fat: 6.5, head: [3.5, -2.5], ear: 0.6, spread: 0.25, hind: [4, 0, 0], fore: [2, 0], eye: 0, mouth: 0 },          // rump up, ears flat
    skid: { h: 9, pitch: 0.45, len: 9.5, fat: 6.3, head: [2, -4], ear: -0.75, spread: 0.3, hind: [8, 0, 0.3], fore: [8, 1], eye: 2, mouth: 0 },        // leaning back, ears thrown forward
    sit: { h: 10.5, pitch: 0.95, len: 9, fat: 6.3, head: [2, -3.5], ear: 0.05, spread: 0.45, hind: [2, 0, 0], fore: [4, 7], eye: 0, mouth: 0 },
    yawn: { h: 11, pitch: 1.05, len: 9.5, fat: 6, head: [1, -4.5], ear: 0.5, spread: 0.3, hind: [2, 0, 0], fore: [6, 17], eye: 1, mouth: 1 },
    sleep: { h: 5, pitch: 0, len: 11.5, fat: 4.6, head: [5, -1], ear: 1.3, spread: 0.28, hind: [-7, 0, 3.1], fore: [8, 0], eye: 1, mouth: 0 },                // flat out, legs stretched, ears along his back
    alarm: { h: 11, pitch: 0.95, len: 9.5, fat: 6, head: [2, -4], ear: -0.05, spread: 0.3, hind: [2, 0, 0], fore: [6, 12], eye: 2, mouth: 1 },
    aghast: { h: 10.5, pitch: 0.95, len: 9, fat: 6.3, head: [2.5, -3], ear: 0.7, spread: 0.8, hind: [2, 0, 0], fore: [4, 6], eye: 2, mouth: 1 },        // sitting, jaw dropped, ears sagging apart
  };
  // the bound, p = 0..1: stretched out in the air, fore paws land, gathered up, hind feet push off
  function hareRun(p) {
    const a = 2 * Math.PI * p, c = Math.cos(a), s = Math.sin(a);
    return { h: 11.5 + 1.5 * c, pitch: -0.22 * s, len: 10.5 + 1.2 * c, fat: 6 - 0.4 * c, head: [4, -3], ear: 0.95 + 0.2 * s, spread: 0.3,
      hind: [-0.5 - 8.5 * c, Math.max(0, 2.75 + 3 * c + 2.5 * s), 1.3 * (1 + c)], fore: [2.5 + 7.5 * c, Math.max(0, 4 - 4 * s + 2 * c)], eye: 0, mouth: 0 };
  }
  function drawHare(sp, P) {
    sp.clear();
    const G = HARE_AY, cx = HARE_AX, cy = G - P.h, co = Math.cos(P.pitch), si = Math.sin(P.pitch), L = P.len;
    const front = [cx + (L - 2) * co, cy - (L - 2) * si], rear = [cx - (L - 3) * co, cy + (L - 3) * si];
    const hip = [rear[0] + 1, rear[1] + 1], sh = [front[0] - 1, front[1] + 2], head = [front[0] + P.head[0], front[1] + P.head[1]], ear = [head[0] - 2, head[1] - 3];
    const legs = (o, c) => {
      const heel = [hip[0] + P.hind[0] + o, G - 1.4 - P.hind[1]];
      sp.limb(hip[0] + o, hip[1], heel[0], heel[1], 2.2, c); sp.limb(heel[0], heel[1], heel[0] + 6 * Math.cos(P.hind[2]), heel[1] - 6 * Math.sin(P.hind[2]), 1.4, c);
      sp.limb(sh[0] + o, sh[1], sh[0] + P.fore[0] + o, G - 1.5 - P.fore[1], 1.5, c);
    };
    const earAt = (a, c, r = 1.7) => { const tip = [ear[0] - 13 * Math.sin(a), ear[1] - 13 * Math.cos(a)]; sp.limb(ear[0], ear[1], tip[0], tip[1], r, c); return tip; };
    earAt(P.ear + P.spread, FAR); legs(2.5, FAR);
    sp.oval(rear[0] - 2.5, rear[1] - 3, 2.6, 2.6, TAIL);
    sp.oval(cx, cy, L, P.fat, FUR, P.pitch); sp.oval(hip[0], hip[1], 5, 5.2, FUR);
    legs(0, FUR);
    sp.limb(front[0], front[1], head[0], head[1], 3.6, FUR);
    earAt(P.ear, EDGE, 2.7);                                          // a dark rim, so the near ear still shows when it lies across the body
    sp.oval(head[0], head[1], 5, 4.3, FUR); sp.oval(head[0] + 4, head[1] + 1.5, 2.6, 2.3, FUR);
    const tip = earAt(P.ear, FUR); sp.limb(K.lerp(ear[0], tip[0], 0.3), K.lerp(ear[1], tip[1], 0.3), K.lerp(ear[0], tip[0], 0.85), K.lerp(ear[1], tip[1], 0.85), 0.5, PINK);
    sp.dot(head[0] + 6.4, head[1] + 0.6, PINK);
    const ex = Math.round(head[0] + 1.5), ey = Math.round(head[1] - 1), eye = Math.round(P.eye);
    if (eye === 1) { sp.dot(ex - 1, ey, DARK); sp.dot(ex, ey, DARK); sp.dot(ex + 1, ey, DARK); }
    else { sp.dot(ex, ey, DARK); sp.dot(ex, ey - 1, DARK); if (eye === 2) { sp.dot(ex + 1, ey, DARK); sp.dot(ex + 1, ey - 1, DARK); } }
    if (P.mouth > 0.5) { sp.dot(head[0] + 4, head[1] + 3, DARK); sp.dot(head[0] + 5, head[1] + 3, DARK); }
  }
  // what the hare is doing at time t
  function hareNow(t) {
    const H = HARE, run = (t0) => hareRun((t - t0) / 0.2);          // one bound = 6 wall pictures
    let P, flip = false, lift = 0;
    if (t < T_GO + 0.08) {
      P = mixPose(H.ready, H.set, K.seg(t, T_GO - 0.9, T_GO - 0.5, K.ease.inOut));
      if (t < T_GO - 0.9) { const k = t % 1.1; if (k > 0.75 && k < 0.95) P = { ...P, ear: 0.5, spread: 0.1 }; }      // an ear flicks while he waits
      if (t > 0.3 && t < 1.2) lift = Math.round(2.5 * Math.abs(Math.sin((t - 0.3) * Math.PI / 0.3)));                 // and he cannot keep still: three little hops
    } else if (t < T_STOP - 0.38) P = run(T_GO);
    else if (t < T_STOP + 0.1) P = H.skid;
    else if (t < T_DOWN) {
      P = mixPose(H.skid, H.sit, K.seg(t, T_STOP + 0.1, T_STOP + 0.3));
      flip = t > T_LOOK && t < T_LOOK + 0.7;                         // he turns round to look for the tortoise, and laughs
      if (flip) lift = Math.round(Math.abs(Math.sin((t - T_LOOK) * 13)));
      const y = K.seg(t, T_YAWN, T_YAWN + 0.2) - K.seg(t, T_DOWN - 0.15, T_DOWN);
      if (y > 0) P = mixPose(P, H.yawn, y);
    } else if (t < T_WAKE) {
      P = mixPose(H.sit, H.sleep, K.seg(t, T_DOWN, T_SLEEP, K.ease.inOut));
      if (t > T_SLEEP) P = { ...P, fat: P.fat + 0.9 * K.smooth(-0.2, 0.6, Math.sin((t - T_SLEEP) * 2 * Math.PI)) };   // breathing
    } else if (t < T_DASH) { P = mixPose(H.sleep, H.alarm, K.seg(t, T_WAKE, T_WAKE + 0.1)); lift = Math.round(5 * Math.sin(Math.PI * K.seg(t, T_WAKE, T_WAKE + 0.3))); }
    else if (t < T_DASH + 0.4) P = run(T_DASH);
    else if (t < T_DASH + 0.7) P = H.skid;
    else P = mixPose(H.skid, H.aghast, K.seg(t, T_DASH + 0.7, T_DASH + 1.1));
    return { P, flip, lift };
  }

  // ---- the tortoise: a domed shell with plates, a small head on a neck, four stumpy legs
  const TORT_PAL = ['#06200c', '#178f3a', '#7fdc3c', '#f0b92a', '#e8ea7a', '#a7ab45', '#10160c'], SHELL = 1, PLATE = 2, RIM = 3, SKIN = 4, SKINFAR = 5, TEYE = 6;
  const tortSprite = makeSprite(50, 26), TORT_AX = 19, TORT_AY = 23;
  const STEP = 20;                              // lamps walked per leg cycle: feet stay planted while the body passes over them
  // P: walk (leg cycle 0..1), moving (0 standing .. 1 walking), head [stretch forward, up], eye (0 open, 1 shut), smile
  function drawTortoise(sp, P) {
    sp.clear();
    const G = TORT_AY, cx = TORT_AX, by = G - 5 - (Math.sin(4 * Math.PI * P.walk) > 0.3 ? Math.round(P.moving) : 0);
    const leg = (hx, off, c) => {
      const u = wrap(P.walk + off, 1), fx = u < 0.6 ? 6 - 12 * u / 0.6 : -6 + 12 * (u - 0.6) / 0.4, up = u < 0.6 ? 0 : 2.4 * Math.sin(Math.PI * (u - 0.6) / 0.4);
      sp.limb(hx, by - 1, hx + fx * P.moving, G - 2.3 - up * P.moving, 2.3, c);
    };
    leg(cx - 5, 0.5, SKINFAR); leg(cx + 11, 0, SKINFAR);
    sp.limb(cx - 13, by - 2.5, cx - 17.5, by - 0.5, 1.1, SKIN);
    const hc = [cx + 19 + P.head[0], by - 8 - P.head[1]];
    sp.limb(cx + 11, by - 3, hc[0], hc[1], 2.2, SKIN); sp.oval(hc[0], hc[1], 4, 3.3, SKIN);
    leg(cx - 8, 0, SKIN); leg(cx + 8, 0.5, SKIN);
    sp.fill(cx - 15, by - 12, cx + 15, by, (x, y) => ((x - cx) / 14.5) ** 2 + ((y - by) / 11.5) ** 2 <= 1, SHELL);
    sp.oval(cx, by - 7.5, 4.4, 2.6, PLATE); sp.oval(cx - 8.5, by - 4.6, 3, 2.3, PLATE); sp.oval(cx + 8.5, by - 4.6, 3, 2.3, PLATE);
    sp.fill(cx - 15, by - 1, cx + 15, by, () => true, RIM);
    const ex = Math.round(hc[0] + 1.5), ey = Math.round(hc[1] - 1);
    if (P.eye > 0.5) { sp.dot(ex - 1, ey, TEYE); sp.dot(ex, ey, TEYE); sp.dot(ex + 1, ey, TEYE); } else { sp.dot(ex, ey, TEYE); sp.dot(ex, ey - 1, TEYE); }
    if (P.smile > 0.5) { sp.dot(hc[0] + 2, hc[1] + 1.6, TEYE); sp.dot(hc[0] + 3, hc[1] + 1.2, TEYE); }
  }
  function tortoiseNow(t) {
    const d = plodded(t), moving = K.seg(t, T_GO + 0.2, T_GO + 0.45) * (1 - K.smooth(WALK_END - 3, WALK_END, d)), won = K.seg(t, T_WIN + 0.5, T_WIN + 0.8, K.ease.outBack);
    const blink = t < T_GO ? t % 1.7 > 1.55 : false;
    return { walk: d / STEP, moving, head: [1.5 * Math.sin(d / STEP * 4 * Math.PI) * moving + (t < T_GO ? Math.round(K.smooth(0.8, 1.2, t) - K.smooth(1.6, 1.9, t)) * 2 : 0), 3 * won], eye: blink || won > 0.5 ? 1 : 0, smile: won };
  }

  // ---------------------------------------------------------------- the world
  const CUP = ['..YYYYYYYYY..', 'YYYYWYYYYYYYY', 'Y.YYWYYYYYY.Y', 'Y.YYWYYYYYY.Y', 'YYYYWYYYYYYYY', '..YYWYYYYYY..', '...YYYYYYY...', '....YYYYY....', '.....YYY.....', '.....YYY.....', '...YYYYYYY...', '..YYYYYYYYY..'];
  const cupSprite = makeSprite(15, 14);
  const ZS = [['####', '..#.', '.#..', '####'], ['#####', '...#.', '..#..', '.#...', '#####'], ['#######', '.....#.', '....#..', '...#...', '..#....', '.#.....', '#######']];
  const CONFETTI = ['#ff3b30', '#ffd400', '#35d0ff', '#ffffff', '#ff7ad1', '#7dff5a'];

  function scenery(ctx, t, scroll) {
    const f = Math.round(t * REFRESH), late = K.smooth(T_SLEEP, T_WIN, t);      // the afternoon wears on while the hare sleeps
    ctx.fillStyle = mixHex('#0f4fc8', '#1b3da6', late); ctx.fillRect(0, 0, COLS, HORIZON);
    ctx.fillStyle = '#2f80ee'; ctx.fillRect(0, 17, COLS, HORIZON - 17);
    const glow = Math.round(late * 11);                                           // evening comes up from the horizon a row at a time
    if (glow > 0) { ctx.fillStyle = '#ffd34a'; ctx.fillRect(0, HORIZON - glow - 1, COLS, 1); ctx.fillStyle = '#ff8a3a'; ctx.fillRect(0, HORIZON - glow, COLS, glow); }
    blob(ctx, 24, 6 + 11 * late, 5.5, 5.5, mixHex('#fff27a', '#ffd23a', late));
    for (const [x, y, s] of [[30, 7, 9], [118, 4, 7], [215, 9, 10]]) {           // clouds, far away so they barely move
      const cx = wrap(x - scroll * 0.12, 250) - 30, col = mixHex('#eaf2ff', '#ffd9c2', late);
      blob(ctx, cx, y, s, s * 0.34, col); blob(ctx, cx - s * 0.35, y - 2, s * 0.45, s * 0.3, col); blob(ctx, cx + s * 0.4, y - 1, s * 0.4, s * 0.25, col);
    }
    for (let x = 0; x < COLS; x++) {                                             // two ranges of hills, moving slower than the track
      const a = x + scroll * 0.3, b = x + scroll * 0.55;
      ctx.fillStyle = '#0c6f58'; let h = Math.round(7 + 4 * Math.sin(a * 0.043) + 2 * Math.sin(a * 0.11 + 1)); ctx.fillRect(x, HORIZON - h, 1, h);
      ctx.fillStyle = '#12913f'; h = Math.round(3 + 2.5 * Math.sin(b * 0.06 + 2) + 1.5 * Math.sin(b * 0.17)); ctx.fillRect(x, HORIZON - h, 1, h);
    }
    ctx.fillStyle = '#35c842'; ctx.fillRect(0, HORIZON, COLS, TRACK - HORIZON); ctx.fillStyle = '#1f9a30'; ctx.fillRect(0, TRACK_END, COLS, STRIP - TRACK_END);
    ctx.fillStyle = '#b54d1c'; ctx.fillRect(0, TRACK, COLS, TRACK_END - TRACK);
    ctx.save(); ctx.beginPath(); ctx.rect(0, TRACK + 1, COLS, LANE - TRACK - 1); ctx.clip(); blob(ctx, X_NAP - 12 - scroll, TRACK + 6, 30, 7, '#86380f'); ctx.restore();                // the shade of the tree
    for (let x = 0; x < COLS; x++) {                                             // everything fixed to the ground scrolls with the track
      const w = x + scroll;
      if (K.hash(w, 3) < 0.06) { ctx.fillStyle = '#1f9a30'; ctx.fillRect(x, HORIZON + 1 + Math.floor(K.hash(w, 5) * 4), 1, 1); }                       // tufts
      if (K.hash(w, 7) < 0.09) { ctx.fillStyle = '#8f3a12'; ctx.fillRect(x, TRACK + 2 + Math.floor(K.hash(w, 9) * (TRACK_END - TRACK - 4)), 2, 1); }   // grit
      ctx.fillStyle = '#ffe7c4'; ctx.fillRect(x, TRACK, 1, 1); ctx.fillRect(x, TRACK_END - 1, 1, 1); if (wrap(w, 12) < 6) ctx.fillRect(x, LANE, 1, 1);   // lane lines
      if (wrap(w, 60) < 2) { ctx.fillStyle = '#f4f4f4'; ctx.fillRect(x, HORIZON + 1, 1, 4); }                                                          // marker posts
    }
    // start line, and the starter's flag on its post: up before the off, down at the off
    ctx.fillStyle = '#ffffff'; ctx.fillRect(X_START - scroll, TRACK, 2, TRACK_END - TRACK);
    const px = X_START + 5 - scroll, drop = K.seg(t, T_GO, T_GO + 0.28, K.ease.outBack), a = K.lerp(1.15, -0.55, drop) + (t < T_GO ? 0.1 * Math.sin(t * 7) : 0), fs = flagSprite;
    ctx.fillStyle = '#aab3bd'; ctx.fillRect(px, 11, 2, TRACK - 11);
    fs.clear(); const co = Math.cos(a), si = Math.sin(a), fx = 6 + 15 * co, fy = 21 - 15 * si;
    fs.limb(6, 21, fx, fy, 0.6, 2);
    fs.fill(0, 0, fs.w, fs.h, (x, y) => { const u = (x - 6) * co - (y - 21) * si, v = -(x - 6) * si - (y - 21) * co; return u > 6 && u <= 15.5 && v < -0.5 && v >= -7; }, 1);
    stamp(ctx, fs, 6, 21, px, 12, ['#2b0a06', '#ff2a1a', '#e8e8e8']);
    // the tree
    const tx = X_NAP + 4 - scroll;
    ctx.fillStyle = '#8a5220'; ctx.fillRect(tx, 12, 6, TRACK - 12 + 1); ctx.fillRect(tx - 1, TRACK - 1, 8, 2); ctx.fillStyle = '#5f3512'; ctx.fillRect(tx + 4, 12, 2, TRACK - 12 + 1);
    blob(ctx, tx + 3, 9, 22, 8.5, '#0d7a2c'); blob(ctx, tx - 12, 12, 11, 6, '#0d7a2c'); blob(ctx, tx + 17, 12, 11, 6, '#0d7a2c');
    blob(ctx, tx - 2, 5, 10, 3.5, '#2fb544'); blob(ctx, tx + 13, 8, 5, 2.5, '#2fb544'); blob(ctx, tx - 13, 10, 5, 2, '#2fb544');
    // the finish: a chequered line across both lanes and a chequered flag that waves
    const qx = X_FINISH - scroll;
    for (let y = TRACK; y < TRACK_END; y++) for (let x = 0; x < 4; x++) { ctx.fillStyle = ((x >> 1) + ((y - TRACK) >> 1)) % 2 ? '#101010' : '#ffffff'; ctx.fillRect(qx + x, y, 1, 1); }
    ctx.fillStyle = '#aab3bd'; ctx.fillRect(qx + 5, 5, 2, TRACK - 5);
    for (let x = 0; x < 12; x++) { const dy = Math.round(1.2 * Math.sin(x * 0.7 - f * 0.35) * (x / 11)); for (let y = 0; y < 8; y++) { ctx.fillStyle = ((x >> 1) + (y >> 1)) % 2 ? '#101010' : '#ffffff'; ctx.fillRect(qx + 7 + x, 5 + y + dy, 1, 1); } }
  }
  const flagSprite = makeSprite(28, 38);

  // one finished picture for time t
  function drawContent(ctx, t) {
    const f = Math.round(t * REFRESH), scroll = Math.round(scrollAt(t));
    scenery(ctx, t, scroll);
    // the hare, with whatever he is kicking up
    const hare = hareNow(t), hx = Math.round(hareNose(t) - 17 - scroll), fast = (t > T_GO + 0.1 && t < T_STOP - 0.38) || (t > T_DASH + 0.03 && t < T_DASH + 0.4);
    const skid = (t > T_STOP - 0.38 && t < T_STOP + 0.15) ? T_STOP - 0.38 : (t > T_DASH + 0.4 && t < T_DASH + 0.85) ? T_DASH + 0.4 : 0;
    if (fast) for (let k = 0; k < 4; k++) { const len = 6 + Math.floor(K.hash(f, k) * 12); ctx.fillStyle = '#ffffff'; ctx.fillRect(hx - 22 - len - Math.floor(K.hash(f, k + 9) * 10), HARE_Y - 4 - k * 5, len, 1); }   // speed lines
    for (const [t0, x0, dir] of [[T_GO + 0.08, X_START - 22, -1], [skid, hareNose(skid) + 2, 1], [T_DASH, X_NAP - 22, -1]]) {     // dust at every start and stop
      const u = K.seg(t, t0, t0 + 0.45);
      if (t0 && u > 0 && u < 1) for (let k = 0; k < 3; k++) blob(ctx, x0 - scroll + dir * (2 + k * 4 + u * 6), HARE_Y - 1 - k * 2 - u * 4, 1.2 + u * 2.2 - k * 0.3, 1 + u * 1.6, u < 0.6 ? '#ffe2b8' : '#e08a4a');
    }
    drawHare(hareSprite, hare.P); stamp(ctx, hareSprite, HARE_AX, HARE_AY, hx, HARE_Y - hare.lift, HARE_PAL, hare.flip);
    // Zzz while he sleeps, an exclamation mark when he wakes
    for (let k = 0; k < 8; k++) {
      const born = T_SLEEP + 0.1 + k * 0.55, u = (t - born) / 1.5;
      if (u > 0 && u < 1 && born < T_WAKE - 0.3 && t < T_WAKE + 0.1) pixmap(ctx, ZS[Math.min(2, Math.floor(u * 3))], X_NAP - 4 - scroll + Math.round(u * 9 + 2 * Math.sin(u * 7 + k)), HARE_Y - 16 - Math.round(u * 17), { '#': u > 0.85 ? '#7fa8e8' : '#ffffff' });
    }
    if (t > T_WAKE && t < T_DASH && (t - T_WAKE < 0.3 || f % 4 < 3)) dotText(ctx, '!', hx - 12, HARE_Y - 37, '#ffe000', 2);
    // the tortoise, in the near lane, in front of everything
    const d = plodded(t), tx = Math.round(X_START - 4 - 23 + d - scroll);
    drawTortoise(tortSprite, tortoiseNow(t)); stamp(ctx, tortSprite, TORT_AX, TORT_AY, tx, TORT_Y, TORT_PAL);
    // he wins: a cup pops up over his shell, and confetti comes down
    if (t > T_WIN) {
      for (let k = 0; k < 60; k++) {
        const age = t - T_WIN - K.hash(k, 1) * 1.2, y = -3 + age * (16 + 14 * K.hash(k, 2));
        if (age > 0 && y < STRIP - 2) { ctx.fillStyle = CONFETTI[k % CONFETTI.length]; ctx.fillRect(Math.round(X_FINISH - 70 + K.hash(k, 3) * 130 - scroll + 2 * Math.sin(age * 5 + k)), Math.round(y), K.hash(k, 4) < 0.5 ? 2 : 1, 1); }
      }
      const up = K.seg(t, T_WIN + 0.45, T_WIN + 0.8, K.ease.outBack);
      if (up > 0) { cupSprite.clear(); CUP.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') cupSprite.dot(i + 1, j + 1, ch === 'Y' ? 1 : 2); })); stamp(ctx, cupSprite, 7, 13, tx + 1, TORT_Y - 19 - Math.round(up * 5) - (f % 16 < 8 ? 1 : 0), ['#3a2200', '#ffd91a', '#fffbd0']); }
    }
    // caption strip: one short line per beat; a new line pushes the old one up and out
    ctx.fillStyle = '#000000'; ctx.fillRect(0, STRIP, COLS, ROWS - STRIP); ctx.fillStyle = '#4a2f00'; ctx.fillRect(3, STRIP, COLS - 6, 1);
    let i = 0; while (i < CAPTIONS.length - 1 && t >= CAPTIONS[i + 1][0]) i++;
    const push = i ? K.seg(t, CAPTIONS[i][0], CAPTIONS[i][0] + 0.3, K.ease.out) : 1, line = (k, dy) => { const [, text, words] = CAPTIONS[k]; dotText(ctx, words ? text.split(' ').filter((_, n) => t >= words[n]).join(' ') : text, Math.round(COLS / 2 - dotWidth(text) / 2), STRIP + 2 + dy, '#ffb000'); };
    ctx.save(); ctx.beginPath(); ctx.rect(0, STRIP + 1, COLS, ROWS - STRIP - 1); ctx.clip();
    line(i, Math.round((1 - push) * 10)); if (push < 1) line(i - 1, -Math.round(push * 10));
    ctx.restore();
    // switch-on: each column of cabinets scans on downwards, slowly at first; the line being written runs hot.
    // On the first frame the scan is just passing the lamp the camera starts on
    const lag = (k) => (k * 7) % 5;
    for (let k = 0; k < COLS / CAB; k++) {
      const row = Math.floor(HERO[1] + 0.1 + lag(k) - lag(Math.floor(HERO[0] / CAB)) + 3.4 * t + 60 * t * t * t * t);
      if (row < ROWS) { ctx.fillStyle = '#000000'; ctx.fillRect(k * CAB, row + 1, CAB, ROWS); ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(k * CAB, row, CAB, 1); }
    }
  }

  registerStyle({
    id: 'led-wall',
    name: 'LED Wall',
    family: 'Flat content made physical',
    look: 'A giant outdoor screen made of real lamps: thousands of frosted round LEDs in black louvred cabinets on a steel gantry at night. From far away it is a crisp bright picture; close up it falls apart into single glowing lamps, each with a red, a green and a blue chip under its lens.',
    motion: 'The wall plays pixel animation at one pixel per lamp and 30 pictures a second: characters built from a few flat colours with a dark outline walk, run, stop and react in real cycles, the ground scrolls under them lamp by lamp with slower hills behind, and one short caption per beat pushes up into a ticker strip along the bottom. The camera does the opposite of the content: one slow continuous pull from a single lamp to the whole wall, still drifting at the end.',
    light: 'The wall is the light. Its own colours spill onto the louvres and the black plastic between the lamps, glow in the haze around it, tint the steel and paint the wet ground, and all of it changes when the picture changes. One cold floodlight from behind gives the steel a rim; everything else is night.',
    materials: 'Frosted dome lenses in black collars, satin black louvres and cabinet faces with seams and screws, galvanised lattice steel, rubber cable, wet tarmac with dry patches and a painted line.',
    camera: 'Long lens. Starts as a macro shot at a low angle across the lamps with very shallow focus, pulls back and swings round to face the wall while the story waits on its opening pose, has the wall in frame by the time the first story event happens, and then keeps drifting back and across, low over the wet ground, to the last frame.',
    post: 'Soft bloom from the lamps, true-colour (neutral) tone mapping so the LED colours stay saturated, light vignette, very little grain. No scanline or pixel filters: the dots are real geometry.',
    explains: 'Any 2D animation, diagram or story that can be drawn at lamp resolution: a fable with two characters, a process with parts that move along a track, a chart that grows, a map with a route, a game-like sequence. Draw it on a small canvas with one pixel per lamp. A beat is something happening in that picture (a character sets off, stops, is overtaken, arrives); a label is one short dot-font line in the ticker strip; what moves is the pixel picture, while the wall, its housing and the light it throws stay the same and take their colour from whatever is playing.',
    topic: 'The Tortoise and the Hare, as a pixel cartoon playing on the lamp wall',
    duration: 12,
    fonts: [],
    render: { samples: 80, shutter: 0.5, tone: 'neutral', exposure: 1.0, bloom: 0.46, bloomThreshold: 1.0, vignette: 0.3, grain: 0.018, fov: 30, far: 400, background: '#020304' },

    build(S) {
      const { THREE, K, scene, camera } = S;
      const PITCH = 0.1, CABW = CAB * PITCH, WALL_W = COLS * PITCH, WALL_H = ROWS * PITCH, GROUND = -4.9;
      const fl = (x) => x.toFixed(5);
      const add = (geo, mat, x = 0, y = 0, z = 0, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; scene.add(m); return m; };

      // ------------------------------------------------------------ the content canvas, shared by everything
      // One texture feeds the lamps (read at its exact pixels) and, read blurred through its mip levels, every
      // surface the wall lights: louvres, cabinet faces and the haze. So the spill always matches the picture.
      const cv = document.createElement('canvas'); cv.width = COLS; cv.height = ROWS;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      const content = new THREE.CanvasTexture(cv);
      content.colorSpace = THREE.SRGBColorSpace; content.generateMipmaps = true; content.minFilter = THREE.LinearMipmapLinearFilter;
      const U = { uContent: { value: content }, uGain: { value: 1 } };
      // a standard material with extra emitted light that is read from the content texture
      const wallMat = (params, vDecl, vBody, fDecl, fBody) => {
        const m = new THREE.MeshStandardMaterial(params);
        m.onBeforeCompile = (sh) => {
          Object.assign(sh.uniforms, U);
          sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform sampler2D uContent;\n' + vDecl).replace('#include <begin_vertex>', '#include <begin_vertex>\n' + vBody);
          sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uContent; uniform float uGain;\n' + fDecl).replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + fBody);
        };
        m.customProgramCacheKey = () => vBody + fBody;
        return m;
      };

      // ------------------------------------------------------------ night, haze and two floodlights
      K.env(S, { top: '#04060a', horizon: '#0a0e15', bottom: '#020203', intensity: 0.7, panels: [
        { pos: [-18, 20, -24], size: [6, 4], color: '#cfe0ff', power: 26 },
        { pos: [16, 12, 26], size: [10, 5], color: '#b9c9e6', power: 2.2 },
      ] });
      scene.fog = new THREE.FogExp2('#04060a', 0.009);
      K.spot(S, { pos: [-18, 20, -24], target: [2, -4, 5], color: '#cfe0ff', power: 900, angle: 0.5, penumbra: 1, soft: 0.8, far: 90 });   // rim from behind
      K.spot(S, { pos: [16, 12, 26], target: [0, 0, 0], color: '#c9d6ee', power: 160, angle: 0.5, penumbra: 1, shadow: false });            // just enough to see the hardware

      // ------------------------------------------------------------ cabinets: 18 x 18 lamps each, never perfectly aligned
      const NCX = COLS / CAB, NCY = ROWS / CAB, rnd = K.rng(7), cabs = [];
      const o = new THREE.Object3D();
      for (let j = 0; j < NCY; j++) for (let i = 0; i < NCX; i++) {
        o.position.set((i - (NCX - 1) / 2) * CABW, ((NCY - 1) / 2 - j) * CABW, rnd.range(-0.006, 0.006));
        o.rotation.set(rnd.range(-0.004, 0.004), rnd.range(-0.004, 0.004), rnd.range(-0.0012, 0.0012)); o.updateMatrix();
        const odd = i === 6 && j === 1;                      // one cabinet was replaced: a little dimmer and cooler than its neighbours
        cabs.push({ i, j, m: o.matrix.clone(), tint: odd ? [0.82, 0.9, 0.98] : new Array(3).fill(rnd.range(0.95, 1.03)) });
      }
      const DEAD = [[HERO[0] - 2, HERO[1] + 1], [21, 9], [22, 9], [139, 31], [101, 47]];   // lamps that have failed

      // lamps: a black collar and a frosted dome. The light is added in the shader from the lamp's own content pixel
      const R = 0.042;
      const lampGeo = (seg, steps) => {
        const pts = [[R, 0], [R, 0.011], [R * 0.84, 0.014], [R * 0.79, 0.014]];
        for (let i = 1; i <= steps; i++) { const a = (i / steps) * Math.PI / 2; pts.push([R * 0.79 * Math.cos(a), 0.014 + 0.03 * Math.sin(a)]); }
        const g = new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), seg); g.rotateX(Math.PI / 2);
        const p = g.attributes.position, lens = new Float32Array(p.count);
        for (let i = 0; i < p.count; i++) lens[i] = Math.hypot(p.getX(i), p.getY(i)) < R * 0.8 ? 1 : 0;
        g.setAttribute('aLens', new THREE.BufferAttribute(lens, 1));
        return g;
      };
      const lampMat = wallMat({ color: '#3e4146', roughness: 0.42 },
        'attribute vec2 aCell; attribute vec3 aTint; attribute float aLens; varying vec3 vLamp, vSpill; varying vec2 vDisc; varying float vLens;',
        `vLamp = texture2D(uContent, aCell).rgb * aTint; vSpill = textureLod(uContent, aCell, 2.0).rgb; vDisc = position.xy / ${fl(R)}; vLens = aLens;`,
        'varying vec3 vLamp, vSpill; varying vec2 vDisc; varying float vLens;',
        `{ // three chips under one frosted lens: red, green and blue sit side by side and only mix in the diffuser,
           // so a white lamp seen close has three coloured hearts. The dome is brightest where it faces the viewer.
          vec2 cr = vDisc - vec2(-0.23, -0.13), cg = vDisc - vec2(0.23, -0.13), cb = vDisc - vec2(0.0, 0.26);
          vec3 d2 = vec3(dot(cr, cr), dot(cg, cg), dot(cb, cb)), chips = 2.8 * exp(-d2 / 0.013) + 0.2 * exp(-d2 / 0.07);   // a hot point and its halo
          float facing = 0.06 + 0.94 * pow(saturate(dot(normal, normalize(vViewPosition))), 2.0);
          totalEmissiveRadiance += vLens * uGain * (vLamp * (0.42 + chips) * facing + vSpill * 0.03);   // + a little light from the neighbours
          diffuseColor.rgb *= mix(0.06, 1.0, vLens);                                                           // the collar is black plastic
        }`);
      const cellsHi = [], cellsLo = [];
      for (const cab of cabs) for (let r = 0; r < CAB; r++) for (let c = 0; c < CAB; c++) {
        const cx = cab.i * CAB + c, cy = cab.j * CAB + r, vary = 0.86 + 0.22 * K.hash(cx, cy), dead = DEAD.some((d) => d[0] === cx && d[1] === cy);
        const p = new THREE.Vector3((c - (CAB - 1) / 2) * PITCH, ((CAB - 1) / 2 - r) * PITCH, 0).applyMatrix4(cab.m);
        (Math.abs(cx - HERO[0]) < 20 && Math.abs(cy - HERO[1]) < 13 ? cellsHi : cellsLo).push({ p, uv: [(cx + 0.5) / COLS, 1 - (cy + 0.5) / ROWS], tint: cab.tint.map((v) => (dead ? 0 : v * vary)) });
      }
      // full detail only around the lamp the camera starts on; the rest of the wall never fills more than a few pixels
      for (const [cells, geo] of [[cellsHi, lampGeo(36, 8)], [cellsLo, lampGeo(14, 4)]]) {
        const mesh = new THREE.InstancedMesh(geo, lampMat, cells.length); mesh.frustumCulled = false;
        geo.setAttribute('aCell', new THREE.InstancedBufferAttribute(new Float32Array(cells.flatMap((q) => q.uv)), 2));
        geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(new Float32Array(cells.flatMap((q) => q.tint)), 3));
        cells.forEach((q, i) => K.place(mesh, i, [q.p.x, q.p.y, q.p.z]));
        scene.add(mesh);
      }

      // louvres: a black fin above every row of lamps. Its underside is lit by the row below it, in pools under each lamp
      const FINW = CABW - 0.016, finGeo = new THREE.BoxGeometry(FINW, 0.014, 0.07);
      const finMat = wallMat({ color: '#0b0b0c', roughness: 0.7 },
        'attribute vec3 aRow; varying vec2 vRowUv; varying vec3 vFin;',
        `vRowUv = vec2(aRow.x + (position.x / ${fl(FINW)} + 0.5) * aRow.z, aRow.y); vFin = vec3(normal.y, position.z / 0.07 + 0.5, 0.0);`,
        'varying vec2 vRowUv; varying vec3 vFin;',
        `{ float pool = 0.55 + 0.45 * cos(6.2832 * (vRowUv.x * ${fl(COLS)} - 0.5)), under = smoothstep(0.4, -0.4, vFin.x);
          vec3 below = textureLod(uContent, vRowUv, 0.6).rgb, above = textureLod(uContent, vRowUv + vec2(0.0, ${fl(1 / ROWS)}), 0.6).rgb;
          totalEmissiveRadiance += uGain * (below * under * pool * (0.1 - 0.05 * vFin.y) + above * (1.0 - under) * 0.012); }`);
      const fins = new THREE.InstancedMesh(finGeo, finMat, cabs.length * CAB); fins.frustumCulled = false;
      const finRow = new Float32Array(cabs.length * CAB * 3), m4 = new THREE.Matrix4();
      cabs.forEach((cab, k) => { for (let r = 0; r < CAB; r++) {
        const n = k * CAB + r;
        o.position.set(0, ((CAB - 1) / 2 - r) * PITCH + 0.05, 0.034); o.rotation.set(0.16, 0, 0); o.scale.set(1, 1, 1); o.updateMatrix();
        fins.setMatrixAt(n, m4.multiplyMatrices(cab.m, o.matrix));
        finRow.set([cab.i * CAB / COLS, 1 - (cab.j * CAB + r + 0.5) / ROWS, CAB / COLS], n * 3);
      } });
      finGeo.setAttribute('aRow', new THREE.InstancedBufferAttribute(finRow, 3)); scene.add(fins);

      // cabinet faces: black moulded plastic in four tiles, screws at the corners; lit in a ring round every lamp
      const faceMap = K.canvasTex(1024, 1024, (c, w) => {
        const r = K.rng(3); c.fillStyle = '#17171a'; c.fillRect(0, 0, w, w);
        for (let i = 0; i < 9000; i++) { c.fillStyle = `rgba(${r.chance(0.5) ? '255,255,255' : '0,0,0'},${r.range(0.02, 0.07)})`; c.fillRect(r() * w, r() * w, r.range(1, 3), r.range(1, 3)); }
        c.strokeStyle = '#050506'; c.lineWidth = 5; c.strokeRect(2, 2, w - 4, w - 4); c.beginPath(); c.moveTo(w / 2, 0); c.lineTo(w / 2, w); c.moveTo(0, w / 2); c.lineTo(w, w / 2); c.stroke();
        for (const x of [0.25, 0.75]) for (const y of [0.25, 0.75]) for (const [dx, dy] of [[-0.222, -0.222], [0.222, -0.222], [-0.222, 0.222], [0.222, 0.222]]) {
          const sx = (x + dx) * w, sy = (y + dy) * w; c.fillStyle = '#2c2d31'; c.beginPath(); c.arc(sx, sy, 7, 0, 7); c.fill(); c.strokeStyle = '#08080a'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(sx - 5, sy); c.lineTo(sx + 5, sy); c.stroke();
        }
      });
      const FACE = CABW - 0.012, faceGeo = new THREE.BoxGeometry(FACE, FACE, 0.3); faceGeo.translate(0, 0, -0.15);
      const faceMat = wallMat({ map: faceMap, bumpMap: faceMap, bumpScale: 0.6, roughness: 0.55 },
        'attribute vec4 aRect; varying vec2 vWallUv, vCabUv; varying float vFront;',
        `vCabUv = position.xy / ${fl(CABW)} + 0.5; vWallUv = aRect.xy + vCabUv * aRect.zw; vFront = normal.z;`,
        'varying vec2 vWallUv, vCabUv; varying float vFront;',
        `{ float d = length(fract(vCabUv * ${fl(CAB)}) - 0.5);
          totalEmissiveRadiance += step(0.5, vFront) * uGain * (texture2D(uContent, vWallUv).rgb * 0.025 * smoothstep(0.7, 0.3, d) + textureLod(uContent, vWallUv, 2.5).rgb * 0.006); }`);
      const faces = new THREE.InstancedMesh(faceGeo, faceMat, cabs.length); faces.frustumCulled = false; faces.receiveShadow = true;
      cabs.forEach((cab, k) => faces.setMatrixAt(k, cab.m));
      faceGeo.setAttribute('aRect', new THREE.InstancedBufferAttribute(new Float32Array(cabs.flatMap((cab) => [cab.i * CAB / COLS, 1 - (cab.j + 1) * CAB / ROWS, CAB / COLS, CAB / ROWS])), 4));
      scene.add(faces);

      // ------------------------------------------------------------ the gantry
      // Steel and paint take the colour of the nearest part of the picture (read very blurred), as if lit through the haze
      const litByWall = (params, k) => wallMat(params, 'varying vec3 vWp;',
        'vec4 wp = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nwp = instanceMatrix * wp;\n#endif\nvWp = (modelMatrix * wp).xyz;',
        'varying vec3 vWp;',
        `{ vec2 w = vWp.xy / vec2(${fl(WALL_W)}, ${fl(WALL_H)}) + 0.5, q = clamp(w, 0.0, 1.0);
          totalEmissiveRadiance += textureLod(uContent, q, 4.6).rgb * uGain * ${fl(k)} * exp(-length((w - q) * vec2(${fl(WALL_W)}, ${fl(WALL_H)})) * 0.45); }`);
      const steel = litByWall({ color: '#7d8288', roughness: 0.5, metalness: 0.85 }, 0.05);
      const paint = litByWall({ color: '#0d0e10', roughness: 0.5, metalness: 0.3 }, 0.012);
      const rubber = new THREE.MeshStandardMaterial({ color: '#070708', roughness: 0.6 });
      add(new THREE.BoxGeometry(WALL_W + 0.2, WALL_H + 0.2, 0.3), paint, 0, 0, -0.42);                                  // back box
      const BZ = 0.16, HW = WALL_W / 2, HH = WALL_H / 2;
      for (const s of [-1, 1]) {                                                                                         // painted frame round the cabinets
        add(K.roundedBox(WALL_W + BZ * 2, BZ, 0.5, 0.02, 2), paint, 0, s * (HH + BZ / 2 + 0.01), -0.16);
        add(K.roundedBox(BZ, WALL_H + 0.02, 0.5, 0.02, 2), paint, s * (HW + BZ / 2 + 0.01), 0, -0.16);
      }
      const struts = [];                                                       // every steel member: [from, to, thickness]
      const mast = (x, z, w, y0, y1) => {                                      // a square lattice mast with zig-zag bracing
        const h = w / 2, n = Math.round((y1 - y0) / (w * 1.15)), dy = (y1 - y0) / n, cs = [[-h, -h], [h, -h], [h, h], [-h, h]];
        cs.forEach(([a, b]) => struts.push([[x + a, y0, z + b], [x + a, y1, z + b], 0.07]));
        for (let k = 0; k < n; k++) cs.forEach(([a, b], q) => { const [c, d] = cs[(q + 1) % 4], ya = y0 + k * dy, yb = ya + dy, flip = (k + q) % 2;
          struts.push([[x + a, flip ? yb : ya, z + b], [x + c, flip ? ya : yb, z + d], 0.035]); struts.push([[x + a, yb, z + b], [x + c, yb, z + d], 0.035]); });
      };
      const MX = HW + 0.62, TOP = HH + 1.25;
      for (const s of [-1, 1]) {
        mast(s * MX, -0.36, 0.62, GROUND, TOP);
        add(K.roundedBox(1.05, 0.07, 1.05, 0.015, 2), steel, s * MX, GROUND + 0.035, -0.36);                             // base plate
        for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) add(new THREE.CylinderGeometry(0.035, 0.035, 0.1, 6), steel, s * MX + a * 0.42, GROUND + 0.09, -0.36 + b * 0.42);
      }
      for (const z of [-0.05, -0.67]) for (const y of [HH + 0.4, TOP]) struts.push([[-MX, y, z], [MX, y, z], 0.07]);     // top truss
      for (let k = 0, n = 22; k < n; k++) for (const z of [-0.05, -0.67]) { const xa = -MX + (k / n) * MX * 2, xb = xa + MX * 2 / n; struts.push([[xa, k % 2 ? TOP : HH + 0.4, z], [xb, k % 2 ? HH + 0.4 : TOP, z], 0.04]); }
      for (const s of [-1, 1]) for (const y of [-HH - 0.28, HH + 0.29]) struts.push([[s * (HW - 0.4), y, -0.36], [s * (MX + 0.3), y, -0.36], 0.12]);   // the frame hangs on stubs
      struts.push([[-MX, -HH - 0.28, -0.36], [MX, -HH - 0.28, -0.36], 0.1]);
      const strutMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), steel, struts.length), up = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3();
      struts.forEach(([a, b, w], i) => {
        dir.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const len = dir.length();
        o.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); o.quaternion.setFromUnitVectors(up, dir.normalize()); o.scale.set(w, len, w); o.updateMatrix(); strutMesh.setMatrixAt(i, o.matrix);
      });
      strutMesh.castShadow = strutMesh.receiveShadow = true; strutMesh.frustumCulled = false; scene.add(strutMesh);
      // cables: three runs out of the bottom corner, down the mast and across the ground to a floor box
      for (let k = 0; k < 3; k++) {
        const e = k * 0.07, g = GROUND + 0.035;
        add(K.tube([[HW - 0.6 - e, -HH - 0.2, -0.3], [HW - 0.2, -HH - 0.62 - e, -0.2], [HW + 0.28, -HH - 0.3 + e, -0.02], [HW + 0.3 + e, GROUND + 0.5, 0.02], [HW + 0.1, g, 0.5 + e], [HW - 1.2, g, 1.3 + e * 2], [HW - 2.6, g, 1.1 + e], [HW - 3.6, g, 1.75 + e]], 0.028, { segments: 90, radial: 8 }), rubber);
      }
      add(K.roundedBox(0.7, 0.34, 0.5, 0.03, 3), paint, HW - 3.9, GROUND + 0.17, 1.8);

      // ------------------------------------------------------------ wet ground: a mirror (the water) under dry tarmac patches
      const grit = K.canvasTex(512, 512, (c, w) => { const r = K.rng(9); c.fillStyle = '#808080'; c.fillRect(0, 0, w, w); for (let i = 0; i < 26000; i++) { const v = r.int(40, 215); c.fillStyle = `rgb(${v},${v},${v})`; c.fillRect(r() * w, r() * w, r.range(1, 3), r.range(1, 3)); } }, { repeat: [40, 40], data: true });
      K.mirrorFloor(S, { y: GROUND, size: 200, color: '#07080a', roughness: 0.14, strength: 1, fresnel: true, surfaceRoughness: 0.5, material: { bumpMap: grit, bumpScale: 0.5 } });
      const nz = K.noise(21);
      const dry = K.canvasTex(512, 512, (c, w) => {            // white = dry, black = standing water, soft edges
        const img = c.createImageData(w, w);
        for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) { const v = 255 * K.smooth(0.02, 0.2, nz.fbm(x / 40, y / 40, 0, 4) + 0.1 * nz.n2(x / 6, y / 6)); img.data.set([v, v, v, 255], (y * w + x) * 4); }
        c.putImageData(img, 0, 0);
      }, { data: true });
      const tarmac = new THREE.MeshStandardMaterial({ color: '#2c2e33', roughness: 0.85, map: grit, alphaMap: dry, transparent: true, opacity: 0.45 });
      const patches = add(new THREE.PlaneGeometry(70, 70), tarmac, 0, GROUND + 0.004, 8, false); patches.rotation.x = -Math.PI / 2;
      const line = add(new THREE.PlaneGeometry(60, 0.14), new THREE.MeshStandardMaterial({ color: '#c9cbc6', roughness: 0.7, transparent: true, opacity: 0.8 }), 0, GROUND + 0.006, 3.4, false); line.rotation.x = -Math.PI / 2;

      // ------------------------------------------------------------ the light the wall throws
      // Haze: sheets of mist in front of the wall, each showing the picture more blurred and further spread the
      // further out it hangs. Together they read as glow in wet air, in the colours on screen right now.
      const mist = K.canvasTex(256, 256, (c, w) => {
        const img = c.createImageData(w, w), n = K.noise(5);
        for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) { const v = 255 * K.clamp(0.5 + 0.9 * n.fbm(x / 64, y / 64, 0, 4)); img.data.set([v, v, v, 255], (y * w + x) * 4); }
        c.putImageData(img, 0, 0);
      }, { repeat: [1, 1], data: true });
      const sheets = [0.5, 1.3, 2.4, 3.8, 5.6].map((z, k) => {
        const grow = 1 + z * 0.22, m = new THREE.ShaderMaterial({
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
          uniforms: { uContent: U.uContent, uGain: U.uGain, uMist: { value: mist }, uLod: { value: 3.4 + k * 0.6 }, uGrow: { value: grow }, uAmount: { value: 0 }, uDrift: { value: 0 } },
          vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
          fragmentShader: `uniform sampler2D uContent, uMist; uniform float uGain, uLod, uGrow, uAmount, uDrift; varying vec2 vUv;
            void main(){ vec2 p = (vUv - 0.5) * uGrow + 0.5, q = clamp(p, 0.0, 1.0);              // p: where we are on the wall, running past its edges
              float past = length((p - q) * vec2(${fl(WALL_W)}, ${fl(WALL_H)}));
              float edge = smoothstep(0.0, 0.2, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));
              float m = texture2D(uMist, vUv * vec2(1.6, 0.8) + vec2(uDrift, 0.0)).r;
              gl_FragColor = vec4(textureLod(uContent, q, uLod).rgb * exp(-past * 0.9) * mix(0.35, 1.0, smoothstep(0.0, 0.5, past)) * edge * (0.7 + 0.6 * m) * uAmount * uGain, 1.0); }`,
        });
        add(new THREE.PlaneGeometry(WALL_W * grow, WALL_H * grow), m, 0, 0, z, false);
        return { z, m, k };
      });
      // Spill: twelve coloured lights on the face of the wall, each taking the average colour of its part of the
      // picture. They shine straight out with a very wide soft cone, like a glowing surface does, so they light the
      // ground and whatever stands in front, and never the wall itself.
      const ZX = 6, ZY = 2, zones = [];
      for (let j = 0; j < ZY; j++) for (let i = 0; i < ZX; i++) {
        const l = new THREE.SpotLight('#000000', 1, 0, 1.5, 1, 2); l.position.set(((i + 0.5) / ZX - 0.5) * WALL_W, (0.5 - (j + 0.5) / ZY) * WALL_H, 0.12);
        l.target.position.set(l.position.x, l.position.y, 10); scene.add(l, l.target); zones.push(l);
      }
      const lin = Array.from({ length: 256 }, (_, v) => Math.pow(v / 255, 2.2));
      let shown = -1;
      // Draw the picture for time t. The wall only changes 30 times a second, between two camera exposures, so the
      // lamps never smear; the cache key is the picture number, which keeps this a pure function of t.
      function show(t) {
        const f = Math.round(t * REFRESH);
        if (f === shown) return; shown = f;
        drawContent(ctx, f / REFRESH); content.needsUpdate = true;
        const px = ctx.getImageData(0, 0, COLS, ROWS).data, zw = COLS / ZX, zh = ROWS / ZY;
        zones.forEach((l, k) => {
          let r = 0, g = 0, b = 0; const x0 = (k % ZX) * zw, y0 = Math.floor(k / ZX) * zh;
          for (let y = y0; y < y0 + zh; y++) for (let x = x0; x < x0 + zw; x++) { const i = (y * COLS + x) * 4; r += lin[px[i]]; g += lin[px[i + 1]]; b += lin[px[i + 2]]; }
          l.color.setRGB(r / (zw * zh), g / (zw * zh), b / (zw * zh));
        });
      }

      // ------------------------------------------------------------ camera: one pull from a single lamp to the whole wall
      // The camera sits on a boom around its target: distance (as a logarithm, so the pull feels even), swing to the
      // side and height angle. K.path flows through the keys; the last key lies after the end so it never stops.
      // The animals fidget at the line during the pull, and the wall is in frame when the flag drops, so no story beat is missed.
      const hx = (HERO[0] - (COLS - 1) / 2) * PITCH, hy = ((ROWS - 1) / 2 - HERO[1]) * PITCH, D = Math.PI / 180;
      const cam = {
        dist: K.path([[0, Math.log(0.5)], [0.6, Math.log(0.64)], [1.1, Math.log(1.6)], [1.65, Math.log(6.6)], [2.3, Math.log(16.5)], [3.8, Math.log(19.6)], [14, Math.log(22)]]),
        swing: K.path([[0, 40 * D], [0.7, 34 * D], [1.65, 15 * D], [2.3, 8 * D], [3.8, 5.5 * D], [14, -4 * D]]),
        rise: K.path([[0, -20 * D], [0.7, -17 * D], [1.65, -8 * D], [2.3, -9 * D], [3.8, -8 * D], [14, -7 * D]]),
        wide: K.path([[0, [-1.0, 0.3, 0]], [2.3, [0, -0.5, 0]], [3.8, [0, -1.0, 0]], [14, [0, -1.05, 0]]]),   // where it looks once it is far away
        lens: K.track([[0, 0.022], [0.7, 0.026], [1.65, 0.05], [2.3, 0.03], [8, 0.02]]),
        gain: K.track([[0, 3.5], [1.65, 3.5], [8, 3.8]]),                 // exposure, opened up a touch for the far wall
      };
      const SPILL = 65;

      return {
        update(t) {
          show(t);
          // the target slides from the first lamp to the middle of the wall in step with the distance, so the picture
          // never crosses the frame faster than the pull itself
          const ld = cam.dist(t), d = Math.exp(ld), a = cam.swing(t), e = cam.rise(t), gain = cam.gain(t), w = K.smooth(0, Math.log(12), ld);
          const aim = cam.wide(t).map((v, k) => K.lerp([hx, hy, 0.03][k], v, w));
          const pos = [aim[0] + d * Math.sin(a) * Math.cos(e), aim[1] + d * Math.sin(e), aim[2] + d * Math.cos(a) * Math.cos(e)];
          K.look(camera, pos, aim); K.focus(camera, aim, cam.lens(t));
          U.uGain.value = gain;
          for (const l of zones) l.intensity = SPILL * gain;
          for (const s of sheets) { s.m.uniforms.uAmount.value = 0.009 * K.smooth(0.2, 3.5, pos[2] - s.z); s.m.uniforms.uDrift.value = t * 0.012 + s.k * 0.37; }   // a sheet fades out before the camera passes through it
        },
      };
    },

    sound(k) {
      const D = 12;
      const panAt = (t, x) => K.clamp(((x - scrollAt(t)) / COLS - 0.5) * 1.4, -0.8, 0.8);     // where on the wall something is
      k.bed('hum', 0, D, { gain: 0.5 }); k.bed('room', 0, D, { gain: 0.9 });
      // switch-on: the scan buzzes down the wall and the last row lands with a relay; then the pull back
      k.play('neon', 0, { dur: 1.0, gain: 1.0 }); k.play('tock', 1.0, { gain: 0.8, f: 500 });
      k.withMinor(() => { for (let i = 0; i < 9; i++) k.play('click', 0.02 + 0.98 * Math.pow(i / 9, 0.6), { gain: 0.6, f: 1500 + i * 90, pan: -0.3 + i * 0.07 }); });
      k.play('whoosh', 0.8, { dur: 1.6, gain: 0.45, top: 1400 });
      // the wall's own soundtrack, as if from its speakers: a chip tune that is quick for the sprint, slow for the nap
      // and bright for the finish. Every caption arrives with a small tick.
      k.music('chip', T_GO, T_STOP + 0.15, { bpm: 176, chords: [['C4', 'E4', 'G4', 'C5'], ['F4', 'A4', 'C5', 'F5']], gain: 0.9 });
      k.music('chip', T_SLEEP, T_WAKE - 0.1, { bpm: 80, chords: [['A3', 'C4', 'E4', 'A4']], gain: 0.55 });
      k.music('chip', T_WIN + 0.5, D - 0.3, { bpm: 152, chords: [['C4', 'E4', 'G4', 'C5'], ['F4', 'A4', 'C5', 'F5'], ['G4', 'B4', 'D5', 'G5']], gain: 0.7 });
      k.withMinor(() => CAPTIONS.slice(1).forEach(([t]) => k.play('tick', t + 0.05, { gain: 0.7, f: 2600 })));
      // the hare's three hops at the line; set: a low blip as he crouches. Go: the flag swishes down like a starting pistol
      k.withMinor(() => { for (let i = 0; i < 3; i++) k.play('tock', 0.6 + i * 0.3, { gain: 0.35, f: 520 }); });
      k.play('blip', T_GO - 0.9, { f: 'C5', dur: 0.09, gain: 0.8 });
      k.play('slap', T_GO, { gain: 0.9 }); k.play('swish', T_GO, { dur: 0.25, gain: 0.8 }); k.play('blip', T_GO, { f: 'C6', dur: 0.2, gain: 0.9 });
      // the hare: a sprint is a whoosh and a patter of feet (one bound every 0.2 s), a stop is a skid
      const dash = (t0, t1) => {
        k.play('jump', t0, { gain: 0.7 }); k.play('whoosh', t0, { dur: t1 - t0 + 0.2, gain: 0.7, pan: panAt(t0, hareNose(t0)) });
        k.withMinor(() => { for (let t = t0 + 0.05; t < t1; t += 0.1) k.play('tick', t, { gain: 0.8, f: 1700, pan: panAt(t, hareNose(t)) }); });
        k.noise(t1, { dur: 0.45, color: 'pink', filter: 'bandpass', f: [[0, 3200], [0.45, 700]], q: 1.4, gain: 0.3, a: 0.02, pan: panAt(t1, hareNose(t1)) });
      };
      dash(T_GO + 0.08, T_STOP - 0.38); dash(T_DASH, T_DASH + 0.4);
      k.play('pop', T_STOP + 0.12, { gain: 0.6 });
      ['G6', 'E6', 'G6', 'E6', 'G6'].forEach((f, i) => k.play('blip', T_LOOK + 0.06 + i * 0.12, { f, dur: 0.06, gain: 0.7 }));           // he looks back and laughs
      k.tone(T_YAWN, { f: [[0, 380], [0.25, 560], [0.7, 250]], type: 'triangle', dur: 0.75, gain: 0.07, a: 0.1, hold: 0.35 });    // yawn
      k.play('thud', T_SLEEP - 0.12, { gain: 0.22, f: 100 });                                                                    // flop
      for (let t = T_SLEEP + 0.1; t < T_WAKE - 0.5; t += 1) {                                                                  // snoring: in through the nose, out in a whistle
        k.noise(t, { dur: 0.5, color: 'brown', filter: 'bandpass', f: [[0, 180], [0.45, 420]], q: 3, gain: 0.5, a: 0.3 });
        k.tone(t + 0.6, { f: [[0, 1250], [0.4, 800]], dur: 0.45, gain: 0.035, a: 0.08, hold: 0.15 });
      }
      k.play('blip', T_WAKE, { f: 'A6', dur: 0.07, gain: 1 }); k.play('blip', T_WAKE + 0.1, { f: 'A6', dur: 0.12, gain: 1 }); k.play('jump', T_WAKE + 0.02, { gain: 0.6 });   // !
      k.play('hurt', T_DASH + 0.95, { gain: 0.45 });                                                                           // too late
      // the tortoise: the same soft footfall from the off to the line, every 10 lamps, never faster, never slower
      k.withMinor(() => { let n = 1; for (let t = T_GO; t < D; t += 1 / 240) if (plodded(t) >= n * STEP / 2) { k.play('tock', t, { gain: 0.5, f: n % 2 ? 190 : 170, pan: panAt(t, X_START - 20 + plodded(t)) }); n++; } });
      // he wins: a coin on the line, a fanfare when the cup pops up
      k.play('coin', T_WIN, { gain: 1 }); k.play('success', T_WIN + 0.06, { gain: 0.8 });
      k.play('powerup', T_WIN + 0.45, { gain: 0.9 }); k.play('sparkle', T_WIN + 0.8, { gain: 0.8 }); k.play('sparkle', T_WIN + 1.5, { gain: 0.6 });
    },
  });
}
```
