# Monument Type (#37)

- **id:** `monument-type`
- **Category:** Spaces and journeys
- **Use:** title
- **Reference duration:** 9 s
- **Google Fonts:** Archivo Black
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`, `lib/text3d.js`

## Style card

- **Look:** Words as architecture: a short phrase stands as colossal letters on the terraces of a dark concrete monument in a flooded salt flat at sunset. One word is weathered steel and keeps the last sun; tiny people, lamps, birds and a crane give the scale.
- **Motion:** The words never move. The camera starts at eye height against one giant letter, slides off the terrace as it turns to face the words, and sinks back over the water until the terraces close up into one block that reads top to bottom. Then the evening shadow climbs the monument and leaves only the hero word in the sun.
- **Light:** One low sun from the front left rakes every face, picks out board marks and seams and throws long shadows; the cool sky is the only fill, so shade goes blue. At the end a far ridge shades the monument from the bottom up while lamps and windows come on.
- **Materials:** Board-marked concrete with pour joints, tie holes and rain streaks; rusted steel plates with welded seams for the hero word; wet stone paving; plywood formwork and scaffold tubes on the unfinished letter; pale salt under a film of water that mirrors everything.
- **Camera:** One continuous drone move with deep focus (shallow focus would turn the monument into a model): a wide lens at eye height for the start, a longer lens low over the water, looking up, for the hold.
- **Finish:** Filmic contrast, a little bloom on the sun and the lamps, soft vignette, fine grain, a short shutter. No depth of field.
- **Good for:** A short statement of two to five words where one word is the point: a principle, a motto, a verdict, a title. The hero word gets the top terrace, its own material and the last light; a word can be marked unfinished to put it under scaffolding.

## Reference

- **Sample topic:** Done beats perfect
- **Gallery description:** Words as architecture: a short phrase stands as colossal letters on the terraces of a dark concrete monument in a flooded salt flat at sunset. One word is weathered steel and keeps the last sun; tiny people, lamps, birds and a crane give the scale.
- **Shown in the sample clip:** Done beats perfect

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/monument-type.js`)

```js
{
  // ---------------------------------------------------------------- content (change this for a new phrase)
  // Words in reading order. The first word stands on the highest terrace at the back and the last one at the front by
  // the water, so from the hold position the phrase reads top to bottom. The first word also gets the opening shot and
  // the last of the sun, so phrase it with the point first when you can.
  const WORDS = [
    { text: 'DONE', hero: true },            // hero: weathered steel instead of concrete, the one warm thing in the set
    { text: 'BEATS', width: 0.56 },          // width = the share of the block's width this word takes at the hold (default 1)
    { text: 'PERFECT', unfinished: true },   // unfinished: its last letter is still in formwork, with scaffold and a crane
  ];
  const FONT = '400 200px "Archivo Black"';  // a heavy, wide face: every letter is a slab that can stand as a building
  const SPACING = 0.05;                      // extra letter spacing in em: room to walk between the letters

  // ---------------------------------------------------------------- the set is laid out FROM the hold camera
  // Scale: 1 unit is about 4 m, a person is 0.45 tall. Every word is sized so that it has the same width on screen at
  // the hold (far words are really much bigger), and every terrace is just high enough that the word on it clears the
  // top of the word in front. Change HOLD or the words and the whole monument re-plans itself.
  const HOLD = { pos: [0, 2.2, 44.5], aim: [0, 8.5, -10], fov: 31 };   // low over the water, looking up: the reading position
  const FRONT_WIDTH = 30;     // world width of the front word
  const WALK = 5.2;           // terrace in front of each word, where people walk
  const BACK = 0.9;           // space between the back of a word and the wall of the next terrace
  const PLINTH = 0.5;         // height of the lowest terrace
  const GAP = 0.55;           // strip of terrace wall that stays visible between two words at the hold
  const PERSON = 0.45;
  function layout(K) {
    const H = HOLD.pos[1], d = (z) => HOLD.pos[2] - z, rows = [];
    for (let i = WORDS.length - 1; i >= 0; i--) {                       // front to back
      const w = WORDS[i], prev = rows[0];                                // prev = the word in front of this one
      const b = K.textShapes(w.text, { font: FONT, size: 1, letterSpacing: SPACING }).bounds, emW = b.maxX - b.minX, emH = b.maxY - b.minY;
      const z = prev ? prev.z - prev.depth - BACK - WALK : 0;            // z of the letters' front faces
      const width = FRONT_WIDTH * (w.width || 1) * d(z) / d(0), size = width / emW, cap = emH * size, depth = Math.min(3.4, cap * 0.44);
      let base = PLINTH;
      if (prev) { const top = prev.base + prev.cap; base = H - (H - top) * d(z) / (d(prev.z) + (H > top ? prev.depth : 0)) + GAP; }
      const edge = prev ? prev.z - prev.depth - BACK : 4.6;             // z of the front wall of the terrace it stands on
      rows.unshift({ ...w, share: w.width || 1, z, width, size, cap, depth, base, edge, tierW: (FRONT_WIDTH + 7) * d(edge) / d(0) });
    }
    return rows;
  }

  // ---------------------------------------------------------------- generated surfaces
  // Everything big is textured in world space (see surface()), so one 4 x 4 unit tile covers letters of any size and
  // the marks keep their real size: a board is 25 cm, a pour is 4 m, a tie hole is a hand wide. That is what makes
  // the letters read as huge.
  const TILE = 4, TN = 2048;
  const around = (ctx, x, y, r, fn) => { for (const dx of [-TN, 0, TN]) for (const dy of [-TN, 0, TN]) if (x + dx > -r && x + dx < TN + r && y + dy > -r && y + dy < TN + r) { ctx.save(); ctx.translate(dx, dy); fn(); ctx.restore(); } };

  // board-marked concrete: planks of the formwork printed into the wall, a joint at every pour, rows of tie holes
  function concreteTex(K) {
    const r = K.rng(7), LIFTS = 4, BOARDS = 16, bh = TN / (LIFTS * BOARDS);
    const hgt = K.canvasTex(TN, TN, null, { data: true, repeat: [1, 1] }), h = hgt.ctx;
    const alb = K.canvasTex(TN, TN, (c) => {
      c.fillStyle = '#b3afa6'; c.fillRect(0, 0, TN, TN); h.fillStyle = 'rgb(128,128,128)'; h.fillRect(0, 0, TN, TN);
      for (let b = 0; b < LIFTS * BOARDS; b++) {
        let x = r.range(0, 700); const x0 = x, y = b * bh;
        while (x < x0 + TN) {
          const w = Math.min(r.range(420, 1150), x0 + TN - x), tone = r.range(-1, 1), level = r.range(-1, 1);
          for (const dx of [0, -TN]) {
            const v = 176 + tone * 13; c.fillStyle = `rgb(${v + 3 | 0},${v | 0},${v - 6 | 0})`; c.fillRect(x + dx, y, w, bh);
            const l = 128 + level * 16 | 0; h.fillStyle = `rgb(${l},${l},${l})`; h.fillRect(x + dx, y, w, bh);
            c.fillStyle = 'rgba(46,43,40,0.55)'; c.fillRect(x + dx - 1, y, 2, bh); h.fillStyle = 'rgb(70,70,70)'; h.fillRect(x + dx - 1.5, y, 3, bh);   // butt joint
          }
          for (let k = 0; k < 6; k++) {                                   // wood grain, printed into the face
            const gy = y + r.range(3, bh - 3), amp = r.range(0.5, 2.5), ph = r.range(0, 9), dark = r.chance(0.6), al = r.range(0.05, 0.16);
            for (const dx of [0, -TN]) for (const cx of [c, h]) {
              cx.strokeStyle = cx === c ? (dark ? `rgba(60,56,52,${al})` : `rgba(240,236,228,${al})`) : (dark ? 'rgba(96,96,96,0.8)' : 'rgba(156,156,156,0.8)');
              cx.lineWidth = cx === c ? 1.2 : 1.6; cx.beginPath();
              for (let px = 0; px <= w; px += 24) cx[px ? 'lineTo' : 'moveTo'](x + dx + px, gy + Math.sin(px * 0.012 + ph) * amp);
              cx.stroke();
            }
          }
          x += w;
        }
        c.fillStyle = 'rgba(52,49,45,0.5)'; c.fillRect(0, y - 0.9, TN, 1.8); h.fillStyle = 'rgb(64,64,64)'; h.fillRect(0, y - 1.2, TN, 2.4);            // joint between two boards
      }
      for (let i = 0; i < 520; i++) {                                     // cloudy patches from the pour
        const x = r.range(0, TN), y = r.range(0, TN), rad = r.range(30, 150), dark = r.chance(0.55);
        around(c, x, y, rad, () => { const g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, dark ? 'rgba(70,66,62,0.10)' : 'rgba(250,246,238,0.09)'); g.addColorStop(1, 'rgba(128,128,128,0)'); c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2); });
      }
      for (let L = 0; L < LIFTS; L++) {
        const y = L * TN / LIFTS;
        for (const dy of [0, TN]) {                                       // the pour joint: a dark groove with a pale lip of leaked cement under it
          c.fillStyle = 'rgba(40,37,34,0.62)'; c.fillRect(0, y + dy - 3, TN, 6); h.fillStyle = 'rgb(30,30,30)'; h.fillRect(0, y + dy - 4, TN, 8);
          for (let x = 0; x < TN; x += 16) { c.fillStyle = `rgba(238,234,226,${r.range(0.05, 0.3)})`; c.fillRect(x, y + dy + 3, 16, r.range(3, 16)); }
        }
        for (const ry of [0.25, 0.75]) for (let k = 0; k < 6; k++) {      // tie holes, on a strict grid
          const x = (k + 0.5) * TN / 6, hy = y + ry * TN / LIFTS;
          if (r.chance(0.45)) { const len = r.range(70, 300), g = c.createLinearGradient(0, hy, 0, hy + len); g.addColorStop(0, 'rgba(120,84,56,0.26)'); g.addColorStop(1, 'rgba(120,84,56,0)'); c.fillStyle = g; c.fillRect(x - 5, hy, 10, len); }
          let g = c.createRadialGradient(x, hy, 0, x, hy, 12); g.addColorStop(0, 'rgba(28,26,24,0.95)'); g.addColorStop(0.62, 'rgba(34,32,30,0.9)'); g.addColorStop(0.8, 'rgba(225,221,212,0.35)'); g.addColorStop(1, 'rgba(180,176,168,0)');
          c.fillStyle = g; c.beginPath(); c.arc(x, hy, 12, 0, 7); c.fill();
          g = h.createRadialGradient(x, hy, 0, x, hy, 11); g.addColorStop(0, 'rgb(0,0,0)'); g.addColorStop(0.6, 'rgb(10,10,10)'); g.addColorStop(1, 'rgba(128,128,128,0)');
          h.fillStyle = g; h.beginPath(); h.arc(x, hy, 11, 0, 7); h.fill();
        }
      }
      for (let i = 0; i < 3600; i++) {                                    // bug holes: air bubbles against the formwork
        const x = r.range(0, TN), y = r.range(0, TN), rad = r.range(0.6, 2.6) * (r.chance(0.04) ? 2.2 : 1), a = r.range(0.25, 0.7);
        c.fillStyle = `rgba(48,45,42,${a})`; c.beginPath(); c.arc(x, y, rad, 0, 7); c.fill(); h.fillStyle = `rgba(20,20,20,${a})`; h.beginPath(); h.arc(x, y, rad + 0.5, 0, 7); h.fill();
      }
    }, { repeat: [1, 1] });
    hgt.needsUpdate = true;
    return { alb, hgt };
  }

  // weathered steel: tall welded plates under a velvet rust skin, with runs of brighter and darker rust
  function steelTex(K) {
    const r = K.rng(21), ROWS = 2, ph = TN / ROWS, pw = TN / 3;
    const hgt = K.canvasTex(TN, TN, null, { data: true, repeat: [1, 1] }), h = hgt.ctx;
    const alb = K.canvasTex(TN, TN, (c) => {
      c.fillStyle = '#73391f'; c.fillRect(0, 0, TN, TN); h.fillStyle = 'rgb(128,128,128)'; h.fillRect(0, 0, TN, TN);
      const tones = ['140,74,36', '98,46,24', '164,92,44', '80,38,22', '182,106,54', '116,58,32'];
      for (let i = 0; i < 2600; i++) {                                    // blooms of rust
        const x = r.range(0, TN), y = r.range(0, TN), rad = r.range(8, 110), col = r.pick(tones), a = r.range(0.05, 0.2);
        around(c, x, y, rad, () => { const g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2); });
      }
      for (let i = 0; i < 520; i++) {                                     // rain runs
        const x = r.range(0, TN), y = r.range(0, TN), len = r.range(200, 1100), w = r.range(2, 14), light = r.chance(0.55), a = r.range(0.05, 0.17);
        around(c, x, y + len / 2, len, () => { const g = c.createLinearGradient(0, y, 0, y + len); const col = light ? '208,128,62' : '54,24,14'; g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(0.12, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(x - w / 2, y, w, len); });
      }
      for (let i = 0; i < 26000; i++) {                                   // grain of the rust
        const x = r.range(0, TN), y = r.range(0, TN), s = r.range(0.8, 2.6), dark = r.chance(0.5), a = r.range(0.08, 0.3);
        c.fillStyle = dark ? `rgba(52,24,14,${a})` : `rgba(206,134,72,${a})`; c.fillRect(x, y, s, s);
        h.fillStyle = dark ? `rgba(84,84,84,${a * 2})` : `rgba(170,170,170,${a * 2})`; h.fillRect(x, y, s + 1, s + 1);
      }
      for (let j = 0; j < ROWS; j++) {                                    // seams: a hairline with a weld bead beside it
        const y = j * ph, off = (j % 2) * pw / 2;
        for (const dy of [0, TN]) { c.fillStyle = 'rgba(30,13,8,0.7)'; c.fillRect(0, y + dy - 1.5, TN, 3); c.fillStyle = 'rgba(200,124,68,0.35)'; c.fillRect(0, y + dy - 3.5, TN, 2); h.fillStyle = 'rgb(40,40,40)'; h.fillRect(0, y + dy - 2, TN, 4); h.fillStyle = 'rgb(176,176,176)'; h.fillRect(0, y + dy - 5, TN, 3); }
        for (let k = 0; k < 4; k++) { const x = (off + k * pw) % TN; c.fillStyle = 'rgba(30,13,8,0.65)'; c.fillRect(x - 1.5, y, 3, ph); c.fillStyle = 'rgba(200,124,68,0.3)'; c.fillRect(x + 1.5, y, 2, ph); h.fillStyle = 'rgb(40,40,40)'; h.fillRect(x - 2, y, 4, ph); h.fillStyle = 'rgb(170,170,170)'; h.fillRect(x + 2, y, 3, ph); }
      }
    }, { repeat: [1, 1] });
    hgt.needsUpdate = true;
    return { alb, hgt };
  }

  // three channels of soft tiling noise for the big stains (drawn once, sampled at several scales in the shader)
  function noiseTex(K) {
    const N = 256;
    return K.canvasTex(N, N, (c) => {
      const img = c.createImageData(N, N), ch = [];
      for (let k = 0; k < 3; k++) {
        const f = new Float32Array(N * N); let amp = 0.5;
        for (const p of [4, 8, 16, 32, 64]) {
          const r = K.rng(100 + k * 10 + p), lat = Float32Array.from({ length: p * p }, () => r()), g = (i, j) => lat[(j % p) * p + (i % p)];
          for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
            const u = x / N * p, v = y / N * p, i = Math.floor(u), j = Math.floor(v), fx = u - i, fy = v - j, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
            f[y * N + x] += amp * (K.lerp(K.lerp(g(i, j), g(i + 1, j), sx), K.lerp(g(i, j + 1), g(i + 1, j + 1), sx), sy));
          }
          amp *= 0.5;
        }
        ch.push(f);
      }
      for (let i = 0; i < N * N; i++) { for (let k = 0; k < 3; k++) img.data[4 * i + k] = K.clamp((ch[k][i] / 0.97 - 0.5) * 1.7 + 0.5) * 255; img.data[4 * i + 3] = 255; }
      c.putImageData(img, 0, 0);
    }, { data: true, repeat: [1, 1] });
  }

  // the lake bed: pale salt crust in polygons, seen through a film of water
  function saltTex(K, repeat) {
    const N = 1024, CELLS = 11;
    return K.canvasTex(N, N, (c) => {
      const r = K.rng(3), pts = Float32Array.from({ length: CELLS * CELLS * 2 }, () => r()), img = c.createImageData(N, N), nz = K.noise(5);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const u = x / N * CELLS, v = y / N * CELLS, ci = Math.floor(u), cj = Math.floor(v); let f1 = 9, f2 = 9;
        for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
          const k = (((cj + dj) % CELLS + CELLS) % CELLS * CELLS + ((ci + di) % CELLS + CELLS) % CELLS) * 2, px = ci + di + 0.15 + 0.7 * pts[k], py = cj + dj + 0.15 + 0.7 * pts[k + 1], dd = Math.hypot(u - px, v - py);
          if (dd < f1) { f2 = f1; f1 = dd; } else if (dd < f2) f2 = dd;
        }
        const ridge = 1 - K.smooth(0.0, 0.07, f2 - f1), a = x / N * Math.PI * 2, b = y / N * Math.PI * 2;
        const cloud = nz.fbm(Math.cos(a) * 1.3, Math.sin(a) * 1.3, Math.cos(b) * 1.3 + Math.sin(b) * 2.1, 4);   // tiles, because it is sampled around two circles
        const g = 0.74 + 0.16 * cloud + 0.14 * ridge - 0.05 * K.smooth(0.07, 0.3, f2 - f1) * 0;
        img.data[4 * (y * N + x)] = K.clamp(g * 1.0) * 255; img.data[4 * (y * N + x) + 1] = K.clamp(g * 0.955) * 255; img.data[4 * (y * N + x) + 2] = K.clamp(g * 0.89) * 255; img.data[4 * (y * N + x) + 3] = 255;
      }
      c.putImageData(img, 0, 0);
    }, { repeat });
  }

  // stone paving for the terrace tops: long slabs in a running bond
  function paveTex(K) {
    const N = 1024, r = K.rng(31), RW = 8, sh = N / RW, sw = N / 4;
    return K.canvasTex(N, N, (c) => {
      c.fillStyle = '#3d3a37'; c.fillRect(0, 0, N, N);
      for (let j = 0; j < RW; j++) for (let i = -1; i < 4; i++) {
        const x = i * sw + (j % 2) * sw / 2, y = j * sh, v = 132 + r.range(-16, 16);
        c.fillStyle = `rgb(${v + 4 | 0},${v | 0},${v - 6 | 0})`; c.fillRect(x + 2.5, y + 2.5, sw - 5, sh - 5);
      }
      for (let i = 0; i < 5000; i++) { c.fillStyle = r.chance(0.5) ? `rgba(40,38,35,${r.range(0.05, 0.25)})` : `rgba(235,230,220,${r.range(0.04, 0.18)})`; c.fillRect(r.range(0, N), r.range(0, N), r.range(1, 3), r.range(1, 3)); }
      for (let i = 0; i < 90; i++) { const x = r.range(0, N), y = r.range(0, N), rad = r.range(30, 140), g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, 'rgba(50,46,42,0.2)'); g.addColorStop(1, 'rgba(50,46,42,0)'); c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
    }, { repeat: [1, 1] });
  }

  // A material textured in WORLD space, so it needs no UVs and never stretches: the tile is projected from the front,
  // the side and the top and blended by the normal (walls share the vertical axis, so boards and seams run level
  // around every corner and curve). On top of the tile come the stains no tile can give: big blotches, rain streaks
  // that start at the top edge, a damp dark foot, a different shade for every pour. The bump is real relief worked out
  // from the height tile, so raking sun picks out every joint.
  function surface(THREE, tex, noise, o) {
    const m = new THREE.MeshStandardMaterial({ color: o.color || '#ffffff', roughness: o.roughness == null ? 0.9 : o.roughness, metalness: o.metalness || 0 });
    const U = { uAlb: { value: tex.alb }, uHgt: { value: tex.hgt }, uNz: { value: noise }, uTile: { value: TILE }, uBump: { value: o.bump == null ? 0.012 : o.bump },
      uBase: { value: o.base || 0 }, uTop: { value: o.top || 10 }, uStreak: { value: new THREE.Color(o.streak || '#6a6661') }, uStain: { value: o.stain == null ? 1 : o.stain },
      uPour: { value: o.pour == null ? 0.1 : o.pour }, uGrime: { value: o.grime == null ? 0.25 : o.grime }, uPlyY: { value: o.plyY == null ? 1e6 : o.plyY }, uPly: { value: new THREE.Color(o.ply || '#c4a06a') } };
    m.userData.u = U;
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWPos; varying vec3 vWNrm;')
        .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nvWNrm = normalize(mat3(modelMatrix) * objectNormal);')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\nvWPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;\n#else\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\n#endif');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
          varying vec3 vWPos; varying vec3 vWNrm;
          uniform sampler2D uAlb, uHgt, uNz; uniform float uTile, uBump, uBase, uTop, uStain, uPour, uGrime, uPlyY; uniform vec3 uStreak, uPly;
          vec3 triW; vec2 uvF, uvS, uvT; float damp;`)
        .replace('#include <map_fragment>', `
          vec3 wn = normalize(vWNrm);
          triW = pow(abs(wn), vec3(8.0)); triW /= triW.x + triW.y + triW.z;
          uvF = vWPos.xy / uTile; uvS = vWPos.zy / uTile + vec2(0.31, 0.0); uvT = vWPos.xz / uTile + vec2(0.17, 0.43);
          vec3 alb = texture2D(uAlb, uvF).rgb * triW.z + texture2D(uAlb, uvS).rgb * triW.x + texture2D(uAlb, uvT).rgb * triW.y;
          float wall = 1.0 - triW.y, along = vWPos.x * 0.92 + vWPos.z * 0.71;
          vec3 big = texture2D(uNz, vec2(along, vWPos.y) / 14.0).rgb;
          float up = clamp((vWPos.y - uBase) / max(uTop - uBase, 0.01), 0.0, 1.0);
          float run = texture2D(uNz, vec2(along * 0.33, vWPos.y * 0.012 + 0.3)).g * 0.6 + texture2D(uNz, vec2(along * 1.1, vWPos.y * 0.03)).r * 0.4;
          float streak = smoothstep(0.50, 0.72, run) * (0.15 + 0.85 * up * up) * wall;
          damp = (1.0 - smoothstep(0.0, 0.5 + big.b * 1.6, vWPos.y - uBase)) * wall;
          float pour = fract(sin(floor(vWPos.y / (uTile * 0.25)) * 12.9898) * 43758.5453) - 0.5;
          alb *= mix(0.78, 1.14, big.r) * (1.0 + uPour * pour * wall);
          alb = mix(alb, alb * uStreak * 2.0, uStain * 0.75 * streak);
          alb *= 1.0 - uGrime * wall * smoothstep(0.35, 0.75, texture2D(uNz, vec2(along * 0.19, vWPos.y * 0.035 + 0.6)).b) * (0.4 + 0.6 * up);
          alb *= 1.0 - uStain * 0.42 * damp;
          float ply = step(uPlyY, vWPos.y);
          alb = mix(alb, uPly * (0.55 + 0.75 * dot(alb, vec3(0.34))), ply);
          diffuseColor.rgb *= alb;`)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor - 0.3 * damp * uStain, 0.25, 1.0);')
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
          {
            float e = 1.5 / ${TN}.0;
            float f0 = texture2D(uHgt, uvF).r, s0 = texture2D(uHgt, uvS).r, t0 = texture2D(uHgt, uvT).r;
            vec3 g = triW.z * vec3(texture2D(uHgt, uvF + vec2(e, 0.0)).r - f0, texture2D(uHgt, uvF + vec2(0.0, e)).r - f0, 0.0)
                   + triW.x * vec3(0.0, texture2D(uHgt, uvS + vec2(0.0, e)).r - s0, texture2D(uHgt, uvS + vec2(e, 0.0)).r - s0)
                   + triW.y * vec3(texture2D(uHgt, uvT + vec2(e, 0.0)).r - t0, 0.0, texture2D(uHgt, uvT + vec2(0.0, e)).r - t0);
            g *= uBump / (e * uTile);
            vec3 n0 = normalize(vWNrm), nW = normalize(n0 - (g - dot(g, n0) * n0));
            normal = normalize((viewMatrix * vec4(nW, 0.0)).xyz);
          }`);
    };
    return m;
  }

  // ---------------------------------------------------------------- timing (shared by picture and sound)
  const T = { leave: 1.8, hold: 6.3, end: 9.0 };   // drift along the hero letters until `leave`, arrive at the reading position at `hold`

  registerStyle({
    id: 'monument-type',
    name: 'Monument Type',
    family: 'Spaces and journeys',
    look: 'Words as architecture: a short phrase stands as colossal letters on the terraces of a dark concrete monument in a flooded salt flat at sunset. One word is weathered steel and keeps the last sun; tiny people, lamps, birds and a crane give the scale.',
    motion: 'The words never move. The camera starts at eye height against one giant letter, slides off the terrace as it turns to face the words, and sinks back over the water until the terraces close up into one block that reads top to bottom. Then the evening shadow climbs the monument and leaves only the hero word in the sun.',
    light: 'One low sun from the front left rakes every face, picks out board marks and seams and throws long shadows; the cool sky is the only fill, so shade goes blue. At the end a far ridge shades the monument from the bottom up while lamps and windows come on.',
    materials: 'Board-marked concrete with pour joints, tie holes and rain streaks; rusted steel plates with welded seams for the hero word; wet stone paving; plywood formwork and scaffold tubes on the unfinished letter; pale salt under a film of water that mirrors everything.',
    camera: 'One continuous drone move with deep focus (shallow focus would turn the monument into a model): a wide lens at eye height for the start, a longer lens low over the water, looking up, for the hold.',
    post: 'Filmic contrast, a little bloom on the sun and the lamps, soft vignette, fine grain, a short shutter. No depth of field.',
    explains: 'A short statement of two to five words where one word is the point: a principle, a motto, a verdict, a title. The hero word gets the top terrace, its own material and the last light; a word can be marked unfinished to put it under scaffolding.',
    topic: 'Done beats perfect',
    duration: T.end,
    fonts: [FONT],
    render: { samples: 48, shutter: 0.35, tone: 'filmic', exposure: 0.95, contrast: 1.06, saturation: 1.06, bloom: 0.3, bloomThreshold: 1.2, vignette: 0.32, grain: 0.03, fov: 33, near: 0.1, far: 2600, background: '#d8b8a2' },

    build(S) {
      const { THREE, K, scene, camera } = S;
      const rows = layout(K), top = rows[0], front = rows[rows.length - 1];
      const SUN = new THREE.Vector3(-0.85, 0.2, 0.48).normalize();          // low, front left: it rakes across every face
      const SHADOW = { len: 1 / Math.tan(Math.asin(SUN.y)), ry: Math.atan2(-SUN.z, SUN.x) + Math.PI };   // shadow length per unit of height, and its heading on the ground
      const fogColor = new THREE.Color('#d9b39a'), fogDay = fogColor.clone(), fogEve = new THREE.Color('#a9959f');
      scene.fog = new THREE.FogExp2(fogColor, 0.0068);

      // ---- sky, sun and distance
      K.env(S, { top: '#35609f', horizon: '#aeaac6', bottom: '#5a6274', intensity: 1.7 });      // the fill is the cool sky: shadows go blue, the sun stays the only warm light
      const sun = K.sun(S, { pos: [SUN.x * 170, 6 + SUN.y * 170, -8 + SUN.z * 170], target: [0, 6, -8], color: '#ffbf85', power: 11.5, size: 58, soft: 1.5, mapSize: 4096, far: 420, normalBias: 0.05 });
      const sky = new THREE.Mesh(new THREE.SphereGeometry(1300, 48, 24), new THREE.ShaderMaterial({
        side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uSun: { value: SUN }, uFog: { value: fogColor }, uEve: { value: 0 } },
        vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `varying vec3 vD; uniform vec3 uSun, uFog; uniform float uEve;
          float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
          float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
          float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vn(p); p = p * 2.03 + 7.1; a *= 0.5; } return s; }
          void main(){
            vec3 d = normalize(vD); float y = max(d.y, 0.0);
            float az = dot(normalize(uSun.xz), normalize(d.xz + 1e-5)) * 0.5 + 0.5, sd = max(dot(d, uSun), 0.0);   // az: 1 toward the sun, 0 away from it
            vec3 low = mix(vec3(0.95, 0.54, 0.42), vec3(0.95, 0.52, 0.20), pow(az, 1.6));                          // rose away from the sun, amber toward it
            vec3 mid = mix(vec3(0.30, 0.38, 0.64), vec3(0.60, 0.44, 0.40), az);
            vec3 c = mix(mix(low, mid, smoothstep(0.0, 0.24, y)), vec3(0.06, 0.16, 0.44), smoothstep(0.16, 0.9, y));
            c += vec3(1.0, 0.45, 0.12) * pow(sd, 5.0) * 0.3 + vec3(1.6, 0.85, 0.3) * pow(sd, 90.0) + vec3(30.0, 20.0, 9.0) * smoothstep(0.99988, 0.99996, sd);
            vec2 p = d.xz / (d.y + 0.1);                                                                          // a flat layer of high cloud, lit from below
            float n = fbm(p * vec2(0.42, 1.7) + 3.0) * 0.7 + fbm(p * vec2(1.3, 4.6) + 11.0) * 0.3;
            float cl = smoothstep(0.46, 0.70, n) * smoothstep(0.015, 0.16, d.y);
            vec3 lit = mix(vec3(1.3, 0.64, 0.50), vec3(1.35, 0.72, 0.32), az * az);
            c = mix(c, mix(lit, mid * 0.75, smoothstep(0.60, 0.86, n) * 0.6), cl * 0.8);
            c = mix(c, c * vec3(0.74, 0.74, 0.90) + vec3(0.04, 0.0, 0.01), uEve * 0.75);                         // evening: deeper and cooler
            c = mix(uFog, c, smoothstep(-0.005, 0.07, d.y));                                                       // the horizon dissolves into the haze
            gl_FragColor = vec4(c, 1.0);
          }`,
      }));
      sky.frustumCulled = false; scene.add(sky);
      const nzr = K.noise(9);
      [[150, 8, '#4b4658'], [205, 14, '#544c5c'], [270, 22, '#5a5262']].forEach(([R, h0, color], k) => {     // three ridges, each paler in the haze
        const n = 420, pos = [], idx = [];
        for (let i = 0; i <= n; i++) {
          const a = i / n * Math.PI * 2, h = h0 * (0.25 + 1.6 * Math.max(0, 0.45 + nzr.fbm(Math.cos(a) * 2.4 + k * 7, Math.sin(a) * 2.4, k * 3, 5)));
          pos.push(Math.cos(a) * R, -2, Math.sin(a) * R, Math.cos(a) * R, h, Math.sin(a) * R);
          if (i < n) idx.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2);
        }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
        scene.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })));
      });

      // ---- the water: a real mirror over the salt
      // The water takes no sunlight of its own (a film of water shows the sky and the reflection, not cast shadows): its pale
      // salt colour is a constant glow, so the evening shadow can climb the monument without drawing an edge on the lake.
      K.mirrorFloor(S, { y: 0, size: 2400, color: '#100f0e', surfaceRoughness: 0.5, roughness: 0.03, strength: 1.0, fresnel: true, material: { emissive: new THREE.Color('#958a90'), emissiveMap: saltTex(K, [80, 80]), emissiveIntensity: 0.55, envMapIntensity: 0.2 } });

      // ---- the turn: evening. A far ridge (never seen, it only casts) puts the monument in shade from the bottom up,
      // until the hero word alone still has the sun. dusk(t) is the height of the shadow's edge on the plane z = 0; the
      // edge climbs toward the camera and drops toward the back, because the sun is in front.
      const dusk = K.track([[0, -9], [T.hold - 0.3, -1.5, 'linear'], [T.end - 0.5, 13.4, (u) => u * u * (3 - 2 * u)]]);
      let ridge;
      const shadeAt = (y, z, t) => K.smooth(-1.1, 1.1, dusk(t) + (SUN.y / SUN.z) * z - y);            // 0 in the sun, 1 in the shade
      {
        const h = new THREE.Vector3(SUN.x, 0, SUN.z).normalize(), D = 100, pos = [], idx = [], nzs = K.noise(12), n = 120;
        for (let i = 0; i <= n; i++) {
          const x = (i / n - 0.5) * 520, lam = (D - x * h.x) / SUN.dot(h), y = lam * SUN.y + 1.1 * nzs.fbm(x * 0.045, 0.3, 0, 3);
          pos.push(x + lam * SUN.x, y, lam * SUN.z, x + lam * SUN.x, y - 160, lam * SUN.z);
          if (i < n) idx.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2);
        }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
        ridge = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, side: THREE.DoubleSide }));
        ridge.castShadow = true; ridge.frustumCulled = false; scene.add(ridge);
      }

      // ---- surfaces
      const noise = noiseTex(K), concrete = concreteTex(K), steel = steelTex(K);
      const concreteMat = (o) => surface(THREE, concrete, noise, Object.assign({ roughness: 0.92, bump: 0.014, stain: 0.85 }, o));
      const darkMat = (o) => concreteMat(Object.assign({ color: '#3f4a55', stain: 0.7, pour: 0.25 }, o));          // the mass of the monument: dark, so the pale words stand off it
      const steelMat = (o) => surface(THREE, steel, noise, Object.assign({ roughness: 0.8, metalness: 0.2, bump: 0.008, streak: '#9a5a2c', pour: 0, grime: 0.5, color: '#e6d8cc' }, o));
      const add = (geo, mat, x, y, z, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; scene.add(m); return m; };
      const pave = (w, d) => { const t = paveTex(K); t.repeat.set(w / TILE, d / TILE); return t; };
      const paved = (w, d, x, y, z) => { const m = add(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: pave(w, d), roughness: 0.7 }), x, y, z, false); m.rotation.x = -Math.PI / 2; return m; };
      // thin members (scaffold tubes, crane lattice): unit boxes stretched between two points, [from, to, thickness]
      const beams = (segs, mat) => {
        const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, segs.length), a = new THREE.Vector3(), b = new THREE.Vector3(), o = new THREE.Object3D(), up = new THREE.Vector3(0, 1, 0);
        segs.forEach(([p, q, th], i) => { a.set(...p); b.set(...q); o.position.copy(a).add(b).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(up, b.clone().sub(a).normalize()); o.scale.set(th, a.distanceTo(b), th); o.updateMatrix(); m.setMatrixAt(i, o.matrix); });
        m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; scene.add(m); return m;
      };

      // ---- terraces: plain dark blocks that run to the back of the monument, each with a pale coping and a paved top
      const zBack = top.z - top.depth - 3;
      rows.forEach((w, i) => {
        const f = w.edge, last = i === rows.length - 1, W = w.tierW + (last ? 2 : 0), zEnd = i ? rows[i - 1].edge : zBack;
        add(new THREE.BoxGeometry(W, w.base, f - zBack), last ? concreteMat({ base: 0, top: w.base * 3, stain: 0.6 }) : darkMat({ base: 0, top: w.base }), 0, w.base / 2, (f + zBack) / 2);
        if (!last) add(new THREE.BoxGeometry(W + 0.3, 0.2, 0.7), concreteMat({ base: w.base - 1, top: w.base, stain: 0.3 }), 0, w.base - 0.085, f - 0.2);
        if (w !== top) paved(W, f - zEnd, 0, w.base + 0.012, (f + zEnd) / 2);
      });
      // the top terrace is wet: a second mirror, so the opening shot has the hero letters standing on their reflection
      const wet = K.mirrorFloor(S, { y: top.base + 0.012, size: 10, color: '#c9c3b9', surfaceRoughness: 0.42, roughness: 0.09, strength: 0.62, fresnel: true, material: { map: pave(top.tierW, top.edge - zBack), envMapIntensity: 0.3 } });
      wet.geometry = new THREE.PlaneGeometry(top.tierW, top.edge - zBack); wet.position.z = (top.edge + zBack) / 2;
      // the way in: a causeway across the water, straight at the middle of the block
      const CAUSE = { w: 1.5, y: 0.16, z0: front.edge + 0.5, z1: HOLD.pos[2] + 30 };
      add(new THREE.BoxGeometry(CAUSE.w, CAUSE.y, CAUSE.z1 - CAUSE.z0), concreteMat({ base: -1, top: 3, stain: 0.3 }), 0, CAUSE.y / 2, (CAUSE.z0 + CAUSE.z1) / 2);
      paved(CAUSE.w - 0.1, CAUSE.z1 - CAUSE.z0, 0, CAUSE.y + 0.006, (CAUSE.z0 + CAUSE.z1) / 2);

      // ---- the words
      rows.forEach((w) => {
        const g = K.text3d(w.text, { font: FONT, size: w.size, depth: w.depth, bevel: w.size * 0.012, bevelSegments: 1, letterSpacing: SPACING, curveSegments: 96 });
        g.computeBoundingBox(); const bb = g.boundingBox, sx = -(bb.min.x + bb.max.x) / 2, sy = -bb.min.y;
        g.translate(sx, sy, -w.depth / 2);
        w.letters = g.userData.letters.map((l) => ({ char: l.char, x0: l.x + sx, x1: l.x + l.w + sx, start: l.start, count: l.count }));
        const o = { base: w.base, top: w.base + w.cap }, mat = w.hero ? steelMat(o) : concreteMat(o);
        if (w.unfinished) {                                                // the last letter gets its own material: bare concrete below, formwork still on above
          const l = w.letters[w.letters.length - 1];
          g.addGroup(0, l.start, 0); g.addGroup(l.start, l.count, 1);
          w.mesh = add(g, [mat, concreteMat(Object.assign({ plyY: w.base + w.cap * 0.5 }, o))], 0, w.base - 0.02, w.z);
        } else w.mesh = add(g, mat, 0, w.base - 0.02, w.z);
      });

      // ---- scale: lamps, people and birds. Their shadows are drawn as long soft streaks on the ground (a shadow map
      // that covers the whole monument cannot resolve a lamp post), which is what makes them read from far away.
      const lamps = [], people = [], r = K.rng(4), LAMP_H = 1.0;
      rows.forEach((w) => { const n = Math.round(w.tierW / 2.7); for (let k = 0; k <= n; k++) lamps.push([(k / n - 0.5) * (w.tierW - 1.2), w.base, w.edge - 0.75, LAMP_H]); });
      for (let z = CAUSE.z0 + 1; z < CAUSE.z1; z += 2) lamps.push([-CAUSE.w / 2 + 0.06, CAUSE.y, z, 0.2], [CAUSE.w / 2 - 0.06, CAUSE.y, z, 0.2]);   // low lights along the causeway
      const poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.016, 1, 6).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ color: '#23211f', roughness: 0.6, metalness: 0.5 }), lamps.length);
      const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshBasicMaterial({ fog: false }), lamps.length);
      lamps.forEach((p, i) => { K.place(poles, i, p, null, [1, p[3], 1]); K.place(bulbs, i, [p[0], p[1] + p[3] + 0.02, p[2]]); });
      scene.add(poles, bulbs);
      // a soft halo round every lamp, so they carry once the shade arrives
      const haloTex = K.canvasTex(64, 64, (c) => { const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); });
      const halos = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(lamps.flatMap((p) => [p[0], p[1] + p[3] + 0.02, p[2]]), 3)), new THREE.PointsMaterial({ map: haloTex, size: 0.85, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      halos.frustumCulled = false; scene.add(halos);

      // people: person(x, floor, z, heading, speed, tint, aloft). heading 0 faces +z (the hold camera); they walk where they
      // face; aloft = standing on something thin, so no shadow streak on the ground.
      const cloth = ['#23262d', '#34322f', '#473f36', '#22313f', '#5d4e3f', '#b9a98f', '#2d3a2e', '#a3351f'];
      const person = (x, y, z, heading, speed = 0, tint, aloft = false) => people.push({ x, y, z, heading, speed, aloft, ph: r.range(0, 6.28), tint: tint == null ? r.int(0, 5) : tint, s: r.range(0.92, 1.06) });
      const y0 = top.base, z0 = top.z, hw = top.width / 2;
      person(hw * 0.47, y0, z0 + 1.9, -Math.PI * 0.62, 0, 7); person(hw * 0.47 - 0.34, y0, z0 + 2.1, -Math.PI * 0.45, 0, 5);  // two at the foot of the hero, looking along it
      person(hw * 0.2, y0, z0 + 3.6, Math.PI / 2, 0.36, 1); person(hw * 0.02, y0, z0 + 4.2, -Math.PI / 2, 0.33, 3);
      person(-hw * 0.3, y0, z0 + 2.6, Math.PI * 0.6, 0, 0); person(-hw * 0.33, y0, z0 + 3.0, -Math.PI * 0.4, 0, 4); person(-hw * 0.62, y0, z0 + 3.8, Math.PI / 2, 0.34, 2);
      rows.forEach((w, i) => {                                                                                              // a few on every terrace, some at the edge
        for (let k = 0; k < 5 + (i === rows.length - 1 ? 4 : 0); k++) {
          const atEdge = r.chance(0.5), walk = r.chance(0.6), dir = r.sign();
          person(r.range(-0.46, 0.46) * w.tierW, w.base, atEdge ? w.edge - r.range(0.25, 0.5) : w.edge - r.range(1.2, WALK - 1.6), walk ? dir * Math.PI / 2 : r.range(-0.6, 0.6), walk ? r.range(0.3, 0.4) : 0);
        }
      });
      for (let k = 0; k < 7; k++) person(r.range(-0.4, 0.4), CAUSE.y, K.lerp(CAUSE.z0 + 2, HOLD.pos[2] - 19, (k + r()) / 7), r.chance(0.7) ? Math.PI : 0, r.range(0.3, 0.4), k === 2 ? 7 : null);

      // ---- a narrow word leaves bare wall beside it: a scatter of small deep-set windows, a few of them lit
      const frames = [], panes = [], lit = [];
      rows.forEach((w, i) => {
        if (!i || w.share > 0.8) return;
        const up = rows[i - 1], q = K.rng(40 + i), xa = w.width / 2 + 2.2, xb = up.tierW / 2 - 1.2, n = Math.round((xb - xa) * 0.9);
        for (const side of [-1, 1]) for (let k = 0; k < n; k++) {
          const big = q.chance(0.25), ww = big ? 0.42 : 0.24, wh = big ? 0.62 : 0.34, x = side * K.lerp(xa, xb, (k + q.range(0.15, 0.85)) / n), y = K.lerp(w.base + 1.1, up.base - 1.0, q());
          frames.push([x, y, up.edge + 0.03, ww + 0.12, wh + 0.12]); (q.chance(0.22) ? lit : panes).push([x, y, up.edge + 0.07, ww, wh]);
        }
      });
      const boxes = (list, mat, d) => { if (!list.length) return; const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, list.length); list.forEach((b, k) => K.place(m, k, [b[0], b[1], b[2]], null, [b[3], b[4], d])); m.castShadow = true; m.receiveShadow = true; scene.add(m); };
      boxes(frames, darkMat({ base: 0, top: 30, stain: 0.2, bump: 0.004, color: '#5b6068' }), 0.14); boxes(panes, new THREE.MeshStandardMaterial({ color: '#0b0d11', roughness: 0.25 }), 0.08); const glass = new THREE.MeshBasicMaterial(); boxes(lit, glass, 0.08);

      // ---- the unfinished word: scaffold round its last letter, and a tower crane lowering the next formwork panel
      let crane = null; const unfinished = rows.find((w) => w.unfinished);
      if (unfinished) {
        const w = unfinished, l = w.letters[w.letters.length - 1], x0 = l.x0 - 0.15, x1 = l.x1 + 0.3, zA = w.z + 0.3, zB = w.z + 0.78, yb = w.base, tubes = [], LIFT = 0.5;
        const nx = Math.round((x1 - x0) / 0.62), ny = Math.floor((w.cap + 0.7) / LIFT), yt = yb + ny * LIFT + 0.45;
        for (let i = 0; i <= nx; i++) { const x = K.lerp(x0, x1, i / nx); tubes.push([[x, yb, zA], [x, yt, zA], 0.026], [[x, yb, zB], [x, yt, zB], 0.026]); for (let j = 1; j <= ny; j++) tubes.push([[x, yb + j * LIFT, zA], [x, yb + j * LIFT, zB], 0.02]); }
        for (let j = 1; j <= ny; j++) { const y = yb + j * LIFT; tubes.push([[x0, y, zA], [x1, y, zA], 0.022], [[x0, y, zB], [x1, y, zB], 0.022], [[x0, y + 0.22, zB], [x1, y + 0.22, zB], 0.016]); }
        for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) if ((i + j) % 3 === 0) tubes.push([[K.lerp(x0, x1, i / nx), yb + j * LIFT, zB], [K.lerp(x0, x1, (i + 1) / nx), yb + (j + 1) * LIFT, zB], 0.016]);
        beams(tubes, new THREE.MeshStandardMaterial({ color: '#9a9c9d', roughness: 0.45, metalness: 0.8 }));
        const plank = new THREE.MeshStandardMaterial({ color: '#a8845a', roughness: 0.9 });
        for (let j = 1; j <= ny; j++) add(new THREE.BoxGeometry(x1 - x0, 0.022, zB - zA - 0.04), plank, (x0 + x1) / 2, yb + j * LIFT + 0.02, (zA + zB) / 2);
        for (const [s, j] of [[0.3, 3], [0.7, 6], [0.45, ny]]) if (j <= ny) person(K.lerp(x0, x1, s), yb + j * LIFT + 0.03, (zA + zB) / 2, r.range(2.6, 3.6), 0, 5, true);   // workers on the decks

        // tower crane on the right of the word
        const cx = Math.min(l.x1 + 2.3, w.tierW / 2 + 0.4), cz = w.z - w.depth / 2, m = 0.2, yJ = yb + w.cap + 2.6, xT = (l.x0 + l.x1) / 2, jl = cx - xT + 1.6, cl = 2.3, lat = [], BAY = 0.4;
        const C = [[-m, -m], [m, -m], [m, m], [-m, m]];
        C.forEach(([a, b]) => lat.push([[cx + a, yb, cz + b], [cx + a, yJ, cz + b], 0.034]));
        for (let y = yb, k = 0; y < yJ - 0.01; y += BAY, k++) C.forEach(([a, b], q) => { const [c, d] = C[(q + 1) % 4], y1 = Math.min(y + BAY, yJ); lat.push([[cx + a, y1, cz + b], [cx + c, y1, cz + d], 0.016], k % 2 ? [[cx + a, y, cz + b], [cx + c, y1, cz + d], 0.016] : [[cx + c, y, cz + d], [cx + a, y1, cz + b], 0.016]); });
        const jy = yJ + 0.3, ja = jy + 0.36, apex = [cx, yJ + 1.55, cz];
        for (const s of [-0.13, 0.13]) lat.push([[cx + cl, jy, cz + s], [cx - jl, jy, cz + s], 0.026], [[cx, yJ, cz + s], apex, 0.03]);
        lat.push([[cx - 0.2, ja, cz], [cx - jl, ja, cz], 0.026]);
        for (let x = 0.2, k = 0; x < jl - 0.01; x += BAY, k++) { const xa = cx - x, xb = cx - Math.min(x + BAY, jl); lat.push([[xa, jy, cz - 0.13], [xa, jy, cz + 0.13], 0.012], [[xa, ja, cz], [xb, jy, cz + (k % 2 ? 0.13 : -0.13)], 0.014], [[xa, jy, cz + (k % 2 ? -0.13 : 0.13)], [xb, ja, cz], 0.014]); }
        lat.push([apex, [cx - jl * 0.62, ja, cz], 0.012], [apex, [cx - jl * 0.3, ja, cz], 0.012], [apex, [cx + cl, jy, cz], 0.014]);
        beams(lat, new THREE.MeshStandardMaterial({ color: '#d39a1c', roughness: 0.55, metalness: 0.2 }));
        const grey = new THREE.MeshStandardMaterial({ color: '#55585b', roughness: 0.7 });
        add(new THREE.BoxGeometry(0.5, 0.3, 0.5), grey, cx, yJ + 0.15, cz); add(new THREE.BoxGeometry(0.28, 0.3, 0.24), new THREE.MeshStandardMaterial({ color: '#e9e2d2', roughness: 0.5 }), cx - 0.3, yJ + 0.05, cz + 0.36);
        add(new THREE.BoxGeometry(0.7, 0.5, 0.36), concreteMat({ base: jy - 1, top: jy, stain: 0.2 }), cx + cl - 0.45, jy - 0.25, cz);                       // counterweight
        add(new THREE.BoxGeometry(0.8, 0.12, 0.8), grey, cx, yb + 0.06, cz);
        const cable = add(new THREE.BoxGeometry(0.012, 1, 0.012), new THREE.MeshStandardMaterial({ color: '#1b1b1c', roughness: 0.6 }), xT, 0, cz + 0.05, false);
        const panel = add(new THREE.BoxGeometry(0.95, 0.62, 0.035), new THREE.MeshStandardMaterial({ color: '#b98a45', roughness: 0.8 }), xT, 0, cz + 0.05);
        add(new THREE.BoxGeometry(0.2, 0.08, 0.3), grey, xT, jy - 0.05, cz);                                                                                    // trolley
        crane = { cable, panel, jy, y0: yJ - 0.9, y1: yb + w.cap + 0.75 };
      }

      const P = PERSON, NP = people.length;
      const mkPart = (geo, n) => { const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.85 }), n); m.frustumCulled = false; m.receiveShadow = true; scene.add(m); return m; };
      const legs = mkPart(new THREE.CapsuleGeometry(0.036 * P, 0.41 * P, 3, 8).translate(0, -0.24 * P, 0), NP * 2), arms = mkPart(new THREE.CapsuleGeometry(0.027 * P, 0.3 * P, 3, 6).translate(0, -0.175 * P, 0), NP * 2);
      const torsos = mkPart(new THREE.CylinderGeometry(0.092 * P, 0.062 * P, 0.35 * P, 12).scale(1, 1, 0.6), NP), heads = mkPart(new THREE.SphereGeometry(0.06 * P, 12, 10), NP);
      const col = new THREE.Color();
      people.forEach((p, i) => {
        col.set(cloth[p.tint]); torsos.setColorAt(i, col); arms.setColorAt(2 * i, col); arms.setColorAt(2 * i + 1, col);
        col.set(cloth[(p.tint * 3 + 1) % 5]); legs.setColorAt(2 * i, col); legs.setColorAt(2 * i + 1, col);
        col.set(i % 3 ? '#3a2c24' : '#6e5546'); heads.setColorAt(i, col);
      });
      // streak shadows: one quad per person and per lamp, lying on the ground, pointing away from the sun
      const streakTex = K.canvasTex(256, 32, (c) => { const g = c.createLinearGradient(0, 0, 256, 0); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.7, 'rgba(255,255,255,0.75)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 256, 32); const v = c.createLinearGradient(0, 0, 0, 32); v.addColorStop(0, 'rgba(0,0,0,1)'); v.addColorStop(0.35, 'rgba(0,0,0,0)'); v.addColorStop(0.65, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,1)'); c.globalCompositeOperation = 'destination-out'; c.fillStyle = v; c.fillRect(0, 0, 256, 32); });
      const streaks = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(0.5, 0, 0), new THREE.MeshBasicMaterial({ map: streakTex, color: '#141a2a', transparent: true, opacity: 0.55, depthWrite: false }), NP + lamps.length);
      streaks.frustumCulled = false; scene.add(streaks);
      const dummy = new THREE.Object3D(); dummy.rotation.order = 'YXZ';
      const put = (mesh, i, x, y, z, heading, pitch, roll, s) => { dummy.position.set(x, y, z); dummy.rotation.set(pitch, heading, roll || 0); dummy.scale.setScalar(s == null ? 1 : s); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); };

      // birds: two small flocks, one in the first shot and one that crosses the sky at the hold
      const birds = [];
      const flock = (n, c, v, seed) => { const q = K.rng(seed); for (let i = 0; i < n; i++) birds.push({ p: [c[0] + q.range(-2.2, 2.2), c[1] + q.range(-0.7, 0.7), c[2] + q.range(-2.2, 2.2)], v, f: q.range(3.2, 4.4), ph: q.range(0, 6.28) }); };
      flock(9, [hw * 0.1, y0 + 6.5, z0 + 14], [-2.6, 0.12, -0.5], 1); flock(11, [-22 + 2.8 * T.hold, y0 + top.cap + 2.2, z0 + 9], [-2.8, 0.1, 0.3], 2);
      const wings = new THREE.InstancedMesh(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.05, 0, 0, -0.05, 0.19, 0, -0.03], 3)), new THREE.MeshBasicMaterial({ color: '#1d1a1c', side: THREE.DoubleSide }), birds.length * 2);
      wings.frustumCulled = false; scene.add(wings);

      // ---- camera: one move. It starts at eye height against the hero, slides off the terrace while it turns to face
      // the words, and sinks back over the water to the hold, where the terraces close up into one block.
      const cam = {
        pos: K.path([[0, [hw * 0.80, y0 + 0.42, z0 + 3.1]], [T.leave, [hw * 0.66, y0 + 0.6, z0 + 4.2]], [T.leave + 2, [3.5, y0 + 0.2, z0 + 22]], [T.hold, HOLD.pos]]),
        aim: K.path([[0, [-hw * 0.25, y0 + 3.3, z0 + 0.3]], [T.leave, [-hw * 0.2, y0 + 3.8, z0]], [T.leave + 2, [0, y0 + 2.0, z0]], [T.hold, HOLD.aim]]),
        fov: K.path([[0, 50], [T.leave, 48], [T.leave + 2, 40], [T.hold, HOLD.fov]]),
      };
      const creep = (t) => { const u = Math.max(0, t - (T.hold - 1.2)); return u * u / (u + 1.2); };   // the move never quite stops: a slow push carries the hold
      const pos = [0, 0, 0];

      return {
        update(t) {
          const c = cam.pos(t), k = creep(t);
          pos[0] = c[0]; pos[1] = c[1] + 0.02 * k; pos[2] = c[2] - 0.5 * k;
          K.look(camera, pos, cam.aim(t), cam.fov(t)); K.focus(camera, 40, 0);

          people.forEach((p, i) => {
            const dx = Math.sin(p.heading), dz = Math.cos(p.heading), go = p.speed * t, x = p.x + dx * go, z = p.z + dz * go, h = P * p.s;
            const step = p.ph + go * 17, sw = p.speed ? Math.sin(step) * 0.55 : 0, y = p.y + (p.speed ? Math.abs(Math.cos(step)) * 0.012 : 0);
            const ox = Math.cos(p.heading), oz = -Math.sin(p.heading);                                  // the person's right
            put(legs, 2 * i, x + ox * 0.04 * h, y + 0.485 * h, z + oz * 0.04 * h, p.heading, sw, 0.09, p.s); put(legs, 2 * i + 1, x - ox * 0.04 * h, y + 0.485 * h, z - oz * 0.04 * h, p.heading, -sw, -0.09, p.s);
            put(arms, 2 * i, x + ox * 0.11 * h, y + 0.82 * h, z + oz * 0.11 * h, p.heading, -sw * 0.7, 0.1, p.s); put(arms, 2 * i + 1, x - ox * 0.11 * h, y + 0.82 * h, z - oz * 0.11 * h, p.heading, sw * 0.7, -0.1, p.s);
            put(torsos, i, x, y + 0.665 * h, z, p.heading, p.speed ? 0.06 : 0, 0, p.s); put(heads, i, x, y + 0.93 * h, z, p.heading, 0, 0, p.s);
            K.place(streaks, i, [x, p.y + 0.02, z], [0, SHADOW.ry, 0], p.aloft ? [0, 0, 0] : [h * SHADOW.len, 1, 0.17 * (1 - shadeAt(p.y, z, t))]);
          });
          lamps.forEach((p, i) => K.place(streaks, NP + i, [p[0], p[1] + 0.022, p[2]], [0, SHADOW.ry, 0], [p[3] * SHADOW.len, 1, 0.05 * (1 - shadeAt(p[1], p[2], t))]));
          for (const m of [legs, arms, torsos, heads, streaks, wings]) m.instanceMatrix.needsUpdate = true;
          // evening: the shadow climbs, and the lamps and windows come up as it does
          ridge.position.y = dusk(t);
          const eve = K.seg(t, T.hold - 1.0, T.end - 0.5, K.ease.inOut);
          bulbs.material.color.setRGB(6.0, 3.0, 1.0).multiplyScalar(0.3 + 1.2 * eve); halos.material.color.setRGB(1.0, 0.5, 0.17).multiplyScalar(0.06 + 0.75 * eve); glass.color.setRGB(2.2, 1.0, 0.3).multiplyScalar(0.1 + 0.9 * eve);
          sun.color.setRGB(1.0, 0.52 - 0.07 * eve, 0.24 - 0.07 * eve); sky.material.uniforms.uEve.value = eve; fogColor.lerpColors(fogDay, fogEve, eve); scene.fog.color.copy(fogColor);
          birds.forEach((b, i) => {
            const x = b.p[0] + b.v[0] * t, y = b.p[1] + b.v[1] * t + Math.sin(t * 0.9 + b.ph) * 0.15, z = b.p[2] + b.v[2] * t, hd = Math.atan2(b.v[0], b.v[2]);
            const flap = Math.sin(t * b.f * 6.283 + b.ph) * 0.75 + 0.15;
            put(wings, 2 * i, x, y, z, hd, 0, flap, 1); put(wings, 2 * i + 1, x, y, z, hd + Math.PI, 0, flap, 1);
          });
          if (crane) {                                                     // the panel comes down slowly and swings a little on its cable
            const y = K.lerp(crane.y0, crane.y1, K.seg(t, 2, T.end + 1.5, K.ease.inOut)), swing = Math.sin(t * 1.3) * 0.035;
            crane.panel.position.y = y; crane.panel.rotation.set(0, 0.5 + Math.sin(t * 0.7) * 0.25, swing);
            crane.cable.position.y = (crane.jy + y + 0.3) / 2; crane.cable.scale.y = crane.jy - y - 0.3;
          }
        },
      };
    },

    sound(k) {
      // wind over open water, a low drone that opens into a chord when the block lines up, and the site still at work
      k.noise(0, { dur: T.end, color: 'pink', filter: 'bandpass', f: [[0, 360], [T.leave + 1.8, 1000], [T.hold, 400], [T.end, 460]], q: 0.7, gain: 0.05, a: 0.5, hold: T.end - 1.4, bus: 'amb' });
      k.noise(0, { dur: T.end, color: 'brown', filter: 'lowpass', f: 220, gain: 0.05, a: 0.4, hold: T.end - 1.2, bus: 'amb' });
      for (const [f, g, pan] of [['D2', 0.05, 0], ['A2', 0.03, -0.3]]) k.tone(0, { f, type: 'sine', dur: T.end, gain: g, a: 3.5, hold: T.end - 4.5, pan, bus: 'music', verb: 0.3 });
      k.play('whoosh', T.leave + 0.3, { dur: 3.8, top: 1500, gain: 1.1 });                                   // the air as the camera leaves the terrace and falls back
      k.play('impact', T.hold - 0.15, { gain: 1.0, f: 62 });                                                // the terraces close up into one block
      for (const [f, g, pan] of [['D3', 0.09, 0], ['F#3', 0.06, -0.4], ['A3', 0.055, 0.4], ['D4', 0.04, 0.15]]) k.tone(T.hold - 0.15, { f, type: 'triangle', dur: T.end - T.hold + 0.15, gain: g, a: 0.02, hold: 0.5, pan, bus: 'music', filter: 'lowpass', f2: 1300, verb: 0.5 });   // a struck steel plate, ringing in D
      k.tone(T.end - 1.5, { f: 'F#4', type: 'sine', dur: 1.5, gain: 0.03, a: 0.5, hold: 0.3, verb: 0.6 });   // the last light on the hero word
      k.tone(T.end - 1.5, { f: 'A4', type: 'sine', dur: 1.5, gain: 0.022, a: 0.6, hold: 0.3, pan: 0.3, verb: 0.6 });
      k.withMinor(() => {
        for (const [t, f] of [[0.35, 3100], [0.62, 3500], [1.05, 2900], [1.5, 3300]]) k.tone(t, { f: [[0, f], [0.06, f * 1.25], [0.14, f * 0.9]], dur: 0.16, gain: 0.03, pan: -0.5, verb: 0.4 });   // birds
        for (const [t, f] of [[T.hold + 0.8, 520], [T.hold + 1.05, 640], [T.hold + 1.9, 480]]) { k.play('tock', t, { gain: 0.2, f, pan: 0.6 }); k.tone(t, { f: f * 3.1, dur: 0.5, gain: 0.014, pan: 0.6, verb: 0.6 }); }   // scaffold and crane, far off
      });
    },
  });
}
```
