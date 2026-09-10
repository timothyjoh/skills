#!/usr/bin/env node
/**
 * cts_validate.js: health check for a generated channel skill, plus manifest writer.
 *
 *   E1  SKILL.md exists with frontmatter `name` and `description`
 *   E2  SKILL.md body over the load budget (> 18k chars ≈ 4.5k tokens); W over 14k
 *   E3  every relative markdown link in the skill resolves
 *   E4  every concept page has a `## Sources` section with >= 1 [h:mm:ss] timestamp
 *   E5  every concept id in taxonomy.json has a page
 *   W1  concept page not listed in taxonomy.json
 *   W2  concept page not linked from SKILL.md (unreachable from the entry point)
 *   W3  concept page has < 2 links to sibling concepts
 *
 * --write-manifest builds <skill-dir>/manifest.json from scope + raw manifest + taxonomy.
 *
 * @usage
 *   node cts_validate.js --skill-dir <dir> --kb-dir <dir> [--write-manifest] [--json]
 */
const fs = require('fs');
const path = require('path');

const a = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--skill-dir') a.skillDir = argv[++i];
  else if (argv[i] === '--kb-dir') a.kbDir = argv[++i];
  else if (argv[i] === '--write-manifest') a.writeManifest = true;
  else if (argv[i] === '--json') a.json = true;
}
if (!a.skillDir || !a.kbDir) { console.error('usage: cts_validate.js --skill-dir <dir> --kb-dir <dir> [--write-manifest] [--json]'); process.exit(2); }

const errors = [], warnings = [];
const E = (c, m) => errors.push(`${c} ${m}`);
const W = (c, m) => warnings.push(`${c} ${m}`);
const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null);
const tokens = (s) => Math.round((s || '').length / 4);
const stripCode = (s) => s.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
const linksIn = (s) => [...stripCode(s).matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)].map((m) => m[1]).filter((l) => !/^(https?:|mailto:|#)/.test(l));

const skillMd = read(path.join(a.skillDir, 'SKILL.md'));
const files = {};
if (!skillMd) E('E1', 'SKILL.md missing');
else {
  const fm = skillMd.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fm) E('E1', 'SKILL.md has no YAML frontmatter');
  else {
    if (!/^name:\s*\S/m.test(fm[1])) E('E1', 'SKILL.md frontmatter lacks name');
    if (!/^description:\s*\S/m.test(fm[1])) E('E1', 'SKILL.md frontmatter lacks description');
    const body = fm[2];
    if (body.length > 18000) E('E2', `SKILL.md body is ${body.length} chars (~${tokens(body)} tokens); budget is ~4k tokens`);
    else if (body.length > 14000) W('E2', `SKILL.md body is ${body.length} chars (~${tokens(body)} tokens); trim toward 4k tokens`);
  }
  files['SKILL.md'] = skillMd;
}
for (const f of ['glossary.md', 'patterns.md', 'cheatsheet.md', 'sources.md']) {
  const s = read(path.join(a.skillDir, f));
  if (s) files[f] = s; else W('E3', `${f} missing`);
}
const conceptsDir = path.join(a.skillDir, 'concepts');
const conceptFiles = fs.existsSync(conceptsDir) ? fs.readdirSync(conceptsDir).filter((f) => f.endsWith('.md')).sort() : [];
for (const f of conceptFiles) files[`concepts/${f}`] = read(path.join(conceptsDir, f));

// E3 links
for (const [rel, s] of Object.entries(files)) {
  for (const l of linksIn(s)) {
    const target = path.resolve(path.dirname(path.join(a.skillDir, rel)), decodeURI(l.split('#')[0]));
    if (l.split('#')[0] && !fs.existsSync(target)) E('E3', `${rel}: broken link ${l}`);
  }
}
// E4, W2, W3
const skillLinks = new Set(skillMd ? linksIn(skillMd).map((l) => path.normalize(l)) : []);
for (const f of conceptFiles) {
  const rel = `concepts/${f}`, s = files[rel];
  const src = s.split(/^## Sources\s*$/m)[1];
  if (!src) E('E4', `${rel}: no "## Sources" section`);
  else if (!/\[\d+:\d{2}:\d{2}\]|\[\d{1,2}:\d{2}\]/.test(src)) E('E4', `${rel}: Sources has no [h:mm:ss] timestamp`);
  if (!skillLinks.has(path.normalize(rel))) W('W2', `${rel}: not linked from SKILL.md`);
  const sib = linksIn(s).filter((l) => /^(\.\/)?[a-z0-9-]+\.md$/.test(l)).length;
  if (sib < 2) W('W3', `${rel}: only ${sib} link(s) to sibling concepts`);
}
// E5 / W1 taxonomy parity
const taxPath = path.join(a.kbDir, 'taxonomy.json');
const tax = fs.existsSync(taxPath) ? JSON.parse(fs.readFileSync(taxPath, 'utf8')) : null;
if (!tax) W('E5', 'taxonomy.json missing; skipping parity');
else {
  const ids = new Set((tax.concepts || []).map((c) => c.id));
  for (const id of ids) if (!conceptFiles.includes(`${id}.md`)) E('E5', `taxonomy concept "${id}" has no concepts/${id}.md`);
  for (const f of conceptFiles) if (!ids.has(f.replace(/\.md$/, ''))) W('W1', `concepts/${f} not in taxonomy.json`);
}

// Manifest
if (a.writeManifest && tax) {
  const scope = JSON.parse(read(path.join(a.kbDir, 'scope.json')) || '{}');
  const raw = JSON.parse(read(path.join(a.kbDir, 'raw', 'manifest.json')) || '{"videos":{}}');
  const byVideo = {};
  for (const c of tax.concepts || []) for (const v of c.video_ids || []) (byVideo[v] = byVideo[v] || []).push(c.id);
  const videos = (scope.videos || []).map((v) => {
    const r = raw.videos[v.id] || {};
    return { id: v.id, title: r.title || v.title, published: r.published || v.published || '', duration_seconds: r.duration_seconds ?? null,
      status: r.status || 'pending', concepts: byVideo[v.id] || [] };
  });
  const manifest = {
    channel: scope.channel, handle: scope.handle, slug: scope.slug, generated: new Date().toISOString().slice(0, 10),
    generator: 'channel-to-skill', taxonomy_version: tax.version || 1,
    videos_in_scope: videos.length, videos_with_transcript: videos.filter((v) => v.status === 'fetched').length,
    concepts: (tax.concepts || []).length, videos,
  };
  fs.writeFileSync(path.join(a.skillDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
}

const sizes = Object.fromEntries(Object.entries(files).map(([k, v]) => [k, tokens(v)]));
const conceptTok = conceptFiles.map((f) => sizes[`concepts/${f}`]);
const report = {
  errors, warnings,
  files: { 'SKILL.md': sizes['SKILL.md'] || 0, 'glossary.md': sizes['glossary.md'] || 0, 'patterns.md': sizes['patterns.md'] || 0,
    'cheatsheet.md': sizes['cheatsheet.md'] || 0, 'sources.md': sizes['sources.md'] || 0,
    concepts: { count: conceptFiles.length, total_tokens: conceptTok.reduce((s, n) => s + n, 0),
      min: conceptTok.length ? Math.min(...conceptTok) : 0, max: conceptTok.length ? Math.max(...conceptTok) : 0 } },
};
if (a.json) console.log(JSON.stringify(report, null, 2));
else {
  for (const e of errors) console.log(`ERROR ${e}`);
  for (const w of warnings) console.log(`warn  ${w}`);
  const f = report.files;
  console.log(`SKILL.md ~${f['SKILL.md']} tok | glossary ~${f['glossary.md']} | patterns ~${f['patterns.md']} | cheatsheet ~${f['cheatsheet.md']} | sources ~${f['sources.md']}`);
  console.log(`concepts: ${f.concepts.count} pages, ~${f.concepts.total_tokens} tok total (min ${f.concepts.min}, max ${f.concepts.max})`);
  console.log(`${errors.length} error(s), ${warnings.length} warning(s)`);
}
process.exit(errors.length ? 1 : 0);
