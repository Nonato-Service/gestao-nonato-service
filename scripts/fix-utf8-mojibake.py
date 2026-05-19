#!/usr/bin/env python3
"""Corrige mojibake com ftfy (UTF-8 mal interpretado)."""
from __future__ import annotations

import sys
from pathlib import Path

try:
    import ftfy
except ImportError:
    print("Instale: pip install ftfy")
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
TARGETS = [
    ROOT / "app" / "page.tsx",
    ROOT / "app" / "translations.ts",
]


def fix_file(path: Path) -> bool:
    original = path.read_text(encoding="utf-8")
    fixed = ftfy.fix_text(original, normalization="NFC")
    if fixed == original:
        return False
    path.write_text(fixed, encoding="utf-8", newline="\n")
    return True


def main() -> int:
    for p in TARGETS:
        if not p.is_file():
            continue
        ok = fix_file(p)
        print(p.name, "updated" if ok else "ok")
    return 0


if __name__ == "__main__":
    sys.exit(main())
