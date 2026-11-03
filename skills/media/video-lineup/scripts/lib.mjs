// Pure helpers for lineup.mjs: templates, brief parsing, spec, loudness, build-log and QA checks,
// and the side-by-side comparison page. No file or process access here, so tests can call them directly.

export const LOG_SECTIONS = [
  'Summary', 'Timeline', 'Installed', 'Decisions made for the human', 'Skill steps followed and skipped',
  'Quality checks', 'What the skill did well', 'What went wrong', 'Human effort', 'Verdict',
];
export const SCORE_KEYS = ['message', 'fidelity', 'visual_craft', 'motion_pacing', 'audio', 'distinctiveness'];
export const TERMINAL = ['completed', 'failed', 'interrupted', 'superseded'];
export const NEEDS_USER = ['needs_input', 'needs_approval', 'needs_plan_review'];
export const TEMPLATE_MARKERS = ['# Title of the video', 'https://example.com/the-real-page', '/absolute/path/to/a/local/repo'];

// Replace {{name}} with vars[name]. A missing value is an error, so no prompt ships with a hole in it.
export function render(template, vars) {
  const missing = new Set();
  const out = template.replace(/\{\{(\w+)\}\}/g, (whole, key) => {
    if (vars[key] === undefined || vars[key] === null) { missing.add(key); return whole; }
    return String(vars[key]);
  });
  if (missing.size) throw new Error(`Template value missing: ${[...missing].join(', ')}`);
  return out;
}

// Title, frame size and length from a brief written from templates/BRIEF.md. Null where a line is absent.
export function parseBrief(text) {
  const title = (text.match(/^#\s+(.+?)\s*$/m) || [])[1] || null;
  const fmt = text.match(/^\s*-\s*Format:.*?(\d{3,4})\s*[x×]\s*(\d{3,4})/im);
  const len = text.match(/^\s*-\s*Length:.*?(\d+(?:\.\d+)?)\s*(?:to|-|–)\s*(\d+(?:\.\d+)?)\s*s/im);
  return {
    title,
    width: fmt ? Number(fmt[1]) : null,
    height: fmt ? Number(fmt[2]) : null,
    minSeconds: len ? Number(len[1]) : null,
    maxSeconds: len ? Number(len[2]) : null,
  };
}

export function templateLeftovers(text) {
  return TEMPLATE_MARKERS.filter(m => text.includes(m));
}

export function parseSize(s) {
  const m = String(s).match(/^(\d{3,4})x(\d{3,4})$/);
  if (!m) throw new Error(`--size wants WIDTHxHEIGHT, for example 1920x1080; got "${s}"`);
  return { width: Number(m[1]), height: Number(m[2]) };
}

export function parseSeconds(s) {
  const m = String(s).match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
  if (!m || Number(m[1]) > Number(m[2])) throw new Error(`--seconds wants MIN-MAX, for example 30-45; got "${s}"`);
  return { minSeconds: Number(m[1]), maxSeconds: Number(m[2]) };
}

// A short, stable folder and key name: whole words only, at most 40 characters.
export function slugify(s) {
  const words = String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
  let slug = '';
  for (const w of words) {
    const next = slug ? `${slug}-${w}` : w;
    if (next.length > 40) break;
    slug = next;
  }
  return slug || (words[0] || 'lineup').slice(0, 40);
}

export function aspect(w, h) {
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const d = gcd(w, h);
  return `${w / d}:${h / d}`;
}

// A T3 session title of 3 to 7 words, as t3-handoff asks.
export function sessionTitle(name, title) {
  return ['Video', `${name}:`, ...String(title).split(/\s+/).filter(Boolean)].slice(0, 7).join(' ').replace(/:$/, '');
}

function rate(r) {
  if (!r || r === '0/0') return null;
  const [n, d] = String(r).split('/').map(Number);
  return d ? Math.round((n / d) * 1000) / 1000 : n || null;
}

// Compare an ffprobe JSON result with the lineup format. Browsers need a 4:2:0 pixel format to play H.264.
export function checkSpec(probe, format) {
  const streams = probe.streams || [];
  const v = streams.find(s => s.codec_type === 'video');
  const a = streams.find(s => s.codec_type === 'audio');
  const duration = Math.round(Number(probe.format?.duration ?? v?.duration ?? 0) * 100) / 100;
  const fps = rate(v?.avg_frame_rate) ?? rate(v?.r_frame_rate);
  const spec = {
    codec: v?.codec_name ?? null,
    profile: v?.profile ?? null,
    width: v?.width ?? null,
    height: v?.height ?? null,
    pix_fmt: v?.pix_fmt ?? null,
    fps,
    duration_s: duration,
    audio: a ? `${a.codec_name} ${a.channels ?? '?'} ch ${a.sample_rate ?? '?'} Hz` : 'none',
    size_mb: Math.round(Number(probe.format?.size ?? 0) / 1e5) / 10,
  };
  const fails = [], notes = [];
  if (!v) fails.push('no video stream');
  else {
    if (v.codec_name !== 'h264') fails.push(`video codec ${v.codec_name}, want h264`);
    if (v.width !== format.width || v.height !== format.height) fails.push(`frame ${v.width}x${v.height}, want ${format.width}x${format.height}`);
    if (!['yuv420p', 'yuvj420p'].includes(v.pix_fmt)) fails.push(`pixel format ${v.pix_fmt}; browsers need yuv420p`);
    if (fps && fps < 23.9) fails.push(`${fps} fps, want 24 or more`);
  }
  if (!a) fails.push('no audio stream');
  else if (a.codec_name !== 'aac') fails.push(`audio codec ${a.codec_name}, want aac`);
  const { minSeconds: lo, maxSeconds: hi } = format;
  if (duration < lo - 1 || duration > hi + 1) fails.push(`${duration} s, want ${lo} to ${hi} s`);
  else if (duration < lo || duration > hi) notes.push(`${duration} s is within 1 s of the ${lo} to ${hi} s range`);
  return { pass: fails.length === 0, fails, notes, spec };
}

// Integrated loudness and true peak from the summary that ffmpeg's ebur128 filter prints last.
export function parseLoudness(stderr) {
  const last = re => { let m, out = null; const g = new RegExp(re, 'g'); while ((m = g.exec(stderr))) out = m[1]; return out; };
  const num = s => (s === null ? null : s === '-inf' ? -Infinity : Number(s));
  const lufs = num(last(String.raw`\bI:\s+(-?[\d.]+|-inf) LUFS`));
  const truePeak = num(last(String.raw`Peak:\s+(-?[\d.]+|-inf) dBFS`));
  const text = lufs === null ? 'not measured' : `${lufs} LUFS integrated${truePeak === null ? '' : `, true peak ${truePeak} dBTP`}`;
  return { lufs, truePeak, text };
}

// Which of the 10 BUILD-LOG sections are present, as Markdown headings or bold list items.
export function buildLogSections(text) {
  const names = [];
  for (const line of String(text).split('\n')) {
    const h = line.match(/^#{1,6}\s+(.+)$/) || line.match(/^\s*(?:[-*+]\s+)?(?:\d+[.)]\s*)?\*\*(.+?)\*\*/);
    if (h) names.push(h[1].replace(/^\d+[.)]\s*/, '').replace(/\*\*/g, '').trim().toLowerCase());
  }
  const present = [], missing = [];
  for (const s of LOG_SECTIONS) (names.some(n => n.startsWith(s.toLowerCase())) ? present : missing).push(s);
  return { present, missing };
}

// Summarize video-director's qa_video.py report.json: one line per failed or warned check, repeats counted.
export function qaSummary(report) {
  const checks = report?.checks || [];
  const count = level => checks.filter(c => c.level === level).length;
  const groups = new Map();
  for (const c of checks) {
    if (c.level !== 'FAIL' && c.level !== 'WARN') continue;
    const key = `${c.level} ${c.check}`;
    const g = groups.get(key) || { level: c.level, check: c.check, n: 0, detail: c.detail };
    g.n += 1;
    groups.set(key, g);
  }
  const lines = [...groups.values()]
    .sort((x, y) => (x.level === y.level ? 0 : x.level === 'FAIL' ? -1 : 1))
    .map(g => (g.n > 1 ? `${g.level} ${g.check}: ${g.n} times` : `${g.level} ${g.check}: ${g.detail}`));
  const verdict = count('FAIL') ? 'fail' : count('WARN') ? 'warn' : checks.length ? 'pass' : 'not run';
  return { verdict, fails: count('FAIL'), warns: count('WARN'), passes: count('PASS'), lines };
}

// A build is settled when T3 reports an end or a wait on the user. Two states do not prove an end, so only
// complete deliverables settle them: "unknown" (on T3 0.1.5, t3-handoff loses sight of a long session's
// prompt), "superseded" (a session that waits on background work starts a new run when that work
// reports, and t3-handoff reads the new run as a newer request while the build is still working), and
// "unreadable" (t3-handoff status failed, for example while T3 restarts).
export const FILES_DECIDE = ['unknown', 'superseded', 'unreadable'];
export function settled(state, complete) {
  if (FILES_DECIDE.includes(state)) return complete;
  return TERMINAL.includes(state) || NEEDS_USER.includes(state);
}

export function reportLine(r) {
  const f = r.fields || {};
  const parts = [`#${r.seq ?? '?'} ${r.status || f.status || 'working'}`];
  for (const k of ['phase', 'progress', 'done', 'next', 'blocked', 'evidence']) if (f[k]) parts.push(`${k}: ${f[k]}`);
  return parts.join(' | ').replace(/\s+/g, ' ').slice(0, 600);
}

export function machineFactsText(f) {
  const out = [];
  if (f.os) out.push(`${f.os}${f.cpu ? `, ${f.cpu}` : ''}${f.cores ? `, ${f.cores} cores` : ''}${f.memGB ? `, ${f.memGB} GB RAM` : ''}.`);
  if (f.ffmpeg) {
    const enc = ['libx264', 'aac'].filter(k => f.ffmpeg[k]);
    const noEnc = ['libx264', 'aac'].filter(k => !f.ffmpeg[k]);
    const lack = ['drawtext', 'subtitles', 'ass'].filter(k => !f.ffmpeg[k]);
    const words = xs => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} or ${xs[xs.length - 1]}` : xs[0]);
    let s = `ffmpeg ${f.ffmpeg.version || '(unknown version)'} is at \`${f.ffmpeg.path}\`${enc.length ? ` with ${enc.join(' and ')}` : ''}`;
    if (noEnc.length) s += `, without the ${words(noEnc)} encoder${noEnc.length > 1 ? 's' : ''}`;
    if (lack.length) s += `, and it has no ${words(lack)} filter${lack.length > 1 ? 's' : ''}, so burned-in text must come from the page you render`;
    out.push(`${s}.`);
  } else out.push('ffmpeg is not on PATH.');
  if (f.chrome) out.push(`${f.chrome.version || 'Chrome'} is at \`${f.chrome.path}\`.`);
  if (f.playwright?.browsers?.length) out.push(`Playwright browsers are cached in \`${f.playwright.cache}\`: ${f.playwright.browsers.join(', ')}.`);
  if (f.playwright?.versions?.length) out.push(`To reuse a cached Chromium, install ${f.playwright.versions.map(v => `playwright@${v.version} (chromium-${v.revision})`).join(' or ')}.`);
  if (f.whisper) out.push(`A local Whisper writes a .txt transcript with: \`${f.whisper}\` (replace {wav} and {outdir}).`);
  const tools = ['node', 'npm', 'uv', 'python3', 'bun', 'git'].filter(k => f[k]).map(k => `${k} ${f[k]}`);
  if (tools.length) out.push(`Available: ${tools.join(', ')}.`);
  return out.join(' ');
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

// Reviewers are agents: accept a string where a list belongs, rather than failing the page.
export const arr = x => (Array.isArray(x) ? x : x === undefined || x === null || /^\s*(|none|n\/?a|no|-)\.?\s*$/i.test(String(x)) ? [] : [x]);
const list = xs => (arr(xs).length ? arr(xs).map(x => `<li>${esc(typeof x === 'string' ? x : JSON.stringify(x))}</li>`).join('') : '<li>None</li>');

function avgScore(review) {
  const s = SCORE_KEYS.map(k => review?.scores?.[k]?.score).filter(n => typeof n === 'number');
  return s.length ? s.reduce((a, b) => a + b, 0) / s.length : null;
}

export function judgeRanks(judges) {
  const out = {};
  for (const j of arr(judges)) {
    const lens = String(j?.lens || 'Judge').split(':')[0].trim() || 'Judge';
    for (const r of arr(j?.ranking)) if (r?.name) (out[r.name] ||= {})[lens] = r;
  }
  return out;
}

function card(e, ranks) {
  const m = e.measure, r = e.review || null, name = e.name;
  const spec = m.spec || {};
  const pills = Object.entries(ranks).sort().map(([lens, x]) => `<span class="pill">${esc(lens)} #${esc(x.rank)} · ${esc(x.score)}/10</span>`).join(' ');
  const scores = r?.scores && typeof r.scores === 'object'
    ? SCORE_KEYS.filter(k => r.scores[k] && typeof r.scores[k] === 'object').map(k => `<tr><th>${esc(k.replace('_', ' '))}</th><td><span class="bar" style="--w:${Number(r.scores[k].score) * 20}%"></span><b>${esc(r.scores[k].score)}</b></td><td class="why">${esc(r.scores[k].reason)}</td></tr>`).join('')
    : '';
  const claims = e.reviewError
    ? `<p class="warn">review.json could not be read: ${esc(e.reviewError)}</p>`
    : r
    ? (arr(r.claims_outside_brief).length ? `<div class="warn"><b>Claims not in the brief:</b><ul>${list(r.claims_outside_brief)}</ul></div>` : '<p class="ok">No claims outside the brief found.</p>')
    : '<p class="muted">Not reviewed yet: no review.json.</p>';
  const link = e.repo ? `<a href="${esc(e.repo)}">${esc(e.repo.replace('https://github.com/', ''))}</a> @ <code>${esc(String(e.commit).slice(0, 8))}</code>` : 'local tools only';
  const session = e.delegation?.url ? ` · <a href="${esc(e.delegation.url)}">T3 session</a>` : '';
  const qa = m.qa || { verdict: 'not run', lines: [] };
  const minutes = typeof m.minutes_to_final === 'number' ? `${m.minutes_to_final} min` : 'unknown';
  return `
<article class="card" id="${esc(name)}">
  <header><h2>${esc(name)}</h2><span class="kind">${esc(e.kind)}</span></header>
  <video controls preload="metadata" playsinline src="videos/${esc(name)}.mp4" poster="assets/${esc(name)}/poster.png"></video>
  <div class="meta">${link}${session} · <a href="../builds/${esc(name)}/BUILD-LOG.md">build log</a></div>
  <div class="ranks">${pills}</div>
  ${r?.summary ? `<p class="summary">${esc(r.summary)}</p>` : ''}
  <dl class="facts">
    <div><dt>Length</dt><dd>${esc(spec.duration_s)} s</dd></div>
    <div><dt>Spec</dt><dd>${m.spec_pass ? 'pass' : `fail: ${esc((m.spec_fails || []).join('; '))}`}</dd></div>
    <div><dt>Frame</dt><dd>${esc(spec.width)}x${esc(spec.height)} @ ${esc(spec.fps)} fps, ${esc(spec.pix_fmt)}</dd></div>
    <div><dt>Audio</dt><dd>${esc(spec.audio)}</dd></div>
    <div><dt>Loudness</dt><dd>${esc(m.loudness?.text)}</dd></div>
    <div><dt>Time to final</dt><dd>${esc(minutes)}</dd></div>
  </dl>
  ${claims}
  ${scores ? `<table class="scores">${scores}</table>` : ''}
  ${r ? `<div class="cols"><div><h3>Strengths</h3><ul>${list(r.strengths)}</ul></div><div><h3>Weaknesses</h3><ul>${list(r.weaknesses)}</ul></div></div>` : ''}
  <details><summary>Contact sheet</summary><img src="assets/${esc(name)}/sheet.jpg" alt="12 frames from ${esc(name)}"></details>
  <details><summary>Narration transcript</summary><p class="mono">${esc(m.transcript || m.transcript_note || 'No transcript.')}</p></details>
  <details><summary>Shared QA: ${esc(qa.verdict)}</summary><ul>${list(qa.lines)}</ul>${qa.note ? `<p>${esc(qa.note)}</p>` : ''}</details>
  <details><summary>Decisions the agent made in place of a human (${arr(r?.decisions_for_human).length})</summary><ul>${list(r?.decisions_for_human)}</ul></details>
  <details><summary>Build log and spec notes</summary><ul>${list([...(m.spec_notes || []), ...(m.build_log?.missing?.length ? [`BUILD-LOG.md is missing: ${m.build_log.missing.join(', ')}`] : ['BUILD-LOG.md has all 10 sections'])])}</ul></details>
</article>`;
}

function summaryTable(entries, ranks, lenses) {
  const rows = entries.map(e => {
    const m = e.measure, r = ranks[e.name] || {};
    const avg = avgScore(e.review);
    const cells = lenses.map(l => (r[l] ? `<td>#${esc(r[l].rank)} (${esc(r[l].score)})</td>` : '<td>-</td>')).join('');
    return `<tr><th><a href="#${esc(e.name)}">${esc(e.name)}</a></th>${cells}<td>${avg === null ? '-' : avg.toFixed(1)}</td>`
      + `<td>${esc(m.spec?.duration_s)} s</td><td>${m.spec_pass ? 'pass' : 'fail'}</td><td>${esc(m.qa?.verdict || 'not run')}</td>`
      + `<td>${e.review ? arr(e.review.claims_outside_brief).length : '-'}</td><td>${esc(m.loudness?.lufs ?? '-')}</td>`
      + `<td>${typeof m.minutes_to_final === 'number' ? `${m.minutes_to_final} min` : '-'}</td></tr>`;
  }).join('');
  const heads = lenses.map(l => `<th>${esc(l)} judge</th>`).join('');
  return `<table class="summary"><thead><tr><th>Build</th>${heads}<th>Avg score (1-5)</th><th>Length</th><th>Spec</th><th>Shared QA</th><th>Claims outside brief</th><th>LUFS</th><th>Time to final</th></tr></thead><tbody>${rows}</tbody></table>`;
}

const CSS = `
:root{--bg:#fbfaf7;--fg:#1d1d1f;--muted:#6b6b70;--line:#e3e1db;--card:#fff;--accent:#2f5bd3;--warn:#a4400f;--ok:#2d7a3e}
@media (prefers-color-scheme:dark){:root{--bg:#141416;--fg:#ececee;--muted:#9a9aa2;--line:#2b2b30;--card:#1c1c20;--accent:#8aa8ff;--warn:#ff9a6b;--ok:#79d18b}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
main{max-width:1680px;margin:0 auto;padding:32px 24px 80px}
h1{font-size:28px;margin:0 0 6px}h2{font-size:19px;margin:0}h3{font-size:14px;margin:12px 0 4px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
p.lede,.muted{color:var(--muted)}p.lede{margin:0 0 20px;max-width:960px}a{color:var(--accent)}code,.mono{font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace}
.controls{position:sticky;top:0;z-index:5;background:var(--bg);padding:10px 0;border-bottom:1px solid var(--line);margin-bottom:18px;display:flex;gap:8px;flex-wrap:wrap;align-items:center}
button{font:inherit;padding:6px 12px;border:1px solid var(--line);background:var(--card);color:var(--fg);border-radius:6px;cursor:pointer}button:hover{border-color:var(--accent)}
.controls span{color:var(--muted);font-size:13px;margin-left:6px}
table.summary{border-collapse:collapse;width:100%;margin:8px 0 28px;font-size:14px}table.summary th,table.summary td{border-bottom:1px solid var(--line);padding:6px 8px;text-align:left}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(520px,1fr));gap:20px}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px}
.card header{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:10px}.kind{color:var(--muted);font-size:13px;text-align:right}
video{width:100%;background:#000;border-radius:6px;display:block}
.meta{font-size:13px;color:var(--muted);margin:8px 0}.ranks{margin:4px 0 8px}.pill{display:inline-block;font-size:12px;border:1px solid var(--line);border-radius:999px;padding:1px 8px;margin-right:4px}
dl.facts{display:grid;grid-template-columns:repeat(3,1fr);gap:6px 12px;margin:8px 0}dl.facts dt{font-size:11px;color:var(--muted);text-transform:uppercase}dl.facts dd{margin:0;font-size:13px}
table.scores{width:100%;border-collapse:collapse;font-size:13px;margin:8px 0}table.scores th{text-align:left;font-weight:500;width:110px;text-transform:capitalize}
table.scores td{padding:3px 4px;vertical-align:top}table.scores td:nth-child(2){width:90px;white-space:nowrap}
.bar{display:inline-block;width:50px;height:6px;background:var(--line);border-radius:3px;margin-right:6px;position:relative;vertical-align:middle}
.bar::after{content:"";position:absolute;inset:0;width:var(--w);background:var(--accent);border-radius:3px}.why{color:var(--muted)}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:12px}ul{margin:4px 0;padding-left:18px}li{margin:2px 0}
details{border-top:1px solid var(--line);padding:6px 0}summary{cursor:pointer;font-size:14px}details img{width:100%;margin-top:8px;border-radius:4px}
.warn{color:var(--warn);font-size:13px}.ok{color:var(--ok);font-size:13px;margin:4px 0}
section.notes,section.missing{margin:28px 0;max-width:1100px}
`;

const JS = `
const vids=()=>[...document.querySelectorAll('video')];
function playAll(){vids().forEach(v=>{v.muted=true;v.currentTime=0;v.play()})}
function pauseAll(){vids().forEach(v=>v.pause())}
document.addEventListener('volumechange',e=>{if(e.target.tagName!=='VIDEO'||e.target.muted)return;vids().forEach(v=>{if(v!==e.target)v.muted=true})},true);
`;

// The comparison page. entries: [{name, kind, repo, commit, measure, review, delegation, state}] in lineup order.
// Video and image paths are relative to site/, so the page works from file:// with no server.
export function siteHtml({ title, format, entries, judges = [], notes = '' }) {
  const ranks = judgeRanks(judges);
  const lenses = [...new Set(arr(judges).map(j => String(j?.lens || 'Judge').split(':')[0].trim() || 'Judge'))];
  const built = entries.filter(e => e.measure?.ok);
  const missing = entries.filter(e => !e.measure?.ok);
  const missingHtml = missing.length
    ? `<section class="missing"><h2>No measured video</h2><ul>${missing.map(e => `<li><b>${esc(e.name)}</b>: ${esc(e.state || 'not run')}${e.delegation?.url ? ` (<a href="${esc(e.delegation.url)}">T3 session</a>)` : ''}</li>`).join('')}</ul></section>`
    : '';
  const judgeNotes = arr(judges).map(j => `<p><b>${esc(String(j?.lens || 'Judge').split(':')[0])} judge:</b> ${esc(j?.notes)}</p>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Video lineup: ${esc(title)}</title><style>${CSS}</style></head><body><main>
<h1>Video lineup: ${esc(title)}</h1>
<p class="lede">One brief (<a href="../brief/BRIEF.md">BRIEF.md</a>, ${esc(format.width)}x${esc(format.height)}, ${esc(format.minSeconds)} to ${esc(format.maxSeconds)} s), built by ${entries.length} builders, each in its own agent session with no human present.
Measurements come from ffprobe, ffmpeg and video-director's qa_video.py. Reviews and judges saw frames, transcripts and numbers, not the moving video: watch and listen before you choose.
Open this page from file:// in Chrome or Safari; some embedded file viewers do not load local videos.</p>
<div class="controls"><button onclick="playAll()">Play all from start (muted)</button><button onclick="pauseAll()">Pause all</button><span>Unmute one video to hear it; the others mute.</span></div>
${built.length ? summaryTable(built, ranks, lenses) : '<p>No measured videos yet. Run <code>lineup.mjs measure</code>.</p>'}
${notes}
<div class="grid">${built.map(e => card(e, ranks[e.name] || {})).join('')}</div>
${missingHtml}
${judgeNotes ? `<section class="notes"><h2>Judge notes</h2>${judgeNotes}</section>` : ''}
</main><script>${JS}</script></body></html>
`;
}
