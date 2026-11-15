# Spotlight Stage (#06)

- **id:** `spotlight-stage`
- **Category:** Spaces and journeys
- **Use:** story
- **Reference duration:** 12 s
- **Google Fonts:** Oswald, Playfair Display
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`

## Style card

- **Look:** A toy theatre at night: crimson velvet, a worn timber stage and a painted world of flat card cut-outs standing in layers, with an easel card at the front for the caption. The room is dark; whatever the story is about is picked out by shafts of light cutting through haze.
- **Motion:** It plays like a show. Scenery flats slide in from the wings, pieces are flown in from above on thin rods, actors and props are cut-outs pushed along slots in the floor with a small wobble. Scene changes happen in view: flats part, others glide in, the easel card is pulled and the light changes colour.
- **Light:** Only stage lamps, each a real spot light with a matching visible beam: two follow spots from the house that stay on the actors, two wide front washes that set the colour of the scene, a top light that drops a shaft on the centre of the action, a small special on the easel card and a row of horizon lights behind the last flat. No fill: what no lamp touches stays black.
- **Materials:** Thick matt card painted in flat gouache colours with a fine ink line and paper grain, bare card on the sawn edges, thin steel rods and wires, deep-pile velvet with gold braid, dark stained boards with a satin reflection.
- **Camera:** One slow continuous move from a seat in the stalls: it starts a little left on the first scene, eases back and across as the stage changes, then drifts in and up with the action. Long lens, the whole stage picture sharp.
- **Finish:** Beams are ray-marched cones with drifting haze and dust that only shows inside them; soft shadows from each layer onto the one behind, bloom on the brightest card, filmic contrast, heavy vignette, fine grain.
- **Good for:** Stories, history, fables and step-by-step scenes. One scene per beat: each beat is a stage picture built from flat cut-out scenery and cut-out actors, and the change between beats is shown, not cut. The follow spot says where to look, the colour of the wash says where and when we are, and one short line on the easel card names the scene (it can carry a running number).

## Reference

- **Sample topic:** The first powered flight: from the Wright brothers' bicycle shop in Dayton to 12 seconds and 120 feet at Kitty Hawk on 17 December 1903
- **Gallery description:** A toy theatre at night: crimson velvet, a worn timber stage and a painted world of flat card cut-outs standing in layers, with an easel card at the front for the caption. The room is dark; whatever the story is about is picked out by shafts of light cutting through haze.
- **Shown in the sample clip:** The first powered flight: from the Wright brothers' bicycle shop in Dayton to 12 seconds and 120 feet at Kitty Hawk on 17 December 1903

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/spotlight-stage.js`)

```js
{
  // ---------------------------------------------------------------- content: the play (change this block first for a new story)
  // One easel card per scene: a small place line and one or two short lines. A card with `count` shows two running numbers.
  const CARDS = [
    { place: 'DAYTON, OHIO', lines: ['TWO BICYCLE MAKERS', 'BUILD A WING'] },
    { place: 'KITTY HAWK, NORTH CAROLINA', lines: ['17 DECEMBER 1903', 'ORVILLE AT THE CONTROLS'] },
    { place: 'THE FIRST POWERED FLIGHT', count: [[12, 'SECOND', 'SECONDS'], [120, 'FOOT', 'FEET']] },
  ];
  const SHOP_SIGN = 'WRIGHT CYCLE CO.';

  // The prompt book: every move of scenery, actors and lamps on one clock. Picture and sound both read these times.
  const CUE = {
    enter: [0.3, 1.45],          // scene 1: Orville slides in along his slot to the bench
    frame: [1.3, 2.0],           // the second and third sections of the wing frame are lowered onto the bench
    strike: 3.2,                 // change 1, in view: the shop wall parts, bench and brothers slide off, frame and bicycle are flown out
    dunes: [3.5, 3.75, 4.0],     // the far, middle and front sand flats slide in from the right
    card: [3.8, 7.0],            // the easel card is pulled, showing the next
    flyer: [4.3, 5.25],          // the Flyer is flown in on its rods and set on the launch rail
    wilbur: [4.9, 5.7],          // Wilbur slides in to the far wingtip
    props: 5.8,                  // the propellers start
    roll: 7.0, lift: 7.9, flown: 10.3,   // scene 3: along the rail, off it, and the twelve seconds in the air
  };
  const D = 12;
  // The cut-outs themselves are drawn by the *Art() functions inside build(): swap those to stage another story.

  registerStyle({
    id: 'spotlight-stage',
    name: 'Spotlight Stage',
    family: 'Spaces and journeys',
    look: 'A toy theatre at night: crimson velvet, a worn timber stage and a painted world of flat card cut-outs standing in layers, with an easel card at the front for the caption. The room is dark; whatever the story is about is picked out by shafts of light cutting through haze.',
    motion: 'It plays like a show. Scenery flats slide in from the wings, pieces are flown in from above on thin rods, actors and props are cut-outs pushed along slots in the floor with a small wobble. Scene changes happen in view: flats part, others glide in, the easel card is pulled and the light changes colour.',
    light: 'Only stage lamps, each a real spot light with a matching visible beam: two follow spots from the house that stay on the actors, two wide front washes that set the colour of the scene, a top light that drops a shaft on the centre of the action, a small special on the easel card and a row of horizon lights behind the last flat. No fill: what no lamp touches stays black.',
    materials: 'Thick matt card painted in flat gouache colours with a fine ink line and paper grain, bare card on the sawn edges, thin steel rods and wires, deep-pile velvet with gold braid, dark stained boards with a satin reflection.',
    camera: 'One slow continuous move from a seat in the stalls: it starts a little left on the first scene, eases back and across as the stage changes, then drifts in and up with the action. Long lens, the whole stage picture sharp.',
    post: 'Beams are ray-marched cones with drifting haze and dust that only shows inside them; soft shadows from each layer onto the one behind, bloom on the brightest card, filmic contrast, heavy vignette, fine grain.',
    explains: 'Stories, history, fables and step-by-step scenes. One scene per beat: each beat is a stage picture built from flat cut-out scenery and cut-out actors, and the change between beats is shown, not cut. The follow spot says where to look, the colour of the wash says where and when we are, and one short line on the easel card names the scene (it can carry a running number).',
    topic: 'The first powered flight: from the Wright brothers\' bicycle shop in Dayton to 12 seconds and 120 feet at Kitty Hawk on 17 December 1903',
    duration: D,
    fonts: ['500 100px "Oswald"', '700 100px "Oswald"', '800 100px "Playfair Display"'],
    render: { samples: 40, shutter: 0.4, tone: 'filmic', exposure: 1.0, bloom: 0.3, bloomThreshold: 1.3, vignette: 0.42, grain: 0.014, fov: 30, background: '#010102' },

    build(S) {
      const { THREE, K, scene, camera } = S;
      const TAU = Math.PI * 2;
      const add = (geo, mat, pos, parent = scene, cast = true) => { const m = new THREE.Mesh(geo, mat); if (pos) m.position.set(pos[0], pos[1], pos[2]); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; };

      // ------------------------------------------------------------ the stage (world units: the opening is 9 wide and about 5 high)
      const CURTAIN_Z = 0.15, CURTAIN_TOP = 9, WING_X = 6.8, OPEN_X = 4.5, HEM_Y = 5.15, BACK_Z = -4.4;
      // Everything stands in shallow layers, like the grooves of a toy theatre. Upstage is -z.
      const Z = { sky: -3.0, far: -2.5, wind: -2.3, wall: -2.1, hang: -1.9, mid: -1.85, men: -1.6, frame: -1.45, bench: -1.3, flyer: -1.2, front: -0.8, easel: 0.75 };

      // ------------------------------------------------------------ two things every beam needs to know about the scene
      const HAZE_GAIN = 0.4;   // how thick the air is: one number for all beams
      const gateU = { value: new THREE.Vector3(CURTAIN_Z, OPEN_X, HEM_Y) };   // the proscenium: z of the curtain line, half width of the opening, height of the valance hem
      // Depth pre-pass: just before the beams are drawn, the solid scene is drawn once more into a depth texture from
      // the very same camera, so a beam can stop at the first surface in front of it instead of glowing through it.
      // (An invisible mesh that sorts ahead of the beams triggers it, the way three's Reflector renders its mirror.)
      const depthRT = new THREE.WebGLRenderTarget(S.W, S.H, { depthTexture: new THREE.DepthTexture(S.W, S.H), minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
      const pre = { tDepth: { value: depthRT.depthTexture }, uProjInv: { value: new THREE.Matrix4() }, uRes: { value: new THREE.Vector2(S.W, S.H) } };
      const depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.DoubleSide });
      const probe = new THREE.Mesh(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3)), new THREE.MeshBasicMaterial({ transparent: true, colorWrite: false, depthWrite: false, depthTest: false }));
      probe.frustumCulled = false; probe.renderOrder = 4; scene.add(probe);
      let inPre = false;
      probe.onBeforeRender = (renderer, sc, cam) => {
        if (inPre) return; inPre = true;
        const rt = renderer.getRenderTarget(), auto = renderer.shadowMap.autoUpdate, hide = [dust, probe, ...lamps.map((L) => L.beam)].filter((o) => o.visible);
        hide.forEach((o) => { o.visible = false; }); sc.overrideMaterial = depthOnly; renderer.shadowMap.autoUpdate = false;
        renderer.setRenderTarget(depthRT); renderer.clear(); renderer.render(sc, cam);
        sc.overrideMaterial = null; renderer.shadowMap.autoUpdate = auto; hide.forEach((o) => { o.visible = true; });
        renderer.setRenderTarget(rt); pre.uProjInv.value.copy(cam.projectionMatrix).invert();
        inPre = false;
      };

      // ------------------------------------------------------------ LAMPS: real light + visible beam, always in step
      // The beam is a cone mesh whose shader walks the camera ray through the cone and adds up the light scattered by
      // haze on the way. It uses the same apex, angle and soft edge as the THREE.SpotLight, so the lit pool on the
      // scenery is always exactly where the shaft ends.
      const BEAM_VS = 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }';
      const HAZE = `
        float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
        float vn(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
                     mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
        // smoke that drifts slowly across the stage: thick and thin patches, never even
        float haze(vec3 p, float t){ return 0.45 + 0.85 * vn(p * 0.5 + vec3(0.11, -0.05, 0.07) * t) + 0.5 * vn(p * 1.5 + vec3(-0.16, 0.09, 0.12) * t); }
        // the proscenium stops light: a point on the far side of the curtain line from the lamp is lit only if the
        // straight line from the lamp to it passes through the opening (between the curtains, under the valance)
        uniform vec3 uGate;   // curtain z, half width of the opening, height of the valance hem
        float gate(vec3 p, vec3 apex){
          float a = apex.z - uGate.x, b = p.z - uGate.x; if (a * b >= 0.0) return 1.0;
          vec3 h = mix(apex, p, a / (a - b));
          return smoothstep(0.0, 0.2, uGate.y - abs(h.x)) * smoothstep(0.0, 0.2, uGate.z - h.y);
        }`;
      const BEAM_FS = `
        uniform vec3 uApex, uDir, uColor; uniform float uCosO, uCosI, uNear, uLen, uTime, uSeed, uWingX;
        uniform sampler2D tDepth; uniform mat4 uProjInv; uniform vec2 uRes;
        varying vec3 vW;
        ${HAZE}
        void main(){
          vec3 ro = cameraPosition, rd = normalize(vW - ro), co = ro - uApex;
          // where the view ray is inside the cone (apex uApex, axis uDir, half angle acos(uCosO))
          float dv = dot(rd, uDir), cv = dot(co, uDir), c2 = uCosO * uCosO;
          float a = dv * dv - c2, b = dv * cv - dot(rd, co) * c2, c = cv * cv - dot(co, co) * c2, disc = b * b - a * c;
          if (disc <= 0.0 || abs(a) < 1e-6) discard;
          float sq = sqrt(disc), tA = (-b - sq) / a, tB = (-b + sq) / a, t0, t1;
          if (a < 0.0) { t0 = tB; t1 = tA; if (cv + dv * 0.5 * (t0 + t1) < 0.0) discard; }   // crossing the cone: in through one side, out through the other
          else if (dv > 0.0) { t0 = max(tA, tB); t1 = 1e4; } else { t0 = -1e4; t1 = min(tA, tB); }   // looking along the cone: inside from one root onwards
          // the beam starts at the lens and ends at its length, the floor or the back wall
          float sN = (uNear - cv) / dv, sL = (uLen - cv) / dv;
          t0 = max(t0, min(sN, sL)); t1 = min(t1, max(sN, sL));
          float tf = (0.005 - ro.y) / rd.y; if (rd.y < 0.0) t1 = min(t1, tf); else t0 = max(t0, tf);
          // ...or at the first solid thing the camera sees along this ray (depth from the pre-pass above)
          vec2 suv = gl_FragCoord.xy / uRes;
          vec4 vp = uProjInv * vec4(suv * 2.0 - 1.0, texture2D(tDepth, suv).x * 2.0 - 1.0, 1.0);
          t1 = min(t1, length(vp.xyz / vp.w));
          t0 = max(t0, 0.0);
          if (t1 <= t0) discard;
          const int N = 26;
          float dt = (t1 - t0) / float(N), jit = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + uSeed) * 43758.5453), sum = 0.0;
          for (int i = 0; i < N; i++) {
            vec3 p = ro + rd * (t0 + (float(i) + jit) * dt), q = p - uApex;
            float h = dot(q, uDir), ca = h / length(q);
            float edge = smoothstep(uCosO, uCosI, ca);                        // the same soft edge as the spot light
            float fall = pow(uNear / h, 1.5);                                 // light thins out as the cone widens
            float wing = (p.z < uGate.x && abs(p.x) > uWingX) ? 0.0 : 1.0;    // the wings swallow what leaves the stage
            sum += edge * fall * haze(p, uTime) * gate(p, uApex) * wing;
          }
          float fwd = 0.75 + 0.9 * pow(0.5 - 0.5 * dv, 2.0);                  // haze scatters more light forwards, towards a camera the lamp faces
          gl_FragColor = vec4(uColor * sum * dt * fwd, 1.0);
        }`;
      const unitCone = new THREE.ConeGeometry(1, 1, 56, 1, false); unitCone.translate(0, -0.5, 0); unitCone.rotateX(Math.PI);   // apex at the origin, opening along +Y
      const lamps = [], yAxis = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3(), tmp = new THREE.Vector3();

      // makeLamp({ pos, power (candela at full), angle, penumbra, lens (radius), haze (how strongly its beam shows),
      // dust, shadow, soft }) -> lamp.set(aim [x,y,z], level 0..1+, { color: [r,g,b] linear, angle, reach }) to be
      // called from update(t). reach: how far past the aim point the beam still shows (default: until it hits something).
      function makeLamp(o) {
        const L = { o, color: new THREE.Color('#ffffff'), level: 0, apex: new THREE.Vector3(), dir: new THREE.Vector3(0, -1, 0), cosO: 1, cosI: 1 };
        L.light = K.spot(S, { pos: o.pos, target: [0, 0, 0], power: 0, angle: o.angle, penumbra: o.penumbra, soft: o.soft == null ? 0.08 : o.soft, shadow: o.shadow !== false, mapSize: o.mapSize || 2048, near: 0.6, far: 40, bias: -0.0006 });
        L.uni = { uApex: { value: L.apex }, uDir: { value: L.dir }, uColor: { value: new THREE.Color() }, uCosO: { value: 1 }, uCosI: { value: 1 }, uNear: { value: 1 }, uLen: { value: 30 }, uTime: { value: 0 }, uSeed: { value: 0 }, uWingX: { value: WING_X + 0.4 }, uGate: gateU, tDepth: pre.tDepth, uProjInv: pre.uProjInv, uRes: pre.uRes };
        L.beam = new THREE.Mesh(unitCone, new THREE.ShaderMaterial({ vertexShader: BEAM_VS, fragmentShader: BEAM_FS, uniforms: L.uni, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
        L.beam.frustumCulled = false; L.beam.renderOrder = 5; scene.add(L.beam);
        L.set = (aim, level, q = {}) => {
          const ang = q.angle == null ? o.angle : q.angle, lensR = o.lens || 0.14;
          if (q.color) L.color.setRGB(q.color[0], q.color[1], q.color[2]);
          dir.set(aim[0] - o.pos[0], aim[1] - o.pos[1], aim[2] - o.pos[2]).normalize();
          const near = lensR / Math.tan(ang);                                   // the cone's apex sits this far behind the lens
          L.apex.set(o.pos[0], o.pos[1], o.pos[2]).addScaledVector(dir, -near); L.dir.copy(dir); L.level = level;
          L.cosO = Math.cos(ang); L.cosI = Math.cos(ang * (1 - o.penumbra));
          L.light.position.copy(L.apex); L.light.target.position.set(aim[0], aim[1], aim[2]); L.light.angle = ang; L.light.color.copy(L.color); L.light.intensity = o.power * level;
          const u = L.uni; u.uCosO.value = L.cosO; u.uCosI.value = L.cosI; u.uNear.value = near;
          u.uColor.value.copy(L.color).multiplyScalar(level * (o.haze == null ? 1 : o.haze) * HAZE_GAIN);
          const len = q.reach == null ? 30 : tmp.set(aim[0], aim[1], aim[2]).sub(L.apex).length() + q.reach, r = len * Math.tan(ang) * 1.04;
          u.uLen.value = len;
          L.beam.position.copy(L.apex); L.beam.quaternion.setFromUnitVectors(yAxis, dir); L.beam.scale.set(r, len, r); L.beam.visible = level > 0.002;
        };
        lamps.push(L); return L;
      }
      // The rig: two follow spots and two washes out in the house, a top light over the stage, a special for the easel.
      const follow = makeLamp({ pos: [-5.5, 6.9, 12], power: 950, angle: 0.15, penumbra: 0.5, lens: 0.16, haze: 1.5, soft: 0.12 });
      const follow2 = makeLamp({ pos: [6, 6.6, 12], power: 1150, angle: 0.07, penumbra: 0.45, lens: 0.16, haze: 1.0, soft: 0.1 });
      const wash = [-1, 1].map((s) => makeLamp({ pos: [s * 5.6, 5.6, 10.5], power: 620, angle: 0.5, penumbra: 0.85, lens: 0.2, haze: 0.05, dust: 0.15, soft: 0.16, mapSize: 2048 }));
      const top = makeLamp({ pos: [0.3, 8.8, -0.35], power: 1300, angle: 0.17, penumbra: 0.6, lens: 0.14, haze: 2.4, soft: 0.06 });
      const cardLamp = makeLamp({ pos: [1.6, 6.4, 11], power: 760, angle: 0.15, penumbra: 0.45, lens: 0.14, haze: 0.1, dust: 0.3, soft: 0.1, mapSize: 1024 });
      // Horizon lights: a row of small lamps on the floor behind the last sand flat, shining up the sky cloth (a "ground row").
      const horizon = [-6, -3, 0, 3, 6].map((x) => { const l = new THREE.PointLight('#ffffff', 0, 8, 1.3); l.position.set(x, 0.9, Z.sky + 0.45); scene.add(l); return l; });

      // ------------------------------------------------------------ dust: specks that only show where a beam passes
      const NL = lamps.length, NDUST = 2400, dr = K.rng(7), dp = new Float32Array(NDUST * 3), ds = new Float32Array(NDUST * 4);
      for (let i = 0; i < NDUST; i++) { dp.set([dr.range(-6, 6), dr.range(0.1, 6.5), dr.range(-2.5, 6)], i * 3); ds.set([dr(), dr(), dr(), dr()], i * 4); }
      const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3)); dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(ds, 4));
      const dustU = { uTime: { value: 0 }, uA: { value: lamps.map(() => new THREE.Vector3()) }, uD: { value: lamps.map(() => new THREE.Vector3()) }, uC: { value: lamps.map(() => new THREE.Color()) }, uK: { value: lamps.map(() => new THREE.Vector3()) }, uGate: gateU, uPx: { value: S.H / (2 * Math.tan(15 * Math.PI / 180)) } };
      const dust = new THREE.Points(dustGeo, new THREE.ShaderMaterial({
        uniforms: dustU, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
        vertexShader: `uniform float uTime, uPx; uniform vec3 uA[${NL}], uD[${NL}], uC[${NL}], uK[${NL}]; attribute vec4 aSeed; varying vec3 vC;
          ${HAZE}
          void main(){
            // slow drift, a little different for every speck
            vec3 p = position + vec3(sin(uTime * 0.31 + aSeed.x * 6.28) * 0.22 + uTime * 0.035, uTime * (0.02 + 0.03 * aSeed.y) + sin(uTime * 0.5 + aSeed.z * 6.28) * 0.06, cos(uTime * 0.27 + aSeed.w * 6.28) * 0.2);
            vec3 c = vec3(0.0);
            for (int i = 0; i < ${NL}; i++) { vec3 q = p - uA[i]; float h = dot(q, uD[i]); if (h > uK[i].z) c += uC[i] * smoothstep(uK[i].x, uK[i].y, h / length(q)) * pow(uK[i].z / h, 1.5) * gate(p, uA[i]); }
            float glint = 0.25 + 0.75 * pow(abs(sin(uTime * (0.8 + 2.4 * aSeed.y) + aSeed.x * 40.0)), 8.0);   // flakes turn and catch the light
            vC = c * glint;
            vec4 mv = viewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv; gl_PointSize = (0.011 + 0.01 * aSeed.z) * uPx / -mv.z;
          }`,
        fragmentShader: 'varying vec3 vC; void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vC * smoothstep(0.5, 0.15, d), 1.0); }',
      }));
      dust.frustumCulled = false; dust.renderOrder = 6; scene.add(dust);

      // ------------------------------------------------------------ the house curtain and its valance: the frame of the picture
      const velvetMap = K.canvasTex(512, 1024, (c, w, h) => {
        c.fillStyle = '#6a0812'; c.fillRect(0, 0, w, h);
        const r = K.rng(3);
        for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(${r.chance(0.5) ? '40,0,6' : '190,40,50'},${r.range(0.02, 0.07)})`; c.fillRect(r.range(0, w), 0, r.range(1, 3), h); }   // the nap runs top to bottom
        const g = c.createLinearGradient(0, h * 0.925, 0, h * 0.965); g.addColorStop(0, '#6b4a12'); g.addColorStop(0.3, '#e0b04a'); g.addColorStop(0.7, '#c8962f'); g.addColorStop(1, '#5a3c0c');
        c.fillStyle = g; c.fillRect(0, h * 0.925, w, h * 0.04);                                                // gold braid above the hem
        for (let x = 0; x < w; x += 8) { c.fillStyle = r.chance(0.5) ? '#d39a2c' : '#a8701a'; c.fillRect(x, h * 0.966, 5, h * 0.034); }   // bullion fringe
      }, { repeat: [5, 1] });
      // Curtain warmers: the soft glow a house curtain is given so it never quite disappears. A real lamp would spill
      // onto the stage, so this light exists only inside the velvet's own shader: a dim key from the front plus the
      // pile catching light where a fold turns away.
      const warmU = { value: new THREE.Color('#ffb48a').multiplyScalar(0.2) };
      const velvetMat = (map) => {
        const m = new THREE.MeshPhysicalMaterial({ map, roughness: 0.92, sheen: 1, sheenColor: new THREE.Color('#e02a34'), sheenRoughness: 0.4, side: THREE.DoubleSide });
        m.onBeforeCompile = (sh) => {
          sh.uniforms.uWarm = warmU;
          sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uWarm;').replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
            { vec3 wl = normalize((viewMatrix * vec4(0.3, 0.5, 0.8, 0.0)).xyz); float rim = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 3.0);
              reflectedLight.directDiffuse += uWarm * material.diffuseColor * (max(dot(normal, wl), 0.0) + 2.5 * rim); }`);
        };
        return m;
      };
      const velvet = velvetMat(velvetMap);
      // Each half is a strip of cloth 1.45 times wider than the opening it would close, gathered at the side: the
      // same cloth in less width makes the deep folds. `lag` lets the hem trail and swing.
      const NF = 9, CLOTH = 1.45 * (WING_X + 0.12);
      function makeCurtain(side) {
        const NU = 162, NV = 26, geo = new THREE.PlaneGeometry(1, 1, NU, NV), pos = geo.attributes.position, uv = geo.attributes.uv, r = K.rng(side + 5);
        const foldAmp = Array.from({ length: NF + 2 }, () => r.range(0.75, 1.2)), foldPh = Array.from({ length: NF + 2 }, () => r.range(-0.5, 0.5));
        const mesh = add(geo, velvet, null); mesh.frustumCulled = false;
        let last = '';
        mesh.userData.set = (lead, lag) => {
          const key = lead.toFixed(4) + '|' + lag.toFixed(4); if (key === last) return; last = key;   // same pose as the last call: nothing to do
          const span = WING_X - lead, lam = span / NF;
          const amp = K.clamp(lam / (2 * Math.PI) * Math.sqrt(2 * Math.max(0, (CLOTH / span) ** 2 - 1)) * 0.7, 0.08, 0.2);   // keeps the cloth's width roughly constant
          for (let i = 0; i < pos.count; i++) {
            const u = uv.getX(i), v = uv.getY(i), cf = u * NF, k = Math.floor(cf), f = cf - k;
            const a = K.lerp(foldAmp[k], foldAmp[k + 1], f) * (0.8 + 0.35 * (1 - v)), ph = K.lerp(foldPh[k], foldPh[k + 1], f) * (1 - v) * 0.9;
            const s = 2 * Math.PI * (cf + ph * 0.25);
            const z = amp * a * (Math.sin(s) + 0.28 * Math.sin(2 * s + 1.1 + 2.2 * v));
            const hang = (1 - v) * (1 - v) * (0.25 + 0.75 * u);                                         // the hem trails behind the track, most at the leading edge
            pos.setXYZ(i, side * (WING_X - span * u - lag * hang), 0.02 + v * (CURTAIN_TOP - 0.02), CURTAIN_Z + z + (side > 0 ? 0.07 : 0));
          }
          pos.needsUpdate = true; geo.computeVertexNormals();
        };
        return mesh;
      }
      const curtains = [makeCurtain(-1), makeCurtain(1)];
      {   // the valance: a pleated strip of the same velvet across the top, braid and fringe along its hem
        const map = velvetMap.clone(); map.repeat.set(7, 1); map.needsUpdate = true;
        const geo = new THREE.PlaneGeometry(15, 2.6, 240, 8), p = geo.attributes.position;
        for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, 0.07 * Math.sin(x * 7.3) + 0.03 * Math.sin(x * 17 + 1.3)); p.setY(i, y + (y < -1.2 ? 0.05 * Math.cos(x * 7.3) : 0)); }
        geo.computeVertexNormals();
        add(geo, velvetMat(map), [0, HEM_Y + 1.3, CURTAIN_Z + 0.24]);
      }

      // ------------------------------------------------------------ the boards, the black drapes and the slots the scenery runs in
      const boards = K.canvasTex(1024, 1024, (c, w, h) => {
        const r = K.rng(21), NP = 14, pw = w / NP;
        for (let p = 0; p < NP; p++) {
          let y = -r.range(0, h * 0.6);
          while (y < h) {                                                    // boards of different lengths, butt-jointed
            const len = r.range(h * 0.45, h * 0.9), tone = r.range(0.75, 1.15);
            c.fillStyle = `rgb(${Math.round(64 * tone)},${Math.round(40 * tone)},${Math.round(24 * tone)})`; c.fillRect(p * pw, y, pw, len);
            for (let k = 0; k < 26; k++) { c.fillStyle = `rgba(${r.chance(0.5) ? '20,10,4' : '120,84,50'},${r.range(0.04, 0.12)})`; c.fillRect(p * pw + r.range(0, pw), y, r.range(0.6, 2), len); }   // grain
            c.fillStyle = 'rgba(8,5,3,0.9)'; c.fillRect(p * pw, y + len - 2, pw, 2.5);
            for (const nx of [0.22, 0.78]) { c.fillStyle = 'rgba(10,8,6,0.8)'; c.beginPath(); c.arc(p * pw + pw * nx, y + len - 12, 2.2, 0, 7); c.fill(); }   // nail heads
            y += len;
          }
          c.fillStyle = 'rgba(6,4,2,0.95)'; c.fillRect(p * pw - 1, 0, 2.2, h);
        }
        for (let k = 0; k < 420; k++) {                                       // scuffs from years of scenery
          const x = r.range(0, w), y = r.range(0, h), l = r.range(10, 90), a = r.range(-0.5, 0.5);
          c.strokeStyle = `rgba(150,110,70,${r.range(0.03, 0.12)})`; c.lineWidth = r.range(0.6, 3);
          c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(a) * l, y + Math.cos(a) * l); c.stroke();
        }
      }, { repeat: [20, 20] });
      // a real reflection, blurred like satin varnish: this is what makes the boards "catch the light"
      K.mirrorFloor(S, { y: 0, color: '#ffffff', surfaceRoughness: 0.5, roughness: 0.3, strength: 0.55, fresnel: true, material: { map: boards } });
      const drape = new THREE.MeshBasicMaterial({ color: '#000000' });   // black velour: it is there to swallow light
      add(new THREE.PlaneGeometry(40, 14), drape, [0, 7, BACK_Z], scene, false);
      const wood = new THREE.MeshStandardMaterial({ color: '#7a5330', roughness: 0.7 }), steel = new THREE.MeshStandardMaterial({ color: '#8a8d93', roughness: 0.45, metalness: 0.6 });
      const groove = new THREE.MeshBasicMaterial({ color: '#070504' });
      for (const z of [Z.far, Z.wall, Z.mid, Z.men, Z.bench, Z.front]) { const m = add(new THREE.PlaneGeometry(16, 0.045).rotateX(-Math.PI / 2), groove, [0, 0.006, z], scene, false); m.receiveShadow = false; }

      // ------------------------------------------------------------ CUT-OUTS: everything on the stage is a painted card
      // A piece of art is a list of items in card units (y up, origin at the foot):
      //   { pts, fill, holes?, ink?, cut? }  a filled outline. It is painted AND sawn out of the card (cut: false = paint only)
      //   { line, w, color }                 a painted line
      //   { draw(ctx) }                      free painting
      // cutout() paints the list on a canvas and extrudes the same outlines into one thick card, so the silhouette
      // you see is real geometry: it throws real shadows on the layer behind and stops the beams.
      const INK = '#2a1c12', CARD = '#e6d9bb';
      const ell = (cx, cy, rx, ry = rx, n = 26, a0 = 0, a1 = TAU) => Array.from({ length: n }, (_, i) => { const a = a0 + (a1 - a0) * i / (a1 - a0 > TAU - 1e-6 ? n : n - 1); return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
      const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
      const round = (pts, it = 3) => { for (let k = 0; k < it; k++) { const o = []; pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length]; o.push([p[0] * 0.75 + q[0] * 0.25, p[1] * 0.75 + q[1] * 0.25], [p[0] * 0.25 + q[0] * 0.75, p[1] * 0.25 + q[1] * 0.75]); }); pts = o; } return pts; };   // corner cutting: a smooth blob from a rough polygon
      const strip = (line, w) => {   // a line given thickness (w: number, or a function of 0..1 along it)
        const Lf = [], Rt = [], n = line.length, wf = typeof w === 'function' ? w : () => w;
        line.forEach((p, i) => { const a = line[Math.max(0, i - 1)], b = line[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, h = wf(i / (n - 1)) / 2; Lf.push([p[0] - dy / l * h, p[1] + dx / l * h]); Rt.unshift([p[0] + dy / l * h, p[1] - dx / l * h]); });
        return Lf.concat(Rt);
      };
      const limb = (x1, y1, x2, y2, r1, r2 = r1) => { const a = Math.atan2(y2 - y1, x2 - x1); return ell(x2, y2, r2, r2, 9, a - Math.PI / 2, a + Math.PI / 2).concat(ell(x1, y1, r1, r1, 9, a + Math.PI / 2, a + Math.PI * 1.5)); };   // a tapered capsule
      const hull = (pts) => { pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = []; for (const p of pts) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); } for (const p of pts.slice().reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); } return lo.slice(0, -1).concat(up.slice(0, -1)); };
      const place = (items, s = 1, dx = 0, dy = 0, flip = 1) => items.map((it) => { const f = (a) => a.map(([x, y]) => [dx + flip * s * x, dy + s * y]), o = Object.assign({}, it); if (it.pts) o.pts = f(it.pts); if (it.holes) o.holes = it.holes.map(f); if (it.line) o.line = f(it.line); return o; });
      const label = (c, text, x, y, size, font, color, align = 'center') => { c.save(); c.translate(x, y); c.scale(size / 100, -size / 100); c.font = font; c.fillStyle = color; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(text, 0, 0); c.restore(); };

      function cutout(items, o = {}) {
        const cut = items.filter((it) => it.pts && it.cut !== false), pad = 0.04;
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const it of cut) for (const p of it.pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
        x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
        const w = x1 - x0, h = y1 - y0, res = Math.min(o.res || 280, 4000 / w, 4000 / h), T = o.thick || 0.045;
        const tex = K.canvasTex(Math.ceil(w * res), Math.ceil(h * res), (c, W, H) => {
          c.fillStyle = CARD; c.fillRect(0, 0, W, H);
          c.setTransform(res, 0, 0, -res, -x0 * res, y1 * res);     // card units, y up
          c.lineJoin = 'round'; c.lineCap = 'round';
          const trace = (pts) => { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); };
          for (const it of items) {
            if (it.draw) { c.save(); it.draw(c); c.restore(); continue; }
            if (it.line) { c.beginPath(); it.line.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.strokeStyle = it.color || INK; c.lineWidth = it.w || 0.011; c.stroke(); continue; }
            if (!it.fill) continue;
            c.beginPath(); trace(it.pts); (it.holes || []).forEach(trace);
            c.fillStyle = it.fill; c.fill('evenodd');
            if (it.ink !== 0) { c.strokeStyle = INK; c.lineWidth = it.ink || 0.011; c.stroke(); }   // the printed ink line
          }
          c.setTransform(1, 0, 0, 1, 0, 0);                         // paper grain over the paint
          const r = K.rng(o.seed || 11), n = W * H / 260;
          for (let i = 0; i < n; i++) { c.fillStyle = r.chance(0.5) ? `rgba(255,244,220,${r.range(0.02, 0.07)})` : `rgba(40,25,10,${r.range(0.02, 0.07)})`; c.fillRect(r.range(0, W), r.range(0, H), r.range(1, 3.5), r.range(1, 3.5)); }
        });
        const v2 = (a) => a.map((p) => new THREE.Vector2(p[0], p[1]));
        const geo = new THREE.ExtrudeGeometry(cut.map((it) => { const s = new THREE.Shape(v2(it.pts)); (it.holes || []).forEach((hh) => s.holes.push(new THREE.Path(v2(hh)))); return s; }), { depth: T, bevelEnabled: false, curveSegments: 1 });
        geo.translate(0, 0, -T / 2);
        const uv = geo.attributes.uv, p = geo.attributes.position;
        for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - x0) / w, (p.getY(i) - y0) / h);                  // the faces take the painting
        for (const g of geo.groups) if (g.materialIndex === 1) for (let i = g.start; i < g.start + g.count; i++) uv.setXY(i, 0.4 * pad / w, 0.4 * pad / h);   // the sawn edges take the margin of the sheet
        geo.clearGroups();
        const mesh = add(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92 }), null, o.parent || scene);
        mesh.userData.box = { x0, y0, x1, y1 };
        return mesh;
      }
      // Two ways a cut-out gets onto the stage.
      // hung(): flown from above on thin rods (pass the points on the card where the rods are fixed).
      const rodGeo = new THREE.CylinderGeometry(0.011, 0.011, 10, 6).translate(0, 5, 0), wireGeo = new THREE.CylinderGeometry(0.005, 0.005, 10, 5).translate(0, 5, 0);
      function hung(mesh, z, rods, geo = rodGeo) { const g = new THREE.Group(); g.position.z = z; scene.add(g); g.add(mesh); for (const r of rods) add(geo, steel, [r[0], r[1], -0.03], g, false); return g; }
      // onSlot(): standing on a wooden slider in a floor slot, pushed from a wing by a long wire.
      function onSlot(mesh, z, wing, baseW) { const g = new THREE.Group(); g.position.z = z; scene.add(g); mesh.position.y = 0.05; g.add(mesh); add(K.roundedBox(baseW, 0.05, 0.13, 0.012, 2), wood, [0, 0.03, 0], g); add(new THREE.CylinderGeometry(0.009, 0.009, 14, 6).rotateZ(Math.PI / 2), steel, [wing * (7 + baseW / 2), 0.035, 0], g, false); g.userData.card = mesh; return g; }

      // ------------------------------------------------------------ ART, scene 1: the bicycle shop (green wall, brown wood, cream, a red sign)
      const SKIN = '#e0ad86', SHIRT = '#f1e7d0';
      // A man in profile, drawn facing right at height 1 and then scaled. Poses come from the two arms and the stride.
      function manArt(o) {
        const it = [], suit = o.suit || '#2b2c33', trousers = o.trousers || '#4a4641', sleeve = o.coat ? suit : SHIRT, st = o.stride || 0;
        const arm = ([ex, ey, hx, hy], col) => it.push({ pts: limb(0, 0.775, ex, ey, 0.04, 0.034), fill: col }, { pts: limb(ex, ey, hx, hy, 0.034, 0.027), fill: col }, { pts: ell(hx, hy, 0.028, 0.028, 12), fill: SKIN });
        arm(o.far, o.coat ? '#1d1e23' : '#d8ccb2');                                                                    // the far arm, a shade darker
        it.push({ pts: limb(-0.03, 0.48, -0.05 - st, 0.05, 0.062, 0.038), fill: '#38352f' }, { pts: limb(-0.095 - st, 0.02, -0.005 - st, 0.02, 0.024), fill: '#191715' });   // far leg and shoe
        it.push({ pts: limb(0.02, 0.48, 0.05 + st, 0.05, 0.066, 0.04), fill: trousers }, { pts: limb(0.02 + st, 0.02, 0.125 + st, 0.02, 0.024), fill: '#191715' });
        it.push({ pts: round([[-0.09, 0.45], [0.08, 0.45], [0.1, 0.58], [0.09, 0.72], [0.05, 0.8], [-0.03, 0.815], [-0.1, 0.77], [-0.11, 0.62]], 2), fill: suit });   // waistcoat or coat
        if (!o.coat) it.push({ pts: [[0.04, 0.8], [0.092, 0.72], [0.075, 0.6], [0.035, 0.72]], fill: SHIRT, cut: false, ink: 0.006 });
        if (o.apron) it.push({ pts: [[-0.005, 0.72], [0.095, 0.69], [0.108, 0.56], [0.1, 0.3], [-0.05, 0.3], [-0.055, 0.56]], fill: '#b5aa8d' });
        it.push({ pts: limb(0, 0.8, 0.01, 0.86, 0.032), fill: SKIN }, { pts: [[-0.04, 0.8], [0.048, 0.8], [0.052, 0.838], [-0.034, 0.842]], fill: SHIRT });   // neck and stand-up collar
        it.push({ pts: [[0.064, 0.93], [0.088, 0.9], [0.062, 0.89]], fill: SKIN }, { pts: ell(0.012, 0.918, 0.058, 0.07), fill: SKIN });   // nose, head
        it.push({ pts: ell(-0.004, 0.912, 0.012, 0.018, 10), fill: '#c99672', cut: false, ink: 0.005 }, { pts: ell(0.042, 0.93, 0.006, 0.008, 8), fill: INK, cut: false, ink: 0 });   // ear, eye
        if (o.hair === 'full') it.push({ pts: ell(0.012, 0.918, 0.063, 0.076, 14, 0.62, 3.75).concat([[-0.02, 0.905], [-0.012, 0.94], [0.022, 0.956]]), fill: '#3a2a1e' });
        else it.push({ pts: ell(0.012, 0.918, 0.062, 0.074, 10, 2.0, 3.75).concat([[-0.018, 0.9], [-0.03, 0.948]]), fill: '#4a382a' });   // Wilbur had lost most of his
        if (o.moustache) it.push({ pts: limb(0.047, 0.889, 0.073, 0.882, 0.0095), fill: '#3a2a1e', cut: false, ink: 0 });
        if (o.cap) it.push({ pts: round([[-0.058, 0.95], [-0.045, 0.995], [0.02, 1.006], [0.07, 0.988], [0.082, 0.962]], 2), fill: '#3c3d44' }, { pts: limb(0.06, 0.962, 0.112, 0.953, 0.009), fill: '#2c2d33' });
        arm(o.near, sleeve);
        return place(it, o.h, 0, 0, o.facing || 1);
      }
      function benchArt() {
        const A = '#8f6030', B = '#bb8c50', C = '#6f4622', it = [];
        it.push({ pts: rect(-1.62, 0, -1.4, 0.82), fill: C }, { pts: rect(1.4, 0, 1.62, 0.82), fill: C }, { pts: rect(-1.42, 0.2, 1.42, 0.32), fill: C });   // legs and stretcher
        it.push({ pts: rect(0.3, 0.32, 1.05, 0.6), fill: '#7c2f25' }, { pts: strip([[0.5, 0.6], [0.55, 0.68], [0.8, 0.68], [0.85, 0.6]], 0.03), fill: '#2c2d33', ink: 0 });   // a toolbox on it
        it.push({ pts: rect(-1.7, 0.8, 1.7, 1.0), fill: A }, { pts: rect(-1.86, 1.0, 1.86, 1.1), fill: B });                                                 // apron and top
        it.push({ pts: [[-1.82, 1.1], [-1.5, 1.1], [-1.5, 1.32], [-1.6, 1.32], [-1.6, 1.2], [-1.72, 1.2], [-1.72, 1.32], [-1.82, 1.32]], fill: '#34353b' });   // vice
        for (const x of [-0.85, 0, 0.85]) it.push({ pts: rect(x - 0.36, 0.84, x + 0.36, 0.96), fill: '#7d5329', cut: false, ink: 0.006 }, { pts: ell(x, 0.9, 0.025, 0.025, 10), fill: '#d1b06a', cut: false, ink: 0.005 });   // drawers
        const r = K.rng(31); for (let i = 0; i < 26; i++) { const x = r.range(-1.8, 1.5), y = r.pick([1.03, 1.06, 0.86, 0.93, 0.5, 0.26]); it.push({ line: [[x, y], [x + r.range(0.15, 0.5), y + r.range(-0.006, 0.006)]], w: 0.006, color: 'rgba(60,35,15,0.35)' }); }   // grain
        return it;
      }
      // One of three sections of a wing frame (ribs on two spars), lying flat and seen from a little above.
      const FRAME = { span: 3.3, chord: [0.5, 0.62] };
      const framePt = (u, c) => [FRAME.span * u + FRAME.chord[0] * c, FRAME.chord[1] * c + 0.11 * Math.sin(Math.PI * Math.min(1, c * 1.15))];   // the ribs are cambered: they arch
      function frameArt(k) {
        const it = [], u0 = k / 3, u1 = (k + 1) / 3, cs = [0, 0.1, 0.22, 0.36, 0.5, 0.64, 0.78, 0.9, 1];
        for (let i = 0; i < 4; i++) { const u = u0 + (i + 0.5) / 4 * (u1 - u0); it.push({ pts: strip(cs.map((c) => framePt(u, c)), 0.032), fill: '#ecd49a', ink: 0.007 }); }
        for (const [c, w] of [[0, 0.055], [0.62, 0.05], [1, 0.02]]) it.push({ pts: strip([framePt(u0 + 0.004, c), framePt(u1 - 0.004, c)], w), fill: c === 1 ? '#c9a763' : '#e3c686', ink: 0.007 });
        return it;
      }
      function bicycleArt() {
        const it = [], R = 0.46, WB = 1.42, STEEL = '#1c1c20', BB = [0.5, -0.03], ST = [0.36, 0.6], HT = [1.06, 0.66], HB = [1.1, 0.46];
        const tube = (a, b, w = 0.034, fill = STEEL) => it.push({ pts: strip([a, b], w), fill, ink: 0 });
        for (const cx of [0, WB]) {
          for (let k = 0; k < 14; k++) { const a = k / 14 * TAU + 0.1; tube([cx, 0], [cx + Math.cos(a) * (R - 0.03), Math.sin(a) * (R - 0.03)], 0.009, '#9a9588'); }   // spokes: real slivers of card
          it.push({ pts: ell(cx, 0, R, R, 48), holes: [ell(cx, 0, R - 0.055, R - 0.055, 44)], fill: '#eadfc4', ink: 0.009 }, { pts: ell(cx, 0, 0.045, 0.045, 14), fill: STEEL, ink: 0 });   // white rubber tyre, hub
        }
        tube([0, 0], BB, 0.028); tube([0, 0], ST, 0.026); tube(BB, ST); tube(ST, HT); tube(BB, HB); tube(HT, HB, 0.042); tube(ST, [0.345, 0.69], 0.022);
        it.push({ pts: strip([HB, [1.2, 0.26], [WB, 0]], 0.03), fill: STEEL, ink: 0 }, { pts: strip([[1.05, 0.66], [1.03, 0.8], [0.93, 0.845], [0.85, 0.78]], 0.028), fill: STEEL, ink: 0 });   // fork, handlebar
        it.push({ pts: round([[0.22, 0.675], [0.47, 0.69], [0.49, 0.73], [0.3, 0.745], [0.21, 0.71]], 2), fill: '#6b4526' });   // saddle
        it.push({ pts: ell(BB[0], BB[1], 0.1, 0.1, 20), fill: '#2a2a2f', ink: 0 }); tube(BB, [0.6, -0.21], 0.022); tube([0.54, -0.22], [0.68, -0.22], 0.03);   // chainwheel, crank, pedal
        tube([0.5, 0.065], [0, 0.04], 0.009, '#55514a'); tube([0.5, -0.125], [0, -0.04], 0.009, '#55514a');   // chain
        return it;
      }
      // The back wall of the shop: one painting, sawn down the middle into two flats that part like doors.
      const WALL = { w: 6.4, h: 6.2, split: -0.7 };
      function paintWall(c) {
        const { w, h } = WALL, box = (x0, y0, x1, y1, col) => { c.fillStyle = col; c.fillRect(x0, y0, x1 - x0, y1 - y0); };
        c.scale(-1, 1);   // (laid out with the bench on the right, then mirrored: the easel took that side)
        box(-w, 0, w, h, '#3e5c50');
        for (let x = -w; x < w; x += 0.42) box(x, 1.6, x + 0.012, h, 'rgba(18,34,28,0.35)');                       // boarded wall
        box(-w, 0, w, 1.55, '#27392f'); for (let x = -w; x < w; x += 0.28) box(x, 0, x + 0.012, 1.55, 'rgba(8,16,12,0.5)');   // dado
        box(-w, 1.52, w, 1.6, '#b9a67c'); box(-w, 0, w, 0.16, '#18241f');
        // window, with the light of a Dayton afternoon in it
        box(3.45, 2.15, 5.25, 4.55, '#c9b78f'); box(3.55, 2.25, 5.15, 4.45, '#efdc9f');
        box(4.32, 2.25, 4.38, 4.45, '#c9b78f'); for (const y of [2.98, 3.72]) box(3.55, y, 5.15, y + 0.05, '#c9b78f');
        // the sign
        const sx = 0.75; box(sx - 2.3, 4.35, sx + 2.3, 5.05, '#e2d2a4'); box(sx - 2.25, 4.4, sx + 2.25, 5.0, '#7c2a22');
        c.save(); c.scale(-1, 1); label(c, SHOP_SIGN, -sx, 4.69, 0.36, '800 100px "Playfair Display"', '#f0e0b0'); c.restore();
        // a shelf of tins, and tools hung under it
        box(-0.35, 3.42, 2.85, 3.5, '#8b5d33'); for (const x of [-0.2, 2.7]) { c.fillStyle = '#6f4622'; c.beginPath(); c.moveTo(x - 0.03, 3.42); c.lineTo(x + 0.03, 3.42); c.lineTo(x, 3.18); c.fill(); }
        [[0.0, 0.26, 0.3, '#a8452f'], [0.34, 0.2, 0.22, '#d8c79c'], [0.62, 0.3, 0.36, '#2f4860'], [1.7, 0.22, 0.26, '#d8c79c'], [2.0, 0.34, 0.2, '#a8452f'], [2.42, 0.18, 0.32, '#8a8f6a']].forEach(([x, bw, bh, col]) => box(x, 3.5, x + bw, 3.5 + bh, col));
        c.fillStyle = '#1b2924';
        c.beginPath(); c.moveTo(0.1, 3.3); c.lineTo(1.25, 3.2); c.lineTo(1.25, 3.08); c.lineTo(0.1, 2.98); c.fill(); box(-0.12, 3.0, 0.14, 3.3, '#9c6b3a');   // saw
        box(1.62, 2.82, 1.68, 3.3, '#9c6b3a'); box(1.52, 3.2, 1.8, 3.32, '#1b2924');                                                                       // hammer
        c.strokeStyle = '#1b2924'; c.lineWidth = 0.05; c.lineCap = 'round'; c.beginPath(); c.moveTo(2.15, 2.9); c.lineTo(2.15, 3.3); c.moveTo(2.5, 2.95); c.lineTo(2.42, 3.3); c.moveTo(2.5, 2.95); c.lineTo(2.58, 3.3); c.stroke();
        // spare rims on pegs
        for (const [x, y, rr] of [[-1.15, 3.55, 0.45], [-4.85, 4.5, 0.5]]) { c.strokeStyle = '#d9cba6'; c.lineWidth = 0.05; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(217,203,166,0.5)'; c.lineWidth = 0.008; for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); c.stroke(); } box(x - 0.03, y + rr - 0.02, x + 0.03, y + rr + 0.1, '#6f4622'); }
      }

      // ------------------------------------------------------------ ART, scenes 2 and 3: Kitty Hawk (steel-blue sky, sand, cream muslin, dark figures)
      // The 1903 Flyer, drawn the honest way: its parts are placed in three dimensions (metres: x forward, y up,
      // z along the span) and projected flat from a three-quarter view, so two wings, front elevator, twin rudder,
      // skids and the two pusher propellers all sit where they should. s = stage units per metre.
      function flyerArt(s) {
        const yaw = -0.6, pit = 0.22, cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pit), sp = Math.sin(pit);   // seen from behind its left wing and a little above: it flies away up to the right
        const P = (x, y, z) => [(x * cy - z * sy) * s, (y * cp - (x * sy + z * cy) * sp) * s];
        const HALF = 6.15, LE = 0.62, TE = -1.36, GAP = 1.88, SKID = -0.5, MUSLIN = '#eadcb8', MUSLIN2 = '#cdbd95', WOODC = '#8a5f35', WOOD2 = '#664526';
        const droop = (z) => -0.2 * (z / HALF) ** 2, te = (z) => TE + 0.6 * Math.max(0, (Math.abs(z) - 5.5) / 0.65) ** 2;   // drooped tips, rounded trailing corners
        const zs = Array.from({ length: 31 }, (_, i) => -HALF + 2 * HALF * i / 30), it = [];
        const bar = (a, b, w, fill) => it.push({ pts: strip([P(...a), P(...b)], w), fill, ink: 0.006 });
        const quad = (pts3, fill) => it.push({ pts: pts3.map((p) => P(...p)), fill, ink: 0.009 });
        const body = (a, b, r1, r2, fill) => { const A = P(...a), B = P(...b); it.push({ pts: limb(A[0], A[1], B[0], B[1], r1 * s, r2 * s), fill, ink: 0.007 }); };
        const wing = (y0, fill) => {
          it.push({ pts: [...zs.map((z) => P(LE, y0 + droop(z), z)), ...zs.slice().reverse().map((z) => P(te(z), y0 + droop(z), z))], fill, ink: 0.01 });
          for (let z = -HALF + 0.3; z < HALF; z += 0.4625) it.push({ line: [P(LE, y0 + droop(z), z), P(te(z), y0 + droop(z), z)], w: 0.006, color: 'rgba(125,98,60,0.5)' });   // ribs showing through the cloth
          it.push({ line: zs.map((z) => P(LE - 0.14, y0 + droop(z), z)), w: 0.012, color: 'rgba(255,251,238,0.75)' });
        };
        // far to near, the way a scene painter would lay it in
        const elev = (y, fill) => quad([[2.55, y, -1.83], [3.3, y, -1.83], [3.3, y, 1.83], [2.55, y, 1.83]], fill);
        elev(0.45, MUSLIN2); for (const z of [-0.75, 0.75]) bar([2.98, 0.45, z], [2.98, 1.2, z], 0.02, WOODC); elev(1.2, MUSLIN);                             // the front elevator, out ahead
        for (const z of [-0.75, 0.75]) {
          bar([LE, GAP, z], [2.98, 1.2, z], 0.02, WOODC);                                                                                                     // outriggers
          it.push({ pts: strip([[TE, SKID], [0.5, SKID], [2.1, SKID], [2.55, SKID + 0.12], [2.85, SKID + 0.45], [2.98, 0.45]].map(([x, y]) => P(x, y, z)), 0.026), fill: WOODC, ink: 0.006 });   // skids, turning up to carry the elevator
          for (const x of [-0.75, 0.45]) bar([x, SKID, z], [x, 0, z], 0.02, WOOD2);
        }
        wing(0, MUSLIN2);
        const SZ = [-5.6, -4.0, -2.4, -0.8, 0.8, 2.4, 4.0, 5.6];
        for (const z of SZ) bar([0.45, droop(z), z], [0.45, GAP + droop(z), z], 0.02, WOOD2);                                                                 // front struts
        const eb = [[-0.6, 0.15], [0.03, 0.52], [-0.85, -0.3]], corners = []; for (const x of eb[0]) for (const y of eb[1]) for (const z of eb[2]) corners.push(P(x, y, z));
        it.push({ pts: hull(corners), fill: '#34322f', ink: 0.007 }, { pts: [P(-0.6, 0.52, -0.85), P(0.15, 0.52, -0.85), P(0.15, 0.52, -0.3), P(-0.6, 0.52, -0.3)], fill: '#5a554d', cut: false, ink: 0.005 });   // the engine, right of centre
        body([0.2, 0.2, 0.62], [0.74, 0.14, 0.64], 0.07, 0.06, '#25262c');                                                                                    // Orville, lying prone left of centre, hands on the elevator lever
        const hd = P(0.5, 0.33, 0.45); it.push({ pts: ell(hd[0], hd[1], 0.13 * s, 0.13 * s, 16), fill: SKIN, ink: 0.007 }, { pts: ell(hd[0] - 0.012 * s, hd[1] + 0.02 * s, 0.14 * s, 0.135 * s, 12, -0.2, 3.6), fill: '#3c3d44', ink: 0.006 });   // from behind: mostly cap
        body([0.25, 0.17, 0.45], [-0.5, 0.16, 0.45], 0.2, 0.18, '#25262c'); body([-0.5, 0.14, 0.45], [-1.3, 0.1, 0.45], 0.13, 0.09, '#3a3b42');
        for (const z of SZ) bar([-0.75, droop(z), z], [-0.75, GAP + droop(z), z], 0.024, WOODC);                                                              // rear struts
        wing(GAP, MUSLIN);
        for (const z of [-1.55, 1.55]) bar([-0.75, 0.95, z], [-1.62, 0.95, z], 0.03, '#3a3836');                                                              // propeller shafts
        for (const z of [-0.26, 0.26]) { bar([TE, GAP, z], [-3.1, 1.95, z], 0.02, WOOD2); bar([TE, 0, z], [-3.1, 0.1, z], 0.02, WOOD2); }                      // tail booms
        for (const z of [-0.26, 0.26]) quad([[-3.4, 0.08, z], [-2.85, 0.08, z], [-2.85, 1.98, z], [-3.4, 1.98, z]], z < 0 ? MUSLIN2 : MUSLIN);                // twin rudder
        return { items: it, P, slope: P(1, 0, 0)[1] / P(1, 0, 0)[0], rail: (x) => P(x, SKID - 0.04, 0),
          props: [-1.55, 1.55].map((z) => P(-1.68, 0.95, z)), propR: 1.28 * s, ey: [0, cp], ez: sy < 0 ? [-sy, -cy * sp] : [sy, cy * sp],   // each propeller disc, squashed by the same projection
          rods: [-2.4, 2.4].map((z) => P(-0.37, GAP + droop(z), z)), farTip: P(0, droop(-HALF), -HALF), ground: (x, z) => P(x, SKID - 0.04, z) };
      }
      function propArt() { return [{ pts: round([[0, -1], [0.13, -0.62], [0.05, -0.08], [0.05, 0.08], [0.13, 0.62], [0, 1], [-0.13, 0.62], [-0.05, 0.08], [-0.05, -0.08], [-0.13, -0.62]], 2), fill: '#6b4424', ink: 0.014 }, { pts: ell(0, 0, 0.07, 0.07, 14), fill: '#3a3836', ink: 0 }]; }
      // A sand flat: a long low hill with a few tonal bands, like a screen print. o: w, top(x), color, extra items.
      const nz = K.noise(5);
      function duneArt(o) {
        const xs = Array.from({ length: Math.round(o.w * 6) + 1 }, (_, i) => -o.w / 2 + i / 6), edge = xs.map((x) => [x, o.top(x)]);
        const it = [{ pts: [[-o.w / 2, 0], ...edge, [o.w / 2, 0]], fill: o.color, ink: 0 }];
        it.push({ draw(c) {
          for (let k = 1; k <= 3; k++) { c.beginPath(); c.moveTo(-o.w / 2, 0); for (const x of xs) c.lineTo(x, o.top(x) * (1 - 0.26 * k) - 0.05 * k + 0.1 * nz.n2(x * 0.6 + k * 9, k)); c.lineTo(o.w / 2, 0); c.fillStyle = o.band || 'rgba(74,52,24,0.17)'; c.fill(); }
          c.beginPath(); edge.forEach((p, i) => (i ? c.lineTo(p[0], p[1] - 0.025) : c.moveTo(p[0], p[1] - 0.025))); c.strokeStyle = 'rgba(255,242,205,0.32)'; c.lineWidth = 0.03; c.stroke();   // light along the crest
        } });
        return it.concat(o.extra || []);
      }
      const tuft = (x, y, r, col) => Array.from({ length: 8 }, (_, i) => { const hgt = r.range(0.2, 0.52), lean = -r.range(0.1, 0.34) * hgt * 2 + (i - 3.5) * 0.03; return { pts: strip([[x + (i - 3.5) * 0.012, y - 0.05], [x + (i - 3.5) * 0.012 + lean * 0.12, y + hgt * 0.35], [x + lean * 0.5, y + hgt * 0.72], [x + lean, y + hgt]], (u) => 0.02 * (1 - u) + 0.004), fill: r.pick(col), ink: 0 }; });   // sea oats, bent by the wind

      // ------------------------------------------------------------ SET, scene 1
      const wallL = cutout([{ draw: paintWall }, { pts: rect(-WALL.w, 0, WALL.split, WALL.h) }], { res: 200, seed: 2 }); wallL.position.z = Z.wall;
      const wallR = cutout([{ draw: paintWall }, { pts: rect(WALL.split, 0, WALL.w, WALL.h) }], { res: 200, seed: 3 }); wallR.position.z = Z.wall + 0.004;
      const BENCH_X = -1.2, FRAME_AT = [-2.9, 1.2];
      const bench = onSlot(cutout(benchArt(), { seed: 4 }), Z.bench, -1, 3.3);
      const frames = [0, 1, 2].map((k) => { const g = hung(cutout(frameArt(k), { seed: 5 + k, thick: 0.035 }), Z.frame, [framePt((k + 0.5) / 3, 0.62)]); g.position.x = FRAME_AT[0]; return g; });
      const bikeMesh = cutout(bicycleArt(), { seed: 9, thick: 0.035 }); bikeMesh.scale.setScalar(1.12);
      const bike = hung(bikeMesh, Z.hang, [[0.5, 0.7], [1.2, 0.74]]); bike.position.x = 2.25;
      const MAN_H = 2.6;
      const orville = onSlot(cutout(manArt({ h: MAN_H, hair: 'full', moustache: true, near: [0.1, 0.63, 0.25, 0.585], far: [0.13, 0.66, 0.28, 0.65] }), { seed: 12 }), Z.men, -1, 0.7);
      const wilbur = onSlot(cutout(manArt({ h: MAN_H, facing: -1, apron: true, near: [0.1, 0.64, 0.25, 0.6], far: [0.12, 0.67, 0.27, 0.69] }), { seed: 13 }), Z.men + 0.02, 1, 0.7);

      // ------------------------------------------------------------ SET, scenes 2 and 3
      // sky cloth: painted, hung at the back, lit by the horizon lights and whatever the washes spill on it
      const SKY = { w: 18, h: 8.6, y0: -0.6 };
      const sky = add(new THREE.PlaneGeometry(SKY.w, SKY.h), new THREE.MeshStandardMaterial({ roughness: 1, map: K.canvasTex(2048, 1024, (c, w, h) => {
        const Y = (y) => h * (1 - (y - SKY.y0) / SKY.h), g = c.createLinearGradient(0, Y(7.6), 0, Y(2.1)), r = K.rng(8);
        g.addColorStop(0, '#10233e'); g.addColorStop(0.6, '#27486d'); g.addColorStop(0.88, '#5c84a2'); g.addColorStop(1, '#d8c594');
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        for (let i = 0; i < 9; i++) {                                           // long flat winter cloud, laid in with a dry brush
          const cx = r.range(0, w), cyy = Y(r.range(2.5, 5.2)), len = r.range(260, 620), th = r.range(9, 26), light = r.chance(0.6);
          for (let k = 0; k < 16; k++) { c.fillStyle = light ? `rgba(226,222,204,${r.range(0.05, 0.13)})` : `rgba(22,40,66,${r.range(0.06, 0.16)})`; c.beginPath(); c.ellipse(cx + r.range(-len, len) * 0.5, cyy + r.range(-th, th) * 0.5, len * r.range(0.25, 0.6), th * r.range(0.3, 0.8), 0, 0, TAU); c.fill(); }
        }
        c.fillStyle = '#284c5c'; c.fillRect(0, Y(2.1), w, h); c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(0, Y(2.1), w, 2);   // the Atlantic
        for (let i = 0; i < w * h / 300; i++) { c.fillStyle = r.chance(0.5) ? `rgba(255,244,220,${r.range(0.02, 0.06)})` : `rgba(20,25,40,${r.range(0.02, 0.06)})`; c.fillRect(r.range(0, w), r.range(0, h), r.range(1, 3), r.range(1, 3)); }
      }) }), [0, SKY.y0 + SKY.h / 2, Z.sky], scene, false);
      sky.receiveShadow = false;   // a shadow of an aeroplane on the sky would give the game away

      const FL = flyerArt(0.6), REST = [-1.4, 1.25];   // REST: where the centre of the lower wing sits when the Flyer is on its rail
      // The three sand flats. Each is much wider than the stage: they slide in from the right, and in scene 3 they
      // keep sliding left at different speeds, a moving panorama that makes the short flight travel.
      const FLAT = { far: { w: 16, x: 1, pan: 0.6 }, mid: { w: 20, x: 3.5, pan: 6.5 }, front: { w: 22, x: 4.5, pan: 9 } };
      const gr = K.rng(23), GRASS = ['#6f6a34', '#8a7f3e', '#5a6034', '#9a8846'];
      const farTop = (x) => 2.08 + 0.14 * nz.n2(x * 0.4, 1) + 1.2 * Math.exp(-(((x + 6.6) / 2.3) ** 2)) - 0.36 * K.smooth(0.5, 5.5, x);   // Kill Devil Hill on the left, falling to the sea on the right
      const shed = (x, w, h) => { const y = Math.min(farTop(x), farTop(x + w)) - 0.04; return [{ pts: [[x, y], [x + w, y], [x + w, y + h], [x + w / 2, y + h * 1.45], [x, y + h]], fill: '#5e4a34', ink: 0.007 }, { pts: rect(x + w * 0.38, y, x + w * 0.62, y + h * 0.7), fill: '#3a2d20', cut: false, ink: 0 }]; };
      const far = cutout(duneArt({ w: FLAT.far.w, top: farTop, color: '#b8a274', band: 'rgba(96,76,48,0.13)', extra: [...shed(3.0, 0.62, 0.3), ...shed(3.85, 0.44, 0.24)] }), { seed: 14 }); far.position.z = Z.far;
      const midTop = (x) => 1.74 + 0.14 * nz.n2(x * 0.5, 4) + 0.1 * nz.n2(x * 1.3, 6);
      const railPts = [-2.6, 10].map((x) => { const p = FL.rail(x); return [p[0] + REST[0] - FLAT.mid.x, p[1] + REST[1]]; });   // the launch rail: sixty feet of wooden track, drawn in the Flyer's own perspective
      const railItems = [{ pts: strip(railPts, 0.05), fill: '#6a4a2a', cut: false, ink: 0.007 }, { line: railPts.map((p) => [p[0], p[1] + 0.014]), w: 0.012, color: 'rgba(235,205,150,0.8)' }];
      for (let i = 0; i <= 12; i++) { const x = K.lerp(railPts[0][0], railPts[1][0], i / 12), y = K.lerp(railPts[0][1], railPts[1][1], i / 12); railItems.unshift({ pts: rect(x - 0.11, y - 0.07, x + 0.11, y - 0.02), fill: '#4f3920', cut: false, ink: 0.005 }); }
      const midTufts = []; for (let i = 0; i < 7; i++) { const x = gr.range(1, 9.5); midTufts.push(...tuft(x, midTop(x), gr, GRASS)); }   // only on the stretch that slides into view during the flight
      const mid = cutout(duneArt({ w: FLAT.mid.w, top: midTop, color: '#a07f4a', extra: [...railItems, ...midTufts] }), { seed: 15 }); mid.position.z = Z.mid;
      const frontTop = (x) => 0.36 + 0.1 * nz.n2(x * 0.55, 9) + 0.05 * nz.n2(x * 1.6, 2);
      const frontTufts = []; for (let i = 0; i < 15; i++) { const x = -10.5 + i * 1.45 + gr.range(-0.4, 0.4); frontTufts.push(...tuft(x, frontTop(x), gr, GRASS)); }
      const front = cutout(duneArt({ w: FLAT.front.w, top: frontTop, color: '#765b34', band: 'rgba(40,26,10,0.2)', extra: frontTufts }), { seed: 16 }); front.position.z = Z.front;

      // the Flyer: one card, two propellers that really turn behind it, two rods
      const flyer = new THREE.Group(); flyer.position.z = Z.flyer; scene.add(flyer);
      cutout(FL.items, { res: 300, seed: 18, thick: 0.04, parent: flyer });
      const props = FL.props.map((c, i) => {
        const g = new THREE.Group(), R = FL.propR; g.matrixAutoUpdate = false;
        g.matrix.set(FL.ez[0] * R, FL.ey[0] * R, 0, c[0], FL.ez[1] * R, FL.ey[1] * R, 0, c[1], 0, 0, 1, 0.045 + i * 0.012, 0, 0, 0, 1);   // a circle seen at an angle is a squashed circle
        flyer.add(g); return cutout(propArt(), { res: 160, seed: 19 + i, thick: 0.02, parent: g });
      });
      const flyRods = FL.rods.map(() => add(rodGeo, steel, null, scene, false));
      // Wilbur at Kitty Hawk: coat and cap, steadying the far wingtip
      const WIL = [REST[0] + FL.ground(-1.2, -7.6)[0], REST[1] + FL.ground(-1.2, -7.6)[1]];   // just clear of the far (right) wingtip, where he stood to steady it
      const wilburK = onSlot(cutout(manArt({ h: 1.07, coat: true, cap: true, stride: 0.05, near: [0.1, 0.67, 0.25, 0.65], far: [0.11, 0.69, 0.26, 0.72] }), { seed: 21, res: 320 }), Z.men + 0.05, -1, 0.4);
      wilburK.userData.card.position.y = WIL[1]; add(new THREE.CylinderGeometry(0.012, 0.012, WIL[1], 6).translate(0, WIL[1] / 2, 0), wood, [0, 0.03, -0.03], wilburK);   // he stands on a stick behind the sand
      // wind: strips of white card on rods that stream across, right to left
      const gusts = Array.from({ length: 9 }, (_, i) => {
        const r = K.rng(40 + i), len = r.range(1.5, 2.6), ph = r.range(0, 6), line = Array.from({ length: 22 }, (_, k) => [k / 21 * len, 0.09 * Math.sin(k / 21 * 5 + ph) * (0.4 + k / 21)]);
        const g = hung(cutout([{ pts: strip(line, (u) => 0.055 * Math.pow(Math.sin(Math.PI * u), 0.7) + 0.006), fill: '#f4eedc', ink: 0 }], { seed: 30 + i, thick: 0.025 }), Z.wind + i * 0.012, [line[11]], wireGeo);
        g.userData = { t0: CUE.dunes[0] + 0.1 + i * 0.78, y: [3.2, 4.3, 2.7, 3.8, 4.6, 3.0, 4.1, 3.5, 4.4][i], v: r.range(2.6, 3.4) }; return g;
      });

      // ------------------------------------------------------------ the easel at the front of the stage: one card per scene
      const EASEL = { x: 2.55, w: 2.8, h: 1.3, y: 0.3, tilt: -0.1 }, CPX = 360, INKC = '#14110e';
      const fit = (c, text, font, maxPx, width) => { c.font = `${font} 100px "Oswald"`; return Math.min(maxPx, 100 * width / c.measureText(text).width); };
      function drawCard(c, W, H, card, nums) {
        c.fillStyle = '#e9dfc6'; c.fillRect(0, 0, W, H);
        const r = K.rng(77); for (let i = 0; i < 2600; i++) { c.fillStyle = r.chance(0.5) ? `rgba(255,250,235,${r.range(0.03, 0.08)})` : `rgba(60,40,15,${r.range(0.02, 0.06)})`; c.fillRect(r.range(0, W), r.range(0, H), r.range(1, 4), r.range(1, 4)); }
        c.strokeStyle = INKC; c.lineWidth = 6; c.strokeRect(18, 18, W - 36, H - 36); c.lineWidth = 2; c.strokeRect(30, 30, W - 60, H - 60);
        c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = '#8f1d15';
        c.letterSpacing = '6px'; const kp = fit(c, card.place, '700', 60, W - 170); c.font = `700 ${kp}px "Oswald"`; c.fillText(card.place, W / 2 + 3, 104); c.letterSpacing = '0px';
        c.fillRect(W / 2 - 70, 126, 140, 5);
        c.fillStyle = INKC;
        const Y = [272, 412];
        if (card.lines) card.lines.forEach((l, i) => { const px = fit(c, l, '500', 138, W - 130); c.font = `500 ${px}px "Oswald"`; c.fillText(l, W / 2, Y[i] - (138 - px) * 0.2); });
        else card.count.forEach(([, one, many], i) => {                         // number right-aligned on a fixed line, so nothing jumps as it runs
          const n = nums[i], y = Y[i], x = W * 0.42;
          c.textAlign = 'right'; c.font = '700 144px "Oswald"'; c.fillText(String(n), x, y);
          c.textAlign = 'left'; c.font = '500 106px "Oswald"'; c.fillText(n === 1 ? one : many, x + 30, y);
        });
      }
      const easel = new THREE.Group(); easel.position.set(EASEL.x, 0, Z.easel); easel.rotation.x = EASEL.tilt; scene.add(easel);
      for (const sx of [-1, 1]) { const leg = add(K.roundedBox(0.07, 1.9, 0.05, 0.012, 2), wood, [sx * 1.12, 0.93, -0.06], easel); leg.rotation.z = -sx * 0.07; }
      add(K.roundedBox(EASEL.w + 0.2, 0.05, 0.14, 0.012, 2), wood, [0, EASEL.y - 0.03, 0.03], easel);
      const edgeMat = new THREE.MeshStandardMaterial({ color: '#d9cdb0', roughness: 0.9 }), backMat = new THREE.MeshStandardMaterial({ color: '#cbbd9c', roughness: 0.95 });
      const cards = CARDS.map((card, i) => {
        const tex = K.canvasTex(EASEL.w * CPX, Math.round(EASEL.h * CPX), (c, W, H) => drawCard(c, W, H, card, [0, 0]));
        const m = add(new THREE.BoxGeometry(EASEL.w, EASEL.h, 0.014), [edgeMat, edgeMat, edgeMat, edgeMat, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }), backMat], [0, EASEL.y + EASEL.h / 2, 0.02 * (CARDS.length - i)], easel);
        m.userData.tex = tex; return m;
      });
      let shown = '0|0';
      const counter = cards[2].userData.tex, COUNT = CARDS[2].count;

      // ------------------------------------------------------------ the prompt book, written out: where everything is at time t
      const E = K.ease, seg = K.seg, rgb = (h) => new THREE.Color(h).toArray();
      const AMBER = rgb('#ffc98a'), WARM = rgb('#ffe2bd'), COLD = rgb('#c4d6ff'), STEEL_BLUE = rgb('#8fb4ee'), WHITE = rgb('#f4f1ea'), SUN = rgb('#fff1df'), DAWN = rgb('#ffb877');
      const mix3 = (a, b, k) => [K.lerp(a[0], b[0], k), K.lerp(a[1], b[1], k), K.lerp(a[2], b[2], k)];
      const slideOff = (t, t0, dur = 0.95) => seg(t, t0, t0 + dur, E.in);
      const orvX = K.track([[0, -4.95], [CUE.enter[0], -4.95], [CUE.enter[1], -3.5, 'inOut'], [CUE.strike + 0.1, -3.5], [CUE.strike + 1.0, -8.5, 'in']]);
      const flyX = K.path([[CUE.roll, 0], [CUE.lift, 0.78], [CUE.lift + 1.2, 1.3], [CUE.flown, 1.58], [D + 0.8, 1.7]]);
      const flyY = K.path([[CUE.lift, 0], [CUE.lift + 0.6, 0.4], [CUE.lift + 1.4, 1.05], [CUE.flown, 1.45], [D + 0.8, 1.55]]);
      const pan = K.path([[CUE.lift, 0], [CUE.lift + 0.9, 0.13], [CUE.flown, 0.8], [D + 0.7, 1]]);
      const flyerAt = (t) => {                                                   // [x, y, pitch] of the lower wing's centre
        const dx = flyX(t), up = t > CUE.lift ? flyY(t) + 0.06 * Math.sin(TAU * 0.8 * (t - CUE.lift) - 1.2) * seg(t, CUE.lift + 0.3, CUE.lift + 1.1) : 0;   // the first flight pitched up and down all the way
        const drop = 5.9 * (1 - seg(t, CUE.flyer[0], CUE.flyer[1], E.out)), ts = t - CUE.flyer[1];
        const rot = 0.075 * K.smooth(CUE.lift - 0.12, CUE.lift + 0.5, t) - 0.04 * K.smooth(CUE.lift + 1.3, CUE.flown, t) + 0.022 * Math.sin(TAU * 0.8 * (t - CUE.lift)) * seg(t, CUE.lift, CUE.lift + 0.6) + (ts > 0 ? 0.014 * Math.exp(-5 * ts) * Math.sin(TAU * 2.4 * ts) : 0);
        return [REST[0] + dx, REST[1] + FL.slope * Math.min(dx, 0.78) + up + drop, rot];
      };
      const SPIN = TAU * 2.4, spin = (t) => { const u = t - CUE.props; return u <= 0 ? 0.5 : u < 1 ? SPIN * u * u / 2 : SPIN * (u - 0.5); };
      const cam = {
        pos: K.path([[0, [-0.45, 3.1, 10.5]], [4.6, [0, 3.25, 11.1]], [8.6, [0.3, 3.32, 11.05]], [D + 1, [0.6, 3.4, 10.9]]]),
        aim: K.path([[0, [-0.35, 2.5, -1.5]], [4.6, [0, 2.55, -1.5]], [8.6, [0.28, 2.58, -1.5]], [D + 1, [0.55, 2.6, -1.5]]]),
      };
      const washLevel = K.track([[0, 0.85], [CUE.strike, 0.85], [CUE.strike + 0.45, 0.25, 'inOut'], [CUE.dunes[2] + 0.6, 0.45, 'inOut'], [CUE.lift, 0.45], [CUE.lift + 1.4, 0.55, 'inOut'], [CUE.flown, 0.55], [CUE.flown + 1.0, 0.36, 'inOut']]);
      const washTint = K.track([[0, AMBER], [CUE.strike, AMBER], [CUE.strike + 0.9, COLD, 'inOut'], [CUE.lift, COLD], [CUE.lift + 1.6, SUN, 'inOut']]);
      const horizonLevel = K.track([[0, 0], [CUE.strike + 0.1, 0], [CUE.strike + 1.0, 3.4, 'inOut'], [CUE.lift, 3.4], [CUE.lift + 1.6, 5.5, 'inOut'], [CUE.flown, 5.5], [CUE.flown + 1.0, 4.2, 'inOut']]);
      const horizonTint = K.track([[0, STEEL_BLUE], [CUE.lift, STEEL_BLUE], [CUE.lift + 1.6, DAWN, 'inOut']]);

      return {
        update(t) {
          // the house curtain is already open: its hem is still swinging to rest as the clip starts
          const lag = 0.14 * Math.exp(-2.2 * t) * Math.sin(TAU * 0.85 * t + 0.6);
          curtains[0].userData.set(OPEN_X, lag); curtains[1].userData.set(OPEN_X, lag);
          K.look(camera, cam.pos(t), cam.aim(t)); K.focus(camera, [0, 2.5, -1.5], 0.01);

          // ---- scene 1 and its strike
          const part = seg(t, CUE.strike, CUE.strike + 1.05, E.inOut);
          wallL.position.x = -5.8 * part; wallR.position.x = 6.6 * part;
          const ox = orvX(t), ov = (orvX(t + 0.02) - orvX(t - 0.02)) / 0.04;
          orville.position.x = ox; orville.userData.card.rotation.z = -0.012 * ov * Math.sin(TAU * 2.6 * t);          // a pushed slider rocks a little
          const wOff = slideOff(t, CUE.strike + 0.15);
          wilbur.position.x = 1.05 + 6.6 * wOff; wilbur.userData.card.rotation.z = 0.03 * Math.sin(TAU * 2.6 * t) * Math.sin(Math.PI * wOff) + 0.012 * Math.sin(TAU * 0.5 * t) * (1 - wOff);
          bench.position.x = BENCH_X - 7.2 * slideOff(t, CUE.strike + 0.25);
          const flyOut = 6.2 * seg(t, CUE.strike + 0.05, CUE.strike + 0.95, E.in);
          frames.forEach((g, k) => {
            const t0 = k ? CUE.frame[k - 1] : -1, ts = t - t0 - 0.5;
            g.position.y = FRAME_AT[1] + 5.6 * (1 - seg(t, t0, t0 + 0.5, E.out)) + flyOut;
            g.rotation.z = ts > 0 ? 0.02 * Math.exp(-4.5 * ts) * Math.sin(TAU * 2.2 * ts) : 0;                          // it settles on the bench with a small rock
          });
          bike.position.y = 3.0 + flyOut * 1.05; bike.rotation.z = 0.012 * Math.sin(TAU * 0.35 * t + 1);

          // ---- scene 2 arrives: sand from the right, the Flyer from above, Wilbur along his slot
          const p = t > CUE.lift ? pan(t) : 0;
          [[far, FLAT.far, 0], [mid, FLAT.mid, 1], [front, FLAT.front, 2]].forEach(([m, f, i]) => { m.position.x = f.x + 15 * (1 - seg(t, CUE.dunes[i], CUE.dunes[i] + 1.25, E.outQuint)) - f.pan * p; });
          const [fx, fy, frot] = flyerAt(t);
          flyer.position.x = fx; flyer.position.y = fy; flyer.rotation.z = frot;
          const a = spin(t); props.forEach((m, i) => { m.rotation.z = a * (i ? -1 : 1) + i * 0.9; });                  // the two propellers turned in opposite directions
          const cs = Math.cos(frot), sn = Math.sin(frot);
          flyRods.forEach((r, i) => { const q = FL.rods[i]; r.position.set(fx + q[0] * cs - q[1] * sn, fy + q[0] * sn + q[1] * cs, Z.flyer - 0.03); });
          const run = Math.min(flyX(t), 1.0), wx = WIL[0] - 4.5 * (1 - seg(t, CUE.wilbur[0], CUE.wilbur[1], E.out)) + run - FLAT.mid.pan * p;   // he runs with it along the rail, then the ground carries him away
          wilburK.position.x = wx; wilburK.userData.card.rotation.z = 0.035 * Math.sin(TAU * 3 * t) * seg(t, CUE.roll, CUE.roll + 0.3) * (1 - seg(t, CUE.lift + 0.5, CUE.lift + 1.2));
          gusts.forEach((g) => { const u = g.userData; g.position.x = 8.5 - u.v * (t - u.t0); g.position.y = u.y + 0.06 * Math.sin(t * 1.7 + u.y * 3); g.visible = t > u.t0; });

          // ---- the easel: the front card is pulled away to the right, showing the next
          cards.forEach((m, i) => { m.position.x = i < 2 ? 5 * seg(t, CUE.card[i], CUE.card[i] + 0.5, E.in) : 0; });
          const u = seg(t, CUE.lift, CUE.flown), key = COUNT.map(([n]) => Math.floor(n * u + 1e-6)).join('|');   // whole seconds and whole feet so far
          if (key !== shown) { shown = key; const nums = key.split('|').map(Number); counter.redraw((c, W, H) => drawCard(c, W, H, CARDS[2], nums)); }

          // ---- the lighting plot: the lamps follow the action and take the colour of the scene
          const toFlyer = K.smooth(CUE.strike + 0.1, CUE.flyer[0] + 0.25, t), inAir = seg(t, CUE.lift, CUE.lift + 1.2, E.inOut), last = seg(t, CUE.flown, CUE.flown + 1.0, E.inOut);
          const onFrame = [-1.1, 1.75 + flyOut * 0.75, Z.frame], onFlyer = [fx + 0.15, fy + 0.6, Z.flyer];
          follow.set(mix3(onFrame, onFlyer, toFlyer), K.lerp(1, 0.55, Math.sin(Math.PI * seg(t, CUE.strike, CUE.flyer[0] + 0.3))) * (1 + 0.15 * last),
            { color: mix3(WARM, WHITE, toFlyer), angle: K.lerp(0.14, 0.175, toFlyer) });
          const toWil = K.smooth(CUE.strike + 0.2, CUE.wilbur[0] + 0.4, t);
          follow2.set(mix3([ox, 1.75, Z.men], [wx, WIL[1] + 0.6, Z.men], toWil), (0.25 + 0.6 * seg(t, CUE.enter[0], CUE.enter[0] + 0.5)) * (1 - 0.85 * Math.sin(Math.PI * seg(t, CUE.strike, CUE.wilbur[0] + 0.5))) * (1 - seg(t, CUE.lift + 1.0, CUE.lift + 2.2)),
            { color: mix3(WARM, WHITE, toWil), angle: K.lerp(0.085, 0.05, toWil), reach: 1.2 });
          const wl = washLevel(t), wc = washTint(t);
          wash.forEach((L, i) => L.set([(i ? -1 : 1) * 1.6, 2.4, -1.6], wl, { color: wc }));   // crossed: each lights the far side of the stage
          top.set(mix3([BENCH_X + 0.2, 0.9, Z.bench - 0.1], [fx + 0.1, fy + 0.3, Z.flyer + 0.05], toFlyer), K.lerp(1, 0.25, Math.sin(Math.PI * seg(t, CUE.strike, CUE.flyer[0] + 0.4))) * K.lerp(1, 0.75, toFlyer),
            { color: mix3(mix3(AMBER, COLD, toFlyer), SUN, inAir), angle: K.lerp(0.17, 0.2, toFlyer), reach: K.lerp(8, 1.6, K.smooth(CUE.flyer[1], CUE.flyer[1] + 0.6, t)) });
          cardLamp.set([EASEL.x, EASEL.y + EASEL.h / 2, Z.easel], 0.62, { color: WARM });
          const hl = horizonLevel(t), hc = horizonTint(t); horizon.forEach((l) => { l.intensity = hl; l.color.setRGB(hc[0], hc[1], hc[2]); });

          lamps.forEach((L, i) => {
            L.uni.uTime.value = t; L.uni.uSeed.value = (t * 977) % 61;
            dustU.uA.value[i].copy(L.apex); dustU.uD.value[i].copy(L.dir); dustU.uC.value[i].copy(L.color).multiplyScalar(L.level * (L.o.dust == null ? 1 : L.o.dust) * 5);
            dustU.uK.value[i].set(L.cosO, L.cosI, L.uni.uNear.value);
          });
          dustU.uTime.value = t;
        },
      };
    },

    sound(k) {
      const r = globalThis.K.rng(4), bar = (a, b) => 240 / (b - a);   // one held chord per scene
      k.bed('room', 0, D, { gain: 0.9 });
      k.music('pad', 0, CUE.strike + 0.3, { bpm: bar(0, CUE.strike + 0.3), chords: [['F3', 'C4', 'A4', 'E4']], gain: 1.0 });
      k.music('pad', CUE.strike + 0.3, CUE.roll, { bpm: bar(CUE.strike + 0.3, CUE.roll), chords: [['D3', 'A3', 'F4', 'E4']], gain: 0.75 });
      k.music('pad', CUE.roll, CUE.lift, { bpm: bar(CUE.roll, CUE.lift), chords: [['G3', 'D4', 'G4', 'B4']], gain: 0.8 });
      k.music('pad', CUE.lift, D, { bpm: bar(CUE.lift, D), chords: [['C3', 'G3', 'E4', 'C5']], gain: 0.8 });
      // scene 1: a slider pushed along its slot, wing sections seated on the bench
      k.play('thud', 0.02, { gain: 0.2, f: 70 });
      k.play('roller', CUE.enter[0], { dur: CUE.enter[1] - CUE.enter[0], gain: 0.16, pan: -0.5 }); k.play('tock', CUE.enter[1], { gain: 0.35, f: 300, pan: -0.2 });
      CUE.frame.forEach((t, i) => { k.play('swish', t + 0.1, { dur: 0.3, gain: 0.2, pan: 0.1 + i * 0.2 }); k.play('tock', t + 0.46, { gain: 0.6, f: 560 + i * 90, pan: 0.1 + i * 0.2 }); k.play('click', t + 0.47, { gain: 0.5, pan: 0.1 + i * 0.2 }); });
      // the change: lamps clunk over, flats and sliders run off, rods run up, sand runs in, the card is pulled
      k.play('stamp', CUE.strike, { gain: 0.55 }); k.play('buzz', CUE.strike, { dur: 0.25, gain: 0.22, f: 98 });
      k.play('roller', CUE.strike + 0.05, { dur: 1.1, gain: 0.24 }); k.play('whoosh', CUE.strike + 0.1, { dur: 1.0, gain: 0.22, top: 1500 }); k.play('swish', CUE.strike + 0.3, { dur: 0.6, gain: 0.18 });
      CUE.dunes.forEach((t, i) => { k.play('whoosh', t, { dur: 0.9, gain: 0.2, top: 900 + i * 250, pan: 0.5 - i * 0.2 }); k.play('thud', t + 0.85, { gain: 0.22 + i * 0.05, f: 95, pan: 0.2 - i * 0.2 }); });
      CUE.card.forEach((t) => { k.play('paper', t, { dur: 0.4, gain: 0.8, pan: 0.5 }); k.play('swish', t + 0.1, { dur: 0.3, gain: 0.2, pan: 0.6 }); });
      k.play('swish', CUE.flyer[0] + 0.1, { dur: 0.7, gain: 0.22 }); k.play('tock', CUE.flyer[1] - 0.12, { gain: 0.6, f: 240 }); k.play('thud', CUE.flyer[1] - 0.12, { gain: 0.3, f: 110 });
      k.play('roller', CUE.wilbur[0], { dur: CUE.wilbur[1] - CUE.wilbur[0], gain: 0.12, pan: 0.5 });
      // Kitty Hawk: wind over the dunes, and a small engine that catches, runs and pulls
      k.noise(CUE.dunes[0], { dur: D - CUE.dunes[0], color: 'pink', filter: 'bandpass', f: [[0, 420], [1.5, 900], [3, 600], [4.6, 1200], [6.5, 700], [8.4, 950]], q: 0.7, gain: 0.07, a: 1.2, hold: D - CUE.dunes[0] - 2, bus: 'amb' });
      k.play('click', CUE.props, { gain: 0.6 });
      k.withMinor(() => { let t = CUE.props; while (t < D - 0.05) { const u = Math.min(1, (t - CUE.props) / 0.9), pull = globalThis.K.smooth(CUE.roll - 0.2, CUE.lift, t), fade = 1 - 0.45 * globalThis.K.smooth(CUE.flown, D, t), g = (0.06 + 0.05 * u + 0.06 * pull) * fade * r.range(0.8, 1); k.tone(t, { f: [[0, 105 + 25 * pull], [0.04, 62]], type: 'sawtooth', dur: 0.06, gain: g, filter: 'lowpass', f2: 620 + 300 * pull, pan: 0.1 }); k.noise(t, { dur: 0.02, filter: 'bandpass', f: 1300, q: 1, gain: g * 0.5, pan: 0.1 }); t += 0.16 - 0.085 * u - 0.012 * pull; } });
      // scene 3: along the rail, off it, and the count
      k.play('roller', CUE.roll, { dur: CUE.lift - CUE.roll, gain: 0.2 }); k.play('riser', CUE.roll + 0.1, { dur: CUE.lift - CUE.roll - 0.1, gain: 0.5 });
      k.play('whoosh', CUE.lift - 0.05, { dur: 1.1, gain: 0.3, top: 2200 }); k.play('ding', CUE.lift, { gain: 0.4, f: 'G5' });
      const n = CARDS[2].count[0][0]; for (let i = 1; i <= n; i++) { const t = CUE.lift + (CUE.flown - CUE.lift) * i / n; k.play('tick', t, { gain: 0.5, f: 3000 + i * 110, pan: 0.5 }); k.play('tock', t, { gain: 0.16, f: 700 + i * 22, pan: 0.5 }); }
      ['C4', 'G4', 'C5', 'E5'].forEach((nn, i) => k.tone(CUE.flown, { f: nn, type: 'sawtooth', dur: 1.7, gain: 0.032, a: 0.04, hold: 0.8, filter: 'lowpass', f2: [[0, 800], [0.2, 2200], [1.5, 800]], pan: (i - 1.5) * 0.25, verb: 0.35 }));
      k.play('success', CUE.flown, { gain: 0.55, f: 'C6' }); k.play('sparkle', CUE.flown + 0.12, { gain: 0.6, n: 6 });
    },
  });
}
```
