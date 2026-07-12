@echo off
chcp 65001 >nul
title NONATO - Servidor limpo (porta 3000, Edge)
cd /d "%~dp0"

echo.
call scripts\libera-porta-3000.bat

echo  A limpar cache de compilacao (.next)...
if exist .next rmdir /s /q .next

echo  A iniciar servidor em http://localhost:3000
start "NONATO Servidor" cmd /k "cd /d %~dp0 && npm run dev"
timeout /t 12 /nobreak >nul

call scripts\abrir-edge.bat "http://localhost:3000"
echo.
pause
