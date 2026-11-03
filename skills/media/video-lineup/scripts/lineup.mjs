#!/usr/bin/env node
// video-lineup: build one brief with several video skills in parallel, then measure and compare the results.
// Commands: doctor, upstream, vet, init, register, dispatch, status, watch, measure, site. Run without a command for usage.
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as lib from './lib.mjs';
import * as scan from './scan.mjs';

const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY = JSON.parse(fs.readFileSync(process.env.VIDEO_LINEUP_REGISTRY || path.join(SKILL_DIR, 'builders.json'), 'utf8'));
const REPORT_BRIEF = 'Report after setup, after you pick the creative direction, after the first full render, after each review round, and when out/final.mp4 is written. Include file paths and check result lines. Do not estimate elapsed time; if you state a time, take it from `date` or file times.';
const BOOLEAN_FLAGS = new Set(['json', 'dry-run', 'no-setup', 'no-clone', 'no-qa', 'no-transcript', 'no-status', 'pinned', 'help']);
const VALUE_FLAGS = new Set(['dir', 'brief', 'builders', 'size', 'seconds', 'title', 't3', 't3-cli', 'only', 'provider', 'model', 'effort',
  'runtime-mode', 'parent-thread', 'interval', 'timeout', 'name', 'verdict', 'notes', 'commit', 'max-age-days', 'audit-level']);
const CACHE = process.env.VIDEO_LINEUP_CACHE || path.join(os.homedir(), '.cache', 'video-lineup');
const VETTED = path.join(CACHE, 'vetted.json');
const UPSTREAM_MAX_HOURS = 24;

const USAGE = `usage: node lineup.mjs <command> [--dir LINEUP_DIR] [flags]

  doctor   [--json]                         check tools and print the machine facts given to every build
  upstream [--max-age-days 180]             fetch the latest commit of every builder repo, scan prompts and code,
           [--audit-level high]             audit dependencies, and write upstream.json: ok, review or eliminated
  vet      --name B --verdict clean|block   record the agent review of B's latest commit (from upstream.json)
           [--notes TEXT]
  init     --brief FILE [--builders a,b]    make the lineup folder: clones at the vetted latest commits (from
           [--size WxH] [--seconds MIN-MAX] upstream.json; --pinned uses builders.json), skill links, setup
           [--title T] [--no-setup] [--no-clone] [--pinned]   installs and one handoff prompt per build
  register [--t3-cli PATH] [--dry-run]      register each build folder as a T3 project
  dispatch [--only a,b] [--provider ID --model SLUG --effort LEVEL] [--runtime-mode M] [--parent-thread ID] [--dry-run]
                                            start one T3 session per build with t3-handoff (post-pass builds wait for their
                                            input); the first dispatch's model flags become the lineup's defaults
  status   [--json]                         T3 state, reports and deliverables per build
  watch    [--interval 60] [--timeout 7200] one line per new report, state change or finished video; ends when every
                                            dispatched build is settled (END) or at the timeout (PAUSE). A rerun prints only
                                            what is new since the last watch (kept in .watch-state.json)
  measure  [--only a,b] [--no-qa] [--no-transcript]
                                            spec, loudness, poster, contact sheet, transcript and shared QA per finished build
  site                                      write site/index.html, the side-by-side page

--dir defaults to the current folder. Builders: ${REGISTRY.builders.map(b => b.name).join(', ')}.
Environment: VIDEO_LINEUP_T3 (t3-handoff's t3.mjs), VIDEO_LINEUP_T3_CLI (the t3 CLI), VIDEO_LINEUP_TTS (tts-voice.sh),
VIDEO_LINEUP_WHISPER (one command, with {wav} and {outdir}, that writes a .txt), EARSHOT_HOME (earshot model cache),
VIDEO_LINEUP_CACHE (upstream mirrors and review records, default ~/.cache/video-lineup).`;

// ---------- small helpers ----------

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { out._.push(a); continue; }
    const eq = a.indexOf('=');
    const key = eq > 0 ? a.slice(2, eq) : a.slice(2);
    if (!BOOLEAN_FLAGS.has(key) && !VALUE_FLAGS.has(key)) die(`unknown flag --${key}\n\n${USAGE}`);
    if (BOOLEAN_FLAGS.has(key)) {
      if (eq > 0) die(`--${key} takes no value`);
      out[key] = true;
      continue;
    }
    const value = eq > 0 ? a.slice(eq + 1) : argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[++i] : '';
    if (value === '') die(`--${key} needs a value`);
    out[key] = value;
  }
  return out;
}

const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, ...opts });
const print = v => console.log(JSON.stringify(v, null, 2));
const line = s => console.log(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const readJsonIf = p => { try { return readJson(p); } catch { return null; } };
// Like readJsonIf, but tells a missing file apart from one that does not parse.
function readJsonReport(p) {
  if (!fs.existsSync(p)) return { value: null, error: null };
  try { return { value: readJson(p), error: null }; } catch (e) { return { value: null, error: e.message }; }
}
const sha256 = text => createHash('sha256').update(text).digest('hex');
const ts = () => new Date().toTimeString().slice(0, 8);
const shq = s => `'${String(s).replace(/'/g, `'\\''`)}'`;
const split = s => (s ? String(s).split(',').map(x => x.trim()).filter(Boolean) : null);
function onlyNames(a, lineup) {
  const only = split(a.only);
  const names = lineup.builders.map(b => b.name);
  const bad = (only || []).filter(n => !names.includes(n));
  if (bad.length) die(`--only names a build that is not in this lineup: ${bad.join(', ')}. Builds: ${names.join(', ')}.`);
  return only;
}

function die(msg) {
  console.error(`video-lineup: ${msg}`);
  process.exit(1);
}

function which(name) {
  const r = run('sh', ['-c', 'command -v "$1"', 'sh', name]);
  return r.status === 0 ? r.stdout.trim() : null;
}

function version(cmd, args = ['--version']) {
  if (!cmd) return null;
  const r = run(cmd, args, { timeout: 20000 });
  return r.status === 0 ? (r.stdout || r.stderr).trim().split('\n')[0] : null;
}

// Run a command without blocking. With a timeout, the command runs in its own process group so the
// whole group is stopped, not only the shell. Those groups do not get a terminal's Ctrl-C, so a signal
// to this script stops them before it exits.
const GROUPS = new Set();
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => {
    for (const pid of GROUPS) { try { process.kill(-pid, 'SIGTERM'); } catch { /* already gone */ } }
    process.exit(130);
  });
}

function runAsync(cmd, args, { cwd, env, logFile, timeout } = {}) {
  return new Promise(resolvePromise => {
    const fd = logFile ? fs.openSync(logFile, 'a') : null;
    let stdout = '', stderr = '', finished = false;
    const child = spawn(cmd, args, { cwd, env: env || process.env, stdio: ['ignore', fd ?? 'pipe', fd ?? 'pipe'], detached: !!timeout });
    if (timeout && child.pid) GROUPS.add(child.pid);
    if (fd === null) {
      child.stdout.on('data', d => { stdout += d; });
      child.stderr.on('data', d => { stderr += d; });
    }
    const timer = timeout ? setTimeout(() => { try { process.kill(-child.pid, 'SIGTERM'); } catch { child.kill('SIGTERM'); } }, timeout) : null;
    const done = status => {
      if (finished) return;
      finished = true;
      GROUPS.delete(child.pid);
      if (timer) clearTimeout(timer);
      if (fd !== null) fs.closeSync(fd);
      resolvePromise({ status, stdout, stderr });
    };
    child.on('error', e => {
      stderr += String(e.message);
      if (fd !== null && !finished) fs.writeSync(fd, `spawn failed: ${e.message}\n`);
      done(127);
    });
    child.on('close', code => done(code));
  });
}

async function pool(items, size, fn) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => { while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); } };
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker));
  return out;
}

function samePath(a, b) {
  const real = p => { try { return fs.realpathSync(p); } catch { return path.resolve(p); } };
  return !!a && !!b && real(a) === real(b);
}

function duKB(p) {
  const r = run('du', ['-sk', p]);
  return r.status === 0 ? Number(r.stdout.split(/\s/)[0]) : 0;
}

const human = kb => (kb > 1024 * 1024 ? `${(kb / 1024 / 1024).toFixed(1)} GB` : `${Math.round(kb / 1024)} MB`);

// ---------- lineup files ----------

function lineupDir(a) {
  return path.resolve(a.dir || process.cwd());
}

const P = dir => ({
  json: path.join(dir, 'lineup.json'),
  brief: path.join(dir, 'brief', 'BRIEF.md'),
  handoffs: path.join(dir, 'handoffs'),
  site: path.join(dir, 'site'),
  qa: path.join(dir, 'tools', REGISTRY.qaTool.name),
});
const buildDir = (dir, name) => path.join(dir, 'builds', name);
const registryEntry = name => REGISTRY.builders.find(b => b.name === name);

function loadLineup(dir) {
  const j = readJsonIf(P(dir).json);
  if (!j) die(`No lineup.json in ${dir}. Run init there first, or pass --dir.`);
  j.projects ||= {};
  j.delegations ||= {};
  return j;
}

// Write to a temporary file and rename it, so a watch that reads mid-write never sees an empty file.
function saveLineup(dir, lineup) {
  const tmp = `${P(dir).json}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(lineup, null, 2)}\n`);
  fs.renameSync(tmp, P(dir).json);
}

function deliverables(dir, name) {
  const bd = buildDir(dir, name);
  const video = path.join(bd, 'out', 'final.mp4');
  const logFile = path.join(bd, 'BUILD-LOG.md');
  const vs = fs.existsSync(video) ? fs.statSync(video) : null;
  const log = fs.existsSync(logFile) ? lib.buildLogSections(fs.readFileSync(logFile, 'utf8')) : null;
  const poster = fs.existsSync(path.join(bd, 'out', 'poster.png'));
  return {
    video: !!vs && vs.size > 0,
    videoMB: vs ? Math.round(vs.size / 1e5) / 10 : 0,
    videoMtime: vs ? vs.mtimeMs : null,
    poster,
    log: !!log,
    logMissing: log ? log.missing : lib.LOG_SECTIONS,
    complete: !!vs && vs.size > 0 && poster && !!log && log.missing.length === 0,
  };
}

// ---------- tool discovery ----------

function firstExisting(candidates) {
  return candidates.find(p => p && fs.existsSync(p)) || null;
}

function findT3(a = {}) {
  return firstExisting([
    a.t3, process.env.VIDEO_LINEUP_T3,
    path.join(SKILL_DIR, '..', 't3-handoff', 'scripts', 't3.mjs'),
    path.join(SKILL_DIR, '..', '..', 'development', 't3-handoff', 'scripts', 't3.mjs'),
  ]);
}

function needT3(a) {
  const t3 = findT3(a);
  if (!t3) die('t3-handoff helper not found. Install the t3-handoff skill beside this one, or set VIDEO_LINEUP_T3 to its scripts/t3.mjs.');
  return t3;
}

function findT3Cli(a = {}) {
  return a['t3-cli'] || process.env.VIDEO_LINEUP_T3_CLI || which('t3') || firstExisting([path.join(os.homedir(), '.t3', 'bin', 't3')]);
}

function findTts() {
  return firstExisting([process.env.VIDEO_LINEUP_TTS, path.join(SKILL_DIR, '..', 'tts-voice', 'scripts', 'tts-voice.sh')]);
}

function findWhisper() {
  if (process.env.VIDEO_LINEUP_WHISPER) return { cmd: process.env.VIDEO_LINEUP_WHISPER, source: 'VIDEO_LINEUP_WHISPER' };
  const mlx = which('mlx_whisper');
  if (mlx) return { cmd: `${shq(mlx)} {wav} --model mlx-community/whisper-small-mlx --language en -f txt -o {outdir}`, source: mlx };
  const ysBin = path.join(os.homedir(), '.cache', 'youtube-summarize', 'mlx-venv', 'bin', 'mlx_whisper');
  const ysModels = path.join(os.homedir(), '.cache', 'youtube-summarize', 'models', 'mlx', 'models--mlx-community--whisper-small-mlx', 'snapshots');
  if (fs.existsSync(ysBin) && fs.existsSync(ysModels)) {
    const snap = fs.readdirSync(ysModels).map(s => path.join(ysModels, s)).find(s => fs.existsSync(path.join(s, 'config.json')));
    if (snap) return { cmd: `HF_HUB_OFFLINE=1 ${shq(ysBin)} {wav} --model ${shq(snap)} --language en -f txt -o {outdir}`, source: ysBin };
  }
  const ow = which('whisper');
  if (ow) return { cmd: `${shq(ow)} {wav} --model small --language en --output_format txt --output_dir {outdir}`, source: ow };
  return null;
}

function t3Projects(t3) {
  const r = run(process.execPath, [t3, 'projects'], { timeout: 60000 });
  try { return JSON.parse(r.stdout); } catch { die(`t3-handoff projects failed: ${(r.stderr || r.stdout).trim().slice(0, 400)}`); }
}

// ---------- doctor ----------

function machineFacts() {
  const f = {};
  const mac = process.platform === 'darwin';
  const osName = mac ? `macOS ${version('sw_vers', ['-productVersion']) || os.release()}` : `${os.type()} ${os.release()}`;
  f.os = `${osName} (${os.arch()})`;
  f.cpu = os.cpus()[0]?.model?.trim() || null;
  f.cores = os.cpus().length;
  f.memGB = Math.round(os.totalmem() / 2 ** 30);
  const ff = which('ffmpeg');
  if (ff) {
    const enc = run(ff, ['-hide_banner', '-encoders']).stdout || '';
    const fil = run(ff, ['-hide_banner', '-filters']).stdout || '';
    const has = (txt, n) => new RegExp(`^\\s*\\S+\\s+${n}\\s`, 'm').test(txt);
    f.ffmpeg = {
      path: ff,
      version: ((run(ff, ['-hide_banner', '-version']).stdout || '').match(/ffmpeg version (\S+)/) || [])[1] || null,
      libx264: has(enc, 'libx264'), aac: has(enc, 'aac'),
      drawtext: has(fil, 'drawtext'), subtitles: has(fil, 'subtitles'), ass: has(fil, 'ass'),
      tile: has(fil, 'tile'), ebur128: has(fil, 'ebur128'),
    };
  }
  const chrome = mac
    ? firstExisting(['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'])
    : which('google-chrome') || which('google-chrome-stable') || which('chromium');
  if (chrome) f.chrome = { path: chrome, version: version(chrome) };
  const pwCache = process.env.PLAYWRIGHT_BROWSERS_PATH || (mac ? path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright') : path.join(os.homedir(), '.cache', 'ms-playwright'));
  if (fs.existsSync(pwCache)) {
    const browsers = fs.readdirSync(pwCache).filter(d => /^(chromium|chromium_headless_shell|firefox|webkit)-\d+$/.test(d)).sort();
    // .links holds one file per playwright-core install that used this cache; map each version to its Chromium.
    const versions = new Map();
    const links = path.join(pwCache, '.links');
    for (const l of fs.existsSync(links) ? fs.readdirSync(links) : []) {
      try {
        const core = fs.readFileSync(path.join(links, l), 'utf8').trim();
        const v = readJson(path.join(core, 'package.json')).version;
        const rev = readJson(path.join(core, 'browsers.json')).browsers.find(b => b.name === 'chromium')?.revision;
        if (v && rev && browsers.includes(`chromium-${rev}`)) versions.set(v, rev);
      } catch { /* a stale link to a deleted project */ }
    }
    f.playwright = { cache: pwCache, browsers, versions: [...versions].map(([v, rev]) => ({ version: v, revision: rev })).sort((x, y) => y.revision - x.revision) };
  }
  const whisper = findWhisper();
  if (whisper) f.whisper = whisper.cmd;
  f.node = process.version;
  for (const [k, cmd] of [['npm', 'npm'], ['uv', 'uv'], ['python3', 'python3'], ['bun', 'bun'], ['git', 'git']]) {
    const v = version(which(cmd));
    if (v) f[k] = (v.match(/\d+(\.\d+)+/) || [v])[0];
  }
  return f;
}

function doctorChecks(dir) {
  const f = machineFacts();
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  const t3 = findT3(), cli = findT3Cli(), tts = findTts(), whisper = f.whisper ? findWhisper() : null;
  const df = run('df', ['-k', fs.existsSync(dir) ? dir : os.homedir()]);
  const freeKB = Number((df.stdout || '').trim().split('\n').pop()?.split(/\s+/)[3]) || 0;
  const checks = [
    { name: 'node', required: true, ok: nodeMajor >= 22, detail: process.version },
    { name: 'node 24', required: false, ok: nodeMajor >= 24, detail: nodeMajor >= 24 ? 'yes' : 'register, dispatch, status and watch run t3-handoff, which needs Node 24' },
    { name: 'git', required: true, ok: !!f.git, detail: f.git || 'not on PATH' },
    { name: 'ffmpeg', required: true, ok: !!f.ffmpeg?.libx264 && !!f.ffmpeg?.aac && !!f.ffmpeg?.tile && !!f.ffmpeg?.ebur128, detail: f.ffmpeg ? `${f.ffmpeg.version} at ${f.ffmpeg.path}; libx264 ${f.ffmpeg.libx264}, aac ${f.ffmpeg.aac}, tile ${f.ffmpeg.tile}, ebur128 ${f.ffmpeg.ebur128}` : 'not on PATH' },
    { name: 'ffprobe', required: true, ok: !!which('ffprobe'), detail: which('ffprobe') || 'not on PATH' },
    { name: 'npm', required: false, ok: !!f.npm, detail: f.npm ? `${f.npm} (explainroo, argo)` : 'not on PATH: explainroo and argo setup will fail' },
    { name: 'uv', required: false, ok: !!f.uv, detail: f.uv ? `${f.uv} (shared QA, earshot)` : 'not on PATH: shared QA and earshot setup will fail' },
    { name: 't3-handoff', required: false, ok: !!t3, detail: t3 || 'not found: set VIDEO_LINEUP_T3, or dispatch the prompts by hand' },
    { name: 't3 CLI', required: false, ok: !!cli, detail: cli || 'not found: set VIDEO_LINEUP_T3_CLI, or register projects in T3 Code' },
    { name: 'gh', required: false, ok: !!which('gh'), detail: which('gh') ? `${which('gh')} (upstream checks whether a repo is archived)` : 'not on PATH: upstream cannot tell whether a GitHub repo is archived' },
    { name: 'tts-voice', required: false, ok: !!tts, detail: tts || 'not found: the control build will use macOS say' },
    { name: 'whisper', required: false, ok: !!whisper, detail: whisper ? whisper.source : 'not found: measure skips transcripts (set VIDEO_LINEUP_WHISPER)' },
    { name: 'chrome', required: false, ok: !!f.chrome, detail: f.chrome?.path || 'no Google Chrome: take-one will fail and huashu-motion needs OM_CHROME; the other builders can use a Playwright Chromium' },
    { name: 'disk', required: false, ok: freeKB > 15 * 1024 * 1024, detail: `${human(freeKB)} free; a full lineup takes about 5 GB for 40 s videos and about 10 GB for 60 to 75 s, plus up to 2.5 GB of shared model caches the first time` },
  ];
  return { ok: checks.every(c => !c.required || c.ok), checks, facts: f, factsText: lib.machineFactsText(f) };
}

function doctor(a) {
  const d = doctorChecks(lineupDir(a));
  if (a.json) print(d);
  else {
    for (const c of d.checks) line(`${c.ok ? 'ok  ' : c.required ? 'FAIL' : 'warn'} ${c.name.padEnd(11)} ${c.detail}`);
    line(`\nMachine facts given to each build:\n${d.factsText}`);
  }
  if (!d.ok) process.exitCode = 1;
}

// ---------- upstream and vet ----------

// Each new lineup builds with every builder's newest commit, so that commit is checked first: fetched into a
// mirror under CACHE, refused if the repo is archived or stale, scanned for prompt injection and dangerous
// code, its dependencies audited without running install scripts, and compared with the last agent review
// in vetted.json. Builders that fail are eliminated; builders with new, unreviewed commits wait for vet.

const GIT_ENV = { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_LFS_SKIP_SMUDGE: '1' };
const git = (cwd, args, opts = {}) => run('git', ['-C', cwd, ...args], { env: GIT_ENV, timeout: 300000, ...opts });
const tail = r => (r.stderr || r.stdout || '').trim().split('\n').slice(-3).join(' ').slice(0, 300);
const AUDIT_LEVELS = ['low', 'moderate', 'high', 'critical'];

function upstreamTargets() {
  return REGISTRY.builders.filter(b => b.repo).map(b => ({ name: b.name, repo: b.repo, pinned: b.commit, audit: b.audit || [], allow: b.scanAllow || [] }));
}

async function mirrorRepo(t) {
  const dest = path.join(CACHE, 'upstream', t.name);
  if (!fs.existsSync(path.join(dest, '.git'))) {
    const partial = `${dest}.partial`;
    fs.rmSync(partial, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const r = await runAsync('git', ['clone', '--quiet', '--no-checkout', t.repo, partial], { env: GIT_ENV, timeout: 600000 });
    if (r.status !== 0) throw new Error(`git clone failed: ${tail(r)}`);
    fs.renameSync(partial, dest);
  } else {
    git(dest, ['remote', 'set-url', 'origin', t.repo]);
    const r = await runAsync('git', ['-C', dest, 'fetch', '--quiet', '--prune', 'origin'], { env: GIT_ENV, timeout: 600000 });
    if (r.status !== 0) throw new Error(`git fetch failed: ${tail(r)}`);
  }
  git(dest, ['remote', 'set-head', 'origin', '--auto']);
  const commit = git(dest, ['rev-parse', 'origin/HEAD']).stdout.trim();
  if (!/^[0-9a-f]{40}$/.test(commit)) throw new Error('could not resolve the default branch (origin/HEAD)');
  const co = git(dest, ['checkout', '--quiet', '--force', '--detach', commit]);
  if (co.status !== 0) throw new Error(`checkout failed: ${tail(co)}`);
  git(dest, ['clean', '-qffdx']);
  return { dest, commit, date: git(dest, ['log', '-1', '--format=%cI', commit]).stdout.trim() };
}

// Every tracked path at the commit. Links and submodules are described, never followed; binary files
// give only their first bytes; text files up to MAX_SCAN_BYTES are read for the scan.
function treeOf(dest, commit) {
  const r = git(dest, ['ls-tree', '-r', '-z', '--full-tree', commit]);
  const entries = [], files = [];
  for (const rec of r.stdout.split('\0').filter(Boolean)) {
    const tab = rec.indexOf('\t');
    const [mode, , obj] = rec.slice(0, tab).split(' ');
    const rel = rec.slice(tab + 1);
    if (mode === '120000') { entries.push({ path: rel, type: 'symlink', target: git(dest, ['cat-file', 'blob', obj]).stdout }); continue; }
    if (mode === '160000') { entries.push({ path: rel, type: 'submodule', target: obj }); continue; }
    const full = path.join(dest, rel);
    let st;
    try { st = fs.lstatSync(full); } catch { continue; }
    if (!st.isFile()) continue;
    const head = Buffer.alloc(Math.min(8000, st.size));
    const fd = fs.openSync(full, 'r');
    fs.readSync(fd, head, 0, head.length, 0);
    fs.closeSync(fd);
    if (head.includes(0)) entries.push({ path: rel, type: 'file', magic: head.subarray(0, 4).toString('hex') });
    else if (st.size <= scan.MAX_SCAN_BYTES) files.push({ path: rel, text: fs.readFileSync(full, 'utf8') });
  }
  return { entries, files };
}

function archivedOf(repo) {
  const m = String(repo).match(/github\.com[/:]([^/]+)\/([^/]+?)(\.git)?$/);
  if (!m || !which('gh')) return null;
  const r = run('gh', ['api', `repos/${m[1]}/${m[2]}`, '--jq', '.archived'], { timeout: 30000 });
  return r.status === 0 ? r.stdout.trim() === 'true' : null;
}

function changedSince(dest, from, to) {
  if (git(dest, ['cat-file', '-e', `${from}^{commit}`]).status !== 0) return { error: `${from.slice(0, 8)} is no longer in the upstream history; review the whole repo` };
  const r = git(dest, ['diff', '--name-status', from, to]);
  return { from, files: r.stdout.trim().split('\n').filter(Boolean) };
}

// Resolve the dependency tree without running any install script, then audit it. npm: a lockfile from
// `npm install --package-lock-only --ignore-scripts`, then `npm audit`. Python: `uv pip compile --no-build`,
// then pip-audit against the pinned list (it queries the advisory database and installs nothing).
async function auditOne(t, mir, entry, level) {
  const label = entry.packages ? `npm packages ${entry.packages}` : `${entry.kind} in ${entry.cwd || '.'}`;
  const work = fs.mkdtempSync(path.join(os.tmpdir(), `vlineup-audit-${t.name}-`));
  try {
    const ar = run('sh', ['-c', `git -C ${shq(mir.dest)} archive ${mir.commit} | tar -x -C ${shq(work)}`], { env: GIT_ENV });
    if (ar.status !== 0) throw new Error(`git archive failed: ${tail(ar)}`);
    const cwd = entry.packages ? fs.mkdtempSync(path.join(work, 'deps-')) : path.join(work, entry.cwd || '.');
    if (entry.kind === 'npm') {
      const npm = which('npm');
      if (!npm) throw new Error('npm not on PATH');
      const quiet = ['--package-lock-only', '--ignore-scripts', '--no-fund', '--no-audit'];
      if (entry.packages) {
        fs.writeFileSync(path.join(cwd, 'package.json'), '{"name":"lineup-audit","version":"0.0.0","private":true}\n');
        const r = await runAsync(npm, ['install', ...quiet, '-D', ...entry.packages.split(/\s+/)], { cwd, timeout: 600000 });
        if (r.status !== 0) throw new Error(`npm could not resolve the packages: ${tail(r)}`);
      } else if (!['package-lock.json', 'npm-shrinkwrap.json'].some(f => fs.existsSync(path.join(cwd, f)))) {
        const r = await runAsync(npm, ['install', ...quiet], { cwd, timeout: 600000 });
        if (r.status !== 0) throw new Error(`npm could not resolve a lockfile: ${tail(r)}`);
      }
      const r = await runAsync(npm, ['audit', '--json', '--package-lock-only'], { cwd, timeout: 300000 });
      let json;
      try { json = JSON.parse(r.stdout); } catch { throw new Error(`npm audit gave no JSON: ${tail(r)}`); }
      if (json.error) throw new Error(`npm audit: ${json.error.summary || json.error.code}`);
      const counts = scan.npmAuditCounts(json);
      return { cwd: label, kind: 'npm', counts, blocks: scan.auditBlocks(counts, level),
        summary: `${counts.critical} critical, ${counts.high} high, ${counts.moderate} moderate, ${counts.low} low (blocks at ${level} and above)` };
    }
    if (entry.kind === 'python') {
      const uv = which('uv');
      if (!uv) throw new Error('uv not on PATH');
      const req = path.join(work, 'lineup-audit-requirements.txt');
      const extras = (entry.extras || []).flatMap(e => ['--extra', e]);
      let r = await runAsync(uv, ['pip', 'compile', '--quiet', '--no-build', ...extras, 'pyproject.toml', '-o', req], { cwd, timeout: 600000 });
      if (r.status !== 0) throw new Error(`uv could not resolve the dependencies: ${tail(r)}`);
      r = await runAsync(uv, ['tool', 'run', '--quiet', 'pip-audit', '-r', req, '--no-deps', '--disable-pip', '-f', 'json', '--progress-spinner', 'off'], { cwd: work, timeout: 600000 });
      let json;
      try { json = JSON.parse(r.stdout); } catch { throw new Error(`pip-audit gave no JSON: ${tail(r)}`); }
      const vulns = scan.pipAuditVulns(json);
      const ids = vulns.map(v => `${v.package} ${v.version} ${v.id}${v.fix ? ` (fixed in ${v.fix})` : ''}`);
      return { cwd: label, kind: 'python', vulns, blocks: vulns.length > 0,
        summary: vulns.length ? `${vulns.length} known vulnerabilit${vulns.length > 1 ? 'ies' : 'y'}: ${ids.slice(0, 4).join('; ')}` : 'no known vulnerabilities' };
    }
    throw new Error(`unknown audit kind ${entry.kind}`);
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

const upstreamFiles = a => [path.join(CACHE, 'upstream.json'), ...(a.dir ? [path.join(lineupDir(a), 'upstream.json')] : [])];

function writeUpstream(a, data) {
  for (const f of upstreamFiles(a)) {
    fs.mkdirSync(path.dirname(f), { recursive: true });
    const tmp = `${f}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`);
    fs.renameSync(tmp, f);
  }
}

function upstreamSummary(data) {
  const b = data.builders;
  const names = s => Object.keys(b).filter(n => b[n].status === s);
  return {
    checkedAt: data.checkedAt,
    builders: Object.fromEntries(Object.entries(b).map(([n, r]) => [n, {
      status: r.status,
      commit: r.commit ? r.commit.slice(0, 12) : null,
      date: r.date ? r.date.slice(0, 10) : null,
      ageDays: r.ageDays ?? null,
      blocks: (r.findings || []).filter(f => f.level === 'block' && !f.allowed).length,
      warns: (r.findings || []).filter(f => f.level === 'warn' && !f.allowed).length,
      audit: (r.audit || []).map(x => `${x.cwd}: ${x.error ? `not run (${x.error})` : x.summary}`),
      reasons: r.reasons,
    }])),
    ok: names('ok'),
    review: names('review'),
    eliminated: names('eliminated'),
  };
}

async function upstream(a) {
  const maxAgeDays = a['max-age-days'] === undefined ? 180 : Number(a['max-age-days']);
  if (!Number.isFinite(maxAgeDays) || maxAgeDays < 1) die('--max-age-days wants a whole number of days, for example 180.');
  const level = a['audit-level'] || 'high';
  if (!AUDIT_LEVELS.includes(level)) die(`--audit-level wants one of ${AUDIT_LEVELS.join(', ')}.`);
  if (!which('git')) die('git must be on PATH.');
  const vetted = readJsonIf(VETTED) || {};
  const now = Date.now();
  const results = {};
  await pool(upstreamTargets(), 3, async t => {
    const r = (results[t.name] = { repo: t.repo, pinned: t.pinned });
    try {
      const mir = await mirrorRepo(t);
      Object.assign(r, { commit: mir.commit, date: mir.date, mirror: mir.dest });
      r.ageDays = Math.floor((now - Date.parse(mir.date)) / 86400000);
      r.archived = archivedOf(t.repo);
      const tree = treeOf(mir.dest, mir.commit);
      r.filesScanned = tree.files.length;
      r.findings = scan.applyAllow([...scan.scanFiles(tree.files), ...scan.scanTree(tree.entries)], t.allow);
      r.audit = await Promise.all(t.audit.map(e => auditOne(t, mir, e, level)
        .catch(err => ({ cwd: e.packages ? `npm packages ${e.packages}` : `${e.kind} in ${e.cwd || '.'}`, kind: e.kind, blocks: false, error: err.message }))));
      const v = vetted[t.name] || null;
      r.lastReviewed = v;
      r.changedSinceReview = v && v.commit !== mir.commit ? changedSince(mir.dest, v.commit, mir.commit) : null;
    } catch (e) { r.error = e.message; }
    Object.assign(r, scan.decide({ ...r, vetted: vetted[t.name] }, { maxAgeDays }));
  });
  const data = { version: 1, checkedAt: new Date().toISOString(), maxAgeDays, auditLevel: level, builders: results };
  writeUpstream(a, data);
  const s = upstreamSummary(data);
  print({
    upstream: upstreamFiles(a),
    ...s,
    next: s.review.length
      ? `Review ${s.review.join(', ')} with one fresh subagent each (references/security-review.md), check each verdict's evidence, then run vet --name NAME --verdict clean|block for each. Then init.`
      : 'init (it uses the ok builders at these commits and leaves out the eliminated ones).',
  });
}

function vet(a) {
  if (!a.name) die('vet needs --name BUILDER.');
  if (!['clean', 'block'].includes(a.verdict)) die('vet needs --verdict clean or --verdict block.');
  if (a.verdict === 'block' && !a.notes) die('A block verdict needs --notes saying what was found, with file and line.');
  const file = upstreamFiles(a).reverse().find(f => fs.existsSync(f));
  const data = file ? readJsonIf(file) : null;
  if (!data) die('No upstream.json. Run upstream first.');
  const r = data.builders[a.name];
  if (!r) die(`${a.name} is not in upstream.json. Builders: ${Object.keys(data.builders).join(', ')}.`);
  if (!r.commit) die(`${a.name} has no fetched commit: ${(r.reasons || []).join('; ')}`);
  if (a.commit && !r.commit.startsWith(a.commit)) die(`upstream.json has ${a.name} at ${r.commit.slice(0, 12)}, not ${a.commit}. Run upstream again and review that commit.`);
  const scanOnly = scan.decide({ ...r, vetted: null }, { maxAgeDays: data.maxAgeDays });
  if (a.verdict === 'clean' && scanOnly.status === 'eliminated') {
    die(`${a.name} is eliminated by the checks, which a review cannot override: ${scanOnly.reasons.join('; ')}. A human may add a scanAllow entry with a reason in builders.json; otherwise leave it out.`);
  }
  const vetted = readJsonIf(VETTED) || {};
  vetted[a.name] = { repo: r.repo, commit: r.commit, verdict: a.verdict, notes: a.notes || '', at: new Date().toISOString() };
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(VETTED, `${JSON.stringify(vetted, null, 2)}\n`);
  for (const f of upstreamFiles(a)) {
    const d = readJsonIf(f);
    if (!d?.builders?.[a.name] || d.builders[a.name].commit !== r.commit) continue;
    const b = d.builders[a.name];
    b.lastReviewed = vetted[a.name];
    b.changedSinceReview = null;
    Object.assign(b, scan.decide({ ...b, vetted: vetted[a.name] }, { maxAgeDays: d.maxAgeDays }));
    const tmp = `${f}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, `${JSON.stringify(d, null, 2)}\n`);
    fs.renameSync(tmp, f);
  }
  const after = readJsonIf(upstreamFiles(a).reverse().find(f => fs.existsSync(f)));
  print({ name: a.name, commit: r.commit, verdict: a.verdict, status: after.builders[a.name].status, reasons: after.builders[a.name].reasons, vetted: VETTED });
}

// ---------- init ----------

// Clone into DEST.partial and rename it only after the checkout succeeds, so a .git folder at DEST always
// means a finished checkout. A checkout that an older run left unfinished (no tracked files) is repaired.
async function cloneAt(repo, commit, dest, noClone) {
  if (fs.existsSync(path.join(dest, '.git'))) {
    const head = run('git', ['-C', dest, 'rev-parse', 'HEAD']).stdout.trim();
    if (head === commit && run('git', ['-C', dest, 'ls-files']).stdout.trim()) return 'present';
    if (head === commit) {
      const r = await runAsync('git', ['-C', dest, 'checkout', '--quiet', '--force', commit]);
      if (r.status !== 0) throw new Error(`git checkout ${commit} in ${dest} failed: ${r.stderr.trim()}`);
      return 'repaired';
    }
    throw new Error(`${dest} is at ${head.slice(0, 8)}, not the pinned ${commit.slice(0, 8)}. Move it away, or check out the pin.`);
  }
  if (noClone) return 'skipped';
  if (fs.existsSync(dest) && fs.readdirSync(dest).length) throw new Error(`${dest} exists and is not a git checkout. Move it away first.`);
  const partial = `${dest}.partial`;
  fs.rmSync(partial, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  let r = await runAsync('git', ['clone', '--quiet', '--filter=blob:none', '--no-checkout', repo, partial]);
  if (r.status !== 0) throw new Error(`git clone ${repo} failed: ${r.stderr.trim()}`);
  r = await runAsync('git', ['-C', partial, 'checkout', '--quiet', commit]);
  if (r.status !== 0) throw new Error(`git checkout ${commit} in ${partial} failed: ${r.stderr.trim()}`);
  fs.rmSync(dest, { recursive: true, force: true });
  fs.renameSync(partial, dest);
  return 'cloned';
}

function ensureLink(linkPath, target) {
  let st = null;
  try { st = fs.lstatSync(linkPath); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  if (st) {
    if (!st.isSymbolicLink()) throw new Error(`${linkPath} exists and is not a symlink`);
    if (fs.readlinkSync(linkPath) === target) return;
    fs.unlinkSync(linkPath);
  }
  fs.symlinkSync(target, linkPath);
}

function initBuildRepo(bd) {
  const gi = path.join(bd, '.gitignore');
  // Rendered frames and audio stay out of git: in the second lineup, build agents committed them and the
  // build repos grew to 1.4 GB.
  if (!fs.existsSync(gi)) {
    fs.writeFileSync(gi, ['vendor/', 'node_modules/', '.venv/', 'out/', 'frames/', 'build/frames/', 'work/', 'INSTALL-NOTES.log', '.lineup-setup.json',
      '*.mp4', '*.mov', '*.webm', '*.wav', '*.mp3', '*.m4a', '*.aiff', '*.flac', '*.png', '*.jpg', '*.jpeg', '*.webp', ''].join('\n'));
  }
  if (fs.existsSync(path.join(bd, '.git'))) return;
  run('git', ['init', '-q', '-b', 'main'], { cwd: bd });
  run('git', ['add', '.gitignore'], { cwd: bd });
  const named = run('git', ['config', 'user.name'], { cwd: bd }).stdout.trim() && run('git', ['config', 'user.email'], { cwd: bd }).stdout.trim();
  const id = named ? [] : ['-c', 'user.name=video-lineup', '-c', 'user.email=video-lineup@localhost'];
  run('git', [...id, 'commit', '-q', '-m', 'Start build folder'], { cwd: bd });
}

function narrationLine() {
  const tts = findTts();
  if (!tts) return 'a free local voice: macOS `say` (for example `say -o build/audio/s1.aiff "<text>"`) or another offline engine already on this machine. No cloud TTS. Log which one you used.';
  const skillMd = path.join(path.dirname(path.dirname(tts)), 'SKILL.md');
  return `the \`tts-voice\` skill (Chatterbox, free and offline). Read \`${skillMd}\`. Make one call per scene, for example \`${tts} "<text>" --voice default --format wav -o build/audio/s1.wav\` (add \`--mps\` on Apple Silicon), then time each scene to its audio with ffprobe. A cold model load takes about 30 s. If it fails, use macOS \`say\` and log why.`;
}

function promptVars(dir, lineup, reg, factsText) {
  const after = reg.after || '';
  return {
    name: reg.name,
    folder: buildDir(dir, reg.name),
    port: reg.port,
    repo: reg.repo,
    commit: reg.commit,
    short: String(reg.commit).slice(0, 8),
    brief: P(dir).brief,
    lineup: dir,
    slug: lineup.slug,
    width: lineup.format.width,
    height: lineup.format.height,
    minSeconds: lineup.format.minSeconds,
    maxSeconds: lineup.format.maxSeconds,
    aspect: lib.aspect(lineup.format.width, lineup.format.height),
    after,
    input: after ? path.join(buildDir(dir, after), 'out', 'final.mp4') : '',
    narration: narrationLine(),
    earshotHome: process.env.EARSHOT_HOME || path.join(os.homedir(), '.cache', 'earshot'),
    facts: factsText,
  };
}

function writePrompt(dir, lineup, reg, factsText) {
  const vars = promptVars(dir, lineup, reg, factsText);
  const read = rel => fs.readFileSync(path.join(SKILL_DIR, rel), 'utf8').trimEnd();
  const body = [
    `# Video build: ${reg.name}`,
    '',
    `Lineup: "${lineup.title}". Folder: \`${vars.folder}\`. Assigned port: ${reg.port}.`,
    '',
    lib.render(read(`builders/${reg.name}.md`), vars),
    '',
    lib.render(read('templates/rules.md'), vars),
    '',
    lib.render(read('templates/contract.md'), vars),
    '',
  ].join('\n');
  const file = path.join(P(dir).handoffs, `${reg.name}.prompt.md`);
  fs.writeFileSync(file, body);
  return file;
}

async function setupBuild(dir, reg, vars) {
  const bd = buildDir(dir, reg.name);
  if (!reg.setup?.length) return { state: 'none' };
  const marker = path.join(bd, '.lineup-setup.json');
  const prev = readJsonIf(marker);
  if (prev?.ok && prev.commit === reg.commit) return { state: 'present' };
  const logFile = path.join(bd, 'INSTALL-NOTES.log');
  const env = { ...process.env };
  for (const [k, v] of Object.entries(reg.env || {})) env[k] = lib.render(v, vars);
  for (const step of reg.setup) {
    fs.appendFileSync(logFile, `\n${ts()} $ (cd ${step.cwd}) ${step.run}\n`);
    const r = await runAsync('sh', ['-c', step.run], { cwd: path.join(bd, step.cwd), env, logFile });
    fs.appendFileSync(logFile, `${ts()} exit ${r.status}${r.status && step.allowFail ? ' (allowed)' : ''}\n`);
    if (r.status !== 0 && !step.allowFail) {
      fs.writeFileSync(marker, JSON.stringify({ ok: false, commit: reg.commit, failed: step.run, exit: r.status }, null, 2));
      return { state: 'failed', step: step.run, exit: r.status, log: logFile };
    }
  }
  fs.writeFileSync(marker, JSON.stringify({ ok: true, commit: reg.commit, at: new Date().toISOString() }, null, 2));
  return { state: 'done', log: logFile };
}

async function init(a) {
  const dir = lineupDir(a);
  const paths = P(dir);
  const briefSrc = a.brief ? path.resolve(a.brief) : paths.brief;
  if (!fs.existsSync(briefSrc)) die(`No brief at ${briefSrc}. Copy ${path.join(SKILL_DIR, 'templates', 'BRIEF.md')}, fill it in, and pass --brief FILE.`);
  const briefText = fs.readFileSync(briefSrc, 'utf8');
  const leftovers = lib.templateLeftovers(briefText);
  if (leftovers.length) die(`The brief still has template text: ${leftovers.join(', ')}. Replace it with the real title, pages and paths.`);
  const parsed = lib.parseBrief(briefText);
  let size, secs;
  try {
    size = a.size ? lib.parseSize(a.size) : parsed.width ? { width: parsed.width, height: parsed.height } : null;
    secs = a.seconds ? lib.parseSeconds(a.seconds) : parsed.minSeconds !== null ? { minSeconds: parsed.minSeconds, maxSeconds: parsed.maxSeconds } : null;
  } catch (e) { die(e.message); }
  if (!size) die('No frame size. Put "- Format: 16:9, 1920x1080, ..." in the brief, or pass --size 1920x1080.');
  if (!secs) die('No length. Put "- Length: 30 to 45 seconds." in the brief, or pass --seconds 30-45.');
  const title = a.title || parsed.title;
  if (!title) die('The brief needs a "# Title" first line, or pass --title.');
  const noClone = !!a['no-clone'];
  const facts = doctorChecks(dir);
  if (!facts.ok && process.env.VIDEO_LINEUP_SKIP_DOCTOR !== '1') die(`doctor has FAIL lines: ${facts.checks.filter(c => c.required && !c.ok).map(c => `${c.name}: ${c.detail}`).join('; ')}`);

  const existing = readJsonIf(paths.json);
  const briefHash = sha256(briefText);
  const all = REGISTRY.builders.map(b => b.name);
  const chosen = split(a.builders) || existing?.builders?.map(b => b.name) || all;
  const unknown = chosen.filter(n => !all.includes(n));
  if (unknown.length) die(`Unknown builder: ${unknown.join(', ')}. Builders: ${all.join(', ')}.`);
  for (const n of chosen) {
    const after = registryEntry(n).after;
    if (after && !chosen.includes(after)) die(`${n} works on the ${after} video, so ${after} must be in the lineup too.`);
  }

  // Commits. A new builder in the lineup gets its latest upstream commit that passed upstream and vet; a
  // builder already in lineup.json keeps its commit, so a rerun never moves a running build. --pinned and
  // --no-clone use the commits in builders.json. Eliminated builders leave the lineup with their reasons.
  const kept = Object.fromEntries((existing?.builders || []).filter(b => b.commit).map(b => [b.name, b.commit]));
  const usePins = !!a.pinned || noClone;
  let up, upFile;
  const getUp = () => {
    if (up !== undefined) return up;
    upFile = [path.join(dir, 'upstream.json'), path.join(CACHE, 'upstream.json')].find(f => fs.existsSync(f));
    up = upFile ? readJsonIf(upFile) : null;
    const hours = up ? (Date.now() - Date.parse(up.checkedAt)) / 3600000 : Infinity;
    if (!(hours <= UPSTREAM_MAX_HOURS)) {
      die(`No upstream check from the last ${UPSTREAM_MAX_HOURS} hours. Run \`node ${shq(path.join(SKILL_DIR, 'scripts', 'lineup.mjs'))} upstream --dir ${shq(dir)}\`, review and vet the builders it lists, then init again. (--pinned builds the commits in builders.json instead.)`);
    }
    return up;
  };
  const commitFor = {}, eliminated = {}, unreviewed = [];
  for (const n of chosen) {
    const reg = registryEntry(n);
    if (!reg.repo) continue;
    if (kept[n]) { commitFor[n] = kept[n]; continue; }
    if (usePins) { commitFor[n] = reg.commit; continue; }
    const s = getUp().builders?.[n];
    if (s?.status === 'ok' && s.commit) commitFor[n] = s.commit;
    else if (s?.status === 'review') unreviewed.push(`${n} (${String(s.commit).slice(0, 8)})`);
    else eliminated[n] = s?.reasons?.length ? s.reasons : ['not in upstream.json'];
  }
  if (unreviewed.length) die(`Not reviewed yet: ${unreviewed.join(', ')}. Review each with a fresh subagent (references/security-review.md) and run vet, or leave it out with --builders.`);
  for (const n of chosen) {
    const after = registryEntry(n).after;
    if (after && eliminated[after] && !eliminated[n]) eliminated[n] = [`works on the ${after} video, and ${after} is eliminated`];
  }
  const active = chosen.filter(n => !eliminated[n]);
  if (!active.length) die(`Every chosen builder is eliminated: ${Object.entries(eliminated).map(([n, r]) => `${n}: ${r.join('; ')}`).join(' | ')}`);
  const qaName = REGISTRY.qaTool.name;
  let qaCommit = existing?.qaTool?.commit || (existing?.builders?.length && !existing.qaTool ? REGISTRY.qaTool.commit : null) || (usePins ? REGISTRY.qaTool.commit : null);
  let qaEliminated = null;
  if (!qaCommit) {
    const s = getUp().builders?.[qaName];
    if (s?.status === 'ok' && s.commit) qaCommit = s.commit;
    else qaEliminated = s?.status === 'review' ? [`${qaName} is not reviewed yet at ${String(s.commit).slice(0, 8)}`] : s?.reasons?.length ? s.reasons : ['not in upstream.json'];
  }
  // Running builds and reviewers read brief/BRIEF.md, so once builds are dispatched the brief must not change.
  // A lineup.json from before briefHash existed uses the brief file on disk as its baseline.
  const dispatched = Object.keys(existing?.delegations || {}).length > 0;
  const baseline = existing?.briefHash ?? (fs.existsSync(paths.brief) ? sha256(fs.readFileSync(paths.brief, 'utf8')) : null);
  if (dispatched && baseline && baseline !== briefHash) {
    const copy = path.join(path.dirname(paths.brief), `.BRIEF-${baseline.slice(0, 12)}.md`);
    die(`brief/BRIEF.md would change after builds were dispatched. Running builds and reviewers read it.${fs.existsSync(copy) ? ` Restore it from ${copy} if it was edited in place.` : ''} Put the new brief in a new --dir.`);
  }
  const order = all.filter(n => active.includes(n));
  const lineup = {
    version: 1,
    title,
    slug: existing?.slug || lib.slugify(title),
    format: { ...size, ...secs },
    briefHash,
    createdAt: existing?.createdAt || new Date().toISOString(),
    builders: order.map(n => { const b = registryEntry(n); return { name: b.name, kind: b.kind, repo: b.repo, commit: b.repo ? commitFor[n] : b.commit, port: b.port, after: b.after || null }; }),
    qaTool: { repo: REGISTRY.qaTool.repo, commit: qaCommit, eliminated: qaEliminated },
    upstream: usePins ? 'pinned (builders.json)' : up ? { checkedAt: up.checkedAt, file: path.join(dir, 'upstream.json') } : existing?.upstream || 'kept from the earlier init',
    eliminated: { ...(existing?.eliminated || {}), ...eliminated },
    projects: existing?.projects || {},
    dispatchOptions: existing?.dispatchOptions || {},
    delegations: existing?.delegations || {},
  };

  for (const d of [path.dirname(paths.brief), paths.handoffs, paths.site]) fs.mkdirSync(d, { recursive: true });
  if (!samePath(briefSrc, paths.brief)) fs.copyFileSync(briefSrc, paths.brief);
  fs.writeFileSync(path.join(path.dirname(paths.brief), `.BRIEF-${briefHash.slice(0, 12)}.md`), briefText);
  if (upFile && !samePath(upFile, path.join(dir, 'upstream.json'))) fs.copyFileSync(upFile, path.join(dir, 'upstream.json'));
  saveLineup(dir, lineup);
  const effective = n => ({ ...registryEntry(n), commit: lineup.builders.find(b => b.name === n).commit });

  const results = {};
  await pool(order, 4, async name => {
    const reg = effective(name);
    const bd = buildDir(dir, name);
    fs.mkdirSync(path.join(bd, 'out'), { recursive: true });
    fs.mkdirSync(path.join(bd, '.claude', 'skills'), { recursive: true });
    const res = (results[name] = { folder: bd });
    try {
      if (reg.repo) {
        res.clone = await cloneAt(reg.repo, reg.commit, path.join(bd, 'vendor', reg.vendor), noClone);
        for (const [link, sub] of Object.entries(reg.links || {})) {
          const linkPath = path.join(bd, '.claude', 'skills', link);
          ensureLink(linkPath, path.join('..', '..', 'vendor', reg.vendor, sub === '.' ? '' : sub));
          if (!noClone && !fs.existsSync(path.join(linkPath, 'SKILL.md'))) throw new Error(`skill link ${linkPath} has no SKILL.md; the clone of ${reg.repo} is incomplete`);
        }
      } else res.clone = 'none';
      initBuildRepo(bd);
      res.prompt = writePrompt(dir, lineup, reg, facts.factsText);
    } catch (e) {
      res.error = e.message;
    }
  });
  let qaTool;
  try {
    if (!qaCommit) qaTool = `eliminated, so measure skips shared QA: ${qaEliminated.join('; ')}`;
    else {
      qaTool = await cloneAt(REGISTRY.qaTool.repo, qaCommit, paths.qa, noClone);
      if (!noClone && !fs.existsSync(path.join(paths.qa, REGISTRY.qaTool.script))) throw new Error(`${REGISTRY.qaTool.script} is missing`);
    }
  } catch (e) { qaTool = `error: ${e.message}`; }

  const setupSkipped = (a['no-setup'] || noClone) ? order.filter(n => registryEntry(n).setup?.length) : [];
  const cloneSkipped = order.filter(n => results[n].clone === 'skipped');
  if (!a['no-setup'] && !noClone) {
    await pool(order.filter(n => !results[n].error), 3, async name => {
      const reg = effective(name);
      results[name].setup = await setupBuild(dir, reg, promptVars(dir, lineup, reg, facts.factsText));
    });
  }
  for (const name of order) results[name].size = human(duKB(buildDir(dir, name)));
  const failed = order.filter(n => results[n].error || results[n].setup?.state === 'failed');
  if (String(qaTool).startsWith('error')) failed.push('qa-tool');
  let next = 'register, then dispatch';
  if (failed.length) next = 'Fix the failed items (a build\'s error or INSTALL-NOTES.log, or qaTool), then rerun init: it skips finished work.';
  else if (cloneSkipped.length) next = `Clones were skipped for ${cloneSkipped.join(', ')} (--no-clone): rerun init without --no-clone before dispatch.`;
  else if (setupSkipped.length) next = `Setup was skipped for ${setupSkipped.join(', ')}: rerun init without --no-setup before dispatch.`;
  print({
    lineup: dir,
    brief: paths.brief,
    title,
    format: lineup.format,
    builds: results,
    eliminated,
    commits: usePins ? 'pinned (builders.json)' : 'latest upstream, vetted',
    qaTool,
    disk: human(duKB(dir)),
    failed,
    next,
  });
  if (failed.length) process.exitCode = 1;
}

// ---------- register and dispatch ----------

function register(a) {
  const dir = lineupDir(a);
  const lineup = loadLineup(dir);
  const t3 = needT3(a);
  const cli = findT3Cli(a);
  let projects = t3Projects(t3);
  const added = [], errors = [];
  for (const b of lineup.builders) {
    const bd = buildDir(dir, b.name);
    if (projects.find(p => samePath(p.workspace, bd))) continue;
    const title = `${lineup.slug} ${b.name}`;
    const viaNode = cli && /\.(c|m)?js$/.test(cli);
    const cmd = cli ? (viaNode ? [process.execPath, cli] : [cli]) : null;
    if (!cmd) { errors.push({ name: b.name, error: 'no t3 CLI: add this folder as a project in T3 Code, or set VIDEO_LINEUP_T3_CLI', folder: bd }); continue; }
    const args = [...cmd.slice(1), 'project', 'add', bd, '--title', title];
    if (a['dry-run']) { added.push({ name: b.name, command: [cmd[0], ...args] }); continue; }
    const r = run(cmd[0], args, { timeout: 60000 });
    if (r.status !== 0) errors.push({ name: b.name, error: (r.stderr || r.stdout).trim().slice(0, 400), folder: bd });
    else added.push({ name: b.name, title });
  }
  if (!a['dry-run']) projects = t3Projects(t3);
  for (const b of lineup.builders) {
    const p = projects.find(x => samePath(x.workspace, buildDir(dir, b.name)));
    if (p) lineup.projects[b.name] = p.id;
  }
  if (!a['dry-run']) saveLineup(dir, lineup);
  const missing = lineup.builders.map(b => b.name).filter(n => !lineup.projects[n]);
  print({ projects: lineup.projects, added, errors, missing });
  if (missing.length && !a['dry-run']) process.exitCode = 1;
}

const MODEL_FLAGS = ['provider', 'model', 'effort', 'runtime-mode'];

// The request key carries the lineup's creation time, so a later lineup with the same title in another
// folder never collides with this one in t3-handoff's global ledger.
// A lineup dispatched by an earlier version of this script keeps that version's key form
// (vlineup-<slug>-<name>-v1), so a retry still finds a session whose first response was lost.
function requestKey(lineup, name) {
  const legacy = Object.entries(lineup.delegations || {}).some(([n, d]) => d?.key === `vlineup-${lineup.slug}-${n}-v1`);
  if (legacy) return `vlineup-${lineup.slug}-${name}-v1`;
  const stamp = String(lineup.createdAt || '').replace(/\D/g, '').slice(0, 14);
  return `vlineup-${lineup.slug}-${stamp}-${name}-v1`;
}

function cloneReady(dir, name) {
  const reg = registryEntry(name);
  return Object.keys(reg?.links || {}).every(link => fs.existsSync(path.join(buildDir(dir, name), '.claude', 'skills', link, 'SKILL.md')));
}

// Model flags of a build that is already running, read back from t3-handoff, for lineups that did not save them.
function optionsFromRunning(t3, lineup) {
  for (const d of Object.values(lineup.delegations || {})) {
    const r = run(process.execPath, [t3, 'status', d.id], { timeout: 90000 });
    let snap = null;
    try { snap = JSON.parse(r.stdout); } catch { continue; }
    const m = snap?.model;
    if (!m?.instanceId || !m?.model) continue;
    const effort = (m.options || []).find(o => o.id === 'effort' || o.id === 'reasoningEffort')?.value;
    return { provider: m.instanceId, model: m.model, ...(effort ? { effort } : {}), ...(snap.runtimeMode ? { 'runtime-mode': snap.runtimeMode } : {}) };
  }
  return null;
}

function setupDone(dir, name) {
  const reg = registryEntry(name);
  if (!reg?.setup?.length) return true;
  const marker = readJsonIf(path.join(buildDir(dir, name), '.lineup-setup.json'));
  return !!marker?.ok && marker.commit === reg.commit;
}

function dispatch(a) {
  const dir = lineupDir(a);
  const lineup = loadLineup(dir);
  const t3 = needT3(a);
  const only = onlyNames(a, lineup);
  const projects = t3Projects(t3);
  // Model flags given now override the lineup's saved ones; the first dispatch saves them. A lineup that
  // has running builds but no saved flags takes them from a running build, so every build uses one model.
  let opts = null;
  const options = () => {
    if (opts) return opts;
    let saved = lineup.dispatchOptions || {};
    if (!Object.keys(saved).length && Object.keys(lineup.delegations).length && !MODEL_FLAGS.some(f => typeof a[f] === 'string')) {
      saved = optionsFromRunning(t3, lineup) || {};
      if (!Object.keys(saved).length) die('This lineup has no saved model flags. Pass the --provider, --model and --effort the other builds used.');
      lineup.dispatchOptions = saved;
    }
    opts = { ...saved };
    for (const f of MODEL_FLAGS) if (typeof a[f] === 'string') opts[f] = a[f];
    return opts;
  };
  const results = [];
  let rows = null;
  for (const b of lineup.builders) {
    if (only && !only.includes(b.name)) continue;
    const prior = lineup.delegations[b.name];
    if (prior) { results.push({ name: b.name, state: 'already dispatched', id: prior.id, url: prior.url }); continue; }
    if (b.after) {
      rows ||= collect(dir, lineup, t3);
      const input = rows.find(r => r.name === b.after);
      if (!input?.complete || !input.settled) {
        results.push({ name: b.name, state: 'waiting', for: b.after, detail: `dispatch again when the ${b.after} build has finished (its state: ${input?.state ?? 'missing'})` });
        continue;
      }
    }
    if (!cloneReady(dir, b.name)) { results.push({ name: b.name, state: 'clone missing', detail: 'rerun init without --no-clone; its prompt names the cloned skill' }); continue; }
    if (!setupDone(dir, b.name)) { results.push({ name: b.name, state: 'setup not done', detail: 'rerun init without --no-setup; its prompt says setup already ran' }); continue; }
    const bd = buildDir(dir, b.name);
    const project = lineup.projects[b.name] || projects.find(p => samePath(p.workspace, bd))?.id;
    if (!project) { results.push({ name: b.name, state: 'no project', detail: 'run register first' }); continue; }
    const prompt = path.join(P(dir).handoffs, `${b.name}.prompt.md`);
    if (!fs.existsSync(prompt)) { results.push({ name: b.name, state: 'no prompt', detail: 'run init first' }); continue; }
    const key = requestKey(lineup, b.name);
    const args = [t3, 'start', '--project', project, '--kind', 'implementation', '--title', lib.sessionTitle(b.name, lineup.title),
      '--prompt-file', prompt, '--brief', REPORT_BRIEF, '--key', key];
    for (const f of MODEL_FLAGS) if (options()[f]) args.push(`--${f}`, options()[f]);
    if (typeof a['parent-thread'] === 'string') args.push('--parent-thread', a['parent-thread']);
    if (a['dry-run']) { results.push({ name: b.name, state: 'dry-run', command: [process.execPath, ...args] }); continue; }
    const r = run(process.execPath, args, { timeout: 180000 });
    let out = null;
    try { out = JSON.parse(r.stdout); } catch { /* reported below */ }
    if (r.status !== 0 || !out?.id) {
      const timedOut = r.error?.code === 'ETIMEDOUT';
      const error = (r.stderr || r.stdout || (timedOut ? 't3-handoff start did not answer in 180 s' : `exit ${r.status ?? r.signal}`)).trim().slice(0, 600);
      const detail = /Idempotency key already belongs/i.test(error)
        ? 'This key was used before with other settings. Rerun dispatch with the flags you first used, or start a new lineup folder.'
        : 'Rerun dispatch: the same key returns the same session, so a retry never starts a duplicate.';
      results.push({ name: b.name, state: 'start failed', error, detail });
      if (timedOut) { results.push({ name: '*', state: 'stopped', detail: 'T3 did not answer; the remaining builds were not started. Check T3, then rerun dispatch.' }); break; }
      continue;
    }
    lineup.delegations[b.name] = { id: out.id, threadId: out.threadId, url: out.url, key, dispatchedAt: new Date().toISOString() };
    if (!Object.keys(lineup.dispatchOptions || {}).length && Object.keys(options()).length) lineup.dispatchOptions = options();
    saveLineup(dir, lineup);
    results.push({ name: b.name, state: 'dispatched', id: out.id, url: out.url });
  }
  print(results);
  if (results.some(r => ['start failed', 'no project', 'no prompt', 'clone missing', 'setup not done', 'stopped'].includes(r.state))) process.exitCode = 1;
}

// ---------- status and watch ----------

function collect(dir, lineup, t3) {
  const rows = lineup.builders.map(b => {
    const d = deliverables(dir, b.name);
    const del = lineup.delegations[b.name];
    let snap = null;
    if (del && t3) {
      const r = run(process.execPath, [t3, 'status', del.id], { timeout: 90000 });
      try { snap = JSON.parse(r.stdout); } catch { snap = null; }
    }
    const state = del ? snap?.state || 'unreadable' : 'not dispatched';
    const minutes = del && d.videoMtime ? Math.round((d.videoMtime - Date.parse(del.dispatchedAt)) / 6000) / 10 : null;
    return {
      name: b.name, after: b.after, dispatched: !!del, id: del?.id || null, url: del?.url || null, state, reason: snap?.reason || null,
      reports: snap?.reports || [], ...d, minutes, settled: del ? lib.settled(state, d.complete) : false,
    };
  });
  for (const r of rows) {
    if (!r.dispatched && r.after) {
      const input = rows.find(x => x.name === r.after);
      r.state = input?.complete && input.settled ? 'ready' : `waiting for ${r.after}`;
    }
    if (lib.FILES_DECIDE.includes(r.state)) {
      r.note = r.complete
        ? `T3 says ${r.state}, but the deliverables are complete; open the session link to confirm it ended`
        : `T3 says ${r.state}; this does not prove the build ended, so watch waits for its deliverables`;
    }
  }
  return rows;
}

function status(a) {
  const dir = lineupDir(a);
  const rows = collect(dir, loadLineup(dir), findT3(a));
  if (a.json) return print(rows);
  line(`${'build'.padEnd(16)}${'state'.padEnd(22)}${'reports'.padEnd(9)}${'video'.padEnd(10)}${'poster'.padEnd(8)}${'log'.padEnd(7)}${'min'.padEnd(7)}session`);
  for (const r of rows) {
    line(`${r.name.padEnd(16)}${r.state.padEnd(22)}${String(r.reports.length).padEnd(9)}${(r.video ? `${r.videoMB} MB` : '-').padEnd(10)}${(r.poster ? 'yes' : '-').padEnd(8)}${(r.log ? `${10 - r.logMissing.length}/10` : '-').padEnd(7)}${String(r.minutes ?? '-').padEnd(7)}${r.url || ''}`);
    if (r.id) line(`  id: ${r.id}`);
    if (r.note) line(`  note: ${r.note}`);
    if (r.reports.length) line(`  last report: ${lib.reportLine(r.reports[r.reports.length - 1])}`);
  }
}

// What watch has already printed is kept in .watch-state.json, so a rerun (after PAUSE, or when a monitor
// expires) prints only what is new.
async function watch(a) {
  const dir = lineupDir(a);
  const t3 = findT3(a);
  const interval = Math.max(0, Number(a.interval ?? 60)) * 1000;
  const timeout = Number(a.timeout ?? 7200) * 1000;
  if (!Number.isFinite(interval) || !Number.isFinite(timeout)) die('--interval and --timeout take a number of seconds.');
  const start = Date.now();
  const stateFile = path.join(dir, '.watch-state.json');
  const seen = readJsonIf(stateFile) || {};
  for (;;) {
    const lineup = loadLineup(dir);
    const rows = collect(dir, lineup, t3);
    for (const r of rows) {
      const prev = seen[r.name] || { state: null, keys: [], video: false };
      // Reports are matched by key, not counted: t3-handoff starts a new list after a follow-up, and
      // returns none for an "unknown" session.
      const keys = new Set(prev.keys || []);
      for (const rep of r.reports) {
        const k = rep.key || `${rep.messageId || ''}#${rep.seq}#${rep.status}`;
        if (keys.has(k)) continue;
        keys.add(k);
        line(`REPORT ${r.name} ${lib.reportLine(rep)}`);
      }
      if (r.state !== prev.state) {
        const hint = r.state === 'ready' ? `: run dispatch --only ${r.name} (it reuses the model flags of the builds already running)` : '';
        line(`STATE ${r.name} ${prev.state ?? '-'} -> ${r.state}${r.note ? ` (${r.note})` : ''}${hint}`);
      }
      if (r.video && !prev.video) line(`VIDEO ${r.name} ${r.videoMB} MB`);
      seen[r.name] = { state: r.state, keys: [...keys].slice(-500), video: r.video || prev.video };
    }
    const tmp = `${stateFile}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(seen));
    fs.renameSync(tmp, stateFile);
    const active = rows.filter(r => r.dispatched);
    if (!active.length) return line('END nothing dispatched yet');
    if (active.every(r => r.settled)) return line(`END ${rows.map(r => `${r.name}=${r.state}${r.video ? '+video' : ''}`).join(' ')}`);
    if (Date.now() - start >= timeout) return line(`PAUSE ${active.filter(r => !r.settled).map(r => `${r.name}=${r.state}`).join(' ')}`);
    await sleep(interval);
  }
}

// ---------- measure ----------

async function measureOne(dir, lineup, b, tools, a) {
  const bd = buildDir(dir, b.name);
  const video = path.join(bd, 'out', 'final.mp4');
  const assets = path.join(P(dir).site, 'assets', b.name);
  const frames = path.join(assets, 'frames');
  // Clear the previous run's outputs, so a step that fails now never leaves an older result on the page.
  for (const f of ['measure.json', 'poster.png', 'sheet.jpg', 'transcript.txt', 'qa', 'frames']) fs.rmSync(path.join(assets, f), { recursive: true, force: true });
  fs.mkdirSync(frames, { recursive: true });
  fs.mkdirSync(path.join(P(dir).site, 'videos'), { recursive: true });
  const m = { name: b.name, ok: false, measuredAt: new Date().toISOString(), video };
  const save = () => fs.writeFileSync(path.join(assets, 'measure.json'), `${JSON.stringify(m, null, 2)}\n`);

  const pr = run(tools.ffprobe, ['-v', 'error', '-show_entries',
    'format=duration,size:stream=codec_type,codec_name,profile,width,height,pix_fmt,avg_frame_rate,r_frame_rate,sample_rate,channels',
    '-of', 'json', video]);
  let probe = null;
  try { probe = JSON.parse(pr.stdout); } catch { /* reported below */ }
  if (pr.status !== 0 || !Array.isArray(probe?.streams) || !probe.streams.length) {
    m.error = `ffprobe could not read the video (corrupt, or still being written): ${(pr.stderr || '').trim().slice(0, 300)}`;
    save();
    return m;
  }
  const spec = lib.checkSpec(probe, lineup.format);
  Object.assign(m, { ok: true, spec: spec.spec, spec_pass: spec.pass, spec_fails: spec.fails, spec_notes: spec.notes });
  const dur = spec.spec.duration_s || 1;

  const loud = await runAsync(tools.ffmpeg, ['-hide_banner', '-nostats', '-i', video, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
  m.loudness = lib.parseLoudness(loud.stderr);

  fs.copyFileSync(video, path.join(P(dir).site, 'videos', `${b.name}.mp4`));
  const poster = path.join(bd, 'out', 'poster.png');
  if (fs.existsSync(poster)) fs.copyFileSync(poster, path.join(assets, 'poster.png'));
  else await runAsync(tools.ffmpeg, ['-y', '-v', 'error', '-ss', String(dur * 0.4), '-i', video, '-frames:v', '1', path.join(assets, 'poster.png')]);

  for (const f of fs.readdirSync(frames)) fs.unlinkSync(path.join(frames, f));
  for (let i = 0; i < 12; i++) {
    const t = Math.max(0, dur * (i + 0.5) / 12);
    await runAsync(tools.ffmpeg, ['-y', '-v', 'error', '-ss', t.toFixed(3), '-i', video, '-frames:v', '1', '-vf', 'scale=480:-2', '-q:v', '3', path.join(frames, `${String(i).padStart(2, '0')}.jpg`)]);
  }
  const sheet = await runAsync(tools.ffmpeg, ['-y', '-v', 'error', '-i', path.join(frames, '%02d.jpg'), '-vf', 'tile=4x3', '-frames:v', '1', '-q:v', '3', path.join(assets, 'sheet.jpg')]);
  if (sheet.status !== 0) m.sheet_error = sheet.stderr.trim().slice(0, 300);

  if (a['no-transcript']) m.transcript_note = 'Transcript skipped (--no-transcript).';
  else if (!tools.whisper) m.transcript_note = 'No local Whisper found. Set VIDEO_LINEUP_WHISPER to a command with {wav} and {outdir} to get transcripts.';
  else if (!probe.streams.some(s => s.codec_type === 'audio')) m.transcript_note = 'No audio stream.';
  else {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `vlineup-${b.name}-`));
    const wav = path.join(tmp, `${b.name}.wav`);
    await runAsync(tools.ffmpeg, ['-y', '-v', 'error', '-i', video, '-ac', '1', '-ar', '16000', wav]);
    const cmd = tools.whisper.cmd.replaceAll('{wav}', shq(wav)).replaceAll('{outdir}', shq(tmp));
    const w = await runAsync('sh', ['-c', cmd], { timeout: 15 * 60000 });
    const txt = fs.readdirSync(tmp).find(f => f.endsWith('.txt'));
    if (txt) {
      m.transcript = fs.readFileSync(path.join(tmp, txt), 'utf8').trim();
      fs.writeFileSync(path.join(assets, 'transcript.txt'), `${m.transcript}\n`);
      m.transcript_note = `Whisper (${tools.whisper.source}). Over music with no voice, Whisper can invent words; check against the build log.`;
    } else m.transcript_note = `Whisper wrote no transcript (exit ${w.status}): ${(w.stderr || '').trim().slice(-300)}`;
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  if (a['no-qa']) m.qa = { verdict: 'not run', lines: [], note: 'Shared QA skipped (--no-qa).' };
  else if (!tools.qa || !tools.uv) {
    const why = lineup.qaTool?.eliminated ? `the shared QA tool was eliminated by the upstream check: ${lineup.qaTool.eliminated.join('; ')}` : `qa_video.py not found under ${P(dir).qa}; rerun init.`;
    m.qa = { verdict: 'not run', lines: [], note: !tools.qa ? why : 'uv not on PATH.' };
  }
  else {
    const qaDir = path.join(assets, 'qa');
    fs.mkdirSync(qaDir, { recursive: true });
    const q = await runAsync(tools.uv, ['run', '--quiet', '--with', 'numpy', '--with', 'pillow', 'python3', tools.qa, video, '--out', qaDir], { timeout: 20 * 60000 });
    const report = readJsonIf(path.join(qaDir, 'report.json'));
    m.qa = report ? lib.qaSummary(report) : { verdict: 'error', lines: [], note: `qa_video.py exit ${q.status}: ${(q.stderr || q.stdout).trim().slice(-300)}` };
    if (report) m.qa.report = path.join(qaDir, 'report.md');
  }

  const logFile = path.join(bd, 'BUILD-LOG.md');
  m.build_log = fs.existsSync(logFile) ? lib.buildLogSections(fs.readFileSync(logFile, 'utf8')) : { present: [], missing: lib.LOG_SECTIONS };
  const del = lineup.delegations[b.name];
  m.minutes_to_final = del?.dispatchedAt ? Math.round((fs.statSync(video).mtimeMs - Date.parse(del.dispatchedAt)) / 6000) / 10 : null;
  save();
  return m;
}

async function measure(a) {
  const dir = lineupDir(a);
  const lineup = loadLineup(dir);
  const ffmpeg = which('ffmpeg'), ffprobe = which('ffprobe');
  if (!ffmpeg || !ffprobe) die('ffmpeg and ffprobe must be on PATH.');
  const qaScript = path.join(P(dir).qa, REGISTRY.qaTool.script);
  const tools = { ffmpeg, ffprobe, uv: which('uv'), qa: fs.existsSync(qaScript) ? qaScript : null, whisper: a['no-transcript'] ? null : findWhisper() };
  const only = onlyNames(a, lineup);
  const targets = lineup.builders.filter(b => (!only || only.includes(b.name)) && deliverables(dir, b.name).video);
  const skipped = lineup.builders.filter(b => (!only || only.includes(b.name)) && !targets.includes(b)).map(b => b.name);
  const out = await pool(targets, 3, b => measureOne(dir, lineup, b, tools, a).catch(e => ({ name: b.name, ok: false, error: e.message })));
  print({
    measured: out.map(m => ({ name: m.name, ok: m.ok, spec_pass: m.spec_pass, fails: m.spec_fails, loudness: m.loudness?.text, qa: m.qa?.verdict, transcript: !!m.transcript, error: m.error })),
    noVideo: skipped,
    next: 'Write site/assets/<name>/review.json for each build (references/review.md), then run site.',
  });
  if (out.some(m => !m.ok)) process.exitCode = 1;
}

// ---------- site ----------

function site(a) {
  const dir = lineupDir(a);
  const lineup = loadLineup(dir);
  const t3 = findT3(a);
  const rows = a['no-status'] ? [] : collect(dir, lineup, t3);
  const entries = lineup.builders.map(b => {
    const reg = registryEntry(b.name) || {};
    const assets = path.join(P(dir).site, 'assets', b.name);
    return {
      name: b.name, kind: b.kind || reg.kind, repo: b.repo || reg.repo, commit: b.commit || reg.commit,
      measure: readJsonIf(path.join(assets, 'measure.json')),
      ...(() => {
        const rv = readJsonReport(path.join(assets, 'review.json'));
        if (rv.error) console.error(`video-lineup: warning: ${path.join(assets, 'review.json')}: ${rv.error}; it was ignored.`);
        return { review: rv.value, reviewError: rv.error };
      })(),
      delegation: lineup.delegations[b.name] || null,
      state: rows.find(r => r.name === b.name)?.state || null,
    };
  });
  const judgesFile = path.join(P(dir).site, 'judges.json');
  const { value: judgesRaw, error: judgesError } = readJsonReport(judgesFile);
  if (judgesError) console.error(`video-lineup: warning: ${judgesFile}: ${judgesError}; it was ignored.`);
  if (judgesRaw && !Array.isArray(judgesRaw)) console.error(`video-lineup: warning: ${judgesFile} must be a list of judge objects; it was ignored.`);
  const judges = Array.isArray(judgesRaw) ? judgesRaw : [];
  const notesFile = path.join(P(dir).site, 'notes.html');
  const notes = fs.existsSync(notesFile) ? fs.readFileSync(notesFile, 'utf8') : '';
  const file = path.join(P(dir).site, 'index.html');
  fs.mkdirSync(P(dir).site, { recursive: true });
  fs.writeFileSync(file, lib.siteHtml({ title: lineup.title, format: lineup.format, entries, judges, notes }));
  const shown = entries.filter(e => e.measure?.ok).map(e => e.name);
  print({
    page: file,
    url: `file://${encodeURI(file)}`,
    open: process.platform === 'darwin' ? `open -a "Google Chrome" ${shq(file)}` : `xdg-open ${shq(file)}`,
    videos: shown,
    notReviewed: entries.filter(e => e.measure?.ok && !e.review).map(e => e.name),
    noVideo: entries.filter(e => !e.measure?.ok).map(e => e.name),
  });
}

// ---------- main ----------

const COMMANDS = { doctor, upstream, vet, init, register, dispatch, status, watch, measure, site };
const args = parseArgs(process.argv.slice(2));
const cmd = args._[0];
if (!cmd || !COMMANDS[cmd] || args.help) {
  console.log(USAGE);
  process.exit(cmd && !COMMANDS[cmd] ? 1 : 0);
}
try {
  await COMMANDS[cmd](args);
} catch (e) {
  die(e.stack || e.message);
}
