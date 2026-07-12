@echo off
chcp 65001 >nul
title NONATO - Preencher PREÇOS HOMAG (login obrigatório)
cd /d "%~dp0"

echo.
echo  ============================================================
echo   PREENCHER PREÇOS — loja HOMAG (login B2B)
echo  ============================================================
echo.
echo  A HOMAG só mostra preços com login na loja.
echo  Crie o ficheiro homag-login.env nesta pasta com:
echo    set HOMAG_USER=seu_email@empresa
echo    set HOMAG_PASS=sua_senha
echo.
echo  Percorre os buckets da API e preenche preco nas 18507+ peças.
echo  Depois envia ao Railway automaticamente.
echo.
echo  ============================================================
echo.

if exist "%~dp0homag-login.env" call "%~dp0homag-login.env"

if "%HOMAG_USER%"=="" (
  echo ERRO: Defina HOMAG_USER e HOMAG_PASS em homag-login.env
  pause
  exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
  echo ERRO: Node.js nao encontrado.
  pause
  exit /b 1
)

call npm install >nul 2>&1

set HOMAG_USE_API=1
set HOMAG_HEADLESS=0
set HOMAG_EMBED_IMAGES=0
set HOMAG_AUTO_MERGE=1
set HOMAG_AUTO_RAILWAY=1
set HOMAG_API_BACKFILL_PRICES=1
set HOMAG_RESUME=0
set RAILWAY_URL=https://gest-o-nonato-gestao.up.railway.app

node scripts/homag-import/backfill-precos.mjs
set RC=%ERRORLEVEL%

if %RC%==0 (
  echo.
  echo CONCLUIDO — preços actualizados e enviados ao Railway.
) else (
  echo.
  echo Falhou — verifique login homag-login.env e tente outra vez.
)

pause
exit /b %RC%
