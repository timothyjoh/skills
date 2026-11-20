# explainer-video skill

Decisions (2026-11-20): Remotion + three.js only; no image/video models, no Seedance/Higgsfield, no license text. Styles from AI Samson's Claude Video Prompt Library, rewritten in our own words; image-keyframe styles rebuilt as code-drawn. Narration: kokoro-js; word timings: whisper.cpp via @remotion/install-whisper-cpp. No style given: ask user to pick one or more; several styles render side by side.

- [x] Transcript + prompt library captured (scratchpad)
- [x] Branch `add-explainer-video`
- [x] Remotion template (aspect/fps/duration props, timeline, captions, audio tracks)
- [x] scripts: new-project, narrate (TTS + word timings), synth (music + sfx WAV), compare (side-by-side)
- [x] Smoke test: scaffold, narrate, synth, render SVG + three.js + ShaderPass styles, compare (24 s for 3 films + compare)
  - found: @react-three/postprocessing EffectComposer renders black under Remotion -> wrote lib/FilmPass.tsx, dropped the deps
  - found: whisper token-level output is word pieces -> align script words to whisper letter stream
  - found: peak-normalised music sat ~11 dB under voice -> RMS-normalise music and voice to -18 dBFS
- [x] Re-test scaffold from clean template: 16:9, silent mode, estimate timings, tsc, compare (1920x596)
- [x] SKILL.md + references (script, kit, techniques, audio)
- [x] Style catalogue + 21 style files (2 by me, 19 by 3 subagents)
- [x] Review style files: sections, score vocabulary, anchors, fonts, banned names, 9-word overlap with source (spec fragments only)
- [x] agents/openai.yaml, bucket README, top README, plugin.json, docs page, changeset
- [x] Validate: plugin validate (same pre-existing failures as HEAD), em-dash check, link-skills.sh
- [x] Step 10: after every finished render, ask to delete node_modules (recommended); reinstall before changes
- [ ] Commit, PR (waiting for Tim)
- [x] Behavioural eval: two subagents built cut-paper-collage and flat-vector-science from their style files (tire explainer); both passed still checks

# Tire-change explainer (2026-11-20)

Project: ~/wrk/explainers/change-a-tire, 9:16, medium (~45 s), styles cut-paper-collage + flat-vector-science.

- [x] Styles, aspect, length picked by Tim
- [x] Fact-check steps (AAA, Firestone, Michelin, KBB, The Drive, TrueCar, Progressive, O'Reilly)
- [x] Scaffold + install
- [x] script.json, shots.md, narrate
- [x] Build cut-paper-collage scene + score (subagent), stills checked
- [x] Build flat-vector-science scene + score (subagent), stills checked
- [x] Render films + compare, ffprobe checks, report
