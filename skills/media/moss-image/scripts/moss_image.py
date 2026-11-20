"""Call moss-image-mac's MCP tools without an MCP client.

Run with the MOSS checkout's own Python (moss-image.sh run does this):

    moss_image.py TOOL 'JSON'      one call; JSON holds the tool's arguments
    moss_image.py --batch FILE     FILE is a JSON list of {"tool": ..., "args": {...}}

The tool names and arguments are the ones the moss-image MCP server exposes, so one set of
instructions covers both routes. The backend is started on first use (models load in ~15 s),
shared with any MOSS backend already running, and stopped at exit if this process started it
(set MOSS_KEEP_SERVER=1 to keep it). Prints one JSON line per call; exits 1 if any call failed.
"""
import asyncio
import json
import os
import re
import sys
import time
from pathlib import Path

TOOLS = ("generate_image", "generate_layout_image", "generate_cutout_object",
         "edit_image", "transform_image", "image_server_status")
PATH_ARGS = ("image_path", "mask_path")


def load_moss():
    home = Path(os.path.expanduser(os.environ.get("MOSS_HOME", "~/Documents/moss-image-app"))).resolve()
    if not (home / "moss_mcp.py").is_file():
        sys.exit(f"error: moss_mcp.py not found in MOSS_HOME={home}")
    sys.path.insert(0, str(home))
    import moss_mcp  # noqa: E402  (the checkout's MCP server module; tools are plain async functions)
    return moss_mcp


def parse_result(result):
    """moss_mcp tools return [Image, 'Saved <path> (<w>x<h>) in <s>s. <extra>'] or a status string."""
    text = result[-1] if isinstance(result, list) else str(result)
    out = {"text": text}
    m = re.match(r"Saved (.+?\.png) \((\d+)x(\d+)\) in ([\d.]+)s\.", text)
    if m:
        out.update(path=m[1], width=int(m[2]), height=int(m[3]), seconds=float(m[4]))
    m = re.search(r"Transparent RGBA cutout: (\S+\.png)", text)
    if m:
        out["rgba_path"] = m[1]
    return out


async def call(moss, tool, args):
    if tool not in TOOLS:
        raise ValueError(f"unknown tool {tool!r}; use one of {', '.join(TOOLS)}")
    if not isinstance(args, dict):
        raise ValueError("arguments must be a JSON object")
    args = dict(args)
    for k in PATH_ARGS:
        if args.get(k):
            args[k] = str(Path(os.path.expanduser(args[k])).resolve())
    return parse_result(await getattr(moss, tool)(**args))


async def main(calls):
    moss = load_moss()
    failed = 0
    for i, c in enumerate(calls):
        t0 = time.time()
        try:
            row = {"call": i, "tool": c["tool"], **await call(moss, c["tool"], c.get("args", {}))}
        except Exception as e:  # report and continue with the rest of the batch
            failed += 1
            row = {"call": i, "tool": c.get("tool"), "error": f"{type(e).__name__}: {e}"}
        row["wall_seconds"] = round(time.time() - t0, 1)
        print(json.dumps(row, ensure_ascii=False), flush=True)
    return 1 if failed else 0


if __name__ == "__main__":
    a = sys.argv[1:]
    try:
        if len(a) == 2 and a[0] == "--batch":
            calls = json.loads(Path(a[1]).read_text())
        elif len(a) in (1, 2) and not a[0].startswith("-"):
            calls = [{"tool": a[0], "args": json.loads(a[1]) if len(a) == 2 else {}}]
        else:
            sys.exit(__doc__)
    except (OSError, json.JSONDecodeError) as e:
        sys.exit(f"error: cannot read the call: {e}")
    if not isinstance(calls, list) or not all(isinstance(c, dict) and "tool" in c for c in calls):
        sys.exit('error: batch must be a JSON list of {"tool": ..., "args": {...}}')
    sys.exit(asyncio.run(main(calls)))
