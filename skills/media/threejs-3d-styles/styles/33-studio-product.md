# Studio Product (#33)

- **id:** `studio-product`
- **Category:** Products and screens
- **Use:** product
- **Reference duration:** 8 s
- **Google Fonts:** Inter, Space Grotesk
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`

## Style card

- **Look:** One physical product in a near-black seamless studio, filmed like a flagship launch: the object is carved out of the dark by strip softboxes and stands on a black mirror floor, with a single restrained line of type beside it.
- **Motion:** The product stays still and the light moves: a tall strip light glides across its surfaces again and again, changing colour as it goes, while the lens travels over the details in macro and then pulls back to the whole object. A counter ticks with the light and lands on the number in the copy.
- **Light:** Softboxes only, placed relative to the lens: a graded key strip that sweeps from side to side, two thin rim strips from behind that draw the outline, a soft box overhead for the top. Everything they do not touch stays black.
- **Materials:** Real product finishes with small precise details: powder coat with a fine orange-peel texture, turned steel with lathe lines and bevelled edges, a diamond-knurled ring, black anodised flutes with a bright cut chamfer, a laser-etched mark, a seam and a rubber foot.
- **Camera:** A long lens on a slider, one continuous move: two macro passes with very shallow focus (the collar, then the etched mark), a pull-back to the full product standing off-centre, and a slow push that never quite stops.
- **Finish:** True depth of field and motion blur, a soft bloom only where polished metal catches a strip light, filmic contrast with deep blacks, a light vignette and very fine grain.
- **Good for:** One product and one claim. The macro passes show what it is made of, the moving light and the counter act out the claim (here: a full day passes, it is still cold), and the lock-up states it in one line.

## Reference

- **Sample topic:** Launch film for "Tide", a made-up insulated steel water bottle: cold for 24 hours
- **Gallery description:** One physical product in a near-black seamless studio, filmed like a flagship launch: the object is carved out of the dark by strip softboxes and stands on a black mirror floor, with a single restrained line of type beside it.
- **Shown in the sample clip:** Launch film for "Tide", a made-up insulated steel water bottle: cold for 24 hours

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/studio-product.js`)

```js
{
  // ---------------------------------------------------------------- content (change this block for a new product)
  const COPY = {
    mark: 'TIDE',                       // the wordmark: etched on the product and set above the line in the lock-up
    line: ['Cold for', '# hours.'],     // the one line of copy; '#' is the counter
    count: 24, unit: 'HOURS',           // what the counter runs to while the light goes round, and its label
    spec: '710 ML  /  24 OZ',           // small print etched near the base
  };
  const FINISH = { coat: '#0b6a7c', steel: '#cfd3d8', anodised: '#30333a', rubber: '#050505' };

  // ---------------------------------------------------------------- the schedule (picture and sound share it)
  // The idea of the film: the light is the clock. The key strip crosses the product four times while its colour runs
  // through one day (dawn, noon, sunset, night, the next morning) and a counter runs to 24. The product never changes.
  const DAY = [0.2, 6.3];              // the counter runs 0 -> COPY.count across this window
  const SWEEPS = [[0, -26], [1.75, 62], [2.9, -64], [4.25, 60], [6.8, -52], [9.6, -34]];   // [time, angle of the key strip from the lens]: four passes, then a slow drift
  const LOCK = 5.25;                   // the lock-up starts to set; the counter lands inside it at DAY[1]
  const hoursAt = (K, t) => COPY.count * K.seg(t, DAY[0], DAY[1]);

  // ================================================================ reusable piece 1: the softbox rig
  // Studio softboxes as real rectangles of light, worked out per pixel instead of baked into an environment map, so
  // every box can move, dim and change colour through the shot and its reflection stays crisp on polished metal and
  // turns wide and soft on matte paint (a point light would show as a dot on anything glossy). Each box is
  //   { size: [w, h], dist, az, el, power, color, feather }
  // where az / el are degrees round and above the product, measured from the lens the way a photographer places
  // lights (0 = at the camera, 90 = camera right, 180 = straight behind), and any value may be a function of time.
  // `feather` grades the box from a hot edge to a soft one, like a strip light behind a diffusion scrim.
  function softboxRig(S, boxes, aim) {
    const { THREE } = S, N = boxes.length, vecs = () => boxes.map(() => new THREE.Vector3());
    const U = { rigC: { value: vecs() }, rigN: { value: vecs() }, rigU: { value: vecs() }, rigV: { value: vecs() }, rigL: { value: vecs() }, rigFeather: { value: boxes.map(() => 0) } };
    const PARS = `
      #define RIG_N ${N}
      uniform vec3 rigC[RIG_N], rigN[RIG_N], rigU[RIG_N], rigV[RIG_N], rigL[RIG_N];   // centre, facing, half-width axis, half-height axis, radiance
      uniform float rigFeather[RIG_N];
      uniform vec4 rigFinish;                                                         // clear-coat strength, clear-coat roughness, diffuse gain, specular gain
      varying vec3 vRigP;
      // how much of a box (-1..1 across) a blur of half-width w sees from position a: a box filter, so a wide blur also gets dimmer
      float rigBand(float a, float w) { float k = clamp((min(a + w, 1.0) - max(a - w, -1.0)) / (2.0 * w), 0.0, 1.0); return k * k * (3.0 - 2.0 * k); }
      // what a surface at P sees along its mirror direction R: every box the ray lands on, blurred by roughness and distance
      vec3 rigMirror(vec3 P, vec3 R, float rough) {
        vec3 sum = vec3(0.0);
        for (int i = 0; i < RIG_N; i++) {
          float dn = dot(R, rigN[i]); if (dn > -1e-3) continue;                       // only the lit face of a box shines
          float s = dot(rigC[i] - P, rigN[i]) / dn; if (s <= 0.0) continue;
          vec3 d = P + R * s - rigC[i];
          float hu = length(rigU[i]), hv = length(rigV[i]), a = dot(d, rigU[i]) / (hu * hu), b = dot(d, rigV[i]) / (hv * hv);
          float w = s * (0.004 + 1.5 * rough * rough);
          float grade = mix(1.0, 0.12 + 0.88 * smoothstep(-1.0, 0.85, clamp(a, -1.0, 1.0)), rigFeather[i]);
          sum += rigL[i] * rigBand(a, w / hu) * rigBand(b, w / hv) * grade;
        }
        return sum;
      }
      // the same boxes as soft diffuse light (area x both cosines / distance squared), with a wrapped terminator. A coloured
      // box tints its reflections fully but its diffuse light only a little: the highlights tell the time of day.
      vec3 rigWash(vec3 P, vec3 N) {
        vec3 sum = vec3(0.0);
        for (int i = 0; i < RIG_N; i++) {
          vec3 L = rigC[i] - P; float d2 = dot(L, L); L *= inversesqrt(d2);
          float area = 4.0 * length(rigU[i]) * length(rigV[i]);
          vec3 white = mix(vec3(dot(rigL[i], vec3(0.2126, 0.7152, 0.0722))), rigL[i], 0.35);      // mostly white, so the product keeps its own colour
          sum += white * area * clamp((dot(N, L) + 0.06) / 1.06, 0.0, 1.0) * max(dot(-L, rigN[i]), 0.0) / (PI * d2);
        }
        return sum;
      }`;
    const SHADE = `{
        vec3 rN = inverseTransformDirection(normal, viewMatrix), rV = normalize(cameraPosition - vRigP), rR = reflect(-rV, rN);
        float rF = pow(1.0 - saturate(dot(rN, rV)), 5.0);
        vec3 rF0 = mix(vec3(0.04), diffuseColor.rgb, metalnessFactor);
        outgoingLight += rigWash(vRigP, rN) * diffuseColor.rgb * (1.0 - metalnessFactor) * rigFinish.z;
        float rRough = material.roughness;                                                        // three.js has already widened it on tight curves, which keeps thin bevels from sparkling
        outgoingLight += rigMirror(vRigP, rR, rRough) * (rF0 + (max(vec3(1.0 - rRough), rF0) - rF0) * rF) * rigFinish.w;
        outgoingLight += rigMirror(vRigP, rR, max(rigFinish.y, rRough - roughnessFactor)) * (0.04 + 0.96 * rF) * rigFinish.x;   // the lacquer on top
      }
      #include <opaque_fragment>`;
    const at = (v, t) => (typeof v === 'function' ? v(t) : v), col = new THREE.Color(), up = new THREE.Vector3(0, 1, 0), rad = Math.PI / 180;
    return {
      // light a standard material with the rig. finish: { coat, coatRoughness, diffuse, specular }
      light(mat, finish = {}) {
        const f = new THREE.Vector4(finish.coat || 0, finish.coatRoughness == null ? 0.15 : finish.coatRoughness, finish.diffuse == null ? 1 : finish.diffuse, finish.specular == null ? 1 : finish.specular);
        mat.onBeforeCompile = (sh) => {
          Object.assign(sh.uniforms, U, { rigFinish: { value: f } });
          sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vRigP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvRigP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
          sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + PARS).replace('#include <opaque_fragment>', SHADE);
        };
        return mat;
      },
      // place every box for time t; lensAz is the camera's own angle round the product, so the rig travels with the lens
      update(t, lensAz) {
        boxes.forEach((b, i) => {
          const az = lensAz + at(b.az, t) * rad, el = at(b.el || 0, t) * rad, d = at(b.dist, t), c = U.rigC.value[i], n = U.rigN.value[i], sz = at(b.size, t), rgb = at(b.color, t);
          c.set(aim[0] + d * Math.cos(el) * Math.sin(az), aim[1] + d * Math.sin(el), aim[2] + d * Math.cos(el) * Math.cos(az));
          n.set(aim[0], aim[1], aim[2]).sub(c).normalize();
          U.rigU.value[i].crossVectors(up, n).normalize(); U.rigV.value[i].crossVectors(n, U.rigU.value[i]).multiplyScalar(sz[1] / 2); U.rigU.value[i].multiplyScalar(sz[0] / 2);
          (Array.isArray(rgb) ? col.setRGB(rgb[0], rgb[1], rgb[2]) : col.set(rgb)); U.rigL.value[i].set(col.r, col.g, col.b).multiplyScalar(at(b.power, t));
          U.rigFeather.value[i] = at(b.feather || 0, t);
        });
      },
    };
  }

  // ================================================================ reusable piece 2: turned and knurled parts
  // A turned part from a profile of [radius, y, fillet] corners listed bottom to top. Every corner with a fillet gets a
  // real rounded edge: that thin bevel is what catches the strip light and makes a part look machined. UVs are in
  // world units (u round the part at radius uvR, v along the profile), so tiled finish textures keep one scale.
  function turned(THREE, corners, uvR = 0.5, seg = 160) {
    const pts = [];
    corners.forEach(([r, y, f], i) => {
      const a = corners[i - 1], c = corners[i + 1];
      if (!f || !a || !c) { pts.push([r, y]); return; }
      const u1 = [a[0] - r, a[1] - y], u2 = [c[0] - r, c[1] - y], l1 = Math.hypot(u1[0], u1[1]), l2 = Math.hypot(u2[0], u2[1]);
      const half = Math.acos(Math.max(-1, Math.min(1, (u1[0] * u2[0] + u1[1] * u2[1]) / (l1 * l2)))) / 2, d = Math.min(f / Math.tan(half), l1 * 0.48, l2 * 0.48);
      const p1 = [r + u1[0] / l1 * d, y + u1[1] / l1 * d], p2 = [r + u2[0] / l2 * d, y + u2[1] / l2 * d], n = 7;
      for (let k = 0; k <= n; k++) { const s = k / n, q = 1 - s; pts.push([q * q * p1[0] + 2 * q * s * r + s * s * p2[0], q * q * p1[1] + 2 * q * s * y + s * s * p2[1]]); }
    });
    const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(Math.max(r, 1e-4), y)), seg), uv = g.attributes.uv, arc = [0];
    for (let j = 1; j < pts.length; j++) arc.push(arc[j - 1] + Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]));
    for (let i = 0; i <= seg; i++) for (let j = 0; j < pts.length; j++) uv.setXY(i * pts.length + j, (i / seg) * 2 * Math.PI * uvR, arc[j]);
    return g.rotateY(Math.PI);   // the seam of the texture goes to the back
  }
  // A knurled band between y0 and y1 at radius r, `n` teeth round it, standing `depth` proud. rows > 0 cuts a diamond
  // knurl: crossed grooves leave little pyramids, flat-shaded on purpose, because every facet is its own tiny mirror
  // and a moving light runs across the band as a ripple of sparks. rows = 0 cuts smooth round flutes instead.
  function knurl(THREE, r, y0, y1, n, depth, rows = 0) {
    const pos = [], nor = [], uv = [], du = Math.PI / n, g = new THREE.BufferGeometry();
    if (!rows) {
      const seg = n * 10, idx = [];
      for (let i = 0; i <= seg; i++) {
        const a = (i / seg) * 2 * Math.PI, rr = r + depth * (0.5 + 0.5 * Math.cos(n * a)), dr = -depth * 0.5 * n * Math.sin(n * a), nx = rr * Math.sin(a) - dr * Math.cos(a), nz = rr * Math.cos(a) + dr * Math.sin(a), l = Math.hypot(nx, nz);
        for (const y of [y0, y1]) { pos.push(rr * Math.sin(a), y, rr * Math.cos(a)); nor.push(nx / l, 0, nz / l); uv.push(a * r, y); }
        if (i < seg) idx.push(i * 2, i * 2 + 2, i * 2 + 3, i * 2, i * 2 + 3, i * 2 + 1);
      }
      g.setIndex(idx); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    } else {
      const dv = (y1 - y0) / (rows * 2), P = (a, y, h) => { pos.push((r + h) * Math.sin(a), y, (r + h) * Math.cos(a)); uv.push(a * r, y); }, tri = (a, b, c) => { P(...a); P(...b); P(...c); };
      for (let j = 0; j <= rows * 2; j++) for (let i = 0; i < n; i++) {
        const a = i * 2 * du + (j % 2 ? du : 0), y = y0 + j * dv, A = [a, y, depth], Lf = [a - du, y, 0], Rt = [a + du, y, 0], Tp = [a, y + dv, 0], Bt = [a, y - dv, 0];
        if (j < rows * 2) { tri(A, Rt, Tp); tri(A, Tp, Lf); }
        if (j > 0) { tri(A, Lf, Bt); tri(A, Bt, Rt); }
      }
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    if (rows) g.computeVertexNormals();
    return g;
  }
  // the little wave of the wordmark, shared by the etching and the lock-up
  const wave = (ctx, x, y, w, amp, lw) => {
    ctx.beginPath();
    for (let i = 0; i <= 48; i++) { const u = i / 48; ctx[i ? 'lineTo' : 'moveTo'](x + u * w, y - Math.sin(u * Math.PI * 3) * amp * Math.sin(u * Math.PI) ** 0.5); }
    ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
  };

  // ================================================================ reusable piece 3: the studio
  // A near-black seamless: a soft glow on the backdrop so the silhouette has something to stand against, a real mirror
  // floor, and a pool of light on the floor that is dark where the product stands (its contact shadow). tint() lets
  // the room take a breath of the light's colour.
  function seamlessStudio(S) {
    const { THREE, K, scene } = S;
    const glowTex = K.canvasTex(512, 512, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, '#fff'); g.addColorStop(0.25, '#9a9a9a'); g.addColorStop(0.55, '#2c2c2c'); g.addColorStop(1, '#000');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    });
    const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(30, 15), new THREE.MeshBasicMaterial({ map: glowTex }));
    backdrop.position.set(0.6, 3.6, -11); scene.add(backdrop);
    K.mirrorFloor(S, { y: 0, color: '#030304', roughness: 0.14, surfaceRoughness: 0.5, strength: 1.3, fresnel: true });
    const poolTex = K.canvasTex(512, 512, (ctx, w, h) => {   // light on the floor round the product, dark where it stands
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, '#000'); g.addColorStop(0.075, '#000'); g.addColorStop(0.16, '#8c8c8c'); g.addColorStop(0.3, '#555'); g.addColorStop(0.6, '#161616'); g.addColorStop(1, '#000');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    });
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(13, 13), new THREE.MeshBasicMaterial({ map: poolTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.002, 0); scene.add(pool);
    return { tint(rgb, level) { backdrop.material.color.setRGB(rgb[0], rgb[1], rgb[2]).multiplyScalar(0.05 + 0.085 * level); pool.material.color.setRGB(rgb[0], rgb[1], rgb[2]).multiplyScalar(0.03 + 0.045 * level); } };
  }

  // ================================================================ the product (the part that changes)
  // Tide: a powder-coated steel bottle, 2.67 units tall, standing on y = 0 at the origin with its mark facing +z.
  // Every material is lit by the rig (rig.light), and every part is a turned profile, so a new product is mostly a
  // new list of profiles.
  function buildProduct(S, rig) {
    const { THREE, K, scene } = S;
    // Finish textures: orange-peel for the powder coat, lathe lines for turned metal.
    const peel = K.canvasTex(512, 512, (ctx, w, h) => {
      const r = K.rng(3); ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 9000; i++) { const v = r() < 0.5 ? 255 : 0; ctx.fillStyle = `rgba(${v},${v},${v},${r.range(0.05, 0.22)})`; ctx.beginPath(); ctx.arc(r() * w, r() * h, r.range(1.2, 4.5), 0, 7); ctx.fill(); }
    }, { data: true, repeat: [1 / 0.11, 1 / 0.11] });
    const lathe = K.canvasTex(4, 128, (ctx, w, h) => { const r = K.rng(8); for (let y = 0; y < h; y++) { const v = Math.round(128 + r.range(-1, 1) * 90); ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(0, y, w, 1); } }, { data: true, repeat: [1, 1 / 0.085] });
    const M = {
      coat: rig.light(new THREE.MeshStandardMaterial({ color: FINISH.coat, roughness: 0.5, bumpMap: peel, bumpScale: 0.55 }), { coat: 0.95, coatRoughness: 0.2, diffuse: 0.95 }),
      steel: rig.light(new THREE.MeshStandardMaterial({ color: FINISH.steel, roughness: 0.2, metalness: 1, bumpMap: lathe, bumpScale: 0.35 })),
      knurl: rig.light(new THREE.MeshStandardMaterial({ color: FINISH.steel, roughness: 0.26, metalness: 1, bumpMap: peel, bumpScale: 0.25 })),
      flutes: rig.light(new THREE.MeshStandardMaterial({ color: FINISH.anodised, roughness: 0.36, metalness: 0.9 }), { coat: 0.3, coatRoughness: 0.2 }),
      polish: rig.light(new THREE.MeshStandardMaterial({ color: '#e4e7ea', roughness: 0.1, metalness: 1 })),
      anodised: rig.light(new THREE.MeshStandardMaterial({ color: FINISH.anodised, roughness: 0.42, metalness: 0.9, bumpMap: lathe, bumpScale: 0.2 }), { coat: 0.25, coatRoughness: 0.3 }),
      rubber: rig.light(new THREE.MeshStandardMaterial({ color: FINISH.rubber, roughness: 0.85 }), { diffuse: 1.5 }),
    };
    const product = new THREE.Group(); scene.add(product);
    const part = (geo, mat, parent = product) => { const m = new THREE.Mesh(geo, mat); parent.add(m); return m; };
    // body and neck radius, and the height where the steel collar starts; everything above is measured from there
    const R = 0.44, NECK = 0.37, C0 = 2.0, c = (r, y, f) => [r, C0 + y, f];

    part(turned(THREE, [[0.3, 0], [R - 0.045, 0, 0.012], [R - 0.045, 0.04]], R), M.rubber);                                                             // rubber foot
    part(turned(THREE, [[R - 0.06, 0.032], [R, 0.032, 0.055], [R, 0.2, 0.004], [R - 0.008, 0.205, 0.003], [R - 0.008, 0.215, 0.003], [R, 0.22, 0.004],  // body: base cup, seam,
      c(R, -0.255, 0.34), c(NECK - 0.004, -0.045, 0.07), c(NECK - 0.004, 0.007)], R), M.coat);                                                          //   wall, shoulder
    part(turned(THREE, [c(NECK - 0.04, 0), c(NECK, 0.003, 0.004), c(NECK, 0.033, 0.005), c(NECK - 0.012, 0.041, 0.002), c(NECK - 0.012, 0.159, 0.002),  // steel collar with a channel
      c(NECK, 0.167, 0.005), c(NECK, 0.195, 0.008), c(NECK - 0.04, 0.201)], NECK), M.steel);                                                            //   for the knurled ring
    part(knurl(THREE, NECK - 0.012, C0 + 0.041, C0 + 0.159, 104, 0.012, 5), M.knurl);
    part(turned(THREE, [c(NECK - 0.035, 0.185), c(NECK - 0.03, 0.22)], NECK, 64), M.rubber);                                                            // gasket: a dark line under the cap
    part(turned(THREE, [c(NECK - 0.035, 0.211), c(NECK - 0.006, 0.213, 0.004), c(NECK - 0.006, 0.243, 0.003), c(NECK - 0.016, 0.249), c(NECK - 0.016, 0.367),   // cap: black anodised, with
      c(NECK - 0.006, 0.373, 0.003), c(NECK - 0.006, 0.397)], NECK), M.anodised);                                                                       //   a channel for the flutes
    part(knurl(THREE, NECK - 0.016, C0 + 0.249, C0 + 0.367, 84, 0.01), M.flutes);
    part(turned(THREE, [c(NECK - 0.006, 0.395), c(NECK - 0.006, 0.402, 0.002), c(NECK - 0.03, 0.426, 0.002), c(NECK - 0.036, 0.426)], NECK), M.polish); // the bright cut chamfer
    part(turned(THREE, [c(NECK - 0.036, 0.425), c(0.3, 0.425, 0.012), c(0.275, 0.413, 0.012), c(0.0, 0.409)], NECK), M.anodised);                       // dished top with lathe rings

    // the carry loop: a polished steel arch standing in the dish of the cap, on two small ferrules
    const LX = 0.19, LH = 0.2, LR = 0.125, LY = C0 + 0.41, arch = [];
    for (let i = 0; i <= 3; i++) arch.push([-LX, LY + (LH - LR) * i / 3]);
    for (let i = 1; i <= 10; i++) { const a = Math.PI - (i / 10) * Math.PI / 2; arch.push([-LX + LR + Math.cos(a) * LR, LY + LH - LR + Math.sin(a) * LR]); }
    for (let i = 1; i < 4; i++) arch.push([K.lerp(-LX + LR, LX - LR, i / 4), LY + LH]);
    for (let i = 0; i <= 10; i++) { const a = Math.PI / 2 - (i / 10) * Math.PI / 2; arch.push([LX - LR + Math.cos(a) * LR, LY + LH - LR + Math.sin(a) * LR]); }
    for (let i = 2; i >= 0; i--) arch.push([LX, LY + (LH - LR) * i / 3]);
    part(K.tube(arch, 0.027, { segments: 200, radial: 24 }), M.polish);
    for (const s of [-1, 1]) part(turned(THREE, [[0.03, 0], [0.047, 0, 0.004], [0.047, 0.022, 0.006], [0.03, 0.03]], 0.04, 48), M.steel).position.set(s * LX, LY, 0);

    // laser etching: the coat is burnt away and bare steel shows. A curved patch just proud of the wall.
    const etch = (y, width, height, px, draw) => {
      const tex = K.canvasTex(px, Math.round(px * height / width), (ctx, w, h) => {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = ctx.strokeStyle = '#fff'; draw(ctx, w, h);
        ctx.globalCompositeOperation = 'multiply'; for (let yy = 0; yy < h; yy += 4) { ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(0, yy, w, 1.5); }   // the raster of the laser
      });
      const m = part(new THREE.CylinderGeometry(R + 0.0008, R + 0.0008, height, 64, 1, true, -width / R / 2, width / R), rig.light(new THREE.MeshStandardMaterial({ color: '#e9ecef', roughness: 0.5, metalness: 0.55, alphaMap: tex, transparent: true, depthWrite: false }), { diffuse: 2.4 }));
      m.position.y = y; return m;
    };
    etch(1.47, 0.54, 0.27, 2048, (ctx, w, h) => {
      ctx.font = '500 400px "Space Grotesk"'; ctx.letterSpacing = '150px'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(COPY.mark, w / 2 + 75, h * 0.86);
      wave(ctx, w / 2 - 250, h * 0.3, 500, 62, 34);
    });
    etch(0.34, 0.34, 0.0425, 1024, (ctx, w, h) => { ctx.font = '500 74px "Space Grotesk"'; ctx.letterSpacing = '14px'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(COPY.spec, w / 2 + 7, h / 2 + 4); });
    return product;
  }

  registerStyle({
    id: 'studio-product',
    name: 'Studio Product',
    family: 'Products and screens',
    look: 'One physical product in a near-black seamless studio, filmed like a flagship launch: the object is carved out of the dark by strip softboxes and stands on a black mirror floor, with a single restrained line of type beside it.',
    motion: 'The product stays still and the light moves: a tall strip light glides across its surfaces again and again, changing colour as it goes, while the lens travels over the details in macro and then pulls back to the whole object. A counter ticks with the light and lands on the number in the copy.',
    light: 'Softboxes only, placed relative to the lens: a graded key strip that sweeps from side to side, two thin rim strips from behind that draw the outline, a soft box overhead for the top. Everything they do not touch stays black.',
    materials: 'Real product finishes with small precise details: powder coat with a fine orange-peel texture, turned steel with lathe lines and bevelled edges, a diamond-knurled ring, black anodised flutes with a bright cut chamfer, a laser-etched mark, a seam and a rubber foot.',
    camera: 'A long lens on a slider, one continuous move: two macro passes with very shallow focus (the collar, then the etched mark), a pull-back to the full product standing off-centre, and a slow push that never quite stops.',
    post: 'True depth of field and motion blur, a soft bloom only where polished metal catches a strip light, filmic contrast with deep blacks, a light vignette and very fine grain.',
    explains: 'One product and one claim. The macro passes show what it is made of, the moving light and the counter act out the claim (here: a full day passes, it is still cold), and the lock-up states it in one line.',
    topic: 'Launch film for "Tide", a made-up insulated steel water bottle: cold for 24 hours',
    duration: 8,
    fonts: ['600 168px "Inter"', '300 132px "Inter"', '500 46px "Space Grotesk"', '500 54px "Space Grotesk"', '500 400px "Space Grotesk"'],
    render: { samples: 96, shutter: 0.5, tone: 'filmic', exposure: 1.0, bloom: 0.42, bloomThreshold: 1.25, vignette: 0.34, grain: 0.012, fov: 24, background: '#010102' },

    build(S) {
      const { THREE, K, camera } = S;
      const rgb = (hex) => new THREE.Color(hex).toArray();

      // ============================================================ the camera plan (one continuous move)
      // macro on the knurled collar -> down over the shoulder -> macro on the etched mark -> pull back to the whole
      // product, standing left of centre to leave room for the line -> a slow push that lasts to the final frame.
      // K.path flows through the keys, so it is one move; focus follows its own path and the lens stops down as it leaves.
      const cam = {
        pos: K.path([[0, [0.8, 2.56, 1.52]], [1.6, [0.36, 2.2, 1.66]], [3.0, [-0.28, 1.54, 1.42]], [3.7, [-0.33, 1.51, 1.5]], [4.15, [-0.36, 1.48, 1.64]], [5.0, [0.36, 1.0, 5.5]], [5.9, [0.92, 0.86, 7.5]], [9.6, [0.6, 0.8, 6.75]]]),   // the last key lies past the end, so the push is still moving on the final frame
        aim: K.path([[0, [0.1, 2.2, 0.3]], [1.6, [0.02, 2.08, 0.37]], [3.0, [-0.03, 1.5, 0.44]], [3.7, [0.0, 1.48, 0.44]], [4.15, [0.03, 1.46, 0.44]], [5.0, [0.8, 1.18, 0]], [5.9, [1.22, 1.2, 0]], [9.6, [1.16, 1.23, 0]]]),
        focus: K.path([[0, [0.17, 2.1, 0.33]], [1.6, [0.08, 2.1, 0.36]], [3.0, [0.0, 1.48, 0.44]], [9.6, [0.0, 1.4, 0.44]]]),
        ap: K.track([[0, 0.036], [4.15, 0.032], [5.7, 0.02], [8, 0.014]]),
      };

      // ============================================================ the light
      // the day the light runs through, as the colour of the key strip
      const dayColor = K.track([[0, rgb('#ffae6e')], [1.4, rgb('#fff3e2'), 'inOut'], [2.4, rgb('#ff9a5c'), 'inOut'], [3.5, rgb('#9fc0ff'), 'inOut'], [5.6, rgb('#eaf3ff'), 'inOut']]);
      const hero = (t) => K.seg(t, 4.15, 5.9, K.ease.inOut);   // 0 during the macro passes, 1 once the whole product is in frame
      const rig = softboxRig(S, [
        { size: (t) => [K.lerp(0.62, 1.05, hero(t)), 3.6], dist: 3.3, az: K.track(SWEEPS.map(([t, a]) => [t, a, 'inOut'])), el: 6, power: (t) => K.lerp(9, 10, hero(t)), color: dayColor, feather: 0.75 },   // key strip: the one that sweeps
        { size: [0.34, 3.8], dist: 3.5, az: (t) => K.lerp(146, 128, hero(t)) - 6 * Math.sin(t * 0.5), el: 4, power: (t) => K.lerp(7, 13, hero(t)), color: (t) => dayColor(t).map((c, i) => K.lerp(c, [0.8, 0.9, 1][i], 0.5)) },   // rim, camera right
        { size: [0.3, 3.8], dist: 3.5, az: (t) => K.lerp(-150, -134, hero(t)), el: 4, power: (t) => K.lerp(1.5, 10, hero(t)), color: '#dcebff' },                                                        // rim, camera left
        { size: [2.4, 1.6], dist: 3.4, az: 25, el: 70, power: (t) => K.lerp(2.0, 2.6, hero(t)), color: (t) => dayColor(t).map((c) => K.lerp(c, 1, 0.5)) },                   // soft box overhead
      ], [0, 1.4, 0]);
      // a dim environment so metal is never pure black between the boxes
      K.env(S, { top: '#06080b', horizon: '#0a0d11', bottom: '#010101', intensity: 1, panels: [{ pos: [0, 12, 3], size: [10, 8], color: '#cfe0f2', power: 0.9 }] });

      const studio = seamlessStudio(S);
      buildProduct(S, rig);

      // ============================================================ the type treatment (2D, always sharp)
      const INK = '244,247,250', digit = (n, d) => String(Math.floor(n / (d ? 1 : 10)) % 10);
      // the counter: two digit slots that roll like an odometer; returns its width
      const counter = (ctx, value, x, y, size) => {
        const dw = ctx.measureText('0').width * 1.02, n = Math.min(COPY.count, Math.floor(value)), f = n >= COPY.count ? 0 : value - n, roll = K.seg(f, 0.7, 1, K.ease.inOut);
        ctx.save(); ctx.textAlign = 'center'; ctx.beginPath(); ctx.rect(x - 4, y - size * 0.8, dw * 2 + 8, size * 0.84); ctx.clip();
        for (let d = 0; d < 2; d++) {
          const a = digit(n, d), b = digit(n + 1, d), p = a === b ? 0 : roll, cx = x + dw * (d + 0.5);
          ctx.fillText(a, cx, y - p * size); if (p > 0) ctx.fillText(b, cx, y + (1 - p) * size);
        }
        ctx.restore(); return dw * 2;
      };
      // one line of the lock-up rising out of its own baseline
      const rise = (ctx, t, t0, y, size, draw) => {
        const e = K.seg(t, t0, t0 + 0.75, K.ease.outQuint); if (e <= 0) return;
        ctx.save(); ctx.beginPath(); ctx.rect(0, y - size * 1.05, ctx.canvas.width, size * 1.32); ctx.clip(); ctx.globalAlpha = Math.min(1, e * 1.6); ctx.translate(0, (1 - e) * size * 0.7); draw(); ctx.restore();
      };

      return {
        update(t) {
          const p = cam.pos(t), day = dayColor(t), h = hero(t);
          K.look(camera, p, cam.aim(t)); K.focus(camera, cam.focus(t), cam.ap(t));
          rig.update(t, Math.atan2(p[0], p[2]));
          studio.tint(day, h);
        },
        overlay(ctx, t, W, H) {
          const hours = hoursAt(K, t);
          // during the macro passes: the counter, bottom left
          const a = 1 - K.seg(t, LOCK - 0.5, LOCK - 0.1);
          if (a > 0) {
            ctx.globalAlpha = a; ctx.fillStyle = `rgb(${INK})`; ctx.textBaseline = 'alphabetic';
            ctx.font = '300 132px "Inter"'; const w = counter(ctx, hours, 112, H - 118, 132);
            ctx.font = '500 46px "Space Grotesk"'; ctx.letterSpacing = '9px'; ctx.textAlign = 'left'; ctx.fillStyle = `rgba(${INK},0.78)`; ctx.fillText(COPY.unit, 112 + w + 26, H - 122); ctx.letterSpacing = '0px';
            ctx.fillStyle = `rgba(${INK},0.22)`; ctx.fillRect(116, H - 86, 420, 3); ctx.fillStyle = `rgb(${INK})`; ctx.fillRect(116, H - 86, 420 * hours / COPY.count, 3);   // how far round the day is
            ctx.globalAlpha = 1;
          }
          // the lock-up: wordmark, then the line with the counter landing inside it
          const X = 864, Y = 532;
          rise(ctx, t, LOCK, Y - 206, 54, () => {
            ctx.strokeStyle = ctx.fillStyle = `rgba(${INK},0.8)`; wave(ctx, X + 4, Y - 220, 68, 9, 6);
            ctx.font = '500 54px "Space Grotesk"'; ctx.letterSpacing = '19px'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(COPY.mark, X + 98, Y - 201); ctx.letterSpacing = '0px';
          });
          COPY.line.forEach((line, i) => rise(ctx, t, LOCK + 0.14 + i * 0.13, Y + i * 186, 168, () => {
            ctx.font = '600 168px "Inter"'; ctx.letterSpacing = '-3px'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = `rgb(${INK})`;
            const [before, after] = line.split('#'); let x = X;
            ctx.fillText(before, x, Y + i * 186); x += ctx.measureText(before).width;
            if (after != null) { ctx.letterSpacing = '0px'; x += counter(ctx, hours, x, Y + i * 186, 168); ctx.textAlign = 'left'; ctx.letterSpacing = '-3px'; ctx.fillText(after, x, Y + i * 186); }
            ctx.letterSpacing = '0px';
          }));
        },
      };
    },

    sound(k) {
      k.bed('room', 0, 8, { gain: 0.6 });
      k.music('pad', 0, 8, { bpm: 60, gain: 0.7, chords: [['D3', 'A3', 'F#4', 'A4'], ['B2', 'F#3', 'D4', 'A4']] });
      // every pass of the key strip is a breath of air, panned the way the light travels
      for (let i = 1; i < SWEEPS.length - 1; i++) { const [t0, a0] = SWEEPS[i - 1], [t1, a1] = SWEEPS[i]; k.play('whoosh', t0 + (t1 - t0) * 0.22, { dur: (t1 - t0) * 0.7, gain: 0.55, top: 1500, pan: a1 > a0 ? 0.35 : -0.35 }); }
      // the counter: one quiet tick an hour
      k.withMinor(() => { for (let h = 1; h <= COPY.count; h++) k.play('tick', DAY[0] + (DAY[1] - DAY[0]) * h / COPY.count, { gain: 0.3, f: 5200 + (h % 2) * 500 }); });
      k.tone(3.45, { f: 'A5', dur: 1.4, gain: 0.05, a: 0.4, verb: 0.5 });                    // the etched mark catches the light
      k.play('swish', LOCK + 0.1, { gain: 0.35, dur: 0.4 });
      k.play('thud', DAY[1], { gain: 0.5, f: 90 }); k.play('ding', DAY[1], { gain: 0.55, f: 'D6' }); k.play('ding', DAY[1] + 0.02, { gain: 0.3, f: 'A6' });
    },
  });
}
```
