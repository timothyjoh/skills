// Child progress reports: fenced `t3-report` blocks the t3-report skill delivers in the
// child conversation, as a shell command or as reply text. Only assistant entries count;
// a quoted block in a user message is not a report.
const BLOCK = /```t3-report[^\n]*\n([\s\S]*?)```/g;
export const reportStates = ['started', 'working', 'blocked', 'done', 'failed'];

export function parseBlock(body) {
  const fields = {};
  for (const line of body.split('\n')) {
    const m = /^\s*([A-Za-z][\w-]*)\s*:\s*(.*?)\s*$/.exec(line);
    if (m && m[2]) fields[m[1].toLowerCase()] = m[2].slice(0, 2000);
  }
  return fields;
}

// Returns reports in conversation order. A block from another handoff (for example,
// one the child quotes from its own children) is ignored when it names a handoff.
export function extractReports(messages, handoffId) {
  const reports = [], seqs = new Set();
  for (const message of messages ?? []) {
    if (message.role !== 'assistant' || typeof message.text !== 'string') continue;
    let index = 0;
    for (const match of message.text.matchAll(BLOCK)) {
      const fields = parseBlock(match[1]);
      if (handoffId && fields.handoff && fields.handoff !== handoffId) continue;
      const seq = Number.parseInt(fields.seq, 10);
      // The same report can appear twice: in its command and again in the final answer.
      if (Number.isFinite(seq)) { if (seqs.has(seq)) continue; seqs.add(seq); }
      reports.push({ key: `${message.id}#${index++}`, messageId: message.id, ...(message.createdAt ? { at: message.createdAt } : {}),
        seq: Number.isFinite(seq) ? seq : null, status: reportStates.includes(fields.status) ? fields.status : 'working', fields });
    }
  }
  return reports;
}

// One line per report for a progress view or a parent callback.
export function formatReport(r) {
  const f = r.fields, parts = [`#${r.seq ?? '?'} ${r.status}`];
  for (const k of ['phase', 'progress', 'done', 'next', 'blocked', 'evidence']) if (f[k]) parts.push(`${k}: ${f[k]}`);
  for (const [k, v] of Object.entries(f)) if (!['handoff', 'seq', 'status', 'phase', 'progress', 'done', 'next', 'blocked', 'evidence'].includes(k)) parts.push(`${k}: ${v}`);
  return parts.join(' | ');
}
