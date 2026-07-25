@echo off
chcp 65001 >nul
title NONATO - Importar TUDO da HOMAG
cd /d "%~dp0"

echo.
echo  ============================================================
echo   IMPORTAR TUDO DA LOJA HOMAG
echo  ============================================================
echo.
echo  A HOMAG mostra ~31 000 linhas na loja, mas sao ~18 000
echo  codigos UNICOS na API (duplicados entre categorias).
echo  A biblioteca local ja tem ~21 400 pecas.
echo.
echo  Codigos aceites: 2006807481 | 2-006-80-7481 | 2006808181R | R2006215960
echo.
echo  MODO API — importa via SearchController (62 buckets)
echo  RETOMA automatica — continua de export.json / import-state.json
echo  Grava: PC + Railway (checkpoints a cada 500 pecas)
echo  Demora 2 a 6 horas se faltarem pecas. NAO FECHE a janela.
echo.
echo  Dica: execute VERIFICAR-CATALOGO-HOMAG.bat antes para ver quantas faltam.
echo  Se faltam 0, o import so actualiza fotos/precos/referencias.
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

call npm install >nul 2>&1
call npx playwright install chromium
if errorlevel 1 (
  echo ERRO: Playwright/Chromium nao instalou. Execute: npx playwright install chromium
  pause
  exit /b 1
)

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
  echo Falhou — veja a mensagem acima.
  echo Se Playwright falhou: npx playwright install chromium
  echo Se sessao Aura falhou: abra a loja HOMAG no browser e tente outra vez.
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
