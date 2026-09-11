#!/usr/bin/env node
/**
 * pts_add.js: add individual videos to an existing playlist scope without editing the
 * YouTube playlist. Each video is appended to <kb-dir>/scope.json `videos` with
 * `source: "manual"`, `current: true`, and no playlist position. The enumerator keeps
 * manual videos current on later re-runs, so they survive fold-ins.
 *
 * Metadata (title, creator, duration, upload date) comes from one yt-dlp metadata call
 * per video. No media is downloaded. Videos already in scope are skipped.
 *
 * @usage
 *   node pts_add.js --kb-dir <dir> <url-or-id> [<url-or-id> ...]
 *   node pts_add.js --kb-dir <dir> --file <path>     # one URL or ID per line, # comments allowed
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function videoId(input) {
  const s = String(input).trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  let url;
  try { url = new URL(s); } catch { throw new Error(`Not a YouTube URL or video ID: ${s}`); }
  if (!/^(www\.|m\.|music\.)?youtube\.com$|^youtu\.be$/.test(url.hostname)) throw new Error(`Not a YouTube URL: ${s}`);
  const v = url.hostname === 'youtu.be' ? url.pathname.slice(1)
    : url.searchParams.get('v') || (url.pathname.match(/^\/(?:shorts|live|embed)\/([A-Za-z0-9_-]{11})/) || [])[1];
  if (!v || !/^[A-Za-z0-9_-]{11}$/.test(v)) throw new Error(`No video ID in URL: ${s}`);
  return v;
}

function manualVideo(meta, today) {
  const ud = meta.upload_date || '';
  return {
    id: meta.id, title: meta.title || meta.id, url: `https://www.youtube.com/watch?v=${meta.id}`,
    kind: /\/shorts\//.test(meta.webpage_url || '') ? 'short' : 'video',
    creator: meta.channel || meta.uploader || '',
    published: ud.length === 8 ? `${ud.slice(0, 4)}-${ud.slice(4, 6)}-${ud.slice(6, 8)}` : '',
    duration_seconds: Number.isFinite(meta.duration) ? meta.duration : null,
    playlist_positions: [], current: true, source: 'manual', added: today,
  };
}

function fetchMeta(id) {
  const r = spawnSync('yt-dlp', ['--ignore-config', '--no-playlist', '--skip-download', '--no-warnings',
    '--print', '%(.{id,title,channel,uploader,duration,upload_date,webpage_url})j', `https://www.youtube.com/watch?v=${id}`],
    { encoding: 'utf8', timeout: 120000 });
  if (r.error || r.status !== 0) throw new Error((r.stderr || r.error?.message || `yt-dlp exit ${r.status}`).trim().split('\n').pop());
  const line = r.stdout.trim().split('\n').pop();
  return JSON.parse(line);
}

function main(argv) {
  const a = { inputs: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--kb-dir' && argv[i + 1]) a.kbDir = argv[++i];
    else if (argv[i] === '--file' && argv[i + 1]) a.file = argv[++i];
    else if (!argv[i].startsWith('-')) a.inputs.push(argv[i]);
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  if (a.file) {
    for (const line of fs.readFileSync(a.file, 'utf8').split('\n')) {
      const t = line.replace(/#.*$/, '').trim();
      if (t) a.inputs.push(t);
    }
  }
  if (!a.kbDir || !a.inputs.length) throw new Error('usage: pts_add.js --kb-dir <dir> (<url-or-id> ... | --file <path>)');
  const scopePath = path.join(a.kbDir, 'scope.json');
  if (!fs.existsSync(scopePath)) throw new Error(`No scope.json in ${a.kbDir}; run pts_enumerate.js first`);
  const scope = JSON.parse(fs.readFileSync(scopePath, 'utf8'));
  const ids = [...new Set(a.inputs.map(videoId))];
  const have = new Set(scope.videos.map((v) => v.id));
  const today = new Date().toISOString().slice(0, 10);
  const added = [], skipped = [], failed = [];
  for (const id of ids) {
    if (have.has(id)) { skipped.push(id); continue; }
    process.stderr.write(`${id} ... `);
    try {
      const v = manualVideo(fetchMeta(id), today);
      scope.videos.push(v); have.add(id); added.push(v);
      process.stderr.write(`${v.title}\n`);
    } catch (e) { failed.push(`${id}: ${e.message}`); process.stderr.write(`FAILED ${e.message}\n`); }
  }
  scope.updated = today;
  fs.writeFileSync(`${scopePath}.tmp`, JSON.stringify(scope, null, 2) + '\n');
  fs.renameSync(`${scopePath}.tmp`, scopePath);
  const manual = scope.videos.filter((v) => v.source === 'manual').length;
  console.log(`Added ${added.length}, skipped ${skipped.length} already in scope, ${failed.length} failed. ${manual} manual videos in scope; ${scope.videos.length} videos total.`);
  for (const f of failed) console.log(`  failed ${f}`);
  if (failed.length) process.exitCode = 1;
}

if (require.main === module) {
  try { main(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exitCode = 1; }
}
module.exports = { videoId, manualVideo };
