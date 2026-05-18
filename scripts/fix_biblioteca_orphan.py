from pathlib import Path
p = Path(r"C:\Users\W10\gestao-tecnica-nonato-service\app\page.tsx")
lines = p.read_text(encoding="utf-8").splitlines(keepends=True)
del lines[60960:61100]
for i, l in enumerate(lines):
    if "case 'relatorios-excluidos-clientes':" in l:
        if i > 0 and lines[i - 1].strip() == ")":
            lines.insert(i, "      }\n")
        break
p.write_text("".join(lines), encoding="utf-8")
print("ok")
