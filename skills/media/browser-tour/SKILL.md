---
name: browser-tour
description: Drive Claude-in-Chrome through a live, narrated, pausing tour of web pages. Four modes, a research tour (visit the sources that stood out from a research pass and narrate the story), a product wizard tour (walk a live web app feature by feature), a plan-narration tour (walk the current UI before implementing a plan, showing what will change and why), or a post-implementation demo tour (walk the updated app showing what changed this cycle). Use when the user asks to be "walked through", "shown around", or given a "tour" of a topic or a web app, asks for a narrated demo or walkthrough in the browser, wants a plan narrated against the live UI before coding starts, or wants a demo of what was just built or changed.
---

# Browser Tour

Four modes, one mechanic: navigate to one real page per stop, ground the narration in what is actually on that page, then **stop talking and wait for the user's next chat message** before advancing. Never auto-chain stops. The pause is a full turn. The user might ask a question, react, say "next", or say "let's stop here and do X instead." Treat all of those as valid; only a literal "next", "continue", or "go on" means advance to the next stop.

This is deliberately chat-turn-paced, not an in-page click overlay. The point is that the user can have a mid-tour discussion about what they just saw before moving on.

## Prerequisites

The Claude-in-Chrome browser extension and its MCP tools (Claude Code). Audio narration is optional and uses the `chatterbox-tts` or `inworld-tts` skill installed beside this one.

## Setup

Load the browser tools once, in a single batched call, before starting:

```
ToolSearch: select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__get_page_text
```

Call `tabs_context_mcp` (createIfEmpty: true) once at the start to get a tab to drive.

## Mode 1: Research tour

1. **Scope**: confirm the topic and, if it is broad, the angle (era, mixture of media types, a specific question to answer).
2. **Research**: use WebSearch and WebFetch (or delegate to a research skill for real depth) to find real sources and build a chronological or logical itinerary, typically 6 to 10 stops. Curate for the ones that actually stood out, not everything found.
3. **Present the itinerary** briefly (one line per stop) before starting, so the user knows the shape of the tour.
4. **Per stop**:
   - Navigate to a page that actually shows the thing, not one that just describes it. Prefer a page with the embedded image, GIF, or video playable in place (a Know Your Meme entry, a YouTube page, an official gallery or article with inline media) over a plain-text reference page.
   - **Wikipedia is a research source, not a tour stop.** Pull facts and dates from it beforehand, but open something more visual for the actual stop when the subject is visual or watchable.
   - Ground the narration in the real page content (`get_page_text` or `read_page`), not memory. Quote or paraphrase specifics; do not hallucinate.
   - Narrate: what this stood out for, the concrete mechanism behind why it spread or mattered, how it connects to the last stop. A few tight paragraphs, not an essay.
   - **Do not preview what is next.** End on the current stop's content, or offer one to three options to go deeper on the *current* topic (a related figure, a follow-up clip, a tangent). Never say "next up is X"; let the next stop be a surprise.
5. Stop. Wait for the user's turn.

## Mode 2: Product wizard tour

1. **Scope**: confirm the app or URL and which flow to walk ("show me signup", not "show me everything"). Ask if it is ambiguous.
2. **Per step**:
   - Navigate or click to reach the feature being shown.
   - Narrate what it does and why it matters to the flow.
   - Never submit real forms, complete purchases, or take irreversible actions without explicit per-action go-ahead. Cosmetic-only interactions (viewing, hovering, optionally a JS-injected highlight outline via `javascript_tool`) are fine on their own.
   - Stop. Wait for the user's turn before the next step.
3. Same "do not preview what is next" rule as Mode 1: end on the current feature, optionally offering to go deeper on it (edge cases, "what happens if I...", settings) rather than teasing the next step.

## Mode 3: Plan narration tour (pre-implementation)

Use before writing code for a plan, to walk the user through the *current* live UI and narrate what will change and why. A good place to catch a wrong assumption before any code exists.

1. **Identify the plan**: the plan just produced in this conversation (from plan mode, say), or a plan doc the user points to.
2. **Ask about audio narration** (see "Audio narration" below) before starting.
3. **Get the app running**: check for an existing project convention (a `run` skill, `package.json` scripts, `docker-compose`) and start or confirm a local dev server. If there is no runnable local app, use the staging URL instead (ask for it if not obvious). Ask first if it is ambiguous which command starts it, or if starting one might collide with something already running.
4. **Map plan to pages**: for each concrete change in the plan, identify the route, page, or component it touches in the running app today. Skip parts of the plan with no visible UI surface (pure backend or refactor work).
5. **Per stop**:
   - Navigate to the page as it exists *today*.
   - Optionally highlight the specific area that will change with a cosmetic-only outline via `javascript_tool` (no functional page changes, nothing submitted).
   - Narrate: what this area does today, and what the plan will change here and why, grounded in the actual plan text, not a loose paraphrase.
   - If audio is on, synthesize and play the narration (see below) before pausing.
   - Stop. Wait for the user's turn. This is a good moment for them to correct the plan itself, not just react to it.
6. Same "do not preview what is next" and guardrail rules as the other modes.

## Mode 4: Post-implementation demo tour

Use after a plan's work is done (after code review passes, or when the user asks to see what changed) to demo the result.

1. **Find what actually changed**: `git diff` and `git log` against the point the work started (a commit, branch point, or PR base), rather than relying on memory of the original plan. Code review may have altered the plan's scope.
2. **Ask about audio narration** (see below) before starting.
3. **Get the updated app running**: same considerations as Mode 3 (local dev server or staging, whichever actually has the new build).
4. **Map changed files to pages and features** actually visible in the UI; skip pure refactors and tests with no visible surface.
5. **Per stop**: navigate to the now-updated page or feature, narrate what changed and demonstrate it (click through the new behavior if safe and reversible; no real submits or purchases, per the shared guardrails), play synthesized narration if audio is on, then pause.
6. After the **last** stop only, close with a short wrap-up paragraph of everything shown. This is the one exception to "do not preview what is next," since there is nothing left to preview.

## Audio narration (Modes 3 and 4, optional in 1 and 2 on request)

At the start of Mode 3 or 4, ask the user whether they want audio narration for the tour, and if so which engine. Both live as sibling skills; resolve their scripts relative to this skill's folder:

- **chatterbox-tts**: free, fully local, via `../chatterbox-tts/scripts/chatterbox-tts.sh`.
- **inworld-tts**: paid cloud API, premium quality and a wider voice catalog, via `../inworld-tts/scripts/inworld-tts.sh`.

If enabled, per stop:

1. **Write the spoken-narration text separately from the on-screen narration.** It must be:
   - Plain, conversational language. No markdown, links, code, or flowery phrasing. Write it the way you would actually say it out loud.
   - Understandable to a 10th-grade reader: short sentences, common words, no jargon left unexplained.
   - Concise. Say the one or two things that matter about this stop, not everything you would write on screen. Long narration is more likely to hit a TTS length limit and get cut off mid-sentence, and it drags the pacing of the tour regardless.
2. **Print that exact spoken-text string to chat, verbatim, before generating audio from it**, labeled clearly (under a "Narration:" line) so the user can read along and, if playback ever sounds cut off, immediately tell whether the *audio* got cut short or the *text itself* was already that short. Do not paraphrase it after the fact: what is printed must be the literal string passed to the TTS script.
3. Generate the audio with the chosen script from that exact string, then play it back with `afplay <path>` (blocking, so the pause naturally follows the narration finishing) before waiting for the user's turn.

## Shared guardrails

- One real page per stop, narration grounded in what is actually loaded.
- Never chain multiple stops in one turn. The pause is the point.
- No real credentials, purchases, or destructive or irreversible actions ever, in any mode.
- If a page is geo-blocked, paywalled, or will not load, say so plainly and offer an alternative (a different source, a written account) rather than trying to route around the restriction.
