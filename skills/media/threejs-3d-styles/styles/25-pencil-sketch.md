# Pencil Sketch (#25)

- **id:** `pencil-sketch`
- **Category:** Filters over 3D
- **Use:** explainer
- **Reference duration:** 8 s
- **Google Fonts:** none
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`, `lib/strokefont.js`

## Style card

- **Look:** A real 3D scene that reads as a graphite drawing in a designer's sketchbook: forms shaded with hatching and cross-hatching that follows the light, outlines that overshoot their corners, faint construction lines, hand lettering, toothy paper with a smudge and an eraser mark, and one red accent.
- **Motion:** The drawing makes itself: setting-out lines first, then outlines stroke by stroke, then shading laid across each form in one direction and crossed in a second. Hatching is fixed to the objects and turns with them; only the line wobble boils a little, on held frames. Notes are lettered on and their leader lines follow the parts as the view turns.
- **Light:** One sun from the upper left and flat fill. The light is never shown directly: it only decides how many layers of hatching a face or a cast shadow gets, so lit faces stay as bare paper and shade is cross-hatched.
- **Materials:** Graphite on cream cartridge paper. Soft dark pencil for outlines and lettering, lighter pencil for hatching and construction lines, a red pencil for numbers and marks, and one wash of red marker on the part that matters.
- **Camera:** One slow, continuous arc round the subject on a long lens, about 35 degrees from nearly front-on to a three-quarter view, rising and pulling back a little as the drawing grows. Everything is sharp, like a drawing. The subject sits left of centre so the notes have a clear column of paper.
- **Finish:** No motion blur, bloom, grain or vignette. One paper pass: tooth that breaks up light lines, a hand smudge that drags graphite, an eraser mark, slight mottling and darker page edges.
- **Good for:** How something is built or put together, step by step: parts are drawn in order, each with a numbered note. Also good for anatomy of an object, plans, exploded views and anything that benefits from seeing the structure through the surface.

## Reference

- **Sample topic:** How a house goes up: foundation, frame, walls, roof
- **Gallery description:** A real 3D scene that reads as a graphite drawing in a designer's sketchbook: forms shaded with hatching and cross-hatching that follows the light, outlines that overshoot their corners, faint construction lines, hand lettering, toothy paper with a smudge and an eraser mark, and one red accent.
- **Shown in the sample clip:** How a house goes up: foundation, frame, walls, roof

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/pencil-sketch.js`)

```js
{
  // ---------------------------------------------------------------- content (change this for a new topic)
  const TITLE = 'HOW A HOUSE GOES UP';
  const STAGES = [                       // one stage = one part of the drawing plus its note. `at` = when the pencil starts on it
    { label: 'FOUNDATION', at: -1.6 },   // already drawn on frame one: the clip opens on its note being lettered
    { label: 'FRAME', at: 1.35 },
    { label: 'WALLS', at: 3.25 },
    { label: 'ROOF', at: 5.1 },
  ];
  const DIMENSION = '8500';              // millimetres, the way a builder's drawing gives them, along the front of the slab
  const DURATION = 8;
  const PAPER = '#f2ede0', GRAPHITE = '#33343a', ACCENT = '#cf472b', WASH = '#e8967a';   // one accent: a red pencil, and the same red as a marker wash

  // one schedule for picture and sound, worked out from the four stage times above
  function plan() {
    const [s1, s2, s3, s4] = STAGES.map((s) => s.at);
    return {
      slab: { at: s1, fillAt: s1 + 0.6, fill: 0.75 }, dim: s1 + 2.2,
      plates: s2, studs: s2 + 0.22, studGap: 0.033, topPlate: s2 + 1.1,
      walls: { at: s3, fillAt: s3 + 0.5, fill: 0.85, side: 0.18, details: s3 + 1.0 },
      rafters: s4, roof: { at: s4 + 0.3, fillAt: s4 + 0.75, fill: 0.6, washAt: s4 + 0.7, wash: 0.75 }, chimney: s4 + 0.95,
      notes: [s1 + 1.2, s2 + 0.95, s3 + 0.95, s4 + 1.05],     // when each note is lettered
      smoke: s4 + 1.75,                                       // the last mark: someone has moved in
    };
  }

  // ================================================================ THE PENCIL KIT (reusable on any subject)
  // Three pieces, all driven by one clock (uTime), so nothing accumulates and any frame can be rendered alone:
  //   solid(geometry, opts)   a form shaded with hatching that is picked by the real light and shadow falling on it,
  //                           laid in by a moving "hand", with its edges drawn as pencil strokes
  //   strokes(list, opts)     free pencil lines in 3D with a constant width on screen: they wobble, overshoot, taper,
  //                           draw themselves on, and show faintly through whatever hides them (construction lines)
  //   write(text, opts)       single-stroke lettering made of the same strokes, written on letter by letter
  // The paper (tooth, smudge, eraser mark) is one full-screen filter at the end: see PAPER_FILTER.
  // For a new subject: build it from any geometry with solid(), give each part an `at` time, add loose lines with
  // strokes([line(a, b, {...}), ...]) and words with write(). Curved forms shade well but only get outlines at creases.
  const NOISE = `
    float h11(float n){ return fract(sin(n * 127.1) * 43758.5453); }
    float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float n1(float x){ float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h11(i), h11(i + 1.0), f); }
    float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }`;

  function pencilKit(S, o = {}) {
    const { THREE, K, scene } = S, lin = (hex) => new THREE.Color(hex);
    const TEXELS = 165;                  // hatch texels per world unit: about one texel per pixel at the usual distance
    let seedN = 0;
    const nextSeed = () => K.hash(++seedN, 3.1) * 97 + 1;

    // ---- the hatch sheet: real strokes with a firm start and a lifted end, rasterised once into a tiling texture.
    // R, G and B hold three sets of strokes that interleave (R: one row in four, G: the rows between, B: the rows between those), so
    // adding channels makes the hatching denser without any stroke moving: that is what keeps tone changes calm.
    const N = 2048, PITCH = N / 96;
    const hatch = K.canvasTex(N, N, (ctx) => {
      const r = K.rng(7);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, N, N); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      const stroke = (x, y, len, chan) => {
        const tilt = r.gauss() * 0.03, bow = r.range(-3, 3), wd = r.range(2.3, 3.5), press = r.range(0.55, 0.95), n = 10;
        const P = (u) => [x + u * len, y + u * len * tilt + bow * Math.sin(u * Math.PI)];
        for (let dx = -N; dx <= N; dx += N) for (let dy = -N; dy <= N; dy += N) {                     // copies across the seams, so it tiles
          if (x + dx > N + 50 || x + len + dx < -50 || y + dy > N + 50 || y + dy < -50) continue;
          for (let i = 0; i < n; i++) {
            const u = i / n, p0 = P(u), p1 = P(u + 1 / n);
            const pr = press * (0.6 + 0.4 * K.smooth(0, 0.12, u)) * (1 - 0.6 * K.smooth(0.55, 1, u));  // press, then flick away
            const v = Math.round(255 * pr);
            ctx.strokeStyle = `rgb(${chan === 0 ? v : 0},${chan === 1 ? v : 0},${chan === 2 ? v : 0})`;
            ctx.lineWidth = wd * (1 - 0.45 * K.smooth(0.6, 1, u));
            ctx.beginPath(); ctx.moveTo(p0[0] + dx, p0[1] + dy); ctx.lineTo(p1[0] + dx, p1[1] + dy); ctx.stroke();
          }
        }
      };
      const rows = (chan, phase) => { for (let k = 0; k < N / PITCH; k++) for (let x = -r.range(0, 200); x < N;) { const len = r.range(100, 300); stroke(x, (k + phase) * PITCH + r.range(-2.5, 2.5), len, chan); x += len + r.range(-24, 30); } };
      rows(0, 0); rows(1, 0.5); rows(2, 0.25); rows(2, 0.75);
    }, { data: true, repeat: [1, 1] });

    const U = {                          // shared by every material of the kit
      uTime: { value: 0 }, uBoil: { value: 0 }, uRes: { value: new THREE.Vector2(S.W, S.H) }, uHatch: { value: hatch }, uDens: { value: TEXELS / N },
      uPaper: { value: lin(o.paper || '#f2ede0') }, uGraphite: { value: lin(o.graphite || '#33343a') }, uAccent: { value: lin(o.accent || '#cf472b') },
    };

    // ---- hatch shading. A normal lit material (so real light and cast shadows work), but instead of showing the light
    // it turns it into tone, and tone into layers of strokes: one set, then the set between, then a second direction
    // across the first, and so on. Strokes are laid out flat on each face in OBJECT space, so they belong to the object
    // and turn with it. Each face gets its own direction, which is what makes a box read as a box.
    // o: angle (stroke direction on the face, radians from level), fan (how much the direction changes from face to
    // face), gain / lift (tone = light * gain + lift; gain 0 gives a fixed tone), ink (pencil colour), wash + washAt +
    // washDur (a marker wash under the pencil), fillAt + fillDur (when the hand shades it in), wipe (direction it works in).
    function hatchMaterial(geo, p = {}) {
      const m = new THREE.MeshLambertMaterial({ color: '#ffffff', polygonOffset: true, polygonOffsetFactor: 1.5, polygonOffsetUnits: 2 });
      geo.computeBoundingBox();
      const dir = new THREE.Vector3(...(p.wipe || [1, 0.7, -0.6])).normalize(), bb = geo.boundingBox, v = new THREE.Vector3(); let lo = Infinity, hi = -Infinity;
      for (let i = 0; i < 8; i++) { const d = v.set(i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z).dot(dir); lo = Math.min(lo, d); hi = Math.max(hi, d); }
      const k = 1 / Math.max(1e-4, hi - lo);
      const u = {
        uTime: U.uTime, uHatch: U.uHatch, uDens: U.uDens, uPaper: U.uPaper,
        uT: { value: new THREE.Vector2(p.fillAt == null ? -99 : p.fillAt, p.fillDur || 0.6) },
        uWipe: { value: new THREE.Vector4(dir.x * k, dir.y * k, dir.z * k, -lo * k) },
        uHatchP: { value: new THREE.Vector4(p.angle == null ? 0.95 : p.angle, p.gain == null ? 1 : p.gain, p.lift || 0, p.fan == null ? -0.4 : p.fan) },
        uInk: { value: p.ink ? lin(p.ink) : U.uGraphite.value }, uWash: { value: lin(p.wash || '#ffffff') },
        uWashT: { value: new THREE.Vector3(p.washAt == null ? -99 : p.washAt, p.washDur || 0.6, p.wash ? 1 : 0) },
      };
      m.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, u);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vObjP, vObjN;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObjP = transformed; vObjN = objectNormal;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
          uniform sampler2D uHatch; uniform float uTime, uDens; uniform vec3 uPaper, uInk, uWash, uWashT; uniform vec2 uT; uniform vec4 uHatchP, uWipe;
          varying vec3 vObjP, vObjN;
          ${NOISE}
          vec2 turn(vec2 p, float a){ float c = cos(a), s = sin(a); return vec2(c * p.x + s * p.y, -s * p.x + c * p.y); }
          // has the hand reached this point yet? s = how far across the object it is, h = coordinates along / across the strokes
          float laid(float prog, float s, vec2 h, vec2 rag){ return step(s * 0.8 + n2(h * rag) * 0.2, prog * 1.001 - 0.0005); }`)
          .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
          vec3 oN = normalize(vObjN);
          vec3 tU = abs(oN.y) > 0.92 ? vec3(1.0, 0.0, 0.0) : normalize(cross(vec3(0.0, 1.0, 0.0), oN));   // level direction on the face
          vec2 hc = vec2(dot(vObjP, tU), dot(vObjP, cross(oN, tU)));                                      // flat coordinates on the face
          float hAng = uHatchP.x + uHatchP.w * (oN.x * 0.9 + oN.y * 0.45);
          vec2 hA = turn(hc, hAng), hB = turn(hc, hAng - 1.2);                                            // first direction, and the one across it
          hA.y += (n2(hc * 0.55 + 1.3) - 0.5) * 0.22; hB.y += (n2(hc * 0.55 + 7.7) - 0.5) * 0.22;         // a wrist draws shallow arcs, not ruled lines
          float sW = dot(vObjP, uWipe.xyz) + uWipe.w, pW = (uTime - uT.x) / uT.y;
          if (laid(clamp(pW * 1.6, 0.0, 1.0), sW, hA, vec2(0.8, 7.0)) < 0.5) discard;                    // not drawn yet: the paper is still empty here`)
          .replace('#include <opaque_fragment>', `
          float tone = dot(outgoingLight, vec3(0.3333)) * uHatchP.y + uHatchP.z;
          float dk = clamp(1.0 - tone, 0.0, 1.0);
          dk += (n2(hc * 1.6 + 3.7) - 0.5) * 0.16 * smoothstep(0.03, 0.2, dk);                            // an uneven hand: layers come in patchy
          vec3 sA = texture2D(uHatch, hA * uDens + 0.37).rgb, sB = texture2D(uHatch, hB * uDens * 1.07 + 0.11).rgb;
          float lB = laid(clamp((pW - 0.4) / 0.6, 0.0, 1.0), sW, hB, vec2(0.8, 7.0));                    // the second direction goes on in a second pass
          float ink = 1.0 - (1.0 - sA.r * smoothstep(0.10, 0.24, dk)) * (1.0 - sA.g * smoothstep(0.30, 0.42, dk))
            * (1.0 - sB.r * smoothstep(0.46, 0.58, dk) * lB) * (1.0 - sB.g * smoothstep(0.62, 0.72, dk) * lB)
            * (1.0 - sA.b * smoothstep(0.76, 0.86, dk)) * (1.0 - sB.b * smoothstep(0.88, 0.96, dk) * lB);
          ink *= 0.6 + 0.4 * smoothstep(0.15, 0.8, dk);                                                   // light tones are drawn with a light hand
          vec3 col = uPaper;
          // marker wash: broad bands, each one a single pull of the pen along its length, one band after another
          vec2 hM = turn(hc, hAng + 0.35); float band = hM.y / 0.46, across = fract(band) - 0.5;
          vec2 gS = vec2(dFdx(sW), dFdy(sW)), gB = vec2(dFdx(band), dFdy(band));
          float sBand = sW - across * dot(gS, gB) / max(dot(gB, gB), 1e-9) + (h11(floor(band)) - 0.5) * 0.07;   // how far across the object this band's middle is
          float wash = step(sBand * 0.9 + 0.05, clamp((uTime - uWashT.x) / uWashT.y, 0.0, 1.0) * 1.001 - 0.0005) * uWashT.z;
          wash *= 0.78 + 0.14 * n2(vec2(hM.x * 0.5, hM.y * 6.0)) + 0.16 * smoothstep(0.38, 0.5, abs(across));     // streaky, and darker where two bands overlap
          col = mix(col, uWash, clamp(wash, 0.0, 1.0) * 0.9);
          col = mix(col, uInk, ink * 0.9);
          gl_FragColor = vec4(col, 1.0);`);
      };
      // the shadow appears with the shading: the same wipe, for the shadow pass
      const depth = new THREE.MeshDepthMaterial();
      depth.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, { uTime: u.uTime, uT: u.uT, uWipe: u.uWipe });
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vObjP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvObjP = transformed;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uTime; uniform vec2 uT; uniform vec4 uWipe; varying vec3 vObjP;')
          .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nif ((dot(vObjP, uWipe.xyz) + uWipe.w) * 0.8 + 0.1 > clamp((uTime - uT.x) / uT.y * 1.6, 0.0, 1.0)) discard;');
      };
      m.userData.depth = depth;
      return m;
    }

    // ---- pencil lines. Every line is one instance of a thin strip between two points in 3D. The vertex shader works
    // on screen: it gives the strip a width in pixels, a slow wobble and a slight bow, and "boils" a little of that
    // wobble on held frames. The fragment shader does pressure, the tapered flick at the end, dashes and the draw-on.
    const STRIP = 10, sp = [], si = [];
    for (let i = 0; i <= STRIP; i++) { sp.push(i / STRIP, -1, 0, i / STRIP, 1, 0); if (i < STRIP) { const k = i * 2; si.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
    const STROKE_VS = `
      attribute vec4 iA, iB, iT, iS;      // iA = start + looseness, iB = end, iT = (start time, duration, seed, width px), iS = (darkness, accent, wobble px, dash px)
      uniform float uTime, uBoil; uniform vec2 uRes;
      varying vec4 vL, vS; varying vec4 vK;
      ${NOISE}
      void main(){
        vec4 a = modelViewMatrix * vec4(iA.xyz, 1.0), b = modelViewMatrix * vec4(iB.xyz, 1.0);
        if (a.z > -0.3 && b.z > -0.3) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }               // behind the camera
        if (a.z > -0.3) a = mix(b, a, (-0.3 - b.z) / (a.z - b.z)); else if (b.z > -0.3) b = mix(a, b, (-0.3 - a.z) / (b.z - a.z));
        a.xyz *= 0.997; b.xyz *= 0.997;                                                                  // a hair toward the eye, so a line on a surface is not swallowed by it
        vec4 ca = projectionMatrix * a, cb = projectionMatrix * b, c = mix(ca, cb, position.x);
        vec2 sa = ca.xy / ca.w * uRes * 0.5, sb = cb.xy / cb.w * uRes * 0.5, d = sb - sa;
        float len = max(length(d), 1e-3); vec2 dir = d / len, nrm = vec2(-dir.y, dir.x);
        float along = dot(c.xy / c.w * uRes * 0.5 - sa, dir), seed = iT.z, hw = iT.w * 0.5 + 1.5;
        float wob = (n1(seed * 31.7 + along / 90.0) - 0.5) * 2.0 + sin(position.x * 3.14159) * (h11(seed * 3.3) - 0.5) * 1.8;
        wob += (n1(seed * 17.3 + along / 60.0 + uBoil * 7.1) - 0.5) * 0.7;                               // the boil: a little of the wobble is redrawn on every hold
        c.xy += nrm * (position.y * hw + wob * iS.z) / (uRes * 0.5) * c.w;
        gl_Position = c;
        vL = vec4(position.x, position.y * hw, along, len); vS = iS;
        vK = vec4(seed, iT.w * 0.5, iA.w, clamp((uTime - iT.x) / max(iT.y, 1e-3), 0.0, 1.0));
      }`;
    const STROKE_FS = `
      uniform vec3 uGraphite, uAccent; uniform float uOpacity;
      varying vec4 vL, vS; varying vec4 vK;
      ${NOISE}
      void main(){
        float prog = 1.0 - (1.0 - vK.w) * (1.0 - vK.w);                                                  // the hand starts fast and slows into the end of a line
        if (vL.x > prog) discard;
        float seed = vK.x, loose = vK.z;
        float a = 1.0 - smoothstep(vK.y - 0.9, vK.y + 0.9, abs(vL.y));
        a *= mix(1.0, 0.58 + 0.42 * n1(seed * 13.1 + vL.z / 36.0), loose);                               // pressure changes along a line
        a *= mix(1.0, smoothstep(-1.0, 4.0, vL.z) * (0.3 + 0.7 * smoothstep(0.0, 34.0, vL.w - vL.z)), loose);   // firm start, light flick at the end
        if (vS.w > 0.0) a *= step(fract(vL.z / vS.w + seed), 0.6);
        gl_FragColor = vec4(mix(uGraphite, uAccent, vS.y), a * vS.x * uOpacity);
      }`;
    const strokeMaterial = (opacity, extra) => new THREE.ShaderMaterial(Object.assign({
      vertexShader: STROKE_VS, fragmentShader: STROKE_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uTime: U.uTime, uBoil: U.uBoil, uRes: U.uRes, uGraphite: U.uGraphite, uAccent: U.uAccent, uOpacity: { value: opacity } },
    }, extra));

    // one line. o: at, dur (draw-on), w (px), ink (0..1), accent, wobble (px), dash (px, 0 = solid), loose (1 = sketch
    // line with pressure and taper, 0 = an even line for lettering), over ([start, end] overshoot in world units)
    function line(a, b, p = {}) {
      const ov = p.over || [0, 0], d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], len = Math.hypot(...d) || 1, n = d.map((x) => x / len);
      return { a: a.map((x, i) => x - n[i] * ov[0]), b: b.map((x, i) => x + n[i] * ov[1]), at: p.at == null ? -9 : p.at, dur: p.dur || 0.25, w: p.w || 3.2, ink: p.ink == null ? 0.88 : p.ink,
        accent: p.accent ? 1 : 0, wobble: p.wobble == null ? 1.4 : p.wobble, dash: p.dash || 0, loose: p.loose == null ? 1 : p.loose, seed: nextSeed() };
    }
    // strokes(list, { parent, ghost, onTop }): ghost = how strongly lines show through things in front of them (0 = hidden
    // lines stay hidden); onTop = ignore depth (notes on the page). Returns the mesh; mesh.userData.set(i, a, b) moves a line.
    function strokes(list, p = {}) {
      const n = list.length, g = new THREE.InstancedBufferGeometry(), A = new Float32Array(n * 4), B = new Float32Array(n * 4), T = new Float32Array(n * 4), St = new Float32Array(n * 4);
      list.forEach((s, i) => { A.set([...s.a, s.loose], i * 4); B.set([...s.b, 0], i * 4); T.set([s.at, s.dur, s.seed, s.w], i * 4); St.set([s.ink, s.accent, s.wobble, s.dash], i * 4); });
      g.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); g.setIndex(si);
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(B, 4));
      g.setAttribute('iT', new THREE.InstancedBufferAttribute(T, 4)); g.setAttribute('iS', new THREE.InstancedBufferAttribute(St, 4));
      g.instanceCount = n;
      const mesh = new THREE.Mesh(g, strokeMaterial(1, p.onTop ? { depthTest: false } : {}));
      mesh.frustumCulled = false; mesh.renderOrder = p.onTop ? 30 : 20; (p.parent || scene).add(mesh);
      if (p.ghost && !p.onTop) { const gh = new THREE.Mesh(g, strokeMaterial(p.ghost, { depthFunc: THREE.GreaterDepth })); gh.frustumCulled = false; gh.renderOrder = 10; (p.parent || scene).add(gh); }
      mesh.userData.set = (i, a, b) => { A.set(a, i * 4); B.set(b, i * 4); g.attributes.iA.needsUpdate = true; g.attributes.iB.needsUpdate = true; };
      return mesh;
    }

    // the edges of any geometry as pencil lines: found from its creases, drawn bottom-up and left to right, each one
    // overshooting its corners. o: at, lineDur, over (overshoot, world units), restate (chance of a second, lighter
    // line beside the first), construct (true = long faint setting-out lines first), w, ink, crease (degrees), keep(a, b)
    function edgeStrokes(geo, p = {}) {
      const r = K.rng(p.seed || 11), e = new THREE.EdgesGeometry(geo, p.crease || 30).attributes.position, segs = [];
      for (let i = 0; i < e.count; i += 2) {
        let a = [e.getX(i), e.getY(i), e.getZ(i)], b = [e.getX(i + 1), e.getY(i + 1), e.getZ(i + 1)];
        if (b[1] - a[1] < -1e-3 || (Math.abs(b[1] - a[1]) <= 1e-3 && b[0] - b[2] * 0.5 < a[0] - a[2] * 0.5)) [a, b] = [b, a];
        if (!p.keep || p.keep(a, b)) segs.push({ a, b, len: Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) });
      }
      segs.sort((s, q) => (s.a[1] + s.b[1]) * 2 + s.a[0] * 0.2 - s.a[2] * 0.1 - ((q.a[1] + q.b[1]) * 2 + q.a[0] * 0.2 - q.a[2] * 0.1));
      const out = [], at = p.at == null ? -9 : p.at, span = (p.lineDur == null ? 0.6 : p.lineDur) * 0.72, over = p.over == null ? 0.14 : p.over, restate = p.restate == null ? 0.55 : p.restate;
      segs.forEach((s, i) => {
        const t0 = at + span * i / Math.max(1, segs.length - 1), dur = K.clamp(s.len * 0.08, 0.1, 0.3), ov = (k = 1) => Math.min(s.len * 0.25, r.range(0.25, 1) * over * k);
        if (p.construct && s.len > 1.4) out.push(line(s.a, s.b, { at: t0 - 0.4, dur: dur * 1.5, w: 2.1, ink: 0.26, wobble: 0.9, over: [r.range(0.4, 1.3), r.range(0.4, 1.3)] }));
        out.push(line(s.a, s.b, { at: t0, dur, w: p.w || 3.4, ink: p.ink || 0.9, over: [ov(), ov()], wobble: Math.min(1.5, s.len * 2) }));
        if (s.len > 0.4 && r() < restate) {
          const j = () => r.range(-0.028, 0.028);
          out.push(line(s.a.map((x) => x + j()), s.b.map((x) => x + j()), { at: t0 + dur * 0.8, dur, w: 2.4, ink: 0.42, over: [ov(1.5), ov(1.5)] }));
        }
      });
      return out;
    }

    // a shaded form with its outline. o: everything hatchMaterial and edgeStrokes take, plus pos, rot, cast (shadow),
    // edges (false = no outline), ghost (how much its hidden lines show through, default 0.11)
    function solid(geo, p = {}) {
      const mat = hatchMaterial(geo, p), mesh = new THREE.Mesh(geo, mat);
      if (p.pos) mesh.position.set(...p.pos); if (p.rot) mesh.rotation.set(...p.rot);
      mesh.castShadow = p.cast !== false; mesh.receiveShadow = true; mesh.customDepthMaterial = mat.userData.depth;
      (p.parent || scene).add(mesh);
      if (p.edges !== false) strokes(edgeStrokes(geo, p), { parent: mesh, ghost: p.ghost == null ? 0.11 : p.ghost });
      return mesh;
    }

    // single-stroke lettering as pencil lines (needs lib/strokefont.js). Returns { list, width, end }.
    // o: x, y (left end, middle of the capitals), size (cap height), at, cps (letters per second), w, ink, accent,
    // slant, map (turns a flat point [x, y] into a 3D point: this is what puts the words on a page or on a wall)
    function write(text, p = {}) {
      const r = K.rng(text + (p.x || 0)), size = p.size || 1, lay = STROKEFONT.layout(text, { size, align: 'left', step: 0.11, spacing: p.spacing == null ? 0.2 : p.spacing });
      const map = p.map || ((x, y) => [x, y, 0]), cps = p.cps || 24, at = p.at == null ? -9 : p.at, w = p.w || 5, slant = p.slant == null ? 0.07 : p.slant, list = [];
      const ext = p.ext == null ? 0 : p.ext;
      lay.glyphs.forEach((gl, gi) => {
        const dx = r.range(-0.02, 0.02) * size, dy = r.range(-0.03, 0.03) * size, rot = r.range(-0.035, 0.035), cx = gl.x + gl.w / 2;   // no two letters sit quite alike
        const total = gl.strokeIndexes.reduce((s, k) => s + STROKEFONT.length(lay.strokes[k]), 0) || 1; let done = 0;
        for (const k of gl.strokeIndexes) {
          const st = lay.strokes[k], pts = st.points.map(([x, y]) => { const u = x - cx, v = y; return [(p.x || 0) + cx + u * Math.cos(rot) - v * Math.sin(rot) + v * slant + dx, (p.y || 0) + u * Math.sin(rot) + v * Math.cos(rot) + dy]; });
          if (st.closed) pts.push(pts[0]);
          for (let i = pts.length - 2; i > 0; i--) {                                                       // a straight run is one pull of the pencil, not a row of dots
            const ax = pts[i][0] - pts[i - 1][0], ay = pts[i][1] - pts[i - 1][1], bx = pts[i + 1][0] - pts[i][0], by = pts[i + 1][1] - pts[i][1];
            if (Math.abs(ax * by - ay * bx) < 0.05 * Math.hypot(ax, ay) * Math.hypot(bx, by) && ax * bx + ay * by > 0) pts.splice(i, 1);
          }
          for (let i = 1; i < pts.length; i++) {
            const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]), e = ext / (l || 1);
            const a = [pts[i - 1][0] - (pts[i][0] - pts[i - 1][0]) * e, pts[i - 1][1] - (pts[i][1] - pts[i - 1][1]) * e], b = [pts[i][0] + (pts[i][0] - pts[i - 1][0]) * e, pts[i][1] + (pts[i][1] - pts[i - 1][1]) * e];
            list.push(line(map(a[0], a[1]), map(b[0], b[1]), { at: at + (gi + done / total) / cps, dur: l / total / cps, w, ink: p.ink == null ? 0.92 : p.ink, accent: p.accent, wobble: 0, loose: 0 }));
            done += l;
          }
        }
      });
      return { list, width: lay.width, end: at + lay.glyphs.length / cps };
    }

    return { U, solid, strokes, line, edgeStrokes, write, hatchMaterial };
  }

  // ---- the paper: one full-screen pass over the finished drawing. Everything in it is fixed to the page, like the
  // sheet itself: the drawing turns, the paper does not.
  const PAPER_FILTER = `
    uniform vec3 paper; uniform vec4 rub, smudgeA, smudgeB;   // rub = the eraser mark: centre (px from the bottom left), half length, half width. smudges: centre, radii
    ${NOISE}
    float fbm(vec2 p){ return 0.5 * n2(p) + 0.3 * n2(p * 2.1 + 5.0) + 0.2 * n2(p * 4.3 + 9.0); }
    float lum(vec3 c){ return dot(c, vec3(0.3, 0.55, 0.15)); }
    void main(){
      vec2 p = vUv * res; vec3 c = texture2D(tex, vUv).rgb;
      // smudge: where the side of the hand has rested, graphite is dragged down and to the right and leaves a grey haze
      float sm = 0.0;
      for (int i = 0; i < 2; i++) { vec4 z = i == 0 ? smudgeA : smudgeB; vec2 e = (p - z.xy) / z.zw; sm += smoothstep(1.0, 0.25, length(e) + 0.5 * (fbm(p * 0.004 + float(i) * 9.0) - 0.5)); }
      vec3 drag = vec3(0.0); float ws = 0.0;
      for (int i = 0; i < 10; i++) { float w = 1.0 - float(i) / 10.0; drag += texture2D(tex, vUv - vec2(0.94, -0.34) * float(i) * 4.0 / res).rgb * w; ws += w; }
      c = mix(c, drag / ws, 0.8 * sm) * (1.0 - 0.022 * sm);
      // the eraser mark: most of the graphite is lifted, a ghost of it stays, and the paper is rubbed a little cleaner
      vec2 q = p - rub.xy; q = vec2(q.x * 0.97 + q.y * 0.24, -q.x * 0.24 + q.y * 0.97);
      float er = 1.0 - smoothstep(0.0, 14.0, length(vec2(max(abs(q.x) - rub.z, 0.0), q.y)) - rub.w + 9.0 * n2(p * 0.05));
      c = mix(c, paper, er * 0.8);
      // tooth: a pencil only touches the high points of the paper, so light lines break up and heavy ones fill in
      float tooth = 0.55 * n2(p * 0.62) + 0.45 * n2(p * 1.45 + 31.0);
      float k = clamp(1.0 - lum(c) / lum(paper), 0.0, 1.0);
      vec3 sheet = paper * (1.0 + (fbm(p * 0.006) - 0.5) * 0.045 - (0.5 - tooth) * 0.035 + er * 0.012);
      sheet *= 1.0 - 0.05 * smoothstep(0.35, 0.95, length((vUv - 0.5) * vec2(1.0, 0.8)) * 1.6);      // the page falls away a little toward its edges
      float bite = mix(clamp(0.25 + 1.5 * tooth, 0.0, 1.6), 1.0, smoothstep(0.25, 0.9, k));
      gl_FragColor = vec4(clamp(sheet - (paper - c) * bite, 0.0, 1.0), 1.0);
    }`;

  // ================================================================ THE STYLE
  registerStyle({
    id: 'pencil-sketch',
    name: 'Pencil Sketch',
    family: 'Filters over 3D',
    look: 'A real 3D scene that reads as a graphite drawing in a designer\'s sketchbook: forms shaded with hatching and cross-hatching that follows the light, outlines that overshoot their corners, faint construction lines, hand lettering, toothy paper with a smudge and an eraser mark, and one red accent.',
    motion: 'The drawing makes itself: setting-out lines first, then outlines stroke by stroke, then shading laid across each form in one direction and crossed in a second. Hatching is fixed to the objects and turns with them; only the line wobble boils a little, on held frames. Notes are lettered on and their leader lines follow the parts as the view turns.',
    light: 'One sun from the upper left and flat fill. The light is never shown directly: it only decides how many layers of hatching a face or a cast shadow gets, so lit faces stay as bare paper and shade is cross-hatched.',
    materials: 'Graphite on cream cartridge paper. Soft dark pencil for outlines and lettering, lighter pencil for hatching and construction lines, a red pencil for numbers and marks, and one wash of red marker on the part that matters.',
    camera: 'One slow, continuous arc round the subject on a long lens, about 35 degrees from nearly front-on to a three-quarter view, rising and pulling back a little as the drawing grows. Everything is sharp, like a drawing. The subject sits left of centre so the notes have a clear column of paper.',
    post: 'No motion blur, bloom, grain or vignette. One paper pass: tooth that breaks up light lines, a hand smudge that drags graphite, an eraser mark, slight mottling and darker page edges.',
    explains: 'How something is built or put together, step by step: parts are drawn in order, each with a numbered note. Also good for anatomy of an object, plans, exploded views and anything that benefits from seeing the structure through the surface.',
    topic: 'How a house goes up: foundation, frame, walls, roof',
    duration: DURATION,
    fonts: [],
    render: { samples: 16, preview: 4, shutter: 0, tone: 'linear', exposure: 1, bloom: 0, vignette: 0, grain: 0, fov: 30, near: 1, far: 160, background: PAPER },

    build(S) {
      const { THREE, K, scene, camera } = S;
      const kit = pencilKit(S, { paper: PAPER, graphite: GRAPHITE, accent: ACCENT }), { solid, strokes, line, write } = kit;
      const P = plan(), rnd = K.rng(5);
      const disp = (hex) => { const n = parseInt(hex.slice(1), 16); return new THREE.Vector3((n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255); };
      S.addFilter(PAPER_FILTER, { paper: { value: disp(PAPER) }, rub: { value: new THREE.Vector4(1345, 978, 92, 30) },
        smudgeA: { value: new THREE.Vector4(1120, 265, 230, 85) }, smudgeB: { value: new THREE.Vector4(1560, 90, 230, 60) } });

      // light: it only ever becomes hatching. Sun from the upper left, so the front is light, the right side in shade
      K.sun(S, { pos: [-6, 15, 7], target: [0, 1, 0], power: Math.PI, size: 10, soft: 0.22 });
      scene.add(new THREE.AmbientLight('#ffffff', Math.PI * 0.3));

      // ---------------------------------------------------------------- the subject: a small house, in four stages
      const W = 6.2, D = 4.4, SLAB = 0.3, WALL = 2.6, RISE = 1.75, T = 0.15, WT = 0.1, y0 = SLAB, yTop = SLAB + WALL, yApex = yTop + RISE;
      // ground: bare paper where it is lit, hatching where a shadow falls
      solid(new THREE.PlaneGeometry(70, 70).rotateX(-Math.PI / 2), { edges: false, cast: false, angle: 0.5, fan: 0, lift: 0.06 });

      // blocking-in: before anything is drawn firmly, the whole volume is set out in faint lines that run past their corners
      const mass = [], bx = W / 2 + WT, bz = D / 2 + WT, faint = (a, b) => mass.push(line(a, b, { w: 2.1, ink: 0.3, wobble: 1.1, over: [rnd.range(0.35, 1.1), rnd.range(0.35, 1.1)] }));
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) faint([sx * bx, y0, sz * bz], [sx * bx, yTop, sz * bz]);
        faint([sx * bx, yTop, bz], [sx * bx, yApex, 0]); faint([sx * bx, yTop, -bz], [sx * bx, yApex, 0]); faint([sx * bx, yTop, -bz], [sx * bx, yTop, bz]);
        faint([-bx, yTop, sx * bz], [bx, yTop, sx * bz]);
      }
      faint([-bx, yApex, 0], [bx, yApex, 0]);
      strokes(mass);

      // 1 foundation
      solid(new THREE.BoxGeometry(W + 0.7, SLAB, D + 0.7), { pos: [0, SLAB / 2, 0], at: P.slab.at, lineDur: 0.75, fillAt: P.slab.fillAt, fillDur: P.slab.fill, construct: true, seed: 2, angle: 0.3 });

      // 2 frame: plates, then studs going up one after another round the house, then the top plates
      const beam = (len, along, x, y, z, at) => solid(new THREE.BoxGeometry(along === 'x' ? len : T, T, along === 'x' ? T : len), { pos: [x, y, z], at, lineDur: 0.3, fillAt: at + 0.2, fillDur: 0.3, restate: 0, over: 0.07, w: 3, seed: x * 7 + z * 3 + y, fan: 0, lift: 0.26 });
      const ring = (y, at) => { beam(W, 'x', 0, y, D / 2 - T / 2, at); beam(D - 2 * T, 'z', W / 2 - T / 2, y, 0, at + 0.08); beam(W, 'x', 0, y, -D / 2 + T / 2, at + 0.16); beam(D - 2 * T, 'z', -W / 2 + T / 2, y, 0, at + 0.24); };
      ring(y0 + T / 2, P.plates);
      const studs = [];
      for (let i = 0; i < 9; i++) if (i !== 4) studs.push([-W / 2 + T / 2 + i * (W - T) / 8, D / 2 - T / 2]);            // front, with a gap for the door
      for (let j = 1; j < 6; j++) studs.push([W / 2 - T / 2, D / 2 - T / 2 - j * (D - T) / 6]);                          // right side
      for (let i = 8; i >= 0; i--) studs.push([-W / 2 + T / 2 + i * (W - T) / 8, -D / 2 + T / 2]);                       // back
      for (let j = 5; j > 0; j--) studs.push([-W / 2 + T / 2, D / 2 - T / 2 - j * (D - T) / 6]);                         // left side
      const studTimes = studs.map((_, i) => P.studs + i * P.studGap);
      studs.forEach(([x, z], i) => solid(new THREE.BoxGeometry(T, WALL - 2 * T, T), { pos: [x, y0 + WALL / 2, z], at: studTimes[i], lineDur: 0.22, fillAt: studTimes[i] + 0.12, fillDur: 0.25, restate: 0, over: 0.1, w: 3, seed: i + 20, wipe: [0, 1, 0], fan: 0, lift: 0.26 }));
      beam((W - T) / 4 - T, 'x', 0, y0 + 2.2, D / 2 - T / 2, P.studs + 0.5);                                              // the header over the door
      ring(yTop - T / 2, P.topPlate);

      // 3 walls: front and back with openings, gable ends on the sides
      const rect = (x0, y0_, x1, y1) => { const s = new THREE.Path(); s.moveTo(x0, y0_); s.lineTo(x1, y0_); s.lineTo(x1, y1); s.lineTo(x0, y1); s.closePath(); return s; };
      const front = new THREE.Shape(); front.moveTo(-W / 2, y0); front.lineTo(-0.5, y0); front.lineTo(-0.5, y0 + 2.05); front.lineTo(0.5, y0 + 2.05); front.lineTo(0.5, y0); front.lineTo(W / 2, y0); front.lineTo(W / 2, yTop); front.lineTo(-W / 2, yTop); front.closePath();
      front.holes.push(rect(1.35, y0 + 0.95, 2.45, y0 + 2.05), rect(-2.45, y0 + 0.95, -1.35, y0 + 2.05));
      const back = new THREE.Shape(); back.moveTo(-W / 2, y0); back.lineTo(W / 2, y0); back.lineTo(W / 2, yTop); back.lineTo(-W / 2, yTop); back.closePath();
      const gable = new THREE.Shape(); gable.moveTo(-D / 2 - WT, y0); gable.lineTo(D / 2 + WT, y0); gable.lineTo(D / 2 + WT, yTop); gable.lineTo(0, yApex + WT * 0.76); gable.lineTo(-D / 2 - WT, yTop); gable.closePath();
      gable.holes.push(rect(-0.6, y0 + 0.95, 0.6, y0 + 2.05));
      const ext = (shape) => new THREE.ExtrudeGeometry(shape, { depth: WT, bevelEnabled: false });
      const wallOpts = (k, seed) => ({ at: P.walls.at + k * P.walls.side, lineDur: 0.6, fillAt: P.walls.fillAt + k * P.walls.side, fillDur: P.walls.fill, seed });
      solid(ext(front).translate(0, 0, D / 2), wallOpts(0, 31));
      solid(ext(gable).rotateY(Math.PI / 2).translate(W / 2, 0, 0), wallOpts(1, 32));
      solid(ext(back).translate(0, 0, -D / 2 - WT), wallOpts(0.5, 33));
      solid(ext(gable).rotateY(Math.PI / 2).translate(-W / 2 - WT, 0, 0), wallOpts(0.5, 34));
      // glass and door: a fixed dark tone for the panes (gain 0), glazing bars and planks as loose lines
      const det = [], dAt = P.walls.details;
      const pane = (geo, pos, tone) => solid(geo, { pos, edges: false, cast: false, gain: 0, lift: tone, fillAt: dAt, fillDur: 0.5, angle: 0.8, fan: 0 });
      for (const cx of [1.9, -1.9]) {
        pane(new THREE.BoxGeometry(1.1, 1.1, 0.02), [cx, y0 + 1.5, D / 2 + 0.03], 0.27);
        det.push(line([cx, y0 + 0.95, D / 2 + 0.05], [cx, y0 + 2.05, D / 2 + 0.05], { at: dAt + 0.2, w: 2.6, over: [0.03, 0.03] }), line([cx - 0.55, y0 + 1.5, D / 2 + 0.05], [cx + 0.55, y0 + 1.5, D / 2 + 0.05], { at: dAt + 0.3, w: 2.6, over: [0.03, 0.03] }));
        det.push(line([cx - 0.66, y0 + 0.9, D / 2 + WT + 0.01], [cx + 0.66, y0 + 0.9, D / 2 + WT + 0.01], { at: dAt + 0.4, w: 3.6, over: [0.05, 0.08] }));   // the sill
      }
      pane(new THREE.BoxGeometry(0.02, 1.1, 1.2), [W / 2 + 0.03, y0 + 1.5, 0], 0.1);
      det.push(line([W / 2 + 0.05, y0 + 0.95, 0], [W / 2 + 0.05, y0 + 2.05, 0], { at: dAt + 0.35, w: 2.6 }), line([W / 2 + 0.05, y0 + 1.5, 0.6], [W / 2 + 0.05, y0 + 1.5, -0.6], { at: dAt + 0.45, w: 2.6 }));
      pane(new THREE.BoxGeometry(1.0, 2.05, 0.02), [0, y0 + 1.025, D / 2 + 0.03], 0.78);
      for (const x of [-0.25, 0, 0.25]) det.push(line([x, y0 + 0.04, D / 2 + 0.05], [x, y0 + 2.0, D / 2 + 0.05], { at: dAt + 0.25 + x * 0.3, w: 2.2, ink: 0.6, over: [0, 0.02] }));
      det.push(line([0.36, y0 + 1.0, D / 2 + 0.05], [0.4, y0 + 1.0, D / 2 + 0.05], { at: dAt + 0.5, w: 7, wobble: 0, loose: 0 }));                              // the door knob
      det.push(line([-0.75, y0 + 0.02, D / 2 + WT + 0.3], [0.75, y0 + 0.02, D / 2 + WT + 0.3], { at: dAt + 0.5, w: 3, over: [0.05, 0.08] }));                   // the step
      strokes(det, { ghost: 0 });

      // 4 roof: ridge and rafters as bare lines first, then the roof itself with the one wash of colour
      const raf = [line([-W / 2 - 0.3, yApex, 0], [W / 2 + 0.3, yApex, 0], { at: P.rafters, dur: 0.3, w: 3, over: [0.2, 0.3] })];
      for (let i = 0; i < 6; i++) { const x = -W / 2 + T + i * (W - 2 * T) / 5; for (const s of [1, -1]) raf.push(line([x, yTop, s * D / 2], [x, yApex, 0], { at: P.rafters + 0.08 + i * 0.045 + (s < 0 ? 0.02 : 0), dur: 0.2, w: 2.8, ink: 0.8, over: [0.12, 0.1] })); }
      strokes(raf, { ghost: 0.11 });
      const OV = 0.42, RT = 0.15, slope = RISE / (D / 2 + WT), zE = D / 2 + WT + OV, yE = yTop - OV * slope, LEN = W + 2 * WT + 0.7;
      const prof = new THREE.Shape(); prof.moveTo(zE, yE); prof.lineTo(0, yApex); prof.lineTo(-zE, yE); prof.lineTo(-zE, yE + RT); prof.lineTo(0, yApex + RT); prof.lineTo(zE, yE + RT); prof.closePath();
      solid(new THREE.ExtrudeGeometry(prof, { depth: LEN, bevelEnabled: false }).rotateY(Math.PI / 2).translate(-LEN / 2, 0, 0),
        { at: P.roof.at, lineDur: 0.55, fillAt: P.roof.fillAt, fillDur: P.roof.fill, wash: WASH, washAt: P.roof.washAt, washDur: P.roof.wash, angle: Math.PI / 2, fan: 0, construct: true, seed: 41, wipe: [1, 0.4, -0.55] });
      solid(new THREE.BoxGeometry(0.55, 1.5, 0.55), { pos: [1.75, yApex - 0.35, -1.05], at: P.chimney, lineDur: 0.3, fillAt: P.chimney + 0.2, fillDur: 0.4, seed: 43, over: 0.08, ghost: 0 });

      const curl = [], cTop = [1.75, yApex + 0.42, -1.05];                                                              // a curl of smoke, in one unbroken line
      for (let i = 0; i <= 34; i++) { const u = i / 34, a = u * 4.2 * Math.PI; curl.push([cTop[0] + 0.34 * u + 0.1 * (0.5 + u) * Math.sin(a), cTop[1] + 0.05 + 0.5 * u + 0.07 * (0.5 + u) * (1 - Math.cos(a)), cTop[2]]); }
      strokes(curl.slice(1).map((q, i) => line(curl[i], q, { at: P.smoke + i * 0.011, dur: 0.012, w: 2.6, ink: 0.62, wobble: 0, loose: 0 })));

      // ---------------------------------------------------------------- setting-out on the ground: grid, centre lines, a dimension
      const lay = [], G = 0.006;
      for (let x = -10; x <= 10; x += 2) lay.push(line([x, G, -8], [x, G, 8], { w: 2, ink: 0.15, wobble: 1 }));
      for (let z = -8; z <= 8; z += 2) lay.push(line([-10, G, z], [10, G, z], { w: 2, ink: 0.15, wobble: 1 }));
      lay.push(line([-5.6, G, 0], [5.8, G, 0], { w: 2.2, ink: 0.34, dash: 30 }), line([0, G, -4.4], [0, G, 4.8], { w: 2.2, ink: 0.34, dash: 30 }));
      const zd = D / 2 + 1.5, xs = (W + 0.7) / 2;
      for (const s of [-1, 1]) {
        lay.push(line([s * xs, G, D / 2 + 0.5], [s * xs, G, zd + 0.3], { at: P.dim, dur: 0.15, w: 2.2, ink: 0.6 }));                                         // witness lines
        lay.push(line([s * xs - 0.11, G, zd + 0.16], [s * xs + 0.11, G, zd - 0.16], { at: P.dim + 0.3 + s * 0.04, dur: 0.08, w: 3.8, accent: 1, wobble: 0 }));   // the draughtsman's tick
      }
      lay.push(line([-xs, G, zd], [xs, G, zd], { at: P.dim + 0.05, dur: 0.3, w: 2.4, ink: 0.7, over: [0.25, 0.25] }));
      const dimW = write(DIMENSION, { size: 0.32 }).width;
      lay.push(...write(DIMENSION, { size: 0.32, at: P.dim + 0.35, cps: 14, w: 3.8, map: (x, y) => [x - dimW / 2, 0.34 + y, zd] }).list);
      strokes(lay, { ghost: 0 });

      // ---------------------------------------------------------------- the page: title and notes are lettered on the sheet, not in the scene.
      // `page` copies the camera, so its children are placed in pixels from the middle of the frame (y up).
      const page = new THREE.Group(), FV = 2 * Math.tan(THREE.MathUtils.degToRad(S.R.fov) / 2) / S.H, PZ = -1 / FV, PAGE_AT = 8, onPage = (x, y) => [x, y, PZ];   // the sheet hangs 8 units in front of the lens
      scene.add(page);
      const ink = [], guide = (x0, x1, y, size, at) => { for (const s of [-0.5, 0.5]) ink.push(line(onPage(x0, y + s * size * 1.06), onPage(x1, y + s * size * 1.06), { at, dur: 0.2, w: 1.8, ink: 0.24, wobble: 0.6 })); };
      const TS = 56, tx = -872, ty = 448, title = write(TITLE, { x: tx, y: ty, size: TS, w: 6.4, map: onPage, at: -5, ext: 0.7 });
      guide(tx - 46, tx + title.width + 430, ty, TS, -6);                                                                 // lettering guidelines, rubbed out past the end
      ink.push(...title.list);
      ink.push(line(onPage(tx - 6, ty - TS * 0.86), onPage(tx + title.width * 0.62, ty - TS * 0.86 + 5), { at: -5, w: 3.4, accent: 1, wobble: 1.6 }));
      const NS = 47, wide = Math.max(...STAGES.map((st) => write(st.label, { size: NS }).width)), nx = 960 - 70 - wide - NS * 1.5;   // the widest note ends 70 px from the edge
      const rows = [-322, -140, 42, 224], notes = STAGES.map((st, i) => {
        const y = rows[i], at = P.notes[i];
        guide(nx - 36, nx + 440, y, NS, at - 0.25);
        ink.push(...write(String(i + 1), { x: nx - (i === 0 ? 5 : 11), y, size: NS * 0.8, w: 5, map: onPage, at, accent: 1, ext: 0.6, slant: 0.02 }).list);
        const R0 = NS * 0.88, M = 26, turns = 1.12, ph = 2.2;                                                          // the ring round the number does not quite meet itself
        for (let k = 0; k < M; k++) { const a0 = ph + k / M * turns * 6.283, a1 = ph + (k + 1.25) / M * turns * 6.283, r0 = R0 * (1 + 0.1 * k / M), r1 = R0 * (1 + 0.1 * (k + 1) / M); ink.push(line(onPage(nx + Math.cos(a0) * r0 * 1.05, y + Math.sin(a0) * r0), onPage(nx + Math.cos(a1) * r1 * 1.05, y + Math.sin(a1) * r1), { at: at + 0.04 + k * 0.006, dur: 0.02, w: 3.4, accent: 1, wobble: 0, loose: 0, ink: 0.85 })); }
        const word = write(st.label, { x: nx + NS * 1.5, y, size: NS, w: 5.8, map: onPage, at: at + 0.2, cps: 26, ext: 0.6 });
        ink.push(...word.list);
        return { y, at, end: word.end };
      });
      strokes(ink, { parent: page, onTop: true });
      // leader lines: fixed to the note at one end and to the part at the other, so they swing as the drawing turns
      const anchors = [[W / 2 + 0.35, SLAB, D / 2 + 0.35], [W / 2 - T / 2, y0 + 1.3, D / 2 - T / 2 - (D - T) / 6], [W / 2 + WT, y0 + 1.75, -1.25], [W / 2 + 0.2, yApex - 0.62, 0.95]];
      const leaders = strokes(notes.flatMap((n) => [line([0, 0, 0], [1, 0, 0], { at: n.end, dur: 0.22, w: 2.6, ink: 0.8, wobble: 1.2 }), line([0, 0, 0], [1, 0, 0], { at: n.end + 0.2, dur: 0.05, w: 3, wobble: 0 }), line([0, 0, 0], [1, 0, 0], { at: n.end + 0.24, dur: 0.05, w: 3, wobble: 0 })]), { parent: page, onTop: true });

      // ---------------------------------------------------------------- camera: one continuous arc round the house, rising as it grows.
      // Keys are [angle round the house (degrees from straight in front), height angle, distance, how far the house
      // sits left of centre (world units), height looked at]. The drawing turns; the hatching turns with it.
      const shot = K.path([[0, [6, 9.5, 16.0, 2.0, 1.75]], [2, [14, 11, 16.6, 2.25, 1.9]], [4, [24, 12.5, 17.3, 2.5, 2.05]], [6, [34, 14, 18.0, 2.8, 2.15]], [8, [42, 15.5, 18.6, 3.0, 2.25]]]);
      const rad = THREE.MathUtils.degToRad;
      const v = new THREE.Vector3();

      return {
        update(t) {
          kit.U.uTime.value = t;
          kit.U.uBoil.value = Math.floor(t * 7.5 + 0.5);           // the line wobble is redrawn every fourth frame
          const [yaw, tilt, dist, left, high] = shot(t), cy = Math.cos(rad(yaw)), sy = Math.sin(rad(yaw)), ct = Math.cos(rad(tilt)), aim = [cy * left, high, -sy * left];
          K.look(camera, [aim[0] + sy * ct * dist, high + Math.sin(rad(tilt)) * dist, aim[2] + cy * ct * dist], aim);
          camera.updateMatrixWorld();
          page.position.copy(camera.position); page.quaternion.copy(camera.quaternion); page.scale.setScalar(PAGE_AT * FV); page.updateMatrixWorld();
          notes.forEach((n, i) => {
            page.worldToLocal(v.set(...anchors[i]));                                      // the part, in page space
            const k = v.z / PZ, a = [(nx - NS * 1.25) * k, (n.y - 4) * k, v.z], b = [v.x, v.y, v.z];
            const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l, h = 17 * k;
            leaders.userData.set(i * 3, [...a, 1], [...b, 0]);
            for (const s of [1, 2]) { const an = s === 1 ? 0.42 : -0.42, c = Math.cos(an), sn = Math.sin(an); leaders.userData.set(i * 3 + s, [b[0] - (ux * c - uy * sn) * h, b[1] - (ux * sn + uy * c) * h, v.z, 0], [...b, 0]); }
          });
        },
      };
    },

    sound(k) {
      const P = plan(), r = globalThis.K.rng(3);
      const pencil = (t, dur, gain = 0.8, pan = 0) => k.play('stroke', t, { material: 'pencil', dur, gain, pan });
      const lines = (t, n, gap, dur, gain, pan) => { for (let i = 0; i < n; i++) pencil(t + i * gap, dur * r.range(0.8, 1.2), gain * r.range(0.8, 1.1), pan + r.range(-0.15, 0.15)); };
      const scribble = (t, dur, gain, pan) => k.withMinor(() => { for (let x = 0; x < dur; x += 0.085) pencil(t + x, 0.06, gain * (0.7 + 0.3 * ((x / 0.085) % 2)), pan + r.range(-0.1, 0.1)); });   // shading: quick strokes back and forth
      k.bed('room', 0, DURATION, { gain: 0.7 });
      // every note: the number, its ring, the word, then the leader line out to the part
      STAGES.forEach((st, i) => { const t = P.notes[i], word = st.label.length / 26; pencil(t, 0.07, 0.7, 0.5); pencil(t + 0.05, 0.16, 0.6, 0.5); k.withMinor(() => lines(t + 0.2, st.label.length, 1 / 26, 0.035, 0.75, 0.55)); pencil(t + 0.2 + word, 0.2, 0.55, 0.3); k.play('tick', t + 0.44 + word, { gain: 0.5, f: 2600, pan: 0.2 }); });
      // 1 foundation: only its dimension is still to come
      lines(P.dim, 2, 0.07, 0.12, 0.5, -0.3); pencil(P.dim + 0.05, 0.3, 0.6, -0.3); lines(P.dim + 0.3, 2, 0.08, 0.05, 0.7, -0.3); k.withMinor(() => lines(P.dim + 0.35, DIMENSION.length, 1 / 14, 0.05, 0.6, -0.3));
      // 2 frame: plates, a quick stroke for every stud, plates again
      lines(P.plates, 4, 0.08, 0.26, 0.6, -0.2);
      k.withMinor(() => { for (let i = 0; i < 27; i++) pencil(P.studs + i * P.studGap, 0.13, 0.55, -0.6 + 0.9 * Math.abs(1 - i / 13.5)); });
      lines(P.topPlate, 4, 0.08, 0.26, 0.6, -0.2);
      // 3 walls: outlines, then the shading goes on, then the glazing bars
      lines(P.walls.at, 7, 0.085, 0.2, 0.7, -0.25); scribble(P.walls.fillAt, P.walls.fill + 0.15, 0.5, -0.1); lines(P.walls.details + 0.2, 5, 0.06, 0.08, 0.5, -0.2);
      // 4 roof: rafters, outline, one long pull of the marker, a little shading
      k.withMinor(() => lines(P.rafters + 0.08, 12, 0.03, 0.1, 0.5, -0.2)); pencil(P.rafters, 0.3, 0.7, -0.2);
      lines(P.roof.at, 5, 0.09, 0.22, 0.7, -0.2);
      for (let i = 0; i < 3; i++) k.play('stroke', P.roof.washAt + i * 0.25, { material: 'marker', dur: 0.24, gain: 0.5, pan: -0.3 + i * 0.15 });
      scribble(P.roof.fillAt + 0.1, 0.4, 0.4, 0); lines(P.chimney, 3, 0.08, 0.12, 0.5, 0.1);
      pencil(P.smoke, 0.36, 0.5, 0.1);
      k.play('tock', P.smoke + 0.55, { gain: 0.45, f: 520 });        // the pencil is put down
    },
  });
}
```
