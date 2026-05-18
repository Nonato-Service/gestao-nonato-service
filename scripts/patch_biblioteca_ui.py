# -*- coding: utf-8 -*-
from pathlib import Path

path = Path(r"C:\Users\W10\gestao-tecnica-nonato-service\app\page.tsx")
lines = path.read_text(encoding="utf-8").splitlines(keepends=True)
start = next(i for i, l in enumerate(lines) if "biblioteca-relatorios-client-list" in l)
end = None
for i in range(start + 1, min(start + 400, len(lines))):
    if lines[i].strip() == "</div>" and i + 1 < len(lines) and lines[i + 1].strip() == ")}":
        end = i
        break
if end is None:
    raise SystemExit("end not found")

new_block = Path(__file__).parent.joinpath("biblioteca_new_client_list.jsx").read_text(encoding="utf-8")
new_lines = new_block.splitlines(keepends=True)
if new_lines and not new_lines[-1].endswith("\n"):
    new_lines[-1] += "\n"

out = lines[:start] + new_lines + lines[end + 1 :]
path.write_text("".join(out), encoding="utf-8")
print(f"Patched lines {start + 1}-{end + 1}")
