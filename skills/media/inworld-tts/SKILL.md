---
name: inworld-tts
description: Premium text-to-speech via Inworld AI with 65+ voices including British accents, character voices, and narrators. Use for multi-voice stories (storytime relies on this), when specific voice characteristics are needed, or when voice variety within a single project matters. Costs about $5 per million characters; for free local TTS use chatterbox-tts instead.
metadata:
  hermes:
    tags: [tts, audio, voice, multi-voice, premium]
    related_skills: [storytime, chatterbox-tts]
---

# Inworld TTS

Premium TTS with 65+ voices via the Inworld AI API. About $5 per million characters.

## Setup

Export your Inworld credential once. It is the Base64 Basic-auth string from your Inworld workspace (API Keys, then Basic):

```bash
export INWORLD_API_KEY="<base64 basic credential>"
```

The script refuses to run without it. Never write the credential into a file in this repo.

Also needs `curl` and `python3` on `PATH`.

## Usage

```bash
# Basic (default voice: Olivia)
scripts/inworld-tts.sh "Hello world"

# Specific voice
scripts/inworld-tts.sh "I say, how dreadful!" --voice Craig

# List all available voices
scripts/inworld-tts.sh --list-voices

# Custom output path
scripts/inworld-tts.sh "Hello" --voice Ronald -o /tmp/narration.mp3

# Pipe text in
echo "Long text here..." | scripts/inworld-tts.sh --voice Elizabeth
```

## Key voices (English)

| Voice | Style | Good for |
|-------|-------|----------|
| Deborah | Professional American female | Business narration |
| Evelyn | Friendly American female | Warm, soft delivery |
| Wendy | Posh British female | Lead female / British character |
| Olivia | Young British female, upbeat | Other young female characters |
| Elizabeth | Professional, calm female | Narrator |
| Ronald | Deep British male, gravelly | Narrator (dramatic) |
| Craig | Older British male, posh | Gentleman characters |
| Hades | Commanding, gruff male | Villains |
| Clive | Calm British male | Butler / cordial |
| Edward | Fast-talking, streetwise | Street characters |
| Julia | Quirky, high-pitched female | Comic relief |
| Carter | Radio announcer male | Dramatic intros |
| Blake | Rich, intimate male | Audiobooks |
| Luna | Calm, relaxing female | Sleep stories |

Full voice catalog: `scripts/inworld-tts.sh --list-voices`
Cached catalog: `references/inworld-voices.json`

## API details

- **Endpoint:** `POST https://api.inworld.ai/tts/v1/voice`
- **Voices:** `GET https://api.inworld.ai/voices/v1/voices`
- **Auth:** Basic (Base64 credential in `INWORLD_API_KEY`)
- **Model:** `inworld-tts-1.5-max`
- **Output:** JSON with base64 MP3 in `audioContent`
- **Pricing:** about $5 per million characters

## When to use this vs chatterbox-tts

- **chatterbox-tts**: free, local, slower; voice cloning from your own reference WAVs
- **inworld-tts**: premium quality, a specific voice needed, multi-voice stories
