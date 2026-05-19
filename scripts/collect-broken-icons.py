#!/usr/bin/env python3
import re
from pathlib import Path

text = (Path(__file__).parents[1] / "app" / "page.tsx").read_text(encoding="utf-8")

# Strings between > and {tx or safeT or t. on same line (button labels)
pat = re.compile(r">(\s*[^\n<]{0,12}?)\s*\{(?:tx|safeT|t|tm|ft|txOs)\.")
found = set()
for m in pat.finditer(text):
    s = m.group(1).strip()
    if s and not s.startswith("<") and not s[0].isalnum():
        found.add(s)

print("prefixes before {tx", len(found))
for s in sorted(found, key=len)[:50]:
    print(repr(s))

# Lines with span 14px icons - map by following text
for m in re.finditer(
    r"fontSize: '14px', lineHeight: '1' }}>([^<]+)</span>\s*\n\s*<span[^>]*>([^<]+)",
    text,
):
    print("ICON+LABEL", repr(m.group(1)), "->", m.group(2)[:30])
