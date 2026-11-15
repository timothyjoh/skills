# Blueprint Build (#05)

- **id:** `blueprint-build`
- **Category:** Diagrams with depth
- **Use:** explainer
- **Reference duration:** 8 s
- **Google Fonts:** none
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`, `lib/strokefont.js`

## Style card

- **Look:** A real drafting sheet: deep blueprint blue with grain and worn fold creases, a title block, a construction grid, crisp white linework in two weights with hidden edges dashed, dimension arrows and numbered notes in plotted single-stroke capitals. The drawing turns out to be a 3D wireframe, and then a solid object standing on its own plan.
- **Motion:** Lines plot themselves in pen order with a hot tip. As the camera tips over, each part rises out of its own plan, which stays printed on the sheet. The numbered notes peel off the paper, turn to face the lens and are tied to the model with leaders, one by one. Then a hatched section plane climbs through the wireframe and leaves real material under it.
- **Light:** One soft key from behind and to the side, so tops and one flank are lit, the near faces stay in shade and a long soft shadow falls toward the camera across the sheet. A little cool fill. At the end the desk lamp in the model switches on.
- **Materials:** Uncoated blue paper that takes the light, flat white ink. The built object is restrained and real: pale oak, matt white steel, rust wool, off-white plaster, graphite plastic. The white lines stay on it as a faint ghost.
- **Camera:** One continuous crane move with a long lens that opens up: it starts straight above the sheet, where the drawing reads as a flat plan, tips down to a three-quarter view as the drawing gains height, and keeps drifting in until the last frame.
- **Finish:** Almost none: neutral tone curve so the blue and white stay true, light vignette, a trace of bloom on pen tips and the lamp, fine grain. Hidden lines are found by a real depth test, not drawn by hand.
- **Good for:** Plans, set-ups and how-it-is-made: first the layout as a flat drawing, then the same thing as an object, with dimensions and two or three numbered pointers attached to the places they talk about.

## Reference

- **Sample topic:** An ergonomic desk set-up: screen top at eye level, elbows at about 90 degrees, feet flat on the floor
- **Gallery description:** A real drafting sheet: deep blueprint blue with grain and worn fold creases, a title block, a construction grid, crisp white linework in two weights with hidden edges dashed, dimension arrows and numbered notes in plotted single-stroke capitals. The drawing turns out to be a 3D wireframe, and then a solid object standing on its own plan.
- **Shown in the sample clip:** An ergonomic desk set-up: screen top at eye level, elbows at about 90 degrees, feet flat on the floor

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/blueprint-build.js`)

```js
{
  // ---------------------------------------------------------------- content (change this block for a new subject)
  const TITLE = ['ERGONOMIC', 'DESK SET-UP'];
  const BLOCK = ['DRG  A-101', 'SCALE 1:10'];                                  // small print in the title block
  // the three pointers: [two short lines of lettering]. Their marks and anchors are set where the model is built.
  const NOTES = [['SCREEN TOP', 'AT EYE LEVEL'], ['ELBOWS', 'AT ABOUT 90°'], ['FEET FLAT', 'ON THE FLOOR']];

  // ---------------------------------------------------------------- the beats, in seconds (picture and sound share them)
  // 1 the plan is plotted flat on the sheet   2 the camera tips over and every part rises out of its own plan
  // 3 the three notes leave their column on the sheet and are tied to the model, one by one
  // 4 a section plane climbs through the wireframe and leaves it solid; the lamp in the model comes on
  const T = {
    draw: { desk: [-2.2, -1.1], items: [-1.3, -0.2], chair: [-0.5, 0.6], figure: [0.45, 1.45], lamp: [1.2, 1.75] },
    lift: 1.85, liftGap: 0.13, liftDur: 0.9,      // desk, chair, desk items, lamp, figure, in that order
    notes: [3.0, 3.2, 3.4], fly: 0.85,            // the notes leave the sheet one after another and fly to their places beside the model
    marks: [3.85, 4.25, 4.65],                    // then each one is tied to the model: a leader, and its mark drawn on the part
    fill: [5.2, 6.6],
    lamp: 6.7,
  };
  const LIFT_ORDER = { desk: 0, chair: 1, items: 2, lamp: 3, figure: 4 };
  const liftAt = (name) => T.lift + LIFT_ORDER[name] * T.liftGap;

  const INK = '#f1f6ff', PAPER = '#1f52ad';
  const HEAVY = 3.6, LIGHT = 2.0, FINE = 1.2;   // line weights in pixels: outlines, construction and dimensions, grid

  // ================================================================ the blueprint kit (reusable: nothing below knows about desks)
  //   ink(list, opts)           draws line records { a, b, w, alpha, at, dur, ... } with a constant width on screen. Every
  //                             line draws itself on from `at` over `dur`. opts.hidden draws only the parts that are
  //                             BEHIND a surface, dashed (the hidden-line convention); opts.onTop ignores depth.
  //   edgesOf(geometry)         the hard edges of any mesh as line records
  //   penOrder(list, t0, t1)    sorts line records so the pen travels as little as possible and gives them times
  //   letter(text, opts)        single-stroke drafting capitals made of the same lines, plotted letter by letter
  //   dimension(a, b, opts)     witness lines, a dimension line with arrowheads and its figure, anywhere in 3D
  //   buildable(material)       gives a material a section plane: below it the real material, at it a hatched cut
  //                             face, above it nothing. depthOnly() keeps the unbuilt part hiding lines behind it.
  //   sheet(opts)               the paper: blueprint blue with grain, uneven exposure, fibres and worn fold creases
  function blueprintKit(S) {
    const { THREE, K, scene } = S;
    const U = {
      uTime: { value: 0 }, uRes: { value: new THREE.Vector2(S.W, S.H) },
      uLift: { value: new Array(12).fill(1) },                               // height scale of each lift group (0 = flat on the sheet)
      uInk: { value: new THREE.Color(INK) }, uInk2: { value: new THREE.Color(PAPER).multiplyScalar(0.55) },
      uFill: { value: -10 }, uFillN: { value: new THREE.Vector3(0.22, 1, -0.16) },   // the section plane: dot(uFillN, p) = uFill
      uPool: { value: new THREE.Vector4(0, 0, 3, 9) },                       // ink dims with the light pool on the sheet
    };
    const QUAD = new THREE.PlaneGeometry(1, 2).translate(0.5, 0, 0);          // x 0..1 along the line, y -1..1 across it

    const LINE_VS = `
      attribute vec3 aA, aB;
      attribute vec4 aTime;    // start, duration, cap at a, cap at b (caps in half line widths)
      attribute vec4 aStyle;   // width in px, alpha, taper (width multiplier at b: 0 makes an arrowhead), ink (0 white, 1 paper)
      attribute vec3 aKind;    // lift group, dash period in world units (0 = solid), dash style (1 dashes, 2 dash-dot)
      uniform float uTime, uBias, uFlat, uWidth;
      uniform vec2 uRes;
      uniform float uLift[12];
      varying float vAcross, vAlong, vAlpha, vW, vTip, vInk;
      varying vec2 vDash;
      varying vec3 vWorld;
      void main() {
        float lift = uFlat > 0.5 ? 0.0 : uLift[int(aKind.x + 0.5)];
        vec3 a = aA, b = aB; a.y *= lift; b.y *= lift;
        float p = clamp((uTime - aTime.x) / max(aTime.y, 1e-4), 0.0, 1.0);
        p = 1.0 - (1.0 - p) * (1.0 - p);
        vec3 h = mix(a, b, p);                                              // where the pen is now
        vec4 wa = modelMatrix * vec4(a, 1.0), wh = modelMatrix * vec4(h, 1.0);
        vec4 va = viewMatrix * wa, vh = viewMatrix * wh;
        vec4 ca = projectionMatrix * va, ch = projectionMatrix * vh;
        vec2 d = (ch.xy / ch.w - ca.xy / ca.w) * uRes * 0.5;
        float L = length(d), u = position.x, v = position.y;
        vec2 dir = L > 1e-4 ? d / L : vec2(1.0, 0.0), nrm = vec2(-dir.y, dir.x);
        float w0 = aStyle.x * uWidth, w = w0 * mix(1.0, aStyle.z, u);
        float ext = (u < 0.5 ? -aTime.z : aTime.w) * w0 * 0.5;
        vec4 c = mix(ca, ch, u);
        c.xy += (nrm * v * w * 0.5 + dir * ext) / (uRes * 0.5) * c.w;       // widen the line in screen space
        vec4 vb = mix(va, vh, u); vb.xyz *= 1.0 - uBias;                     // and pull it a little toward the lens, so it sits on its surface
        vec4 cz = projectionMatrix * vb; c.z = cz.z / cz.w * c.w;
        float wl = distance(wa.xyz, wh.xyz);
        if (p <= 0.0 || aStyle.y <= 0.0 || wl < 1e-5) c = vec4(2.0, 2.0, 2.0, 1.0);
        gl_Position = c;
        vAcross = v; vW = max(w, 0.6); vAlpha = aStyle.y; vInk = aStyle.w; vDash = aKind.yz;
        vAlong = u * wl; vWorld = mix(wa.xyz, wh.xyz, u);
        vTip = p < 1.0 ? (1.0 - u) * L : 1e4;
      }`;
    const LINE_FS = `
      uniform vec3 uInk, uInk2, uFillN;
      uniform float uHidden, uGhost, uOpacity, uFill, uTipGlow;
      uniform vec4 uPool;
      varying float vAcross, vAlong, vAlpha, vW, vTip, vInk;
      varying vec2 vDash;
      varying vec3 vWorld;
      void main() {
        float a = vAlpha * uOpacity * (1.0 - smoothstep(max(0.0, 1.0 - 1.4 / vW), 1.0, abs(vAcross)));
        float period = vDash.x, style = vDash.y;
        if (uHidden > 0.5) { period = 0.075; style = 1.0; }                 // hidden edges are always dashed
        if (period > 0.0) {
          float f = fract(vAlong / period);
          if (!(style < 1.5 ? f < 0.56 : (f < 0.56 || (f > 0.73 && f < 0.83)))) discard;
        }
        a *= mix(1.0, uGhost, smoothstep(0.0, 0.12, uFill - dot(uFillN, vWorld)));   // once the solid has passed, the line is a ghost
        vec3 col = mix(uInk, uInk2, vInk);
        col *= 1.0 + uTipGlow * exp(-vTip / 6.0);                           // the pen tip is hot while a line is being drawn
        col *= mix(1.0, 0.25, smoothstep(uPool.z, uPool.w, length(vWorld.xz - uPool.xy)));
        if (a < 0.004) discard;
        gl_FragColor = vec4(col, a);
      }`;

    const rec = (a, b, p = {}) => Object.assign({ a, b }, p);
    function ink(list, p = {}) {
      const n = list.length, g = new THREE.InstancedBufferGeometry();
      g.setIndex(QUAD.index); g.setAttribute('position', QUAD.attributes.position);
      const A = new Float32Array(n * 3), B = new Float32Array(n * 3), Tm = new Float32Array(n * 4), St = new Float32Array(n * 4), Kd = new Float32Array(n * 3);
      list.forEach((l, i) => {
        A.set(l.a, i * 3); B.set(l.b, i * 3);
        Tm.set([l.at == null ? -10 : l.at, l.dur == null ? 0.25 : l.dur, l.capA == null ? 1 : l.capA, l.capB == null ? 1 : l.capB], i * 4);
        St.set([l.w || LIGHT, l.alpha == null ? 1 : l.alpha, l.taper == null ? 1 : l.taper, l.ink || 0], i * 4);
        Kd.set([l.group || 0, l.dash || 0, l.dashStyle || 1], i * 3);
      });
      for (const [name, arr, size] of [['aA', A, 3], ['aB', B, 3], ['aTime', Tm, 4], ['aStyle', St, 4], ['aKind', Kd, 3]]) g.setAttribute(name, new THREE.InstancedBufferAttribute(arr, size));
      g.instanceCount = n;
      return inkMesh(g, p);
    }
    // a second drawing of the same lines (another pass, or the flat copy left on the sheet): inkMesh(first.geometry, opts)
    function inkMesh(g, p = {}) {
      const mat = new THREE.ShaderMaterial({
        uniforms: Object.assign({}, U, { uOpacity: { value: p.opacity == null ? 1 : p.opacity }, uGhost: { value: 1 }, uHidden: { value: p.hidden ? 1 : 0 }, uFlat: { value: p.flat ? 1 : 0 },
          uBias: { value: p.bias == null ? 0.0022 : p.bias }, uWidth: { value: p.width || 1 }, uTipGlow: { value: p.tip == null ? 1.4 : p.tip } }),
        vertexShader: LINE_VS, fragmentShader: LINE_FS, transparent: true, depthWrite: false, depthTest: !p.onTop,
        depthFunc: p.hidden ? THREE.GreaterDepth : THREE.LessEqualDepth,
      });
      const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = p.order == null ? 4 : p.order;
      (p.parent || scene).add(mesh);
      return mesh;
    }

    function edgesOf(geo, angle = 25) {
      const p = new THREE.EdgesGeometry(geo, angle).attributes.position, out = [];
      for (let i = 0; i < p.count; i += 2) out.push(rec([p.getX(i), p.getY(i), p.getZ(i)], [p.getX(i + 1), p.getY(i + 1), p.getZ(i + 1)]));
      return out;
    }
    // Plotter order: start at one corner, always go on to the nearest free end, and hand out times along the way.
    // Distances are measured in plan (y counts little), because that is how the drawing is first seen.
    function penOrder(list, t0, t1, dur = 0.28) {
      const d2 = (p, q) => (p[0] - q[0]) ** 2 + (p[2] - q[2]) ** 2 + 0.05 * (p[1] - q[1]) ** 2, left = list.slice(), out = [];
      left.sort((p, q) => (p.a[0] + p.a[2]) - (q.a[0] + q.a[2]));
      let cur = left.shift(); out.push(cur);
      while (left.length) {
        let bi = 0, bd = Infinity, flip = false;
        for (let i = 0; i < left.length; i++) { const da = d2(cur.b, left[i].a), db = d2(cur.b, left[i].b); if (da < bd) { bd = da; bi = i; flip = false; } if (db < bd) { bd = db; bi = i; flip = true; } }
        cur = left.splice(bi, 1)[0]; if (flip) [cur.a, cur.b] = [cur.b, cur.a]; out.push(cur);
      }
      const len = out.map((l) => 0.02 + Math.hypot(l.b[0] - l.a[0], l.b[2] - l.a[2])), total = len.reduce((s, x) => s + x, 0); let run = 0;
      out.forEach((l, i) => { l.at = t0 + (t1 - t0 - dur) * run / total; l.dur = dur; run += len[i]; });
      return out;
    }

    // Drafting capitals from lib/strokefont.js. p: size (cap height), align, map(x, y) -> [x, y, z] (what puts the words on
    // the sheet, on a wall or in a label), at, per (seconds per letter), w, alpha, ink, squeeze (letter width)
    function letter(text, p = {}) {
      const size = p.size || 0.1, sq = p.squeeze || 0.9, map = p.map || ((x, y) => [x, y, 0]), per = p.per == null ? 0.028 : p.per, out = [];
      const lay = STROKEFONT.layout(text.replace(/°/g, ' '), { size, align: p.align || 'left', spacing: 0.2, step: p.step || 0.075 });
      const seg = (x0, y0, x1, y1, at, capA, capB) => out.push(rec(map(x0 * sq, y0), map(x1 * sq, y1), { at, dur: per * 1.2, w: p.w || LIGHT, alpha: p.alpha, ink: p.ink, capA, capB }));
      let n = 0;
      lay.glyphs.forEach((gl, i) => {
        const at = (p.at == null ? -10 : p.at) + n * per;
        if (text[i] === '°') { const r = 0.15 * size, cx = gl.x + 0.2 * size, cy = gl.y + size - r; for (let k = 0; k < 10; k++) { const a0 = k / 10 * 6.2832, a1 = (k + 1) / 10 * 6.2832; seg(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, at, 0.2, 0.2); } n++; return; }
        if (gl.strokeIndexes.length) n++;
        gl.strokeIndexes.forEach((si) => {
          const st = lay.strokes[si], pts = st.closed ? st.points.concat([st.points[0]]) : st.points, m = pts.length - 1;
          for (let k = 0; k < m; k++) seg(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], at + per * 0.9 * k / m, k === 0 && !st.closed ? 1 : 0.2, k === m - 1 && !st.closed ? 1 : 0.2);
        });
      });
      out.width = lay.width * sq; out.end = (p.at == null ? -10 : p.at) + n * per + per * 1.2;
      return out;
    }

    const add = (p, q, k = 1) => [p[0] + q[0] * k, p[1] + q[1] * k, p[2] + q[2] * k], sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
    const unit = (p) => { const l = Math.hypot(p[0], p[1], p[2]) || 1; return [p[0] / l, p[1] / l, p[2] / l]; };
    const arrow = (tip, dir, p = {}) => rec(add(tip, dir, -(p.len || 0.075)), tip, { w: p.head || 11, taper: 0, capA: 0, capB: 0, at: p.at, dur: p.dur || 0.12 });
    // the same lines with a dark edge under them, so they stay readable where they cross a light surface
    const cased = (list, extra = 3.6) => list.map((l) => Object.assign({}, l, { ink: 1, w: (l.w || LIGHT) + extra, alpha: 0.8 })).concat(list);
    // A dimension between two points. off = the vector from the measured points out to the dimension line (it also sets
    // which way is "up" for the figure; flip puts the figure on the inner side). The figure reads along a -> b.
    function dimension(a, b, p = {}) {
      const off = p.off, on = unit(off), up = p.flip ? on.map((x) => -x) : on, dir = unit(sub(b, a)), A1 = add(a, off), B1 = add(b, off), at = p.at == null ? -10 : p.at, mid = add(add(A1, B1), [0, 0, 0]).map((x) => x / 2);
      const out = [
        rec(add(a, on, 0.04), add(A1, on, 0.05), { at, dur: 0.2 }), rec(add(b, on, 0.04), add(B1, on, 0.05), { at: at + 0.05, dur: 0.2 }),
        rec(mid, A1, { at: at + 0.15, dur: 0.3, capA: 0 }), rec(mid, B1, { at: at + 0.15, dur: 0.3, capA: 0 }),
        arrow(A1, dir.map((x) => -x), { at: at + 0.38 }), arrow(B1, dir, { at: at + 0.38 }),
      ];
      const size = p.size || 0.06, w = letter(p.text, { size }).width;
      return out.concat(letter(p.text, { size, at: at + 0.3, per: 0.05, w: p.w || 2.2, map: (x, y) => add(add(mid, dir, x - w / 2), up, y + size * 0.5 + (p.gap || 0.03)) }));
    }

    // ---- solids that can be built up. The section plane is shared with the lines (uFill, uFillN).
    const FILL = { uFill: U.uFill, uFillN: U.uFillN, uCutA: { value: new THREE.Color('#dbe8ff') }, uCutB: { value: new THREE.Color(PAPER).multiplyScalar(0.8) }, uTint: { value: new THREE.Color('#5d97ff') }, uBand: { value: 0.16 } };
    const CUT_VS = ['#include <common>', '#include <common>\nvarying vec3 vBW;', '#include <begin_vertex>', '#include <begin_vertex>\nvBW = (modelMatrix * vec4(transformed, 1.0)).xyz;'];
    function buildable(mat) {
      mat.side = THREE.DoubleSide;     // the inside of the shell, seen through the cut, is painted as the cut face
      mat.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, FILL);
        sh.vertexShader = sh.vertexShader.replace(CUT_VS[0], CUT_VS[1]).replace(CUT_VS[2], CUT_VS[3]);
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vBW; uniform float uFill, uBand; uniform vec3 uFillN, uCutA, uCutB, uTint;')
          .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nfloat bd = uFill - dot(uFillN, vBW); if (bd < 0.0) discard;')
          .replace('#include <opaque_fragment>', `#include <opaque_fragment>
            if (!gl_FrontFacing) {
              // where the eye's ray meets the section plane: hatch that point at 45 degrees, as a draughtsman hatches cut material
              vec3 rd = normalize(vBW - cameraPosition);
              vec3 pc = cameraPosition + rd * (uFill - dot(uFillN, cameraPosition)) / dot(uFillN, rd);
              float hs = abs(fract((pc.x + pc.z) / 0.034) - 0.5) * 2.0, aa = fwidth((pc.x + pc.z) / 0.034) * 2.0;
              gl_FragColor.rgb = mix(uCutA, uCutB, smoothstep(0.62 - aa, 0.62 + aa, hs));
            } else {
              // just under the plane the new surface is still a blue-toned drawing of itself, then it takes its real colour
              float l = dot(gl_FragColor.rgb, vec3(0.2126, 0.7152, 0.0722));
              gl_FragColor.rgb = mix(uTint * (0.22 + 1.5 * l), gl_FragColor.rgb, smoothstep(0.0, uBand, bd));
              gl_FragColor.rgb = mix(uCutA, gl_FragColor.rgb, smoothstep(0.004, 0.011, bd));
            }`);
      };
      return mat;
    }
    const cutShadow = new THREE.MeshDepthMaterial({ side: THREE.DoubleSide });   // only the built part throws a shadow
    cutShadow.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, FILL);
      sh.vertexShader = sh.vertexShader.replace(CUT_VS[0], CUT_VS[1]).replace(CUT_VS[2], CUT_VS[3]);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vBW; uniform float uFill; uniform vec3 uFillN;')
        .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nif (uFill - dot(uFillN, vBW) < 0.0) discard;');
    };
    // writes depth and no colour: the unbuilt object still hides what is behind it, so hidden edges can be told apart
    const depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false, transparent: true });

    // ---- the paper
    function sheet(o) {
      const N = 512, grain = K.canvasTex(N, N, (ctx) => {
        const r = K.rng(7), layer = (draw) => { const c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, N, N); draw(x); return x.getImageData(0, 0, N, N).data; };
        const wrap = (x, fn) => { for (const dx of [-N, 0, N]) for (const dy of [-N, 0, N]) { x.save(); x.translate(dx, dy); fn(); x.restore(); } };
        const blot = layer((x) => { x.fillStyle = '#808080'; x.fillRect(0, 0, N, N); for (let i = 0; i < 420; i++) { const px = r() * N, py = r() * N, rad = r.range(6, 46), v = r() < 0.5 ? 255 : 0; const g = x.createRadialGradient(px, py, 0, px, py, rad); g.addColorStop(0, `rgba(${v},${v},${v},0.16)`); g.addColorStop(1, `rgba(${v},${v},${v},0)`); x.fillStyle = g; wrap(x, () => x.fillRect(px - rad, py - rad, rad * 2, rad * 2)); } });
        const fibre = layer((x) => { x.lineCap = 'round'; for (let i = 0; i < 900; i++) { const px = r() * N, py = r() * N, a = r() * 6.28, l = r.range(4, 22), b = r.range(-0.5, 0.5); x.strokeStyle = `rgba(255,255,255,${r.range(0.15, 0.8)})`; x.lineWidth = r.range(0.5, 1.3); wrap(x, () => { x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a + b) * l * 0.5, py + Math.sin(a + b) * l * 0.5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }); } });
        const img = ctx.createImageData(N, N);
        for (let i = 0; i < N * N; i++) { img.data[i * 4] = 255 * r(); img.data[i * 4 + 1] = blot[i * 4]; img.data[i * 4 + 2] = fibre[i * 4]; img.data[i * 4 + 3] = 255; }
        ctx.putImageData(img, 0, 0);     // R fine tooth, G soft blotches, B fibres
      }, { data: true, repeat: [1, 1] });
      const mat = new THREE.MeshStandardMaterial({ color: o.color, roughness: 0.86, metalness: 0 });
      mat.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, { uGrain: { value: grain }, uFold: { value: new THREE.Vector4(...o.fold) }, uWear: { value: new THREE.Color(o.wear || '#7fa6ee') } });
        sh.vertexShader = sh.vertexShader.replace(CUT_VS[0], CUT_VS[1]).replace(CUT_VS[2], CUT_VS[3]);
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vBW; uniform sampler2D uGrain; uniform vec4 uFold; uniform vec3 uWear;')
          .replace('#include <map_fragment>', `#include <map_fragment>
            vec2 sp = vBW.xz;
            vec3 g1 = texture2D(uGrain, sp * 1.9).rgb, g2 = texture2D(uGrain, sp * 0.21 + 0.31).rgb, g3 = texture2D(uGrain, sp * 0.045 + 0.7).rgb;
            diffuseColor.rgb *= 1.0 + (g1.r - 0.5) * 0.20 + (g1.g - 0.5) * 0.22 + (g2.g - 0.5) * 0.34 + (g3.g - 0.5) * 0.5;   // tooth, and exposure that never came out even
            diffuseColor.rgb += vec3(0.035, 0.06, 0.10) * smoothstep(0.3, 0.9, g1.b);                                       // pale fibres in the stock
            vec2 fq = (sp - uFold.xy) / uFold.zw, fs = (fract(fq + 0.5) - 0.5) * uFold.zw;                                  // signed distance to the nearest fold, each way
            float wear = max(1.0 - smoothstep(0.0, 0.008, abs(fs.x)), 1.0 - smoothstep(0.0, 0.008, abs(fs.y)));
            wear = max(wear * (0.25 + 0.75 * smoothstep(0.25, 0.6, g2.r)), 0.35 * max(1.0 - smoothstep(0.0, 0.05, abs(fs.x)), 1.0 - smoothstep(0.0, 0.05, abs(fs.y))) * g2.g);
            diffuseColor.rgb = mix(diffuseColor.rgb, uWear, wear * 0.6);                                                    // ink rubbed off along the folds`)
          .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
            vec2 par = mod(floor(fq + 0.5), 2.0) * 2.0 - 1.0;                                                               // mountain and valley folds alternate
            vec2 tilt = par * sign(fs) * exp(-abs(fs) / 0.11) * 0.2 + (g3.rb - 0.5) * 0.03;
            normal = normalize((viewMatrix * vec4(normalize(vec3(tilt.x, 1.0, tilt.y)), 0.0)).xyz);`);
      };
      const [x0, z0, x1, z1] = o.rect, mesh = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2).translate((x0 + x1) / 2, 0, (z0 + z1) / 2), mat);
      mesh.receiveShadow = true; scene.add(mesh);
      return mesh;
    }

    return { U, rec, ink, inkMesh, edgesOf, penOrder, letter, dimension, arrow, cased, buildable, cutShadow, depthOnly, sheet, add, sub, unit };
  }

  registerStyle({
    id: 'blueprint-build',
    name: 'Blueprint Build',
    family: 'Diagrams with depth',
    look: 'A real drafting sheet: deep blueprint blue with grain and worn fold creases, a title block, a construction grid, crisp white linework in two weights with hidden edges dashed, dimension arrows and numbered notes in plotted single-stroke capitals. The drawing turns out to be a 3D wireframe, and then a solid object standing on its own plan.',
    motion: 'Lines plot themselves in pen order with a hot tip. As the camera tips over, each part rises out of its own plan, which stays printed on the sheet. The numbered notes peel off the paper, turn to face the lens and are tied to the model with leaders, one by one. Then a hatched section plane climbs through the wireframe and leaves real material under it.',
    light: 'One soft key from behind and to the side, so tops and one flank are lit, the near faces stay in shade and a long soft shadow falls toward the camera across the sheet. A little cool fill. At the end the desk lamp in the model switches on.',
    materials: 'Uncoated blue paper that takes the light, flat white ink. The built object is restrained and real: pale oak, matt white steel, rust wool, off-white plaster, graphite plastic. The white lines stay on it as a faint ghost.',
    camera: 'One continuous crane move with a long lens that opens up: it starts straight above the sheet, where the drawing reads as a flat plan, tips down to a three-quarter view as the drawing gains height, and keeps drifting in until the last frame.',
    post: 'Almost none: neutral tone curve so the blue and white stay true, light vignette, a trace of bloom on pen tips and the lamp, fine grain. Hidden lines are found by a real depth test, not drawn by hand.',
    explains: 'Plans, set-ups and how-it-is-made: first the layout as a flat drawing, then the same thing as an object, with dimensions and two or three numbered pointers attached to the places they talk about.',
    topic: 'An ergonomic desk set-up: screen top at eye level, elbows at about 90 degrees, feet flat on the floor',
    duration: 8,
    fonts: [],
    render: { samples: 28, shutter: 0.5, tone: 'neutral', exposure: 1.0, bloom: 0.3, bloomThreshold: 1.05, vignette: 0.34, grain: 0.016, fov: 20, near: 0.5, far: 120, background: '#070a12' },

    build(S) {
      const { THREE, K, scene, camera } = S;
      const B = blueprintKit(S), { U, rec, ink, inkMesh, letter, dimension, arrow } = B;

      // ---------------------------------------------------------------- the subject, from simple forms
      // Everything is modelled in metres with the sitter facing +u, then turned to face west on the sheet (x = CX - u).
      // A part is a solid, the edges that get drawn for it, a lift group and a line weight.
      const CX = 0.36, PLACE = new THREE.Matrix4().makeRotationY(Math.PI).setPosition(CX, 0, 0);
      const W = (u, y, z) => [CX - u, y, -z];                       // model point -> sheet point (for dimensions and notes)
      const GROUPS = ['paper', 'desk', 'chair', 'items', 'lamp', 'figure'], gid = (name) => GROUPS.indexOf(name);
      const parts = [], Y = new THREE.Vector3(0, 1, 0), v3 = (p) => new THREE.Vector3(p[0], p[1], p[2]);
      const part = (group, mat, geo, wire, m, w) => {
        const full = PLACE.clone().multiply(m); geo.applyMatrix4(full);
        wire.forEach((l) => { l.a = v3(l.a).applyMatrix4(full).toArray(); l.b = v3(l.b).applyMatrix4(full).toArray(); l.group = gid(group); l.w = w || HEAVY; });
        parts.push({ group, mat, geo, wire });
      };
      const pose = (c, rot) => new THREE.Matrix4().compose(v3(c), new THREE.Quaternion().setFromEuler(new THREE.Euler(...(rot || [0, 0, 0]))), new THREE.Vector3(1, 1, 1));
      // box(group, material, centre, size, { r: edge radius, rot, w: line weight }): drawn as its twelve sharp edges
      const box = (group, mat, c, s, o = {}) => part(group, mat, K.roundedBox(s[0], s[1], s[2], o.r == null ? 0.008 : o.r, 3), B.edgesOf(new THREE.BoxGeometry(s[0], s[1], s[2])), pose(c, o.rot), o.w);
      const ring = (r, y, n = 28) => Array.from({ length: n }, (_, i) => rec([Math.cos(i / n * 6.2832) * r, y, Math.sin(i / n * 6.2832) * r], [Math.cos((i + 1) / n * 6.2832) * r, y, Math.sin((i + 1) / n * 6.2832) * r], { capA: 0.2, capB: 0.2 }));
      // rod(group, material, from, to, r0, r1, { oval: [sx, sz] }): a round or oval bar, drawn as its two end rings and four generator lines
      const rod = (group, mat, a, b, r0, r1 = r0, o = {}) => {
        const A = v3(a), Bv = v3(b), len = A.distanceTo(Bv), ov = o.oval || [1, 1];
        const m = new THREE.Matrix4().compose(A.clone().add(Bv).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(Y, Bv.clone().sub(A).normalize()), new THREE.Vector3(ov[0], 1, ov[1]));
        const wire = ring(r0, -len / 2).concat(ring(r1, len / 2), [0, 1, 2, 3].map((k) => rec([Math.cos(k * 1.5708) * r0, -len / 2, Math.sin(k * 1.5708) * r0], [Math.cos(k * 1.5708) * r1, len / 2, Math.sin(k * 1.5708) * r1], { capA: 0, capB: 0 })));
        part(group, mat, new THREE.CylinderGeometry(r1, r0, len, 40, 1), wire, m, o.w);
      };
      // ball(group, material, centre, r, { scale }): drawn the way a draughtsman draws a sphere, as three great circles
      const ball = (group, mat, c, r, o = {}) => {
        const g = ring(r, 0), turn = (l, f) => rec(f(l.a), f(l.b), { capA: 0.2, capB: 0.2 });
        const wire = g.concat(g.map((l) => turn(l, (p) => [p[0], p[2], 0])), g.map((l) => turn(l, (p) => [0, p[2], p[0]])));
        part(group, mat, new THREE.SphereGeometry(r, 40, 26), wire, new THREE.Matrix4().compose(v3(c), new THREE.Quaternion(), new THREE.Vector3(...(o.scale || [1, 1, 1]))), o.w);
      };

      // restrained, real materials. buildable() gives each one the section plane.
      const woodTex = (base, dark, seed) => K.canvasTex(512, 1024, (ctx, w, h) => {
        const r = K.rng(seed); ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 260; i++) { const x = r() * w, a = r.range(0.03, 0.16), wob = r.range(2, 14), ph = r() * 6; ctx.strokeStyle = r() < 0.75 ? `rgba(${dark},${a})` : `rgba(255,236,200,${a * 0.7})`; ctx.lineWidth = r.range(0.6, 3.2); ctx.beginPath(); for (let y = 0; y <= h; y += 24) ctx.lineTo(x + Math.sin(y / 170 + ph) * wob, y); ctx.stroke(); }
      });
      const std = (color, roughness, o = {}) => B.buildable(new THREE.MeshStandardMaterial(Object.assign({ color, roughness, metalness: 0 }, o)));
      const MAT = {
        oak: std('#ffffff', 0.5, { map: woodTex('#cda671', '120,78,36', 3) }),
        steel: std('#e9e8e4', 0.42, { metalness: 0.15 }),
        wool: std('#bb5a31', 0.95),
        shell: std('#25282e', 0.5),
        alu: std('#b4b8bf', 0.36, { metalness: 0.9 }),
        plaster: std('#ebe6dc', 0.72),
        graphite: std('#1d2025', 0.42),
        key: std('#d9d8d3', 0.6),
        cream: std('#efe9dc', 0.5),
        paperWhite: std('#f3f1ea', 0.8),
        mug: std('#d9643a', 0.35),
        glow: B.buildable(new THREE.MeshStandardMaterial({ color: '#2a2622', emissive: '#ffcf8a', emissiveIntensity: 0 })),
      };

      // desk: 1300 x 700, top at 740
      box('desk', MAT.oak, [0.55, 0.725, 0], [0.7, 0.03, 1.3], { r: 0.006 });
      for (const u of [0.25, 0.85]) for (const z of [-0.6, 0.6]) box('desk', MAT.steel, [u, 0.355, z], [0.045, 0.71, 0.045], { r: 0.006, w: LIGHT });
      for (const z of [-0.6, 0.6]) box('desk', MAT.steel, [0.55, 0.685, z], [0.555, 0.05, 0.025], { r: 0.004, w: LIGHT });
      box('desk', MAT.steel, [0.85, 0.685, 0], [0.025, 0.05, 1.155], { r: 0.004, w: LIGHT });

      // on the desk: monitor (top edge at 1260 = eye level), keyboard, mouse, notebook, mug
      const EYE = 1.26;
      box('items', MAT.graphite, [0.7, EYE - 0.165, 0], [0.028, 0.33, 0.58], { r: 0.008 });
      box('items', MAT.alu, [0.735, 0.9, 0], [0.022, 0.3, 0.07], { r: 0.006, rot: [0, 0, -0.1], w: LIGHT });
      box('items', MAT.alu, [0.745, 0.746, 0], [0.19, 0.012, 0.27], { r: 0.005, w: LIGHT });
      box('items', MAT.key, [0.345, 0.749, 0], [0.13, 0.018, 0.4], { r: 0.006, w: LIGHT });
      ball('items', MAT.key, [0.35, 0.752, -0.33], 0.034, { scale: [1.5, 0.55, 1], w: LIGHT });
      box('items', MAT.paperWhite, [0.52, 0.748, -0.44], [0.21, 0.016, 0.15], { r: 0.004, rot: [0, 0.14, 0], w: LIGHT });
      rod('items', MAT.mug, [0.5, 0.74, 0.3], [0.5, 0.83, 0.3], 0.036, 0.04, { w: LIGHT });

      // chair: seat at 500, five-star base
      box('chair', MAT.wool, [0.14, 0.465, 0], [0.46, 0.07, 0.46], { r: 0.03 });
      box('chair', MAT.wool, [-0.185, 0.83, 0], [0.055, 0.5, 0.42], { r: 0.026, rot: [0, 0, 0.13] });
      box('chair', MAT.shell, [0.1, 0.415, 0], [0.22, 0.035, 0.2], { r: 0.008, w: LIGHT });
      rod('chair', MAT.shell, [-0.02, 0.41, 0], [-0.17, 0.47, 0], 0.02, 0.02, { w: LIGHT });
      rod('chair', MAT.shell, [-0.17, 0.47, 0], [-0.165, 0.66, 0], 0.02, 0.02, { w: LIGHT });
      rod('chair', MAT.alu, [0.12, 0.11, 0], [0.12, 0.4, 0], 0.03, 0.022, { w: LIGHT });
      rod('chair', MAT.shell, [0.12, 0.07, 0], [0.12, 0.135, 0], 0.05, 0.045, { w: LIGHT });
      for (let k = 0; k < 5; k++) {
        const a = k * 1.2566 + 0.31, cu = 0.12 + Math.cos(a) * 0.3, cz = Math.sin(a) * 0.3;
        rod('chair', MAT.alu, [0.12 + Math.cos(a) * 0.04, 0.105, Math.sin(a) * 0.04], [cu, 0.07, cz], 0.022, 0.016, { w: LIGHT });
        ball('chair', MAT.shell, [cu, 0.03, cz], 0.03, { w: LIGHT });
      }

      // lamp, at the far corner
      rod('lamp', MAT.cream, [0.76, 0.74, 0.5], [0.76, 0.762, 0.5], 0.085, 0.08, { w: LIGHT });
      rod('lamp', MAT.cream, [0.76, 0.76, 0.5], [0.85, 1.07, 0.48], 0.011, 0.011, { w: LIGHT });
      ball('lamp', MAT.alu, [0.85, 1.07, 0.48], 0.02, { w: LIGHT });
      rod('lamp', MAT.cream, [0.85, 1.07, 0.48], [0.6, 1.29, 0.4], 0.011, 0.011, { w: LIGHT });
      const LAMP_A = [0.61, 1.3, 0.405], LAMP_B = [0.5, 1.2, 0.34];
      rod('lamp', MAT.cream, LAMP_A, LAMP_B, 0.03, 0.09);
      ball('lamp', MAT.glow, [0.52, 1.218, 0.352], 0.034, { w: FINE });

      // the sitter: a drafting mannequin of bars and ball joints, posed the way the three notes say
      const ELBOW = [0.02, 0.79], KNEE = [0.43, 0.57];
      ball('figure', MAT.plaster, [0.025, EYE + 0.005, 0], 0.105, { scale: [1, 1.1, 0.92] });
      ball('figure', MAT.plaster, [0.128, EYE - 0.02, 0], 0.022, { w: LIGHT });                                 // a nose, so the head has a front
      rod('figure', MAT.plaster, [0, 1.07, 0], [0.012, 1.17, 0], 0.045, 0.042, { w: LIGHT });
      rod('figure', MAT.plaster, [0, 0.6, 0], [0, 1.07, 0], 0.1, 0.108, { oval: [1, 1.6] });
      ball('figure', MAT.plaster, [0, 0.585, 0], 0.115, { scale: [1.05, 0.8, 1.45], w: LIGHT });
      for (const z of [-1, 1]) {
        ball('figure', MAT.plaster, [0, 1.035, z * 0.215], 0.056, { w: LIGHT });
        rod('figure', MAT.plaster, [0, 1.035, z * 0.215], [ELBOW[0], ELBOW[1], z * 0.215], 0.046, 0.04);
        ball('figure', MAT.plaster, [ELBOW[0], ELBOW[1], z * 0.215], 0.046, { w: LIGHT });
        rod('figure', MAT.plaster, [ELBOW[0], ELBOW[1], z * 0.215], [0.275, 0.79, z * 0.2], 0.04, 0.031);
        box('figure', MAT.plaster, [0.335, 0.786, z * 0.195], [0.105, 0.034, 0.072], { r: 0.015, w: LIGHT });
        rod('figure', MAT.plaster, [0.02, 0.57, z * 0.09], [KNEE[0], KNEE[1], z * 0.09], 0.07, 0.058);
        ball('figure', MAT.plaster, [KNEE[0], KNEE[1], z * 0.09], 0.06, { w: LIGHT });
        rod('figure', MAT.plaster, [KNEE[0], KNEE[1], z * 0.09], [0.43, 0.095, z * 0.09], 0.055, 0.04);
        ball('figure', MAT.plaster, [0.43, 0.085, z * 0.09], 0.044, { w: LIGHT });
        box('figure', MAT.plaster, [0.49, 0.04, z * 0.09], [0.25, 0.075, 0.095], { r: 0.03 });
      }

      // ---------------------------------------------------------------- lift groups: solids, depth shells and edges
      const rig = {};
      for (const name of GROUPS.slice(1)) { rig[name] = new THREE.Group(); scene.add(rig[name]); }
      for (const p of parts) {
        const solid = new THREE.Mesh(p.geo, p.mat); solid.castShadow = solid.receiveShadow = true; solid.customDepthMaterial = B.cutShadow; solid.userData.solid = true;
        const shell = new THREE.Mesh(p.geo, B.depthOnly); shell.renderOrder = 2;
        rig[p.group].add(solid, shell);
      }
      // the monitor's picture: a quiet page, lit from behind
      const screenTex = K.canvasTex(1024, 560, (ctx, w, h) => {
        ctx.fillStyle = '#e9eef5'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#c9d3e2'; ctx.fillRect(0, 0, w, 54); ctx.fillStyle = '#f8fafc'; ctx.fillRect(250, 90, 524, 470);
        ctx.fillStyle = '#9fb0c8'; ctx.fillRect(300, 140, 300, 26); ctx.fillStyle = '#c3cedd'; for (let i = 0; i < 9; i++) ctx.fillRect(300, 200 + i * 38, i % 4 === 3 ? 260 : 424, 14);
        ctx.fillStyle = '#b9c6d8'; for (let i = 0; i < 6; i++) ctx.fillRect(40, 100 + i * 46, 150, 18); ctx.fillStyle = '#e07a45'; ctx.fillRect(40, 400, 110, 30);
      });
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.555, 0.305).rotateY(-Math.PI / 2).translate(0.7 - 0.0148, EYE - 0.165, 0).applyMatrix4(PLACE), B.buildable(new THREE.MeshBasicMaterial({ map: screenTex, color: new THREE.Color(0.7, 0.72, 0.76) })));
      rig.items.add(screen);

      const edges = {};
      for (const name of GROUPS.slice(1)) edges[name] = B.penOrder(parts.filter((p) => p.group === name).flatMap((p) => p.wire), T.draw[name][0], T.draw[name][1]);
      const allEdges = Object.values(edges).flat();
      const wireMesh = ink(allEdges, { order: 4 });                                        // edges in front of every surface
      const hiddenMesh = inkMesh(wireMesh.geometry, { hidden: true, order: 3, opacity: 0.5, width: 0.62, tip: 0 });   // the same edges where something is in front of them
      const planMesh = inkMesh(wireMesh.geometry, { flat: true, order: 1, opacity: 0, bias: 0.006, width: 0.7, tip: 0 });   // and their plan, left behind on the sheet

      // ---------------------------------------------------------------- the sheet and everything printed on it
      const EAST = 1.84, SOUTH = 0.97, BX = 1.77, BZ = 0.92;                                   // paper edges, border
      B.sheet({ color: PAPER, rect: [-13, -14, EAST, SOUTH], fold: [EAST, SOUTH, 1.32, 1.33] });
      const table = new THREE.Mesh(new THREE.PlaneGeometry(60, 60).rotateX(-Math.PI / 2).translate(0, -0.006, 0), new THREE.MeshStandardMaterial({ map: woodTex('#3a2414', '10,5,2', 9), roughness: 0.55 }));
      table.material.map.repeat.set(6, 3); table.material.map.wrapS = table.material.map.wrapT = THREE.RepeatWrapping; table.receiveShadow = true; scene.add(table);
      // the sheet's own thin shadow on the table, along its two visible edges
      const edgeShade = (alongX) => { const t = K.canvasTex(64, 64, (ctx, w, h) => { const g = alongX ? ctx.createLinearGradient(0, 0, 0, h) : ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(0,0,0,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); });
        const m = new THREE.Mesh((alongX ? new THREE.PlaneGeometry(16, 0.07).translate(EAST - 8 + 0.07, -0.035, 0) : new THREE.PlaneGeometry(0.07, 16).translate(0.035, 8, 0)).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
        m.position.set(alongX ? 0 : EAST, -0.003, SOUTH); scene.add(m); };
      edgeShade(true); edgeShade(false);

      const onSheet = (x0, z0) => (x, y) => [x0 + x, 0, z0 - y];                            // lettering that reads from the south
      const print = [];
      for (let x = BX - 0.25; x > -12; x -= 0.25) print.push(rec([x, 0, BZ], [x, 0, -13], { w: FINE, alpha: Math.abs(Math.round(x) - x) < 0.01 ? 0.36 : 0.16 }));
      for (let z = BZ - 0.25; z > -13; z -= 0.25) print.push(rec([BX, 0, z], [-12, 0, z], { w: FINE, alpha: Math.abs(Math.round(z) - z) < 0.01 ? 0.36 : 0.16 }));
      print.push(rec([BX, 0, -13], [BX, 0, BZ], { w: HEAVY }), rec([BX, 0, BZ], [-12, 0, BZ], { w: HEAVY }));
      // title block, hard in the corner of the border as on any drawing
      const TB = [0.9, 0.57], RULE = 0.825, MID = 1.335, TITLE_Z = 0.64, TITLE_GAP = 0.122;
      print.push(rec([TB[0], 0, BZ], [TB[0], 0, TB[1]], { w: HEAVY }), rec([TB[0], 0, TB[1]], [BX, 0, TB[1]], { w: HEAVY }), rec([TB[0], 0, RULE], [BX, 0, RULE]), rec([MID, 0, RULE], [MID, 0, BZ]));
      TITLE.forEach((s, i) => print.push(...letter(s, { size: 0.082, w: 4.2, map: onSheet(TB[0] + 0.055, TITLE_Z + i * TITLE_GAP) })));
      BLOCK.forEach((s, i) => print.push(...letter(s, { size: 0.032, w: 1.7, alpha: 0.9, step: 0.14, map: onSheet((i ? MID : TB[0]) + 0.045, (RULE + BZ) / 2) })));
      // plan dimensions and the centre line through sitter and screen
      print.push(...dimension([CX - 0.9, 0, 0.65], [CX - 0.9, 0, -0.65], { off: [-0.2, 0, 0], text: '1300', at: -1.0 }));
      print.push(...dimension([CX - 0.9, 0, 0.65], [CX - 0.2, 0, 0.65], { off: [0, 0, 0.13], flip: true, text: '700', at: 0.15 }));
      print.push(rec([CX - 1.02, 0, 0], [CX + 0.42, 0, 0], { dash: 0.11, dashStyle: 2, alpha: 0.75, at: 1.0, dur: 0.6 }));
      print.push(...letter('DESK', { size: 0.045, w: 1.9, at: -0.9, per: 0.06, map: onSheet(CX - 0.78, 0.5) }));
      const printMesh = ink(print, { order: 1, bias: 0.006 });

      // ---------------------------------------------------------------- the three notes: a mark on the model, a leader, a numbered balloon, two lines of lettering
      const marks = [], [n1, n2, n3] = T.marks.map((t) => t - 0.2);
      // 1 a level line from the eye to the top edge of the screen
      marks.push(rec(W(0.13, EYE, 0), W(0.82, EYE, 0), { w: 2.6, dash: 0.1, dashStyle: 2, at: n1 + 0.3, dur: 0.5 }), arrow(W(0.13, EYE, 0), [1, 0, 0], { at: n1 + 0.7 }), arrow(W(0.686, EYE, 0), [-1, 0, 0], { at: n1 + 0.7 }));
      marks.push(rec(W(0.686, EYE - 0.07, 0), W(0.686, EYE + 0.07, 0), { w: 2.2, at: n1 + 0.65, dur: 0.15 }));
      // 2 the right angle at the elbow, drawn just outside the near arm
      const EZ = -0.265, R = 0.2;
      marks.push(rec(W(ELBOW[0], ELBOW[1], EZ), W(ELBOW[0], ELBOW[1] + 0.36, EZ), { w: 2.2, dash: 0.08, dashStyle: 2, at: n2 + 0.3, dur: 0.3 }), rec(W(ELBOW[0], ELBOW[1], EZ), W(ELBOW[0] + 0.4, ELBOW[1], EZ), { w: 2.2, dash: 0.08, dashStyle: 2, at: n2 + 0.3, dur: 0.3 }));
      for (let k = 0; k < 14; k++) { const a0 = k / 14 * 1.5708, a1 = (k + 1) / 14 * 1.5708; marks.push(rec(W(ELBOW[0] + Math.sin(a0) * R, ELBOW[1] + Math.cos(a0) * R, EZ), W(ELBOW[0] + Math.sin(a1) * R, ELBOW[1] + Math.cos(a1) * R, EZ), { w: HEAVY, capA: 0.2, capB: 0.2, at: n2 + 0.5 + k * 0.02, dur: 0.05 })); }
      marks.push(rec(W(ELBOW[0] + 0.055, ELBOW[1], EZ), W(ELBOW[0] + 0.055, ELBOW[1] + 0.055, EZ), { w: 2, at: n2 + 0.8, dur: 0.1 }), rec(W(ELBOW[0] + 0.055, ELBOW[1] + 0.055, EZ), W(ELBOW[0], ELBOW[1] + 0.055, EZ), { w: 2, at: n2 + 0.85, dur: 0.1 }));
      // 3 the contact patch under each foot, hatched on the sheet
      for (const z of [-1, 1]) {
        const u0 = 0.35, u1 = 0.63, z0 = z * 0.09 - 0.06, z1 = z * 0.09 + 0.06, y = 0.004;
        [[u0, z0, u1, z0], [u1, z0, u1, z1], [u1, z1, u0, z1], [u0, z1, u0, z0]].forEach((q, i) => marks.push(rec(W(q[0], y, q[1]), W(q[2], y, q[3]), { w: 2.6, at: n3 + 0.3 + i * 0.05, dur: 0.12 })));
        for (let k = 1; k < 8; k++) { const s = u0 + k * 0.05; marks.push(rec(W(Math.min(s, u1), y, z0 + Math.max(0, s - u1)), W(Math.max(s - 0.12, u0), y, z0 + Math.min(0.12, s - u0)), { w: 1.5, at: n3 + 0.5 + k * 0.03, dur: 0.1 })); }
      }
      // one dimension that stands up in space: the height of the desk, set out square to the final view
      marks.push(...dimension([CX - 0.9, 0, 0.65], [CX - 0.9, 0.74, 0.65], { off: [-0.175, 0, 0.097], text: '740', at: T.lift + 1.35 }));
      const NOTE_AT = [[0.74, 1.42, -0.34], [0.84, 0.95, -0.4], [0.82, 0.3, 0.1]];       // where each balloon floats
      const NOTE_TO = [W(0.3, EYE, 0), W(ELBOW[0] + 0.145, ELBOW[1] + 0.145, EZ), W(0.4, 0.004, -0.15)];
      NOTE_TO.forEach((p, i) => { const d = B.unit(B.sub(p, NOTE_AT[i])), at = T.marks[i]; marks.push(rec(NOTE_AT[i], p, { at, dur: 0.3, capA: 0 }), arrow(p, d, { at: at + 0.24, len: 0.06, head: 9 })); });
      ink(B.cased(marks), { order: 6, onTop: true });
      // the angle itself, as a pale quarter disc
      const wedge = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([W(ELBOW[0], ELBOW[1], EZ)].concat(Array.from({ length: 17 }, (_, k) => W(ELBOW[0] + Math.sin(k / 16 * 1.5708) * R, ELBOW[1] + Math.cos(k / 16 * 1.5708) * R, EZ))).map(v3)),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(INK), transparent: true, opacity: 0, depthTest: false, side: THREE.DoubleSide }));
      wedge.geometry.setIndex(Array.from({ length: 16 }, (_, k) => [0, k + 1, k + 2]).flat()); wedge.renderOrder = 5; scene.add(wedge);

      // Lettering that leaves the sheet. A flyer is a small group that starts printed flat on the paper and is carried
      // to a place in space while it turns to face the lens, so the same strokes serve as print and as a label.
      const FLAT = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)), flyers = [];
      const flyer = (home, away, at, dur, strokes) => { const g = new THREE.Group(); scene.add(g); ink(strokes, { parent: g, order: 8, onTop: true }); flyers.push({ g, home: v3(home), away: v3(away), at, dur, pulse: T.marks[flyers.length] }); return g; };
      const SIZE = 0.086, RB = 0.085;
      NOTES.forEach((lines, i) => {
        const txt = letter(String(i + 1), { size: 0.09, w: 4.8, ink: 1, align: 'center' });
        lines.forEach((s, k) => txt.push(...letter(s, { size: SIZE, squeeze: 0.84, w: 4.2, map: (x, y) => [RB + 0.05 + x, y + (0.5 - k) * SIZE * 1.6, 0] })));
        const g = flyer([0.75, 0.004, -0.54 + i * 0.36], NOTE_AT[i], T.notes[i], T.fly, txt);
        const disc = new THREE.Mesh(new THREE.CircleGeometry(RB, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(INK), depthTest: false, transparent: true })); disc.renderOrder = 7; g.add(disc);
      });


      // ---------------------------------------------------------------- light
      K.env(S, { top: '#9aa6bd', horizon: '#7f8aa3', bottom: '#1c2c4d', intensity: 0.3, panels: [{ pos: [9, 9, -7], size: [9, 9], color: '#fff2df', power: 3.5 }, { pos: [-8, 5, 9], size: [8, 6], color: '#cfe0ff', power: 1.2 }] });
      K.spot(S, { pos: [5.2, 8.6, -4.6], target: [0, 0.3, 0.1], color: '#fff3e2', power: 420, angle: 0.36, penumbra: 1, soft: 0.55, mapSize: 4096, near: 4, far: 30 });
      K.spot(S, { pos: [-5, 6, 9], target: [0, 0.5, 0], color: '#dfe9ff', power: 60, angle: 0.5, penumbra: 1, shadow: false });
      const bulbAt = v3([0.5, 1.19, 0.34]).applyMatrix4(PLACE), bulb = new THREE.PointLight('#ffc98a', 0, 3, 2); bulb.position.copy(bulbAt); scene.add(bulb);

      // ---------------------------------------------------------------- camera: one crane move. [target x, y, z, elevation, azimuth, frame height at the target, lens (tan of half the fov)]
      const CAM = K.path([
        [0, [0.36, 0, 0.1, 89.6, 0, 1.7, 0.085]],
        [1.75, [0.36, 0.03, 0.1, 79, 3, 1.74, 0.095]],
        [2.85, [0.44, 0.46, 0.08, 52, 14, 2.12, 0.14]],
        [3.9, [0.4, 0.62, -0.1, 31, 24, 2.12, 0.18]],
        [8, [0.4, 0.6, -0.12, 25, 29, 2.0, 0.2]],
      ]);
      const RAD = Math.PI / 180, wedgeInk = new THREE.Color(INK), wedgeBlue = new THREE.Color('#2f6fe0');
      const liftEase = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

      return {
        update(t) {
          U.uTime.value = t;
          // each part rises out of its plan
          for (const name of GROUPS.slice(1)) { const k = Math.max(1e-4, liftEase(K.seg(t, liftAt(name), liftAt(name) + T.liftDur))); U.uLift.value[gid(name)] = k; rig[name].scale.y = k; }
          // the section plane climbs through the model
          // (its time is snapped to the frame, so the cut face is not smeared by motion blur and its hatching stays crisp)
          const tf = Math.round(t * 30) / 30, f = K.seg(tf, T.fill[0], T.fill[1], (x) => x * x * (3 - 2 * x)), fill = K.lerp(-0.25, 1.75, f);
          U.uFill.value = t < T.fill[0] ? -10 : fill;
          planMesh.material.uniforms.uOpacity.value = 0.34 * K.seg(t, T.lift, T.lift + 0.25) * K.lerp(1, 0.55, f);
          for (const name of GROUPS.slice(1)) rig[name].children.forEach((m) => { if (m.userData.solid) m.visible = t >= T.fill[0]; });
          screen.visible = t >= T.fill[0];
          wireMesh.material.uniforms.uGhost.value = 0.34; hiddenMesh.material.uniforms.uGhost.value = 0.1;
          printMesh.material.uniforms.uOpacity.value = K.lerp(1, 0.6, K.seg(t, T.lift, T.lift + 1.5));
          // the lamp comes on
          const on = K.seg(t, T.lamp, T.lamp + 0.5, K.ease.out);
          MAT.glow.emissiveIntensity = 5 * on; bulb.intensity = 0.9 * on;

          const [tx, ty, tz, el, az, H, lens] = CAM(t), e = Math.min(el, 89.6) * RAD, a = az * RAD, d = H / (2 * lens);
          K.look(camera, [tx + d * Math.sin(a) * Math.cos(e), ty + d * Math.sin(e), tz + d * Math.cos(a) * Math.cos(e)], [tx, ty, tz], 2 * Math.atan(lens) / RAD);
          camera.updateMatrixWorld();
          wedge.material.opacity = K.lerp(0.3, 0.5, f) * K.seg(t, T.marks[1] + 0.3, T.marks[1] + 0.6); wedge.material.color.copy(wedgeInk).lerp(wedgeBlue, f);   // white on the drawing, blue on the plaster arm
          for (const n of flyers) { const k = K.smooth(n.at, n.at + n.dur, t); n.g.position.lerpVectors(n.home, n.away, k); n.g.quaternion.copy(FLAT).slerp(camera.quaternion, k); n.g.scale.setScalar(1 + 0.1 * Math.sin(Math.PI * k) + 0.14 * Math.sin(Math.PI * K.seg(t, n.pulse, n.pulse + 0.4))); }
        },
      };
    },

    sound(k) {
      k.bed('room', 0, 8, { gain: 0.9 });
      k.music('pad', 0, 8, { bpm: 60, chords: [['D3', 'A3', 'F#4', 'A4'], ['B2', 'F#3', 'D4', 'A4']], gain: 0.55 });
      // the plotter: pen on paper while a part is drawn, a short servo chirp as the pen moves on to the next part
      for (const [t0, t1] of Object.values(T.draw)) {
        if (t1 <= 0.1) continue;
        const a = Math.max(0, t0);
        k.play('stroke', a, { dur: t1 - a, material: 'pen', gain: 1.1, pan: -0.25 });
        if (t0 > 0) k.withMinor(() => k.tone(t0, { f: [[0, 520], [0.09, 780]], type: 'triangle', dur: 0.1, gain: 0.05, pan: -0.25 }));
      }
      k.play('tick', 0.53, { gain: 0.5, pan: -0.4 }); k.play('tick', 0.58, { gain: 0.4, pan: -0.2 });      // the arrowheads of the 700 dimension
      // the sheet tips over and each part rises out of its plan: a click as it lets go, a soft rising tone under it
      k.play('whoosh', T.lift - 0.15, { gain: 0.3 });
      Object.keys(LIFT_ORDER).forEach((name, i) => {
        const t = liftAt(name);
        k.play('click', t, { gain: 0.5, pan: -0.3 + i * 0.1 });
        k.tone(t, { f: [[0, 196 * Math.pow(1.122, i)], [T.liftDur, 392 * Math.pow(1.122, i)]], type: 'sine', dur: T.liftDur, gain: 0.03, a: 0.35, verb: 0.3 });
      });
      // the notes peel off the paper one after another; then each is tied to the model with a pop and a pen stroke
      T.notes.forEach((t, i) => k.play('paper', t, { dur: 0.3, gain: 0.6, pan: 0.45 }));
      T.marks.forEach((t, i) => { k.play('pop', t, { gain: 0.8, f: 500 + i * 90, pan: 0.45 }); k.play('stroke', t + 0.02, { dur: 0.36, material: 'pen', gain: 1.0, pan: 0.1 }); });
      // the section plane climbs: a narrow band of noise rising with it, and a low tone that lands as the last part closes
      const [f0, f1] = T.fill, fd = f1 - f0;
      k.noise(f0, { dur: fd, color: 'pink', filter: 'bandpass', f: [[0, 350], [fd, 2400]], q: 3.5, gain: 0.2, a: 0.35, verb: 0.25 });
      k.tone(f0, { f: [[0, 98], [fd, 196]], type: 'triangle', dur: fd, gain: 0.08, a: 0.5 });
      k.play('thud', f1 - 0.06, { gain: 0.2 });
      // the lamp
      k.play('click', T.lamp, { gain: 1.0, pan: -0.3 });
      k.play('ding', T.lamp + 0.04, { gain: 0.4, f: 'A5', pan: -0.3 });
    },
  });
}
```
