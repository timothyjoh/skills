## What it does

`inworld-tts` synthesizes speech through the Inworld AI API, with 65 or more named voices covering British and American accents, narrators, and character voices. One shell script does everything: text in, MP3 path out.

## When to reach for it

Type `/inworld-tts`, or the agent reaches for it when a specific voice quality matters or a project needs voice variety. [storytime](./storytime.md) is built on it. For free local synthesis, use [chatterbox-tts](./chatterbox-tts.md).

## Prerequisites

`INWORLD_API_KEY` exported in the shell: the Base64 Basic-auth credential from your Inworld workspace. The script stops with a clear message if it is missing, and the credential never goes in a file. `curl` and `python3` on `PATH`. About $5 per million characters.

## Common questions

**Which voice for a narrator?**
Elizabeth for calm, Ronald for dramatic, Blake for audiobook warmth. Run `--list-voices` for the full catalog with descriptions.

## It's working if

- The script prints a path and the file plays.
- A missing key fails before any network call, with the variable named.
