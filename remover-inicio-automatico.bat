@echo off
REM Script batch para remover início automático (chama o PowerShell)
echo ========================================
echo   REMOVENDO INICIO AUTOMATICO
echo ========================================
echo.

cd /d "%~dp0"

REM Executa o script PowerShell
powershell.exe -ExecutionPolicy Bypass -File "%~dp0remover-inicio-automatico.ps1"
