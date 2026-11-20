#!/usr/bin/env node
// Narration, word timings and caption pages from script.json.
//
//   node tools/narrate.mjs                 # Kokoro voice + whisper.cpp word timings
//   node tools/narrate.mjs --estimate      # skip whisper; estimate word times from text
//   node tools/narrate.mjs --list-voices
//   node tools/narrate.mjs --silent        # no voice: beats from each line's "seconds"
//
// script.json (project root):
//   { "voice": "af_heart", "speed": 1.0, "gap": 0.25,
//     "lines": [ { "say": "About twenty million men...", "show": "About 20 million men..." } ] }
// "say" is what the voice reads (numbers as words); "show" is what the captions print (digits).
//
// Writes public/audio/narration.wav, src/data/{beats,words,captions}.json and sets
// durationInFrames in src/data/project.json. Whisper and its model are cached in
// $EXPLAINER_WHISPER_DIR (default ~/.cache/explainer-video/whisper) and shared by projects.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const VOICES = ["af_heart", "af_bella", "af_nicole", "af_sarah", "af_sky", "am_michael", "am_adam", "am_fenrir", "am_puck", "bf_emma", "bf_isabella", "bm_george", "bm_lewis", "bm_fable"];

if (flag("list-voices")) {
  console.log(VOICES.join("\n"));
  process.exit(0);
}

const scriptPath = path.join(root, "script.json");
if (!fs.existsSync(scriptPath)) {
  console.error(`missing ${scriptPath}; write the script first (see references/script.md)`);
  process.exit(2);
}
const script = JSON.parse(fs.readFileSync(scriptPath, "utf8"));
const lines = script.lines ?? [];
if (!lines.length || lines.some((l) => !l.say)) {
  console.error("script.json needs lines: [{ say, show }], each with a non-empty say");
  process.exit(2);
}
const voice = script.voice ?? "af_heart";
const speed = script.speed ?? 1.0;
const gap = script.gap ?? 0.25;
const TAIL = script.tail ?? 1.2;

const projPath = path.join(root, "src/data/project.json");
const proj = JSON.parse(fs.readFileSync(projPath, "utf8"));
const fps = proj.fps;

// --silent: no voice. Each line needs "seconds"; beats are laid end to end, and there
// are no words or captions, so key events to beats and frames instead of words.
if (flag("silent")) {
  if (lines.some((l) => !(l.seconds > 0))) {
    console.error("--silent needs a positive seconds value on every line");
    process.exit(2);
  }
  let t = 0;
  const beats = lines.map((l, i) => {
    const b = { index: i, say: l.say, show: l.show ?? l.say, start: +t.toFixed(3), end: +(t + l.seconds).toFixed(3) };
    t += l.seconds;
    return b;
  });
  const data = path.join(root, "src/data");
  fs.writeFileSync(path.join(data, "beats.json"), JSON.stringify(beats, null, 1) + "\n");
  fs.writeFileSync(path.join(data, "words.json"), "[]\n");
  fs.writeFileSync(path.join(data, "captions.json"), "[]\n");
  Object.assign(proj, { durationInFrames: Math.ceil(t * fps), narration: false, captions: false });
  fs.writeFileSync(projPath, JSON.stringify(proj, null, 2) + "\n");
  console.log(JSON.stringify({ seconds: t, frames: proj.durationInFrames, lines: lines.length, narration: false }, null, 2));
  process.exit(0);
}

// ---------- 1. Voice ----------
// Keep the voice model in one shared cache instead of inside each project's node_modules.
const { env } = await import("@huggingface/transformers");
env.cacheDir = process.env.EXPLAINER_MODEL_DIR ?? path.join(os.homedir(), ".cache/explainer-video/models");
const { KokoroTTS } = await import("kokoro-js");
console.log(`loading Kokoro (first run downloads about 90 MB to ${env.cacheDir})...`);
const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { dtype: "q8", device: "cpu" });

// Trim leading/trailing near-silence so line boundaries are tight.
const trim = (pcm, sr) => {
  const th = 0.004;
  let a = 0;
  let b = pcm.length - 1;
  while (a < b && Math.abs(pcm[a]) < th) a++;
  while (b > a && Math.abs(pcm[b]) < th) b--;
  const pad = Math.round(0.03 * sr);
  return pcm.subarray(Math.max(0, a - pad), Math.min(pcm.length, b + pad));
};

let sr = 24000;
const chunks = [];
const ranges = [];
let cursor = 0.15; // a breath before the first word
for (const [i, line] of lines.entries()) {
  const out = await tts.generate(line.say, { voice, speed });
  sr = out.sampling_rate;
  const pcm = trim(out.audio, sr);
  const dur = pcm.length / sr;
  ranges.push({ start: cursor, end: cursor + dur });
  chunks.push({ at: cursor, pcm });
  cursor += dur + (line.pause ?? gap);
  console.log(`line ${i}: ${dur.toFixed(2)} s`);
}
const total = cursor - gap + TAIL;
const buf = new Float32Array(Math.ceil(total * sr));
for (const c of chunks) buf.set(c.pcm, Math.round(c.at * sr));

const writeWav = (file, data, rate) => {
  const b = Buffer.alloc(44 + data.length * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + data.length * 2, 4); b.write("WAVE", 8);
  b.write("fmt ", 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write("data", 36); b.writeUInt32LE(data.length * 2, 40);
  for (let i = 0; i < data.length; i++) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(data[i] * 32767))), 44 + i * 2);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, b);
};
// Level the voice to RMS -18 dBFS over speech (samples above a floor), the reference the
// music level is set against; a soft knee keeps peaks under -1 dBFS.
{
  let sum = 0;
  let n = 0;
  for (const x of buf) if (Math.abs(x) > 0.01) { sum += x * x; n++; }
  const rms = n ? Math.sqrt(sum / n) : 0;
  if (rms > 0) {
    const g = Math.pow(10, -18 / 20) / rms;
    for (let i = 0; i < buf.length; i++) {
      const x = buf[i] * g;
      const a = Math.abs(x);
      buf[i] = a <= 0.7 ? x : Math.sign(x) * (0.7 + 0.19 * Math.tanh((a - 0.7) / 0.19));
    }
  }
}
const narrationPath = path.join(root, "public/audio/narration.wav");
writeWav(narrationPath, buf, sr);
console.log(`wrote ${narrationPath} (${total.toFixed(2)} s)`);

// ---------- 2. Word timings ----------
const tokens = (s) => s.split(/\s+/).filter(Boolean);
const estimateWords = () => {
  const out = [];
  lines.forEach((line, bi) => {
    const toks = tokens(line.say);
    const weights = toks.map((t) => 0.6 + t.replace(/[^\p{L}\p{N}]/gu, "").length);
    const sum = weights.reduce((a, b) => a + b, 0);
    let t = ranges[bi].start;
    const span = ranges[bi].end - ranges[bi].start;
    toks.forEach((tok, k) => {
      const d = (weights[k] / sum) * span;
      out.push({ text: tok, start: +t.toFixed(3), end: +(t + d).toFixed(3), beat: bi });
      t += d;
    });
  });
  return out;
};

let words = null;
let timing = "estimate";
if (!flag("estimate")) {
  try {
    const w = await import("@remotion/install-whisper-cpp");
    const dir = process.env.EXPLAINER_WHISPER_DIR ?? path.join(os.homedir(), ".cache/explainer-video/whisper");
    const version = "1.5.5";
    const model = process.env.EXPLAINER_WHISPER_MODEL ?? "base.en";
    await w.installWhisperCpp({ to: dir, version, printOutput: false });
    await w.downloadWhisperModel({ model, folder: dir, printOutput: false });
    const wav16 = path.join(root, ".cache/narration-16k.wav");
    fs.mkdirSync(path.dirname(wav16), { recursive: true });
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", narrationPath, "-ar", "16000", "-ac", "1", wav16]);
    const res = await w.transcribe({ inputPath: wav16, whisperPath: dir, whisperCppVersion: version, model, tokenLevelTimestamps: true, printOutput: false });
    const { captions } = w.toCaptions({ whisperCppOutput: res });
    // Whisper tokens are word pieces ("oct", "opus") plus punctuation and [BLANK_AUDIO]
    // markers. Flatten them to a stream of letters with times, then align the script's own
    // words to that stream. words.json then holds exactly the script words.
    const normc = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
    const stream = [];
    let inTag = false;
    for (const c of captions) {
      const text = c.text;
      if (text.includes("[")) inTag = true;
      if (!inTag) for (const ch of normc(text)) stream.push({ ch, start: c.startMs / 1000, end: c.endMs / 1000 });
      if (text.includes("]")) inTag = false;
    }
    const aligned = [];
    let p = 0;
    let missed = 0;
    lines.forEach((l, bi) => {
      for (const tok of tokens(l.say)) {
        const n = normc(tok);
        let hit = -1;
        for (let q = p; n && q <= Math.min(stream.length - n.length, p + 80); q++) {
          let ok = true;
          for (let k = 0; k < n.length && ok; k++) ok = stream[q + k].ch === n[k];
          if (ok) { hit = q; break; }
        }
        if (hit >= 0) {
          aligned.push({ text: tok, start: stream[hit].start, end: stream[hit + n.length - 1].end, beat: bi });
          p = hit + n.length;
        } else {
          aligned.push({ text: tok, start: null, end: null, beat: bi });
          missed++;
        }
      }
    });
    const total = aligned.length;
    if (missed > total * 0.3) throw new Error(`could align only ${total - missed} of ${total} script words to the audio`);
    // Words whisper wrote differently ("3" for "three") get times interpolated from neighbours.
    aligned.forEach((x, i) => {
      if (x.start !== null) return;
      const prev = aligned.slice(0, i).reverse().find((y) => y.start !== null);
      const next = aligned.slice(i + 1).find((y) => y.start !== null);
      const a = prev ? prev.end : ranges[x.beat].start;
      const b = next ? next.start : ranges[x.beat].end;
      x.start = a;
      x.end = Math.max(a, b);
    });
    // Keep each word inside its own line's audio.
    words = aligned.map((x) => {
      const r = ranges[x.beat];
      const s = Math.min(Math.max(x.start, r.start), r.end);
      const e = Math.min(Math.max(x.end, s), r.end);
      return { text: x.text, start: +s.toFixed(3), end: +e.toFixed(3), beat: x.beat };
    });
    if (missed) console.warn(`note: ${missed} of ${total} words were interpolated (whisper spelled them differently)`);
    timing = `whisper ${model}`;
  } catch (e) {
    console.warn(`whisper timings unavailable (${e.message ?? e}); falling back to estimated word times`);
    words = null;
  }
}
if (!words) words = estimateWords();

// ---------- 3. Beats and caption pages ----------
const beats = lines.map((l, i) => ({
  index: i,
  say: l.say,
  show: l.show ?? l.say,
  start: +(i === 0 ? 0 : ranges[i].start).toFixed(3),
  end: +(i < lines.length - 1 ? ranges[i + 1].start : total).toFixed(3),
}));

const maxWords = script.captionWords ?? 3;
const captions = [];
lines.forEach((l, bi) => {
  const show = tokens(l.show ?? l.say);
  const heard = words.filter((w) => w.beat === bi);
  if (!heard.length) return;
  // Map shown token k onto the heard word at the same relative position in the line.
  const tokTimes = show.map((text, k) => {
    const j = show.length === 1 ? 0 : Math.round((k * (heard.length - 1)) / (show.length - 1));
    return { text, start: heard[j].start, end: heard[j].end };
  });
  // Pages of up to maxWords, breaking early after punctuation.
  let page = [];
  const flush = () => {
    if (page.length) captions.push({ start: page[0].start, end: 0, tokens: page });
    page = [];
  };
  for (const tok of tokTimes) {
    page.push(tok);
    if (page.length >= maxWords || /[.,;:!?]$/.test(tok.text)) flush();
  }
  flush();
});
captions.forEach((p, i) => {
  const next = captions[i + 1];
  const lastEnd = p.tokens[p.tokens.length - 1].end + 0.25;
  p.end = +(next ? Math.min(next.start, Math.max(lastEnd, p.start + 0.4)) : lastEnd).toFixed(3);
});

const data = path.join(root, "src/data");
fs.writeFileSync(path.join(data, "beats.json"), JSON.stringify(beats, null, 1) + "\n");
fs.writeFileSync(path.join(data, "words.json"), JSON.stringify(words, null, 1) + "\n");
fs.writeFileSync(path.join(data, "captions.json"), JSON.stringify(captions, null, 1) + "\n");
proj.durationInFrames = Math.ceil(total * fps);
proj.narration = true;
fs.writeFileSync(projPath, JSON.stringify(proj, null, 2) + "\n");

console.log(JSON.stringify({ seconds: +total.toFixed(2), frames: proj.durationInFrames, lines: lines.length, words: words.length, pages: captions.length, timing, voice }, null, 2));
