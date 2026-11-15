# Voxel (#18)

- **id:** `voxel`
- **Category:** Filters over 3D
- **Use:** explainer
- **Reference duration:** 8 s
- **Google Fonts:** none
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`

## Style card

- **Look:** Everything is built from small cubes, like a hand-made voxel model on a display base: a short palette with every cube a shade apart from its neighbours, tiny bevels that catch the light, and the label spelled in cubes on the front of the base.
- **Motion:** The cubes do the animating: things drop in column by column, grow layer by layer, swell, pop and get knocked off, each with a small bounce on arrival. Nothing slides or fades.
- **Light:** One soft warm sun from the front left and an open sky that really gets blocked in corners and under things, so every cube sits in its own little shadow.
- **Materials:** Matte painted cubes with a narrow chamfer, a smooth off-white plinth under the model and a plain coloured tabletop, so the cubes are the only texture.
- **Camera:** A long lens looking down from about 26 degrees with a wide aperture: the model is sharp, the table in front and behind falls soft, and it reads as a miniature. One slow arc and pull-back that keeps pace with what is being built.
- **Finish:** Neutral tone mapping to keep the palette true, a little bloom on the cubes that glow, light vignette, almost no grain.
- **Good for:** Anything that can be shown as a small model that builds up in stages: how something grows, is made or is put together. One base, one subject in the middle, one voxel word per stage, weather or helpers as small cube events around it.

## Reference

- **Sample topic:** How a tomato plant grows: seed, sprout, plant, fruit
- **Gallery description:** Everything is built from small cubes, like a hand-made voxel model on a display base: a short palette with every cube a shade apart from its neighbours, tiny bevels that catch the light, and the label spelled in cubes on the front of the base.
- **Shown in the sample clip:** How a tomato plant grows: seed, sprout, plant, fruit

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/voxel.js`)

```js
{
  // ---------------------------------------------------------------- content (change this block for a new topic)
  // One word per stage, set in voxel letters on the front of the base. `at` is the second it clicks on; the word
  // before it is knocked off at the same moment.
  const STAGES = [
    { word: 'SEED', at: -1 },
    { word: 'SPROUT', at: 2.0 },
    { word: 'PLANT', at: 3.8 },
    { word: 'FRUIT', at: 5.85 },
  ];
  // One schedule (seconds) for picture and sound.
  const T = {
    seedLand: 0.8, cover: 1.1,      // the seed lands in its hole, the dug-out earth closes over it
    cloudIn: 0.9, rain: [1.75, 2.95], cloudOut: 3.0,
    sprout: 2.3,
    sun: 3.3, stake: 3.45,
    grow: 3.8, growDur: 1.55,       // the plant climbs its stake layer by layer
    flower: 5.25, fruit: 5.85, ripe: 6.2,
    done: 7.0,
  };

  // ---------------------------------------------------------------- the palette
  // A voxel model lives on a short, deliberate palette. Every cube takes one of these and the renderer nudges it a
  // little lighter or darker, so a surface looks hand-placed instead of flood-filled.
  const PAL = {
    grass: '#86b84f', grassB: '#74a945', tuft: '#a5cf5c', soilA: '#8a5a38', soilB: '#74482c', soilC: '#5f3a25', stone: '#a9a297', stoneB: '#8f887f',
    bed: '#5a3823', bedB: '#4b2d1c', wet: '#2b1a12', wood: '#d3a468', woodB: '#c08f55', woodDark: '#9c6f42',
    letter: '#fff6e6',
    seed: '#f6dc98', stem: '#5c9a3a', leaf: '#3f8f3d', leafDark: '#2f7a37', leafLight: '#72b947', sprout: '#9bd45a',
    tomato: '#e5352b', unripe: '#a9c94a', turning: '#f2952f', calyx: '#2f7a37', flower: '#ffd94a', petal: '#fff0a8',
    cloud: '#ffffff', cloudBase: '#dfe9f3', storm: '#8fa3bd', rain: '#3fa0ee',
    sun: '#ffc531', sunCore: '#ffe487', ray: '#ffad2b',
    can: '#4d9fb2', canDark: '#3b8395', canLight: '#8fd0dc', paper: '#f3ead8', metal: '#b9c0c4', pink: '#f39ab0',
    floor: '#a5cde6', plinth: '#f6f1e7',
  };

  // ---------------------------------------------------------------- the model format
  // A voxel model is just a list of cells { x, y, z, c } on a whole-number grid (x right, y up, z toward the viewer,
  // c = a palette name). Three ways to write one:
  //   model((put) => { put(x, y, z, 'grass'); ... })   a generator function, for anything with a rule behind it
  //   slices([...front views, back to front], legend)  text maps you can read as a picture: rows are top to bottom
  //   layers([...floor plans, bottom to top], legend)  the same, seen from above
  // `put` on a cell that is taken replaces it, and put(x, y, z, null) carves it out again. Extra fields ride along on
  // the cell (put(x, y, z, c, { born: 0.4 })) for the animations to read.
  function model(fn) {
    const cells = new Map();
    fn((x, y, z, c, extra) => { const key = x + ',' + y + ',' + z; if (c) cells.set(key, Object.assign({ x, y, z, c }, extra)); else cells.delete(key); });
    return [...cells.values()];
  }
  const slices = (maps, legend) => model((put) => maps.forEach((rows, z) => rows.forEach((row, r) => [...row].forEach((ch, x) => { if (legend[ch]) put(x, rows.length - 1 - r, z, legend[ch]); }))));
  const layers = (maps, legend) => model((put) => maps.forEach((rows, y) => rows.forEach((row, z) => [...row].forEach((ch, x) => { if (legend[ch]) put(x, y, z, legend[ch]); }))));
  // keep only the cells you could ever see: drop every cell that is boxed in on all six sides (`sealed` = it also
  // sits on a table, so the bottom face counts as covered)
  function shell(cells, sealed) {
    const has = new Set(cells.map((v) => v.x + ',' + v.y + ',' + v.z)), f = (x, y, z) => has.has(x + ',' + y + ',' + z);
    const minY = Math.min(...cells.map((v) => v.y));
    return cells.filter((v) => !(f(v.x + 1, v.y, v.z) && f(v.x - 1, v.y, v.z) && f(v.x, v.y + 1, v.z) && (f(v.x, v.y - 1, v.z) || (sealed && v.y === minY)) && f(v.x, v.y, v.z + 1) && f(v.x, v.y, v.z - 1))
      && !(sealed && v.y === minY && f(v.x + 1, v.y, v.z) && f(v.x - 1, v.y, v.z) && f(v.x, v.y, v.z + 1) && f(v.x, v.y, v.z - 1) && f(v.x, v.y + 1, v.z)));
  }

  // Voxel lettering: a 5 x 7 pixel font, one number per row (5 bits, the left pixel is 16). text('SEED', 'letter', 2)
  // gives a model 7 cells tall and 2 deep; every cell remembers its column (`col`) so words can arrive as a wave.
  const FONT = {
    A: [14, 17, 17, 31, 17, 17, 17], B: [30, 17, 17, 30, 17, 17, 30], C: [14, 17, 16, 16, 16, 17, 14], D: [30, 17, 17, 17, 17, 17, 30], E: [31, 16, 16, 30, 16, 16, 31],
    F: [31, 16, 16, 30, 16, 16, 16], G: [14, 17, 16, 23, 17, 17, 15], H: [17, 17, 17, 31, 17, 17, 17], I: [14, 4, 4, 4, 4, 4, 14], J: [7, 2, 2, 2, 2, 18, 12],
    K: [17, 18, 20, 24, 20, 18, 17], L: [16, 16, 16, 16, 16, 16, 31], M: [17, 27, 21, 21, 17, 17, 17], N: [17, 17, 25, 21, 19, 17, 17], O: [14, 17, 17, 17, 17, 17, 14],
    P: [30, 17, 17, 30, 16, 16, 16], Q: [14, 17, 17, 17, 21, 18, 13], R: [30, 17, 17, 30, 20, 18, 17], S: [15, 16, 16, 14, 1, 1, 30], T: [31, 4, 4, 4, 4, 4, 4],
    U: [17, 17, 17, 17, 17, 17, 14], V: [17, 17, 17, 17, 17, 10, 4], W: [17, 17, 17, 21, 21, 21, 10], X: [17, 17, 10, 4, 10, 17, 17], Y: [17, 17, 17, 10, 4, 4, 4],
    Z: [31, 1, 2, 4, 8, 16, 31], 0: [14, 17, 19, 21, 25, 17, 14], 1: [4, 12, 4, 4, 4, 4, 14], 2: [14, 17, 1, 2, 4, 8, 31], 3: [31, 2, 4, 2, 1, 17, 14],
    4: [2, 6, 10, 18, 31, 2, 2], 5: [31, 16, 30, 1, 1, 17, 14], 6: [6, 8, 16, 30, 17, 17, 14], 7: [31, 1, 2, 4, 8, 8, 8], 8: [14, 17, 17, 14, 17, 17, 14],
    9: [14, 17, 17, 15, 1, 2, 12], '.': [0, 0, 0, 0, 0, 12, 12], '!': [4, 4, 4, 4, 4, 0, 4], '?': [14, 17, 1, 2, 4, 0, 4], '%': [24, 25, 2, 4, 8, 19, 3],
    '-': [0, 0, 0, 31, 0, 0, 0], '+': [0, 4, 4, 31, 4, 4, 0], ':': [0, 12, 12, 0, 12, 12, 0], '/': [1, 1, 2, 4, 8, 16, 16],
  };
  const textWidth = (str) => str.length * 6 - 1;
  const text = (str, c, depth = 2) => model((put) => [...str].forEach((ch, i) => (FONT[ch] || []).forEach((bits, r) => {
    for (let b = 0; b < 5; b++) if (bits & (16 >> b)) for (let z = 0; z < depth; z++) put(i * 6 + b, 6 - r, z, c, { col: i * 6 + b });
  })));

  // ---------------------------------------------------------------- the models of this clip
  // The base: a slab of earth 55 x 21 cells and 10 thick with rounded corners, grass on top, wavy soil layers in the cut
  // sides and a few stones. Its front face is kept calm because the stage word sits on it.
  const BASE = { hx: 27, hz: 10, top: 9 }, GROUND = BASE.top + 1;       // GROUND = the first free layer above the grass
  const BED = { x0: -8, x1: 8, z0: -7, z1: 3 };                         // the raised bed (outer edge of its wooden frame)
  const SPOT = [0, -2];                                                 // where the seed goes: x, z
  const inBed = (x, z, m = 0) => x >= BED.x0 - m && x <= BED.x1 + m && z >= BED.z0 - m && z <= BED.z1 + m;
  function baseModel() {
    const n = K.noise(3);
    return shell(model((put) => {
      for (let x = -BASE.hx; x <= BASE.hx; x++) for (let z = -BASE.hz; z <= BASE.hz; z++) {
        const cx = Math.abs(x) - (BASE.hx - 3), cz = Math.abs(z) - (BASE.hz - 3);
        if (cx > 0 && cz > 0 && cx * cx + cz * cz > 3.4 * 3.4) continue;                          // rounded corners
        const wave = n.n2(x * 0.11, z * 0.11) > 0.05 ? 1 : 0, calm = z === BASE.hz && Math.abs(x) < 20;
        for (let y = 0; y <= BASE.top; y++) {
          const h = K.hash(x, y, z);
          let c = y === BASE.top ? (n.n2(x * 0.09 + 5, z * 0.09) > 0.08 ? 'grassB' : 'grass') : y >= 5 + wave ? 'soilA' : y >= 2 + wave ? 'soilB' : 'soilC';
          if (y === BASE.top - 1 && h < 0.3 && !calm) c = 'grass';                                 // grass hanging over the edge
          if (y < BASE.top - 1 && h > 0.955 && !calm) c = h > 0.98 ? 'stone' : 'stoneB';
          if (y === BASE.top && inBed(x, z, -1)) c = 'bedB';                                       // bare earth under the bed
          put(x, y, z, c);
        }
      }
    }), true);
  }
  // The raised bed: a plank frame two cells high around one layer of dark soil, raked into rows, with a hole for the seed.
  const bedFrame = () => model((put) => {
    for (let x = BED.x0; x <= BED.x1; x++) for (let z = BED.z0; z <= BED.z1; z++) {
      const edge = x === BED.x0 || x === BED.x1 || z === BED.z0 || z === BED.z1, corner = (x === BED.x0 || x === BED.x1) && (z === BED.z0 || z === BED.z1);
      if (!edge) continue;
      for (let y = 0; y < (corner ? 3 : 2); y++) put(x, y, z, corner ? 'woodDark' : (Math.floor((x + z + 40) / 4) + y) % 2 ? 'wood' : 'woodB');
    }
  });
  const bedSoil = () => model((put) => {
    for (let x = BED.x0 + 1; x < BED.x1; x++) for (let z = BED.z0 + 1; z < BED.z1; z++) if (x !== SPOT[0] || z !== SPOT[1]) put(x, 0, z, (z + 40) % 3 === 0 ? 'bedB' : 'bed');
  });
  // Small things that make it a garden. They are written as pictures: each string is one row of cubes.
  const WATERING_CAN = slices([
    ['.........', '.........', '..BBBB...', '..bBBB...', '..bBBB...', '..bbBB...'],
    ['........L', '.dd....B.', 'd.BBBBB..', 'd.bBBB...', '.dbBBB...', '..bbBB...'],
    ['.........', '.........', '..BBBB...', '..bBBB...', '..bBBB...', '..bbBB...'],
  ], { B: 'can', b: 'canDark', d: 'canDark', L: 'canLight' });
  const SEED_PACKET = slices([
    ['PPPP', 'PPPP', 'PPPP', 'PPPP', 'PPPP'],
    ['PPPP', 'PRRP', 'PRRP', 'PPPP', 'GGGG'],
  ], { P: 'paper', R: 'tomato', G: 'leaf' });
  const TROWEL = slices([['R', 'W', 'W', 'M', 'M']], { R: 'tomato', W: 'woodB', M: 'metal' });
  const SPROUT = slices([['LL...LL', '.LL.LL.', '...S...', '...S...', '...S...', '...S...']], { L: 'sprout', S: 'stem' });
  // A tomato is a 3 x 3 x 3 cube with its eight corners taken off, a green star on top and a short stalk.
  const TOMATO = layers([
    ['.T.', 'TTT', '.T.'],
    ['TTT', 'TTT', 'TTT'],
    ['.T.', 'TCT', '.T.'],
    ['...', '.S.', '...'],
  ], { T: 'tomato', C: 'calyx', S: 'stem' });
  const fence = () => model((put) => {
    for (let x = -24; x <= 24; x++) { const post = (x + 24) % 4 === 0; if (post) for (let y = 0; y < 5; y++) put(x, y, 0, y === 4 ? 'woodDark' : 'wood'); else { put(x, 1, 0, 'woodB'); put(x, 3, 0, 'woodB'); } }
  });
  // grass tufts, a few flowers and stones, scattered by a seeded rule everywhere the ground is free
  const scatter = () => model((put) => {
    const r = K.rng(21);
    for (let i = 0; i < 120; i++) {
      const x = r.int(-25, 25), z = r.int(-7, 9), k = r();
      if (inBed(x, z, 1) || (x < -11 && x > -23 && z > 0 && z < 6) || (x > 10 && x < 19 && z > -2 && z < 3)) continue;
      if (k < 0.62) put(x, 0, z, 'tuft'); else if (k < 0.74) { put(x, 0, z, 'stem'); put(x, 1, z, r.pick(['petal', 'flower', 'pink', 'cloud'])); }
      else if (k < 0.82) { put(x, 0, z, 'stone'); if (r.chance(0.5)) put(x + 1, 0, z, 'stoneB'); }
    }
  });

  // The tomato plant, as a generator: a stem, side shoots that spiral up it, a flat pad of leaf cubes at the end of
  // every shoot, and room carved out in front for each fruit. `born` (seconds after growth starts) rises with height
  // and distance from the stem: that single number is what makes it grow layer by layer.
  const SHOOTS = [   // height, direction x, direction z, length, leaf size
    [4, -1, 0, 5, 3.1], [5, 1, 0, 5, 3.1], [6, 0, -1, 4, 2.8], [7, -1, 1, 3, 2.6], [8, 1, 1, 3, 2.6], [9, 1, -1, 4, 2.6], [10, -1, -1, 4, 2.6], [11, 1, 0, 5, 2.7],
    [12, -1, 0, 5, 2.7], [13, 0, -1, 3, 2.5], [14, 1, 1, 3, 2.3], [15, -1, 1, 3, 2.3], [16, 1, -1, 3, 2.3], [17, -1, 0, 4, 2.3], [18, 1, 0, 4, 2.2], [19, 0, -1, 2, 2.2],
    [20, -1, 1, 2, 2.0], [21, 1, 1, 2, 2.0], [22, -1, 0, 2, 1.9], [23, 1, 0, 2, 1.8], [25, 0, 0, 0, 2.2],
  ];
  const FRUITS = [[-6, 6, 2], [5, 7, 3], [-1, 9, 4], [6, 12, 2], [-5, 13, 3], [1, 15, 4], [-3, 18, 3], [3, 20, 3]];   // centre of each tomato, from the foot of the stem
  const PLANT_TOP = 26, RATE = T.growDur / (PLANT_TOP + 5);
  const plantModel = () => model((put) => {
    for (let y = 4; y <= PLANT_TOP - 1; y++) put(0, y, 0, 'stem', { born: y * RATE });
    SHOOTS.forEach(([y, dx, dz, len, r]) => {
      for (let i = 1; i <= len; i++) put(dx * i, y + (i > 2 ? 1 : 0), dz * i, 'stem', { born: (y + i) * RATE });
      const cx = dx * (len + 1), cy = y + (len > 2 ? 1 : 0), cz = dz * (len + 1), R = Math.ceil(r);
      for (let ex = -R; ex <= R; ex++) for (let ey = -1; ey <= 1; ey++) for (let ez = -R; ez <= R; ez++) {
        const d = (ex / r) ** 2 + (ey / (r * 0.52)) ** 2 + (ez / (r * 0.85)) ** 2, h = K.hash(cx + ex, cy + ey, cz + ez);
        if (d > 1 || (d > 0.55 && h < 0.22)) continue;                                            // a ragged rim reads as leaves
        put(cx + ex, cy + ey, cz + ez, ey > 0 || h > 0.8 ? 'leafLight' : ey < 0 ? 'leafDark' : 'leaf', { born: (y + len + 1) * RATE + 0.08 + Math.sqrt(d) * 0.14, leaf: 1 });
      }
    });
    for (const [fx, fy, fz] of FRUITS) for (let x = -2; x <= 2; x++) for (let y = -2; y <= 2; y++) for (let z = -1; z <= 5; z++) if ((fx + x !== 0 || fz + z !== 0) && (z >= 1 || (Math.abs(x) < 2 && Math.abs(y) < 2))) put(fx + x, fy + y, fz + z, null);
  });
  const fruitModel = () => FRUITS.flatMap(([fx, fy, fz], g) => TOMATO.map((v) => ({ ...v, x: fx + v.x - 1, y: fy + v.y - 1, z: fz + v.z - 1, g, cx: fx, cy: fy + 1.5, cz: fz })));
  const flowerModel = () => model((put) => FRUITS.forEach(([fx, fy, fz], g) => { put(fx, fy, fz + 1, 'flower', { g }); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) put(fx + a, fy + b, fz + 1, 'petal', { g }); }));

  // The weather. A cloud is a few overlapping ellipsoids with a flat grey underside; the sun is a disc two cubes
  // thick with eight rays that take turns stepping out.
  const cloudModel = () => shell(model((put) => {
    for (const [cx, cy, cz, rx, ry, rz] of [[-4.5, 0.4, 0, 3.4, 2.4, 2.8], [0.5, 1.2, 0, 4.4, 3.4, 3.3], [5, 0.3, 0, 3.2, 2.3, 2.7], [1.5, 0, 2, 3, 2, 2.2], [-2, 0, -1.6, 3, 2, 2.2]])
      for (let x = -9; x <= 9; x++) for (let y = -1; y <= 5; y++) for (let z = -5; z <= 5; z++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2 <= 1) put(x, y, z, y < 0 ? 'cloudBase' : 'cloud');
  }));
  const sunModel = () => model((put) => {
    for (let x = -4; x <= 4; x++) for (let y = -4; y <= 4; y++) { const d = Math.hypot(x, y); if (d <= 3.7) for (let z = 0; z < 2; z++) put(x, y, z, d <= 2.3 ? 'sunCore' : 'sun', { d }); }
    for (let k = 0; k < 8; k++) { const dx = Math.round(Math.cos(k * Math.PI / 4)), dy = Math.round(Math.sin(k * Math.PI / 4)), r0 = k % 2 ? 4 : 5; for (let j = 0; j < 3; j++) put(dx * (r0 + j), dy * (r0 + j), 0, 'ray', { ray: k, step: j, dx, dy }); }
  });

  // ---------------------------------------------------------------- the renderer (reusable: any models, any topic)
  // voxelKit(S) draws every cube of every model as one instanced mesh of small bevelled boxes.
  //   kit.add(cells, { at: [x, y, z], anim, window, glow, matrix })   place a model on the grid, returns the part
  //   kit.finish()                                                    build the mesh (call once, after the last add)
  //   kit.update(t)                                                   pose every cube for time t
  // `anim(v, t, o)` is called for every cube `v` with a pose `o` it may change: o.x o.y o.z (grid cells), o.s (size,
  // 0 hides it), o.sx o.sy o.sz (stretch), o.rx o.ry o.rz (tumble), o.to + o.mix (blend toward another colour),
  // o.glow (self-light). It must depend on t only. `window: [t0, t1]` says the part only moves between those times,
  // so outside them it is posed once and then left alone.
  function voxelKit(S, opt = {}) {
    const { THREE, scene } = S, size = opt.size || 0.25, shade = opt.shade == null ? 0.085 : opt.shade, parts = [];
    let mesh = null, count = 0;
    function add(cells, o = {}) {
      const at = o.at || [0, 0, 0];
      const voxels = cells.map((v) => {
        const p = { ...v, x: v.x + at[0], y: v.y + at[1], z: v.z + at[2], lx: v.x, ly: v.y, lz: v.z, h: K.hash(v.x + at[0], v.y + at[1] * 1.7, v.z + at[2] + 0.3), h2: K.hash(v.z + at[2] * 3.1, v.x + at[0], v.y + 9.2) };
        // the shade variation: each cube a touch lighter or darker than its neighbours, and a hair warmer or cooler
        p.color = new THREE.Color(PAL[v.c] || v.c).multiplyScalar(1 + (p.h - 0.5) * 2 * shade * (o.shade == null ? 1 : o.shade));
        p.color.r *= 1 + (p.h2 - 0.5) * 0.05; p.color.b *= 1 - (p.h2 - 0.5) * 0.05;
        return p;
      });
      const part = { voxels, anim: o.anim || null, window: o.window || null, glow: o.glow || 0, matrix: o.matrix || null, first: count, phase: null };
      count += voxels.length; parts.push(part);
      return part;
    }
    function finish() {
      // seg 1 gives each cube one narrow chamfer with rounded normals: 108 triangles, and the edge still catches the light
      const geo = K.roundedBox(size, size, size, size * (opt.bevel == null ? 0.1 : opt.bevel), 1);
      geo.setAttribute('aGlow', new THREE.InstancedBufferAttribute(new Float32Array(count), 1));
      const mat = new THREE.MeshStandardMaterial({ roughness: opt.roughness == null ? 0.6 : opt.roughness, metalness: 0 });
      mat.onBeforeCompile = (sh) => {   // per-cube glow: the cube's own colour, emitted
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aGlow; varying float vGlow;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlow = aGlow;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vGlow;').replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * vGlow;');
      };
      mesh = new THREE.InstancedMesh(geo, mat, count);
      mesh.setColorAt(0, new THREE.Color(1, 1, 1));
      mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
      scene.add(mesh);
      return mesh;
    }
    const M = new THREE.Matrix4(), P = new THREE.Vector3(), Q = new THREE.Quaternion(), E = new THREE.Euler(), SC = new THREE.Vector3(), o = {};
    function update(t) {
      const mat = mesh.instanceMatrix.array, col = mesh.instanceColor.array, glow = mesh.geometry.attributes.aGlow.array;
      let changed = false;
      for (const p of parts) {
        const phase = !p.anim ? 1 : !p.window ? 0 : t < p.window[0] ? -1 : t > p.window[1] ? 1 : 0;
        if (phase !== 0 && p.phase === phase) continue;        // resting: already posed
        p.phase = phase; changed = true;
        for (let k = 0; k < p.voxels.length; k++) {
          const v = p.voxels[k], i = p.first + k, j = i * 16;
          o.x = v.x; o.y = v.y; o.z = v.z; o.s = 1; o.sx = o.sy = o.sz = 1; o.rx = o.ry = o.rz = 0; o.mix = 0; o.to = null; o.glow = p.glow;
          if (p.anim) p.anim(v, t, o);
          if (o.s <= 0.002) { mat.fill(0, j, j + 16); mat[j + 15] = 1; continue; }
          if (o.rx || o.ry || o.rz || p.matrix) {
            M.compose(P.set(o.x * size, o.y * size, o.z * size), Q.setFromEuler(E.set(o.rx, o.ry, o.rz)), SC.set(o.s * o.sx, o.s * o.sy, o.s * o.sz));
            if (p.matrix) M.premultiply(p.matrix);
            M.toArray(mat, j);
          } else {
            mat.fill(0, j, j + 16); mat[j] = o.s * o.sx; mat[j + 5] = o.s * o.sy; mat[j + 10] = o.s * o.sz; mat[j + 12] = o.x * size; mat[j + 13] = o.y * size; mat[j + 14] = o.z * size; mat[j + 15] = 1;
          }
          const c = v.color, m = o.to ? o.mix : 0;
          col[i * 3] = m ? c.r + (o.to.r - c.r) * m : c.r; col[i * 3 + 1] = m ? c.g + (o.to.g - c.g) * m : c.g; col[i * 3 + 2] = m ? c.b + (o.to.b - c.b) * m : c.b;
          glow[i] = o.glow;
        }
      }
      if (changed) { mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; mesh.geometry.attributes.aGlow.needsUpdate = true; }
    }
    return { add, finish, update, size, parts };
  }

  // ---------------------------------------------------------------- voxel motion (small pure functions of time)
  // fall: how far a cube still is from home (1 = at the start of its drop, 0 = landed), with one small bounce after
  // it lands. pop: 0 -> 1 with overshoot, for things that grow or swell. knockOff: pushed off, dropping and
  // shrinking. Every build and break in the clip is one of these three with a different delay per cube.
  const fall = (u, d = 0.3) => (u <= 0 ? 1 : u < d ? 1 - (u / d) * (u / d) : 0.07 * Math.exp(-8 * (u - d)) * Math.abs(Math.sin((u - d) * 22)));
  const pop = (u, f = 3.2, damp = 0.42) => (u <= 0 ? 0 : K.spring(u, f, damp));
  function knockOff(v, u, o) {
    if (u <= 0) return;
    o.z += (6 + 5 * v.h2) * u; o.x += (v.h - 0.5) * 6 * u; o.y += 3 * v.h2 * u - 36 * u * u;
    o.rx = u * (5 + 9 * v.h); o.rz = u * 8 * (v.h2 - 0.5); o.s *= 1 - K.seg(u, 0.08, 0.24);
  }
  // the base builds itself outward from the front centre: one column of cubes after another drops in and bounces
  const dropIn = (v, t, o) => { const u = t - v.t0; if (u <= 0) { o.s = 0; return; } o.y += fall(u, 0.34) * 11; o.s = Math.min(1, u / 0.1); };
  const waveDelay = (v) => -1.72 + 0.039 * Math.hypot(v.x, v.z - BASE.hz) + v.y * 0.005 + v.h * 0.04;
  // A change of word crosses the face from left to right in SWEEP seconds: at every column the old cubes are knocked
  // off and, a moment later, the new ones fly in from the front and click on. v.x is the cube's column on the base.
  const SWEEP = 0.22, sweepDelay = (v) => K.clamp((v.x + 18) / 36) * SWEEP + v.h * 0.04;
  const wordAnim = (tin, tout) => (v, t, o) => {
    const u = t - tin - sweepDelay(v);
    if (u <= 0) { o.s = 0; return; }
    const k = fall(u, 0.19); o.z += k * 9; o.y += k * 2; o.s = Math.min(1, u / 0.08);
    knockOff(v, t - tout - sweepDelay(v), o);
  };
  // the plant leans very slightly in the wind, more the higher up a cube is
  const sway = (y, t) => 0.0065 * Math.pow(Math.max(0, y), 1.3) * (Math.sin(t * 2.3) + 0.5 * Math.sin(t * 3.7 + 1));

  registerStyle({
    id: 'voxel',
    name: 'Voxel',
    family: 'Filters over 3D',
    look: 'Everything is built from small cubes, like a hand-made voxel model on a display base: a short palette with every cube a shade apart from its neighbours, tiny bevels that catch the light, and the label spelled in cubes on the front of the base.',
    motion: 'The cubes do the animating: things drop in column by column, grow layer by layer, swell, pop and get knocked off, each with a small bounce on arrival. Nothing slides or fades.',
    light: 'One soft warm sun from the front left and an open sky that really gets blocked in corners and under things, so every cube sits in its own little shadow.',
    materials: 'Matte painted cubes with a narrow chamfer, a smooth off-white plinth under the model and a plain coloured tabletop, so the cubes are the only texture.',
    camera: 'A long lens looking down from about 26 degrees with a wide aperture: the model is sharp, the table in front and behind falls soft, and it reads as a miniature. One slow arc and pull-back that keeps pace with what is being built.',
    post: 'Neutral tone mapping to keep the palette true, a little bloom on the cubes that glow, light vignette, almost no grain.',
    explains: 'Anything that can be shown as a small model that builds up in stages: how something grows, is made or is put together. One base, one subject in the middle, one voxel word per stage, weather or helpers as small cube events around it.',
    topic: 'How a tomato plant grows: seed, sprout, plant, fruit',
    duration: 8,
    fonts: [],
    render: { samples: 56, shutter: 0.5, tone: 'neutral', exposure: 1.0, bloom: 0.28, bloomThreshold: 1.0, vignette: 0.2, grain: 0.012, saturation: 1.06, fov: 16, background: PAL.floor },

    build(S) {
      const { THREE, K, scene, camera } = S;
      const kit = voxelKit(S, { size: 0.25 }), V = kit.size;
      // every cube of the set gets its own start time in the opening wave (`extra` seconds later for things that sit on the ground)
      const stamp = (part, extra = 0) => { part.voxels.forEach((v) => { v.t0 = waveDelay(v) + extra; }); return part; };

      // ---- the set: base, bed, garden things (they all arrive with the opening wave)
      const OPEN = [-2, 1.5];
      stamp(kit.add(baseModel(), { anim: dropIn, window: OPEN }));
      stamp(kit.add(bedFrame(), { at: [0, GROUND, 0], anim: dropIn, window: OPEN }), 0.1);
      const wet = new THREE.Color(PAL.wet);
      stamp(kit.add(bedSoil(), { at: [0, GROUND, 0], anim: (v, t, o) => {
        dropIn(v, t, o);
        // rain darkens the soil where the drops land, and it dries again slowly
        o.to = wet; o.mix = 0.75 * K.seg(t, T.rain[0] + 0.1 + v.h * 0.5, T.rain[0] + 0.7 + v.h * 0.5) * (1 - 0.55 * K.seg(t, T.sun + 0.3, T.done));
      } }));
      stamp(kit.add(fence(), { at: [0, GROUND, -BASE.hz + 1], anim: dropIn, window: OPEN }), 0.4);
      stamp(kit.add(scatter(), { at: [0, GROUND, 0], anim: dropIn, window: OPEN }), 0.62);
      stamp(kit.add(WATERING_CAN, { at: [-21, GROUND, 2], anim: dropIn, window: OPEN }), 0.3);
      stamp(kit.add(SEED_PACKET, { at: [12, GROUND, 0], anim: dropIn, window: OPEN }), 0.1);
      stamp(kit.add(TROWEL, { at: [17, GROUND - 2, 1], anim: dropIn, window: OPEN }), 0.15);

      // ---- the stage words on the front face
      STAGES.forEach((s, i) => {
        const tout = i + 1 < STAGES.length ? STAGES[i + 1].at - 0.1 : 99;
        kit.add(text(s.word, 'letter', 2), { at: [-Math.floor(textWidth(s.word) / 2), 1, BASE.hz + 1], shade: 0.35, anim: wordAnim(s.at, tout), window: [s.at - 0.1, tout + 0.7] });
      });

      // ---- seed: tossed from the packet into the hole, then a cube of soil closes over it
      const px = SPOT[0], pz = SPOT[1];
      kit.add([{ x: 0, y: 0, z: 0, c: 'seed' }], { shade: 0, glow: 0.08, anim: (v, t, o) => {
        const u = K.clamp((t + 0.42) / (T.seedLand + 0.42)), b = t - T.seedLand;
        o.x = K.lerp(13.5, px, u); o.z = K.lerp(0.5, pz, u); o.y = K.lerp(GROUND + 5, GROUND, u) + 30 * u * (1 - u);
        if (b > 0) o.y += 0.5 * Math.exp(-9 * b) * Math.abs(Math.sin(b * 20));
        o.rx = u * 9; o.rz = u * 7; o.s = K.lerp(1.4, 0.8, K.seg(u, 0.75, 1)) * (1 - K.seg(t, T.cover + 0.05, T.cover + 0.2)); o.sx = 1.35; o.sz = 0.75;   // a flat pale pip, drawn large so it reads
      } });
      kit.add([{ x: px, y: GROUND, z: pz, c: 'bed' }], { anim: (v, t, o) => { const g = pop(t - T.cover - 0.05, 3.4, 0.38); o.s = g; o.y -= 1 - Math.min(1, g); } });
      // the dug-out earth waits in a ring around the hole and tumbles back in once the seed is down
      const ring = model((put) => { for (let x = -1; x <= 1; x++) for (let z = -1; z <= 1; z++) if (x || z) put(x, 0, z, (x + z) % 2 ? 'soilA' : 'soilB'); });
      stamp(kit.add(ring, { at: [px, GROUND + 1, pz], anim: (v, t, o) => {
        dropIn(v, t, o);
        const u = K.seg(t, T.cover + v.h * 0.1, T.cover + 0.22 + v.h * 0.1); if (u <= 0) return;
        o.x -= v.lx * u * 0.9; o.z -= v.lz * u * 0.9; o.y += 1.4 * Math.sin(u * Math.PI) - u; o.s = 1 - u * u; o.rx = u * 2 * v.lz; o.rz = -u * 2 * v.lx;
      } }));
      // crumbs of soil jump when the seed lands
      kit.add(Array.from({ length: 7 }, (_, i) => ({ x: px, y: GROUND + 1, z: pz, c: i % 2 ? 'bed' : 'soilA', i })), { anim: (v, t, o) => {
        const u = t - T.seedLand; if (u <= 0 || u > 0.6) { o.s = 0; return; }
        const a = v.i * 0.9 + 0.4; o.x += Math.cos(a) * 5 * u; o.z += Math.sin(a) * 5 * u; o.y += 9 * u - 26 * u * u; o.s = 0.42 * (1 - K.seg(u, 0.3, 0.55)); o.rx = u * 9; o.rz = u * 6;
      } });

      // ---- cloud and rain
      const storm = new THREE.Color(PAL.storm), cloudY = GROUND + 10;
      const cloudX = K.track([[T.cloudIn, -46], [T.cloudIn + 0.85, -2, 'out'], [T.cloudOut, -2], [T.cloudOut + 1.0, -19, 'inOut']]);
      const cloudLift = K.track([[T.cloudIn, 7], [T.cloudIn + 0.85, 0, 'out'], [T.cloudOut, 0], [T.cloudOut + 1.6, 5.5, 'inOut']]);   // down from the top left, later up and away
      const raining = (t) => K.seg(t, T.rain[0] - 0.35, T.rain[0]) * (1 - K.seg(t, T.rain[1], T.rain[1] + 0.5));
      kit.add(cloudModel(), { at: [0, cloudY, -3], shade: 0.4, anim: (v, t, o) => {
        o.x += cloudX(t); o.y += cloudLift(t) + 0.35 * Math.sin(t * 1.9) + 0.25 * raining(t) * Math.sin(t * 26 + v.lx);   // it shivers a little while it rains
        o.to = storm; o.mix = raining(t) * (v.ly < 1 ? 0.75 : 0.35);
      } });
      const DROPS = 80, rr = K.rng(4), drops = Array.from({ length: DROPS }, (_, i) => ({ x: 0, y: 0, z: 0, c: 'rain', t0: T.rain[0] + (i + rr()) / DROPS * (T.rain[1] - T.rain[0] - 0.3), dx: rr.range(-7, 7), dz: rr.range(-6, 2) }));
      kit.add(drops, { shade: 0.5, glow: 0.12, window: [T.rain[0] - 0.1, T.rain[1] + 0.3], anim: (v, t, o) => {
        const u = (t - v.t0) / 0.3; if (u <= 0 || u > 1.45) { o.s = 0; return; }
        o.x = v.dx - 1; o.z = v.dz - 2;
        if (u < 1) { o.y = K.lerp(cloudY - 1, GROUND + 0.8, u * u * 0.6 + u * 0.4); o.sx = o.sz = 0.6; o.sy = 1.7; }
        else { const k = (u - 1) / 0.45; o.y = GROUND + 0.55; o.sx = o.sz = 0.6 + 1.3 * k; o.sy = 0.16; o.s = 1 - k; }   // a flat splash
      } });

      // ---- sprout
      const sproutOut = T.grow + 0.25;
      kit.add(SPROUT, { at: [px - 3, GROUND + 1, pz], anim: (v, t, o) => {
        const g = pop(t - T.sprout - v.ly * 0.085, 3.0, 0.4); o.s = g; o.y -= (1 - Math.min(1, g)) * 1.2;
        if (v.c === 'sprout') o.s *= 1 - K.seg(t, sproutOut, sproutOut + 0.2);            // the seed leaves go when the real ones come
        o.x += sway(v.ly, t);
      } });

      // ---- sun: pops open from its centre, then its rays take turns stepping out
      const sunAt = [20, GROUND + 10, -6], sunM = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-0.42, -0.1, 0)).setPosition(sunAt[0] * V, sunAt[1] * V, sunAt[2] * V);
      const sunRise = K.track([[T.sun + 0.3, 0], [T.grow + T.growDur + 0.3, 6, 'inOut']]);   // it climbs while the plant does
      kit.add(sunModel(), { matrix: sunM, shade: 0.4, anim: (v, t, o) => {
        o.y += sunRise(t);
        if (v.ray == null) { o.s = pop(t - T.sun - v.d * 0.035, 2.8, 0.36); o.glow = 0.5 + 0.08 * Math.sin(t * 3); return; }
        const beat = Math.floor((t - T.sun - 0.35) / 0.5), into = (t - T.sun - 0.35) - beat * 0.5;
        if (beat < 0) { o.s = 0; return; }
        const long = (beat + v.ray) % 2 === 0, was = (beat - 1 + v.ray) % 2 === 0 && beat > 0, k = K.seg(into, 0, 0.14, K.ease.outBack);
        const len = (was ? 3 : 1) + ((long ? 3 : 1) - (was ? 3 : 1)) * k;                 // how many cubes of this ray are out
        o.s = K.clamp(len - v.step); o.glow = 0.45;
      } });

      // ---- stake, plant, flowers, fruit
      kit.add(model((put) => { for (let y = 0; y < 19; y++) put(0, y, 0, y % 5 === 4 ? 'woodDark' : 'woodB'); }), { at: [px, GROUND + 1, pz - 1], window: [T.stake - 0.1, T.stake + 1], anim: (v, t, o) => {
        const u = t - T.stake; if (u <= 0) { o.s = 0; return; } o.y += fall(u, 0.3) * 18;
      } });
      kit.add(plantModel(), { at: [px, GROUND + 1, pz], anim: (v, t, o) => {
        const u = t - T.grow - v.born, g = pop(u, v.leaf ? 2.8 : 3.4, v.leaf ? 0.36 : 0.5);
        o.s = g; o.y -= (1 - Math.min(1, g)) * (v.leaf ? 0.6 : 1); o.x += sway(v.ly, t);
        if (v.leaf && u > 0 && u < 0.5) o.rz = (1 - K.seg(u, 0, 0.5, K.ease.out)) * (v.lx < 0 ? 0.9 : -0.9);   // leaves unfold
      } });
      kit.add(flowerModel(), { at: [px, GROUND + 1, pz], shade: 0.3, glow: 0.15, window: [T.flower - 0.1, T.fruit + 1.2], anim: (v, t, o) => {
        o.s = pop(t - T.flower - v.g * 0.08 - (v.c === 'petal' ? 0.05 : 0), 3.6, 0.35) * (1 - K.seg(t, T.fruit + v.g * 0.07 - 0.05, T.fruit + v.g * 0.07 + 0.1)); o.x += sway(v.ly, t);
      } });
      const unripe = new THREE.Color(PAL.unripe), turning = new THREE.Color(PAL.turning), tmp = new THREE.Color();
      kit.add(fruitModel(), { at: [px, GROUND + 1, pz], shade: 0.6, anim: (v, t, o) => {
        // each tomato swells from its stalk, green, then turns through orange to red, the lowest truss first
        const g = pop(t - T.fruit - v.g * 0.07, 2.5, 0.36); o.s = g; if (g <= 0) return;
        o.x += (v.cx - v.lx) * (1 - g) + sway(v.ly, t); o.y += (v.cy - v.ly) * (1 - g); o.z += (v.cz - v.lz) * (1 - g);
        if (v.c !== 'tomato') return;
        const r = K.seg(t, T.ripe + v.g * 0.05, T.ripe + v.g * 0.05 + 0.5) * (v.g === FRUITS.length - 1 ? 0.7 : 1);   // the top one is not quite there yet
        o.to = tmp.copy(unripe).lerp(turning, K.seg(r, 0, 0.55)); o.mix = 1 - K.seg(r, 0.4, 1); o.glow = 0.06 * r;
      } });
      kit.finish();

      // ---- the table and the plinth: smooth, plain, so the cubes are the only texture in the frame
      const floorTex = K.canvasTex(512, 512, (ctx, w, h) => { const g = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.5); g.addColorStop(0, '#ffffff'); g.addColorStop(0.22, '#f2f7fa'); g.addColorStop(0.6, '#c3d6e3'); g.addColorStop(1, '#a9c2d4'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); });
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshStandardMaterial({ color: PAL.floor, map: floorTex, roughness: 0.9 }));
      const plinthH = 0.5, baseY = -0.5 * V;
      floor.rotation.x = -Math.PI / 2; floor.position.y = baseY - plinthH; floor.receiveShadow = true; scene.add(floor);
      const plinth = new THREE.Mesh(K.roundedBox((BASE.hx * 2 + 11) * V, plinthH, (BASE.hz * 2 + 12) * V, 0.16, 6), new THREE.MeshStandardMaterial({ color: PAL.plinth, roughness: 0.45 }));
      plinth.position.set(0, baseY - plinthH / 2, 0.5 * V); plinth.castShadow = true; plinth.receiveShadow = true; scene.add(plinth);

      // ---- light: a soft warm sun from the front left, and a sky that is really occluded (that is what seats the cubes)
      K.env(S, { top: '#bcd9f0', horizon: '#eef3f6', bottom: '#b9c4b4', intensity: 0.32 });
      const sun = K.sun(S, { pos: [-8, 13, 9], target: [0, 1.5, 0], color: '#fff0d6', power: 2.9, size: 13, soft: 0.5, mapSize: 4096 });
      K.skyLight(S, { color: '#d6e4ff', power: 1.25, size: 12, center: [0, 2, 0], mapSize: 2048 });
      const warm = new THREE.PointLight('#ffb44a', 0, 0, 2); warm.position.set(sunAt[0] * V - 0.4, sunAt[1] * V, sunAt[2] * V + 0.8); scene.add(warm);   // the voxel sun lights what is near it
      const sunPower = K.track([[T.cloudIn + 0.3, 2.9], [T.rain[0], 2.4, 'inOut'], [T.cloudOut, 2.4], [T.sun + 0.6, 3.3, 'inOut']]);

      // ---- camera: one move. It starts close on the bed and the word, and backs away and up at the speed the plant grows.
      const rad = Math.PI / 180;
      const shot = K.path([   // [yaw, pitch, frame height in cells, target x, y, z]
        [0, [-13, 27, 28.5, 0, 7.4, 2]],
        [2.6, [-6, 26.5, 35.5, -0.5, 10.5, 1]],
        [5.3, [3.5, 25, 45.2, 0, 15.7, 0]],
        [8, [9, 25, 46.2, 0, 15.9, 0]],
      ]);
      const subjectY = K.track([[T.sprout, GROUND + 1], [T.grow, GROUND + 3, 'inOut'], [T.grow + T.growDur, GROUND + 14, 'inOut']]);
      const aperture = K.track([[0, 0.34], [3, 0.42], [6, 0.6]]);

      return {
        update(t) {
          kit.update(t);
          sun.intensity = sunPower(t);
          warm.intensity = 14 * K.seg(t, T.sun, T.sun + 0.5, K.ease.out); warm.position.y = (sunAt[1] + sunRise(t)) * V;
          const [yaw, pitch, frameH, tx, ty, tz] = shot(t), dist = frameH * V / (2 * Math.tan(camera.fov / 2 * rad));
          const dir = [Math.sin(yaw * rad) * Math.cos(pitch * rad), Math.sin(pitch * rad), Math.cos(yaw * rad) * Math.cos(pitch * rad)];
          const pos = [tx * V + dir[0] * dist, ty * V + dir[1] * dist, tz * V + dir[2] * dist];
          K.look(camera, pos, [tx * V, ty * V, tz * V]);
          // focus: the plane that passes half-way between the word on the front face and the thing growing in the bed
          const depth = (p) => (pos[0] - p[0] * V) * dir[0] + (pos[1] - p[1] * V) * dir[1] + (pos[2] - p[2] * V) * dir[2];
          K.focus(camera, (depth([0, 4, BASE.hz + 2]) + depth([px, subjectY(t), pz])) / 2, aperture(t));
        },
      };
    },

    sound(k) {
      const K = globalThis.K, r = K.rng(8);
      k.bed('room', 0, 8, { gain: 0.7 });
      k.music('pad', 0, 8, { bpm: 120, gain: 0.75, chords: [['C4', 'G4', 'E5'], ['F4', 'A4', 'C5'], ['G4', 'B4', 'D5'], ['C4', 'E4', 'G4', 'C5']] });
      // the base rattling together, thinning out as the last columns land
      k.withMinor(() => { for (let t = 0.02; t < 0.95; t += 0.04 + r() * 0.03) k.play('tock', t, { gain: 0.42 * (1 - t / 1.1), f: 420 + r() * 500, pan: r.range(-0.7, 0.7) }); });
      k.play('tock', T.seedLand, { gain: 0.9, f: 760 }); k.play('pop', T.cover, { gain: 0.8, f: 330 });
      k.play('whoosh', T.cloudIn, { gain: 0.45, dur: 0.85, top: 1500 });
      k.bed('rain', T.rain[0] - 0.1, T.rain[1] + 0.35, { gain: 2.4 });
      k.withMinor(() => { for (let i = 0; i < 26; i++) k.play('tick', T.rain[0] + 0.3 + (i + r()) / 26 * (T.rain[1] - T.rain[0]), { gain: 0.35, f: 2600 + r() * 2200, pan: r.range(-0.4, 0.4) }); });
      // every new word: the old one is knocked off, the new one clicks on letter by letter
      STAGES.slice(1).forEach((s) => {
        k.play('swish', s.at - 0.1, { gain: 0.6 });
        [...s.word].forEach((_, i) => k.play('tock', s.at + 0.19 + (i + 0.5) / s.word.length * SWEEP, { gain: 0.6, f: 980 + i * 60, pan: (i - s.word.length / 2) * 0.12 }));
      });
      [0, 1, 2, 3].forEach((i) => k.play('pop', T.sprout + i * 0.085, { gain: 0.6, f: 520 + i * 130 }));
      k.play('ding', T.sun + 0.05, { gain: 0.55, f: 'E6' }); k.play('sparkle', T.sun + 0.35, { gain: 0.6, n: 5 });
      k.play('tock', T.stake + 0.3, { gain: 0.8, f: 300 });
      const scale = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6', 'G6', 'A6', 'C7'];
      k.withMinor(() => scale.forEach((n, i) => k.play('pop', T.grow + 0.12 + i * T.growDur / scale.length, { gain: 0.5, f: globalThis.SOUND.hz(n), pan: i % 2 ? 0.2 : -0.2 })));
      FRUITS.forEach((_, g) => {
        k.play('blip', T.flower + g * 0.08, { gain: 0.5, f: ['E6', 'G6', 'A6', 'C7', 'D7', 'E7', 'G7', 'A7'][g], type: 'sine' });
        k.play('pop', T.fruit + g * 0.07 + 0.05, { gain: 0.75, f: 300 - g * 14 });
      });
      k.play('success', T.ripe + 0.55, { gain: 0.5, f: 'C6' });
      k.play('ding', T.done - 0.1, { gain: 0.4, f: 'G6' });
    },
  });
}
```
