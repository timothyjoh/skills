# Media

Producing audio, images, narrated walkthroughs and videos: text-to-speech engines, local image generation, narrated documents, multi-voice stories, browser tours, 3D motion graphics, coded explainer videos, side-by-side video builds.

## User-invoked

Reachable only when you type them; they orchestrate.

- **[video-lineup](./video-lineup/SKILL.md)**: Build one video brief with several video skills at once (huashu-motion, take-one, explainroo, video-director, argo, a no-skill baseline and an earshot sound pass), each in its own T3 Code session, then measure and compare the outputs on one page. Depends on `t3-handoff` in the development bucket; the baseline uses `tts-voice` beside it.

## Model-invoked

Model- or user-reachable (rich trigger phrasing so the model can reach for them).

- **[narrate-doc](./narrate-doc/SKILL.md)**: Turn Markdown, HTML (Notion exports included), Word or PDF into a narrated page: local Kokoro TTS, the paragraph being read is highlighted, the document's comments are read in other voices, and the listener adds comments that export as Markdown.
- **[storytime](./storytime/SKILL.md)**: Render a story as a multi-voice MP3: tag the prose by speaker, cast a local voice per character, stitch with ffmpeg. Depends on `tts-voice` beside it.
- **[browser-tour](./browser-tour/SKILL.md)**: Drive Claude-in-Chrome through a narrated, pausing tour: research, product wizard, plan narration, or post-implementation demo. Optional audio via `tts-voice` beside it.
- **[cook](./cook/SKILL.md)**: Run the Cook Loop for visual builds that must match reference images or videos: one intake, then long autonomous rounds of build, stills, zero-context critics and fixes against a numeric bar, with no final render before you approve. Vendored from [Leonxlnx/cook](https://github.com/Leonxlnx/cook) by Leon Lin (MIT).
- **[explainer-video](./explainer-video/SKILL.md)**: Make a narrated, captioned explainer drawn entirely in code with Remotion and three.js, in one or more of 21 styles, any aspect ratio; several styles render from one script and play side by side. Local Kokoro narration, word-synced captions, synthesised music.
- **[threejs-3d-styles](./threejs-3d-styles/SKILL.md)**: Make a short 3D motion-graphic video in three.js, built entirely in code, in one of 37 ready-made styles from Futurepedia's 3D Style Atlas: storyboard first, then a self-contained HTML player and an optional MP4.
- **[moss-image](./moss-image/SKILL.md)**: Make images locally on Apple Silicon with MOSS-Image (text in images, boxes, cutouts, inpainting, restyling), through the moss-image MCP tools or a bundled script. Needs a moss-image-mac install; it offers to install one.
- **[tts-voice](./tts-voice/SKILL.md)**: Free local text-to-speech with voice cloning from reference WAVs (Chatterbox under the hood). Needs a local Chatterbox install.
