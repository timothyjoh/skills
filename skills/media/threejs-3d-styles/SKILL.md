---
name: threejs-3d-styles
description: Make short 3D motion-graphic videos (explainers, stories, product shots, title cards) in three.js, built entirely in code, in one of 37 ready-made visual styles from the 3D Style Atlas (Low-Poly, Paper Pop-Up, Soft Clay, Neon Sign, Exploded View, Glass and Light, Data Skyline, Monument Type and more). Use when asked for a three.js video, 3D explainer, animated explainer, motion graphic, 3D title card or product animation, or when a style from the atlas is named. Picks the best-fitting style for the content, or uses the one the user names, then builds a self-contained HTML player and can render an MP4.
metadata:
  origin:
    author: Futurepedia
    url: https://www.futurepedia.io/resources/3d-style-atlas/view
---

# three.js 3D Style Atlas

37 looks for short 3D animated pieces, each built entirely in code: no models, images or textures. Every style comes with a complete reference animation (on its own sample topic) that runs on a small shared rendering kit and sound kit. You use the reference as the style guide and rebuild the animation around the user's content.

Source: the Futurepedia "3D Style Atlas" (each style's "Copy prompt" brief), captured on 2026-11-15. The style cards, reference sources and `lib/` kits are Futurepedia's work and are not covered by this repo's MIT license; see [ORIGIN.md](./ORIGIN.md).

## Files

- `styles/NN-<id>.md`: one per style. It holds the style card (look, motion, light, materials, camera, finish, good for), the fonts, which libraries it needs, and the **complete reference style source**. The source is long (20-75 KB), so read the card first and then the source.
- `lib/stage.js`: the STAGE rendering kit. It provides globals `K` and `registerStyle`, accumulation rendering (motion blur, depth of field, soft shadows), bloom, grade and a 2D overlay.
- `lib/sound.js`: the SOUND kit (`SOUND.live`, `SOUND.renderOffline`, the `k.play(...)` score API).
- `lib/strokefont.js`: the STROKEFONT library (only for styles that use `STROKEFONT`).
- `lib/text3d.js`: the TEXT3D library, solid 3D letters from a loaded font (only for styles that use `K.text3d` / `K.textShapes`; load it after stage.js).

Each style file lists exactly which libraries it needs. Inline the libraries **unchanged**: concatenate them into the HTML with a shell step instead of retyping them. To learn the APIs, read the headers of `lib/stage.js` and `lib/sound.js` and see how the reference source calls them.

## Step 1: Pick the style

If the user named a style, use it. Otherwise match their content to the "Good for" column and pick the best fit. Briefly say which style you chose and why, and name one or two alternatives. If several fit equally well and the choice really matters to them, ask.

`use` sets the kind of piece. **explainer** and **story** tell a process or a story over several beats. **product** shows one product or feature. **title** is a short statement, list or name.

| # | id | Style | Category | Use | Good for |
|---|----|-------|----------|-----|----------|
| 01 | `low-poly` | Low-Poly | Filters over 3D | explainer | Processes that happen in a place: cycles, journeys, supply chains, how a system of parts feeds itself |
| 02 | `paper-pop-up` | Paper Pop-Up | Material worlds | story | A story or a process in a few steps: one spread per step, one big subject, one short line of words on a paper ribbon |
| 03 | `soft-clay` | Soft Clay | Material worlds | explainer | A few friendly objects on a table: amounts as piles and stacks, growth and comparison, simple characters, a number as fat clay letters |
| 04 | `tiny-diorama` | Tiny Diorama | Spaces and journeys | explainer | Places, systems and journeys: a few stops and something that travels between them |
| 05 | `blueprint-build` | Blueprint Build | Diagrams with depth | explainer | Plans, set-ups and how-it-is-made: the flat drawing first, then the object, with dimensions and numbered pointers |
| 06 | `spotlight-stage` | Spotlight Stage | Spaces and journeys | story | Stories, history, fables and step-by-step scenes |
| 07 | `neon-sign` | Neon Sign | Flat content made physical | explainer | How something works, as a diagram that switches on in the order it happens |
| 08 | `exploded-view` | Exploded View | Diagrams with depth | explainer | How something is built or what is inside it: any object made of parts |
| 09 | `marble-run` | Marble Run | Machines that explain | explainer | Sorting, routing and filtering: many items taking different paths through the same rules |
| 10 | `x-ray` | X-Ray | Filters over 3D | explainer | What is inside something and how it works: anatomy, machines, products, buildings |
| 11 | `led-wall` | LED Wall | Flat content made physical | story | Any 2D animation, diagram or story drawable at lamp resolution: fables, tracks, growing charts, maps, game-like sequences |
| 12 | `inflated` | Inflated | Material worlds | explainer | Explainers or stories told with a few simple inflated objects and characters |
| 13 | `painted` | Painted | Filters over 3D | story | Stories, journeys and processes in a place, as a picture book: how something is made, a day in a life, cause and effect |
| 14 | `circuit-city` | Circuit City | Spaces and journeys | explainer | Journeys and pipelines: something travels through a system and each stage does its part |
| 15 | `glass-light` | Glass and Light | Material worlds | explainer | Recipes, mixtures, ratios, amounts, chemistry: anything that fills, pours, layers or changes colour |
| 16 | `factory-line` | Factory Line | Machines that explain | explainer | Any step-by-step process: input rides a belt, each labelled station changes it, the result is presented |
| 17 | `white-model` | White Model | Diagrams with depth | explainer | How something flows through a system: energy, water, money, data, people |
| 18 | `voxel` | Voxel | Filters over 3D | explainer | A small model that builds up in stages: how something grows, is made or is put together |
| 19 | `data-skyline` | Data Skyline | Diagrams with depth | explainer | Any list of labelled values: a comparison, a ranking or a series over time |
| 20 | `ink-toon` | Ink and Toon | Filters over 3D | explainer | Steps, recipes and how-tos: one bold action per step on the same hero object, big lettered words |
| 21 | `pin-wall` | Pin Wall | Flat content made physical | explainer | Moving reliefs or greyscale pictures: terrain, waves, growth, rising charts, morphing shapes |
| 22 | `toy-blocks` | Toy Blocks | Material worlds | explainer | Lists, comparisons, proportions, steps and "the building blocks of X" |
| 23 | `particle-swarm` | Particle Swarm | Flat content made physical | explainer | Things that flow, gather, split, grow, heat up or burst; things made of many units |
| 24 | `museum-gallery` | Museum Gallery | Spaces and journeys | explainer | Lists and timelines of 3-5 points: one framed poster with a plaque per point, visited in order |
| 25 | `pencil-sketch` | Pencil Sketch | Filters over 3D | explainer | How something is built, step by step: parts drawn in order, each with a numbered note |
| 26 | `domino-chain` | Domino Chain | Machines that explain | explainer | Cause and effect, chain reactions, plans and anything that compounds |
| 27 | `node-network` | Node Network | Diagrams with depth | explainer | Things and the connections between them: spread, referrals, teams, systems, flows |
| 28 | `shadow-box` | Shadow Box | Flat content made physical | explainer | Sequences with a natural order in depth: timelines, eras, layers of a system, before and after |
| 29 | `layer-stack` | Layer Stack | Diagrams with depth | explainer | Anything built in layers: a tech stack, a product teardown, a request travelling through a system |
| 30 | `dithered` | Dithered | Filters over 3D | explainer | An object or small set-up staged like a still life, with desktop windows carrying the numbers |
| 31 | `floating-screens` | Floating Screens | Products and screens | explainer | Anything made of steps or screens: an app flow, a workflow, a set of stats or quotes |
| 32 | `device-hero` | Device Hero | Products and screens | product | An app or feature: the device first, then 2-3 interface elements acting out what the feature does |
| 33 | `studio-product` | Studio Product | Products and screens | product | One product and one claim |
| 34 | `split-flap` | Split-Flap Board | Flat content made physical | title | Lists, rankings and numbers: one fact per row, revealed top to bottom, the key row in colour |
| 35 | `hero-icon` | Hero Icon | Products and screens | title | A tool, product or idea as one object |
| 36 | `embossed` | Embossed | Flat content made physical | title | A quote, name, number or simple logo pressed into a material |
| 37 | `monument-type` | Monument Type | Spaces and journeys | title | A short statement of 2-5 words where one word is the point |

## Step 2: Get the inputs

- **Content.** This is the topic or script. If the user hasn't given one, ask for it before building.
- **Voiceover?** If they have a voiceover, get its SRT or word-level timestamps. If they only have the audio file and you can transcribe it with word-level timestamps, do that instead of asking. Voiceover mode changes the rules below. They are marked **[VO]** and **[no VO]**.
- **Storyboard first?** The default is yes. Skip it only if the user says so.

## Step 3: Storyboard first (default)

Before building the animation, make a VISUAL storyboard and wait for the user's OK.
- Make one HTML page (show it as an artifact if you can) with a grid of panels, one per beat: about 3-6, more if a voiceover is long. Each panel is a still of that beat's key frame, rendered with the STAGE kit from a block-out of the scene. Use simple forms in the reference's materials, lighting, camera angle and grade, so the panels already look like the finished piece. Render the stills one after another on one canvas with `S.seek(time)` at about 16 samples, which is enough for depth of field and soft shadows to read, and copy each into an image. Stills only: no animation or sound yet.
- Under each panel, write the beat number, its start and end time (**[VO]** taken from the voiceover timing), the exact on-screen text, what moves or changes to get there from the previous panel, what the camera does, and its key sounds.
- Below the grid, list any facts or numbers you had to assume.

When the user approves (or after their changes), build the full animation exactly as storyboarded, reusing the storyboard's scene code.

## Step 4: What to build

Build one self-contained HTML file (show it as an artifact if you can):
- three.js **0.187.0** core only, loaded as an ES module from a CDN with an import map (no addons). Then set `window.THREE = THREE` before running the kit and the style code.
- A 1920x1080 canvas scaled to fit the window, with a small control bar: play/pause, a scrub slider, the time, a sound toggle, and loop on by default.
- **[VO]** A "Load voiceover" button: a file input that also accepts drag-and-drop of an audio file. Once a file is loaded, the audio is the clock: play, pause and scrub control the audio element, and every frame is `S.seek(audio.currentTime)`. Without a file, the piece runs on its own clock.
- A new style object, built the same way as the reference (content block first, then `build(S)` returning `update(t)`), that tells the user's content in this style. Duration: **[no VO]** 7-12 seconds unless the content needs more. **[VO]** The end of the last voiceover line plus about 1 second.
- Run it with the kit: `const S = await K.run(canvas, style, { samples })`. Use a low sample count (2-4) while playing live and the style's full count when rendering frames. Expose `window.seek = (t) => S.seek(t)` and `window.DURATION`.
- Play the style's `sound(k)` score in sync from the player. On play, call `stopSound = SOUND.live((k) => style.sound(k), currentT, { voiceover })`. Call `stopSound()` on pause, on seek and when the sound toggle is turned off.
- Include `lib/stage.js` and `lib/sound.js` unchanged, plus `lib/strokefont.js` and/or `lib/text3d.js` (after stage.js) if the style file lists them.
- Load the style's Google Fonts (listed in its style file) before building. The kit awaits the specs in `style.fonts`.

## How to stay in the style

- The reference shows the look, not the story. Its objects, layout and beats belong to its own topic, so don't reuse them unless the content calls for them. Work out what the content needs to show first, then build those things in this look.
- For **explainer** and **story** styles only: tell the content as an explainer (or a story), not a title card. Things happen to objects or characters over **[no VO]** three or four beats / **[VO]** beats that follow from each other, and the picture does the telling. Words are small captions and labels, never the subject of a shot. End on the result of the process or the end of the story, not on a headline, slogan or logo.
- Keep the reference's materials, lighting, camera language, grade and the way things move. Change the story, the objects and the words, but not the look.
- `update(t)` must set the whole scene for time t, and nothing may build up between calls, because the kit calls it many times per frame to make motion blur, depth of field and soft shadows. No `Math.random`, `Date` or timers: use `K.rng(seed)`.
- Build everything in code: no downloaded models, images, HDRIs or textures.
- Simple forms, beautifully lit and finished, beat complicated models that look wrong. Draw the subject accurately and double-check any facts or numbers you show.
- It is video, often watched on a phone. Keep every word the story needs large, sharp and on screen long enough to read. Keep the subject filling most of the frame, and keep everything that matters inside the frame for the whole camera move. The first frame should already be worth looking at, and the last second should hold.

## [VO] Timing from the voiceover

- First turn the voiceover timing into a BEATS table in the content block: one entry per idea, with its start and end time, the words spoken, and what happens on screen. Every move reads its times from BEATS (and from word times when you need an exact reveal), never from numbers scattered through the code, so a new take only means editing the table. If you only have line times, estimate each word's time from its position in its line, and leave room in the table for real word timestamps.
- A visual lands on the word it illustrates: a number appears as it is spoken, a label as its name is said. It can lead the word by up to 0.2 s, but never lag it.
- Within a beat, keep building that one idea while the voice explains it, then hold the finished state until the sentence ends instead of rushing ahead. Use pauses in the speech for the bigger changes.
- On-screen text is key words, labels and numbers only. Don't print the sentence being spoken, and no subtitles (captions get added in editing).
- Start as the first line is spoken, and end about 1 second after the last word, on the result.

## Flow between beats

- A new beat does not automatically mean a new scene. When the next idea builds on the last, stay in the same world: the things that matter stay on screen and move, grow, re-arrange or transform, and the camera travels to the part of the scene where the next idea happens.
- When the story really moves on (a new place or time, a before/after contrast, a reveal), change scene the way this look would: a turn of the set, a page, a passing object that wipes the frame, a change of light. No hard cuts.
- The reference's scene count is not a template. **[no VO]** Fit the number of beats to the content. **[VO]** A long voiceover needs more ground to cover, so plan a bigger world or several sets, and keep the camera on one slow, continuous move through them.

## Sound

**[no VO]** A fuller mix:
- A sound starts on the exact frame its event appears. Drive picture and sound from the same schedule, as the reference does.
- Score the events that land (things arriving, labels, contacts, transitions, the key number, the result) with sounds this material would make: glass, plastic, paper, metal, motors.
- A quiet ambience bed is welcome, and music only if it suits the style. Keep effects in front, bed and music clearly underneath, and leave small silences so the big hits read.

**[VO]** The narration stays on top, and the effects keep the piece alive underneath:
- Score it as fully as a standalone piece: the events that land and the sounds this material would make while things move.
- Mark the small, frequent sounds `{ minor: true }` (ticks, taps, typing, small pops), or schedule custom ones inside `k.withMinor(() => ...)`. In voiceover mode the kit plays those at about 60% volume, drops ambience beds and music, and sets everything a little lower, so pass `{ voiceover: true }` to `SOUND.live` and `SOUND.renderOffline`.
- Keep the big hits (the key reveal, the result) at full volume and, where you can, put them in pauses or on stressed words rather than on top of a sentence.
- A sound starts on the exact frame its event appears: drive picture and sound from the same BEATS times.

## Step 5: Render an MP4 (when you have a shell)

Render in headless Chrome/Chromium with the GPU enabled. Load the page, call `window.seek(i / 30)` for every frame, capture the canvas and pipe the frames into ffmpeg. Render the sound with `SOUND.renderOffline((k) => style.sound(k), DURATION, 48000, { voiceover })` and mux it in at about -15 LUFS. Look at a few rendered frames and fix framing, lighting or legibility problems before calling it done.

**[VO]** Mix in the voiceover with the effects ducked under it:

```
ffmpeg -i video.mp4 -i voice.wav -i effects.wav -filter_complex "[1:a]loudnorm=I=-17:TP=-2,asplit=2[v1][v2];[2:a]loudnorm=I=-26:TP=-4:LRA=20[fx0];[fx0][v1]sidechaincompress=threshold=0.05:ratio=3:attack=10:release=250[fx];[v2][fx]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 160k out.mp4
```
