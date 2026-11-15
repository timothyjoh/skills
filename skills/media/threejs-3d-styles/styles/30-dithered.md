# Dithered (#30)

- **id:** `dithered`
- **Category:** Filters over 3D
- **Use:** explainer
- **Reference duration:** 8 s
- **Google Fonts:** Archivo Black
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`

## Style card

- **Look:** A lit 3D scene shown in one-bit: two colours only, big square pixels, every shade made of ordered dot patterns, one-pixel contours and bitmap lettering in desktop windows, like an early home computer screen with real depth behind it.
- **Motion:** Crisp steps, no blur. Objects tick, snap, overshoot and rattle; interface changes are instant or a short blink of one small plate, never a full-screen flash. The camera glides while the subject keeps the same pixels, so the picture scrolls like a sprite instead of shimmering.
- **Light:** One low sun through a window that is out of shot: a hard key from the upper left, long crisp shadows, and the window's edge and glazing bar falling across desk and wall. Almost no fill, so shadows go to solid ink; a little bounce from the desk and a low back light keep the shadow side readable. The subject is lit against the dark wall on one side and dark against the lit wall on the other.
- **Materials:** Greys only: what counts is each surface's tone, because tone decides whether it becomes paper, ink or a dot pattern. The ground is clean paper, the hero is the one mid-tone object, small props are white with a contour. Simple round forms, a few bold printed details, one glossy surface for a hard highlight.
- **Camera:** Long lens looking slightly down, fixed heading, one slow truck and pull-back that ends on the whole set-up. The pixel grid is tied to the subject, so it keeps its pixels while the wall and the props slide past it.
- **Finish:** Picture reduced to 384 x 216 pixels, Bayer 4 x 4 ordered dither into ink and paper, contours from a normal-and-depth pass in whichever colour the surroundings are not. No blur, bloom, grain or vignette.
- **Good for:** Any object or small set-up staged like a still life, with desktop windows carrying the numbers: a readout for the value that changes and a strip for sequence or progress. Good for routines, cycles, steps, states and anything with a clock in it.

## Reference

- **Sample topic:** The Pomodoro technique: 25 minutes of work, 5 minutes of rest, repeat
- **Gallery description:** A lit 3D scene shown in one-bit: two colours only, big square pixels, every shade made of ordered dot patterns, one-pixel contours and bitmap lettering in desktop windows, like an early home computer screen with real depth behind it.
- **Shown in the sample clip:** The Pomodoro technique: 25 minutes of work, 5 minutes of rest, repeat

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/dithered.js`)

```js
{
  // ---------------------------------------------------------------- content (change this for a new topic)
  const WORK = 25, REST = 5;                  // minutes on the dial
  const WORDS = { title: 'POMODORO', work: 'WORK', rest: 'REST', again: 'REPEAT' };
  const INK = '#3a1510', PAPER = '#f4e8cc';   // the only two colours in the picture
  const CELL = 5;                             // one picture pixel = 5 x 5 screen pixels (384 x 216 picture)
  const RATE = WORK / 3.3;                    // timer minutes per second of film: the dial is a time-lapse
  const START = 0.45;                         // the first frame holds on a wound timer, then it starts to run

  // one schedule for picture and sound: count down, ring, wind up again
  function schedule() {
    const P = []; let t = START, unit = 0;
    const count = (kind, from) => { P.push({ type: 'count', kind, from, t0: t, t1: t + from / RATE, unit }); t += from / RATE; unit += from; };
    const ring = (d) => { P.push({ type: 'ring', t0: t, t1: t + d, unit }); t += d; };
    const wind = (kind, to, d) => { P.push({ type: 'wind', kind, to, t0: t, t1: t + d, unit }); t += d; };
    count('work', WORK); ring(0.6); wind('rest', REST, 0.4); count('rest', REST); ring(0.45); wind('work', WORK, 0.6); count('work', WORK);
    return P;
  }
  const PHASES = schedule();
  const BELL = PHASES.find((p) => p.type === 'ring').t0;                             // the first bell: work is over
  const AGAIN = PHASES.find((p) => p.type === 'wind' && p.kind === 'work').t0;      // the timer is wound for round two
  const WIND = (u) => globalThis.K.ease.outBack(u, 0.9);                             // a twist of the wrist: fast, a little too far, back
  // everything the picture needs to know about the timer at time t
  function timerAt(t) {
    let s = { min: WORK, kind: 'work', unit: 0, ring: -1, type: 'hold' };
    for (const p of PHASES) {
      if (t < p.t0) break;
      const u = Math.min(1, (t - p.t0) / (p.t1 - p.t0));
      if (p.type === 'count') s = { min: p.from * (1 - u), kind: p.kind, unit: p.unit + p.from * u, ring: -1, type: 'count' };
      else if (p.type === 'ring') s = { min: 0, kind: s.kind, unit: p.unit, ring: t - p.t0, type: 'ring' };
      else s = { min: p.to * WIND(u), kind: p.kind, unit: p.unit, ring: -1, type: 'wind', to: p.to };
    }
    return s;
  }

  // ---------------------------------------------------------------- the finish: one-bit dither with anchored pixels
  // ditherFinish(S, { ink, paper, cell }) turns any lit scene into a two-colour picture. Call fin.frame(t, anchor)
  // at the end of update(t). Three ideas make it hold up in motion:
  //  1. Big pixels on a grid that travels with the subject. The grid's origin is the screen position of a world
  //     point (the anchor), so when the camera trucks or cranes, the subject keeps exactly the same pixels and the
  //     same dots, like a sprite scrolling, instead of crawling through a pattern that is glued to the glass.
  //  2. Ordered (Bayer 4 x 4) dither on that grid: 17 fixed dot patterns, no noise, so nothing can boil.
  //  3. A one-pixel contour from a normal-and-depth render of the scene, drawn in whichever of the two colours
  //     the surroundings are not: ink lines in the light, paper lines in the dark. Shapes never merge.
  // Staging rules that suit it:
  //  - Model in greys and give every surface one of three jobs: clean paper (the ground, anything white), solid ink
  //    (deep shadow, printed marks) or a dot pattern (the hero's form, light falling off across a wall). `hi` is the
  //    graded brightness that becomes clean paper: set it to your lit ground. Big areas of 50 % checker read as mud.
  //  - One hard light, with shadow shapes you would be happy to cut out of black paper, and almost no fill.
  //  - Printed detail needs to be about three picture pixels thick on screen; thinner lines break up.
  //  - No motion blur and no depth of field (shutter 0, no K.focus aperture): blur only turns into noisy dots.
  //  - Move the camera by sliding it, not by turning it, and anchor the grid on the subject.
  //  - Keep see-through planes out of the 3D scene (the contour pass sees them as solid); lettering goes on the overlay.
  const DITHER = `
    uniform sampler2D gbuf; uniform vec2 origin; uniform float cell, lo, hi, gamma, lineAt; uniform vec3 ink, paper;
    float b2(vec2 a){ a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
    float bayer4(vec2 a){ return b2(0.5 * a) * 0.25 + b2(a); }                       // 0, 1/16 ... 15/16
    float tone(vec2 c){ float l = dot(texture2D(tex, c / res).rgb, vec3(0.2126, 0.7152, 0.0722)); return pow(clamp((l - lo) / (hi - lo), 0.0, 1.0), gamma); }
    void main(){
      vec2 q = floor((gl_FragCoord.xy - origin) / cell), c = (q + 0.5) * cell + origin;   // which big pixel, and its centre
      vec2 dx = vec2(cell, 0.0), dy = vec2(0.0, cell);
      float l = tone(c);                                  // one sample at the centre: silhouettes stay hard
      float white = step(bayer4(q) + 0.03125, l);
      // contour. gbuf = view normal (xyz) and 1 / depth (w). 1 / depth is linear across the screen on any flat
      // surface, so its second difference is zero on floors and walls however steeply they recede, and strongly
      // negative on the near side of a silhouette.
      vec4 g = texture2D(gbuf, c / res), gr = texture2D(gbuf, (c + dx) / res), gl = texture2D(gbuf, (c - dx) / res), gu = texture2D(gbuf, (c + dy) / res), gd = texture2D(gbuf, (c - dy) / res);
      float sil = step(0.035 * g.w, -min(gr.w + gl.w - 2.0 * g.w, gu.w + gd.w - 2.0 * g.w));
      float same = step(abs(gr.w - g.w), 0.02 * g.w) * step(abs(gd.w - g.w), 0.02 * g.w);
      float crease = same * step(min(dot(g.xyz, gr.xyz), dot(g.xyz, gd.xyz)), 0.55);
      float line = max(sil, crease) * step(1e-6, g.w);
      float around = (l + tone(c + dx) + tone(c - dx) + tone(c + dy) + tone(c - dy)) * 0.2;
      white = mix(white, step(around, lineAt), line);     // dark surroundings get a paper line, light ones an ink line
      gl_FragColor = vec4(mix(ink, paper, white), 1.0);
    }`;
  function ditherFinish(S, o = {}) {
    const { THREE, renderer, scene, camera, W, H } = S, cell = o.cell || 5;
    const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return new THREE.Vector3((n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); };
    const gbuf = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
    const gMat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      vertexShader: `varying vec3 vN; varying float vZ;
        void main(){
          #include <beginnormal_vertex>
          #include <defaultnormal_vertex>
          #include <begin_vertex>
          #include <project_vertex>
          vN = transformedNormal; vZ = -mvPosition.z; }`,
      fragmentShader: 'varying vec3 vN; varying float vZ; void main(){ gl_FragColor = vec4(normalize(vN) * (gl_FrontFacing ? 1.0 : -1.0), 1.0 / vZ); }',
    });
    const filter = S.addFilter(DITHER, {
      gbuf: { value: gbuf.texture }, origin: { value: new THREE.Vector2() }, cell: { value: cell }, ink: { value: rgb(o.ink || '#000000') }, paper: { value: rgb(o.paper || '#ffffff') },
      lo: { value: o.lo == null ? 0.05 : o.lo }, hi: { value: o.hi == null ? 0.8 : o.hi }, gamma: { value: o.gamma || 1 }, lineAt: { value: o.lineAt == null ? 0.42 : o.lineAt },
    });
    const v = new THREE.Vector3(), clear = new THREE.Color(), origin = filter.uniforms.origin.value;
    let last = null;
    return {
      filter, cell, origin,
      // snap a canvas position (y down) to the travelling pixel grid, for overlay drawings that belong to the scene
      snap: (x, y) => [origin.x + cell * Math.round((x - origin.x) / cell), (H - origin.y) + cell * Math.round((y - (H - origin.y)) / cell)],
      project: (p) => { v.set(p[0], p[1], p[2]).project(camera); return [(v.x * 0.5 + 0.5) * W, (0.5 - v.y * 0.5) * H]; },
      frame(t, anchor) {
        camera.updateMatrixWorld();
        v.set(anchor[0], anchor[1], anchor[2]).project(camera);
        origin.set(Math.round((v.x * 0.5 + 0.5) * W), Math.round((v.y * 0.5 + 0.5) * H));
        if (t === last) return;      // the kit calls update many times per frame; with shutter 0 they are all the same moment
        last = t;
        const bg = scene.background, auto = renderer.shadowMap.autoUpdate, alpha = renderer.getClearAlpha(); renderer.getClearColor(clear);
        scene.background = null; scene.overrideMaterial = gMat; renderer.shadowMap.autoUpdate = false; renderer.setClearColor(0x000000, 0);
        renderer.setRenderTarget(gbuf); renderer.render(scene, camera); renderer.setRenderTarget(null);
        scene.background = bg; scene.overrideMaterial = null; renderer.shadowMap.autoUpdate = auto; renderer.setClearColor(clear, alpha);
      },
    };
  }

  // ---------------------------------------------------------------- pixel lettering and window furniture
  // A bold 9-row bitmap alphabet with two-pixel stems, in the spirit of early desktop system fonts. Drawn on the
  // 2D overlay in whole picture pixels, so interface and scene share one pixel size.
  const GLYPHS = {
    A: '..XX..|.XXXX.|XX..XX|XX..XX|XX..XX|XXXXXX|XX..XX|XX..XX|XX..XX', B: 'XXXXX.|XX..XX|XX..XX|XX..XX|XXXXX.|XX..XX|XX..XX|XX..XX|XXXXX.',
    C: '.XXXX.|XX..XX|XX....|XX....|XX....|XX....|XX....|XX..XX|.XXXX.', D: 'XXXXX.|XX..XX|XX..XX|XX..XX|XX..XX|XX..XX|XX..XX|XX..XX|XXXXX.',
    E: 'XXXXX|XX...|XX...|XX...|XXXX.|XX...|XX...|XX...|XXXXX', F: 'XXXXX|XX...|XX...|XX...|XXXX.|XX...|XX...|XX...|XX...',
    G: '.XXXX.|XX..XX|XX....|XX....|XX.XXX|XX..XX|XX..XX|XX..XX|.XXXX.', H: 'XX..XX|XX..XX|XX..XX|XX..XX|XXXXXX|XX..XX|XX..XX|XX..XX|XX..XX',
    I: 'XX|XX|XX|XX|XX|XX|XX|XX|XX', J: '...XX|...XX|...XX|...XX|...XX|...XX|...XX|XX.XX|.XXX.',
    K: 'XX..XX|XX..XX|XX.XX.|XXXX..|XXX...|XXXX..|XX.XX.|XX..XX|XX..XX', L: 'XX...|XX...|XX...|XX...|XX...|XX...|XX...|XX...|XXXXX',
    M: 'XX....XX|XXX..XXX|XXXXXXXX|XX.XX.XX|XX.XX.XX|XX....XX|XX....XX|XX....XX|XX....XX', N: 'XX...XX|XXX..XX|XXX..XX|XXXX.XX|XX.XXXX|XX..XXX|XX..XXX|XX...XX|XX...XX',
    O: '.XXXX.|XX..XX|XX..XX|XX..XX|XX..XX|XX..XX|XX..XX|XX..XX|.XXXX.', P: 'XXXXX.|XX..XX|XX..XX|XX..XX|XXXXX.|XX....|XX....|XX....|XX....',
    Q: '.XXXX.|XX..XX|XX..XX|XX..XX|XX..XX|XX..XX|XX.XXX|.XXXX.|....XX', R: 'XXXXX.|XX..XX|XX..XX|XX..XX|XXXXX.|XX.XX.|XX..XX|XX..XX|XX..XX',
    S: '.XXXX.|XX..XX|XX....|XXX...|.XXXX.|...XXX|....XX|XX..XX|.XXXX.', T: 'XXXXXX|..XX..|..XX..|..XX..|..XX..|..XX..|..XX..|..XX..|..XX..',
    U: 'XX..XX|XX..XX|XX..XX|XX..XX|XX..XX|XX..XX|XX..XX|XX..XX|.XXXX.', V: 'XX..XX|XX..XX|XX..XX|XX..XX|XX..XX|XX..XX|.XXXX.|.XXXX.|..XX..',
    W: 'XX....XX|XX....XX|XX....XX|XX....XX|XX.XX.XX|XX.XX.XX|XXXXXXXX|XXX..XXX|XX....XX', X: 'XX..XX|XX..XX|.XXXX.|.XXXX.|..XX..|.XXXX.|.XXXX.|XX..XX|XX..XX',
    Y: 'XX..XX|XX..XX|XX..XX|.XXXX.|..XX..|..XX..|..XX..|..XX..|..XX..', Z: 'XXXXXX|....XX|...XX.|...XX.|..XX..|.XX...|.XX...|XX....|XXXXXX',
    0: '.XXXX.|XX..XX|XX..XX|XX..XX|XX..XX|XX..XX|XX..XX|XX..XX|.XXXX.', 1: '..XX..|.XXX..|XXXX..|..XX..|..XX..|..XX..|..XX..|..XX..|XXXXXX',
    2: '.XXXX.|XX..XX|....XX|....XX|...XX.|..XX..|.XX...|XX....|XXXXXX', 3: '.XXXX.|XX..XX|....XX|....XX|..XXX.|....XX|....XX|XX..XX|.XXXX.',
    4: '...XXX|..XXXX|.XX.XX|XX..XX|XX..XX|XXXXXX|....XX|....XX|....XX', 5: 'XXXXXX|XX....|XX....|XXXXX.|....XX|....XX|....XX|XX..XX|.XXXX.',
    6: '.XXXX.|XX..XX|XX....|XX....|XXXXX.|XX..XX|XX..XX|XX..XX|.XXXX.', 7: 'XXXXXX|....XX|....XX|...XX.|...XX.|..XX..|..XX..|..XX..|..XX..',
    8: '.XXXX.|XX..XX|XX..XX|XX..XX|.XXXX.|XX..XX|XX..XX|XX..XX|.XXXX.', 9: '.XXXX.|XX..XX|XX..XX|XX..XX|.XXXXX|....XX|....XX|XX..XX|.XXXX.',
    ':': '..|..|XX|XX|..|..|XX|XX|..', '.': '..|..|..|..|..|..|..|XX|XX', '-': '....|....|....|....|XXXX|....|....|....|....', '!': 'XX|XX|XX|XX|XX|XX|..|XX|XX',
    '+': '......|......|..XX..|..XX..|XXXXXX|..XX..|..XX..|......|......', '/': '....XX|....XX|...XX.|...XX.|..XX..|.XX...|.XX...|XX....|XX....',
    '?': '.XXXX.|XX..XX|....XX|...XX.|..XX..|..XX..|......|..XX..|..XX..', ' ': '...|...|...|...|...|...|...|...|...',
    '@': '...XXXX....|..XX..XX...|.XX....XX..|.XX..XXXXXX|.XX...XXXX.|.XX....XX..|..XX.......|...XXXXX...|...........',   // loop arrow
  };
  for (const k in GLYPHS) GLYPHS[k] = GLYPHS[k].split('|');
  // pixelKit(ctx): draw in picture pixels. c = true for ink, false for paper.
  function pixelKit(ctx, cell, ink, paper) {
    const col = (c) => (c ? ink : paper);
    const rect = (x, y, w, h, c) => { ctx.fillStyle = col(c); ctx.fillRect(x * cell, y * cell, w * cell, h * cell); };
    const width = (s, k = 1) => [...s].reduce((w, ch) => w + (GLYPHS[ch] || GLYPHS[' '])[0].length * k + k, -k);
    const text = (s, x, y, c = true, k = 1, align = 'left') => {
      x -= align === 'center' ? Math.round(width(s, k) / 2) : align === 'right' ? width(s, k) : 0;
      for (const ch of s) {
        const g = GLYPHS[ch] || GLYPHS[' '];
        g.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === 'X') { let n = 1; while (row[i + n] === 'X') n++; rect(x + i * k, y + j * k, n * k, k, c); i += n - 1; } });
        x += g[0].length * k + k;
      }
    };
    // 50 % checker, the classic "grey"
    const grey = (x, y, w, h, c = true) => { for (let j = 0; j < h; j++) for (let i = (x + y + j) & 1; i < w; i += 2) rect(x + i, y + j, 1, 1, c); };
    const box = (x, y, w, h, c = true) => { rect(x, y, w, 1, c); rect(x, y + h - 1, w, 1, c); rect(x, y, 1, h, c); rect(x + w - 1, y, 1, h, c); };
    // a desktop window: drop shadow, one-pixel frame, striped title bar with a close box
    const win = (x, y, w, h, title) => {
      rect(x + 2, y + 2, w, h, true); rect(x, y, w, h, true); rect(x + 1, y + 1, w - 2, h - 2, false);
      if (title != null) {
        for (let j = 3; j <= 9; j += 2) rect(x + 3, y + j, w - 6, 1, true);
        rect(x + 7, y + 2, 9, 9, false); box(x + 8, y + 3, 7, 7);
        if (title) { const tw = width(title); rect(x + Math.round((w - tw) / 2) - 4, y + 2, tw + 8, 9, false); text(title, x + Math.round(w / 2), y + 2, true, 1, 'center'); }
        rect(x, y + 12, w, 1, true);
      }
    };
    return { rect, text, width, grey, box, win };
  }

  // ---------------------------------------------------------------- shapes
  // a slice of a squashed sphere between two angles from the pole, with optional tomato lobes and a dimple on top
  function shell(THREE, K, { R, B, a0, a1, lobes = 0, amp = 0, fade = () => 1, dimple = 0, nu = 144, nv = 40 }) {
    const pos = [], idx = [];
    for (let j = 0; j <= nv; j++) {
      const a = a0 + (a1 - a0) * j / nv;
      for (let i = 0; i <= nu; i++) {
        const th = i / nu * Math.PI * 2, k = amp * fade(a) * (0.5 - 0.5 * Math.cos(lobes * th));
        const r = R * Math.sin(a) * (1 - k), y = B * Math.cos(a) * (1 - 0.5 * k) - dimple * Math.exp(-a * a / 0.1);
        pos.push(r * Math.sin(th), y, r * Math.cos(th));
      }
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const n = g.attributes.normal;   // weld the seam so the light does not show it
    for (let j = 0; j <= nv; j++) { const a = j * (nu + 1), b = a + nu, x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b), l = Math.hypot(x, y, z); n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l); }
    return g;
  }

  registerStyle({
    id: 'dithered',
    name: 'Dithered',
    family: 'Filters over 3D',
    look: 'A lit 3D scene shown in one-bit: two colours only, big square pixels, every shade made of ordered dot patterns, one-pixel contours and bitmap lettering in desktop windows, like an early home computer screen with real depth behind it.',
    motion: 'Crisp steps, no blur. Objects tick, snap, overshoot and rattle; interface changes are instant or a short blink of one small plate, never a full-screen flash. The camera glides while the subject keeps the same pixels, so the picture scrolls like a sprite instead of shimmering.',
    light: 'One low sun through a window that is out of shot: a hard key from the upper left, long crisp shadows, and the window\'s edge and glazing bar falling across desk and wall. Almost no fill, so shadows go to solid ink; a little bounce from the desk and a low back light keep the shadow side readable. The subject is lit against the dark wall on one side and dark against the lit wall on the other.',
    materials: 'Greys only: what counts is each surface\'s tone, because tone decides whether it becomes paper, ink or a dot pattern. The ground is clean paper, the hero is the one mid-tone object, small props are white with a contour. Simple round forms, a few bold printed details, one glossy surface for a hard highlight.',
    camera: 'Long lens looking slightly down, fixed heading, one slow truck and pull-back that ends on the whole set-up. The pixel grid is tied to the subject, so it keeps its pixels while the wall and the props slide past it.',
    post: 'Picture reduced to 384 x 216 pixels, Bayer 4 x 4 ordered dither into ink and paper, contours from a normal-and-depth pass in whichever colour the surroundings are not. No blur, bloom, grain or vignette.',
    explains: 'Any object or small set-up staged like a still life, with desktop windows carrying the numbers: a readout for the value that changes and a strip for sequence or progress. Good for routines, cycles, steps, states and anything with a clock in it.',
    topic: 'The Pomodoro technique: 25 minutes of work, 5 minutes of rest, repeat',
    duration: 8,
    fonts: ['400 100px "Archivo Black"'],
    render: { samples: 16, shutter: 0, tone: 'neutral', exposure: 1, bloom: 0, vignette: 0, grain: 0, fov: 24, background: '#000000' },

    build(S) {
      const { THREE, K, scene, camera, W, H } = S;
      const fin = ditherFinish(S, { ink: INK, paper: PAPER, cell: CELL, lo: 0.05, hi: 0.66, gamma: 1.0 });
      const grey = (v, rough = 0.85, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(v, v, v), roughness: rough }, extra));
      const add = (geo, mat, parent = scene, p = [0, 0, 0], r = [0, 0, 0]) => { const m = new THREE.Mesh(geo, mat); m.position.set(...p); m.rotation.set(...r); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };

      // ---- light. A low sun through a window that is out of shot: the window is a real card with a hole in it, far
      // up the light's path, so its edges fall across desk and wall as soft diagonals while near shadows stay crisp.
      // Tones are judged after the dither, so set powers by looking at stills, not by numbers.
      // The sun also creeps while the dial runs (the dial is a time-lapse, so the light is too): shadows swing and
      // lengthen a little over each round, which only a real light can do.
      K.env(S, { top: '#1c1c1c', horizon: '#242424', bottom: '#f0f0f0', intensity: 0.42 });   // bright "bottom" = light bouncing up off the desk
      const sun = K.sun(S, { pos: [-21, 19, 19], target: [0, 0, 0], power: 5.2, size: 11, soft: 0.25, mapSize: 4096, far: 90 });
      K.spot(S, { pos: [5.5, 1.3, -3.2], target: [0, 0.9, 0], power: 260, angle: 0.3, penumbra: 1, shadow: false });   // back light: a bright edge on the shadow side
      // The window is a card with two openings, square to the sun and 26 units up its path. u runs sideways and v up
      // in the card, so a desk or wall point lands in it at (dot(p, u), dot(p, v)): that is how the openings were placed.
      const card = new THREE.Shape(); card.moveTo(-40, -40); card.lineTo(40, -40); card.lineTo(40, 40); card.lineTo(-40, 40);
      for (const [u0, v0, u1, v1] of [[-3.9, -9, 9, 4.1], [-3.9, 4.6, 9, 6.6]]) { const h = new THREE.Path(); h.moveTo(u0, v0); h.lineTo(u0, v1); h.lineTo(u1, v1); h.lineTo(u1, v0); card.holes.push(h); }
      const win = new THREE.Mesh(new THREE.ShapeGeometry(card), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })); win.castShadow = true; scene.add(win);
      const sunDir = new THREE.Vector3(), su = new THREE.Vector3(), sv = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), basis = new THREE.Matrix4();
      const setSun = (minutes) => {
        const az = (-48 + minutes * 0.2) * Math.PI / 180, el = (33.5 - minutes * 0.09) * Math.PI / 180;
        sunDir.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
        su.crossVectors(UP, sunDir).normalize(); sv.crossVectors(sunDir, su);
        sun.position.copy(sunDir).multiplyScalar(34); win.position.copy(sunDir).multiplyScalar(26); win.quaternion.setFromRotationMatrix(basis.makeBasis(su, sv, sunDir));
      };

      // ---- the set: a pale desk and a darker wall
      add(new THREE.PlaneGeometry(60, 30), grey(0.5), scene, [0, 0, 0], [-Math.PI / 2, 0, 0]);
      add(new THREE.PlaneGeometry(60, 30), grey(0.3), scene, [0, 6, -5]);

      // ---- the tomato timer. The red top carries the white minute band and turns; the base and its pointer stay.
      const R = 1, B = 0.85, BAND = 0.21, A = Math.acos(BAND / B), CY = 0.72;
      const timer = new THREE.Group(); timer.rotation.y = 0.08; scene.add(timer);
      const top = new THREE.Group(); timer.add(top);
      const red = grey(0.1, 0.3), leaf = grey(0.75, 0.6, { side: THREE.DoubleSide });
      add(shell(THREE, K, { R, B, a0: 0, a1: A, lobes: 6, amp: 0.07, fade: (a) => K.smooth(A, A * 0.45, a), dimple: 0.1 }), red, top);
      const bandTex = K.canvasTex(4096, 320, (ctx, w, h) => {
        ctx.fillStyle = '#f2f2f2'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#0c0c0c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (let m = 0; m <= 60; m++) {
          const x = m / 60 * w;
          ctx.fillRect(x - 11, 0, 22, h * (m % 5 ? 0.14 : 0.2)); if (m % 5 === 0) { ctx.font = '400 226px "Archivo Black"'; ctx.fillText(String(m % 60), x, h * 0.6); }
        }
      });
      bandTex.wrapS = THREE.RepeatWrapping;
      add(new THREE.CylinderGeometry(R * 0.98, R * 0.98, BAND * 2, 144, 1, true), new THREE.MeshStandardMaterial({ map: bandTex, roughness: 0.6 }), top);
      const petal = new THREE.Shape(); petal.moveTo(0, -0.13); petal.quadraticCurveTo(0.36, -0.2, 0.74, 0); petal.quadraticCurveTo(0.36, 0.2, 0, 0.13);
      for (let i = 0; i < 6; i++) {
        const g = new THREE.ShapeGeometry(petal, 10); g.rotateX(-Math.PI / 2);
        const p = g.attributes.position; for (let k = 0; k < p.count; k++) { const x = p.getX(k); p.setY(k, 0.06 - 0.62 * x * x + 0.62 * x * x * x); }
        g.computeVertexNormals(); add(g, leaf, top, [0, B - 0.1, 0], [0, i * Math.PI / 3 + 0.3, 0]);
      }
      add(new THREE.CylinderGeometry(0.045, 0.075, 0.34, 8), leaf, top, [0.02, B + 0.08, 0], [0.12, 0, -0.2]);
      add(shell(THREE, K, { R, B, a0: Math.PI - A, a1: Math.PI - Math.acos(CY / B), lobes: 6, amp: 0.05, fade: (a) => K.smooth(Math.PI - A, Math.PI - A + 0.4, a) }), red, timer);
      const tri = new THREE.Shape(); tri.moveTo(-0.15, 0); tri.lineTo(0.15, 0); tri.lineTo(0, 0.24);
      add(new THREE.ExtrudeGeometry(tri, { depth: 0.06, bevelEnabled: false }), grey(0.9, 0.5), timer, [0, -BAND - 0.25, R - 0.045], [-0.2, 0, 0]);

      // ---- work: a pad that fills with lines while the timer runs, and the pencil that writes them. Each round gets
      // a fresh page: the written sheet slides off the pad when the timer is wound again.
      const PAD = [-1.85, 0, 0.8], LINES = 4, LINE_W = 1.2, lineZ = (i) => -0.48 + i * 0.32;
      const pad = new THREE.Group(); pad.position.set(...PAD); pad.rotation.y = 0.22; scene.add(pad);
      add(K.roundedBox(1.66, 0.06, 1.56, 0.025, 2), grey(0.05), pad, [0, 0.03, 0]);
      add(K.roundedBox(1.52, 0.1, 1.44, 0.03, 2), grey(0.86), pad, [0, 0.1, 0]);
      const sheet = new THREE.Group(); pad.add(sheet);
      add(new THREE.BoxGeometry(1.52, 0.008, 1.44), grey(0.86), sheet, [0, 0.154, 0]);
      const lineGeo = new THREE.BoxGeometry(1, 0.01, 0.15); lineGeo.translate(0.5, 0, 0);
      const works = PHASES.filter((p) => p.type === 'count' && p.kind === 'work');
      const pages = works.map((p, n) => { const m = new THREE.InstancedMesh(lineGeo, grey(0.02), LINES); m.frustumCulled = false; (n ? pad : sheet).add(m); return m; });
      const pencil = new THREE.Group(); pad.add(pencil);
      add(new THREE.CylinderGeometry(0.06, 0.06, 1.05, 6), grey(0.3, 0.35), pencil, [0, 0.7, 0]);
      add(new THREE.ConeGeometry(0.06, 0.18, 6), grey(0.8), pencil, [0, 0.09, 0], [Math.PI, 0, 0]);
      add(new THREE.CylinderGeometry(0.063, 0.063, 0.12, 12), grey(0.03), pencil, [0, 1.28, 0]);
      const lineLen = (i) => LINE_W * (i === LINES - 1 ? 0.55 : 1);

      // ---- rest: a cup
      const CUP = [2.0, 0, 0.85];
      const cup = new THREE.Group(); cup.position.set(...CUP); scene.add(cup);
      const prof = (pts) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 48);
      add(prof([[0, 0.02], [0.5, 0.02], [0.82, 0.1], [0.84, 0.13], [0.5, 0.07], [0, 0.07]]), grey(0.8, 0.5), cup);
      add(prof([[0, 0.07], [0.3, 0.07], [0.36, 0.12], [0.5, 0.62], [0.53, 0.86], [0.49, 0.86], [0.46, 0.62], [0.3, 0.16], [0, 0.16]]), grey(0.8, 0.5, { side: THREE.DoubleSide }), cup);
      add(new THREE.CircleGeometry(0.48, 40), grey(0.03, 0.25), cup, [0, 0.74, 0], [-Math.PI / 2, 0, 0]);
      add(new THREE.TorusGeometry(0.2, 0.05, 10, 24, Math.PI * 1.1), grey(0.8, 0.5), cup, [0.47, 0.5, 0.12], [0, -0.3, -Math.PI * 0.55]);

      // ---- camera: the heading never changes, only the position, so the subject translates without turning
      const HEAD = [0, -2.3, -7.9];
      const camPos = K.track([[0, [-0.4, 2.76, 7.5]], [8, [0.05, 2.92, 8.15], (u) => u * u * (3 - 2 * u)]]);

      return {
        update(t) {
          const s = timerAt(t);
          top.rotation.y = -s.min * Math.PI / 30;
          // the bell: the whole timer rattles on the desk, hard at first, then dying away
          const rg = s.ring >= 0 ? Math.exp(-s.ring * 5) : 0;
          timer.rotation.z = 0.05 * rg * Math.sin(s.ring * 150); timer.position.set(0.03 * rg * Math.sin(s.ring * 131), CY + 0.05 * rg * Math.abs(Math.sin(s.ring * 75)), 0);
          setSun(s.unit);

          // the pad: one line every WORK / LINES minutes; the pencil rides the end of the line and lies down in between
          let tip = [0, 0], up = t < START ? 1 : 0;
          works.forEach((p, n) => {
            const w = K.clamp((t - p.t0) / (p.t1 - p.t0)) * LINES, cur = Math.min(LINES - 1, Math.floor(w));
            for (let i = 0; i < LINES; i++) K.place(pages[n], i, [-LINE_W / 2, n ? 0.156 : 0.164, lineZ(i)], null, [Math.max(1e-4, lineLen(i) * K.clamp(w - i)), 1, 1]);
            pages[n].instanceMatrix.needsUpdate = true;
            if (t >= p.t0 - 0.3) { tip = [-LINE_W / 2 + lineLen(cur) * K.clamp(w - cur), lineZ(cur)]; up = Math.max(up, K.seg(t, p.t0 - 0.3, p.t0, K.ease.out) * (1 - K.seg(t, p.t1, p.t1 + 0.3, K.ease.inOut))); }
          });
          const writing = s.type === 'count' && s.kind === 'work';
          pencil.position.set(K.lerp(1.12, tip[0], up) + (writing ? 0.02 * Math.sin(t * 61) : 0), K.lerp(0.06, 0.165, up), K.lerp(0.75, tip[1], up) + (writing ? 0.04 * Math.sin(t * 47) : 0));
          pencil.rotation.set(K.lerp(-Math.PI / 2, 0.45, up), 0, K.lerp(0.15, -0.5, up));
          sheet.position.x = -3.2 * K.seg(t, AGAIN, AGAIN + 0.4, K.ease.in);

          const p = camPos(t);
          K.look(camera, p, [p[0] + HEAD[0], p[1] + HEAD[1], p[2] + HEAD[2]]);
          fin.frame(t, [0, CY, 0]);
        },
        overlay(ctx, t) {
          const s = timerAt(t), u = pixelKit(ctx, CELL, INK, PAPER);
          // drawings that belong to the scene sit on the travelling grid: ink with a paper edge reads on any tone
          const marks = [], block = (x, y, n = 2) => marks.push([...fin.snap(x, y), n]);
          const stroke = (x0, y0, x1, y1, w) => { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / CELL)); for (let i = 0; i <= n; i++) block(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, w); };
          const c0 = fin.project([0, CY + 0.15, 0]), unit = fin.project([1, CY + 0.15, 0])[0] - c0[0];
          if (s.ring >= 0 && s.ring < 0.5) {         // the bell stays local: fat rays that flicker around the top of the timer
            const set = Math.floor(s.ring * 15) % 2, len = 0.5 * Math.exp(-s.ring * 2.5);
            for (let i = set; i < 8; i += 2) { const a = (12 + i * 22.3) * Math.PI / 180, r0 = 1.3 + 0.07 * set, r1 = r0 + len; stroke(c0[0] + Math.cos(a) * r0 * unit, c0[1] - Math.sin(a) * r0 * unit * 0.95, c0[0] + Math.cos(a) * r1 * unit, c0[1] - Math.sin(a) * r1 * unit * 0.95, 3); }
          }
          const steam = K.seg(t, BELL + 0.1, BELL + 0.6) * (1 - K.seg(t, AGAIN, AGAIN + 0.35));
          if (steam > 0) {                           // rest: three strands of steam wander up out of the cup
            const m = fin.project([CUP[0], 0.9, CUP[2]]);
            for (let k = 0; k < 3; k++) for (let j = 0, n = Math.round(steam * [17, 24, 15][k]); j < n; j++) {
              if ((j - Math.floor(t * 9) + k * 4 + 800) % 12 > 8) continue;
              block(m[0] + ((k - 1) * 7 + Math.round(2.2 * Math.sin(j * 0.36 - t * 3.5 + k * 2.1) * Math.min(1, j / 5))) * CELL, m[1] - (j + 1) * CELL);
            }
          }
          ctx.fillStyle = PAPER; for (const [x, y, n] of marks) ctx.fillRect(x - CELL, y - CELL, (n + 2) * CELL, (n + 2) * CELL);
          ctx.fillStyle = INK; for (const [x, y, n] of marks) ctx.fillRect(x, y, n * CELL, n * CELL);
          // readout window
          const shown = Math.min(s.min, s.to || 99), mm = Math.floor(shown + 1e-6), ss = Math.floor((shown - mm) * 60 + 1e-6);
          const plate = s.ring >= 0 && s.ring < 0.4 && Math.floor(s.ring / 0.1) % 2 === 0;   // ...and the WORK / REST plate flips twice
          const work = (s.kind === 'work') !== plate;                                       // work = ink plate, rest = checker plate
          const jx = 10 + (s.ring >= 0 && s.ring < 0.3 ? Math.round(2 * Math.exp(-s.ring * 8) * Math.sin(s.ring * 95)) : 0);   // the window jumps with the bell
          u.win(jx, 10, 104, 76, WORDS.title);
          u.rect(jx + 7, 27, 90, 22, work); if (!work) { u.grey(jx + 7, 27, 90, 22); u.box(jx + 7, 27, 90, 22); u.rect(jx + 21, 29, 62, 18, false); }
          u.text(WORDS[s.kind], jx + 52, 29, !work, 2, 'center');
          u.text(String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0'), jx + 52, 54, true, 3, 'center');
          // cycle strip: two rounds drawn to scale, 5 picture pixels per minute, filling as the timer runs
          const X = 16, Y = 180, PX = 5, round = WORK + REST;
          u.win(X - 6, Y - 4, 364, 32);
          for (let r = 0, x = X; r < 2; r++) for (const [kind, len] of [['work', WORK], ['rest', REST]]) {
            const w = len * PX, done = Math.round(K.clamp((s.unit - (r * round + (kind === 'rest' ? WORK : 0))) / len) * w);
            u.box(x, Y + 11, w + 1, 13);
            if (kind === 'work') u.rect(x + 1, Y + 12, done, 11, true); else u.grey(x + 1, Y + 12, done, 11);
            u.text(WORDS[kind], x + Math.round(w / 2), Y, true, 1, 'center');
            // the number inside the bar is cut in two by the fill: paper on ink where filled, ink on paper where not
            const label = (c) => u.text(String(len), x + Math.round(w / 2), Y + 13, c, 1, 'center');
            if (kind === 'work') { ctx.save(); ctx.beginPath(); ctx.rect((x + 1) * CELL, 0, done * CELL, H); ctx.clip(); label(false); ctx.restore(); }
            ctx.save(); ctx.beginPath(); ctx.rect((x + 1 + (kind === 'work' ? done : 0)) * CELL, 0, W, H); ctx.clip(); if (kind === 'rest') u.rect(x + 8, Y + 12, 10, 11, false); label(true); ctx.restore();
            x += w;
          }
          const again = t >= AGAIN && (t - AGAIN > 0.4 || Math.floor((t - AGAIN) / 0.1) % 2 === 0);   // blinks twice, then stays lit
          u.rect(X + 306, Y + 11, 46, 13, again); u.box(X + 306, Y + 11, 46, 13); u.text(WORDS.again, X + 329, Y + 13, !again, 1, 'center'); u.text('@', X + 330, Y, true, 1, 'center');
        },
      };
    },

    sound(k) {
      k.bed('room', 0, 8, { gain: 0.9 });
      for (const p of PHASES) {
        if (p.type === 'count') {
          // the escapement: one tick per minute on the dial, a heavier one when a numeral passes the pointer
          k.withMinor(() => { for (let m = 1; m <= p.from; m++) { const t = p.t0 + m / RATE; if (t < 7.95) k.play(m % 5 ? 'tick' : 'tock', t, { gain: m % 5 ? 0.5 : 0.55, f: m % 5 ? (m % 2 ? 3300 : 4100) : 1250, pan: -0.05 }); } });
          if (p.kind === 'work') for (let i = 0; i < 4; i++) { const t = p.t0 + i * (p.t1 - p.t0) / 4; if (t < 7.6) k.play('stroke', t + 0.03, { material: 'pencil', dur: Math.min((p.t1 - p.t0) / 4 - 0.1, 7.9 - t), gain: 0.5, pan: -0.5, minor: true }); }
          else k.bed('hiss', p.t0 - 0.3, p.t1 + 0.3, { gain: 1.4 });
        } else if (p.type === 'ring') {
          // a clockwork bell: a small hammer hitting a steel dome 26 times a second
          for (let x = 0; x < p.t1 - p.t0 - 0.06; x += 1 / 26) { const g = Math.exp(-x * 2.2); k.tone(p.t0 + x, { f: 2480, dur: 0.16, gain: 0.11 * g, verb: 0.25 }); k.tone(p.t0 + x, { f: 4135, dur: 0.07, gain: 0.05 * g }); k.noise(p.t0 + x, { dur: 0.008, filter: 'highpass', f: 5000, gain: 0.1 * g }); }
          k.play('blip', p.t0, { f: 'A5', dur: 0.09, gain: 0.9 });
          k.play('thud', p.t0, { gain: 0.35 });
        } else {
          // winding: the ratchet clicks once per minute wound, so 25 minutes is a long zip and 5 a short one
          k.withMinor(() => { for (let m = 1, u = 0; m <= p.to; m++) { while (WIND(u) < m / p.to && u < 1) u += 0.01; k.play('click', p.t0 + u * (p.t1 - p.t0), { gain: 0.75, f: 1500 + m * 28 }); } });
          k.play('select', p.t0, { gain: 0.8 });
          if (p.kind === 'work') { k.play('paper', p.t0 + 0.02, { dur: 0.35, gain: 0.8, pan: -0.5 }); k.play('blip', p.t1, { f: 'E6', dur: 0.1, gain: 0.8 }); }
        }
      }
      k.play('tock', PHASES[0].t1 + 0.28, { gain: 0.4, f: 420, pan: -0.4 });   // the pencil is put down
    },
  });
}
```
