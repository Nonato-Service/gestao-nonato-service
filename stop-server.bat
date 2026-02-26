@echo off
echo ========================================
echo   PARANDO SERVIDOR NEXT.JS
echo ========================================
cd /d "%~dp0"

REM Encontrar e matar processos Node.js na porta 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo Encerrando processo PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

REM Matar todos os processos node.exe relacionados ao Next.js
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *next*" >nul 2>&1

echo Servidor parado com sucesso!
timeout /t 2 >nul
pause
