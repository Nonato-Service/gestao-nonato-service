@echo off
chcp 65001 >nul
title NONATO - Importar TUDO da HOMAG
cd /d "%~dp0"

echo.
echo  ============================================================
echo   IMPORTAR TUDO DA LOJA HOMAG
echo  ============================================================
echo.
echo  URL: spare-parts (shop.homag.com)
echo.
echo  PASSOS:
echo   1. Abre o browser Chromium
echo   2. FACA LOGIN na HOMAG (obrigatorio)
echo   3. Va a lista de spare parts
echo   4. Volte AQUI e prima ENTER
echo   5. O script importa e grava na biblioteca automaticamente
echo   6. No fim abre a pagina para ver as pecas na app
echo.
echo  ============================================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo ERRO: Node.js nao encontrado. Instale Node.js primeiro.
  pause
  exit /b 1
)

echo A preparar Playwright (primeira vez pode demorar)...
call npm install >nul 2>&1
call npx playwright install chromium

echo.
echo A abrir importador HOMAG...
echo.

set HOMAG_MANUAL=1
set HOMAG_HEADLESS=0
set HOMAG_AUTO_MERGE=1
call npm run homag:import

if errorlevel 1 (
  echo.
  echo Importacao falhou. Verifique login e lista de pecas na HOMAG.
  pause
  exit /b 1
)

echo.
echo A abrir recuperador para mostrar pecas na app...
timeout /t 2 /nobreak >nul
start "" "http://localhost:3000/recuperar-biblioteca.html"

echo.
echo CONCLUIDO. Aguarde as fotos carregarem na pagina que abriu.
echo.
pause
