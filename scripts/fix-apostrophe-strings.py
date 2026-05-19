#!/usr/bin/env python3
"""Corrige apóstrofos não escapados em strings '...' de uma linha."""
import re
from pathlib import Path

path = Path(__file__).parents[1] / "app" / "translations.ts"
text = path.read_text(encoding="utf-8")
lines = text.splitlines()
fixed = 0

for i, line in enumerate(lines):
    if ": '" not in line and ": '" not in line:
        continue
    # key: 'value',
    m = re.match(r"^(\s+\w+:\s+)'(.*)('),?\s*$", line)
    if not m:
        continue
    inner = m.group(2)
    if "'" not in inner:
        continue
    if "\\'" in inner and inner.replace("\\'", "").count("'") == 0:
        continue
    # tem ' literal não escapado
    if re.search(r"(?<!\\)'", inner):
        new_inner = re.sub(r"(?<!\\)'", r"\\'", inner)
        comma = "," if line.rstrip().endswith(",") else ""
        lines[i] = f"{m.group(1)}'{new_inner}'{comma}"
        fixed += 1

path.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("fixed", fixed)
