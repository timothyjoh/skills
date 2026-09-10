---
name: storytime
description: Multi-voice audio story renderer. Converts a story into a script with character tags, casts a local cloned voice per character, and stitches the lines into a single MP3. Triggers on "storytime", "read this story", "make an audio drama". Use for bedtime stories, audio dramas, multi-character narration, or digests with voice variety. Free and offline via the tts-voice skill.
metadata:
  hermes:
    tags: [tts, audio, storytelling, multi-voice, drama]
    related_skills: [tts-voice]
---

# Storytime

Render multi-voice audio stories with the `tts-voice` skill and ffmpeg.

## Pipeline

```
Story input (URL / paste / generate)
    v
Script conversion (prose to tagged script)
    v
Voice casting (one tts-voice voice per character)
    v
Render (storytime.sh generates and stitches audio)
    v
Deliver (hand the MP3 to the user)
```

## Prerequisites

- The `tts-voice` skill installed beside this one, set up per its `SKILL.md`. The render script looks for `../tts-voice/scripts/tts-voice.sh`; override with `STORYTIME_TTS=<path>`.
- `ffmpeg` and `python3` on `PATH`.
- Synthesis is local and slow on CPU: budget a few seconds per line, or pass `--mps` on Apple Silicon.

## Step 1: Convert story to script

Convert prose into tagged script format. Stay faithful to the original text.

```
[NARRATOR] Deep beneath the streets of London, the sewers hummed with life.
[RITA] Oi! Watch where you're stepping, fancy pants.
[RODDY] I beg your pardon, I was just...
[RITA] You were just falling into my river. Classic topside move.
[NARRATOR] Rita grabbed the wheel and spun the boat hard to starboard.
```

Rules:
- One `[TAG]` per line, followed by the text
- All narration, descriptions, and stage directions go to `[NARRATOR]`
- Dialogue goes to the character name tag
- Lines without tags are treated as NARRATOR
- Keep the original wording: tag, do not rewrite
- Empty lines and `#` comments are skipped

Save as a `.script` file (plain text).

## Step 2: Create the cast file

JSON mapping character names to voices. A value is a `tts-voice` voice name (any WAV in its voices directory), `default` for the model's built-in voice, or a path to a reference WAV:

```json
{
  "NARRATOR": "default",
  "RITA": "glados",
  "RODDY": "wheatley",
  "TOAD": "/path/to/toad.wav"
}
```

Save as a `.cast.json` file. Run `../tts-voice/scripts/tts-voice.sh --list-voices` to see what is available; an unlisted character falls back to the NARRATOR voice.

## Step 3: Render

```bash
scripts/storytime.sh story.script cast.json -o story.mp3
scripts/storytime.sh story.script cast.json --pause 500   # longer pauses
scripts/storytime.sh story.script cast.json --mps         # Apple Silicon GPU
```

The script:
1. Reads each tagged line
2. Looks up the voice from the cast file
3. Calls `tts-voice` for each line
4. Adds silence between speakers (default 400 ms)
5. Stitches everything with ffmpeg

## Step 4: Deliver

Hand the MP3 to the user by whatever the host supports: `SendUserFile` in Claude Code, a file attachment on a chat platform, or the path on disk.

## Tips

- Short lines (one or two sentences) per tag produce better pacing and keep each synthesis call fast
- Split long narration into multiple `[NARRATOR]` lines
- Use `--pause 600` for bedtime stories (slower pace)
- Use `--pause 250` for rapid dialogue scenes
