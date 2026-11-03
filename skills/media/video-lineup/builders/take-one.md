Skill: take-one ({{repo}}, commit {{short}}). Cloned at `vendor/take-one`, linked at `.claude/skills/take-one`.

Objective: make the brief's video with take-one, following `vendor/take-one/SKILL.md` and its references as written, then write BUILD-LOG.md.

Builder instructions:
- Request, in the skill's terms: "a {{minSeconds}} to {{maxSeconds}} second {{aspect}} explainer or launch film for the subject in the brief. Just make it: run mode, go straight through to a finished, reviewed take, no stages. I delegated and left. Treat this message as the go on the concept check and the rough cut."
- Use the free code-only route only. No Higgsfield, ElevenLabs, Suno, ChatGPT or Codex image generation.
- Brand pass: read the brief's public pages and its read-only local sources. The facts come from the brief.
- Story devices must not add facts. Dramatize only what the brief's facts say: no invented extra sessions, failures, triggers, install steps or features. An earlier lineup's take-one film invented a second session and a connection-loss trigger.
- Do not start the review room server (`scripts/review-room/server.mjs`). Do run the skill's cold readers and its fresh-reviewer rounds as subagents, up to the skill's limit of 3.
- Run `bash vendor/take-one/scripts/doctor.sh` first.
- Write the final file to `out/final.mp4` in this folder, not to Desktop or Downloads. Write POSTS.md if the skill asks for it; never post it.
- The skill estimates 1 to 2 hours for a 30 s film; an earlier lineup finished in 35 minutes. Keep render workers at the skill's default of 3 or fewer.
