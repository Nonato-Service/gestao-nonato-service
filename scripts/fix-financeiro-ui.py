#!/usr/bin/env python3
path = r"C:\Users\W10\gestao-tecnica-nonato-service\app\page.tsx"
with open(path, "r", encoding="utf-8", errors="replace") as f:
    lines = f.readlines()

style_line = "                              style={{ padding: '8px 12px', fontSize: '12px' }}\n"
removed = 0
for i, line in enumerate(lines):
    if line != style_line:
        continue
    window = "".join(lines[max(0, i - 4) : i])
    if "financeiro-despesas-bib-btn" in window:
        lines[i] = ""
        removed += 1

with open(path, "w", encoding="utf-8", newline="\n") as f:
    f.writelines(lines)
print("removed inline styles:", removed)
