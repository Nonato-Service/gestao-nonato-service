@echo off
chcp 65001 >nul
title NONATO - Reiniciar servidor porta 3000
cd /d "%~dp0"

echo A parar servidores Node antigos...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo A iniciar servidor em http://localhost:3000
echo NAO FECHE ESTA JANELA.
echo.
start "" cmd /c "timeout /t 12 /nobreak >nul && start http://localhost:3000"
npm run dev
