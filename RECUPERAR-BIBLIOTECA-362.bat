@echo off

chcp 65001 >nul

title NONATO - Recuperar peças E FOTOS (sem ir ao site)

cd /d "%~dp0"



echo.

echo  RECUPERAR BIBLIOTECA COMPLETA

echo  =============================

echo  362 peças + 208 fotos estão guardadas NESTE PC.

echo  Abre no Microsoft Edge — http://localhost:3000

echo  Aguarde 2-5 minutos enquanto as fotos carregam.

echo.



call scripts\abrir-edge.bat "http://localhost:3000/recuperar-biblioteca.html"

echo.

pause

