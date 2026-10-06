import { readFileSync, existsSync, mkdirSync, chmodSync, readlinkSync } from 'node:fs';
import { resolve, join, delimiter, isAbsolute } from 'node:path';
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import { createHash } from 'node:crypto';
import { T3Client } from './t3-client.mjs';
import { t3Home } from './catalog.mjs';
import { protocolV1 } from './protocol-v1.mjs';
import { protocolV2 } from './protocol-v2.mjs';

export const SUPPORTED_PROTOCOLS = [1, 2];

export function paths(home = t3Home()) {
  const key = createHash('sha256').update(home).digest('hex').slice(0,16);
  const state = resolve(process.env.T3_DELEGATE_STATE || resolve(homedir(), '.local/state/t3-delegations'), key);
  mkdirSync(state, {recursive:true, mode:0o700}); chmodSync(state, 0o700);
  return { home, state, ledger:resolve(state,'delegations.sqlite') };
}
export function localRuntime(home) {
  const file = resolve(home,'userdata/server-runtime.json');
  if (!existsSync(file)) throw Error(`No running T3 runtime record at ${file}. Start the existing T3 installation; do not initialize a new data folder.`);
  const r = JSON.parse(readFileSync(file,'utf8'));
  if (!Number.isInteger(r.port) || r.port < 1 || r.port > 65535) throw Error('Invalid local T3 runtime port.');
  if (!Number.isInteger(r.pid) || r.pid <= 0) throw Error('Invalid local T3 runtime PID.');
  try { process.kill(r.pid,0); } catch { throw Error('T3 runtime PID is no longer alive. Start the existing instance.'); }
  return { url:r.origin || `http://127.0.0.1:${r.port}`, environmentId:readFileSync(resolve(home,'userdata/environment-id'),'utf8').trim() };
}
// Locate the T3 CLI: T3_BIN, then `t3` on PATH, then the binary of the running T3 server
// (its PID comes from server-runtime.json). Returns {cmd,args,source} or null.
export function findT3Cli(home = t3Home()) {
  const viaNode = file => /\.(c|m)?js$/.test(file) ? {cmd:process.execPath,args:[file]} : {cmd:file,args:[]};
  if (process.env.T3_BIN) {
    const file = resolve(process.env.T3_BIN);
    return existsSync(file) ? {...viaNode(file),source:'T3_BIN'} : null;
  }
  for (const dir of (process.env.PATH || '').split(delimiter).filter(Boolean)) {
    for (const name of process.platform === 'win32' ? ['t3.cmd','t3.exe'] : ['t3']) {
      const file = join(dir, name);
      if (existsSync(file)) return {cmd:file,args:[],source:'PATH'};
    }
  }
  const record = resolve(home,'userdata/server-runtime.json');
  if (!existsSync(record)) return null;
  let pid;
  try { pid = JSON.parse(readFileSync(record,'utf8')).pid; } catch { return null; }
  if (!Number.isInteger(pid) || pid <= 0) return null;
  let argv = [], cwd = '';
  if (process.platform === 'linux') {
    try { argv = readFileSync(`/proc/${pid}/cmdline`,'utf8').split('\0').filter(Boolean); cwd = readlinkSync(`/proc/${pid}/cwd`); } catch { return null; }
  } else if (process.platform === 'darwin') {
    const ps = spawnSync('ps',['-o','command=','-p',String(pid)],{encoding:'utf8'});
    const ls = spawnSync('lsof',['-a','-p',String(pid),'-d','cwd','-Fn'],{encoding:'utf8'});
    argv = (ps.stdout || '').trim().split(/\s+/);
    cwd = ((ls.stdout || '').split('\n').find(l => l.startsWith('n')) || '').slice(1);
  } else return null;
  const script = argv.find(a => /(^|[\\/])t3[\\/]dist[\\/]bin\.mjs$/.test(a) || /(^|[\\/])t3$/.test(a));
  if (!script) return null;
  const file = isAbsolute(script) ? script : resolve(cwd || '/', script);
  return existsSync(file) ? {...viaNode(file),source:`running T3 server (pid ${pid})`} : null;
}
// Issue a short-lived T3 session credential through the T3 CLI. Never printed or written to disk.
export function issueCredential(home = t3Home(), {ttl='8h'} = {}) {
  const cli = findT3Cli(home);
  if (!cli) return {error:'no T3 CLI found (T3_BIN unset, `t3` not on PATH, running server binary not found)'};
  const r = spawnSync(cli.cmd,[...cli.args,'auth','session','issue','--base-dir',home,'--ttl',ttl,'--label','t3-handoff','--token-only'],{encoding:'utf8',timeout:30000});
  if (r.status !== 0) return {error:`T3 CLI from ${cli.source} could not issue a session (exit ${r.status ?? r.signal})`};
  const token = (r.stdout || '').trim().split('\n').pop()?.trim();
  if (!token || /\s/.test(token)) return {error:`T3 CLI from ${cli.source} returned no usable credential`};
  return {token,source:cli.source};
}
export function credential(home = t3Home()) {
  const token = process.env.T3_DELEGATE_TOKEN?.trim();
  if (token) return token;
  const required = 'T3_DELEGATE_TOKEN is required. Supply a T3 bearer credential through the environment';
  if (process.env.T3_DELEGATE_AUTO_TOKEN === '0') throw Error(`${required}; automatic issue is off (T3_DELEGATE_AUTO_TOKEN=0). See references/returns-and-operations.md.`);
  const issued = issueCredential(home);
  if (!issued.token) throw Error(`${required}. Automatic issue failed: ${issued.error}. Set T3_BIN to the T3 CLI or export T3_DELEGATE_TOKEN; see references/returns-and-operations.md.`);
  // Keep it in this process only, so watchers spawned from here inherit it.
  process.env.T3_DELEGATE_TOKEN = issued.token;
  return issued.token;
}
// The environment descriptor needs no credential. 0.0.45 reports protocol 1, 0.0.46 reports 2.
// A server too old to have the descriptor speaks protocol 1.
export async function detectProtocol(url, fetchImpl = globalThis.fetch) {
  let body = null;
  try {
    const r = await fetchImpl(new URL('/.well-known/t3/environment', url), { redirect: 'error', signal: AbortSignal.timeout(5000) });
    if (r.ok) body = await r.json();
  } catch { /* fall through to protocol 1 */ }
  const protocol = Number.isInteger(body?.orchestrationProtocolVersion) ? body.orchestrationProtocolVersion : 1;
  if (!SUPPORTED_PROTOCOLS.includes(protocol)) throw Error(`T3 ${body?.serverVersion ?? ''} uses orchestration protocol ${protocol}; this helper supports ${SUPPORTED_PROTOCOLS.join(' and ')}. Update the t3-handoff skill.`);
  return { protocol, serverVersion: body?.serverVersion ?? null };
}
export async function connect(p=paths()) {
  const runtime=localRuntime(p.home);
  const {protocol,serverVersion}=await detectProtocol(runtime.url);
  const client=new T3Client({url:runtime.url,token:credential(p.home),query:protocol===2?{orchestrationProtocol:2,clientSurface:'cli'}:{}});
  try { await client.connect(); } catch(e) { client.close(); throw e; }
  const api=protocol===2?protocolV2(client):protocolV1(client);
  return {client,api,protocol,serverVersion,...runtime,...p};
}
// providers: the adapter's normalized list ({instanceId, enabled, installed, status, auth, models:[{slug,isDefault,optionIds}]}).
export function chooseModel(providers, project, kind, {provider,model,effort}={}) {
  const selected=project.selection;
  provider ||= selected?.instanceId;
  if(!provider) throw Error('This project has no default model. Use models, then supply --provider and --model.');
  const p=providers.find(x=>x.instanceId===provider);
  if(!p || p.enabled===false || !p.installed || ['error','disabled'].includes(p.status) || p.auth==='unauthenticated') throw Error(`Provider ${provider} is not available/authenticated. Inspect models or T3 provider settings.`);
  if(!model && selected?.instanceId===provider) model=selected.model;
  model ||= p.models.find(x=>x.isDefault)?.slug;
  const m=p.models.find(x=>x.slug===model);
  if(!model || !m) throw Error(`Model ${model || '(unspecified)'} is not available for ${provider}. Use models; no silent substitution.`);
  if(effort) {
    // Codex names the option reasoningEffort, Claude names it effort. Use what the model advertises.
    const ids=m.optionIds||[];
    const optionId=['reasoningEffort','effort'].find(k=>ids.includes(k)) ?? (ids.length ? null : 'reasoningEffort');
    if(!optionId) throw Error(`Model ${model} has no reasoning effort option. Omit --effort.`);
    return {instanceId:provider,model,options:[{id:optionId,value:effort}]};
  }
  return {instanceId:provider,model,...(selected?.instanceId===provider && selected?.model===model && selected.options ? {options:selected.options} : {})};
}
