@echo off
chcp 65001 >nul
title NONATO - Recuperar peças E FOTOS (sem ir ao site)
cd /d "%~dp0"

echo.
echo  RECUPERAR BIBLIOTECA COMPLETA
echo  =============================
echo  362 peças + 208 fotos estão guardadas NESTE PC.
echo  NÃO precisa ir buscar nada ao site outra vez.
echo  Aguarde 2-5 minutos enquanto as fotos carregam.
echo.

start "" "http://localhost:3000/recuperar-biblioteca.html"
echo.
pause
