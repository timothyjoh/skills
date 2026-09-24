import { randomUUID } from 'node:crypto';

export const T3_METHODS = Object.freeze({
  dispatch: 'orchestration.dispatchCommand',
  shell: 'orchestration.subscribeShell',
  thread: 'orchestration.subscribeThread',
  config: 'server.getConfig',
});

export class T3Error extends Error {
  constructor(message, code = 'T3_ERROR') { super(message); this.name = 'T3Error'; this.code = code; }
}

// Effect RPC's JSON transport, pinned to T3 8b2838e. This is not JSON-RPC 2.0.
// The bearer token is used only to mint a short-lived WebSocket ticket.
export class T3Client {
  #url; #token; #fetch; #WebSocket; #socket; #connecting; #generation = 0;
  #pending = new Map(); #nextId = 0; #heartbeat; #pong = true; #connectAbort;
  #timeoutMs; #pingIntervalMs; #maxPending; #maxFrameBytes; #queuedBytes = 0;
  #onEvent; #onDisconnect;

  constructor({ url, token, onEvent = () => {}, onDisconnect = () => {}, fetchImpl = globalThis.fetch,
    WebSocketImpl = globalThis.WebSocket, timeoutMs = 15000,
    pingIntervalMs = 5000, maxPending = 128, maxFrameBytes = 8 * 1024 * 1024 }) {
    const parsed = new URL(url);
    if (!['http:', 'https:', 'ws:', 'wss:'].includes(parsed.protocol)) throw new T3Error('Unsupported T3 URL', 'CONFIG');
    if (parsed.username || parsed.password || parsed.search || parsed.hash) throw new T3Error('T3 URL must not contain credentials, query parameters, or a fragment', 'CONFIG');
    if (!token || typeof token !== 'string' || !/^[\x21-\x7e]+$/.test(token)) throw new T3Error('A single-line T3 bearer token is required', 'CONFIG');
    if (typeof fetchImpl !== 'function' || typeof WebSocketImpl !== 'function') throw new T3Error('Node 24 or compatible fetch and WebSocket implementations required', 'CONFIG');
    this.#url = parsed; this.#token = token; this.#fetch = fetchImpl; this.#WebSocket = WebSocketImpl;
    this.#onEvent = onEvent; this.#onDisconnect = onDisconnect; this.#timeoutMs = timeoutMs; this.#pingIntervalMs = pingIntervalMs;
    this.#maxPending = maxPending; this.#maxFrameBytes = maxFrameBytes;
  }

  get connected() { return this.#socket?.readyState === 1; }
  readShell(options) { return readSnapshot(this, T3_METHODS.shell, {}, options); }
  readThread(threadId, { turnLimit = 8, ...options } = {}) {
    return readSnapshot(this, T3_METHODS.thread, { threadId: required(threadId, 'threadId'), turnLimit }, options);
  }

  async connect() {
    if (this.connected) return;
    if (this.#connecting) return this.#connecting;
    const generation = ++this.#generation;
    const operation = this.#open(generation);
    this.#connecting = operation;
    try { await operation; } finally { if (this.#connecting === operation) this.#connecting = undefined; }
  }

  async #open(generation) {
    const ticketUrl = new URL('/api/auth/websocket-ticket', this.#url);
    ticketUrl.protocol = ['https:', 'wss:'].includes(this.#url.protocol) ? 'https:' : 'http:';
    const abort = new AbortController(); this.#connectAbort = abort;
    const timer = setTimeout(() => abort.abort(), this.#timeoutMs);
    let ticket;
    try {
      const result = await this.#fetch(ticketUrl, { method: 'POST',
        headers: { authorization: `Bearer ${this.#token}` }, signal: abort.signal, redirect: 'error' });
      if (!result.ok) throw new T3Error(`T3 authentication failed (HTTP ${result.status})`, 'AUTH');
      const body = await result.json();
      if (typeof body.ticket !== 'string' || !body.ticket) throw new T3Error('T3 returned an invalid WebSocket ticket', 'PROTOCOL');
      ticket = body.ticket;
    } catch (error) {
      // Native fetch errors can contain URLs; never propagate credential-bearing details.
      throw error instanceof T3Error ? error : new T3Error('Unable to obtain T3 WebSocket ticket', 'CONNECT');
    } finally { clearTimeout(timer); if (this.#connectAbort === abort) this.#connectAbort = undefined; }
    if (generation !== this.#generation) throw new T3Error('T3 connection cancelled', 'DISCONNECTED');
    const wsUrl = new URL(this.#url);
    wsUrl.protocol = ticketUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    if (wsUrl.pathname === '/') wsUrl.pathname = '/ws';
    wsUrl.searchParams.set('wsTicket', ticket);
    let socket;
    try { socket = new this.#WebSocket(wsUrl.toString()); }
    catch { throw new T3Error('Unable to create T3 WebSocket', 'CONNECT'); }
    socket.binaryType = 'arraybuffer'; this.#socket = socket;
    let chain = Promise.resolve();
    socket.addEventListener('message', (event) => {
      if (socket !== this.#socket) return;
      const size = typeof event.data === 'string' ? Buffer.byteLength(event.data) : event.data.byteLength ?? event.data.size ?? 0;
      this.#queuedBytes += size;
      if (size > this.#maxFrameBytes || this.#queuedBytes > this.#maxFrameBytes * 2) {
        this.#fail(new T3Error('T3 event buffer limit exceeded; reconnect and resynchronize', 'LIMIT')); return;
      }
      chain = chain.then(async () => {
        if (socket !== this.#socket) return;
        let data = event.data;
        if (typeof data !== 'string') data = new TextDecoder().decode(data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(await data.arrayBuffer()));
        const decoded = JSON.parse(data);
        for (const frame of Array.isArray(decoded) ? decoded : [decoded]) await this.#receive(frame);
      }).catch(() => { this.#fail(new T3Error('Invalid T3 RPC response or event handler failure', 'PROTOCOL')); })
        .finally(() => { this.#queuedBytes = Math.max(0, this.#queuedBytes - size); });
    });
    socket.addEventListener('close', () => { if (socket === this.#socket) this.#fail(new T3Error('T3 disconnected; reconcile task state before retrying commands', 'DISCONNECTED')); });
    socket.addEventListener('error', () => { if (socket === this.#socket) this.#fail(new T3Error('T3 WebSocket failed', 'DISCONNECTED')); });
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => { this.#fail(new T3Error('T3 WebSocket connection timed out', 'TIMEOUT')); reject(new T3Error('T3 WebSocket connection timed out', 'TIMEOUT')); }, this.#timeoutMs);
      const done = () => { clearTimeout(timeout); socket.removeEventListener('open', opened); socket.removeEventListener('close', failed); socket.removeEventListener('error', failed); };
      const failed = () => { done(); reject(new T3Error('T3 WebSocket connection failed', 'CONNECT')); };
      const opened = () => { done(); resolve(); };
      socket.addEventListener('open', opened); socket.addEventListener('close', failed); socket.addEventListener('error', failed);
    });
    if (socket !== this.#socket) throw new T3Error('T3 connection cancelled', 'DISCONNECTED');
    this.#pong = true;
    if (this.#pingIntervalMs > 0) {
      this.#heartbeat = setInterval(() => {
        if (!this.#pong) { this.#fail(new T3Error('T3 heartbeat timed out', 'DISCONNECTED')); return; }
        this.#pong = false;
        try { this.#send({ _tag: 'Ping' }); } catch { this.#fail(new T3Error('T3 heartbeat failed', 'DISCONNECTED')); }
      }, this.#pingIntervalMs);
      this.#heartbeat.unref?.();
    }
    this.#notify({ type: 'connected' });
  }

  request(method, payload, { timeoutMs = this.#timeoutMs } = {}) {
    return new Promise((resolve, reject) => {
      try { this.#start(method, payload, { resolve, reject }, timeoutMs); } catch (error) { reject(error); }
    });
  }

  // Connect first. Each async onValue finishes before its chunk is acknowledged.
  // The returned function interrupts this subscription only, not the agent turn.
  subscribe(method, payload, onValue, { onError, timeoutMs = this.#timeoutMs } = {}) {
    if (typeof onValue !== 'function') throw new TypeError('onValue is required');
    const id = this.#start(method, payload, { onValue, onError }, timeoutMs);
    return () => {
      const pending = this.#pending.get(id);
      if (!pending) return;
      clearTimeout(pending.timer); this.#pending.delete(id);
      if (this.connected) this.#send({ _tag: 'Interrupt', requestId: id });
    };
  }

  #start(method, payload, handlers, timeoutMs) {
    if (!this.connected) throw new T3Error('T3 is not connected', 'DISCONNECTED');
    if (this.#pending.size >= this.#maxPending) throw new T3Error('T3 outstanding request limit exceeded', 'LIMIT');
    const id = String(++this.#nextId);
    const pending = { method, ...handlers };
    pending.timer = setTimeout(() => {
      if (!this.#pending.delete(id)) return;
      if (this.connected) this.#send({ _tag: 'Interrupt', requestId: id });
      this.#reject(pending, new T3Error(`T3 request timed out: ${method}; outcome may be unknown`, 'TIMEOUT'));
    }, timeoutMs);
    this.#pending.set(id, pending);
    try { this.#send({ _tag: 'Request', id, tag: method, payload, headers: [] }); }
    catch (error) { clearTimeout(pending.timer); this.#pending.delete(id); throw error; }
    return id;
  }

  async #receive(frame) {
    if (!frame || typeof frame._tag !== 'string') throw new Error('Invalid envelope');
    if (frame._tag === 'Pong') { this.#pong = true; return; }
    if (frame._tag === 'Defect' || frame._tag === 'ClientProtocolError') { this.#fail(new T3Error('T3 reported a protocol error', 'PROTOCOL')); return; }
    const id = String(frame.requestId);
    const pending = this.#pending.get(id);
    if (!pending) return;
    if (frame._tag === 'Chunk') {
      if (!pending.onValue || !Array.isArray(frame.values)) throw new Error('Unexpected chunk');
      clearTimeout(pending.timer);
      for (const value of frame.values) {
        if (this.#pending.get(id) !== pending) break;
        await pending.onValue(value);
      }
      if (this.connected && this.#pending.get(id) === pending) this.#send({ _tag: 'Ack', requestId: frame.requestId });
    } else if (frame._tag === 'Exit') {
      clearTimeout(pending.timer); this.#pending.delete(id);
      if (frame.exit?._tag === 'Success') {
        pending.resolve?.(frame.exit.value);
        if (pending.onValue) this.#notify({ type: 'subscription-ended', method: pending.method });
      } else {
        // Do not copy arbitrary provider errors into logs; they can contain secrets.
        this.#reject(pending, new T3Error(`T3 rejected ${pending.method}`, 'RPC_REJECTED'));
      }
    } else throw new Error('Unknown response envelope');
  }

  #send(frame) {
    if (!this.connected) throw new T3Error('T3 is not connected', 'DISCONNECTED');
    try { this.#socket.send(JSON.stringify(frame)); }
    catch { throw new T3Error('T3 send failed; command outcome may be unknown', 'DISCONNECTED'); }
  }

  #notify(event) { try { this.#onEvent(event); } catch { /* observers cannot break transport cleanup */ } }
  #reject(pending, error) {
    pending.reject?.(error);
    if (pending.onValue) {
      try { pending.onError?.(error); } catch { /* cleanup continues */ }
      this.#notify({ type: 'subscription-error', method: pending.method, error });
    }
  }
  #fail(error) {
    const socket = this.#socket; this.#socket = undefined;
    clearInterval(this.#heartbeat); this.#heartbeat = undefined;
    for (const pending of this.#pending.values()) { clearTimeout(pending.timer); this.#reject(pending, error); }
    this.#pending.clear();
    if (socket) {
      try { socket.close(); } catch {}
      this.#notify({ type: 'disconnected', error });
      try { this.#onDisconnect(error); } catch { /* observers cannot break cleanup */ }
    }
  }
  close() {
    ++this.#generation; this.#connectAbort?.abort();
    this.#fail(new T3Error('T3 client closed', 'DISCONNECTED'));
  }
}

const required = (value, name) => {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${name} is required`);
  return value;
};
const stamp = ({ commandId = randomUUID(), createdAt = new Date().toISOString() }) => ({ commandId, createdAt });
const selection = (value) => {
  required(value?.instanceId, 'modelSelection.instanceId'); required(value?.model, 'modelSelection.model');
  return { ...value };
};

// Persist these complete commands BEFORE dispatch. Reuse commandId on an ambiguous
// retry; a new commandId can launch duplicate work. These helpers never dispatch.
export function projectCreate(input) {
  return { type: 'project.create', ...stamp(input), projectId: required(input.projectId, 'projectId'),
    title: required(input.title, 'title'), workspaceRoot: required(input.workspaceRoot, 'workspaceRoot'),
    createWorkspaceRootIfMissing: false };
}
export function researchThreadCreate(input) {
  return { type: 'thread.create', ...stamp(input), threadId: required(input.threadId, 'threadId'),
    projectId: required(input.projectId, 'projectId'), title: required(input.title, 'title'),
    modelSelection: selection(input.modelSelection), runtimeMode: 'approval-required', interactionMode: 'plan',
    branch: null, worktreePath: null };
}
export function researchTurnStart(input) {
  return { type: 'thread.turn.start', ...stamp(input), threadId: required(input.threadId, 'threadId'),
    message: { messageId: input.messageId ?? randomUUID(), role: 'user', text: required(input.text, 'text'), attachments: input.attachments ?? [] },
    ...(input.modelSelection ? { modelSelection: selection(input.modelSelection) } : {}),
    runtimeMode: 'approval-required', interactionMode: 'plan' };
}
export function userInputRespond(input) {
  if (!input.answers || typeof input.answers !== 'object' || Array.isArray(input.answers)) throw new TypeError('answers must be an object keyed by question ID');
  return { type: 'thread.user-input.respond', ...stamp(input), threadId: required(input.threadId, 'threadId'),
    requestId: required(input.requestId, 'requestId'), answers: input.answers };
}
export function interruptTurn(input) {
  return { type: 'thread.turn.interrupt', ...stamp(input), threadId: required(input.threadId, 'threadId'),
    ...(input.turnId ? { turnId: input.turnId } : {}) };
}

export function readSnapshot(client, method = T3_METHODS.shell, payload = {}, { timeoutMs = 15000 } = {}) {
  return new Promise((resolve, reject) => {
    let unsubscribe;
    const timer = setTimeout(() => { unsubscribe?.(); reject(new T3Error('T3 snapshot timed out', 'TIMEOUT')); }, timeoutMs);
    try {
      unsubscribe = client.subscribe(method, payload, (item) => {
        if (item.kind !== 'snapshot') return;
        clearTimeout(timer); unsubscribe?.(); resolve(item.snapshot);
      }, { timeoutMs, onError: (error) => { clearTimeout(timer); reject(error); } });
    } catch (error) { clearTimeout(timer); reject(error); }
  });
}

// These are candidate requests from the snapshot's retained activities. Use the
// fresh shell pending flags too; a provider restart can make old requests stale.
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

export function extractPendingInputs(activities) {
  return pendingInteractions({ activities }).questions;
}
