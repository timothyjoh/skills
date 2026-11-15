# Glass and Light (#15)

- **id:** `glass-light`
- **Category:** Material worlds
- **Use:** explainer
- **Reference duration:** 12 s
- **Google Fonts:** Inter
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`

## Style card

- **Look:** Real glassware on a dark stone table in front of a glowing backdrop: thin clear jars and bottles turned on a lathe, holding coloured liquids with a visible surface, a meniscus and sharp boundaries between layers. Every liquid throws a pool of its own coloured light, with bright caustic lines, on the table in front of it. Small white measure marks are printed on the glass.
- **Motion:** Calm, with weight. Bottles lift, lean and pour a thin falling stream; levels rise against the marks while the bottle empties; rings spread where the stream lands; layers settle; a jar is shaken hard and set down. The lamp swings slowly behind the glass so the pools of light sweep across the table.
- **Light:** Back-lit like glass photography: a bright horizon behind, darkness above, and a lamp behind and above the glass, so light comes through the liquids towards the camera. Softboxes give every rounded edge a white rim; the backdrop gives the glass dark and bright lines to bend.
- **Materials:** Thin clear glass with real refraction and a thick foot; liquids that let the backdrop through, pale where they are thin and deep where they are thick, and turn milky when mixed; brushed steel for lids and spoons; dark matte stone with a faint sheen.
- **Camera:** One slow continuous dolly: it starts wide enough for the bottles to lift and pour, then moves in on the jar as the layers form and ends close on the finished mixture, still drifting.
- **Finish:** True colours (neutral tone curve), bloom on the light pools and rims, a soft vignette, fine grain. Captions are a crisp 2D overlay.
- **Good for:** Recipes, mixtures, ratios, amounts, chemistry: anything that fills, pours, layers or changes colour, told with real glassware. A beat is one action on the vessel (a pour, an addition, a shake, a wait). Amounts are levels against the marks on the glass, ingredients are colours, and a change of state is a change in the liquid (layers, cloudiness, colour). Labels are the measure marks plus one short caption line per beat.

## Reference

- **Sample topic:** How a vinaigrette comes together: 3 parts oil, 1 part vinegar
- **Gallery description:** Real glassware on a dark stone table in front of a glowing backdrop: thin clear jars and bottles turned on a lathe, holding coloured liquids with a visible surface, a meniscus and sharp boundaries between layers. Every liquid throws a pool of its own coloured light, with bright caustic lines, on the table in front of it. Small white measure marks are printed on the glass.
- **Shown in the sample clip:** How a vinaigrette comes together: 3 parts oil, 1 part vinegar

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/glass-light.js`)

```js
{
  // ---------------------------------------------------------------- content (change this for a new topic)
  // A demonstration in glassware. Liquids are poured from their bottles into one jar with measure marks; then
  // something is added, the lid goes on and the jar is shaken. The liquids do the explaining; captions only name it.
  const PART = 0.55;                 // height of one part in the jar (the marks on the glass count parts)
  const MARKS = 4;
  // one entry per liquid, lowest (densest) layer first. tint = white light after one unit of this liquid (keep it
  // light: a jar is more than two units deep, and the colour deepens with every unit);
  // parts = how much goes in; pour = when it leaves its bottle; at = where the bottle stands [x, z]
  const POURS = [
    { name: 'vinegar', tint: '#b8242f', parts: 1, pour: [1.5, 2.7], bottle: 'cruet', at: [-3.0, 0.45], stream: 0.055 },
    { name: 'oil', tint: '#dcc82e', parts: 3, pour: [3.9, 6.0], bottle: 'tall', at: [3.3, -0.35], stream: 0.08 },
  ];
  // what happens after the pours: a spoonful goes in, the lid lands, the jar is shaken and the layers become one
  const MIX = { tint: '#f2cb66', spoonful: '#e2b32c', spoon: 6.6, drop: 7.6, lid: 8.75, shake: [9.25, 10.25] };
  const CAPTIONS = [                 // [from, to, text, colour of the dot in front]
    [0.15, 1.5, 'A vinaigrette is a ratio'],
    [1.6, 3.55, '1 part vinegar', POURS[0].tint],
    [3.8, 6.8, '3 parts oil. Lighter, so it floats', POURS[1].tint],
    [6.95, 8.6, 'Mustard binds the two', MIX.spoonful],
    [9.3, 99, 'Shake: one dressing, 3 to 1', MIX.tint],   // the last one stays for the hold
  ];
  const DURATION = 12;

  // ---------------------------------------------------------------- the glassware
  // Everything is turned on a lathe. A shape is a list of corner points [radius, height, corner rounding]:
  // `glass` runs from the middle of the foot up the outside, over the lip and down the inside to the middle of the
  // floor; `liquid` is the body that fits inside (floor, wall, shoulder, neck). radius = of that body's wall,
  // lip = [radius, height] of the edge a pour leaves from, fill = how high the liquid stands at the start.
  const SHAPES = {
    jar: {
      glass: [[0, 0], [1.3, 0, 0.24], [1.3, 2.9, 0.3], [1.08, 3.26, 0.1], [1.08, 3.36], [1.14, 3.4, 0.02], [1.14, 3.47, 0.02], [1.08, 3.51], [1.08, 3.7, 0.05], [0.97, 3.7, 0.05], [0.97, 3.26, 0.1], [1.19, 2.9, 0.26], [1.19, 0.2, 0.2], [0, 0.2]],
      liquid: [[0, 0.21], [1.17, 0.21, 0.18], [1.17, 2.9, 0.26], [0.95, 3.26, 0.1], [0.95, 3.68], [0, 3.68]],
      radius: 1.17, top: 3.7,
    },
    cruet: {
      glass: [[0, 0], [0.95, 0, 0.26], [0.95, 1.9, 0.5], [0.3, 2.7, 0.25], [0.3, 3.24, 0.03], [0.4, 3.31, 0.03], [0.4, 3.4, 0.04], [0.21, 3.4, 0.03], [0.21, 2.7, 0.2], [0.86, 1.9, 0.45], [0.86, 0.16, 0.2], [0, 0.16]],
      liquid: [[0, 0.17], [0.84, 0.17, 0.18], [0.84, 1.9, 0.45], [0.19, 2.7, 0.2], [0.19, 3.38], [0, 3.38]],
      radius: 0.84, lip: [0.3, 3.4], fill: 1.85,
    },
    tall: {
      glass: [[0, 0], [1.15, 0, 0.28], [1.15, 3.5, 0.6], [0.3, 4.4, 0.3], [0.3, 5.28, 0.03], [0.41, 5.35, 0.03], [0.41, 5.45, 0.04], [0.21, 5.45, 0.03], [0.21, 4.4, 0.25], [1.06, 3.5, 0.55], [1.06, 0.18, 0.22], [0, 0.18]],
      liquid: [[0, 0.19], [1.04, 0.19, 0.2], [1.04, 3.5, 0.55], [0.19, 4.4, 0.25], [0.19, 5.43], [0, 5.43]],
      radius: 1.04, lip: [0.3, 5.45], fill: 3.5,
    },
  };
  const POUR_AT = [0.72, 4.3];       // where a bottle's lip is held while it pours: beside the jar's axis, above its rim
  const LIFT = 0.8;                  // seconds a bottle takes from the table to the jar, and back
  const GRAVITY = 36, SPOUT = 1.3;   // how fast a stream falls, and how fast it leaves the bottle
  const WALL_Z = -14, TABLE_BACK = -3.5;                  // the backdrop stands far behind the table's back edge
  // timing that picture and sound share
  const fall = (h, vy = 0) => (vy + Math.sqrt(vy * vy + 2 * GRAVITY * Math.max(h, 0))) / GRAVITY;   // seconds to fall h
  const FLOOR = SHAPES.jar.liquid[0][1], TOTAL = POURS.reduce((n, p) => n + p.parts, 0);
  const DELAY = POURS.map((p, i) => fall(POUR_AT[1] - FLOOR - POURS.slice(0, i).reduce((n, q) => n + q.parts, 0) * PART));   // a stream needs a moment to reach the jar: the level rises that much later
  const DROP_FROM = SHAPES.jar.top + 0.65, PLOP = MIX.drop + fall(DROP_FROM - FLOOR - TOTAL * PART);   // the spoonful falls from here and lands then
  const LANDED = MIX.shake[1] + 0.22;                    // the shaken jar is back on the table

  // ---------------------------------------------------------------- GLSL shared by several shaders
  const CAUSTIC = `                                       // a cheap pattern of thin bright lines, like light through water
    float caustic(vec2 uv, float t) {
      vec2 p = mod(uv * 6.2831853, 6.2831853) - 250.0, i = p; float c = 1.0;
      for (int n = 0; n < 4; n++) { float tt = t * (1.0 - 3.5 / float(n + 1));
        i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
        c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / 0.005), p.y / (cos(i.y + tt) / 0.005))); }
      return pow(abs(1.17 - pow(c / 4.0, 1.4)), 8.0);
    }`;
  // The studio as a formula, so that the backdrop, the table's sheen and the liquids (which show the room through
  // themselves) all see the same thing: a glow along the horizon that falls to dark slate, crossed by soft upright
  // strips of light. Glass needs this: tone to stand out from and lines to bend.
  const STUDIO = `
    vec3 backdrop(vec3 P) {
      float h = smoothstep(-3.6, 4.2, P.y);
      vec3 c = mix(vec3(1.3, 1.2, 1.06), vec3(0.05, 0.062, 0.08), pow(h, 0.62));
      float strip = smoothstep(0.1, 0.9, 0.5 + 0.5 * sin(P.x * 1.25 + 0.9 * sin(P.x * 0.41 + 1.3)));
      return c * mix(1.0, 0.62 + 0.7 * strip, smoothstep(-3.4, -1.0, P.y) * (1.0 - 0.6 * smoothstep(2.5, 6.0, P.y)));
    }
    vec3 seen(vec3 P, vec3 d) {                           // what a ray from P ends on: the table, the backdrop or the dark room
      vec3 far = d.z > -0.05 ? vec3(0.04, 0.045, 0.055) : backdrop(P + d * ((${WALL_Z.toFixed(1)} - P.z) / d.z));
      if (d.y > -0.01) return far;
      vec3 Q = P - d * (P.y / d.y), stone = vec3(0.13, 0.125, 0.12) + 0.22 * pow(1.0 + d.y, 4.0) * vec3(1.0, 0.94, 0.85);   // the table, with its sheen
      return mix(far, stone, smoothstep(${(TABLE_BACK - 1.5).toFixed(1)}, ${(TABLE_BACK + 3).toFixed(1)}, Q.z) * step(Q.z, 30.0));   // (its far edge is seen softly)
    }
    vec3 mirrored(vec3 P, vec3 d) {                       // the same for a reflection: it can also catch the long softbox overhead
      return seen(P, d) + vec3(7.0) * smoothstep(0.66, 0.74, d.y) * (1.0 - smoothstep(0.88, 0.95, d.y)) * step(d.z, 0.0);
    }`;
  // A liquid's shape inside its vessel. The vessel is treated as a tube (foot centre uBase, axis uAxis, radius uRad).
  // The surface is a height above each point of the table: level, plus rings round the place a stream lands, plus
  // big waves while the vessel is shaken, plus a meniscus that climbs the wall. A second liquid may lie under it:
  // everything below splitY is liquid A, everything above is liquid B.
  const LIQUID = `
    uniform vec3 uBase, uAxis; uniform float uRad, uLevel, uSplit, uMen, uChurn, uTime; uniform vec4 uRing;   // uRing = x, z of the landing place, ring height on the surface, wave height on the boundary
    float fromAxis(vec3 P) { vec3 q = P - uBase; return length(q - dot(q, uAxis) * uAxis); }
    float surfaceY(vec3 P) {
      vec3 q = P - uBase; float r = length(P.xz - uRing.xy);
      float y = uLevel + uRing.z * sin(r * 12.0 - uTime * 17.0) / (1.0 + r * 3.0);
      y += uChurn * (0.75 * sin(q.x * 2.3 + uTime * 28.3) + 0.3 * sin(q.z * 3.1 - uTime * 23.0 + q.x * 1.7));
      return y + uMen * exp(min(fromAxis(P) - uRad, 0.0) / 0.075);
    }
    float splitY(vec3 P) {
      vec3 q = P - uBase;
      return uSplit + uRing.w * (sin(q.x * 4.0 + uTime * 6.0) + 0.7 * sin(q.z * 5.0 - uTime * 8.0)) + uChurn * 1.5 * sin(q.x * 3.1 - uTime * 21.0 + q.y * 2.6);
    }`;
  const WORLD_VS = 'varying vec3 vW, vN; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }';
  const BLOBS = 6;                   // small round things that can float inside the jar's liquid (drops of oil, the spoonful)

  registerStyle({
    id: 'glass-light',
    name: 'Glass and Light',
    family: 'Material worlds',
    look: 'Real glassware on a dark stone table in front of a glowing backdrop: thin clear jars and bottles turned on a lathe, holding coloured liquids with a visible surface, a meniscus and sharp boundaries between layers. Every liquid throws a pool of its own coloured light, with bright caustic lines, on the table in front of it. Small white measure marks are printed on the glass.',
    motion: 'Calm, with weight. Bottles lift, lean and pour a thin falling stream; levels rise against the marks while the bottle empties; rings spread where the stream lands; layers settle; a jar is shaken hard and set down. The lamp swings slowly behind the glass so the pools of light sweep across the table.',
    light: 'Back-lit like glass photography: a bright horizon behind, darkness above, and a lamp behind and above the glass, so light comes through the liquids towards the camera. Softboxes give every rounded edge a white rim; the backdrop gives the glass dark and bright lines to bend.',
    materials: 'Thin clear glass with real refraction and a thick foot; liquids that let the backdrop through, pale where they are thin and deep where they are thick, and turn milky when mixed; brushed steel for lids and spoons; dark matte stone with a faint sheen.',
    camera: 'One slow continuous dolly: it starts wide enough for the bottles to lift and pour, then moves in on the jar as the layers form and ends close on the finished mixture, still drifting.',
    post: 'True colours (neutral tone curve), bloom on the light pools and rims, a soft vignette, fine grain. Captions are a crisp 2D overlay.',
    explains: 'Recipes, mixtures, ratios, amounts, chemistry: anything that fills, pours, layers or changes colour, told with real glassware. A beat is one action on the vessel (a pour, an addition, a shake, a wait). Amounts are levels against the marks on the glass, ingredients are colours, and a change of state is a change in the liquid (layers, cloudiness, colour). Labels are the measure marks plus one short caption line per beat.',
    topic: 'How a vinaigrette comes together: 3 parts oil, 1 part vinegar',
    duration: DURATION,
    fonts: ['600 62px "Inter"', '700 190px "Inter"'],
    render: { samples: 64, shutter: 0.5, tone: 'neutral', exposure: 1.0, bloom: 0.55, bloomThreshold: 1.0, vignette: 0.3, grain: 0.012, fov: 30, background: '#0a0b0d' },

    build(S) {
      const { THREE, K, scene, camera, renderer } = S;

      // ---------------------------------------------------------------- 1. what the glass reflects
      // Reflections come from this environment: a dim room with a few very bright softboxes. On every rounded edge
      // they become the white rims and streaks that say "glass". (What the glass refracts is the real scene behind it.)
      K.env(S, { top: '#1b1f25', horizon: '#3d4249', bottom: '#101114', intensity: 1, panels: [
        { pos: [0, 14, -9], size: [34, 6], color: '#ffffff', power: 22 },          // behind and above: rims along the tops
        { pos: [0, 12, 14], size: [18, 4], color: '#ffffff', power: 12 },          // above the camera: a streak on every upper shoulder
        { pos: [-15, 5, 7], size: [1.8, 14], color: '#ffffff', power: 22 },        // two upright strips: streaks down the sides
        { pos: [15, 6, 8], size: [1.8, 14], color: '#fff1dc', power: 15 },
      ] });

      // ---------------------------------------------------------------- 2. coloured light on the table
      // three.js glass casts no coloured shadows, so the light is drawn separately: a camera sits where the lamp is
      // and renders every caster as "the light that comes through it" (1 = all of it, a tint = coloured liquid, more
      // than 1 = light gathered by the glass or given off by the liquid, dark at the rims where it is bent away).
      // Layers multiply. The table then looks its own points up in that picture. Alpha carries 1 + the caster's
      // height, so the light can blur more the further it has travelled.
      const LIGHT = { size: [24, 14], res: [2048, 1216], far: 60, centre: new THREE.Vector3(0.5, 2, 2) };
      const lightRT = new THREE.WebGLRenderTarget(LIGHT.res[0], LIGHT.res[1], { type: THREE.HalfFloatType, depthBuffer: false, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
      const lightScene = new THREE.Scene(), lightCam = new THREE.OrthographicCamera(-LIGHT.size[0] / 2, LIGHT.size[0] / 2, LIGHT.size[1] / 2, -LIGHT.size[1] / 2, 1, LIGHT.far);
      const uLight = { tLight: { value: lightRT.texture }, uLightVP: { value: new THREE.Matrix4() }, uLightDir: { value: new THREE.Vector3() }, uLightSize: { value: new THREE.Vector2(...LIGHT.size) }, uTime: { value: 0 } };
      const casters = [];
      const castColour = (tint, gain, deep = 1.6) => { const c = new THREE.Color(tint); return c.setRGB(c.r ** deep, c.g ** deep, c.b ** deep).multiplyScalar(gain); };   // light thrown on the table has been through about this much liquid
      // castLight(mesh, { tint, gain, rim, focus, liquid }): make `mesh` throw light on the table.
      //   tint = colour of the light that passes; gain = its strength (1 = plain glass, 9 = liquid that shines, 0 = solid);
      //   rim = how dark the outline is (0 = black); focus = how much brighter the middle gets;
      //   liquid = the uniforms of a liquid body: only the part under its surface casts, each layer in its own colour.
      function castLight(mesh, o = {}) {
        const mat = new THREE.ShaderMaterial({
          uniforms: Object.assign({ uTint: { value: new THREE.Color(o.tint || '#ffffff').multiplyScalar(o.gain == null ? 1 : o.gain) }, uRim: { value: o.rim == null ? 0.4 : o.rim }, uFocus: { value: o.focus || 0 }, uDir: uLight.uLightDir }, o.liquid || {}),
          vertexShader: WORLD_VS,
          fragmentShader: `varying vec3 vW, vN; uniform vec3 uTint, uDir; uniform float uRim, uFocus; ${o.liquid ? LIQUID + 'uniform vec3 uCastA, uCastB, uCastMix; uniform float uCloud;' : ''}
            void main(){
              float k = dot(normalize(vN), uDir) * ${o.liquid ? '-1.0' : '1.0'}; vec3 tint = uTint;   // glass: the faces turned to the lamp. Liquid: the faces the light leaves by (every ray through the body leaves once)
              if (k <= 0.0 || vW.y < 0.0) discard;
              ${o.liquid ? 'if (vW.y > surfaceY(vW)) discard; tint = mix(vW.y < splitY(vW) ? uCastA : uCastB, uCastMix, uCloud);' : ''}
              gl_FragColor = vec4(tint * mix(uRim, 1.0 + uFocus * pow(k, 3.0), smoothstep(0.08, 0.6, k)), 1.0 + vW.y);
            }`,
          side: THREE.DoubleSide, depthTest: false, depthWrite: false, transparent: true, blending: THREE.CustomBlending,
          blendEquation: THREE.AddEquation, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor,          // colour: multiply
          blendEquationAlpha: THREE.MaxEquation, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor, // alpha: highest caster
        });
        const proxy = new THREE.Mesh(mesh.geometry, mat); proxy.matrixAutoUpdate = false; proxy.frustumCulled = false;
        lightScene.add(proxy); casters.push([mesh, proxy]);
        return mat;
      }
      const _c = new THREE.Color(), _m = new THREE.Matrix4();
      const shown = (o) => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
      function renderLight(dir, t) {
        uLight.uLightDir.value.set(dir[0], dir[1], dir[2]).normalize(); uLight.uTime.value = t;
        lightCam.position.copy(uLight.uLightDir.value).multiplyScalar(LIGHT.far / 2).add(LIGHT.centre); lightCam.lookAt(LIGHT.centre); lightCam.updateMatrixWorld();
        uLight.uLightVP.value.multiplyMatrices(lightCam.projectionMatrix, _m.copy(lightCam.matrixWorld).invert());
        scene.updateMatrixWorld();
        for (const [mesh, proxy] of casters) { proxy.matrix.copy(mesh.matrixWorld); proxy.visible = shown(mesh); }
        renderer.getClearColor(_c); const a = renderer.getClearAlpha();
        renderer.setRenderTarget(lightRT); renderer.setClearColor(0xffffff, 1); renderer.clear(); renderer.render(lightScene, lightCam);
        renderer.setClearColor(_c, a); renderer.setRenderTarget(null);
      }
      // the lookup, for any material that should receive the light (here: the table)
      const RECEIVE = `
        uniform sampler2D tLight; uniform mat4 uLightVP; uniform vec3 uLightDir; uniform vec2 uLightSize; uniform float uTime; ${CAUSTIC}
        float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
        vec3 lightThrough(vec3 P, float softness) {
          vec2 uv = (uLightVP * vec4(P, 1.0)).xy * 0.5 + 0.5;
          float h = max(textureLod(tLight, uv, 4.0).a, 1.0 + (textureLod(tLight, uv, 6.0).a - 1.0) * 1.6) - 1.0;   // roughly how high the caster is here
          float r = softness * (0.1 + h);                                                            // blur radius in world units
          float lod = log2(max(1.0, r / uLightSize.x * float(textureSize(tLight, 0).x) * 0.7));
          float a0 = 6.2831853 * ign(gl_FragCoord.xy + fract(uTime * 7.31) * 97.0); vec3 s = vec3(0.0);
          for (int i = 0; i < 12; i++) { float fi = float(i) + 0.5, rr = sqrt(fi / 12.0), a = a0 + fi * 2.3999632;
            s += textureLod(tLight, uv + rr * r * vec2(cos(a), sin(a)) / uLightSize, lod).rgb; }
          s /= 12.0;
          // light that has been through glass is never even: it gathers into bright moving lines with darker gaps
          vec3 dv = abs(s - 1.0); float changed = clamp(max(dv.r, max(dv.g, dv.b)) * 1.6, 0.0, 1.0);
          s *= 1.0 + changed * (2.6 * min(caustic(P.xz * 0.42, uTime * 0.6), 2.5) - 0.6);
          // and some of it scatters: a wide faint glow of the same colour around the pool
          vec3 wide = textureLod(tLight, uv + (vec2(ign(gl_FragCoord.yx + 3.0), ign(gl_FragCoord.xy + 11.0)) - 0.5) * 0.02, 6.0).rgb;
          return s + max(wide - 1.0, 0.0) * 0.22;
        }`;

      // ---------------------------------------------------------------- 3. the set: a dark stone table and a far, glowing backdrop
      const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(140, 60), new THREE.ShaderMaterial({ vertexShader: WORLD_VS, fragmentShader: `varying vec3 vW, vN; ${STUDIO} void main(){ gl_FragColor = vec4(backdrop(vW), 1.0); }` }));
      backdrop.position.set(0, 10, WALL_Z); scene.add(backdrop);
      const table = new THREE.Mesh(new THREE.PlaneGeometry(120, 30 - TABLE_BACK), new THREE.ShaderMaterial({
        uniforms: Object.assign({ uStone: { value: new THREE.Color('#5d5b58') }, uKey: { value: new THREE.Color('#fff3df').multiplyScalar(1.3) }, uFill: { value: new THREE.Color('#c9d6e8').multiplyScalar(0.42) } }, uLight),
        vertexShader: WORLD_VS,
        fragmentShader: `varying vec3 vW, vN; uniform vec3 uStone, uKey, uFill; ${STUDIO} ${RECEIVE}
          float speck(vec2 p) { return fract(sin(dot(floor(p), vec2(127.1, 311.7))) * 43758.5453); }
          void main(){
            vec3 V = normalize(cameraPosition - vW);
            vec3 stone = uStone * (0.9 + 0.2 * speck(vW.xz * 90.0) * speck(vW.xz * 37.0 + 5.0));       // fine mineral speckle
            // soft fill from the room, plus the lamp coloured by whatever glass and liquid it came through
            vec3 c = stone * (uFill + uKey * uLightDir.y * lightThrough(vW, 0.085));
            // a faint sheen: at a low angle the stone mirrors the glowing backdrop a little
            c += backdrop(vW + reflect(-V, vec3(0.0, 1.0, 0.0)) * ((vW.z - (${WALL_Z.toFixed(1)})) / max(V.z, 0.05))) * (0.012 + 0.22 * pow(1.0 - V.y, 4.0));
            gl_FragColor = vec4(c * (1.0 - 0.35 * smoothstep(6.0, 18.0, length(vW.xz - vec2(0.0, 2.0)))), 1.0);
          }`,
      }));
      table.rotation.x = -Math.PI / 2; table.position.set(0, 0, (30 + TABLE_BACK) / 2); scene.add(table);

      // ---------------------------------------------------------------- 4. the materials
      // Clear glass. three.js refraction only sees opaque things, so everything coloured in this style (the liquids,
      // the set) is opaque and the clear glass goes over it and bends it. Keep it single-sided: double-sided
      // transmission draws the back faces into its own background picture and can blow out on thin rims.
      const glass = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.03, metalness: 0, transmission: 1, thickness: 0.35, ior: 1.5, dispersion: 1.0, attenuationColor: new THREE.Color('#9fe3cd'), attenuationDistance: 7, envMapIntensity: 1 });
      // Real glass shows a dark line along its outline, where light from behind is bent away from the eye. Here the
      // light coming through is simply dimmed towards the rim.
      glass.onBeforeCompile = (sh) => {
        sh.fragmentShader = sh.fragmentShader.replace('#include <transmission_fragment>', `#include <transmission_fragment>
          totalDiffuse *= mix(vec3(1.0), vec3(0.05, 0.12, 0.12), pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), 2.6));`);
      };
      const steel = new THREE.MeshStandardMaterial({ color: '#aab0b8', metalness: 1, roughness: 0.34 }), brass = new THREE.MeshStandardMaterial({ color: '#c79a4b', metalness: 1, roughness: 0.36 });

      // Liquid: an opaque body that is painted by following the view ray THROUGH it. The ray is bent at the
      // surface it enters, then walked to where it leaves the vessel; on the way each liquid takes its share of the
      // light (a little where the path is short, a lot where it is long) and adds some of its own colour; at the
      // end the ray sees the studio. So a round jar shows the backdrop squeezed and flipped, edges are pale, the
      // middle is deep, and looking down through the top layer you see the layer below.
      // The body is the whole inside of the vessel; nothing is drawn above the surface. Where the cut shows the
      // inside of the body, that pixel IS the surface: the view ray is walked down onto the height field, so rings,
      // waves and the meniscus are real shapes with their own reflections and depth.
      function liquid(geometry, shape, a, b) {
        const u = {
          uBase: { value: new THREE.Vector3() }, uAxis: { value: new THREE.Vector3(0, 1, 0) }, uRad: { value: shape.radius }, uLevel: { value: 0 }, uSplit: { value: -1e3 },
          uMen: { value: 0.05 }, uChurn: { value: 0 }, uRing: { value: new THREE.Vector4() }, uTime: uLight.uTime, uLightDir: uLight.uLightDir,
          uTintA: { value: new THREE.Color(a) }, uTintB: { value: new THREE.Color(b) }, uCloud: { value: 0 }, uCloudCol: { value: new THREE.Color(MIX.tint) }, uGlow: { value: 0.2 },
          uBlobs: { value: Array.from({ length: BLOBS }, () => new THREE.Vector4()) }, uBlobCol: { value: Array.from({ length: BLOBS }, () => new THREE.Vector4()) },
          uCastA: { value: castColour(a, 9) }, uCastB: { value: castColour(b, 9) }, uCastMix: { value: castColour(MIX.tint, 3.4, 0.7) },
        };
        const mesh = new THREE.Mesh(geometry, new THREE.ShaderMaterial({
          uniforms: u, vertexShader: WORLD_VS, side: THREE.DoubleSide,
          fragmentShader: `varying vec3 vW, vN; uniform mat4 projectionMatrix; uniform vec3 uTintA, uTintB, uCloudCol, uLightDir; uniform float uCloud, uGlow; uniform vec4 uBlobs[${BLOBS}], uBlobCol[${BLOBS}];
            ${LIQUID} ${STUDIO}
            // the light that arrives along a ray that starts at P, just inside the liquid, and travels along d
            vec3 through(vec3 P, vec3 d, out float len) {
              vec3 T = vec3(1.0), own = vec3(0.0); len = 0.0;
              for (int i = 0; i < 4; i++) {
                float sp = splitY(P); bool low = P.y < sp;
                vec3 q = P - uBase; float qa = dot(q, uAxis), da = dot(d, uAxis); vec3 qp = q - qa * uAxis, dp = d - da * uAxis;
                float aa = max(dot(dp, dp), 1e-5), bb = dot(qp, dp), t = (-bb + sqrt(max(bb * bb - aa * (dot(qp, qp) - uRad * uRad), 0.0))) / aa;   // to the wall
                if (da < 0.0) t = min(t, -qa / da);                                                 // to the floor
                int hit = 0, blob = -1;                                                             // 0 = it leaves the vessel
                if (d.y > 0.0) { float tt = ((low ? sp : surfaceY(P)) - P.y) / d.y; if (tt < t) { t = tt; hit = low ? 1 : 2; } }   // 1 = it crosses the boundary, 2 = it meets the surface from below
                else if (!low) { float tt = (sp - P.y) / d.y; if (tt < t) { t = tt; hit = 1; } }
                t = max(t, 0.0);
                for (int k = 0; k < ${BLOBS}; k++) { vec4 s = uBlobs[k]; vec3 oc = P - s.xyz; float ob = dot(oc, d), h = ob * ob - dot(oc, oc) + s.w * s.w;
                  if (s.w > 0.0 && h > 0.0 && -ob - sqrt(h) > 0.0 && -ob - sqrt(h) < t) { t = -ob - sqrt(h); blob = k; } }
                vec3 tint = low ? uTintA : uTintB, pass = pow(tint, vec3(t));
                own += T * (1.0 - exp(-1.4 * t)) * tint * tint * uGlow;          // a little light is scattered inside: the longer the path, the more of the liquid's own colour
                T *= pass; len += t; P += d * t;
                if (blob >= 0) {                                                 // something floats in the way: a drop of the other liquid (bright, like a lens) or a solid lump
                  vec3 n = normalize(P - uBlobs[blob].xyz); vec4 bc = uBlobCol[blob]; float lit = 0.5 + 0.5 * dot(n, uLightDir), edge = 1.0 - max(dot(n, -d), 0.0);
                  return own + T * bc.rgb * mix(0.75 + 1.3 * edge * edge + 0.5 * lit, 0.7 + 1.1 * lit, bc.a);
                }
                if (hit == 0) {                                                  // it leaves: through the floor onto the table, which the liquid's own light colours, or through the far wall
                  if (da < 0.0 && t >= -qa / da - 1e-4) return own + T * (seen(P, d) * 1.1 + tint * 0.55 * smoothstep(0.9, 1.0, uAxis.y));
                  vec3 q2 = P - uBase, n = normalize(q2 - dot(q2, uAxis) * uAxis); float square = abs(dot(d, n));
                  float streak = smoothstep(0.045, 0.0, abs(abs(n.x) - 0.62)) * step(n.z, 0.0);   // the softboxes on the far wall, seen through the liquid
                  return own + T * (seen(P, d) * 1.25 * (0.5 + 0.5 * square) + 0.5 * streak);
                }
                if (hit == 2) d.y = -d.y; else P.y += sign(d.y) * 4e-3;          // the surface seen from below is a mirror
              }
              return own + T * seen(P, d);
            }
            void main(){
              if (vW.y > surfaceY(vW)) discard;
              vec3 eye = cameraPosition, rd = normalize(vW - eye), P = vW, N = normalize(vN); float len;
              bool top = !gl_FrontFacing; gl_FragDepth = gl_FragCoord.z;
              if (top) {
                float reach = 0.9 + 6.0 * uChurn, t = (uLevel + 0.1 + 1.2 * uChurn - eye.y) / rd.y;       // start above the highest wave and step down safely
                for (int i = 0; i < 20; i++) { vec3 Q = eye + rd * t; t += (Q.y - surfaceY(Q)) / (reach * length(rd.xz) - rd.y); }
                P = eye + rd * t; vec2 e = vec2(0.012, 0.0);
                if (fromAxis(P) > uRad * 1.01) discard;                          // the ray meets the surface outside the vessel: this is not the surface, the wall in front covers it
                N = normalize(vec3(surfaceY(P - e.xyy) - surfaceY(P + e.xyy), 2.0 * e.x, surfaceY(P - e.yyx) - surfaceY(P + e.yyx)));
                vec4 clip = projectionMatrix * viewMatrix * vec4(P, 1.0); gl_FragDepth = clip.z / clip.w * 0.5 + 0.5;
              }
              float nv = max(dot(N, -rd), 0.0);
              vec3 c = through(P - N * 3e-3, refract(rd, N, 0.75), len);
              // mixed liquid is cloudy: light is scattered before it gets far, so it looks milky and softly lit from behind
              float under = top ? 0.0 : surfaceY(vW) - vW.y;
              vec3 milk = uCloudCol * (0.6 + 0.3 * (0.5 + 0.5 * dot(N, uLightDir)) + 0.4 * pow(1.0 - nv, 2.0) + 0.14 * smoothstep(0.0, 2.6, P.y - uBase.y));
              milk += vec3(0.2, 0.19, 0.16) * smoothstep(0.2, 0.03, under);                          // a line of fine froth at the top
              c = mix(c, milk, (1.0 - exp(-10.0 * len)) * uCloud);
              if (top) c = mix(c, mirrored(P, reflect(rd, N)), 0.02 + 0.98 * pow(1.0 - nv, 5.0));     // the surface also mirrors the room
              else {
                float at = abs(vW.y - splitY(vW));
                c *= (0.62 + 0.5 * pow(nv, 1.5)) * (1.08 - 0.22 * smoothstep(0.0, 2.2, under));        // a round body of liquid is brightest down its middle, and deeper lower down
                c *= 1.0 - 0.45 * smoothstep(0.035, 0.0, at) * (1.0 - uCloud) * step(-900.0, uSplit); // the boundary between two liquids: a thin dark line
                c = mix(c * (1.0 - 0.25 * smoothstep(0.09, 0.03, under)), vec3(1.2), 0.75 * smoothstep(0.028, 0.008, under));   // the meniscus: a dark edge under a bright line
              }
              gl_FragColor = vec4(c, 1.0);
            }`,
        }));
        castLight(mesh, { liquid: u, rim: 0.5, focus: 0.6 });
        mesh.userData.u = u;
        return mesh;
      }
      // A falling stream: a thin tapered tube laid along the path of a drop. Simple see-through shading.
      const streamMat = (tint) => new THREE.ShaderMaterial({
        uniforms: { uTint: { value: new THREE.Color(tint) } }, vertexShader: WORLD_VS, side: THREE.DoubleSide,
        fragmentShader: `varying vec3 vW, vN; uniform vec3 uTint; ${STUDIO}
          void main(){
            vec3 V = normalize(cameraPosition - vW), N = normalize(vN); if (dot(N, V) < 0.0) N = -N; float nv = dot(N, V);
            vec3 pass = pow(uTint, vec3(mix(0.3, 1.5, nv)));
            vec3 c = pass * (0.15 + 1.1 * seen(vW, refract(-V, N, 0.75))) + uTint * uTint * 0.3 * nv;
            gl_FragColor = vec4(c + 0.25 * mirrored(vW, reflect(-V, N)) * pow(1.0 - nv, 2.0), 1.0);
          }`,
      });

      // ---------------------------------------------------------------- 5. turning the glassware
      // corner points [radius, height, rounding] -> a smooth outline (every rounded corner becomes a small curve)
      function outline(pts, n = 7) {
        const out = [], V = (p) => new THREE.Vector2(p[0], p[1]);
        pts.forEach((p, i) => {
          if (!p[2] || i === 0 || i === pts.length - 1) { out.push(V(p)); return; }
          const c = V(p), a = V(pts[i - 1]), b = V(pts[i + 1]), s = c.clone().add(a.sub(c).clampLength(0, Math.min(p[2], c.distanceTo(V(pts[i - 1])) / 2))), e = c.clone().add(b.sub(c).clampLength(0, Math.min(p[2], c.distanceTo(V(pts[i + 1])) / 2)));
          for (let k = 0; k <= n; k++) { const u = k / n; out.push(new THREE.Vector2((1 - u) * (1 - u) * s.x + 2 * u * (1 - u) * c.x + u * u * e.x, (1 - u) * (1 - u) * s.y + 2 * u * (1 - u) * c.y + u * u * e.y)); }
        });
        return out;
      }
      const turn = (pts, seg = 96) => new THREE.LatheGeometry(outline(pts), seg);
      // vessel(shape, a, b): a group with the glass and the liquid body inside it (a = lower liquid, b = upper liquid;
      // one liquid: give it twice). Drive the liquid with group.userData.u (uLevel, uSplit, uRing, uChurn, uCloud...).
      function vessel(shape, a, b) {
        const g = new THREE.Group(), shell = new THREE.Mesh(turn(shape.glass), glass), body = liquid(turn(shape.liquid, 72), shape, a, b);
        g.add(body, shell); castLight(shell, { tint: '#e9f6f1', rim: 0.62, focus: 0.3 });
        Object.assign(g.userData, { u: body.userData.u, body, shape, floor: shape.liquid[0][1] });
        return g;
      }
      // How a liquid lies in a leaning bottle. The bottle is cut into slices along its axis; each slice is a disc
      // that the level surface cuts straight across. level(lean, volume) = height of the surface above the foot;
      // angle(volume) = the lean at which the surface just reaches the lip, i.e. the angle the bottle pours at.
      function leaning(shape) {
        const P = shape.liquid, y0 = P[0][1], y1 = P[P.length - 1][1], N = 40;
        const rad = (y) => { let i = 2; while (i < P.length - 2 && P[i][1] < y) i++; return K.lerp(P[i - 1][0], P[i][0], K.clamp((y - P[i - 1][1]) / (P[i][1] - P[i - 1][1] || 1))); };
        const volume = (lean, h) => { const s = Math.max(Math.sin(lean), 1e-3), c = Math.cos(lean); let v = 0;
          for (let i = 0; i < N; i++) { const y = y0 + (i + 0.5) / N * (y1 - y0), r = rad(y), u = K.clamp((h - c * y) / s / r, -1, 1); v += r * r * (Math.acos(-u) + u * Math.sqrt(1 - u * u)); }
          return v * (y1 - y0) / N; };
        const solve = (f, lo, hi) => { for (let i = 0; i < 22; i++) { const m = (lo + hi) / 2; if (f(m)) hi = m; else lo = m; } return (lo + hi) / 2; };
        const level = (lean, V) => solve((h) => volume(lean, h) > V, -3, y1 + 3);
        const angle = (V) => solve((a) => level(a, V) > shape.lip[1] * Math.cos(a) - shape.lip[0] * Math.sin(a) + 0.04, 0.3, 2.7);
        return { level, angle, full: volume(0, shape.fill) };
      }
      // stream(tint): returns lay(from, velocity, s0, s1, radius(s)), which lays the tube along the flight of a drop
      // that left `from` with `velocity`: the part that has been flying for s0..s1 seconds.
      function stream(tint) {
        const NS = 30, NR = 10, pos = new Float32Array((NS + 1) * NR * 3), nrm = new Float32Array(pos.length), idx = [];
        for (let i = 0; i < NS; i++) for (let j = 0; j < NR; j++) { const a = i * NR + j, b = i * NR + (j + 1) % NR; idx.push(a, b, b + NR, a, b + NR, a + NR); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3)); g.setIndex(idx);
        const mesh = new THREE.Mesh(g, streamMat(tint)); mesh.frustumCulled = false; scene.add(mesh); castLight(mesh, { tint: castColour(tint, 1), gain: 5, rim: 0.7 });
        return (from, vel, s0, s1, radius) => {
          mesh.visible = s1 > s0 + 1e-3; if (!mesh.visible) return;
          for (let i = 0; i <= NS; i++) {
            const s = s0 + (s1 - s0) * i / NS, x = from[0] + vel[0] * s, y = from[1] + vel[1] * s - GRAVITY / 2 * s * s, tx = vel[0], ty = vel[1] - GRAVITY * s, l = Math.hypot(tx, ty), r = radius(s);
            for (let j = 0; j < NR; j++) { const a = j / NR * Math.PI * 2, c = Math.cos(a), z = Math.sin(a), k = (i * NR + j) * 3;
              nrm[k] = ty / l * c; nrm[k + 1] = -tx / l * c; nrm[k + 2] = z; pos[k] = x + nrm[k] * r; pos[k + 1] = y + nrm[k + 1] * r; pos[k + 2] = from[2] + z * r; }
          }
          g.attributes.position.needsUpdate = true; g.attributes.normal.needsUpdate = true;
        };
      }

      // ---------------------------------------------------------------- 6. the scene
      const PART_VOLUME = Math.PI * SHAPES.jar.radius ** 2 * PART;
      const jar = vessel(SHAPES.jar, POURS[0].tint, POURS[POURS.length - 1].tint); scene.add(jar);
      // measure marks, printed in white on the outside of the jar: a tick and a number for every part
      {
        const y0 = 0.3, y1 = 2.85, span = 0.62, tex = K.canvasTex(512, 2048, (ctx, w, h) => {
          const Y = (y) => h * (1 - (y - y0) / (y1 - y0));
          ctx.fillStyle = '#ffffff'; ctx.font = '700 190px "Inter"'; ctx.textBaseline = 'middle';
          for (let k = 1; k <= MARKS * 2; k++) { const y = Y(FLOOR + k * PART / 2), whole = k % 2 === 0; ctx.fillRect(30, y - (whole ? 11 : 7), whole ? 200 : 100, whole ? 22 : 14); if (whole) ctx.fillText(String(k / 2), 268, y + 8); }
        });
        const marks = new THREE.Mesh(new THREE.CylinderGeometry(1.306, 1.306, y1 - y0, 48, 1, true, -0.92, span), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, color: new THREE.Color(0.92, 0.94, 0.94) }));
        marks.position.y = (y0 + y1) / 2; jar.add(marks);
      }
      // the lid: a brass screw cap with a ribbed edge
      const lid = new THREE.Group();
      {
        const T = SHAPES.jar.top, ribs = K.canvasTex(1024, 16, (ctx, w, h) => { for (let x = 0; x < w; x += 16) { const g = ctx.createLinearGradient(x, 0, x + 16, 0); g.addColorStop(0, '#000'); g.addColorStop(0.5, '#fff'); g.addColorStop(1, '#000'); ctx.fillStyle = g; ctx.fillRect(x, 0, 16, h); } }, { data: true, repeat: [1, 1] });
        const cap = new THREE.Mesh(turn([[0, T + 0.02], [1.17, T + 0.02], [1.17, T - 0.42], [1.215, T - 0.42, 0.02], [1.215, T + 0.09, 0.07], [1.0, T + 0.09, 0.03], [0.94, T + 0.06, 0.03], [0, T + 0.06]]), brass);
        const edge = new THREE.Mesh(new THREE.CylinderGeometry(1.222, 1.222, 0.26, 96, 1, true), new THREE.MeshStandardMaterial({ color: brass.color, metalness: 1, roughness: 0.4, bumpMap: ribs, bumpScale: 1.2 }));
        edge.position.y = T - 0.2; lid.add(cap, edge); jar.add(lid); castLight(cap, { gain: 0.02, rim: 1 });
      }
      // bottles, each with its liquid, its pouring maths and its stream
      const bottles = POURS.map((p) => {
        const shape = SHAPES[p.bottle], g = vessel(shape, p.tint, p.tint), side = Math.sign(p.at[0]);     // side: +1 stands right of the jar and leans left
        scene.add(g);
        const lean = leaning(shape), left = lean.full - p.parts * PART_VOLUME, angles = Array.from({ length: 13 }, (_, i) => lean.angle(K.lerp(left, lean.full, i / 12)));
        return Object.assign(g.userData, { g, side, lean, left, lay: stream(p.tint), angle: (V) => { const x = K.clamp((V - left) / (lean.full - left)) * 12, i = Math.min(11, Math.floor(x)); return K.lerp(angles[i], angles[i + 1], x - i); } });
      });
      // the spoon and its spoonful
      const spoon = new THREE.Group(), tip = new THREE.Group(); spoon.add(tip); scene.add(spoon);   // spoon: where it is and how it is held; tip: turning it over
      {
        const bowl = new THREE.Mesh(turn([[0, -0.115], [0.2, -0.09, 0.08], [0.31, 0.0, 0.05], [0.33, 0.03], [0.3, 0.03], [0.19, -0.065, 0.08], [0, -0.09]], 40), steel); bowl.scale.set(1.3, 1, 1);
        const handle = new THREE.Mesh(K.tube([[0.4, 0.03, 0], [0.9, 0.1, 0], [1.7, 0.16, 0], [2.5, 0.12, 0]], 0.05, { radial: 10 }).scale(1, 0.55, 1.5), steel);
        tip.add(bowl, handle); castLight(bowl, { gain: 0.02, rim: 1 }); castLight(handle, { gain: 0.02, rim: 1 });
      }
      const lumpGeo = new THREE.SphereGeometry(0.2, 32, 20), lumpNoise = K.noise(7);
      for (let i = 0, p = lumpGeo.attributes.position; i < p.count; i++) { const k = 1 + 0.16 * lumpNoise.n3(p.getX(i) * 6, p.getY(i) * 6, p.getZ(i) * 6); p.setXYZ(i, p.getX(i) * k * 1.12, p.getY(i) * k * 0.78, p.getZ(i) * k); }
      lumpGeo.computeVertexNormals();
      const lumpMat = new THREE.MeshStandardMaterial({ color: MIX.spoonful, roughness: 0.5, emissive: new THREE.Color(MIX.spoonful), emissiveIntensity: 0.35 });
      const lump = new THREE.Mesh(lumpGeo, lumpMat), carried = new THREE.Mesh(lumpGeo, lumpMat);       // the spoonful: falling free, and sitting in the spoon until it drops
      scene.add(lump); castLight(lump, { tint: MIX.spoonful, gain: 0.15, rim: 1 }); carried.position.y = 0.06; tip.add(carried);

      // ---------------------------------------------------------------- 7. the choreography
      const flow = (u) => (u + K.smooth(0, 1, u)) / 2;                      // a pour: steady, with a soft start and stop
      const tints = POURS.map((p) => new THREE.Color(p.tint)), mixTint = new THREE.Color(MIX.tint), rnd = K.rng(3), SEED = Array.from({ length: BLOBS }, () => [rnd.range(-1, 1), rnd.range(-1, 1), rnd()]);
      const [SH0, SH1] = MIX.shake, DROP_X = 0.12;                         // the spoonful goes in a little off the middle
      // one shot: wide while the bottles pour, then in on the jar
      const cam = {
        pos: K.path([[0, [-2.6, 5.4, 15.8]], [4.4, [-0.4, 5.6, 15.4]], [8.2, [1.2, 5.4, 14.3]], [DURATION, [1.6, 5.2, 13.7]]]),
        aim: K.path([[0, [0.1, 2.5, 0]], [4.4, [0.5, 2.6, 0]], [8.2, [0.3, 2.3, 0]], [DURATION, [0.2, 2.2, 0]]]),
        lens: K.path([[0, 0.02], [8.0, 0.03], [DURATION, 0.035]]),
      };
      const sunAz = K.track([[0, -0.45], [DURATION, 0.12, 'inOut']]), SUN_EL = 0.72;      // the lamp swings round behind the glass, 41 degrees up

      return {
        update(t) {
          const ju = jar.userData.u;
          // --- the jar: lifted and shaken, then set down
          const held = K.seg(t, SH0 - 0.25, SH0, K.ease.inOut) * (1 - K.seg(t, SH1, LANDED, K.ease.in)), hard = K.seg(t, SH0 - 0.05, SH0 + 0.12) * (1 - K.seg(t, SH1 - 0.22, SH1 + 0.03)), w = (t - SH0) * Math.PI * 2 * 4.5;
          const settle = t > LANDED ? 0.05 * Math.exp(-(t - LANDED) * 9) * Math.sin((t - LANDED) * 30) : 0;   // a small bounce on landing
          jar.position.set(0.14 * Math.cos(w) * hard, 1.05 * held + 0.42 * Math.sin(w) * hard + Math.abs(settle), 0); jar.rotation.z = 0.2 * Math.sin(w + 1.1) * hard;
          ju.uAxis.value.set(-Math.sin(jar.rotation.z), Math.cos(jar.rotation.z), 0); ju.uBase.value.copy(jar.position).addScaledVector(ju.uAxis.value, FLOOR);
          // --- pours: each bottle lifts, leans until its liquid reaches the lip, pours, and goes back
          let parts = 0, ringTop = 0, ringSplit = 0, landX = 0;       // what is in the jar, how hard a stream is landing (on the surface, on the boundary), and where
          POURS.forEach((p, i) => {
            const b = bottles[i], [a, z] = p.pour, V = b.lean.full - flow(K.seg(t, a, z)) * p.parts * PART_VOLUME, shape = b.shape;
            const go = K.seg(t, a - LIFT, a, K.ease.inOut) * (1 - K.seg(t, z + 0.2, z + 0.2 + LIFT, K.ease.inOut));    // 0 = standing on the table, 1 = at the jar
            const lean = b.angle(V) * K.smooth(0.12, 1, go), phi = b.side * lean, cs = Math.cos(phi), sn = Math.sin(phi);
            // the lip travels from where it stands to the pouring place; the bottle hangs from its lip
            const lip = [K.lerp(p.at[0] - b.side * shape.lip[0], b.side * POUR_AT[0], K.smooth(0.1, 1, go)), K.lerp(shape.lip[1], POUR_AT[1], K.smooth(0, 0.75, go)) + 0.5 * Math.sin(Math.PI * go) * (1 - go), K.lerp(p.at[1], 0, go)];
            const lx = -b.side * shape.lip[0], ly = shape.lip[1];
            b.g.position.set(lip[0] - (lx * cs - ly * sn), lip[1] - (lx * sn + ly * cs), lip[2]); b.g.rotation.z = phi;
            b.u.uAxis.value.set(-sn, cs, 0); b.u.uBase.value.copy(b.g.position).addScaledVector(b.u.uAxis.value, b.floor);
            b.u.uLevel.value = b.g.position.y + b.lean.level(lean, V); b.u.uMen.value = 0.04 * (1 - K.smooth(0, 0.2, lean));
            // what has arrived in the jar, and the stream on its way there
            const arriving = K.seg(t, a + DELAY[i], a + DELAY[i] + 0.12) * (1 - K.seg(t, z + DELAY[i] - 0.05, z + DELAY[i] + 0.5, K.ease.out));
            const got = flow(K.seg(t - DELAY[i], a, z)) * p.parts, level = FLOOR + (parts + got) * PART, vel = [-sn * SPOUT, cs * SPOUT];
            const sLand = fall(lip[1] - level + 0.05, vel[1]);
            b.lay(lip, vel, Math.max(0, t - z), Math.min(t - a, sLand), (s) => { const born = t - s, speed = Math.hypot(vel[0], vel[1] - GRAVITY * s);
              return p.stream * K.smooth(a, a + 0.14, born) * (1 - K.smooth(z - 0.16, z, born)) * (0.45 + 0.55 * Math.sqrt(SPOUT / speed)) * (1 + 0.08 * Math.sin(s * 40 - t * 23)); });
            if (arriving > 0) { landX = lip[0] + vel[0] * sLand; ringTop += arriving; if (i > 0) ringSplit += arriving; }
            if (i === 0) ju.uSplit.value = jar.position.y + FLOOR + got * PART;      // the first liquid ends up as the lower layer
            parts += got;
            // drops of a lighter liquid that were carried under by the stream bob back up to the boundary
            if (i > 0) for (let k = 0; k < BLOBS - 1; k++) {
              const life = ((t - a - DELAY[i]) / 0.62 + k / (BLOBS - 1)) % 1, r = 0.085 * Math.sin(Math.PI * life) ** 0.6 * arriving * (0.7 + 0.5 * SEED[k][2]);
              ju.uBlobs.value[k].set(landX + 0.32 * SEED[k][0], ju.uSplit.value - 0.36 * (1 - K.ease.out(life)) - r * 0.5, 0.3 * SEED[k][1], arriving > 0 && life > 0 ? r : 0);
              ju.uBlobCol.value[k].set(tints[i].r ** 0.3, tints[i].g ** 0.3, tints[i].b ** 0.3, 0);
            }
          });
          // --- the shake: both layers break up, cloud over and become one liquid
          const mixed = K.smooth(SH0 + 0.05, SH0 + 0.8, t), churn = K.seg(t, SH0 - 0.02, SH0 + 0.15) * (1 - K.seg(t, SH1 - 0.15, SH1 + 0.7, K.ease.out));
          ju.uLevel.value = jar.position.y + FLOOR + parts * PART; ju.uMen.value = 0.05 * K.smooth(0, 0.15, parts);
          ju.uRing.value.set(landX, 0, 0.03 * ringTop, 0.022 * ringSplit); ju.uChurn.value = 0.78 * churn; ju.uCloud.value = mixed;
          ju.uTintA.value.lerpColors(tints[0], mixTint, mixed); ju.uTintB.value.lerpColors(tints[tints.length - 1], mixTint, mixed);
          jar.userData.body.visible = parts > 0.002;
          // --- the spoon comes in along its handle, turns over, and leaves; the spoonful falls, sinks to the boundary and is shaken in
          const sIn = K.seg(t, MIX.spoon, MIX.spoon + 0.75, K.ease.out), sOut = K.seg(t, MIX.drop + 0.25, MIX.drop + 1.0, K.ease.in), away = (1 - sIn) + sOut;
          spoon.position.set(DROP_X + 3.3 * away, DROP_FROM + 4.6 * away, 0); spoon.rotation.z = 0.95; spoon.visible = away < 1;
          tip.rotation.x = 1.9 * K.seg(t, MIX.drop - 0.32, MIX.drop + 0.05, K.ease.inOut);
          const surface = ju.uLevel.value, tFall = PLOP - MIX.drop, since = t - MIX.drop, rest = ju.uSplit.value + 0.06;
          const ly = since < 0 ? 0 : since < tFall ? DROP_FROM - GRAVITY / 2 * since * since : rest + (surface - rest) * Math.exp(-(since - tFall) * 4.2);
          const gone = K.seg(t, SH0, SH0 + 0.45);
          lump.visible = since >= 0 && gone < 1; lump.position.set(DROP_X + jar.position.x, ly, 0); lump.rotation.z = Math.min(since, tFall) * 5; lump.scale.setScalar(1 - gone);
          carried.visible = since < 0;
          ju.uBlobs.value[BLOBS - 1].set(lump.position.x, lump.position.y, 0, since > tFall && gone < 1 ? 0.2 * (1 - gone) : 0); ju.uBlobCol.value[BLOBS - 1].set(lumpMat.color.r, lumpMat.color.g, lumpMat.color.b, 1);
          if (since > tFall && since < tFall + 0.9) { const k = 1 - (since - tFall) / 0.9; ju.uRing.value.set(DROP_X, 0, 0.045 * k * k, ju.uRing.value.w + 0.02 * k); }   // its splash
          // --- the lid comes down turning and is screwed tight
          const down = K.seg(t, MIX.lid - 0.6, MIX.lid, K.ease.in), tight = K.seg(t, MIX.lid + 0.02, MIX.lid + 0.3, K.ease.out);
          lid.position.y = 5.2 * (1 - down) ** 2 + 0.1 * (1 - tight); lid.rotation.y = -2.2 * (1 - down) + 1.3 * tight; lid.visible = t > MIX.lid - 0.6;
          // --- lamp, light on the table, camera
          const az = sunAz(t);
          renderLight([Math.sin(az) * Math.cos(SUN_EL), Math.sin(SUN_EL), -Math.cos(az) * Math.cos(SUN_EL)], t);
          K.look(camera, cam.pos(t), cam.aim(t)); K.focus(camera, cam.aim(t), cam.lens(t));
        },
        // captions: one short line per beat, small, in the dark top corner where nothing happens
        overlay(ctx, t, W, H) {
          for (const [a, b, text, dot] of CAPTIONS) {
            const k = K.seg(t, a, a + 0.3, K.ease.out) * (1 - K.seg(t, b - 0.25, b)); if (k <= 0) continue;
            ctx.font = '600 62px "Inter"'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';       // capitals about 45 px tall: readable on a phone
            const x = 96, y = 92 + (1 - K.seg(t, a, a + 0.3, K.ease.out)) * 14;
            ctx.globalAlpha = k; ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 2;
            if (dot) { ctx.fillStyle = dot; ctx.beginPath(); ctx.arc(x + 17, y + 1, 17, 0, Math.PI * 2); ctx.fill(); }
            ctx.fillStyle = '#f6f3ec'; ctx.fillText(text, x + (dot ? 56 : 0), y);
          }
        },
      };
    },

    sound(k) {
      const NOTES = ['D5', 'F#5'];
      k.bed('room', 0, DURATION, { gain: 0.4 });
      k.music('pad', 0, DURATION, { bpm: 40, gain: 0.6, chords: [['D3', 'A3', 'F#4', 'E4'], ['B2', 'F#3', 'D4', 'A4']] });
      POURS.forEach((p, i) => {
        const [a, z] = p.pour, d = z - a, pan = i ? 0.35 : -0.35, thick = p.stream / 0.055;          // a thicker stream sounds lower
        k.play('swish', a - LIFT + 0.1, { gain: 0.3, pan, dur: 0.3 });                            // the bottle is lifted
        // pouring: the hiss of the stream, then the note of a vessel filling, which rises with the level
        k.noise(a, { dur: d + 0.15, color: 'pink', filter: 'bandpass', f: [[0, 900 / thick], [d, 1500 / thick]], q: 1.2, gain: 0.05, a: 0.12, hold: d - 0.2, pan: pan * 0.5 });
        k.noise(a + DELAY[i], { dur: d, color: 'pink', filter: 'bandpass', f: [[0, 420 / thick], [d, 1300 / thick]], q: 2.2, gain: 0.1, a: 0.1, hold: d - 0.35 });
        k.tone(a + DELAY[i], { f: [[0, SOUND.hz(NOTES[i]) / 2], [d, SOUND.hz(NOTES[i])]], dur: d, gain: 0.03, a: d * 0.8, verb: 0.3 });
        for (let g = 0, n = Math.round(d * 2.6); g < n; g++) k.play('pop', a + 0.25 + (g + 0.3 * K.hash(g, i)) * d / n, { f: (i ? 170 : 260) + 60 * K.hash(g, i + 5), gain: 0.22, pan });   // the bottle glugs
        k.play('ding', z + DELAY[i] + 0.1, { f: NOTES[i], gain: 0.7 });                             // the level is at its mark: the glass rings
        k.play('tock', z + 0.2 + LIFT, { f: i ? 520 : 760, gain: 0.5, pan });                        // the bottle is back on the table
      });
      k.play('swish', MIX.spoon + 0.1, { gain: 0.25, pan: 0.2, dur: 0.35 });
      k.play('pop', PLOP, { f: 230, gain: 0.7 }); k.noise(PLOP, { dur: 0.22, filter: 'bandpass', f: [[0, 2600], [0.2, 900]], q: 1, gain: 0.1, a: 0.01 });   // the spoonful lands
      k.play('tock', MIX.lid, { f: 1250, gain: 0.85 }); k.play('click', MIX.lid, { gain: 0.9 });  // the lid lands and is screwed tight
      for (let i = 0; i < 4; i++) k.play('tick', MIX.lid + 0.06 + i * 0.055, { f: 3000 + i * 250, gain: 0.35 });
      // the shake: liquid slaps the glass twice per swing
      const [s0, s1] = MIX.shake;
      k.play('swish', s0 - 0.22, { gain: 0.35, dur: 0.25 });
      for (let i = 0, n = Math.round((s1 - s0) * 9); i < n; i++) { const t = s0 + i / 9, up = i % 2;
        k.noise(t, { dur: 0.1, color: 'pink', filter: 'bandpass', f: [[0, up ? 1500 : 800], [0.09, up ? 700 : 1300]], q: 1.1, gain: 0.26 * (1 - 0.3 * i / n), a: 0.012, pan: up ? 0.3 : -0.3 });
        k.tone(t, { f: [[0, up ? 150 : 120], [0.08, 70]], dur: 0.1, gain: 0.1, pan: up ? 0.3 : -0.3 }); }
      k.play('thud', LANDED, { f: 110, gain: 0.5 }); k.play('tock', LANDED, { f: 640, gain: 0.45 });   // set down
      k.play('ding', LANDED + 0.4, { f: 'A5', gain: 0.7 }); k.play('sparkle', LANDED + 0.45, { gain: 0.45 });
    },
  });
}
```
