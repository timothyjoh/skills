import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate as nextTick } from 'node:timers/promises';
import { T3Client, T3_METHODS, readSnapshot, projectCreate, researchThreadCreate, researchTurnStart, userInputRespond, extractPendingInputs, pendingInteractions } from '../t3-client.mjs';

function fixture(options = {}) {
  const sockets = []; const requests = []; const events = [];
  class Socket extends EventTarget {
    readyState = 0; sent = [];
    constructor(url) { super(); this.url = url; sockets.push(this); queueMicrotask(() => { if (this.readyState !== 0) return; this.readyState = 1; this.dispatchEvent(new Event('open')); }); }
    send(text) { if (this.readyState !== 1) throw Error('closed'); this.sent.push(JSON.parse(text)); }
    close() { if (this.readyState === 3) return; this.readyState = 3; this.dispatchEvent(new Event('close')); }
    receive(data) { this.dispatchEvent(new MessageEvent('message', { data: typeof data === 'string' ? data : JSON.stringify(data) })); }
  }
  const client = new T3Client({ url: 'http://127.0.0.1:3773', token: 'private-token',
    WebSocketImpl: Socket, fetchImpl: async (url, init) => { requests.push({ url: String(url), ...init }); return { ok: true, json: async () => ({ ticket: 'one-time-ticket' }) }; },
    onEvent: (event) => events.push(event), pingIntervalMs: 0, timeoutMs: 1000, ...options });
  return { client, sockets, requests, events, get socket() { return sockets.at(-1); } };
}
const success = (requestId, value) => ({ _tag: 'Exit', requestId, exit: { _tag: 'Success', value } });

test('mints ticket using bearer header, exchanges Effect request and success without putting token in WS URL', async (t) => {
  const f = fixture(); t.after(() => f.client.close()); await f.client.connect();
  assert.equal(f.requests[0].url, 'http://127.0.0.1:3773/api/auth/websocket-ticket');
  assert.equal(f.requests[0].method, 'POST');
  assert.equal(f.requests[0].headers.authorization, 'Bearer private-token');
  assert.equal(f.requests[0].redirect, 'error');
  assert.equal(f.socket.url, 'ws://127.0.0.1:3773/ws?wsTicket=one-time-ticket');
  const result = f.client.request(T3_METHODS.config, {});
  assert.deepEqual(f.socket.sent[0], { _tag: 'Request', id: '1', tag: 'server.getConfig', payload: {}, headers: [] });
  f.socket.receive(success(1, { providers: [] }));
  assert.deepEqual(await result, { providers: [] });
  assert.equal(JSON.stringify(f.client).includes('private-token'), false);
});

test('correlates concurrent results, decodes response batches and contains server errors', async (t) => {
  const f = fixture(); t.after(() => f.client.close()); await f.client.connect();
  const first = f.client.request('one', {}); const second = f.client.request('two', {});
  f.socket.receive([success('2', 22), success('1', 11)]);
  assert.deepEqual(await Promise.all([first, second]), [11, 22]);
  const failure = assert.rejects(f.client.request('three', {}), (error) => error.code === 'RPC_REJECTED' && !error.message.includes('secret'));
  f.socket.receive({ _tag: 'Exit', requestId: '3', exit: { _tag: 'Failure', cause: [{ _tag: 'Fail', error: { message: 'secret text' } }] } });
  await failure;
});

test('stream applies async values in order, acknowledges after processing, and interrupts on unsubscribe', async (t) => {
  const f = fixture(); t.after(() => f.client.close()); await f.client.connect();
  let release; const wait = new Promise((resolve) => { release = resolve; }); const values = [];
  const unsubscribe = f.client.subscribe(T3_METHODS.shell, {}, async (value) => { values.push(value); if (value === 1) await wait; });
  f.socket.receive({ _tag: 'Chunk', requestId: '1', values: [1, 2] });
  await nextTick(); assert.deepEqual(values, [1]); assert.equal(f.socket.sent.length, 1);
  release(); await nextTick(); assert.deepEqual(values, [1, 2]);
  assert.deepEqual(f.socket.sent.at(-1), { _tag: 'Ack', requestId: '1' });
  unsubscribe(); unsubscribe(); assert.deepEqual(f.socket.sent.at(-1), { _tag: 'Interrupt', requestId: '1' });
  assert.equal(f.socket.sent.length, 3);
});

test('disconnect rejects unresolved requests, reports subscriptions, and reconnect mints fresh ticket', async (t) => {
  const f = fixture(); t.after(() => f.client.close()); await f.client.connect();
  const rejected = assert.rejects(f.client.request('pending', {}), { code: 'DISCONNECTED' });
  let subError; f.client.subscribe(T3_METHODS.shell, {}, () => {}, { onError: (error) => { subError = error; } });
  f.socket.close(); await rejected;
  assert.equal(subError.code, 'DISCONNECTED'); assert.equal(f.client.connected, false);
  await f.client.connect(); assert.equal(f.requests.length, 2); assert.equal(f.client.connected, true);
});

test('timeout interrupts request and explicitly leaves command outcome unknown', async (t) => {
  const f = fixture(); t.after(() => f.client.close()); await f.client.connect();
  await assert.rejects(f.client.request(T3_METHODS.dispatch, {}, { timeoutMs: 10 }), (error) => error.code === 'TIMEOUT' && error.message.includes('unknown'));
  assert.deepEqual(f.socket.sent.at(-1), { _tag: 'Interrupt', requestId: '1' });
  f.socket.receive(success('1', { sequence: 42 })); await nextTick();
});

test('snapshot helper unsubscribes after initial snapshot', async (t) => {
  const f = fixture(); t.after(() => f.client.close()); await f.client.connect();
  const snapshot = readSnapshot(f.client);
  f.socket.receive({ _tag: 'Chunk', requestId: '1', values: [{ kind: 'snapshot', snapshot: { snapshotSequence: 8, projects: [], threads: [] } }] });
  assert.equal((await snapshot).snapshotSequence, 8);
  assert.deepEqual(f.socket.sent.at(-1), { _tag: 'Interrupt', requestId: '1' });
});

test('malformed and oversized frames fail closed rather than accumulating unbounded data', async (t) => {
  for (const frame of ['not-json', 'x'.repeat(101)]) {
    const f = fixture({ maxFrameBytes: 100 }); t.after(() => f.client.close()); await f.client.connect();
    const result = assert.rejects(f.client.request('pending', {}), (error) => ['PROTOCOL', 'LIMIT'].includes(error.code));
    f.socket.receive(frame); await result; assert.equal(f.client.connected, false);
  }
});

test('request capacity is bounded and subscription callback failures disconnect', async (t) => {
  const f = fixture({ maxPending: 1 }); t.after(() => f.client.close()); await f.client.connect();
  f.client.subscribe(T3_METHODS.shell, {}, () => { throw Error('handler'); });
  await assert.rejects(f.client.request('extra', {}), { code: 'LIMIT' });
  f.socket.receive({ _tag: 'Chunk', requestId: '1', values: [{}] });
  await nextTick(); assert.equal(f.client.connected, false);
});

test('authentication errors do not expose response bodies or transport credentials', async () => {
  const f = fixture({ fetchImpl: async () => { throw Error('URL included secret'); } });
  await assert.rejects(f.client.connect(), (error) => error.code === 'CONNECT' && !error.message.includes('secret'));
});

test('closing during ticket acquisition prevents an unwanted later connection', async () => {
  let release; const hold = new Promise((resolve) => { release = resolve; });
  const f = fixture({ fetchImpl: async () => { await hold; return { ok: true, json: async () => ({ ticket: 'ticket' }) }; } });
  const connecting = assert.rejects(f.client.connect(), { code: 'DISCONNECTED' });
  f.client.close(); release(); await connecting; assert.equal(f.sockets.length, 0);
});

test('research helpers preserve saved IDs and enforce plan/approval-required in local checkout', () => {
  const base = { commandId: 'command-1', createdAt: '2026-09-07T12:00:00.000Z', projectId: 'project-1', threadId: 'thread-1', title: 'Research', modelSelection: { instanceId: 'claudeAgent', model: 'sonnet' }, runtimeMode: 'full-access', interactionMode: 'default', worktreePath: '/unsafe' };
  const project = projectCreate({ ...base, workspaceRoot: '/tmp/repo' });
  assert.equal(project.createWorkspaceRootIfMissing, false);
  const thread = researchThreadCreate(base);
  assert.equal(thread.runtimeMode, 'approval-required'); assert.equal(thread.interactionMode, 'plan');
  assert.equal(thread.worktreePath, null); assert.equal(thread.branch, null);
  const turn = researchTurnStart({ ...base, messageId: 'message-1', text: 'Investigate only.' });
  assert.equal(turn.commandId, 'command-1'); assert.equal(turn.message.messageId, 'message-1');
  assert.equal(turn.runtimeMode, 'approval-required'); assert.equal(turn.interactionMode, 'plan');
  assert.deepEqual(turn.message.attachments, []);
  assert.throws(() => researchThreadCreate({ ...base, modelSelection: undefined }));
  assert.equal(userInputRespond({ ...base, requestId: 'question-1', answers: { q: 'Answer' } }).type, 'thread.user-input.respond');
});

test('pending questions preserve provider question IDs and drop resolved requests independently of approvals', () => {
  const activity = (kind, requestId, payload = {}) => ({ kind, summary: 'Request', createdAt: '2026-09-07T12:00:00.000Z', payload: { requestId, ...payload } });
  const question = { id: 'Which tenant should I research?', question: 'Which tenant should I research?', options: [] };
  const activities = [activity('user-input.requested', 'q1', { questions: [question] }), activity('user-input.requested', 'q2', { questions: [question] }), activity('approval.requested', 'a1'), activity('user-input.resolved', 'q1')];
  assert.deepEqual(extractPendingInputs(activities).map(x => x.requestId), ['q2']);
  assert.equal(extractPendingInputs(activities)[0].questions[0].id, question.id);
  assert.deepEqual(pendingInteractions({ activities }).approvals.map(x => x.requestId), ['a1']);
});

test('readThread requests a bounded history window and returns its detail snapshot', async (t) => {
  const f = fixture(); t.after(() => f.client.close()); await f.client.connect();
  const result = f.client.readThread('thread-1');
  assert.deepEqual(f.socket.sent.at(-1).payload, { threadId: 'thread-1', turnLimit: 8 });
  f.socket.receive({ _tag: 'Chunk', requestId: '1', values: [{ kind: 'snapshot', snapshot: { snapshotSequence: 9, thread: { id: 'thread-1' } } }] });
  assert.equal((await result).thread.id, 'thread-1');
});
