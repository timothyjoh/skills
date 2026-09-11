#!/usr/bin/env node
/**
 * cts_enumerate.js: build a catalog of a YouTube channel's videos and Shorts
 * without fetching any transcripts. Zero LLM tokens. Two passes per tab:
 *
 *   1. flat listing of the tab (id, title, duration, views): whole tab, seconds.
 *      The /shorts tab lists views but not durations.
 *   2. full metadata (upload_date, description, chapters, duration):
 *      /videos: the newest --full (tab is newest-first)
 *      /shorts: the top --full-shorts by views (recency matters less for a clip;
 *               views are the creator's audience telling you which principle landed)
 *      ~1-2s per item either way.
 *
 * Every entry carries kind: "video" | "short" (the tab it came from). Nothing
 * is dropped by duration unless --min-duration is set; a clip channel's Shorts
 * are often the densest material it has.
 *
 * Writes <kb-dir>/catalog.json and prints a per-kind scope summary for triage.
 *
 * @usage
 *   node cts_enumerate.js @Handle --kb-dir .claude/kb/<slug> [--tabs videos,shorts] [--full 150] [--full-shorts 100] [--min-duration 0]
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const YTDLP = fs.existsSync('/opt/homebrew/bin/yt-dlp') ? '/opt/homebrew/bin/yt-dlp' : 'yt-dlp';
const WORDS_PER_MIN = 150;
const SHORT_FALLBACK_SECONDS = 50; // median of sampled Shorts when no duration is known

function parseArgs(argv) {
  const a = { full: 150, fullShorts: 100, minDuration: 0, tabs: ['videos', 'shorts'] };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--kb-dir') a.kbDir = argv[++i];
    else if (t === '--full') a.full = parseInt(argv[++i], 10);
    else if (t === '--full-shorts') a.fullShorts = parseInt(argv[++i], 10);
    else if (t === '--min-duration') a.minDuration = parseInt(argv[++i], 10);
    else if (t === '--tabs') a.tabs = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else if (!t.startsWith('-')) a.channel = t;
  }
  const bad = a.tabs.filter((t) => t !== 'videos' && t !== 'shorts');
  if (!a.channel || !a.kbDir || bad.length) {
    console.error('usage: cts_enumerate.js <@handle|url> --kb-dir <dir> [--tabs videos,shorts] [--full N] [--full-shorts N] [--min-duration S]');
    process.exit(2);
  }
  return a;
}

function channelBase(c) {
  if (c.startsWith('http')) return c.replace(/\/+$/, '').replace(/\/(videos|shorts)$/, '');
  return `https://www.youtube.com/${c.startsWith('@') ? c : '@' + c}`;
}

function run(args, timeout) {
  const r = spawnSync(YTDLP, args, { encoding: 'utf8', timeout, maxBuffer: 1 << 28 });
  if (r.error && r.error.code === 'ETIMEDOUT') { r.timedOut = true; return r; }
  if (r.error) throw r.error;
  return r;
}

function isoDate(ud) {
  return ud && ud.length === 8 ? `${ud.slice(0, 4)}-${ud.slice(4, 6)}-${ud.slice(6, 8)}` : '';
}

const KIND = { videos: 'video', shorts: 'short' };

// Pass 1: flat listing of one tab. Returns { channelName, entries } or null when the tab is absent.
function listTab(base, tab) {
  const url = `${base}/${tab}`;
  console.error(`Listing ${url} ...`);
  const flat = run(['--flat-playlist', '-J', '--no-warnings', url], 600000);
  if (flat.status !== 0 || !flat.stdout) {
    const last = (flat.stderr || '').trim().split('\n').pop() || `yt-dlp exit ${flat.status}`;
    if (tab === 'shorts') { console.error(`  no /shorts tab (${last}); continuing without Shorts`); return null; }
    console.error(last);
    process.exit(1);
  }
  const info = JSON.parse(flat.stdout);
  const channelName = info.channel || info.uploader || (info.title || '').replace(/ - (Videos|Shorts)$/, '') || '';
  const entries = (info.entries || []).filter(Boolean).map((e) => ({
    id: e.id,
    kind: KIND[tab],
    title: e.title || e.id,
    url: `https://www.youtube.com/watch?v=${e.id}`,
    duration_seconds: Number.isFinite(e.duration) ? Math.round(e.duration) : null,
    view_count: Number.isFinite(e.view_count) ? e.view_count : null,
  }));
  console.error(`  ${entries.length} on the ${tab} tab`);
  return { url, channelName, entries };
}

// Pass 2: full metadata for a chosen subset, each by its watch URL in one yt-dlp process.
// Never address items by tab position: --playlist-items makes yt-dlp walk the whole tab,
// and a Shorts tab can be thousands deep.
function enrich(chosen, label) {
  if (!chosen.length) return 0;
  console.error(`Fetching metadata for ${chosen.length} ${label} (no transcripts) ...`);
  const r = run(['-j', '--skip-download', '--no-warnings', '--sleep-requests', '1',
    ...chosen.map((v) => v.url)], 60000 + chosen.length * 8000);
  if (r.timedOut) console.error('  timed out; keeping what came back');
  const byId = new Map(chosen.map((v) => [v.id, v]));
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
  console.error(`  metadata for ${got}/${chosen.length}`);
  return got;
}

const args = parseArgs(process.argv.slice(2));
const base = channelBase(args.channel);
fs.mkdirSync(args.kbDir, { recursive: true });

let channelName = '';
const seen = new Set();
const all = [];
const fullCounts = { video: 0, short: 0 };
const tabUrls = {};

for (const tab of args.tabs) {
  const t = listTab(base, tab);
  if (!t) continue;
  channelName = channelName || t.channelName;
  tabUrls[tab] = t.url;
  const fresh = t.entries.filter((e) => !seen.has(e.id));
  for (const e of fresh) seen.add(e.id);
  if (tab === 'videos') {
    // newest first; enrich the newest N
    fullCounts.video = enrich(fresh.slice(0, Math.min(args.full, fresh.length)), 'newest videos');
  } else {
    // enrich the top N by views: the flat shorts list has views but no durations
    const ranked = fresh.filter((e) => e.view_count != null).sort((a, b) => b.view_count - a.view_count);
    fullCounts.short = enrich(ranked.slice(0, Math.min(args.fullShorts, ranked.length)), 'top Shorts by views');
  }
  all.push(...fresh);
}
channelName = channelName || args.channel;

const kept = all.filter((v) => !args.minDuration || v.duration_seconds == null || v.duration_seconds >= args.minDuration);
const videos = kept.filter((v) => v.kind === 'video');
const shorts = kept.filter((v) => v.kind === 'short');

// Word estimates: known durations at 150 wpm; unknown Shorts at the sampled median (or 50s)
const knownShortDurs = shorts.map((v) => v.duration_seconds).filter(Number.isFinite).sort((a, b) => a - b);
const shortMedian = knownShortDurs.length ? knownShortDurs[Math.floor(knownShortDurs.length / 2)] : SHORT_FALLBACK_SECONDS;
const wordsOf = (v) => Math.round(((v.duration_seconds ?? (v.kind === 'short' ? shortMedian : 0)) / 60) * WORDS_PER_MIN);
const videoWords = videos.reduce((s, v) => s + wordsOf(v), 0);
const shortWords = shorts.reduce((s, v) => s + wordsOf(v), 0);

const catalog = {
  channel: channelName,
  channel_url: base,
  handle: args.channel,
  enumerated_at: new Date().toISOString().slice(0, 10),
  tabs: args.tabs.filter((t) => tabUrls[t]),
  total_videos: kept.length,
  counts: { video: videos.length, short: shorts.length },
  estimated_words: { video: videoWords, short: shortWords },
  long_form_videos: videos.length,
  min_duration_seconds: args.minDuration,
  full_metadata_count: fullCounts.video,
  full_metadata: fullCounts,
  videos: kept,
};
const out = path.join(args.kbDir, 'catalog.json');
fs.writeFileSync(out, JSON.stringify(catalog, null, 2) + '\n');

// Summary for the triage step
const dated = videos.filter((v) => v.published);
const years = {};
for (const v of dated) years[v.published.slice(0, 4)] = (years[v.published.slice(0, 4)] || 0) + 1;
const durs = videos.map((v) => v.duration_seconds).filter(Number.isFinite).sort((a, b) => a - b);
const med = durs.length ? durs[Math.floor(durs.length / 2)] : 0;
const hours = durs.reduce((s, d) => s + d, 0) / 3600;
const k = (n) => `${(n / 1000).toFixed(0)}k`;

console.log(`Channel:        ${channelName}`);
console.log(`Long-form:      ${videos.length} videos, ${hours.toFixed(1)} h, median ${Math.round(med / 60)} min, ~${k(videoWords)} transcript words`);
if (videos.length) {
  console.log(`  Dated (newest ${fullCounts.video}): ${dated.length ? `${dated[dated.length - 1].published} -> ${dated[0].published}` : 'n/a'}`);
  if (Object.keys(years).length) console.log('  Per year:     ' + Object.entries(years).sort().map(([y, n]) => `${y}:${n}`).join('  '));
  if (videos.length > fullCounts.video) console.log(`  Undated:      ${videos.length - fullCounts.video} older videos beyond the metadata window`);
}
if (tabUrls.shorts) {
  const sampled = shorts.filter((v) => v.published);
  const views = shorts.map((v) => v.view_count).filter(Number.isFinite).sort((a, b) => b - a);
  console.log(`Shorts:         ${shorts.length} clips, median ${shortMedian}s${knownShortDurs.length ? '' : ' (assumed)'}, ~${k(shortWords)} transcript words`);
  if (shorts.length) {
    console.log(`  Views:        top ${k(views[0] || 0)}, median ${k(views[Math.floor(views.length / 2)] || 0)}; ${views.filter((n) => n >= 100000).length} clips over 100k`);
    if (sampled.length) console.log(`  Sampled:      top ${sampled.length} by views carry dates and durations (${sampled.map((v) => v.published).sort()[0]} -> ${sampled.map((v) => v.published).sort().pop()})`);
  }
} else if (args.tabs.includes('shorts')) {
  console.log('Shorts:         none (no /shorts tab)');
}
if (args.minDuration) console.log(`Dropped:        ${all.length - kept.length} under ${args.minDuration}s (--min-duration)`);
console.log(`Catalog:        ${out}`);
