---
name: explainer-video
description: Make short animated explainer videos built entirely in code with Remotion and three.js, in one or more of 21 visual styles (toy brick, cut-paper collage, paper shadowbox, woodblock print, pixel diorama, neon megacity, raymarched sci-fi, cartoon 3D, mono motion graphics, ink scroll, watercolour and more), any aspect ratio, with local narration, word-synced captions and synthesised music. Use when asked for an explainer video, an animated short, a vertical short or reel, "make a video about X", a narrated animation, a fact-checked short, or to try several video styles side by side. With no style named, it asks which styles to build; several picks render from one script and play side by side.
---

# Explainer Video

Make a narrated, captioned explainer in which every frame is computed by code: SVG, canvas, shaders and three.js scenes inside a Remotion project. No image model, video model, stock art or footage. One script and one narration drive every style, so several styles can be built from the same story and compared side by side.

## Inputs

| Input | Default |
|---|---|
| Topic, or a finished script | required |
| Styles | none: ask (step 1) |
| Aspect ratio | ask with the styles; 9:16 for a "short" or "reel", 16:9 for a "video" or "explainer for YouTube"; any W:H works (1:1, 4:5, 21:9) |
| Length | short: 40 to 55 words, under 20 s |
| Narration | on, voice `af_heart`; `--silent` for a style piece with music only |
| Project folder | the one the user names, else `./<topic-slug>-explainer` |

## 1. Pick styles

If the user named styles, map each to an id in [styles/README.md](styles/README.md) (they may use the display name). Otherwise read that catalogue, choose two to four that suit the topic (its "Choosing" list helps; mix rows for a useful comparison), and ask the user to pick one or more:

- With an ask-the-user tool (Claude Code `AskUserQuestion`): one multi-select question with your recommended styles as options (up to four, each with its one-line look), and say in the question that any other id from the catalogue can be typed in. When the aspect ratio is not given, ask it in the same call (9:16, 16:9, 1:1).
- Without one: post the catalogue's ids and looks as a numbered list, recommend two to four, ask for numbers or ids and the aspect ratio, and stop until the user answers.

One style makes one film. Two or more make one film per style plus a side-by-side comparison.

## 2. Check tools

Check before scaffolding, and report what is missing with the step it blocks:

- `node --version` 20 or newer, `npm`, `ffmpeg -version` and `ffprobe -version`.
- Each project's `npm install` takes about 1.5 GB while you work; step 10 offers to delete it when the film is done. The first render downloads Remotion's headless Chrome. The first narration downloads the Kokoro voice (about 90 MB, into `~/.cache/explainer-video/models`, override `EXPLAINER_MODEL_DIR`) and builds whisper.cpp with its `base.en` model (about 220 MB, into `~/.cache/explainer-video/whisper`, override `EXPLAINER_WHISPER_DIR`, model `EXPLAINER_WHISPER_MODEL`); both caches are shared by later projects. Building whisper needs a C compiler (Xcode Command Line Tools on macOS); without it narration still works, with estimated word times.

## 3. Scaffold

```bash
node <skill>/scripts/new-project.mjs --dir <project> --aspect 9:16 --styles toy-brick,ink-scroll --title "<title>"
```

`<skill>` is the folder holding this file. The script copies [template/](template/) (a Remotion project with the shared kit and tools), sets the size (the short side is 1080 px; `--short` changes it), adds a stub scene per style and runs `npm install`. Re-running it on an existing project adds styles or changes the aspect ratio without touching scenes, data or audio. Every later command runs inside `<project>`.

## 4. Script

Follow [references/script.md](references/script.md): find the hook, write `script.json` with a spoken (`say`) and a shown (`show`) form of each line, fact-check every claim on the web and keep the sources, then write `shots.md` (one shot per line: picture, camera, the event on a named word, the explainer device, the transition, the sound). Every style is built from the same `shots.md`.

## 5. Narrate

```bash
node tools/narrate.mjs            # or --silent for no voice
```

It writes the voice, word timings, caption pages and beats, and sets the film's length. Confirm the summary's `timing` says `whisper base.en`; with `estimate`, check the stills at key words more carefully.

## 6. Build each style

Read [references/kit.md](references/kit.md) once per project. For each style: read `styles/<id>.md` and the [references/techniques.md](references/techniques.md) sections it links, then write `src/styles/<id>/Scene.tsx` (helpers go beside it) and `scores/<id>.json` ([references/audio.md](references/audio.md)), and run `node tools/synth.mjs --style <id>`.

Recompose for the project's aspect ratio rather than cropping: tall frames stack subjects, wide frames set them side by side, and nothing that matters enters the bottom quarter on a tall frame (captions live there).

With three or more styles and a host that has subagents, give each style to its own subagent: the project path, the style id, the path to its style file, `kit.md`, and `shots.md`. Each one writes only `src/styles/<id>/` and `scores/<id>.json`, runs synth and stills for its own style, and reports its stills. Shared files (`script.json`, `src/data`, `src/lib`, `tools`) are read-only to them.

## 7. Check stills, then fix

```bash
npx tsc --noEmit
node tools/render.mjs --stills --styles <id>      # one still per beat
```

Open every still and check it against the style file's "Check the stills" list, the shot list (is the event of each beat visible?), and legibility (captions clear of the picture, numbers readable at phone size, nothing important cut off). Fix the weakest problem and re-render, up to three rounds per style. Use `--frames a,b,c` to look at the frames where key words land. If a still is still weak after three rounds, render anyway and name the problem in the report.

## 8. Render

```bash
node tools/render.mjs
```

Films go to `out/<id>.mp4`. With two or more styles it also writes `out/compare.mp4` (all styles in a labelled grid, playing in sync, narration once) and `out/compare.html` (the same films with play, scrub and per-style sound; open it with a `file://` URL). Check each film with `ffprobe`: its duration matches `durationInFrames / fps` and it has an audio stream. Look at two frames from the final file.

## 9. Report

Give the film paths, the comparison paths when there are several styles, the script with its sources, the timing mode, and anything that fell short of the style or the shot list.

## 10. Free the space

After every finished render (the first one and every re-render after a change), measure `<project>/node_modules` with `du -sh` and ask with `AskUserQuestion` whether to delete it. Make "Delete node_modules (Recommended)" the first option and "Keep it" the second, and put the measured size and the reinstall command in the question. On "delete", run `rm -rf <project>/node_modules` and nothing else: keep `package-lock.json`, `src/`, `public/`, `scores/`, `out/` and the shared caches under `~/.cache/explainer-video`. Say how much space came back.

## Changes and reuse

- Before any change, check that `<project>/node_modules` exists. If it was deleted, run `npm install` in the project first (the lockfile brings back the same versions; it takes a minute or two and about 1.5 GB, and the next render downloads Remotion's headless Chrome again, which lives inside `node_modules`). The voice model and whisper stay in the shared cache, so narration needs no new download.
- Asked to change a film ("slower", "warmer light", "bigger counter"): edit that style's scene or score and re-render only it (`--styles <id>`). The rest stays the same because the code is the film.
- Script changes move every word time: re-run `narrate.mjs`, then `synth.mjs` for each style, then stills.
- A finished scene is an engine for its look. Copy `src/styles/<id>/` into a new project and key it to the new script for the same look on a new story.
- Adding a style later: re-run `new-project.mjs --dir <project> --styles <new-id>`.

## References

| File | Read when |
|---|---|
| [styles/README.md](styles/README.md) | Picking styles |
| `styles/<id>.md` | Building that style |
| [references/script.md](references/script.md) | Writing and fact-checking the script, `script.json`, `shots.md` |
| [references/kit.md](references/kit.md) | Before the first scene: project layout, timeline, motion, captions, canvas, shaders, 3D, known problems |
| [references/techniques.md](references/techniques.md) | The sections a style file links: how each look is built in code |
| [references/audio.md](references/audio.md) | Writing a score: instruments, kits, effects, mix |
