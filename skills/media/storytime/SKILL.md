---
name: storytime
description: Multi-voice audio story renderer. Converts stories into scripts with character tags, assigns Inworld TTS voices, stitches into a single MP3. Triggers on "storytime", "read this story", "make an audio drama". Use for bedtime stories, audio dramas, multi-character narration, or digests with voice variety. Uses Inworld TTS (about $5 per million characters); for single-voice narration call inworld-tts directly.
metadata:
  hermes:
    tags: [tts, audio, storytelling, multi-voice, drama]
    related_skills: [inworld-tts, chatterbox-tts]
---

# Storytime

Render multi-voice audio stories using Inworld TTS and ffmpeg.

## Pipeline

```
Story input (URL / paste / generate)
    v
Script conversion (prose to tagged script)
    v
Voice casting (assign Inworld voices to characters)
    v
Render (storytime.sh generates and stitches audio)
    v
Deliver (hand the MP3 to the user)
```

## Prerequisites

- The `inworld-tts` skill installed beside this one (the render script looks for `../inworld-tts/scripts/inworld-tts.sh`; override with `STORYTIME_INWORLD_TTS=<path>`), with `INWORLD_API_KEY` exported. See that skill for setup.
- `ffmpeg` and `python3` on `PATH`.

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

JSON mapping character names to Inworld voice IDs:

```json
{
  "NARRATOR": "Elizabeth",
  "RITA": "Wendy",
  "RODDY": "Craig",
  "TOAD": "Hades",
  "SID": "Edward"
}
```

Save as a `.cast.json` file.

### Voice selection guide

See the `inworld-tts` skill for the full voice catalog (`--list-voices`).

**Quick picks:**
- Narrators: Elizabeth (calm), Ronald (dramatic), Carter (intense)
- British female: Olivia (young), Wendy (posh)
- British male: Craig (posh), Ronald (deep), Clive (cordial)
- Villains: Hades (commanding), Dominus (robotic)
- Comic: Julia (quirky), Pixie (cartoon), Edward (streetwise)
- Warm: Ashley, Blake, Luna

## Step 3: Render

```bash
scripts/storytime.sh story.script cast.json -o story.mp3
scripts/storytime.sh story.script cast.json --pause 500   # longer pauses
```

The script:
1. Reads each tagged line
2. Looks up the voice from the cast file
3. Calls `inworld-tts` for each line
4. Adds silence between speakers (default 400 ms)
5. Stitches everything with ffmpeg

## Step 4: Deliver

Hand the MP3 to the user by whatever the host supports: `SendUserFile` in Claude Code, a file attachment on a chat platform, or the path on disk.

## Full example

```bash
# 1. Write the script from a story URL or text (prose to .script format)
# 2. Create the cast mapping
echo '{"NARRATOR":"Elizabeth","RITA":"Wendy","RODDY":"Craig"}' > /tmp/cast.json
# 3. Render
scripts/storytime.sh /tmp/story.script /tmp/cast.json -o /tmp/story.mp3
# 4. Deliver the file
```

## Tips

- Short lines (one or two sentences) per tag produce better pacing
- Split long narration into multiple `[NARRATOR]` lines
- Use `--pause 600` for bedtime stories (slower pace)
- Use `--pause 250` for rapid dialogue scenes
- About 8,000 characters is 10 minutes of audio and about $0.04
