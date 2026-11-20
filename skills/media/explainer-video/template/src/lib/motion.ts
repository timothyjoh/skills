// Small deterministic motion helpers. Every frame must be a pure function of the frame
// number: no Math.random, Date, timers or state carried between frames.

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));

/** 0..1 progress of frame through [from, from + dur]. */
export const prog = (frame: number, from: number, dur: number) => clamp((frame - from) / Math.max(1, dur));

export const smoothstep = (t: number) => t * t * (3 - 2 * t);
export const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Back-eased overshoot, for pops. s = overshoot amount. */
export const backOut = (t: number, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);

/** Scale for an element that pops in at `from` over `dur` frames. */
export const pop = (frame: number, from: number, dur = 9) => (frame < from ? 0 : backOut(prog(frame, from, dur)));

/** Hold drawings like hand animation: n = 2 is "on twos", 3 is "on threes". */
export const onN = (frame: number, n: number) => Math.floor(frame / n) * n;

/** Decaying shake offset, for a camera kick on a hit. Returns 0 outside the kick. */
export const kick = (frame: number, at: number, len = 7, amp = 1) => {
  const t = frame - at;
  if (t < 0 || t > len) return 0;
  return amp * Math.sin(t * 2.6) * Math.pow(1 - t / len, 2);
};

/** Seeded PRNG (mulberry32). Same seed, same sequence, every render. */
export const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Stable hash of integers to 0..1, for per-element, per-drawing jitter. */
export const hash = (...n: number[]) => {
  let h = 2166136261;
  for (const x of n) h = Math.imul(h ^ (x | 0), 16777619);
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
};

/** Linear interpolation, and mapping a value from one range to another (clamped). */
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const remap = (x: number, a: number, b: number, c: number, d: number) => lerp(c, d, clamp((x - a) / (b - a)));
