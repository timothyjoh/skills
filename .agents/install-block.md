# The canonical install block

One install story, one wording. `README.md`, `.changeset/*`, and every page under `docs/` must say **this** and nothing else. Change it here first, then propagate.

This plugin is **not** in Claude Code's official marketplace. The repo is its own single-plugin marketplace via `.claude-plugin/marketplace.json`, so Claude Code users add the marketplace once, then install.

## Claude Code: the plugin

<canonical-block name="claude-code">

```bash
claude plugin marketplace add timothyjoh/skills
claude plugin install timothyjoh-skills@timothyjoh
```

Or, from inside a session:

```
/plugin marketplace add timothyjoh/skills
/plugin install timothyjoh-skills@timothyjoh
```

Updates arrive with `claude plugin update timothyjoh-skills`.

</canonical-block>

## Codex, and other agents: skills.sh

The plugin is Claude Code only. Everywhere else, [skills.sh](https://skills.sh/timothyjoh/skills) copies editable skill files into the project.

<canonical-block name="skills-sh-whole-set">

```bash
npx skills@latest add timothyjoh/skills
```

Pick the skills you want, and which coding agents to install them on.

</canonical-block>

<canonical-block name="skills-sh-one-skill">

```bash
npx skills@latest add timothyjoh/skills --skill=<name>
```

```bash
npx skills@latest update <name>
```

</canonical-block>

## The two routes are exclusive

The plugin is a managed, read-only bundle you subscribe to. skills.sh writes files you own and edit. Installing both leaves the user with every skill twice: always say "pick one".
