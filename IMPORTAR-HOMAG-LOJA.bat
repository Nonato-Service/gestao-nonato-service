@echo off
chcp 65001 >nul
title NONATO - Importar peças HOMAG
cd /d "%~dp0"

echo.
echo  IMPORTAR DA HOMAG eShop (mesmas regras que IMPORTAR-TUDO-HOMAG)
echo  ================================================================
echo  RETOMA automatica — paginacao segura (max clique directo: 250)
echo  Use IMPORTAR-TUDO-HOMAG.bat para importacao completa + Railway
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo ERRO: Node.js nao encontrado.
  pause
  exit /b 1
)

call npm install >nul 2>&1
call npx playwright install chromium

set HOMAG_HEADLESS=0
set HOMAG_AUTO_MERGE=1
set HOMAG_AUTO_RAILWAY=0
set HOMAG_RESUME=1
set HOMAG_MAX_PAGES=1600
set HOMAG_RAILWAY_EVERY=500

call npm run homag:import
set HOMAG_RC=%ERRORLEVEL%

if %HOMAG_RC%==1 (
  echo.
  echo Falhou — execute outra vez para RETOMAR.
  pause
  exit /b 1
)

if %HOMAG_RC%==2 (
  echo.
  echo PAROU A MEIO — progresso guardado. Execute outra vez para CONTINUAR.
  pause
  exit /b 2
)

echo.
echo Depois: Biblioteca de Pecas - Importacao - Carregar scripts\homag-import\out\export.json
echo.
pause
