---
"timothyjoh-skills": minor
---

Add `narrate-doc`, a model-invoked media skill: turn Markdown, HTML (Notion exports included), Word or PDF into a narrated page.

- Local Kokoro TTS reads the document and highlights each paragraph as it is read. The audio is one MP3 per section, so a long document can be heard before it finishes rendering.
- Comments in the source (Notion inline comments, Word comments, PDF annotations, Markdown CriticMarkup) are placed under their text and read in other voices.
- The listener pauses, adds comments, and exports them as Markdown. The page works from `file://`.
- Follow mode keeps the paragraph being read centered. It stops when the listener scrolls the highlight out of view and resumes when the highlight is back in view. `--update-player` refreshes the player in pages already made.
- Templates for the reading page and the player ship in `templates/`, for reuse in new reports.
