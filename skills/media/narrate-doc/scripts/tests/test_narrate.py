"""Extraction tests: every source type, comment placement, sanitizing. No audio is made.

Run: $NARRATE_DOC_PYTHON -m unittest discover -s scripts/tests
"""

import json
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import narrate  # noqa: E402


def run(path, *extra):
    out = Path(path).with_name("out.html")
    narrate.main([str(path), "--out", str(out), "--extract-only", *extra])
    return json.loads(out.with_suffix(".blocks.json").read_text())


def comment_after(blocks, author):
    """Text of the block read just before AUTHOR's comment."""
    for i, b in enumerate(blocks):
        if b["kind"] == "comment" and b["spoken"].startswith(f"{author} commented"):
            return next(x["text"] for x in reversed(blocks[:i]) if x["kind"] != "comment")
    return None


DOCX_DOC = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Plan</w:t></w:r></w:p>
<w:p><w:r><w:t>First paragraph stays plain.</w:t></w:r></w:p>
<w:p><w:commentRangeStart w:id="0"/><w:r><w:t>Second paragraph has a comment.</w:t></w:r><w:commentRangeEnd w:id="0"/><w:r><w:commentReference w:id="0"/></w:r></w:p>
</w:body></w:document>"""
DOCX_COMMENTS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:comment w:id="0" w:author="Justin Walsh" w:date="2026-11-02T10:00:00Z"><w:p><w:r><w:t>Is this the right order?</w:t></w:r></w:p></w:comment>
</w:comments>"""
DOCX_TYPES = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/comments.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml"/>
</Types>"""
DOCX_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""
DOCX_DOC_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId9" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments" Target="comments.xml"/>
</Relationships>"""


class Extraction(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def test_markdown_sections_and_criticmarkup(self):
        p = self.dir / "doc.md"
        p.write_text(
            "---\ntitle: x\n---\n# Title\n\nIntro text.\n\n## One\n\nThe {==first claim==}{>>Kate Lewis: Needs a source.<<} is here.\n\n"
            "- item a\n- item b {>>Ken: Why b?<<}\n\n## Two\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n```\ncode\nmore\n```\n"
        )
        blocks = run(p)
        kinds = [b["kind"] for b in blocks]
        self.assertIn("tr", kinds)
        self.assertIn("pre", kinds)
        self.assertEqual(comment_after(blocks, "Kate Lewis"), "The first claim is here.")
        self.assertEqual(comment_after(blocks, "Ken"), "item b")
        row = next(b for b in blocks if b["kind"] == "tr" and b["text"] == "1 2")
        self.assertEqual(row["spoken"], "A: 1. B: 2.")
        self.assertNotIn("title: x", " ".join(b["text"] for b in blocks))
        self.assertEqual(narrate.sections_of(blocks)[1]["title"], "One")

    def test_docx_comments(self):
        p = self.dir / "doc.docx"
        with zipfile.ZipFile(p, "w") as z:
            z.writestr("[Content_Types].xml", DOCX_TYPES)
            z.writestr("_rels/.rels", DOCX_RELS)
            z.writestr("word/_rels/document.xml.rels", DOCX_DOC_RELS)
            z.writestr("word/document.xml", DOCX_DOC)
            z.writestr("word/comments.xml", DOCX_COMMENTS)
        blocks = run(p)
        self.assertEqual(comment_after(blocks, "Justin Walsh"), "Second paragraph has a comment.")
        self.assertFalse(any("[" in b["text"] and "]" in b["text"] for b in blocks), "comment reference markers leaked")
        self.assertEqual(sum(b["kind"] == "comment" for b in blocks), 1)

    def test_pdf_annotations(self):
        import pymupdf

        p = self.dir / "doc.pdf"
        doc = pymupdf.open()
        pg = doc.new_page()
        pg.insert_text((72, 80), "Quarterly review", fontsize=20)
        pg.insert_text((72, 130), "Revenue grew in the second quarter.", fontsize=11)
        pg.insert_text((72, 160), "Costs stayed flat across teams.", fontsize=11)
        hits = pg.search_for("Costs stayed flat")
        a = pg.add_highlight_annot(hits[0])
        a.set_info(content="Check the hiring costs.", title="Claudio")
        a.update()
        doc.save(p)
        blocks = run(p)
        self.assertIn("Costs stayed flat", comment_after(blocks, "Claudio") or "")

    def test_html_sanitized_and_big_table_announced(self):
        p = self.dir / "page.html"
        rows = "".join(f"<tr><td>r{i}</td></tr>" for i in range(50))
        p.write_text(
            "<html><head><title>T</title><script>alert(1)</script></head><body onload='x()'>"
            "<nav><p>menu</p></nav><main><h2>A</h2><p>Read me.</p><table>" + rows + "</table>"
            "<h2>B</h2><div>Loose text in a div.</div><p><a href='javascript:x()'>link</a></p></main></body></html>"
        )
        blocks = run(p)
        texts = [b["text"] for b in blocks]
        self.assertNotIn("menu", texts)
        self.assertIn("Table with 50 rows", texts)
        self.assertIn("Loose text in a div.", texts)
        self.assertFalse(any(b["kind"] == "tr" for b in blocks))
        soup, _, _, _ = narrate.sources.read(p)
        self.assertIsNone(soup.find("script"))
        self.assertNotIn("onload", str(soup))
        self.assertNotIn("javascript:", str(soup))

    def test_no_headings_falls_back_to_parts(self):
        p = self.dir / "flat.md"
        p.write_text("\n\n".join(f"Paragraph {i}." for i in range(85)))
        secs = narrate.sections_of(run(p))
        self.assertEqual([s["title"] for s in secs], ["Part 1", "Part 2", "Part 3"])

    def test_unmatched_comment_is_kept(self):
        comments = [{"anchor": "text that is not in the page at all", "cid": None,
                     "items": [{"author": "Brittany", "when": "", "text": "Orphan note."}]}]
        from bs4 import BeautifulSoup

        soup = BeautifulSoup("<html><head><title>T</title></head><body><article><p>Only this.</p></article></body></html>", "html.parser")

        class O:
            read_tables, voice, voices, lexicon = 40, "af_heart", {}, {}

        seq, report, _ = narrate.build_blocks(soup, soup.article, comments, O)
        self.assertEqual(report[0][0], "UNPLACED")
        self.assertEqual(seq[-1]["kind"], "comment")
        self.assertIn("Comments not matched to the text", [b["text"] for b in seq])

    def test_speakify(self):
        lex = {"SCORM": "scorm"}
        self.assertEqual(narrate.speakify("SCORM e.g. 3-5 items ~ 40% → done", lex),
                         "scorm for example, 3 to 5 items about 40 percent to done.")
        self.assertEqual(narrate.speakify("Benchmark (3).pptx", {}), "Benchmark (3) deck.")
        self.assertEqual(narrate.speakify("Ship it \U0001F680", {}), "Ship it.")
        self.assertEqual(narrate.speakify("Hi Adam,", {}), "Hi Adam.")
        self.assertEqual(narrate.speakify("$30/hr at site.com/~bob", {}), "$30 an hour at site.com/bob.")

    def test_key_value_table_from_converter(self):
        p = self.dir / "kv.md"
        p.write_text("| **Role applied for** | QA tester and Playwright for e-learning software |\n|---|---|\n| **Bid rate** | $30/hr |\n")
        rows = [b["spoken"] for b in run(p) if b["kind"] == "tr"]
        self.assertEqual(rows, ["Role applied for: QA tester and Playwright for e-learning software.", "Bid rate: $30 an hour."])

    def test_update_player_keeps_data(self):
        payload = {"title": "T", "key": "abcd1234", "sections": [{"title": "S", "file": "x-audio/sec00.mp3", "dur": 1.0,
                   "blocks": [{"id": "b1", "s": 0, "e": 1, "k": "comment"}]}]}
        p = self.dir / "page.html"
        p.write_text("<html><body><p data-say='b1'>x</p>" + narrate.player_html(payload) + "</body></html>")
        narrate.update_player(p)
        narrate.update_player(p)
        html = p.read_text()
        self.assertEqual(html.count('id="say-bar"'), 1)
        self.assertEqual(html.count("const D = "), 1)
        self.assertIn('"hasComments": true', html)
        self.assertIn('"slug": "t"', html)
        self.assertIn("x-audio/sec00.mp3", html)


if __name__ == "__main__":
    unittest.main()
