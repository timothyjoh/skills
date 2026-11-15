# Domino Chain (#26)

- **id:** `domino-chain`
- **Category:** Machines that explain
- **Use:** explainer
- **Reference duration:** 8 s
- **Google Fonts:** Anton, Oswald, Fraunces
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`

## Style card

- **Look:** A row of hand-made dominoes on a polished walnut table: bone faces riveted to ebony backs, each engraved and paint-filled with one step of the story, the last one in red. When a domino falls its label lies down the right way up, so the fallen row reads like a chart.
- **Motion:** Each domino hesitates, tips, accelerates, strikes the next at the right moment and comes to rest leaning on it. Small ones go in quick ticks and big ones fall slowly, so the run has a natural ritardando that ends on one heavy landing.
- **Light:** One low warm lamp behind the start of the row, so every domino throws a long soft shadow up the face of the next one and across the table, and its own face brightens as it tips; a faint cool fill from the camera side; the table falls off into darkness.
- **Materials:** Bone with a soft lacquer and black or red paint in the engraving, ebony backs, a French-polished walnut top that reflects the row, and one matchstick for scale.
- **Camera:** A long lens that travels with the falling front like a tracking shot and backs away as the dominoes grow, rising from table height to a high three-quarter view. Shallow focus on the domino that is falling.
- **Finish:** Real motion blur and depth of field, long soft shadows, filmic contrast, a warm vignette and fine grain.
- **Good for:** Cause and effect, chain reactions, step-by-step plans and anything that compounds: every domino is one step, printed with a word or a number, and the fall carries the story from the first to the last. Sizes can grow, the row can bend and branch.

## Reference

- **Sample topic:** Small starts, big finishes: a domino can knock over one 1.5 times its size, so 13 dominoes take you from 5 mm to 65 cm
- **Gallery description:** A row of hand-made dominoes on a polished walnut table: bone faces riveted to ebony backs, each engraved and paint-filled with one step of the story, the last one in red. When a domino falls its label lies down the right way up, so the fallen row reads like a chart.
- **Shown in the sample clip:** Small starts, big finishes: a domino can knock over one 1.5 times its size, so 13 dominoes take you from 5 mm to 65 cm

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/domino-chain.js`)

```js
{
  // ---------------------------------------------------------------- content (change this for a new topic)
  // One entry per domino, in the order they fall. `label` is printed large on the face and `sub` small beside it.
  // Optional per step: size (height, default 1), turn (degrees the row bends at this domino), from (index of the
  // domino that knocks this one over, default the one before: point two steps at the same `from` to branch the row),
  // hero (true = red print, for the step the story is about).
  // A plain cause-and-effect list is just:  [{ label: 'IDEA' }, { label: 'DRAFT' }, { label: 'EDIT' }, { label: 'SHIP', hero: true }]
  const GROW = 1.5, FIRST_MM = 5, COUNT = 13;      // each domino is 1.5x the one before; the first is 5 mm tall
  const STEPS = Array.from({ length: COUNT }, (_, i) => {
    const k = Math.pow(GROW, i), mm = FIRST_MM * k;
    return { label: '×' + (k < 10 ? +k.toFixed(1) : Math.round(k)), sub: mm < 100 ? +mm.toPrecision(2) + ' mm' : Math.round(mm / 10) + ' cm', size: k, hero: i === COUNT - 1 };
  });
  const CAPTION = ['A domino can topple\none 1.5× its size', COUNT + ' dominoes later:\n' + Math.round(Math.pow(GROW, COUNT - 1) / 10) * 10 + '× taller'];   // opening line, closing line
  const MATCH = true;                              // a matchstick by the first domino, so the eye knows how small the start is

  // ---------------------------------------------------------------- the chain (pure functions: picture and sound share them)
  const WIDE = 0.5, THICK = 0.17, GAP = 0.45;      // a domino's width and thickness and the space to the next one, as fractions of its height
  const START = 0.3;                               // when the first domino is nudged, seconds
  const TIP = 0.0917;                              // time scale of a domino of height 1; a domino of height h is sqrt(h) slower, as gravity has it

  // One fall: the angle from upright over time (time in units of the domino's own scale). It is a block tipping over
  // its front edge under gravity, angle'' = sin(angle - a). The centre of mass starts behind that edge (a), so a struck
  // domino hesitates, passes its balance point and only then accelerates: that hesitation is what gives it weight.
  // A domino with nothing in front of it lands flat and bounces once or twice.
  function fallCurve(push) {
    const du = 0.002, a = Math.atan(THICK), th = [0];
    for (let x = 0, v = push; x < Math.PI / 2;) { v += Math.sin(x - a) * du; x += v * du; th.push(Math.min(x, Math.PI / 2)); }
    const land = (th.length - 1) * du;
    return {
      land,
      at(u) {
        if (u <= 0) return 0;
        if (u >= land) return Math.PI / 2 - 0.028 * Math.exp(-4 * (u - land)) * Math.abs(Math.sin(BOUNCE * (u - land)));
        const f = u / du, i = Math.floor(f); return th[i] + (th[i + 1] - th[i]) * (f - i);
      },
      time(angle) { let i = 0; while (th[i] < angle) i++; return i * du; },
    };
  }
  const BOUNCE = 9;
  // Side view of one domino as a rectangle standing on its front edge at x0 and leaning by `lean`.
  const sideView = (x0, h, lean) => { const c = Math.cos(lean), s = Math.sin(lean); return [[0, 0], [-THICK * h, 0], [-THICK * h, h], [0, h]].map(([x, y]) => [x0 + x * c + y * s, y * c - x * s]); };
  function overlap(A, B) {                          // separating-axis test for two rectangles
    for (const R of [A, B]) for (let k = 0; k < 2; k++) {
      const ax = R[k + 1][0] - R[k][0], ay = R[k + 1][1] - R[k][1];
      let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
      for (const p of A) { const q = p[0] * ax + p[1] * ay; a0 = Math.min(a0, q); a1 = Math.max(a1, q); }
      for (const p of B) { const q = p[0] * ax + p[1] * ay; b0 = Math.min(b0, q); b1 = Math.max(b1, q); }
      if (a1 <= b0 || b1 <= a0) return false;
    }
    return true;
  }
  // How far domino p can lean before it touches the next one, c, which itself leans by `cLean`. This one function
  // gives the moment of the strike (cLean = 0), the push while both move, and the final rest leaning on each other.
  function leanOn(p, c, cLean) {
    const B = sideView(c.ahead, c.h, cLean);
    let lo = 0, hi = Math.PI / 2;
    for (let k = 0; k < 22; k++) { const mid = (lo + hi) / 2; if (overlap(sideView(0, p.h, mid), B)) hi = mid; else lo = mid; }
    return lo;
  }
  // Lay the steps out along the path and work out when each one is struck. angles(t) then gives every domino's lean
  // at any time, exactly: its own free fall, held back by whatever it is leaning on.
  function makeChain(steps) {
    const nudged = fallCurve(0.2), struck = fallCurve(0.5);   // the first one is barely pushed; the rest get a real knock
    const dom = steps.map((s, i) => ({ ...s, i, h: s.size || 1, kids: [] }));
    dom.forEach((d, i) => {
      const p = i ? dom[d.from == null ? i - 1 : d.from] : null;
      d.T = TIP * Math.sqrt(d.h); d.fall = p ? struck : nudged; d.parent = p;
      if (!p) { d.x = d.z = d.yaw = 0; d.hit = START; return; }
      d.yaw = p.yaw + (d.turn || 0) * Math.PI / 180;
      d.ahead = GAP * Math.min(p.h, d.h) + THICK * d.h;        // from the parent's front edge to this one's front edge
      d.x = p.x + Math.cos(d.yaw) * d.ahead; d.z = p.z - Math.sin(d.yaw) * d.ahead;
      d.hit = p.hit + p.T * p.fall.time(leanOn(p, d, 0));
      p.kids.push(d);
    });
    for (const d of dom) d.land = d.kids.length ? null : d.hit + d.T * d.fall.land;   // only the ends of the row reach the table
    const angles = (t) => {
      const a = new Array(dom.length);
      for (let i = dom.length - 1; i >= 0; i--) {
        const d = dom[i]; let lean = d.fall.at((t - d.hit) / d.T);
        for (const c of d.kids) lean = Math.min(lean, leanOn(d, c, a[c.i]));
        a[i] = lean;
      }
      return a;
    };
    const line = []; for (let d = dom[dom.length - 1]; d; d = d.parent) line.unshift(d);   // the row the camera follows: first domino to last step
    return { dom, angles, line, last: dom[dom.length - 1] };
  }

  // ---------------------------------------------------------------- the table: walnut drawn in the shader
  // The shot ends 130 times wider than it starts, so no texture has enough pixels. The grain is noise summed over many
  // scales, and each scale is only drawn while it is bigger than a pixel and smaller than the frame.
  const WOOD = `
    uniform vec3 uFrame;   // table position at the centre of the shot (x, z) and the size of the shot
    float wHash(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
    float wNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0); return mix(mix(wHash(i), wHash(i + vec2(1, 0)), f.x), mix(wHash(i + vec2(0, 1)), wHash(i + vec2(1, 1)), f.x), f.y); }
    vec4 wood(vec2 p, float px){
      float tone = 0.0, streak = 0.0;
      for (int k = 0; k < 17; k++) {
        float f = exp2(float(k)) / 900.0, s = px * f;
        float keep = (1.0 - smoothstep(0.03, 0.14, s)) * smoothstep(0.0004, 0.006, s);
        vec2 q = vec2(p.x * 0.09, p.y) * f + float(k) * 7.31;
        float n = wNoise(q + 0.6 * wNoise(q * 0.5 + 3.1));
        tone += keep * (n - 0.5);
        streak += keep * smoothstep(0.7, 0.95, wNoise(q * vec2(0.5, 3.1) + 19.7)) * smoothstep(0.004, 0.03, s);
      }
      float t = clamp(0.5 + tone * 0.16, 0.0, 1.0);
      vec3 c = mix(vec3(0.020, 0.008, 0.004), vec3(0.115, 0.048, 0.02), t);
      c *= 1.0 - 0.5 * clamp(streak * 0.6, 0.0, 1.0);
      return vec4(c, 0.42 + 0.08 * t + 0.1 * clamp(streak, 0.0, 1.0));
    }`;

  registerStyle({
    id: 'domino-chain',
    name: 'Domino Chain',
    family: 'Machines that explain',
    look: 'A row of hand-made dominoes on a polished walnut table: bone faces riveted to ebony backs, each engraved and paint-filled with one step of the story, the last one in red. When a domino falls its label lies down the right way up, so the fallen row reads like a chart.',
    motion: 'Each domino hesitates, tips, accelerates, strikes the next at the right moment and comes to rest leaning on it. Small ones go in quick ticks and big ones fall slowly, so the run has a natural ritardando that ends on one heavy landing.',
    light: 'One low warm lamp behind the start of the row, so every domino throws a long soft shadow up the face of the next one and across the table, and its own face brightens as it tips; a faint cool fill from the camera side; the table falls off into darkness.',
    materials: 'Bone with a soft lacquer and black or red paint in the engraving, ebony backs, a French-polished walnut top that reflects the row, and one matchstick for scale.',
    camera: 'A long lens that travels with the falling front like a tracking shot and backs away as the dominoes grow, rising from table height to a high three-quarter view. Shallow focus on the domino that is falling.',
    post: 'Real motion blur and depth of field, long soft shadows, filmic contrast, a warm vignette and fine grain.',
    explains: 'Cause and effect, chain reactions, step-by-step plans and anything that compounds: every domino is one step, printed with a word or a number, and the fall carries the story from the first to the last. Sizes can grow, the row can bend and branch.',
    topic: 'Small starts, big finishes: a domino can knock over one 1.5 times its size, so 13 dominoes take you from 5 mm to 65 cm',
    duration: 8,
    fonts: ['400 200px "Anton"', '500 100px "Oswald"', 'italic 500 64px "Fraunces"'],
    render: { samples: 40, shutter: 0.5, tone: 'filmic', exposure: 1.0, bloom: 0.2, bloomThreshold: 1.3, vignette: 0.42, grain: 0.022, fov: 32, far: 900, background: '#060403' },

    build(S) {
      const { THREE, K, scene, camera } = S;
      const chain = makeChain(STEPS), { dom, line, last } = chain;
      // Everything on the table lives in `world`. The shot never moves the lights or the lens to follow the row:
      // it slides and shrinks this group instead, so the lamp, the shadows and the focus stay tuned at every size.
      const world = new THREE.Group(); scene.add(world);

      // ---- light: a dark room, one low warm lamp behind the row, a big dim softbox above for the lacquer to reflect
      K.env(S, { top: '#0c0806', horizon: '#2e1c10', bottom: '#040302', intensity: 0.75, background: true, backgroundBlur: 0.8, backgroundIntensity: 0.6, panels: [
        { pos: [-14, 8, -12], size: [9, 6], color: '#ffd2a0', power: 7 },
        { pos: [4, 14, 2], size: [16, 8], color: '#ffe6cc', power: 1.6 },
        { pos: [12, 4, 13], size: [4, 9], color: '#a9c1e6', power: 1.3 },
      ] });
      K.spot(S, { pos: [-9.5, 4.6, -5.5], target: [0.3, 0, 0.2], color: '#ffc48a', power: 1250, angle: 0.5, penumbra: 0.85, soft: 0.45, mapSize: 4096 });
      K.spot(S, { pos: [5, 6, 9], target: [0, 0, 0], color: '#b9c9ee', power: 260, angle: 0.8, penumbra: 1, shadow: false });

      // ---- table
      const frame = { value: new THREE.Vector3(0, 0, 1) };
      const table = K.mirrorFloor(S, { color: '#ffffff', surfaceRoughness: 0.4, roughness: 0.22, strength: 0.42, fresnel: true, size: 120 });
      const mirrorHook = table.material.onBeforeCompile;
      table.material.onBeforeCompile = (sh) => {
        mirrorHook(sh); sh.uniforms.uFrame = frame;
        sh.fragmentShader = sh.fragmentShader.replace(/void\s+main\s*\(\s*\)\s*\{/, WOOD + '\nvoid main() {')
          .replace('#include <color_fragment>', '#include <color_fragment>\nvec2 wp = vMirrorWorld.xz * uFrame.z + uFrame.xy; vec4 wd = wood(wp, length(fwidth(wp))); diffuseColor.rgb = wd.rgb;')
          .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = wd.a;');
      };

      // ---- dominoes: a bone face riveted to an ebony back. The print runs up the face, so it reads from the side once fallen.
      const FW = 512, FH = 1024;
      const measure = document.createElement('canvas').getContext('2d'); measure.font = '400 200px "Anton"';
      const fit = Math.min(300, 200 * 0.5 * FH / Math.max(...STEPS.map((s) => measure.measureText(s.label).width)));   // one type size for the whole row
      const CAP = measure.measureText('H').actualBoundingBoxAscent / 200 * fit, SUB = 96, SUBCAP = SUB * 0.82;
      // The face, bottom to top: the step number in a ring (hidden once the domino before leans on it), a rule, then
      // the label with its small line under it, in the part that stays visible when the row has fallen.
      const printFace = (ctx, s, ink, red) => {
        ctx.save(); ctx.translate(FW / 2, FH); ctx.rotate(-Math.PI / 2);        // x now runs up the domino, y across it
        ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = ctx.strokeStyle = ink;
        ctx.font = '400 120px "Anton"'; ctx.fillText(String(s.i + 1), 0.2 * FH, 44);
        ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0.2 * FH, 0, 112, 0, Math.PI * 2); ctx.stroke();
        ctx.fillRect(0.395 * FH - 4, -0.36 * FW, 8, 0.72 * FW);
        const block = CAP + (s.sub ? 44 + SUBCAP : 0);
        ctx.fillStyle = s.hero ? red : ink; ctx.font = `400 ${fit}px "Anton"`; ctx.fillText(s.label, 0.69 * FH, -block / 2 + CAP);
        if (s.sub) { ctx.font = `500 ${SUB}px "Oswald"`; ctx.letterSpacing = '5px'; ctx.fillStyle = s.hero ? ink : red; ctx.fillText(s.sub, 0.69 * FH, block / 2); }
        ctx.restore();
      };
      const bone = new THREE.MeshPhysicalMaterial({ color: '#e7dabd', roughness: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.28 });
      const ebony = new THREE.MeshPhysicalMaterial({ color: '#17100c', roughness: 0.34, clearcoat: 0.8, clearcoatRoughness: 0.2 });
      const boneGeo = K.roundedBox(THICK * 0.56, 1, WIDE, 0.022, 4), ebonyGeo = K.roundedBox(THICK * 0.47, 1, WIDE, 0.022, 4);
      for (const d of dom) {
        const r = K.rng(d.i + 3);
        const map = K.canvasTex(FW, FH, (ctx) => {
          const g = ctx.createLinearGradient(0, 0, FW, 0); g.addColorStop(0, '#e4d6b6'); g.addColorStop(0.5, '#efe4ca'); g.addColorStop(1, '#e2d3b2');
          ctx.fillStyle = g; ctx.fillRect(0, 0, FW, FH);
          for (let k = 0; k < 70; k++) { ctx.fillStyle = `rgba(120,90,50,${r.range(0.015, 0.06)})`; ctx.fillRect(r.range(0, FW), r.range(-200, FH), r.range(1, 3), r.range(120, 600)); }   // the grain of bone
          printFace(ctx, d, '#16110d', '#b3261a');
        });
        const bump = K.canvasTex(FW, FH, (ctx) => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, FW, FH); ctx.filter = 'blur(2.5px)'; printFace(ctx, d, '#000', '#000'); }, { data: true });
        d.face = new THREE.MeshPhysicalMaterial({ map, bumpMap: bump, roughness: 0.4, clearcoat: 0.5, clearcoatMap: bump, clearcoatRoughness: 0.28 });   // the paint sits under the lacquer line: no gloss on it
        d.pivot = new THREE.Group(); d.pivot.position.set(d.x, 0, d.z); d.pivot.rotation.y = d.yaw;   // stands on its front edge
        d.tilt = new THREE.Group(); d.tilt.scale.setScalar(d.h); d.pivot.add(d.tilt); world.add(d.pivot);
        const a = new THREE.Mesh(boneGeo, [bone, d.face, bone, bone, bone, bone]); a.position.set(-THICK * 0.72, 0.5, 0);
        const b = new THREE.Mesh(ebonyGeo, ebony); b.position.set(-THICK * 0.235, 0.5, 0);
        for (const m of [a, b]) { m.castShadow = m.receiveShadow = true; d.tilt.add(m); }
      }

      // ---- the match: a real one is 43 mm long, and the first domino is 5 mm tall, so it lies there like a log
      if (MATCH) {
        const U = 1 / FIRST_MM, match = new THREE.Group(); match.position.set(3.6, 0, -8.2); match.rotation.set(0, 2.6, -0.0126); world.add(match);
        const part = (geo, mat, x, y) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, 0); m.castShadow = m.receiveShadow = true; match.add(m); };
        const aspen = K.canvasTex(512, 64, (ctx) => { const r = K.rng(8); ctx.fillStyle = '#d9c39a'; ctx.fillRect(0, 0, 512, 64); for (let k = 0; k < 60; k++) { ctx.fillStyle = `rgba(110,80,40,${r.range(0.04, 0.14)})`; ctx.fillRect(r.range(-100, 512), r.range(0, 64), r.range(60, 400), r.range(1, 3)); } });
        part(K.roundedBox(43 * U, 2.2 * U, 2.2 * U, 0.2 * U, 2), new THREE.MeshStandardMaterial({ map: aspen, roughness: 0.75 }), 22.5 * U, 1.62 * U);
        part(new THREE.SphereGeometry(1.6 * U, 40, 24).scale(1.6, 1, 1), new THREE.MeshStandardMaterial({ color: '#8a1d14', roughness: 0.8 }), 1.6 * U, 1.62 * U);
      }

      // ---- the shot. `follow` is the falling front: where it is on the table and how big the domino there is. The
      // camera itself is written in units of that domino (1 = its height), so the same move fits any row.
      const along = (d, k) => [d.x + Math.cos(d.yaw) * k * d.h, d.z - Math.sin(d.yaw) * k * d.h];
      const follow = K.path([[0, [line[0].x, line[0].z, Math.log(line[0].h)]], ...line.slice(1).map((d) => [d.hit, [d.x, d.z, Math.log(d.h)]]), [last.land, [...along(last, 0.2), Math.log(last.h * 1.15)]]]);
      const wide = last.parent ? last.parent.hit : last.hit / 2;   // by the time the last-but-one is struck, the shot is wide enough to hold the last one whole
      const cam = {
        pos: K.path([[0, [-1.75, 0.8, 2.75]], [wide, [-1.75, 1.25, 3.0]], [last.hit, [-1.25, 1.05, 2.3]], [last.land, [-0.72, 1.7, 1.85]], [S.duration, [-0.62, 1.72, 1.74]]]),
        aim: K.path([[0, [0.55, 0.62, 0]], [wide, [0.4, 0.74, 0]], [last.hit, [-0.1, 0.5, 0]], [last.land, [-0.34, 0.05, 0]], [S.duration, [-0.33, 0.04, 0]]]),
        lens: K.path([[0, 0.036], [wide, 0.036], [last.hit, 0.03], [last.land, 0.012], [S.duration, 0.01]]),
      };

      return {
        update(t) {
          const lean = chain.angles(t), [fx, fz, fs] = follow(t), size = Math.exp(fs);
          world.scale.setScalar(1 / size); world.position.set(-fx / size, 0, -fz / size);
          frame.value.set(fx, fz, size);
          for (const d of dom) { d.tilt.rotation.z = -lean[d.i]; d.face.bumpScale = 0.9 * d.h / size; }   // engraving depth stays in proportion
          const aim = cam.aim(t);
          K.look(camera, cam.pos(t), aim); K.focus(camera, aim, cam.lens(t));
        },
        overlay(ctx, t, W, H) {
          const say = (text, a) => {
            if (a <= 0) return;
            ctx.globalAlpha = a; ctx.font = 'italic 500 64px "Fraunces"'; ctx.textBaseline = 'alphabetic';
            ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 18; ctx.fillStyle = '#f4ead4';
            text.split('\n').forEach((l, i) => ctx.fillText(l, 108, 166 + i * 80 + (1 - a) * 12));
            ctx.shadowBlur = 0; ctx.fillStyle = '#d0562f'; ctx.fillRect(110, 82, 64 * a, 5);
          };
          say(CAPTION[0], K.seg(t, 0.15, 0.6, K.ease.out) * (1 - K.seg(t, 2.0, 2.5)));
          say(CAPTION[1], K.seg(t, last.land + 0.1, last.land + 0.55, K.ease.out));
        },
      };
    },

    sound(k) {
      const K = globalThis.K, { dom, last } = makeChain(STEPS), top = Math.log(last.h) || 1;
      k.bed('room', 0, 8, { gain: 0.25 });
      k.play('tick', START, { gain: 0.3, f: 6200, pan: -0.25 });
      // every strike is a clack whose pitch falls and whose body grows with the size of the domino that is hit
      for (const d of dom) {
        if (!d.parent) continue;
        const w = K.clamp(Math.log(d.h) / 4.9), f = 4300 * Math.pow(d.h, -0.56), pan = -0.3 + 0.5 * Math.log(d.h) / top;
        k.noise(d.hit, { dur: 0.014 + 0.1 * w, filter: 'bandpass', f, q: 3.5, gain: 0.32 + 0.3 * w, pan });
        k.tone(d.hit, { f: [[0, f * 0.6], [0.03 + 0.12 * w, f * 0.48]], dur: 0.035 + 0.2 * w, gain: 0.14 + 0.26 * w, pan });
        if (w > 0.45) k.play('thud', d.hit, { gain: (w - 0.45) * 0.9, f: 170 - 80 * w, pan });
      }
      // the last one: air, then the slam on the table, its bounces and the row settling
      for (const d of dom) {
        if (d.land == null) continue;
        const g = K.clamp(0.35 + 0.65 * Math.log(d.h) / 4.9);
        k.play('whoosh', d.land - 0.62, { dur: 0.66, gain: 0.55 * g, top: 900, pan: 0.2 });
        k.play('impact', d.land, { gain: 1.7 * g, f: 95, pan: 0.2 }); k.play('slap', d.land, { gain: 1.0 * g, pan: 0.2 });
        k.noise(d.land, { dur: 0.4, color: 'brown', filter: 'lowpass', f: 700, gain: 1.2 * g, pan: 0.2 });
        for (let n = 1; n <= 2; n++) k.play('thud', d.land + n * Math.PI / BOUNCE * d.T, { gain: 0.2 * g / n / n, f: 110, pan: 0.2 });
        k.withMinor(() => { for (let n = 0; n < 5; n++) k.play('tock', d.land + 0.07 + n * 0.055, { gain: 0.16 * g / (1 + n), f: 1400 + n * 310, pan: -0.3 + n * 0.1 }); });
      }
      // one held chord that resolves when the last domino lands
      k.music('pad', 0, last.land, { bpm: 240 / last.land, chords: [['D3', 'G3', 'A3', 'E4']], gain: 0.2 });
      k.music('pad', last.land, 8.2, { bpm: 240 / (8.2 - last.land), chords: [['D3', 'F#3', 'A3', 'D4']], gain: 0.35 });
    },
  });
}
```
