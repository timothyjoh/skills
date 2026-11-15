## What it does

`threejs-3d-styles` makes a short 3D motion-graphic video (an explainer, a story, a product shot or a title card) in three.js, in one of 37 ready-made looks from Futurepedia's 3D Style Atlas: Low-Poly, Paper Pop-Up, Soft Clay, Neon Sign, Exploded View, Glass and Light, Data Skyline, Monument Type and more. The output is one self-contained HTML player, and an MP4 when a shell with headless Chromium and ffmpeg is available.

Everything is built in code: no models, images, HDRIs or textures. Each style ships a complete reference animation on its own sample topic, and the skill keeps that style's look while rebuilding the story, objects and words around your content.

## When to reach for it

The agent reaches for it when you ask for a three.js video, a 3D explainer, a motion graphic, a 3D title card or a product animation, or when you name one of the atlas styles. Name a style to use it; otherwise the agent picks the best fit from the style table and names one or two alternatives.

## Prerequisites

None to get the HTML player. Rendering an MP4 needs Chromium or Chrome (headless, GPU enabled) and `ffmpeg`.

## Storyboard, then build

By default the agent first renders a storyboard: one still per beat in the finished look, with timings, on-screen text, camera moves and key sounds. It builds the full animation only after you approve. With a voiceover (an SRT or word-level timestamps), visuals land on the words they illustrate and the effects mix sits under the narration.

## Credit

The styles, reference sources and rendering kits are Futurepedia's work, captured from the atlas page and not covered by this repo's MIT license. See the skill's `ORIGIN.md`.

## It's working if

- The video looks like the chosen style (materials, light, camera, grade) but shows your subject, not the reference's sample topic.
- Explainers and stories show things happening over beats, with words as small labels, and end on the result rather than a headline.
- Scrubbing the player to any time shows the same frame every time.
- The MP4's sound hits land on the frames where their events appear.
