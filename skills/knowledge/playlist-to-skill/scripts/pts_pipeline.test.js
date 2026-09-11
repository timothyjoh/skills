const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { playlistUrl, catalogAndScope } = require('./pts_enumerate');
const playlist = playlistUrl('https://www.youtube.com/watch?v=aaaaaaaaaaa&list=PLfixture&index=3&t=10');
const fixture = { id: 'PLfixture', title: 'Mixed creators', playlist_count: 5, entries: [
  { id: 'aaaaaaaaaaa', title: 'Old low-view lesson', duration: 20, view_count: 0, channel: 'One' },
  { id: 'bbbbbbbbbbb', title: 'Repeated title', url: 'https://www.youtube.com/shorts/bbbbbbbbbbb', channel: 'Two' },
  { id: 'aaaaaaaaaaa', title: 'Old low-view lesson' },
  { id: 'ccccccccccc', title: '[Private video]' }, null,
] };

test('watch and short links resolve to the whole playlist; invalid inputs fail', () => {
  assert.equal(playlist.url, 'https://www.youtube.com/playlist?list=PLfixture');
  assert.equal(playlistUrl('https://youtu.be/aaaaaaaaaaa?list=PLfixture').id, playlist.id);
  assert.equal(playlistUrl('https://www.youtube.com/shorts/aaaaaaaaaaa?list=PLfixture').id, playlist.id);
  for (const url of ['https://youtube.com/watch?v=aaaaaaaaaaa', 'https://example.com/?list=PLfixture', 'https://youtube.com/?list=RDmix']) {
    assert.throws(() => playlistUrl(url));
  }
});

test('full scope preserves short, duplicate, private and unavailable entries', () => {
  const { catalog, scope } = catalogAndScope(fixture, playlist);
  assert.equal(catalog.entries.length, 5);
  assert.equal(scope.chosen_cut, 'all');
  assert.equal(scope.videos.length, 3);
  assert.deepEqual(scope.videos[0].playlist_positions, [1, 3]);
  assert.equal(scope.videos[1].kind, 'short');
  assert.equal(scope.entries[4].status, 'unavailable');
});

test('fold-in includes every new ID and retains removed sources with stable slug', () => {
  const previous = catalogAndScope(fixture, playlist).scope;
  const { scope } = catalogAndScope({ ...fixture, title: 'Renamed', playlist_count: 1, entries: [{ id: 'ddddddddddd' }] }, playlist, previous);
  assert.equal(scope.slug, previous.slug);
  assert.equal(scope.videos.length, 4);
  assert.equal(scope.videos.filter(v => v.current).length, 1);
  assert.throws(() => catalogAndScope(fixture, playlist, { playlist_id: 'OTHER' }));
  assert.throws(() => catalogAndScope({ ...fixture, playlist_count: 6 }, playlist));
});

function sandbox(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pts-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const bin = path.join(dir, 'bin'); fs.mkdirSync(bin);
  const log = path.join(dir, 'calls.jsonl');
  fs.writeFileSync(path.join(dir, 'playlist.json'), JSON.stringify(fixture));
  fs.writeFileSync(path.join(bin, 'yt-dlp'), `#!${process.execPath}
const fs=require('fs'); const a=process.argv.slice(2);
fs.appendFileSync(process.env.PTS_LOG,JSON.stringify(a)+'\\n');
if(a.includes('--flat-playlist')) { console.log(fs.readFileSync(process.env.PTS_FIXTURE,'utf8')); process.exit(0); }
const id=new URL(a.at(-1)).searchParams.get('v');
if(id==='bbbbbbbbbbb' && process.env.PTS_BLOCK==='1') { console.error('HTTP Error 429'); process.exit(1); }
if(id==='ccccccccccc') { console.error('Private video'); process.exit(1); }
const out=a[a.indexOf('-o')+1];
fs.writeFileSync(out+'.info.json',JSON.stringify({title:id,channel:'Creator '+id,upload_date:'20200101',duration:20}));
if(id==='aaaaaaaaaaa') fs.writeFileSync(out+'.en.vtt','WEBVTT\\n\\n00:00:01.000 --> 00:00:05.000\\nUse a fixture to test the entire scope.\\n');
`, { mode: 0o755 });
  const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, PTS_LOG: log, PTS_FIXTURE: path.join(dir, 'playlist.json') };
  const kb = path.join(dir, 'working data');
  const run = (script, args, extra = {}) => spawnSync(process.execPath, [path.join(__dirname, script), ...args], { encoding: 'utf8', env: { ...env, ...extra } });
  return { dir, kb, log, run };
}

test('CLI enumerates all, fetches sequentially, resumes and records failures', t => {
  const { kb, log, run } = sandbox(t);
  let r = run('pts_enumerate.js', [playlist.url, '--kb-dir', kb]); assert.equal(r.status, 0, r.stderr);
  const rejected = run('pts_enumerate.js', [playlist.url, '--kb-dir', kb, '--limit', '1']); assert.notEqual(rejected.status, 0);
  r = run('pts_fetch.js', ['--kb-dir', kb, '--delay', '0'], { PTS_BLOCK: '1' }); assert.equal(r.status, 3, r.stderr);
  const manifestPath = path.join(kb, 'raw', 'manifest.json');
  let manifest = JSON.parse(fs.readFileSync(manifestPath));
  assert.equal(manifest.videos.aaaaaaaaaaa.status, 'fetched');
  assert.equal(manifest.videos.bbbbbbbbbbb, undefined);
  r = run('pts_fetch.js', ['--kb-dir', kb, '--delay', '0']); assert.equal(r.status, 0, r.stderr);
  manifest = JSON.parse(fs.readFileSync(manifestPath));
  assert.equal(manifest.videos.bbbbbbbbbbb.status, 'no-captions');
  assert.equal(manifest.videos.ccccccccccc.status, 'failed');
  assert.match(fs.readFileSync(path.join(kb, 'raw/aaaaaaaaaaa.md'), 'utf8'), /\[0:00:01\]/);
  let calls = fs.readFileSync(log, 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(calls.filter(a => a.at(-1).endsWith('v=aaaaaaaaaaa')).length, 1);
  assert.ok(calls.every(a => a.includes('--ignore-config')));
  assert.ok(calls[0].includes('--yes-playlist'));
  const before = calls.length;
  run('pts_fetch.js', ['--kb-dir', kb, '--delay', '0']);
  calls = fs.readFileSync(log, 'utf8').trim().split('\n'); assert.equal(calls.length, before);
  assert.notEqual(run('pts_fetch.js', ['--kb-dir', kb, '--limit', '1']).status, 0);
  run('pts_fetch.js', ['--kb-dir', kb, '--delay', '0', '--retry-failed']);
  assert.equal(fs.readFileSync(log, 'utf8').trim().split('\n').length, before + 2);
});

test('validator blocks missing extractions and accounts for every source in manifest', t => {
  const { dir, kb, run } = sandbox(t);
  assert.equal(run('pts_enumerate.js', [playlist.url, '--kb-dir', kb]).status, 0);
  assert.equal(run('pts_fetch.js', ['--kb-dir', kb, '--delay', '0']).status, 0);
  const out = path.join(dir, 'skill'); fs.mkdirSync(out);
  fs.writeFileSync(path.join(out, 'SKILL.md'), '---\nname: fixture\ndescription: Fixture\n---\n# Fixture\n');
  for (const f of ['glossary', 'patterns', 'cheatsheet', 'sources']) fs.writeFileSync(path.join(out, `${f}.md`), '# Fixture\n');
  fs.writeFileSync(path.join(kb, 'taxonomy.json'), JSON.stringify({ concepts: [] }));
  const args = ['--kb-dir', kb, '--skill-dir', out, '--write-manifest'];
  let r = run('pts_validate.js', args); assert.equal(r.status, 1); assert.match(r.stdout, /Missing extraction/);
  fs.mkdirSync(path.join(kb, 'extractions'));
  fs.writeFileSync(path.join(kb, 'extractions/aaaaaaaaaaa.json'), JSON.stringify({ video_id: 'aaaaaaaaaaa', concepts: [], no_concepts_reason: 'Test fixture has no lessons' }));
  r = run('pts_validate.js', args); assert.equal(r.status, 0, r.stdout + r.stderr);
  const manifest = JSON.parse(fs.readFileSync(path.join(out, 'manifest.json')));
  assert.equal(manifest.generator, 'playlist-to-skill');
  assert.equal(manifest.entries.length, 5);
  assert.equal(manifest.videos.length, 3);
  assert.equal(manifest.videos_with_transcript, 1);
});

test('workflow halts before synthesis on pending fetches or missing extractions', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../workflow/playlist-to-skill.js'), 'utf8').replace('export const meta', 'const meta');
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const workflow = new AsyncFunction('args', 'agent', 'parallel', 'phase', 'log', source);
  const args = { slug: 'fixture', channel: 'Fixture', kbDir: '/tmp/kb', skillDir: '/tmp/out', scriptsDir: '/tmp/scripts', today: '2026-09-10' };
  await assert.rejects(workflow(args, async () => ({ pending: 1 }), null, () => {}, () => {}), /fetch incomplete/);
  let calls = 0;
  const agent = async () => ++calls === 1 ? { pending: 0, videos: [{ id: 'aaaaaaaaaaa', words: 10 }], already_extracted: [], summary: '' } : { files: [], skipped: [], concept_names: [] };
  await assert.rejects(workflow(args, agent, tasks => Promise.all(tasks.map(fn => fn())), () => {}, () => {}), /Extraction incomplete/);
  assert.equal(calls, 2);
});
