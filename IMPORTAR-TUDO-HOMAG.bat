@echo off
chcp 65001 >nul
title NONATO - Importar TUDO da HOMAG
cd /d "%~dp0"

echo.
echo  ============================================================
echo   IMPORTAR TUDO DA LOJA HOMAG
echo  ============================================================
echo.
echo  Codigos: 2006807481 ^| 2-006-80-7481 ^| 2006808181R ^| R2006215960
echo.
echo  Se VERIFICAR-CATALOGO-HOMAG.bat disser 0 em falta:
echo    - Modo RAPIDO (~2 min): merge + referencias + Railway
echo  Se faltarem pecas:
echo    - Modo COMPLETO (2-6 horas): 62 buckets da API
echo.
echo  ============================================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo ERRO: Node.js nao encontrado. Instale em https://nodejs.org
  pause
  exit /b 1
)

if not exist "%~dp0scripts\homag-import\config.json" (
  echo ERRO: Falta scripts\homag-import\config.json
  echo Copie config.example.json para config.json
  pause
  exit /b 1
)

echo [1/3] Dependencias npm...
call npm install >nul 2>&1

echo [2/3] Playwright Chromium (1.ª vez demora ~3 min — nao feche)...
call npx playwright install chromium
rem Nao abortar se install avisar — o import tenta abrir o browser na mesma

if exist "%~dp0homag-login.env" call "%~dp0homag-login.env"

set HOMAG_USE_API=1
set HOMAG_HEADLESS=0
set HOMAG_EMBED_IMAGES=0
set HOMAG_AUTO_MERGE=1
set HOMAG_AUTO_RAILWAY=1
set HOMAG_RESUME=1
set HOMAG_FAST_IF_COMPLETE=1
set HOMAG_MAX_PAGES=1580
set HOMAG_RAILWAY_EVERY=500
set RAILWAY_URL=https://gest-o-nonato-gestao.up.railway.app

echo [3/3] Importacao HOMAG (abre browser HOMAG — aguarde)...
echo.
call npm run homag:import
set HOMAG_RC=%ERRORLEVEL%

if %HOMAG_RC%==1 (
  echo.
  echo  ============================================================
  echo   FALHOU — leia a mensagem acima
  echo  ============================================================
  echo   Chromium em falta: npx playwright install chromium
  echo   Sessao Aura: deixe a pagina HOMAG carregar no browser
  echo   Depois execute este BAT outra vez
  echo  ============================================================
  pause
  exit /b 1
)

if %HOMAG_RC%==2 (
  echo.
  echo  ============================================================
  echo   PAROU A MEIO — progresso GUARDADO
  echo   Execute este BAT outra vez para CONTINUAR
  echo  ============================================================
  pause
  exit /b 2
)

call scripts\abrir-edge.bat "https://gest-o-nonato-gestao.up.railway.app/"
echo.
echo CONCLUIDO — biblioteca actualizada no PC e Railway.
echo No site: Ctrl+Shift+R e Repor biblioteca do servidor.
pause
