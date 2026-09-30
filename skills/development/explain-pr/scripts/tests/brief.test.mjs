// End-to-end tests for brief.mjs against a throwaway git repo with two commits.
// Run: node --test skills/development/explain-pr/scripts/tests/*.test.mjs

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

const SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "brief.mjs");
const SPACED = "notes/my file.txt";

let root;
let repo;

function git(...args) {
  return execFileSync("git", ["-C", repo, ...args], {
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "Test",
      GIT_AUTHOR_EMAIL: "test@example.com",
      GIT_COMMITTER_NAME: "Test",
      GIT_COMMITTER_EMAIL: "test@example.com",
      GIT_CONFIG_GLOBAL: "/dev/null",
      GIT_CONFIG_SYSTEM: "/dev/null",
    },
  });
}

function write(file, text) {
  mkdirSync(path.dirname(path.join(repo, file)), { recursive: true });
  writeFileSync(path.join(repo, file), text);
}

function lines(prefix, from, to) {
  let text = "";

  for (let n = from; n <= to; n++) text += `${prefix} ${n}\n`;

  return text;
}

function brief(...args) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8" });

  return { code: r.status, out: r.stdout + r.stderr };
}

/** A fresh brief dir pinned to the two commits, with the given files written into it. */
function briefDir(name, files = {}) {
  const dir = path.join(root, name);
  const r = brief("init", "--repo", repo, "--base", "HEAD~1", "--head", "HEAD", "--out", dir);

  assert.equal(r.code, 0, r.out);

  for (const [file, value] of Object.entries(files)) {
    writeFileSync(path.join(dir, file), typeof value === "string" ? value : JSON.stringify(value, null, 2));
  }

  return dir;
}

const GOOD_GROUPS = {
  groups: [
    {
      title: "App",
      kind: "implementation",
      summary: "Adds [`helper`](head:src/new.js#L1-L3) and extends [app](head:src/app.js#L11-L13).",
      files: ["src/new.js", "src/app.js"],
    },
    {
      title: "Notes",
      kind: "docs",
      summary: "Adds a line to [the notes](head:notes/my%20file.txt#L4).",
      files: [SPACED],
    },
  ],
};

const GOOD_DOC = `# Extend the app

## What / why

The app gains three lines, see [app](head:src/app.js#L11-L13).

## Implementation

\`\`\`callstack
= main() head:src/app.js#L1-L5
  + extra() head:src/app.js#L11-L13
  ~ notes head:notes/my%20file.txt#L3-L4
\`\`\`

\`\`\`peek
head:src/app.js#L9-L13
\`\`\`

## Changes by group

<!-- groups -->
`;

before(() => {
  root = mkdtempSync(path.join(tmpdir(), "explain-pr-test-"));
  repo = path.join(root, "repo");
  mkdirSync(repo);
  git("init", "-q", "-b", "main");
  write("src/app.js", lines("// app line", 1, 10));
  write(SPACED, lines("note", 1, 3));
  git("add", "-A");
  git("commit", "-q", "-m", "first");
  write("src/app.js", lines("// app line", 1, 10) + lines("// added line", 11, 13));
  write(SPACED, lines("note", 1, 4));
  write("src/new.js", lines("// helper", 1, 3));
  git("add", "-A");
  git("commit", "-q", "-m", "second");
});

after(() => rmSync(root, { recursive: true, force: true }));

test("init writes meta.json and changes.json", () => {
  const dir = briefDir("init");
  const meta = JSON.parse(readFileSync(path.join(dir, "meta.json"), "utf8"));
  const changes = JSON.parse(readFileSync(path.join(dir, "changes.json"), "utf8"));

  assert.equal(meta.head, git("rev-parse", "HEAD").trim());
  assert.equal(meta.base, git("rev-parse", "HEAD~1").trim());
  assert.equal(meta.links, "local");
  assert.deepEqual(changes.files.map((f) => f.path).sort(), [SPACED, "src/app.js", "src/new.js"]);
  assert.deepEqual(changes.files.find((f) => f.path === SPACED), { path: SPACED, status: "M", added: 1, deleted: 0 });
});

test("a valid brief passes check", () => {
  const dir = briefDir("valid", { "groups.json": GOOD_GROUPS, "doc.md": GOOD_DOC });
  const r = brief("check", dir);

  assert.equal(r.code, 0, r.out);
  assert.equal(r.out.trim(), "ok");
});

test("check reports a link range past the end of a file", () => {
  const dir = briefDir("past-end", { "doc.md": "# T\n\nSee [app](head:src/app.js#L10-L99).\n" });
  const r = brief("check", dir, "--only", "doc");

  assert.equal(r.code, 1);
  assert.match(r.out, /head:src\/app\.js#L10-L99: range ends past the file \(13 lines at head\)/);
});

test("check reports a + frame on lines the diff did not add", () => {
  const doc = "# T\n\n```callstack\n+ main() head:src/app.js#L1-L5\n```\n";
  const dir = briefDir("plus-frame", { "doc.md": doc });
  const r = brief("check", dir, "--only", "doc");

  assert.equal(r.code, 1);
  assert.match(r.out, /"\+" claims new code, so head:src\/app\.js#L1-L5 must be a head range with added lines/);
});

test("check reports a changed file in no group", () => {
  const groups = { groups: [{ ...GOOD_GROUPS.groups[0] }] };
  const dir = briefDir("uncategorized", { "groups.json": groups });
  const r = brief("check", dir, "--only", "groups");

  assert.equal(r.code, 1);
  assert.match(r.out, /uncategorized files \(1\): notes\/my file\.txt/);
});

test("check reports a file in two groups", () => {
  const groups = structuredClone(GOOD_GROUPS);
  groups.groups[1].files.push("src/app.js");
  const dir = briefDir("twice", { "groups.json": groups });
  const r = brief("check", dir, "--only", "groups");

  assert.equal(r.code, 1);
  assert.match(r.out, /"src\/app\.js" is already in groups\[0\] "App"/);
});

test("check reports a link path with an unencoded space", () => {
  const dir = briefDir("space", { "doc.md": "# T\n\nSee [notes](head:notes/my file.txt#L4).\n" });
  const r = brief("check", dir, "--only", "doc");

  assert.equal(r.code, 1);
  assert.match(r.out, /"head:notes\/my file\.txt#L4" has a space; write spaces in paths as %20/);
});

test("a %20 path to the spaced file resolves and matches its diff hunks", () => {
  // Git ends ---/+++ paths that contain a space with a tab; parseHunks strips it.
  // Without that, the "+" frame below would find no added lines.
  const doc = "# T\n\nSee [line 4](head:notes/my%20file.txt#L4).\n\n```callstack\n+ note head:notes/my%20file.txt#L4\n- none base:notes/my%20file.txt#L1-L3\n```\n";
  const dir = briefDir("spaced", { "doc.md": doc });
  const r = brief("check", dir, "--only", "doc");

  assert.equal(r.code, 1);
  assert.doesNotMatch(r.out, /\+" claims new code/);
  assert.doesNotMatch(r.out, /does not exist/);
  assert.match(r.out, /"-" claims removed code, so base:notes\/my%20file\.txt#L1-L3 must be a base range with deleted lines/);
  assert.match(r.out, /^1 problem\(s\):/);
});

test("render writes index.html", () => {
  const dir = briefDir("render", { "groups.json": GOOD_GROUPS, "doc.md": GOOD_DOC });
  const r = brief("render", dir);

  assert.equal(r.code, 0, r.out);

  const html = readFileSync(path.join(dir, "index.html"), "utf8");

  assert.match(html, /<title>Extend the app<\/title>/);
  assert.match(html, /diffr --repo /);
});

test("render --target github writes comment.md", () => {
  const dir = briefDir("github", { "groups.json": GOOD_GROUPS, "doc.md": GOOD_DOC });
  const r = brief("render", dir, "--target", "github");

  assert.equal(r.code, 0, r.out);
  assert.ok(existsSync(path.join(dir, "comment.md")));

  const md = readFileSync(path.join(dir, "comment.md"), "utf8");

  assert.match(md, /^## Extend the app/);
  assert.match(md, /```diff\n  main\(\)   app\.js#L1\n\+   extra\(\)   app\.js#L11\n!   notes   my file\.txt#L3\n```/);
  assert.match(md, /#### 2\. Notes · `docs`/);
});
