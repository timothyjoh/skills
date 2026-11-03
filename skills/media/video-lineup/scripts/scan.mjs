// Static checks for a builder repo before a lineup uses it: prompt-injection patterns in the files an agent
// reads, dangerous patterns in code, and a staleness check. Pure functions: callers pass file contents in,
// so tests can call them directly. A "block" finding eliminates the builder unless builders.json allows it
// (scanAllow); a "warn" finding goes to the reviewing agent, which decides.

// Files an agent loads as instructions, and files that run.
export const PROMPT_FILE = /\.(md|mdx|markdown|txt|prompt|ya?ml|toml)$/i;
export const CODE_FILE = /\.(m?js|cjs|ts|mts|cts|tsx|jsx|py|sh|bash|zsh|fish|rb|go|rs|ps1|bat|cmd|php|pl|lua)$/i;
const SKIP_FILE = /(^|\/)(package-lock\.json|npm-shrinkwrap\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb?|uv\.lock|poetry\.lock|Cargo\.lock)$/;
export const MAX_SCAN_BYTES = 2 * 1024 * 1024;

// level: block | warn. scope: prompt | code | any (any = prompt and code files, plus files with no known extension).
export const RULES = [
  { id: 'override-instructions', level: 'block', scope: 'prompt', why: 'tells the agent to drop its instructions',
    re: /\b(ignore|disregard|forget|override|bypass)\b[^.\n]{0,40}\b(previous|prior|above|earlier|all|any|system|developer|user'?s?|safety)\b[^.\n]{0,25}\b(instructions?|prompts?|rules|guidelines|messages?|polic(y|ies))\b/i },
  { id: 'conceal-from-user', level: 'block', scope: 'prompt', why: 'tells the agent to hide something from the human',
    re: /\b(do not|don't|never|without)\s+(tell(ing)?|inform(ing)?|mention(ing)?|reveal(ing)?|show(ing)?|disclos(e|ing)|notify(ing)?|ask(ing)?)\b[^.\n]{0,25}\b(the\s+)?(user|human|operator|owner)\b[^.\n]{0,40}\b(about|that|this|what|secret|key|token|file|command|upload|send)/i },
  { id: 'role-hijack', level: 'warn', scope: 'prompt', why: 'tries to replace the agent role or system prompt',
    re: /\byou are now\b|\bnew system prompt\b|\b(jailbreak|jailbroken|developer mode enabled|DAN mode)\b|<\/?(system|im_start|im_end)>|\[\/?INST\]/i },
  { id: 'secret-paths', level: 'block', scope: 'any', why: 'reads credential files or the keychain',
    re: /(~|\$HOME|\$\{HOME\}|os\.homedir\(\)[^\n]{0,20}|\/Users\/[^/\s'"]+|\/home\/[^/\s'"]+)\/?['"]?\s*,?\s*['"]?\.(ssh|aws|gnupg|netrc|npmrc|pypirc|docker\/config\.json|kube\/config|config\/gh\/hosts)|\bid_(rsa|ed25519|ecdsa)\b|\.git-credentials\b|login\.keychain|\bsecurity\s+(find|dump)-(generic-password|internet-password|keychain)/i },
  { id: 'pipe-to-shell', level: 'block', scope: 'any', why: 'downloads a script and runs it unseen',
    re: /\b(curl|wget|iwr|Invoke-WebRequest)\b[^|\n]{0,200}\|\s*(sudo\s+)?(ba|z|da|k)?sh\b|\b(curl|wget)\b[^|\n]{0,200}\|\s*(sudo\s+)?(python3?|node|perl|ruby)\b|\biex\s*\(?\s*(New-Object|iwr|Invoke-WebRequest|irm)/i },
  { id: 'exfil-endpoint', level: 'block', scope: 'any', why: 'names a service used to receive stolen data',
    re: /(webhook\.site|requestbin|pipedream\.net|\.ngrok(-free)?\.(io|app|dev)|burpcollaborator|interact\.sh|\boast\.(pro|fun|live|me|site|online)\b|pastebin\.com\/raw|\btransfer\.sh\b|discord(app)?\.com\/api\/webhooks|api\.telegram\.org\/bot|hooks\.slack\.com\/services)/i },
  { id: 'encoded-exec', level: 'block', scope: 'code', why: 'decodes hidden code and runs it',
    re: /\b(eval|exec|execSync|Function|compile)\s*\(\s*(atob|Buffer\.from|base64\.b64decode|codecs\.decode|bytes\.fromhex|unescape|zlib\.decompress|marshal\.loads)\b|base64\s+(-d|-D|--decode)\b[^\n]{0,60}\|\s*(ba|z)?sh\b/i },
  { id: 'env-dump', level: 'warn', scope: 'code', why: 'sends or prints the whole environment, which holds secrets',
    re: /JSON\.stringify\(\s*process\.env\s*\)|dict\(\s*os\.environ\s*\)|os\.environ\.copy\(\)[^\n]{0,80}\b(post|request|send|upload)|\bprintenv\b[^\n]{0,40}\|/i },
  { id: 'destructive', level: 'block', scope: 'any', why: 'deletes the home folder, the disk root or a device',
    re: /\brm\s+(-[a-zA-Z]*\s+)*-[a-zA-Z]*[rR][a-zA-Z]*\s+(-[a-zA-Z]+\s+)*(~\/?|\$HOME\/?|\/|\/\*)(\s|$|["';)])|\bmkfs(\.\w+)?\s|\bdd\s+[^\n]*\bof=\/dev\/(disk|sd|nvme|rdisk)/i },
  { id: 'persistence', level: 'warn', scope: 'any', why: 'installs something that runs later without the user',
    re: /\bcrontab\s+-|LaunchAgents\/|LaunchDaemons\/|\blaunchctl\s+(load|bootstrap)\b|>>\s*~?\/?\S*\.(bashrc|zshrc|bash_profile|zprofile|profile|zshenv)\b|systemctl\s+(--user\s+)?enable\b/i },
  { id: 'agent-config', level: 'warn', scope: 'any', why: 'touches agent settings, hooks or permission bypasses',
    re: /\.claude\/settings(\.local)?\.json|\.codex\/config\.toml|\.cursor\/mcp\.json|--dangerously-skip-permissions|dangerouslyDisableSandbox|--dangerously-bypass-approvals|bypassPermissions/i },
  { id: 'miner', level: 'block', scope: 'any', why: 'names a cryptocurrency miner',
    re: /\b(xmrig|stratum\+tcp|coinhive|cryptonight|minexmr)\b/i },
  { id: 'raw-ip-url', level: 'warn', scope: 'any', why: 'calls a bare IP address instead of a named host',
    re: /\bhttps?:\/\/(?!(127\.0\.0\.1|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.))(\d{1,3}\.){3}\d{1,3}\b/ },
];

// Zero-width and bidirectional control characters hide text from a human reader; Unicode tag characters
// carry invisible instructions. A byte-order mark at the very start of a file is harmless.
// Emoji use two of these legitimately: a zero-width joiner before a pictograph (a swimmer with a gender sign)
// and tag characters after the black flag (subdivision flags), so those are left alone.
const HIDDEN_CHARS = /[​‌‎‏‪-‮⁠-⁤⁦-⁩]|‍(?![\p{Extended_Pictographic}♀♂⚕⚖✈❤])|(?<!\u{1F3F4}[\u{E0020}-\u{E007F}]*)[\u{E0000}-\u{E007F}]|(?<!^)﻿/u;
// Well-known vendor installers: piping these to a shell is common advice, so it is a warn, not a block.
const KNOWN_INSTALLERS = /\b(astral\.sh\/uv|bun\.sh\/install|sh\.rustup\.rs|deno\.land\/install|get\.pnpm\.io|raw\.githubusercontent\.com\/Homebrew\/install|raw\.githubusercontent\.com\/nvm-sh\/nvm)\b/i;
// In code, a match on a comment line or inside a message printed to the user does not run.
const INERT_CODE_LINE = /^\s*(#|\/\/|\*|--|rem\b)|\b(echo|printf|print|console\.(log|error|warn|info)|logger\.\w+|log\.\w+|warn|die|throw new \w*Error)\s*\(?\s*[`'"f]/i;
const HTML_COMMENT = /<!--([\s\S]*?)-->/g;
const IMPERATIVE = /\b(you|agent|assistant|claude|codex|model|llm|ai)\b[\s\S]{0,80}\b(must|should|always|never|ignore|run|execute|send|upload|read)\b/i;
const BASE64_BLOB = /(?<![A-Za-z0-9+/])[A-Za-z0-9+/]{240,}={0,2}(?![A-Za-z0-9+/])/;
const LIFECYCLE = ['preinstall', 'install', 'postinstall', 'prepare', 'prepublish', 'preprepare', 'postprepare'];

const snippet = (s, i, n = 160) => s.slice(Math.max(0, i - 40), i + n).replace(/\s+/g, ' ').trim();
const lineAt = (s, i) => s.slice(0, i).split('\n').length;

function kindOf(file) {
  if (PROMPT_FILE.test(file)) return 'prompt';
  if (CODE_FILE.test(file)) return 'code';
  return 'other';
}

// files: [{ path, text }] for text files. Returns findings: { rule, level, file, line, why, text }.
export function scanFiles(files) {
  const out = [];
  for (const f of files) {
    if (SKIP_FILE.test(f.path) || typeof f.text !== 'string') continue;
    const kind = kindOf(f.path);
    const text = f.text;
    for (const rule of RULES) {
      if (rule.scope === 'prompt' && kind !== 'prompt') continue;
      if (rule.scope === 'code' && kind !== 'code') continue;
      const g = new RegExp(rule.re.source, rule.re.flags.includes('g') ? rule.re.flags : `${rule.re.flags}g`);
      let m, hits = 0;
      while ((m = g.exec(text)) && hits < 5) {
        if (m[0].length === 0) g.lastIndex += 1;
        const before = text.slice(text.lastIndexOf('\n', m.index) + 1, m.index);
        if (kind === 'code' && INERT_CODE_LINE.test(before)) continue;
        const level = rule.id === 'pipe-to-shell' && KNOWN_INSTALLERS.test(m[0]) ? 'warn' : rule.level;
        out.push({ rule: rule.id, level, file: f.path, line: lineAt(text, m.index), why: rule.why, text: snippet(text, m.index) });
        hits += 1;
      }
    }
    const hidden = text.match(HIDDEN_CHARS);
    if (hidden) {
      const code = hidden[0].codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
      out.push({ rule: 'hidden-characters', level: kind === 'prompt' ? 'block' : 'warn', file: f.path, line: lineAt(text, hidden.index),
        why: `invisible character U+${code} can hide text from a human reader`, text: snippet(text, hidden.index) });
    }
    if (kind === 'prompt') {
      for (const m of text.matchAll(HTML_COMMENT)) {
        if (IMPERATIVE.test(m[1])) out.push({ rule: 'hidden-instruction', level: 'warn', file: f.path, line: lineAt(text, m.index), why: 'an HTML comment, invisible when rendered, speaks to the agent', text: snippet(text, m.index, 240) });
      }
      const b = text.match(BASE64_BLOB);
      if (b) out.push({ rule: 'encoded-blob', level: 'warn', file: f.path, line: lineAt(text, b.index), why: 'a long encoded string in an instruction file', text: `${b[0].slice(0, 60)}...` });
    }
    if (/(^|\/)package\.json$/.test(f.path)) {
      let pkg = null;
      try { pkg = JSON.parse(text); } catch { /* not our problem here */ }
      for (const k of LIFECYCLE) {
        const cmd = pkg?.scripts?.[k];
        if (cmd) out.push({ rule: 'install-script', level: 'warn', file: f.path, line: lineAt(text, text.indexOf(`"${k}"`)), why: `npm runs the "${k}" script on install`, text: `${k}: ${cmd}`.slice(0, 200) });
      }
    }
  }
  return out;
}

// entries: [{ path, type: 'file' | 'symlink' | 'submodule', target?, magic? }] from the tree.
// magic is the first 4 bytes, hex. Flags links that leave the repo, submodules and native executables.
export function scanTree(entries) {
  const out = [];
  const EXEC_MAGIC = { '7f454c46': 'ELF executable', cffaedfe: 'Mach-O executable', feedfacf: 'Mach-O executable', cafebabe: 'Mach-O universal binary', '4d5a': 'Windows executable' };
  for (const e of entries) {
    if (e.type === 'symlink') {
      const t = String(e.target || '');
      const depth = e.path.split('/').length - 1;
      let up = 0, escapes = t.startsWith('/') || t.startsWith('~');
      for (const part of t.split('/')) { if (part === '..') { up += 1; if (up > depth) escapes = true; } else if (part && part !== '.') up = Math.max(0, up - 1); }
      if (escapes) out.push({ rule: 'symlink-escape', level: 'block', file: e.path, line: 0, why: 'a link points outside the repo, so an agent following it reads or writes elsewhere', text: `-> ${t}` });
    } else if (e.type === 'submodule') {
      out.push({ rule: 'submodule', level: 'warn', file: e.path, line: 0, why: 'a submodule pulls code from another repo that this scan does not see', text: e.target || '' });
    } else if (e.magic) {
      const kind = EXEC_MAGIC[e.magic] || EXEC_MAGIC[e.magic.slice(0, 4)];
      if (kind) out.push({ rule: 'native-binary', level: 'block', file: e.path, line: 0, why: `a prebuilt ${kind} cannot be reviewed`, text: kind });
    }
  }
  return out;
}

// Drop findings that builders.json allows: [{ rule, file, reason }]. A reason is required, so every
// exception says why a human accepted it.
export function applyAllow(findings, allow = []) {
  const ok = allow.filter(a => a?.rule && a?.file && a?.reason);
  return findings.map(f => (ok.some(a => a.rule === f.rule && a.file === f.file) ? { ...f, allowed: ok.find(a => a.rule === f.rule && a.file === f.file).reason } : f));
}

// npm audit --json metadata.vulnerabilities, or a pip-audit JSON result, as counts.
export function npmAuditCounts(json) {
  const v = json?.metadata?.vulnerabilities || {};
  return { critical: v.critical || 0, high: v.high || 0, moderate: v.moderate || 0, low: v.low || 0, info: v.info || 0 };
}

export function pipAuditVulns(json) {
  const deps = Array.isArray(json) ? json : json?.dependencies || [];
  return deps.flatMap(d => (d.vulns || []).map(v => ({ package: d.name, version: d.version, id: v.id, fix: (v.fix_versions || []).join(', ') || null })));
}

const LEVELS = ['low', 'moderate', 'high', 'critical'];
export function auditBlocks(counts, level = 'high') {
  const from = LEVELS.indexOf(level);
  return LEVELS.slice(from < 0 ? 2 : from).reduce((n, k) => n + (counts[k] || 0), 0) > 0;
}

// Decide a builder's upstream status from the facts gathered about it.
// facts: { error, archived, ageDays, findings, audit: [{ blocks }], vetted: { commit, verdict } , commit }
export function decide(facts, { maxAgeDays = 180 } = {}) {
  const reasons = [];
  if (facts.error) reasons.push(`fetch failed: ${facts.error}`);
  if (facts.archived) reasons.push('the upstream repo is archived');
  if (typeof facts.ageDays === 'number' && facts.ageDays > maxAgeDays) reasons.push(`last upstream commit is ${facts.ageDays} days old (limit ${maxAgeDays})`);
  const blocks = (facts.findings || []).filter(f => f.level === 'block' && !f.allowed);
  if (blocks.length) reasons.push(`${blocks.length} blocking scan finding${blocks.length > 1 ? 's' : ''}: ${[...new Set(blocks.map(b => `${b.rule} in ${b.file}`))].slice(0, 4).join('; ')}`);
  for (const a of facts.audit || []) if (a.blocks) reasons.push(`dependency audit (${a.cwd}): ${a.summary}`);
  if (facts.vetted?.commit === facts.commit && facts.vetted?.verdict === 'block') reasons.push(`blocked by review: ${facts.vetted.notes || 'no notes'}`);
  if (reasons.length) return { status: 'eliminated', reasons };
  if (facts.vetted?.commit === facts.commit && facts.vetted?.verdict === 'clean') return { status: 'ok', reasons: [] };
  return { status: 'review', reasons: [facts.vetted?.commit ? `new commits since the last review (${String(facts.vetted.commit).slice(0, 8)})` : 'never reviewed'] };
}
