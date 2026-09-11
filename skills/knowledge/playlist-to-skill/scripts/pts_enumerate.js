#!/usr/bin/env node
// Enumerate the whole playlist and write its scope without editorial selection.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function playlistUrl(input) {
  const url = new URL(input);
  if (!['https:', 'http:'].includes(url.protocol) ||
      !/^(www\.|m\.|music\.)?youtube\.com$|^youtu\.be$/.test(url.hostname)) {
    throw new Error('Expected a YouTube URL containing a list parameter');
  }
  const id = url.searchParams.get('list');
  if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) throw new Error('Missing or invalid playlist ID (list parameter)');
  if (/^(RD|UL)/.test(id)) throw new Error('Auto-generated mixes have no fixed membership. Supply a saved playlist URL.');
  return { id, url: `https://www.youtube.com/playlist?list=${id}` };
}

const SLUG_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

// Creators by number of current videos, most first: the signal for expert- vs topic-kb- naming.
function creatorCounts(scope) {
  const counts = new Map();
  for (const v of scope.videos) if (v.current) counts.set(v.creator || '(unknown)', (counts.get(v.creator || '(unknown)') || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function catalogAndScope(info, playlist, previous, slug) {
  if (slug !== undefined && !SLUG_RE.test(slug)) throw new Error(`Invalid slug "${slug}": lowercase ASCII kebab-case, e.g. expert-dan-mohler or topic-kb-sales-negotiation`);
  if (info.id !== playlist.id || !Array.isArray(info.entries)) throw new Error('yt-dlp did not return the requested playlist');
  if (previous && previous.playlist_id !== playlist.id) throw new Error('Working directory belongs to another playlist');
  if (Number.isFinite(info.playlist_count) && info.playlist_count > info.entries.length) {
    throw new Error(`Incomplete listing: ${info.entries.length} of ${info.playlist_count} entries. Retry before processing.`);
  }
  const videos = new Map();
  const entries = info.entries.map((e, index) => {
    const position = index + 1;
    if (!e || !/^[A-Za-z0-9_-]{11}$/.test(e.id || '')) {
      return { position, id: null, title: e?.title || 'Unavailable playlist entry', status: 'unavailable', reason: 'No retrievable video ID returned by YouTube' };
    }
    const entry = { position, id: e.id, title: e.title || e.id, availability: e.availability || null };
    const existing = videos.get(e.id);
    if (existing) existing.playlist_positions.push(position);
    else videos.set(e.id, {
      id: e.id, title: entry.title, url: `https://www.youtube.com/watch?v=${e.id}`,
      kind: /\/shorts\//.test(e.url || '') ? 'short' : 'video',
      creator: e.channel || e.uploader || '', published: '',
      duration_seconds: Number.isFinite(e.duration) ? e.duration : null,
      playlist_positions: [position], current: true,
    });
    return entry;
  });
  // Keep previous sources for additive fold-in, including removed playlist entries.
  // Videos added by pts_add.js (source: "manual") stay current: they were never playlist members.
  const currentIds = new Set(videos.keys());
  for (const v of previous?.videos || []) {
    if (!currentIds.has(v.id)) videos.set(v.id, { ...v, current: v.source === 'manual', playlist_positions: [] });
  }
  const title = info.title || playlist.id;
  const common = {
    playlist: title, playlist_id: playlist.id, playlist_url: playlist.url,
    slug: slug || previous?.slug || `playlist-${playlist.id.toLowerCase()}`,
    channel: title, handle: playlist.url,
    updated: new Date().toISOString().slice(0, 10),
  };
  return {
    catalog: { ...common, entry_count: entries.length, entries },
    scope: { ...common, chosen_cut: 'all', entries, videos: [...videos.values()] },
  };
}

function main(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--kb-dir' && argv[i + 1]) a.kbDir = argv[++i];
    else if (argv[i] === '--slug' && argv[i + 1]) a.slug = argv[++i];
    else if (!argv[i].startsWith('-') && !a.url) a.url = argv[i];
    else throw new Error(`Unknown argument: ${argv[i]}. Subset options are not supported.`);
  }
  if (!a.kbDir || !a.url) throw new Error('usage: pts_enumerate.js <YouTube URL with list=...> --kb-dir <dir> [--slug <expert-name | topic-kb-topic>]');
  const playlist = playlistUrl(a.url);
  const scopePath = path.join(a.kbDir, 'scope.json');
  const previous = fs.existsSync(scopePath) ? JSON.parse(fs.readFileSync(scopePath, 'utf8')) : null;
  if (previous && previous.playlist_id !== playlist.id) throw new Error('Working directory belongs to another playlist');
  const r = spawnSync('yt-dlp', ['--ignore-config', '--yes-playlist', '--flat-playlist', '-J', playlist.url],
    { encoding: 'utf8', timeout: 600000, maxBuffer: 1 << 28 });
  if (r.error || r.status !== 0) throw new Error(r.error?.message || r.stderr || `yt-dlp exit ${r.status}`);
  const { catalog, scope } = catalogAndScope(JSON.parse(r.stdout), playlist, previous, a.slug);
  fs.mkdirSync(a.kbDir, { recursive: true });
  for (const [name, data] of [['catalog', catalog], ['scope', scope]]) {
    const file = path.join(a.kbDir, `${name}.json`);
    fs.writeFileSync(`${file}.tmp`, JSON.stringify(data, null, 2) + '\n');
    fs.renameSync(`${file}.tmp`, file);
  }
  console.log(`${scope.playlist}: ${catalog.entry_count} playlist entries, ${scope.videos.filter(v => v.current).length} unique video IDs, ${catalog.entries.filter(e => !e.id).length} unavailable entries without IDs. All included.`);
  const creators = creatorCounts(scope);
  console.log(`Creators: ${creators.slice(0, 5).map(([c, n]) => `${c} ${n}`).join(', ')}${creators.length > 5 ? `, +${creators.length - 5} more` : ''}`);
  console.log(`slug=${scope.slug}; ${scope.videos.filter(v => !v.current).length} previous sources retained for fold-in`);
}

if (require.main === module) {
  try { main(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exitCode = 1; }
}
module.exports = { playlistUrl, catalogAndScope, creatorCounts };
