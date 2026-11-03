// Offline tests for video-lineup: pure helpers, then the CLI against a temporary lineup folder with a
// space in its path, a stub t3-handoff helper, and a two-second test video made by ffmpeg.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import * as lib from '../lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SKILL = path.resolve(HERE, '..', '..');
const CLI = path.join(SKILL, 'scripts', 'lineup.mjs');
const hasFfmpeg = spawnSync('sh', ['-c', 'command -v ffmpeg && command -v ffprobe']).status === 0;

const LOG_10 = lib.LOG_SECTIONS.map((s, i) => `## ${i + 1}. ${s}\n\ntext\n`).join('\n');

function briefText(overrides = '') {
  return fs.readFileSync(path.join(SKILL, 'templates', 'BRIEF.md'), 'utf8')
    .replace('# Title of the video', '# Widget sync in 40 seconds')
    .replace('https://example.com/the-real-page', 'https://github.com/example/widget')
    .replace('/absolute/path/to/a/local/repo', '/tmp/widget-src') + overrides;
}

function cli(args, env = {}) {
  const r = spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env: { ...process.env, ...env } });
  return { ...r, json: (() => { try { return JSON.parse(r.stdout); } catch { return null; } })() };
}

function tempLineup() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vlineup-test-'));
  test.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const dir = path.join(root, 'my lineup');
  fs.mkdirSync(dir, { recursive: true });
  const brief = path.join(root, 'brief draft.md');
  fs.writeFileSync(brief, briefText());
  return { root, dir, brief };
}

// A stand-in for t3-handoff's t3.mjs: projects, start and status, with the state taken from STUB_STATE.
function stubT3(root, workspaces) {
  const file = path.join(root, 'stub-t3.mjs');
  fs.writeFileSync(file, `
const [cmd, id] = process.argv.slice(2);
const ws = ${JSON.stringify(workspaces)};
if (cmd === 'projects') console.log(JSON.stringify(ws.map((w, i) => ({ id: 'p' + i, title: 't', workspace: w }))));
else if (cmd === 'start') {
  const args = process.argv.slice(3); const key = args[args.indexOf('--key') + 1];
  console.log(JSON.stringify({ id: 'd-' + key, threadId: 't-' + key, url: 'http://127.0.0.1:3773/x/' + key }));
} else if (cmd === 'status') console.log(JSON.stringify({ id, state: (process.env.STUB_STATES ? JSON.parse(process.env.STUB_STATES)[id] : null) || process.env.STUB_STATE || 'running',
  model: { instanceId: 'claudeAgent', model: 'opus-x', options: [{ id: 'effort', value: 'high' }] }, runtimeMode: 'auto',
  reports: [{ seq: 1, status: 'started', fields: { phase: 'setup', next: 'plan' } }] }));
else process.exit(2);
`);
  return file;
}

test('render fills values and refuses a missing one', () => {
  assert.equal(lib.render('a {{x}} b {{y}}', { x: 1, y: 'z' }), 'a 1 b z');
  assert.throws(() => lib.render('{{x}} {{nope}}', { x: 1 }), /missing: nope/);
  assert.equal(lib.render('{{x}}', { x: '' }), '');
});

test('parseBrief reads title, size and length from the template form', () => {
  const b = lib.parseBrief(fs.readFileSync(path.join(SKILL, 'templates', 'BRIEF.md'), 'utf8'));
  assert.deepEqual(b, { title: 'Title of the video', width: 1920, height: 1080, minSeconds: 30, maxSeconds: 45 });
  const v = lib.parseBrief('# V\n- Length: 15-20 s\n- Format: 9:16, 1080x1920, 30 fps\n');
  assert.deepEqual([v.width, v.height, v.minSeconds, v.maxSeconds], [1080, 1920, 15, 20]);
  assert.equal(lib.parseBrief('# T\nno format\n').width, null);
});

test('template leftovers, size, seconds, slug, aspect and session title', () => {
  assert.equal(lib.templateLeftovers(fs.readFileSync(path.join(SKILL, 'templates', 'BRIEF.md'), 'utf8')).length, 3);
  assert.deepEqual(lib.parseSize('1080x1920'), { width: 1080, height: 1920 });
  assert.throws(() => lib.parseSize('1080p'), /WIDTHxHEIGHT/);
  assert.throws(() => lib.parseSeconds('45-30'), /MIN-MAX/);
  assert.equal(lib.slugify('Shared video brief: t3-handoff in 40 seconds'), 'shared-video-brief-t3-handoff-in-40');
  assert.equal(lib.slugify('!!!'), 'lineup');
  assert.equal(lib.aspect(1920, 1080), '16:9');
  assert.equal(lib.aspect(1080, 1920), '9:16');
  assert.equal(lib.sessionTitle('explainroo', 'Widget sync in 40 seconds and more words'), 'Video explainroo: Widget sync in 40 seconds');
});

test('checkSpec passes a good file, notes a near miss and fails what browsers cannot play', () => {
  const fmt = { width: 1920, height: 1080, minSeconds: 30, maxSeconds: 45 };
  const probe = (o = {}) => ({
    format: { duration: o.dur ?? '40', size: '5000000' },
    streams: [
      { codec_type: 'video', codec_name: 'h264', width: o.w ?? 1920, height: 1080, pix_fmt: o.pix ?? 'yuv420p', avg_frame_rate: '30/1' },
      ...(o.noAudio ? [] : [{ codec_type: 'audio', codec_name: 'aac', channels: 2, sample_rate: '48000' }]),
    ],
  });
  assert.equal(lib.checkSpec(probe(), fmt).pass, true);
  const near = lib.checkSpec(probe({ dur: '45.6' }), fmt);
  assert.equal(near.pass, true);
  assert.match(near.notes[0], /within 1 s/);
  assert.match(lib.checkSpec(probe({ dur: '47' }), fmt).fails[0], /want 30 to 45 s/);
  assert.match(lib.checkSpec(probe({ pix: 'yuv444p' }), fmt).fails[0], /browsers need yuv420p/);
  assert.equal(lib.checkSpec(probe({ pix: 'yuvj420p' }), fmt).pass, true);
  assert.deepEqual(lib.checkSpec(probe({ noAudio: true, w: 1280 }), fmt).fails, ['frame 1280x1080, want 1920x1080', 'no audio stream']);
});

test('parseLoudness takes the summary, not the per-frame lines', () => {
  const stderr = '[Parsed_ebur128_0] t: 0.1 M: -70 S: -70 I: -70.0 LUFS LRA: 0 LU\n'
    + '[Parsed_ebur128_0] Summary:\n  Integrated loudness:\n    I:         -14.0 LUFS\n    Threshold: -24.4 LUFS\n'
    + '  True peak:\n    Peak:       -1.3 dBFS\n';
  assert.deepEqual(lib.parseLoudness(stderr), { lufs: -14, truePeak: -1.3, text: '-14 LUFS integrated, true peak -1.3 dBTP' });
  assert.equal(lib.parseLoudness('nothing').lufs, null);
});

test('buildLogSections accepts numbered headings and bold items', () => {
  assert.deepEqual(lib.buildLogSections(LOG_10).missing, []);
  const partial = '# BUILD-LOG\n## 1. Summary\n## 2. Timeline (wall clock)\n**Installed**\n1. **Verdict**: 4\n- **Quality checks**: ok\n';
  const r = lib.buildLogSections(partial);
  assert.deepEqual(r.present, ['Summary', 'Timeline', 'Installed', 'Quality checks', 'Verdict']);
  assert.equal(r.missing.length, 5);
});

test('qaSummary groups repeated checks and puts failures first', () => {
  const report = { checks: [
    { level: 'PASS', check: 'pops', detail: 'none' },
    { level: 'WARN', check: 'frozen stretch', detail: 'a' },
    { level: 'WARN', check: 'frozen stretch', detail: 'b' },
    { level: 'FAIL', check: 'frame 0', detail: 'black' },
  ] };
  assert.deepEqual(lib.qaSummary(report), { verdict: 'fail', fails: 1, warns: 2, passes: 1, lines: ['FAIL frame 0: black', 'WARN frozen stretch: 2 times'] });
  assert.equal(lib.qaSummary({}).verdict, 'not run');
});

test('settled counts unknown as done only with complete deliverables', () => {
  assert.equal(lib.settled('completed', false), true);
  assert.equal(lib.settled('needs_approval', false), true);
  assert.equal(lib.settled('running', true), false);
  assert.equal(lib.settled('unknown', false), false);
  assert.equal(lib.settled('unknown', true), true);
  assert.equal(lib.settled('superseded', false), false);
  assert.equal(lib.settled('superseded', true), true);
  assert.equal(lib.settled('unreadable', false), false);
  assert.equal(lib.settled('unreadable', true), true);
});

test('machine facts name a missing encoder, the Playwright version per cached Chromium and the Whisper command', () => {
  const t = lib.machineFactsText({
    os: 'macOS 26 (arm64)', ffmpeg: { path: '/x/ffmpeg', version: '8', libx264: false, aac: true, drawtext: false, subtitles: true, ass: true },
    playwright: { cache: '/c', browsers: ['chromium-1248'], versions: [{ version: '1.64.1', revision: 1248 }] }, whisper: 'w {wav} {outdir}',
  });
  assert.match(t, /without the libx264 encoder/);
  assert.match(t, /no drawtext filter/);
  assert.match(t, /playwright@1\.64\.1 \(chromium-1248\)/);
  assert.match(t, /`w \{wav\} \{outdir\}`/);
});

test('siteHtml escapes text, uses relative paths and lists builds without video', () => {
  const html = lib.siteHtml({
    title: 'A <b> test',
    format: { width: 1920, height: 1080, minSeconds: 30, maxSeconds: 45 },
    entries: [
      { name: 'control', kind: 'baseline', measure: { ok: true, spec: { duration_s: 31 }, spec_pass: true, qa: { verdict: 'pass', lines: [] } }, review: { claims_outside_brief: ['<script>'] } },
      { name: 'argo', kind: 'demo', measure: null, state: 'needs_approval', delegation: { url: 'http://x' } },
    ],
    judges: [{ lens: 'Viewer: x', ranking: [{ name: 'control', rank: 1, score: 7, reason: 'r' }], notes: 'n' }],
  });
  assert.match(html, /src="videos\/control\.mp4"/);
  assert.match(html, /A &lt;b&gt; test/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<li><script>/);
  assert.match(html, /<b>argo<\/b>: needs_approval/);
  assert.match(html, /Viewer #1/);
  const loose = lib.siteHtml({
    title: 't', format: { width: 1, height: 1, minSeconds: 1, maxSeconds: 2 },
    entries: [{ name: 'c', measure: { ok: true, spec: {} }, review: { claims_outside_brief: 'none', strengths: 'good pacing', scores: 'n/a' } }],
    judges: { judges: [] },
  });
  assert.match(loose, /<li>good pacing<\/li>/);
});

test('every builder in builders.json has an instruction file that renders', () => {
  const reg = JSON.parse(fs.readFileSync(path.join(SKILL, 'builders.json'), 'utf8'));
  const names = reg.builders.map(b => b.name);
  assert.deepEqual(fs.readdirSync(path.join(SKILL, 'builders')).map(f => f.replace(/\.md$/, '')).sort(), [...names].sort());
  for (const b of reg.builders) {
    if (b.repo) assert.match(b.commit, /^[0-9a-f]{40}$/, `${b.name} needs a full commit pin`);
    if (b.after) assert.ok(names.includes(b.after), `${b.name} runs after an unknown builder`);
  }
  assert.equal(new Set(reg.builders.map(b => b.port)).size, names.length, 'ports must be unique');
});

test('init refuses an unfilled brief and an earshot pass without control', () => {
  const { root, dir } = tempLineup();
  const raw = path.join(root, 'raw.md');
  fs.copyFileSync(path.join(SKILL, 'templates', 'BRIEF.md'), raw);
  assert.match(cli(['init', '--dir', dir, '--brief', raw, '--no-clone']).stderr, /template text/);
  const ok = path.join(root, 'ok.md');
  fs.writeFileSync(ok, briefText());
  assert.match(cli(['init', '--dir', dir, '--brief', ok, '--builders', 'earshot-pass', '--no-clone']).stderr, /control must be in the lineup/);
  assert.match(cli(['init', '--dir', dir, '--brief', ok, '--builders', 'nope', '--no-clone']).stderr, /Unknown builder: nope/);
});

test('init writes complete prompts, links and build repos, and is repeatable', () => {
  const { dir, brief } = tempLineup();
  const first = cli(['init', '--dir', dir, '--brief', brief, '--builders', 'control,earshot-pass,take-one', '--no-clone']);
  assert.equal(first.status, 0, first.stderr);
  assert.deepEqual(first.json.failed, []);
  const lineup = JSON.parse(fs.readFileSync(path.join(dir, 'lineup.json'), 'utf8'));
  assert.deepEqual(lineup.builders.map(b => b.name), ['take-one', 'control', 'earshot-pass']);
  assert.equal(lineup.slug, 'widget-sync-in-40-seconds');
  assert.deepEqual(lineup.format, { width: 1920, height: 1080, minSeconds: 30, maxSeconds: 45 });
  for (const n of ['take-one', 'control', 'earshot-pass']) {
    const p = fs.readFileSync(path.join(dir, 'handoffs', `${n}.prompt.md`), 'utf8');
    assert.doesNotMatch(p, /\{\{/, `${n} prompt has an unfilled value`);
    assert.match(p, /## Run contract/);
    assert.match(p, /1920x1080/);
    assert.ok(p.includes(path.join(dir, 'brief', 'BRIEF.md')), `${n} prompt names the lineup brief`);
    assert.ok(fs.existsSync(path.join(dir, 'builds', n, '.git')), `${n} is a git repo`);
  }
  const earshot = fs.readFileSync(path.join(dir, 'handoffs', 'earshot-pass.prompt.md'), 'utf8');
  assert.ok(earshot.includes(path.join(dir, 'builds', 'control', 'out', 'final.mp4')));
  assert.equal(fs.readlinkSync(path.join(dir, 'builds', 'take-one', '.claude', 'skills', 'take-one')), path.join('..', '..', 'vendor', 'take-one'));
  const again = cli(['init', '--dir', dir, '--no-clone']);
  assert.equal(again.status, 0, again.stderr);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, 'lineup.json'), 'utf8')).builders.map(b => b.name), ['take-one', 'control', 'earshot-pass']);
});

test('dispatch starts each build once, waits for the earshot input, and watch ends when all settle', () => {
  const { root, dir, brief } = tempLineup();
  assert.equal(cli(['init', '--dir', dir, '--brief', brief, '--builders', 'control,earshot-pass', '--no-clone']).status, 0);
  const t3 = stubT3(root, [path.join(dir, 'builds', 'control'), path.join(dir, 'builds', 'earshot-pass')]);
  const env = { VIDEO_LINEUP_T3: t3 };
  const earshotPin = JSON.parse(fs.readFileSync(path.join(SKILL, 'builders.json'), 'utf8')).builders.find(b => b.name === 'earshot-pass').commit;
  const marker = path.join(dir, 'builds', 'earshot-pass', '.lineup-setup.json');

  const dry = cli(['dispatch', '--dir', dir, '--model', 'm1', '--dry-run'], env);
  assert.equal(dry.status, 0, dry.stderr);
  const cmd = dry.json.find(r => r.name === 'control').command;
  const key = cmd[cmd.indexOf('--key') + 1];
  assert.match(key, /^vlineup-widget-sync-in-40-seconds-\d{14}-control-v1$/);
  assert.ok(cmd.includes('--model') && cmd.includes('m1'));
  assert.equal(dry.json.find(r => r.name === 'earshot-pass').state, 'waiting');

  const first = cli(['dispatch', '--dir', dir, '--provider', 'p1', '--model', 'm1'], env);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(first.json.find(r => r.name === 'control').state, 'dispatched');
  assert.equal(cli(['dispatch', '--dir', dir], env).json.find(r => r.name === 'control').state, 'already dispatched');

  const running = cli(['watch', '--dir', dir, '--interval', '0', '--timeout', '0'], { ...env, STUB_STATE: 'running' });
  assert.match(running.stdout, /REPORT control #1 started \| phase: setup/);
  assert.match(running.stdout, /STATE earshot-pass - -> waiting for control/);
  assert.match(running.stdout, /^PAUSE control=running$/m);

  const again = cli(['watch', '--dir', dir, '--interval', '0', '--timeout', '0'], { ...env, STUB_STATE: 'running' });
  assert.doesNotMatch(again.stdout, /REPORT|STATE/, 'a rerun prints only what is new');

  const out = path.join(dir, 'builds', 'control', 'out');
  fs.writeFileSync(path.join(out, 'final.mp4'), 'x');
  fs.writeFileSync(path.join(out, 'poster.png'), 'x');
  fs.writeFileSync(path.join(dir, 'builds', 'control', 'BUILD-LOG.md'), LOG_10);
  const early = cli(['dispatch', '--dir', dir, '--only', 'earshot-pass'], { ...env, STUB_STATE: 'running' });
  assert.equal(early.json[0].state, 'waiting', 'control has its files but is still running');
  const unknown = cli(['watch', '--dir', dir, '--interval', '0', '--timeout', '0'], { ...env, STUB_STATE: 'unknown' });
  assert.match(unknown.stdout, /STATE earshot-pass waiting for control -> ready: run dispatch --only earshot-pass/);
  assert.match(unknown.stdout, /^END control=unknown\+video earshot-pass=ready$/m);

  assert.equal(cli(['dispatch', '--dir', dir, '--only', 'earshot-pass'], { ...env, STUB_STATE: 'unknown' }).json[0].state, 'clone missing');
  for (const sub of ['earshot', 'real-sound']) {
    const skillDir = path.join(dir, 'builds', 'earshot-pass', 'vendor', 'earshot', 'skills', sub);
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# stub\n');
  }
  assert.equal(cli(['dispatch', '--dir', dir, '--only', 'earshot-pass'], { ...env, STUB_STATE: 'unknown' }).json[0].state, 'setup not done');
  fs.writeFileSync(marker, JSON.stringify({ ok: true, commit: earshotPin }));
  const second = cli(['dispatch', '--dir', dir, '--only', 'earshot-pass', '--dry-run'], { ...env, STUB_STATE: 'unknown' });
  const cmd2 = second.json[0].command;
  assert.ok(cmd2.includes('p1') && cmd2.includes('m1'), 'the saved model flags are reused');
  assert.equal(cli(['dispatch', '--dir', dir, '--only', 'earshot-pass'], { ...env, STUB_STATE: 'unknown' }).json[0].state, 'dispatched');
  const st = cli(['status', '--dir', dir, '--json'], { ...env, STUB_STATE: 'completed' });
  assert.deepEqual(st.json.map(r => [r.name, r.state, r.settled]), [['control', 'completed', true], ['earshot-pass', 'completed', true]]);
  assert.match(st.json[0].id, /^d-vlineup-/);

  fs.appendFileSync(path.join(dir, 'brief', 'BRIEF.md'), '\nA changed line.\n');
  assert.match(cli(['init', '--dir', dir, '--no-clone']).stderr, /would change after builds were dispatched.*Restore it from .*\.BRIEF-/);
});

test('arguments: flags may come before the command, unknown flags and empty values are refused', () => {
  const { dir, brief } = tempLineup();
  assert.equal(cli(['--no-clone', 'init', '--dir', dir, '--brief', brief, '--builders', 'control']).status, 0);
  const bad = cli(['status', '--dir', dir, '--bogus']);
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /unknown flag --bogus/);
  assert.match(cli(['measure', '--dir', dir, '--only=']).stderr, /--only needs a value/);
  assert.equal(cli(['nonsense']).status, 1);
});

test('measure and site turn a finished build into a page entry', { skip: !hasFfmpeg && 'ffmpeg not on PATH' }, () => {
  const { dir, brief } = tempLineup();
  assert.equal(cli(['init', '--dir', dir, '--brief', brief, '--builders', 'control,argo', '--no-clone']).status, 0);
  const out = path.join(dir, 'builds', 'control', 'out');
  const make = spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc=size=320x180:rate=24', '-f', 'lavfi', '-i', 'sine=frequency=440',
    '-t', '2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', path.join(out, 'final.mp4')], { encoding: 'utf8' });
  assert.equal(make.status, 0, make.stderr);
  fs.writeFileSync(path.join(dir, 'builds', 'control', 'BUILD-LOG.md'), LOG_10);

  const m = cli(['measure', '--dir', dir, '--no-qa', '--no-transcript']);
  assert.equal(m.status, 0, m.stderr);
  assert.deepEqual(m.json.noVideo, ['argo']);
  const measured = JSON.parse(fs.readFileSync(path.join(dir, 'site', 'assets', 'control', 'measure.json'), 'utf8'));
  assert.equal(measured.spec_pass, false);
  assert.ok(measured.spec_fails.some(f => f.includes('frame 320x180')));
  assert.ok(measured.spec_fails.some(f => f.includes('want 30 to 45 s')));
  assert.equal(typeof measured.loudness.lufs, 'number');
  assert.deepEqual(measured.build_log.missing, []);
  for (const f of ['sheet.jpg', 'poster.png']) assert.ok(fs.statSync(path.join(dir, 'site', 'assets', 'control', f)).size > 0, f);
  assert.ok(fs.existsSync(path.join(dir, 'site', 'videos', 'control.mp4')));

  fs.writeFileSync(path.join(dir, 'builds', 'argo', 'out', 'final.mp4'), 'not a video');
  const m2 = cli(['measure', '--dir', dir, '--no-qa', '--no-transcript']);
  assert.equal(m2.status, 1, 'a corrupt video is reported');
  assert.deepEqual(m2.json.measured.map(x => [x.name, x.ok]), [['argo', false], ['control', true]]);
  assert.match(m2.json.measured[0].error, /ffprobe could not read/);

  const s = cli(['site', '--dir', dir, '--no-status']);
  assert.equal(s.status, 0, s.stderr);
  assert.deepEqual(s.json.videos, ['control']);
  assert.deepEqual(s.json.noVideo, ['argo']);
  const html = fs.readFileSync(path.join(dir, 'site', 'index.html'), 'utf8');
  assert.match(html, /src="videos\/control\.mp4"/);
  assert.match(html, /Not reviewed yet/);
});

test('an older lineup keeps its key form and takes the model flags from its running builds', () => {
  const { root, dir, brief } = tempLineup();
  assert.equal(cli(['init', '--dir', dir, '--brief', brief, '--builders', 'control,take-one', '--no-clone']).status, 0);
  for (const sub of ['take-one']) fs.mkdirSync(path.join(dir, 'builds', sub, 'vendor', 'take-one'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'builds', 'take-one', 'vendor', 'take-one', 'SKILL.md'), '# stub\n');
  const file = path.join(dir, 'lineup.json');
  const old = JSON.parse(fs.readFileSync(file, 'utf8'));
  delete old.briefHash;
  delete old.dispatchOptions;
  old.delegations = { control: { id: 'd-old', key: `vlineup-${old.slug}-control-v1`, url: 'http://x', dispatchedAt: new Date().toISOString() } };
  fs.writeFileSync(file, JSON.stringify(old));
  const t3 = stubT3(root, [path.join(dir, 'builds', 'control'), path.join(dir, 'builds', 'take-one')]);
  const r = cli(['dispatch', '--dir', dir, '--dry-run'], { VIDEO_LINEUP_T3: t3 });
  assert.equal(r.status, 0, r.stderr);
  const cmd = r.json.find(x => x.name === 'take-one').command;
  assert.equal(cmd[cmd.indexOf('--key') + 1], `vlineup-${old.slug}-take-one-v1`);
  assert.deepEqual(['--provider', '--model', '--effort', '--runtime-mode'].map(f => cmd[cmd.indexOf(f) + 1]), ['claudeAgent', 'opus-x', 'high', 'auto']);
  assert.match(cli(['dispatch', '--help']).stdout, /^usage:/);
});
