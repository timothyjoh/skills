#!/usr/bin/env node
// Change brief: pin a commit range, check a brief against it, render it to HTML.
//
//   brief.mjs init   --repo <path> --base <ref> --head <ref> --out <dir> [--pr <url>] [--min-block <n>]
//   brief.mjs check  <dir> [--only groups|pseudocode|doc]
//   brief.mjs render <dir> [--force] [--target github]
//
// Node 24 standard library only. The HTML page loads marked, mermaid and
// highlight.js from jsDelivr.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const GROUP_KINDS = [
  "implementation",
  "tests",
  "docs",
  "config",
  "generated",
  "fixtures",
  "renames",
  "formatting",
  "other",
];
const PEEK_MAX_LINES = 60;
const LOCKFILE = /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|Cargo\.lock|poetry\.lock|uv\.lock|Gemfile\.lock|composer\.lock|go\.sum|packages\.lock\.json)$/;
const REF = /^(head|base):([^#\s]+?)(?:#L(\d+)(?:-L?(\d+))?)?$/;
const LINK = /\]\(((?:head|base):[^)\s]+)\)/g;

// ---------- small helpers ----------

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(2);
}

function git(repo, args, options = {}) {
  return execFileSync("git", ["-C", repo, "-c", "core.quotePath=false", ...args], {
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
    stdio: ["ignore", "pipe", options.quiet ? "ignore" : "pipe"],
  });
}

function tryGit(repo, args) {
  try {
    return git(repo, args, { quiet: true });
  } catch {
    return null;
  }
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function parseFlags(argv) {
  const flags = { _: [] };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];

      if (next === undefined || next.startsWith("--")) flags[key] = true;
      else {
        flags[key] = next;
        i++;
      }
    } else flags._.push(arg);
  }

  return flags;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function short(sha) {
  return sha.slice(0, 12);
}

function lineCount(text) {
  if (text === "") return 0;

  return text.endsWith("\n") ? text.split("\n").length - 1 : text.split("\n").length;
}

// ---------- diff model ----------

/** Parses `git diff -U0` into added head lines and deleted base lines per file. */
function parseHunks(patch) {
  const files = new Map();
  let current = null;

  for (const line of patch.split("\n")) {
    if (line.startsWith("diff --git ")) {
      current = { oldPath: null, newPath: null, added: new Set(), deleted: new Set() };
      continue;
    }

    if (!current) continue;

    if (line.startsWith("--- ")) {
      // Git ends the path with a tab when it contains a space.
      const p = line.slice(4).replace(/\t$/, "");
      current.oldPath = p === "/dev/null" ? null : p.replace(/^a\//, "");
    } else if (line.startsWith("+++ ")) {
      const p = line.slice(4).replace(/\t$/, "");
      current.newPath = p === "/dev/null" ? null : p.replace(/^b\//, "");
      files.set(current.newPath ?? current.oldPath, current);
    } else if (line.startsWith("@@")) {
      const m = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line);

      if (!m) continue;

      const [oldStart, oldLen, newStart, newLen] = [
        Number(m[1]),
        m[2] === undefined ? 1 : Number(m[2]),
        Number(m[3]),
        m[4] === undefined ? 1 : Number(m[4]),
      ];

      for (let n = 0; n < oldLen; n++) current.deleted.add(oldStart + n);
      for (let n = 0; n < newLen; n++) current.added.add(newStart + n);
    }
  }

  return files;
}

/** Contiguous runs of added lines, used to find large new blocks. */
function addedRuns(added) {
  const sorted = [...added].sort((a, b) => a - b);
  const runs = [];

  for (const n of sorted) {
    const last = runs.at(-1);

    if (last && n === last.to + 1) last.to = n;
    else runs.push({ from: n, to: n });
  }

  return runs;
}

class Workspace {
  constructor(dir) {
    this.dir = path.resolve(dir);
    const metaFile = path.join(this.dir, "meta.json");

    if (!existsSync(metaFile)) fail(`${metaFile} not found; run init first`);

    this.meta = readJson(metaFile);
    this.changes = readJson(path.join(this.dir, "changes.json"));
    this.contents = new Map();
    this.hunks = parseHunks(
      git(this.meta.repo, ["diff", "-U0", "-M", "--no-color", this.meta.base, this.meta.head]),
    );
    this.hunksByBase = new Map();

    for (const h of this.hunks.values()) if (h.oldPath) this.hunksByBase.set(h.oldPath, h);
  }

  sha(side) {
    return side === "head" ? this.meta.head : this.meta.base;
  }

  file(side, file) {
    const key = `${side}:${file}`;

    if (!this.contents.has(key)) {
      this.contents.set(key, tryGit(this.meta.repo, ["show", `${this.sha(side)}:${file}`]));
    }

    return this.contents.get(key);
  }

  /** Parses and checks a `head:path#La-Lb` reference; returns {ref, error}. */
  resolve(text, { needRange = false } = {}) {
    const m = REF.exec(text.trim());

    if (!m) return { error: `malformed reference "${text}" (want head:path#L10-L24)` };

    const [, side, encoded, fromText, toText] = m;
    let file;

    try {
      file = decodeURIComponent(encoded);
    } catch {
      return { error: `${text}: bad %-encoding in path` };
    }

    const ref = { side, file, from: fromText ? Number(fromText) : null, to: null, text: text.trim() };
    ref.to = toText ? Number(toText) : ref.from;
    const content = this.file(side, file);

    if (content === null) return { ref, error: `${text}: ${file} does not exist at ${side} (${short(this.sha(side))})` };

    if (needRange && ref.from === null) return { ref, error: `${text}: needs a line range` };

    if (ref.from !== null) {
      const total = lineCount(content);

      if (ref.from < 1 || ref.to < ref.from) return { ref, error: `${text}: invalid line range` };

      if (ref.to > total) return { ref, error: `${text}: range ends past the file (${total} lines at ${side})` };
    }

    ref.content = content;

    return { ref };
  }

  /** True when the reference range touches lines the change added (head) or deleted (base). */
  touchesChange(ref) {
    const h = ref.side === "head" ? this.hunks.get(ref.file) : this.hunksByBase.get(ref.file);

    if (!h) return false;

    const set = ref.side === "head" ? h.added : h.deleted;

    for (let n = ref.from; n <= ref.to; n++) if (set.has(n)) return true;

    return false;
  }

  url(ref) {
    const { github, repo, pr } = this.meta;
    const sha = this.sha(ref.side);

    if (github) {
      const lines = ref.from === null ? "" : ref.from === ref.to ? `#L${ref.from}` : `#L${ref.from}-L${ref.to}`;

      return `https://github.com/${github.owner}/${github.repo}/blob/${sha}/${ref.file.split("/").map(encodeURIComponent).join("/")}${lines}`;
    }

    void pr;

    return `vscode://file/${encodeURI(path.join(repo, ref.file))}${ref.from ? `:${ref.from}` : ""}`;
  }

  /** Link for a changed file: the PR's diff view when there is a PR, else the file at its side. */
  fileUrl(change) {
    if (this.meta.pr && this.meta.github) {
      const hash = createHash("sha256").update(change.path).digest("hex");

      return `${this.meta.pr}/files#diff-${hash}`;
    }

    const side = change.status === "D" ? "base" : "head";

    return this.url({ side, file: side === "base" ? change.oldPath ?? change.path : change.path, from: null, to: null });
  }
}

// ---------- init ----------

function parseGithub(url) {
  const m = /github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(url ?? "");

  return m ? { owner: m[1], repo: m[2] } : null;
}

function init(flags) {
  for (const key of ["repo", "base", "head", "out"]) if (!flags[key] || flags[key] === true) fail(`--${key} is required`);

  const repo = git(path.resolve(flags.repo), ["rev-parse", "--show-toplevel"]).trim();
  const head = git(repo, ["rev-parse", `${flags.head}^{commit}`]).trim();
  const baseTip = git(repo, ["rev-parse", `${flags.base}^{commit}`]).trim();
  const base = git(repo, ["merge-base", baseTip, head]).trim();
  const github = parseGithub(tryGit(repo, ["remote", "get-url", "origin"])?.trim());
  const pr = flags.pr && flags.pr !== true ? String(flags.pr) : null;
  const onRemote = Boolean(tryGit(repo, ["branch", "-r", "--contains", head])?.trim());
  const links = github && (pr || onRemote) ? "github" : "local";

  const numstat = git(repo, ["diff", "--numstat", "-z", "-M", base, head]).split("\0");
  const counts = new Map();

  for (let i = 0; i < numstat.length; i++) {
    const entry = numstat[i];

    if (!entry) continue;

    const [a, d, p] = entry.split("\t");
    let file = p;

    // Renames print an empty path, then old and new paths as separate fields.
    if (p === "") {
      file = numstat[i + 2];
      i += 2;
    }

    counts.set(file, { added: a === "-" ? null : Number(a), deleted: d === "-" ? null : Number(d) });
  }

  const nameStatus = git(repo, ["diff", "--name-status", "-z", "-M", base, head]).split("\0");
  const files = [];

  for (let i = 0; i < nameStatus.length; i++) {
    const status = nameStatus[i];

    if (!status) continue;

    if (status.startsWith("R") || status.startsWith("C")) {
      const oldPath = nameStatus[i + 1];
      const newPath = nameStatus[i + 2];
      i += 2;
      files.push({ path: newPath, oldPath, status: status[0], ...counts.get(newPath) });
    } else {
      const file = nameStatus[i + 1];
      i += 1;
      files.push({ path: file, status: status[0], ...counts.get(file) });
    }
  }

  const minBlock = Number(flags["min-block"] ?? 25);
  const hunks = parseHunks(git(repo, ["diff", "-U0", "-M", "--no-color", base, head]));
  const candidates = [];

  for (const [file, h] of hunks) {
    if (!h.newPath || LOCKFILE.test(file)) continue;

    for (const run of addedRuns(h.added)) {
      if (run.to - run.from + 1 >= minBlock) candidates.push(`head:${file}#L${run.from}-L${run.to}`);
    }
  }

  const out = path.resolve(flags.out);
  mkdirSync(out, { recursive: true });

  const meta = {
    repo,
    repoName: github ? `${github.owner}/${github.repo}` : path.basename(repo),
    baseRef: flags.base,
    headRef: flags.head,
    base,
    head,
    pr,
    github,
    links,
    created: new Date().toISOString(),
  };

  writeFileSync(path.join(out, "meta.json"), `${JSON.stringify(meta, null, 2)}\n`);
  writeFileSync(path.join(out, "changes.json"), `${JSON.stringify({ files, pseudocodeCandidates: candidates }, null, 2)}\n`);

  const added = files.reduce((sum, f) => sum + (f.added ?? 0), 0);
  const deleted = files.reduce((sum, f) => sum + (f.deleted ?? 0), 0);

  console.log(`brief dir: ${out}`);
  console.log(`repo:      ${meta.repoName} (${repo})`);
  console.log(`base:      ${short(base)} (merge-base of ${flags.base} and head)`);
  console.log(`head:      ${short(head)} (${flags.head})`);
  console.log(`links:     ${links}${links === "local" ? " (head is not on a GitHub remote; links open the working copy in VS Code)" : ""}`);
  console.log(`files:     ${files.length} changed, +${added} -${deleted}`);
  console.log("");

  for (const f of files) {
    const stat = f.added === null ? "binary" : `+${f.added} -${f.deleted}`;
    console.log(`  ${f.status} ${f.oldPath ? `${f.oldPath} -> ` : ""}${f.path}  ${stat}`);
  }

  console.log("");
  console.log(`pseudocode candidates (added runs >= ${minBlock} lines): ${candidates.length}`);

  for (const c of candidates) console.log(`  ${c}`);
}

// ---------- check ----------

function changedPaths(ws) {
  return ws.changes.files.map((f) => f.path);
}

function checkGroups(ws, errors) {
  const file = path.join(ws.dir, "groups.json");

  if (!existsSync(file)) {
    errors.push("groups.json is missing");
    return null;
  }

  let data;

  try {
    data = readJson(file);
  } catch (error) {
    errors.push(`groups.json is not valid JSON: ${error.message}`);
    return null;
  }

  if (!Array.isArray(data.groups) || data.groups.length === 0) {
    errors.push('groups.json needs a non-empty "groups" array');
    return null;
  }

  const expected = new Set(changedPaths(ws));
  const seen = new Map();

  data.groups.forEach((g, i) => {
    const where = `groups[${i}]${g.title ? ` "${g.title}"` : ""}`;

    if (!g.title) errors.push(`${where}: missing title`);

    if (!GROUP_KINDS.includes(g.kind)) errors.push(`${where}: kind must be one of ${GROUP_KINDS.join(", ")}`);

    if (!g.summary) errors.push(`${where}: missing summary`);
    else checkLinks(ws, g.summary, where, errors);

    if (!Array.isArray(g.files) || g.files.length === 0) errors.push(`${where}: needs at least one file`);

    for (const f of g.files ?? []) {
      if (!expected.has(f)) errors.push(`${where}: "${f}" is not a changed file (use the head path; deleted files use their base path)`);
      else if (seen.has(f)) errors.push(`${where}: "${f}" is already in ${seen.get(f)}`);
      else seen.set(f, where);
    }
  });

  const missing = [...expected].filter((f) => !seen.has(f));

  if (missing.length) errors.push(`uncategorized files (${missing.length}): ${missing.join(", ")}`);

  return data;
}

function checkPseudocode(ws, errors) {
  const file = path.join(ws.dir, "pseudocode.json");

  if (!existsSync(file)) return null;

  let data;

  try {
    data = readJson(file);
  } catch (error) {
    errors.push(`pseudocode.json is not valid JSON: ${error.message}`);
    return null;
  }

  if (!Array.isArray(data.items)) {
    errors.push('pseudocode.json needs an "items" array');
    return null;
  }

  data.items.forEach((item, i) => {
    const where = `pseudocode.items[${i}]`;

    if (!item.name) errors.push(`${where}: missing name`);

    if (!item.pseudocode) errors.push(`${where}: missing pseudocode`);

    const { ref, error } = ws.resolve(item.ref ?? "", { needRange: true });

    if (error) return errors.push(`${where}: ${error}`);

    if (ref.side !== "head") errors.push(`${where}: pseudocode summarizes new code, so its ref must be head:`);
    else if (!ws.touchesChange(ref)) errors.push(`${where}: ${item.ref} contains no added lines`);

    const limit = Math.max(4, Math.ceil((ref.to - ref.from + 1) / 3));
    const lines = lineCount(String(item.pseudocode ?? "").trimEnd());

    if (lines > limit) errors.push(`${where}: ${lines} pseudocode lines for ${ref.to - ref.from + 1} source lines; keep it to ${limit} or fewer`);

    const long = String(item.pseudocode ?? "").split("\n").filter((l) => l.length > 100).length;

    if (long) errors.push(`${where}: ${long} line(s) over 100 characters; split or shorten them`);
  });

  return data;
}

function checkLinks(ws, markdown, where, errors) {
  for (const m of markdown.matchAll(/\]\(((?:head|base):[^)]*\s[^)]*)\)/g)) {
    errors.push(`${where}: "${m[1]}" has a space; write spaces in paths as %20`);
  }

  for (const m of markdown.matchAll(LINK)) {
    const { error } = ws.resolve(m[1]);

    if (error) errors.push(`${where}: ${error}`);
  }
}

/** Splits doc.md into markdown text and fenced blocks. */
function parseDoc(text) {
  const parts = [];
  const lines = text.split("\n");
  let buffer = [];
  let fence = null;

  lines.forEach((line, i) => {
    if (fence) {
      if (/^```\s*$/.test(line)) {
        parts.push({ type: "fence", lang: fence.lang, body: fence.body, line: fence.line });
        fence = null;
      } else fence.body.push(line);

      return;
    }

    const open = /^```(\w[\w-]*)?\s*$/.exec(line);

    if (open) {
      parts.push({ type: "md", text: buffer.join("\n") });
      buffer = [];
      fence = { lang: open[1] ?? "", body: [], line: i + 1 };
    } else buffer.push(line);
  });

  if (fence) parts.push({ type: "fence", lang: fence.lang, body: fence.body, line: fence.line, unclosed: true });

  parts.push({ type: "md", text: buffer.join("\n") });

  return parts;
}

const CALL_LINE = /^(\s*)([+\-~=])\s+(.+?)\s+((?:head|base):\S+)\s*$/;

function checkDoc(ws, errors) {
  const file = path.join(ws.dir, "doc.md");

  if (!existsSync(file)) {
    errors.push("doc.md is missing");
    return null;
  }

  const text = readFileSync(file, "utf8");

  if (!/^# \S/m.test(text)) errors.push("doc.md: needs a '# Title' line");

  const parts = parseDoc(text);

  for (const part of parts) {
    if (part.type === "md") {
      checkLinks(ws, part.text, "doc.md", errors);
      continue;
    }

    const where = `doc.md line ${part.line} (${part.lang || "code"} block)`;

    if (part.unclosed) errors.push(`${where}: fence is not closed`);

    if (part.lang === "peek") {
      const refs = part.body.filter((l) => l.trim());

      if (!refs.length) errors.push(`${where}: empty peek`);

      for (const r of refs) {
        const { ref, error } = ws.resolve(r, { needRange: true });

        if (error) {
          errors.push(`${where}: ${error}`);
          continue;
        }

        const size = ref.to - ref.from + 1;

        if (size > PEEK_MAX_LINES) errors.push(`${where}: ${r} is ${size} lines; peek at most ${PEEK_MAX_LINES} and link the rest`);

        const slice = ref.content.split("\n").slice(ref.from - 1, ref.to);

        if (slice.every((l) => !l.trim())) errors.push(`${where}: ${r} shows only blank lines`);
      }
    } else if (part.lang === "callstack") {
      part.body.forEach((line, k) => {
        if (!line.trim()) return;

        const m = CALL_LINE.exec(line);
        const at = `${where}, row ${k + 1}`;

        if (!m) {
          errors.push(`${at}: want "<indent><+|-|~|=> <label> <head|base:path#Lx-Ly>", got "${line.trim()}"`);
          return;
        }

        const [, indent, marker, , refText] = m;

        if (indent.length % 2) errors.push(`${at}: indent with 2 spaces per call level`);

        const { ref, error } = ws.resolve(refText, { needRange: true });

        if (error) return errors.push(`${at}: ${error}`);

        if (marker === "+" && (ref.side !== "head" || !ws.touchesChange(ref))) {
          errors.push(`${at}: "+" claims new code, so ${refText} must be a head range with added lines`);
        }

        if (marker === "-" && (ref.side !== "base" || !ws.touchesChange(ref))) {
          errors.push(`${at}: "-" claims removed code, so ${refText} must be a base range with deleted lines`);
        }

        if (marker === "~" && !ws.touchesChange(ref)) {
          errors.push(`${at}: "~" claims changed code, but ${refText} has no ${ref.side === "head" ? "added" : "deleted"} lines`);
        }
      });
    }
  }

  return { text, parts };
}

function runChecks(ws, only) {
  const errors = [];
  const result = {};

  if (!only || only === "groups") result.groups = checkGroups(ws, errors);

  if (!only || only === "pseudocode") result.pseudocode = checkPseudocode(ws, errors);

  if (!only || only === "doc") result.doc = checkDoc(ws, errors);

  return { errors, ...result };
}

function check(flags) {
  const dir = flags._[1] ?? fail("usage: check <dir>");
  const ws = new Workspace(dir);
  const { errors } = runChecks(ws, flags.only === true ? undefined : flags.only);

  if (errors.length) {
    console.log(`${errors.length} problem(s):`);

    for (const e of errors) console.log(`- ${e}`);

    process.exit(1);
  }

  console.log("ok");
}

// ---------- render ----------

const EXT_LANG = {
  ts: "typescript", tsx: "typescript", mts: "typescript", cts: "typescript",
  js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript",
  cs: "csharp", py: "python", go: "go", rs: "rust", rb: "ruby", java: "java", kt: "kotlin",
  swift: "swift", sql: "sql", json: "json", yml: "yaml", yaml: "yaml", md: "markdown",
  css: "css", scss: "scss", html: "xml", xml: "xml", csproj: "xml", sh: "bash", graphql: "graphql",
  tf: "hcl", php: "php", vue: "xml", svelte: "xml", toml: "ini",
};

function langFor(file) {
  return EXT_LANG[file.split(".").pop()?.toLowerCase()] ?? "";
}

function rewriteLinks(ws, markdown) {
  return markdown.replace(LINK, (whole, target) => {
    const { ref, error } = ws.resolve(target);

    return error ? whole : `](${ws.url(ref)})`;
  });
}

function refLabel(ref) {
  return `${ref.file}${ref.from ? `#L${ref.from}${ref.to !== ref.from ? `-L${ref.to}` : ""}` : ""}`;
}

function renderPeek(ws, refText) {
  const { ref } = ws.resolve(refText, { needRange: true });
  const h = ref.side === "head" ? ws.hunks.get(ref.file) : ws.hunksByBase.get(ref.file);
  const changed = h ? (ref.side === "head" ? h.added : h.deleted) : new Set();
  const cls = ref.side === "head" ? "add" : "del";
  const lines = ref.content.split("\n").slice(ref.from - 1, ref.to);
  const rows = lines
    .map((code, k) => {
      const n = ref.from + k;

      return `<tr class="${changed.has(n) ? cls : ""}"><td class="ln">${n}</td><td class="code"><code>${escapeHtml(code) || " "}</code></td></tr>`;
    })
    .join("");

  return `<figure class="peek" data-lang="${langFor(ref.file)}"><figcaption><span class="side side-${ref.side}">${ref.side}</span> <a href="${escapeHtml(ws.url(ref))}">${escapeHtml(refLabel(ref))}</a></figcaption><table>${rows}</table></figure>`;
}

function renderCallstack(ws, body) {
  const rows = body
    .filter((l) => l.trim())
    .map((line) => {
      const [, indent, marker, label, refText] = CALL_LINE.exec(line);
      const { ref } = ws.resolve(refText, { needRange: true });
      const kind = { "+": "add", "-": "del", "~": "mod", "=": "same" }[marker];

      return `<li class="frame ${kind}" style="--depth:${indent.length / 2}"><span class="mark">${marker === "=" ? "·" : marker}</span><a href="${escapeHtml(ws.url(ref))}"><code>${escapeHtml(label)}</code></a><span class="where">${escapeHtml(ref.side)}:${escapeHtml(refLabel(ref))}</span></li>`;
    })
    .join("");

  return `<ul class="callstack">${rows}</ul>`;
}

function renderGroups(ws, groups, pseudocode) {
  const byPath = new Map(ws.changes.files.map((f) => [f.path, f]));
  const pseudoByFile = new Map();

  for (const item of pseudocode?.items ?? []) {
    const file = decodeURIComponent(REF.exec(item.ref)?.[2] ?? "");

    if (!pseudoByFile.has(file)) pseudoByFile.set(file, []);

    pseudoByFile.get(file).push(item);
  }

  const sections = groups.groups.map((g, i) => {
    const files = g.files.map((p) => byPath.get(p));
    const added = files.reduce((s, f) => s + (f.added ?? 0), 0);
    const deleted = files.reduce((s, f) => s + (f.deleted ?? 0), 0);
    const rows = files
      .map((f) => {
        const stat = f.added === null ? "binary" : `<span class="plus">+${f.added}</span> <span class="minus">−${f.deleted}</span>`;
        const renamed = f.oldPath ? `<span class="muted">${escapeHtml(f.oldPath)} → </span>` : "";

        return `<tr><td class="status s-${f.status}">${f.status}</td><td>${renamed}<a href="${escapeHtml(ws.fileUrl(f))}">${escapeHtml(f.path)}</a></td><td class="stat">${stat}</td></tr>`;
      })
      .join("");
    const pseudo = g.files
      .flatMap((p) => pseudoByFile.get(p) ?? [])
      .map((item) => {
        const { ref } = ws.resolve(item.ref, { needRange: true });

        return `<details class="pseudo"><summary><code>${escapeHtml(item.name)}</code> <a href="${escapeHtml(ws.url(ref))}">${escapeHtml(refLabel(ref))}</a> <span class="muted">${ref.to - ref.from + 1} lines as pseudocode</span></summary><pre>${escapeHtml(item.pseudocode)}</pre></details>`;
      })
      .join("");
    const quoted = g.files.map((p) => (/^[\w./@-]+$/.test(p) ? p : `'${p.replaceAll("'", "'\\''")}'`)).join(" ");
    const command = `diffr --repo ${ws.meta.repo} ${short(ws.meta.base)} ${short(ws.meta.head)} -- ${quoted}`;

    return `<section class="group" id="group-${i + 1}"><h3><span class="num">${i + 1}</span> ${escapeHtml(g.title)} <span class="kind k-${g.kind}">${g.kind}</span> <span class="gstat"><span class="plus">+${added}</span> <span class="minus">−${deleted}</span></span></h3><div class="md" data-md="${escapeHtml(rewriteLinks(ws, g.summary))}"></div><table class="files">${rows}</table>${pseudo}<div class="cmd"><code>${escapeHtml(command)}</code><button type="button" data-copy="${escapeHtml(command)}">copy</button></div></section>`;
  });

  return `<div class="groups">${sections.join("")}</div>`;
}

function render(flags) {
  const dir = flags._[1] ?? fail("usage: render <dir>");
  const ws = new Workspace(dir);
  const { errors, groups, pseudocode, doc } = runChecks(ws);

  if (errors.length && !flags.force) {
    console.log(`${errors.length} problem(s); fix them or pass --force:`);

    for (const e of errors) console.log(`- ${e}`);

    process.exit(1);
  }

  if (flags.target === "github") return renderGithub(ws, { errors, groups, pseudocode, doc });

  const slots = [];
  const slot = (html) => {
    slots.push(html);
    return `\n\n<div data-slot="${slots.length - 1}"></div>\n\n`;
  };

  let markdown = "";
  let title = "Change brief";

  for (const part of doc?.parts ?? []) {
    if (part.type === "md") {
      let text = part.text;
      const t = /^# (.+)$/m.exec(text);

      if (t && title === "Change brief") {
        title = t[1].trim();
        text = text.replace(/^# .+$/m, "");
      }

      text = rewriteLinks(ws, text);

      if (groups && text.includes("<!-- groups -->")) {
        text = text.replace("<!-- groups -->", slot(renderGroups(ws, groups, pseudocode)));
        groups.placed = true;
      }

      markdown += text;
    } else if (part.lang === "peek") {
      markdown += part.body.filter((l) => l.trim()).map((r) => slot(renderPeek(ws, r))).join("");
    } else if (part.lang === "callstack") {
      markdown += slot(renderCallstack(ws, part.body));
    } else {
      markdown += `\n\`\`\`${part.lang}\n${part.body.join("\n")}\n\`\`\`\n`;
    }
  }

  if (groups && !groups.placed) markdown += `\n\n## Changes by group\n${slot(renderGroups(ws, groups, pseudocode))}`;

  const { meta } = ws;
  const files = ws.changes.files;
  const added = files.reduce((s, f) => s + (f.added ?? 0), 0);
  const deleted = files.reduce((s, f) => s + (f.deleted ?? 0), 0);
  const prLink = meta.pr ? `<a href="${escapeHtml(meta.pr)}">${escapeHtml(meta.pr.replace(/^https:\/\/github\.com\//, ""))}</a> · ` : "";
  const header = `<header><p class="eyebrow">${escapeHtml(meta.repoName)}</p><h1>${escapeHtml(title)}</h1><p class="pins">${prLink}<code>${short(meta.base)}</code> → <code>${short(meta.head)}</code> · ${files.length} files · <span class="plus">+${added}</span> <span class="minus">−${deleted}</span>${errors.length ? ` · <span class="warn">${errors.length} unresolved check problem(s)</span>` : ""}</p></header>`;
  const payload = JSON.stringify({ markdown, slots }).replaceAll("</", "<\\/");
  const html = PAGE.replace("{{TITLE}}", escapeHtml(title)).replace("{{HEADER}}", header).replace("{{PAYLOAD}}", payload);
  const out = path.join(ws.dir, "index.html");

  writeFileSync(out, html);
  console.log(out);
}

// ---------- render: GitHub comment ----------

// GitHub comments hold at most 65,536 characters; split below that.
const COMMENT_LIMIT = 60_000;

function mdCell(text) {
  return String(text).replaceAll("|", "\\|");
}

function diffrCommand(ws, files) {
  const quoted = files.map((p) => (/^[\w./@-]+$/.test(p) ? p : `'${p.replaceAll("'", "'\\''")}'`)).join(" ");

  return `diffr ${short(ws.meta.base)} ${short(ws.meta.head)} -- ${quoted}`;
}

function githubCallstack(ws, body) {
  const frames = body
    .filter((l) => l.trim())
    .map((line) => {
      const [, indent, marker, label, refText] = CALL_LINE.exec(line);
      const { ref } = ws.resolve(refText, { needRange: true });

      return { indent, marker, label, ref };
    });
  // The diff highlighter colours "+" green, "-" red and "!" orange; a space is plain.
  const lines = frames.map(
    ({ indent, marker, label, ref }) =>
      `${{ "+": "+", "-": "-", "~": "!", "=": " " }[marker]} ${indent}${label}   ${ref.file.split("/").pop()}#L${ref.from}`,
  );
  const links = frames.map(({ marker, label, ref }) => `- \`${marker}\` [${label}](${ws.url(ref)})`);

  return `\n\`\`\`diff\n${lines.join("\n")}\n\`\`\`\n\n<details><summary>Frame links</summary>\n\n${links.join("\n")}\n\n</details>\n\n`;
}

function githubGroups(ws, groups, pseudocode) {
  const byPath = new Map(ws.changes.files.map((f) => [f.path, f]));
  const pseudoByFile = new Map();

  for (const item of pseudocode?.items ?? []) {
    const file = decodeURIComponent(REF.exec(item.ref)?.[2] ?? "");

    if (!pseudoByFile.has(file)) pseudoByFile.set(file, []);

    pseudoByFile.get(file).push(item);
  }

  return groups.groups
    .map((g, i) => {
      const files = g.files.map((p) => byPath.get(p));
      const added = files.reduce((s, f) => s + (f.added ?? 0), 0);
      const deleted = files.reduce((s, f) => s + (f.deleted ?? 0), 0);
      const rows = files
        .map((f) => {
          const name = f.oldPath ? `${mdCell(f.oldPath)} → ${mdCell(f.path)}` : mdCell(f.path);
          const stat = f.added === null ? "binary | " : `+${f.added} | −${f.deleted}`;

          return `| ${f.status} | [${name}](${ws.fileUrl(f)}) | ${stat} |`;
        })
        .join("\n");
      const pseudo = g.files
        .flatMap((p) => pseudoByFile.get(p) ?? [])
        .map((item) => {
          const { ref } = ws.resolve(item.ref, { needRange: true });

          return `<details><summary>Pseudocode: <code>${escapeHtml(item.name)}</code> (${ref.to - ref.from + 1} lines)</summary>\n\n[${refLabel(ref)}](${ws.url(ref)})\n\n\`\`\`text\n${item.pseudocode}\n\`\`\`\n\n</details>`;
        })
        .join("\n\n");

      return [
        `#### ${i + 1}. ${g.title} · \`${g.kind}\` · +${added} −${deleted}`,
        rewriteLinks(ws, g.summary),
        `| | File | + | − |\n|---|---|--:|--:|\n${rows}`,
        pseudo,
        `\`\`\`sh\n${diffrCommand(ws, g.files)}\n\`\`\``,
      ]
        .filter(Boolean)
        .join("\n\n");
    })
    .join("\n\n");
}

function renderGithub(ws, { errors, groups, pseudocode, doc }) {
  let body = "";
  let title = "Change brief";

  for (const part of doc?.parts ?? []) {
    if (part.type === "md") {
      let text = part.text;
      const t = /^# (.+)$/m.exec(text);

      if (t && title === "Change brief") {
        title = t[1].trim();
        text = text.replace(/^# .+$/m, "");
      }

      // The title becomes the comment's h2, so every heading moves down one level.
      text = rewriteLinks(ws, text).replace(/^(#{2,5}) /gm, "#$1 ");

      if (groups && text.includes("<!-- groups -->")) {
        text = text.replace("<!-- groups -->", githubGroups(ws, groups, pseudocode));
        groups.placed = true;
      }

      body += text;
    } else if (part.lang === "peek") {
      // A permalink alone on a line expands into a code snippet in a comment on the same repository.
      body += part.body
        .filter((l) => l.trim())
        .map((r) => `\n${ws.url(ws.resolve(r, { needRange: true }).ref)}\n`)
        .join("");
    } else if (part.lang === "callstack") {
      body += githubCallstack(ws, part.body);
    } else {
      body += `\n\`\`\`${part.lang}\n${part.body.join("\n")}\n\`\`\`\n`;
    }
  }

  if (groups && !groups.placed) body += `\n\n### Changes by group\n\n${githubGroups(ws, groups, pseudocode)}`;

  const { meta } = ws;
  const files = ws.changes.files;
  const added = files.reduce((s, f) => s + (f.added ?? 0), 0);
  const deleted = files.reduce((s, f) => s + (f.deleted ?? 0), 0);
  const pins = `<sub>Brief pinned to \`${short(meta.base)}\` → \`${short(meta.head)}\` · ${files.length} files · +${added} −${deleted} · links open the code at these commits${errors.length ? ` · ${errors.length} unresolved check problem(s)` : ""}</sub>`;

  // Split at section headings so that each comment stays under the limit.
  const sections = body.split(/\n(?=### )/);
  const chunks = [""];

  for (const section of sections) {
    if (chunks.at(-1).length + section.length > COMMENT_LIMIT && chunks.at(-1)) chunks.push("");

    chunks[chunks.length - 1] += `${section}\n`;
  }

  const outputs = chunks.map((chunk, i) => {
    const part = chunks.length > 1 ? ` (part ${i + 1} of ${chunks.length})` : "";
    const text = `## ${title}${part}\n\n${pins}\n\n${chunk.trim()}\n`;
    const file = path.join(ws.dir, chunks.length > 1 ? `comment-${i + 1}.md` : "comment.md");

    if (text.length > 65_536) console.error(`warning: ${file} is ${text.length} characters; GitHub rejects comments over 65,536`);

    writeFileSync(file, text);

    return `${file} (${text.length} characters)`;
  });

  for (const line of outputs) console.log(line);
}

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{TITLE}}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github.min.css" media="(prefers-color-scheme: light)">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github-dark.min.css" media="(prefers-color-scheme: dark)">
<style>
:root { --bg:#fbfbfa; --fg:#1d1d1f; --muted:#6e6e73; --line:#e4e4e1; --card:#fff; --accent:#2f5bd3;
  --add:#e6f4ea; --add-fg:#1a7f37; --del:#fdecea; --del-fg:#c62828; --mod:#fff6db; --mod-fg:#9a6700; color-scheme: light dark; }
@media (prefers-color-scheme: dark) { :root { --bg:#141416; --fg:#e8e8ea; --muted:#9a9aa0; --line:#2c2c30; --card:#1c1c1f; --accent:#7aa2ff;
  --add:#12301c; --add-fg:#56d364; --del:#3a1618; --del-fg:#ff7b72; --mod:#332a0f; --mod-fg:#e3b341; } }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--fg); font:16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif; }
.layout { display:grid; grid-template-columns: 240px minmax(0, 860px); gap:48px; max-width:1180px; margin:0 auto; padding:48px 32px 120px; }
nav { position:sticky; top:32px; align-self:start; font-size:13px; max-height:calc(100vh - 64px); overflow:auto; }
nav a { display:block; color:var(--muted); text-decoration:none; padding:3px 0; }
nav a.h3 { padding-left:14px; }
nav a:hover { color:var(--fg); }
@media (max-width: 1000px) { .layout { grid-template-columns: 1fr; } nav { display:none; } }
header { border-bottom:1px solid var(--line); margin-bottom:32px; padding-bottom:20px; }
.eyebrow { color:var(--muted); font-size:13px; letter-spacing:.04em; text-transform:uppercase; margin:0; }
h1 { font-size:30px; line-height:1.25; margin:6px 0 10px; letter-spacing:-.01em; }
h2 { font-size:21px; margin:44px 0 12px; padding-top:8px; }
h3 { font-size:17px; margin:28px 0 8px; }
.pins { color:var(--muted); font-size:14px; margin:0; }
a { color:var(--accent); }
code { font:13px/1.5 ui-monospace, "SF Mono", Menlo, monospace; }
:not(pre) > code { background:var(--line); padding:1px 5px; border-radius:4px; }
pre { background:var(--card); border:1px solid var(--line); border-radius:8px; padding:12px 14px; overflow:auto; }
blockquote { margin:12px 0; padding:2px 16px; border-left:3px solid var(--accent); color:var(--muted); }
.plus { color:var(--add-fg); } .minus { color:var(--del-fg); } .muted { color:var(--muted); } .warn { color:var(--del-fg); font-weight:600; }
.mermaid { background:var(--card); border:1px solid var(--line); border-radius:8px; padding:16px; margin:16px 0; text-align:center; }
figure.peek { margin:16px 0; border:1px solid var(--line); border-radius:8px; overflow:hidden; background:var(--card); }
figure.peek figcaption { font-size:13px; padding:6px 12px; border-bottom:1px solid var(--line); }
figure.peek table { border-collapse:collapse; width:100%; }
figure.peek td { padding:0 12px; vertical-align:top; }
figure.peek td.ln { width:1%; text-align:right; color:var(--muted); user-select:none; font:12px/1.6 ui-monospace, Menlo, monospace; }
figure.peek td.code code { white-space:pre; background:none; padding:0; line-height:1.6; }
figure.peek tr.add { background:var(--add); } figure.peek tr.del { background:var(--del); }
figure.peek > table { display:block; overflow-x:auto; }
.side { font:11px ui-monospace, Menlo, monospace; padding:1px 6px; border-radius:10px; }
.side-head { background:var(--add); color:var(--add-fg); } .side-base { background:var(--del); color:var(--del-fg); }
ul.callstack { list-style:none; padding:10px 0; margin:16px 0; border:1px solid var(--line); border-radius:8px; background:var(--card); }
ul.callstack li { padding:3px 14px 3px calc(14px + var(--depth) * 22px); display:flex; gap:10px; align-items:baseline; }
ul.callstack .mark { font:600 13px ui-monospace, Menlo, monospace; width:12px; }
ul.callstack .where { color:var(--muted); font-size:12px; margin-left:auto; }
ul.callstack a { text-decoration:none; }
ul.callstack li.add { background:var(--add); } ul.callstack li.add .mark { color:var(--add-fg); }
ul.callstack li.del { background:var(--del); } ul.callstack li.del .mark { color:var(--del-fg); }
ul.callstack li.mod { background:var(--mod); } ul.callstack li.mod .mark { color:var(--mod-fg); }
ul.callstack li.same code { color:var(--muted); }
section.group { border:1px solid var(--line); border-radius:10px; padding:4px 18px 16px; margin:18px 0; background:var(--card); }
section.group h3 { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.num { display:inline-grid; place-items:center; width:24px; height:24px; border-radius:50%; background:var(--fg); color:var(--bg); font-size:12px; }
.kind { font-size:11px; font-weight:500; text-transform:uppercase; letter-spacing:.05em; padding:2px 8px; border-radius:10px; border:1px solid var(--line); color:var(--muted); }
.k-implementation { color:var(--accent); border-color:var(--accent); }
.gstat { font-size:13px; font-weight:400; margin-left:auto; }
table.files { width:100%; border-collapse:collapse; font-size:14px; margin:8px 0; }
table.files td { padding:3px 6px; border-top:1px solid var(--line); }
td.status { width:1%; font:600 12px ui-monospace, Menlo, monospace; color:var(--muted); }
.s-A { color:var(--add-fg) !important; } .s-D { color:var(--del-fg) !important; } .s-M { color:var(--mod-fg) !important; }
td.stat { text-align:right; white-space:nowrap; font:12px ui-monospace, Menlo, monospace; }
details.pseudo { margin:8px 0; font-size:14px; } details.pseudo pre { margin:6px 0 0; font-size:13px; }
.cmd { display:flex; gap:8px; align-items:center; margin-top:10px; background:var(--bg); border:1px dashed var(--line); border-radius:6px; padding:6px 8px; }
.cmd code { flex:1; overflow-x:auto; white-space:nowrap; background:none; }
.cmd button { font-size:12px; border:1px solid var(--line); background:var(--card); color:var(--fg); border-radius:5px; padding:3px 10px; cursor:pointer; }
table:not(.files):not(figure table) { border-collapse:collapse; margin:12px 0; font-size:14px; }
table:not(.files):not(figure table) td, table:not(.files):not(figure table) th { border:1px solid var(--line); padding:5px 10px; text-align:left; }
</style>
</head>
<body>
<div class="layout">
<nav id="toc"></nav>
<main>
{{HEADER}}
<article id="doc"></article>
</main>
</div>
<script id="payload" type="application/json">{{PAYLOAD}}</script>
<script src="https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js"></script>
<script type="module">
import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
const { markdown, slots } = JSON.parse(document.getElementById("payload").textContent);
const doc = document.getElementById("doc");
doc.innerHTML = marked.parse(markdown);
doc.querySelectorAll("[data-slot]").forEach((el) => { el.outerHTML = slots[Number(el.dataset.slot)]; });
doc.querySelectorAll("[data-md]").forEach((el) => { el.innerHTML = marked.parse(el.dataset.md); });
doc.querySelectorAll("pre > code.language-mermaid").forEach((code) => {
  const div = document.createElement("div"); div.className = "mermaid"; div.textContent = code.textContent; code.parentElement.replaceWith(div);
});
doc.querySelectorAll("pre > code[class^=language-]").forEach((code) => hljs.highlightElement(code));
doc.querySelectorAll("figure.peek").forEach((fig) => {
  const lang = fig.dataset.lang; if (!lang || !hljs.getLanguage(lang)) return;
  fig.querySelectorAll("td.code code").forEach((c) => { c.innerHTML = hljs.highlight(c.textContent, { language: lang, ignoreIllegals: true }).value; });
});
doc.querySelectorAll("a[href^='http']").forEach((a) => { a.target = "_blank"; a.rel = "noopener"; });
document.querySelectorAll("button[data-copy]").forEach((b) => b.addEventListener("click", async () => {
  await navigator.clipboard.writeText(b.dataset.copy); b.textContent = "copied"; setTimeout(() => (b.textContent = "copy"), 1200);
}));
const toc = document.getElementById("toc");
doc.querySelectorAll("h2, h3").forEach((h, i) => {
  if (!h.id) h.id = "s-" + i;
  const a = document.createElement("a"); a.href = "#" + h.id; a.className = h.tagName.toLowerCase();
  a.textContent = h.textContent.replace(/^\\d+\\s*/, "").replace(/\\s*(implementation|tests|docs|config|generated|fixtures|renames|formatting|other)\\s*\\+\\d+\\s*−\\d+$/, "");
  toc.appendChild(a);
});
const dark = matchMedia("(prefers-color-scheme: dark)").matches;
mermaid.initialize({ startOnLoad: false, theme: dark ? "dark" : "neutral", securityLevel: "strict" });
await mermaid.run({ querySelector: ".mermaid" });
</script>
</body>
</html>
`;

// ---------- main ----------

const flags = parseFlags(process.argv.slice(2));
const command = flags._[0];

if (command === "init") init(flags);
else if (command === "check") check(flags);
else if (command === "render") render(flags);
else fail("usage: brief.mjs init|check|render (see header comment)");
