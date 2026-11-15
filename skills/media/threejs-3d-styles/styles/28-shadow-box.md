# Shadow Box (#28)

- **id:** `shadow-box`
- **Category:** Flat content made physical
- **Use:** explainer
- **Reference duration:** 8 s
- **Google Fonts:** Anton
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`

## Style card

- **Look:** A paper-cut light box: opaque paper silhouettes stand one behind another in a deep walnut frame. The back of the box glows warm and bright, every sheet nearer to you is darker, and the nearest ones are dusk-blue shapes with a thin warm line of light on their cut edges.
- **Motion:** Sheets arrive one at a time and each differently: one drops into its slot from above, one is pushed in from the side, one rises from below. As each arrives, a light switches on in the slot behind it, so the light walks forward through the box.
- **Light:** A warm lamp on the back wall and a pool of light in each slot between the sheets. Each pool lights the sheets behind it and leaves the sheet in front as a silhouette, so cut-out screens and years turn into bright windows. Sheets throw soft shadows on the ones behind. The only light from the front is dim blue dusk.
- **Materials:** Thick cream paper with visible fibre and bright cut edges, dark walnut with open grain.
- **Camera:** Long lens with a very wide aperture, like photographing a miniature. It starts close and at an angle, slides sideways so the sheets shift against each other, and pulls back in one move to a square-on view where the box fills the frame; the focus steps forward from sheet to sheet.
- **Finish:** Real depth of field and motion blur, soft bloom on the lit paper, filmic contrast, a light vignette, fine grain.
- **Good for:** Sequences with a natural order in depth: timelines, eras, layers of a system, before and after. Each sheet is one stage, a big silhouette with a cut-out label, and the light shows which stage we are at.

## Reference

- **Sample topic:** Computers keep shrinking: a room-sized mainframe, a desktop, a laptop, a phone in your hand
- **Gallery description:** A paper-cut light box: opaque paper silhouettes stand one behind another in a deep walnut frame. The back of the box glows warm and bright, every sheet nearer to you is darker, and the nearest ones are dusk-blue shapes with a thin warm line of light on their cut edges.
- **Shown in the sample clip:** Computers keep shrinking: a room-sized mainframe, a desktop, a laptop, a phone in your hand

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/shadow-box.js`)

```js
{
  // ---------------------------------------------------------------- content (change this for a new topic)
  // Every sheet of paper is drawn flat on a 1920x1080 artboard (x right, y down), exactly like a 2D frame: `paper`
  // adds paper, `cut` removes it, `text` cuts stencil lettering, `limb` adds a thick rounded stroke of paper.
  // Sheets are listed from the back of the box to the front. Each one is a silhouette standing on the floor with
  // ONE big subject, lower than the sheet behind it, and open air above its outline.
  //   enter: how the sheet arrives, [side, time]: 'top' drops in, 'right' slides in, 'bottom' rises. null = there on frame one.
  //   glow:  the pool of light in the slot BEHIND the sheet: [x, y, radius x, radius y, carry]. It lights the sheets
  //          further back, so this sheet stands in front of it as a silhouette and its cut-outs turn into bright
  //          windows. carry (default 1) is how much of it reaches each sheet beyond the first one it hits.
  //   lit:   when that light switches on (default: when the sheet arrives).   ember: what is left of it (0..1) once
  //          the next light has come on.
  // Keep the paper behind a year or a screen free of other cut-outs, or the window shows a mess.
  const YEAR_PX = 132, TITLE_PX = 76;
  const sstep = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const groundY = (x) => 945 - 210 * (1 - sstep(40, 520, x)) - 60 * sstep(1230, 1470, x);     // outline of the front sheet: a rise at each end
  const SHEETS = [
    {
      name: 'mainframe', enter: null, lit: 0, ember: 1, glow: [900, 430, 1000, 1000],
      draw(a) {
        // a wall of cabinets from side to side: the machine IS the room
        const cabs = [[0, 400, 190], [400, 800, 140], [800, 1200, 215], [1200, 1500, 150], [1500, 1920, 245]];
        cabs.forEach(([x0, x1, top]) => a.paper((c) => c.roundRect(x0, top, x1 - x0, 1100 - top, [12, 12, 0, 0])));
        cabs.slice(1).forEach(([x0, , top], i) => { const y = Math.min(top, cabs[i][2]) - 2; a.cut((c) => c.rect(x0 - 3, y, 6, 620 - y)); });
        a.reel(138, 304, 66); a.reel(300, 304, 66); a.slot(119, 392, 200, 14);                  // tape drive
        a.text('1950s', 217, 474, YEAR_PX - 6);                                                 // a touch smaller than the other years: at full size the flag of the 1 reached past the edge of the back wall and showed the dark side of the box through the cut
        a.lamps(456, 172, 11, 3, 28, 7);                                                        // lamp panel (the desktop stands in front of the rest)
        a.lamps(852, 266, 11, 4, 30, 8); for (let k = 0; k < 3; k++) a.cut((c) => c.roundRect(852 + k * 108, 392, 84, 52, 8));   // console: lamps and meters
        a.slot(852, 480, 300, 14);
        a.reel(1276, 270, 60); a.reel(1424, 270, 60);                                           // tape drive
        for (let k = 0; k < 6; k++) a.slot(1246 + k * 38, 366, 14, 160);                         // vents
      },
    },
    {
      name: 'desktop', enter: ['top', 1.0], ember: 0.45, glow: [545, 560, 290, 290],
      draw(a) {
        a.paper((c) => { c.roundRect(180, 610, 730, 32, [10, 10, 4, 4]); c.rect(220, 640, 650, 500); });                                                         // desk
        a.paper((c) => { c.roundRect(395, 254, 320, 250, 28); c.rect(515, 500, 80, 24); c.roundRect(345, 520, 420, 92, [10, 10, 0, 0]); });                    // monitor on its box
        a.cut((c) => c.roundRect(427, 282, 256, 186, 26));                                                                                                // the screen
        a.slot(386, 546, 136, 10); a.slot(386, 574, 136, 10); for (let k = 0; k < 5; k++) a.slot(640 + k * 18, 544, 8, 42);                                // floppy drives, vents
        a.text('1980s', 545, 730, YEAR_PX);
      },
    },
    {
      name: 'laptop', enter: ['right', 2.55], ember: 0.55, glow: [1160, 730, 280, 280],
      draw(a) {
        a.paper((c) => c.roundRect(860, 786, 620, 400, [14, 14, 0, 0]));                                                                                 // a low cabinet
        a.paper((c) => { c.roundRect(980, 548, 360, 226, 14); c.moveTo(953, 768); c.lineTo(1367, 768); c.lineTo(1389, 788); c.lineTo(931, 788); c.closePath(); });
        a.cut((c) => c.roundRect(998, 566, 324, 190, 6));
        a.text('2000s', 1168, 862, YEAR_PX);
      },
    },
    {
      name: 'phone', enter: ['bottom', 4.0], ember: 0.8, glow: [1640, 500, 300, 300],
      draw(a) {
        a.paper((c) => { c.roundRect(1555, 335, 170, 330, 26); for (let k = 0; k < 4; k++) c.ellipse(1727, 506 + k * 42, 21, 20, 0, 0, 7); c.ellipse(1640, 668, 108, 74, 0, 0, 7); });   // phone, fingers behind it, palm
        a.limb(1640, 690, 1652, 800, 124); a.paper((c) => { c.roundRect(1546, 790, 214, 36, 9); c.moveTo(1556, 812); c.lineTo(1750, 812); c.lineTo(1806, 1120); c.lineTo(1596, 1120); c.closePath(); });   // wrist, cuff, sleeve
        a.cut((c) => c.roundRect(1571, 358, 138, 276, 14));
        a.paper((c) => c.roundRect(1614, 358, 52, 15, [0, 0, 8, 8])); a.limb(1562, 652, 1622, 556, 44);                                                 // the notch, and a thumb across the glass
        a.paper((c) => { c.moveTo(-20, 1120); for (let x = -20; x <= 1940; x += 20) c.lineTo(x, groundY(x) + 16); c.lineTo(1940, 1120); });           // a base hidden behind the front sheet: it carries the light for the lettering
      },
    },
    {
      name: 'ground', enter: null, lit: 5.3, ember: 0.9, glow: [960, 985, 1150, 70, 0.2],
      draw(a) {
        a.paper((c) => { c.moveTo(-20, 1120); for (let x = -20; x <= 1940; x += 20) c.lineTo(x, groundY(x)); c.lineTo(1940, 1120); });
        a.text('COMPUTERS KEEP SHRINKING', 800, 997, TITLE_PX);                                // the line the clip lands on
        a.text('TODAY', 1650, 962, YEAR_PX);
      },
    },
  ];

  // ---------------------------------------------------------------- the box and the clock
  const N = SHEETS.length;                 // cut sheets. Plane 0 is the plain back wall of the box, so there are N + 1 planes
  const W = 9.6, H = 5.4, GAP = 0.5;       // sheet size and slot spacing in world units (the artboard is 200 px per unit)
  const IN_W = 9.2, IN_H = 5.0;            // the opening: sheets reach 0.2 into the wood on every side
  const BEAM = 0.56, DEPTH = N * GAP + 0.6, FRONT = DEPTH - 0.2;
  const sheetZ = (i) => i * GAP;
  const TRAVEL = { top: 0.46, right: 0.62, bottom: 0.42 };                 // seconds until a sheet has arrived
  const arrive = (s) => (s.enter ? s.enter[1] + TRAVEL[s.enter[0]] : 0);
  const litAt = (s) => (s.lit == null ? arrive(s) : s.lit);

  // where sheet i is at time t, as an offset from its slot in sheet sizes: [x, y, rattle]
  function offsetOf(K, i, t) {
    const s = SHEETS[i - 1]; if (!s.enter) return [0, 0, 0];
    const [side, t0] = s.enter, v = t - t0 - TRAVEL[side];
    if (t <= t0) return side === 'top' ? [0, 1.05, 0] : side === 'right' ? [0.72, 0, 0] : [0, -0.74, 0];
    if (side === 'top') {            // free fall, two small bounces on the floor of the slot, a rattle
      if (v < 0) { const u = 1 + v / TRAVEL.top; return [0, 1.05 * (1 - u * u), 0]; }
      return [0, 0.012 * Math.abs(Math.sin(v * 17)) * Math.exp(-v * 9) * (v < Math.PI * 2 / 17 ? 1 : 0), 0.0035 * Math.sin(v * 31) * Math.exp(-v * 7)];
    }
    if (side === 'right') return [0.72 * (1 - K.ease.outBack(K.clamp((t - t0) / 0.78), 0.55)), 0, 0];     // pushed in along its groove, runs a hair too far
    return [0, -0.74 * (1 - K.spring(t - t0, 1.6, 0.8)), 0.003 * Math.sin((t - t0) * 9) * Math.exp(-(t - t0) * 3.2)];   // held up from below: arrives fast, sways, settles
  }
  // Light l lives in the slot in front of plane l, which is right behind sheet l + 1 (SHEETS[l]). It switches on when
  // that sheet is `lit`, burns hot until the next light comes on, then settles at its ember. Returns [brightness, heat].
  function lightOf(K, l, t) {
    const s = SHEETS[l], on = litAt(s), off = l + 1 < N ? litAt(SHEETS[l + 1]) : 99;
    const up = on <= 0 ? K.lerp(0.75, 1, K.seg(t, 0, 0.9, K.ease.out)) : K.seg(t, on - 0.02, on + 0.55, K.ease.out);
    const heat = up * (1 - K.seg(t, off - 0.05, off + 0.8, K.ease.inOut));
    return [up * K.lerp(s.ember, 1.15, heat) * (1 + 0.02 * Math.sin(t * 43 + l) * Math.sin(t * 12.7 + l * 2)), heat];
  }

  registerStyle({
    id: 'shadow-box',
    name: 'Shadow Box',
    family: 'Flat content made physical',
    look: 'A paper-cut light box: opaque paper silhouettes stand one behind another in a deep walnut frame. The back of the box glows warm and bright, every sheet nearer to you is darker, and the nearest ones are dusk-blue shapes with a thin warm line of light on their cut edges.',
    motion: 'Sheets arrive one at a time and each differently: one drops into its slot from above, one is pushed in from the side, one rises from below. As each arrives, a light switches on in the slot behind it, so the light walks forward through the box.',
    light: 'A warm lamp on the back wall and a pool of light in each slot between the sheets. Each pool lights the sheets behind it and leaves the sheet in front as a silhouette, so cut-out screens and years turn into bright windows. Sheets throw soft shadows on the ones behind. The only light from the front is dim blue dusk.',
    materials: 'Thick cream paper with visible fibre and bright cut edges, dark walnut with open grain.',
    camera: 'Long lens with a very wide aperture, like photographing a miniature. It starts close and at an angle, slides sideways so the sheets shift against each other, and pulls back in one move to a square-on view where the box fills the frame; the focus steps forward from sheet to sheet.',
    post: 'Real depth of field and motion blur, soft bloom on the lit paper, filmic contrast, a light vignette, fine grain.',
    explains: 'Sequences with a natural order in depth: timelines, eras, layers of a system, before and after. Each sheet is one stage, a big silhouette with a cut-out label, and the light shows which stage we are at.',
    topic: 'Computers keep shrinking: a room-sized mainframe, a desktop, a laptop, a phone in your hand',
    duration: 8,
    fonts: ['400 132px "Anton"', '400 76px "Anton"'],
    render: { samples: 56, shutter: 0.5, tone: 'filmic', exposure: 1.0, bloom: 0.3, bloomThreshold: 1.0, vignette: 0.3, grain: 0.022, fov: 20, background: '#020203' },

    build(S) {
      const { THREE, K, scene, camera } = S;

      // ------------------------------------------------------------ 1. cut the sheets (alpha = paper)
      const MW = 4096, MH = 2304;
      const BRIDGED = '04689ABDOPQR';     // a hole cannot hold an island: glyphs with a counter get a stencil bridge
      const painter = (ctx) => {
        const a = {
          paper(fn) { ctx.globalCompositeOperation = 'source-over'; ctx.beginPath(); fn(ctx); ctx.fill(); },
          cut(fn) { ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); fn(ctx); ctx.fill(); },
          limb(x0, y0, x1, y1, w) { ctx.globalCompositeOperation = 'source-over'; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); },
          slot(x, y, w, h) { a.cut((c) => c.roundRect(x, y, w, h, Math.min(w, h) / 2)); },
          lamps(x, y, cols, rows, pitch, r) { a.cut((c) => { for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { c.moveTo(x + i * pitch + r, y + j * pitch); c.arc(x + i * pitch, y + j * pitch, r, 0, 7); } }); },
          reel(x, y, r) {                 // a tape reel: three windows around a hub, held by three spokes
            a.cut((c) => { for (let k = 0; k < 3; k++) { const a0 = k * 2.094 + 0.16 - 1.57, a1 = a0 + 2.094 - 0.32; c.moveTo(x + Math.cos(a0) * r, y + Math.sin(a0) * r); c.arc(x, y, r, a0, a1); c.arc(x, y, r * 0.36, a1 - 0.14, a0 + 0.14, true); c.closePath(); } c.moveTo(x + 7, y); c.arc(x, y, 7, 0, 7); });
          },
          text(str, cx, cy, px) {
            ctx.font = `400 ${px}px "Anton"`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
            const ls = px * 0.045, cap = ctx.measureText('0').actualBoundingBoxAscent, ws = [...str].map((ch) => ctx.measureText(ch).width + ls);
            let x = cx - (ws.reduce((p, q) => p + q, 0) - ls) / 2;
            [...str].forEach((ch, i) => {
              ctx.globalCompositeOperation = 'destination-out'; ctx.fillText(ch, x, cy + cap / 2);
              if (BRIDGED.includes(ch)) { ctx.globalCompositeOperation = 'source-over'; ctx.fillRect(x + (ws[i] - ls) / 2 - px * 0.026, cy - cap / 2 - 4, px * 0.052, cap + 8); }
              x += ws[i];
            });
          },
        };
        return a;
      };
      const masks = SHEETS.map((s) => K.canvasTex(MW, MH, (ctx) => { ctx.scale(MW / 1920, MH / 1080); ctx.fillStyle = ctx.strokeStyle = '#fff'; s.draw(painter(ctx)); }));
      // The shadow a sheet throws gets softer the further it travels, so each sheet also carries its own silhouette
      // blurred three times: as seen one slot away (red), two slots (green) and three or more (blue).
      const SW = 1024, SH = 576, BLUR = [5, 12, 22];
      const softs = masks.map((m) => {
        const layers = BLUR.map((r) => {
          const c = document.createElement('canvas'); c.width = SW; c.height = SH; const x = c.getContext('2d');
          if ('filter' in x) { x.filter = `blur(${r}px)`; x.drawImage(m.canvas2d, 0, 0, SW, SH); }
          else { const t = document.createElement('canvas'); t.width = Math.round(SW / r); t.height = Math.round(SH / r); t.getContext('2d').drawImage(m.canvas2d, 0, 0, t.width, t.height); x.drawImage(t, 0, 0, SW, SH); }   // browsers without canvas filters: shrink and stretch
          return x.getImageData(0, 0, SW, SH).data;
        });
        const t = K.canvasTex(SW, SH, (ctx) => { const im = ctx.createImageData(SW, SH); for (let p = 0; p < SW * SH * 4; p += 4) { im.data[p] = layers[0][p + 3]; im.data[p + 1] = layers[1][p + 3]; im.data[p + 2] = layers[2][p + 3]; im.data[p + 3] = 255; } ctx.putImageData(im, 0, 0); }, { data: true });
        t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; return t;
      });

      // ------------------------------------------------------------ 2. the paper itself
      // One texture for every sheet. red: cloudy pulp, green: single fibres, blue: the same surface embossed.
      const FW = 2048, FH = 1152;
      const fibre = K.canvasTex(FW, FH, (ctx) => {
        const n = K.noise(7), r = K.rng(21), cw = 384, ch = 216;
        const small = document.createElement('canvas'); small.width = cw; small.height = ch; const sx = small.getContext('2d'), sim = sx.createImageData(cw, ch);
        for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const v = 128 + 210 * n.fbm(x * 0.045, y * 0.045, 0, 5); sim.data.set([v, v, v, 255], (y * cw + x) * 4); }
        sx.putImageData(sim, 0, 0); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(small, 0, 0, FW, FH);
        const cloud = ctx.getImageData(0, 0, FW, FH).data;
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, FW, FH); ctx.lineCap = 'round';
        for (let i = 0; i < 16000; i++) {
          const x = r.range(0, FW), y = r.range(0, FH), a = r.range(0, 6.3), len = r.range(8, 36) * (r.chance(0.05) ? 2.6 : 1), bend = r.range(-0.9, 0.9);
          ctx.strokeStyle = `rgba(255,255,255,${r.range(0.12, 0.6)})`; ctx.lineWidth = r.range(0.5, 1.3);
          ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a + bend) * len * 0.5, y + Math.sin(a + bend) * len * 0.5, x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.stroke();
        }
        const fib = ctx.getImageData(0, 0, FW, FH).data, out = ctx.createImageData(FW, FH), hgt = (x, y) => { const p = (Math.min(FH - 1, Math.max(0, y)) * FW + Math.min(FW - 1, Math.max(0, x))) * 4; return fib[p] * 0.7 + cloud[p] * 0.5; };
        for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { const p = (y * FW + x) * 4; out.data[p] = cloud[p]; out.data[p + 1] = fib[p]; out.data[p + 2] = 128 + 1.6 * (hgt(x - 1, y - 1) - hgt(x + 1, y + 1)); out.data[p + 3] = 255; }
        ctx.putImageData(out, 0, 0);
      }, { data: true });
      fibre.wrapS = fibre.wrapT = THREE.MirroredRepeatWrapping;

      // ------------------------------------------------------------ 3. light between the sheets
      // The whole look is this shader: a 2D model of a light box, evaluated on every sheet. The paper is opaque.
      //   lights in FRONT of me (their slot is nearer the viewer) light my face, minus the soft shadows of the sheets
      //     standing between us (their blurred silhouettes, slid a little away from the light);
      //   lights BEHIND me only reach the thin fringe at my cut edges, which is the warm rim on every silhouette;
      //   on top, two ambient terms set the depth: warm lamp light bouncing around the back of the box, which halves
      //     with every sheet toward the viewer, and blue dusk from the room, strongest on the front sheet. The sheet
      //     right in front of me shades both, so every silhouette sits in a soft shadow on the one behind.
      // Real three.js lights are only used for the wooden frame outside.
      const L = N + 1;
      const U = {
        uOff: { value: Array.from({ length: L }, () => new THREE.Vector2()) },         // per plane: offset from its slot, in sheet sizes
        uPool: { value: Array.from({ length: L }, () => new THREE.Vector4()) },        // per light: centre x, y and radius x, y (in sheet heights)
        uFloor: { value: new Float32Array(L) }, uCarry: { value: new Float32Array(L).fill(1) },   // per light: its level outside the pool, and how much carries past each sheet
        uCol: { value: Array.from({ length: L }, () => new THREE.Color()) },           // per light: colour times brightness
        uSpill: { value: new THREE.Color() }, uDusk: { value: new THREE.Color('#3a4fa6').multiplyScalar(0.2) },
        uFibre: { value: fibre }, uPaper: { value: new THREE.Color('#f6e6c8') },
      };
      softs.forEach((t, k) => { U['uSoft' + (k + 1)] = { value: t }; });
      const COMMON = `
        uniform float uFloor[${L}], uCarry[${L}]; uniform vec2 uOff[${L}]; uniform vec4 uPool[${L}]; uniform vec3 uCol[${L}], uSpill, uDusk;
        float pool(int l, vec2 p) { vec2 d = (p - uPool[l].xy) * vec2(${(W / H).toFixed(4)}, 1.0) / uPool[l].zw; return mix(uFloor[l], 1.0, exp(-dot(d, d))); }`;
      const paperMat = (self, edge) => new THREE.ShaderMaterial({
        uniforms: Object.assign({ uMask: { value: self ? masks[self - 1] : null }, uSelf: { value: self }, uEdge: { value: edge ? 1 : 0 }, uFibreOff: { value: new THREE.Vector2(self * 0.37, self * 0.23) } }, U),
        vertexShader: `uniform vec2 uOff[${L}]; uniform int uSelf; varying vec2 vUv, vBox;
          void main(){ vUv = uv; vBox = uv + uOff[uSelf]; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `precision highp float; varying vec2 vUv, vBox; uniform int uSelf; uniform float uEdge; uniform vec2 uFibreOff; uniform vec3 uPaper;
          uniform sampler2D uMask, uFibre, ${softs.map((_, k) => 'uSoft' + (k + 1)).join(', ')};
          ${COMMON}
          // how much of sheet j covers point p of the box, seen from a plane 'steps' slots away
          float cover(int j, vec2 p, int steps) {
            p -= uOff[j];
            if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) return 0.0;
            vec3 m = vec3(0.0); ${softs.map((_, k) => `if (j == ${k + 1}) m = texture2D(uSoft${k + 1}, p).rgb;`).join(' ')}
            return steps <= 1 ? m.r : steps == 2 ? m.g : m.b;
          }
          void main(){
            if (vBox.x < 0.0 || vBox.x > 1.0 || vBox.y < 0.0 || vBox.y > 1.0) discard;     // still outside the box
            if (uSelf > 0 && texture2D(uMask, vUv).a < 0.5) discard;                         // the cut
            vec3 fib = texture2D(uFibre, vUv + uFibreOff).rgb;
            vec3 face = vec3(0.0), behind = vec3(0.0);
            for (int l = 0; l < ${L}; l++) {
              bool back = l < uSelf;
              int j0 = back ? l + 1 : uSelf + 1, j1 = back ? uSelf - 1 : l;
              float v = pool(l, vBox);
              for (int j = j0; j <= j1; j++) { int steps = abs(j - uSelf); v *= 1.0 - 0.95 * cover(j, vBox + (uPool[l].xy - vBox) * 0.03 * float(steps), steps); }
              if (back) behind += uCol[l] * v; else face += uCol[l] * v * pow(uCarry[l], float(l - uSelf));
            }
            if (uSelf > 0) {
              float near = float(uSelf - 1) / float(${N - 1});                               // 0 = rearmost sheet, 1 = nearest
              float shade = uSelf < ${N} ? 1.0 - 0.62 * cover(uSelf + 1, vBox + vec2(0.0, 0.01), 1) : 1.0;
              face += (uSpill * pow(0.5, float(uSelf - 1)) + uDusk * mix(0.25, 1.0, near)) * shade;
            }
            float rim = uSelf > 0 ? clamp(2.0 - 2.0 * texture2D(uMask, vUv, 2.5).a, 0.0, 1.0) : 0.0;   // 1 right at a cut, 0 a few millimetres into the paper (a blurred mip of my own mask)
            vec3 glow = (behind + uSpill * 0.5) * vec3(1.0, 0.72, 0.4);
            vec3 c = uEdge > 0.5 ? face * uPaper * 0.5 + glow * 0.8                           // the cut edge itself: bare pulp
              : face * uPaper * (0.9 + 0.3 * (fib.b - 0.5) + 0.05 * fib.g) + glow * 0.6 * rim * rim;
            gl_FragColor = vec4(c, 1.0);
          }`,
      });
      const THICK = 0.075, PLIES = 6;      // a sheet is a front face plus a few copies behind it, which read as its cut edge
      const planes = [];
      for (let i = 0; i <= N; i++) {
        const g = new THREE.Group(); g.position.z = sheetZ(i); scene.add(g); planes.push(g);
        for (let k = 0; k < (i ? PLIES : 1); k++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(W, H), paperMat(i, k > 0)); m.position.z = -k * THICK / (PLIES - 1); m.frustumCulled = false; g.add(m); }
      }

      // ------------------------------------------------------------ 4. the box
      const wood = K.canvasTex(2048, 256, (ctx, w, h) => {
        const r = K.rng(3), n = K.noise(5), im = ctx.createImageData(w, h);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {             // long soft bands of figure, then fine grain
          const v = K.clamp(0.5 + 1.2 * n.fbm(x * 0.0011, y * 0.028, 0, 4) + 0.14 * n.n2(x * 0.011, y * 0.6));
          im.data.set([52 + 74 * v, 29 + 44 * v, 15 + 22 * v, 255], (y * w + x) * 4);
        }
        ctx.putImageData(im, 0, 0);
        for (let i = 0; i < 2600; i++) { ctx.fillStyle = `rgba(14,6,2,${r.range(0.12, 0.45)})`; ctx.fillRect(r.range(0, w), r.range(0, h), r.range(5, 30), 1); }   // open pores
      });
      const woodMat = new THREE.MeshStandardMaterial({ map: wood, bumpMap: wood, bumpScale: 0.6, roughness: 0.5, metalness: 0 });
      const beam = (len, x, y, upright) => { const m = new THREE.Mesh(K.roundedBox(len, BEAM, DEPTH, 0.035, 3), woodMat); m.position.set(x, y, DEPTH / 2 - 0.2); if (upright) m.rotation.z = Math.PI / 2; m.castShadow = m.receiveShadow = true; scene.add(m); };
      beam(IN_H + BEAM * 2, -(IN_W + BEAM) / 2, 0, true); beam(IN_H + BEAM * 2, (IN_W + BEAM) / 2, 0, true);
      beam(IN_W, 0, (IN_H + BEAM) / 2, false); beam(IN_W, 0, -(IN_H + BEAM) / 2, false);
      // the inside faces of the box are lit by the same pools as the paper, strongest next to the slot each light sits in
      const linerMat = new THREE.ShaderMaterial({
        uniforms: Object.assign({ uWood: { value: wood } }, U),
        vertexShader: 'varying vec3 vW; varying vec2 vUv; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: `precision highp float; varying vec3 vW; varying vec2 vUv; uniform sampler2D uWood; ${COMMON}
          void main(){
            vec2 p = vW.xy / vec2(${W.toFixed(2)}, ${H.toFixed(2)}) + 0.5; vec3 lit = uDusk * 0.5 * smoothstep(0.0, ${FRONT.toFixed(2)}, vW.z);
            for (int l = 0; l < ${L}; l++) { float dz = vW.z - (float(l) + 0.5) * ${GAP.toFixed(3)}; lit += uCol[l] * max(pool(l, p), 0.3) * exp(-abs(dz) / (dz > 0.0 ? 1.1 : 0.4)) * 0.36; }   // light spills forward further than back
            float groove = 1.0; for (int i = 1; i <= ${N}; i++) groove *= smoothstep(0.012, 0.03, abs(vW.z - float(i) * ${GAP.toFixed(3)} + 0.02));
            vec3 w = texture2D(uWood, vUv * vec2(1.0, 2.0)).rgb; gl_FragColor = vec4(mix(w * 5.0, vec3(dot(w, vec3(4.0))), 0.35) * lit * mix(0.25, 1.0, groove), 1.0);
          }`,
      });
      const liner = (w, x, y, rz) => { const g = new THREE.PlaneGeometry(w, DEPTH - 0.24); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, linerMat); m.rotation.z = rz; m.position.set(x, y, (DEPTH - 0.24) / 2); scene.add(m); };
      liner(IN_W, 0, -IN_H / 2 + 0.004, 0); liner(IN_W, 0, IN_H / 2 - 0.004, Math.PI); liner(IN_H, -IN_W / 2 + 0.004, 0, -Math.PI / 2); liner(IN_H, IN_W / 2 - 0.004, 0, Math.PI / 2);

      // the room: a dark wall and one dim, cool, soft lamp, so the wood has shape and everything warm comes from inside
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshStandardMaterial({ color: '#12161c', roughness: 0.95 }));
      wall.position.z = -0.2; wall.receiveShadow = true; scene.add(wall);
      K.env(S, { top: '#06070a', horizon: '#0a0c12', bottom: '#020202', intensity: 0.7, panels: [{ pos: [-10, 9, 14], size: [8, 6], color: '#b9c9ff', power: 3 }] });
      K.spot(S, { pos: [-8, 10, 17], target: [0, 0, 2], color: '#c9d6ff', power: 1000, angle: 0.5, penumbra: 1, soft: 1.3 });

      // ------------------------------------------------------------ 5. camera
      // One move: close and at an angle on the first sheet, sliding right and pulling back, to a square-on view in which
      // the frame of the box is the frame of the picture. The key before time 0 means it is already moving on frame one.
      const END_Z = FRONT + (IN_W / 2 + BEAM) / (Math.tan(Math.PI / 18) * 16 / 9);      // from here the box is exactly as wide as the picture (fov 20)
      const cam = {
        pos: K.path([[-1.5, [-4.9, 0.55, 9.8]], [0, [-4.4, 0.5, 10.4]], [2.0, [-3.4, 0.4, 12.6]], [3.7, [-1.6, 0.2, 15.8]], [5.3, [-0.3, 0.05, END_Z - 1.0]], [6.9, [0, 0, END_Z]]]),
        aim: K.path([[-1.5, [-2.6, 0.2, 0.5]], [0, [-2.3, 0.15, 0.5]], [2.0, [-1.4, 0.05, 0.9]], [3.7, [-0.2, 0.0, 1.2]], [5.3, [0.05, 0.0, 1.4]], [6.9, [0, 0, 1.45]]]),
        // what is sharp: [time, artboard x, y, sheet]. The focus rests on each subject, then racks to the next as its light comes on
        focus: K.track([[0, [216, 474, 1]], [1.2, [216, 474, 1]], [1.9, [545, 600, 2], 'inOut'], [2.8, [545, 600, 2]], [3.5, [1160, 700, 3], 'inOut'], [4.1, [1160, 700, 3]], [4.8, [1640, 500, 4], 'inOut'], [5.3, [1640, 500, 4]], [6.2, [960, 800, 3], 'inOut']]),
        ap: K.track([[0, 0.3], [3.7, 0.3], [6.4, 0.07]]),
      };
      const HOT = new THREE.Color('#ffd49a'), COLD = new THREE.Color('#ff9a50'), SPILL = new THREE.Color('#ff9340');

      return {
        update(t) {
          for (let i = 1; i <= N; i++) {
            const [ox, oy, rz] = offsetOf(K, i, t);
            U.uOff.value[i].set(ox, oy); planes[i].position.x = ox * W; planes[i].position.y = oy * H; planes[i].rotation.z = rz;
            planes[i].visible = Math.abs(ox) < 1 && Math.abs(oy) < 1;
          }
          for (let l = 0; l < L; l++) {
            if (l === N) { U.uCol.value[l].setScalar(0); continue; }                    // nothing in front of the last sheet but the dusk
            const [b, heat] = lightOf(K, l, t), s = SHEETS[l], g = s.glow;
            U.uPool.value[l].set(g[0] / 1920, 1 - g[1] / 1080, g[2] / 1080, g[3] / 1080); U.uFloor.value[l] = l ? 0 : 0.5; U.uCarry.value[l] = g[4] == null ? 1 : g[4];
            U.uCol.value[l].copy(COLD).lerp(HOT, K.lerp(s.ember, 1, heat)).multiplyScalar(b * 1.6);   // an ember is redder as well as dimmer
          }
          U.uSpill.value.copy(SPILL).multiplyScalar(0.36 * lightOf(K, 0, t)[0]);
          const p = cam.pos(t), a = cam.aim(t);
          const f = cam.focus(t);
          K.look(camera, p, a); K.focus(camera, [(f[0] - 960) / 200, (540 - f[1]) / 200, f[2] * GAP], cam.ap(t));
        },
      };
    },

    sound(k) {
      k.bed('room', 0, 8, { gain: 0.9 }); k.bed('hum', 0, 8, { gain: 0.3 });
      // one soft chord per light, changing as it comes on
      const CHORDS = [['D3', 'A3', 'F#4'], ['B2', 'F#3', 'D4', 'A4'], ['G2', 'D3', 'B3', 'F#4'], ['A2', 'E3', 'C#4', 'A4'], ['D3', 'A3', 'F#4', 'D5']];
      const hits = [...SHEETS.map(litAt), 8];
      CHORDS.forEach((ch, i) => k.music('pad', hits[i], hits[i + 1], { bpm: 240 / (hits[i + 1] - hits[i]), chords: [ch], gain: 0.9 }));
      SHEETS.forEach((s, i) => {
        const pan = (s.glow[0] - 960) / 1400, on = litAt(s);
        if (on > 0) k.play('ding', on + 0.05, { gain: 0.5, f: ['D5', 'D5', 'F#5', 'A5', 'D6'][i], pan });       // the light behind it comes on
        if (!s.enter) return;
        const [side, t0] = s.enter, hit = arrive(s);
        if (side === 'top') {          // falls through the air, lands on wood
          k.play('paper', t0 + 0.05, { gain: 0.9, dur: 0.38, pan }); k.play('swish', t0 + 0.12, { gain: 0.6, dur: 0.3, pan });
          k.play('thud', hit, { gain: 0.55, f: 140, pan }); k.play('tock', hit, { gain: 0.8, f: 520, pan }); k.play('slap', hit + 0.01, { gain: 0.35, pan }); k.play('tock', hit + 0.19, { gain: 0.3, f: 560, pan });
        } else if (side === 'right') { // paper dragged along a groove, then the stop
          k.play('paper', t0, { gain: 1.1, dur: 0.6, pan: 0.7 }); k.play('whoosh', t0 + 0.05, { gain: 0.35, dur: 0.5, top: 1800, pan: 0.5 });
          k.play('tock', hit - 0.05, { gain: 0.7, f: 440, pan }); k.play('thud', hit - 0.05, { gain: 0.3, f: 120, pan });
        } else {                       // lifted up from below
          k.play('swish', t0 + 0.02, { gain: 0.7, dur: 0.32, pan }); k.play('paper', t0 + 0.05, { gain: 0.7, dur: 0.3, pan }); k.play('pop', hit - 0.08, { gain: 0.35, pan });
        }
      });
      k.play('sparkle', litAt(SHEETS[N - 1]) + 0.15, { gain: 0.5 });
    },
  });
}
```
