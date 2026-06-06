@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Nonato Campo — App de Terreno

echo.
echo  Nonato Campo — a abrir no navegador...
echo  Pasta: %~dp0
echo  Para fechar o servidor, feche esta janela ou prima Ctrl+C.
echo.

where python >nul 2>&1
if errorlevel 1 (
  echo  Python nao encontrado. A abrir o ficheiro directamente.
  start "" "%~dp0index.html"
  pause
  exit /b 0
)

start "" "http://127.0.0.1:8767"
python -m http.server 8767 --bind 127.0.0.1
