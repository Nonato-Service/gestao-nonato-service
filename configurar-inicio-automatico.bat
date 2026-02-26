@echo off
REM Script batch para configurar início automático (chama o PowerShell)
echo ========================================
echo   CONFIGURANDO INICIO AUTOMATICO
echo ========================================
echo.

cd /d "%~dp0"

REM Executa o script PowerShell
powershell.exe -ExecutionPolicy Bypass -File "%~dp0configurar-inicio-automatico.ps1"
