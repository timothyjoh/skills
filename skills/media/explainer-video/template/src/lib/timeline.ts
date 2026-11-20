import project from "../data/project.json";
import beatsData from "../data/beats.json";
import wordsData from "../data/words.json";

// Everything in a film is keyed to this timeline. Times in the JSON files are seconds;
// every helper here returns frames, so scene code can compare against useCurrentFrame().

export type Beat = { index: number; say: string; show: string; start: number; end: number };
export type Word = { text: string; start: number; end: number; beat: number };

export const FPS = project.fps;
export const beats = beatsData as Beat[];
export const words = wordsData as Word[];

/** Seconds to frames. */
export const sec = (s: number) => Math.round(s * FPS);

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}']+/gu, "");

/** Start and end frame of beat i. */
export const beatRange = (i: number) => {
  const b = beats[i];
  if (!b) throw new Error(`timeline: no beat ${i} (have ${beats.length})`);
  return { from: sec(b.start), to: sec(b.end), dur: sec(b.end) - sec(b.start) };
};

/** The beat playing at a frame, with frames since its start and 0..1 progress through it. */
export const beatAt = (frame: number) => {
  let index = 0;
  for (let i = 0; i < beats.length; i++) if (frame >= sec(beats[i].start)) index = i;
  const { from, dur } = beatRange(index);
  const local = frame - from;
  return { index, local, progress: dur > 0 ? Math.min(1, Math.max(0, local / dur)) : 0 };
};

/**
 * Frame at which a spoken word starts. Key every event, cut and sound to this.
 * `beat` limits the search to one line of the script; `nth` picks a later repeat.
 * Throws when the word is missing, so a typo fails the render instead of drifting.
 */
export const at = (word: string, opts: { beat?: number; nth?: number } = {}) => {
  const target = norm(word);
  const hits = words.filter((w) => norm(w.text) === target && (opts.beat === undefined || w.beat === opts.beat));
  const hit = hits[opts.nth ?? 0];
  if (!hit) {
    const scope = opts.beat === undefined ? "" : ` in beat ${opts.beat}`;
    throw new Error(`timeline: word "${word}"${scope} not found in words.json`);
  }
  return sec(hit.start);
};

/** Frame at which a word ends (same lookup rules as at()). */
export const atEnd = (word: string, opts: { beat?: number; nth?: number } = {}) => {
  const target = norm(word);
  const hits = words.filter((w) => norm(w.text) === target && (opts.beat === undefined || w.beat === opts.beat));
  const hit = hits[opts.nth ?? 0];
  if (!hit) throw new Error(`timeline: word "${word}" not found in words.json`);
  return sec(hit.end);
};
