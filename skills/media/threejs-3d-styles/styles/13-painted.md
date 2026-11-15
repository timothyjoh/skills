# Painted (#13)

- **id:** `painted`
- **Category:** Filters over 3D
- **Use:** story
- **Reference duration:** 12 s
- **Google Fonts:** Caveat
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`

## Style card

- **Look:** A filter, not a set: any lit 3D scene comes out as an oil painting on canvas, with thick directional brush dabs, broken colour, ridges of paint that catch a raking light, linen weave showing through the thin darks and a ragged unpainted edge. Here it carries a golden-hour countryside: a wheat field, a windmill, a bakery cottage.
- **Motion:** Things happen inside the painting and each one causes the next: a gust runs through the wheat as a wave of bent stalks, reaches the sails and spins them up, the millstone turns with them, flour pours into a sack and puffs, a loaf is slid onto a sill. Brush dabs are fixed to the things they describe, so they travel with stalks, sails and sacks instead of boiling; the canvas weave stays still. Each caption is brushed on in under half a second when its beat starts and stays until the next one.
- **Light:** One low golden sun from behind and to the side, long shadows, cool blue-violet sky light in every shadow, and small warm lamps (a doorway, a window, a lantern) wherever the story needs the eye. Warm light against cool shadow is the whole palette.
- **Materials:** Rough simple shapes with no detail of their own, each big enough to survive a brush nine pixels wide. Every surface carries a field of brush dabs that varies its colour, tilts its shading and adds bristle streaks; the painterly filter turns that into strokes.
- **Camera:** One continuous shot at walking height, like a picture book without page turns: it travels with the wind from the field toward the mill, cranes down to the door and drifts slowly across it while the stone works, then glides after the flour dust along the track and pushes in on the window sill, where it stops and holds on the thing that was made. Everything sharp, like a canvas. Each stop is composed like a painting, with the subject large in frame.
- **Finish:** Anisotropic Kuwahara brush filter, then a paint-relief and canvas-weave pass lit from the upper left, which also letters the caption on a bare corner of the linen. Soft bloom on the sun and the lamps before the filter, so the glow is painted too. No grain, no vignette.
- **Good for:** Stories, journeys and processes that happen in a place, told as a picture book: how something is made, where something comes from, a day in a life, a chain of cause and effect. Each beat is one stop in the landscape where one thing visibly happens and sets off the next; something that travels (wind, a road, a river, a character) leads the camera from stop to stop; one short caption per beat sits in the bare corner of the canvas and names what is happening. The filter carries any 3D scene, so the world can be a farm, a city, a workshop or a room, as long as each subject is a big simple shape.

## Reference

- **Sample topic:** From wind to bread: a gust crosses a wheat field and turns the windmill, the millstone grinds flour, and a loaf ends up on the bakery sill
- **Gallery description:** A filter, not a set: any lit 3D scene comes out as an oil painting on canvas, with thick directional brush dabs, broken colour, ridges of paint that catch a raking light, linen weave showing through the thin darks and a ragged unpainted edge. Here it carries a golden-hour countryside: a wheat field, a windmill, a bakery cottage.
- **Shown in the sample clip:** From wind to bread: a gust crosses a wheat field and turns the windmill, the millstone grinds flour, and a loaf ends up on the bakery sill

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/painted.js`)

```js
{
  // ---------------------------------------------------------------- content (change this for a new topic)
  // A picture-book journey: one slow camera move through a landscape, four beats that cause each other, and one short
  // caption per beat lettered in the bare corner of the canvas. Here: from wind to bread.
  const DURATION = 12;
  const BEATS = [                   // `at` = when the beat starts and its caption is brushed on (the first is there on frame one)
    { at: 0.0, text: 'Wind crosses the wheat.' },
    { at: 2.4, text: 'The same wind turns the sails.' },
    { at: 4.9, text: 'The stone grinds grain into flour.' },
    { at: 8.45, text: 'And the flour becomes bread.' },
  ];
  const WRITE = 0.45;               // seconds to brush a whole caption on; it then stays up until the next beat starts
  // the wind is the thread: each gust is a front that travels across the land at GUST_SPEED. `at` = the moment it
  // reaches the mill; wheat, grass, trees, sails, flour dust and smoke all read the same gusts.
  const GUSTS = [{ at: 2.5, amp: 1.0 }, { at: 6.7, amp: 0.6 }];
  const GUST_SPEED = 5;             // world units per second
  const SAILS = { idle: 0.2, run: 1.45, spinUp: 1.5, phase: 0.35 };   // rad/s before and after the first gust arrives
  const STONE_GEAR = 3;             // the millstone is geared to the sails, so it speeds up with them
  const DOOR_AT = 5.1, DOOR_LEAVE = 6.9;   // the camera reaches the mill door, drifts slowly across it while the stone and the flour do their part, and moves on
  const STOP = 11.1;                // the camera reaches the window sill and holds on the loaf until the end
  const FLOUR_ON = 4.4;             // flour starts to run from the spout into the open sack
  const SACK_FULL = 6.5;            // the sack is full: a puff of flour dust, which the second gust carries toward the bakery
  const OVEN_ON = 8.3;              // the bakery window warms up
  const LOAF_OUT = 9.8, LOAF_DOWN = 10.5;   // a baker's peel slides the loaf out of the window and leaves it on the sill

  // one schedule for picture and sound
  const sailAngle = (t) => {        // closed form, so any frame can be rendered on its own
    const u = (t - GUSTS[0].at) / SAILS.spinUp, ramp = u <= 0 ? 0 : u < 1 ? u * u * u - u * u * u * u / 2 : u - 0.5;   // integral of a smooth step
    return SAILS.phase + SAILS.idle * t + (SAILS.run - SAILS.idle) * SAILS.spinUp * ramp;
  };
  function sailPasses() {           // the moments a sail points straight down
    const out = []; let last = Math.floor(sailAngle(0) / (Math.PI / 2));
    for (let t = 0; t < DURATION; t += 0.005) { const n = Math.floor(sailAngle(t) / (Math.PI / 2)); if (n !== last) { out.push(t); last = n; } }
    return out;
  }
  function lettering() {            // every caption word is one pull of a small brush: { beat, word, k, t0, dur }
    const out = [];
    BEATS.forEach((b, beat) => { let t = b.at; b.text.split(' ').forEach((word, k) => { const dur = WRITE * (word.length + 1) / (b.text.length + 1); out.push({ beat, word, k, t0: beat ? t : -1, dur: dur * 0.85 }); t += dur; }); });
    return out;
  }
  const STONE_NEAR = [DOOR_AT - 0.4, DOOR_LEAVE + 0.3];   // while the camera is at the mill door (for the sound of the stones)
  function cogKnocks() {            // every tooth of the cog wheel on the stone's shaft, while we are close enough to hear it
    const out = [], tooth = Math.PI / 5; let last = Math.floor(STONE_GEAR * sailAngle(STONE_NEAR[0] - 0.5) / tooth);
    for (let t = STONE_NEAR[0] - 0.5; t < STONE_NEAR[1] + 0.9; t += 0.004) { const n = Math.floor(STONE_GEAR * sailAngle(t) / tooth); if (n !== last) { out.push(t); last = n; } }
    return out;
  }
  const BIRD_CALLS = [0.4, 0.62, 1.7, 3.6, 3.78];

  // ---------------------------------------------------------------- the paint: two full-screen passes over the finished frame
  // Pass 1, the brush: an anisotropic Kuwahara filter. Around every pixel it looks at eight overlapping pie slices of
  // an ellipse stretched along the local direction of the picture, and keeps the mean colour of the calmest slices.
  // Flat areas become flat dabs, edges stay crisp and strokes run along forms. It has no randomness, so strokes cannot
  // boil: they only change when the picture underneath changes.
  // Alpha carries out the fine detail the brush removed (the bristle streaks painted into the scene's materials), so
  // the second pass can turn it into relief.
  // The filter eats anything thinner than the brush, so the story's subjects have to be big, simple shapes with a clear
  // difference in tone from what is behind them.
  const BRUSH = `
    uniform float radius;      // brush size in pixels
    vec3 px(vec2 o){ return texture2D(tex, vUv + o / res).rgb; }
    void main(){
      // which way does the picture run here? (structure tensor, averaged over the brush footprint)
      vec3 T = vec3(0.0), mean = vec3(0.0); float wsum = 0.0;
      for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
        vec2 o = vec2(float(i), float(j)) * 3.0; float w = exp(-dot(o, o) / 44.0);
        vec3 a = px(o + vec2(1.5, 0.0)), b = px(o - vec2(1.5, 0.0)), c = px(o + vec2(0.0, 1.5)), d = px(o - vec2(0.0, 1.5));
        vec3 gx = a - b, gy = c - d;
        T += w * vec3(dot(gx, gx), dot(gy, gy), dot(gx, gy)); mean += w * (a + b + c + d) * 0.25; wsum += w;
      }
      T /= wsum; mean /= wsum;
      float root = sqrt((T.x - T.y) * (T.x - T.y) + 4.0 * T.z * T.z), l1 = 0.5 * (T.x + T.y + root), l2 = 0.5 * (T.x + T.y - root);
      vec2 dir = vec2(l1 - T.x, -T.z); dir = length(dir) > 1e-6 ? normalize(dir) : vec2(1.0, 0.0);   // along the edge
      float aniso = l1 + l2 > 1e-7 ? (l1 - l2) / (l1 + l2) : 0.0;                                   // 0 = no direction, 1 = a clean line
      float ra = radius * clamp(1.0 + aniso, 0.1, 2.0), rb = radius * clamp(1.0 / (1.0 + aniso), 0.1, 2.0);
      int mx = int(sqrt(ra * ra * dir.x * dir.x + rb * rb * dir.y * dir.y)), my = int(sqrt(ra * ra * dir.y * dir.y + rb * rb * dir.x * dir.x));
      float zeta = 2.0 / radius, eta = (zeta + cos(0.58)) / (sin(0.58) * sin(0.58));
      vec4 m[8]; vec3 s[8];
      for (int k = 0; k < 8; k++) { m[k] = vec4(0.0); s[k] = vec3(0.0); }
      for (int y = -my; y <= my; y++) for (int x = -mx; x <= mx; x++) {
        vec2 o = vec2(float(x), float(y));
        vec2 v = 0.5 * vec2(dot(o, dir) / ra, dot(o, vec2(-dir.y, dir.x)) / rb);
        if (dot(v, v) > 0.25) continue;
        vec3 c = px(o);
        float w[8]; float z, vxx = zeta - eta * v.x * v.x, vyy = zeta - eta * v.y * v.y, sum = 0.0;   // smooth weights for the eight slices
        z = max(0.0, v.y + vxx); w[0] = z * z; z = max(0.0, -v.x + vyy); w[2] = z * z; z = max(0.0, -v.y + vxx); w[4] = z * z; z = max(0.0, v.x + vyy); w[6] = z * z;
        vec2 q = 0.70710678 * vec2(v.x - v.y, v.x + v.y); vxx = zeta - eta * q.x * q.x; vyy = zeta - eta * q.y * q.y;
        z = max(0.0, q.y + vxx); w[1] = z * z; z = max(0.0, -q.x + vyy); w[3] = z * z; z = max(0.0, -q.y + vxx); w[5] = z * z; z = max(0.0, q.x + vyy); w[7] = z * z;
        for (int k = 0; k < 8; k++) sum += w[k];
        float g = exp(-3.125 * dot(v, v)) / sum;
        for (int k = 0; k < 8; k++) { float wk = w[k] * g; m[k] += vec4(c * wk, wk); s[k] += c * c * wk; }
      }
      vec4 acc = vec4(0.0);
      for (int k = 0; k < 8; k++) {
        vec3 mk = m[k].rgb / m[k].w, sd = abs(s[k] / m[k].w - mk * mk);
        float w = 1.0 / (1.0 + pow(8000.0 * (sd.r + sd.g + sd.b), 4.0));                             // calm slices win
        acc += vec4(mk * w, w);
      }
      float lm = dot(mean, vec3(0.3, 0.55, 0.15)), detail = (dot(px(vec2(0.0)), vec3(0.3, 0.55, 0.15)) - lm) / (lm + 0.08);
      gl_FragColor = vec4(acc.rgb / acc.w, 0.5 + clamp(detail, -0.16, 0.16) * 2.5);                  // clamped: bristle streaks count, hard edges do not
    }`;
  // Pass 2, the surface: paint gets thickness (light passages are laid on thick, darks stay thin), the canvas weave
  // shows through where it is thin, and one raking studio light picks out the ridges. The weave and the ragged
  // unpainted edge belong to the canvas, so they stay fixed on screen while the painting moves.
  // The caption lives here too: the painter left the lower left corner of the linen bare and letters one short line on
  // it in dark paint with a small brush. It is added after the big brush, so the words stay sharp, but it still gets
  // the relief and the weave like any other paint.
  const SURFACE = `
    uniform sampler2D uCap;    // all caption lines, one per row (white on black)
    uniform vec4 uCapBox;      // where a line sits on the canvas: x, y of its lower left corner, width, height (px)
    uniform vec2 uCapLine;     // which row is showing, and how many rows there are
    uniform vec2 uCapPatch;    // size of the bare corner (px)
    uniform float uCapShow, uCapAlpha;   // how far the brush has got along the line (px), and the fade when a line is wiped off
    float lum(vec3 c){ return dot(c, vec3(0.3, 0.55, 0.15)); }
    float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
    float weave(vec2 p){       // plain weave: threads go over and under each other in a checker pattern
      vec2 q = p / 4.0, id = floor(q), f = fract(q) - 0.5; float over = mod(id.x + id.y, 2.0);
      float warp = cos(f.x * 3.14159) * (0.55 + 0.45 * cos(f.y * 6.28318)), weft = cos(f.y * 3.14159) * (0.55 + 0.45 * cos(f.x * 6.28318));
      return mix(warp, weft, over) * (0.8 + 0.4 * h21(id * (over > 0.5 ? vec2(0.0, 1.0) : vec2(1.0, 0.0))));
    }
    float ink(vec2 p){         // the caption: wiped in from the left behind a bristly edge, like one pull of a loaded brush
      vec2 q = (p - uCapBox.xy) / uCapBox.zw;
      if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) return 0.0;
      float wipe = smoothstep(0.0, 5.0, uCapShow - (p.x - uCapBox.x) - 14.0 * h21(vec2(floor(p.y / 3.0), 7.0)));
      return texture2D(uCap, vec2(q.x, 1.0 - (uCapLine.x + 1.0 - q.y) / uCapLine.y)).r * wipe * uCapAlpha;
    }
    float thickness(vec2 o){ vec4 s = texture2D(tex, vUv + o / res); return 0.25 * lum(s.rgb) + 0.8 * (s.a - 0.5); }
    void main(){
      vec2 p = vUv * res; vec3 c = texture2D(tex, vUv).rgb;
      // the painting stops short of the canvas edge, raggedly, the way a loaded brush runs out
      float edge = min(min(p.x, res.x - p.x), min(p.y, res.y - p.y));
      float painted = smoothstep(0.0, 3.0, edge - 13.0 - 17.0 * vnoise(p * vec2(0.012, 0.11)) - 7.0 * vnoise(p * 0.07));
      // ... and around the bare corner kept for the caption
      float corner = length(max(p - (uCapPatch - 30.0), 0.0)) - 30.0 + 9.0 * vnoise(p * vec2(0.05, 0.012)) + 6.0 * vnoise(p * 0.09);
      painted *= smoothstep(0.0, 3.0, corner);
      float k = ink(p), body = max(painted * smoothstep(0.04, 0.8, lum(c)), k);
      vec2 g = vec2(thickness(vec2(1.5, 0.0)) - thickness(vec2(-1.5, 0.0)), thickness(vec2(0.0, 1.5)) - thickness(vec2(0.0, -1.5))) * painted;
      g += vec2(ink(p + vec2(1.5, 0.0)) - ink(p - vec2(1.5, 0.0)), ink(p + vec2(0.0, 1.5)) - ink(p - vec2(0.0, 1.5))) * 0.22;
      vec2 gw = vec2(weave(p + vec2(0.8, 0.0)) - weave(p - vec2(0.8, 0.0)), weave(p + vec2(0.0, 0.8)) - weave(p - vec2(0.0, 0.8)));
      vec3 n = normalize(vec3(-(g * 1.6 + gw * mix(0.3, 0.07, body)), 1.0));                         // relief of paint plus canvas
      vec3 L = normalize(vec3(-0.5, 0.62, 0.6));                                                    // studio light from the upper left
      float diff = dot(n, L) / L.z, spec = pow(max(dot(n, normalize(L + vec3(0.0, 0.0, 1.0))), 0.0), 48.0);
      c = mix(vec3(0.90, 0.86, 0.77) * (0.97 + 0.05 * vnoise(p * 0.02)), c, painted);                // primed linen outside the picture
      c = mix(c, vec3(0.17, 0.11, 0.24) * (0.9 + 0.3 * vnoise(p * vec2(0.5, 0.08))), k);             // caption paint: the violet of the shadows
      c = c * mix(1.0, diff, 0.5) + spec * 0.12 * body;
      c *= 1.0 - 0.07 * (1.0 - body) * (1.0 - weave(p));                                             // thin paint sinks into the weave
      gl_FragColor = vec4(c, 1.0);
    }`;
  const CAP = { font: '700 64px "Caveat"', x: 50, y: 34, row: 96, width: 1024 };   // caption size and place on the 1920 x 1080 canvas

  registerStyle({
    id: 'painted',
    name: 'Painted',
    family: 'Filters over 3D',
    look: 'A filter, not a set: any lit 3D scene comes out as an oil painting on canvas, with thick directional brush dabs, broken colour, ridges of paint that catch a raking light, linen weave showing through the thin darks and a ragged unpainted edge. Here it carries a golden-hour countryside: a wheat field, a windmill, a bakery cottage.',
    motion: 'Things happen inside the painting and each one causes the next: a gust runs through the wheat as a wave of bent stalks, reaches the sails and spins them up, the millstone turns with them, flour pours into a sack and puffs, a loaf is slid onto a sill. Brush dabs are fixed to the things they describe, so they travel with stalks, sails and sacks instead of boiling; the canvas weave stays still. Each caption is brushed on in under half a second when its beat starts and stays until the next one.',
    light: 'One low golden sun from behind and to the side, long shadows, cool blue-violet sky light in every shadow, and small warm lamps (a doorway, a window, a lantern) wherever the story needs the eye. Warm light against cool shadow is the whole palette.',
    materials: 'Rough simple shapes with no detail of their own, each big enough to survive a brush nine pixels wide. Every surface carries a field of brush dabs that varies its colour, tilts its shading and adds bristle streaks; the painterly filter turns that into strokes.',
    camera: 'One continuous shot at walking height, like a picture book without page turns: it travels with the wind from the field toward the mill, cranes down to the door and drifts slowly across it while the stone works, then glides after the flour dust along the track and pushes in on the window sill, where it stops and holds on the thing that was made. Everything sharp, like a canvas. Each stop is composed like a painting, with the subject large in frame.',
    post: 'Anisotropic Kuwahara brush filter, then a paint-relief and canvas-weave pass lit from the upper left, which also letters the caption on a bare corner of the linen. Soft bloom on the sun and the lamps before the filter, so the glow is painted too. No grain, no vignette.',
    explains: 'Stories, journeys and processes that happen in a place, told as a picture book: how something is made, where something comes from, a day in a life, a chain of cause and effect. Each beat is one stop in the landscape where one thing visibly happens and sets off the next; something that travels (wind, a road, a river, a character) leads the camera from stop to stop; one short caption per beat sits in the bare corner of the canvas and names what is happening. The filter carries any 3D scene, so the world can be a farm, a city, a workshop or a room, as long as each subject is a big simple shape.',
    topic: 'From wind to bread: a gust crosses a wheat field and turns the windmill, the millstone grinds flour, and a loaf ends up on the bakery sill',
    duration: DURATION,
    fonts: [CAP.font],
    render: { samples: 24, shutter: 0.5, tone: 'neutral', exposure: 1.0, bloom: 0.5, bloomThreshold: 1.05, vignette: 0, grain: 0, saturation: 1.12, contrast: 1.04, fov: 34, far: 500, background: '#f0a878' },

    build(S) {
      const { THREE, K, scene, camera } = S;
      const V = (x, y, z) => new THREE.Vector3(x, y, z), lin = (hex) => new THREE.Color(hex);
      const rnd = K.rng(21), nz = K.noise(3);
      S.addFilter(BRUSH, { radius: { value: 9 } });

      // ---- the caption corner: all lines are drawn once into one texture, the surface pass shows one row at a time
      const words = lettering(), meas = document.createElement('canvas').getContext('2d'); meas.font = CAP.font;
      let capWidth = 0;
      BEATS.forEach((b, i) => {
        capWidth = Math.max(capWidth, meas.measureText(b.text).width);
        words.filter((w) => w.beat === i).forEach((w) => { const before = b.text.split(' ').slice(0, w.k).join(' ') + (w.k ? ' ' : ''); w.x0 = meas.measureText(before).width; w.x1 = w.x0 + meas.measureText(w.word).width; });
      });
      const capTex = K.canvasTex(CAP.width, CAP.row * BEATS.length, (ctx, w, h) => {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h); ctx.font = CAP.font; ctx.textBaseline = 'middle'; ctx.fillStyle = ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.lineJoin = 'round';
        BEATS.forEach((b, i) => { ctx.fillText(b.text, 8, CAP.row * (i + 0.52)); ctx.strokeText(b.text, 8, CAP.row * (i + 0.52)); });   // fill plus outline: fattened, a brush and not a pen
      }, { data: true });
      const capU = { uCap: { value: capTex }, uCapBox: { value: new THREE.Vector4(CAP.x - 8, CAP.y, CAP.width, CAP.row) }, uCapLine: { value: new THREE.Vector2(0, BEATS.length) },
        uCapPatch: { value: new THREE.Vector2(CAP.x + capWidth + 44, CAP.y + CAP.row + 8) }, uCapShow: { value: 0 }, uCapAlpha: { value: 1 } };
      S.addFilter(SURFACE, capU);
      const caption = (t) => {     // which line, how much of it is brushed on, and how much is left after the wipe
        let i = 0; while (i < BEATS.length - 1 && t >= BEATS[i + 1].at - 0.02) i++;
        let show = 0;
        for (const w of words) if (w.beat === i && t >= w.t0) show = Math.max(show, K.lerp(w.x0, w.x1 + 30, K.seg(t, w.t0, w.t0 + w.dur, K.ease.inOut)));
        capU.uCapLine.value.x = i; capU.uCapShow.value = show + 8;
        capU.uCapAlpha.value = i < BEATS.length - 1 ? 1 - K.seg(t, BEATS[i + 1].at - 0.2, BEATS[i + 1].at - 0.04) : 1;   // the old line is wiped just before the next beat
      };

      // ---- the land: one height function for the mesh and for standing things on it. The story runs left to right,
      // the way the wind blows: wheat field, mill, a track past a cart, cottage.
      const WIND = [0.954, -0.3];                                                                    // unit vector on the ground (x, z)
      const MILL = [4, -6], MILL_YAW = -0.3, COT = [12, -3.0], COT_YAW = -0.52;
      const bump = (dx, dz, sx, sz) => Math.exp(-(dx * dx) / (sx * sx) - (dz * dz) / (sz * sz));
      const riverX = (z) => -3.3 + 0.277 * z - 12.5 * K.smooth(-30, -6, z) + 1.2 * Math.sin(z * 0.33 + 1.0);   // the river passes left of the field, then runs straight toward the sun
      const ground = (x, z) => {
        const dr = x - riverX(z);
        let h = 0.2 + 0.24 * nz.fbm(x * 0.09, z * 0.09, 0, 3);
        h += 0.7 * bump(x - 4, z + 6.6, 6.5, 5) + 0.4 * bump(x - 12.4, z + 3.8, 5, 4);                     // mill knoll, cottage rise
        const gap = 1 - 0.85 * Math.exp(-dr * dr / 110);                                             // the river has cut a gap through the three far ridges
        h += gap * (5.5 * Math.exp(-(((z + 40) / 9) ** 2)) * (0.65 + 0.5 * nz.n2(x * 0.045, 1.7)) + 13 * Math.exp(-(((z + 82) / 16) ** 2)) * (0.65 + 0.5 * nz.n2(x * 0.03, 8.3)) + 21 * Math.exp(-(((z + 150) / 22) ** 2)) * (0.6 + 0.7 * nz.n2(x * 0.016, 4.1)));
        return h - 1.25 * Math.exp(-dr * dr / (2.6 + Math.max(0, -z) * 0.5));                         // river bed, wider with distance
      };
      const G = (x, y, z) => [x, ground(x, z) + y, z];                                               // a point y above the ground
      const local = (o, yaw) => (x, y, z) => [o[0] + x * Math.cos(yaw) + z * Math.sin(yaw), ground(o[0], o[1]) + y, o[1] - x * Math.sin(yaw) + z * Math.cos(yaw)];
      const millPt = local(MILL, MILL_YAW), cotPt = local(COT, COT_YAW);                             // points given in the mill's and the cottage's own axes (door and window face +z)
      const TRACK = [[-1.8, 13], [0.1, 8.8], [1.6, 4.6], [2.3, 0], [3.4, -4.1], [5.8, -3.4], [8.4, -3.5], [10.6, -2.2], [12.2, -1.3]];   // field corner, mill door, cottage door
      const trackDist = (x, z) => {
        let d = 1e9;
        for (let i = 1; i < TRACK.length; i++) {
          const ax = TRACK[i - 1][0], az = TRACK[i - 1][1], bx = TRACK[i][0] - ax, bz = TRACK[i][1] - az, k = K.clamp(((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz));
          d = Math.min(d, Math.hypot(x - ax - bx * k, z - az - bz * k));
        }
        return d;
      };
      const inField = (x, z) => 1 - Math.hypot(((x + 4.4) / 6.6) ** 2, ((z - 2.2) / 6.3) ** 2) ** 0.5 - 0.1 * nz.n2(x * 0.4, z * 0.4) - K.smooth(1.5, 0.7, trackDist(x, z));   // > 0 inside the wheat

      // ---- camera: one slow continuous shot. It travels with the gust from the field to the mill door, drifts across
      // the door while the stone and the flour do their part, then glides after the flour dust along the track to the
      // window sill and stops. Keys are where the camera is and what it looks at when each beat is on; K.path flows
      // through them. Two paths joined at the door, so the push-in settles before the sideways drift begins.
      const HEAD = [MILL[0], ground(MILL[0], MILL[1]) + 5.0, MILL[1]];             // the hub of the sails, high enough that they clear the door
      const DOOR = { pos: millPt(-0.85, 1.95, 5.5), aim: millPt(-0.65, 1.0, 1.0) }, SILL = { pos: cotPt(-0.52, 1.22, 3.15), aim: cotPt(-0.5, 1.01, 1.4) };
      const leg1 = {
        pos: K.path([[-2.2, G(-1.9, 1.25, 10.9)], [0, G(-0.6, 1.3, 9.6)], [2.2, G(0.4, 1.6, 7.4)], [3.6, G(1.4, 2.1, 3.8)], [DOOR_AT, DOOR.pos]]),
        aim: K.path([[-2.2, G(-0.2, 2.6, -6)], [0, G(0.5, 2.8, -6)], [2.2, G(1.6, 3.0, -6)], [3.6, [HEAD[0], HEAD[1] - 0.5, HEAD[2]]], [DOOR_AT, DOOR.aim]]),
      };
      const leg2 = {
        pos: K.path([[DOOR_AT, DOOR.pos], [DOOR_LEAVE, millPt(-0.2, 1.9, 5.65)], [DOOR_LEAVE + 0.6, millPt(0.6, 1.85, 5.9)], [9.1, G(6.4, 1.9, 1.25)], [STOP, SILL.pos]]),
        aim: K.path([[DOOR_AT, DOOR.aim], [DOOR_LEAVE, millPt(-0.7, 0.95, 1.2)], [DOOR_LEAVE + 0.6, millPt(0.1, 1.1, 1.4)], [9.1, cotPt(-0.3, 2.7, 1.0)], [9.5, cotPt(-0.5, 1.3, 1.35)], [STOP, SILL.aim]]),
      };
      const cam = { pos: (t) => (t < DOOR_AT ? leg1 : leg2).pos(t), aim: (t) => (t < DOOR_AT ? leg1 : leg2).aim(t) };

      // ---- stations: the views the brush dabs are laid out in. Dabs are projected onto the world from a station, so
      // they have an even size on screen there but stay attached to the surfaces. A journey needs one station per stop:
      // every object names the stop it is the subject of, and the ground blends from one to the next.
      // eye, aim = the direction it is seen from; seen = how far away the camera is when it is the subject.
      const STATIONS = {
        field: { eye: [-3, 4.5, 22], aim: [-3, 0.8, 2], seen: 9 },
        mill: { eye: [3, 4, 24], aim: [4, 3.5, -6], seen: 13 },                                      // also the sky and the far land
        yard: { eye: [2.2, 2.6, 15], aim: [3.4, 1.2, -4.6], seen: 5.2 },
        cottage: { eye: cotPt(-1, 2, 24), aim: cotPt(0, 1.2, 1.2), seen: 6.5 },
        sill: { eye: cotPt(-0.7, 1.4, 12), aim: cotPt(-0.6, 1.1, 1.3), seen: 2.1 },
      };
      const REF = {};
      for (const [name, s] of Object.entries(STATIONS)) {
        const d = Math.hypot(s.eye[0] - s.aim[0], s.eye[1] - s.aim[1], s.eye[2] - s.aim[2]);
        const c = new THREE.PerspectiveCamera(2 * Math.atan(Math.tan(17 * Math.PI / 180) * s.seen / d) * 180 / Math.PI, S.W / S.H, 0.1, 900);   // a long lens from far back: same dab size, no ground behind it
        K.look(c, s.eye, s.aim); c.updateMatrixWorld();
        REF[name] = new THREE.Matrix4().multiplyMatrices(c.projectionMatrix, c.matrixWorldInverse);
      }
      const GROUND_REFS = [REF.field, REF.mill, REF.yard, REF.cottage];

      // ---- brush-dab field: thousands of overlapping strokes rasterised into one tiling texture.
      // R,G = a random tilt per dab (each dab catches the light a little differently), B = a random tone per dab
      // (broken colour), A = bristle ridges along the dab, with ragged ends.
      function dabField(seed, flow) {
        const N = 1024, r = K.rng(seed), data = new Uint8Array(N * N * 4).fill(128), LEN = 84, WID = 22;
        for (let n = Math.round(N * N / (LEN * WID) * 3.4); n > 0; n--) {
          const cx = Math.floor(r() * N), cy = Math.floor(r() * N), len = LEN * r.range(0.55, 1.35), wid = WID * r.range(0.6, 1.25);
          const a = flow(cx / N, cy / N) + r.gauss() * 0.16, ca = Math.cos(a), sa = Math.sin(a), bend = r.range(-0.35, 0.35) / len;
          const tx = r() * 255, ty = r() * 255, tone = r() * 255, hairs = Math.max(3, Math.round(wid / 3.2)), ext = Math.ceil(len / 2 + wid);
          const from = [], to = [], ridge = [];
          for (let h = 0; h < hairs; h++) { from.push(-len / 2 + r() * len * 0.14); to.push(len / 2 - r() * len * 0.32); ridge.push(r.range(-0.3, 0.3)); }
          for (let dy = -ext; dy <= ext; dy++) for (let dx = -ext; dx <= ext; dx++) {
            const u = dx * ca + dy * sa, across = (-dx * sa + dy * ca - bend * u * u) / wid + 0.5;
            if (across < 0 || across >= 1) continue;
            const h = Math.floor(across * hairs);
            if (u < from[h] || u > to[h]) continue;
            const i = ((((cy + dy) % N) + N) % N * N + (((cx + dx) % N) + N) % N) * 4;
            data[i] = tx; data[i + 1] = ty; data[i + 2] = tone;
            data[i + 3] = 255 * K.clamp(0.5 + ridge[h] + 0.25 * Math.pow(Math.abs(across - 0.5) * 2, 3) - 0.15 * (u / len + 0.5));   // paint piles up at the sides of a stroke and thins toward its end
          }
        }
        const tex = new THREE.DataTexture(data, N, N);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.anisotropy = 8; tex.needsUpdate = true;
        return tex;
      }
      const DABS = {
        sweep: dabField(1, (u, v) => 0.3 * Math.sin(6.283 * (u + 2 * v))),               // long level strokes: sky, water, fields
        upright: dabField(2, (u, v) => 1.45 + 0.35 * Math.sin(6.283 * (2 * u + v))),     // short standing strokes: trees, walls, grass
      };
      const dabScale = (size) => new THREE.Vector2(S.W, S.H).multiplyScalar(0.5 / (1024 * size));    // size 1 = a dab of about 84 x 22 px on screen

      // ---- wind: the same gust fronts in GLSL (for everything that bends: wheat, grass, flowers) and in JS (for
      // everything that is moved from update(): sails, trees, smoke, dust)
      const MILL_S = MILL[0] * WIND[0] + MILL[1] * WIND[1], f3 = (x) => x.toFixed(3);
      const gustAt = (x, z, t) => {
        const s = x * WIND[0] + z * WIND[1], c = x * WIND[1] - z * WIND[0]; let g = 0;
        GUSTS.forEach((q, i) => { const d = s - (MILL_S + GUST_SPEED * (t - q.at)) + 1.3 * Math.sin(c * 0.42 + i * 2.1); g += q.amp * Math.exp(-d * d / (d > 0 ? 2.2 : 14)); });   // a sharp front and a longer tail
        return g;
      };
      const GUST_GLSL = `
        const vec2 WIND = vec2(${f3(WIND[0])}, ${f3(WIND[1])});
        float gustAt(vec2 p, float t){
          float s = dot(p, WIND), c = p.x * WIND.y - p.y * WIND.x, g = 0.0, d;
          ${GUSTS.map((q, i) => `d = s - (${f3(MILL_S)} + ${f3(GUST_SPEED)} * (t - ${f3(q.at)})) + 1.3 * sin(c * 0.42 + ${f3(i * 2.1)}); g += ${f3(q.amp)} * exp(-d * d / (d > 0.0 ? 2.2 : 14.0));`).join('\n          ')}
          return g;
        }`;
      const uTime = { value: 0 };

      // ---- paint material: a normal lit material (so real light, shadow and fog still work) whose colour and shading
      // are broken up by the dab field. o: a, b = the two colours dabs vary between; c = accent colour for a few dabs;
      // dabs = 'sweep' | 'upright'; size = stroke size; tilt = how much dabs facet the shading; at = its station;
      // moving = the object moves, so its dabs are fixed in its rest pose with bake(); blend = the ground (mixes
      // stations per vertex); wind = 'blade' (instances rooted in the ground bend from the root) | 'head' (instances
      // on a stem `stem` long sway as a whole); plus any MeshStandardMaterial option.
      const paint = (o = {}) => {
        const { a = '#ffffff', b = a, c = b, dabs = 'sweep', size = 1, tilt = 0.5, at = 'mill', moving = false, blend = false, wind = null, stem = 0.4, ...std } = o;
        const m = new THREE.MeshStandardMaterial(Object.assign({ roughness: 1, metalness: 0 }, std));
        const u = { uDabs: { value: DABS[dabs] }, uRef: { value: REF[at] }, uRefs: { value: GROUND_REFS }, uA: { value: lin(a) }, uB: { value: lin(b) }, uC: { value: lin(c) }, uTilt: { value: tilt },
          uScale: { value: dabScale(size) }, uOff: { value: new THREE.Vector2(rnd(), rnd()) }, uTime, uStem: { value: stem } };
        m.defines = {};
        if (moving) m.defines.DAB_BAKED = '';
        if (blend) m.defines.DAB_BLEND = '';
        if (wind) m.defines[wind === 'head' ? 'WIND_HEAD' : 'WIND_BLADE'] = '';
        m.onBeforeCompile = (sh) => {
          Object.assign(sh.uniforms, u);
          sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
            uniform mat4 uRef, uRefs[4]; uniform float uTime, uStem; attribute vec3 dabClip; attribute vec4 dabMix; varying vec3 vDab, vDab1, vDab2, vDab3; varying vec4 vDabMix; varying float vGust;
            ${GUST_GLSL}`)
            .replace('#include <project_vertex>', `
              vec4 mvPosition = vec4(transformed, 1.0);
              #ifdef USE_INSTANCING
                mvPosition = instanceMatrix * mvPosition;
              #endif
              // dabs are looked up where the thing stands at rest, before the wind moves it
              #if defined(DAB_BAKED)
                vDab = dabClip;
              #elif defined(DAB_BLEND)
                vec4 dW = modelMatrix * mvPosition;
                vDab = (uRefs[0] * dW).xyw; vDab1 = (uRefs[1] * dW).xyw; vDab2 = (uRefs[2] * dW).xyw; vDab3 = (uRefs[3] * dW).xyw; vDabMix = dabMix;
              #else
                vDab = (uRef * modelMatrix * mvPosition).xyw;
              #endif
              vGust = 0.0;
              #if defined(USE_INSTANCING) && (defined(WIND_BLADE) || defined(WIND_HEAD))
                vec3 root = instanceMatrix[3].xyz;
                vGust = gustAt(root.xz, uTime);
                float lean = 0.12 + 0.11 * sin(uTime * 3.2 - dot(root.xz, WIND) * 1.1 + 0.6 * sin(root.z * 0.7 + root.x * 0.3)) + vGust * (0.6 + 0.1 * sin(uTime * 13.0 + root.x * 3.0 + root.z * 2.0));   // ripples run downwind all the time; a gust leans everything hard and makes it flutter
                #ifdef WIND_BLADE
                  float tall = mvPosition.y - root.y, bendAt = lean * clamp(position.y, 0.0, 1.2);    // the stalk curves: no lean at the root, all of it at the tip
                  mvPosition.xz += WIND * sin(bendAt) * tall; mvPosition.y = root.y + tall * cos(bendAt);
                #else
                  mvPosition.xz += WIND * sin(lean) * uStem; mvPosition.y -= (1.0 - cos(lean)) * uStem;
                #endif
              #endif
              mvPosition = modelViewMatrix * mvPosition;
              gl_Position = projectionMatrix * mvPosition;`);
          sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uDabs; uniform vec2 uScale, uOff; uniform vec3 uA, uB, uC; uniform float uTilt; varying vec3 vDab, vDab1, vDab2, vDab3; varying vec4 vDabMix; varying float vGust;')
            .replace('#include <map_fragment>', `
              #ifdef DAB_BLEND
                vec4 dab = vDabMix.x * texture2D(uDabs, vDab.xy / vDab.z * uScale + uOff) + vDabMix.y * texture2D(uDabs, vDab1.xy / vDab1.z * uScale + uOff + 0.31)
                  + vDabMix.z * texture2D(uDabs, vDab2.xy / vDab2.z * uScale + uOff + 0.57) + vDabMix.w * texture2D(uDabs, vDab3.xy / vDab3.z * uScale + uOff + 0.83);
              #else
                vec4 dab = texture2D(uDabs, vDab.xy / vDab.z * uScale + uOff);
              #endif
              vec3 dabCol = mix(uA, uB, smoothstep(0.1, 0.9, dab.b));
              dabCol = mix(dabCol, uC, step(0.86, fract(dab.b * 5.3 + dab.r * 3.1)));
              diffuseColor.rgb *= dabCol * (1.0 + (dab.a - 0.5) * 0.4) * (1.0 + 0.5 * vGust);`)   // bent stalks show their pale sides: the gust is a bright band
            .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = normalize(normal + vec3(dab.rg - 0.5, 0.0) * uTilt);')
            .replace('#include <fog_fragment>', '#include <fog_fragment>\ngl_FragColor.rgb *= 1.0 + (dab.b - 0.5) * 0.3 + (dab.a - 0.5) * 0.14;');   // haze is painted too: far things keep their strokes
        };
        return m;
      };
      // project an object's vertices from its station once, in the pose it has now, and keep that with the geometry
      const bake = (obj, at) => {
        obj.updateWorldMatrix(true, true);
        obj.traverse((m) => {
          if (!m.isMesh) return;
          const g = (m.geometry = m.geometry.clone()), p = g.attributes.position, out = new Float32Array(p.count * 3), v = new THREE.Vector4();
          for (let i = 0; i < p.count; i++) { v.set(p.getX(i), p.getY(i), p.getZ(i), 1).applyMatrix4(m.matrixWorld).applyMatrix4(REF[at]); out.set([v.x, v.y, v.w], i * 3); }
          g.setAttribute('dabClip', new THREE.BufferAttribute(out, 3));
        });
        return obj;
      };
      const add = (geo, mat, pos = [0, 0, 0], o = {}) => {
        const m = new THREE.Mesh(geo, mat); m.position.set(pos[0], pos[1], pos[2]);
        if (o.rot) m.rotation.set(o.rot[0], o.rot[1], o.rot[2]);
        if (o.scale) m.scale.set(o.scale[0], o.scale[1], o.scale[2]);
        m.castShadow = o.cast !== false; m.receiveShadow = true; (o.parent || scene).add(m); return m;
      };
      const group = (pos, parent = scene, yaw = 0) => { const g = new THREE.Group(); g.position.set(pos[0], pos[1], pos[2]); g.rotation.y = yaw; parent.add(g); return g; };
      const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

      // ---- light: a low sun from behind-left, blue sky in every shadow, a little warm bounce from the ground
      const sunDir = (el, az) => V(-Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
      const lightElev = K.track([[0, 0.27], [DURATION, 0.22, 'linear']]);         // the light sinks during the clip, so shadows lengthen
      const discElev = K.track([[0, 0.068], [DURATION, 0.05, 'linear']]);        // the painted sun sits lower and slips behind the ridge
      K.env(S, { top: '#3f72c0', horizon: '#c9a0b4', bottom: '#3a4a2a', intensity: 0.85 });
      const sun = K.sun(S, { color: '#ffc27c', power: 5.6, size: 30, soft: 1.0, mapSize: 4096, far: 140, normalBias: 0.06 });
      const bounce = new THREE.DirectionalLight('#ff9a6a', 0.7); bounce.position.set(-6, -10, -8); scene.add(bounce);
      scene.fog = new THREE.FogExp2('#d9a59e', 0.0078);                    // dusty rose haze: distance cools and pales everything
      const lampLight = (parent, pos, power, reach) => { const l = new THREE.PointLight('#ffa23c', power, reach, 2); l.position.set(pos[0], pos[1], pos[2]); parent.add(l); return l; };

      // ---- sky and water share one sky function, so the river reflects the sunset it sits under
      const SKY = `
        uniform vec3 uSun; uniform float uDusk, uTime;
        float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
        float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
        float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + 17.0; a *= 0.5; } return s; }
        vec3 skyColor(vec3 d){
          float y = clamp(d.y, 0.0, 1.0), s = max(dot(d, uSun), 0.0);
          vec3 c = mix(vec3(1.0, 0.52, 0.20), vec3(0.93, 0.58, 0.42), smoothstep(0.0, 0.07, y));       // ember at the horizon, then rose
          c = mix(c, vec3(0.17, 0.28, 0.44), smoothstep(0.04, 0.14, y));                              // slate blue
          c = mix(c, vec3(0.035, 0.09, 0.25), smoothstep(0.11, 0.30, y));                             // deep blue overhead
          c *= 1.0 - 0.18 * uDusk;
          vec3 off = d - uSun;
          c += vec3(1.0, 0.46, 0.14) * exp(-dot(off.xz, off.xz) * 3.5 - off.y * off.y * 60.0) * 0.8 + vec3(1.0, 0.8, 0.45) * pow(s, 150.0);   // a glow that hugs the horizon, and a hot core
          // clouds: a flat deck seen in perspective, stretched along the wind, drifting. An edge that thins out toward
          // the sun is lit salmon, the body stays mauve.
          vec2 q = d.xz / (y + 0.1) * vec2(0.5, 1.7) + vec2(uTime * 0.035, 0.0);
          float body = fbm(q), toSun = fbm(q + normalize(uSun.xz) * vec2(0.14, 0.45));
          float cover = smoothstep(0.47, 0.62, body) * smoothstep(0.015, 0.05, y) * mix(0.12, 1.0, smoothstep(0.16, 0.09, y));
          vec3 cloud = mix(vec3(0.30, 0.24, 0.42), vec3(1.25, 0.60, 0.36), clamp(0.45 + (body - toSun) * 7.0, 0.0, 1.0)) + vec3(0.7, 0.35, 0.1) * pow(s, 5.0);
          c = mix(c, cloud, cover * 0.92);
          return c + vec3(9.0, 6.4, 3.0) * smoothstep(0.99962, 0.99975, s);                           // the disc
        }`;
      const SKY_VS = 'uniform mat4 uRef; varying vec3 vDab, vWorld; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; vec4 c = uRef * w; vDab = c.xyw; gl_Position = projectionMatrix * viewMatrix * w; }';
      const skyU = { uSun: { value: V(0, 0, -1) }, uDusk: { value: 0 }, uTime, uRef: { value: REF.mill }, uDabs: { value: DABS.sweep }, uScale: { value: dabScale(1) } };
      add(new THREE.SphereGeometry(400, 48, 24), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: skyU, vertexShader: SKY_VS,
        fragmentShader: `uniform sampler2D uDabs; uniform vec2 uScale; varying vec3 vDab, vWorld; ${SKY}
          void main(){
            vec4 dab = texture2D(uDabs, vDab.xy / vDab.z * uScale / 2.1);                             // big sweeping strokes
            vec3 c = skyColor(normalize(vWorld - cameraPosition));
            c *= 1.0 + (dab.b - 0.5) * 0.34 + (dab.a - 0.5) * 0.2; c += (dab.r - 0.5) * vec3(0.12, 0.0, -0.1) * (0.2 + c.g);   // broken colour: each dab leans warm or cool
            gl_FragColor = vec4(c, 1.0);
          }` }), [0, 0, 0], { cast: false });
      add(new THREE.PlaneGeometry(400, 400), new THREE.ShaderMaterial({ uniforms: skyU, vertexShader: SKY_VS,
        fragmentShader: `uniform sampler2D uDabs; uniform vec2 uScale; varying vec3 vDab, vWorld; ${SKY}
          void main(){
            vec4 dab = texture2D(uDabs, vDab.xy / vDab.z * uScale / 1.3 + vec2(uTime * 0.008, 0.0));   // on water the dabs are ripples, so they are allowed to drift
            vec3 r = reflect(normalize(vWorld - cameraPosition), normalize(vec3((dab.r - 0.5) * 0.12, 1.0, (dab.g - 0.5) * 0.22)));
            r.y = abs(r.y);
            gl_FragColor = vec4(skyColor(r) * vec3(0.78, 0.84, 0.9) + vec3(0.0, 0.02, 0.03), 1.0);
          }` }), [0, -0.3, -100], { rot: [-Math.PI / 2, 0, 0], cast: false });

      // ---- the ground mesh: local colour per vertex, dabs blended between stations per vertex
      const LAND = { meadow: lin('#5f8a36'), lush: lin('#2f6b3c'), sunny: lin('#a3a83a'), wheat: lin('#dba13a'), straw: lin('#efd07a'), earth: lin('#a5532f'), lavender: lin('#7a5aa6'), sand: lin('#e6c79c'), reed: lin('#3c5a2e'), ridge: lin('#3f6658'), blue: lin('#4c5f90'), violet: lin('#6c68a4') };
      const FIELDS = [LAND.wheat, LAND.meadow, LAND.straw, LAND.lavender, LAND.lush, LAND.earth, LAND.wheat, LAND.sunny];
      const landColor = (x, z, out) => {
        const n = nz.fbm(x * 0.2, z * 0.2, 5, 3), dr = Math.abs(x - riverX(z));
        out.copy(LAND.meadow).lerp(LAND.lush, K.smooth(-0.1, 0.35, n)).lerp(LAND.sunny, K.smooth(0.1, 0.4, -n));
        if (z < -11) {                                                                                // the valley floor is a patchwork of strip fields
          const strip = Math.floor((z + 0.35 * x + 3 * nz.n2(x * 0.05, z * 0.05)) / (2.5 + Math.max(0, -z) * 0.09)), block = Math.floor((x + 40) / 13 + K.hash(strip) * 3);
          out.lerp(FIELDS[Math.floor(K.hash(strip, block) * FIELDS.length)], 0.85 * K.smooth(-11, -15, z));
        }
        out.lerp(LAND.wheat, K.smooth(-0.12, 0.05, inField(x, z)));                                   // stubble gold under the wheat
        out.lerp(LAND.reed, K.smooth(2.6, 1.0, dr / (1 + Math.max(0, -z) * 0.03)));
        out.lerp(LAND.ridge, K.smooth(-27, -36, z)).lerp(LAND.blue, K.smooth(-55, -70, z)).lerp(LAND.violet, K.smooth(-105, -125, z));   // each ridge further back is bluer
        return out.lerp(LAND.sand, K.smooth(0.55, 0.3, trackDist(x, z)));
      };
      {
        const NX = 440, NZ = 320, g = new THREE.PlaneGeometry(1, 1, NX, NZ), p = g.attributes.position, uv = g.attributes.uv, col = new Float32Array(p.count * 3), mix = new Float32Array(p.count * 4), c = new THREE.Color();
        for (let i = 0; i < p.count; i++) {
          // a grid that is fine where the story happens and coarse far away
          const u = uv.getX(i) * 2 - 1, au = Math.abs(u), v = uv.getY(i);
          const x = 4 + Math.sign(u) * (au < 0.5 ? 32 * au : 16 + 160 * Math.pow((au - 0.5) * 2, 2.2)), z = v < 0.45 ? 13 - 60 * v : -14 - 190 * Math.pow((v - 0.45) / 0.55, 1.7);
          p.setXYZ(i, x, ground(x, z), z); landColor(x, z, c); col.set([c.r, c.g, c.b], i * 3);
          const far = K.smooth(-9, -15, z), a = K.smooth(0.2, 2.6, x), b = K.smooth(7.4, 9.4, x);     // which station's dabs: field | yard | cottage near the lens, the mill view far away
          mix.set([(1 - a) * (1 - far), far, a * (1 - b) * (1 - far), b * (1 - far)], i * 4);
        }
        g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('dabMix', new THREE.BufferAttribute(mix, 4)); g.computeVertexNormals();
        add(g, paint({ a: '#aeb9d6', b: '#fff2c4', vertexColors: true, size: 1.15, tilt: 0.22, blend: true }));    // dabs push the local colour cool or warm
      }

      // ---- BEAT 1, the wheat: thousands of chunky stalks and ears that bend in the vertex shader when a gust passes
      {
        const r = K.rng(5), pts = [];
        while (pts.length < 11000) { const x = r.range(-11.5, 3.5), z = r.range(-4.6, 9), m = inField(x, z); if (m > 0 && r() < 0.35 + 0.65 * K.smooth(-4, 8, z)) pts.push([x, z, m]); }   // thicker toward the lens
        const stalk = new THREE.CylinderGeometry(0.012, 0.02, 0.9, 4, 4); stalk.translate(0, 0.45, 0);
        const ear = new THREE.LatheGeometry([[0, 0.8], [0.045, 0.84], [0.062, 0.94], [0.05, 1.06], [0, 1.16]].map((q) => new THREE.Vector2(q[0], q[1])), 5);
        const stalks = new THREE.InstancedMesh(stalk, paint({ a: '#7f7a2c', b: '#d6ab45', c: '#5f8a36', dabs: 'upright', size: 0.6, tilt: 0.5, at: 'field', wind: 'blade' }), pts.length);
        const ears = new THREE.InstancedMesh(ear, paint({ a: '#d08f24', b: '#ffd565', c: '#fff0aa', dabs: 'upright', size: 0.6, tilt: 0.6, at: 'field', wind: 'blade', emissive: '#ff8a20', emissiveIntensity: 0.16 }), pts.length);   // backlit ears glow a little
        pts.forEach(([x, z, m], i) => {
          const tall = r.range(1.0, 1.35) * (0.8 + 0.2 * K.smooth(0, 0.12, m)), rot = [r.range(-0.1, 0.1), r() * 6.28, r.range(-0.1, 0.1)], y = ground(x, z) - 0.02, fat = r.range(0.9, 1.35);
          K.place(stalks, i, [x, y, z], rot, [1, tall, 1]); K.place(ears, i, [x, y, z], rot, [fat, tall, fat]);
        });
        for (const m of [stalks, ears]) { m.receiveShadow = true; m.frustumCulled = false; scene.add(m); }
      }

      // ---- grass, poppies and fence posts beside the track, so the journey has something to slide past
      {
        const r = K.rng(4), blade = new THREE.ConeGeometry(0.035, 1, 3, 3); blade.translate(0, 0.5, 0);
        const spots = { field: [], yard: [], cottage: [] };
        const footprint = (x, z) => Math.min(Math.hypot(x - MILL[0], z - MILL[1]) - 3.3, Math.hypot(x - COT[0], z - COT[1]) - 2.6, Math.hypot(x - 7.6, z + 5.0) - 1.5);   // keep clear of the mill yard, the cottage and the cart
        while (spots.field.length + spots.yard.length + spots.cottage.length < 5200) {
          const x = r.range(-5, 19), z = r.range(-9, 11.5), d = trackDist(x, z);
          if (inField(x, z) > -0.03 || d < 0.6 || footprint(x, z) < 0 || r() > 0.25 + 0.75 * K.smooth(4.5, 0.8, d)) continue;   // tufts gather along the track
          spots[x < 1.4 ? 'field' : x < 8.4 ? 'yard' : 'cottage'].push([x, z]);
        }
        for (const [at, list] of Object.entries(spots)) {
          const grass = new THREE.InstancedMesh(blade, paint({ a: '#1f4a2c', b: '#7f9a34', c: '#d9a83a', dabs: 'upright', size: 0.5, tilt: 0.6, at, wind: 'blade' }), list.length);
          const poppies = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), paint({ a: '#c8241c', b: '#ff5a2a', size: 0.4, tilt: 0.6, at, wind: 'head', stem: 0.35, emissive: '#a01808', emissiveIntensity: 0.25 }), Math.floor(list.length / 22));
          list.forEach(([x, z], i) => {
            K.place(grass, i, [x, ground(x, z) - 0.02, z], [r.range(-0.25, 0.25), r() * 6, r.range(-0.3, 0.3)], [1.5, r.range(0.2, 0.62), 1.5]);
            if (i < poppies.count) K.place(poppies, i, [x + r.range(-0.2, 0.2), ground(x, z) + r.range(0.3, 0.5), z + r.range(-0.2, 0.2)], [r(), r(), r()], [0.085, 0.06, 0.085]);
          });
          for (const m of [grass, poppies]) { m.receiveShadow = true; m.frustumCulled = false; scene.add(m); }
        }
        const posts = new THREE.InstancedMesh(box(0.09, 0.8, 0.09), paint({ a: '#33262a', b: '#6a4c3c', dabs: 'upright', size: 0.5, at: 'field' }), 9);
        for (let i = 0; i < posts.count; i++) { const z = K.lerp(10.5, -3, i / (posts.count - 1)), x = K.lerp(1.6, 2.6, i / (posts.count - 1)) + 1.2 - 0.4 * Math.sin(i * 0.5); K.place(posts, i, [x, ground(x, z) + 0.34, z], [r.range(-0.08, 0.08), r(), r.range(-0.08, 0.08)]); }
        posts.castShadow = posts.receiveShadow = true; scene.add(posts);
      }

      // ---- trees and hedges: blobs, nothing more. The brush does the leaves. Trees lean when a gust reaches them.
      const leaf = paint({ a: '#1d4a3c', b: '#5d8f2e', c: '#c9862e', dabs: 'upright', size: 0.6, tilt: 0.7, flatShading: true, moving: true });
      const bark = paint({ a: '#4a2f2a', b: '#7a4a32', dabs: 'upright', size: 0.5, moving: true });
      const blob = new THREE.IcosahedronGeometry(1, 1);
      const trees = [[-1.6, -9, 'round', 1.7, 'mill'], [0.6, -10.5, 'poplar', 1.5, 'mill'], [-11.8, -5.5, 'round', 1.9, 'mill'], [-10.6, -11.5, 'poplar', 1.7, 'mill'], [-11.7, -12.3, 'poplar', 1.35, 'mill'], [8.6, -9.5, 'round', 1.6, 'mill'],
        [14.4, -5.0, 'poplar', 1.6, 'cottage'], [15.3, -4.0, 'poplar', 1.25, 'cottage'], [9.6, -7.4, 'round', 1.3, 'cottage'], [18.5, -7.5, 'round', 1.8, 'cottage'], [16.8, 0.6, 'round', 1.2, 'cottage']].map(([x, z, kind, s, at]) => {
        const g = group([x, ground(x, z), z]);
        add(new THREE.CylinderGeometry(0.05 * s, 0.09 * s, 1.0 * s, 5), bark, [0, 0.4 * s, 0], { parent: g });
        if (kind === 'poplar') add(blob, leaf, [0, 2.0 * s, 0], { parent: g, scale: [0.46 * s, 1.75 * s, 0.46 * s], rot: [0, x, 0] });
        else for (const [ox, oy, oz, rr] of [[0, 1.35, 0, 0.8], [-0.55, 1.0, 0.2, 0.55], [0.5, 1.05, -0.15, 0.6], [0.1, 1.8, 0.1, 0.5]]) add(blob, leaf, [ox * s, oy * s, oz * s], { parent: g, scale: [rr * s, rr * s * 0.85, rr * s], rot: [ox, oy * 3, oz] });
        bake(g, at);
        return { g, x, z, bend: kind === 'poplar' ? 0.1 : 0.035 };
      });
      {
        const hedge = new THREE.InstancedMesh(blob, paint({ a: '#1c4440', b: '#4c7a36', c: '#9a7a30', dabs: 'upright', size: 0.6, tilt: 0.6, flatShading: true }), 170), r = K.rng(8);
        for (let i = 0; i < hedge.count; i++) {
          let x, z; do { x = r.range(-48, 48); z = r.range(-52, -13); } while (Math.abs(x - riverX(z)) < 3.2 - z * 0.06);
          if (i % 3) z = Math.round(z / 5) * 5 + r.range(-0.4, 0.4);                                   // most of them line up as hedgerows along field edges
          const s = r.range(0.32, 0.62) * (1 - z * 0.014);
          K.place(hedge, i, [x, ground(x, z) + s * 0.55, z], [0, r() * 6, 0], [s * r.range(0.9, 1.5), s * r.range(0.8, 1.5), s]);
        }
        hedge.castShadow = hedge.receiveShadow = true; scene.add(hedge);
      }

      // ---- shared props: flour sacks (a lathe shape with a tied neck)
      const linen = (at, moving) => paint({ a: '#c9b48a', b: '#fff0cc', c: '#e2c08c', dabs: 'upright', size: 0.5, tilt: 0.45, at, moving, emissive: '#b08a58', emissiveIntensity: 0.3 });   // a little glow of their own keeps them cream in the shade
      const stripe = (at, moving) => paint({ a: '#34557e', b: '#4f77a0', size: 0.4, at, moving });
      const cord = (at) => paint({ a: '#5a3a2a', b: '#7a5038', size: 0.4, at });
      const sackGeo = new THREE.LatheGeometry([[0, 0], [0.25, 0], [0.33, 0.1], [0.35, 0.32], [0.3, 0.54], [0.17, 0.68], [0.11, 0.73], [0.19, 0.84], [0, 0.82]].map((q) => new THREE.Vector2(q[0], q[1])), 12);
      const sack = (parent, at, pos, o = {}) => {
        const g = group(pos, parent, o.yaw || 0); g.rotation.z = o.lie || 0; g.scale.setScalar(o.s || 1);
        add(sackGeo, linen(at), [0, 0, 0], { parent: g }); add(new THREE.TorusGeometry(0.12, 0.022, 5, 10), cord(at), [0, 0.73, 0], { parent: g, rot: [Math.PI / 2, 0, 0] });
        for (const y of [0.24, 0.36]) add(new THREE.CylinderGeometry(0.357, 0.357, 0.05, 12, 1, true), stripe(at), [0, y, 0], { parent: g, cast: false });   // two blue stripes: a flour sack, not a boulder
        return g;
      };

      // ---- BEAT 2, the windmill: an eight-sided tower whose ground floor has one face left open as the door, a cap
      // and four sails; inside, a lamp and the stones
      const mill = group(G(MILL[0], -0.05, MILL[1]), scene, MILL_YAW);
      const stone = (at, o = {}) => paint(Object.assign({ a: '#cdbba6', b: '#fff0d4', c: '#e9b98c', dabs: 'upright', size: 0.75, tilt: 0.35, flatShading: true, at }, o));
      const wood = (at, o = {}) => paint(Object.assign({ a: '#4a2a26', b: '#8a4a30', dabs: 'upright', size: 0.55, tilt: 0.5, flatShading: true, at }, o));
      const glow = (hex, k) => new THREE.MeshStandardMaterial({ color: '#2a1a12', emissive: hex, emissiveIntensity: k, roughness: 1 });
      const P8 = Math.PI / 8;
      add(new THREE.CylinderGeometry(1.34, 1.62, 2.1, 8, 1, true, P8, Math.PI * 2 - 2 * P8), stone('yard', { side: THREE.DoubleSide, size: 0.9 }), [0, 1.05, 0], { parent: mill });   // seven faces: the eighth is the doorway
      add(new THREE.CircleGeometry(1.5, 8), wood('yard'), [0, 0.03, 0], { parent: mill, rot: [-Math.PI / 2, 0, 0], cast: false });                   // floor
      add(new THREE.CylinderGeometry(1.46, 1.46, 0.16, 8, 1, false, P8), wood('mill'), [0, 2.16, 0], { parent: mill });                              // the beam ring between the floors
      add(new THREE.CylinderGeometry(0.8, 1.34, 2.7, 8, 1, false, P8), stone('mill'), [0, 3.59, 0], { parent: mill });
      add(new THREE.ConeGeometry(0.98, 1.1, 8, 1, false, P8), wood('mill'), [0, 5.47, 0], { parent: mill });
      for (const x of [-0.6, 0.6]) add(box(0.13, 2.1, 0.16), wood('yard'), [x, 1.05, 1.44], { parent: mill });                                        // door posts and lintel
      add(box(1.5, 0.17, 0.22), wood('yard'), [0, 2.1, 1.42], { parent: mill });
      add(box(0.07, 1.9, 1.0), wood('yard', { a: '#6a4a3a', b: '#b08258' }), [0.86, 0.98, 1.86], { parent: mill, rot: [0, -0.75, 0] });              // the door leaf, swung open
      add(box(0.3, 0.36, 0.06), glow('#ffa028', 1.6), [0, 3.5, 1.02], { parent: mill, rot: [-0.18, 0, 0], cast: false });                             // the miller's window
      lampLight(mill, [0, 1.75, 0.55], 3.2, 7);
      // the stones: a fixed bed stone on a timber frame, and the runner stone turning on it with its shaft and cog wheel
      add(box(1.4, 0.6, 1.4), wood('yard'), [0, 0.3, 0.1], { parent: mill });
      add(new THREE.CylinderGeometry(0.66, 0.66, 0.2, 14), stone('yard', { a: '#8f867f', b: '#c9bfb2', size: 0.5 }), [0, 0.7, 0.1], { parent: mill });
      const runner = group([0, 0.82, 0.1], mill);
      const grit = stone('yard', { a: '#a89c92', b: '#f1e6d6', c: '#7d7470', size: 0.45, tilt: 0.6, moving: true }), turning = wood('yard', { moving: true, a: '#3a2420', b: '#7a4a30' });
      add(new THREE.CylinderGeometry(0.62, 0.62, 0.3, 14), grit, [0, 0.15, 0], { parent: runner });
      add(new THREE.CylinderGeometry(0.635, 0.635, 0.06, 14), turning, [0, 0.15, 0], { parent: runner });                                             // iron band
      add(box(1.16, 0.06, 0.16), turning, [0, 0.32, 0], { parent: runner });                                                                          // the bar that drives the stone: it shows the turning
      for (let i = 0; i < 4; i++) add(box(0.14, 0.2, 0.12), turning, [0.66 * Math.cos(i * Math.PI / 2 + 0.6), 0.15, 0.66 * Math.sin(i * Math.PI / 2 + 0.6)], { parent: runner, rot: [0, -i * Math.PI / 2 - 0.6, 0] });
      add(box(0.12, 0.98, 0.12), turning, [0, 0.79, 0], { parent: runner });                                                                          // shaft
      add(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 16), turning, [0, 1.06, 0], { parent: runner });                                                 // cog wheel
      for (let i = 0; i < 10; i++) add(box(0.07, 0.16, 0.07), turning, [0.44 * Math.cos(i * 0.6283), 0.96, 0.44 * Math.sin(i * 0.6283)], { parent: runner });
      bake(runner, 'yard');
      // cap and sails face into the wind (and, a painter's cheat, a little toward us)
      const head = group([HEAD[0], HEAD[1], HEAD[2]], scene, -0.5);
      const rotor = group([0, 0, 1.0], head);
      rotor.rotation.x = -0.14;   // the windshaft is tilted, as on a real mill: the tower widens downwards, and upright sails would cut into its wall each time one points down
      const sailMat = paint({ a: '#e2c79c', b: '#fff3d2', dabs: 'upright', size: 0.6, tilt: 0.4, moving: true, side: THREE.DoubleSide, emissive: '#ff9a4a', emissiveIntensity: 0.22 });   // sailcloth lets some sun through
      const sparMat = paint({ a: '#4a2a26', b: '#7a4530', dabs: 'upright', size: 0.5, moving: true });
      add(new THREE.CylinderGeometry(0.13, 0.13, 0.5, 8), sparMat, [0, 0, -0.15], { parent: rotor, rot: [Math.PI / 2, 0, 0] });
      for (let k = 0; k < 4; k++) {
        const arm = new THREE.Group(); arm.rotation.z = k * Math.PI / 2; rotor.add(arm);
        add(box(0.1, 2.65, 0.08), sparMat, [0, 1.32, 0], { parent: arm });
        add(new THREE.PlaneGeometry(0.62, 1.95), sailMat, [0.36, 1.6, 0.02], { parent: arm, rot: [0, -0.12, 0] });
        for (let j = 0; j < 5; j++) add(box(0.66, 0.04, 0.04), sparMat, [0.36, 0.7 + j * 0.45, 0.05], { parent: arm });
      }
      bake(rotor, 'mill');

      // ---- BEAT 3, flour: a spout from the stones, an open sack under it that fills, full sacks by the door, a cart
      const chute = group([-1.17, 1.05, 1.17], mill, -Math.PI / 4);                                                                                   // the meal spout comes out through the wall beside the door
      add(box(0.26, 0.05, 0.95), wood('yard', { a: '#7a5236', b: '#c08a56' }), [0, 0, 0], { parent: chute, rot: [0.3, 0, 0] });
      for (const x of [-0.13, 0.13]) add(box(0.035, 0.13, 0.95), wood('yard', { a: '#7a5236', b: '#c08a56' }), [x, 0.04, 0], { parent: chute, rot: [0.3, 0, 0] });
      const SPOUT = [-1.47, 0.9, 1.47];                                                                                                               // its mouth, in the mill's axes
      const openSack = group([SPOUT[0] - 0.03, -0.06, SPOUT[2] + 0.05], mill);
      add(new THREE.LatheGeometry([[0, 0], [0.27, 0], [0.36, 0.1], [0.38, 0.3], [0.35, 0.46], [0.37, 0.52], [0.32, 0.54]].map((q) => new THREE.Vector2(q[0], q[1])), 12), linen('yard', true), [0, 0, 0], { parent: openSack });
      for (const y of [0.2, 0.3]) add(new THREE.CylinderGeometry(0.387, 0.387, 0.045, 12, 1, true), stripe('yard', true), [0, y, 0], { parent: openSack, cast: false });
      const mound = add(new THREE.SphereGeometry(0.31, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#fffaf0', roughness: 1, emissive: '#f4e6cc', emissiveIntensity: 0.75 }), [0, 0.4, 0], { parent: openSack, cast: false });
      bake(openSack, 'yard');
      const stream = add(new THREE.CylinderGeometry(0.04, 0.055, 1, 6), new THREE.MeshBasicMaterial({ color: '#fff8ea', transparent: true }), [0, 0, 0], { parent: mill, cast: false });
      sack(mill, 'yard', [-2.35, -0.08, 0.8], { yaw: 0.4 }); sack(mill, 'yard', [-2.8, -0.1, 0.15], { yaw: 1.3, s: 1.08 }); sack(mill, 'yard', [-2.55, 0.52, 0.5], { yaw: 0.9, lie: 1.45, s: 0.95 });
      // flour dust: soft round sprites. Each one bursts out of the sack, then rides the wind toward the cottage and thins out.
      const puffTex = K.canvasTex(128, 128, (ctx) => { const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 62); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.35, 'rgba(255,255,255,0.5)'); g.addColorStop(0.7, 'rgba(255,255,255,0.15)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128); });
      const MOUTH = V(...millPt(SPOUT[0], 0.5, SPOUT[2] + 0.05));
      const puffs = Array.from({ length: 26 }, (_, i) => {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color: '#fff1dc', transparent: true, depthWrite: false })); scene.add(s);
        const a = K.hash(i, 5) * 6.28, up = 0.5 + 0.9 * K.hash(i, 6);
        return { s, born: SACK_FULL + 0.22 * K.hash(i, 7), burst: V(Math.cos(a) * 0.75, up * 1.1, Math.sin(a) * 0.4 + 0.25), speed: 2.2 + 1.3 * K.hash(i, 8), size: 0.3 + 0.35 * K.hash(i, 9), rise: 0.1 + 0.4 * K.hash(i, 10) };
      });
      // the cart on the track, loaded for the bakery
      {
        const cart = group(G(7.6, 0.06, -5.3), scene, 0.12), w = wood('yard', { a: '#8a5a34', b: '#d69a5a' });
        add(box(1.7, 0.1, 0.95), w, [0, 0.62, 0], { parent: cart });
        for (const z of [-0.47, 0.47]) add(box(1.7, 0.3, 0.06), w, [0, 0.8, z], { parent: cart });
        for (const x of [-0.85, 0.85]) add(box(0.06, 0.3, 0.95), w, [x, 0.8, 0], { parent: cart });
        for (const z of [-0.36, 0.36]) add(box(1.5, 0.07, 0.07), w, [1.5, 0.4, z], { parent: cart, rot: [0, 0, -0.33] });                             // shafts resting on the ground
        for (const z of [-0.58, 0.58]) {
          const wheel = group([-0.1, 0.5, z], cart);
          add(new THREE.TorusGeometry(0.5, 0.07, 6, 18), w, [0, 0, 0], { parent: wheel });
          for (let i = 0; i < 4; i++) add(box(0.98, 0.07, 0.05), w, [0, 0, 0], { parent: wheel, rot: [0, 0, i * Math.PI / 4] });
        }
        sack(cart, 'yard', [-0.42, 0.67, 0.02], { yaw: 0.3 }); sack(cart, 'yard', [0.3, 0.67, -0.05], { yaw: 1.9, s: 1.05 }); sack(cart, 'yard', [-0.02, 1.2, 0], { yaw: 0.6, lie: 1.5, s: 0.9 });
      }

      // ---- BEAT 4, the bakery: a cottage with real walls, so the window is a hole with a lit room and an oven behind
      // it, and the loaf can come out of it
      const cot = group(G(COT[0], -0.08, COT[1]), scene, COT_YAW);
      const plaster = (at, o = {}) => paint(Object.assign({ a: '#9c9092', b: '#dccdbb', dabs: 'upright', size: 0.6, tilt: 0.3, at }, o));
      const roofMat = paint({ a: '#8a3028', b: '#c85a30', c: '#e07a3a', size: 0.55, tilt: 0.5, at: 'cottage' });
      const teal = (at) => paint({ a: '#1f4f5f', b: '#2f6f78', dabs: 'upright', size: 0.5, at });
      const room = paint({ a: '#8a4a26', b: '#c8763a', dabs: 'upright', size: 0.6, at: 'sill', emissive: '#ff7a20', emissiveIntensity: 0 });          // the walls inside glow once the oven is lit
      add(box(3.4, 1.9, 0.16), room, [0, 0.95, -1.17], { parent: cot }); add(box(3.42, 1.9, 0.04), plaster('cottage'), [0, 0.95, -1.27], { parent: cot });
      for (const x of [-1.62, 1.62]) { add(box(0.16, 1.9, 2.5), plaster('cottage'), [x, 0.95, 0], { parent: cot }); add(box(0.04, 1.86, 2.2), room, [x * 0.94, 0.95, 0], { parent: cot, cast: false }); }
      for (const [x, y, w, h] of [[-1.375, 0.95, 0.65, 1.9], [0.775, 0.95, 1.85, 1.9], [-0.6, 0.4, 0.9, 0.8], [-0.6, 1.75, 0.9, 0.3]]) add(box(w, h, 0.16), plaster('sill', { size: 1.3 }), [x, y, 1.17], { parent: cot });   // front wall around the window
      const gable = new THREE.Shape(); gable.moveTo(-1.5, 0); gable.lineTo(1.5, 0); gable.lineTo(0, 1.3); gable.closePath();
      add(new THREE.ExtrudeGeometry(gable, { depth: 3.9, bevelEnabled: false }), roofMat, [-1.95, 1.88, 0], { parent: cot, rot: [0, Math.PI / 2, 0] });
      add(box(0.48, 1.3, 0.48), plaster('cottage'), [-1.25, 3.05, 0.3], { parent: cot });                                                               // chimney
      add(box(0.64, 1.36, 0.06), teal('cottage'), [1.0, 0.68, 1.27], { parent: cot });                                                                // door
      add(box(0.9, 0.1, 0.5), plaster('cottage', { a: '#77706e', b: '#a89f96' }), [1.0, 0.03, 1.5], { parent: cot });                                 // doorstep
      const oven = glow('#ff8418', 0);
      add(new THREE.CircleGeometry(0.34, 16, 0, Math.PI), oven, [-1.02, 0.95, -1.08], { parent: cot, cast: false }); add(box(0.68, 0.3, 0.02), oven, [-1.02, 0.8, -1.08], { parent: cot, cast: false });   // the oven mouth
      const roomLamp = lampLight(cot, [-0.4, 1.45, 0.1], 0, 6);
      // window: frame, sill, shutters, lantern
      const cream = paint({ a: '#bfae96', b: '#f2e4c8', dabs: 'upright', size: 0.5, at: 'sill' });
      for (const [x, y, w, h] of [[-1.08, 1.2, 0.07, 0.94], [-0.12, 1.2, 0.07, 0.94], [-0.6, 1.635, 1.03, 0.07]]) add(box(w, h, 0.08), cream, [x, y, 1.27], { parent: cot });
      add(box(1.2, 0.07, 0.46), cream, [-0.6, 0.78, 1.36], { parent: cot });
      const SILL_Y = 0.815;
      for (const sx of [-1, 1]) {
        add(box(0.44, 0.84, 0.05), teal('sill'), [-0.6 + sx * 0.72, 1.2, 1.28], { parent: cot });
        for (const y of [0.95, 1.45]) add(box(0.46, 0.07, 0.03), teal('sill'), [-0.6 + sx * 0.72, y, 1.315], { parent: cot, cast: false });
      }
      add(box(0.05, 0.05, 0.3), wood('sill'), [-1.42, 1.86, 1.38], { parent: cot }); add(box(0.14, 0.2, 0.14), glow('#ffb850', 2.4), [-1.42, 1.72, 1.5], { parent: cot, cast: false });
      const lantern = lampLight(cot, [-1.15, 1.6, 1.85], 1.5, 4.5);
      sack(cot, 'cottage', [1.72, 0, 1.6], { yaw: 0.8 }); sack(cot, 'cottage', [2.25, 0, 1.45], { yaw: 2.2, s: 0.92 });                               // the flour has arrived
      // the loaf, and the baker's peel that brings it out
      const loaf = group([-0.48, SILL_Y, 1.4], cot, 0.3);
      const crust = paint({ a: '#a9591c', b: '#eba445', c: '#c97a2a', size: 0.45, tilt: 0.6, at: 'sill', moving: true });
      add(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), crust, [0, 0.055, 0], { parent: loaf, scale: [0.31, 0.17, 0.2] });
      for (const x of [-0.15, 0, 0.15]) add(new THREE.SphereGeometry(1, 8, 5), paint({ a: '#f3dba6', b: '#fff3d0', size: 0.4, at: 'sill', moving: true, emissive: '#e8c890', emissiveIntensity: 0.35 }), [x, 0.052 + 0.165 * Math.sqrt(1 - (x / 0.31) ** 2), 0.01], { parent: loaf, scale: [0.03, 0.02, 0.125], rot: [0, 0.6, 0], cast: false });   // the baker's cuts
      bake(loaf, 'sill');
      const peel = group([-0.48, SILL_Y + 0.005, 1.4], cot, 0.0);
      const peelWood = wood('sill', { a: '#8a5a34', b: '#d69a5a', moving: true });
      add(box(0.5, 0.02, 0.5), peelWood, [0, 0, 0], { parent: peel }); add(box(0.05, 0.03, 1.5), peelWood, [0, 0, -1.0], { parent: peel });
      bake(peel, 'sill');

      // ---- smoke and steam: soft ribbons of pale paint that rise and lean with the wind, rebuilt for every frame
      // from a formula of time
      const plume = (o) => {
        const N = o.n || 26, g = new THREE.PlaneGeometry(1, 1, 1, N - 1), fade = new Float32Array(N * 8), p = g.attributes.position;
        for (let i = 0; i < N * 2; i++) fade.set([1, 1, 1, Math.pow(1 - Math.floor(i / 2) / (N - 1), 1.2)], i * 4);
        g.setAttribute('color', new THREE.BufferAttribute(fade, 4));
        const mat = new THREE.MeshBasicMaterial({ color: o.color, vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide });
        add(g, mat, [0, 0, 0], { cast: false }).frustumCulled = false;
        return (t, base, lean, show) => {                                                            // puffs travel up along it
          mat.opacity = o.alpha * show;
          for (let i = 0; i < N; i++) {
            const k = i / (N - 1), along = o.h * (lean * Math.pow(k, 1.5) + 0.07 * k * Math.sin(7 * k - 2.4 * t + o.seed)), y = o.h * Math.pow(k, 0.75);
            const w = o.w * (0.15 + Math.pow(k, 0.8)) * (1 + 0.28 * Math.sin(15 * k - 5 * t + o.seed)), a = Math.atan2(0.75 * Math.pow(k + 0.02, -0.25), 1.5 * lean * Math.sqrt(k));
            for (const side of [-1, 1]) p.setXYZ(i * 2 + (side + 1) / 2, base.x + (along - side * w * Math.sin(a)) * WIND[0], base.y + y + side * w * Math.cos(a), base.z + (along - side * w * Math.sin(a)) * WIND[1]);
          }
          p.needsUpdate = true;
        };
      };
      const smoke = plume({ color: '#f0dfe0', alpha: 0.62, h: 3.0, w: 0.55, seed: 0 }), CHIMNEY = V(...cotPt(-1.25, 3.62, 0.3));
      const steam = [plume({ color: '#fff4e4', alpha: 0.45, h: 0.7, w: 0.1, n: 18, seed: 1 }), plume({ color: '#fff4e4', alpha: 0.32, h: 0.42, w: 0.06, n: 14, seed: 4 })];

      // ---- birds: two bent wings and a body each, rising out of the valley and over the mill
      const wing = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.2, 0, 0, -0.2, 0.5, 0.16, 0.22, 0, 0, -0.2, 0.5, 0.16, -0.12, 0.5, 0.16, 0.22, 0.5, 0.16, 0.22, 0.5, 0.16, -0.12, 1.08, 0.02, -0.26], 3));
      const birdMat = new THREE.MeshBasicMaterial({ color: '#33203a', side: THREE.DoubleSide, fog: false });
      const birds = Array.from({ length: 7 }, (_, i) => {
        const g = new THREE.Group(), L = new THREE.Mesh(wing, birdMat), R = new THREE.Mesh(wing, birdMat), body = new THREE.Mesh(new THREE.OctahedronGeometry(0.2), birdMat);
        R.scale.x = -1; body.scale.set(0.8, 0.8, 2.2); g.add(L, R, body); g.scale.setScalar(0.85 + 0.2 * K.hash(i, 3)); scene.add(g);
        const row = Math.ceil(i / 2), side = i % 2 ? 1 : -1;                                          // a loose V behind the leader
        return { g, L, R, off: V(-row * 0.8 + side * row * 0.9, K.hash(i, 1) * 0.7 - row * 0.2, -row * 1.1 - K.hash(i) * 0.5), phase: K.hash(i, 2) * 6 };
      });
      const flight = (t) => V(-9.5 + 2.4 * t, 8.6 + 0.4 * t + 0.25 * Math.sin(t * 0.9), -30 + 2.6 * t);

      const loafRest = loaf.position.clone(), peelRest = peel.position.clone(), LOAF = V(...cotPt(loafRest.x, SILL_Y + 0.2, loafRest.z));
      return {
        update(t) {
          uTime.value = t;
          // light: the sun sinks a little during the journey
          sun.target.position.set(5, 0, -2); sun.position.copy(sun.target.position).addScaledVector(sunDir(lightElev(t), 0.8), 70);   // the light comes from further to the side than the painted sun: a painter's cheat that shows more form
          sun.intensity = 5.6 * (1 - 0.1 * t / DURATION);
          skyU.uSun.value.copy(sunDir(discElev(t), 0.27)); skyU.uDusk.value = t / DURATION;

          // beat 1 -> 2: the gust that bent the wheat (in the vertex shader) reaches the trees and the sails
          for (const tr of trees) tr.g.rotation.z = -tr.bend * (0.3 * Math.sin(t * 1.7 + tr.x) + 2.2 * gustAt(tr.x, tr.z, t));
          rotor.rotation.z = -sailAngle(t);
          runner.rotation.y = STONE_GEAR * sailAngle(t - 0.15);

          // beat 3: flour runs while the stone is up to speed; the sack swells; when it is full it puffs
          const flow = K.seg(t, FLOUR_ON, FLOUR_ON + 0.5), fill = K.seg(t, FLOUR_ON, SACK_FULL, K.ease.out), plump = fill * (1 + 0.12 * (K.spring(t - SACK_FULL, 3, 0.4) - (t > SACK_FULL ? 1 : 0)));
          openSack.scale.set(0.88 + 0.12 * plump, 0.55 + 0.45 * plump, 0.88 + 0.12 * plump);
          mound.scale.set(0.7 + 0.3 * fill, 0.25 + 0.3 * fill, 0.7 + 0.3 * fill); mound.position.y = 0.3 + 0.2 * fill;
          const top = (mound.position.y + 0.25 * mound.scale.y) * openSack.scale.y - 0.06, len = Math.max(0.02, SPOUT[1] - top);
          stream.position.set(SPOUT[0], top + len / 2, SPOUT[2]); stream.scale.set(1 + 0.25 * Math.sin(t * 31), len, 1 + 0.25 * Math.sin(t * 23 + 1)); stream.material.opacity = flow; stream.visible = flow > 0;
          for (const q of puffs) {
            const age = t - q.born, m = q.s.material;
            q.s.visible = age > 0 && age < 3;
            if (!q.s.visible) continue;
            const drift = q.speed * (age - (1 - Math.exp(-1.6 * age)) / 1.6), out = 1 - Math.exp(-4 * age);   // a quick burst, then it picks up the speed of the wind
            q.s.position.set(MOUTH.x + q.burst.x * out + WIND[0] * drift, MOUTH.y + q.burst.y * out * 0.7 + q.rise * age, MOUTH.z + q.burst.z * out + WIND[1] * drift * 0.5);
            q.s.scale.setScalar(q.size * (0.6 + 1.3 * Math.pow(age, 0.6))); m.opacity = 0.34 * K.smooth(0, 0.1, age) * (1 - K.smooth(0.9, 3, age));
          }

          // beat 4: the oven is lit, smoke leans with the gust, the peel brings the loaf out and leaves it on the sill
          const warm = t < OVEN_ON ? 0.25 : 0.25 + 0.75 * K.spring(t - OVEN_ON, 2.4, 0.55) * (0.98 + 0.02 * Math.sin(t * 23) * Math.sin(t * 7.1));
          oven.emissiveIntensity = 1.7 * warm; room.emissiveIntensity = 0.3 * warm; roomLamp.intensity = 2.4 * warm;
          lantern.intensity = 1.5 * (0.985 + 0.015 * Math.sin(t * 17) * Math.sin(t * 5.3));
          smoke(t, CHIMNEY, 0.75 + 0.5 * gustAt(COT[0], COT[1], t), 1);
          const out = K.seg(t, LOAF_OUT, LOAF_DOWN, K.ease.inOut), back = K.seg(t, LOAF_DOWN + 0.08, LOAF_DOWN + 0.6, K.ease.inOut), set = K.seg(t, LOAF_DOWN + 0.05, LOAF_DOWN + 0.2, K.ease.in);
          peel.position.set(peelRest.x, peelRest.y - 0.65 * back * back, peelRest.z - 1.35 * (1 - out) - 1.2 * back);   // then it is drawn back and lowered out of sight
          loaf.position.set(loafRest.x, loafRest.y + 0.022 * (1 - set), loafRest.z - 1.35 * (1 - out));
          const settle = t > LOAF_DOWN + 0.2 ? 1 - 0.05 * Math.exp(-(t - LOAF_DOWN - 0.2) * 9) * Math.cos((t - LOAF_DOWN - 0.2) * 30) : 1;   // it lands with a tiny squash
          loaf.scale.set(1, settle, 1);
          steam.forEach((s, i) => s(t, V(LOAF.x + (i ? 0.17 : -0.07) * Math.cos(COT_YAW), LOAF.y - (i ? 0.06 : 0.03), LOAF.z - (i ? 0.17 : -0.07) * Math.sin(COT_YAW)), (i ? 0.15 : 0.4) + 0.2 * Math.sin(t * 1.3 + i * 2), K.seg(t, LOAF_DOWN - 0.3 + i * 0.3, LOAF_DOWN + 0.5 + i * 0.3)));

          const lead = flight(t), heading = flight(t + 0.1).sub(lead);
          birds.forEach((b) => {
            b.g.position.copy(lead).add(b.off); b.g.position.y += 0.12 * Math.sin(t * 2.2 + b.phase);
            b.g.lookAt(heading.clone().add(b.g.position));
            const flap = 0.5 + 0.42 * Math.sin(t * 8.5 + b.phase);                                     // wings stay above level, so a bird never turns edge-on to the lens
            b.L.rotation.z = flap; b.R.rotation.z = -flap;
          });

          K.look(camera, cam.pos(t), cam.aim(t));
          caption(t);
        },
      };
    },

    sound(k) {
      // a windy evening told in sound: the gust, the sails, the stones, flour, the oven, and one warm chord under it
      k.bed('room', 0, DURATION, { gain: 0.9 });
      k.music('pad', 0, DURATION, { bpm: 60, gain: 0.7, chords: [['D3', 'A3', 'D4', 'F#4'], ['G3', 'B3', 'D4', 'A4'], ['D3', 'A3', 'D4', 'F#4']] });
      k.noise(0, { dur: DURATION, color: 'pink', filter: 'bandpass', f: 520, q: 0.7, gain: 0.03, a: 1.0, hold: DURATION - 2, bus: 'amb' });   // the steady breeze
      k.withMinor(() => {
        // each gust: wind rising and passing left to right, with the dry hiss of stalks under the first one
        GUSTS.forEach((g, i) => {
          const t0 = Math.max(0, g.at - 2.6), d = g.at + 1 - t0;
          k.noise(t0, { dur: d, color: 'pink', filter: 'bandpass', f: [[0, 380], [d * 0.6, 900], [d, 420]], q: 0.8, gain: 0.2 * g.amp, a: d * 0.55, pan: -0.5 + 0.9 * i, verb: 0.2 });
          if (!i) k.noise(t0 + 0.4, { dur: 2.6, color: 'white', filter: 'highpass', f: [[0, 3200], [1.6, 5200], [2.6, 3600]], gain: 0.07, a: 1.3, pan: -0.3 });
        });
        for (const t of sailPasses()) {   // canvas pushing air, and the wooden shaft taking the load; loudest while the mill fills the frame
          const near = 0.35 + 0.65 * K.smooth(1.2, 3.0, t) * (1 - 0.85 * K.smooth(STONE_NEAR[1], STONE_NEAR[1] + 1.5, t));
          k.noise(Math.max(0, t - 0.3), { dur: 0.7, color: 'brown', filter: 'lowpass', f: [[0, 160], [0.3, 460], [0.7, 150]], gain: 0.26 * near, a: 0.3, pan: 0.3 });
          k.tone(t, { f: [[0, 96], [0.25, 78]], type: 'triangle', dur: 0.3, gain: 0.06 * near, a: 0.05, pan: 0.3 });
        }
        for (const t of BIRD_CALLS) k.tone(t, { f: [[0, 3300], [0.05, 4300], [0.11, 3600]], dur: 0.13, gain: 0.03, a: 0.01, pan: -0.5 + t * 0.12, verb: 0.5 });
        for (const w of lettering()) if (w.beat) k.play('stroke', w.t0, { dur: w.dur, material: 'brush', gain: 1.1, pan: -0.6 });
      });
      // the stones: a low rumble that comes up as the camera reaches the door, with the cog knocking on every tooth
      k.noise(STONE_NEAR[0] - 1, { dur: STONE_NEAR[1] - STONE_NEAR[0] + 2, color: 'brown', filter: 'lowpass', f: [[0, 120], [1.2, 240], [STONE_NEAR[1] - STONE_NEAR[0] + 2, 140]], gain: 0.34, a: 1.2, hold: STONE_NEAR[1] - STONE_NEAR[0] - 0.6, pan: 0.1 });
      k.withMinor(() => { for (const t of cogKnocks()) k.play('tock', t, { f: 240 + 30 * (Math.round(t * 100) % 2), gain: 0.2 * K.smooth(STONE_NEAR[0] - 0.5, STONE_NEAR[0], t) * (1 - K.smooth(STONE_NEAR[1], STONE_NEAR[1] + 0.9, t)), pan: 0.15 }); });
      k.noise(FLOUR_ON, { dur: SACK_FULL - FLOUR_ON, color: 'white', filter: 'highpass', f: 6000, gain: 0.018, a: 0.5, hold: SACK_FULL - FLOUR_ON - 1, pan: -0.15 });   // flour running
      k.play('thud', SACK_FULL, { gain: 0.28, f: 90, pan: -0.15 });                                   // the sack is full
      k.noise(SACK_FULL, { dur: 0.9, color: 'pink', filter: 'bandpass', f: [[0, 1800], [0.9, 700]], q: 0.6, gain: 0.12, a: 0.03, pan: -0.1, verb: 0.3 });
      // the bakery: the oven catches, wood slides on stone, the loaf is set down, and the chord resolves
      k.noise(OVEN_ON, { dur: 1.4, color: 'brown', filter: 'lowpass', f: [[0, 200], [0.3, 700], [1.4, 260]], gain: 0.2, a: 0.25, pan: 0.35 });
      k.tone(OVEN_ON + 0.05, { f: 'F#4', dur: 1.8, gain: 0.05, a: 0.1, pan: 0.35, verb: 0.6 });
      k.noise(LOAF_OUT, { dur: LOAF_DOWN - LOAF_OUT, color: 'pink', filter: 'bandpass', f: [[0, 900], [LOAF_DOWN - LOAF_OUT, 1500]], q: 1.4, gain: 0.07, a: 0.2, pan: 0.1 });
      k.play('tock', LOAF_DOWN + 0.2, { f: 190, gain: 0.5, pan: 0.05 });
      k.tone(LOAF_DOWN + 0.25, { f: 'D5', dur: 2.2, gain: 0.06, a: 0.02, verb: 0.7 }); k.tone(LOAF_DOWN + 0.25, { f: 'A5', dur: 2.0, gain: 0.03, a: 0.02, verb: 0.7 }); k.tone(LOAF_DOWN + 0.25, { f: 'F#5', dur: 2.0, gain: 0.03, a: 0.02, verb: 0.7 });
    },
  });
}
```
