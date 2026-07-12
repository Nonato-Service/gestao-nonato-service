@echo off
chcp 65001 >nul
title NONATO - Atualizar biblioteca no Railway
cd /d "%~dp0"
echo.
echo  ATUALIZAR BIBLIOTECA NO SITE RAILWAY
echo  ====================================
echo.
echo  1. Abre pagina que carrega as pecas do servidor
echo  2. Aguarde terminar (1-2 min)
echo  3. Volte ao site e prima Ctrl+Shift+R
echo.
call scripts\abrir-edge.bat "https://gest-o-nonato-gestao.up.railway.app/recuperar-biblioteca.html"
echo.
pause
