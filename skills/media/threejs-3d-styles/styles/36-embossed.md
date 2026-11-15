# Embossed (#36)

- **id:** `embossed`
- **Category:** Flat content made physical
- **Use:** title
- **Reference duration:** 8 s
- **Google Fonts:** Fraunces
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`

## Style card

- **Look:** Words and one small mark pressed into thick cotton paper and filmed in macro: grey-blue letterpress sunk deep enough to see the walls of the impression and the shadow inside it, a ruler scale embossed blind (raised, no ink), and a copper foil stamp, on a deckle-edged sheet lying on a dark press bed.
- **Motion:** You watch it being made. A brass plate with the type standing up in mirror image swings down, squeezes the sheet and lifts to show the impression; a ribbon of foil is laid over one spot, a heated die on a lever arm stamps it, and the spent foil is peeled back to leave the metal mark.
- **Light:** One low, hard raking lamp from the side, so every impression has a bright far wall and a shadow inside, with dim warm fill. The lamp slides round at the end so the relief turns, and a glint runs across the foil.
- **Materials:** Toothy cream cotton paper that is smoother where it was compressed, ink lying on the floor of the impression with bare paper walls and small bare specks, mirror-bright copper foil, etched brass with wet ink on the type, grey steel.
- **Camera:** A long lens with shallow focus, one continuous move: low against the open plate, down with its edge to the paper, then a slow pass a few letters wide just above the sheet that arrives at the foil work, then up and back until the whole card fills the frame.
- **Finish:** Real depth of field and motion blur, soft bloom only on the foil and brass glints, filmic contrast, a gentle vignette and fine grain.
- **Good for:** Any quote, name, number or simple logo: it is drawn flat on a canvas and pressed into the material, so the statement arrives as a finished, tactile object. Best for one line that should feel permanent, with one small mark picked out in foil.

## Reference

- **Sample topic:** The saying "Measure twice, cut once." letterpressed into paper, with a foil-stamped carpenter's square
- **Gallery description:** Words and one small mark pressed into thick cotton paper and filmed in macro: grey-blue letterpress sunk deep enough to see the walls of the impression and the shadow inside it, a ruler scale embossed blind (raised, no ink), and a copper foil stamp, on a deckle-edged sheet lying on a dark press bed.
- **Shown in the sample clip:** The saying "Measure twice, cut once." letterpressed into paper, with a foil-stamped carpenter's square

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/embossed.js`)

```js
{
  // ---------------------------------------------------------------- content (change this for a new topic)
  // Everything on the card is drawn flat, white on black, on a 2D canvas, in three layers. Each layer is pressed
  // differently: `ink` is letterpress (pressed deep and inked), `blind` is embossed with no ink (raised, it only shows
  // in raking light), `foil` is hot-stamped metal. A new topic only needs new drawing code here.
  const LINES = [
    { text: 'Measure twice,', font: 'italic 400 {px}px "Fraunces"' },
    { text: 'cut once.', font: '500 {px}px "Fraunces"' },
  ];
  const PAPER = '#efe5d0', INK = '#3e5173', FOIL = '#f2a56b';   // cotton paper, grey-blue ink (light enough to show the relief under it), copper foil
  const CARD_W = 15, CARD_H = 8.2;                 // the sheet, world units (think centimetres)
  const ART_W = 4096, ART_H = Math.round(ART_W * CARD_H / CARD_W), U = ART_W / CARD_W;   // art canvas, pixels per unit

  // where things sit on the art canvas (pixels). Both lines are centred; the foil mark rides at the end of the last line.
  function layout() {
    const m = document.createElement('canvas').getContext('2d');
    const width = (ln, px) => { m.font = ln.font.replace('{px}', px); return m.measureText(ln.text).width; };
    const px = Math.round(11.3 * U / width(LINES[0], 1000) * 1000);          // the first line spans 11.3 units
    const mark = 1.5 * U, gap = 0.75 * U, w = LINES.map((ln) => width(ln, px));
    const base = [3.02 * U, 5.0 * U];
    const x = [ART_W / 2 - w[0] / 2, ART_W / 2 - (w[1] + gap + mark) / 2];
    return { px, base, x, w, rule: [x[0], x[0] + w[0], 5.98 * U], mark: { x: x[1] + w[1] + gap + mark / 2, y: base[1] - 0.6 * U, s: mark } };
  }
  // a carpenter's square inside a ring: the "one small logo". Drawn in a box of size s centred on (0, 0).
  function drawMark(ctx, s) {
    ctx.lineWidth = s * 0.04; ctx.beginPath(); ctx.arc(0, 0, s * 0.48, 0, Math.PI * 2); ctx.stroke();
    const bx = -s * 0.2, by = -s * 0.27, bw = s * 0.15, bh = s * 0.52, tl = s * 0.43, th = s * 0.12;
    ctx.fillRect(bx, by, bw, bh); ctx.fillRect(bx, by + bh - th, tl, th);     // blade and tongue
    ctx.fillStyle = '#000';                                                   // graduations, knocked out of the metal
    for (let i = 1; i < 9; i++) ctx.fillRect(bx + bw * (i % 2 ? 0.55 : 0.3), by + i * (bh - th) / 9, bw, s * 0.014);
    for (let i = 1; i < 6; i++) ctx.fillRect(bx + bw + i * (tl - bw) / 6, by + bh - th - 1, s * 0.014, th * (i % 2 ? 0.45 : 0.7));
    ctx.fillStyle = '#fff';
  }
  function drawArt(ctx, layer, L) {
    if (layer === 'ink') LINES.forEach((ln, i) => { ctx.font = ln.font.replace('{px}', L.px); ctx.textBaseline = 'alphabetic'; ctx.fillText(ln.text, L.x[i], L.base[i]); });
    if (layer === 'blind') {   // a ruler scale under the words, raised without ink
      const [x0, x1, y] = L.rule, step = (x1 - x0) / 64;
      ctx.fillRect(x0, y, x1 - x0, 0.075 * U);
      for (let i = 0; i <= 64; i++) ctx.fillRect(x0 + i * step - 0.026 * U, y, 0.052 * U, (i % 8 === 0 ? 0.4 : i % 4 === 0 ? 0.29 : 0.19) * U);
    }
    if (layer === 'foil') { ctx.save(); ctx.translate(L.mark.x, L.mark.y); drawMark(ctx, L.mark.s); ctx.restore(); }
  }

  // ---------------------------------------------------------------- timing, shared by picture and sound
  const T = {
    hit: 1.0, lift: 1.4, open: 2.5,                   // the plate closes on the sheet, dwells, swings open
    strip: 3.3, laid: 3.85,                           // a ribbon of foil is laid over the spot
    stamp: 4.25, stampLift: 4.6, stampGone: 5.1,      // the hot die comes down on it, dwells, leaves
    peel: 5.15, peeled: 6.15,                         // the spent foil is peeled back
    sweep: 6.1, flash: 7.0, rest: 7.4,                // the light slides round the finished card and the foil flashes
  };

  // ---------------------------------------------------------------- flat art -> relief maps
  // Three small textures carry the whole impression. `shape`: the crisp artwork (where ink and foil sit). `soft`: the
  // same art blurred a few pixels, which is the height of the impression with soft shoulders. `halo`: a wide blur, the
  // shallow dish of compressed paper around every mark. Channels are R ink, G foil, B blind.
  function reliefMaps(K, W, H, draw) {
    const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    const layers = ['ink', 'foil', 'blind'].map((name) => { const c = mk(W, H), x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, W, H); x.fillStyle = x.strokeStyle = '#fff'; draw(x, name); return c; });
    const tmp = mk(W, H), tx = tmp.getContext('2d');
    const pack = (w, h, blur) => K.canvasTex(w, h, (ctx) => {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
      layers.forEach((src, i) => {
        tx.globalCompositeOperation = 'source-over'; tx.filter = 'none'; tx.fillStyle = '#000'; tx.fillRect(0, 0, W, H);
        tx.filter = `blur(${blur}px)`; tx.drawImage(src, 0, 0, w, h); tx.filter = 'none';
        tx.globalCompositeOperation = 'multiply'; tx.fillStyle = ['#f00', '#0f0', '#00f'][i]; tx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(tmp, 0, 0, w, h, 0, 0, w, h);
      });
    }, { data: true });
    return { shape: pack(W, H, 0.7), soft: pack(W, H, 4.2), halo: pack(W >> 2, H >> 2, 10) };
  }
  // Tiling paper fibre: R,G = surface normal of the felted fibres, B = their height, A = slow cloudy variation.
  function fibreMaps(THREE, K) {
    const N = 1024, r = K.rng(3);
    const bump = K.canvasTex(N, N, (ctx) => {
      ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, N, N); ctx.lineCap = 'round';
      const wrap = (x, y, pad, fn) => { for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) if (x + ox > -pad && x + ox < N + pad && y + oy > -pad && y + oy < N + pad) fn(x + ox, y + oy); };   // keeps the tile seamless
      for (let i = 0; i < 52000; i++) {      // felt: soft light and dark grains
        const v = r.chance(0.5) ? 255 : 0, rad = r.range(1.2, 4.5);
        ctx.fillStyle = `rgba(${v},${v},${v},${r.range(0.05, 0.22)})`;
        wrap(r.range(0, N), r.range(0, N), 6, (x, y) => { ctx.beginPath(); ctx.arc(x, y, rad, 0, 6.283); ctx.fill(); });
      }
      for (let i = 0; i < 2600; i++) {       // a few single fibres lying on top
        const a = r.range(0, 6.283), len = r.range(8, 44), b = a + r.range(-1, 1), v = r.chance(0.6) ? 255 : 0;
        ctx.strokeStyle = `rgba(${v},${v},${v},${r.range(0.08, 0.3)})`; ctx.lineWidth = r.range(0.7, 1.8);
        wrap(r.range(0, N), r.range(0, N), 50, (x, y) => { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(b) * len * 0.5, y + Math.sin(b) * len * 0.5, x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.stroke(); });
      }
    }, { data: true, repeat: [1, 1] });
    const src = bump.ctx.getImageData(0, 0, N, N).data, out = new Uint8Array(N * N * 4), h = (x, y) => src[(((y + N) % N) * N + ((x + N) % N)) * 4] / 255;
    const waves = Array.from({ length: 14 }, () => [r.int(-5, 5), r.int(-5, 5), r.range(0, 6.283), r.range(0.4, 1)]);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const o = ((N - 1 - y) * N + x) * 4;   // DataTexture rows run bottom-up
      out[o] = K.clamp(0.5 + (h(x - 1, y) - h(x + 1, y)) * 1.6) * 255; out[o + 1] = K.clamp(0.5 + (h(x, y + 1) - h(x, y - 1)) * 1.6) * 255; out[o + 2] = h(x, y) * 255;
      let c = 0; for (const [kx, ky, ph, am] of waves) c += am * Math.cos((kx * x + ky * y) / N * 6.283 + ph);
      out[o + 3] = K.clamp(0.5 + c * 0.085) * 255;
    }
    const tex = new THREE.DataTexture(out, N, N, THREE.RGBAFormat);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.anisotropy = 8; tex.needsUpdate = true;
    return { tex, bump };
  }

  // ---------------------------------------------------------------- the relief material
  // Turns a standard material into pressed relief with real depth. The surface lies in the mesh's local XY plane, facing
  // +Z. `height` is GLSL for `float reliefH(vec2 p)`, the height at local point p, between `low` and `top` (the mesh
  // itself is the `top` level). `surface` is GLSL that runs per pixel with `p` (the point actually seen), the relief
  // normal `n`, the height `h0` and the three map samples ready, and may set diffuseColor, roughnessFactor,
  // metalnessFactor and rSpec. Per pixel the shader
  //   1. walks the eye ray down through the height field (parallax occlusion), so the near wall of an impression hides
  //      part of its floor, the far wall is seen in full, and everything shifts correctly when the camera moves;
  //   2. takes the normal from the height by differences;
  //   3. walks from that point toward the key light, so the relief throws its own shadow and it turns with the light.
  function reliefMaterial(THREE, mat, o) {
    const uniforms = Object.assign({ tShape: { value: o.maps.shape }, tSoft: { value: o.maps.soft }, tHalo: { value: o.maps.halo }, tFibre: { value: o.fibre },
      uSize: { value: new THREE.Vector2(o.size[0], o.size[1]) }, uTop: { value: o.top }, uLow: { value: o.low }, uLightL: { value: new THREE.Vector3(0, 0, 10) } }, o.uniforms);
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, uniforms);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vRl, vRt, vRb, vRn;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRl = position; vRt = normalMatrix * vec3(1.0, 0.0, 0.0); vRb = normalMatrix * vec3(0.0, 1.0, 0.0); vRn = normalMatrix * vec3(0.0, 0.0, 1.0);');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        uniform sampler2D tShape, tSoft, tHalo, tFibre; uniform vec2 uSize; uniform float uTop, uLow; uniform vec3 uLightL;
        varying vec3 vRl, vRt, vRb, vRn;
        float rShadow = 1.0, rSpec = 1.0;   // the relief's own shadow, and how much mirror-like reflection the surface keeps
        vec2 rPx, rPy;                      // how p changes per screen pixel on the flat mesh: keeps texture filtering steady after the trace
        #define ART(tex, p) textureGrad(tex, (p) / uSize + 0.5, rPx / uSize, rPy / uSize)
        vec4 fibre(vec2 q, vec2 s) { return textureGrad(tFibre, q * s, rPx * s, rPy * s); }
        ${o.height}
        vec2 reliefTrace(vec2 p, vec3 V) {   // V points to the eye; returns the point of the height field the eye really sees
          vec2 slide = -V.xy / max(V.z, 0.15); float range = uTop - uLow, d0 = 0.0, g0 = uTop - reliefH(p), d = range;
          for (int i = 1; i <= 24; i++) {
            float di = range * float(i) / 24.0, g = uTop - reliefH(p + slide * di) - di;
            if (g <= 0.0) { d = mix(d0, di, g0 / max(g0 - g, 1e-5)); break; }
            d0 = di; g0 = g;
          }
          return p + slide * d;
        }
        vec3 reliefNormal(vec2 p, float e) {
          return normalize(vec3(reliefH(p - vec2(e, 0.0)) - reliefH(p + vec2(e, 0.0)), reliefH(p - vec2(0.0, e)) - reliefH(p + vec2(0.0, e)), 2.0 * e));
        }
        float reliefShadow(vec2 p, float h0, vec3 L, float reach, float soft) {
          if (L.z <= 0.0) return 1.0;
          float slope = L.z / max(length(L.xy), 1e-4), occ = 0.0; vec2 dir = normalize(L.xy);
          for (int i = 1; i <= 14; i++) { float d = reach * float(i) / 14.0; occ = max(occ, reliefH(p + dir * d) - h0 - d * slope); }
          return 1.0 - smoothstep(0.0, soft, occ);
        }`)
        .replace('#include <normal_fragment_maps>', `{
          rPx = dFdx(vRl.xy); rPy = dFdy(vRl.xy);
          vec2 p = reliefTrace(vRl.xy, normalize(vec3(dot(vViewPosition, vRt), dot(vViewPosition, vRb), dot(vViewPosition, vRn))));
          vec3 shape = ART(tShape, p).rgb, soft = ART(tSoft, p).rgb, halo = ART(tHalo, p).rgb;
          float h0 = reliefH(p); vec3 n = reliefNormal(p, 0.006), toLight = normalize(uLightL - vec3(p, h0 - uTop));
          ${o.surface}
          normal = normalize(vRt * n.x + vRb * n.y + vRn * n.z);
        }`)
        .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\nreflectedLight.directDiffuse *= rShadow; reflectedLight.directSpecular *= rShadow * rSpec; reflectedLight.indirectSpecular *= rSpec;');
    };
    mat.customProgramCacheKey = () => o.height + o.surface;   // two relief materials must not share one compiled shader
    mat.userData.u = uniforms;
    return mat;
  }

  registerStyle({
    id: 'embossed',
    name: 'Embossed',
    family: 'Flat content made physical',
    look: 'Words and one small mark pressed into thick cotton paper and filmed in macro: grey-blue letterpress sunk deep enough to see the walls of the impression and the shadow inside it, a ruler scale embossed blind (raised, no ink), and a copper foil stamp, on a deckle-edged sheet lying on a dark press bed.',
    motion: 'You watch it being made. A brass plate with the type standing up in mirror image swings down, squeezes the sheet and lifts to show the impression; a ribbon of foil is laid over one spot, a heated die on a lever arm stamps it, and the spent foil is peeled back to leave the metal mark.',
    light: 'One low, hard raking lamp from the side, so every impression has a bright far wall and a shadow inside, with dim warm fill. The lamp slides round at the end so the relief turns, and a glint runs across the foil.',
    materials: 'Toothy cream cotton paper that is smoother where it was compressed, ink lying on the floor of the impression with bare paper walls and small bare specks, mirror-bright copper foil, etched brass with wet ink on the type, grey steel.',
    camera: 'A long lens with shallow focus, one continuous move: low against the open plate, down with its edge to the paper, then a slow pass a few letters wide just above the sheet that arrives at the foil work, then up and back until the whole card fills the frame.',
    post: 'Real depth of field and motion blur, soft bloom only on the foil and brass glints, filmic contrast, a gentle vignette and fine grain.',
    explains: 'Any quote, name, number or simple logo: it is drawn flat on a canvas and pressed into the material, so the statement arrives as a finished, tactile object. Best for one line that should feel permanent, with one small mark picked out in foil.',
    topic: 'The saying "Measure twice, cut once." letterpressed into paper, with a foil-stamped carpenter\'s square',
    duration: 8,
    fonts: ['italic 400 300px "Fraunces"', '500 300px "Fraunces"'],
    render: { samples: 48, shutter: 0.4, tone: 'filmic', exposure: 1.0, bloom: 0.4, bloomThreshold: 1.3, vignette: 0.36, grain: 0.028, fov: 24, background: '#050403' },

    build(S) {
      const { THREE, K, scene, camera } = S;
      const L = layout(), maps = reliefMaps(K, ART_W, ART_H, (ctx, layer) => drawArt(ctx, layer, L)), fibre = fibreMaps(THREE, K);
      const MARK = [(L.mark.x / ART_W - 0.5) * CARD_W, (0.5 - L.mark.y / ART_H) * CARD_H], MARK_S = L.mark.s / U;   // the foil mark, in page units
      const PAPER_T = 0.09;
      // Everything is laid out like the artwork: X to the right, Y up the page, Z off the paper. `table` lays that
      // flat on the floor, and world() converts a point given in page coordinates for the kit's camera and lights.
      const table = new THREE.Group(); table.rotation.x = -Math.PI / 2; scene.add(table);
      const world = (p) => [p[0], p[2], -p[1]];

      // ---- light: one low lamp from the left does all the modelling and slides round during the clip. The environment
      // is dim fill plus soft boxes for the metal to reflect. A weak second lamp is kept on the mirror line between the
      // camera and the foil mark and swept across it at the end: too weak to light the paper, but the foil flashes.
      K.env(S, { top: '#1d1915', horizon: '#3a332b', bottom: '#0c0a08', intensity: 0.75, panels: [
        { pos: world([0, 34, 22]), size: [56, 16], color: '#ffe9cf', power: 1.7 },     // across the table: a low camera sees it in the foil and the wet ink
        { pos: world([-8, -40, 9]), size: [46, 12], color: '#ffe9cf', power: 3 },      // behind the camera, for the metal edges that face it
        { pos: world([0, 8, 40]), size: [22, 22], color: '#ffe6c4', power: 0.5 },      // overhead, so the foil is never dead from above
        { pos: world([-5, -22, -30]), size: [22, 30], color: '#ffd9a6', power: 3.2 },   // below: stands in for the lit paper under the open plate
        { pos: world([30, -8, 14]), size: [14, 20], color: '#9db4d6', power: 1.2 },    // cool kick from the right
      ] });
      const key = K.spot(S, { target: world([1.5, 0, 0]), color: '#ffe3bf', power: 28000, angle: 0.2, penumbra: 1, soft: 1.3, far: 100 });
      const keyPos = K.path([[0, [-43, -16, 8.4]], [T.sweep, [-45, -13, 8.6]], [T.rest, [-41, 15, 9.0]], [8.6, [-40, 18, 9.0]]]);
      const glint = K.spot(S, { color: '#fff0da', power: 400, angle: 0.3, penumbra: 1, shadow: false });
      const glintOff = K.path([[T.sweep, -10], [T.flash, -0.3], [T.rest + 0.2, 1.5], [8.6, 1.9]]);   // sideways distance from the mirror line

      // ---- the sheet: a deckle-edged slab whose top face is the relief material
      const paper = reliefMaterial(THREE, new THREE.MeshStandardMaterial({ color: PAPER, roughness: 0.94 }), {
        maps, fibre: fibre.tex, size: [CARD_W, CARD_H], top: 0.03, low: -0.05,
        uniforms: { uInkIn: { value: 0 }, uFoilIn: { value: 0 }, uWet: { value: 0 }, uInk: { value: new THREE.Color(INK) }, uFoil: { value: new THREE.Color(FOIL) } },
        height: `uniform float uInkIn, uFoilIn, uWet; uniform vec3 uInk, uFoil;
          float reliefH(vec2 p) {   // type pressed 0.05 deep, the blind ruler raised 0.03, the foil die pressed 0.03 deep
            vec3 s = ART(tSoft, p).rgb;
            return (0.03 * smoothstep(0.1, 0.9, s.b) - 0.05 * smoothstep(0.08, 0.92, s.r)) * uInkIn - 0.03 * smoothstep(0.08, 0.92, s.g) * uFoilIn;
          }`,
        surface: `
          vec4 fine = fibre(p, vec2(0.3)), coarse = fibre(p.yx + 2.8, vec2(0.11));
          float cloud = coarse.a, pressed = smoothstep(0.15, 0.85, max(soft.r * uInkIn, soft.g * uFoilIn));
          float dip = max(halo.r * uInkIn, halo.g * uFoilIn);                                          // the halo of compressed paper round a mark
          vec2 rim = 0.5 * uSize - abs(p); float edge = smoothstep(0.4, 0.0, min(rim.x, rim.y));     // the sheet thins and fluffs toward the deckle
          vec2 tooth = (fine.rg - 0.5) * 0.4 + (coarse.rg - 0.5) * 0.38;
          n = normalize(vec3(n.xy + tooth * mix(0.5, 0.1, pressed) * (1.0 + 2.0 * edge) + sign(p) * step(rim, rim.yx) * edge * edge * 0.5, n.z));
          rShadow = reliefShadow(p, h0, toLight, 0.34, 0.005);
          diffuseColor.rgb *= (0.95 + 0.1 * cloud) * (1.0 - 0.07 * dip) * (1.0 - 0.07 * smoothstep(0.62, 0.8, coarse.b)) + 0.05 * edge;
          roughnessFactor = 0.95 - 0.16 * pressed; rSpec = 0.6;
          // letterpress ink lies on the floor of the impression; the upper walls stay bare paper, which is what shows
          // the depth. It is thinner in the middle of a stroke and missing where a fibre sat low.
          float salt = smoothstep(0.36, 0.30, fibre(p + 3.3, vec2(0.21)).b) + 0.4 * smoothstep(0.35, 0.29, fine.b);
          float ink = smoothstep(0.6, 0.72, soft.r) * (1.0 - 0.4 * min(salt, 1.0)) * uInkIn;
          vec3 inkC = uInk * (0.6 + 0.8 * cloud) * (1.0 + 0.5 * smoothstep(0.85, 1.0, soft.r));
          diffuseColor.rgb = mix(diffuseColor.rgb, inkC, ink);
          roughnessFactor = mix(roughnessFactor, mix(0.8, 0.34, uWet) + 0.14 * (cloud - 0.5), ink); rSpec = mix(rSpec, mix(0.25, 1.0, uWet), ink);
          // foil: metal lying in its own shallower impression
          float foil = smoothstep(0.4, 0.6, shape.g) * uFoilIn;
          diffuseColor.rgb = mix(diffuseColor.rgb, uFoil, foil); metalnessFactor = foil; roughnessFactor = mix(roughnessFactor, 0.17 + 0.1 * cloud, foil); rSpec = mix(rSpec, 1.0, foil);`,
      });
      {
        const n = K.noise(7), pts = [], hw = CARD_W / 2, hh = CARD_H / 2, per = 2 * (CARD_W + CARD_H), step = 0.012;
        for (let s = 0; s < per; s += step) {
          const q = s < CARD_W ? [-hw + s, -hh, 0, 1] : s < CARD_W + CARD_H ? [hw, -hh + s - CARD_W, -1, 0] : s < 2 * CARD_W + CARD_H ? [hw - (s - CARD_W - CARD_H), hh, 0, -1] : [-hw, hh - (s - 2 * CARD_W - CARD_H), 1, 0];
          const off = 0.12 + 0.08 * n.fbm(s * 0.8, 1.3) + 0.04 * n.fbm(s * 3.5, 4.1, 0, 3) + 0.06 * Math.max(0, n.n2(s * 1.9, 9.2) - 0.4);
          pts.push(new THREE.Vector2(q[0] + q[2] * off, q[1] + q[3] * off));
        }
        for (let pass = 0; pass < 3; pass++) { const c = pts.map((v) => v.clone()), N = c.length; pts.forEach((v, i) => v.copy(c[(i + N - 2) % N]).add(c[(i + N - 1) % N]).add(c[i]).add(c[(i + 1) % N]).add(c[(i + 2) % N]).multiplyScalar(0.2)); }   // soften corners and nicks
        // the bevel thins the sheet to a soft feathered rim instead of a cut cliff
        const geo = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: PAPER_T - 0.07, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.05, bevelSegments: 3 }); geo.translate(0, 0, -PAPER_T + 0.035);
        const side = new THREE.MeshStandardMaterial({ color: '#f4ecdc', roughness: 1, bumpMap: fibre.bump, bumpScale: 3 });
        const sheet = new THREE.Mesh(geo, [paper, side]); sheet.castShadow = true; sheet.receiveShadow = true; table.add(sheet);
      }
      // the press bed: dark, matte, slightly grained, so the sheet is the only bright thing in the room
      const bedTex = fibre.bump.clone(); bedTex.repeat.set(26, 26); bedTex.needsUpdate = true;
      const bed = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ color: '#1b1612', roughness: 0.82, bumpMap: bedTex, bumpScale: 1.5 }));
      bed.position.z = -PAPER_T; bed.receiveShadow = true; table.add(bed);

      // ---- the plate: a brass die with the type standing up in mirror image, on a steel platen hinged at the far edge
      const DIE_W = 13.7, DIE_H = 7.0, HINGE = [CARD_H / 2 + 1.5, 0.75];   // hinge line: y and z
      const hinge = new THREE.Group(); hinge.position.set(0, HINGE[0], HINGE[1]); table.add(hinge);
      const forme = new THREE.Group(); forme.position.set(0, -HINGE[0], -HINGE[1]); hinge.add(forme);
      const steel = new THREE.MeshStandardMaterial({ color: '#4a4d52', roughness: 0.5, metalness: 0.6 });
      const brassMat = new THREE.MeshStandardMaterial({ color: '#d9ac5f', roughness: 0.36, metalness: 1 });
      const part = (parent, geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
      part(forme, K.roundedBox(DIE_W, DIE_H, 0.34, 0.03, 3), brassMat, 0, 0, 0.174);
      part(forme, K.roundedBox(DIE_W + 0.5, DIE_H + 1.4, 0.6, 0.07, 4), steel, 0, 0.9, 0.64);                                 // platen
      for (const y of [-1.9, 0.3, 2.5]) part(forme, K.roundedBox(DIE_W + 0.5, 0.5, 0.3, 0.06, 4), steel, 0, y, 1.05);          // stiffening ribs on its back
      for (const sx of [-1, 1]) for (const y of [-1.1, 1.1]) part(forme, new THREE.CylinderGeometry(0.2, 0.2, 0.14, 24), brassMat, sx * (DIE_W / 2 - 0.6), y, 1.0).rotation.x = Math.PI / 2;
      part(hinge, new THREE.CylinderGeometry(0.3, 0.3, DIE_W + 3, 32), steel, 0, 0, 0).rotation.z = Math.PI / 2;
      const plate = reliefMaterial(THREE, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3, metalness: 1 }), {
        maps, fibre: fibre.tex, size: [CARD_W, -CARD_H], top: 0.07, low: -0.03,   // the face looks down, so the art is mirrored: negative height flips it
        uniforms: { uUsed: { value: 0 }, uInk: { value: new THREE.Color(INK) } },
        height: `uniform float uUsed; uniform vec3 uInk;
          float reliefH(vec2 p) { vec3 s = ART(tSoft, p).rgb; return 0.07 * smoothstep(0.3, 0.7, s.r) - 0.03 * smoothstep(0.3, 0.7, s.b); }   // type stands up, the ruler is cut in`,
        surface: `
          vec4 lines = fibre(p, vec2(0.017, 0.8)), pit = fibre(p, vec2(0.31));
          float up = smoothstep(0.4, 0.6, shape.r);
          n = normalize(vec3(n.xy + mix((pit.rg - 0.5) * 0.4, vec2(0.0, (lines.g - 0.5) * 0.2), up), n.z));   // etched floor is pitted, faces are ground flat
          rShadow = reliefShadow(p, h0, toLight, 0.4, 0.012);
          diffuseColor.rgb = mix(vec3(0.62, 0.40, 0.16), vec3(0.98, 0.76, 0.38), up) * (1.0 - 0.5 * smoothstep(0.4, 0.6, shape.b)); roughnessFactor = mix(0.42, 0.24 + 0.1 * lines.b, up);
          float film = up * mix(1.0, 0.25 + 0.6 * pit.a, uUsed);                                             // ink on the type, patchy once it has printed
          diffuseColor.rgb = mix(diffuseColor.rgb, uInk * 0.5, film); metalnessFactor = 1.0 - film; roughnessFactor = mix(roughnessFactor, 0.22, film); rSpec = 1.0 - 0.6 * film;`,
      });
      const face = part(forme, new THREE.PlaneGeometry(DIE_W, DIE_H), plate, 0, 0, 0.003); face.rotation.x = Math.PI; face.castShadow = false;
      const OPEN0 = 1.0, OPEN1 = 1.42;   // opening angle on frame one and after the print, radians
      const plateAngle = (t) => (t < T.hit ? OPEN0 * (1 - Math.pow(K.clamp(t / T.hit), 2.3)) : OPEN1 * K.seg(t, T.lift, T.open, K.ease.inOut));

      // ---- hot foil: a strip of copper foil, and the heated die on a lever arm that stamps it
      const ROLL = -0.09, SL = 5.6, SW = 1.9, S0 = 1.3, NS = 64, NW = 12;   // strip: angle on the page, length, width, where the mark sits along it
      const stripGeo = new THREE.PlaneGeometry(SL, SW, NS, NW);
      const hole = K.canvasTex(1024, Math.round(1024 * SW / SL), (ctx, w, h) => {      // spent foil: the mark has left the strip
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.translate(S0 / SL * w, h / 2); ctx.rotate(-ROLL);
        ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = ctx.strokeStyle = '#fff'; drawMark(ctx, MARK_S / SL * w);
      }, { data: true });
      // the carrier side is bright metal, the side that touched the paper is paler and duller, so the peel reads
      const foilMat = (top, spent) => new THREE.MeshStandardMaterial(Object.assign({ color: top ? '#d6844a' : '#b98a6c', metalness: top ? 1 : 0.3, roughness: top ? 0.24 : 0.6, side: top ? THREE.FrontSide : THREE.BackSide }, spent ? { alphaMap: hole, alphaTest: 0.5 } : {}));
      const strips = [true, false].map((top) => { const m = new THREE.Mesh(stripGeo, null); m.userData.mats = [foilMat(top, false), foilMat(top, true)]; m.position.set(MARK[0], MARK[1], 0); m.rotation.z = ROLL; m.castShadow = top; m.receiveShadow = true; m.frustumCulled = false; table.add(m); return m; });
      // the strip's shape at time t: slid in from the right, lying flat, then peeled from its near left corner. The
      // peel line travels across the strip at an angle; everything behind it is rolled back over a small radius.
      const CURL = 0.45, TURN = 2.5, PEEL = 0.55, pc = Math.cos(PEEL), ps = Math.sin(PEEL);
      const Q0 = -S0 * pc - SW / 2 * ps, Q1 = (SL - S0) * pc + SW / 2 * ps;
      function poseStrip(t) {
        const p = stripGeo.attributes.position, laid = K.seg(t, T.strip, T.laid, K.ease.outQuint), off = K.seg(t, T.peeled - 0.3, T.peeled + 0.4, K.ease.in);
        const u = K.seg(t, T.peel, T.peeled), front = K.lerp(Q0 - 0.1, Q1 + 0.5, 0.6 * u + 0.4 * u * u * (3 - 2 * u));   // a steady pull
        for (let j = 0; j <= NW; j++) for (let i = 0; i <= NS; i++) {
          const x0 = i / NS * SL - S0, y0 = SW / 2 - j * SW / NW, r = -x0 * ps + y0 * pc, d = front - (x0 * pc + y0 * ps);
          let q = x0 * pc + y0 * ps, z = 0.04 + 0.012 * Math.sin(x0 * 2.1 + y0 * 1.7) + 0.016 * Math.sin(y0 * 6.5 + x0 * 0.7) + 0.05 * y0 * y0 * (1 - laid) + (1 - laid) * (0.7 + 0.35 * Math.sin(x0 * 0.9));   // foil is never quite flat
          if (d > 0) { const a = Math.min(d / CURL, TURN), ex = Math.max(0, d - CURL * TURN); q = front - CURL * Math.sin(a) - ex * Math.cos(TURN); z += CURL * (1 - Math.cos(a)) + ex * Math.sin(TURN); }
          p.setXYZ(j * (NS + 1) + i, q * pc - r * ps + (1 - laid) * 11 + off * 12, q * ps + r * pc + off * 3, z + off * 6);
        }
        p.needsUpdate = true; stripGeo.computeVertexNormals();
        for (const m of strips) { m.visible = t > T.strip && t < T.peeled + 0.4; m.material = m.userData.mats[t >= T.stamp ? 1 : 0]; }
      }
      const ARM = 10.5, ARM_Z = 1.25, ARM_UP = 0.9;   // lever length, pivot height, raised angle
      const arm = new THREE.Group(); arm.position.set(MARK[0] + ARM, MARK[1], ARM_Z); table.add(arm);
      part(arm, K.roundedBox(1.8, 1.8, 0.75, 0.06, 4), brassMat, -ARM, 0, 0.405 - ARM_Z);                      // the heated die holder
      part(arm, new THREE.CylinderGeometry(0.66, 0.66, 0.24, 40), steel, -ARM, 0, 0.9 - ARM_Z).rotation.x = Math.PI / 2;
      part(arm, K.roundedBox(ARM + 2.2, 0.9, 0.5, 0.1, 4), steel, -ARM / 2 + 0.3, 0, 0);
      for (const y of [-0.3, 0.3]) part(arm, new THREE.CylinderGeometry(0.13, 0.13, 0.1, 20), brassMat, -ARM, y, 0.28).rotation.x = Math.PI / 2;

      // ---- camera: one move. From the plate's face down to its edge on the paper; then, as the plate lifts, a slow
      // low pass along the lettering (about 27 degrees above the paper, close enough for three or four letters) that
      // arrives at the foil work; then up and back until the whole card fills the frame.
      const cam = {
        pos: K.path([[0, [-5.0, -13.4, 2.6]], [T.hit, [-4.4, -11.4, 3.0]], [2.4, [-1.0, -7.4, 3.6]], [4.3, [1.6, -7.6, 3.6]], [5.5, [2.9, -7.9, 3.9]], [6.6, [1.0, -7.9, 17.0]], [8.6, [0.15, -6.8, 21.2]]]),
        aim: K.path([[0, [-0.6, 1.6, 4.5]], [T.hit, [-1.0, -3.6, 0.2]], [2.4, [-0.2, -0.2, 0]], [4.3, [2.0, -0.35, 0]], [5.5, [3.0, -0.4, 0]], [6.6, [0.4, -0.2, 0]], [8.6, [0.15, -0.4, 0]]]),
        ap: K.track([[0, 0.1], [T.hit, 0.13], [2.4, 0.06], [5.5, 0.06], [8.6, 0.05]]),
      };
      const v = new THREE.Vector3();

      return {
        update(t) {
          key.position.set(...world(keyPos(t)));
          // the plate
          hinge.rotation.x = -plateAngle(t); table.updateMatrixWorld(true);
          plate.userData.u.uLightL.value.copy(face.worldToLocal(v.copy(key.position)));
          plate.userData.u.uUsed.value = t >= T.hit ? 1 : 0;
          hinge.visible = t < 3.3;   // by now the low camera cannot see it, and it must not shade the card when the lamp moves round
          // the sheet: each impression exists from the moment its die is down (the die hides the change)
          const pu = paper.userData.u;
          table.worldToLocal(pu.uLightL.value.copy(key.position));
          pu.uInkIn.value = t >= T.hit ? 1 : 0; pu.uFoilIn.value = t >= T.stamp ? 1 : 0;
          pu.uWet.value = 1 - K.seg(t, T.lift, T.lift + 3.5);
          // foil strip and stamp
          poseStrip(t);
          arm.rotation.y = ARM_UP * (1 - K.seg(t, T.laid - 0.3, T.stamp, K.ease.in) + K.seg(t, T.stampLift, T.stampGone, K.ease.inOut));
          arm.visible = t > T.laid - 0.3 && t < T.stampGone;
          const c = cam.pos(t), a = cam.aim(t);
          K.look(camera, world(c), world(a)); K.focus(camera, world(a), cam.ap(t));
          // the glint lamp: mirror the camera in the paper at the mark, go 30 units out along that line, then step aside
          const m = [MARK[0] - c[0], MARK[1] - c[1], c[2]], k = 30 / Math.hypot(...m);
          glint.position.set(...world([MARK[0] + m[0] * k + glintOff(t), MARK[1] + m[1] * k, m[2] * k])); glint.target.position.set(...world([MARK[0], MARK[1], 0]));
          glint.visible = t > T.sweep;
        },
      };
    },

    sound(k) {
      k.bed('room', 0, 8, { gain: 1.0 });
      k.play('whoosh', T.hit - 0.6, { gain: 0.4, dur: 0.6, top: 900 });                                          // the plate swings down
      k.play('press', T.hit, { gain: 1.0 }); k.play('thud', T.hit + 0.01, { gain: 0.6, f: 70 }); k.play('paper', T.hit + 0.03, { gain: 0.35, dur: 0.2 });
      k.play('tock', T.lift, { gain: 0.5, f: 300 }); k.play('paper', T.lift + 0.05, { gain: 0.5, dur: 0.5 });     // it unsticks and lifts
      k.play('swish', T.strip + 0.05, { gain: 0.5, dur: 0.35 }); k.play('paper', T.laid - 0.15, { gain: 0.3, dur: 0.15 });   // the foil ribbon
      k.play('stamp', T.stamp, { gain: 0.9 }); k.play('tock', T.stamp + 0.02, { gain: 0.4, f: 520 });             // the lever lands
      k.noise(T.stamp + 0.04, { dur: T.stampLift - T.stamp, filter: 'highpass', f: 6500, gain: 0.05, a: 0.02 });  // the hot die hisses on the foil
      k.play('tick', T.stampLift, { gain: 0.5, f: 2600 });
      k.play('tape', T.peel, { gain: 0.9, dur: T.peeled - T.peel - 0.1 }); k.play('swish', T.peeled - 0.15, { gain: 0.35, dur: 0.3 });
      k.play('sparkle', T.flash - 0.2, { gain: 0.7, n: 5 }); k.play('ding', T.flash, { gain: 0.45, f: 'E6' });    // the glint crosses the foil
      k.music('pad', T.sweep - 0.3, 8, { bpm: 60, chords: [['D3', 'A3', 'F#4', 'A4']], gain: 0.8 });
    },
  });
}
```
