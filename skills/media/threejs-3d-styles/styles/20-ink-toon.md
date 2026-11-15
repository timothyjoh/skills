# Ink and Toon (#20)

- **id:** `ink-toon`
- **Category:** Filters over 3D
- **Use:** explainer
- **Reference duration:** 8 s
- **Google Fonts:** Anton, Caveat
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`

## Style card

- **Look:** Real 3D that reads as a hand-inked animation cel: flat colour in two tones, a brush line round every shape, halftone dots where light turns to shadow and pen hatching inside cast shadows, printed on warm paper inside a ruled panel.
- **Motion:** Snap, not glide. Props are drawn on twos (15 drawings a second) and jump between held poses with a stretched in-between, an overshoot and a quick settle; speed lines, impact ticks and steam squiggles are drawn in for two or three frames. The camera alone moves on every frame.
- **Light:** One hard sun, low and from the side, placed for the shape of the shadow rather than for realism. No fill light: the shadow colour of each material is picked by hand, shifted towards the cool ground colour.
- **Materials:** No textures. Each material is a lit colour, a shadow colour and, on glossy things, one hard white glint. Paper, one ink and four spot colours do everything.
- **Camera:** Long lens, looking down at a table-top from the front. It drifts slowly while a pose is held and whips to the next framing in a third of a second, one framing per step.
- **Finish:** No blur, bloom or grain. A print filter lets every edge wander by a pixel and re-draws it six times a second, multiplies paper tooth through the colour and rules an ink border round the panel.
- **Good for:** Steps, recipes and how-tos with a few recognisable objects: each step is one bold action on the same hero object, named by a big lettered word and a hand-written caption box.

## Reference

- **Sample topic:** Pour-over coffee in three steps: grind, bloom, pour
- **Gallery description:** Real 3D that reads as a hand-inked animation cel: flat colour in two tones, a brush line round every shape, halftone dots where light turns to shadow and pen hatching inside cast shadows, printed on warm paper inside a ruled panel.
- **Shown in the sample clip:** Pour-over coffee in three steps: grind, bloom, pour

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/ink-toon.js`)

```js
{
  // ---------------------------------------------------------------- content (change this for a new topic)
  const STEPS = [
    { n: '1', word: 'GRIND', note: 'medium-fine' },
    { n: '2', word: 'BLOOM', note: 'wait 30 sec' },
    { n: '3', word: 'POUR', note: 'slow circles' },
  ];
  const ENDING = { word: 'ENJOY!', note: 'pour-over in three steps' };

  // ---------------------------------------------------------------- the print palette
  // Paper, one ink and four spot colours. Every colour has a hand-picked shadow partner (shifted in hue, not just
  // darker): that pair is what makes flat shading look drawn instead of rendered.
  const INK = '#1c1622', PAPER = '#f7ecd6';
  const PAL = {
    teal: { lit: '#2a9d94', shade: '#1c7376', deep: '#12565c' },
    tealDot: { lit: '#3db0a4', shade: '#1c7376', deep: '#12565c' },
    cream: { lit: '#f7e8cc', shade: '#b3c9bd' },
    paper: { lit: '#fffdf6', shade: '#c9dcd4' },
    persimmon: { lit: '#ee5a36', shade: '#ae2f33', gloss: '#ffd2bd' },
    mustard: { lit: '#f6b63c', shade: '#c9722c', gloss: '#fff1c4' },
    navy: { lit: '#3b4568', shade: '#222641', gloss: '#b4c0e6' },
    bean: { lit: '#6a3d27', shade: '#3c221b' },
    water: { lit: '#effbf6', shade: '#9fd8cf' },
  };
  const GROUNDS = { dry: ['#5d3624', '#39201a'], wet: ['#54301f', '#321a14'], brew: ['#8a5530', '#5a321f'] };   // [lit, shade]

  // ---------------------------------------------------------------- timing
  // Props are animated "on twos": one drawing is held for two frames (15 drawings a second at 30 fps) while the
  // camera moves on every frame. Every event time sits on that grid, so picture and sound land on the same frame;
  // the steps change on the bars of a 120 bpm beat (2 s each).
  const DPS = 15, F = 1 / DPS, at = (n) => n / DPS;
  const T = { grindEnd: at(20), burst: at(22), land: at(26), cut2: at(30), lab2: at(34), tilt2: at(37), wet0: at(39), wet1: at(45), cut3: at(60), lab3: at(64),
    pour0: at(65), pour1: at(85), away: at(87), hop: at(89), cut4: at(90), lab4: at(98), ting: at(101) };
  const BUBBLES = 8, bubbleAt = (i) => T.wet1 + F * (1 + Math.floor(i * 1.4));   // when each bloom bubble appears; it pops two drawings later

  // ---------------------------------------------------------------- the look, as reusable pieces
  // inkKit(S) returns everything that makes the style: the banded fill material, the ink outline, turned shapes,
  // brush-stroke marks, lettering and the paper/print finish. A new topic builds different objects with the same kit.
  function inkKit(S, o = {}) {
    const { THREE, K } = S, px = S.H / 1080;
    const G = { res: { value: new THREE.Vector2(S.W, S.H) }, light: { value: new THREE.Vector3(0, 1, 0) }, up: { value: new THREE.Vector3(0, 1, 0) }, seed: { value: 0 }, pitch: { value: (o.pitch || 11) * px } };
    const srgb = (hex) => new THREE.Vector3(parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255);

    // One hard sun. Its direction is the "hand-placed shadow shape": low and from the side gives big readable shadows.
    const sun = K.sun(S, { pos: o.sun || [-6.2, 6.2, 4.8], target: o.sunTarget || [0.3, 1, 0], power: Math.PI, size: o.sunSize || 6.5, mapSize: 4096, normalBias: 0.03 });

    // FILL. MeshToonMaterial with a plain 0..1 ramp as its gradient map, so three.js hands us one number per pixel:
    // how lit it is (half-Lambert times the cast shadow). The patch turns that number into print: lit colour, shadow
    // colour, a band of halftone dots where light turns into shadow, optional hatching inside the shadow, and a
    // hard-edged highlight (a round glint, or a vertical streak down turned shapes).
    const ramp = new THREE.DataTexture(new Uint8Array(1024).map((_, i) => (i % 4 === 3 ? 255 : i >> 2)), 256, 1);
    ramp.minFilter = ramp.magFilter = THREE.LinearFilter; ramp.needsUpdate = true;
    const FILL_PARS = `
      uniform vec3 uLit, uShade, uDeep, uGloss, uUp; uniform float uThr, uBand, uPitch, uHatch, uGlossSize, uStreak;`;
    const FILL_MAIN = `{
      float v = outgoingLight.r;                                            // 0 = in shadow, 1 = facing the light
      float k = clamp((v - uThr) / max(uBand, 1e-4), 0.0, 1.0);             // 0 at the shadow edge, 1 in full light
      vec2 g = mat2(0.819, 0.574, -0.574, 0.819) * gl_FragCoord.xy / uPitch;   // dot screen, turned 35 degrees, fixed to the page
      float rad = 0.74 * (1.0 - k), aa = 0.8 / uPitch;                      // dots grow until they merge into solid shadow
      float tone = v < uThr ? 1.0 : (1.0 - smoothstep(rad - aa, rad + aa, length(fract(g) - 0.5))) * step(k, 0.999);
      vec3 c = mix(uLit, uShade, tone);
      if (uHatch > 0.0) {                                                   // pen hatching inside the shadow
        float sp = uPitch * 1.3, h = abs(fract((gl_FragCoord.x + gl_FragCoord.y) / sp) - 0.5) * sp;
        float lw = uHatch * (0.75 + 0.5 * sin(gl_FragCoord.x * 0.011 - gl_FragCoord.y * 0.017));
        c = mix(c, uDeep, (1.0 - smoothstep(lw - 0.7, lw + 0.7, h)) * step(v, uThr));
      }
      #if NUM_DIR_LIGHTS > 0
        vec3 hv = normalize(directionalLights[0].direction + normalize(vViewPosition));
        float lit = step(uThr + uBand, v);
        if (uGlossSize > 0.0) c = mix(c, uGloss, step(1.0 - uGlossSize, dot(normal, hv)) * lit);
        if (uStreak > 0.0) {                                                // the long glint down a turned shape
          float ny = dot(normal, uUp); vec3 nh = normalize(normal - uUp * ny), hh = normalize(hv - uUp * dot(hv, uUp));
          c = mix(c, uGloss, step(1.0 - uStreak, dot(nh, hh)) * step(abs(ny), 0.55) * lit);
        }
      #endif
      outgoingLight = c;
    }`;
    function fill(c, f = {}) {
      const m = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: ramp, side: f.side || THREE.FrontSide });
      const u = m.userData.u = { uLit: { value: new THREE.Color(c.lit) }, uShade: { value: new THREE.Color(c.shade) }, uDeep: { value: new THREE.Color(c.deep || c.shade) }, uGloss: { value: new THREE.Color(c.gloss || '#ffffff') },
        uUp: G.up, uPitch: G.pitch, uThr: { value: f.thr == null ? 0.56 : f.thr }, uBand: { value: f.band == null ? 0.1 : f.band }, uHatch: { value: (f.hatch || 0) * px }, uGlossSize: { value: f.gloss || 0 }, uStreak: { value: f.streak || 0 } };
      m.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, u);
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + FILL_PARS).replace('#include <opaque_fragment>', FILL_MAIN + '\n#include <opaque_fragment>');
      };
      return m;
    }

    // OUTLINE: the inverted hull. A back-faced copy of the mesh in ink, pushed outwards along its normals by a number
    // of screen pixels. The push is not even: it swells on the side away from the light, thins towards the light and
    // wavers along the form, like a brush line. Needs smooth normals (turned, rounded and tube shapes all have them).
    function hull(width, color) {
      return new THREE.ShaderMaterial({
        side: THREE.BackSide,
        uniforms: { uRes: G.res, uLight: G.light, uSeed: G.seed, uWidth: { value: width * px }, uColor: { value: new THREE.Color(color) } },
        vertexShader: `uniform vec2 uRes; uniform vec3 uLight; uniform float uWidth, uSeed;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vec3 n = normalize(normalMatrix * normal);
            float waver = 0.6 * sin(dot(position, vec3(7.1, 5.3, 6.7)) + uSeed * 2.1) + 0.4 * sin(dot(position, vec3(-17.3, 12.9, 15.1)) + uSeed * 5.3);
            float w = uWidth * (1.0 + 0.3 * waver) * mix(0.55, 1.45, smoothstep(-0.6, 0.8, -dot(n, uLight)));
            // surfaces that face the ground come a little towards the lens, so the line survives where a prop stands on it
            mv.xyz *= 1.0 - 0.006 * smoothstep(0.85, 1.0, -normalize(mat3(modelMatrix) * normal).y);
            gl_Position = projectionMatrix * mv;
            gl_Position.xy += n.xy / max(length(n.xy), 0.35) * w * 2.0 / uRes * gl_Position.w;
          }`,
        fragmentShader: 'uniform vec3 uColor; void main() { gl_FragColor = vec4(uColor, 1.0); }',
      });
    }
    const outline = (mesh, width = 4.2, color = INK) => { const h = new THREE.Mesh(mesh.geometry, hull(width, color)); h.frustumCulled = false; mesh.add(h); return mesh; };
    // a filled, outlined, shadow-casting solid: the basic building block
    const solid = (geo, mat, parent, f = {}) => { const m = new THREE.Mesh(geo, mat); m.castShadow = f.cast !== false; m.receiveShadow = true; if (f.line !== 0) outline(m, f.line); if (parent) parent.add(m); return m; };

    const flat = (color) => new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
    // INNER LINES: a thin ink line round a turned shape at height y, drawn only part of the way (angles in degrees,
    // 0 = right, 90 = towards the camera) so it breaks off on the lit side. Thinner than the outline on purpose.
    const crease = (parent, r, y, a0 = -70, a1 = 105, w = 0.0085) => { const n = 28, pts = Array.from({ length: n + 1 }, (_, i) => { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; return [Math.cos(a) * r, y, Math.sin(a) * r]; });
      const m = new THREE.Mesh(K.tube(pts, w, { segments: 56, radial: 5 }), flat(INK)); parent.add(m); return m; };

    // TURNED SHAPES: a profile of [radius, height] points, corners softened, spun round the axis. Draw the profile from
    // the bottom of the axis, out, up the outside, over the lip and back down the inside, so the shape is closed.
    const soften = (pts, n = 2) => { for (; n > 0; n--) { const q = [pts[0]]; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } q.push(pts[pts.length - 1]); pts = q; } return pts; };
    const turned = (pts, seg = 64, n = 2) => new THREE.LatheGeometry(soften(pts, n).map(([r, y]) => new THREE.Vector2(r, y)), seg);

    // MARKS: brush strokes as flat geometry (speed lines, impact bursts, steam, arrows). strokes([[points, width,
    // taper], ...]) -> one geometry in the XY plane; taper 'both' | 'head' | 'tail' | 'none' thins the ends like a brush.
    function strokes(list, grow = 0) {
      const pos = [], idx = [];
      for (let [pts, w, taper = 'both'] of list) {
        while (pts.length < 5) pts = pts.flatMap((p, i) => (i ? [[(p[0] + pts[i - 1][0]) / 2, (p[1] + pts[i - 1][1]) / 2], p] : [p]));   // short strokes need points to taper over
        const n = pts.length, base = pos.length / 3;
        for (let i = 0; i < n; i++) {
          const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, u = i / (n - 1);
          const k = taper === 'both' ? Math.pow(Math.sin(Math.PI * u), 0.5) : taper === 'head' ? Math.pow(1 - u, 0.6) : taper === 'tail' ? Math.pow(u, 0.6) : 1;
          const hw = (w * k + grow * Math.min(1, k * 3)) / 2;
          pos.push(pts[i][0] - dy / l * hw, pts[i][1] + dx / l * hw, 0, pts[i][0] + dy / l * hw, pts[i][1] - dx / l * hw, 0);
          if (i < n - 1) idx.push(base + 2 * i, base + 2 * i + 1, base + 2 * i + 2, base + 2 * i + 1, base + 2 * i + 3, base + 2 * i + 2);
        }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
    }
        // an ink mark, or (with a colour) a coloured mark with an ink edge
    function mark(list, color, edge = 0.03) {
      const g = new THREE.Group();
      if (!color) { g.add(new THREE.Mesh(strokes(list), flat(INK))); return g; }
      g.add(new THREE.Mesh(strokes(list, edge * 2), flat(INK)));
      const top = new THREE.Mesh(strokes(list), flat(color)); top.position.z = 0.004; g.add(top);
      return g;
    }
    const arc = (r, a0, a1, n = 24, ry = r) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [Math.cos(a) * r, Math.sin(a) * ry]; });
    // radial impact ticks around an ellipse
    const burst = (n, rx, ry, len, w, seed = 1) => { const r = K.rng(seed); return Array.from({ length: n }, (_, i) => { const a = (i + r.range(-0.25, 0.25)) / n * Math.PI * 2, l = len * r.range(0.6, 1.25), c = Math.cos(a), s = Math.sin(a); return [[[c * rx, s * ry], [c * (rx + l * 0.5), s * (ry + l * 0.5)], [c * (rx + l), s * (ry + l)]], w, 'head']; }); };

    // LETTERING: display type drawn like a comic sound effect: slanted, cream face with a dot-screen fade, heavy ink
    // edge and a solid colour block behind it. Returns a flat mesh; `height` is the world height of a capital.
    function lettering(text, f = {}) {
      const fpx = 260, font = `${fpx}px "Anton"`, sk = -0.13, dep = 26, lw = 30, pad = 54, ls = '10px';
      const m = document.createElement('canvas').getContext('2d'); m.font = font; m.letterSpacing = ls;
      const mt = m.measureText(text), asc = Math.ceil(mt.actualBoundingBoxAscent), W = Math.ceil(mt.width + pad * 2 + dep + asc * -sk), H = asc + pad * 2 + dep, x = pad, y = pad + asc;
      const prep = (c) => { c.font = font; c.letterSpacing = ls; c.lineJoin = 'round'; c.textBaseline = 'alphabetic'; c.setTransform(1, 0, sk, 1, -sk * y, 0); c.lineWidth = lw; c.strokeStyle = INK; };
      const tex = K.canvasTex(W, H, (ctx) => {
        prep(ctx);
        for (let k = dep; k >= 0; k -= 2) ctx.strokeText(text, x + k, y + k);                    // ink round the whole block
        ctx.fillStyle = f.block || PAL.persimmon.lit; for (let k = dep; k > 0; k -= 1) ctx.fillText(text, x + k, y + k);   // the block
        ctx.strokeText(text, x, y); ctx.fillStyle = f.face || PAPER; ctx.fillText(text, x, y);   // the face
        const dots = document.createElement('canvas'); dots.width = W; dots.height = H; const d = dots.getContext('2d');   // dot-screen fade up from the baseline
        d.fillStyle = f.dots || PAL.mustard.lit;
        for (let j = -2; j < H / 13 + 2; j++) for (let i = -2; i < W / 13 + 2; i++) { const cx = i * 15 + (j % 2) * 7.5, cy = j * 13, r = 9.4 * K.clamp((cy - (y - asc * 0.62)) / (asc * 0.6)); if (r > 0.5) { d.beginPath(); d.arc(cx, cy, r, 0, 7); d.fill(); } }
        prep(d); d.globalCompositeOperation = 'destination-in'; d.fillStyle = '#000'; d.fillText(text, x, y);
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(dots, 0, 0);
      });
      const unit = (f.height || 0.6) / asc, mesh = new THREE.Mesh(new THREE.PlaneGeometry(W * unit, H * unit), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
      mesh.userData.size = [W * unit, H * unit]; return mesh;
    }
    // the step number in a starburst
    function badge(text, f = {}) {
      const tex = K.canvasTex(420, 420, (ctx) => {
        const r = K.rng(text + 'b'); ctx.translate(210, 210); ctx.lineJoin = 'round';
        ctx.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, rr = (i % 2 ? 142 : 188) * r.range(0.95, 1.05); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath();
        ctx.save(); ctx.translate(12, 14); ctx.fillStyle = INK; ctx.fill(); ctx.restore();
        ctx.fillStyle = f.color || PAL.mustard.lit; ctx.fill(); ctx.lineWidth = 15; ctx.strokeStyle = INK; ctx.stroke();
        ctx.font = '230px "Anton"'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = INK; ctx.fillText(text, 0, 84);
      });
      const s = f.height || 0.8; return new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    }
    // a caption box, as in a graphic novel: hand-written note on a slip of paper with an inked edge
    function caption(text, f = {}) {
      const fpx = 150, font = `700 ${fpx}px "Caveat"`, m = document.createElement('canvas').getContext('2d'); m.font = font;
      const tw = Math.ceil(m.measureText(text).width), bw = tw + 110, bh = 190, W = bw + 60, H = bh + 60;
      const tex = K.canvasTex(W, H, (ctx) => {
        const r = K.rng(text), j = () => r.range(-7, 7), box = (dx, dy) => { ctx.beginPath(); ctx.moveTo(20 + dx + j(), 20 + dy + j()); ctx.lineTo(20 + bw + dx + j(), 20 + dy + j()); ctx.lineTo(20 + bw + dx + j(), 20 + bh + dy + j()); ctx.lineTo(20 + dx + j(), 20 + bh + dy + j()); ctx.closePath(); };
        ctx.lineJoin = 'round'; box(14, 16); ctx.fillStyle = INK; ctx.fill();
        box(0, 0); ctx.fillStyle = PAPER; ctx.fill(); ctx.lineWidth = 11; ctx.strokeStyle = INK; ctx.stroke();
        ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = INK; ctx.fillText(text, 20 + bw / 2, 20 + bh / 2 + 6);
      });
      const unit = (f.height || 0.42) / bh, mesh = new THREE.Mesh(new THREE.PlaneGeometry(W * unit, H * unit), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
      mesh.userData.size = [W * unit, H * unit]; return mesh;
    }

    // PRINT FINISH: a filter over the finished picture. Edges wander by about a pixel and are "redrawn" a few times a
    // second (line boil), paper tooth and fibres multiply through the colour, tiny pinholes where ink did not take,
    // and a hand-ruled panel border with bare paper outside it.
    function print(f = {}) {
      return S.addFilter(`uniform vec3 uPaper, uInk; uniform float uBoil, uBorder;
        float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
        float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
        void main(){
          float s = res.y / 1080.0; vec2 px = vUv * res; float b = floor(time * uBoil);
          vec2 w = (vec2(vn(px / (42.0 * s) + b * 7.31), vn(px / (42.0 * s) + 19.7 - b * 3.17)) - 0.5) * 3.0 * s;
          vec3 c = texture2D(tex, (px + w) / res).rgb;
          if (uBorder > 0.0) {
            vec2 q = abs(px + w * 1.6 - res * 0.5) - (res * 0.5 - (uBorder + 16.0) * s);
            float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 16.0 * s, lw = (2.6 + 1.5 * vn(px / (120.0 * s))) * s;
            c = mix(c, uInk, 1.0 - smoothstep(lw - 0.8, lw + 0.8, abs(d)));
            c = mix(c, uPaper, smoothstep(lw - 0.6, lw + 0.8, d));
          }
          float tooth = 0.6 * vn(px / (1.8 * s)) + 0.4 * vn(px / (6.0 * s)), fibre = vn(px * vec2(0.03, 0.8) / s + 3.0);
          c *= mix(vec3(1.0), uPaper, 0.3) * (0.95 + 0.07 * tooth + 0.025 * fibre);
          c = mix(c, uPaper, 0.4 * step(0.9988, h21(floor(px / (2.0 * s)) + 5.0)));
          gl_FragColor = vec4(c, 1.0);
        }`, { uPaper: { value: srgb(PAPER) }, uInk: { value: srgb(INK) }, uBoil: { value: f.boil == null ? 6 : f.boil }, uBorder: { value: f.border == null ? 26 : f.border } });
    }

    // call once per update(t), after the camera is placed: gives the outline and the fills the light and "up" in view space
    const frame = (t, camera) => {
      camera.updateMatrixWorld();
      G.light.value.copy(sun.position).sub(sun.target.position).normalize().transformDirection(camera.matrixWorldInverse);
      G.up.value.set(0, 1, 0).transformDirection(camera.matrixWorldInverse);
      G.seed.value = Math.floor(t * 6);
    };
    return { G, sun, fill, outline, solid, turned, crease, strokes, mark, arc, burst, lettering, badge, caption, print, frame, flat };
  }

  registerStyle({
    id: 'ink-toon',
    name: 'Ink and Toon',
    family: 'Filters over 3D',
    look: 'Real 3D that reads as a hand-inked animation cel: flat colour in two tones, a brush line round every shape, halftone dots where light turns to shadow and pen hatching inside cast shadows, printed on warm paper inside a ruled panel.',
    motion: 'Snap, not glide. Props are drawn on twos (15 drawings a second) and jump between held poses with a stretched in-between, an overshoot and a quick settle; speed lines, impact ticks and steam squiggles are drawn in for two or three frames. The camera alone moves on every frame.',
    light: 'One hard sun, low and from the side, placed for the shape of the shadow rather than for realism. No fill light: the shadow colour of each material is picked by hand, shifted towards the cool ground colour.',
    materials: 'No textures. Each material is a lit colour, a shadow colour and, on glossy things, one hard white glint. Paper, one ink and four spot colours do everything.',
    camera: 'Long lens, looking down at a table-top from the front. It drifts slowly while a pose is held and whips to the next framing in a third of a second, one framing per step.',
    post: 'No blur, bloom or grain. A print filter lets every edge wander by a pixel and re-draws it six times a second, multiplies paper tooth through the colour and rules an ink border round the panel.',
    explains: 'Steps, recipes and how-tos with a few recognisable objects: each step is one bold action on the same hero object, named by a big lettered word and a hand-written caption box.',
    topic: 'Pour-over coffee in three steps: grind, bloom, pour',
    duration: 8,
    fonts: ['260px "Anton"', '700 150px "Caveat"'],
    render: { samples: 16, preview: 2, shutter: 0, tone: 'linear', exposure: 1, bloom: 0, vignette: 0, grain: 0, fov: 26, background: PAL.teal.lit },

    build(S) {
      const { THREE, K, scene, camera } = S;
      const ink = inkKit(S), { fill, solid, turned, crease, mark, arc, burst } = ink;
      ink.print();
      const M = {
        cream: fill(PAL.cream), paper: fill(PAL.paper, { band: 0.06 }), mustard: fill(PAL.mustard, { streak: 0.028, gloss: 0.02 }), wood: fill(PAL.mustard), persimmon: fill(PAL.persimmon, { streak: 0.04, gloss: 0.03 }),
        navy: fill(PAL.navy, { gloss: 0.05, streak: 0.03 }), bean: fill(PAL.bean), water: fill(PAL.water, { band: 0 }), coffee: fill({ lit: '#4a2a1c', shade: '#2b1712', gloss: '#c99766' }, { band: 0.05 }),
      };
      const group = (parent = scene) => { const g = new THREE.Group(); parent.add(g); return g; };
      const sphere = (r) => new THREE.SphereGeometry(r, 24, 16);
      const pop = (x, d = 0.25) => (x < 0 ? 0 : K.ease.outBack(Math.min(1, (x + F / 2) / d), 2.4));        // lands on its frame: 0.7, 1.18, 1.05, 1
      const wobble = (x, f = 3.4, k = 9) => (x <= 0 ? 0 : Math.exp(-k * x) * Math.sin(x * 2 * Math.PI * f));   // the settle after a hit
      // SMEAR: on a drawing where a prop has travelled far since the last one, stretch it along its path, as an
      // animator draws one long in-between instead of motion blur.
      const X = new THREE.Vector3(1, 0, 0), dv = new THREE.Vector3();
      const rig = (inner) => { const outer = group(), mid = group(outer); mid.add(inner); return { outer, inner, set(p, p0, max = 0.9) {
        dv.set(p[0] - p0[0], p[1] - p0[1], p[2] - p0[2]); const speed = dv.length() / F, s = 1 + Math.min(max, Math.max(0, speed - 7) * 0.04);
        outer.position.set(p[0], p[1], p[2]); outer.quaternion.identity(); if (s > 1) outer.quaternion.setFromUnitVectors(X, dv.normalize());
        mid.quaternion.copy(outer.quaternion).invert(); outer.scale.set(s, 1 / Math.sqrt(s), 1 / Math.sqrt(s));
      } }; };

      // ---- the ground: one flat colour with a field of printed dots lying on it in perspective
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), fill(PAL.teal, { band: 0, hatch: 1.7 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
      { const pts = [], r = 0.7; for (let j = -16; j <= 16; j++) for (let i = -16; i <= 16; i++) { const x = (i + (j & 1) * 0.5) * r, z = j * r * 0.866, d = Math.hypot(x - 0.4, z + 0.5), s = 0.17 * (1 - K.smooth(2.2, 8.5, d)); if (s > 0.02) pts.push([x, z, s]); }
        const dots = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 20).rotateX(-Math.PI / 2), fill(PAL.tealDot, { band: 0, hatch: 1.7 }), pts.length); dots.receiveShadow = true;
        pts.forEach(([x, z, s], i) => K.place(dots, i, [x, 0.004, z], null, s)); scene.add(dots); }

      // ---- cup and saucer (the hero: everything happens on top of it)
      const cupG = group(), CUP_Y = 0.07, CUP_H = 0.9;
      solid(turned([[0, 0], [0.5, 0], [0.86, 0.07], [0.96, 0.12], [0.94, 0.155], [0.55, 0.07], [0, 0.07]]), M.cream, cupG);
      const cup = group(cupG); cup.position.y = CUP_Y;
      solid(turned([[0, 0], [0.38, 0], [0.47, 0.03], [0.52, 0.2], [0.56, 0.5], [0.57, 0.82], [0.585, 0.88], [0.56, 0.9], [0.535, 0.86], [0.5, 0.3], [0.42, 0.1], [0, 0.09]]), M.mustard, cup);
      crease(cup, 0.578, 0.8, -60, 100); crease(cup, 0.5, 0.06, -50, 80);
      const handle = solid(K.tube([[0.5, 0.72, 0], [0.8, 0.74, 0], [0.93, 0.52, 0], [0.82, 0.28, 0], [0.5, 0.25, 0]], 0.062, { segments: 30, radial: 10 }), M.mustard, cup); handle.rotation.y = -0.5;
      const coffee = solid(new THREE.CircleGeometry(0.515, 40).rotateX(-Math.PI / 2), M.coffee, cup, { line: 0, cast: false }); coffee.position.y = 0.79;
      const crema = mark([[arc(0.36, 2.3, 3.6, 12), 0.05]], '#c99766', 0); crema.rotation.x = -Math.PI / 2; crema.position.y = 0.795; cup.add(crema);

      // ---- dripper with paper filter and the bed of grounds
      const DRIP_Y = CUP_Y + CUP_H, rIn = (y) => 0.2 + 0.853 * (y - 0.16);     // inner radius of the cone at height y
      const drip = group(), dripRig = rig(drip);
      solid(turned([[0, -0.12], [0.2, -0.12], [0.22, 0], [0.66, 0], [0.71, 0.035], [0.66, 0.07], [0.3, 0.09], [0.27, 0.15], [0.8, 0.8], [0.845, 0.83], [0.83, 0.87], [0.78, 0.84], [0.2, 0.16], [0, 0.16]]), M.cream, drip);
      solid(turned([[0.705, 0.66], [0.775, 0.745]], 64, 0), M.persimmon, drip, { line: 0, cast: false }).scale.set(1.006, 1, 1.006);   // the painted band
      solid(K.tube([[-0.6, 0.6, 0], [-0.9, 0.62, 0], [-0.98, 0.42, 0], [-0.8, 0.27, 0], [-0.4, 0.3, 0]], 0.055, { segments: 26, radial: 10 }), M.cream, drip).rotation.y = -0.55;
      solid(turned([[rIn(0.2) - 0.012, 0.2], [rIn(0.97) - 0.012, 0.97], [rIn(0.97) - 0.03, 0.978], [rIn(0.2) - 0.03, 0.215]], 64, 1), M.paper, drip, { line: 3 });
      const bedMat = fill({ lit: GROUNDS.dry[0], shade: GROUNDS.dry[1] }, { band: 0.08 });
      const bed = solid(turned([[1, 0], [0.93, 0.28], [0.7, 0.66], [0.36, 0.93], [0, 1]], 48), bedMat, drip, { line: 0, cast: false });

      // ---- kettle (built with the spout towards -x; posed by where its spout tip should be)
      const kettle = group(), kRig = rig(kettle), TIP = new THREE.Vector3(-1.7, 1.17, 0);
      solid(turned([[0, 0], [0.7, 0], [0.8, 0.03], [0.84, 0.14], [0.62, 0.84], [0.57, 0.92], [0.46, 0.95], [0, 0.95]]), M.persimmon, kettle);
      solid(turned([[0.5, 0.925], [0.47, 0.99], [0.3, 1.04], [0, 1.06]]), M.persimmon, kettle);
      solid(turned([[0, 1.03], [0.05, 1.04], [0.05, 1.1], [0.115, 1.15], [0.125, 1.2], [0.07, 1.255], [0, 1.26]]), M.navy, kettle, { line: 3 });
      solid(K.tube([[-0.7, 0.2, 0], [-1.0, 0.22, 0], [-1.22, 0.48, 0], [-1.2, 0.82, 0], [-1.3, 1.08, 0], [-1.52, 1.2, 0], [-1.7, 1.17, 0]], 0.058, { segments: 44, radial: 10 }), M.persimmon, kettle);
      solid(K.tube([[0.5, 0.86, 0], [0.95, 0.98, 0], [1.24, 0.8, 0], [1.26, 0.45, 0], [1.05, 0.2, 0], [0.76, 0.14, 0]], 0.07, { segments: 34, radial: 10 }), M.navy, kettle, { line: 3 });
      crease(kettle, 0.842, 0.17, -75, 115); crease(kettle, 0.622, 0.84, -60, 95);
      // the water: a thin outlined ribbon that leaves the spout sideways and falls
      const SEG = 14, RAD = 8, sPos = new Float32Array((SEG + 1) * RAD * 3), sNor = new Float32Array((SEG + 1) * RAD * 3), sIdx = [];
      for (let i = 0; i < SEG; i++) for (let j = 0; j < RAD; j++) { const a = i * RAD + j, b = i * RAD + (j + 1) % RAD; sIdx.push(a, b, a + RAD, b, b + RAD, a + RAD); }
      const sGeo = new THREE.BufferGeometry(); sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3)); sGeo.setAttribute('normal', new THREE.BufferAttribute(sNor, 3)); sGeo.setIndex(sIdx);
      const stream = solid(sGeo, M.water, scene, { line: 3, cast: false }); stream.frustumCulled = false;
      const sT = new THREE.Vector3(), sA = new THREE.Vector3(), sB = new THREE.Vector3(), Z = new THREE.Vector3(0, 0, 1);
      const setStream = (tip, land, u0, u1) => {
        for (let i = 0; i <= SEG; i++) {
          const u = K.lerp(u0, u1, i / SEG), cx = tip.x + (land.x - tip.x) * u, cy = tip.y + (land.y - tip.y) * u * u, cz = tip.z + (land.z - tip.z) * u, r = 0.026 * (1 - 0.3 * u) * (i === 0 || i === SEG ? 0.4 : 1);
          sT.set(land.x - tip.x, 2 * u * (land.y - tip.y), land.z - tip.z).normalize(); sA.crossVectors(sT, Z).normalize(); sB.crossVectors(sT, sA);
          for (let j = 0; j < RAD; j++) { const a = j / RAD * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), k = (i * RAD + j) * 3, nx = c * sA.x + s * sB.x, ny = c * sA.y + s * sB.y, nz = c * sA.z + s * sB.z;
            sPos[k] = cx + nx * r; sPos[k + 1] = cy + ny * r; sPos[k + 2] = cz + nz * r; sNor[k] = nx; sNor[k + 1] = ny; sNor[k + 2] = nz; }
        }
        sGeo.attributes.position.needsUpdate = true; sGeo.attributes.normal.needsUpdate = true;
      };

      // ---- grinder: box mill with a hopper bowl, a crank and a drawer
      const GR = [-2.05, 0, 0.15], mill = group(), millRig = rig(mill); mill.rotation.y = -0.55;
      const box = (w, h, d, r, mat, x, y, z, parent = mill, f) => { const m = solid(K.roundedBox(w, h, d, r, 4), mat, parent, f); m.position.set(x, y, z); return m; };
      box(1.42, 0.16, 1.42, 0.07, M.navy, 0, 0.08, 0); box(1.2, 0.98, 1.2, 0.12, M.wood, 0, 0.62, 0); box(1.36, 0.12, 1.36, 0.055, M.navy, 0, 1.14, 0);
      solid(turned([[0, 1.18], [0.28, 1.18], [0.5, 1.3], [0.6, 1.52], [0.62, 1.62], [0.59, 1.64], [0.56, 1.6], [0.47, 1.38], [0.26, 1.27], [0, 1.27]]), M.cream, mill);
      const drawer = group(mill); box(0.34, 0.42, 0.8, 0.05, M.cream, 0.5, 0.56, 0, drawer); solid(sphere(0.08), M.persimmon, drawer, { line: 3 }).position.set(0.72, 0.56, 0);
      const crank = group(mill);
      solid(new THREE.CylinderGeometry(0.04, 0.04, 0.48, 12), M.navy, crank, { line: 3 }).position.y = 1.49;
      box(0.8, 0.075, 0.15, 0.036, M.navy, 0.33, 1.73, 0, crank, { line: 3 });
      solid(new THREE.CylinderGeometry(0.032, 0.032, 0.18, 10), M.navy, crank, { line: 3 }).position.set(0.66, 1.84, 0);
      solid(sphere(0.135), M.persimmon, crank).position.set(0.66, 1.96, 0);
      const spin = mark([[arc(0.7, 0.35, 1.9, 16), 0.06, 'tail'], [arc(0.5, 0.6, 1.7, 12), 0.045, 'tail'], [arc(0.7, 3.5, 5.0, 16), 0.06, 'tail'], [arc(0.5, 3.75, 4.85, 12), 0.045, 'tail']]); spin.rotation.x = -Math.PI / 2; spin.position.y = 1.96; crank.add(spin);
      const beans = Array.from({ length: 6 }, (_, i) => { const b = solid(sphere(0.1), M.bean, mill, { line: 3 }); b.scale.set(1, 0.62, 0.72); b.userData = { a: i * 1.05 + 0.3, r: 0.12 + 0.2 * K.hash(i, 3), ph: K.hash(i, 7) }; return b; });
      // the ground coffee that jumps from the drawer to the filter
      const LEAP_A = new THREE.Vector3(0.95, 0.6, 0).applyEuler(mill.rotation).add(new THREE.Vector3(...GR)), LEAP_B = new THREE.Vector3(0, DRIP_Y + 0.62, 0);
      const blobs = Array.from({ length: 6 }, (_, i) => { const b = solid(sphere(0.085 + 0.05 * K.hash(i, 1)), M.bean, scene, { line: 3 }); b.userData = { t0: T.burst + i * 0.026, h: 0.85 + 0.5 * K.hash(i, 2), dz: (K.hash(i, 5) - 0.5) * 0.5 }; return b; });

      // ---- marks
      const faceCam = [];                                                   // marks that always face the lens
      const sprite = (m, parent = scene) => { parent.add(m); faceCam.push(m); m.visible = false; return m; };
      const hit = sprite(mark(burst(11, 0.95, 0.5, 0.42, 0.07, 3)));        // the grounds land
      const shake = [sprite(mark([[[[-0.95, 0.9], [-1.2, 1.0]], 0.05], [[[-1.0, 0.5], [-1.3, 0.5]], 0.05], [[[-0.95, 0.1], [-1.2, 0.0]], 0.05]])), sprite(mark([[[[0.95, 1.1], [1.2, 1.25]], 0.05], [[[-1.02, 0.7], [-1.28, 0.75]], 0.05], [[[-1.0, 0.28], [-1.25, 0.2]], 0.05]]))];
      const splash = [sprite(mark([[[[-0.1, 0.02], [-0.24, 0.16]], 0.035, 'head'], [[[0.1, 0.02], [0.22, 0.2]], 0.035, 'head'], [[[0, 0.05], [0.02, 0.24]], 0.03, 'head']], PAL.water.lit, 0.022)),
        sprite(mark([[[[-0.12, 0.02], [-0.3, 0.1]], 0.035, 'head'], [[[0.12, 0.02], [0.3, 0.12]], 0.035, 'head'], [[[-0.03, 0.05], [-0.08, 0.22]], 0.03, 'head']], PAL.water.lit, 0.022))];
      const ripple = group(); { const m = mark([[arc(1, 0, Math.PI * 2, 28), 0.2, 'none']], '#b98554', 0); m.rotation.x = -Math.PI / 2; ripple.add(m); }   // rings on the brew where the water lands
      const bubbles = Array.from({ length: BUBBLES }, (_, i) => { const g = group(), dot = mark([[arc(0.5, 0, Math.PI * 2, 18), 1, 'none']], '#dcae7c', 0.42), tick = mark(burst(6, 1.1, 1.1, 1.0, 0.3, 20 + i));
        g.rotation.x = -Math.PI / 2; g.add(dot, tick); g.userData = { dot, tick, t0: bubbleAt(i), a: i * 2.4 + 0.5, r: 0.06 + 0.24 * K.hash(i, 11) }; return g; });
      const squiggle = (h, amp, ph) => Array.from({ length: 22 }, (_, i) => { const u = i / 21; return [Math.sin(u * 6.6 + ph) * amp * (0.35 + u), u * h]; });
      const steam = (n, color = PAPER) => Array.from({ length: n }, (_, i) => { const g = sprite(new THREE.Group()); g.userData.v = [0, 1, 2].map((k) => { const m = mark([[squiggle(0.72, 0.085, i * 1.7 + k * 2.1), 0.08]], color, 0.026); g.add(m); return m; }); return g; });
      const bloomSteam = steam(2), cupSteam = steam(3);
      const orbit = group();                                                // the circling arrow over the dripper while pouring
      { const R = 0.62, a1 = 5.2, tx = -Math.sin(a1), ty = Math.cos(a1), ex = R * Math.cos(a1), ey = R * Math.sin(a1);
        const m = mark([[arc(R, 0.7, a1, 40), 0.085, 'tail'], [[[ex - tx * 0.02, ey - ty * 0.02], [ex + tx * 0.3, ey + ty * 0.3]], 0.3, 'head']], PAL.mustard.lit, 0.03); m.rotation.x = -Math.PI / 2; orbit.add(m); }
      const star = (s) => mark([[[[0, -s], [0, 0], [0, s]], s * 0.34], [[[-s * 0.7, 0], [0, 0], [s * 0.7, 0]], s * 0.3]], PAPER, 0.024);
      const ting = [sprite(star(0.3)), sprite(star(0.16))];

      // ---- the camera: one framing per step. [aim x, y, z, elevation, azimuth, distance]
      const D = Math.PI / 180;
      const cam = K.track([[0, [-0.95, 1.27, 0, 28 * D, -5 * D, 8.0]], [at(27), [-0.9, 1.27, 0, 29 * D, -2 * D, 7.7], 'linear'], [T.lab2, [0.5, 1.6, 0, 31 * D, 3 * D, 8.9], 'inOutQuint'], [at(57), [0.5, 1.58, 0, 32 * D, 6 * D, 8.6], 'linear'],
        [T.lab3, [0.95, 1.8, 0, 39 * D, -9 * D, 7.8], 'inOutQuint'], [T.away, [0.95, 1.8, 0, 41 * D, -5 * D, 7.5], 'linear'], [at(95), [1.0, 0.9, 0, 31 * D, 4 * D, 6.1], 'inOutQuint'], [8, [1.0, 0.9, 0, 30 * D, 7 * D, 5.85], 'linear']]);
      const camPos = (c) => [c[0] + c[5] * Math.sin(c[4]) * Math.cos(c[3]), c[1] + c[5] * Math.sin(c[3]), c[2] + c[5] * Math.cos(c[4]) * Math.cos(c[3])];
      // the world point that sits at screen position (sx, sy) (-1..1) at a given time, and the rotation that lies flat to the
      // picture there; `push` moves it away from the lens
      const TAN = Math.tan(S.R.fov / 2 * D);
      const spot = (time, sx, sy, push = 0) => { const c = cam(time), p = camPos(c), e = c[3], a = c[4], d = c[5] + push, hh = d * TAN, hw = hh * S.W / S.H;
        const f = [-Math.sin(a) * Math.cos(e), -Math.sin(e), -Math.cos(a) * Math.cos(e)], r = [Math.cos(a), 0, -Math.sin(a)], u = [-Math.sin(a) * Math.sin(e), Math.cos(e), -Math.cos(a) * Math.sin(e)];
        return { pos: [0, 1, 2].map((i) => p[i] + f[i] * d + r[i] * sx * hw + u[i] * sy * hh), rot: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(...r), new THREE.Vector3(...u), new THREE.Vector3(...f).negate())) }; };

      // ---- lettering: each step gets a word, a number badge and a caption box, standing in the scene and turned to
      // face the camera of its own framing
      const label = (step, when, until, at2, cap2, f = {}) => {
        const look = when + 0.9, g = group(), word = ink.lettering(step.word, { height: f.height || 0.56 }), cap = ink.caption(step.note, { height: f.cap || 0.36 }), capG = group(), [ww, wh] = word.userData.size;
        const a = spot(look, ...at2), b = spot(look, ...cap2); g.add(word); g.position.set(...a.pos); g.quaternion.copy(a.rot);
        const ticks = mark(burst(9, ww * 0.56, wh * 0.62, 0.3, 0.06, 7 + when)); ticks.position.z = -0.01; g.add(ticks);
        let bd = null; if (step.n) { bd = ink.badge(step.n, { height: wh * 0.82 }); bd.position.set(-ww / 2 + 0.02, wh * 0.22, 0.02); g.add(bd); }
        capG.add(cap); capG.position.set(...b.pos); capG.quaternion.copy(b.rot); cap.rotation.z = f.tilt == null ? -0.04 : f.tilt;
        return (q) => {
          const x = q - when, out = 1 - K.seg(q, until, until + 2 * F), s = pop(x) * out;
          g.visible = x >= 0 && out > 0; g.scale.setScalar(Math.max(s, 1e-3)); word.rotation.z = 0.05 * wobble(x + 0.03, 4, 10);
          ticks.visible = x >= 0 && x < 2 * F - 1e-3; ticks.scale.setScalar(x < F - 1e-3 ? 0.92 : 1.06);
          if (bd) { const b = pop(x - F); bd.scale.setScalar(Math.max(b, 1e-3)); bd.rotation.z = 0.18 - 0.5 * (1 - Math.min(1, b)); }
          const cs = pop(x - 3 * F) * out; capG.visible = x >= 3 * F - 1e-3 && out > 0; capG.scale.setScalar(Math.max(cs, 1e-3));
        };
      };
      // [screen x, screen y, push] for the word and for its caption, in the framing of that step
      const labels = [
        label(STEPS[0], -1, T.cut2 - 2 * F, [-0.4, 0.68, 0.6], [0.47, 0.7, 0.3], { tilt: 0.03 }),
        label(STEPS[1], T.lab2, T.cut3 - 2 * F, [-0.52, 0.64, 0.4], [0.5, -0.7, -0.6], { tilt: -0.05 }),
        label(STEPS[2], T.lab3, T.hop - F, [-0.56, 0.56, 0.4], [-0.66, -0.6, -0.4], { tilt: 0.05 }),
        label(ENDING, T.lab4, 99, [0.42, 0.36, 0.3], [0.42, -0.34, -0.3], { cap: 0.3, tilt: -0.03 }),
      ];

      // ---- the moves
      const OB = K.ease.outBack, soft = (u) => K.ease.outBack(u, 0.7);
      const kTip = K.track([[T.cut2, [5.6, 6.6, 0]], [at(35), [0.55, 2.78, 0], soft], [T.tilt2, [0.55, 2.78, 0]], [T.wet0, [0.12, 2.5, 0], OB], [T.wet1, [0.12, 2.5, 0]], [at(47), [0.55, 2.78, 0], OB],
        [at(62), [0.55, 2.78, 0]], [T.pour0, [0.1, 2.5, 0], OB], [T.pour1, [0.1, 2.5, 0]], [T.away, [0.6, 2.9, 0], OB], [at(91), [8.5, 3.3, 0], K.ease.in]]);
      const kTilt = K.track([[T.tilt2, -0.07], [T.wet0, 0.4, OB], [T.wet1, 0.4], [at(47), -0.07, OB], [at(62), -0.07], [T.pour0, 0.43, OB], [T.pour1, 0.43], [T.away, -0.12, OB]]);
      const kPose = (q) => { const p = kTip(q).slice(), a = (q - T.pour0) * 2 * Math.PI / 0.8, amp = 0.17 * K.seg(q, T.pour0, T.pour0 + 3 * F) * (1 - K.seg(q, T.pour1 - 2 * F, T.pour1)); p[0] += amp * Math.cos(a); p[2] += amp * Math.sin(a); return { tip: p, tilt: kTilt(q) }; };
      const kBase = (q) => { const k = kPose(q), c = Math.cos(k.tilt), s = Math.sin(k.tilt); return [k.tip[0] - (TIP.x * c - TIP.y * s), k.tip[1] - (TIP.x * s + TIP.y * c), k.tip[2]]; };
      const millPos = (q) => { const u = K.seg(q, T.cut2 - F, T.cut2 + 3 * F, K.ease.in); return [GR[0] - 7.5 * u, GR[1] + 1.2 * Math.sin(u * 2.2), GR[2]]; };
      const dripPos = (q) => { const u = K.seg(q, T.hop, T.hop + 4 * F, K.ease.in); return [-8 * u, DRIP_Y + 5 * Math.sqrt(u), 0]; };
      const col = new THREE.Color(), tipW = new THREE.Vector3(), landW = new THREE.Vector3(), v3 = new THREE.Vector3();

      return {
        update(t) {
          const q = Math.floor(t * DPS + 1e-3) / DPS, n = Math.round(q * DPS);     // q: the time of the drawing we are on
          const c = cam(t), cp = camPos(c);
          K.look(camera, cp, c); ink.frame(t, camera);

          // grinder: crank on twos with a shake, squash before the burst, then off to the left
          const grinding = q < T.grindEnd;
          millRig.set(millPos(q), millPos(q - F)); millRig.outer.visible = q < T.cut2 + 3 * F;
          crank.rotation.y = -Math.min(n, 20) * Math.PI / 3; spin.visible = grinding;
          const ant = K.seg(q, T.grindEnd, T.grindEnd + F) * (1 - K.seg(q, T.burst - 1e-3, T.burst)), sy = 1 + (grinding ? 0.02 * (n % 2 ? 1 : -1) : 0) - 0.16 * ant + 0.22 * wobble(q - T.burst + F * 0.6, 3, 8);
          mill.scale.set(1 / Math.sqrt(sy), sy, 1 / Math.sqrt(sy)); mill.rotation.z = grinding ? 0.022 * (n % 2 ? 1 : -1) : 0;
          drawer.position.x = 0.34 * pop(q - T.burst, 0.17);
          beans.forEach((b, i) => { const d = b.userData, left = 1 - K.seg(q, i * 0.2, i * 0.2 + 0.5), hopy = grinding ? Math.abs(Math.sin((n * 0.5 + d.ph) * Math.PI)) * 0.16 : 0; b.position.set(Math.cos(d.a) * d.r, 1.5 + hopy - 0.12 * (1 - left), Math.sin(d.a) * d.r); b.rotation.set(n * 0.9 + i, i, n * 0.7); b.visible = left > 0.05; });
          shake.forEach((m, i) => { m.visible = grinding && n % 2 === i; m.position.set(GR[0], 0.75, GR[2] + 0.2); });
          blobs.forEach((b) => { const d = b.userData, u = (q - d.t0) / (4 * F); b.visible = u > 0 && u < 1; if (!b.visible) return;
            const P = (u) => v3.lerpVectors(LEAP_A, LEAP_B, u).add({ x: 0, y: 4 * d.h * u * (1 - u), z: d.dz * Math.sin(Math.PI * u) });
            const p1 = P(u + 0.05).clone(); b.position.copy(P(u)); b.lookAt(p1); b.scale.set(0.9, 0.9, 1.4); });

          // cup and dripper: take the hit when the grounds land, and again when the dripper leaves
          const land = q - T.land, sq = 1 - 0.13 * wobble(land + F * 0.5, 3.2, 8) - 0.07 * wobble(q - T.hop - F, 3.4, 9);
          cupG.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
          const dp = dripPos(q), dp0 = dripPos(q - F); if (q < T.hop) dp[1] = dp0[1] = CUP_Y + CUP_H * sq;
          dripRig.set(dp, dp0); drip.scale.copy(cupG.scale); drip.rotation.z = 0.5 * K.seg(q, T.hop, T.hop + 4 * F); dripRig.outer.visible = q < T.hop + 4 * F;
          hit.visible = land >= 0 && land < 2 * F - 1e-3; hit.position.set(0, DRIP_Y + 0.9, 0.2); hit.scale.setScalar(land < F - 1e-3 ? 0.85 : 1.12);

          // the bed: dry mound -> wet and swelling (the bloom) -> a rising pool of brew
          const wet = K.seg(q, T.wet0 + F, T.wet0 + 2 * F), brew = K.seg(q, T.pour0 + F, T.pour0 + 4 * F);
          const level = 0.56 + 0.18 * K.seg(q, T.pour0, T.pour1, K.ease.out) - 0.1 * K.seg(q, T.pour1, T.pour1 + 3 * F);
          const swell = K.spring(q - T.wet1 + F, 1.5, 0.38) * (1 - brew), bulge = (0.11 + 0.13 * swell) * (1 - 0.8 * brew) * (1 + 0.1 * wobble(q - T.wet0, 4, 7));
          const br = (rIn(level) - 0.035) * pop(land, 0.2);
          bed.visible = land >= 0; bed.position.y = level; bed.scale.set(Math.max(br, 1e-3), bulge, Math.max(br, 1e-3));
          const g0 = brew > 0 ? GROUNDS.wet : GROUNDS.dry, g1 = brew > 0 ? GROUNDS.brew : GROUNDS.wet, gk = brew > 0 ? brew : wet;
          bedMat.userData.u.uLit.value.set(g0[0]).lerp(col.set(g1[0]), gk); bedMat.userData.u.uShade.value.set(g0[1]).lerp(col.set(g1[1]), gk);
          bubbles.forEach((g) => { const d = g.userData, x = q - d.t0, on = x >= 0 && x < 3 * F - 1e-3 && q < T.cut3; g.visible = on; if (!on) return;
            const rho = d.r / Math.max(br, 0.1), popped = x >= 2 * F - 1e-3; g.position.set(Math.cos(d.a) * d.r, DRIP_Y + level + bulge * Math.sqrt(1 - rho * rho) * 0.95 + 0.012, Math.sin(d.a) * d.r);
            d.dot.visible = !popped; d.tick.visible = popped; g.scale.setScalar(popped ? 0.075 : x < F - 1e-3 ? 0.035 : 0.06); });
          bloomSteam.forEach((g, i) => { const x = q - (T.wet1 + F * (3 + i * 4)), on = x >= 0 && q < T.cut3 + F; g.visible = on; if (!on) return;
            g.userData.v.forEach((m, k) => { m.visible = k === (Math.floor(n / 3) + i) % 3; }); g.position.set(-0.02 + i * 0.34, DRIP_Y + 0.98 + x * 0.2 + i * 0.14, -0.3); g.scale.setScalar(pop(x, 0.3) * (1 - K.seg(q, T.cut3 - F, T.cut3 + F))); });

          // kettle: in from the right, tip, back, tip again and circle, then away
          const k = kPose(q); kRig.set(kBase(q), kBase(q - F)); kettle.rotation.z = k.tilt; kRig.outer.visible = q >= T.cut2 && q < at(91);
          const wetting = q >= T.wet0 && q < T.wet1 + F, pouring = q >= T.pour0 && q < T.pour1 + F, on0 = wetting ? T.wet0 : T.pour0, off = wetting ? T.wet1 : T.pour1;
          stream.visible = wetting || pouring;
          tipW.set(k.tip[0], k.tip[1], k.tip[2]); landW.set(k.tip[0] - 0.13, DRIP_Y + level + bulge * 0.85, k.tip[2]);
          if (stream.visible) setStream(tipW, landW, K.clamp((q - off) / (2 * F) + 0.45), K.clamp((q - on0) / (2 * F) + 0.5));
          ripple.visible = pouring && q > T.pour0 + F && q < T.pour1; ripple.position.copy(landW).y += 0.012; ripple.scale.setScalar([0.1, 0.17, 0.25][n % 3]);
          splash.forEach((m, i) => { m.visible = stream.visible && q > on0 && q < off && n % 2 === i; m.position.copy(landW); });
          orbit.visible = q >= T.pour0 + F && q < T.pour1; orbit.position.set(0.1, DRIP_Y + 1.2, 0); orbit.rotation.y = (n % 12) * Math.PI / 6; orbit.scale.setScalar(pop(q - T.pour0 - F));

          // the ending: steam off the cup and a glint on the rim
          cupSteam.forEach((g, i) => { const x = q - (T.cut4 + F * (2 + i * 3)), on = x >= 0; g.visible = on; if (!on) return;
            g.userData.v.forEach((m, kk) => { m.visible = kk === (Math.floor(n / 3) + i) % 3; }); g.position.set(-0.3 + i * 0.3, CUP_Y + 0.96 + Math.min(x, 2) * 0.1 + (i % 2) * 0.16, 0.05 - i * 0.05); g.scale.setScalar(pop(x, 0.3) * (i === 1 ? 1.1 : 0.85)); });
          ting.forEach((m, i) => { const x = q - T.ting - i * 2 * F; m.visible = x >= 0; m.position.set(i ? 0.86 : -0.52, i ? 1.28 : 1.02, 0.5); m.scale.setScalar(pop(x, 0.2) * (1 + 0.12 * Math.sin(n * 1.6 + i))); });

          for (const f of labels) f(q);
          for (const m of faceCam) m.quaternion.copy(camera.quaternion);
        },
      };
    },

    sound(k) {
      // every time below is a frame the picture also changes on (see T)
      const water = (t0, t1, f) => { k.noise(t0, { dur: t1 - t0 + 0.08, color: 'pink', filter: 'bandpass', f: [[0, f], [t1 - t0, f * 1.5]], q: 1.4, gain: 0.2, a: 0.04, hold: t1 - t0 - 0.06, pan: 0.05 }); k.noise(t0, { dur: t1 - t0 + 0.05, filter: 'highpass', f: 5200, gain: 0.05, a: 0.03, hold: t1 - t0 - 0.05 }); };
      k.music('pulse', 0, 8, { bpm: 120, gain: 0.5, chords: [['D4', 'F#4', 'A4', 'C#5'], ['B3', 'D4', 'F#4', 'A4'], ['G3', 'B3', 'D4', 'F#4'], ['A3', 'C#4', 'E4', 'G4']] });
      k.bed('room', 0, 8, { gain: 0.7 });
      k.play('stamp', 0.0, { gain: 0.5 });
      k.withMinor(() => { for (let n = 0; n < 20; n += 2) { k.play('tock', at(n), { gain: 0.5, f: 420 + (n % 4) * 60, pan: -0.4 }); k.noise(at(n), { dur: 0.12, color: 'brown', filter: 'bandpass', f: 520, q: 2, gain: 0.5, pan: -0.4 }); } });
      k.play('pop', T.burst, { gain: 1, f: 520, pan: -0.3 }); k.play('swish', T.burst + F, { gain: 0.9, dur: 0.2, pan: -0.1 });
      k.play('thud', T.land, { gain: 0.8, f: 150 }); k.play('paper', T.land, { gain: 0.9, dur: 0.18 });
      k.play('whoosh', T.cut2 - F, { gain: 0.9, dur: 0.4, pan: 0.3 }); k.play('stamp', T.lab2, { gain: 0.9, pan: -0.3 });
      k.play('click', T.tilt2, { gain: 0.6, pan: 0.3 }); water(T.wet0, T.wet1, 1500);
      k.tone(T.wet1 + F, { f: [[0, 140], [0.5, 320]], type: 'triangle', dur: 0.6, gain: 0.12, a: 0.3 });   // the swell
      for (let i = 0; i < BUBBLES; i++) k.play('pop', bubbleAt(i) + 2 * F, { gain: 0.4, f: 900 + (i * 173) % 500, pan: (i % 3 - 1) * 0.25, minor: true });
      k.play('whoosh', T.cut3 - F, { gain: 0.8, dur: 0.4, pan: -0.2 }); k.play('stamp', T.lab3, { gain: 0.9, pan: -0.3 });
      water(T.pour0, T.pour1, 1100);
      for (let i = 0; i < 5; i++) k.tone(T.pour0 + F * (3 + i * 3), { f: [[0, 500 + i * 70], [0.06, 900 + i * 90]], dur: 0.09, gain: 0.07, pan: 0.1, minor: true });   // the cup filling
      k.play('swish', T.away, { gain: 0.9, dur: 0.25, pan: 0.4 }); k.play('pop', T.hop, { gain: 0.9, f: 700 }); k.play('swish', T.hop + F, { gain: 1, dur: 0.22, pan: -0.4 });
      k.play('stamp', T.lab4, { gain: 1 }); k.play('ding', T.ting, { gain: 0.7, f: 'A6', pan: -0.1 }); k.play('ding', T.ting + 2 * F, { gain: 0.5, f: 'E7', pan: 0.2 });
      k.noise(T.cut4 + 0.2, { dur: 1.8, filter: 'highpass', f: 6000, gain: 0.02, a: 0.4, hold: 0.8 });   // steam
    },
  });
}
```
