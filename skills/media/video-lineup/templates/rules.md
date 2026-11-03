## Rules for every build in this lineup

You are one build in a video lineup: several video skills make the same brief at the same time on this machine, so a person can compare the results side by side. Each build has its own folder and agent session. Your folder is your working directory.

**No human is watching.** The person who started this lineup delegated it and left.
- When the skill tells you to ask the user, offer options, or wait for approval (directions, clarifying questions, treatment review, plan sign-off), decide yourself. Log each such decision in BUILD-LOG.md under "Decisions made for the human": what the skill asked, the options, your pick and why. Then continue.
- Do not use AskUserQuestion or any other question tool. Do not wait for "ok".
- Skip any long-running review UI or notes inbox the skill starts for a human (studio, review room, preview servers). Do the skill's own self-review and its separate-reviewer step instead, if it has one; subagents are allowed.

**Free and local only.**
- No API keys, paid services, accounts, credits or logins. If a step needs one, use the skill's free route. If no free route exists, stop and report `blocked`.
- Never publish, post, push or upload anything. Writing social-post copy to a file is fine. No git remotes.

**Stay inside your folder.**
- Install only inside your build folder (project scope). Package and model caches under `~/.cache`, `~/.npm` and the Playwright browser cache are fine.
- Do not write to `~/.claude/settings.json`, `~/.claude/skills`, `~/.agents/skills`, user-scope MCP config, global npm or global pip.
- Every local path the brief lists as a source is read-only for you. Never edit it. Other builds' folders under `{{lineup}}/builds` are read-only too.
- Do not run `npx skills add`; the skill is already cloned in `vendor/` and linked in `.claude/skills/`.
- If you start any server yourself, bind it to 127.0.0.1 on your assigned port ({{port}}) and stop it before you finish. Temporary random-port servers that the skill's own render scripts open and close are fine.

**Be a good neighbour.** Cap parallel render workers or Chrome instances at 4.

**Machine facts.** {{facts}} The skill's own `doctor` or check command is the best first step.

**The brief.** Read `{{brief}}` and follow it. Use only its facts. Never invent product screens, features, numbers or quotes. You may show the real material the brief lists, and real pages from its sources. Follow any notes the brief has for `{{name}}` under "Builder notes".

**Deliverables**, in your build folder:
- `out/final.mp4`: the finished video, per the brief: {{width}}x{{height}}, {{minSeconds}} to {{maxSeconds}} s, H.264 video in a 4:2:0 pixel format (yuv420p or yuvj420p, so browsers can play it) with AAC audio. The lineup measures every video with the same QA script afterwards. It checks two things the first lineup often missed: loudness of about -14 LUFS integrated with true peak at or below -1 dBTP, and a first frame that is a finished picture, not black, because it is the thumbnail.
- `out/poster.png`: one representative frame, {{width}}x{{height}}.
- `BUILD-LOG.md`, with these sections:
  1. **Summary**: 3 lines on what you made and how.
  2. **Timeline**: wall-clock minutes for setup, planning, building, rendering and review, from file times where you can.
  3. **Installed**: packages, models and their disk size (`du -sh`).
  4. **Decisions made for the human**: as described above.
  5. **Skill steps followed and skipped**: which SKILL.md steps you ran, which you skipped, and why.
  6. **Quality checks**: each check the skill ran, with its result line.
  7. **What the skill did well**.
  8. **What went wrong**: errors, workarounds, instructions you had to bend.
  9. **Human effort**: what a person would have to do with this skill in normal, attended use.
  10. **Verdict**: 1 to 5 for this kind of video, with one line why.
