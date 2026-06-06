@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Nonato Campo — Instalar no telemovel

echo.
echo  ============================================
echo   NONATO CAMPO — INSTALAR NO TELEMOVEL
echo  ============================================
echo.
echo  Precisa abrir o link UMA VEZ no telemovel.
echo  Depois de instalar, funciona OFFLINE para sempre.
echo.

where python >nul 2>&1
if errorlevel 1 (
  echo  ERRO: Instale Python ou envie o link Railway:
  echo  https://SEU-APP.up.railway.app/campo-app/
  echo.
  pause
  exit /b 1
)

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
  set IP=%%a
  goto :found
)
:found
set IP=%IP: =%

echo  1. Telefone na MESMA Wi-Fi que este PC
echo  2. Chrome no telemovel, abrir:
echo.
echo       http://%IP%:8767
echo.
echo  3. Tocar «Instalar app» ou menu - Adicionar ao ecra
echo  4. FEITO — pode desligar Wi-Fi e PC
echo.
echo  Deixe esta janela aberta ate instalar.
echo  ============================================
echo.

python -m http.server 8767 --bind 0.0.0.0
