#!/usr/bin/env python3
"""Build the standalone AMATH 351 lab with the Python standard library."""

import argparse
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Check the committed output without writing.")
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    fragment = (root / "src" / "experiment.html").read_text(encoding="utf-8")
    prologue = (root / "src" / "prologue.html").read_text(encoding="utf-8")
    model = (root / "src" / "prologue-model.cjs").read_text(encoding="utf-8")
    template = (root / "src" / "page.html").read_text(encoding="utf-8")
    model_marker = "{{AMATH351_INTRO_MODEL}}"
    if prologue.count(model_marker) != 1:
        raise SystemExit("Expected exactly one introductory model placeholder.")
    prologue = prologue.replace(model_marker, model)
    result = template
    for marker, content in [("{{AMATH351_PROLOGUE}}", prologue), ("{{AMATH351_EXPERIMENT}}", fragment)]:
        if result.count(marker) != 1:
            raise SystemExit(f"Expected exactly one {marker} placeholder.")
        result = result.replace(marker, content)
    output = root / "index.html"
    if args.check:
        if not output.exists() or output.read_text(encoding="utf-8") != result:
            raise SystemExit("Run python3 build.py to refresh index.html.")
        print("AMATH 351 standalone output is current.")
    else:
        output.write_text(result, encoding="utf-8")
        print("Built index.html.")


if __name__ == "__main__":
    main()
