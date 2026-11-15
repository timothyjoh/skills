# Layer Stack (#29)

- **id:** `layer-stack`
- **Category:** Diagrams with depth
- **Use:** explainer
- **Reference duration:** 8 s
- **Google Fonts:** Space Grotesk, Inter, IBM Plex Mono
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`

## Style card

- **Look:** A system shown as a stack of thin glass sheets, each with its own diagram printed in white, floating one above the other over a dark machined plinth. Aqua edges glow like edge-lit acrylic against near-black; one amber is kept for the answer.
- **Motion:** The stack starts closed as one block. Sheets lift off one at a time from the top, float a little past their place and settle, and each label draws in beside its sheet as it lands. Then a bead of light drops through the same pad on every sheet, each sheet flashing white as it passes, and climbs back in amber; the sheets cool again behind it and only the top one stays lit.
- **Light:** One small key from high behind, so every sheet and its printed lines throw a crisp shadow onto the sheet below; a soft panel mirrored in the glass tops; a cool rim; the rest falls to black. The bead carries a real light that spills onto the sheets it passes.
- **Materials:** Lightly frosted glass that stays clear but keeps full-strength reflections, brighter aqua edges, matt white print that takes light and shadow, dark anodised aluminium, a satin floor with a faint reflection.
- **Camera:** Long lens, three-quarter view from above. It starts close on the closed block, cranes up and back with the first sheet as it rises, then keeps a very slow push toward the open stack.
- **Finish:** Motion blur on the lifts, bloom only on lit edges and the bead, a neutral grade that keeps the aqua and amber true, deep blacks, a soft vignette and very fine grain.
- **Good for:** Anything built in layers: a tech stack, a product teardown, how a request travels through a system. One sheet per layer with a simple diagram, a name and a short line beside it, and a pulse that shows the order things happen in.

## Reference

- **Sample topic:** What's inside an AI app: interface, agent, model, your data, chips
- **Gallery description:** A system shown as a stack of thin glass sheets, each with its own diagram printed in white, floating one above the other over a dark machined plinth. Aqua edges glow like edge-lit acrylic against near-black; one amber is kept for the answer.
- **Shown in the sample clip:** What's inside an AI app: interface, agent, model, your data, chips

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/layer-stack.js`)

```js
{
  // ---------------------------------------------------------------- content (change this for a new topic)
  // Layers from the top of the stack to the bottom. `diagram` names one of the prints in DIAGRAMS further down.
  const TITLE = ["What's inside", 'an AI app'];
  const LAYERS = [
    { name: 'INTERFACE', note: 'where you type', diagram: 'chat' },
    { name: 'AGENT', note: 'plans the steps', diagram: 'steps' },
    { name: 'MODEL', note: 'writes the answer', diagram: 'network' },
    { name: 'YOUR DATA', note: 'what it can read', diagram: 'files' },
    { name: 'CHIPS', note: 'where it all runs', diagram: 'chips' },
  ];
  const N = LAYERS.length;

  // ---------------------------------------------------------------- timing (picture and sound share it)
  const LIFT = [0.5, 1.15, 1.7, 2.2, 2.65];                 // when each sheet leaves the stack, top first
  const FREQ = [0.6, 0.72, 0.84, 0.95, 1.1];                // spring speed of each lift: the long trips are slower
  const labelAt = (i) => LIFT[i] + 0.5 / FREQ[i];           // the label arrives as its sheet settles
  const DOWN = 4.0, STEP_DOWN = 0.38;                       // the request leaves the top sheet, time per layer
  const UP = 5.9, STEP_UP = 0.2;                            // the answer leaves the bottom sheet, time per layer
  const hitDown = (i) => DOWN + i * STEP_DOWN;              // the request reaches layer i (0 = top)
  const hitUp = (i) => (i === N - 1 ? UP - 0.14 : UP + (N - 1 - i) * STEP_UP);   // the answer reaches layer i
  const ANSWER = hitUp(0);                                  // the reply appears on the chat screen

  // ---------------------------------------------------------------- the stack
  const W = 5.4, D = 3.3, TH = 0.11, GAP = 1.06, BASE = 0.18;   // sheet size, thickness, opened spacing, plinth height
  const closedY = (i) => BASE + (N - 1 - i) * (TH + 0.007) + TH / 2;
  const openY = (i) => BASE + 0.3 + (N - 1 - i) * GAP + TH / 2;
  // 0..1 progress of a lift: a damped spring, so a sheet starts gently, floats slightly past its place and settles
  const lift = (i, t) => K.spring(t - LIFT[i], FREQ[i], 0.78);
  const layerY = (i, t) => K.lerp(closedY(i), openY(i), lift(i, t));

  // ---------------------------------------------------------------- the printed diagrams
  // Every diagram is drawn white on black in a 1000 x 611 space (the sheet seen from above, front edge at the bottom)
  // and used as a mask: white is ink. Each one ends in the same round pad, bottom right. The pads line up through the
  // stack like a via through a circuit board, and that is the path the pulse of light takes.
  const PAD = [858, 486];
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
  const dot = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); };
  const line = (c, pts, lw = 7) => { c.lineWidth = lw; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke(); };
  const sheet = (c, i) => {
    c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#fff'; c.fillStyle = '#fff';
    c.lineWidth = 7; c.beginPath(); c.arc(PAD[0], PAD[1], 21, 0, Math.PI * 2); c.stroke(); dot(c, PAD[0], PAD[1], 8);     // the via pad
    c.strokeStyle = c.fillStyle = '#8d8d8d';                                                                          // fine print: crop marks and a tag
    for (const [x, y, sx, sy] of [[44, 44, 1, 1], [956, 44, -1, 1], [44, 567, 1, -1]]) line(c, [[x + 24 * sx, y], [x, y], [x, y + 24 * sy]], 3);
    c.font = '500 20px "IBM Plex Mono"'; c.textBaseline = 'middle'; c.letterSpacing = '2px'; c.fillText(`0${i + 1} / ${LAYERS[i].name}`, 86, 45); c.letterSpacing = '0px';
    c.strokeStyle = c.fillStyle = '#fff';
  };
  const drawChat = (c) => {   // a chat window: a question, a reply on its way, the input row
    c.lineWidth = 7; rr(c, 84, 92, 650, 448, 30); c.stroke();
    dot(c, 126, 136, 15); rr(c, 154, 127, 150, 18, 9); c.fill(); line(c, [[84, 178], [734, 178]], 5);
    rr(c, 424, 206, 270, 76, 28); c.fill();                                                 // the question (right)
    c.fillStyle = '#000'; rr(c, 452, 229, 176, 11, 5); c.fill(); rr(c, 452, 250, 112, 11, 5); c.fill(); c.fillStyle = '#fff';
    c.lineWidth = 6; rr(c, 122, 310, 150, 68, 28); c.stroke(); for (let k = 0; k < 3; k++) dot(c, 167 + k * 30, 344, 8);   // "typing..."
    rr(c, 122, 448, 492, 62, 31); c.stroke(); rr(c, 150, 465, 5, 28, 2); c.fill();                                       // input field with a caret
    dot(c, 676, 479, 33); c.strokeStyle = '#000'; line(c, [[676, 494], [676, 465]], 7); line(c, [[663, 477], [676, 464], [689, 477]], 7); c.strokeStyle = '#fff';   // send
    line(c, [[709, 479], [790, 479], [797, 486], [837, 486]], 6);
  };
  const drawAnswer = (c) => {   // the reply bubble that covers "typing..." at the end (in colour)
    c.fillStyle = '#ff9426'; rr(c, 122, 304, 400, 118, 30); c.fill();
    c.fillStyle = '#6b3300'; rr(c, 152, 331, 300, 12, 6); c.fill(); rr(c, 152, 357, 250, 12, 6); c.fill(); rr(c, 152, 383, 170, 12, 6); c.fill();
  };
  const drawSteps = (c) => {   // three numbered steps, a tick, and the loop back to step one
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 66px "Space Grotesk"';
    for (let k = 0; k < 4; k++) {
      const x = 96 + k * 172;
      c.lineWidth = 7; rr(c, x, 150, 124, 124, 26); if (k < 3) { c.stroke(); c.fillText(String(k + 1), x + 62, 216); } else { c.fill(); c.strokeStyle = '#000'; line(c, [[x + 36, 214], [x + 55, 234], [x + 90, 192]], 11); c.strokeStyle = '#fff'; }
      if (k < 3) { line(c, [[x + 136, 212], [x + 158, 212]], 6); line(c, [[x + 150, 203], [x + 160, 212], [x + 150, 221]], 6); }
    }
    c.textAlign = 'left';
    c.lineWidth = 6; c.beginPath(); c.moveTo(674, 286); c.arcTo(674, 392, 620, 392, 26); c.arcTo(158, 392, 158, 340, 26); c.lineTo(158, 292); c.stroke();   // the loop
    line(c, [[146, 306], [158, 290], [170, 306]], 6);
    line(c, [[740, 212], [832, 212], [858, 238], [858, 463]], 6);
  };
  const drawNetwork = (c) => {   // a small neural network
    const cols = [[150, [200, 300, 400]], [340, [150, 250, 350, 450]], [530, [150, 250, 350, 450]], [720, [250, 350]]];
    c.strokeStyle = '#7d7d7d';
    for (let k = 0; k < cols.length - 1; k++) for (const a of cols[k][1]) for (const b of cols[k + 1][1]) line(c, [[cols[k][0], a], [cols[k + 1][0], b]], 3);
    c.strokeStyle = '#fff';
    line(c, [[720, 350], [800, 350], [858, 408], [858, 463]], 6);
    for (const [x, ys] of cols) for (const y of ys) dot(c, x, y, 25);
  };
  const drawFiles = (c) => {   // four kinds of file on one shelf: text, table, chart, picture
    for (let k = 0; k < 4; k++) {
      const x = 100 + k * 165, y = 122, w = 122, h = 158, f = 32;
      c.lineWidth = 7; c.beginPath(); c.moveTo(x, y); c.lineTo(x + w - f, y); c.lineTo(x + w, y + f); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.closePath(); c.stroke();
      line(c, [[x + w - f, y], [x + w - f, y + f], [x + w, y + f]], 5);
      if (k === 0) for (let j = 0; j < 4; j++) { rr(c, x + 22, y + 56 + j * 23, j === 3 ? 46 : 78, 9, 4); c.fill(); }
      if (k === 1) { line(c, [[x + 22, y + 82], [x + 100, y + 82]], 5); line(c, [[x + 22, y + 110], [x + 100, y + 110]], 5); line(c, [[x + 48, y + 56], [x + 48, y + 136]], 5); line(c, [[x + 74, y + 56], [x + 74, y + 136]], 5); }
      if (k === 2) [34, 58, 44, 76].forEach((b, j) => { rr(c, x + 22 + j * 21, y + 136 - b, 13, b, 3); c.fill(); });
      if (k === 3) { dot(c, x + 40, y + 76, 10); line(c, [[x + 20, y + 136], [x + 50, y + 102], [x + 68, y + 122], [x + 84, y + 106], [x + 102, y + 136]], 6); }
      line(c, [[x + 61, y + h + 12], [x + 61, 372]], 6);
    }
    line(c, [[161, 372], [790, 372], [858, 440], [858, 463]], 6);
  };
  const drawChips = (c) => {   // a rack of processors on a shared bus
    for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) {
      const x = 96 + k * 170, y = 118 + r * 212, s = 112;
      c.lineWidth = 7; rr(c, x, y, s, s, 14); c.stroke(); rr(c, x + 32, y + 32, s - 64, s - 64, 7); c.fill();
      for (let p = 0; p < 4; p++) { const o = 20 + p * 24; line(c, [[x + o, y - 8], [x + o, y - 20]], 6); line(c, [[x + o, y + s + 8], [x + o, y + s + 20]], 6); line(c, [[x - 8, y + o], [x - 20, y + o]], 6); line(c, [[x + s + 8, y + o], [x + s + 20, y + o]], 6); }
      line(c, r ? [[x + 68, y - 20], [x + 68, 286]] : [[x + 44, y + s + 20], [x + 44, 286]], 6);
    }
    line(c, [[140, 286], [790, 286], [858, 354], [858, 463]], 6);
  };

  const DIAGRAMS = { chat: drawChat, steps: drawSteps, network: drawNetwork, files: drawFiles, chips: drawChips };

  registerStyle({
    id: 'layer-stack',
    name: 'Layer Stack',
    family: 'Diagrams with depth',
    look: 'A system shown as a stack of thin glass sheets, each with its own diagram printed in white, floating one above the other over a dark machined plinth. Aqua edges glow like edge-lit acrylic against near-black; one amber is kept for the answer.',
    motion: 'The stack starts closed as one block. Sheets lift off one at a time from the top, float a little past their place and settle, and each label draws in beside its sheet as it lands. Then a bead of light drops through the same pad on every sheet, each sheet flashing white as it passes, and climbs back in amber; the sheets cool again behind it and only the top one stays lit.',
    light: 'One small key from high behind, so every sheet and its printed lines throw a crisp shadow onto the sheet below; a soft panel mirrored in the glass tops; a cool rim; the rest falls to black. The bead carries a real light that spills onto the sheets it passes.',
    materials: 'Lightly frosted glass that stays clear but keeps full-strength reflections, brighter aqua edges, matt white print that takes light and shadow, dark anodised aluminium, a satin floor with a faint reflection.',
    camera: 'Long lens, three-quarter view from above. It starts close on the closed block, cranes up and back with the first sheet as it rises, then keeps a very slow push toward the open stack.',
    post: 'Motion blur on the lifts, bloom only on lit edges and the bead, a neutral grade that keeps the aqua and amber true, deep blacks, a soft vignette and very fine grain.',
    explains: 'Anything built in layers: a tech stack, a product teardown, how a request travels through a system. One sheet per layer with a simple diagram, a name and a short line beside it, and a pulse that shows the order things happen in.',
    topic: "What's inside an AI app: interface, agent, model, your data, chips",
    duration: 8,
    fonts: ['700 150px "Space Grotesk"', '500 76px "Space Grotesk"', '500 80px "Inter"', '500 20px "IBM Plex Mono"'],
    render: { samples: 48, shutter: 0.5, tone: 'neutral', exposure: 1.12, contrast: 1.06, bloom: 0.5, bloomThreshold: 1.5, vignette: 0.4, grain: 0.016, fov: 18, background: '#040506' },

    build(S) {
      const { THREE, K, scene, camera } = S;
      const AMBER = new THREE.Color('#ff9a2a'), WHITE = new THREE.Color('#eaf6ff'), AQUA = new THREE.Color('#7fe3d6'), GLASS = new THREE.Color('#8fded4'), EMBER = new THREE.Color('#5a2606');

      // ---- light: a dark studio. The big panel behind is what the sheet tops mirror; the strips are for the edges.
      K.env(S, { top: '#090b0e', horizon: '#11141a', bottom: '#020203', intensity: 1, panels: [
        { pos: [-21, 13, -21], size: [7, 12], color: '#eaf3ff', power: 3.2 },
        { pos: [24, 6, -6], size: [3, 16], color: '#bfe0ff', power: 7 },
        { pos: [-22, 5, 12], size: [3, 12], color: '#ffe4c8', power: 3 },
      ] });
      K.spot(S, { pos: [-7, 15, -6], target: [0.5, 2.2, 0], color: '#fff2e2', power: 1150, angle: 0.37, penumbra: 1, soft: 0.25, mapSize: 4096 });
      K.spot(S, { pos: [12, 5, -12], target: [0, 2.5, 0], color: '#9cc6ff', power: 420, angle: 0.42, penumbra: 1, shadow: false });

      // ---- glass. three.js fades reflections together with the surface when a material is made transparent, which
      // makes thin glass look like grey plastic. This keeps the highlights and the glow at full strength and only
      // thins the body colour, so a nearly clear sheet still shines.
      const glass = (m) => {
        m.transparent = true; m.premultipliedAlpha = true; m.depthWrite = false;
        m.onBeforeCompile = (sh) => {
          sh.fragmentShader = sh.fragmentShader
            .replace('#include <opaque_fragment>', 'outgoingLight = totalDiffuse * diffuseColor.a + totalSpecular + totalEmissiveRadiance;\n#include <opaque_fragment>')
            .replace('#include <premultiplied_alpha_fragment>', '');
        };
        return m;
      };
      // a flat slab with rounded corners and a fine bevel, lying on the ground plane. Material 0 = faces, 1 = edge.
      const slabGeo = (w, d, h, r, bev) => {
        const s = new THREE.Shape(), x = w / 2 - bev, y = d / 2 - bev; r -= bev;
        s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.absarc(x - r, -y + r, r, -Math.PI / 2, 0); s.lineTo(x, y - r); s.absarc(x - r, y - r, r, 0, Math.PI / 2);
        s.lineTo(-x + r, y); s.absarc(-x + r, y - r, r, Math.PI / 2, Math.PI); s.lineTo(-x, -y + r); s.absarc(-x + r, -y + r, r, Math.PI, Math.PI * 1.5);
        const g = new THREE.ExtrudeGeometry(s, { depth: h - bev * 2, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 24 });
        g.center(); g.rotateX(-Math.PI / 2);
        return g;
      };
      const sheetGeo = slabGeo(W, D, TH, 0.3, 0.014);
      const TEXT_X = 1.24;                                  // where label text starts, measured from the sheet's edge
      const flatGeo = K.roundedRect(W, D, 0.3, 16); flatGeo.rotateX(-Math.PI / 2);   // the printed face: UV 0..1 across the sheet

      // ---- floor and plinth
      K.mirrorFloor(S, { y: 0, color: '#474b52', surfaceRoughness: 0.6, roughness: 0.3, strength: 0.3, fresnel: false, fade: 9 });
      const plinth = new THREE.Mesh(slabGeo(W + 0.4, D + 0.4, BASE, 0.4, 0.03), new THREE.MeshStandardMaterial({ color: '#30333a', roughness: 0.36, metalness: 0.9 }));
      plinth.position.y = BASE / 2; plinth.castShadow = plinth.receiveShadow = true; scene.add(plinth);

      // ---- shadows of glass. A shadow map is all-or-nothing, but every frame is the average of many sub-renders,
      // so each sheet drops a random share of its shadow texels on each one: about a quarter where it is bare glass,
      // nearly all where it is printed. Averaged, the glass casts a light shadow and the diagram a dark one.
      const seed = { value: new THREE.Vector2() };

      const layers = LAYERS.map((L, i) => {
        const g = new THREE.Group(); scene.add(g);
        const order = (N - i) * 10;                         // draw from the bottom sheet up, so glass blends correctly
        const face = glass(new THREE.MeshPhysicalMaterial({ color: '#e6f2f1', roughness: 0.3, opacity: 0.06 }));
        const edge = glass(new THREE.MeshPhysicalMaterial({ color: '#8fded4', roughness: 0.24, opacity: 0.5, side: THREE.DoubleSide, emissive: '#000000' }));
        const body = new THREE.Mesh(sheetGeo, [face, edge]); body.receiveShadow = true; body.renderOrder = order; g.add(body);

        const mask = K.canvasTex(2048, 1252, (c, w) => { c.fillStyle = '#000'; c.fillRect(0, 0, 2048, 1252); c.scale(w / 1000, w / 1000); sheet(c, i); DIAGRAMS[L.diagram](c); });
        // the print: matt white that takes light and shadow, plus a glow that spreads outward from the pad when
        // the pulse arrives. uWave[k] = (radius of the wave front, glow left behind it, brightness of the front).
        const u = { uPad: { value: new THREE.Vector2(PAD[0] / 1000, 1 - PAD[1] / 611) }, uSize: { value: new THREE.Vector2(W, D) }, uWave: { value: [new THREE.Vector3(), new THREE.Vector3()] }, uTint: { value: [WHITE, AMBER] } };
        const ink = new THREE.MeshStandardMaterial({ color: '#d3dbdb', alphaMap: mask, transparent: true, depthWrite: false, roughness: 0.8, emissive: '#ffffff', emissiveIntensity: 0.14 });
        ink.onBeforeCompile = (sh) => {
          Object.assign(sh.uniforms, u);
          sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec2 uPad, uSize; uniform vec3 uWave[2], uTint[2];')
            .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
              float padDist = length((vAlphaMapUv - uPad) * uSize);
              for (int k = 0; k < 2; k++) {
                float behind = smoothstep(uWave[k].x, uWave[k].x - 0.6, padDist), front = exp(-pow((padDist - uWave[k].x) / 0.26, 2.0));
                totalEmissiveRadiance += uTint[k] * (behind * uWave[k].y + front * uWave[k].z);
              }`);
        };
        const print = new THREE.Mesh(flatGeo, ink); print.position.y = TH / 2 + 0.003; print.receiveShadow = true; print.renderOrder = order + 1; g.add(print);

        const density = { value: new THREE.Vector2(0.16, 0.62) };   // share of shadow kept: bare glass, printed line
        const caster = new THREE.Mesh(flatGeo, new THREE.MeshBasicMaterial({ alphaMap: mask, alphaTest: 0.5, colorWrite: false, depthWrite: false, side: THREE.DoubleSide }));
        caster.customDepthMaterial = new THREE.MeshDepthMaterial({ alphaMap: mask, alphaTest: 0.5, side: THREE.DoubleSide });
        caster.customDepthMaterial.onBeforeCompile = (sh) => {
          sh.uniforms.uSeed = seed; sh.uniforms.uDensity = density;
          sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec2 uSeed, uDensity;')
            .replace('#include <alphatest_fragment>', 'if (fract(sin(dot(gl_FragCoord.xy + uSeed, vec2(12.9898, 78.233))) * 43758.5453) > mix(uDensity.x, uDensity.y, diffuseColor.a)) discard;');
        };
        caster.position.y = -TH / 2 + 0.004; caster.castShadow = true; g.add(caster);

        // the label: a group that always faces the camera, anchored on the middle of the sheet's right edge
        const label = new THREE.Group(); scene.add(label);
        const flat = (color) => new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, depthTest: false });
        const pin = new THREE.Mesh(new THREE.CircleGeometry(0.05, 24), flat('#ffffff'));
        const lead = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.017).translate(0.5, 0, 0), flat('#ffffff')); lead.position.x = 0.13;
        const text = (str, font, height, color, x, y) => {
          const m = K.textPlane(str, { font, height, color, align: 'left', letterSpacing: font.includes('Grotesk') ? 5 : 0 });
          m.geometry.translate(m.userData.size[0] / 2 - height * 0.25, 0, 0); m.material.depthTest = false; m.position.set(x, y, 0); label.add(m); return m;
        };
        const title = text(L.name, '700 150px "Space Grotesk"', 0.6, '#ffffff', TEXT_X, 0.16);
        const note = text(L.note, '500 80px "Inter"', 0.3, '#c3cbd3', TEXT_X + 0.01, -0.27);
        label.add(pin, lead);
        label.traverse((o) => { o.layers.set(1); o.renderOrder = 300; });   // layer 1: seen by the camera, left out of the floor reflection
        return { g, face, edge, ink, wave: u.uWave.value, density: density.value, label, pin, lead, title, note };
      });
      camera.layers.enable(1);

      // the reply bubble on the top sheet: its own small print in colour, switched on when the answer arrives
      const answerTex = K.canvasTex(2048, 1252, (c, w) => { c.fillStyle = 'rgba(255,148,38,0.004)'; c.fillRect(0, 0, 2048, 1252); c.scale(w / 1000, w / 1000); drawAnswer(c); });
      const answer = new THREE.Mesh(flatGeo, new THREE.MeshBasicMaterial({ map: answerTex, transparent: true, alphaTest: 0.02, depthWrite: false }));
      answer.position.y = TH / 2 + 0.006; answer.renderOrder = N * 10 + 2; layers[0].g.add(answer);

      // ---- the pulse: a bead of light on the line through all the pads, the thin line it leaves, and a real light
      const padX = (PAD[0] / 1000 - 0.5) * W, padZ = (PAD[1] / 611 - 0.5) * D;
      const add = (blend) => new THREE.MeshBasicMaterial({ transparent: true, blending: blend ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: false });
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.085, 24, 12), add(false)); bead.renderOrder = 200; scene.add(bead);
      const rod = () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 8), add(true)); m.renderOrder = 190; scene.add(m); return m; };
      const wireDown = rod(), wireUp = rod();
      const span = (m, y0, y1) => { m.visible = y1 - y0 > 0.01; m.position.set(padX, (y0 + y1) / 2, padZ); m.scale.y = Math.max(0.01, y1 - y0); };
      const glow = new THREE.PointLight('#ffffff', 0, 8, 2); scene.add(glow);
      // where the pulse is, as a layer index that can be fractional (0 = top sheet). It eases through every sheet.
      const glide = (f) => K.lerp(f, K.ease.inOut(f), 0.65);
      const pulseAt = (t) => {
        if (t < hitDown(N - 1)) { const q = Math.max(0, (t - DOWN) / STEP_DOWN), k = Math.floor(q); return k + glide(q - k); }
        if (t < UP) return N - 1;
        if (t < ANSWER) { const q = (t - UP) / STEP_UP, k = Math.floor(q); return N - 1 - k - glide(q - k); }
        return 0;
      };
      const yAt = (f) => { const k = Math.min(N - 2, Math.floor(f)); return K.lerp(openY(k), openY(k + 1), f - k) + TH / 2; };

      // ---- camera: one move tied to the first lift (a spring with no overshoot), plus a slow drift that never stops
      const rad = Math.PI / 180;
      const shot = (t) => {
        const p = K.spring(t - 0.4, 0.6, 1), d = t / 8;
        const az = (K.lerp(36, 31, p) - 6 * d) * rad, el = K.lerp(21, 19.5, p) * rad, dist = K.lerp(15.5, 24.1, p) - 2 * d;
        const aim = [K.lerp(0.3, 1.78, p), K.lerp(1.3, 2.22, p * p), K.lerp(0, -0.95, p)];
        return { aim, pos: [aim[0] + dist * Math.sin(az) * Math.cos(el), aim[1] + dist * Math.sin(el), aim[2] + dist * Math.cos(az) * Math.cos(el)] };
      };
      const col = new THREE.Color(), tmp = new THREE.Color();
      const plus = (c, k) => { col.r += c.r * k; col.g += c.g * k; col.b += c.b * k; };
      const after = (t, t0, tau) => (t < t0 ? 0 : Math.exp(-(t - t0) / tau));   // a flash at t0 that dies away

      return {
        update(t) {
          const { pos, aim } = shot(t);
          K.look(camera, pos, aim); K.focus(camera, [1.2, aim[1], 0], 0.07);
          seed.value.set(K.hash(t * 977.1, 1) * 64, K.hash(t * 977.1, 2) * 64);

          layers.forEach((o, i) => {
            const y = layerY(i, t), v = (layerY(i, t + 0.02) - layerY(i, t - 0.02)) / 0.04;
            o.g.position.y = y; o.g.rotation.set(-v * 0.004, 0, v * 0.0025);                 // a sheet tips a little while it moves
            // a sheet's print only shows once the sheet above has lifted away, so the closed block reads as one screen
            const open = i === 0 ? 1 : K.smooth(0.03, 0.8, layerY(i - 1, t) - y);
            o.ink.opacity = open; o.face.opacity = 0.06 * (0.2 + 0.8 * open); o.face.specularIntensity = 0.12 + 0.88 * open; o.density.y = K.lerp(o.density.x, 0.62, open);

            // the pulse: white on the way down, amber on the way back. The amber stays as the final state.
            const a = t - hitDown(i), b = t - hitUp(i);
            o.wave[0].set(Math.max(0, a) * 10, a > 0 ? 0.22 + 1.1 * Math.exp(-a / 0.35) : 0, a > 0 ? 2.6 * Math.exp(-a / 0.3) : 0);
            o.wave[1].set(Math.max(0, b) * 10, b > 0 ? (i ? 0.1 : 0.4) + 1.3 * Math.exp(-b / 0.4) : 0, b > 0 ? 3.0 * Math.exp(-b / 0.3) : 0);
            if (b > 0) o.wave[0].y *= Math.exp(-b / 0.2);
            const fa = after(t, hitDown(i), 0.3), fb = after(t, hitUp(i), 0.4), fc = after(t, hitUp(i), 0.9), back = b > 0 ? 1 : 0;
            const kept = i ? fc : back;                                                     // how amber the sheet still is
            col.copy(AQUA).multiplyScalar(0.3 * (1 - kept * 0.7)); plus(WHITE, 2.4 * fa); plus(AMBER, 3.0 * fb + 1.1 * kept);
            o.edge.emissive.copy(col); o.edge.color.copy(GLASS).lerp(EMBER, kept);

            // label: pin, leader line, name, note, in that order
            const s = t - labelAt(i);
            o.label.position.set(W / 2, y, 0); o.label.quaternion.copy(camera.quaternion);
            o.pin.scale.setScalar(K.seg(s, 0, 0.22, K.ease.outBack)); o.pin.material.color.copy(WHITE).lerp(AMBER, back).multiplyScalar(1.3 + 2 * (fa + fb));
            o.lead.scale.x = Math.max(0.001, 0.96 * K.seg(s, 0.05, 0.4, K.ease.inOut)); o.lead.material.opacity = 0.7 * K.seg(s, 0.05, 0.15);
            const ta = K.seg(s, 0.2, 0.55, K.ease.out), na = K.seg(s, 0.32, 0.7, K.ease.out);
            o.title.material.opacity = ta; o.title.position.x = TEXT_X - (1 - ta) * 0.22;
            o.title.material.color.setScalar(1.25).lerp(tmp.copy(AMBER).multiplyScalar(1.7), Math.min(1, fb * 1.2)).multiplyScalar(1 + 0.5 * fa);
            o.note.material.opacity = na; o.note.position.x = TEXT_X + 0.01 - (1 - na) * 0.22;
          });

          // the reply
          const ans = t - ANSWER;
          answer.visible = ans > 0; answer.material.opacity = K.seg(ans, 0, 0.18); answer.material.color.setScalar(1.7 + 2.2 * after(t, ANSWER, 0.3));

          // bead, wire and its light
          const f = pulseAt(t), by = yAt(f), goingUp = t >= UP - 0.14;
          const on = K.seg(t, DOWN - 0.06, DOWN + 0.04) * (1 - K.seg(t, hitDown(N - 1), hitDown(N - 1) + 0.08)) + K.seg(t, UP - 0.06, UP + 0.04) * (1 - K.seg(t, ANSWER, ANSWER + 0.1));
          bead.position.set(padX, by, padZ); bead.scale.setScalar(Math.max(0.001, on)); bead.visible = on > 0.001;
          bead.material.color.copy(goingUp ? AMBER : WHITE).multiplyScalar(goingUp ? 9 : 6);
          const top = yAt(0), bottom = yAt(N - 1), upK = K.seg(t, UP, ANSWER);
          span(wireDown, t < DOWN ? top : t < UP ? by : bottom, top); wireDown.material.color.copy(WHITE).multiplyScalar(0.55 * (1 - upK));
          span(wireUp, bottom, t < UP ? bottom : by); wireUp.material.color.copy(AMBER).multiplyScalar(1.5 + 2 * after(t, ANSWER, 0.4));
          glow.position.set(padX, by + 0.12, padZ); glow.color.copy(goingUp ? AMBER : WHITE);
          glow.intensity = 7 * on + 5 * after(t, hitDown(N - 1), 0.25) + 3 * after(t, ANSWER, 0.5);
        },
        // the heading is on screen while the stack is still closed, and leaves as the first sheet lifts into its place
        overlay(ctx, t, Wp, Hp) {
          const a = 1 - K.seg(t, 0.5, 0.95, K.ease.inOut);
          if (a <= 0) return;
          ctx.globalAlpha = a; ctx.fillStyle = '#f2f5f5'; ctx.textBaseline = 'alphabetic';
          ctx.font = '500 76px "Space Grotesk"'; ctx.fillText(TITLE[0], 118, 172 - (1 - a) * 26);
          ctx.font = '700 76px "Space Grotesk"'; ctx.fillText(TITLE[1], 118, 262 - (1 - a) * 26);
        },
      };
    },

    sound(k) {
      k.bed('room', 0, 8, { gain: 0.9 });
      const SCALE = ['E6', 'B5', 'G#5', 'E5', 'B4'];        // one glass note per sheet, high for the top one
      LAYERS.forEach((_, i) => {
        const pan = 0.25 - i * 0.03;
        k.play('whoosh', LIFT[i] - 0.03, { gain: 0.75 - i * 0.08, dur: 0.55 / FREQ[i], top: 1900 - i * 200, pan: -0.15 });   // the sheet slides away
        k.play('ding', LIFT[i] + 0.62 / FREQ[i], { gain: 0.5, f: SCALE[i], pan: -0.15 });                              // and settles
        k.withMinor(() => { k.play('tick', labelAt(i) + 0.05, { gain: 0.7, f: 5200, pan }); k.play('click', labelAt(i) + 0.3, { gain: 0.45, pan }); });
      });
      // the request drops through the stack, the chips take the load, the answer climbs back
      LAYERS.forEach((_, i) => {
        k.tone(hitDown(i), { f: SCALE[i], type: 'sine', dur: 0.5, gain: 0.12, verb: 0.35, pan: 0.2 });
        k.play('tock', hitDown(i), { gain: 0.36, f: 1500 - i * 190, pan: 0.2 });
      });
      k.play('thud', hitDown(N - 1), { gain: 0.75, f: 110 });
      k.play('buzz', hitDown(N - 1) + 0.04, { gain: 0.5, dur: UP - hitDown(N - 1) - 0.1, f: 82 });
      k.play('riser', UP - 0.1, { gain: 0.4, dur: ANSWER - UP + 0.1 });
      for (let i = N - 2; i >= 0; i--) k.tone(hitUp(i), { f: SCALE[i], type: 'triangle', dur: 0.45, gain: 0.13, verb: 0.3, pan: 0.2 });
      k.play('success', ANSWER, { gain: 0.9, f: 'E6' });
      k.play('pop', ANSWER + 0.02, { gain: 0.5, f: 520, pan: -0.2 });
    },
  });
}
```
