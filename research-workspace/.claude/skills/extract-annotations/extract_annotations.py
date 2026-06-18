#!/usr/bin/env python3
"""
Extract highlights and comments from annotated PDFs into clean Markdown.

Free and offline. Needs PyMuPDF once:  pip install pymupdf

Usage:
    python extract_annotations.py somefile.pdf
    python extract_annotations.py papers/2-processing/         # whole folder
    python extract_annotations.py papers/2-processing/ -o notes/raw-annotations.md

Output: for each PDF, every highlight (with the text under it), every sticky-note
comment, and the page number, in reading order. This is the clean input for the
note-assimilator skill.
"""

import sys
import argparse
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    sys.exit("PyMuPDF is not installed. Run:  pip install pymupdf")

# PDF annotation subtypes we treat as "markup on the text"
HIGHLIGHT_TYPES = {"Highlight", "Underline", "Squiggly", "StrikeOut"}
NOTE_TYPES = {"Text", "FreeText"}


def text_under(page, annot):
    """Return the page text covered by a highlight's quadpoints."""
    words = []
    vertices = annot.vertices or []
    # quadpoints come in groups of 4 points (one quad per highlighted line)
    quads = [vertices[i:i + 4] for i in range(0, len(vertices), 4)]
    for quad in quads:
        if len(quad) < 4:
            continue
        rect = fitz.Quad(quad).rect
        chunk = page.get_text("text", clip=rect).strip()
        if chunk:
            words.append(chunk)
    return " ".join(words).replace("\n", " ").strip()


def extract_one(pdf_path):
    doc = fitz.open(pdf_path)
    rows = []
    for pno, page in enumerate(doc, start=1):
        for annot in page.annots() or []:
            subtype = annot.type[1]
            comment = (annot.info.get("content") or "").strip()
            if subtype in HIGHLIGHT_TYPES:
                quote = text_under(page, annot)
                rows.append((pno, quote, comment))
            elif subtype in NOTE_TYPES and comment:
                rows.append((pno, "", comment))
    doc.close()
    return rows


def to_markdown(pdf_path, rows):
    out = [f"### {pdf_path.stem}", ""]
    if not rows:
        out.append("_No extractable annotations found. "
                   "If you highlighted in this PDF, check it wasn't flattened/printed to PDF._")
        out.append("")
        return "\n".join(out)
    for pno, quote, comment in rows:
        if quote and comment:
            out.append(f"- p.{pno} — \"{quote}\"  → **{comment}**")
        elif quote:
            out.append(f"- p.{pno} — \"{quote}\"")
        else:
            out.append(f"- p.{pno} — _note:_ **{comment}**")
    out.append("")
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser(description="Extract PDF highlights & comments to Markdown.")
    ap.add_argument("path", help="a PDF file or a folder of PDFs")
    ap.add_argument("-o", "--output", help="write Markdown here instead of stdout")
    args = ap.parse_args()

    target = Path(args.path)
    pdfs = sorted(target.glob("*.pdf")) if target.is_dir() else [target]
    if not pdfs:
        sys.exit(f"No PDFs found at {target}")

    blocks = [to_markdown(p, extract_one(p)) for p in pdfs]
    result = "\n".join(blocks)

    if args.output:
        Path(args.output).write_text(result, encoding="utf-8")
        print(f"Wrote annotations from {len(pdfs)} PDF(s) to {args.output}")
    else:
        print(result)


if __name__ == "__main__":
    main()
