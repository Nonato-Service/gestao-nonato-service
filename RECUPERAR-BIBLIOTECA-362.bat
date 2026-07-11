@echo off
chcp 65001 >nul
title NONATO - Recuperar 362 peças
cd /d "%~dp0"

echo.
echo  Biblioteca de peças — recuperação directa
echo  ========================================
echo  O servidor deste PC tem 362 peças guardadas.
echo  Esta página grava-as no browser (substitui as 2 peças erradas).
echo.

start "" "http://localhost:3000/recuperar-biblioteca.html"
echo Abriu http://localhost:3000/recuperar-biblioteca.html
echo Se o site nao abrir, inicie primeiro REINICIAR-E-ABRIR-3000.bat
echo.
pause
