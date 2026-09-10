#!/usr/bin/env node
/**
 * cts_fetch.js: fetch timestamped transcripts for the videos in <kb-dir>/scope.json.
 *
 * Sequential, rate-limited yt-dlp calls (one IP, one process: parallel fetches
 * from the same machine get 429'd). Idempotent: already-fetched and
 * no-caption videos are skipped unless --retry-failed. Writes:
 *
 *   <kb-dir>/raw/<id>.md          OKF raw-transcript page, **[h:mm:ss]** paragraphs
 *   <kb-dir>/raw/manifest.json    per-video status: fetched | no-captions | failed
 *
 * @usage
 *   node cts_fetch.js --kb-dir .claude/kb/<slug> [--delay 4] [--limit N] [--retry-failed]
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const YTDLP = fs.existsSync('/opt/homebrew/bin/yt-dlp') ? '/opt/homebrew/bin/yt-dlp' : 'yt-dlp';

function parseArgs(argv) {
  const a = { delay: 4, limit: 0, retryFailed: false };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--kb-dir') a.kbDir = argv[++i];
    else if (t === '--delay') a.delay = parseFloat(argv[++i]);
    else if (t === '--limit') a.limit = parseInt(argv[++i], 10);
    else if (t === '--retry-failed') a.retryFailed = true;
  }
  if (!a.kbDir) { console.error('usage: cts_fetch.js --kb-dir <dir> [--delay S] [--limit N] [--retry-failed]'); process.exit(2); }
  return a;
}

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const ts = (s) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = Math.floor(s % 60); return `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`; };
const yq = (s) => `"${String(s ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ')}"`;
const isoDate = (ud) => (ud && ud.length === 8 ? `${ud.slice(0, 4)}-${ud.slice(4, 6)}-${ud.slice(6, 8)}` : '');

function vttCues(vtt) {
  // Returns [{start, text}] with rolling auto-sub duplicates removed.
  const cues = [];
  let prev = '';
  const blocks = vtt.replace(/\r/g, '').split(/\n\n+/);
  for (const b of blocks) {
    const lines = b.split('\n');
    const ti = lines.findIndex((l) => l.includes('-->'));
    if (ti < 0) continue;
    const m = lines[ti].match(/(\d+):(\d+):(\d+)\.(\d+)|(\d+):(\d+)\.(\d+)/);
    if (!m) continue;
    const start = m[1] != null ? (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) : (+m[5]) * 60 + (+m[6]);
    for (const raw of lines.slice(ti + 1)) {
      const line = raw.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').trim();
      if (!line || /^\[(Music|Applause|Laughter)\]$/i.test(line) || line === prev) continue;
      cues.push({ start, text: line });
      prev = line;
    }
  }
  return cues;
}

function paragraphs(cues, targetWords = 60) {
  const out = [];
  let buf = [], start = null, wc = 0;
  for (const c of cues) {
    if (start == null) start = c.start;
    buf.push(c.text); wc += c.text.split(/\s+/).length;
    if (wc >= targetWords) { out.push({ start, text: buf.join(' ') }); buf = []; start = null; wc = 0; }
  }
  if (buf.length) out.push({ start, text: buf.join(' ') });
  return out;
}

function findVtt(dir, id) {
  const vtts = fs.readdirSync(dir).filter((f) => f.startsWith(id) && f.endsWith('.vtt'));
  vtts.sort((a, b) => a.includes('orig') - b.includes('orig') || a.length - b.length); // manual > auto
  return vtts.length ? path.join(dir, vtts[0]) : null;
}

const args = parseArgs(process.argv.slice(2));
const scopePath = path.join(args.kbDir, 'scope.json');
if (!fs.existsSync(scopePath)) { console.error(`missing ${scopePath}`); process.exit(2); }
const scope = JSON.parse(fs.readFileSync(scopePath, 'utf8'));
const rawDir = path.join(args.kbDir, 'raw');
fs.mkdirSync(rawDir, { recursive: true });
const manPath = path.join(rawDir, 'manifest.json');
const manifest = fs.existsSync(manPath) ? JSON.parse(fs.readFileSync(manPath, 'utf8')) : { channel: scope.channel, slug: scope.slug, videos: {} };
manifest.channel = manifest.channel || scope.channel;
manifest.slug = manifest.slug || scope.slug;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cts-subs-'));
const today = new Date().toISOString().slice(0, 10);

const counts = { fetched: 0, no_captions: 0, failed: 0, already: 0 };
let done = 0;
const queue = scope.videos.filter((v) => {
  const s = manifest.videos[v.id]?.status;
  if (s === 'fetched') { counts.already++; return false; }
  if ((s === 'no-captions' || s === 'failed') && !args.retryFailed) { counts.already++; return false; }
  return true;
});
console.error(`${queue.length} to fetch, ${counts.already} already handled`);

for (const v of queue) {
  if (args.limit && done >= args.limit) break;
  done++;
  const url = `https://www.youtube.com/watch?v=${v.id}`;
  process.stderr.write(`[${done}/${args.limit || queue.length}] ${v.title} ... `);
  const r = spawnSync(YTDLP, ['--skip-download', '--write-subs', '--write-auto-subs', '--sub-langs', 'en.*,en',
    '--sub-format', 'vtt', '--write-info-json', '-o', path.join(tmp, v.id), '--no-progress', '-q', '--no-warnings', url],
    { encoding: 'utf8', timeout: 180000 });
  const stderr = r.stderr || '';
  if (/HTTP Error 429/.test(stderr) || (/Sign in to confirm/.test(stderr) && !/your age/i.test(stderr))) {
    console.error(`\nRate-limited or bot-checked by YouTube; stopping. Re-run later with a higher --delay.`);
    break;
  }
  const infoPath = path.join(tmp, `${v.id}.info.json`);
  if (r.status !== 0 && !fs.existsSync(infoPath)) {
    const reason = stderr.trim().split('\n').pop() || `yt-dlp exit ${r.status}`;
    manifest.videos[v.id] = { status: 'failed', title: v.title, reason, attempted_at: today };
    counts.failed++; console.error(`FAILED (${reason})`); sleep(args.delay * 1000); continue;
  }
  const meta = fs.existsSync(infoPath) ? JSON.parse(fs.readFileSync(infoPath, 'utf8')) : {};
  const vttPath = findVtt(tmp, v.id);
  if (!vttPath) {
    manifest.videos[v.id] = { status: 'no-captions', title: meta.title || v.title, published: isoDate(meta.upload_date), attempted_at: today };
    counts.no_captions++; console.error('no captions'); sleep(args.delay * 1000); continue;
  }
  const cues = vttCues(fs.readFileSync(vttPath, 'utf8'));
  const paras = paragraphs(cues);
  const words = paras.reduce((s, p) => s + p.text.split(/\s+/).length, 0);
  const published = isoDate(meta.upload_date) || v.published || '';
  const chapters = (meta.chapters || []).map((c) => `- **[${ts(c.start_time || 0)}]** ${c.title}`);
  const desc = (meta.description || '').trim().slice(0, 2000);
  const md = [
    '---',
    'type: raw-transcript',
    `title: ${yq(meta.title || v.title)}`,
    `resource: ${url}`,
    `youtube_id: ${v.id}`,
    `channel: ${yq(meta.channel || meta.uploader || scope.channel)}`,
    `published: "${published}"`,
    `duration_seconds: ${Number.isFinite(meta.duration) ? Math.round(meta.duration) : 'null'}`,
    `view_count: ${Number.isFinite(meta.view_count) ? meta.view_count : 'null'}`,
    `words: ${words}`,
    `generated: { by: "process:channel-to-skill", at: "${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}" }`,
    'immutable: true',
    '---',
    '',
    `# ${meta.title || v.title}`,
    '',
    ...(desc ? ['## Description', '', desc, ''] : []),
    ...(chapters.length ? ['## Chapters', '', ...chapters, ''] : []),
    '## Transcript',
    '',
    ...paras.map((p) => `**[${ts(p.start)}]** ${p.text}\n`),
  ].join('\n');
  const rel = `raw/${v.id}.md`;
  fs.writeFileSync(path.join(args.kbDir, rel), md);
  manifest.videos[v.id] = {
    status: 'fetched', title: meta.title || v.title, published,
    duration_seconds: Number.isFinite(meta.duration) ? Math.round(meta.duration) : null,
    words, chapters: chapters.length, path: rel, fetched_at: today,
  };
  counts.fetched++;
  console.error(`${paras.length} paragraphs, ${words} words`);
  for (const f of fs.readdirSync(tmp)) if (f.startsWith(v.id)) fs.unlinkSync(path.join(tmp, f));
  sleep(args.delay * 1000);
}

manifest.updated = today;
fs.writeFileSync(manPath, JSON.stringify(manifest, null, 2) + '\n');
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`Done: ${counts.fetched} fetched, ${counts.no_captions} no-captions, ${counts.failed} failed, ${counts.already} already handled -> ${manPath}`);
