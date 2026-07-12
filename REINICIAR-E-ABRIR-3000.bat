@echo off
chcp 65001 >nul
title NONATO - Reiniciar servidor porta 3000
cd /d "%~dp0"

echo A parar servidores antigos...
call scripts\libera-porta-3000.bat

echo A iniciar servidor em http://localhost:3000
echo NAO FECHE ESTA JANELA.
echo.
start "" cmd /c "timeout /t 12 /nobreak >nul && call scripts\abrir-edge.bat http://localhost:3000"
npm run dev
