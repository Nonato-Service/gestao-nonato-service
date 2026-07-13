@echo off

chcp 65001 >nul

title NONATO - Aplicar substituicoes HOMAG (codigo antigo -> novo)

cd /d "%~dp0"

echo.

echo  Liga codigos antigos (com hifen) ao SKU novo HOMAG.

echo  Se a imagem corresponder, mantem na peca nova.

echo  Edite data\homag-substituicoes-manuais.json para mapeamentos extra.

echo.

node --experimental-strip-types scripts/homag-import/aplicar-substituicoes-homag.mjs

echo.

pause

