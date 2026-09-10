## What it does

`show-me` explains whatever is currently under discussion with a picture instead of prose. It picks the smallest view that makes the point: pseudocode for logic, a call tree for control flow, a component or file tree for structure, Mermaid for interaction, a `diff` when the point is what changes, and one focused HTML file only when text cannot carry it. The prose around the picture stays short; the picture does the explaining. Written by Dex Horthy at HumanLayer and introduced in [this post](https://www.humanlayer.com/blog/show-me-skill); carried here under MIT from [humanlayer/skills](https://github.com/humanlayer/skills).

## When to reach for it

Type `/show-me`, or the agent reaches for it on its own when a visual would land better than a paragraph.

Reach for it when you are discussing a shape: how something is wired, where a change lands, what a refactor moves. For a re-explanation of an answer you did not follow, use [wat](./wat.md) instead; it works on the agent's last output, not the topic.

## The smallest view

Each shape has a matching notation, and the skill carries an example of each. The discipline is to pick one or two, never all of them, and to keep only the calls, files, props and states the current question needs. A `diff` is preferred whenever the surrounding shape already exists, matched to the thing being changed: a component diff for a component change, a file-tree diff for a layout change.

## It's working if

- The picture arrives before the explanation, and the explanation is shorter than it would have been without it.
- You can tell what changed from the `diff` alone.
- An HTML file appears only when the point was genuinely too dense for text.
