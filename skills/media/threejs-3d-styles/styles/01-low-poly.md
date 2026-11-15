# Low-Poly (#01)

- **id:** `low-poly`
- **Category:** Filters over 3D
- **Use:** explainer
- **Reference duration:** 8.5 s
- **Google Fonts:** Oswald
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`

## Style card

- **Look:** A miniature world of flat, faceted shapes, like folded paper or cut stone: every triangle is one tone, and neighbours differ slightly, inside a short palette of sand, coral and cream against teal water and sage greens.
- **Motion:** Things grow by unfolding facet by facet from one point, or pop out of the ground with a bounce; water heaves so its facets keep catching the light, clouds drift, small cut-gem droplets rise and fall.
- **Light:** One low, warm sun from the side with soft-edged shadows, a cool blue sky filling the shadow sides so every facet turns either warm or cool, and peach haze that swallows the distance.
- **Materials:** Matte paper-like facets with no texture at all; only the water is slightly glossy. Colour comes per triangle from the palette, never from gradients.
- **Camera:** One continuous crane move on a long lens with tilt-shift-shallow focus, so the landscape feels like a tabletop model: close on each stage in turn, then out to the whole scene.
- **Finish:** True depth of field and motion blur, colours kept true (neutral tone curve), a gentle vignette and only enough grain to keep the sky from banding. No filter pass: the facets are real geometry.
- **Good for:** Processes that happen in a place: cycles, journeys, supply chains, how a system of parts feeds itself. Each stage is a spot in the landscape with a paper flag, and the camera travels the route between them.

## Reference

- **Sample topic:** The water cycle: evaporation from the sea, clouds forming, rain on the mountains, a river running back to the sea
- **Gallery description:** A miniature world of flat, faceted shapes, like folded paper or cut stone: every triangle is one tone, and neighbours differ slightly, inside a short palette of sand, coral and cream against teal water and sage greens.
- **Shown in the sample clip:** The water cycle: evaporation from the sea, clouds forming, rain on the mountains, a river running back to the sea

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/low-poly.js`)

```js
{
  // ---------------------------------------------------------------- content (change this block for a new topic)
  // The four stages of the story. Each one gets a paper flag planted in the world when the camera reaches it.
  const STEPS = ['EVAPORATION', 'CONDENSATION', 'PRECIPITATION', 'COLLECTION'];
  // One schedule (seconds) for picture and sound.
  const T = {
    cloudA: 1.2,                  // the first cloud unfolds above the sea (flag 1 and the rising vapour are there on frame one)
    flag2: 2.05,
    cloudB: 2.6, cloudC: 3.1,     // the cloud bank grows inland, facet by facet
    rain: 4.1, flag3: 4.75,
    river: 4.9, riverDur: 1.9,    // water unfolds down the dry river bed, from the source to the mouth
    flag4: 6.6,
    meet: 6.85,                   // the river reaches the sea: a ring runs out over the water and the loop is closed
    end: 8.5,
  };
  // The trees the river brings: one every so often along its lower course (s = 0 source, 1 mouth), all on the far
  // bank so they never hide the water. Each springs up just after the water passes it.
  const BANK_TREES = Array.from({ length: 13 }, (_, i) => { const s = 0.3 + i * 0.05; return { s, t: T.river + s * T.riverDur + 0.16 }; });

  // ---------------------------------------------------------------- the palette
  // A short list of family tones. Nothing in the scene uses a colour that is not in here, which is what keeps a
  // low-poly world calm. Warm sand, coral and cream against teal water and sage greens; rock and cloud shadows lean violet.
  const PAL = {
    seaDeep: '#1f6a80', sea: '#2e8f9c', seaShallow: '#63bfb4', foam: '#e6f5ea', river: '#59b9cc',
    sand: '#ecd3a0', bed: '#c9b99a', grass: '#a5bf66', meadow: '#86ad5c', forest: '#5d9160', pine: '#3f7d62', leaf: '#74a857', ochre: '#e0a646',
    rock: '#a3929b', rockDark: '#857a8c', snow: '#fffbf4', trunk: '#7d5e4e',
    cloud: '#fff8ef', cloudSide: '#f4e7de', cloudBase: '#c8c4dc',
    paper: '#fff6e4', ink: '#22303c', accent: '#e9684a',
    skyTop: '#66a9cf', skyPale: '#f7ead9', haze: '#f8dcc0', sun: '#ffcf99',
  };
  // One tone for one facet: the family colour, nudged a little in hue, saturation and lightness by a hash of where the
  // facet sits. That small disagreement between neighbours is what makes a surface read as cut paper instead of plastic.
  const _hsl = {};
  function tone(hex, key, amount = 1) {
    const c = new THREE.Color(hex); c.getHSL(_hsl);
    return c.setHSL(_hsl.h + (K.hash(key, 1.3) - 0.5) * 0.03 * amount, K.clamp(_hsl.s * (1 + (K.hash(key, 7.7) - 0.5) * 0.22 * amount)), K.clamp(_hsl.l * (1 + (K.hash(key, 13.1) - 0.5) * 0.15 * amount)));
  }

  // ---------------------------------------------------------------- facet tools (work on any geometry)
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _n = new THREE.Vector3(), _m = new THREE.Vector3();
  const vkey = (p, i) => Math.round(p.getX(i) * 500) + ',' + Math.round(p.getY(i) * 500) + ',' + Math.round(p.getZ(i) * 500);

  // jitter(): push every corner a little off its perfect place, so a primitive stops looking like a primitive.
  // Corners that share a position move together, so the shape stays closed.
  function jitter(geo, amount, seed = 1) {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const k = Math.round(p.getX(i) * 500) * 0.731 + Math.round(p.getY(i) * 500) * 1.913 + Math.round(p.getZ(i) * 500) * 3.377 + seed * 17.17;
      p.setXYZ(i, p.getX(i) + (K.hash(k, 1) - 0.5) * 2 * amount, p.getY(i) + (K.hash(k, 2) - 0.5) * 2 * amount, p.getZ(i) + (K.hash(k, 3) - 0.5) * 2 * amount);
    }
    return geo;
  }
  // facet(): split any mesh into separate flat triangles and give each of them ONE colour.
  // paint(centroid, normal, index) returns a THREE.Color (use tone()). The result carries position, normal, color and
  // aCen (the triangle's centre, the same on its three corners, for per-facet effects in shaders).
  function facet(src, paint) {
    const g = src.index ? src.toNonIndexed() : src, p = g.attributes.position, pos = [], col = [], nor = [], cen = [];
    for (let i = 0; i < p.count; i += 3) {
      _a.fromBufferAttribute(p, i); _b.fromBufferAttribute(p, i + 1); _c.fromBufferAttribute(p, i + 2);
      _n.subVectors(_b, _a).cross(_m.subVectors(_c, _a));
      if (_n.length() < 1e-6) continue;                       // a triangle that collapsed to a line: drop it
      _n.normalize(); _m.copy(_a).add(_b).add(_c).divideScalar(3);
      const k = paint(_m, _n, i / 3);
      for (const v of [_a, _b, _c]) { pos.push(v.x, v.y, v.z); col.push(k.r, k.g, k.b); nor.push(_n.x, _n.y, _n.z); cen.push(_m.x, _m.y, _m.z); }
    }
    const out = new THREE.BufferGeometry();
    for (const [name, arr] of [['position', pos], ['color', col], ['normal', nor], ['aCen', cen]]) out.setAttribute(name, new THREE.Float32BufferAttribute(arr, 3));
    return out;
  }
  // merge(): several faceted geometries into one (core three.js has no merge helper)
  function merge(list) {
    const out = new THREE.BufferGeometry();
    for (const name of Object.keys(list[0].attributes)) {
      const size = list[0].attributes[name].itemSize, arr = new Float32Array(list.reduce((s, g) => s + g.attributes[name].array.length, 0));
      let o = 0; for (const g of list) { arr.set(g.attributes[name].array, o); o += g.attributes[name].array.length; }
      out.setAttribute(name, new THREE.BufferAttribute(arr, size));
    }
    return out;
  }
  // unfold(): give every triangle a birth time and a hinge, so the mesh can grow facet by facet. The order spreads
  // from the triangle nearest `from` across shared edges at `speed` units per second, and each triangle hinges on the
  // edge it shares with the neighbour that woke it. Parts that are not connected start when the front would reach them.
  // Give `duration` instead of `speed` to say how long the whole mesh takes. Use it with faceted({ unfold: true }).
  function unfold(geo, { from = [0, 0, 0], speed = 3, duration = 0, start = 0 } = {}) {
    const p = geo.attributes.position, cen = geo.attributes.aCen, n = p.count / 3, edges = new Map(), nb = Array.from({ length: n }, () => []);
    for (let f = 0; f < n; f++) for (let e = 0; e < 3; e++) {
      const k0 = vkey(p, f * 3 + e), k1 = vkey(p, f * 3 + (e + 1) % 3), k = k0 < k1 ? k0 + '|' + k1 : k1 + '|' + k0, o = edges.get(k);
      if (o) { nb[f].push([o.f, e, o.e]); nb[o.f].push([f, o.e, e]); } else edges.set(k, { f, e });
    }
    const born = new Float32Array(n).fill(Infinity), hinge = new Int8Array(n), seen = new Uint8Array(n);
    const dist = (f, x, y, z) => Math.hypot(cen.getX(f * 3) - x, cen.getY(f * 3) - y, cen.getZ(f * 3) - z);
    for (let k = 0; k < n; k++) {
      let f = -1, best = Infinity;
      for (let i = 0; i < n; i++) if (!seen[i] && born[i] < best) { best = born[i]; f = i; }
      if (f < 0) {                                            // a new island: start at its triangle nearest the origin of growth
        for (let i = 0; i < n; i++) if (!seen[i]) { const d = dist(i, from[0], from[1], from[2]); if (d < best) { best = d; f = i; } }
        born[f] = best / speed;
      }
      seen[f] = 1;
      for (const [g, , eg] of nb[f]) { const t = born[f] + dist(g, cen.getX(f * 3), cen.getY(f * 3), cen.getZ(f * 3)) / speed; if (!seen[g] && t < born[g]) { born[g] = t; hinge[g] = eg; } }
    }
    const last = Math.max(...born), pace = duration ? duration / last : 1;
    const A = new Float32Array(n * 9), B = new Float32Array(n * 9), bt = new Float32Array(n * 3);
    for (let f = 0; f < n; f++) {
      // hinge from corner e+1 to corner e: with this direction a positive angle folds the triangle INTO the shape
      _a.fromBufferAttribute(p, f * 3 + (hinge[f] + 1) % 3); _b.fromBufferAttribute(p, f * 3 + hinge[f]);
      for (let v = 0; v < 3; v++) { _a.toArray(A, f * 9 + v * 3); _b.toArray(B, f * 9 + v * 3); bt[f * 3 + v] = start + born[f] * pace + K.hash(f, 3.1) * 0.04; }
    }
    geo.setAttribute('aHingeA', new THREE.BufferAttribute(A, 3)); geo.setAttribute('aHingeB', new THREE.BufferAttribute(B, 3)); geo.setAttribute('aBorn', new THREE.BufferAttribute(bt, 1));
    return geo;
  }

  // faceted(): the one material of the style. Flat-shaded, coloured per facet, matte. Options switch on the motions:
  //   unfold: true   triangles swing open on their hinges at their birth time (geometry from unfold()), with a small overshoot
  //   wave: 0.06     the surface heaves like water (amplitude in world units), so its facets keep catching the light
  //   tint: '...'    GLSL run per corner after the facet colour is set (vColor), for travelling flashes and the like
  //   glow: 0.2      adds a share of the facet's own colour as light, for things that are bright in shadow (cloud, droplets)
  // All of them read one shared clock, so update(t) only has to set clock.value.
  const clock = { value: 0 };
  const WAVE = 'float seaWave(vec2 p, float t){ return sin(p.x * 1.25 + t * 1.35) * cos(p.y * 1.05 - t * 1.1) * 0.6 + sin(p.x * 2.7 - p.y * 2.2 + t * 2.3) * 0.4; }\n';
  function faceted(o = {}) {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: o.roughness == null ? 0.9 : o.roughness, metalness: 0, side: o.unfold ? THREE.DoubleSide : THREE.FrontSide });
    const uniforms = Object.assign({ uTime: clock, uFold: { value: o.fold || 0.38 } }, o.uniforms || {});
    const patch = (sh, colour) => {
      Object.assign(sh.uniforms, uniforms);
      let head = 'uniform float uTime, uFold; attribute vec3 aCen;\n' + (o.head || ''), body = '';
      if (o.wave) { head += WAVE; body += `transformed.y += seaWave(transformed.xz, uTime) * ${o.wave.toFixed(4)};\n`; }
      if (o.unfold) {
        head += 'attribute vec3 aHingeA, aHingeB; attribute float aBorn;\n';
        body += `float fu = clamp((uTime - aBorn) / uFold, 0.0, 1.0);
          float fopen = 1.0 - pow(1.0 - fu, 3.0) + 0.3 * sin(fu * 3.14159) * fu * fu;      // 0 folded, 1 flat, a little past 1 on the way
          float fang = (1.0 - fopen) * 2.4;
          vec3 fax = normalize(aHingeB - aHingeA), frel = transformed - aHingeA;
          frel = frel * cos(fang) + cross(fax, frel) * sin(fang) + fax * dot(fax, frel) * (1.0 - cos(fang));
          transformed = mix(0.5 * (aHingeA + aHingeB), aHingeA + frel, smoothstep(0.0, 0.45, fu));   // it also grows out of its hinge\n`;
      }
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + head).replace('#include <begin_vertex>', '#include <begin_vertex>\n' + body);
      if (colour && o.tint) sh.vertexShader = sh.vertexShader.replace('#include <color_vertex>', '#include <color_vertex>\n' + o.tint);
    };
    const id = JSON.stringify([o.wave, o.unfold, o.tint, o.head, o.glow]);
    m.onBeforeCompile = (sh) => {
      patch(sh, true);
      if (o.glow) sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * ${o.glow.toFixed(3)};`);   // lit from inside a little, like cloud or thin paper
    };
    m.customProgramCacheKey = () => 'facet' + id;
    if (o.unfold || o.wave) {                                   // shadows have to follow the moving triangles too
      m.depth = new THREE.MeshDepthMaterial({ side: m.side });
      m.depth.onBeforeCompile = (sh) => patch(sh, false); m.depth.customProgramCacheKey = () => 'facetDepth' + id;
    }
    return m;
  }
  const mesh = (geo, mat, o = {}) => { const m = new THREE.Mesh(geo, mat); m.castShadow = o.cast !== false; m.receiveShadow = true; if (mat.depth) m.customDepthMaterial = mat.depth; return m; };

  // ---------------------------------------------------------------- ground tools: scattered points and a triangulation
  // Low-poly ground looks best when its triangles are irregular and get larger with distance. scatter() drops one
  // point in every cell of a quadtree whose cells are as large as spacing(x, z) allows; triangulate() (Delaunay,
  // Bowyer-Watson) turns any set of [x, z] points into triangles.
  function scatter([x0, z0, x1, z1], spacing, seed, root = 11) {
    const r = K.rng(seed), out = [];
    const cell = (x, z, s) => { if (s > spacing(x + s / 2, z + s / 2)) { const h = s / 2; cell(x, z, h); cell(x + h, z, h); cell(x, z + h, h); cell(x + h, z + h, h); } else out.push([x + s * r.range(0.15, 0.85), z + s * r.range(0.15, 0.85)]); };
    for (let x = x0; x < x1; x += root) for (let z = z0; z < z1; z += root) cell(x, z, root);
    return out;
  }
  function triangulate(pts) {
    const n = pts.length, P = pts.concat([[-4e3, -4e3], [4e3, -4e3], [0, 4e3]]);
    const circ = (a, b, c) => {
      const [ax, ay] = P[a], [bx, by] = P[b], [cx, cy] = P[c], d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
      const x = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d, y = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
      return { a, b, c, x, y, r2: (ax - x) * (ax - x) + (ay - y) * (ay - y) };
    };
    let open = [circ(n, n + 1, n + 2)]; const done = [];
    for (const i of pts.map((_, k) => k).sort((u, v) => P[u][0] - P[v][0])) {     // sweep left to right
      const [px, py] = P[i], edge = new Map(), keep = [];
      for (const t of open) {
        const dx = px - t.x, dy = py - t.y;
        if (dx > 0 && dx * dx > t.r2) { done.push(t); continue; }                 // no later point can reach it
        if (dx * dx + dy * dy >= t.r2) { keep.push(t); continue; }
        for (const [u, v] of [[t.a, t.b], [t.b, t.c], [t.c, t.a]]) { const k = u < v ? u * 1e6 + v : v * 1e6 + u; if (edge.has(k)) edge.delete(k); else edge.set(k, [u, v]); }
      }
      open = keep; for (const [u, v] of edge.values()) open.push(circ(u, v, i));
    }
    return done.concat(open).filter((t) => t.a < n && t.b < n && t.c < n).map((t) => [t.a, t.b, t.c]);
  }
  // upward(): a list of triangles [[x, y, z] x 3] -> geometry with every triangle turned to face up, ready for facet()
  function upward(tris) {
    const pos = [];
    for (const [a, b, c] of tris) { const up = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]); pos.push(...a, ...(up < 0 ? c : b), ...(up < 0 ? b : c)); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    return g;
  }
  // surface(): points [x, z] (or [x, z, y] to pin a height) + a height function -> a triangulated piece of ground
  const surface = (pts, height) => upward(triangulate(pts).map((tri) => tri.map((i) => [pts[i][0], pts[i][2] == null ? height(pts[i][0], pts[i][1]) : pts[i][2], pts[i][1]])));

  // ---------------------------------------------------------------- props: every shape is a jittered primitive, cut flat where it helps
  function rockGeo(seed) {
    const g = jitter(new THREE.IcosahedronGeometry(0.5, 1), 0.11, seed); g.scale(1.15, 0.72, 0.9);
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) < -0.12) p.setY(i, -0.12);
    return facet(g, (c, n) => tone(n.y > 0.55 ? PAL.rock : PAL.rockDark, c.x * 31 + c.y * 17 + c.z * 7 + seed));
  }
  function pineGeo(seed, slim = 1) {                            // three tilted cones on a stub, lighter toward the tip
    const r = K.rng(seed), parts = [];
    const trunk = new THREE.CylinderGeometry(0.04, 0.06, 0.26, 5); trunk.translate(0, 0.13, 0);
    parts.push(facet(trunk, (c) => tone(PAL.trunk, c.x * 9 + c.z * 5 + c.y)));
    [[0.33, 0.46, 0.2], [0.25, 0.42, 0.5], [0.165, 0.4, 0.78]].forEach(([rad, h, y], i) => {
      const g = jitter(new THREE.ConeGeometry(rad * slim, h, 6, 1), 0.022, seed + i);
      g.rotateZ(r.range(-0.07, 0.07)); g.rotateY(r.range(0, 6.28)); g.translate(r.range(-0.015, 0.015), y + h / 2, r.range(-0.015, 0.015));
      parts.push(facet(g, (c, n) => tone(PAL.pine, c.x * 13 + c.y * 7 + c.z * 3 + seed, 1).multiplyScalar(n.y < -0.5 ? 0.6 : 1 + i * 0.1)));
    });
    return merge(parts);
  }
  function treeGeo(seed, colour) {                              // a round crown: two jittered balls on a stick
    const parts = [], trunk = new THREE.CylinderGeometry(0.035, 0.055, 0.42, 5); trunk.translate(0, 0.21, 0);
    parts.push(facet(trunk, (c) => tone(PAL.trunk, c.x * 9 + c.z * 5 + c.y)));
    [[0, 0.68, 0, 0.36], [0.2, 0.52, 0.08, 0.22]].forEach(([x, y, z, rad], i) => {
      const g = jitter(new THREE.IcosahedronGeometry(rad, 1), rad * 0.16, seed + i * 3); g.scale(1, 0.92, 1); g.translate(x, y, z);
      parts.push(facet(g, (c, n) => tone(colour, c.x * 13 + c.y * 7 + c.z * 3 + seed, 1.2).multiplyScalar(0.92 + 0.14 * n.y)));
    });
    return merge(parts);
  }
  // A cloud: overlapping jittered balls, all cut flat at the same base height. puffs = [[x, y, z, radius], ...]
  function cloudGeo(puffs, seed) {
    return merge(puffs.map(([x, y, z, rad], i) => {
      const g = jitter(new THREE.IcosahedronGeometry(rad, 1), rad * 0.12, seed + i * 5); g.scale(1, 0.86, 0.92); g.translate(x, y, z);
      const p = g.attributes.position, base = -0.012 * i; for (let k = 0; k < p.count; k++) if (p.getY(k) < base) p.setY(k, base);   // a hair apart, so the flat bases never fight
      return facet(g, (c, n) => tone(n.y < -0.5 ? PAL.cloudBase : n.y > 0.3 ? PAL.cloud : PAL.cloudSide, c.x * 11 + c.y * 5 + c.z * 3 + seed + i, 0.55));
    }));
  }
  function dropGeo(w, h) { const g = new THREE.OctahedronGeometry(1, 0); g.scale(w, h, w); return facet(g, () => new THREE.Color(1, 1, 1)); }   // a cut-gem droplet
  function boatGeo() {                                          // a folded paper boat
    const P = { bow: [0.36, 0.13, 0], stern: [-0.36, 0.13, 0], l: [0, 0.11, 0.12], r: [0, 0.11, -0.12], keel: [0, -0.05, 0], mast: [0.02, 0.56, 0], s0: [-0.2, 0.14, 0], s1: [0.22, 0.14, 0] };
    const tris = [['bow', 'l', 'keel'], ['l', 'stern', 'keel'], ['stern', 'r', 'keel'], ['r', 'bow', 'keel'], ['bow', 'stern', 'l'], ['bow', 'r', 'stern'], ['s0', 's1', 'mast'], ['s1', 's0', 'mast']];
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(tris.flatMap((t) => t.flatMap((k) => P[k])), 3));
    return facet(g, (c, n, i) => tone(i >= 6 ? PAL.accent : PAL.paper, i, 0.6));
  }

  // A paper flag on a pin: the label that sits in the world. The numeral is in the accent colour, the word in ink.
  // side = 1 hangs the flag to the right of the pin, -1 to the left. Returns { group, pole, board, width }.
  function flag(num, word, { height = 1.25, side = 1 } = {}) {
    const FONT = '700 150px "Oswald"', PXH = 250, BH = 0.64, u = BH / PXH, gap = 34, pad = 50, notch = 70;
    const meas = document.createElement('canvas').getContext('2d'); meas.font = FONT; meas.letterSpacing = '7px';
    const wn = meas.measureText(String(num)).width, ww = meas.measureText(word).width, W = Math.ceil(pad + wn + gap + ww + pad + notch);
    const x0 = side > 0 ? pad : notch + pad;                    // the swallow-tail is on the free end
    const tex = K.canvasTex(W, PXH, (ctx) => {
      ctx.fillStyle = PAL.paper; ctx.fillRect(0, 0, W, PXH);
      ctx.font = FONT; ctx.letterSpacing = '7px'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = PAL.accent; ctx.fillText(String(num), x0, PXH / 2 + 60);
      ctx.fillStyle = PAL.ink; ctx.fillText(word, x0 + wn + gap, PXH / 2 + 60);
    });
    const w = W * u, s = new THREE.Shape();
    s.moveTo(0, 0); s.lineTo(w, 0); s.lineTo(w - notch * u, BH / 2); s.lineTo(w, BH); s.lineTo(0, BH); s.closePath();
    const sg = new THREE.ShapeGeometry(s), uv = sg.attributes.uv, sp = sg.attributes.position;
    for (let i = 0; i < sp.count; i++) { const fx = sp.getX(i) / w; uv.setXY(i, side > 0 ? fx : 1 - fx, sp.getY(i) / BH); if (side < 0) sp.setX(i, -sp.getX(i)); }
    if (side < 0) sg.index.array.reverse();
    const board = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: 0.3, roughness: 0.95, side: THREE.DoubleSide }));
    board.position.set(0, height - BH - 0.05, 0.03); board.castShadow = true; board.receiveShadow = true;
    const pg = new THREE.CylinderGeometry(0.02, 0.02, height, 5); pg.translate(0, height / 2, 0);
    const pole = new THREE.Group(), pin = mesh(facet(pg, () => new THREE.Color(PAL.ink)), faceted({ roughness: 0.6 }));
    const head = mesh(facet(new THREE.IcosahedronGeometry(0.075, 0), (c, n, i) => tone(PAL.accent, i, 0.7)), faceted({ roughness: 0.5 })); head.position.y = height + 0.04;
    pole.add(pin, head, board);
    const group = new THREE.Group(); group.add(pole);
    // pop(t, t0): the pin shoots up out of the ground with a bounce, then the paper swings round it and settles
    const pop = (t, t0) => {
      const a = K.spring(t - t0, 2.6, 0.38), b = K.spring(t - t0 - 0.14, 2.1, 0.42);
      group.visible = t > t0; pole.scale.set(1, Math.max(0.001, a), 1);
      board.rotation.y = side * (1 - b) * -1.9; board.scale.set(Math.max(0.001, K.seg(t, t0 + 0.12, t0 + 0.34, K.ease.out)), 1, 1);
    };
    return { group, pop };
  }

  registerStyle({
    id: 'low-poly',
    name: 'Low-Poly',
    family: 'Filters over 3D',
    look: 'A miniature world of flat, faceted shapes, like folded paper or cut stone: every triangle is one tone, and neighbours differ slightly, inside a short palette of sand, coral and cream against teal water and sage greens.',
    motion: 'Things grow by unfolding facet by facet from one point, or pop out of the ground with a bounce; water heaves so its facets keep catching the light, clouds drift, small cut-gem droplets rise and fall.',
    light: 'One low, warm sun from the side with soft-edged shadows, a cool blue sky filling the shadow sides so every facet turns either warm or cool, and peach haze that swallows the distance.',
    materials: 'Matte paper-like facets with no texture at all; only the water is slightly glossy. Colour comes per triangle from the palette, never from gradients.',
    camera: 'One continuous crane move on a long lens with tilt-shift-shallow focus, so the landscape feels like a tabletop model: close on each stage in turn, then out to the whole scene.',
    post: 'True depth of field and motion blur, colours kept true (neutral tone curve), a gentle vignette and only enough grain to keep the sky from banding. No filter pass: the facets are real geometry.',
    explains: 'Processes that happen in a place: cycles, journeys, supply chains, how a system of parts feeds itself. Each stage is a spot in the landscape with a paper flag, and the camera travels the route between them.',
    topic: 'The water cycle: evaporation from the sea, clouds forming, rain on the mountains, a river running back to the sea',
    duration: T.end,
    fonts: ['700 150px "Oswald"'],
    render: { samples: 64, shutter: 0.4, tone: 'neutral', exposure: 1.0, bloom: 0.35, bloomThreshold: 1.25, vignette: 0.22, grain: 0.014, fov: 30, background: PAL.haze, far: 400 },

    build(S) {
      const { THREE, K, scene, camera } = S;
      const N = K.noise(7), smooth = K.smooth;

      // ------------------------------------------------------------ the place: a height function, designed by hand
      // Sea to the west and south, a plain, and peaks listed one by one: [x, z, height, radius].
      const PEAKS = [[3.6, -2.0, 3.9, 4.0], [6.6, -0.9, 2.7, 3.0], [0.6, -5.4, 3.0, 3.6], [9.5, -5.0, 4.4, 4.6], [-2.0, -10, 2.4, 4.5],
        [5, -15, 6.0, 8], [16, -9, 5.5, 7], [-6, -24, 6.5, 10], [22, -22, 8, 12], [14, 3, 2.6, 5], [24, 0, 5, 8]];
      const ISLES = [[-4.7, 1.9, 0.78, 1.5], [-13, -9, 2.6, 4.2], [-24, -22, 5.5, 9], [-17, -15.5, 1.5, 2.6], [-40, -34, 8, 14]];   // rise straight out of the sea
      const peak = (x, z, p, i) => {
        const dx = x - p[0], dz = z - p[1], a = Math.atan2(dz, dx);
        const r = p[3] * (1 + 0.17 * Math.sin(a * 3 + i * 1.9) + 0.09 * Math.sin(a * 5 + i * 3.1) + 0.05 * Math.sin(a * 9 + i));   // ridges and gullies
        return p[2] * Math.pow(Math.max(0, 1 - Math.hypot(dx, dz) / r), 1.35);
      };
      const smin = (a, b, k) => { const h = K.clamp(0.5 + 0.5 * (b - a) / k); return K.lerp(b, a, h) - k * h * (1 - h); };
      const coast = (x, z) => smin(x - (-2.9 + 0.22 * z + 0.35 * Math.sin(z * 0.8 + 0.6)), 5.9 + 0.4 * Math.sin(x * 0.6 + 1) - z, 2) + 0.3 * N.fbm(x * 0.35, z * 0.35, 0, 3);   // > 0 on land
      const natural = (x, z) => {
        const d = coast(x, z);
        let m = 0; PEAKS.forEach((p, i) => { m += Math.pow(peak(x, z, p, i), 4); }); m = Math.pow(m, 0.25);
        let h = d > 0 ? 0.08 + 0.5 * (1 - Math.exp(-d * 0.45)) + 0.015 * d + m * smooth(0.2, 2.6, d) + N.fbm(x * 0.6, z * 0.6, 1, 3) * (0.1 + 0.3 * smooth(0.3, 1.6, m)) * smooth(0, 1, d) : Math.max(-1.7, d * 0.55);
        ISLES.forEach((p, i) => { h = Math.max(h, peak(x, z, p, i + 20) - 0.3); });
        return h;
      };
      // The river: a hand-placed path from the mountain to the sea. Its bed only ever goes down, and the ground is
      // carved to it, so the water has a channel to lie in.
      const RIVER = [[2.9, -0.8], [2.15, 0.2], [1.2, 0.3], [0.45, 1.15], [-0.75, 1.0], [-1.5, 1.95], [-2.3, 2.3], [-2.75, 2.5]];
      const river = (() => {
        const curve = new THREE.CatmullRomCurve3(RIVER.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal'), n = 140, pts = curve.getSpacedPoints(n);
        let y = pts.map((p) => natural(p.x, p.z));
        for (let i = 1; i <= n; i++) y[i] = Math.min(y[i], y[i - 1]);
        y = y.map((v, i) => K.lerp(v, 0.0, smooth(0.72, 0.97, i / n)));
        for (let k = 0; k < 6; k++) y = y.map((v, i) => (y[Math.max(0, i - 1)] + v + y[Math.min(n, i + 1)]) / 3);
        const rows = pts.map((p, i) => { const tg = curve.getTangentAt(i / n); return { x: p.x, z: p.z, y: y[i] + 0.03, s: i / n, w: 0.13 + 0.22 * (i / n), nx: -tg.z, nz: tg.x }; });   // y is the water level
        const near = (x, z) => { let best = rows[0], bd = Infinity; for (const r of rows) { const d = (r.x - x) * (r.x - x) + (r.z - z) * (r.z - z); if (d < bd) { bd = d; best = r; } } return { d: Math.sqrt(bd), row: best }; };
        return { rows, near, n };
      })();
      const height = (x, z) => {
        const h = natural(x, z), { d, row } = river.near(x, z);
        return d > row.w + 1.7 || h < 0 ? h : Math.max(Math.min(h, 0.02), K.lerp(row.y + 0.1, h, smooth(row.w + 0.24, row.w + 1.7, d)));
      };

      // ------------------------------------------------------------ light, sky and haze
      // A low warm sun from the west, a cool sky that fills the shadows, and haze the colour of the horizon.
      const SUN = new THREE.Vector3(-0.78, 0.4, 0.3).normalize();
      K.env(S, { top: '#7db7dd', horizon: '#ffe2c4', bottom: '#8fa98a', intensity: 0.55, panels: [{ pos: [SUN.x * 30, SUN.y * 30, SUN.z * 30], size: [10, 10], color: PAL.sun, power: 14, round: true }] });
      K.sun(S, { pos: [SUN.x * 45, SUN.y * 45, SUN.z * 45], target: [0, 0, 0], color: '#ffe0ba', power: 3.5, size: 15, soft: 2.2, mapSize: 4096, far: 110, normalBias: 0.03 });
      K.skyLight(S, { color: '#a9c9ff', power: 0.9, size: 13, center: [0, 1, 0], mapSize: 2048, spread: 0.9 });
      scene.fog = new THREE.Fog(PAL.haze, 12, 56);
      const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.ShaderMaterial({
        side: THREE.BackSide, depthWrite: false, fog: false,
        uniforms: { top: { value: new THREE.Color(PAL.skyTop) }, pale: { value: new THREE.Color(PAL.skyPale) }, haze: { value: new THREE.Color(PAL.haze) }, sunC: { value: new THREE.Color(PAL.sun) }, sunDir: { value: SUN } },
        vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `varying vec3 vD; uniform vec3 top, haze, pale, sunC, sunDir;
          void main(){ vec3 d = normalize(vD); float s = max(dot(d, sunDir), 0.0);
            float y = max(d.y, 0.0);
            vec3 c = mix(mix(haze, pale, smoothstep(0.0, 0.12, y)), top, smoothstep(0.06, 0.5, y));      // through pale cream, so peach and blue never mix to grey
            c += sunC * (pow(s, 5.0) * 0.35 + pow(s, 40.0) * 0.8 + smoothstep(0.9988, 0.9992, s) * 5.0);
            gl_FragColor = vec4(c, 1.0); }`,
      }));
      scene.add(sky);

      // ------------------------------------------------------------ land
      const hero = (x, z) => Math.max(Math.abs(x - 0.5) - 8.5, -7 - z, z - 8.5, 0);       // 0 inside the part of the world the story happens in
      const landPts = scatter([-55, -77, 55, 11], (x, z) => 0.69 * (1 + hero(x, z) * 0.2), 3).filter(([x, z]) => river.near(x, z).d > river.near(x, z).row.w + 0.5);
      PEAKS.concat(ISLES).forEach((p) => landPts.push([p[0], p[1]]));                  // every summit is a real corner
      river.rows.forEach((r, i) => {                                                    // the channel: bed, water's edge, top of the bank
        if (i % 3 || natural(r.x, r.z) < 0.03) return;
        const j = (K.hash(i, 1) - 0.5) * 0.06;
        for (const [k, dy] of [[0, -0.13], [-1, -0.08], [1, -0.08], [-1.9, 0.11], [1.9, 0.11]]) { const off = k * r.w + Math.sign(k) * (Math.abs(k) > 1 ? 0.24 - 0.9 * r.w : 0); landPts.push([r.x + r.nx * off + j, r.z + r.nz * off - j, r.y + dy]); }
      });
      const paintLand = (c, n) => {
        const key = c.x * 12.9898 + c.z * 78.233 + c.y * 37.7, j = K.hash(key, 5) - 0.5, { d, row } = river.near(c.x, c.z);
        let name;
        if (d < row.w + 0.1 && c.y < row.y + 0.02) name = 'bed';
        else if (c.y < 0.15 + j * 0.08) name = 'sand';
        else if (c.y > 2.75 + j * 0.5 && n.y > 0.5) name = 'snow';
        else if (n.y < 0.76 + j * 0.06 || c.y > 2.4) name = K.hash(key, 9) < 0.6 ? 'rock' : 'rockDark';
        else if (c.y > 1.2 + j * 0.5) name = 'forest';
        else name = N.fbm(c.x * 0.3, c.z * 0.3, 3, 2) > 0.02 ? 'meadow' : 'grass';
        return tone(PAL[name], key, name === 'snow' ? 0.35 : 1);
      };
      const land = mesh(facet(surface(landPts, height), paintLand), faceted());
      scene.add(land);

      // ------------------------------------------------------------ sea: the same kind of mesh, heaving, coloured by depth
      const seaPts = scatter([-121, -121, 99, 33], (x, z) => 0.69 * (1 + hero(x, z) * 0.25), 5);
      const paintSea = (c) => {
        const depth = -height(c.x, c.z), key = c.x * 3.1 + c.z * 7.7;
        return tone(depth < 0.055 ? PAL.foam : depth < 0.36 ? PAL.seaShallow : depth < 1.0 ? PAL.sea : PAL.seaDeep, key, 1.1);
      };
      const MOUTH = river.rows[Math.round(river.n * 0.93)];
      const sea = mesh(facet(surface(seaPts, () => 0), paintSea), faceted({ roughness: 0.3, wave: 0.075,
        // when the river arrives, a ring of lighter facets runs out from the mouth
        uniforms: { uRing: { value: new THREE.Vector3(MOUTH.x, MOUTH.z, T.meet) } }, head: 'uniform vec3 uRing;\n',
        tint: 'float rd = distance(aCen.xz, uRing.xy), rt = (uTime - uRing.z) * 2.6; vColor.rgb = mix(vColor.rgb, vec3(0.75, 0.95, 0.93), 0.75 * smoothstep(0.55, 0.0, abs(rd - rt)) * step(0.0, rt) * smoothstep(5.5, 1.0, rt));' }), { cast: false });
      scene.add(sea);

      // ------------------------------------------------------------ river water: a ribbon of facets that unfolds downstream and then keeps flashing
      const riverGeo = (() => {
        // four corners across the stream at every other row; the two inner ones are nudged so no two facets match
        const rows = river.rows.filter((_, i) => i % 2 === 0), tris = [];
        const at = (r, k, i) => { const inner = k === 1 || k === 2, j = inner ? (K.hash(i, k) - 0.5) * 0.09 : 0, off = [-1, -0.36, 0.36, 1][k] * (r.w + 0.2); return [r.x + r.nx * off + r.nz * j, r.y + (inner ? (K.hash(i, k + 5) - 0.5) * 0.02 : 0), r.z + r.nz * off - r.nx * j]; };
        for (let i = 0; i + 1 < rows.length; i++) for (let k = 0; k < 3; k++) {
          const a = at(rows[i], k, i), b = at(rows[i], k + 1, i), c = at(rows[i + 1], k, i + 1), d = at(rows[i + 1], k + 1, i + 1);
          if ((i + k) % 2) tris.push([a, b, c], [b, d, c]); else tris.push([a, b, d], [a, d, c]);
        }
        const g = facet(upward(tris), (c) => tone(PAL.river, c.x * 5.3 + c.z * 9.1, 1.3));
        return unfold(g, { from: [river.rows[0].x, river.rows[0].y, river.rows[0].z], duration: T.riverDur, start: T.river });
      })();
      const water = mesh(riverGeo, faceted({ roughness: 0.35, unfold: true, fold: 0.3,
        tint: 'float fl = fract((aCen.x * 0.9 - aCen.z * 0.5) * 0.9 + uTime * 1.3 + fract(aCen.x * 37.0 + aCen.z * 17.0) * 0.4); vColor.rgb = mix(vColor.rgb, vec3(0.86, 0.97, 0.96), 0.5 * smoothstep(0.7, 0.85, fl) * smoothstep(1.0, 0.85, fl));' }), { cast: false });
      scene.add(water);

      // where the four flags stand: [x, z] (flag 2 is in cloud A's own space), which way they face, and which side the paper hangs
      const FLAGS = [{ at: [-4.95, 1.95], yaw: 0.25, height: 1.3 }, { at: [-1.35, 0.1], yaw: 0, height: 1.35 }, { at: [5.95, 1.2], yaw: -0.05, height: 1.4, side: -1 }, { at: [0.9, 3.6], yaw: 0, height: 1.0 }];
      const clear = (x, z) => (x > 1.9 && x < 6.3 && z > 0.9 && z < 3.4) || (x > 0.5 && x < 4.3 && z > 3.2 && z < 6.5);   // nothing grows in front of a flag

      // ------------------------------------------------------------ trees and rocks: placed by rules, not sprinkled
      const slope = (x, z) => Math.hypot(height(x + 0.2, z) - height(x - 0.2, z), height(x, z + 0.2) - height(x, z - 0.2)) / 0.4;
      const plants = { pine: [], pine2: [], tree: [], ochre: [], rock: [], rock2: [] };
      {
        const r = K.rng(21), taken = [];
        const free = (x, z, gap) => taken.every((q) => Math.hypot(q[0] - x, q[1] - z) > gap);
        const put = (kind, x, z, s, t0 = -9) => { taken.push([x, z]); plants[kind].push({ x, z, y: height(x, z) - 0.03, s, rot: r.range(0, 6.28), t0, lean: r.range(-0.06, 0.06) }); };
        BANK_TREES.forEach((b, i) => {
          const row = river.rows[Math.round(b.s * river.n)], off = -Math.sign(row.nz) * (row.w + 0.6 + 0.45 * K.hash(i, 4));
          put(i % 4 === 1 ? 'ochre' : 'tree', row.x + row.nx * off, row.z + row.nz * off, r.range(0.7, 0.95), b.t);
        });
        for (let i = 0; i < 2600; i++) {
          const x = r.range(-4, 16), z = r.range(-9, 6.2), y = height(x, z), sl = slope(x, z), { d, row } = river.near(x, z);
          if (y < 0.2 || d < row.w + 0.6 || clear(x, z) || (d < row.w + 1.5 && ((x - row.x) * row.nx + (z - row.z) * row.nz) * row.nz > 0)) continue;   // and nothing tall in front of the river
          const grove = N.fbm(x * 0.45, z * 0.45, 9, 2);                                 // woods come in patches
          if (y > 0.75 && y < 2.3 && sl < 1.1 && grove > -0.06 && free(x, z, 0.36)) put(r.chance(0.5) ? 'pine' : 'pine2', x, z, r.range(0.62, 1.0) * (1.15 - y * 0.12));
          else if (y < 0.8 && sl < 0.5 && grove > 0.1 && free(x, z, 0.55)) put(r.chance(0.16) ? 'ochre' : r.chance(0.3) ? 'pine' : 'tree', x, z, r.range(0.6, 1.0));
        }
        for (let i = 0; i < 500; i++) {                                                  // rocks: along the shore, at the foot of the mountains, round the islet
          const x = r.range(-7, 9), z = r.range(-6, 6.5), y = height(x, z), { d, row } = river.near(x, z);
          if (d < row.w + 0.3 || !free(x, z, 0.5)) continue;
          if ((y > -0.12 && y < 0.1 && r.chance(0.35)) || (y > 1.6 && y < 2.6 && r.chance(0.12)) || (d < row.w + 0.6 && row.s > 0.3 && r.chance(0.5))) put(r.chance(0.5) ? 'rock' : 'rock2', x, z, r.range(0.22, 0.6));
        }
      }
      const kinds = { pine: pineGeo(1), pine2: pineGeo(2, 0.8), tree: treeGeo(3, PAL.leaf), ochre: treeGeo(4, PAL.ochre), rock: rockGeo(5), rock2: rockGeo(6) };
      const plantMat = faceted(), inst = {};
      for (const k of Object.keys(kinds)) {
        const m = inst[k] = new THREE.InstancedMesh(kinds[k], plantMat, Math.max(1, plants[k].length)); m.count = plants[k].length; m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; scene.add(m);
        plants[k].forEach((q, i) => m.setColorAt(i, new THREE.Color().setScalar(0.9 + 0.2 * K.hash(q.x, q.z))));
      }

      // ------------------------------------------------------------ clouds: A forms over the sea, B and C carry it inland, C darkens and rains
      const cloudMat = () => faceted({ unfold: true, fold: 0.42, glow: 0.22 });
      const mkCloud = (puffs, seed, pos, from, start, speed) => { const m = mesh(unfold(cloudGeo(puffs, seed), { from, start, speed }), cloudMat()); const g = new THREE.Group(); g.add(m); g.position.set(...pos); g.userData = { pos, mesh: m }; scene.add(g); return g; };
      const cloudA = mkCloud([[0, 0.3, 0, 1.0], [-1.05, 0.12, 0.1, 0.72], [1.0, 0.18, -0.05, 0.8], [1.8, 0.02, 0.12, 0.5], [0.25, 0.02, 0.55, 0.62], [-0.45, 0.72, -0.1, 0.55]], 1, [-3.5, 3.75, -0.7], [-0.6, 0, 0.3], T.cloudA, 2.3);
      const cloudB = mkCloud([[0, 0.2, 0, 0.6], [0.7, 0.08, 0.05, 0.45], [-0.6, 0.05, 0.1, 0.4]], 2, [0.1, 4.75, -1.6], [-1, 0, 0], T.cloudB, 2.6);
      const cloudC = mkCloud([[0, 0.35, 0, 1.05], [-1.1, 0.15, 0.15, 0.75], [1.05, 0.2, -0.1, 0.82], [0.3, 0.05, 0.6, 0.66], [-0.4, 0.05, -0.6, 0.6], [0.45, 0.85, -0.05, 0.6], [1.85, 0.03, 0.1, 0.48]], 3, [3.3, 4.3, -1.0], [-1.8, 0, 0], T.cloudC, 2.6);
      const STORM = new THREE.Color(0.52, 0.5, 0.62), WHITE = new THREE.Color(1, 1, 1);
      // far clouds that are simply there, for depth
      [[[-27, 5.4, -30], 2.2, 11], [[13, 8.6, -26], 2.0, 12], [[-34, 7.5, -48], 3.0, 13]].forEach(([pos, s, seed]) => {
        const m = mesh(cloudGeo([[0, 0.25, 0, 0.9], [-0.95, 0.1, 0.1, 0.65], [0.9, 0.12, 0, 0.7], [1.6, 0.02, 0.1, 0.42]], seed), faceted({ glow: 0.22 })); m.position.set(...pos); m.scale.setScalar(s); scene.add(m);
      });

      // ------------------------------------------------------------ droplets: vapour rising off the sea into cloud A, rain falling from cloud C
      const dropMat = new THREE.MeshStandardMaterial({ color: '#dff6ff', emissive: '#bfeaff', emissiveIntensity: 0.55, flatShading: true, roughness: 0.4 });
      const NV = 110, vapour = new THREE.InstancedMesh(dropGeo(0.045, 0.085), dropMat, NV); vapour.frustumCulled = false; vapour.castShadow = false; scene.add(vapour);
      const VAP = Array.from({ length: NV }, (_, i) => ({ x: -4.2 + (K.hash(i, 1) - 0.5) * 3.8, z: 0.6 + (K.hash(i, 2) - 0.5) * 3.0, ph: K.hash(i, 3), life: 2.3 + K.hash(i, 4) * 1.2, tx: -3.5 + (K.hash(i, 5) - 0.5) * 2.4, tz: -0.6 + (K.hash(i, 6) - 0.5) * 0.9, s: 0.7 + K.hash(i, 7) * 0.7 }));
      const NR = 150, rain = new THREE.InstancedMesh(dropGeo(0.022, 0.15), dropMat, NR); rain.frustumCulled = false; rain.castShadow = false; scene.add(rain);
      const RAIN = Array.from({ length: NR }, (_, i) => { const x = 3.3 + (K.hash(i, 11) - 0.5) * 3.6, z = -0.9 + (K.hash(i, 12) - 0.5) * 1.7; return { x, z, top: 4.35, fall: 4.35 - Math.max(0, height(x - 0.2, z)), ph: K.hash(i, 13), v: 6.5 + K.hash(i, 14) * 1.5 }; });

      // ------------------------------------------------------------ small things: a paper boat, and the four flags
      const boat = mesh(boatGeo(), faceted({ roughness: 0.8 })); boat.material.side = THREE.DoubleSide; scene.add(boat);
      const flags = STEPS.map((word, i) => flag(i + 1, word, FLAGS[i]));
      flags.forEach((f, i) => {
        const [x, z] = FLAGS[i].at;
        if (i === 1) { f.group.position.set(x, 0.6, z); cloudA.add(f.group); }           // stuck into the cloud (its foot is below the puff's top), so it drifts with it
        else { f.group.position.set(x, height(x, z) - 0.02, z); scene.add(f.group); }
        f.group.rotation.y = FLAGS[i].yaw;
      });
      const FLAG_T = [-9, T.flag2, T.flag3, T.flag4];

      // ------------------------------------------------------------ camera: one continuous crane move (position and aim both flow through their keys)
      const cam = {
        pos: K.path([[0, [-0.9, 1.2, 9.0]], [1.5, [-1.4, 2.3, 10.6]], [2.8, [-2.4, 4.3, 7.6]], [4.4, [2.8, 4.6, 9.6]], [5.3, [4.0, 3.8, 10.8]], [6.6, [1.6, 4.8, 13.4]], [7.5, [0.35, 5.25, 14.0]], [8.5, [0.2, 5.4, 14.3]]]),
        aim: K.path([[0, [-3.8, 1.45, 1.6]], [1.5, [-3.7, 2.7, 0.8]], [2.8, [-3.1, 4.7, -0.5]], [4.4, [3.1, 3.8, -0.4]], [5.3, [3.9, 2.8, 0.4]], [6.6, [0.7, 2.3, 0.8]], [7.5, [0.1, 2.65, 0]], [8.5, [0.1, 2.7, 0]]]),
        // the lens: sharp on whichever flag the story is at, then on the plane all four share
        focus: K.track([[0, [-3.8, 1.3, 1.9]], [1.3, [-3.8, 1.3, 1.9]], [2.5, [-3.2, 4.6, -0.6], 'inOut'], [3.5, [-3.2, 4.6, -0.6]], [4.6, [4.4, 2.6, 1.2], 'inOut'], [5.4, [4.4, 2.6, 1.2]], [7.3, [0.1, 2.2, 0.8], 'inOut']]),
        ap: K.track([[0, 0.06], [5.4, 0.06], [7.3, 0.05, 'inOut']]),
      };

      return {
        update(t) {
          clock.value = t;
          // clouds drift inland a little and bob; C turns to a storm cloud just before the rain
          [cloudA, cloudB, cloudC].forEach((c, i) => c.position.set(c.userData.pos[0] + 0.07 * t, c.userData.pos[1] + 0.05 * Math.sin(t * 0.9 + i * 2.1), c.userData.pos[2]));
          cloudC.userData.mesh.material.color.copy(WHITE).lerp(STORM, K.seg(t, T.rain - 0.7, T.rain + 0.5, K.ease.inOut));
          // vapour: each droplet leaves the sea, leans toward the cloud as it climbs, and is taken up
          VAP.forEach((q, i) => {
            const u = ((t / q.life + q.ph) % 1 + 1) % 1, e = u * u * (3 - 2 * u), top = cloudA.position.y + 0.25;
            const sc = q.s * Math.min(1, u * 16) * (1 - K.smooth(0.75, 1, u));
            K.place(vapour, i, [K.lerp(q.x, q.tx, e * e) + 0.08 * Math.sin(u * 9 + i), 0.03 + top * Math.pow(u, 1.35), K.lerp(q.z, q.tz, e * e) + 0.08 * Math.cos(u * 7 + i * 1.7)], [0, u * 5 + i, 0.25 * Math.sin(u * 11 + i)], sc);
          });
          vapour.instanceMatrix.needsUpdate = true;
          // rain: falls on a slant from the flat base of cloud C to the slope below it
          RAIN.forEach((q, i) => {
            const t1 = t - T.rain - q.ph * 0.5, period = q.fall / q.v + 0.08, k = t1 / period, u = k - Math.floor(k);
            const y = q.top - u * period * q.v, on = t1 > 0 && y > q.top - q.fall;
            K.place(rain, i, [q.x + cloudC.position.x - 3.3 - (q.top - y) * 0.09, y, q.z], [0, i, -0.09], on ? 1 : 0);
          });
          rain.instanceMatrix.needsUpdate = true;
          // trees: the ones along the river spring up as the water reaches them
          for (const k of Object.keys(inst)) {
            plants[k].forEach((q, i) => { const a = q.t0 < 0 ? 1 : K.spring(t - q.t0, 2.4, 0.36), w = q.t0 < 0 ? 1 : K.spring(t - q.t0, 1.9, 0.5); K.place(inst[k], i, [q.x, q.y, q.z], [q.lean, q.rot, q.lean * 0.7], [q.s * w, q.s * a, q.s * w]); });
            inst[k].instanceMatrix.needsUpdate = true;
          }
          flags.forEach((f, i) => f.pop(t, FLAG_T[i]));
          // the boat rides the same wave as the sea
          const bx = -6.9 + 0.1 * t, bz = -1.4, wv = (x, z) => 0.075 * (Math.sin(x * 1.25 + t * 1.35) * Math.cos(z * 1.05 - t * 1.1) * 0.6 + Math.sin(x * 2.7 - z * 2.2 + t * 2.3) * 0.4);
          boat.position.set(bx, wv(bx, bz) + 0.03, bz); boat.rotation.set(0.08 * Math.sin(t * 1.3), 0.5, (wv(bx + 0.3, bz) - wv(bx - 0.3, bz)) * 1.2);
          const p = cam.pos(t), a = cam.aim(t);
          K.look(camera, p, a); K.focus(camera, cam.focus(t), cam.ap(t));
          sky.position.copy(camera.position);
        },
      };
    },

    sound(k) {
      const K = globalThis.K, r = K.rng(4);
      // a soft major pad under everything, sea air, and rain once the cloud breaks
      k.music('pad', 0, T.end, { bpm: 56, gain: 0.9, chords: [['D4', 'F#4', 'A4', 'C#5'], ['G3', 'B3', 'D4', 'F#4']] });
      k.bed('room', 0, T.end, { gain: 0.6 }); k.bed('hiss', 0, T.rain, { gain: 0.5 });
      k.bed('rain', T.rain - 0.1, T.end, { gain: 0.9 });
      k.withMinor(() => {
        // vapour leaving the water: small rising glassy notes
        for (let t = 0.15; t < T.cloudA + 0.6; t += 0.22 + r() * 0.12) k.tone(t, { f: [[0, 1300 + r() * 500], [0.25, 2100 + r() * 900]], dur: 0.3, gain: 0.035, a: 0.05, pan: -0.5 + r() * 0.4, verb: 0.4 });
        // clouds folding open: paper
        [[T.cloudA, 1.2, -0.3], [T.cloudB, 0.55, 0], [T.cloudC, 1.2, 0.3]].forEach(([t, dur, pan]) => { k.play('paper', t, { dur, gain: 0.8, pan }); k.play('paper', t + dur * 0.45, { dur: dur * 0.6, gain: 0.5, pan }); });
        // the river unfolding: a run of small water notes that speeds up and falls in pitch as it reaches the sea
        for (let u = 0; u < 1; u += 0.035 + r() * 0.02) k.tone(T.river + u * T.riverDur, { f: [[0, 2300 - 900 * u + r() * 400], [0.06, 1500 - 600 * u]], dur: 0.09, gain: 0.05, a: 0.004, pan: 0.4 - 0.7 * u, verb: 0.25 });
        // trees springing up along the banks
        BANK_TREES.forEach((b, i) => k.play('pop', b.t, { gain: 0.3, f: 520 + (i * 97) % 340, pan: 0.3 - 0.04 * i }));
      });
      // the flags: pin in, paper round
      [T.flag2, T.flag3, T.flag4].forEach((t, i) => { k.play('pop', t, { gain: 0.9, f: 560 + i * 60, pan: [-0.3, 0.35, 0][i] }); k.play('swish', t + 0.12, { gain: 0.5, dur: 0.2 }); k.play('tock', t + 0.3, { gain: 0.45, f: 700 }); });
      k.play('thud', T.rain - 0.25, { gain: 0.22, f: 70, pan: 0.3 });       // the cloud breaks, far-off thunder
      k.play('whoosh', T.river - 0.1, { gain: 0.35, dur: 0.8, top: 1800, pan: 0.3 });
      k.play('success', T.meet, { gain: 0.6, f: 'A5' }); k.play('sparkle', T.meet + 0.1, { gain: 0.6 });   // the loop closes
    },
  });
}
```
