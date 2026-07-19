@echo off
chcp 65001 >nul
title NONATO - Preencher fotos HOMAG
cd /d "%~dp0"

echo.
echo  ============================================================
echo   PREENCHER FOTOS — pecas HOMAG sem imagem
echo  ============================================================
echo.
echo  Revisa TODOS os buckets da API e descarrega fotos em falta.
echo  Ficheiros: codigo_NOME_DA_PECA.jpg em scripts/homag-import/out/images/
echo  Depois do import, envia automaticamente para Railway.
echo  Se falhar o envio automatico, execute: ENVIAR-PECAS-RAILWAY.bat
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

set HOMAG_MERGE_REPLACE_IMAGES=1
set HOMAG_USE_API=1
set HOMAG_API_BACKFILL_IMAGES=1
set HOMAG_HEADLESS=0
set HOMAG_EMBED_IMAGES=0
set HOMAG_AUTO_MERGE=1
set HOMAG_AUTO_RAILWAY=1
set HOMAG_RESUME=1
set HOMAG_RAILWAY_EVERY=200
set RAILWAY_URL=https://gest-o-nonato-gestao.up.railway.app

call npm run homag:import
pause
