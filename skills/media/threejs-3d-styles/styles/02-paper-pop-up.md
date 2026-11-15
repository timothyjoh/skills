# Paper Pop-Up (#02)

- **id:** `paper-pop-up`
- **Category:** Material worlds
- **Use:** story
- **Reference duration:** 9 s
- **Google Fonts:** Fraunces
- **Libraries to inline (after three.js, in this order):** `lib/stage.js`, `lib/sound.js`

## Style card

- **Look:** A pop-up book open on a wooden table in lamplight. Every scene is built from flat die-cut card: printed in a few flat colours, creased down the middle, standing in layers on real fold mechanisms, with a pale core showing on every cut edge.
- **Motion:** Only the pages move. As a page turns, the scene on the old spread is pressed flat under it and the next one is pulled up out of the gutter by its own folds, layer after layer; pieces on paper arms tremble when the page lands. A pull tab slides out to change one thing on the last spread.
- **Light:** One warm desk lamp from the upper left with soft-edged shadows, so each layer throws a shadow on the one behind and the two wings of every fold take different light; a faint cool rim from behind; the table falls off into the dark.
- **Materials:** Thick uncoated card with visible fibre and a slight cockle, flat matt ink with a little grain, bare cream card on cut edges and as a thin margin around each shape, cloth-covered boards, dark oiled wood.
- **Camera:** A long lens looking down the gutter from about twenty-five degrees up, close enough that the spread fills the frame. One slow drift from left to right that breathes out a little for each page turn and ends in a gentle push; shallow focus on the middle layers.
- **Finish:** Real depth of field, motion blur and area-light shadows from the accumulation renderer; neutral tone mapping so the inks stay true, a soft vignette, very fine grain.
- **Good for:** A story or a process in a few steps: one spread per step, each with one big subject in the middle, supporting pieces at the sides and one short line of words on a paper ribbon. A pull tab can show a change on the spot (fill, reveal, move).

## Reference

- **Sample topic:** From flower to honey jar: a bee on flowers, the hive, the jar on the breakfast table
- **Gallery description:** A pop-up book open on a wooden table in lamplight. Every scene is built from flat die-cut card: printed in a few flat colours, creased down the middle, standing in layers on real fold mechanisms, with a pale core showing on every cut edge.
- **Shown in the sample clip:** From flower to honey jar: a bee on flowers, the hive, the jar on the breakfast table

The reference shows the look, not the story: don't reuse its objects, layout or beats unless the new content calls for them.

## Reference style source (`styles/paper-pop-up.js`)

```js
{
  // ---------------------------------------------------------------- content (change this block for a new story)
  // A pop-up book is a list of spreads. Each spread has a printed floor (both pages, seen from above), a few words on
  // a paper ribbon, and paper pieces that stand on real fold mechanisms:
  //   fold 'v'      a V-fold: one card creased down the middle, glued across the gutter. It lies flat in the closed
  //                 book and is pulled upright as the pages open. z = where its crease meets the gutter (+ is toward
  //                 the reader), alpha = angle between gutter and glue line (58 = a clear V, 76 = almost a flat wall).
  //   fold 'box'    a box fold: a cut-out standing `depth` in front of one wing of a V-fold, held by a paper strap
  //                 at height `strap` (a parallelogram, so it folds flat with its wing). span = where along the wing.
  //   fold 'float'  a piece glued to a wing on a small paper tab, floating `gap` in front of it; it can reach past
  //                 the wing's outline (the bee on its arm), and `sway` lets it tremble when the page lands.
  //   slide         (on a 'v') the card comes up through a slit in the page, driven by the pull tab.
  // Every piece is drawn flat in world units, y up, x = 0 on the crease, y = 0 on the page. Draw the picture only:
  // the die-cutter follows whatever you draw and leaves a thin margin of bare card around it. Everything you draw in
  // one piece must be connected (paper cannot float) and must fit inside the closed book (the build reports any piece
  // that does not, as a console error).
  const C = { card: '#f5ecd9', cream: '#fbf3df', navy: '#22364e', coral: '#e2604a', pink: '#f3ab99', yellow: '#f5bd35', honey: '#eba020', amber: '#cf7d22', leaf: '#74a25e', sage: '#a6c787', deep: '#2f6753', sky: '#cfe5df' };
  const PAGE_W = 5.6, PAGE_D = 6.4;                   // one page, world units (the open spread is 11.2 wide)
  const TURN = 1.25, TURNS = [-1.03, 2.2, 4.85];       // seconds a page takes to turn, and when each turn starts (the first is under way on frame one)
  const PULL = [6.7, 7.7];                            // the pull tab slides out, and the jar fills
  const pulled = (t) => K.seg(t, PULL[0], PULL[1], K.ease.inOut);

  // small printed motifs, shared by the spreads
  const flower = (a, x, y, r, n, col, mid) => { for (let k = 0; k < n; k++) { const q = (k + 0.25) / n * 6.2832; a.disc(col, x + Math.cos(q) * r * 0.58, y + Math.sin(q) * r * 0.58, r * 0.45, r * 0.25, q); } a.disc(mid, x, y, r * 0.36); for (let k = 0; k < 5; k++) a.disc(C.navy, x + Math.cos(k * 1.9) * r * 0.16, y + Math.sin(k * 1.9) * r * 0.16, r * 0.035); };
  const stem = (a, x0, y0, x1, y1, bend = 0, w = 0.1) => a.line(C.deep, w, (c) => { c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + bend, (y0 + y1) / 2, x1, y1); });
  const leaf = (a, x, y, len, q, col = C.leaf) => a.path(col, (c) => { const ex = x + Math.cos(q) * len, ey = y + Math.sin(q) * len; c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(q + 0.7) * len * 0.62, y + Math.sin(q + 0.7) * len * 0.62, ex, ey); c.quadraticCurveTo(x + Math.cos(q - 0.7) * len * 0.62, y + Math.sin(q - 0.7) * len * 0.62, x, y); });
  const grass = (a, x0, x1, h, col, seed) => a.path(col, (c) => { const r = K.rng(seed); c.moveTo(x0, -0.1); for (let x = x0; x < x1 - 0.05;) { const w = r.range(0.13, 0.24); c.lineTo(x + w * r.range(0.2, 0.8), h * r.range(0.75, 1.5)); x += w; c.lineTo(Math.min(x, x1), h * 0.5); } c.lineTo(x1, -0.1); });
  const hex = (a, col, x, y, r) => a.path(col, (c) => { for (let k = 0; k < 6; k++) c.lineTo(x + r * Math.cos(k * 1.0472), y + r * Math.sin(k * 1.0472)); });
  const bee = (a, x, y, s, face = 1, tilt = 0) => {
    const c = a.ctx; c.save(); c.translate(x, y); c.scale(s * face, s); c.rotate(tilt);
    a.disc('#b9d9d3', -0.3, 0.36, 0.27, 0.16, 0.95); a.disc(C.sky, -0.02, 0.42, 0.31, 0.19, 0.55);                       // wings
    a.path(C.navy, (p) => { p.moveTo(-0.44, 0.1); p.lineTo(-0.7, 0); p.lineTo(-0.44, -0.1); });                                // sting
    a.disc(C.yellow, 0, 0, 0.5, 0.34);
    a.clip((p) => p.ellipse(0, 0, 0.5, 0.34, 0, 0, 7), () => { a.box(C.navy, -0.33, -0.4, 0.15, 0.8); a.box(C.navy, -0.05, -0.4, 0.15, 0.8); });
    a.disc(C.navy, 0.44, 0.03, 0.21); a.disc(C.cream, 0.5, 0.09, 0.06);
    a.line(C.navy, 0.04, (p) => { p.moveTo(0.52, 0.2); p.quadraticCurveTo(0.62, 0.42, 0.8, 0.4); });
    c.restore();
  };
  // the paper arm a floating piece sits on, printed as a dotted flight path
  const arm = (a, pts) => { a.line(C.cream, 0.13, (c) => { c.moveTo(pts[0], pts[1]); c.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]); }); a.line(C.navy, 0.045, (c) => { c.moveTo(pts[0], pts[1]); c.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]); }, [0.1, 0.12]); };
  // a clump of flowers on a grass foot: [x, height, radius, petals, colour, heart]
  const clump = (a, x0, x1, seed, list) => { grass(a, x0, x1, 0.3, C.deep, seed); list.forEach(([x, h, r, n, col, mid], i) => { stem(a, x, 0.1, x, h, i % 2 ? 0.12 : -0.12); leaf(a, x, h * 0.3, 0.5, i % 2 ? 0.5 : 2.6); leaf(a, x, h * 0.48, 0.42, i % 2 ? 2.5 : 0.6, C.sage); flower(a, x, h, r, n, col, mid); }); };
  const stepNo = (a, n) => { a.disc(C.coral, -3.5, -2.45, 0.46); a.disc(C.cream, -3.5, -2.45, 0.37); a.text(String(n), -3.5, -2.68, 0.66, C.navy); };   // printed on the floor in front of the ribbon

  const SPREADS = [
    { // ------------------------------------------------------------ 1. a bee on flowers
      words: ['A bee sips', 'nectar.'],
      floor(a) {
        a.box('#dcebc1', -5.42, -3.02, 10.84, 6.04, 0.45);
        a.disc('#cbe0aa', -3.1, 0.7, 2.3, 1.3, 0.2); a.disc('#cbe0aa', 3.1, -0.7, 2.3, 1.1, -0.15); a.disc('#cbe0aa', 0.4, 2.3, 2.6, 0.6);
        const r = K.rng(4); for (let i = 0; i < 44; i++) { const x = r.range(-5, 5), y = r.range(-2.7, 2.7), k = r.pick([C.cream, C.yellow, C.pink]); for (let q = 0; q < 5; q++) a.disc(k, x + 0.075 * Math.cos(q * 1.257), y + 0.075 * Math.sin(q * 1.257), 0.055); a.disc(C.amber, x, y, 0.035); }
        a.line(C.navy, 0.05, (c) => { c.moveTo(-5, -2.2); c.bezierCurveTo(-3.2, -1.2, -4.4, 0.4, -2.6, 0.1); c.bezierCurveTo(-1.2, -0.1, -1.6, -1.6, 0.4, -1.5); c.bezierCurveTo(2.6, -1.4, 2.2, 0.2, 4.9, -0.4); }, [0.14, 0.17]);
        stepNo(a, 1);
      },
      parts: [
        { id: 'hills', fold: 'v', z: -1.0, alpha: 76, size: [9.8, 3.2], art(a) {
          const far = (x) => 1.3 + 0.42 * Math.cos((x + 1.4) * 0.62), near = (x) => 0.72 + 0.26 * Math.cos((x - 2.2) * 0.7);
          a.disc(C.yellow, 2.0, 1.7, 1.2); a.disc('#f9d46c', 2.0, 1.7, 0.84);                                              // the sun, half behind the hill
          [[-3.6, 0.86], [-2.9, 0.62], [-4.2, 0.5]].forEach(([x, s]) => { a.box(C.navy, x - 0.04, far(x) - 0.1, 0.08, 0.5); a.disc(C.deep, x, far(x) + 0.2 + 0.8 * s, 0.14 + 0.24 * s, 0.8 * s); });
          a.ridge(C.sage, -4.9, 4.9, far); a.ridge(C.leaf, -4.9, 4.9, near);
          const r = K.rng(9); for (let i = 0; i < 26; i++) { const x = r.range(-4.6, 4.6); a.disc(r.pick([C.cream, C.yellow, C.pink]), x, r.range(0.1, near(x) - 0.12), 0.06); }
        } },
        { fold: 'box', on: 'hills', span: [-4.6, -2.4], depth: 1.35, strap: 0.75, height: 2.1, art(a) { clump(a, -4.55, -2.45, 3, [[-4.05, 1.25, 0.42, 6, C.yellow, C.amber], [-3.3, 1.75, 0.5, 7, C.pink, C.yellow], [-2.75, 0.95, 0.36, 6, C.cream, C.yellow]]); } },
        { fold: 'box', on: 'hills', span: [2.5, 4.6], depth: 1.2, strap: 0.7, height: 1.9, art(a) { clump(a, 2.55, 4.55, 5, [[3.0, 1.0, 0.38, 6, C.cream, C.yellow], [3.65, 1.55, 0.46, 8, C.yellow, C.amber], [4.2, 0.9, 0.34, 6, C.pink, C.yellow]]); } },
        { id: 'flowers', fold: 'v', z: 0.7, alpha: 58, size: [4.8, 2.95], art(a) {
          grass(a, -2.25, 2.25, 0.34, C.deep, 7);
          stem(a, -1.0, 0.2, -1.2, 2.0, -0.2, 0.12); stem(a, 1.05, 0.2, 1.3, 1.4, 0.16, 0.12); stem(a, 0.1, 0.2, 0.22, 0.95, 0.1, 0.1);
          leaf(a, -1.07, 0.6, 0.85, 2.55); leaf(a, -1.13, 1.05, 0.7, 0.5, C.sage); leaf(a, 1.1, 0.55, 0.75, 0.45); leaf(a, 1.17, 0.8, 0.6, 2.6, C.sage); leaf(a, 0.13, 0.4, 0.55, 2.5, C.sage);
          flower(a, -1.2, 2.05, 0.82, 9, C.coral, C.yellow); flower(a, 1.3, 1.45, 0.66, 8, C.cream, C.yellow); flower(a, 0.22, 0.98, 0.36, 6, C.pink, C.yellow);
        } },
        { fold: 'float', on: 'flowers', side: 1, at: [1.3, 1.45], gap: 0.3, sway: 1, area: [-0.4, 1.3, 1.9, 3.25], art(a) { arm(a, [1.3, 1.45, 1.8, 2.05, 1.2, 2.22]); bee(a, 0.6, 2.25, 1.28, -1, -0.2); } },
      ],
    },
    { // ------------------------------------------------------------ 2. the hive
      words: ['The hive', 'thickens it.'],
      floor(a) {
        a.box('#f7e3a4', -5.42, -3.02, 10.84, 6.04, 0.45);
        a.clip((c) => c.roundRect(-5.42, -3.02, 10.84, 6.04, 0.45), () => { for (let i = -11; i <= 11; i++) for (let j = -5; j <= 5; j++) a.line('#fbefc8', 0.06, (c) => { const x = i * 0.9, y = (j + (i & 1 ? 0.5 : 0)) * 1.039; for (let k = 0; k <= 6; k++) c.lineTo(x + 0.6 * Math.cos(k * 1.0472), y + 0.6 * Math.sin(k * 1.0472)); }); });
        stepNo(a, 2);
      },
      parts: [
        { id: 'comb', fold: 'v', z: -1.0, alpha: 76, size: [9.6, 3.2], art(a) {
          const r = 0.37, top = (x) => 3.1 - 0.075 * x * x;
          a.box(C.amber, -4.7, -0.1, 9.4, 0.45, 0.05);
          for (let i = -9; i <= 9; i++) for (let j = 0; j < 7; j++) {
            const x = i * 1.5 * r, y = 0.34 + (j + (i & 1 ? 0.5 : 0)) * 1.732 * r, k = K.hash(i, j);
            if (y + r > top(x)) continue;
            hex(a, C.amber, x, y, r * 1.04); hex(a, k < 0.45 ? C.honey : k < 0.82 ? C.yellow : C.cream, x, y, r * 0.8);
          }
        } },
        { fold: 'box', on: 'comb', span: [-4.6, -2.5], depth: 1.35, strap: 0.75, height: 2.2, art(a) { clump(a, -4.55, -2.55, 13, [[-3.95, 1.75, 0.56, 11, C.yellow, C.amber], [-3.05, 1.05, 0.4, 7, C.cream, C.yellow]]); } },
        { fold: 'box', on: 'comb', span: [2.5, 4.6], depth: 1.2, strap: 0.7, height: 1.9, art(a) { clump(a, 2.55, 4.55, 15, [[3.1, 0.95, 0.38, 6, C.pink, C.yellow], [3.85, 1.5, 0.48, 9, C.coral, C.yellow]]); } },
        { id: 'skep', fold: 'v', z: 0.7, alpha: 58, size: [3.6, 2.85], art(a) {
          a.box(C.coral, -1.65, -0.1, 3.3, 0.36, 0.06); a.box(C.navy, -1.65, 0.2, 3.3, 0.06);                                // the bench it stands on
          for (let k = 0; k < 7; k++) { const w = 1.34 * Math.sqrt(1 - Math.pow(k / 7.7, 2.2)), y = 0.24 + k * 0.315; a.box(k % 2 ? C.yellow : C.honey, -w, y, 2 * w, 0.37, 0.17); for (let x = -w + 0.16; x < w - 0.1; x += 0.3) a.line(C.amber, 0.035, (c) => { c.moveTo(x, y + 0.1); c.lineTo(x + 0.07, y + 0.27); }); }   // seven coils of straw, stitched
          a.disc(C.honey, 0, 2.52, 0.2, 0.16);
          a.box(C.navy, -0.3, 0.26, 0.6, 0.3); a.disc(C.navy, 0, 0.56, 0.3);                                                 // the way in
        } },
        { fold: 'float', on: 'skep', side: -1, at: [-0.75, 1.75], gap: 0.3, sway: 1, area: [-2.8, 1.5, -0.6, 3.3], art(a) { arm(a, [-0.75, 1.75, -1.0, 2.5, -1.55, 2.5]); bee(a, -2.0, 2.52, 0.95, 1); } },
        { fold: 'float', on: 'skep', side: 1, at: [0.95, 1.2], gap: 0.3, sway: -0.8, area: [0.8, 1.0, 2.75, 2.35], art(a) { arm(a, [0.95, 1.2, 1.3, 1.9, 1.75, 1.8]); bee(a, 2.15, 1.82, 0.82, -1); } },
      ],
    },
    { // ------------------------------------------------------------ 3. the jar on a breakfast table
      words: ['Honey for', 'breakfast.'],
      floor(a) {
        a.box(C.cream, -5.42, -3.02, 10.84, 6.04, 0.45);                                                                     // a gingham cloth
        a.clip((c) => c.roundRect(-5.42, -3.02, 10.84, 6.04, 0.45), () => { a.ctx.globalAlpha = 0.42; for (let i = -8; i <= 8; i++) { a.box(C.coral, i * 0.72 - 0.18, -3.1, 0.36, 6.2); if (Math.abs(i) < 5) a.box(C.coral, -5.5, i * 0.72 - 0.18, 11, 0.36); } a.ctx.globalAlpha = 1; });
        stepNo(a, 3);
        a.box(C.navy, 0.9, -2.66, 3.1, 0.075, 0.035);                                   // the slot the pull tab runs in
      },
      parts: [
        { id: 'kitchen', fold: 'v', z: -1.0, alpha: 76, size: [9.6, 3.35], art(a) {
          a.box(C.sky, -4.7, -0.1, 9.4, 1.7, 0.08); for (let x = -4.4; x < 4.5; x += 0.55) a.box(C.cream, x, 1.18, 0.4, 0.22, 0.04);   // the wall and a row of tiles
          a.box(C.coral, -1.95, 0.95, 3.9, 2.3, 0.12);                                                                       // the window, with the sun coming up
          a.clip((c) => c.rect(-1.72, 1.2, 3.44, 1.82), () => { a.box('#fbe7b3', -2, 1, 4, 2.4); a.disc(C.yellow, -0.92, 2.6, 0.3); for (let k = 0; k < 8; k++) a.line(C.yellow, 0.06, (c) => { c.moveTo(-0.92 + 0.4 * Math.cos(k * 0.785), 2.6 + 0.4 * Math.sin(k * 0.785)); c.lineTo(-0.92 + 0.52 * Math.cos(k * 0.785), 2.6 + 0.52 * Math.sin(k * 0.785)); }); a.ridge(C.sage, -2, 2, (x) => 1.5 + 0.14 * Math.cos(x * 1.7), 1.1); });
          a.box(C.coral, -0.07, 1.1, 0.14, 2.0); a.box(C.coral, -1.8, 2.1, 3.6, 0.12); a.box(C.navy, -2.2, 0.86, 4.4, 0.14, 0.05);
          a.disc(C.cream, 3.35, 2.0, 0.6); a.disc(C.navy, 3.35, 2.0, 0.6 - 0.07, 0.6 - 0.07); a.disc(C.cream, 3.35, 2.0, 0.46);     // the clock says seven
          a.line(C.navy, 0.07, (c) => { c.moveTo(3.35, 2.0); c.lineTo(3.35, 2.36); }); a.line(C.navy, 0.08, (c) => { c.moveTo(3.35, 2.0); c.lineTo(3.2, 1.76); }); a.disc(C.coral, 3.35, 2.0, 0.06);
          [[-3.75, C.yellow], [-2.95, C.coral]].forEach(([x, col]) => { a.box(col, x - 0.28, 1.55, 0.56, 0.5, 0.08); a.line(col, 0.09, (c) => c.arc(x + 0.3, 1.82, 0.15, -1.4, 1.4)); a.box(C.cream, x - 0.28, 1.84, 0.56, 0.08); });   // two cups on the wall
        } },
        { fold: 'box', on: 'kitchen', span: [-4.65, -2.25], depth: 1.4, strap: 0.6, height: 1.8, art(a) {                    // the teapot
          a.box(C.navy, -4.3, -0.1, 1.75, 0.2, 0.05);
          a.line(C.coral, 0.16, (c) => c.arc(-4.1, 0.8, 0.36, 1.2, 5.1)); a.path(C.coral, (c) => { c.moveTo(-2.9, 0.5); c.quadraticCurveTo(-2.45, 0.7, -2.4, 1.25); c.lineTo(-2.62, 1.3); c.quadraticCurveTo(-2.75, 0.95, -3.0, 0.95); });
          a.disc(C.coral, -3.45, 0.75, 0.8, 0.68); a.box(C.navy, -3.87, 1.34, 0.84, 0.1, 0.05); a.disc(C.yellow, -3.45, 1.52, 0.13);
          for (let i = 0; i < 9; i++) a.disc(C.cream, -3.45 + 0.52 * Math.cos(i * 2.4) * (0.4 + 0.07 * i), 0.72 + 0.42 * Math.sin(i * 2.4) * (0.4 + 0.07 * i), 0.07);
        } },
        { fold: 'box', on: 'kitchen', span: [2.3, 4.65], depth: 1.25, strap: 0.6, height: 1.7, art(a) {                      // toast, with honey already on it
          a.box(C.navy, 2.5, -0.1, 2.0, 0.18, 0.05); a.disc(C.cream, 3.5, 0.14, 1.05, 0.12);
          [[3.9, 0.82, 0.16], [3.1, 0.78, -0.12]].forEach(([x, y, q]) => { const c = a.ctx; c.save(); c.translate(x, y); c.rotate(q); a.box(C.amber, -0.55, -0.6, 1.1, 1.2, [0.14, 0.14, 0.42, 0.42]); a.box('#f7dc9c', -0.44, -0.49, 0.88, 0.98, [0.1, 0.1, 0.34, 0.34]); a.line(C.honey, 0.13, (p) => { p.moveTo(-0.26, 0.24); p.bezierCurveTo(0.3, 0.3, -0.34, -0.05, 0.24, -0.02); p.bezierCurveTo(0.34, -0.2, -0.2, -0.16, -0.1, -0.32); }); c.restore(); });
        } },
        // the jar is three cards nested in one crease: the back of the glass, the honey (a slider) and the front
        { fold: 'v', z: 0.6, alpha: 58, size: [2.7, 2.3], art(a) { a.box('#e3efe8', -1.1, -0.1, 2.2, 2.02, 0.44); a.box('#e3efe8', -0.74, 1.8, 1.48, 0.3); } },
        { fold: 'v', z: 0.65, alpha: 58, size: [2.5, 2.1], slide: (t) => -1.78 * (1 - pulled(t)), art(a) { a.path(C.honey, (c) => { c.moveTo(-1.02, -0.1); for (let x = -1.02; x <= 1.021; x += 0.06) c.lineTo(x, 1.7 + 0.05 * Math.sin(x * 5)); c.lineTo(1.02, -0.1); }); a.line('#f6c95a', 0.09, (c) => { c.moveTo(-0.78, 0.4); c.lineTo(-0.78, 1.4); }); } },
        { id: 'jar', fold: 'v', z: 0.7, alpha: 58, size: [3.0, 2.85], art(a) {
          a.line(C.cream, 0.18, (c) => c.roundRect(-1.1, 0.02, 2.2, 1.88, 0.46)); a.line('#b5d5cf', 0.045, (c) => c.roundRect(-1.1, 0.02, 2.2, 1.88, 0.46));   // the glass is only an outline: the middle is cut out
          a.box(C.cream, -0.78, 1.82, 1.56, 0.3, 0.06); a.box('#b5d5cf', -0.78, 1.93, 1.56, 0.045);                                 // the neck
          a.box(C.coral, -0.95, 2.06, 1.9, 0.5, 0.12); a.box(C.cream, -0.95, 2.25, 1.9, 0.09); a.box(C.navy, -0.95, 2.04, 1.9, 0.07, 0.03);   // the lid
          a.line(C.navy, 0.05, (c) => { c.moveTo(-0.6, 1.86); c.lineTo(-0.56, 1.6); }); a.disc(C.cream, -0.52, 1.3, 0.34); a.disc(C.coral, -0.52, 1.3, 0.2); a.disc(C.cream, -0.52, 1.3, 0.1);   // a paper tag on a string
        } },
        { fold: 'float', on: 'jar', side: 1, at: [0.6, 2.3], gap: 0.3, sway: 1, area: [0.45, 2.0, 2.45, 3.45], art(a) { arm(a, [0.6, 2.3, 0.85, 3.0, 1.3, 2.8]); bee(a, 1.75, 2.75, 0.85, -1); } },
      ],
    },
  ];

  // ---------------------------------------------------------------- the book's clock (picture and sound both read it)
  // How far a leaf has turned at time t: 0 = lying on the right, PI = lying on the left. It is lifted slowly, swings
  // over, lands with some speed left and bounces once on the air and the folded paper under it.
  const flip = (t, t0) => { const u = (t - t0) / TURN; if (u <= 0) return 0; if (u < 1) return Math.PI * u * u * (2.2 - 1.2 * u); const v = t - t0 - TURN; return Math.PI - 0.034 * Math.abs(Math.sin(v * 11)) * Math.exp(-v * 6); };
  const landed = (s) => TURNS[s] + TURN;

  registerStyle({
    id: 'paper-pop-up',
    name: 'Paper Pop-Up',
    family: 'Material worlds',
    look: 'A pop-up book open on a wooden table in lamplight. Every scene is built from flat die-cut card: printed in a few flat colours, creased down the middle, standing in layers on real fold mechanisms, with a pale core showing on every cut edge.',
    motion: 'Only the pages move. As a page turns, the scene on the old spread is pressed flat under it and the next one is pulled up out of the gutter by its own folds, layer after layer; pieces on paper arms tremble when the page lands. A pull tab slides out to change one thing on the last spread.',
    light: 'One warm desk lamp from the upper left with soft-edged shadows, so each layer throws a shadow on the one behind and the two wings of every fold take different light; a faint cool rim from behind; the table falls off into the dark.',
    materials: 'Thick uncoated card with visible fibre and a slight cockle, flat matt ink with a little grain, bare cream card on cut edges and as a thin margin around each shape, cloth-covered boards, dark oiled wood.',
    camera: 'A long lens looking down the gutter from about twenty-five degrees up, close enough that the spread fills the frame. One slow drift from left to right that breathes out a little for each page turn and ends in a gentle push; shallow focus on the middle layers.',
    post: 'Real depth of field, motion blur and area-light shadows from the accumulation renderer; neutral tone mapping so the inks stay true, a soft vignette, very fine grain.',
    explains: 'A story or a process in a few steps: one spread per step, each with one big subject in the middle, supporting pieces at the sides and one short line of words on a paper ribbon. A pull tab can show a change on the spot (fill, reveal, move).',
    topic: 'From flower to honey jar: a bee on flowers, the hive, the jar on the breakfast table',
    duration: 9,
    fonts: ['700 100px "Fraunces"'],
    render: { samples: 56, shutter: 0.5, tone: 'neutral', exposure: 0.9, saturation: 1.1, bloom: 0.12, bloomThreshold: 1.1, vignette: 0.42, grain: 0.014, fov: 26, background: '#050403' },

    build(S) {
      const { THREE, K, scene, camera } = S;
      S.renderer.localClippingEnabled = true;                    // sliders are cut off where they pass through the page
      const add = (a, b, s = 1) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s], mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
      const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      const unit = (a) => mul(a, 1 / Math.hypot(a[0], a[1], a[2])), rad = (d) => d * Math.PI / 180;

      // ------------------------------------------------------------ 1. paper
      const CARD_T = 0.03, LEAF_T = 0.045, PX = 150;             // thickness of a cut-out and of a page; print resolution in pixels per unit
      // one height map for all paper: slow cockle, felt-like clouds and single fibres
      const fibre = K.canvasTex(1024, 1024, (ctx, w, h) => {
        const n = K.noise(3), r = K.rng(8), im = ctx.createImageData(w, h);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = 128 + 70 * n.fbm(x * 0.006, y * 0.006, 0, 2) + 34 * n.fbm(x * 0.05, y * 0.05, 3, 3) + 14 * (K.hash(x, y) - 0.5); im.data.set([v, v, v, 255], (y * w + x) * 4); }
        ctx.putImageData(im, 0, 0); ctx.lineCap = 'round';
        for (let i = 0; i < 5200; i++) { const x = r.range(0, w), y = r.range(0, h), q = r.range(0, 6.3), len = r.range(8, 34); ctx.strokeStyle = `rgba(255,255,255,${r.range(0.05, 0.3)})`; ctx.lineWidth = r.range(0.8, 1.8); ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(q + 0.6) * len * 0.5, y + Math.sin(q + 0.6) * len * 0.5, x + Math.cos(q) * len, y + Math.sin(q) * len); ctx.stroke(); }
      }, { data: true });
      fibre.wrapS = fibre.wrapT = THREE.RepeatWrapping;
      const bumpFor = (w, h) => { const b = fibre.clone(); b.repeat.set(w / 3.2, h / 3.2); b.needsUpdate = true; return b; };
      // ink on uncoated card is never perfectly even: a speckle that is multiplied over every print
      const speck = document.createElement('canvas'); speck.width = speck.height = 256;
      { const x = speck.getContext('2d'), im = x.createImageData(256, 256), r = K.rng(2); for (let i = 0; i < 65536; i++) { const v = 255 - 30 * Math.pow(r(), 3) - (r.chance(0.012) ? 60 : 0); im.data.set([v, v, v * 0.985, 255], i * 4); } x.putImageData(im, 0, 0); }
      const grain = (ctx, w, h) => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = ctx.createPattern(speck, 'repeat'); ctx.fillRect(0, 0, w, h); ctx.globalCompositeOperation = 'source-over'; };
      const paper = (map, w, h) => new THREE.MeshStandardMaterial({ map, bumpMap: bumpFor(w, h), bumpScale: 0.45, roughness: 0.93, metalness: 0 });
      const core = new THREE.MeshStandardMaterial({ color: '#fbf5e6', roughness: 0.95 });       // what a cut edge shows

      // the pen every `art` and `floor` function draws with: world units, y up
      const pen = (ctx, back) => {
        const a = {
          ctx, back,                    // back = this is the reverse of a cut-out: same picture, no words
          path(col, fn) { ctx.fillStyle = col; ctx.beginPath(); fn(ctx); ctx.fill(); return a; },
          disc(col, x, y, rx, ry = rx, rot = 0) { return a.path(col, (c) => c.ellipse(x, y, rx, ry, rot, 0, 7)); },
          box(col, x, y, w, h, r = 0) { return a.path(col, (c) => c.roundRect(x, y, w, h, r)); },
          line(col, w, fn, dash) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = ctx.lineJoin = 'round'; ctx.setLineDash(dash || []); ctx.beginPath(); fn(ctx); ctx.stroke(); ctx.setLineDash([]); return a; },
          ridge(col, x0, x1, top, y0 = -0.1) { return a.path(col, (c) => { c.moveTo(x0, y0); for (let x = x0; x <= x1 + 1e-6; x += 0.1) c.lineTo(x, top(x)); c.lineTo(x1, y0); }); },
          clip(fn, inside) { ctx.save(); ctx.beginPath(); fn(ctx); ctx.clip(); inside(); ctx.restore(); return a; },
          text(str, x, y, size, col, align = 'center') { if (a.back) return a; ctx.save(); ctx.translate(x, y); ctx.scale(size / 100, -size / 100); ctx.font = '700 100px "Fraunces"'; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = col; ctx.fillText(str, 0, 0); ctx.restore(); return a; },
        };
        return a;
      };
      const ruler = document.createElement('canvas').getContext('2d'); ruler.font = '700 100px "Fraunces"';
      const widthOf = (str, size) => ruler.measureText(str).width * size / 100;

      // ------------------------------------------------------------ 2. the die-cutter
      // Outline of everything in a field of 0..1 values that is above `level`, as closed loops of [x, y] in sample
      // units (marching squares; i0..i1 limits the columns that count, which is how a card is split at its crease).
      function trace(f, w, h, level, i0, i1) {
        const at = (i, j) => (i < i0 || i > i1 || j < 0 || j >= h ? 0 : f[j * w + i]), EW = w + 3;
        const id = (i, j, upright) => ((j + 1) * EW + i + 1) * 2 + upright, next = new Map(), where = new Map();
        const SEG = [[], [3, 2], [2, 1], [3, 1], [1, 0], [3, 2, 1, 0], [2, 0], [3, 0], [0, 3], [0, 2], [0, 3, 2, 1], [0, 1], [1, 3], [1, 2], [2, 3], []];   // per corner pattern: pairs of cell edges (top, right, bottom, left), paper on the same side every time
        for (let j = -1; j < h; j++) for (let i = Math.max(-1, i0 - 1); i <= Math.min(w - 1, i1); i++) {
          const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1), seg = SEG[(a >= level ? 8 : 0) | (b >= level ? 4 : 0) | (c >= level ? 2 : 0) | (d >= level ? 1 : 0)];
          if (!seg.length) continue;
          const ids = [id(i, j, 0), id(i + 1, j, 1), id(i, j + 1, 0), id(i, j, 1)];
          const pts = [[i + (level - a) / (b - a), j], [i + 1, j + (level - b) / (c - b)], [i + (level - d) / (c - d), j + 1], [i, j + (level - a) / (d - a)]];
          for (let k = 0; k < seg.length; k += 2) { next.set(ids[seg[k]], ids[seg[k + 1]]); where.set(ids[seg[k]], pts[seg[k]]); where.set(ids[seg[k + 1]], pts[seg[k + 1]]); }
        }
        const loops = [];
        while (next.size) { const start = next.keys().next().value, loop = []; let k = start; do { loop.push(where.get(k)); const n = next.get(k); next.delete(k); k = n; } while (k !== start && k !== undefined); loops.push(loop); }
        return loops;
      }
      // drop the points a closed outline does not need (Douglas-Peucker)
      function simplify(pts, tol) {
        const n = pts.length; if (n < 8) return pts;
        let far = 0, fd = 0; for (let i = 1; i < n; i++) { const d = (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2; if (d > fd) { fd = d; far = i; } }
        const keep = new Uint8Array(n + 1), P = (i) => pts[i % n], stack = [[0, far], [far, n]]; keep[0] = keep[far] = 1;
        while (stack.length) {
          const [i0, i1] = stack.pop(), a = P(i0), b = P(i1), dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1e-9; let m = -1, md = tol;
          for (let i = i0 + 1; i < i1; i++) { const p = P(i), d = Math.abs((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) / len; if (d > md) { md = d; m = i; } }
          if (m > 0) { keep[m] = 1; stack.push([i0, m], [m, i1]); }
        }
        return pts.filter((_, i) => keep[i]);
      }
      const areaOf = (l) => { let s = 0; for (let i = 0; i < l.length; i++) { const p = l[i], q = l[(i + 1) % l.length]; s += p[0] * q[1] - q[0] * p[1]; } return s / 2; };
      const inside = (p, l) => { let c = false; for (let i = 0, j = l.length - 1; i < l.length; j = i++) if ((l[i][1] > p[1]) !== (l[j][1] > p[1]) && p[0] < (l[j][0] - l[i][0]) * (p[1] - l[i][1]) / (l[j][1] - l[i][1]) + l[i][0]) c = !c; return c; };

      // Print a piece and cut it out. `draw` paints the picture on a transparent sheet that covers x0..x0+w, y0..y0+h;
      // the cut follows the picture a little outside its edge (MARGIN), so a rim of bare card shows all round, small
      // gaps close up and corners come out rounded, as a real die would leave them. Returns the print and a function
      // that gives the outline of the whole sheet or of the part on one side of the crease (x = 0).
      const MARGIN = 0.045;
      function dieCut(x0, y0, w, h, draw) {
        const cw = Math.ceil(w * PX / 4) * 4, ch = Math.ceil(h * PX / 2) * 2, mw = cw / 2, mh = ch / 2; w = cw / PX; h = ch / PX;
        const art = document.createElement('canvas'); art.width = cw; art.height = ch;
        const ctx = art.getContext('2d'); ctx.setTransform(PX, 0, 0, -PX, -x0 * PX, (y0 + h) * PX); draw(pen(ctx));
        const soft = document.createElement('canvas'); soft.width = mw; soft.height = mh;
        const sx = soft.getContext('2d', { willReadFrequently: true }); sx.filter = `blur(${(MARGIN * PX / 2 / 0.84).toFixed(2)}px)`; sx.drawImage(art, 0, 0, mw, mh);
        const px = sx.getImageData(0, 0, mw, mh).data, f = new Float32Array(mw * mh); for (let i = 0; i < f.length; i++) f[i] = px[i * 4 + 3] / 255;
        const print = (back) => K.canvasTex(cw, ch, (c) => { c.fillStyle = C.card; c.fillRect(0, 0, cw, ch); if (back) { c.setTransform(PX, 0, 0, -PX, -x0 * PX, (y0 + h) * PX); draw(pen(c, true)); } else c.drawImage(art, 0, 0); grain(c, cw, ch); });
        const tex = print(false), rear = print(true);
        const mid = Math.round(-x0 * PX / 2);                       // the first sample column right of the crease
        const outline = (side) => {
          const loops = trace(f, mw, mh, 0.2, side > 0 ? mid : 0, side < 0 ? mid - 1 : mw - 1)
            .map((l) => simplify(l.map(([i, j]) => { const x = x0 + (2 * i + 1) / PX; return [side && Math.abs(x) < 2.4 / PX ? 0 : x, y0 + h - (2 * j + 1) / PX]; }), 0.004))
            .filter((l) => l.length > 2 && Math.abs(areaOf(l)) > 0.004);
          const sign = Math.sign(areaOf(loops.reduce((a, b) => (Math.abs(areaOf(b)) > Math.abs(areaOf(a)) ? b : a), loops[0])));
          const solid = loops.filter((l) => Math.sign(areaOf(l)) === sign).map((l) => ({ l, shape: new THREE.Shape(l.map((p) => new THREE.Vector2(p[0], p[1]))) }));
          loops.filter((l) => Math.sign(areaOf(l)) !== sign).forEach((hole) => { const o = solid.find((s) => inside(hole[0], s.l)); if (o) o.shape.holes.push(new THREE.Path(hole.map((p) => new THREE.Vector2(p[0], p[1])))); });
          return solid.map((s) => s.shape);
        };
        return { tex, rear, outline, x0, y0, w, h };
      }
      // a cut-out as a solid: print on both faces, bare card on the edge
      let cards = 1;
      function card(cut, side, parent) {
        const g = new THREE.ExtrudeGeometry(cut.outline(side), { depth: CARD_T, bevelEnabled: false }); g.translate(0, 0, -CARD_T / 2);
        const p = g.attributes.position, uv = g.attributes.uv, nm = g.attributes.normal, r = K.rng(cards++), bx = r.range(-0.05, 0.05), by = r.range(0.03, 0.08) * r.sign();
        for (let i = 0; i < p.count; i++) {
          const x = p.getX(i), y = p.getY(i), z = nm.getZ(i); uv.setXY(i, (x - cut.x0) / cut.w, (y - cut.y0) / cut.h);
          if (Math.abs(z) > 0.9) { const k = 1 / Math.hypot(1, bx * x, by * (y - 1)); nm.setXYZ(i, -bx * x * k * z, -by * (y - 1) * k * z, z * k); }   // card is never dead flat: the faces are shaded as if each piece had a slight curl
        }
        const all = g.groups.slice(); g.clearGroups();
        all.forEach((q) => { if (q.materialIndex) g.addGroup(q.start, q.count, 1); else { g.addGroup(q.start, q.count / 2, 2); g.addGroup(q.start + q.count / 2, q.count / 2, 0); } });   // the first half of the flat faces is the reverse side
        const m = new THREE.Mesh(g, [paper(cut.tex, cut.w, cut.h), core, paper(cut.rear, cut.w, cut.h)]); m.castShadow = m.receiveShadow = true; m.matrixAutoUpdate = false; m.frustumCulled = false; parent.add(m);
        return m;
      }
      // put a card in the world: X = where its +x points, Y = where its +y points, O = where its origin is
      const seat = (m, X, Y, O) => { const Z = cross(X, Y); m.matrix.set(X[0], Y[0], Z[0], O[0], X[1], Y[1], Z[1], O[1], X[2], Y[2], Z[2], O[2], 0, 0, 0, 1); m.matrixWorldNeedsUpdate = true; };

      // ------------------------------------------------------------ 3. the fold mechanisms
      // The gutter of a spread is a hinge along z. With the left page lifted by aL and the right page by aR (0 = flat
      // on the table), this gives the directions the mechanisms need: dL / dR run out across each page, nL / nR are
      // the page normals, b points between the pages and `a` is how far the spread is from flat (PI / 2 = shut).
      function hinge(aL, aR) {
        const psi = (Math.PI - aL + aR) / 2, a = Math.min((aL + aR) / 2, Math.PI / 2 - 0.004), s = Math.sin(a), c = Math.cos(a);
        const b = [Math.cos(psi), Math.sin(psi), 0], x = [Math.sin(psi), -Math.cos(psi), 0];
        return { a, b, dL: add(mul(x, -c), b, s), dR: add(mul(x, c), b, s), nL: add(mul(x, s), b, c), nR: add(mul(x, -s), b, c) };
      }
      // A V-fold on that hinge. Its two glue lines leave the gutter at angle alpha, one on each page; beta is the angle
      // on the card between glue line and crease (90 = it stands upright when the book is open). The crease is the one
      // direction that keeps both angles, which is all the "physics" a pop-up needs: c is the crease, uL / uR run
      // from the crease out along each wing. point = -1: the V points at the reader; +1: away.
      function solveV(h, alpha, beta, point) {
        const sa = Math.sin(alpha), ca = Math.cos(alpha), A = sa * Math.sin(h.a), g = Math.atan2(A, ca) + Math.acos(K.clamp(Math.cos(beta) / Math.hypot(A, ca), -1, 1));
        const c = [h.b[0] * Math.sin(g), h.b[1] * Math.sin(g), point * Math.cos(g)], out = (d) => { const gl = [d[0] * sa, d[1] * sa, point * ca]; return unit(add(gl, c, -dot(gl, c))); };
        return { c, uL: out(h.dL), uR: out(h.dR) };
      }
      const MAKE = {
        v(o, byId, group) {
          const cut = dieCut(-o.size[0] / 2, -0.1, o.size[0], o.size[1] + 0.25, o.art), L = card(cut, -1, group), R = card(cut, 1, group);
          const slit = o.slide ? [new THREE.Plane(), new THREE.Plane()] : null;
          if (slit) [L, R].forEach((m, i) => m.material.forEach((mt, k) => { if (k) m.material[k] = mt = mt.clone(); mt.clippingPlanes = [slit[i]]; mt.clipShadows = true; }));
          const part = { o, meshes: [L, R], pose(h, t) {
            const v = solveV(h, rad(o.alpha), rad(o.beta || 90), o.point === 'back' ? 1 : -1), up = o.slide ? o.slide(t) : 0, O = [v.c[0] * up, v.c[1] * up, o.z + v.c[2] * up];
            part.wing = { '-1': { X: mul(v.uL, -1), Y: v.c, O, n: h.nL }, 1: { X: v.uR, Y: v.c, O, n: h.nR } };
            seat(L, part.wing[-1].X, v.c, O); seat(R, v.uR, v.c, O);
            if (slit) { slit[0].normal.set(...h.nL); slit[1].normal.set(...h.nR); slit[0].constant = slit[1].constant = -LEAF_T / 2; }
          } };
          return part;
        },
        box(o, byId, group) {
          const side = o.span[0] < 0 ? -1 : 1, cut = dieCut(o.span[0], -0.1, o.span[1] - o.span[0], o.height + 0.25, o.art), front = card(cut, 0, group);
          const g = new THREE.BoxGeometry(0.5, o.depth, CARD_T); g.translate((o.span[0] + o.span[1]) / 2, o.depth / 2, 0);
          const strap = new THREE.Mesh(g, core); strap.castShadow = strap.receiveShadow = true; strap.matrixAutoUpdate = false; group.add(strap);
          return { o, meshes: [front, strap], pose() {
            const w = byId[o.on].wing[side], out = cross(w.X, w.n), O = add(w.O, out, o.depth);      // `out` lies on the page, square to the glue line
            seat(front, w.X, w.Y, O); seat(strap, w.X, mul(out, -1), add(O, w.Y, o.strap));
          } };
        },
        float(o, byId, group, s) {
          const [x0, y0, x1, y1] = o.area, cut = dieCut(x0, y0, x1 - x0, y1 - y0, o.art), m = card(cut, 0, group);
          return { o, meshes: [m], pose(h, t) {
            const w = byId[o.on].wing[o.side], lift = o.gap * Math.max(0, dot(w.Y, w.n)) + CARD_T * K.clamp((Math.PI / 2 - h.a) * 8), dt = t - landed(s);   // the tab collapses as the wing lies down, until the piece is pressed flat against it
            const q = dt > 0 ? 0.085 * (o.sway || 0) * Math.sin(dt * 21) * Math.exp(-dt * 2.4) : 0, X = add(mul(w.X, Math.cos(q)), w.Y, Math.sin(q)), Y = add(mul(w.Y, Math.cos(q)), w.X, -Math.sin(q));
            let O = add(add(w.O, w.X, o.at[0]), w.Y, o.at[1]); O = add(add(O, X, -o.at[0]), Y, -o.at[1]);       // it swings about the point where it is glued
            seat(m, X, Y, add(O, cross(w.X, w.Y), lift));
          } };
        },
      };
      // the words: a ribbon of card that stands in a shallow V near the front edge, creased between two words
      const ribbon = ([left, right]) => {
        const em = 0.76, gap = 0.2, H = 1.0, xl = -(gap + widthOf(left, em) + 0.3), xr = gap + widthOf(right, em) + 0.3, tail = 0.42;
        return { fold: 'v', z: 1.95, alpha: 78, size: [2 * (Math.max(-xl, xr) + tail) + 0.1, H], art(a) {
          a.path(C.cream, (c) => { c.moveTo(xl - tail, -0.1); c.lineTo(xl - tail + 0.26, H / 2 - 0.05); c.lineTo(xl - tail, H); c.lineTo(xr + tail, H); c.lineTo(xr + tail - 0.26, H / 2 - 0.05); c.lineTo(xr + tail, -0.1); });
          a.box(C.coral, xl - tail + 0.32, H - 0.15, xr - xl + 2 * tail - 0.64, 0.055); a.box(C.coral, xl - tail + 0.32, 0.06, xr - xl + 2 * tail - 0.64, 0.055);
          a.text(left, -gap, 0.27, em, C.navy, 'right'); a.text(right, gap, 0.27, em, C.navy, 'left');
        } };
      };
      const spreads = SPREADS.map((sp, s) => {
        const group = new THREE.Group(), byId = {}; scene.add(group);
        const parts = [...sp.parts, ribbon(sp.words)].map((o) => { const p = MAKE[o.fold](o, byId, group, s); if (o.id) byId[o.id] = p; return p; });
        return { group, parts };
      });
      // the paper engineer's check: shut every spread and see that nothing sticks out of the closed book
      const corner = new THREE.Vector3();
      spreads.forEach((sp, s) => {
        const h = hinge(0, Math.PI - 0.02); sp.parts.forEach((p) => p.pose(h, 99));
        sp.parts.forEach((p, i) => { let over = 0; p.meshes.forEach((m) => { const q = m.geometry.attributes.position; for (let k = 0; k < q.count; k += 3) { corner.fromBufferAttribute(q, k).applyMatrix4(m.matrix); over = Math.max(over, -corner.x - PAGE_W, Math.abs(corner.z) - PAGE_D / 2); } }); if (over > 0.02 && !p.o.slide) console.error(`pop-up: piece ${i} of spread ${s + 1} (${p.o.id || p.o.fold}) sticks ${over.toFixed(2)} out of the closed book`); });
      });

      // ------------------------------------------------------------ 4. the book
      // Three loose leaves turn; under them a block of pages on each side, cloth boards and a spine. Leaf j carries the
      // right page of spread j - 1 on its front and the left page of spread j on its back, so turning one leaf shuts a
      // spread and opens the next in the same movement.
      const FPX = 128, book = new THREE.Group(); scene.add(book);
      const printed = (side, draw) => K.canvasTex(Math.round(PAGE_W * FPX), Math.round(PAGE_D * FPX), (ctx, w, h) => {
        ctx.fillStyle = C.card; ctx.fillRect(0, 0, w, h); ctx.setTransform(FPX, 0, 0, -FPX, side < 0 ? PAGE_W * FPX : 0, PAGE_D / 2 * FPX); draw(pen(ctx));
        ctx.setTransform(1, 0, 0, 1, 0, 0); const g = ctx.createLinearGradient(side < 0 ? w : 0, 0, side < 0 ? w - 60 : 60, 0); g.addColorStop(0, 'rgba(70,50,30,0.3)'); g.addColorStop(1, 'rgba(70,50,30,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);   // the page dips into the gutter
        grain(ctx, w, h);
      });
      const endpaper = (a) => { a.box(C.yellow, -5.7, -3.3, 11.4, 6.6); for (let i = -11; i <= 11; i++) for (let j = -5; j <= 5; j++) hex(a, '#f8cf63', i * 0.75, (j + (i & 1 ? 0.5 : 0)) * 0.866, 0.4); };
      const face = (side, draw, back) => { const t = printed(side, draw); if (back) { t.center.set(0.5, 0.5); t.rotation = Math.PI; } return paper(t, PAGE_W, PAGE_D); };
      const leaves = TURNS.map((_, j) => {
        const g = new THREE.BoxGeometry(PAGE_W, LEAF_T, PAGE_D); g.translate(PAGE_W / 2, 0, 0);
        const m = new THREE.Mesh(g, [core, core, face(1, j ? SPREADS[j - 1].floor : endpaper), face(-1, SPREADS[j].floor, true), core, core]);
        m.castShadow = m.receiveShadow = true; book.add(m); return m;
      });
      const BLOCK_H = 0.3, TABLE_Y = -BLOCK_H - 0.06;
      const edges = new THREE.MeshStandardMaterial({ roughness: 0.95, map: K.canvasTex(32, 256, (ctx, w, h) => { ctx.fillStyle = '#f4ecda'; ctx.fillRect(0, 0, w, h); for (let k = 0; k < 7; k++) { ctx.fillStyle = k % 2 ? 'rgba(120,96,60,0.5)' : 'rgba(150,126,90,0.35)'; ctx.fillRect(0, (k + 0.5) * h / 7, w, 2.5); } }) });
      const block = (side, top) => { const g = new THREE.BoxGeometry(PAGE_W, BLOCK_H, PAGE_D); g.translate(side * PAGE_W / 2, -BLOCK_H / 2, 0); const m = new THREE.Mesh(g, [edges, edges, top, edges, edges, edges]); m.castShadow = m.receiveShadow = true; book.add(m); return m; };
      const blockL = block(-1, face(-1, endpaper)), blockR = block(1, face(1, SPREADS[SPREADS.length - 1].floor));
      const cloth = new THREE.MeshStandardMaterial({ color: '#1f4a4b', roughness: 0.82, bumpScale: 2.5, bumpMap: K.canvasTex(256, 256, (ctx) => { ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, 256, 256); for (let i = 0; i < 256; i += 4) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(i, 0, 2, 256); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, i, 256, 2); } }, { data: true, repeat: [14, 9] }) });
      for (const side of [-1, 1]) { const b = new THREE.Mesh(K.roundedBox(PAGE_W + 0.22, 0.07, PAGE_D + 0.44, 0.025, 3), cloth); b.position.set(side * (PAGE_W / 2 + 0.17), TABLE_Y + 0.035, 0); b.castShadow = b.receiveShadow = true; book.add(b); }
      const spine = new THREE.Mesh(K.roundedBox(0.5, 0.05, PAGE_D + 0.44, 0.02, 2), cloth); spine.position.set(0, TABLE_Y + 0.025, 0); spine.receiveShadow = true; book.add(spine);
      // the pull tab: a grip of card that slides along a slot printed on the last page (the strip it pulls is under the page)
      const TAB = { x: [1.4, 3.1], z: 2.62 }, grip = dieCut(-0.6, -0.32, 1.2, 0.64, (a) => { a.box(C.coral, -0.52, -0.25, 1.04, 0.5, 0.16); for (const x of [-0.24, 0.06]) a.line(C.cream, 0.09, (c) => { c.moveTo(x, 0.12); c.lineTo(x + 0.16, 0); c.lineTo(x, -0.12); }); });
      const tab = card(grip, 0, blockR); tab.rotation.x = -Math.PI / 2; tab.matrixAutoUpdate = true;

      // ------------------------------------------------------------ 5. the table and the lamp
      const wood = K.canvasTex(1024, 1024, (ctx, w, h) => {
        const n = K.noise(12), r = K.rng(6), im = ctx.createImageData(w, h);
        for (let y = 0; y < h; y++) { const plank = Math.floor(y / 128), tone = 0.82 + 0.3 * K.hash(plank, 3); for (let x = 0; x < w; x++) { const v = K.clamp(0.5 + 1.25 * n.fbm(x * 0.0016 + plank * 9, y * 0.035, plank, 4) + 0.12 * n.n2(x * 0.02, y * 0.7)) * tone; im.data.set([40 + 78 * v, 23 + 46 * v, 12 + 24 * v, 255], (y * w + x) * 4); } }
        ctx.putImageData(im, 0, 0);
        for (let i = 0; i < 2200; i++) { ctx.fillStyle = `rgba(12,6,2,${r.range(0.1, 0.4)})`; ctx.fillRect(r.range(0, w), r.range(0, h), r.range(6, 40), 1); }
        for (let p = 0; p < 8; p++) { ctx.fillStyle = 'rgba(8,4,2,0.75)'; ctx.fillRect(0, p * 128, w, 2); }
      }, { repeat: [5, 5] });
      const table = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ map: wood, bumpMap: wood, bumpScale: 1.2, roughness: 0.58 }));
      table.rotation.x = -Math.PI / 2; table.position.y = TABLE_Y; table.receiveShadow = true; scene.add(table);
      // things left on the table by whoever made the book: offcuts of card, a mug
      const bits = K.rng(31), inks = [C.coral, C.yellow, C.leaf, C.cream, C.pink];
      [[-7.2, 2.6], [-6.7, 3.6], [6.9, 3.1], [7.5, 1.6], [6.6, -3.6], [-7.0, -2.9], [-3.2, 4.4], [2.2, 4.3], [-6.5, -4.6], [4.2, -4.7]].forEach(([x, z], i) => {
        const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(bits.range(0.5, 1.3), bits.range(-0.1, 0.2)); sh.lineTo(bits.range(0.2, 0.9), bits.range(0.35, 0.8)); if (i % 2) sh.lineTo(bits.range(-0.2, 0.1), bits.range(0.4, 0.7));
        const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: CARD_T, bevelEnabled: false }), [new THREE.MeshStandardMaterial({ color: inks[i % inks.length], roughness: 0.93 }), core]);
        m.rotation.set(-Math.PI / 2, 0, bits.range(0, 6.3)); m.position.set(x, TABLE_Y + 0.002, z); m.castShadow = m.receiveShadow = true; scene.add(m);
      });
      const glaze = new THREE.MeshStandardMaterial({ color: '#1d3a44', roughness: 0.3 }), mug = new THREE.Group(); mug.position.set(-6.9, TABLE_Y, -6.2); scene.add(mug);
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.85, 2.0, 40), glaze); cup.position.y = 1.0; const ear = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.13, 12, 32), glaze); ear.position.set(1.05, 1.0, 0.3); ear.rotation.y = -0.3; mug.add(cup, ear); mug.traverse((m) => { m.castShadow = m.receiveShadow = true; });
      const pencil = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 5.2, 6), new THREE.MeshStandardMaterial({ color: '#d99a1e', roughness: 0.45 })); pencil.rotation.set(Math.PI / 2, 0, 1.25); pencil.position.set(6.6, TABLE_Y + 0.1, -5.4); pencil.castShadow = pencil.receiveShadow = true; scene.add(pencil);

      K.env(S, { top: '#2a2119', horizon: '#3d3024', bottom: '#6b5740', intensity: 1.0, panels: [{ pos: [9, 11, 7], size: [7, 7], color: '#ffd9a6', power: 3 }, { pos: [-12, 6, -9], size: [6, 8], color: '#8fa8ff', power: 1.1 }] });
      K.spot(S, { pos: [4.5, 9.5, 11], target: [-0.2, 0.8, 0], color: '#ffe9d0', power: 1250, angle: 0.62, penumbra: 0.85, soft: 1.3, mapSize: 4096 });
      K.spot(S, { pos: [-8, 5.5, -10], target: [0, 1, 0], color: '#c2d0ff', power: 150, angle: 0.5, penumbra: 1, shadow: false });
      K.skyLight(S, { color: '#ffe8d2', power: 1.1, size: 9, center: [0, 0, 0] });

      // ------------------------------------------------------------ 6. camera: one slow drift across the three spreads
      const cam = {
        pos: K.path([[0, [-1.6, 6.0, 11.5]], [1.2, [-1.2, 5.85, 11.2]], [2.2, [-0.8, 6.0, 11.4]], [2.95, [-0.4, 6.4, 12.0]], [4.7, [0.2, 6.0, 11.4]], [5.6, [0.5, 6.4, 12.0]], [7.2, [1.0, 6.0, 11.4]], [9, [1.3, 5.7, 10.9]]]),
        aim: K.path([[0, [-0.2, 1.05, 0.3]], [2.2, [-0.1, 1.1, 0.3]], [4.7, [0, 1.1, 0.3]], [7.2, [0.1, 1.05, 0.35]], [9, [0.1, 1.0, 0.4]]]),
      };

      const riseOf = (j, t) => K.seg(t, TURNS[j], TURNS[j] + TURN * 0.5, K.ease.inOut), sinkOf = (j, t) => K.seg(t, TURNS[j] + TURN * 0.6, TURNS[j] + TURN, K.ease.inOut);
      return {
        update(t) {
          const phi = TURNS.map((t0) => flip(t, t0));
          // pages are card, so the stacks shift by one thickness whenever a leaf leaves the right or lands on the left
          let onRight = 0, onLeft = 0;
          leaves.forEach((m, j) => { let below = 0; for (let i = 0; i < j; i++) below += 1 - riseOf(i, t); for (let i = j + 1; i < leaves.length; i++) below += sinkOf(i, t); m.rotation.z = phi[j]; m.position.y = -LEAF_T * below; onRight += 1 - riseOf(j, t); onLeft += sinkOf(j, t); });
          blockR.position.y = LEAF_T / 2 - LEAF_T * onRight; blockL.position.y = LEAF_T / 2 - LEAF_T * onLeft;
          tab.position.set(K.lerp(TAB.x[0], TAB.x[1], pulled(t)), CARD_T / 2 + 0.004, TAB.z);
          spreads.forEach((sp, s) => {
            const aL = Math.PI - phi[s], aR = s + 1 < phi.length ? phi[s + 1] : 0;
            sp.group.visible = aL + aR < Math.PI - 0.02;
            if (sp.group.visible) { const h = hinge(aL, aR); sp.parts.forEach((p) => p.pose(h, t)); }
          });
          const p = cam.pos(t), a = cam.aim(t);
          K.look(camera, p, a); K.focus(camera, [0, 1.0, 1.35], 0.11);
        },
      };
    },

    sound(k) {
      k.bed('room', 0, 9, { gain: 1.0 });
      k.music('pad', 0, 9, { bpm: 80, chords: [['F3', 'A3', 'C4', 'E4'], ['D3', 'F3', 'A3', 'C4'], ['Bb2', 'D3', 'F3', 'A3']], gain: 0.5 });
      TURNS.forEach((t0, s) => {
        const hit = landed(s);
        if (t0 > 0) { k.play('paper', t0 + 0.02, { gain: 1.5, dur: 0.5, pan: 0.4 }); k.play('whoosh', t0 + 0.3, { gain: 0.6, dur: 0.8, top: 1500 }); k.play('paper', t0 + 0.5, { gain: 1.0, dur: 0.7 }); }   // the page is picked up and swings over, paper rustling under it
        k.withMinor(() => { for (let i = 0; i < 7; i++) if (hit - 0.62 + i * 0.085 > 0) k.play('tick', hit - 0.62 + i * 0.085, { gain: 0.45 + 0.06 * i, f: 1900 + i * 260, pan: -0.3 + i * 0.1 }); });   // card creaking upright
        k.play('slap', hit, { gain: 0.6, pan: -0.3 }); k.play('thud', hit, { gain: 0.55, f: 105, pan: -0.3 }); k.play('paper', hit + 0.04, { gain: 0.45, dur: 0.22 });
        k.play('ding', hit + 0.14, { gain: 0.34, f: ['C5', 'E5', 'G5'][s] });
        k.withMinor(() => { for (let i = 0; i < 4; i++) k.play('tick', hit + 0.19 + i * 0.3, { gain: 0.16 - 0.03 * i, f: 5200, pan: 0.2 }); });   // the bee trembling on its arm
      });
      k.play('tape', PULL[0], { gain: 1.3, dur: PULL[1] - PULL[0], pan: 0.4 }); k.play('paper', PULL[0], { gain: 0.8, dur: 0.8, pan: 0.4 });
      k.tone(PULL[0] + 0.1, { f: [[0, 'F3'], [PULL[1] - PULL[0] - 0.1, 'F4']], type: 'triangle', dur: PULL[1] - PULL[0], gain: 0.1, a: 0.25, filter: 'lowpass', f2: 900 });   // the jar filling
      k.play('tock', PULL[1], { gain: 0.6, f: 500, pan: 0.4 }); k.play('success', PULL[1] + 0.12, { gain: 0.6, f: 'C6' });
    },
  });
}
```
