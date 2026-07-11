@echo off
chcp 65001 >nul
title NONATO - MINHAS PECAS URGENTE
cd /d "%~dp0"

echo.
echo  ========================================
echo   REPORE AS SUAS 362 PECAS AGORA
echo  ========================================
echo.

tasklist /FI "IMAGENAME eq node.exe" 2>nul | find /I "node.exe" >nul
if errorlevel 1 (
  echo A iniciar servidor...
  start "NONATO Servidor" cmd /k "cd /d %~dp0 && npm run dev"
  echo Aguarde 15 segundos...
  timeout /t 15 /nobreak >nul
)

start "" "http://localhost:3000/recuperar-biblioteca.html"
echo.
echo  1. Aguarde "Concluido" na pagina que abriu
echo  2. Depois va a Biblioteca de Pecas
echo  3. Prima Ctrl+Shift+R
echo.
pause
