"""Turn a document into a narrated HTML page.

Reads HTML (Notion exports included), Markdown, Word or PDF; places each
comment next to the block it is attached to; synthesizes speech per block with
Kokoro (local); stitches one MP3 per section; and adds a player that highlights
the block being read and lets the reader pause and add their own comments
(stored in the browser, exportable as Markdown).

Usage:
  python narrate.py INPUT [--out OUTPUT.html] [--extract-only] [--max-sections N]
Audio goes to <OUTPUT stem>-audio/ beside the page. Block audio is cached in
$NARRATE_DOC_CACHE (default ~/.cache/narrate-doc).
"""

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import unicodedata
from pathlib import Path
from urllib.parse import quote

from bs4 import BeautifulSoup, NavigableString, Tag

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sources  # noqa: E402
from sources import norm  # noqa: E402

SKILL = Path(__file__).resolve().parent.parent
CACHE = Path(os.environ.get("NARRATE_DOC_CACHE", Path.home() / ".cache" / "narrate-doc"))
SR = 24000

HEADINGS = ["h1", "h2", "h3", "h4", "h5", "h6"]
CANDIDATES = set(HEADINGS) | {"p", "li", "blockquote", "summary", "tr", "figcaption", "dt", "dd", "pre", "div"}
STOP = {"ul", "ol", "table", "details", "style", "script", "noscript", "nav", "footer", "svg", "math"}
SKIP_INSIDE = ["nav", "footer", "noscript", "svg", "math"]

COMMENTER_POOL = ["bf_emma", "bm_george", "af_bella", "am_michael", "bf_isabella", "am_adam", "af_nicole", "bm_lewis"]
PAUSE = {"h1": 0.8, "h2": 0.8, "h3": 0.6, "h4": 0.6, "comment": 0.5}
DEFAULT_PAUSE = 0.35
OURS = {"say-comment", "say-comment-head", "say-comment-body", "say-inserted-row"}
FILE_WORDS = {"pptx": "deck", "docx": "document", "xlsx": "spreadsheet", "pdf": "P D F", "csv": "C S V", "md": "markdown file"}


def key(s):
    return norm(s).lower()


def classes(el):
    return el.get("class") or []


def is_ours(el):
    """Markup this script inserts (comment cards and their table rows), never the source's own blocks."""
    return any(c in OURS for c in classes(el))


def own_text(el):
    parts = []
    for d in el.descendants:
        if not isinstance(d, NavigableString) or d.parent.name in ("style", "script"):
            continue
        par, skip = d.parent, False
        while par is not el:
            if par.name in CANDIDATES or par.name in STOP or is_ours(par):
                skip = True
                break
            par = par.parent
        if not skip:
            parts.append(str(d))
    s = re.sub(r"([^.?!:;\s])[ \t]*\n\s*", r"\1. ", "".join(parts))
    return norm(s)


def speakify(t, lexicon):
    for word, said in lexicon.items():
        t = re.sub(rf"(?<!\w){re.escape(word)}(?!\w)", said, t)
    t = re.sub(r"https?://\S+", "link", t)
    t = re.sub(r"(\w)_(\w)", r"\1 \2", t)
    t = re.sub(r"(?<=\S)\.(pptx|docx|xlsx|pdf|csv|md)\b", lambda m: f" {FILE_WORDS[m.group(1)]}", t)
    t = re.sub(r"\be\.g\.,?", "for example,", t)
    t = re.sub(r"\bi\.e\.,?", "that is,", t)
    t = re.sub(r"\betc\.", "et cetera.", t)
    t = re.sub(r"\bvs\.?(?=\s)", "versus", t)
    t = re.sub(r"(\d)\s*[\u2013-]\s*(\d)", r"\1 to \2", t)
    t = re.sub(r"#(\d)", r"number \1", t)
    t = t.replace("&", " and ").replace("\u2192", " to ").replace("\u2265", "at least ")
    t = t.replace("\u2264", "at most ").replace("\u00d7", " times ")
    t = re.sub(r"~\s?(?=[\d$])", "about ", t).replace("~", "")
    t = re.sub(r"/(hr|hour)\b", " an hour", t)
    t = re.sub(r"/(mo|month)\b", " a month", t)
    t = re.sub(r"/(yr|year)\b", " a year", t)
    t = t.replace("\u2014", ", ").replace("\u2013", ", ")
    t = re.sub(r"\[([^\]]+)\]", r"\1", t)
    t = re.sub(r"(\w)\s?%", r"\1 percent", t)
    t = "".join(c for c in t if unicodedata.category(c) not in ("So", "Sk", "Cf", "Co"))
    t = norm(t).rstrip(",")
    if t and t[-1] not in ".?!:;":
        t += "."
    return t


def speakable(t):
    return any(c.isalnum() for c in t)


def table_header(table):
    """The header row and its labels, or (None, []) when the first row is not a real header.

    Converters (PDF, Markdown) force a header onto every table; a "header" with a long
    cell is a data row, as in a two-column key and value table.
    """
    first = table.find("tr")
    if first and all(c.name == "th" for c in first.find_all(["td", "th"], recursive=False)):
        labels = [norm(c.get_text(" ")) for c in first.find_all(["td", "th"], recursive=False)]
        if all(len(h) <= 40 for h in labels):
            return first, labels
    return None, []


def rows_of(table):
    return [tr for tr in table.find_all("tr") if tr.find_parent("table") is table]


def big_table(table, max_rows):
    return "collection-content" in classes(table) or len(rows_of(table)) > max_rows


def inside(el, root):
    return any(p is root for p in el.parents)


def readable(el, root, max_rows):
    """True when el is a block that should be read, judged by where it sits."""
    if el.name not in CANDIDATES or is_ours(el):
        return False
    if any(el.find_parent(n) for n in SKIP_INSIDE) or el.find_parent("div", class_="say-comment"):
        return False
    if el.name != "tr" and el.find_parent(["tr", "pre"]):
        return False
    t = el.find_parent("table")
    if t is not None and big_table(t, max_rows):
        return False
    return inside(el, root)


def row_text(el):
    return " ".join(c for c in (norm(x.get_text(" ")) for x in el.find_all(["td", "th"], recursive=False)) if c)


def collect(root, max_rows):
    out = []
    for el in root.find_all(CANDIDATES):
        if not readable(el, root, max_rows):
            continue
        text = row_text(el) if el.name == "tr" else own_text(el)
        if text and speakable(text):
            out.append((el, text))
    return out


def place_after(el, node, soup):
    if el.name == "tr":
        ncol = len(el.find_all(["td", "th"], recursive=False)) or 1
        tr = soup.new_tag("tr", attrs={"class": "say-inserted-row"})
        td = soup.new_tag("td", attrs={"colspan": str(ncol)})
        td.append(node)
        tr.append(td)
        anchor = el
        while anchor.find_next_sibling("tr") and "say-inserted-row" in classes(anchor.find_next_sibling("tr")):
            anchor = anchor.find_next_sibling("tr")
        anchor.insert_after(tr)
    elif el.name == "li":
        nested = el.find(["ul", "ol"], recursive=False)
        prior = el.find_all("div", class_="say-comment", recursive=False)
        if prior:
            prior[-1].insert_after(node)
        elif nested:
            nested.insert_before(node)
        else:
            el.append(node)
    elif el.name == "summary":
        el.insert_after(node)
    else:
        nxt = el
        while isinstance(nxt.next_sibling, Tag) and "say-comment" in classes(nxt.next_sibling):
            nxt = nxt.next_sibling
        nxt.insert_after(node)


def find_anchor(blocks, anchor):
    a = key(anchor)
    for probe in (a, a[:100], a[:50], a[:25]):
        if len(probe) < 8 and probe != a:
            break
        hits = [(el, t) for el, t in blocks if probe in key(t)]
        if hits:
            exact = [h for h in hits if key(h[1]) == probe]
            starts = [h for h in hits if key(h[1]).startswith(probe)]
            return (exact or starts or hits)[0]
    return None


def place_comments(soup, root, comments, max_rows):
    blocks = collect(root, max_rows)
    report, unplaced = [], []
    for g in comments:
        target = None
        if g.get("cid"):
            m = soup.find("span", attrs={"data-say-cid": g["cid"]})
            if m is not None:
                el = m.find_parent(lambda x: x.name in CANDIDATES and readable(x, root, max_rows))
                if el is not None:
                    target = (el, own_text(el) if el.name != "tr" else row_text(el))
        if target is None and g.get("anchor"):
            target = find_anchor(blocks, g["anchor"])
        if target is None:
            unplaced.append(g)
            report.append(("UNPLACED", (g.get("anchor") or g["items"][0]["text"])[:80]))
            continue
        el, t = target
        el["class"] = classes(el) + ["say-anchored"]
        for c in g["items"]:
            place_after(el, card(soup, c), soup)
        report.append(("placed", f"{g['items'][0]['author']} -> {el.name}: {t[:70]}"))
    for m in soup.find_all("span", attrs={"data-say-cid": True}):
        m.unwrap()
    if unplaced:
        h = soup.new_tag("h2")
        h.string = "Comments not matched to the text"
        root.append(h)
        for g in unplaced:
            if g.get("anchor"):
                q = soup.new_tag("blockquote")
                q.string = g["anchor"]
                root.append(q)
            for c in g["items"]:
                root.append(card(soup, c))
    return report


def card(soup, c):
    box = soup.new_tag("div", attrs={"class": "say-comment", "data-author": c["author"]})
    head = soup.new_tag("div", attrs={"class": "say-comment-head"})
    head.string = "\U0001F4AC " + " · ".join(x for x in (c["author"], c["when"]) if x)
    body = soup.new_tag("div", attrs={"class": "say-comment-body"})
    body.string = c["text"]
    box.append(head)
    box.append(body)
    return box


def voice_lang(v):
    return v, v[0] if v[0] in "ab" else "a"


def build_blocks(soup, root, comments, opts):
    for d in root.find_all("details"):
        d["open"] = ""
    for br in root.find_all("br"):
        br.insert_before(NavigableString("\n"))
    report = place_comments(soup, root, comments, opts.read_tables)

    voices = dict(opts.voices)
    pool = [v for v in COMMENTER_POOL if v != opts.voice and v not in voices.values()] or COMMENTER_POOL
    seq, used, seen_tables = [], set(), set()
    for el in root.find_all(list(CANDIDATES) + ["table"]):
        if el.name == "div" and "say-comment" in classes(el):
            author = el["data-author"]
            body = norm(el.find(class_="say-comment-body").get_text())
            if author not in voices:
                voices[author] = pool[len(voices) % len(pool)]
            kind, text, spoken, voice = "comment", body, speakify(f"{author} commented. {body}", opts.lexicon), voices[author]
        elif el.name == "table":
            if id(el) in seen_tables or not inside(el, root) or not big_table(el, opts.read_tables):
                continue
            if any(el.find_parent(n) for n in SKIP_INSIDE):
                continue
            seen_tables.add(id(el))
            n = len(rows_of(el)) - (1 if table_header(el)[0] else 0)
            kind, text = "table", f"Table with {n} rows"
            spoken, voice = f"This table has {n} rows. It is not read aloud. Scroll through it on screen.", opts.voice
        elif readable(el, root, opts.read_tables):
            if el.name == "tr":
                if "say-inserted-row" in classes(el):
                    continue
                hrow, headers = table_header(el.find_parent("table"))
                cells = [norm(c.get_text(" ")) for c in el.find_all(["td", "th"], recursive=False)]
                text = " ".join(c for c in cells if c)
                if el is hrow:
                    spoken = "Table. Columns: " + "; ".join(c for c in cells if c) + "."
                elif hrow is None and len(cells) == 2 and all(cells):
                    spoken = f"{cells[0]}: {cells[1]}"
                else:
                    spoken = ". ".join(
                        (f"{headers[i]}: {c}" if i < len(headers) and headers[i] else c) for i, c in enumerate(cells) if c
                    )
            elif el.name == "pre":
                lines = len(el.get_text().strip().splitlines())
                text = f"Code block, {lines} lines"
                spoken = f"A code block of {lines} lines. It is not read aloud."
            else:
                text = own_text(el)
                spoken = text
            if not text or not speakable(text):
                continue
            spoken = speakify(spoken, opts.lexicon) if el.name != "pre" else spoken
            kind, voice = el.name, opts.voice
        else:
            continue
        if not speakable(spoken):
            continue
        h = hashlib.sha1(f"{kind}|{text}".encode()).hexdigest()[:10]
        bid, n = f"b{h}", 1
        while bid in used:
            n += 1
            bid = f"b{h}-{n}"
        used.add(bid)
        el["data-say"] = bid
        seq.append({"id": bid, "kind": kind, "text": text, "spoken": spoken, "voice": voice_lang(voice)})
    return seq, report, voices


def sections_of(seq, chunk=40):
    counts = {h: sum(b["kind"] == h for b in seq) for h in HEADINGS}
    level = next((i for i, h in enumerate(HEADINGS[:3], 1) if counts[h] >= 2), None)
    secs = []
    if level is None:
        for i in range(0, len(seq), chunk):
            secs.append({"title": f"Part {i // chunk + 1}", "blocks": seq[i:i + chunk]})
        return secs
    splits = set(HEADINGS[:level])
    for b in seq:
        if not secs or b["kind"] in splits:
            title = b["text"] if b["kind"] in HEADINGS else "Introduction"
            secs.append({"title": title, "blocks": []})
        secs[-1]["blocks"].append(b)
    return secs


_pipes = {}


def synth(spoken, voice):
    import numpy as np

    CACHE.mkdir(parents=True, exist_ok=True)
    vname, lang = voice
    f = CACHE / (hashlib.sha1(f"{vname}|{spoken}".encode()).hexdigest() + ".npy")
    if f.exists():
        return np.load(f)
    if lang not in _pipes:
        from kokoro import KPipeline

        _pipes[lang] = KPipeline(lang_code=lang, repo_id="hexgrad/Kokoro-82M")
    chunks = [a.numpy() if hasattr(a, "numpy") else a for _, _, a in _pipes[lang](spoken, voice=vname)]
    audio = np.concatenate(chunks).astype("float32") if chunks else np.zeros(1, dtype="float32")
    np.save(f, audio)
    return audio


def render_audio(secs, outdir):
    import numpy as np
    import soundfile as sf

    outdir.mkdir(parents=True, exist_ok=True)
    total = sum(len(s["blocks"]) for s in secs)
    done, data = 0, []
    for si, s in enumerate(secs):
        parts, t, timing = [], 0.0, []
        for b in s["blocks"]:
            a = synth(b["spoken"], b["voice"])
            pre = PAUSE["comment"] if b["kind"] == "comment" else 0.0
            if pre:
                parts.append(np.zeros(int(pre * SR), dtype="float32"))
                t += pre
            start = t
            parts.append(a)
            t += len(a) / SR
            timing.append({"id": b["id"], "s": round(start, 3), "e": round(t, 3), "k": b["kind"]})
            post = PAUSE.get(b["kind"], DEFAULT_PAUSE)
            parts.append(np.zeros(int(post * SR), dtype="float32"))
            t += post
            done += 1
        print(f"  section {si:02d} {s['title'][:50]!r}: {len(s['blocks'])} blocks, {t/60:.1f} min ({done}/{total})", flush=True)
        name = f"sec{si:02d}.mp3"
        with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
            sf.write(tmp.name, np.concatenate(parts), SR)
            subprocess.run(
                ["ffmpeg", "-y", "-loglevel", "error", "-i", tmp.name, "-ac", "1", "-b:a", "64k", str(outdir / name)],
                check=True,
            )
        data.append({"title": s["title"], "file": quote(f"{outdir.name}/{name}"), "dur": round(t, 3), "blocks": timing})
    return data


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:60] or "document"


def parse_voices(s):
    out = {}
    for part in filter(None, (p.strip() for p in (s or "").split(","))):
        name, _, v = part.rpartition("=")
        if not name or not v:
            raise SystemExit(f"--voices: expected NAME=VOICE, got {part!r}")
        out[name.strip()] = v.strip()
    return out


def player_html(payload):
    player = (SKILL / "templates" / "player.html").read_text(encoding="utf-8")
    return player.replace("/*__DATA__*/null", json.dumps(payload, ensure_ascii=False).replace("</", "<\\/"))


def update_player(page):
    """Replace the player in a narrated page with the current template. Audio and data are kept."""
    soup = BeautifulSoup(page.read_text(encoding="utf-8"), "html.parser")
    script = next((x for x in soup.find_all("script") if x.string and "const D = " in x.string), None)
    if script is None:
        raise SystemExit(f"{page}: no narration player found")
    start = script.string.index("const D = ") + len("const D = ")
    payload, _ = json.JSONDecoder().raw_decode(script.string[start:])
    payload.setdefault("slug", slug(payload["title"]))
    payload.setdefault("hasComments", any(b["k"] == "comment" for s in payload["sections"] for b in s["blocks"]))
    for el in [script, soup.find(id="say-help"), soup.find(id="say-bar")] + [
        x for x in soup.find_all("style") if x.string and "#say-bar" in x.string
    ]:
        if el is not None:
            el.decompose()
    soup.body.append(BeautifulSoup(player_html(payload), "html.parser"))
    page.write_text(str(soup), encoding="utf-8")
    print(f"updated the player in {page}")
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser(description="Turn a document into a narrated HTML page.")
    ap.add_argument("input")
    ap.add_argument("--out", help="output page (default: '<input stem> - narrated.html' beside the input)")
    ap.add_argument("--voice", default="af_heart", help="narrator voice (Kokoro voice id, default af_heart)")
    ap.add_argument("--voices", default="", help="commenter voices, 'Name=voice,Name=voice'")
    ap.add_argument("--lexicon", help="JSON file of word -> spoken form, for words Kokoro says wrong")
    ap.add_argument("--read-tables", type=int, default=40, help="read tables up to this many rows; bigger ones are announced (default 40)")
    ap.add_argument("--extract-only", action="store_true", help="write the blocks JSON and report; no audio")
    ap.add_argument("--max-sections", type=int, help="render only the first N sections (to listen while the rest builds)")
    ap.add_argument("--update-player", action="store_true", help="INPUT is a narrated page: replace its player with the current template")
    args = ap.parse_args(argv)
    if args.update_player:
        return update_player(Path(args.input).expanduser().resolve())

    src = Path(args.input).expanduser().resolve()
    if not src.exists():
        raise SystemExit(f"{src}: not found")
    out = Path(args.out).expanduser().resolve() if args.out else src.with_name(f"{src.stem} - narrated.html")
    args.voices = parse_voices(args.voices)
    args.lexicon = json.loads(Path(args.lexicon).read_text()) if args.lexicon else {}

    soup, root, comments, kind = sources.read(src)
    seq, report, voices = build_blocks(soup, root, comments, args)
    secs = sections_of(seq)
    if not seq:
        raise SystemExit(f"{src}: no readable text found")

    print(f"source: {kind}, {len(comments)} comment threads")
    for r in report:
        print(" | ".join(r))
    chars = sum(len(b["spoken"]) for b in seq)
    print(f"{len(seq)} blocks, {len(secs)} sections, {chars} spoken chars, about {chars / 15 / 60:.0f} min")
    if voices:
        print("voices: narrator " + args.voice + ", " + ", ".join(f"{k}={v}" for k, v in voices.items()))
    if args.extract_only:
        for s in secs:
            print(f"## {s['title']} ({len(s['blocks'])} blocks, {sum(len(b['spoken']) for b in s['blocks'])} chars)")
        blocks_file = out.with_suffix(".blocks.json")
        blocks_file.write_text(json.dumps(seq, indent=1, ensure_ascii=False))
        print(f"wrote {blocks_file}")
        return 0

    audio_dir = out.with_name(f"{out.stem}-audio")
    data = render_audio(secs[: args.max_sections] if args.max_sections else secs, audio_dir)
    title = norm(soup.title.get_text()) if soup.title else src.stem
    payload = {
        "title": title,
        "key": hashlib.sha1(title.encode()).hexdigest()[:8],
        "slug": slug(title),
        "hasComments": any(b["kind"] == "comment" for b in seq),
        "sections": data,
    }
    soup.body.append(BeautifulSoup(player_html(payload), "html.parser"))
    out.write_text(str(soup), encoding="utf-8")
    mins = sum(s["dur"] for s in data) / 60
    print(f"wrote {out} ({mins:.0f} min of audio in {len(data)} files, {audio_dir.name}/)")
    if args.max_sections and args.max_sections < len(secs):
        print(f"preview: {len(data)} of {len(secs)} sections. Run again without --max-sections for the rest (cached blocks are reused).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
