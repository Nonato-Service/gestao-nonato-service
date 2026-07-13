@echo off
chcp 65001 >nul
title NONATO - Importar peça HOMAG por código
cd /d "%~dp0"

echo.
echo  IMPORTAR PEÇA HOMAG POR CÓDIGO
echo  =============================
echo.
echo  Exemplos:
echo    3-835-16-6080
echo    3835166080
echo    2-029-95-0951
echo.
set /p CODIGO="Código ou referência HOMAG: "
if "%CODIGO%"=="" (
  echo Cancelado.
  pause
  exit /b 1
)

set HOMAG_HEADLESS=0
node scripts/homag-import/importar-peca-por-codigo.mjs "%CODIGO%"
echo.
echo  Depois: ENVIAR-PECAS-RAILWAY.bat  (para o site)
echo.
pause
