@echo off
chcp 65001 >nul
title NONATO - Verificar catálogo HOMAG vs biblioteca
cd /d "%~dp0"

echo.
echo  ============================================================
echo   VERIFICAR CATÁLOGO HOMAG (demora ~15 minutos)
echo  ============================================================
echo.
echo  Compara TODOS os 62 buckets da API com a biblioteca local.
echo  Gera data/homag-audit-result.json com o resultado.
echo.
pause

where node >nul 2>&1
if errorlevel 1 (
  echo ERRO: Node.js nao encontrado.
  pause
  exit /b 1
)

call npm install >nul 2>&1
call npx playwright install chromium

node scripts/homag-import/contar-faltam-homag.mjs
set RC=%ERRORLEVEL%

echo.
if %RC%==0 (
  echo Concluido — veja data/homag-audit-result.json
) else (
  echo Terminou com codigo %RC%
)
pause
exit /b %RC%
