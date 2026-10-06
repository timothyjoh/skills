import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { credential, detectProtocol, findT3Cli, issueCredential, localRuntime, paths } from '../runtime.mjs';
import { projects, t3Home } from '../catalog.mjs';

function setEnv(t, key, value) {
  const previous = process.env[key];
  t.after(() => { if (previous === undefined) delete process.env[key]; else process.env[key] = previous; });
  process.env[key] = value;
}

function fixture(t) {
  const root = mkdtempSync(resolve(tmpdir(), 'portable-t3-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

test('a copied skill and symlink work from another directory without credentials or dependencies', t => {
  const root = fixture(t), home = resolve(root, 'alternate T3 home');
  const installed = resolve(root, 'installed skill');
  cpSync(fileURLToPath(new URL('../../', import.meta.url)), installed, { recursive: true });
  const linked = resolve(root, 'linked skill');
  symlinkSync(installed, linked, process.platform === 'win32' ? 'junction' : 'dir');
  mkdirSync(resolve(home, 'userdata'), { recursive: true });
  const workspace = resolve(root, 'unfamiliar project');
  mkdirSync(workspace);
  const db = new DatabaseSync(resolve(home, 'userdata/state.sqlite'));
  db.exec('CREATE TABLE projection_projects(project_id TEXT,title TEXT,workspace_root TEXT,default_model_selection_json TEXT,deleted_at TEXT)');
  db.prepare('INSERT INTO projection_projects VALUES(?,?,?,?,NULL)').run('new-id', 'My project', workspace, JSON.stringify({ instanceId: 'custom-provider', model: 'custom-model' }));
  db.close();
  const env = { ...process.env, T3CODE_HOME: home, T3_DELEGATE_STATE: resolve(root, 'state'), T3_DELEGATE_TOKEN: '' };
  for (const folder of [installed, linked]) {
    const script = resolve(folder, 'scripts/t3.mjs');
    const run = (...args) => spawnSync(process.execPath, [script, ...args], { cwd: root, env, encoding: 'utf8' });
    assert.equal(run('--help').status, 0);
    const inventory = run('projects');
    assert.equal(inventory.status, 0, inventory.stderr);
    assert.deepEqual(JSON.parse(inventory.stdout).map(p => [p.id, p.workspace, p.selection.model]), [['new-id', workspace, 'custom-model']]);
    const prompt = resolve(root, 'prompt.txt'), out = resolve(root, `${folder === installed ? 'copy' : 'link'}-handoff.md`);
    writeFileSync(prompt, 'Investigate a sample problem.');
    const handoff = run('handoff', '--prompt-file', prompt, '--out', out);
    assert.equal(handoff.status, 0, handoff.stderr);
    assert.equal(JSON.parse(handoff.stdout).launched, false);
    assert.match(readFileSync(out, 'utf8'), /Investigate a sample problem/);
  }
  assert.equal(existsSync(env.T3_DELEGATE_STATE), false);
});

test('home and state overrides work without writing into the installed skill', t => {
  const root = fixture(t);
  setEnv(t, 'T3CODE_HOME', resolve(root, 'custom home'));
  setEnv(t, 'T3_DELEGATE_STATE', resolve(root, 'private state'));
  assert.equal(t3Home(), resolve(root, 'custom home'));
  const p = paths();
  assert.ok(p.state.startsWith(resolve(root, 'private state')));
  assert.deepEqual(readdirSync(p.state), []);
  assert.notEqual(paths(resolve(root, 'other home')).state, p.state);
});

test('credentials come from the environment when set, and are required when auto-issue is off', t => {
  setEnv(t, 'T3_DELEGATE_TOKEN', '');
  setEnv(t, 'T3_DELEGATE_AUTO_TOKEN', '0');
  assert.throws(() => credential(), /T3_DELEGATE_TOKEN is required.*automatic issue is off/);
  process.env.T3_DELEGATE_TOKEN = 'sample-test-token';
  assert.equal(credential(), 'sample-test-token');
});

test('a missing credential is issued through the T3 CLI and kept in this process only', t => {
  const root = fixture(t), home = resolve(root, 'home');
  mkdirSync(resolve(home, 'userdata'), { recursive: true });
  const cli = resolve(root, 'fake-t3.mjs');
  writeFileSync(cli, `const a = process.argv.slice(2);
if (a.join(' ') !== 'auth session issue --base-dir ${home.replace(/\\/g, '\\\\')} --ttl 8h --label t3-handoff --token-only') { console.error('bad args: ' + a.join(' ')); process.exit(3); }
console.log('issued-test-token');\n`);
  setEnv(t, 'T3_DELEGATE_TOKEN', '');
  setEnv(t, 'T3_DELEGATE_AUTO_TOKEN', '');
  setEnv(t, 'T3_BIN', cli);
  assert.equal(findT3Cli(home).source, 'T3_BIN');
  assert.equal(credential(home), 'issued-test-token');
  assert.equal(process.env.T3_DELEGATE_TOKEN, 'issued-test-token');
  assert.deepEqual(readdirSync(root).sort(), ['fake-t3.mjs', 'home']);
});

test('auto-issue failures name the cause and never leak a credential', t => {
  const root = fixture(t), home = resolve(root, 'home');
  mkdirSync(resolve(home, 'userdata'), { recursive: true });
  const cli = resolve(root, 'failing-t3.mjs');
  writeFileSync(cli, "console.log('should-not-appear'); process.exit(1);\n");
  setEnv(t, 'T3_DELEGATE_TOKEN', '');
  setEnv(t, 'T3_DELEGATE_AUTO_TOKEN', '');
  setEnv(t, 'T3_BIN', cli);
  assert.throws(() => credential(home), e => /could not issue a session/.test(e.message) && !/should-not-appear/.test(e.message));
  process.env.T3_BIN = resolve(root, 'missing-t3.mjs');
  assert.throws(() => credential(home), /no T3 CLI found/);
  assert.equal(issueCredential(home).token, undefined);
});

test('runtime discovery follows the recorded origin and rejects invalid PIDs', t => {
  const home = fixture(t), userdata = resolve(home, 'userdata');
  mkdirSync(userdata);
  const runtime = resolve(userdata, 'server-runtime.json');
  writeFileSync(runtime, JSON.stringify({ pid: process.pid, port: 43210, origin: 'http://[::1]:43210' }));
  writeFileSync(resolve(userdata, 'environment-id'), 'sample-environment\n');
  assert.deepEqual(localRuntime(home), { url: 'http://[::1]:43210', environmentId: 'sample-environment' });
  writeFileSync(runtime, JSON.stringify({ pid: 0, port: 43210 }));
  assert.throws(() => localRuntime(home), /runtime PID/);
});

test('protocol detection reads the environment descriptor and refuses unknown versions', async () => {
  const reply = body => async () => ({ ok: true, json: async () => body });
  assert.deepEqual(await detectProtocol('http://127.0.0.1:1', reply({ serverVersion: '0.0.46', orchestrationProtocolVersion: 2 })), { protocol: 2, serverVersion: '0.0.46' });
  assert.deepEqual(await detectProtocol('http://127.0.0.1:1', reply({ serverVersion: '0.0.45', orchestrationProtocolVersion: 1 })), { protocol: 1, serverVersion: '0.0.45' });
  assert.equal((await detectProtocol('http://127.0.0.1:1', async () => ({ ok: false }))).protocol, 1);
  assert.equal((await detectProtocol('http://127.0.0.1:1', async () => { throw Error('refused'); })).protocol, 1);
  await assert.rejects(detectProtocol('http://127.0.0.1:1', reply({ serverVersion: '9.9.9', orchestrationProtocolVersion: 3 })), /protocol 3.*Update the t3-handoff skill/);
});
