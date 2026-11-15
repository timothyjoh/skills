# Inflated (#12)

- **id:** `inflated`
- **Category:** Material worlds
- **Use:** explainer
- **Reference duration:** 12 s
- **Google Fonts:** none
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`, `lib/strokefont.js`

## Style card

- **Look:** Everything is a glossy inflatable in a bright one-colour studio: here a striped hot-air balloon, its basket, a flame, arrows, clouds and small tube letters. Each skin has welded seams and is limp, flat and creased when short of air, round and mirror-smooth when full.
- **Motion:** Air is the animation. Things fill in pumps that overshoot and snap taut, swell from the valve end outwards, stand up, wobble and settle. Full things float and sway, landings squash and rock, arrows and captions inflate in and deflate out. Every jolt rings out as a wobble.
- **Light:** Softboxes overhead and to the left and a thin strip on the right draw long white highlights on every skin. A soft key from the upper left shapes the forms and drops soft shadows; the floor and the flame bounce their colour onto the skins.
- **Materials:** Clear-coated vinyl in hot candy colours (pink, orange, yellow, red) with cream trim and a wicker-orange basket, on a cobalt sweep with just enough sheen to hold a blurred pool of colour under each object.
- **Camera:** One slow, continuous crane on a long lens that stays with the main object: high over it while it lies on the floor, sinking and pulling back as it stands, looking up at it as it rises, overtaking it to look down as it sinks, level again for the last hold.
- **Finish:** True colours (neutral tone curve), real motion blur on the wobble, a touch of depth of field, soft bloom on the highlights and the flame, almost no grain.
- **Good for:** Any explainer or story that can be told with a few simple inflated objects and characters. It is strongest where pressure, growth, floating, squeezing or too much and too little is the point, because how full each thing is carries the meaning. A beat is one change of air (something fills, lifts, vents, sags) that causes the next one; small balloon arrows show a push or a flow; each beat gets one short caption in small tube letters at the side of the frame.

## Reference

- **Sample topic:** How a hot-air balloon flies
- **Gallery description:** Everything is a glossy inflatable in a bright one-colour studio: here a striped hot-air balloon, its basket, a flame, arrows, clouds and small tube letters. Each skin has welded seams and is limp, flat and creased when short of air, round and mirror-smooth when full.
- **Shown in the sample clip:** How a hot-air balloon flies

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/inflated.js`)

```js
{
  // ---------------------------------------------------------------- content (change this for a new topic)
  // Four beats that follow from each other. The picture tells them; each gets one short caption in small balloon
  // letters (STROKEFONT characters only: A-Z 0-9 . , ! ? - + : ' / & % # @ =).
  const BEATS = [
    { at: 0.0, until: 1.42, say: 'NO HEAT,\nNO LIFT' },                        // the envelope lies limp beside its basket
    { at: 1.6, until: 4.45, say: 'HEATED AIR\nEXPANDS' },                      // the burner fires: it swells and stands up
    { at: 4.75, until: 7.7, say: 'HOT AIR IS\nLIGHTER, SO\nIT RISES' },          // so it lifts off and rises
    { at: 7.95, until: 10.85, say: 'VENT OPEN:\nHOT AIR OUT,\nLESS LIFT' } ,   // the top vent lets hot air out: it sinks and lands
  ];
  const ROOM = '#2545f2';                                        // the one bold studio colour
  const STRIPES = ['#ff3d8f', '#ff6a1c', '#ffc414', '#ff3a2e'];  // the envelope's gores, in turn
  const CREAM = '#f7f3ea';                                       // crown cap, skirt, frame, clouds, captions
  const WICKER = ['#f2a43c', '#de842a'];                         // the basket's rings
  const WARM = '#ff5a1f';                                        // arrows: warm air pushing

  // ---------------------------------------------------------------- the story, told in air (picture and sound share this)
  const BURNS = [[1.5, 1.95], [2.03, 2.48], [2.6, 3.05], [4.05, 4.95], [6.0, 6.55]];   // [from, to] the burner roars
  const FILLS = [0.42, 0.34, 0.26];       // air the first three roars put in: 0 = limp, 1 = taut
  const PILOT = 0.2;                      // the small flame between roars
  const T_RISE = 2.3;                     // enough air to start standing up
  const T_LIFT = 4.7, T_TOP = 7.6;        // off the floor, top of the climb
  const T_VENT = 7.9, T_SHUT = 9.85;      // the vent in the crown opens and closes
  const T_SINK = 8.2, T_LAND = 10.45;     // down again
  const ALT = 7;                          // how high it goes
  const STAND = [0.55, 0.62];             // the spring that stands the balloon up: Hz, damping
  let T_THUMP = T_RISE; while (K.spring(T_THUMP - T_RISE, ...STAND) < 1) T_THUMP += 1 / 240;   // the basket slaps down flat

  const ring = (tau, hz, damp) => (tau <= 0 ? 0 : Math.exp(-damp * tau) * Math.sin(2 * Math.PI * hz * tau));   // a jolt that rings out
  const fire = (t) => Math.max(PILOT * K.smooth(BURNS[0][0] - 0.08, BURNS[0][0], t), ...BURNS.map(([a, b]) => K.smooth(a, a + 0.07, t) * (1 - K.smooth(b - 0.18, b, t))));
  const air = (t) => FILLS.reduce((a, f, i) => a + f * K.spring(t - BURNS[i][0] - 0.05, 2.4, 0.5), 0.02);     // each roar is a pump: it overshoots and snaps back
  const alt = (t) => ALT * K.smooth(T_LIFT, T_TOP, t) * (1 - K.smooth(0, 1, 0.93 * K.seg(t, T_SINK, T_LAND)) / K.smooth(0, 1, 0.93))   // it still has a little speed when it lands
    + 0.09 * Math.sin(2.4 * (t - T_TOP)) * K.smooth(T_TOP - 0.6, T_TOP, t) * (1 - K.smooth(T_SINK, T_SINK + 0.7, t));
  const vent = (t) => K.spring(t - T_VENT, 4, 0.4) * (1 - K.seg(t, T_SHUT, T_SHUT + 0.25, K.ease.inOut));
  // lean of the whole balloon: lying on its side (a quarter turn), standing up on a spring, swaying in flight, a rock on landing
  const tilt = (t) => Math.PI / 2 * (1 - K.spring(t - T_RISE, ...STAND))
    + 0.022 * Math.sin(1.9 * (t - T_LIFT)) * K.smooth(T_LIFT, T_LIFT + 1.2, t) * (1 - K.smooth(T_LAND - 1.4, T_LAND - 0.3, t))
    + 0.03 * ring(t - T_LAND, 1.5, 3);

  registerStyle({
    id: 'inflated',
    name: 'Inflated',
    family: 'Material worlds',
    look: 'Everything is a glossy inflatable in a bright one-colour studio: here a striped hot-air balloon, its basket, a flame, arrows, clouds and small tube letters. Each skin has welded seams and is limp, flat and creased when short of air, round and mirror-smooth when full.',
    motion: 'Air is the animation. Things fill in pumps that overshoot and snap taut, swell from the valve end outwards, stand up, wobble and settle. Full things float and sway, landings squash and rock, arrows and captions inflate in and deflate out. Every jolt rings out as a wobble.',
    light: 'Softboxes overhead and to the left and a thin strip on the right draw long white highlights on every skin. A soft key from the upper left shapes the forms and drops soft shadows; the floor and the flame bounce their colour onto the skins.',
    materials: 'Clear-coated vinyl in hot candy colours (pink, orange, yellow, red) with cream trim and a wicker-orange basket, on a cobalt sweep with just enough sheen to hold a blurred pool of colour under each object.',
    camera: 'One slow, continuous crane on a long lens that stays with the main object: high over it while it lies on the floor, sinking and pulling back as it stands, looking up at it as it rises, overtaking it to look down as it sinks, level again for the last hold.',
    post: 'True colours (neutral tone curve), real motion blur on the wobble, a touch of depth of field, soft bloom on the highlights and the flame, almost no grain.',
    explains: 'Any explainer or story that can be told with a few simple inflated objects and characters. It is strongest where pressure, growth, floating, squeezing or too much and too little is the point, because how full each thing is carries the meaning. A beat is one change of air (something fills, lifts, vents, sags) that causes the next one; small balloon arrows show a push or a flow; each beat gets one short caption in small tube letters at the side of the frame.',
    topic: 'How a hot-air balloon flies',
    duration: 12,
    fonts: [],
    render: { samples: 48, shutter: 0.5, tone: 'neutral', exposure: 1.0, bloom: 0.18, bloomThreshold: 1.0, vignette: 0.22, grain: 0.006, fov: 30, background: '#000000' },

    build(S) {
      const { THREE, K, scene, camera } = S;
      const TAU = Math.PI * 2;

      // ------------------------------------------------------------ studio: paper sweep, softboxes, key light
      // The softboxes live in the environment and are there to be reflected: bright enough to draw white highlights
      // on a glossy skin. The skins take only a little of their diffuse light (SOFTBOX_FILL), so colours stay deep;
      // the shaping light is the key, a sky/floor fill and a sky light for contact shadows.
      K.env(S, { top: '#2b3cb0', horizon: '#3f5bff', bottom: ROOM, intensity: 1.0, blur: 0.03, panels: [
        { pos: [0.5, 11, 2.5], size: [9, 3.4], color: '#ffffff', power: 30 },    // overhead softbox: the long highlight on top of every skin
        { pos: [-9, 6, 8], size: [4, 6], color: '#fff3e2', power: 22 },          // key softbox, upper left
        { pos: [11, 3.5, 0.5], size: [1.1, 9], color: '#eaf0ff', power: 30 },    // thin strip for a rim on the right
      ] });
      const SOFTBOX_FILL = 0.12;
      // the key and the sky light travel with the balloon, so it is lit the same on the floor and up among the clouds
      const KEY_FROM = new THREE.Vector3(-7, 12, 10).normalize();
      const key = K.sun(S, { color: '#fff6ea', power: 2.6, size: 7.5, soft: 1.9, far: 70 });
      const sky = K.skyLight(S, { power: 0.5, size: 10 });
      scene.add(new THREE.HemisphereLight('#f2f0ff', '#989fe6', 1.1));

      // the paper sweep: a floor with a soft sheen (so every object leaves a blurred pool of its colour under it)
      // that curves up into the back wall, so there is no horizon line
      const paper = { color: ROOM, roughness: 0.9, envMap: scene.environment, envMapIntensity: SOFTBOX_FILL };
      K.mirrorFloor(S, { color: ROOM, surfaceRoughness: 0.9, roughness: 0.5, strength: 0.3, material: paper });
      {
        const prof = [[-9, 0]];
        for (let i = 1; i <= 24; i++) { const a = i / 24 * Math.PI / 2; prof.push([-9 - Math.sin(a) * 7, 7 - Math.cos(a) * 7]); }
        prof.push([-16, 60]);
        const pos = [], idx = [];
        prof.forEach(([z, y], i) => { pos.push(-80, y, z, 80, y, z); if (i) idx.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i); });
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
        const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial(paper)); m.receiveShadow = true; m.position.y = 0.002; scene.add(m);
        // only the objects are mirrored in the floor: the wall lives on layer 1, which the mirror does not look at, and
        // the background behind it is black (render.background), so empty floor mirrors nothing
        m.layers.set(1); camera.layers.enable(1);
      }

      // ------------------------------------------------------------ vinyl: the one material everything is made of
      // Clear-coated plastic whose gloss comes from the softboxes only (a small light makes a hard dot on a skin this
      // glossy), with a little light scattered inside the balloon. o.paint is GLSL that may repaint diffuseColor and
      // add to totalEmissiveRadiance; o.vertex / o.fragment patch the shaders further; o.key names the variant.
      function vinyl(color, o = {}) {
        const m = new THREE.MeshPhysicalMaterial({ color, roughness: 0.24, metalness: 0, ior: 1.9, clearcoat: 1, clearcoatRoughness: 0.06, sheen: 0.15, sheenRoughness: 0.5,
          sheenColor: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.5), side: o.side || THREE.FrontSide, vertexColors: !!o.vertexColors });
        m.onBeforeCompile = (sh) => {
          Object.assign(sh.uniforms, o.uniforms || {});
          if (o.vertex) sh.vertexShader = o.vertex(sh.vertexShader);
          sh.fragmentShader = (o.fragment ? o.fragment(sh.fragmentShader) : sh.fragmentShader)
            .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + (o.paint || '') + '\n totalEmissiveRadiance += diffuseColor.rgb * 0.18;')
            .replace('#include <lights_fragment_maps>', '#include <lights_fragment_maps>\n iblIrradiance *= ' + SOFTBOX_FILL.toFixed(3) + ';')
            .replace('reflectedLight.directSpecular + reflectedLight.indirectSpecular', 'reflectedLight.indirectSpecular')
            .replace('( clearcoatSpecularDirect + clearcoatSpecularIndirect )', 'clearcoatSpecularIndirect');
        };
        m.customProgramCacheKey = () => 'vinyl:' + (o.key || 'plain');
        return m;
      }
      const solid = (geo, mat, parent, shadow = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = shadow; (parent || scene).add(m); return m; };
      // join indexed geometries into one (positions and normals only)
      const merge = (list) => {
        let n = 0, ni = 0; list.forEach((g) => { n += g.attributes.position.count; ni += g.index.count; });
        const pos = new Float32Array(n * 3), nrm = new Float32Array(n * 3), idx = new Uint32Array(ni); let o = 0, oi = 0;
        list.forEach((g) => { pos.set(g.attributes.position.array, o * 3); nrm.set(g.attributes.normal.array, o * 3); const ix = g.index.array; for (let i = 0; i < ix.length; i++) idx[oi + i] = ix[i] + o; o += g.attributes.position.count; oi += ix.length; });
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
        return g;
      };
      // a smooth body of revolution through a few [radius, height] points (flames, arrows, pods)
      const turned = (pts, seg = 40) => new THREE.LatheGeometry(new THREE.SplineCurve(pts.map(([r, y]) => new THREE.Vector2(r, y))).getPoints(64).map((p) => new THREE.Vector2(Math.max(p.x, 0), p.y)), seg);

      // ------------------------------------------------------------ the envelope
      // Rest shape: a teardrop turned around the y axis, mouth at y = 0, crown at ENV_H, with GORES bulging panels and a
      // crease along every seam. The mesh stores that full, upright shape. The vertex shader lays it on the floor,
      // flattens it, fills it and stands it up (skin() below), and works the normals out from the deformed neighbours.
      const ENV_H = 3.2, ENV_R = 1.4, MOUTH_R = 0.38, EQ = 0.64 * ENV_H, GORES = 16, CAP_R = 0.46;
      function envelopeGeometry() {
        const NU = GORES * 12, NV = 150, fine = [];
        for (let i = 0; i <= 200; i++) { const y = EQ * i / 200; fine.push([MOUTH_R + (ENV_R - MOUTH_R) * Math.pow(Math.sin(Math.PI / 2 * y / EQ), 1.2), y]); }   // throat and cone
        for (let i = 1; i <= 200; i++) { const a = Math.PI / 2 * i / 200; fine.push([ENV_R * Math.cos(a), EQ + (ENV_H - EQ) * Math.sin(a)]); }                      // dome
        const len = [0]; for (let i = 1; i < fine.length; i++) len.push(len[i - 1] + Math.hypot(fine[i][0] - fine[i - 1][0], fine[i][1] - fine[i - 1][1]));
        const profile = (v) => {     // [radius, height] at fraction v of the way along the skin from mouth to crown
          const s = K.clamp(v) * len[len.length - 1]; let i = 1; while (i < len.length - 1 && len[i] < s) i++;
          const u = (s - len[i - 1]) / (len[i] - len[i - 1]); return [K.lerp(fine[i - 1][0], fine[i][0], u), K.lerp(fine[i - 1][1], fine[i][1], u)];
        };
        const point = (a, v) => {
          const [r, y] = profile(v), u = (a / TAU * GORES) % 1, bulge = Math.pow(Math.max(0, 4 * u * (1 - u)), 0.7);
          const rr = r * (1 - 0.06 * Math.pow(Math.sin(Math.PI * K.clamp(v)), 0.6) * (1 - bulge));      // seams are valleys, panels bulge
          return new THREE.Vector3(rr * Math.cos(a), y, rr * Math.sin(a));
        };
        const pos = [], nrm = [], gore = [], idx = [], dv = new THREE.Vector3(), da = new THREE.Vector3();
        for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
          const a = i / NU * TAU + Math.PI, v = j / NV, p = point(a, v);     // the mesh closes at the back (a = PI)
          dv.subVectors(point(a, Math.min(1, v + 0.4 / NV)), point(a, Math.max(0, v - 0.4 / NV))); da.subVectors(point(a + 0.5 * TAU / NU, v), point(a - 0.5 * TAU / NU, v));
          const n = j === NV ? new THREE.Vector3(0, 1, 0) : dv.clone().cross(da).normalize();
          pos.push(p.x, p.y, p.z); nrm.push(n.x, n.y, n.z); gore.push(i / NU, v);
          if (i < NU && j < NV) { const q = j * (NU + 1) + i; idx.push(q, q + NU + 1, q + 1, q + 1, q + NU + 1, q + NU + 2); }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setAttribute('aGore', new THREE.Float32BufferAttribute(gore, 2));
        g.setIndex(idx);
        return g;
      }
      const C = (x) => x.toFixed(4);
      const ENV_VERT = /* glsl */`
        attribute vec2 aGore;                  // x: 0..1 around the balloon, y: 0..1 along the skin from mouth to crown
        uniform vec3 uPivot;                   // where the middle of the mouth is in the world
        uniform vec4 uPose;                    // x: lean of the axis at the mouth (0 = straight up, PI/2 = lying towards -x), y: bend per unit
                                               // of length, z: stretch along the axis, w: stretch across it
        uniform vec4 uAir;                     // x: air 0..1, y: overall girth, z: vent 0..1 (the crown cap is pulled in), w: slack 0..1
        varying vec3 vRest; varying float vLimp;
        float softplus(float x) { return x > 15.0 ? x : log(1.0 + exp(x)); }
        // how full the skin is at height s: the air comes in at the mouth, so the swelling travels from there to the crown
        float fullAt(float s) {
          float f = smoothstep(0.0, 1.0, uAir.x * 1.8 - 0.8 * s / ${C(ENV_H)});
          return max(f, 0.75 * (1.0 - smoothstep(0.0, 0.7, s)));                           // the load ring holds the mouth open
        }
        vec3 skin(vec3 p) {
          float rr = length(p.xz), f = fullAt(p.y), limp = 1.0 - f, flat_ = mix(0.13, 1.0, f);
          float s = p.y - uAir.z * 0.3 * (1.0 - smoothstep(${C(0.72 * CAP_R)}, ${C(CAP_R)}, rr)) * step(${C(0.8 * ENV_H)}, p.y);   // vent: the cap sinks into the crown
          s *= uPose.z;
          // cross-section: a limp skin is a flat, slightly wider sheet with soft buckles; a full one is round
          vec2 q = p.xz * uAir.y * uPose.w;
          float lx = q.x * flat_ + limp * rr * 0.022 * (sin(p.z * 3.1 + p.y * 2.3) + 0.6 * sin(p.y * 5.3 - p.z * 4.1));
          float lz = q.y * mix(1.18, 1.0, f) * (1.0 + limp * (0.05 * sin(p.y * 5.0) + 0.03 * sin(p.y * 11.0 + 1.0)));
          // the axis is an arc that leaves the mouth at angle uPose.x and bends by uPose.y per unit of length
          float a0 = uPose.x, k = uPose.y, a = a0 + k * s;
          vec2 c = abs(k) < 1e-4 ? s * vec2(-sin(a0), cos(a0)) : vec2(cos(a) - cos(a0), sin(a) - sin(a0)) / k;
          vec2 u = vec2(cos(a), sin(a));                                                   // "across", at right angles to the axis
          // the floor: a limp skin cannot hold itself up and lies on it; a full one rests its belly on it
          float rest = abs(u.y) * rr * uAir.y * flat_ + 0.02 + 0.07 * limp;
          float cy = mix(uPivot.y + c.y, rest, limp * smoothstep(0.0, 0.8, s));
          cy = rest + 0.05 * (softplus((cy - rest) / 0.05) - 0.69 * limp);
          return vec3(uPivot.x + c.x + u.x * lx, cy + u.y * lx, uPivot.z + lz);
        }`;
      const ENV_FRAG = /* glsl */`
        uniform vec4 uAir; uniform vec3 uPal[4]; uniform vec3 uCream; uniform float uHeat;
        varying vec3 vRest; varying float vLimp;
        float gHole = 0.0;                     // 1 where we look into the open vent
        float h3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
        float vnoise(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(h3(i), h3(i + vec3(1, 0, 0)), f.x), mix(h3(i + vec3(0, 1, 0)), h3(i + vec3(1, 1, 0)), f.x), f.y),
                     mix(mix(h3(i + vec3(0, 0, 1)), h3(i + vec3(1, 0, 1)), f.x), mix(h3(i + vec3(0, 1, 1)), h3(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
        // wrinkles: long folds that run along the balloon, deep while the skin is limp, faint near the mouth when it is slack
        float skinHeight() {
          vec3 p = vRest * vec3(4.0, 1.0, 4.0);
          float soft = vnoise(p * 1.3) - 0.5;                                               // dents
          float fold = 1.0 - smoothstep(0.0, 0.16, abs(vnoise(p + 3.7) - 0.5)) + 0.5 * (1.0 - smoothstep(0.0, 0.14, abs(vnoise(p * 1.9 + 9.1) - 0.5)));   // creases
          return vLimp * (0.07 * soft - 0.02 * fold) + 0.014 * uAir.w * (1.0 - smoothstep(0.0, 1.6, vRest.y)) * soft;
        }`;
      const ENV_PAINT = /* glsl */`
        { float rr = length(vRest.xz), top = step(${C(0.8 * ENV_H)}, vRest.y), gi = vGore.x * ${C(GORES)}, gu = fract(gi);
          vec3 col = uPal[int(mod(floor(gi), 4.0))];                                                               // one colour per gore
          float trim = max(top * (1.0 - smoothstep(${C(CAP_R - 0.012)}, ${C(CAP_R + 0.012)}, rr)), 1.0 - smoothstep(0.17, 0.19, vRest.y));
          col = mix(col, uCream, trim);                                                                            // crown cap and skirt
          col = mix(col, vec3(1.0), 0.42 * exp(-pow(min(gu, 1.0 - gu) / 0.035, 2.0)) * (1.0 - 0.6 * trim));        // the welds are paler
          gHole = uAir.z * top * (1.0 - smoothstep(${C(0.9 * CAP_R)}, ${C(0.99 * CAP_R)}, rr));
          float inside = step(faceDirection, 0.0), nearMouth = exp(-vRest.y * 1.6);
          diffuseColor.rgb = col * (1.0 - 0.55 * inside);
          // the burner lights the inside, and the skin near the mouth glows like a lantern while it roars
          totalEmissiveRadiance += uHeat * mix(col * vec3(1.0, 0.8, 0.55) * 0.3 * nearMouth, vec3(1.7, 0.6, 0.14) * (0.2 + nearMouth), inside); }`;
      const envU = { uPivot: { value: new THREE.Vector3() }, uPose: { value: new THREE.Vector4(0, 0, 1, 1) }, uAir: { value: new THREE.Vector4(1, 1, 0, 0) }, uHeat: { value: 0 },
        uPal: { value: STRIPES.map((c) => new THREE.Color(c)) }, uCream: { value: new THREE.Color(CREAM) } };
      const envelope = solid(envelopeGeometry(), vinyl('#ffffff', { key: 'envelope', uniforms: envU, side: THREE.DoubleSide, paint: ENV_PAINT,
        vertex: (v) => v.replace('#include <common>', '#include <common>\n' + ENV_VERT + '\nvarying vec2 vGore;')
          // normal: push two neighbours on the rest shape through the same deformation and take the cross product
          .replace('#include <beginnormal_vertex>', `vec3 eP = skin(position);
            vec3 eT = normalize(cross(normal, abs(normal.y) > 0.9 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0))), eB = cross(normal, eT);
            vec3 objectNormal = normalize(cross(skin(position + 0.012 * eT) - eP, skin(position + 0.012 * eB) - eP));
            vRest = position; vGore = aGore; vLimp = 1.0 - fullAt(position.y);`)
          .replace('#include <begin_vertex>', 'vec3 transformed = eP;'),
        fragment: (f) => f.replace('#include <common>', '#include <common>\n' + ENV_FRAG + '\nvarying vec2 vGore;')
          // bump from the procedural wrinkle height (true-scale version of three's bump mapping), for base and clear coat
          .replace('#include <normal_fragment_begin>', `#include <normal_fragment_begin>
            { float bh = skinHeight(); vec2 dH = vec2(dFdx(bh), dFdy(bh)) * smoothstep(0.12, 0.55, abs(dot(normal, normalize(vViewPosition))));   // fade at grazing angles, where bump turns to noise
              vec3 sx = dFdx(-vViewPosition), sy = dFdy(-vViewPosition);
              vec3 r1 = cross(sy, normal), r2 = cross(normal, sx); float det = dot(sx, r1);
              vec3 tilt = sign(det) * (dH.x * r1 + dH.y * r2) / max(abs(det), 1e-9); tilt *= min(1.0, 0.5 / max(length(tilt), 1e-5));   // never fold the normal right over
              normal = normalize(normal - tilt); nonPerturbedNormal = normal; }`)
          .replace('#include <opaque_fragment>', 'outgoingLight = mix(outgoingLight, vec3(0.2, 0.035, 0.03) * (1.0 + 2.0 * uHeat), min(1.0, gHole));   // the open vent is a dark hole, not a glossy dish\n#include <opaque_fragment>') }));
      envelope.frustumCulled = false;     // the mesh itself stays at the origin: the shader puts the skin in the world
      {
        const d = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide });     // so its shadow follows the deformation too
        d.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, envU); sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + ENV_VERT).replace('#include <begin_vertex>', 'vec3 transformed = skin(position);'); };
        envelope.customDepthMaterial = d;
      }
      // the same axis arc on the CPU, for things that ride on the envelope: [x, y, angle] at distance s from the mouth
      const pose = { x: 0, y: 0, a0: 0, k: 0 };
      const axisAt = (s) => { const a = pose.a0 + pose.k * s; return Math.abs(pose.k) < 1e-4 ? [pose.x - s * Math.sin(pose.a0), pose.y + s * Math.cos(pose.a0), a] : [pose.x + (Math.cos(a) - Math.cos(pose.a0)) / pose.k, pose.y + (Math.sin(a) - Math.sin(pose.a0)) / pose.k, a]; };

      // ------------------------------------------------------------ basket, frame, burner and flame: one rigid rig
      // The basket is a stack of inflated rings. `rig` turns about whichever bottom edge is on the floor, so the basket
      // can lie on its side, be pulled upright and rock; `car` holds the parts with the basket's floor at y = 0.
      const BASKET_W = 0.95, TUBE = 0.11, BASKET_H = 2 * TUBE + 3 * 0.19, MOUTH_Y = BASKET_H + 0.55;
      const rig = new THREE.Group(), car = new THREE.Group(); scene.add(rig); rig.add(car);
      const squircle = (half, y, n = 96) => Array.from({ length: n }, (_, i) => { const a = (i + 0.5) / n * TAU, c = Math.cos(a), s = Math.sin(a); return [half * Math.sign(c) * Math.abs(c) ** 0.4, y, half * Math.sign(s) * Math.abs(s) ** 0.4]; });
      const wicker = WICKER.map((c) => vinyl(c)), cream = vinyl(CREAM);
      for (let i = 0; i < 4; i++) solid(K.tube(squircle(BASKET_W / 2 - TUBE, TUBE + i * 0.19), TUBE * (i === 3 ? 1.08 : 1), { closed: true, segments: 160, radial: 16 }), i === 3 ? cream : wicker[i % 2], car);
      solid(K.roundedBox(BASKET_W - 0.16, 0.1, BASKET_W - 0.16, 0.05), wicker[1], car).position.y = 0.07;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) solid(K.tube([[sx * 0.33, BASKET_H - 0.06, sz * 0.33], [sx * 0.3, (BASKET_H + MOUTH_Y) / 2, sz * 0.3], [sx * 0.27, MOUTH_Y, sz * 0.27]], 0.038, { segments: 10, radial: 12 }), cream, car);   // uprights
      solid(new THREE.TorusGeometry(MOUTH_R, 0.055, 14, 56).rotateX(Math.PI / 2), cream, car).position.y = MOUTH_Y;                                                // load ring: the envelope's mouth sits in it
      for (const s of [-1, 1]) solid(K.tube([[-0.33, BASKET_H, -0.33 * s], [0, BASKET_H - 0.02, 0], [0.33, BASKET_H, 0.33 * s]], 0.032, { segments: 10, radial: 10 }), cream, car);   // burner bars
      solid(turned([[0, -0.13], [0.1, -0.11], [0.13, -0.02], [0.12, 0.06], [0.07, 0.1], [0, 0.1]]), vinyl('#c9ccd6'), car).position.y = BASKET_H - 0.02;           // burner pod
      // the flame: an inflated teardrop, yellow at the root and red at the tip, that also lights what is near it
      const flame = new THREE.Group(); flame.position.y = BASKET_H + 0.06; car.add(flame);
      {
        const g = turned([[0, 0], [0.17, 0.03], [0.27, 0.16], [0.26, 0.32], [0.18, 0.55], [0.09, 0.78], [0.03, 0.94], [0, 1]]), p = g.attributes.position, col = [];
        const stops = ['#ffe34a', '#ff8a1c', '#ff3a2e'].map((c) => new THREE.Color(c)), c = new THREE.Color();
        for (let i = 0; i < p.count; i++) { const y = p.getY(i) * 2; c.copy(stops[Math.min(1, Math.floor(y))]).lerp(stops[Math.min(2, Math.floor(y) + 1)], y % 1); col.push(c.r, c.g, c.b); }
        g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
        solid(g, vinyl('#ffffff', { key: 'flame', vertexColors: true, paint: 'totalEmissiveRadiance += diffuseColor.rgb * 0.9;' }), flame, false);
      }
      const flameLight = new THREE.PointLight('#ff8a2a', 0, 6, 2); flameLight.position.y = 0.35; flame.add(flameLight);

      // ------------------------------------------------------------ arrows: small foil balloons that show a push
      const arrowGeo = turned([[0, -0.5], [0.1, -0.49], [0.155, -0.42], [0.155, -0.08], [0.17, 0.0], [0.31, 0.05], [0.35, 0.12], [0.3, 0.2], [0.13, 0.41], [0.035, 0.49], [0, 0.5]]).scale(1, 1, 0.6);
      const warm = vinyl(WARM);
      const arrows = Array.from({ length: 7 }, () => solid(arrowGeo, warm));
      // lift arrows ride beside the envelope: [x from the axis, height above the mouth], two each side
      const LIFT = [[-1.3, 0.5], [-1.85, 1.35], [1.3, 0.5], [1.85, 1.35]];

      // ------------------------------------------------------------ clouds: clusters of white balls, hung at different heights
      // [x, y, z, size]: kept to the left of and behind the balloon, clear of the captions on the right
      const CLOUDS = [[-3.4, 4.4, -2.4, 1.0], [0.9, 6.3, -5.0, 1.5], [-2.9, 7.6, 1.2, 0.62], [-4.4, 9.6, -4.0, 1.35], [1.6, 11.6, -3.2, 1.0], [-2.6, 12.6, -1.5, 0.8]];
      const clouds = CLOUDS.map(([x, y, z, s], n) => {
        const g = new THREE.Group(), ball = new THREE.SphereGeometry(1, 40, 28), white = vinyl('#ffffff');
        [[0, 0, 0, 0.5], [-0.55, -0.08, 0.05, 0.36], [0.52, -0.1, 0, 0.4], [0.2, 0.22, -0.1, 0.36], [-0.25, 0.18, 0.12, 0.32], [0.95, -0.2, 0.04, 0.24], [-0.95, -0.2, 0, 0.22]].forEach(([bx, by, bz, r]) => { const b = solid(ball, white, g, false); b.position.set(bx, by, bz); b.scale.setScalar(r); });
        g.position.set(x, y, z); g.scale.set(s * (n % 2 ? -1 : 1), s * 0.9, s); scene.add(g);
        return g;
      });

      // ------------------------------------------------------------ captions: small balloon letters, one mesh per line
      // Tubes along the single-stroke font with round ends. The shader moves every vertex along its normal (uPuff), which
      // changes the tube's radius exactly, so a line can blow up from a thin thread. Sizes here are in cap heights.
      const LETTER = 0.118;
      function balloonLines(text) {
        const lay = STROKEFONT.layout(text, { size: 1, align: 'left', spacing: 0.24, lineGap: 0.7, step: 0.07, round: 0.14 }), rows = new Map();
        lay.strokes.forEach((st) => { const y = lay.glyphs[st.glyph].y; if (!rows.has(y)) rows.set(y, []); rows.get(y).push(st); });
        return [...rows.keys()].sort((a, b) => b - a).map((y) => {
          const parts = [], ball = (p, r) => parts.push(new THREE.SphereGeometry(r, 14, 10).translate(p[0], p[1], 0));
          rows.get(y).forEach((st) => {
            if (st.closed && STROKEFONT.length(st) < 0.5) { ball(st.points.reduce((a, p) => [a[0] + p[0] / st.points.length, a[1] + p[1] / st.points.length], [0, 0]), LETTER * 1.15); return; }   // a dot
            parts.push(K.tube(st.points, LETTER, { closed: st.closed, segments: st.points.length * 2, radial: 12 }));
            if (!st.closed) { ball(st.points[0], LETTER); ball(st.points[st.points.length - 1], LETTER); }
          });
          const u = { uPuff: { value: 0 } };
          const m = solid(merge(parts), vinyl(CREAM, { key: 'letters', uniforms: u, vertex: (v) => v.replace('#include <common>', '#include <common>\nuniform float uPuff;').replace('#include <begin_vertex>', 'vec3 transformed = position + normal * uPuff;') }), null, false);
          m.frustumCulled = false; m.userData.u = u;
          return m;
        });
      }
      const captions = BEATS.map((b) => ({ ...b, lines: balloonLines(b.say) }));
      // where the caption block sits in the picture: left edge and middle height as fractions of the frame from its
      // centre, cap height as a fraction of the frame height, and how far in front of the subject it floats
      const CAP = { x: 0.13, y: 0.06, size: 0.053, near: 0.8 };

      // ------------------------------------------------------------ camera: one crane move that stays with the balloon
      const cam = {
        aimX: K.path([[0, -1.12], [1.8, -1.05], [3.9, 0.97], [10.6, 0.95], [12, 0.2]]),    // the balloon ends up left of centre, captions to its right
        aimY: K.path([[0, 0.1], [1.8, 0.4], [2.95, 2.5], [3.9, 2.3], [7.8, 2.3], [8.8, 2.55], [10.2, 2.3], [12, 2.3]]),        // height of the aim above the basket floor
        dist: K.path([[0, 9.2], [1.8, 9.2], [2.95, 10.7], [4.0, 10.4], [7.7, 10.9], [8.8, 11.2], [10.4, 10.4], [12, 9.7]]),
        high: K.path([[0, 5.6], [2.0, 4.6], [3.9, 0.8], [5.0, -0.5], [6.4, -2.1], [7.7, -0.2], [8.9, 4.4], [10.0, 2.8], [12, 0.6]]),   // camera above (+) or below (-) its aim
        side: K.path([[0, -1.0], [12, 1.0]]),                                                 // slow drift to the right
      };
      const vX = new THREE.Vector3(), vY = new THREE.Vector3(), vZ = new THREE.Vector3(), focusAt = new THREE.Vector3();
      const nz = K.noise(3);

      return {
        update(t) {
          const A = air(t), heat = fire(t), y0 = alt(t), phi = tilt(t), open = vent(t);
          const pump = BURNS.slice(0, 3).reduce((a, [tb]) => a + ring(t - tb - 0.05, 3.1, 5), 0);                 // every pump makes the skin ring
          const bump = ring(t - T_THUMP, 3.2, 6) + 0.8 * ring(t - T_LAND, 3, 6);                                  // the basket hitting the floor
          const tug = ring(t - T_LIFT, 1.5, 2.6);                                                                 // the envelope taking the basket's weight

          // ---- the rig: basket, frame, burner
          const edge = y0 > 0.002 ? 0 : (phi >= 0 ? -1 : 1) * BASKET_W / 2, sq = 1 - 0.07 * bump;
          rig.position.set(edge, y0, 0); rig.rotation.z = phi; car.position.x = -edge; car.scale.set(1 + 0.04 * bump, sq, 1 + 0.04 * bump);
          const mouthY = MOUTH_Y * sq;
          pose.x = edge - edge * Math.cos(phi) - mouthY * Math.sin(phi); pose.y = y0 - edge * Math.sin(phi) + mouthY * Math.cos(phi);

          // ---- the envelope: the crown follows the lean a moment late, so it droops while rising and overshoots when it settles
          const slack = K.seg(t, T_VENT, T_VENT + 0.7, K.ease.inOut) * (1 - 0.5 * K.seg(t, T_LAND, T_LAND + 0.8, K.ease.inOut));
          pose.a0 = phi; pose.k = 0.8 * (tilt(t - 0.16) - phi) / ENV_H;
          const along = 1 + 0.05 * pump + 0.03 * tug - 0.04 * bump, girth = (1 + 0.05 * ring(t - BURNS[2][0] - 0.1, 3.1, 5) - 0.025 * pump + 0.012 * heat * (t >= BURNS[3][0] ? 1 : 0) - 0.035 * slack) * (1 - 0.015 * tug + 0.03 * bump);
          envU.uPivot.value.set(pose.x, pose.y, 0); envU.uPose.value.set(phi, pose.k, along, 1);
          envU.uAir.value.set(A, girth, open, slack); envU.uHeat.value = heat;
          pose.len = ENV_H * along;

          // ---- the flame: flickers, leans, and lights the mouth
          const fl = 0.75 + 0.25 * nz.n2(t * 9, 1.3), lean = 0.12 * nz.n2(t * 6, 7.7);
          flame.visible = heat > 0.01; flame.scale.set(0.55 + 0.45 * heat, (0.12 + 0.88 * heat) * (0.9 + 0.25 * fl), 0.55 + 0.45 * heat); flame.rotation.z = lean;
          flameLight.intensity = 5 * heat * fl;

          // ---- arrows. Lift arrows flow upwards beside the envelope while it climbs: each one inflates low, rises and
          // deflates, over and over. Vent arrows leave the crown while the vent is open.
          arrows.forEach((m, j) => {
            const lift = j < 4, T0 = lift ? T_LIFT + 0.25 : T_VENT + 0.05, T1 = lift ? T_VENT - 0.1 : T_SHUT, period = lift ? 1.0 : 0.72;
            const turn = (t - T0) / period + (lift ? [0, 0.5, 0.25, 0.75][j] : (j - 4) / 3), u = turn % 1, born = t - u * period;     // this arrow's current run started at `born`
            const on = turn >= 0 && born >= T0 - 1e-6 && born + period <= T1 + 1e-6 ? K.spring(u * period, 5, 0.45) * (1 - K.seg(u, 0.76, 1, K.ease.in)) : 0;
            m.visible = on > 0.1; if (!m.visible) return;
            if (lift) {
              const [ax, ay] = LIFT[j], [x, y, a] = axisAt(ay + (u - 0.5) * 0.8);
              m.position.set(x + ax * Math.cos(a), y + ax * Math.sin(a), 0.25); m.rotation.set(0, 0, a); m.scale.setScalar(1.0 * on);
            } else {
              const fan = (j - 5) * 0.55, [x, y, a] = axisAt(pose.len - 0.25), d = 0.3 + 0.8 * u, dir = a + fan;
              m.position.set(x - d * Math.sin(dir), y + d * Math.cos(dir), 0.05 * (j - 5)); m.rotation.set(0, 0, dir); m.scale.setScalar(0.62 * on);
            }
          });

          // ---- clouds bob a little; the lights travel with the balloon
          clouds.forEach((c, n) => { c.position.y = CLOUDS[n][1] + 0.07 * Math.sin(t * 0.9 + n * 2.1); });
          focusAt.set(0, y0 + 2.3, 0);
          key.target.position.copy(focusAt); key.position.copy(focusAt).addScaledVector(KEY_FROM, 24); sky.target.position.copy(focusAt);

          // ---- camera
          const ax = cam.aimX(t), ay = alt(t - 0.1) + cam.aimY(t), d = cam.dist(t), high = cam.high(t), side = cam.side(t);
          K.look(camera, [ax + side, ay + high, Math.sqrt(d * d - high * high - side * side)], [ax, ay, 0]);
          K.focus(camera, [0, y0 + 2.3, 0.7], 0.012);

          // ---- captions float at a fixed place in the picture, a little in front of the balloon, facing the camera
          camera.updateMatrixWorld();
          vX.setFromMatrixColumn(camera.matrixWorld, 0); vY.setFromMatrixColumn(camera.matrixWorld, 1); vZ.setFromMatrixColumn(camera.matrixWorld, 2);
          const dc = CAP.near * d, frameH = 2 * Math.tan(camera.fov * Math.PI / 360) * dc, unit = CAP.size * frameH;
          captions.forEach((c) => {
            const out = K.seg(t, c.until, c.until + 0.22, K.ease.in);
            c.lines.forEach((m, i) => {
              const blown = c.at <= 0 ? 1 : K.spring(t - c.at - 0.09 * i, 3.4, 0.42), fat = (0.16 + 0.84 * blown) * (1 - 0.8 * out);     // thread -> full, with an overshoot
              m.visible = (c.at <= 0 || t >= c.at + 0.09 * i) && out < 1; if (!m.visible) return;
              const row = 0.05 * Math.sin(t * 1.3 + i * 1.9) - 0.5 * out;                 // a little bob; it drops as it deflates
              m.position.copy(camera.position).addScaledVector(vZ, -dc).addScaledVector(vX, CAP.x * frameH * 16 / 9 + 0.03 * unit * Math.sin(t * 1.1 + i)).addScaledVector(vY, CAP.y * frameH + row * unit);
              m.quaternion.copy(camera.quaternion); m.rotateY(-0.1); m.scale.setScalar(unit);
              m.userData.u.uPuff.value = LETTER * (fat - 1);
            });
          });
        },
      };
    },

    sound(k) {
      const D = 12, rnd = globalThis.K.rng(5);
      k.bed('room', 0, D, { gain: 0.7 });
      // the limp skin settles with a rustle and a small sigh
      k.play('paper', 0.3, { gain: 0.45, pan: -0.35 });
      k.tone(0.45, { f: [[0, 290], [0.5, 170]], dur: 0.6, gain: 0.07, a: 0.1, hold: 0.2, verb: 0.2, pan: -0.3 });
      // captions inflate with a small rubbery blip
      BEATS.forEach((b, i) => { if (b.at > 0) k.tone(b.at, { f: [[0, 520 + 60 * i], [0.09, 760 + 80 * i]], dur: 0.13, gain: 0.1, pan: 0.5, minor: true }); });
      // the burner: a roar of gas (low rumble plus hiss); the first three are pumps, and the skin answers with a
      // rubbery note that climbs as the envelope fills
      BURNS.forEach(([a, b], i) => {
        const dur = b - a;
        k.noise(a, { dur: dur + 0.08, color: 'brown', filter: 'lowpass', f: [[0, 260], [0.12, 620], [dur, 380]], q: 0.8, gain: 0.5, a: 0.08, hold: 0.55, pan: -0.1 });
        k.noise(a, { dur, color: 'pink', filter: 'bandpass', f: [[0, 900], [0.1, 2100], [dur, 1500]], q: 0.9, gain: 0.17, a: 0.06, hold: 0.55, pan: -0.1 });
        k.play('click', a - 0.02, { gain: 0.35 });
        if (i < 3) k.tone(a + 0.06, { f: [[0, 120 + 44 * i], [0.24, 190 + 70 * i]], dur: 0.36, gain: 0.28, verb: 0.1 });
      });
      k.play('pop', BURNS[2][0] + 0.2, { f: 460, gain: 0.8 });                                     // taut
      // standing up: the skin drags and creaks, then the basket slaps down flat and rocks
      k.play('swish', T_RISE + 0.25, { gain: 0.6, pan: -0.3 });
      for (let n = 0; n < 6; n++) { const t = T_RISE + 0.12 + n * 0.11 + rnd.range(0, 0.03); k.tone(t, { f: [[0, 190 + 22 * n], [0.06, 235 + 24 * n]], type: 'sawtooth', dur: 0.075, gain: 0.2, filter: 'bandpass', f2: 850 + 50 * n, q: 5, pan: rnd.range(-0.5, 0.1), minor: true }); }
      k.play('thud', T_THUMP, { gain: 0.95, f: 95 });
      k.play('tock', T_THUMP + 0.42, { gain: 0.3 });
      // lift-off and the climb: a soft whoosh and a far slide whistle going up; little pops as the arrows inflate
      k.play('whoosh', T_LIFT - 0.05, { gain: 0.5 });
      k.tone(T_LIFT + 0.1, { f: [[0, 250], [T_TOP - T_LIFT - 0.3, 560]], dur: T_TOP - T_LIFT - 0.2, gain: 0.05, a: 0.4, hold: 0.5, verb: 0.3 });
      k.withMinor(() => { for (let n = 0; n < 5; n++) k.play('pop', T_LIFT + 0.25 + n * 0.5, { f: 620 + 70 * (n % 3), gain: 0.22, pan: n % 2 ? 0.35 : -0.35 }); });
      // the vent: a pop, a long hiss of escaping air, and the whistle sliding back down with the balloon
      k.play('pop', T_VENT, { f: 900, gain: 1.0 });
      k.noise(T_VENT + 0.02, { dur: T_SHUT - T_VENT, filter: 'highpass', f: [[0, 3000], [T_SHUT - T_VENT, 1500]], gain: 0.17, a: 0.05, hold: 0.6 });
      k.tone(T_SINK, { f: [[0, 540], [T_LAND - T_SINK - 0.1, 210]], dur: T_LAND - T_SINK, gain: 0.05, a: 0.3, hold: 0.6, verb: 0.3 });
      k.play('tick', T_SHUT + 0.1, { gain: 0.5 });
      // landing: a soft bump, a squeak of vinyl on the floor, and a small "there" to close
      k.play('thud', T_LAND, { gain: 0.7, f: 80 });
      k.tone(T_LAND + 0.05, { f: [[0, 560], [0.12, 880]], type: 'triangle', dur: 0.16, gain: 0.16, filter: 'bandpass', f2: 1400, q: 4 });
      k.play('ding', T_LAND + 0.55, { gain: 0.3 });
    },
  });
}
```
