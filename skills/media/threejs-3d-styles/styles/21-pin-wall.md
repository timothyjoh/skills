# Pin Wall (#21)

- **id:** `pin-wall`
- **Category:** Flat content made physical
- **Use:** explainer
- **Reference duration:** 10 s
- **Google Fonts:** Oswald, Inter
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`

## Style card

- **Look:** A pin-art toy the size of a wall, laid out like a relief model: tens of thousands of steel pins with rounded heads in a tight honeycomb, held in a dark bolted frame. The pin heights form a landscape you could put your hand on, and groups of pins carry a tint for what they stand for (here blue for sea, warm for rock, glowing orange for lava).
- **Motion:** The relief never stops moving. It is one height field that changes over time: swell travels across it, shapes push up from below, rings run outwards, and every pin follows a moment late with a little bounce, so anything sudden shivers and settles. What is finished stands still, what is alive keeps moving.
- **Light:** One low raking light from the far left, so every height difference throws a long soft shadow and every lit head carries a glint; a blue light from the opposite side fills the shadows; a small warm light sits wherever the relief glows.
- **Materials:** Satin steel pins with polished domed heads and darker shafts, tinted like anodised metal; a powder-coated black frame with bolts.
- **Camera:** One slow continuous crane seen from a raised three-quarter angle: it starts low, looking across the pin heads with shallow focus, and rises and drifts round the subject until the whole relief reads. The relief fills the frame the whole time.
- **Finish:** Real motion blur on the pins, depth of field in the low pass, bloom on the glints and on anything hot, filmic contrast, vignette, fine grain.
- **Good for:** Anything that can be shown as a moving relief or a moving greyscale picture: terrain, waves, growth, charts that rise, shapes that morph into each other. The content is one height function, relief(pin, time), which says how far each pin stands out and which tint it carries. A beat is a change in the relief that follows from the one before (calm, something rises, it breaks through, the result). Words are one short caption per beat on a small plate at the bottom; the pins never form words.

## Reference

- **Sample topic:** How a volcanic island is born
- **Gallery description:** A pin-art toy the size of a wall, laid out like a relief model: tens of thousands of steel pins with rounded heads in a tight honeycomb, held in a dark bolted frame. The pin heights form a landscape you could put your hand on, and groups of pins carry a tint for what they stand for (here blue for sea, warm for rock, glowing orange for lava).
- **Shown in the sample clip:** How a volcanic island is born

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/pin-wall.js`)

```js
{
  // ---------------------------------------------------------------- content (change this for a new topic)
  // The wall shows ONE MOVING RELIEF. Three small functions describe it, in wall units (the field is WALL_W x WALL_H
  // with the origin in the middle, a pin is 0.1 wide, heights are in the same units):
  //   setup(x, y)          once per pin: everything about that spot that never changes (distances, noise, phases)
  //   moment(t)            once per moment: everything that is the same for all pins (how far the story has got)
  //   relief(p, m, t, o)   per pin, per moment: fill o.lift (how far the pin stands out), o.land (0 = first tint,
  //                        1 = second tint), o.pale (0..1, lightens the first tint) and o.hot (0..1, glow)
  // It must be a pure function of t (no state kept between calls), because every frame is built from many moments.
  // Here: a patch of sea and the seafloor under it. A pin shows whichever is higher, the water or the rock.
  // To show a drawn picture instead (a chart, a shape that morphs), draw it in greys on a canvas, read it back with
  // getImageData and return its grey as o.lift: the pins do not care where the height comes from.
  const DURATION = 10;
  const WALL_W = 20.6, WALL_H = 15.4;
  const BEATS = [                                   // one short caption per beat, on the plate at the bottom
    { at: 0.0, say: 'Open sea' },
    { at: 1.9, say: 'Magma pushes up through the seafloor' },
    { at: 4.5, say: 'Each eruption adds more rock' },
    { at: 7.8, say: 'A new island', note: 'like Surtsey, off Iceland, in November 1963' },
  ];
  const TINTS = { deep: '#46689e', pale: '#bfe9ff', land: '#ffc890', hot: '#ff5a12' };   // sea, shallows and surf, rock, lava

  const SEA = 0.5;                                  // sea level: how far the pins stand out when the water is flat
  const VENT = [0.5, 0.9];                          // where the volcano comes up
  const SWELL = [                                   // wave trains: travel direction, crest to crest, units per second, height
    { dir: [0.8, -0.6], length: 3.4, speed: 2.1, height: 0.15 },
    { dir: [0.97, 0.26], length: 1.9, speed: 1.4, height: 0.045 },
  ];
  const BUILD = { from: 1.9, to: 4.4, start: -2.3, end: 0.34 };   // the mound grows under water: summit height from, to
  const ERUPTIONS = [                               // each one lifts the whole cone by `adds` and sends a ring across the sea
    { at: 4.5, adds: 1.4 }, { at: 5.6, adds: 1.3 }, { at: 6.7, adds: 1.2 },
  ];
  const CONE = { drop: 5.2, spread: 2.7, peak: 0.6 };          // flank shape: land = summit - drop x (1 - e^(-r / spread))
  const CRATER = { radius: 0.66, depth: 1.5 };
  const FRONT = 6;                                  // how fast an eruption's effect runs outwards (down the flank, across the sea)

  const N = K.noise(7), TAU = Math.PI * 2;
  const waves = SWELL.map((w) => ({ kx: TAU / w.length * w.dir[0], ky: TAU / w.length * w.dir[1], om: TAU / w.length * w.speed, h: w.height }));
  const lastEruption = ERUPTIONS[ERUPTIONS.length - 1];

  function setup(x, y) {
    const dx = x - VENT[0], dy = y - VENT[1], r = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
    // the island is not a perfect circle: its radius is stretched by noise (bays and headlands) and a few ribs (gullies)
    const re = r * (1 + 0.42 * N.fbm(dx * 0.4 + 7, dy * 0.4, 0, 3) + 0.045 * Math.sin(ang * 8 + 4 * N.n2(dx * 0.3, dy * 0.3)));
    const rp = Math.hypot(re, CONE.peak) - CONE.peak;                         // rounds the summit off
    const d = SWELL[0].dir, along = dx * d[0] + dy * d[1], across = dy * d[0] - dx * d[1];
    return {
      r, re,
      flank: CONE.drop * (1 - Math.exp(-rp / CONE.spread)),                  // how far below the summit the rock is here
      bowl: Math.exp(-Math.pow(r / CRATER.radius, 2)),                       // 1 in the middle of the crater, 0 outside
      over: Math.exp(-Math.pow(re / 2.8, 2)),                                // 1 right above the vent, fading out around it
      rough: 0.2 * N.fbm(x * 1.6, y * 1.6, 3, 3),                            // small bumps, so the land is not a smooth cast
      lee: K.smooth(0, 3, along) * Math.exp(-Math.pow(across / 2.7, 2) - along / 11),   // the calm water behind the island
      ph: waves.map((w) => w.kx * x + w.ky * y),
      rnd: K.hash(x * 9.1, y * 7.3),
    };
  }

  function moment(t) {
    let burst = 0, glow = 0;
    ERUPTIONS.forEach((e) => {
      const tau = t - e.at; if (tau <= 0) return;
      burst += (1 - Math.exp(-tau / 0.04)) * Math.exp(-tau / 0.3);                                   // the fountain in the crater
      glow = Math.max(glow, (1 - Math.exp(-tau / 0.05)) * Math.exp(-tau / (e === lastEruption ? 2.4 : 0.9)));   // lava light, cooling
    });
    const u = K.seg(t, BUILD.from, BUILD.to), mound = K.lerp(BUILD.start, BUILD.end, 1 - (1 - u) * (1 - u));   // fast at first, slower near the top
    return {
      mound,
      dome: K.smooth(1.9, 0.15, SEA - mound) * (1 - K.seg(t, ERUPTIONS[0].at, ERUPTIONS[0].at + 0.35)),   // the sea bulges as the mound nears the surface
      boil: K.smooth(BUILD.to - 1.7, BUILD.to, t) * (1 - K.seg(t, ERUPTIONS[0].at, ERUPTIONS[0].at + 0.35)),   // water churning over the vent
      island: K.smooth(ERUPTIONS[0].at + 0.1, ERUPTIONS[0].at + 1.3, t),                             // 1 once there is land
      burst, glow,
    };
  }

  function relief(p, m, t, o) {
    // ---- the rock. Each eruption raises the summit; the new layer runs down the flank from the top, and every pin
    // answers a moment late and with a little bounce, which is what makes the cone shiver as it grows.
    let top = m.mound, fresh = 0;
    for (const e of ERUPTIONS) {
      const tau = t - e.at - p.r / FRONT - p.rnd * 0.05;
      if (tau <= 0) continue;
      top += e.adds * (tau > 2 ? 1 : K.spring(tau, 2.3, 0.5));
      if (tau < 0.6) fresh += Math.exp(-tau / 0.1);
    }
    let land = top - p.flank + p.rough - p.bowl * CRATER.depth * K.clamp((top - SEA - 0.9) / 2);   // the crater opens as the cone grows
    if (m.burst > 0.01 && p.bowl > 0.04) land += m.burst * p.bowl * 1.5 * (0.6 + 0.4 * Math.sin(t * 36 + p.rnd * 40));

    // ---- the water. Swell slows down and steepens over shallow ground, so the crests bend round the mound (and later
    // round the island); behind the island the sea is calmer; each eruption sends one ring outwards.
    const depth = SEA - land, shoal = depth > 0 ? Math.exp(-depth / 1.5) : 1;
    const calm = (1 + 0.45 * shoal) * (1 - 0.62 * p.lee * m.island);
    let sea = SEA, ring = 0;
    for (let i = 0; i < waves.length; i++) sea += calm * waves[i].h * Math.sin(p.ph[i] - waves[i].om * t - 2.3 * shoal);
    for (const e of ERUPTIONS) {
      const tau = t - e.at; if (tau <= 0 || tau > 3.4) continue;
      const u = (p.r - FRONT * tau) / 0.5; if (u > 4 || u < -6) continue;
      ring += (Math.exp(-u * u) - 0.45 * Math.exp(-Math.pow(u + 1.7, 2))) * e.adds * 0.42 / (1 + 0.14 * p.r);
    }
    const churn = m.boil * p.over * p.over;
    sea += ring + 0.9 * m.dome * p.over + churn * 0.07 * Math.sin(t * 27 + p.rnd * 50)
      + 0.075 * m.island * shoal * shoal * shoal * Math.sin(6 * p.re + 4.4 * t + p.rnd);            // small waves lapping at the shore

    // ---- what the pin shows
    const dry = K.smooth(-0.02, 0.06, land - sea);
    o.lift = Math.max(sea, land);
    o.land = dry;
    o.pale = K.clamp(0.95 * K.smooth(2.6, 0.3, depth) * (1 - dry) + 1.6 * Math.max(0, ring) + 0.3 * churn + 1.1 * (sea - SEA));   // shallows, surf, crests
    o.hot = K.clamp(dry * (m.glow * Math.exp(-Math.pow(p.r / 0.75, 2)) + 0.35 * fresh * Math.exp(-p.r / 3)) + (1 - dry) * 0.4 * churn * p.bowl);
  }

  // ---------------------------------------------------------------- the mechanism
  const PITCH = 0.1;            // pin spacing; pins sit in a honeycomb, like the toy

  registerStyle({
    id: 'pin-wall',
    name: 'Pin Wall',
    family: 'Flat content made physical',
    look: 'A pin-art toy the size of a wall, laid out like a relief model: tens of thousands of steel pins with rounded heads in a tight honeycomb, held in a dark bolted frame. The pin heights form a landscape you could put your hand on, and groups of pins carry a tint for what they stand for (here blue for sea, warm for rock, glowing orange for lava).',
    motion: 'The relief never stops moving. It is one height field that changes over time: swell travels across it, shapes push up from below, rings run outwards, and every pin follows a moment late with a little bounce, so anything sudden shivers and settles. What is finished stands still, what is alive keeps moving.',
    light: 'One low raking light from the far left, so every height difference throws a long soft shadow and every lit head carries a glint; a blue light from the opposite side fills the shadows; a small warm light sits wherever the relief glows.',
    materials: 'Satin steel pins with polished domed heads and darker shafts, tinted like anodised metal; a powder-coated black frame with bolts.',
    camera: 'One slow continuous crane seen from a raised three-quarter angle: it starts low, looking across the pin heads with shallow focus, and rises and drifts round the subject until the whole relief reads. The relief fills the frame the whole time.',
    post: 'Real motion blur on the pins, depth of field in the low pass, bloom on the glints and on anything hot, filmic contrast, vignette, fine grain.',
    explains: 'Anything that can be shown as a moving relief or a moving greyscale picture: terrain, waves, growth, charts that rise, shapes that morph into each other. The content is one height function, relief(pin, time), which says how far each pin stands out and which tint it carries. A beat is a change in the relief that follows from the one before (calm, something rises, it breaks through, the result). Words are one short caption per beat on a small plate at the bottom; the pins never form words.',
    topic: 'How a volcanic island is born',
    duration: DURATION,
    fonts: ['500 60px "Oswald"', '500 40px "Inter"'],
    render: { samples: 40, shutter: 0.55, tone: 'filmic', exposure: 1.2, bloom: 0.4, bloomThreshold: 1.3, vignette: 0.4, grain: 0.012, saturation: 1.12, fov: 28, background: '#030304' },

    build(S) {
      const { THREE, K, scene, camera } = S;

      // ---- the pins: one instanced mesh. Each pin gets four numbers per moment (lift, land, hot, pale) as an
      // instanced attribute; the vertex shader slides the pin out, the fragment shader tints its head.
      const patch = (m, lit) => {
        m.onBeforeCompile = (sh) => {
          Object.assign(sh.uniforms, U);
          sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aPin; varying vec4 vPin; varying float vShaft;')
            .replace('#include <begin_vertex>', '#include <begin_vertex>\nvShaft = position.z; vPin = aPin; transformed.z += aPin.x;');
          // polished head, darker shaft; the tint is a property of the metal, so glints keep it; hot pins glow
          if (lit) sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec4 vPin; varying float vShaft; uniform vec3 uDeep, uPale, uLand, uHot;')
            .replace('#include <color_fragment>', '#include <color_fragment>\nfloat head = smoothstep(-0.085, -0.03, vShaft);\ndiffuseColor.rgb *= mix(mix(uDeep, uPale, vPin.w), uLand, vPin.y) * mix(0.42, 1.0, head);')
            .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += uHot * vPin.z * vPin.z * mix(0.3, 1.0, head);');
        };
        return m;
      };
      const U = { uDeep: { value: new THREE.Color(TINTS.deep) }, uPale: { value: new THREE.Color(TINTS.pale) }, uLand: { value: new THREE.Color(TINTS.land) }, uHot: { value: new THREE.Color(TINTS.hot).multiplyScalar(7) } };
      // one pin, pointing at +z with the top of its head at z = 0: a domed head, a fine groove, a long shaft
      const R = PITCH * 0.47, LEN = 7, prof = [];
      for (const q of [0, 0.3, 0.55, 0.75, 0.9, 0.98, 1]) prof.push(new THREE.Vector2(Math.max(1e-4, q * R), -0.62 * R * (1 - Math.sqrt(1 - q * q * 0.985))));
      prof.push(new THREE.Vector2(R, -0.075), new THREE.Vector2(R * 0.9, -0.085), new THREE.Vector2(R * 0.9, -LEN));
      const pinGeo = new THREE.LatheGeometry(prof.reverse(), 12); pinGeo.rotateX(Math.PI / 2);   // lathe profiles run bottom to top
      const cols = Math.floor(WALL_W / PITCH), rowH = PITCH * Math.sqrt(3) / 2, rows = Math.floor(WALL_H / rowH), count = cols * rows;
      const state = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4); state.setUsage(THREE.DynamicDrawUsage);
      pinGeo.setAttribute('aPin', state);
      const pins = new THREE.InstancedMesh(pinGeo, patch(new THREE.MeshStandardMaterial({ color: '#c3c7cf', metalness: 0.9, roughness: 0.3 }), true), count);
      pins.customDepthMaterial = patch(new THREE.MeshDepthMaterial(), false);
      pins.castShadow = pins.receiveShadow = true; pins.frustumCulled = false;
      const tone = new THREE.Color(), spots = [];
      for (let r = 0, i = 0; r < rows; r++) for (let c = 0; c < cols; c++, i++) {
        const x = (c - (cols - 1) / 2 + (r % 2 ? 0.25 : -0.25)) * PITCH, y = (r - (rows - 1) / 2) * rowH;
        K.place(pins, i, [x, y, 0]); spots.push(setup(x, y));
        pins.setColorAt(i, tone.setScalar(0.86 + 0.14 * K.hash(c, r)));      // no two pins are finished quite alike
      }
      scene.add(pins);
      const out = { lift: 0, land: 0, hot: 0, pale: 0 }, buf = state.array;
      let shown = null, now = null;
      const show = (t) => {                                                   // the whole field for moment t
        if (t === shown) return; shown = t; now = moment(t);
        for (let i = 0, j = 0; i < count; i++, j += 4) { relief(spots[i], now, t, out); buf[j] = out.lift; buf[j + 1] = out.land; buf[j + 2] = out.hot; buf[j + 3] = out.pale; }
        state.needsUpdate = true;
      };

      // ---- the frame, and darkness behind
      const coat = new THREE.MeshStandardMaterial({ color: '#0a0a0b', roughness: 0.7, metalness: 0.2 });
      const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; scene.add(m); return m; };
      const FB = 0.8, FRONT_Z = SEA + 0.3, FD = 2.2;   // bar width, how far the frame stands proud of the resting pins, bar depth
      for (const s of [-1, 1]) {
        add(K.roundedBox(WALL_W + FB * 2, FB, FD, 0.08, 4), coat, 0, s * (WALL_H + FB) / 2, FRONT_Z - FD / 2);
        add(K.roundedBox(FB, WALL_H + FB * 2, FD, 0.08, 4), coat, s * (WALL_W + FB) / 2, 0, FRONT_Z - FD / 2);
      }
      const bolt = new THREE.CylinderGeometry(0.11, 0.11, 0.08, 16); bolt.rotateX(Math.PI / 2);
      const boltMat = new THREE.MeshStandardMaterial({ color: '#3a3d42', roughness: 0.4, metalness: 0.9 });
      for (let i = 0; i < 12; i++) for (const s of [-1, 1]) add(bolt, boltMat, (i - 5.5) * 1.9, s * (WALL_H + FB) / 2, FRONT_Z + 0.02);
      for (let i = 0; i < 8; i++) for (const s of [-1, 1]) add(bolt, boltMat, s * (WALL_W + FB) / 2, (i - 3.5) * 1.9, FRONT_Z + 0.02);
      add(new THREE.PlaneGeometry(WALL_W, WALL_H), new THREE.MeshStandardMaterial({ color: '#020202', roughness: 1 }), 0, 0, -0.6);

      // ---- light: a low raking key (this is what makes the relief), a blue fill from the other side, a warm lamp over
      // the crater that only burns during eruptions, and a dark room with two soft panels for the domed heads to reflect
      K.env(S, { top: '#0a0c10', horizon: '#0b0c0f', bottom: '#040405', intensity: 0.75, panels: [
        { pos: [-14, 12, 16], size: [14, 8], color: '#eef3ff', power: 2.6 },
        { pos: [16, -6, 12], size: [5, 12], color: '#cfe0ff', power: 1.2 },
      ] });
      const key = K.sun(S, { pos: [-22, 6, 9.5], target: [0, 0, 0], color: '#fff4e6', power: 7, size: 14.5, soft: 1.1, mapSize: 4096, bias: -0.0012, normalBias: 0.01 });
      K.sun(S, { pos: [16, -9, 3.4], target: [0, 0, 0], color: '#5a98ff', power: 2.8, shadow: false });   // lower still: it catches sides, hardly the tops
      const lava = new THREE.PointLight(TINTS.hot, 0, 0, 2); scene.add(lava);

      // ---- camera: one move, from a low pass across the sea up to a three-quarter view of the island
      const cam = {
        pos: K.path([[0, [6.0, -12.8, 3.6]], [DURATION / 3, [4.4, -13.6, 6.0]], [DURATION * 2 / 3, [0.8, -14.4, 9.0]], [DURATION, [-3.0, -14.0, 11.0]]]),
        aim: K.path([[0, [1.6, -3.0, 0.5]], [DURATION / 3, [0.8, -1.1, 0.5]], [DURATION * 2 / 3, [0.5, -0.9, 0.8]], [DURATION, [0.4, -0.6, 1.0]]]),
        ap: K.path([[0, 0.1], [DURATION / 3, 0.07], [DURATION * 2 / 3, 0.04], [DURATION, 0.028]]),
      };

      return {
        update(t) {
          show(t);
          const summit = now.mound + ERUPTIONS.reduce((s, e) => s + (t > e.at ? e.adds : 0), 0);
          lava.position.set(VENT[0], VENT[1], Math.max(SEA, summit) + 0.9); lava.intensity = 3 * now.glow;
          key.position.set(-22, 6 + t * 0.3, 9.5);                                  // the key drifts, so the shadows are never still
          // the relief lies in the x-y plane with the pins pointing at +z, so for this camera "up" is +z (K.look assumes +y)
          camera.position.set(...cam.pos(t)); camera.up.set(0, 0, 1); camera.lookAt(...cam.aim(t));
          K.focus(camera, [VENT[0], VENT[1] - 1.5, SEA], cam.ap(t));
        },
        // the caption plate: one short line per beat, crisp, small, never the subject
        overlay(ctx, t, W, H) {
          BEATS.forEach((b, i) => {
            const next = BEATS[i + 1], a = (i ? K.seg(t, b.at + 0.05, b.at + 0.45, K.ease.out) : 1) * (next ? 1 - K.seg(t, next.at - 0.3, next.at) : 1);
            if (a <= 0) return;
            ctx.save(); ctx.globalAlpha = a; ctx.textBaseline = 'middle';
            ctx.font = '500 52px "Oswald"'; ctx.letterSpacing = '3px';
            const main = b.say.toUpperCase(), wMain = ctx.measureText(main).width;
            ctx.font = '500 38px "Inter"'; ctx.letterSpacing = '0px';
            const wNote = b.note ? ctx.measureText(b.note).width + 56 : 0;
            const w = wMain + wNote + 112, h = 96, x = (W - w) / 2, y = H - 150 + (1 - a) * 10;
            ctx.fillStyle = 'rgba(9,10,13,0.86)'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.fill();
            ctx.strokeStyle = 'rgba(200,210,225,0.34)'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = 'rgba(200,210,225,0.5)';                                    // two screws hold the plate
            for (const sx of [x + 24, x + w - 24]) { ctx.beginPath(); ctx.arc(sx, y + h / 2, 5, 0, 7); ctx.fill(); }
            ctx.font = '500 52px "Oswald"'; ctx.letterSpacing = '3px'; ctx.fillStyle = '#eef1f6'; ctx.fillText(main, x + 56, y + h / 2 + 3);
            if (b.note) {
              ctx.fillStyle = 'rgba(200,210,225,0.34)'; ctx.fillRect(x + 56 + wMain + 26, y + 24, 2, h - 48);
              ctx.font = '500 38px "Inter"'; ctx.letterSpacing = '0px'; ctx.fillStyle = '#b9c3d2'; ctx.fillText(b.note, x + 56 + wMain + 56, y + h / 2 + 2);
            }
            ctx.restore();
          });
        },
      };
    },

    sound(k) {
      const K = globalThis.K, swell = SWELL[0], period = swell.length / swell.speed;
      k.bed('room', 0, DURATION, { gain: 1.0 });
      // the sea: one soft wash for every crest of the main swell that crosses the middle of the wall, and under it the
      // faint tick of thousands of pins sliding in their holes
      for (let t = 0.3, j = 0; t < DURATION - 0.6; t += period, j++) k.noise(t, { dur: period * 1.05, color: 'pink', filter: 'bandpass', f: [[0, 420], [period * 0.5, 1150], [period, 420]], q: 0.6, gain: 0.24, a: period * 0.5, pan: j % 2 ? 0.35 : -0.35, bus: 'amb' });
      k.withMinor(() => { for (let t = 0, j = 0; t < DURATION; t += 0.021, j++) k.play('tick', t + 0.01 * K.hash(j, 5), { gain: 0.07 + 0.05 * K.hash(j, 1), f: 4200 + 3600 * K.hash(j, 2), pan: K.hash(j, 3) * 1.6 - 0.8 }); });
      // the mound: a rumble that swells from below, then the water starts to churn
      const b0 = BEATS[1].at, e0 = ERUPTIONS[0].at;
      k.tone(b0, { f: [[0, 36], [e0 - b0, 58]], dur: e0 - b0 + 0.1, gain: 0.13, a: (e0 - b0) * 0.85 });
      k.noise(b0, { dur: e0 - b0 + 0.1, color: 'brown', filter: 'lowpass', f: [[0, 120], [e0 - b0, 420]], gain: 0.11, a: (e0 - b0) * 0.9 });
      k.withMinor(() => { for (let t = BUILD.to - 1.7, j = 0; t < e0; t += 0.085 - 0.04 * K.seg(t, BUILD.to - 1.7, e0), j++) k.play('pop', t, { gain: 0.05 + 0.1 * K.seg(t, BUILD.to - 1.7, e0), f: 240 + 260 * K.hash(j, 8), pan: (K.hash(j, 9) - 0.5) * 0.5 }); });
      // each eruption: a blow, steam, the pins of the cone jumping (ticks that thin out as the new layer runs down the
      // flank) and the ring leaving across the water
      ERUPTIONS.forEach((e, n) => {
        k.play('impact', e.at, { gain: 0.85 * e.adds, f: 92 - n * 6 });
        k.tone(e.at, { f: [[0, 74 - n * 5], [0.6, 33]], dur: 1.0, gain: 0.5, a: 0.006 });
        k.noise(e.at, { dur: 0.7, filter: 'highpass', f: [[0, 2600], [0.7, 900]], gain: 0.2, a: 0.03, verb: 0.3 });
        k.withMinor(() => { for (let t = e.at, j = 0; t < e.at + 0.95; t += 0.008, j++) { const u = (t - e.at) / 0.95; k.play('tick', t, { gain: 0.5 * Math.pow(1 - u, 1.4) * (0.5 + 0.5 * K.hash(j, n)), f: 3000 + 3800 * K.hash(j, n, 3), pan: (K.hash(j, n, 4) - 0.5) * (0.4 + 1.2 * u) }); } });
        k.play('whoosh', e.at + 0.35, { gain: 0.42, dur: 1.5, top: 1800, pan: n % 2 ? 0.3 : -0.3 });
      });
      // the island stands: one low warm note, and the sea goes on
      const end = BEATS[BEATS.length - 1].at;
      k.tone(end, { f: 'D3', type: 'triangle', dur: DURATION - end, gain: 0.065, a: 0.5, hold: 1.2, filter: 'lowpass', f2: 900, verb: 0.3 });
      k.tone(end, { f: 'A3', dur: DURATION - end, gain: 0.045, a: 0.6, hold: 1.2, verb: 0.3 });
      k.play('ding', end + 0.1, { gain: 0.3, f: 'A5' });
    },
  });
}
```
