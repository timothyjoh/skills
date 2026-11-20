---
name: moss-image
description: Make images locally on an Apple Silicon Mac with MOSS-Image (5B, 4-bit, about 10 to 60 seconds per image), free and offline. Strong at legible text in images (signs, posters, labels, menus), placing text and objects in bounding boxes, transparent single-object cutouts, inpainting part of an image, and restyling an image. Use when the user asks to make, generate, draw or render an image, picture, poster, mockup, icon-like object or transparent PNG locally, offline, without an API key or with MOSS, or to edit, inpaint or restyle an existing image on their Mac. Installs the pinned moss-image-mac (about 10 GB) only after the user agrees.
metadata:
  hermes:
    tags: [image, image-generation, local, apple-silicon, moss]
---

# MOSS Image (local, Apple Silicon)

Prompt in, PNG out, on the user's own Mac. The engine is [moss-image-mac](https://github.com/abhishekaryan23/moss-image-mac) by abhishekaryan23, installed from [vitaliyhan's fork](https://github.com/vitaliyhan/moss-image-mac): MOSS-Image-SFT at 4 bits on stable-diffusion.cpp with Metal. It runs only on Apple Silicon (M1 or newer). It uses about 9 GB of memory while a backend is loaded.

There are two routes to the same six tools, with the same names and arguments:

- **MCP route:** the session has `moss-image` MCP tools (`generate_image` and others). Call them directly. Images come back inline, and the PNG is saved on disk.
- **Script route:** no such tools. Run `scripts/moss-image.sh` from this skill folder. It calls the same tool functions in the user's install and prints one JSON line per call.

## 1. Check the install

Run `scripts/moss-image.sh check`. It changes nothing. The last line is the status:

| Status | Do this |
|---|---|
| `ready` | Continue. |
| `not-installed` or `incomplete` | Tell the user that setup downloads about 10 GB (about 11 GB on disk) from huggingface.co and GitHub. Ask before you run `scripts/moss-image.sh install`. Run it in the background; it resumes if interrupted. |
| `unsupported` | Stop and give the reason it prints (for example, not Apple Silicon). Do not try another image tool unless the user asks. |

`install` clones the pinned commit into `MOSS_HOME` (default `~/Documents/moss-image-app`) and runs the app's `setup.sh`, which checks every file by SHA-256. If `git` fails, the user must run `xcode-select --install` and finish the installer. Before macOS 26 it builds the runtime from source and needs `cmake` (`brew install cmake`). When install finishes, it prints a `claude mcp add` command. Offer it; do not run it without a yes, because it changes the user's Claude Code config.

## 2. Pick the tool

| Tool | Use for | Key arguments |
|---|---|---|
| `generate_image` | Text to image | `prompt`, `aspect_ratio` (1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3, 21:9), `size` (fast, balanced, large), or `width` + `height`; `seed`; `upscale_2x` |
| `generate_layout_image` | Exact placement of text and objects | `caption` (style and scene only), `items`: `[{"label": "text" or "object", "caption": ..., "box": [x0, y0, x1, y1]}]` in output pixels, top-left origin; give `width` + `height` so the boxes match the canvas |
| `generate_cutout_object` | One isolated object, transparent PNG | `object_prompt`, `bg_color` (magenta default; pick one that is not in the object) |
| `edit_image` | Repaint one region, keep the rest | `image_path`, `prompt` describing the **whole** result, `mask_boxes` `[[x0, y0, x1, y1]]` in the original image's pixels, or `mask_path` (white = change) |
| `transform_image` | Restyle or vary a whole image | `image_path`, `prompt`, `strength` |
| `image_server_status` | Start or check the backend | none |

All take `quality`: `standard` (default, 4 steps), `draft` (3 steps, about 25% faster) or `high` (official 50 steps, 10 to 30 minutes). Use `high` only when the user asks for maximum quality and accepts the wait; run it through the script in the background, because MCP clients can time out. Sizes snap to multiples of 16, 256 to 1536 px per side, about 1.1 MP at most. `seed` -1 is random; reuse a seed to reproduce or compare.

## 3. Write the prompt

- Put every word that must appear in the image in single quotes: `a shop sign that reads 'OPEN 24H'`. English and Chinese work.
- Be specific: subject, setting, light, and lens or medium. Long prompts beat short ones, especially at large sizes.
- In layouts, keep `caption` about style, because words in it can be drawn as text. Give each piece of text its own box, shaped like the text. List background items first, then what sits on or in front of them, and say how they relate ("a cat asleep on the bench").
- For `transform_image`, strength 0.6 keeps the photo and changes little. A real style change (photo to watercolor) needs about 0.85, and then the composition also changes.

## 4. Run it

MCP route: call the tool with the arguments above.

Script route, one image (the quoted heredoc keeps the single quotes in the prompt intact):

```bash
scripts/moss-image.sh run generate_image "$(cat <<'JSON'
{"prompt": "a white enamel sign on a brick wall that reads 'MOSS' in bold black letters, soft daylight", "aspect_ratio": "1:1", "size": "large"}
JSON
)"
```

Several images: write a JSON list of `{"tool": ..., "args": {...}}` to a temporary file and run `scripts/moss-image.sh run --batch FILE`. One process loads the models once (about 15 s), so a batch is faster than separate calls. The script reuses a backend that is already running (from the web UI or MCP server) and stops only a backend it started. Set `MOSS_KEEP_SERVER=1` to keep it loaded.

Each call prints a JSON line with `path`, `width`, `height` and `seconds` (plus `rgba_path` for cutouts), or `error`. Relative `image_path` and `mask_path` resolve from the current folder. Images are saved to `MOSS_OUTPUT_DIR` (default `$MOSS_HOME/outputs`). Copy the file where the user wants it rather than changing the app's folders.

## 5. Check every image

Open each saved PNG and look at it before you report it. A zero exit status or a `Saved` line does not prove the image is right. Check:

- Every quoted word is present and spelled correctly.
- There is no text the user did not ask for. MOSS sometimes adds an extra word or line (in testing it drew 'IOS' above a requested sign and 'CAFU' on a restyled menu).
- Subject, count, layout, style and aspect match the request. For cutouts, open `rgba_path` and check that the edges are clean and nothing inside the object was cut away.

If a check fails, generate again with a new seed. For misspelled small text, make its box or the canvas larger. After two failed retries, show the best attempt and say what is still wrong. Do not hide a defect.

Report the path, the size and the generation time. If you could not view the image, say so.

## Troubleshooting

- `port ... is used by another program`: set `MOSS_PORT` to a free port.
- `blank image ... GPU ran out of memory`: another GPU-heavy app or a second backend is running. Close it and retry.
- `model files missing`: run `scripts/moss-image.sh check`, then `install` with the user's agreement.
- Backend log: `$MOSS_HOME/logs/sd-server.log`. The app's own guide: `$MOSS_HOME/docs/troubleshooting.md`.
- The user can also make images without an agent: `$MOSS_HOME/start_ui.sh` opens a web UI at http://127.0.0.1:7877.
