## What it does

`explainer-video` makes a short narrated explainer (a vertical short, a reel, or a wide video) in which every frame is computed by code: SVG, canvas, shaders and three.js scenes inside a Remotion project. It writes and fact-checks the script, narrates it with a local Kokoro voice, times captions and events to the spoken words, synthesises music and sound effects in code, and renders an MP4.

The defining constraint: no image model, video model, stock art or footage. The code is the film, so a character never drifts, a re-render gives the same frames, and a change ("slower", "warmer light") is an edit to the code that leaves the rest alone.

## When to reach for it

The agent reaches for it when you ask for an explainer video, an animated short, a vertical short or reel, a narrated animation, "make a video about X", or to try several styles side by side. Name one or more of the 21 styles, or name none and it asks you to pick, with two to four recommendations for your topic. Any aspect ratio works: 9:16 and 16:9 are the usual ones, and 1:1, 4:5 or 21:9 are fine.

For a 3D motion graphic with an HTML player in one of Futurepedia's atlas looks, use `threejs-3d-styles`. To run several third-party video skills on one brief and compare them, use `video-lineup`.

## Prerequisites

Node 20 or newer, `npm`, `ffmpeg` and `ffprobe`. Each project installs about 1.5 GB of packages. After each finished render the agent offers to delete them (recommended) and reinstalls them with `npm install` when you ask for a change. The first narration downloads the Kokoro voice (about 90 MB) and builds whisper.cpp with a small model (about 220 MB) into a shared cache under `~/.cache/explainer-video`; building whisper needs a C compiler, and without one the word timings are estimated instead.

## The styles

Paper and print: cut-paper collage, paper shadowbox, construction paper, editorial collage, woodblock print, watercolour, retro-futurism. Illustration and cartoon: painted anime, TV cartoon, quirky absurd, flat vector science, ink scroll, cartoon 3D. 3D and cinematic: toy brick, pixel diorama, neon megacity, raymarched sci-fi, holographic 3D, map desk. Motion graphics and data: mono motion graphics, data 3D.

Each style file says how the look is built in code (printing plates through a shader, paper-piece systems, 2D puppets, billboards in a toon world, instanced bricks, one raymarching shader, pixel sprites in a lit diorama) and how it draws the usual explainer devices: the hook number, the crowd where one figure lights up, the map, the comparison, the reversal and the payoff question.

The looks are adapted from the films in AI Samson's Claude Video Prompt Library. Styles that used an image model there are rebuilt here to be drawn in code.

## Several styles, one story

Every style is built from the same script, narration and shot list, so a comparison shows the looks rather than different stories. With two or more styles you get one MP4 per style, a labelled side-by-side MP4 with the narration, and a local HTML page that plays them in sync with per-style sound.

## It's working if

- Each film's events (a number counting up, a figure lighting up, a stamp on the reversal) land on the word that names them, and the captions show digits where the voice says the number.
- The film looks like its style in every still, with nothing important under the captions or cut off by the aspect ratio.
- Re-rendering a style without changes gives the same film.
- With several styles, the comparison plays them in sync and each one sounds like its own material (paper, plastic, ink, synth).
- The report lists the script's sources.
