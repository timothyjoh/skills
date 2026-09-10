export const meta = {
  name: 'channel-to-skill',
  description: 'Steps 3-4 of /channel-to-skill: fetch transcripts for a scoped YouTube channel, extract once, canonicalize, and render an agent skill (SKILL.md, concepts/, glossary, patterns, cheatsheet).',
  whenToUse: 'Invoked by the channel-to-skill skill after scope.json is written. Not for direct use.',
  phases: [
    { title: 'Fetch', detail: 'sequential yt-dlp transcript fetch from scope.json (no LLM)' },
    { title: 'Extract', detail: 'one Sonnet agent per ~8 transcripts; each transcript read exactly once', model: 'sonnet' },
    { title: 'Canonicalize', detail: 'one agent merges every extraction into a frozen taxonomy' },
    { title: 'Render', detail: 'one Sonnet agent per concept page', model: 'sonnet' },
    { title: 'Support', detail: 'glossary, patterns, cheatsheet, then SKILL.md + sources.md' },
    { title: 'Validate', detail: 'link, budget and provenance checks; writes manifest.json' },
  ],
}

// args: { slug, channel, kbDir, skillDir, scriptsDir, today, mode?: 'build'|'fold-in', batchSize?, delay?, node? }
//   node       optional path to a node binary when `node` is not on PATH for non-login shells
//   kbDir      absolute path to the working data dir (scope.json, raw/, extractions/, taxonomy.json)
//   skillDir   absolute path where the generated skill lands
//   scriptsDir absolute path to channel-to-skill/scripts
//   today      ISO date, passed in because Date is unavailable in workflow scripts
const opts = typeof args === 'string' ? JSON.parse(args) : (args ?? {})
for (const k of ['slug', 'channel', 'kbDir', 'skillDir', 'scriptsDir', 'today']) {
  if (!opts[k]) throw new Error(`channel-to-skill: missing arg "${k}": the skill computes these; do not invoke the workflow by hand`)
}
const { slug, channel, kbDir, skillDir, scriptsDir, today } = opts
const mode = opts.mode ?? 'build'
const batchSize = opts.batchSize ?? 8
const delay = opts.delay ?? 4
const NODE = opts.node ?? 'node'

log(`config: slug=${slug} mode=${mode} batchSize=${batchSize} kb=${kbDir} skill=${skillDir}`)

// ---------------------------------------------------------------- Fetch
phase('Fetch')

const FETCH_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    videos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' }, title: { type: 'string' }, published: { type: 'string' },
          duration_seconds: { type: 'number' }, words: { type: 'number' }, path: { type: 'string' },
        },
        required: ['id', 'title', 'path'],
      },
    },
    already_extracted: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'videos', 'already_extracted'],
}

const fetched = await agent(
  `Run the transcript fetch for the channel-to-skill pipeline. Work in ${kbDir}. Node is NOT on PATH; use ${NODE}.

1. ${NODE} ${scriptsDir}/cts_fetch.js --kb-dir ${kbDir} --delay ${delay}
   Sequential yt-dlp calls, ~5s per video. Let it finish. If it stops early on a rate limit, say so in summary.
2. Read ${kbDir}/raw/manifest.json.
3. List ${kbDir}/extractions/ (may not exist). Any <id>.json there is already extracted from a previous run.

Do NOT run git commands. Return: the final "Done:" line as summary; every video with status "fetched" as videos (id, title, published, duration_seconds, words, path relative to kbDir e.g. "raw/<id>.md"); and already_extracted as the list of ids that have an extractions/<id>.json file.`,
  { label: 'fetch', schema: FETCH_SCHEMA, effort: 'low' }
)
if (!fetched) throw new Error('fetch agent failed')
const alreadyExtracted = new Set(fetched.already_extracted || [])
const toExtract = fetched.videos.filter((v) => !alreadyExtracted.has(v.id))
log(`${fetched.summary}: ${fetched.videos.length} transcripts, ${toExtract.length} to extract`)

// ---------------------------------------------------------------- Extract
phase('Extract')

const EXTRACT_SCHEMA = {
  type: 'object',
  properties: {
    files: { type: 'array', items: { type: 'string' } },
    concept_names: { type: 'array', items: { type: 'string' } },
    skipped: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, reason: { type: 'string' } }, required: ['id', 'reason'] } },
  },
  required: ['files', 'concept_names', 'skipped'],
}

const batches = []
for (let i = 0; i < toExtract.length; i += batchSize) batches.push(toExtract.slice(i, i + batchSize))

const extractions = await parallel(
  batches.map((batch, bi) => () =>
    agent(
      `You are the extraction stage of channel-to-skill for the YouTube channel "${channel}". Read each transcript below FULLY and write one JSON file per video to ${kbDir}/extractions/<id>.json (mkdir -p the directory). Read a transcript exactly once; do not re-read.

TRANSCRIPTS (paths relative to ${kbDir}):
${batch.map((v) => `- ${v.id} | "${v.title}" | ${v.published || 'undated'} | ${v.path}`).join('\n')}

WHAT TO EXTRACT: structure, not summary. This feeds a skill that lets an agent think and decide the way ${channel} does.
- thesis: ONE sentence stating the ANSWER the video delivers, not the hook. Creators bury the lede: the title poses a problem, the payoff is near the end. Find the payoff. If a "## Chapters" section exists, use it to locate it.
- concepts: each durable idea, technique, framework, or mental model the video TEACHES (not merely mentions). For each: name (the creator's own term when they have one), definition (one sentence), how (ordered steps or criteria, concrete: numbers, tools, settings, materials), when_to_use, when_not, anti_patterns (what the creator says NOT to do, and why), quotes (2-4 verbatim lines with the [h:mm:ss] timestamp from the transcript that teach it best), example (a concrete case the creator walks through, if any, 2-4 sentences).
- decision_rules: every "when X, do Y, because Z" the creator commits to. Include thresholds, defaults, numbers, rules of thumb. Each with a timestamp.
- terms: jargon the creator uses with a specific meaning, with a one-line definition.
- entities: tools, products, people, organizations named, with the role they play (recommended / rejected / compared).
- voice_notes: 2-4 observations on how the creator thinks and talks: what they dismiss, what they always reach for, recurring phrases, how they justify decisions.
- contradictions: anything that conflicts with what a same-channel video would likely say (flag only; do not resolve).

RULES
- Skip sponsor reads, intros, outros, merch, and channel promotion entirely. They are not knowledge.
- Preserve the creator's exact formulations. "The 3-2-1 rule" is not "a backup rule".
- Every quote carries its timestamp exactly as printed in the transcript, e.g. "[0:12:41]".
- Extract only what the video ACTUALLY teaches. Three real concepts beat eight padded ones.
- If a video is pure entertainment, an unboxing with no verdict, or a livestream ramble with nothing transferable, write no file and list it under skipped with a reason.

FILE SHAPE (write exactly this JSON structure):
{"video_id": "...", "title": "...", "published": "YYYY-MM-DD", "thesis": "...",
 "concepts": [{"name": "...", "definition": "...", "how": ["..."], "when_to_use": "...", "when_not": "...", "anti_patterns": ["..."], "quotes": [{"ts": "[h:mm:ss]", "text": "..."}], "example": "..."}],
 "decision_rules": [{"when": "...", "do": "...", "because": "...", "ts": "[h:mm:ss]"}],
 "terms": [{"term": "...", "definition": "..."}],
 "entities": [{"name": "...", "kind": "tool|product|person|organization", "role": "..."}],
 "voice_notes": ["..."], "contradictions": ["..."]}

Do NOT run git commands. Return files (the paths written), concept_names (every concept name across the batch), and skipped.`,
      { label: `extract:${bi + 1}/${batches.length}`, phase: 'Extract', model: 'sonnet', schema: EXTRACT_SCHEMA }
    )
  )
)
const extractOk = extractions.filter(Boolean)
const extractedFiles = extractOk.flatMap((r) => r.files)
const skippedVideos = extractOk.flatMap((r) => r.skipped)
const extractFailed = batches.length - extractOk.length
log(`Extracted ${extractedFiles.length} videos (${alreadyExtracted.size} reused), skipped ${skippedVideos.length}${extractFailed ? `, ${extractFailed} batch(es) failed: re-run to retry` : ''}`)

// ---------------------------------------------------------------- Canonicalize
// A true barrier: the taxonomy must see every extraction to dedupe concept names.
phase('Canonicalize')

const CANON_SCHEMA = {
  type: 'object',
  properties: {
    concepts: {
      type: 'array',
      items: {
        type: 'object',
        properties: { id: { type: 'string' }, title: { type: 'string' }, group: { type: 'string' }, video_ids: { type: 'array', items: { type: 'string' } } },
        required: ['id', 'title', 'video_ids'],
      },
    },
    folded: { type: 'number' },
    superseded: { type: 'number' },
    groups: { type: 'array', items: { type: 'string' } },
  },
  required: ['concepts', 'folded', 'superseded', 'groups'],
}

const canon = await agent(
  `You are the canonicalize stage of channel-to-skill for "${channel}". Merge every per-video extraction in ${kbDir}/extractions/*.json into ONE frozen taxonomy at ${kbDir}/taxonomy.json. This is the step that stops "agentic-rag", "agent-rag" and "rag-agents" from all existing. Mode: ${mode}.

READ EFFICIENTLY. Do not cat every file. Start with a compact view (node is at ${NODE}):
  ${NODE} -e 'const fs=require("fs"),d="${kbDir}/extractions";for(const f of fs.readdirSync(d)){const j=JSON.parse(fs.readFileSync(d+"/"+f));console.log(j.video_id,"|",j.published,"|",j.title);console.log("  thesis:",j.thesis);for(const c of j.concepts||[])console.log("  -",c.name,"::",c.definition)}'
Then open individual files only where names look like the same idea and you need the definitions to decide.
${mode === 'fold-in' ? `\nFOLD-IN MODE: ${kbDir}/taxonomy.json already exists. Read it first. Existing ids are FROZEN: never rename or remove one. Add new videos to existing concepts' video_ids where they fit, add new concepts only for genuinely new ideas, and bump "version" by 1.\n` : ''}
RULES
- One concept = one durable idea the channel returns to. Merge synonyms and near-duplicates; keep the creator's own name as the title and list the others as aliases.
- Page threshold = link-worthiness: a concept earns an id when it appears in >= 2 videos OR is clearly central to the channel even if taught once. Below that, fold it into the closest parent (record the fold count).
- Aim for 20-60 concepts total. A 100-video channel does not have 200 ideas.
- ids are kebab-case, stable, and descriptive: "floating-deck-foundations", not "concept-7".
- groups: 4-8 thematic groupings the SKILL.md index will use; every concept gets exactly one.
- superseded: when two videos teach the same thing and the newer one is the creator's updated position, record {video_id, superseded_by, note}. Both stay as sources; render prefers the newer.
- voice: merge every file's voice_notes into a 4-8 line profile of how this creator thinks and talks.
- contradictions: carry forward any flagged, with the two video ids.

WRITE ${kbDir}/taxonomy.json:
{"channel": "${channel}", "slug": "${slug}", "version": <1 or bumped>, "generated": "${today}",
 "groups": [{"id": "...", "title": "...", "description": "..."}],
 "concepts": [{"id": "...", "title": "...", "description": "one sentence", "aliases": ["..."], "group": "<group id>", "video_ids": ["..."], "folded_in": ["names folded into this concept"]}],
 "superseded": [{"video_id": "...", "superseded_by": "...", "note": "..."}],
 "voice": ["..."], "contradictions": [{"claim": "...", "video_ids": ["...", "..."]}]}

Do NOT run git commands. Return concepts (id, title, group, video_ids), folded (count), superseded (count), groups (ids).`,
  { label: 'canonicalize', effort: 'high', schema: CANON_SCHEMA }
)
if (!canon) throw new Error('canonicalize agent failed')
log(`Taxonomy: ${canon.concepts.length} concepts in ${canon.groups.length} groups, ${canon.folded} folded, ${canon.superseded} superseded`)

// ---------------------------------------------------------------- Render
phase('Render')

const RENDER_SCHEMA = {
  type: 'object',
  properties: { id: { type: 'string' }, path: { type: 'string' }, tokens_est: { type: 'number' }, sources_cited: { type: 'number' } },
  required: ['id', 'path'],
}
const conceptIndex = canon.concepts.map((c) => `${c.id}: ${c.title}`).join('\n')

const rendered = await parallel(
  canon.concepts.map((c) => () =>
    agent(
      `Write ONE concept page for the "${channel}" skill: ${skillDir}/concepts/${c.id}.md (mkdir -p the directory).

CONCEPT: "${c.title}" (id: ${c.id}). Taught in videos: ${c.video_ids.join(', ')}.

READ, in this order:
1. The entry for "${c.id}" in ${kbDir}/taxonomy.json (description, aliases, folded_in, superseded, voice). Use grep/node to pull just that entry.
2. ${c.video_ids.map((v) => `${kbDir}/extractions/${v}.json`).join(', ')}: the concept objects whose name matches this concept or its aliases/folded_in, plus that video's decision_rules and example.
3. Only if you need a worked example the extraction does not carry: sed the relevant slice of ${kbDir}/raw/<video_id>.md around the quote's timestamp. Do not read whole transcripts.

TEMPLATE: practitioner voice, "Use X when Y", never "the video explains". Target 1,000-1,800 tokens; density over length, never pad.

# ${c.title}

## Core Idea
<1-2 sentences: the single thing this teaches>

## How ${channel} does it
- <ordered steps or criteria; concrete numbers, tools, materials, settings; the creator's exact terms>

## When to use / when not
<the situations, and the creator's stated exceptions>

## Anti-patterns
- **<what to avoid>**: <why it fails, per the creator>

## Worked Example
<one concrete case the creator walks through, reconstructed compactly, with its timestamp. Omit the section if no video has one.>

## Key Takeaways
1. <actionable>  (3-5)

## Connects To
- [<Title>](./<id>.md): <why>   (2-5 sibling concepts, chosen ONLY from the list below)

## Sources
- [<Video title>](https://www.youtube.com/watch?v=<id>) (<published>): "<[h:mm:ss] best quote>"
  (every contributing video, newest first; a superseded video gets "(older take)" after its date)

SIBLING CONCEPTS (the only valid link targets):
${conceptIndex}

Do NOT run git commands. Return id, path, tokens_est (chars/4), sources_cited.`,
      { label: `render:${c.id}`, phase: 'Render', model: 'sonnet', schema: RENDER_SCHEMA }
    )
  )
)
const renderOk = rendered.filter(Boolean)
const renderFailed = canon.concepts.length - renderOk.length
log(`Rendered ${renderOk.length} concept pages${renderFailed ? `, ${renderFailed} failed (validate will flag them)` : ''}`)

// ---------------------------------------------------------------- Support
phase('Support')

const SUPPORT_SCHEMA = { type: 'object', properties: { path: { type: 'string' }, tokens_est: { type: 'number' } }, required: ['path'] }
const compactRules = `${NODE} -e 'const fs=require("fs"),d="${kbDir}/extractions";for(const f of fs.readdirSync(d)){const j=JSON.parse(fs.readFileSync(d+"/"+f));for(const r of j.decision_rules||[])console.log(j.video_id,r.ts,"| when",r.when,"| do",r.do,"| because",r.because)}'`
const compactTerms = `${NODE} -e 'const fs=require("fs"),d="${kbDir}/extractions";for(const f of fs.readdirSync(d)){const j=JSON.parse(fs.readFileSync(d+"/"+f));for(const t of j.terms||[])console.log(j.video_id,"|",t.term,"::",t.definition)}'`
const compactHow = `${NODE} -e 'const fs=require("fs"),d="${kbDir}/extractions";for(const f of fs.readdirSync(d)){const j=JSON.parse(fs.readFileSync(d+"/"+f));for(const c of j.concepts||[])console.log(j.video_id,"|",c.name,"| how:",(c.how||[]).join(" > "),"| when:",c.when_to_use,"| not:",c.when_not)}'`

const support = await parallel([
  () => agent(
    `Write ${skillDir}/glossary.md for the "${channel}" skill. Every significant term the creator uses with a specific meaning, alphabetized. Format one per line: **Term**: definition (concept: [id](concepts/<id>.md) when one applies). Merge duplicates across videos; keep the creator's wording. Max ~1,500 tokens.
Get the terms compactly with: ${compactTerms}
Valid concept ids: ${canon.concepts.map((c) => c.id).join(', ')}
Do NOT run git commands. Return path and tokens_est.`,
    { label: 'glossary', phase: 'Support', schema: SUPPORT_SCHEMA }),
  () => agent(
    `Write ${skillDir}/patterns.md for the "${channel}" skill: every concrete technique, procedure, or method the creator applies, as a catalog. Format:
## <Pattern name>
**When to use**: ... **How**: numbered steps with the creator's numbers/tools/settings. **Trade-offs**: ... **See**: [concept](concepts/<id>.md)
Merge the same technique taught across videos into one entry, preferring the newest formulation. Max ~2,000 tokens.
Get the material compactly with: ${compactHow}
Valid concept ids: ${canon.concepts.map((c) => c.id).join(', ')}
Do NOT run git commands. Return path and tokens_est.`,
    { label: 'patterns', phase: 'Support', schema: SUPPORT_SCHEMA }),
  () => agent(
    `Write ${skillDir}/cheatsheet.md for the "${channel}" skill. This is the most valuable file: the creator's JUDGMENT, not their vocabulary. Every line must help the reader DECIDE something the way ${channel} would. Prioritize in order:
1. Decision rules: "When X, do Y, because Z."
2. Decision trees for choices with 3+ branches (nested bullets or a small table).
3. Trade-off matrices: options scored on the dimensions the creator cares about.
4. Thresholds and defaults: the specific numbers and rules of thumb the creator commits to.
5. Tells and smells: "if you see X, you're in trouble Y."
No term definitions (glossary), no prose paragraphs (concepts). Compact tables and rules; what you'd keep on one printed page. Cite the concept page in brackets where one applies. Max ~1,200 tokens.
Get every decision rule compactly with: ${compactRules}
Also read the "voice" array in ${kbDir}/taxonomy.json and open with a 3-5 line "How ${channel} decides" block.
Valid concept ids: ${canon.concepts.map((c) => c.id).join(', ')}
Do NOT run git commands. Return path and tokens_est.`,
    { label: 'cheatsheet', phase: 'Support', schema: SUPPORT_SCHEMA }),
])
log(`Support files: ${support.filter(Boolean).map((s) => s.path.split('/').pop()).join(', ')}`)

// SKILL.md is the product: it needs the finished concept pages and support files.
const skillMd = await agent(
  `Write the entry point of the "${channel}" skill: ${skillDir}/SKILL.md, and the video index ${skillDir}/sources.md.

HARD BUDGET: SKILL.md body under 4,000 tokens (~14k chars). Compaction truncates from the END, so the most important content goes FIRST. It is the only file loaded at work time; everything else is on-demand.

READ: ${kbDir}/taxonomy.json (groups, concepts, voice, superseded). Then the "## Core Idea" and "## Key Takeaways" of each ${skillDir}/concepts/*.md (use grep -A to pull just those sections, not whole files). Skim ${skillDir}/cheatsheet.md for the top rules.

SKILL.md STRUCTURE:
---
name: ${slug}
description: "Knowledge skill distilled from ${channel}'s YouTube channel (${fetched.videos.length} videos). Use when applying ${channel}'s methods for <3-6 key topics>, deciding the way they would, or referencing what they teach about <topic>."
---
# ${channel}
**Source**: YouTube channel · **Videos**: ${fetched.videos.length} · **Concepts**: ${canon.concepts.length} · **Generated**: ${today}

## How to Use This Skill
- Without arguments: apply the core frameworks below.
- With a topic: find it in the Topic Index and read that concept file before answering.
- Decisions: read cheatsheet.md. Vocabulary: glossary.md. Procedures: patterns.md. Which video: sources.md.

## How ${channel} Thinks
<the voice profile, 4-6 lines, practitioner phrasing>

## Core Frameworks
<~1,500 tokens: the 6-10 most important named ideas as "Use X when Y" / "Prefer X over Y because Z", each linking its concept file. This is a toolkit, not a summary.>

## Concept Index
### <Group title>
- [Title](concepts/<id>.md): one-line description
(every concept, grouped by taxonomy group)

## Topic Index
- **<term or topic>** → [id](concepts/<id>.md)[, ...]
(alphabetical; aliases and folded names included so a search for any phrasing lands somewhere)

## Supporting Files
- [cheatsheet.md](cheatsheet.md): decision rules and thresholds
- [patterns.md](patterns.md): procedures
- [glossary.md](glossary.md): terms
- [sources.md](sources.md): every video, with the concepts it taught

## Scope & Limits
<what the channel covers and does not; that content is synthesized from transcripts, not the creator's words verbatim; date range of the videos>

sources.md STRUCTURE: a table, newest first: | Date | Title (linked to youtube.com/watch?v=id) | Concepts (linked) |. Mark superseded videos with "(older take)". Use ${kbDir}/raw/manifest.json for dates and titles and taxonomy.json for the concept mapping.

Every relative link must resolve. Do NOT run git commands. Return path (of SKILL.md) and tokens_est.`,
  { label: 'skill.md', phase: 'Support', schema: SUPPORT_SCHEMA }
)

// ---------------------------------------------------------------- Validate
phase('Validate')

const validation = await agent(
  `Validate the generated skill. Node is at ${NODE}. Run:
  ${NODE} ${scriptsDir}/cts_validate.js --skill-dir ${skillDir} --kb-dir ${kbDir} --write-manifest
Report its output verbatim. If it prints E3 broken links or E4 missing timestamps for a handful of pages, fix ONLY those pages (correct the link target to a valid concepts/<id>.md, or add the missing "## Sources" line from the video's extraction JSON), then run the validator once more and report the second output too. Do not rewrite pages for any other reason. Do NOT run git commands.`,
  { label: 'validate', phase: 'Validate', effort: 'low' }
)

return {
  slug, mode,
  transcripts: fetched.videos.length,
  fetch_summary: fetched.summary,
  extracted: extractedFiles.length,
  extract_reused: alreadyExtracted.size,
  extract_failed_batches: extractFailed,
  skipped_videos: skippedVideos,
  concepts: canon.concepts.length,
  groups: canon.groups,
  folded: canon.folded,
  superseded: canon.superseded,
  rendered: renderOk.length,
  render_failed: renderFailed,
  skill_md_tokens: skillMd?.tokens_est ?? null,
  validation,
}
