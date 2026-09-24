import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { homedir } from 'node:os';

export const t3Home = () => resolve(process.env.T3CODE_HOME || resolve(homedir(), '.t3'));
export function assertSupported(home) {
  if (existsSync(resolve(home, 'userdata/statev2.sqlite'))) throw Error('T3 orchestration V2 detected. This skill supports the V1 API; update the adapter before dispatch.');
}
export function projects(home = t3Home()) {
  assertSupported(home);
  const dbPath = resolve(home, 'userdata/state.sqlite');
  if (!existsSync(dbPath)) throw Error(`T3 database not found: ${dbPath}. Set T3CODE_HOME to the running instance's data folder.`);
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    return db.prepare('SELECT project_id AS id,title,workspace_root AS workspace,default_model_selection_json AS selection FROM projection_projects WHERE deleted_at IS NULL ORDER BY title').all().map(p => ({
      ...p, selection: p.selection ? JSON.parse(p.selection) : null, available: existsSync(p.workspace),
      inspect: 'Read this workspace README and AGENTS.md/CLAUDE.md to establish purpose, permissions and branch rules.',
    }));
  } finally { db.close(); }
}
export function selectProject(all, query) {
  if (!query?.trim()) throw Error('Specify --project using an exact project ID, title, workspace path, or unique folder name from projects.');
  const q = query.toLowerCase();
  const exact = all.filter(p => p.id === query || p.title.toLowerCase() === q || p.workspace === query);
  const matches = exact.length ? exact : all.filter(p => basename(p.workspace).toLowerCase() === q);
  if (matches.length !== 1) throw Error(matches.length ? `Ambiguous project: ${matches.map(p => `${p.title} (${p.id})`).join(', ')}` : `No registered project matches ${query}. Ask the user or use handoff; no session was created.`);
  if (!matches[0].available) throw Error(`Workspace does not exist: ${matches[0].workspace}. Use handoff or ask the user.`);
  return matches[0];
}
