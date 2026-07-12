@echo off
chcp 65001 >nul
title NONATO - MINHAS PECAS URGENTE
cd /d "%~dp0"

echo.
echo  ========================================
echo   REPORE AS SUAS 362 PECAS AGORA
echo   Porta 3000 — Microsoft Edge
echo  ========================================
echo.

tasklist /FI "IMAGENAME eq node.exe" 2>nul | find /I "node.exe" >nul
if errorlevel 1 (
  call scripts\libera-porta-3000.bat
  echo A iniciar servidor em http://localhost:3000...
  start "NONATO Servidor" cmd /k "cd /d %~dp0 && npm run dev"
  echo Aguarde 15 segundos...
  timeout /t 15 /nobreak >nul
)

call scripts\abrir-edge.bat "http://localhost:3000/recuperar-biblioteca.html"
echo.
echo  1. Aguarde "Concluido" no Microsoft Edge
echo  2. Depois va a Biblioteca de Pecas
echo  3. Prima Ctrl+Shift+R
echo.
pause
