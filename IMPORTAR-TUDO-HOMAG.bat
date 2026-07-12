@echo off
chcp 65001 >nul
title NONATO - Importar TUDO da HOMAG
cd /d "%~dp0"

echo.
echo  ============================================================
echo   IMPORTAR TUDO DA LOJA HOMAG
echo  ============================================================
echo.
echo  1580 paginas x 20 pecas = ~31 600 pecas (limite: 1600 paginas)
echo.
echo  MODO API activo — importa via SearchController (todo o catalogo)
echo  RETOMA RAPIDA — continua buckets em falta (ver import-state.json)
echo  Veja: "RETOMA RAPIDA" e "Paginacao visivel" (nao "Ainda a carregar 119s")
echo  Grava: PC + Railway (checkpoints a cada 500 pecas)
echo  Fotos em scripts/homag-import/out/images/ (export.json leve, sem base64)
echo  COM IMAGENS — pode demorar 6 a 12 HORAS. NAO FECHE a janela.
echo.
echo  ============================================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo ERRO: Node.js nao encontrado.
  pause
  exit /b 1
)

call npm install >nul 2>&1
call npx playwright install chromium

if exist "%~dp0homag-login.env" call "%~dp0homag-login.env"

set HOMAG_USE_API=1
set HOMAG_HEADLESS=0
set HOMAG_EMBED_IMAGES=0
set HOMAG_AUTO_MERGE=1
set HOMAG_AUTO_RAILWAY=1
set HOMAG_RESUME=1
set HOMAG_MAX_PAGES=1580
set HOMAG_RAILWAY_EVERY=500
set RAILWAY_URL=https://gest-o-nonato-gestao.up.railway.app

call npm run homag:import
set HOMAG_RC=%ERRORLEVEL%

if %HOMAG_RC%==1 (
  echo.
  echo Falhou ou parou — execute o BAT outra vez para RETOMAR de onde parou.
  pause
  exit /b 1
)

if %HOMAG_RC%==2 (
  echo.
  echo  ============================================================
  echo   PAROU A MEIO — progresso GUARDADO (nao perdeu pecas)
  echo   Execute este BAT outra vez para CONTINUAR (pagina em import-state.json)
  echo  ============================================================
  pause
  exit /b 2
)

call scripts\abrir-edge.bat "https://gest-o-nonato-gestao.up.railway.app/"
echo.
echo CONCLUIDO — importacao completa.
pause
