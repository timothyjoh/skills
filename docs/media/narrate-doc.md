## What it does

`narrate-doc` turns a document into a page that reads itself aloud. The page is the document itself, with the paragraph being read highlighted. Comments already in the document appear under the text they mark and are read in other voices. You can pause at any point, write your own comment, and export your comments as Markdown. Speech is local (Kokoro-82M), so it is free, offline, and the document never leaves your machine.

It reads Markdown, HTML (Notion exports included), Word (`.docx`, and `.doc`, `.rtf`, `.odt` through LibreOffice or macOS `textutil`) and PDFs that have a text layer.

## When to reach for it

Ask for a document to be narrated or read aloud, or say you want to listen to a long doc while you follow along. The agent reaches for it on its own when a review would go easier by ear. To make an MP3 from a few lines of text, use [tts-voice](./tts-voice.md). For a multi-voice story, use [storytime](./storytime.md).

## Prerequisites

A Python 3.12 environment with the skill's `requirements.txt` installed, and `ffmpeg`. `scripts/narrate.sh --check` says what is missing. The first run downloads the Kokoro weights (about 330 MB).

## What you get

- `<name> - narrated.html`, which opens from `file://` with no server.
- `<name> - narrated-audio/`, with one MP3 per section. A long document can be heard while the later sections are still rendering.

Keys:
- Space: play or pause.
- ← and →: move by paragraph. Shift+← and Shift+→: move by section.
- C: comment. Playback pauses; ⌘+Enter saves and resumes.
- F: follow the reading position again.
- [ and ]: change speed.

Double-click any paragraph to start reading there.

The page keeps the paragraph being read centered. Scroll away and it leaves you where you are. Scroll back to the highlight and it follows again.

## Comments, both ways

Comments in the document are read where they belong:
- Notion: inline comments.
- Word: comments, with author and date.
- PDF: highlights and notes.
- Markdown: CriticMarkup, `{==text==}{>>Name: comment<<}`.

A comment whose text cannot be found is still read, at the end of the page. Your own comments stay in the browser, keyed by the document title, and survive a re-render while the paragraph text is unchanged. Export saves them as Markdown, each under a quote of its paragraph.

## Common questions

**Can I reuse the look for a new report?** Yes. Write the report in Markdown and run the skill on it. The page style is `templates/page.html` and the player is `templates/player.html`, both inside the skill.

**Why is a big table announced and not read?** Reading 60 rows aloud is no help. Tables up to 40 rows are read row by row with their column names. `--read-tables` changes the limit.

**A word is pronounced wrong.** Add it to a lexicon JSON, for example `{"SCORM": "scorm"}`, and pass `--lexicon`. Acronyms in capitals are usually spelled out correctly with no help.

## It's working if

- The highlight stays on the paragraph you hear, and the page scrolls with it.
- Each comment from the document is read right after the text it marks, in a different voice from the narrator.
- Your comments are still there after you reload the page, and Export gives a Markdown file with each one under its paragraph.
