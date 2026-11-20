#!/usr/bin/env node
// Create or update an explainer-video Remotion project from this skill's template.
//
//   node <skill>/scripts/new-project.mjs --dir ./octopus --aspect 9:16 --styles mono-motion-graphics,cartoon-3d
//
// Safe to re-run on an existing project: it never overwrites a scene you have written,
// your data files or your audio. It adds stubs for new styles, regenerates the style
// registry and updates the size, fps and style list in src/data/project.json.

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const skillDir = path.resolve(here, "..");
const templateDir = path.join(skillDir, "template");
const stylesDir = path.join(skillDir, "styles");

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : dflt;
};
const flag = (name) => args.includes(`--${name}`);

const dir = opt("dir");
if (!dir) {
  console.error("usage: new-project.mjs --dir <path> [--aspect 9:16] [--short 1080] [--fps 30] [--styles a,b] [--title T] [--no-narration] [--no-captions] [--no-install]");
  process.exit(2);
}
const root = path.resolve(dir);
const exists = fs.existsSync(path.join(root, "package.json"));

// Size: the short side is --short (1080 by default); the long side follows the aspect ratio.
const aspect = opt("aspect");
const short = Number(opt("short", "1080"));
let size = null;
if (aspect || !exists) {
  const m = /^(\d+(?:\.\d+)?)[:x](\d+(?:\.\d+)?)$/.exec(aspect ?? "9:16");
  if (!m) {
    console.error(`--aspect must look like 16:9, 9:16, 1:1 or 4:5 (got "${aspect}")`);
    process.exit(2);
  }
  const [aw, ah] = [Number(m[1]), Number(m[2])];
  const even = (x) => Math.round(x / 2) * 2;
  size = aw >= ah ? { width: even((short * aw) / ah), height: even(short) } : { width: even(short), height: even((short * ah) / aw) };
}

const known = fs
  .readdirSync(stylesDir)
  .filter((f) => f.endsWith(".md") && f !== "README.md")
  .map((f) => f.replace(/\.md$/, ""));
const styleArg = opt("styles");
const requested = styleArg ? styleArg.split(",").map((s) => s.trim()).filter(Boolean) : null;
for (const id of requested ?? []) {
  if (!known.includes(id) && !/^[a-z0-9-]+$/.test(id)) {
    console.error(`style id "${id}" must be lowercase letters, digits and dashes`);
    process.exit(2);
  }
  if (!known.includes(id)) console.warn(`note: "${id}" is not in the catalogue; creating a custom style stub`);
}

// 1. Copy the template once.
const copyTree = (from, to) => {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === "out") continue;
    const s = path.join(from, e.name);
    const d = path.join(to, e.name);
    if (e.isDirectory()) copyTree(s, d);
    else if (!fs.existsSync(d)) fs.copyFileSync(s, d);
  }
};
if (!exists) copyTree(templateDir, root);
else {
  // Refresh shared library and tools from the template (never data, styles or audio).
  for (const sub of ["src/lib", "tools"]) {
    const from = path.join(templateDir, sub);
    for (const f of fs.readdirSync(from)) fs.copyFileSync(path.join(from, f), path.join(root, sub, f));
  }
  for (const f of ["src/Root.tsx", "src/Compare.tsx", "src/index.ts", "remotion.config.ts"]) {
    fs.copyFileSync(path.join(templateDir, f), path.join(root, f));
  }
}

// 2. project.json
const projPath = path.join(root, "src/data/project.json");
const proj = JSON.parse(fs.readFileSync(projPath, "utf8"));
if (size) Object.assign(proj, size);
if (opt("fps")) proj.fps = Number(opt("fps"));
if (opt("title")) proj.title = opt("title");
if (flag("no-narration")) proj.narration = false;
if (flag("no-captions")) proj.captions = false;
if (requested) proj.styles = [...new Set([...(exists ? proj.styles : []), ...requested])];
fs.writeFileSync(projPath, JSON.stringify(proj, null, 2) + "\n");

// 3. A stub scene per style that has none yet, then the registry.
const sceneDir = path.join(root, "src/styles");
const pascal = (id) => id.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
for (const id of proj.styles) {
  const f = path.join(sceneDir, id, "Scene.tsx");
  if (fs.existsSync(f)) continue;
  fs.mkdirSync(path.dirname(f), { recursive: true });
  const spec = known.includes(id) ? `styles/${id}.md in the explainer-video skill` : "your own style notes";
  fs.writeFileSync(
    f,
    `import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { beatAt } from "../../lib/timeline";

// STUB: replace with the ${id} look. Spec: ${spec}.
export const ${pascal(id)}: React.FC = () => {
  const frame = useCurrentFrame();
  const { index } = beatAt(frame);
  return (
    <AbsoluteFill style={{ background: "#202020", color: "#888", justifyContent: "center", alignItems: "center", fontSize: 48 }}>
      ${id} stub, beat {index}
      <Captions />
    </AbsoluteFill>
  );
};
`,
  );
}
const reg = [
  `// Generated by new-project.mjs. Re-run it after adding a style; edit scenes, not this file.`,
  `import type React from "react";`,
  ...proj.styles.map((id) => `import { ${pascal(id)} } from "./${id}/Scene";`),
  ``,
  `export const styles: Record<string, React.FC> = {`,
  ...proj.styles.map((id) => `  "${id}": ${pascal(id)},`),
  `};`,
  ``,
].join("\n");
fs.writeFileSync(path.join(sceneDir, "index.ts"), reg);

// 4. Install dependencies.
if (!flag("no-install") && !fs.existsSync(path.join(root, "node_modules/remotion"))) {
  console.log("installing dependencies (npm install)...");
  execSync("npm install --no-audit --no-fund", { cwd: root, stdio: "inherit" });
}

console.log(
  JSON.stringify(
    { project: root, width: proj.width, height: proj.height, fps: proj.fps, styles: proj.styles, narration: proj.narration, captions: proj.captions },
    null,
    2,
  ),
);
