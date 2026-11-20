---
"timothyjoh-skills": minor
---

Add `moss-image`, a model-invoked media skill that makes images locally on an Apple Silicon Mac with MOSS-Image through [moss-image-mac](https://github.com/abhishekaryan23/moss-image-mac) by abhishekaryan23 (MIT), installed from vitaliyhan's fork at a pinned commit.

- Six tools: text to image, text and objects placed in boxes, transparent cutouts, inpainting, restyling, and a backend check.
- Uses the `moss-image` MCP tools when the session has them, otherwise a bundled script that calls the same tools with the same arguments and loads the models once per batch.
- `check` reports the platform and install; `install` clones a pinned commit and runs its checksum-verified setup (about 10 GB), only after the user agrees.
- The agent opens every image and checks spelling and unrequested text before it reports the result.
