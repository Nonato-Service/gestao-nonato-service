@echo off
chcp 65001 >nul
title NONATO - Enviar pecas para Railway
cd /d "%~dp0"
echo.
echo  Envia biblioteca deste PC para Railway (nuvem)
echo  Origem: data\nonato-pecas-biblioteca.json
echo  Destino: https://gest-o-nonato-gestao.up.railway.app
echo.
node scripts\enviar-biblioteca-railway.mjs https://gest-o-nonato-gestao.up.railway.app
echo.
call scripts\abrir-edge.bat "https://gest-o-nonato-gestao.up.railway.app/"
pause
