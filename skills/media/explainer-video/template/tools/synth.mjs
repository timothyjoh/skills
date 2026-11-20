#!/usr/bin/env node
// Music and sound effects synthesised in code (no samples) from a small score file.
//
//   node tools/synth.mjs --style <id>                 # reads scores/<id>.json
//   node tools/synth.mjs --style <id> --score my.json
//
// Writes public/audio/<id>/music.wav and sfx.wav (48 kHz stereo) and marks them in
// src/data/project.json so the Soundtrack plays them. Both are peak-normalised; the mix
// levels (music about 20 dB under the voice) live in project.json "mix".
//
// Score format (every field optional except what a layer needs):
// {
//   "seed": 1,
//   "music": {
//     "bpm": 116, "key": "A", "scale": "minor_pentatonic", "chords": [1, 6, 3, 7],
//     "layers": [
//       { "inst": "pad",   "part": "chord",  "octave": 3, "db": -10 },
//       { "inst": "pluck", "part": "melody", "octave": 5, "db": -6, "density": 0.6 },
//       { "inst": "arp",   "part": "arp",    "octave": 4, "db": -12, "rate": 16 },
//       { "inst": "bass",  "part": "root",   "octave": 2, "db": -8 },
//       { "kit": "taiko", "db": -10 }
//     ],
//     "sections": [ { "from": 16.5, "to": 18.3, "level": 0.05 } ],
//     "fadeIn": 0.4, "fadeOut": 1.5, "reverb": 0.2
//   },
//   "sfx": [
//     { "type": "pop", "at": 1.2 },
//     { "type": "shimmer", "word": "twelve", "beat": 1 },
//     { "type": "scratch", "word": "not", "offset": -0.04, "db": -2 },
//     { "type": "tick", "every": 0.125, "from": 0.2, "to": 2.0 },
//     { "type": "rain", "at": 0, "dur": 8 }
//   ]
// }
// Instruments: pad strings drone organ pluck koto harp musicbox marimba bell piano chip arp bass flute
// Parts: chord (held chord tones), root (bass on beats 1 and 3), pulse (root eighths),
//        arp (chord tones at "rate" notes per bar), melody (seeded phrase over the scale)
// Kits: soft synth lofi taiko wood chip
// Scales: major minor dorian lydian mixolydian major_pentatonic minor_pentatonic in_sen blues chromatic
// Effects: tick click pop plastic paper whoosh riser swell shimmer chime scratch stab hit drum
//          boom stamp typewriter zap thud firework wind rain engine water

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const args = process.argv.slice(2);
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const style = opt("style");
if (!style) {
  console.error("usage: synth.mjs --style <id> [--score scores/<id>.json]");
  process.exit(2);
}
const scorePath = path.resolve(root, opt("score", `scores/${style}.json`));
if (!fs.existsSync(scorePath)) {
  console.error(`missing score ${scorePath} (see references/audio.md)`);
  process.exit(2);
}
const score = JSON.parse(fs.readFileSync(scorePath, "utf8"));
const projPath = path.join(root, "src/data/project.json");
const proj = JSON.parse(fs.readFileSync(projPath, "utf8"));
const words = JSON.parse(fs.readFileSync(path.join(root, "src/data/words.json"), "utf8"));

const SR = 48000;
const DUR = proj.durationInFrames / proj.fps;
const N = Math.ceil(DUR * SR);
const TAU = Math.PI * 2;
const dbg = (d) => Math.pow(10, d / 20);

// ---------- deterministic randomness ----------
const mulberry = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const rand = mulberry(score.seed ?? 1);
const noise = () => rand() * 2 - 1;

// ---------- buses ----------
const bus = () => [new Float32Array(N), new Float32Array(N)];
const music = bus();
const sfx = bus();

const mix = (b, t0, fn, len, gain = 1, pan = 0) => {
  const s0 = Math.round(t0 * SR);
  const n = Math.round(len * SR);
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < n; i++) {
    const k = s0 + i;
    if (k < 0) continue;
    if (k >= N) break;
    const v = fn(i / SR, i);
    b[0][k] += v * gl;
    b[1][k] += v * gr;
  }
};

// ---------- DSP pieces ----------
const env = (t, a, d, s, r, len) => {
  if (t < a) return t / a;
  if (t < a + d) return 1 - (1 - s) * ((t - a) / d);
  if (t < len) return s;
  return Math.max(0, s * (1 - (t - len) / r));
};
const decay = (t, k) => Math.exp(-t * k);
const lp = (cut) => {
  let y = 0;
  const a = 1 - Math.exp((-TAU * cut) / SR);
  return (x) => (y += a * (x - y));
};
const hp = (cut) => {
  const l = lp(cut);
  return (x) => x - l(x);
};
const bp = (f, q) => {
  // RBJ band-pass biquad
  const w = (TAU * f) / SR;
  const al = Math.sin(w) / (2 * q);
  const b0 = al, b2 = -al, a0 = 1 + al, a1 = -2 * Math.cos(w), a2 = 1 - al;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x) => {
    const y = (b0 * x + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
};
const saw = (ph) => 2 * (ph - Math.floor(ph + 0.5));
const sq = (ph, duty = 0.5) => (ph - Math.floor(ph) < duty ? 1 : -1);
const tri = (ph) => 1 - 4 * Math.abs(ph - Math.floor(ph + 0.5));
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

// ---------- instruments: each returns a sample function f(t) and its length ----------
const karplus = (freq, len, bright = 0.5, damp = 0.996) => {
  const p = Math.max(2, Math.round(SR / freq));
  const line = new Float32Array(p);
  for (let i = 0; i < p; i++) line[i] = noise();
  let idx = 0;
  let last = 0;
  return () => {
    const v = line[idx];
    const nv = damp * (bright * v + (1 - bright) * last);
    last = v;
    line[idx] = nv;
    idx = (idx + 1) % p;
    return v;
  };
};

const INST = {
  pad: (f, len) => {
    const l = lp(1400);
    const d = [0, 0.004, -0.005];
    return { len: len + 0.8, fn: (t) => l(d.reduce((s, x) => s + saw(f * (1 + x) * t), 0) / 3) * env(t, 0.5, 0.3, 0.8, 0.8, len) * 0.5 };
  },
  strings: (f, len) => {
    const l = lp(2200);
    return { len: len + 0.6, fn: (t) => l(saw(f * t * (1 + 0.003 * Math.sin(TAU * 5.5 * t))) + 0.5 * saw(f * 1.003 * t)) * env(t, 0.35, 0.2, 0.85, 0.6, len) * 0.4 };
  },
  drone: (f, len) => ({ len: len + 1.5, fn: (t) => (Math.sin(TAU * f * t) + 0.5 * Math.sin(TAU * f * 2.001 * t) + 0.25 * Math.sin(TAU * f * 3 * t)) * (0.8 + 0.2 * Math.sin(TAU * 0.2 * t)) * env(t, 1.2, 0.5, 0.9, 1.5, len) * 0.35 }),
  organ: (f, len) => ({ len: len + 0.1, fn: (t) => (Math.sin(TAU * f * t) + 0.6 * Math.sin(TAU * 2 * f * t) + 0.3 * Math.sin(TAU * 4 * f * t)) * env(t, 0.02, 0.05, 0.9, 0.1, len) * 0.3 }),
  pluck: (f, len) => {
    const k = karplus(f, len, 0.5, 0.996);
    return { len: Math.max(len, 1.2), fn: () => k() * 0.6 };
  },
  koto: (f, len) => {
    const k = karplus(f, len, 0.8, 0.997);
    return { len: Math.max(len, 1.6), fn: (t) => k() * 0.6 * (1 + 0.02 * Math.sin(TAU * 6 * t)) };
  },
  harp: (f, len) => {
    const k = karplus(f, len, 0.35, 0.998);
    return { len: Math.max(len, 2), fn: () => k() * 0.55 };
  },
  musicbox: (f) => ({ len: 1.6, fn: (t) => (Math.sin(TAU * f * t) + 0.35 * Math.sin(TAU * f * 4.02 * t) * decay(t, 9) + 0.15 * Math.sin(TAU * f * 6.1 * t) * decay(t, 14)) * decay(t, 2.6) * 0.45 }),
  marimba: (f) => ({ len: 0.9, fn: (t) => (Math.sin(TAU * f * t) + 0.4 * Math.sin(TAU * f * 3.93 * t) * decay(t, 18)) * decay(t, 5.5) * Math.min(1, t * 400) * 0.6 }),
  bell: (f) => ({ len: 3, fn: (t) => (Math.sin(TAU * f * t) + 0.6 * Math.sin(TAU * f * 2.76 * t) * decay(t, 1.5) + 0.4 * Math.sin(TAU * f * 5.4 * t) * decay(t, 3)) * decay(t, 1.1) * 0.35 }),
  piano: (f, len) => ({ len: Math.max(len, 1.4) + 0.3, fn: (t) => [1, 0.5, 0.28, 0.14, 0.07].reduce((s, a, i) => s + a * Math.sin(TAU * f * (i + 1) * (1 + 0.0004 * i * i) * t) * decay(t, 1.4 + i * 0.9), 0) * Math.min(1, t * 300) * env(t, 0.002, 0, 1, 0.3, Math.max(len, 1.4)) * 0.4 }),
  chip: (f, len) => ({ len: len + 0.05, fn: (t) => sq(f * t, 0.25) * env(t, 0.003, 0.08, 0.6, 0.05, len) * 0.22 }),
  arp: (f, len) => {
    const l = lp(2600);
    return { len: len + 0.1, fn: (t) => l(saw(f * t) * 0.6 + sq(f * 0.5 * t) * 0.3) * env(t, 0.004, 0.12, 0.3, 0.1, len) * 0.4 };
  },
  bass: (f, len) => {
    const l = lp(500);
    return { len: len + 0.1, fn: (t) => l(Math.sin(TAU * f * t) * 0.8 + saw(f * t) * 0.35) * env(t, 0.005, 0.15, 0.7, 0.1, len) * 0.7 };
  },
  flute: (f, len) => {
    const b = bp(f * 2, 4);
    return { len: len + 0.2, fn: (t) => (Math.sin(TAU * f * t * (1 + 0.004 * Math.sin(TAU * 5 * t))) + 0.15 * b(noise())) * env(t, 0.08, 0.1, 0.85, 0.2, len) * 0.35 };
  },
};

// ---------- drum voices ----------
const DRUM = {
  kick: (t) => Math.sin(TAU * (50 * t + 90 * (1 - Math.exp(-t * 30)) / 30)) * decay(t, 9),
  softkick: (t) => Math.sin(TAU * (45 * t + 40 * (1 - Math.exp(-t * 25)) / 25)) * decay(t, 12) * 0.8,
  hat: (() => { const h = hp(7000); return (t) => h(noise()) * decay(t, 60) * 0.5; })(),
  shaker: (() => { const h = bp(6000, 1.2); return (t) => h(noise()) * Math.sin(Math.PI * Math.min(1, t / 0.06)) * 0.6; })(),
  clap: (() => { const b = bp(1500, 1); return (t) => b(noise()) * (decay(t, 25) + 0.5 * decay(Math.max(0, t - 0.012), 30)) * 1.2; })(),
  snare: (() => { const b = bp(1800, 0.8); return (t) => (b(noise()) * 0.9 + Math.sin(TAU * 190 * t) * 0.4) * decay(t, 18); })(),
  taiko: (t) => (Math.sin(TAU * (70 * t + 40 * (1 - Math.exp(-t * 12)) / 12)) * decay(t, 4.5) + noise() * 0.15 * decay(t, 40)) * 1.1,
  rim: (t) => (Math.sin(TAU * 1700 * t) * 0.5 + noise() * 0.3) * decay(t, 70),
  woodblock: (t) => Math.sin(TAU * 820 * t) * decay(t, 40) * 0.8,
  lowdrum: (t) => Math.sin(TAU * (60 * t + 30 * (1 - Math.exp(-t * 10)) / 10)) * decay(t, 6),
  chipkick: (t) => sq((60 + 200 * Math.exp(-t * 40)) * t) * decay(t, 14) * 0.4,
  chiphat: (t) => (rand() > 0.5 ? 1 : -1) * decay(t, 50) * 0.25,
};
// Patterns over 16 steps per bar: [voice, steps]
const KITS = {
  soft: [["softkick", [0, 8]], ["shaker", [2, 6, 10, 14]]],
  synth: [["kick", [0, 4, 8, 12]], ["hat", [2, 6, 10, 14]], ["clap", [4, 12]]],
  lofi: [["kick", [0, 7, 10]], ["snare", [4, 12]], ["hat", [0, 2, 4, 6, 8, 10, 12, 14]]],
  taiko: [["taiko", [0, 6, 8]], ["rim", [4, 12, 14]]],
  wood: [["lowdrum", [0, 8]], ["woodblock", [3, 6, 11, 14]]],
  chip: [["chipkick", [0, 8]], ["chiphat", [4, 12]], ["chiphat", [2, 6, 10, 14]]],
};

// ---------- scales and chords ----------
const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11], mixolydian: [0, 2, 4, 5, 7, 9, 10],
  major_pentatonic: [0, 2, 4, 7, 9], minor_pentatonic: [0, 3, 5, 7, 10], in_sen: [0, 1, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10], chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};
const NOTE = { C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11 };

const m = score.music;
if (m) {
  const bpm = m.bpm ?? 100;
  const beat = 60 / bpm;
  const bar = beat * 4;
  const step = bar / 16;
  const key = NOTE[m.key ?? "C"] ?? 0;
  const sc = SCALES[m.scale ?? "major"] ?? SCALES.major;
  const degrees = m.chords ?? [1];
  const deg = (d, oct) => {
    const i = d - 1;
    const o = Math.floor(i / sc.length);
    return 12 * (oct + 1) + key + sc[((i % sc.length) + sc.length) % sc.length] + 12 * o;
  };
  // A chord is three scale tones stacked in thirds (every other scale step).
  const chordTones = (d, oct) => [deg(d, oct), deg(d + 2, oct), deg(d + 4, oct)];
  const bars = Math.ceil(DUR / bar);

  for (const layer of m.layers ?? []) {
    const gain = dbg(layer.db ?? -8);
    if (layer.kit) {
      const kit = KITS[layer.kit];
      if (!kit) throw new Error(`unknown kit ${layer.kit}`);
      for (let b = 0; b < bars; b++)
        for (const [voice, steps] of kit)
          for (const s of steps) {
            const t0 = b * bar + s * step + (layer.swing && s % 2 ? step * layer.swing : 0);
            mix(music, t0, DRUM[voice], 0.6, gain * (0.85 + 0.15 * rand()), (rand() - 0.5) * 0.3);
          }
      continue;
    }
    const inst = INST[layer.inst];
    if (!inst) throw new Error(`unknown instrument ${layer.inst}`);
    const oct = layer.octave ?? 4;
    const pan = layer.pan ?? 0;
    const play = (t0, midi, len, g = 1) => {
      const v = inst(mtof(midi), len);
      mix(music, t0, v.fn, v.len, gain * g, pan);
    };
    const part = layer.part ?? "melody";
    if (part === "chord") {
      for (let b = 0; b < bars; b++) chordTones(degrees[b % degrees.length], oct).forEach((n, i) => play(b * bar, n, bar * 0.98, 0.6));
    } else if (part === "root") {
      for (let b = 0; b < bars; b++) for (const q of [0, 2]) play(b * bar + q * beat, deg(degrees[b % degrees.length], oct), beat * 1.8);
    } else if (part === "pulse") {
      for (let b = 0; b < bars; b++) for (let e = 0; e < 8; e++) play(b * bar + e * beat * 0.5, deg(degrees[b % degrees.length], oct), beat * 0.45, e % 2 ? 0.7 : 1);
    } else if (part === "arp") {
      const rate = layer.rate ?? 8;
      for (let b = 0; b < bars; b++) {
        const tones = chordTones(degrees[b % degrees.length], oct);
        const seq = [...tones, tones[0] + 12, tones[2], tones[1]];
        for (let k = 0; k < rate; k++) play(b * bar + (k * bar) / rate, seq[k % seq.length], (bar / rate) * 0.9);
      }
    } else if (part === "melody") {
      // Two-bar phrases built from chord tones and scale steps, repeated with a variation,
      // so the tune sounds composed rather than random.
      const density = layer.density ?? 0.55;
      const phrase = (b0) => {
        const notes = [];
        let d = degrees[b0 % degrees.length] + 2 * Math.floor(rand() * 3);
        for (let s = 0; s < 16; s++) {
          if (s % 2 === 1 && rand() > density * 0.5) continue;
          if (s % 2 === 0 && rand() > density) continue;
          d += [-2, -1, -1, 0, 1, 1, 2][Math.floor(rand() * 7)];
          d = Math.max(1, Math.min(10, d));
          notes.push({ s, d, len: rand() < 0.3 ? 4 : 2 });
        }
        return notes;
      };
      for (let b = 0; b < bars; b += 4) {
        const a = phrase(b);
        const v = phrase(b + 2);
        const play2 = (notes, off) => notes.forEach((n) => play((b + off) * bar + n.s * step * 2, deg(n.d, oct), n.len * step * 2));
        play2(a, 0);
        play2(v, 2);
      }
    } else throw new Error(`unknown part ${part}`);
  }

  // Simple stereo reverb on the music bus (four combs and two all-passes per side).
  const wet = m.reverb ?? 0.18;
  if (wet > 0) {
    for (const [ch, off] of [[0, 0], [1, 23]]) {
      const x = music[ch];
      const out = new Float32Array(N);
      for (const [d, fb] of [[1557, 0.84], [1617, 0.84], [1491, 0.84], [1422, 0.84]]) {
        const len = d + off;
        const buf = new Float32Array(len);
        let i = 0;
        let store = 0;
        for (let n = 0; n < N; n++) {
          const y = buf[i];
          store = y * 0.8 + store * 0.2;
          buf[i] = x[n] + store * fb;
          i = (i + 1) % len;
          out[n] += y * 0.25;
        }
      }
      for (const d of [225 + off, 556 + off]) {
        const buf = new Float32Array(d);
        let i = 0;
        for (let n = 0; n < N; n++) {
          const b = buf[i];
          const y = -out[n] + b;
          buf[i] = out[n] + b * 0.5;
          i = (i + 1) % d;
          out[n] = y;
        }
      }
      for (let n = 0; n < N; n++) x[n] = x[n] * (1 - wet * 0.5) + out[n] * wet;
    }
  }

  // Level automation: sections, then fades.
  const fi = m.fadeIn ?? 0.3;
  const fo = m.fadeOut ?? 1.5;
  const secs = m.sections ?? [];
  let level = 1;
  for (let n = 0; n < N; n++) {
    const t = n / SR;
    let target = 1;
    for (const s of secs) if (t >= s.from && t < s.to) target = s.level;
    level += (target - level) * 0.0008; // about 25 ms smoothing
    const fade = Math.min(1, t / fi, (DUR - t) / fo);
    music[0][n] *= level * Math.max(0, fade);
    music[1][n] *= level * Math.max(0, fade);
  }
}

// ---------- sound effects ----------
const FX = {
  tick: () => ({ len: 0.05, fn: (t) => Math.sin(TAU * 3200 * t) * decay(t, 120) * 0.6 }),
  click: () => { const h = hp(2000); return { len: 0.04, fn: (t) => h(noise()) * decay(t, 200) }; },
  pop: () => ({ len: 0.15, fn: (t) => Math.sin(TAU * (300 * t + 900 * (1 - Math.exp(-t * 40)) / 40)) * decay(t, 30) * 0.8 }),
  plastic: () => { const b = bp(2600, 3); return { len: 0.08, fn: (t) => (b(noise()) * 2 + Math.sin(TAU * 1800 * t) * 0.4) * decay(t, 70) }; },
  paper: (d = 0.35) => { const b = bp(3500, 0.7); return { len: d, fn: (t) => b(noise()) * Math.pow(Math.sin(Math.PI * Math.min(1, t / d)), 0.6) * (0.6 + 0.4 * Math.sin(TAU * 31 * t)) * 1.4 }; },
  whoosh: (d = 0.6) => { return { len: d, fn: (() => { const p = d; const states = [0, 0]; return (t) => { const f = 400 + 3000 * Math.sin(Math.PI * Math.min(1, t / p)); const a = 1 - Math.exp((-TAU * f) / SR); states[0] += a * (noise() - states[0]); return states[0] * Math.sin(Math.PI * Math.min(1, t / p)) * 1.2; }; })() }; },
  riser: (d = 1.5) => ({ len: d, fn: (t) => (saw((200 + 800 * (t / d) ** 2) * t) * 0.2 + noise() * 0.15 * (t / d)) * (t / d) ** 1.5 }),
  swell: (d = 2) => { const l = lp(900); return { len: d, fn: (t) => l(saw(110 * t) + saw(165.3 * t) + saw(220.5 * t)) * Math.sin(Math.PI * Math.min(1, t / d)) * 0.4 }; },
  shimmer: () => ({ len: 1.4, fn: (t) => [2093, 2637, 3136, 4186].reduce((s, f, i) => s + Math.sin(TAU * f * t) * decay(Math.max(0, t - i * 0.05), 3.2) * (t > i * 0.05 ? 1 : 0), 0) * 0.18 }),
  chime: () => ({ len: 2.5, fn: (t) => (Math.sin(TAU * 1318 * t) + 0.5 * Math.sin(TAU * 1318 * 2.76 * t) * decay(t, 3)) * decay(t, 1.6) * 0.35 }),
  scratch: () => { const b = bp(1200, 2); return { len: 0.45, fn: (t) => b(noise() + saw((300 + 900 * Math.sin(TAU * 4.5 * t)) * t)) * Math.sin(Math.PI * Math.min(1, t / 0.45)) * 1.4 }; },
  stab: () => { const l = lp(1800); return { len: 0.7, fn: (t) => l(saw(55 * t) + saw(82.4 * t) + saw(110.7 * t)) * decay(t, 4) * 0.5 }; },
  hit: () => ({ len: 0.5, fn: (t) => (Math.sin(TAU * (60 * t + 100 * (1 - Math.exp(-t * 20)) / 20)) + noise() * decay(t, 30) * 0.4) * decay(t, 7) }),
  drum: () => ({ len: 1.5, fn: (t) => (Math.sin(TAU * (45 * t + 30 * (1 - Math.exp(-t * 8)) / 8)) + noise() * 0.1 * decay(t, 25)) * decay(t, 3) }),
  boom: () => { const l = lp(200); return { len: 2.5, fn: (t) => (l(noise()) * 3 + Math.sin(TAU * 38 * t)) * decay(t, 1.8) * 0.8 }; },
  stamp: () => ({ len: 0.3, fn: (t) => (Math.sin(TAU * 140 * t) * 0.8 + noise() * 0.5 * decay(t, 50)) * decay(t, 16) }),
  typewriter: () => { const h = hp(1500); return { len: 0.06, fn: (t) => (h(noise()) + Math.sin(TAU * 2200 * t) * 0.3) * decay(t, 90) }; },
  zap: () => ({ len: 0.35, fn: (t) => sq((1800 * Math.exp(-t * 9)) * t) * decay(t, 8) * 0.3 }),
  thud: () => { const l = lp(300); return { len: 0.4, fn: (t) => (Math.sin(TAU * 70 * t) + l(noise())) * decay(t, 12) }; },
  firework: () => { const l = lp(1500); return { len: 2.2, fn: (t) => (t < 0.08 ? noise() * 1.2 : l(noise()) * (rand() > 0.995 ? 3 : 0.2)) * decay(t, 2.2) }; },
  wind: (d = 4) => { const b = bp(500, 0.6); return { len: d, fn: (t) => b(noise()) * (0.6 + 0.4 * Math.sin(TAU * 0.3 * t)) * Math.sin(Math.PI * Math.min(1, t / d)) * 1.5 }; },
  rain: (d = 4) => { const h = hp(1200); const l = lp(6000); return { len: d, fn: (t) => (l(h(noise())) * 0.5 + (rand() > 0.9985 ? 0.6 : 0)) * Math.min(1, t / 0.5, (d - t) / 0.5) }; },
  engine: (d = 3) => { const l = lp(700); return { len: d, fn: (t) => l(saw(48 * t) + saw(96.5 * t) * 0.5 + noise() * 0.3) * Math.min(1, t / 0.3, (d - t) / 0.4) * 0.8 }; },
  water: (d = 3) => { const b = bp(900, 1.5); return { len: d, fn: (t) => b(noise()) * (0.5 + 0.5 * Math.sin(TAU * 0.7 * t + Math.sin(TAU * 1.9 * t))) * Math.min(1, t / 0.4, (d - t) / 0.4) * 1.2 }; },
};

const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}']+/gu, "");
const wordTime = (e) => {
  const hits = words.filter((w) => norm(w.text) === norm(e.word) && (e.beat === undefined || w.beat === e.beat));
  const hit = hits[e.nth ?? 0];
  if (!hit) throw new Error(`sfx: word "${e.word}" not found in words.json`);
  return hit.start;
};

let fxCount = 0;
for (const e of score.sfx ?? []) {
  const make = FX[e.type];
  if (!make) throw new Error(`unknown sfx type ${e.type}`);
  const base = e.word ? wordTime(e) : e.at ?? 0;
  const times = e.every ? [] : [base + (e.offset ?? 0)];
  if (e.every) for (let t = e.from ?? base; t < (e.to ?? base + 1); t += e.every) times.push(t);
  for (const t of times) {
    const v = make(e.dur);
    mix(sfx, t, v.fn, v.len, dbg(e.db ?? 0), e.pan ?? 0);
    fxCount++;
  }
}

// ---------- write ----------
const peakNorm = (b, target = 0.89) => {
  let pk = 0;
  for (const ch of b) for (let i = 0; i < N; i++) pk = Math.max(pk, Math.abs(ch[i]));
  if (pk > 0) for (const ch of b) for (let i = 0; i < N; i++) ch[i] *= target / pk;
  return pk;
};
// Music is levelled by loudness, not peak: RMS -18 dBFS, the same reference narrate.mjs
// uses for the voice, so "musicDb": -20 really sits 20 dB under the voice. A soft knee
// keeps the peaks under -1 dBFS.
const rmsNorm = (b, targetDb = -18) => {
  let sum = 0;
  for (const ch of b) for (let i = 0; i < N; i++) sum += ch[i] * ch[i];
  const rms = Math.sqrt(sum / (2 * N));
  if (!(rms > 0)) return 0;
  const g = dbg(targetDb) / rms;
  const knee = 0.7;
  const ceil = 0.89;
  for (const ch of b)
    for (let i = 0; i < N; i++) {
      const x = ch[i] * g;
      const a = Math.abs(x);
      ch[i] = a <= knee ? x : Math.sign(x) * (knee + (ceil - knee) * Math.tanh((a - knee) / (ceil - knee)));
    }
  return rms;
};
const writeWav = (file, b) => {
  const out = Buffer.alloc(44 + N * 4);
  out.write("RIFF", 0); out.writeUInt32LE(36 + N * 4, 4); out.write("WAVE", 8);
  out.write("fmt ", 12); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22);
  out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34);
  out.write("data", 36); out.writeUInt32LE(N * 4, 40);
  for (let i = 0; i < N; i++)
    for (let c = 0; c < 2; c++) out.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(b[c][i] * 32767))), 44 + i * 4 + c * 2);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, out);
};

const dir = path.join(root, "public/audio", style);
const flags = {};
if (m && rmsNorm(music) > 0) {
  writeWav(path.join(dir, "music.wav"), music);
  flags.music = true;
}
if (fxCount && peakNorm(sfx) > 0) {
  writeWav(path.join(dir, "sfx.wav"), sfx);
  flags.sfx = true;
}
proj.audio = { ...(proj.audio ?? {}), [style]: flags };
fs.writeFileSync(projPath, JSON.stringify(proj, null, 2) + "\n");
console.log(JSON.stringify({ style, seconds: +DUR.toFixed(2), music: !!flags.music, sfx: fxCount, dir }, null, 2));
