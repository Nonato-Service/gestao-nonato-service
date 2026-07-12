@echo off
chcp 65001 >nul
title NONATO - Recuperar TODAS as pecas (451)
cd /d "%~dp0"

echo.
echo  RECUPERAR PEÇAS EM FALTA — backup 01/07/2026 (451 peças)
echo  ========================================================
echo.

node scripts\restaurar-biblioteca-max-backup.mjs
if errorlevel 1 (
  echo ERRO na recuperacao.
  pause
  exit /b 1
)

node scripts\gerar-biblioteca-lite.mjs

echo.
echo  A enviar catalogo completo para Railway...
node scripts\enviar-biblioteca-railway.mjs https://gest-o-nonato-gestao.up.railway.app

echo.
echo  A abrir Railway no Edge...
call scripts\abrir-edge.bat "https://gest-o-nonato-gestao.up.railway.app/"
echo.
echo  Depois: Biblioteca de Pecas - Ctrl+Shift+R
pause
