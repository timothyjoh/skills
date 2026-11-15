# Soft Clay (#03)

- **id:** `soft-clay`
- **Category:** Material worlds
- **Use:** explainer
- **Reference duration:** 8 s
- **Google Fonts:** Fredoka
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`, `lib/text3d.js`

## Style card

- **Look:** Everything is modelled in plasticine and filmed like stop-motion on a small tabletop: chunky, slightly lopsided forms with fingerprints, tool marks and pits in them, in a few colours from one box of clay, in front of a seamless paper backdrop.
- **Motion:** Animated on twos (15 poses a second) with no motion blur, by swapping shapes like a stop-motion animator: a ball of clay buds, hops over on an arc, lands as a thick puck, is pressed too flat and springs back into a coin. Stacks flinch when something lands on them, words are slapped onto the backdrop, and anything just touched shifts by a hair between poses. Only the camera moves smoothly.
- **Light:** One big soft lamp from the upper left that pools on the backdrop and falls off to the corners, plus soft light from the whole sky that is blocked in every crease and under every object, so contact shadows are real.
- **Materials:** Matte, waxy plasticine with a velvety sheen: a generated surface of fingerprints, knife drags, pits and joins bends the light, pressed spots are a little shinier, and each colour has a second colour streaked through it. The backdrop is uncoated coloured card.
- **Camera:** A macro lens with shallow focus on a slow dolly: it starts close enough to read the fingerprints, travels along with the action, then pulls back in the same move until the whole set fits, and ends on a slight push-in.
- **Finish:** True colours (neutral tone curve), almost no bloom, a light vignette and a little grain; a faint flicker in the lamp from pose to pose, like single frames shot one at a time.
- **Good for:** Anything that can be told with a few friendly objects on a table: amounts as piles and stacks, growth and comparison, simple characters and props, a number or a few words as fat clay letters. Good for warm, non-technical topics.

## Reference

- **Sample topic:** How compound interest grows your savings
- **Gallery description:** Everything is modelled in plasticine and filmed like stop-motion on a small tabletop: chunky, slightly lopsided forms with fingerprints, tool marks and pits in them, in a few colours from one box of clay, in front of a seamless paper backdrop.
- **Shown in the sample clip:** How compound interest grows your savings

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/soft-clay.js`)

```js
{
  // ---------------------------------------------------------------- content (change this for a new topic)
  const START = 1000;                          // dollars put in once, never added to
  const RATE = 0.07;                           // interest per year, paid on everything in the pile
  const YEARS = [0, 5, 10, 15, 20, 25, 30];    // one stack of coins per entry
  const COIN = 250;                            // dollars per clay coin
  const balance = (y) => START * Math.pow(1 + RATE, y);
  const money = (v) => '$' + Math.round(v).toLocaleString('en-US');
  const LAST = YEARS[YEARS.length - 1];
  const SIGN = [money(START), Math.round(RATE * 100) + '% a year'];   // the little sign next to the first stack
  const CAPTION = ['after', String(LAST), 'years'];                   // small words pressed onto the backdrop
  const RESULT = money(balance(LAST));                                // the big number: "$7,612"

  // the box of clay: a handful of sticks, each with a neighbour it got slightly mixed with
  const BOX = {
    card: '#12808a',                                   // the paper backdrop
    cream: ['#f3e6cd', '#eec78c'], coral: ['#de3a26', '#f2814f'], yellow: ['#f4ad08', '#ee7f14'], navy: ['#253677', '#4467b8'],
  };
  const FONT = '700 200px "Fredoka"';

  // ---------------------------------------------------------------- stop-motion time
  // The clay is animated "on twos": 15 poses a second, each held for two frames. Everything made of clay reads the
  // pose clock; only the camera and the lens read real time, so the shot glides while the puppets tick.
  const POSES = 15;
  const pose = (t) => Math.floor(t * POSES + 1e-3) / POSES;
  const snap = (t) => Math.round(t * POSES) / POSES;                 // put an event exactly on a pose
  const since = (tq, t0) => Math.round((tq - t0) * POSES);            // whole poses since an event (negative = before)
  const nudge = (id, tq, amt) => (K.hash(id, Math.round(tq * POSES)) - 0.5) * 2 * amt;   // re-placement jitter: new on every pose

  // one schedule for picture and sound: when every ball of clay lands and when every word is pressed on
  function schedule() {
    const counts = YEARS.map((y) => Math.round(balance(y) / COIN)), own = Math.round(START / COIN), coins = [];
    let t = 0.4;
    counts.forEach((n, s) => {
      const dur = s ? 0.34 + 0.022 * n : 0;                           // taller stacks take a little longer, but not in proportion: growth speeds up
      for (let j = 0; j < n; j++) coins.push({ s, j, own: j < own, land: s ? snap(t + dur * (j + 1) / n) : -9 });
      if (s) t += dur + 0.12;
    });
    const words = CAPTION.map((w, i) => ({ text: w, land: snap(t + 0.12 + i * 0.14) }));
    const t1 = words[words.length - 1].land + 0.26;
    const digits = [...RESULT].map((ch, i) => ({ ch, land: snap(t1 + i * 2 / POSES) }));
    return { counts, own, coins, words, digits, end: digits[digits.length - 1].land };
  }

  // ---------------------------------------------------------------- the clay kit (reusable on any subject)
  // 1. THE SURFACE. One tiling height map of what hands and tools leave behind: fingerprints (a shallow dent with
  //    ridges in it), knife drags with a burr, pits, specks, joins that were smoothed over. Grey = untouched.
  let SURFACE = null;
  function claySurface() {
    if (SURFACE) return SURFACE;
    const N = 1024, r = K.rng(3);
    SURFACE = K.canvasTex(N, N, (ctx) => {
      ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, N, N);
      // draw something at (x, y) and again wherever it crosses the edge, so the map tiles
      const tiled = (x, y, pad, draw) => { for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) { if (x + ox < -pad || x + ox > N + pad || y + oy < -pad || y + oy > N + pad) continue; ctx.save(); ctx.translate(x + ox, y + oy); draw(); ctx.restore(); } };
      const pc = document.createElement('canvas'); pc.width = pc.height = 440; const p = pc.getContext('2d');
      for (let i = 0; i < 8; i++) {                                   // fingerprints
        const R = r.range(80, 160), sp = r.range(13, 17), ph = [r.range(0, 6.3), r.range(0, 6.3)], sx = r.range(0.62, 0.82);
        p.setTransform(1, 0, 0, 1, 0, 0); p.globalCompositeOperation = 'source-over'; p.clearRect(0, 0, 440, 440);
        p.translate(220, 220); p.rotate(r.range(0, 6.3));
        let g = p.createRadialGradient(0, 0, 0, 0, 0, R); g.addColorStop(0, 'rgba(0,0,0,0.26)'); g.addColorStop(0.75, 'rgba(0,0,0,0.2)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        p.fillStyle = g; p.fillRect(-220, -220, 440, 440);            // the press: a shallow dent
        p.strokeStyle = 'rgba(255,255,255,0.5)'; p.lineWidth = sp * 0.4; p.lineJoin = 'round';
        for (let k = 1; k * sp < R * 1.6; k++) {                      // the ridges: loops that crowd toward one side, like a real print
          p.beginPath();
          for (let a = 0; a < 6.283; a += 0.05) { const rr = k * sp * (1 + 0.07 * Math.sin(3 * a + ph[0]) + 0.04 * Math.sin(5 * a + ph[1] + k * 0.4)), X = rr * Math.cos(a) * sx, Y = rr * Math.sin(a) * 1.15 + k * sp * 0.42; if (a === 0) p.moveTo(X, Y); else p.lineTo(X, Y); }
          p.closePath(); p.stroke();
        }
        p.globalCompositeOperation = 'destination-in'; g = p.createRadialGradient(0, 0, R * 0.25, 0, 0, R); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        p.fillStyle = g; p.fillRect(-220, -220, 440, 440);
        tiled(r.range(0, N), r.range(0, N), 230, () => ctx.drawImage(pc, -220, -220));
      }
      ctx.lineCap = 'round';
      for (let i = 0; i < 10; i++) {                                  // tool marks: a drag with a raised burr beside it
        const L = r.range(120, 430), a = r.range(0, 6.3), w = r.range(2, 5), bend = r.range(-30, 30);
        tiled(r.range(0, N), r.range(0, N), 460, () => {
          ctx.rotate(a);
          ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(-L / 2, 0); ctx.quadraticCurveTo(0, bend, L / 2, 0); ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,0.32)'; ctx.lineWidth = w * 0.8; ctx.beginPath(); ctx.moveTo(-L / 2, w); ctx.quadraticCurveTo(0, bend + w, L / 2, w); ctx.stroke();
        });
      }
      for (let i = 0; i < 4; i++) {                                   // joins: two pieces pushed together and smoothed over
        const a = r.range(0, 6.3), pts = Array.from({ length: 9 }, (_, k) => [(k - 4) * 85, r.range(-26, 26)]);
        tiled(r.range(0, N), r.range(0, N), 420, () => {
          ctx.rotate(a);
          for (const [dy, style, w] of [[0, 'rgba(0,0,0,0.4)', 3.5], [5, 'rgba(255,255,255,0.22)', 5]]) { ctx.strokeStyle = style; ctx.lineWidth = w; ctx.beginPath(); pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y + dy) : ctx.moveTo(x, y + dy))); ctx.stroke(); }
        });
      }
      for (let i = 0; i < 170; i++) {                                 // pits (dark) and specks of stuck clay (light)
        const rad = r.range(1.5, 4.5) * (r.chance(0.08) ? 2.4 : 1), up = r.chance(0.22);
        tiled(r.range(0, N), r.range(0, N), 16, () => { const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rad); g.addColorStop(0, up ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.8)'); g.addColorStop(1, up ? 'rgba(255,255,255,0)' : 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rad, 0, 7); ctx.fill(); });
      }
      const im = ctx.getImageData(0, 0, N, N), d = im.data;           // a fine tooth over everything
      for (let i = 0; i < d.length; i += 4) { const v = d[i] + r.range(-7, 7); d[i] = d[i + 1] = d[i + 2] = v; }
      ctx.putImageData(im, 0, 0);
    }, { data: true, repeat: [1, 1] });
    return SURFACE;
  }

  // 2. THE MATERIAL. clay(colour, { marble, marbleAmount, marbleSize, bump, lump, roughness, sheen, tile }) -> a plasticine material
  //    for ANY geometry: no UVs needed. The surface map is projected from three sides in object space (so marks stay
  //    stuck to the object when it moves or squashes), soft dents are added as noise, a second colour is streaked
  //    through, pressed places come out slightly darker and shinier, and a sheen gives the waxy, velvety edge light.
  const CLAY_GLSL = `
    uniform sampler2D uSurf; uniform vec3 uOff, uMarble; uniform float uTile, uBump, uLump, uLumpSize, uMarbleAmt, uMarbleSize;
    varying vec3 vClayP, vClayN;
    float cHash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
    float cNoise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
      return mix(mix(mix(cHash(i), cHash(i + vec3(1,0,0)), f.x), mix(cHash(i + vec3(0,1,0)), cHash(i + vec3(1,1,0)), f.x), f.y),
                 mix(mix(cHash(i + vec3(0,0,1)), cHash(i + vec3(1,0,1)), f.x), mix(cHash(i + vec3(0,1,1)), cHash(i + vec3(1,1,1)), f.x), f.y), f.z); }
    // x: height of the surface in world units (fine marks + soft dents), y: the fine marks alone, -0.5..0.5
    vec2 clayH(vec3 p, vec3 w){
      vec3 q = p / uTile + uOff;
      float fine = dot(w, vec3(texture2D(uSurf, q.zy).r, texture2D(uSurf, q.xz).r, texture2D(uSurf, q.xy).r)) - 0.5;
      vec3 l = p / uLumpSize + uOff * 9.0;
      return vec2(uBump * fine + uLump * (cNoise(l) + 0.5 * cNoise(l * 2.3 + 5.0) - 0.75), fine);
    }
    // bend the normal by a height difference per pixel (Mikkelsen's bump mapping, in true units so it holds at any distance)
    vec3 clayBump(vec3 pos, vec3 n, vec2 dH, float face){
      vec3 sx = dFdx(pos), sy = dFdy(pos), r1 = cross(sy, n), r2 = cross(n, sx);
      float det = dot(sx, r1) * face;
      return normalize(abs(det) * n - sign(det) * (dH.x * r1 + dH.y * r2));
    }`;
  let clayCount = 0;
  function clay(colour, o = {}) {
    const [base, mix] = Array.isArray(colour) ? colour : [colour, o.marble || colour], c = new THREE.Color(base), r = K.rng(101 + clayCount++);
    const m = new THREE.MeshPhysicalMaterial({ color: c, roughness: o.roughness == null ? 0.6 : o.roughness, metalness: 0,
      sheen: o.sheen == null ? 0.4 : o.sheen, sheenRoughness: 0.5, sheenColor: c.clone().lerp(new THREE.Color('#ffffff'), 0.2) });
    const u = { uSurf: { value: claySurface() }, uOff: { value: new THREE.Vector3(r(), r(), r()) }, uMarble: { value: new THREE.Color(mix) },
      uTile: { value: o.tile || 1.5 }, uBump: { value: o.bump == null ? 0.007 : o.bump }, uLump: { value: o.lump == null ? 0.02 : o.lump }, uLumpSize: { value: o.lumpSize || 0.3 },
      uMarbleAmt: { value: o.marbleAmount == null ? 0.4 : o.marbleAmount }, uMarbleSize: { value: o.marbleSize || 0.5 } };
    m.userData.clay = u;
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vClayP, vClayN;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvClayP = position; vClayN = normal;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + CLAY_GLSL)
        .replace('#include <map_fragment>', `#include <map_fragment>
          vec3 cW = pow(abs(normalize(vClayN)), vec3(4.0)); cW /= cW.x + cW.y + cW.z;
          vec2 cH = clayH(vClayP, cW);
          vec2 cD = vec2(clayH(vClayP + dFdx(vClayP), cW).x, clayH(vClayP + dFdy(vClayP), cW).x) - cH.x;
          float cM = cNoise(vClayP * 0.7 / uMarbleSize + uOff * 5.0);
          float cS = smoothstep(0.3, 0.95, sin(dot(vClayP, vec3(1.1, 1.8, 0.9)) / uMarbleSize + cM * 9.0 + uOff.x * 40.0)) * (0.35 + cM);
          diffuseColor.rgb = mix(diffuseColor.rgb, uMarble, clamp(uMarbleAmt * cS, 0.0, 1.0));
          diffuseColor.rgb *= 1.0 + 0.3 * cH.y;`)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor + 0.55 * cH.y + 0.12 * (cM - 0.5), 0.32, 1.0);')
        .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = clayBump(-vViewPosition, normal, cD, faceDirection);');
    };
    m.customProgramCacheKey = () => 'soft-clay';
    return m;
  }

  // 3. THE HANDS. lumpy(geometry, { amount, size, dents, dentSize, dentDepth, seed }) -> a copy that was shaped by
  //    fingers: every point is pushed by a smooth 3D field (so nothing stays symmetrical, and split vertices on hard
  //    edges never crack apart), then a few thumb dents are pressed in. Normals follow the warp exactly.
  function lumpy(geo, o = {}) {
    const amount = o.amount == null ? 0.03 : o.amount, f = 1 / (o.size || 0.6), seed = o.seed || 1;
    const g = geo.clone(), n = K.noise(seed), r = K.rng(seed + 77), P = g.attributes.position, N = g.attributes.normal, dents = [];
    for (let i = 0; i < (o.dents || 0); i++) { const k = r.int(0, P.count - 1); dents.push([P.getX(k), P.getY(k), P.getZ(k), N.getX(k), N.getY(k), N.getZ(k), (o.dentSize || 0.25) * r.range(0.7, 1.3), (o.dentDepth || 0.04) * r.range(0.6, 1.2)]); }
    const warp = (x, y, z, out) => {
      let dx = 2 * amount * n.n3(x * f + 31.4, y * f, z * f), dy = 2 * amount * n.n3(x * f, y * f + 47.2, z * f), dz = 2 * amount * n.n3(x * f, y * f, z * f + 12.9);
      for (const d of dents) { const q = Math.hypot(x - d[0], y - d[1], z - d[2]) / d[6]; if (q < 1) { const k = d[7] * (1 - q * q) * (1 - q * q); dx -= d[3] * k; dy -= d[4] * k; dz -= d[5] * k; } }
      return out.set(x + dx, y + dy, z + dz);
    };
    const p = new THREE.Vector3(), nn = new THREE.Vector3(), t1 = new THREE.Vector3(), t2 = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), E = 2e-3;
    for (let i = 0; i < P.count; i++) {
      p.fromBufferAttribute(P, i); nn.fromBufferAttribute(N, i);
      t1.set(0, 1, 0); if (Math.abs(nn.y) > 0.9) t1.set(1, 0, 0);
      t1.crossVectors(nn, t1).normalize(); t2.crossVectors(nn, t1);                       // two directions lying in the surface
      warp(p.x, p.y, p.z, a); warp(p.x + t1.x * E, p.y + t1.y * E, p.z + t1.z * E, b); warp(p.x + t2.x * E, p.y + t2.y * E, p.z + t2.z * E, c);
      b.sub(a); c.sub(a); nn.crossVectors(b, c).normalize();                              // the warped surface's own normal
      P.setXYZ(i, a.x, a.y, a.z); N.setXYZ(i, nn.x, nn.y, nn.z);
    }
    g.computeBoundingBox(); g.computeBoundingSphere();
    return g;
  }
  const part = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; return m; };

  // ---------------------------------------------------------------- the models (this topic)
  const COIN_R = 0.5, COIN_T = 0.14, BALL_R = Math.cbrt(0.75 * COIN_R * COIN_R * COIN_T);   // a ball with exactly one coin's worth of clay
  // A hand-made coin: a disc with a raised rim, and grooves pushed into the edge one by one with a tool (never evenly).
  function coinGeo(seed) {
    const r = K.rng(seed), T = COIN_T / 2, SEG = 128, GROOVES = 30;
    const half = [[0, T - 0.036], [0.11, T - 0.036], [0.22, T - 0.036], [0.31, T - 0.036], [0.35, T - 0.03], [0.385, T - 0.008], [0.42, T], [0.465, T - 0.004], [0.489, T - 0.022], [0.5, T - 0.048], [0.5, 0]];
    const prof = half.concat(half.slice(0, -1).reverse().map(([x, y]) => [x, -y]));      // top centre, over the edge, to bottom centre
    const ga = [], gw = [], gd = [];
    for (let i = 0; i < GROOVES; i++) { ga.push((i + r.range(-0.24, 0.24)) / GROOVES * 2 * Math.PI); gw.push(r.range(0.04, 0.065)); gd.push(r.chance(0.12) ? 0 : r.range(0.011, 0.022)); }
    const groove = (a) => { let g = 0; for (let i = 0; i < GROOVES; i++) { const d = Math.abs(((a - ga[i] + 9 * Math.PI) % (2 * Math.PI)) - Math.PI) / gw[i]; if (d < 1) g = Math.max(g, gd[i] * (1 - d * d)); } return g; };
    const pos = [], idx = [];
    prof.forEach(([pr, py]) => { for (let s = 0; s < SEG; s++) { const a = s / SEG * 2 * Math.PI, rr = pr * COIN_R / 0.5 - K.smooth(0.44, 0.5, pr) * groove(a); pos.push(Math.cos(a) * rr, py, Math.sin(a) * rr); } });
    for (let i = 0; i < prof.length - 1; i++) for (let s = 0; s < SEG; s++) { const a = i * SEG + s, b = i * SEG + (s + 1) % SEG, c = a + SEG, d = b + SEG; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return lumpy(g, { amount: 0.014, size: 0.5, seed });
  }

  registerStyle({
    id: 'soft-clay',
    name: 'Soft Clay',
    family: 'Material worlds',
    look: 'Everything is modelled in plasticine and filmed like stop-motion on a small tabletop: chunky, slightly lopsided forms with fingerprints, tool marks and pits in them, in a few colours from one box of clay, in front of a seamless paper backdrop.',
    motion: 'Animated on twos (15 poses a second) with no motion blur, by swapping shapes like a stop-motion animator: a ball of clay buds, hops over on an arc, lands as a thick puck, is pressed too flat and springs back into a coin. Stacks flinch when something lands on them, words are slapped onto the backdrop, and anything just touched shifts by a hair between poses. Only the camera moves smoothly.',
    light: 'One big soft lamp from the upper left that pools on the backdrop and falls off to the corners, plus soft light from the whole sky that is blocked in every crease and under every object, so contact shadows are real.',
    materials: 'Matte, waxy plasticine with a velvety sheen: a generated surface of fingerprints, knife drags, pits and joins bends the light, pressed spots are a little shinier, and each colour has a second colour streaked through it. The backdrop is uncoated coloured card.',
    camera: 'A macro lens with shallow focus on a slow dolly: it starts close enough to read the fingerprints, travels along with the action, then pulls back in the same move until the whole set fits, and ends on a slight push-in.',
    post: 'True colours (neutral tone curve), almost no bloom, a light vignette and a little grain; a faint flicker in the lamp from pose to pose, like single frames shot one at a time.',
    explains: 'Anything that can be told with a few friendly objects on a table: amounts as piles and stacks, growth and comparison, simple characters and props, a number or a few words as fat clay letters. Good for warm, non-technical topics.',
    topic: 'How compound interest grows your savings',
    duration: 8,
    fonts: [FONT],
    render: { samples: 64, shutter: 0, tone: 'neutral', exposure: 1.0, bloom: 0.06, bloomThreshold: 1.1, vignette: 0.26, grain: 0.014, fov: 28, background: '#0d3a3d' },

    build(S) {
      const { scene, camera } = S;
      const plan = schedule(), rnd = K.rng(7);

      // ---- the set: one big soft key, sky light with real occlusion, a pale environment for fill and sheen
      const KEY = 1400;
      K.env(S, { top: '#f6f2ea', horizon: '#b9d2d0', bottom: '#3f6466', intensity: 0.22, panels: [{ pos: [-9, 12, 10], size: [16, 12], color: '#fff2df', power: 2.4 }] });
      const key = K.spot(S, { pos: [-7.5, 11, 9.5], target: [0.4, 1.3, -0.6], color: '#fff0dc', power: KEY, angle: 0.52, penumbra: 1, soft: 1.3, near: 6, far: 40, bias: -0.0003 });
      K.skyLight(S, { color: '#e2f2ff', power: 0.75, size: 9.5, center: [-0.5, 1.5, 0], spread: 0.85 });

      // a seamless paper sweep: floor, cove, wall in one sheet
      const FLOOR_BACK = -1.3, COVE = 1.9, WALL = FLOOR_BACK - COVE;
      {
        const front = 16, height = 16, Lf = front - FLOOR_BACK, La = Math.PI / 2 * COVE, L = Lf + La + height - COVE;
        const g = new THREE.PlaneGeometry(70, 1, 1, 120), p = g.attributes.position;
        for (let i = 0; i < p.count; i++) {
          const s = (p.getY(i) + 0.5) * L, x = p.getX(i);
          if (s < Lf) p.setXYZ(i, x, 0, front - s);
          else if (s < Lf + La) { const a = (s - Lf) / COVE; p.setXYZ(i, x, COVE - COVE * Math.cos(a), FLOOR_BACK - COVE * Math.sin(a)); }
          else p.setXYZ(i, x, COVE + s - Lf - La, WALL);
        }
        g.computeVertexNormals();
        const tooth = K.canvasTex(256, 256, (ctx) => { const im = ctx.createImageData(256, 256), r = K.rng(9); for (let i = 0; i < im.data.length; i += 4) { im.data[i] = im.data[i + 1] = im.data[i + 2] = 128 + r.range(-60, 60); im.data[i + 3] = 255; } ctx.putImageData(im, 0, 0); }, { data: true, repeat: [40, L * 0.6] });
        const card = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: BOX.card, roughness: 0.93, bumpMap: tooth, bumpScale: 0.35 }));
        card.receiveShadow = true; scene.add(card);
      }

      // ---- the stacks
      const PITCH = 1.3, X0 = -2.75;
      const coinGeos = [1, 2, 3, 4, 5, 6].map((s) => coinGeo(s * 13));
      const ballGeos = [1, 2, 3].map((s) => lumpy(new THREE.SphereGeometry(BALL_R, 22, 16), { amount: 0.03, size: 0.3, seed: s * 5, dents: 3, dentSize: 0.2, dentDepth: 0.03 }));
      const dollar = K.text3d('$', { font: FONT, size: 0.6, depth: 0.09, bevel: 0.03, bevelSegments: 3 }); dollar.rotateX(-Math.PI / 2);
      const dollarGeos = [1, 2, 3].map((s) => lumpy(dollar, { amount: 0.008, size: 0.25, seed: s * 3 }));
      const mats = { own: [0, 1, 2, 3].map(() => clay(BOX.coral, { lump: 0.012, marbleSize: 0.22, marbleAmount: 0.5 })), earned: [0, 1, 2, 3].map(() => clay(BOX.yellow, { lump: 0.012, marbleSize: 0.22, marbleAmount: 0.5 })) };
      const stacks = YEARS.map((_, s) => { const g = new THREE.Group(); g.position.set(X0 + s * PITCH + rnd.range(-0.04, 0.04), 0, rnd.range(-0.06, 0.06)); scene.add(g); return { g, coins: [], top: 0, lean: [rnd.range(-0.012, 0.012), rnd.range(-0.012, 0.012)] }; });
      for (const c of plan.coins) {
        const st = stacks[c.s], th = rnd.range(0.93, 1.07), mat = rnd.pick(c.own ? mats.own : mats.earned);
        const top = c.j === plan.counts[c.s] - 1;
        c.home = [st.lean[0] * c.j + rnd.range(-0.035, 0.035), st.top + COIN_T * th / 2, st.lean[1] * c.j + rnd.range(-0.035, 0.035)];
        c.rot = [rnd.range(-0.03, 0.03), rnd.range(-0.5, 0.5) * (top ? 0.4 : 1), rnd.range(-0.03, 0.03)];
        c.th = th; st.top += COIN_T * th;
        c.coin = new THREE.Group(); c.coin.add(part(rnd.pick(coinGeos), mat));
        const d = part(rnd.pick(dollarGeos), mat); d.position.y = COIN_T / 2 - 0.036; c.coin.add(d);
        st.g.add(c.coin); st.coins.push(c);
        if (c.s) { c.ball = part(rnd.pick(ballGeos), mat); c.spin = [rnd.range(0, 6), rnd.range(0, 6)]; c.arc = [(c.j % 2 ? 1.15 : 0.5) + rnd.range(-0.08, 0.08), (c.j % 2 ? -1 : 1) * rnd.range(0.2, 0.5)]; scene.add(c.ball); }
      }
      // where each ball starts: the top of the stack before it (the coins that earned it)
      for (const c of plan.coins) if (c.s) { const from = stacks[c.s - 1]; c.from = [from.g.position.x + rnd.range(-0.15, 0.15), from.top + BALL_R * 0.6, from.g.position.z + rnd.range(-0.15, 0.15)]; }

      // ---- the sign next to the first stack: a slab with the starting amount pressed onto it
      const sign = new THREE.Group();
      {
        sign.add(part(lumpy(K.roundedBox(2.05, 1.3, 0.24, 0.12, 6), { amount: 0.035, size: 0.9, seed: 21, dents: 4, dentSize: 0.35, dentDepth: 0.03 }), clay(BOX.navy, { marbleAmount: 0.3 })));
        const a = part(lumpy(K.text3d(SIGN[0], { font: FONT, size: 0.62, depth: 0.16, bevel: 0.045, bevelSegments: 4 }), { amount: 0.012, size: 0.4, seed: 22 }), clay(BOX.cream, { marbleAmount: 0.12 }));
        const b = part(lumpy(K.text3d(SIGN[1], { font: FONT, size: 0.34, depth: 0.12, bevel: 0.03, bevelSegments: 4 }), { amount: 0.008, size: 0.3, seed: 23 }), clay(BOX.yellow, { marbleAmount: 0.25 }));
        a.position.set(0, 0.2, 0.16); b.position.set(0, -0.33, 0.15); sign.add(a, b);
        sign.position.set(X0 - 1.85, 0.62, 0.1); sign.rotation.set(-0.2, 0.16, -0.015); scene.add(sign);
      }

      // ---- the words on the backdrop: every letter (or small word) is its own lump, pressed on one after another
      const stuck = [];
      {
        const cx = -2.2, big = { font: FONT, size: 2.45, depth: 0.5, bevel: 0.15, bevelSegments: 5 };
        K.text3dLetters(RESULT, big).forEach((L, i) => {
          const m = part(lumpy(L.geometry, { amount: 0.04, size: 0.9, seed: 40 + i, dents: 2, dentSize: 0.4, dentDepth: 0.03 }), clay(BOX.cream, { marbleAmount: 0.18 }));
          stuck.push({ m, land: plan.digits[i].land, at: [cx + L.x, 3.2 + L.y + rnd.range(-0.04, 0.04), WALL], depth: 0.5, tilt: rnd.range(-0.035, 0.035), id: 300 + i }); scene.add(m);
        });
        const small = { font: FONT, size: 0.8, depth: 0.22, bevel: 0.07, bevelSegments: 4 }, cap = CAPTION.join(' ');
        const letters = K.text3dLetters(cap, small); let k = 0;
        plan.words.forEach((w, wi) => {
          const mine = letters.filter((L) => L.index >= k && L.index < k + w.text.length); k += w.text.length + 1;
          const x0 = (mine[0].x + mine[mine.length - 1].x) / 2, grp = new THREE.Group(), mat = clay(BOX.yellow, { marbleAmount: 0.25 });
          mine.forEach((L, i) => { const m = part(lumpy(L.geometry, { amount: 0.014, size: 0.4, seed: 60 + wi * 9 + i }), mat); m.position.set(L.x - x0, L.y + rnd.range(-0.015, 0.015), 0); m.rotation.z = rnd.range(-0.04, 0.04); grp.add(m); });
          stuck.push({ m: grp, land: w.land, at: [cx + x0, 5.2, WALL], depth: 0.22, tilt: rnd.range(-0.02, 0.02), id: 400 + wi }); scene.add(grp);
        });
      }

      // ---- camera: one continuous dolly. Macro on the sign and the first stack, then it travels with the growing stacks,
      // pulls back to show the whole curve as the words go up, and ends on a slight push-in
      const cam = {
        pos: K.path([[0, [-4.35, 2.05, 4.9]], [1.1, [-2.9, 2.0, 7.3]], [2.0, [-0.6, 2.1, 7.7]], [3.0, [2.1, 2.3, 8.7]], [4.0, [3.4, 2.7, 11.3]], [5.3, [0.6, 2.95, 15.3]], [8, [0.5, 2.85, 14.5]]]),
        aim: K.path([[0, [-3.9, 0.52, 0]], [1.1, [-2.55, 0.9, 0]], [2.0, [-0.2, 1.25, 0]], [3.0, [2.45, 1.75, 0]], [4.0, [3.6, 2.55, 0]], [5.3, [-0.1, 2.6, -1.2]], [8, [-0.1, 2.6, -1.2]]]),
        focus: K.path([[0, [-4.25, 0.7, 0.2]], [1.1, [-2.55, 0.9, 0]], [4.0, [3.6, 2.55, 0]], [5.3, [-0.1, 2.6, -1.2]], [8, [-0.1, 2.6, -1.2]]]),   // between the sign and the first stack, then the stacks, then just behind them so the wall words stay crisp
        ap: K.track([[0, 0.05], [1.1, 0.06], [4.0, 0.05], [5.3, 0.04], [8, 0.04]]),
      };
      const SQUASH = [0.045, 0.02, 0.008];       // how far (world units) a stack gives way on the three poses after something lands on it

      return {
        update(t) {
          const tq = pose(t);                    // the clay's clock

          stacks.forEach((st, si) => {
            // a stack gives way a little under whatever just landed on it, stretches as it sends a ball off to the next
            // stack, and is never put back exactly where it was
            let drop = 0, busy = false, height = COIN_T;
            for (const c of st.coins) { const a = since(tq, c.land); if (a >= 0 && a <= 2) drop += SQUASH[a]; if (a >= -1 && a <= 4) busy = true; if (a >= 1) height = c.home[1]; }
            if (stacks[si + 1]) for (const c of stacks[si + 1].coins) { const a = since(tq, c.land); if (a === -5) { drop -= 0.03; busy = true; } else if (a === -4) drop += 0.012; }
            const sy = 1 - K.clamp(drop, -0.045, 0.07) / Math.max(height, 0.5), sx = 1 + (1 - sy) * 0.5;
            st.g.scale.set(sx, sy, sx);
            st.g.rotation.set(busy ? nudge(si + 0.1, tq, 0.006) : 0, busy ? nudge(si + 0.5, tq, 0.03) : 0, busy ? nudge(si + 0.25, tq, 0.006) : 0);
            for (const c of st.coins) {
              const a = since(tq, c.land);       // poses since this coin touched down
              // replacement animation: a ball in the air (a < 0), then the coin in four shapes: a thick puck on contact, pressed too flat, springing back, at rest
              const flat = a === 0 ? [0.74, 1.8] : a === 1 ? [1.1, 0.74] : a === 2 ? [0.965, 1.08] : [1, 1];
              c.coin.visible = a >= 0;
              c.coin.position.set(c.home[0], c.home[1] - COIN_T * c.th * (1 - flat[1]) / 2, c.home[2]);
              c.coin.rotation.set(c.rot[0], c.rot[1], c.rot[2]); c.coin.scale.set(flat[0], flat[1] * c.th, flat[0]);
              if (!c.ball) continue;
              c.ball.visible = a >= -5 && a < 0;
              const to = st.g.position, floor = (c.home[1] - COIN_T * c.th / 2) * sy;      // the top of the stack right now
              if (a === -5) {                    // it buds on top of the stack that earned it...
                c.ball.position.set(c.from[0], c.from[1] - BALL_R * 0.25, c.from[2]); c.ball.rotation.set(0, c.spin[1], 0); c.ball.scale.set(1.18, 0.74, 1.18);
              } else if (a < 0) {                // ...and takes four poses to hop over on an arc
                const u = (a + 5) / 5, y1 = floor + BALL_R, hop = 4 * u * (1 - u);
                c.ball.position.set(K.lerp(c.from[0], to.x + c.home[0], u), K.lerp(c.from[1], y1, u) + (0.7 + 0.1 * Math.abs(y1 - c.from[1])) * c.arc[0] * hop, K.lerp(c.from[2], to.z + c.home[2], u) + c.arc[1] * hop);
                c.ball.rotation.set(c.spin[0] + u * 3, c.spin[1], u * 2); c.ball.scale.set(0.94, 1.1, 0.94);
              }
            }
          });

          for (const w of stuck) {               // pressed onto the backdrop: thrown on wide and flat, springs out, settles
            const a = since(tq, w.land), s = a === 0 ? [1.2, 0.45] : a === 1 ? [0.93, 1.22] : a === 2 ? [1.03, 0.94] : [1, 1], loose = K.clamp(1 - a / 5);
            w.m.visible = a >= 0;
            w.m.scale.set(s[0], s[0], s[1]);
            w.m.position.set(w.at[0] + nudge(w.id, tq, 0.02) * loose, w.at[1] + nudge(w.id + 0.3, tq, 0.02) * loose, w.at[2] + w.depth * s[1] / 2 - 0.03);
            w.m.rotation.z = w.tilt + nudge(w.id + 0.6, tq, 0.07) * loose;
          }

          key.intensity = KEY * (1 + nudge(1, tq, 0.012));      // single frames never get exactly the same exposure
          K.look(camera, cam.pos(t), cam.aim(t)); K.focus(camera, cam.focus(t), cam.ap(t));   // the camera glides in real time
        },
      };
    },

    sound(k) {
      const K = globalThis.K, plan = schedule(), r = K.rng(5);
      const NOTES = [0, 2, 4, 7, 9];                                   // a pentatonic scale: every coin lands one step higher than the last
      const plop = (t, j, pan, gain) => {                              // soft clay on soft clay: a low thump with a short pitched body
        const f = 196 * Math.pow(2, (NOTES[j % 5] + 12 * Math.floor(j / 5)) / 12 / 2.2);
        k.tone(t, { f: [[0, f * 1.5], [0.05, f]], dur: 0.16, gain: 0.2 * gain, pan, a: 0.004 });
        k.tone(t, { f: [[0, 150], [0.07, 70]], dur: 0.1, gain: 0.22 * gain, pan });
        k.noise(t, { dur: 0.035, color: 'brown', filter: 'lowpass', f: 900, gain: 0.3 * gain, pan });
      };
      // several coins can land on one pose: sound the highest of them, a little louder
      const hits = new Map();
      for (const c of plan.coins) if (c.s) { const h = hits.get(c.land) || { j: 0, n: 0, s: c.s }; h.j = Math.max(h.j, c.j); h.n++; hits.set(c.land, h); }
      k.withMinor(() => { for (const [t, h] of hits) plop(t, h.j, K.map(h.s, 0, YEARS.length - 1, -0.5, 0.6), 0.75 + 0.2 * h.n + r.range(-0.08, 0.08)); });
      YEARS.forEach((_, s) => { if (s) k.play('swish', Math.min(...plan.coins.filter((c) => c.s === s).map((c) => c.land)) - 4 / POSES, { gain: 0.35 + 0.05 * s, pan: K.map(s, 0, YEARS.length - 1, -0.5, 0.6) }); });   // each new batch takes off
      plan.words.forEach((w, i) => { k.play('slap', w.land, { gain: 0.45, pan: -0.25 }); k.play('pop', w.land, { gain: 0.5, f: 520 + i * 70, pan: -0.25 }); });
      plan.digits.forEach((d, i) => { k.play('press', d.land, { gain: 0.75, pan: -0.4 + i * 0.1 }); k.play('slap', d.land, { gain: 0.5, pan: -0.4 + i * 0.1 }); k.play('pop', d.land, { gain: 0.6, f: 330 * Math.pow(2, NOTES[i % 5] / 12), pan: -0.4 + i * 0.1 }); });
      k.play('success', plan.end + 3 / POSES, { gain: 0.7, f: 'G5' });
      k.bed('room', 0, 8, { gain: 0.9 });
      k.music('pad', 0, 8, { bpm: 60, gain: 0.45, chords: [['G3', 'B3', 'D4', 'A4'], ['C4', 'E4', 'G4', 'D5']] });
    },
  });
}
```
