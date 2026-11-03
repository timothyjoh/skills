"""Read a source file into one HTML page and a list of comments.

read(path) returns (soup, root, comments, kind):
  soup      the page to narrate (BeautifulSoup)
  root      the element that holds the readable content
  comments  [{"anchor": str or None, "cid": str or None, "items": [{"author", "when", "text"}]}]
            anchor: text the comment is attached to, matched against the page blocks
            cid:    id of a <span data-say-cid> marker placed in the page at the comment
  kind      "notion", "html", "markdown", "docx", "pdf"

Every reader removes scripts, frames and event handlers: the page is opened
in a browser and the source is untrusted.
"""

import contextlib
import html
import io
import re
import shutil
import subprocess
import tempfile
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from bs4 import BeautifulSoup

TEMPLATES = Path(__file__).resolve().parent.parent / "templates"
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
TEXTUTIL_TYPES = {".doc", ".rtf", ".rtfd", ".odt", ".wordml", ".webarchive"}


def norm(s):
    s = s.replace(" ", " ")
    s = re.sub(r"[‘’]", "'", s)
    s = re.sub(r"[“”]", '"', s)
    return re.sub(r"\s+", " ", s).strip()


def page(title, body_html):
    t = (TEMPLATES / "page.html").read_text(encoding="utf-8")
    t = t.replace("__TITLE__", html.escape(title))
    return BeautifulSoup(t.replace("<!--__BODY__-->", body_html), "html.parser")


def sanitize(soup):
    for tag in soup.find_all(["script", "iframe", "object", "embed", "frame", "frameset", "base"]):
        tag.decompose()
    for tag in soup.find_all("meta", attrs={"http-equiv": True}):
        tag.decompose()
    for tag in soup.find_all(True):
        for attr in list(tag.attrs):
            v = tag.attrs[attr]
            v = " ".join(v) if isinstance(v, list) else str(v)
            if attr.lower().startswith("on") or re.match(r"\s*(javascript|vbscript):", v, re.I):
                del tag.attrs[attr]
    return soup


def first_heading(soup, fallback):
    h = soup.find(["h1", "h2"])
    return norm(h.get_text()) if h else fallback


# ---------- HTML (Notion exports included)

def notion_comments(soup):
    summ = soup.find("summary", string=re.compile("Inline comments"))
    if not summ:
        return []
    box = summ.parent
    groups, seen = [], set()
    for grp in box.find_all("div", class_="indented", recursive=False):
        mark = grp.find("mark")
        if not mark:
            continue
        anchor = norm(mark.get_text())
        items = []
        for li in grp.select("ul.toggle > li"):
            divs = li.find_all("div", recursive=False)
            author = norm(li.find("b").get_text()) if li.find("b") else "Unknown"
            when = norm(li.find("time").get_text()) if li.find("time") else ""
            text = norm(divs[1].get_text(" ")) if len(divs) > 1 else ""
            if text:
                items.append({"author": author, "when": when, "text": text})
        sig = (anchor.lower(), tuple((i["author"], i["when"], i["text"]) for i in items))
        if items and sig not in seen:
            seen.add(sig)
            groups.append({"anchor": anchor, "cid": None, "items": items})
    box.decompose()
    return groups


def read_html(path):
    soup = sanitize(BeautifulSoup(Path(path).read_text(encoding="utf-8", errors="replace"), "html.parser"))
    if soup.body is None:
        soup = page(Path(path).stem, str(soup))
    notion = soup.find("summary", string=re.compile("Inline comments")) is not None or soup.find(
        "article", class_="page"
    ) is not None
    comments = notion_comments(soup) if notion else []
    root = soup.find("article") or soup.find("main") or soup.body
    if soup.title is None or not norm(soup.title.get_text()):
        title = soup.new_tag("title")
        title.string = first_heading(soup, Path(path).stem)
        (soup.head or soup.body).insert(0, title)
    return soup, root, comments, "notion" if notion else "html"


# ---------- Markdown (CriticMarkup comments: {==text==}{>>Name: comment<<} or {>>comment<<})

CRITIC = re.compile(r"(?:\{==(.+?)==\})?\{>>(.+?)<<\}", re.S)


def split_author(text):
    m = re.match(r"^([^:\n]{1,40}):\s+(.+)$", text.strip(), re.S)
    return (m.group(1).strip(), m.group(2).strip()) if m else ("Comment", text.strip())


def read_markdown(path):
    from markdown_it import MarkdownIt

    text = Path(path).read_text(encoding="utf-8", errors="replace")
    text = re.sub(r"\A---\n.*?\n---\n", "", text, flags=re.S)
    comments = []

    def mark(m):
        cid = f"md{len(comments)}"
        author, body = split_author(m.group(2))
        comments.append({"anchor": None, "cid": cid, "items": [{"author": author, "when": "", "text": norm(body)}]})
        return (m.group(1) or "") + f'<span data-say-cid="{cid}"></span>'

    text = CRITIC.sub(mark, text)
    md = MarkdownIt("commonmark", {"html": True}).enable(["table", "strikethrough"])
    soup = sanitize(page("", md.render(text)))
    soup.title.string = first_heading(soup, Path(path).stem)
    return soup, soup.find("article"), comments, "markdown"


# ---------- Word (.docx, with its comments; other word-processor files via LibreOffice or textutil)

def docx_comments(zf):
    try:
        root = ET.fromstring(zf.read("word/comments.xml"))
    except KeyError:
        return {}
    out = {}
    for c in root.iter(f"{W}comment"):
        paras = ["".join(t.text or "" for t in p.iter(f"{W}t")) for p in c.iter(f"{W}p")]
        text = norm(" ".join(p for p in paras if p))
        if text:
            out[c.get(f"{W}id")] = {
                "author": c.get(f"{W}author") or "Unknown",
                "when": (c.get(f"{W}date") or "")[:10],
                "text": text,
            }
    return out


def docx_title(zf, fallback):
    try:
        core = zf.read("docProps/core.xml").decode("utf-8", "replace")
    except KeyError:
        return fallback
    m = re.search(r"<dc:title>([^<]+)</dc:title>", core)
    return norm(html.unescape(m.group(1))) if m and norm(m.group(1)) else fallback


def read_docx(path):
    import mammoth

    with open(path, "rb") as f:
        body = mammoth.convert_to_html(f, style_map="comment-reference => sup").value
    with zipfile.ZipFile(path) as zf:
        found = docx_comments(zf)
        soup = sanitize(page("", body))
        soup.title.string = docx_title(zf, first_heading(soup, Path(path).stem))
    comments = []
    for a in soup.select('a[id^="comment-ref-"]'):
        cid = a["id"][len("comment-ref-"):]
        marker = soup.new_tag("span", attrs={"data-say-cid": f"w{cid}"})
        (a.find_parent("sup") or a).replace_with(marker)
        if cid in found:
            comments.append({"anchor": None, "cid": f"w{cid}", "items": [found[cid]]})
    for dt in soup.select('dt[id^="comment-"]'):
        dl = dt.find_parent("dl")
        if dl:
            dl.decompose()
    return soup, soup.find("article"), comments, "docx"


def read_other_word(path):
    if shutil.which("soffice") and Path(path).suffix.lower() in {".doc", ".odt", ".rtf"}:
        with tempfile.TemporaryDirectory() as tmp:
            subprocess.run(
                ["soffice", "--headless", "--convert-to", "docx", "--outdir", tmp, str(path)],
                check=True, capture_output=True,
            )
            out = next(Path(tmp).glob("*.docx"))
            return read_docx(out)
    if shutil.which("textutil"):
        res = subprocess.run(
            ["textutil", "-convert", "html", "-stdout", str(path)], check=True, capture_output=True
        )
        soup = sanitize(BeautifulSoup(res.stdout.decode("utf-8", "replace"), "html.parser"))
        body = soup.body.decode_contents() if soup.body else str(soup)
        soup = page("", body)
        soup.title.string = first_heading(soup, Path(path).stem)
        return soup, soup.find("article"), [], "html"
    raise SystemExit(f"{path}: needs LibreOffice (soffice) or macOS textutil to convert. Save it as .docx instead.")


# ---------- PDF (text layer via pymupdf4llm; annotations with text become comments)

def pdf_date(s):
    m = re.match(r"D:(\d{4})(\d{2})(\d{2})", s or "")
    return f"{m.group(1)}-{m.group(2)}-{m.group(3)}" if m else ""


def pdf_comments(doc):
    out = []
    for pg in doc:
        blocks = [b for b in pg.get_text("blocks") if b[6] == 0 and norm(b[4])]
        for a in pg.annots() or []:
            info = a.info
            text = norm(info.get("content") or "")
            if not text:
                continue
            kind = a.type[1]
            anchor = ""
            if kind in {"Highlight", "Underline", "StrikeOut", "Squiggly"}:
                anchor = norm(pg.get_textbox(a.rect + (-1, -1, 1, 1)))
            if not anchor and blocks:
                r = a.rect
                near = min(blocks, key=lambda b: 0 if b[1] <= r.y0 <= b[3] else min(abs(b[1] - r.y0), abs(b[3] - r.y0)))
                anchor = norm(near[4])[:120]
            out.append({
                "anchor": anchor or None,
                "cid": None,
                "items": [{"author": norm(info.get("title") or "") or "Unknown", "when": pdf_date(info.get("creationDate") or info.get("modDate")), "text": text}],
            })
    return out


def read_pdf(path):
    import pymupdf
    import pymupdf4llm
    from markdown_it import MarkdownIt

    doc = pymupdf.open(path)
    if not any(norm(pg.get_text()) for pg in doc):
        raise SystemExit(f"{path}: no text layer (a scanned PDF). Run OCR first, for example `ocrmypdf IN.pdf OUT.pdf`.")
    with contextlib.redirect_stdout(io.StringIO()):
        md_text = pymupdf4llm.to_markdown(doc, header=False, footer=False, ignore_images=True, use_ocr=False, show_progress=False)
    md = MarkdownIt("commonmark", {"html": False, "breaks": False}).enable(["table", "strikethrough"])
    soup = sanitize(page("", md.render(md_text)))
    for br_text in soup.find_all(string=re.compile("<br>")):
        br_text.replace_with(br_text.replace("<br>", " "))
    title = norm(doc.metadata.get("title") or "") or first_heading(soup, Path(path).stem)
    soup.title.string = title
    return soup, soup.find("article"), pdf_comments(doc), "pdf"


READERS = {".html": read_html, ".htm": read_html, ".md": read_markdown, ".markdown": read_markdown,
           ".txt": read_markdown, ".docx": read_docx, ".pdf": read_pdf}


def read(path):
    ext = Path(path).suffix.lower()
    if ext in READERS:
        return READERS[ext](path)
    if ext in TEXTUTIL_TYPES:
        return read_other_word(path)
    raise SystemExit(f"{path}: unsupported type {ext}. Supported: {', '.join(sorted(set(READERS) | TEXTUTIL_TYPES))}")
