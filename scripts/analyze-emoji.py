#!/usr/bin/env python3
import re
from pathlib import Path

text = (Path(__file__).parents[1] / "app" / "page.tsx").read_text(encoding="utf-8")
m = re.search(r"fontSize: '14px', lineHeight: '1' }}>([^<]+)", text)
s = m.group(1)
print("repr:", repr(s))
print("codepoints:", [f"U+{ord(c):04X}" for c in s])
for enc in ("latin-1", "cp1252"):
    try:
        t = s.encode(enc).decode("utf-8")
        print(enc, "->", repr(t), t)
    except Exception as e:
        print(enc, "ERR", e)
try:
    t = s.encode("latin-1").decode("utf-8").encode("latin-1").decode("utf-8")
    print("double ->", repr(t), t)
except Exception as e:
    print("double ERR", e)
