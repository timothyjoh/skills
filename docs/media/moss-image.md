## What it does

`moss-image` makes images on your own Mac, free and offline, with MOSS-Image running through [moss-image-mac](https://github.com/abhishekaryan23/moss-image-mac) by abhishekaryan23 (MIT), installed from [vitaliyhan's fork](https://github.com/vitaliyhan/moss-image-mac) at a tested commit. The skill only drives it. It is good at legible text in images, placing text and objects in boxes, transparent cutouts of one object, repainting part of an image, and restyling an image. An image at the default quality takes about 10 to 60 seconds, depending on size and chip.

The defining constraint: the agent looks at every image before it hands it to you. MOSS sometimes adds words nobody asked for, so the agent checks spelling and stray text, and generates again with a new seed when a check fails.

## When to reach for it

The agent reaches for it when you ask it to make, draw or render an image, poster, mockup or transparent PNG locally or with MOSS, or to edit or restyle an image on your Mac. You can also type `/moss-image`. It works only on Apple Silicon (M1 or newer). For video, use [threejs-3d-styles](./threejs-3d-styles.md) or [video-lineup](./video-lineup.md).

## Prerequisites

An Apple Silicon Mac with 16 GB or more of memory and about 15 GB of free disk for setup (about 10 GB after). If MOSS is not installed, the agent asks before it downloads it. The install clones a pinned, tested commit of moss-image-mac into `~/Documents/moss-image-app` (change it with `MOSS_HOME`) and verifies every file by checksum. Before macOS 26 the runtime is built from source and needs `cmake`.

## Two routes, one set of tools

If you have connected the moss-image MCP server to Claude Code, the agent calls its tools directly. If not, the skill's script calls the same tools with the same arguments in your install. A batch of images loads the models once. Images are saved to `~/Documents/moss-image-app/outputs` unless `MOSS_OUTPUT_DIR` says otherwise.

## Common questions

**Can I make images without an agent?**
Yes. `~/Documents/moss-image-app/start_ui.sh` opens a web UI at http://127.0.0.1:7877 with a queue and a gallery.

**Why did a restyle barely change the picture?**
`transform_image` at strength 0.6 keeps the original look. A real style change needs about 0.85, which also changes the composition.

**When should I ask for `high` quality?**
Only for finals where fine texture matters. It runs the official 50 steps and takes 10 to 30 minutes. The default renders text as well or better.

## It's working if

- `scripts/moss-image.sh check` ends with `status: ready` on your Mac.
- The agent asks before the 10 GB install and never installs without a yes.
- Each reported image has a path, a size and a time, and the agent says it looked at the image.
- An image with a misspelled or unrequested word is generated again, or reported with the defect named.
