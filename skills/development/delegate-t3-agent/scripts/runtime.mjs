import { readFileSync, existsSync, mkdirSync, chmodSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { createHash } from 'node:crypto';
import { T3Client, T3_METHODS } from './t3-client.mjs';
import { t3Home, assertSupported } from './catalog.mjs';

export function paths(home = t3Home()) {
  const key = createHash('sha256').update(home).digest('hex').slice(0,16);
  const state = resolve(process.env.T3_DELEGATE_STATE || resolve(homedir(), '.local/state/t3-delegations'), key);
  mkdirSync(state, {recursive:true, mode:0o700}); chmodSync(state, 0o700);
  return { home, state, ledger:resolve(state,'delegations.sqlite') };
}
export function localRuntime(home) {
  assertSupported(home);
  const file = resolve(home,'userdata/server-runtime.json');
  if (!existsSync(file)) throw Error(`No running T3 runtime record at ${file}. Start the existing T3 installation; do not initialize a new data folder.`);
  const r = JSON.parse(readFileSync(file,'utf8'));
  if (!Number.isInteger(r.port) || r.port < 1 || r.port > 65535) throw Error('Invalid local T3 runtime port.');
  if (!Number.isInteger(r.pid) || r.pid <= 0) throw Error('Invalid local T3 runtime PID.');
  try { process.kill(r.pid,0); } catch { throw Error('T3 runtime PID is no longer alive. Start the existing instance.'); }
  return { url:r.origin || `http://127.0.0.1:${r.port}`, environmentId:readFileSync(resolve(home,'userdata/environment-id'),'utf8').trim() };
}
export function credential() {
  const token = process.env.T3_DELEGATE_TOKEN?.trim();
  if (!token) throw Error('T3_DELEGATE_TOKEN is required. Supply a T3 bearer credential through the environment; see references/returns-and-operations.md.');
  return token;
}
export async function connect(p=paths()) {
  const runtime=localRuntime(p.home);
  const client=new T3Client({url:runtime.url,token:credential()});
  try { await client.connect(); } catch(e) { client.close(); throw e; }
  return {client,...runtime,...p};
}
export function chooseModel(config, project, kind, {provider,model,effort}={}) {
  const selected=project.selection;
  provider ||= selected?.instanceId;
  if(!provider) throw Error('This project has no default model. Use models, then supply --provider and --model.');
  const p=config.providers.find(x=>x.instanceId===provider);
  if(!p || p.enabled===false || !p.installed || p.status==='error' || p.auth?.status==='unauthenticated') throw Error(`Provider ${provider} is not available/authenticated. Inspect models or T3 provider settings.`);
  if(!model && selected?.instanceId===provider) model=selected.model;
  model ||= p.models.find(x=>x.isDefault)?.slug;
  if(!model || !p.models.some(x=>x.slug===model)) throw Error(`Model ${model || '(unspecified)'} is not available for ${provider}. Use models; no silent substitution.`);
  return {instanceId:provider,model,...(effort ? {options:[{id:'reasoningEffort',value:effort}]} : selected?.instanceId===provider && selected?.model===model && selected.options ? {options:selected.options} : {})};
}
export async function models(client) {
  const cfg=await client.request(T3_METHODS.config,{});
  return cfg;
}
