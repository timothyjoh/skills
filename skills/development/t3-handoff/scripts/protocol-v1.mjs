// T3 orchestration protocol 1 (T3 Code 0.0.45 and earlier): turns, activities, and
// pending flags on the thread shell. Same RPC method names as protocol 2, different payloads.
const DISPATCH = 'orchestration.dispatchCommand';
const stamp = () => ({ commandId: crypto.randomUUID(), createdAt: new Date().toISOString() });

// Candidate requests from a snapshot's retained activities. Use the fresh shell
// pending flags too; a provider restart can make old requests stale.
export function pendingInteractions(thread) {
  const questions = new Map(); const approvals = new Map();
  for (const activity of thread.activities ?? []) {
    const payload = activity.payload;
    if (!payload || typeof payload.requestId !== 'string') continue;
    if (activity.kind === 'user-input.requested') questions.set(payload.requestId, { ...payload, summary: activity.summary, createdAt: activity.createdAt });
    if (activity.kind === 'user-input.resolved') questions.delete(payload.requestId);
    if (activity.kind === 'approval.requested') approvals.set(payload.requestId, { ...payload, summary: activity.summary, createdAt: activity.createdAt });
    if (activity.kind === 'approval.resolved') approvals.delete(payload.requestId);
  }
  return { questions: [...questions.values()], approvals: [...approvals.values()] };
}

const pick = m => ({ id: m.id, role: m.role, text: m.text, ...(m.createdAt ? { createdAt: m.createdAt } : {}) });

// Report sources in time order: assistant text, and shell commands the child ran
// (t3-report delivers each report as a `cat <<'T3_REPORT'` command).
function transcriptV1(detail, launch, next, replies) {
  const from = launch?.createdAt ?? '', to = next?.createdAt ?? '\uffff', seen = new Set();
  const commands = (detail.activities || []).filter(a => a.kind === 'tool.completed' && a.payload?.itemType === 'command_execution'
    && typeof a.payload?.data?.command === 'string' && (a.createdAt ?? '') >= from && (a.createdAt ?? '') < to)
    .filter(a => { const k = a.payload.toolCallId ?? a.id; if (seen.has(k)) return false; seen.add(k); return true; })
    .map(a => ({ id: a.payload.toolCallId ?? a.id, role: 'assistant', source: 'command', text: a.payload.data.command, createdAt: a.createdAt }));
  return [...replies, ...commands].sort((a, b) => String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? '')));
}

export function classifyV1(shell, detail, messageId) {
  const msgs = detail.messages || [];
  const userIndex = msgs.findIndex(m => m.id === messageId);
  if (userIndex < 0) return { state: 'unknown', reason: 'The delegated prompt is not in the current history window. Do not assume completion or relaunch.', transcript: [] };
  const nextUser = msgs.findIndex((m, i) => i > userIndex && m.role === 'user');
  const current = msgs.slice(userIndex + 1, nextUser < 0 ? undefined : nextUser);
  const replies = current.filter(m => m.role === 'assistant' && !m.streaming && !m.isStreaming).map(pick);
  const transcript = transcriptV1(detail, msgs[userIndex], msgs[nextUser], replies);
  if (nextUser >= 0) return { state: 'superseded', reason: 'Another prompt was sent after this delegation. Inspect its history; the latest turn cannot prove this request completed.', messages: replies, transcript };
  const inputs = pendingInteractions(detail);
  if (shell.hasPendingApprovals) return { state: 'needs_approval', approvals: inputs.approvals, transcript };
  if (shell.hasPendingUserInput) return { state: 'needs_input', questions: inputs.questions, transcript };
  if (shell.hasActionableProposedPlan) return { state: 'needs_plan_review', plans: detail.proposedPlans || [], messages: replies, transcript };
  const turn = shell.latestTurn;
  if (turn?.state === 'error' || shell.session?.status === 'error') return { state: 'failed', reason: 'T3 reports a provider/turn error. Inspect the linked session.', turnId: turn?.turnId, transcript };
  if (turn?.state === 'interrupted') return { state: 'interrupted', turnId: turn.turnId, transcript };
  if (turn?.state === 'completed') return { state: 'completed', turnId: turn.turnId, messages: replies, transcript };
  if (turn?.state === 'running' || shell.session?.activeTurnId) return { state: 'running', turnId: turn?.turnId, transcript };
  return { state: 'pending', reason: 'Launch is recorded; no terminal model turn is visible yet.', transcript };
}

export function parentReadyV1(parent) {
  return !!parent && !parent.archivedAt && !parent.session?.activeTurnId && parent.latestTurn?.state !== 'running' && !parent.hasPendingApprovals && !parent.hasPendingUserInput && !parent.hasActionableProposedPlan;
}

export function protocolV1(client) {
  const shell = () => client.readShell();
  const findThread = async id => (await shell()).threads.find(t => t.id === id);
  const turnStart = (threadId, messageId, text, runtimeMode, interactionMode, modelSelection) => ({ method: DISPATCH, payload: {
    type: 'thread.turn.start', ...stamp(), threadId, message: { messageId, role: 'user', text, attachments: [] },
    ...(modelSelection ? { modelSelection } : {}), runtimeMode, interactionMode } });
  return {
    protocol: 1,
    async providers() {
      const cfg = await client.request('server.getConfig', {});
      return cfg.providers.map(p => ({ instanceId: p.instanceId, enabled: p.enabled !== false, installed: !!p.installed, status: p.status, auth: p.auth?.status ?? null,
        models: (p.models || []).map(m => ({ slug: m.slug, isDefault: !!m.isDefault, optionIds: (m.capabilities?.optionDescriptors || []).map(o => o.id) })) }));
    },
    async live() {
      const s = await shell();
      return { projects: s.projects.map(p => ({ id: p.id, workspaceRoot: p.workspaceRoot })),
        threads: s.threads.map(t => ({ id: t.id, projectId: t.projectId, archived: !!t.archivedAt, busy: t.latestTurn?.state === 'running' || !!t.session?.activeTurnId })) };
    },
    launchCommands({ threadId, projectId, title, selection, runtimeMode, interactionMode, messageId, text }) {
      return [
        { name: 'create', method: DISPATCH, payload: { type: 'thread.create', ...stamp(), threadId, projectId, title, modelSelection: selection, runtimeMode, interactionMode, branch: null, worktreePath: null } },
        { name: 'launch', ...turnStart(threadId, messageId, text, runtimeMode, interactionMode, selection) },
      ];
    },
    async observe(task) {
      const s = await shell(), t = s.threads.find(x => x.id === task.threadId);
      if (!t) return null;
      const detail = (await client.readThread(task.threadId, { turnLimit: 12 })).thread;
      return { runtimeMode: t.runtimeMode, interactionMode: t.interactionMode, ...classifyV1(t, detail, task.messageId) };
    },
    respondCommand({ threadId, requestId, answers }) {
      return { method: DISPATCH, payload: { type: 'thread.user-input.respond', ...stamp(), threadId, requestId, answers } };
    },
    followUpCommand({ threadId, messageId, text, runtimeMode, interactionMode }) {
      return turnStart(threadId, messageId, text, runtimeMode, interactionMode);
    },
    renameCommand({ threadId, title }) {
      return { method: DISPATCH, payload: { type: 'thread.meta.update', ...stamp(), threadId, title } };
    },
    async parent(threadId) {
      const p = await findThread(threadId);
      return { exists: !!p && !p.archivedAt, ready: parentReadyV1(p), runtimeMode: p?.runtimeMode, interactionMode: p?.interactionMode };
    },
    postCommand({ threadId, messageId, text, parent }) {
      return turnStart(threadId, messageId, text, parent.runtimeMode, parent.interactionMode);
    },
  };
}
