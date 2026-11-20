---
"timothyjoh-skills": minor
---

Add `explainer-video`, a model-invoked media skill: make a narrated, captioned explainer video drawn entirely in code with Remotion and three.js, in one or more of 21 styles, at any aspect ratio.

- 21 style files: paper and print (cut-paper collage, paper shadowbox, construction paper, editorial collage, woodblock print, watercolour, retro-futurism), illustration and cartoon (painted anime, TV cartoon, quirky absurd, flat vector science, ink scroll, cartoon 3D), 3D and cinematic (toy brick, pixel diorama, neon megacity, raymarched sci-fi, holographic 3D, map desk), and motion graphics (mono motion graphics, data 3D). Looks adapted from AI Samson's Claude Video Prompt Library; styles that used an image model there are rebuilt to be drawn in code.
- With no style named, the agent recommends two to four and asks you to pick one or more. Several picks render from one script, narration and shot list, plus a side-by-side MP4 and a local HTML page that plays them in sync.
- A Remotion project template with a word-keyed timeline, captions that show digits while the voice says the words, canvas and shader helpers, and a film pass for three.js (bloom, depth of field, grade, grain, letterbox).
- Local narration with Kokoro and word timings from whisper.cpp aligned to the script; music and effects synthesised in code from a small score file per style, mixed 20 dB under the voice.
- After each finished render it offers to delete the project's `node_modules` (about 1.5 GB) and reinstalls it before the next change.
