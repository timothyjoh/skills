#!/usr/bin/env node
/**
 * cts_enumerate.js: build a catalog of a YouTube channel's long-form videos
 * without fetching any transcripts. Zero LLM tokens. Two passes:
 *
 *   1. flat listing of the /videos tab (id, title, duration, views): whole channel, seconds
 *   2. full metadata (upload_date, description, chapters) for the newest N: ~1-2s/video
 *
 * Writes <kb-dir>/catalog.json and prints a scope summary for triage.
 *
 * @usage
 *   node cts_enumerate.js @Handle --kb-dir .claude/kb/<slug> [--full 150] [--min-duration 90]
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const YTDLP = fs.existsSync('/opt/homebrew/bin/yt-dlp') ? '/opt/homebrew/bin/yt-dlp' : 'yt-dlp';

function parseArgs(argv) {
  const a = { full: 150, minDuration: 90 };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--kb-dir') a.kbDir = argv[++i];
    else if (t === '--full') a.full = parseInt(argv[++i], 10);
    else if (t === '--min-duration') a.minDuration = parseInt(argv[++i], 10);
    else if (!t.startsWith('-')) a.channel = t;
  }
  if (!a.channel || !a.kbDir) {
    console.error('usage: cts_enumerate.js <@handle|url> --kb-dir <dir> [--full N] [--min-duration S]');
    process.exit(2);
  }
  return a;
}

function channelVideosUrl(c) {
  if (c.startsWith('http')) return c.replace(/\/+$/, '').replace(/\/videos$/, '') + '/videos';
  return `https://www.youtube.com/${c.startsWith('@') ? c : '@' + c}/videos`;
}

function run(args, timeout) {
  const r = spawnSync(YTDLP, args, { encoding: 'utf8', timeout, maxBuffer: 1 << 28 });
  if (r.error) throw r.error;
  return r;
}

function isoDate(ud) {
  return ud && ud.length === 8 ? `${ud.slice(0, 4)}-${ud.slice(4, 6)}-${ud.slice(6, 8)}` : '';
}

const args = parseArgs(process.argv.slice(2));
const url = channelVideosUrl(args.channel);
fs.mkdirSync(args.kbDir, { recursive: true });

// Pass 1: flat listing
console.error(`Listing ${url} ...`);
const flat = run(['--flat-playlist', '-J', '--no-warnings', url], 600000);
if (flat.status !== 0 || !flat.stdout) {
  console.error(flat.stderr.trim().split('\n').pop() || `yt-dlp exit ${flat.status}`);
  process.exit(1);
}
const info = JSON.parse(flat.stdout);
const channelName = info.channel || info.uploader || (info.title || '').replace(/ - Videos$/, '') || args.channel;
const entries = (info.entries || []).filter(Boolean);
const videos = entries.map((e) => ({
  id: e.id,
  title: e.title || e.id,
  url: `https://www.youtube.com/watch?v=${e.id}`,
  duration_seconds: Number.isFinite(e.duration) ? Math.round(e.duration) : null,
  view_count: Number.isFinite(e.view_count) ? e.view_count : null,
}));
console.error(`Found ${videos.length} videos on ${channelName}`);

// Pass 2: full metadata for the newest N (the /videos tab lists newest first)
const fullN = Math.min(args.full, videos.length);
if (fullN > 0) {
  console.error(`Fetching metadata for the newest ${fullN} (no transcripts) ...`);
  const r = run(['-j', '--skip-download', '--no-warnings', '--sleep-requests', '1',
    '--playlist-end', String(fullN), url], 60000 + fullN * 6000);
  const byId = new Map(videos.map((v) => [v.id, v]));
  let got = 0;
  for (const line of (r.stdout || '').split('\n')) {
    if (!line.trim()) continue;
    let m;
    try { m = JSON.parse(line); } catch { continue; }
    const v = byId.get(m.id);
    if (!v) continue;
    v.published = isoDate(m.upload_date);
    v.duration_seconds = Number.isFinite(m.duration) ? Math.round(m.duration) : v.duration_seconds;
    v.view_count = Number.isFinite(m.view_count) ? m.view_count : v.view_count;
    v.description = (m.description || '').trim().slice(0, 1200);
    v.chapters = (m.chapters || []).map((c) => c.title).slice(0, 40);
    v.tags = (m.tags || []).slice(0, 15);
    got++;
  }
  console.error(`  metadata for ${got}/${fullN}`);
}

const longForm = videos.filter((v) => v.duration_seconds == null || v.duration_seconds >= args.minDuration);
const catalog = {
  channel: channelName,
  channel_url: url,
  handle: args.channel,
  enumerated_at: new Date().toISOString().slice(0, 10),
  total_videos: videos.length,
  long_form_videos: longForm.length,
  min_duration_seconds: args.minDuration,
  full_metadata_count: fullN,
  videos,
};
const out = path.join(args.kbDir, 'catalog.json');
fs.writeFileSync(out, JSON.stringify(catalog, null, 2) + '\n');

// Summary for the triage step
const dated = longForm.filter((v) => v.published);
const years = {};
for (const v of dated) years[v.published.slice(0, 4)] = (years[v.published.slice(0, 4)] || 0) + 1;
const durs = longForm.map((v) => v.duration_seconds).filter(Number.isFinite).sort((a, b) => a - b);
const med = durs.length ? durs[Math.floor(durs.length / 2)] : 0;
const hours = durs.reduce((s, d) => s + d, 0) / 3600;
const words = Math.round(durs.reduce((s, d) => s + d, 0) / 60 * 150);

console.log(`Channel:        ${channelName}`);
console.log(`Videos:         ${videos.length} total, ${longForm.length} long-form (>= ${args.minDuration}s)`);
console.log(`Runtime:        ${hours.toFixed(1)} h, median ${Math.round(med / 60)} min, ~${(words / 1000).toFixed(0)}k transcript words`);
console.log(`Dated (newest ${fullN}): ${dated.length ? `${dated[dated.length - 1].published} -> ${dated[0].published}` : 'n/a'}`);
if (Object.keys(years).length) {
  console.log('Per year:       ' + Object.entries(years).sort().map(([y, n]) => `${y}:${n}`).join('  '));
}
if (videos.length > fullN) console.log(`Undated:        ${videos.length - fullN} older videos beyond the metadata window`);
console.log(`Catalog:        ${out}`);
