@echo off
echo ========================================
echo   REINICIANDO SERVIDOR NEXT.JS
echo ========================================
cd /d "%~dp0"

REM Parar servidor
call stop-server.bat

REM Aguardar 2 segundos
timeout /t 2 /nobreak >nul

REM Iniciar servidor
echo.
echo Iniciando servidor novamente...
call start-server.bat
