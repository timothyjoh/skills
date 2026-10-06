// T3 orchestration protocol 2 (T3 Code 0.0.46 and later): runs, runtime requests and
// plans in a thread projection. The commandId is the server's idempotency key.
const DISPATCH = 'orchestration.dispatchCommand';
const ACTIVE = ['preparing', 'queued', 'starting', 'running', 'waiting'];
const id = () => crypto.randomUUID();
const pick = m => ({ id: m.id, role: m.role, text: m.text, ...(m.createdAt ? { createdAt: m.createdAt } : {}) });

// Report sources in run order: assistant text and shell command inputs (t3-report
// delivers each report as a `cat <<'T3_REPORT'` command, which survives in turn items).
function transcriptV2(projection, run, replies) {
  if (!run) return replies;
  const items = (projection.turnItems || []).filter(i => i.runId === run.id && !i.streaming && (
    (i.type === 'assistant_message' && typeof i.text === 'string') || (i.type === 'command_execution' && typeof i.input === 'string')))
    .sort((a, b) => a.ordinal - b.ordinal);
  if (!items.some(i => i.type === 'assistant_message')) return [...replies, ...items.map(i => ({ id: i.id, role: 'assistant', source: 'command', text: i.input }))];
  return items.map(i => ({ id: i.id, role: 'assistant', ...(i.type === 'command_execution' ? { source: 'command', text: i.input } : { text: i.text }) }));
}

export function classifyV2(projection, messageId) {
  const msgs = projection.messages || [];
  const userIndex = msgs.findIndex(m => m.id === messageId);
  if (userIndex < 0) return { state: 'unknown', reason: 'The delegated prompt is not in this thread. Do not assume completion or relaunch.', transcript: [] };
  const nextUser = msgs.findIndex((m, i) => i > userIndex && m.role === 'user');
  const replies = msgs.slice(userIndex + 1, nextUser < 0 ? undefined : nextUser).filter(m => m.role === 'assistant' && !m.streaming).map(pick);
  const run = (projection.runs || []).find(r => r.userMessageId === messageId);
  const transcript = transcriptV2(projection, run, replies);
  if (nextUser >= 0) return { state: 'superseded', reason: 'Another prompt was sent after this delegation. Inspect its history; the latest run cannot prove this request completed.', messages: replies, transcript };
  const items = projection.turnItems || [];
  const pending = (projection.runtimeRequests || []).filter(r => r.status === 'pending');
  const questions = pending.filter(r => r.kind === 'user_input').map(r => {
    const item = items.find(i => i.type === 'user_input_request' && i.requestId === r.id);
    return { requestId: r.id, questions: item?.questions ?? [] };
  });
  if (questions.length) return { state: 'needs_input', questions, runId: run?.id, transcript };
  if (pending.length) return { state: 'needs_approval', runId: run?.id, transcript, approvals: pending.map(r => {
    const item = items.find(i => i.type === 'approval_request' && i.requestId === r.id);
    return { requestId: r.id, kind: r.kind, prompt: item?.prompt ?? item?.title ?? null };
  }) };
  if (!run) return { state: 'pending', reason: 'Launch is recorded; no run is visible yet.', transcript };
  const plans = (projection.plans || []).filter(p => p.kind === 'proposed_plan' && p.status === 'active');
  if (run.status === 'completed' && projection.thread?.interactionMode === 'plan' && plans.length)
    return { state: 'needs_plan_review', runId: run.id, plans: plans.map(p => ({ id: p.id, markdown: p.markdown })), messages: replies, transcript };
  if (run.status === 'completed') return { state: 'completed', runId: run.id, messages: replies, transcript };
  if (run.status === 'failed') {
    const error = items.filter(i => i.type === 'error' && i.runId === run.id).at(-1);
    return { state: 'failed', runId: run.id, reason: error?.failure?.message ?? 'T3 reports a failed run. Inspect the linked session.', messages: replies, transcript };
  }
  if (['interrupted', 'cancelled', 'rolled_back'].includes(run.status)) return { state: 'interrupted', runId: run.id, runStatus: run.status, transcript };
  if (['running', 'waiting'].includes(run.status)) return { state: 'running', runId: run.id, ...(run.status === 'waiting' ? { note: 'The model turn ended; background work is still finishing.' } : {}), transcript };
  return { state: 'pending', runId: run.id, reason: `Run is ${run.status}.`, transcript };
}

export function parentReadyV2(t) {
  return !!t && !t.archivedAt && !t.activeRunId && !t.pendingRuntimeRequest && !t.hasActionableProposedPlan && !ACTIVE.includes(t.status);
}

export function protocolV2(client) {
  const shell = () => client.readShell();
  const dispatchMessage = (threadId, messageId, text) => ({ method: DISPATCH, payload: {
    type: 'message.dispatch', commandId: id(), createdBy: 'user', creationSource: 'web', threadId, messageId, text, attachments: [],
    dispatchMode: { type: 'start_immediately' } } });
  return {
    protocol: 2,
    async providers() {
      const cfg = await client.request('server.getConfig', {});
      return cfg.providers.map(p => ({ instanceId: p.instanceId, enabled: p.enabled !== false, installed: !!p.installed, status: p.status, auth: p.auth?.status ?? null,
        models: (p.models || []).map(m => ({ slug: m.slug, isDefault: !!m.isDefault, optionIds: (m.capabilities?.optionDescriptors || []).map(o => o.id) })) }));
    },
    async live() {
      const s = await shell();
      return { projects: s.projects.map(p => ({ id: p.id, workspaceRoot: p.workspaceRoot })),
        threads: s.threads.map(t => ({ id: t.id, projectId: t.projectId, archived: !!t.archivedAt, busy: !!t.activeRunId || ACTIVE.includes(t.status) })) };
    },
    // One atomic call: create the thread with a fixed title and queue the first run.
    // generateTitle stays false, so T3 never replaces the title.
    launchCommands({ threadId, projectId, title, selection, runtimeMode, interactionMode, messageId, text }) {
      return [{ name: 'launch', method: 'orchestration.launchThread', payload: {
        commandId: id(), threadId, projectId, title, generateTitle: false, modelSelection: selection, runtimeMode, interactionMode,
        workspaceStrategy: { type: 'root' }, initialMessage: { messageId, text, attachments: [] } } }];
    },
    async observe(task) {
      const t = (await shell()).threads.find(x => x.id === task.threadId);
      if (!t) return null;
      const projection = await client.request('orchestration.getThreadProjection', { threadId: task.threadId });
      return { runtimeMode: t.runtimeMode, interactionMode: t.interactionMode, ...classifyV2(projection, task.messageId) };
    },
    respondCommand({ threadId, requestId, answers }) {
      return { method: DISPATCH, payload: { type: 'runtime-request.respond', commandId: id(), threadId, requestId, answers } };
    },
    followUpCommand({ threadId, messageId, text }) { return dispatchMessage(threadId, messageId, text); },
    renameCommand({ threadId, title }) {
      return { method: DISPATCH, payload: { type: 'thread.metadata.update', commandId: id(), threadId, title } };
    },
    async parent(threadId) {
      const p = (await shell()).threads.find(t => t.id === threadId);
      return { exists: !!p && !p.archivedAt, ready: parentReadyV2(p), runtimeMode: p?.runtimeMode, interactionMode: p?.interactionMode };
    },
    postCommand({ threadId, messageId, text }) { return dispatchMessage(threadId, messageId, text); },
  };
}
