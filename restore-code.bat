@echo off
echo ========================================
echo   RESTAURAR CODIGO DE BACKUP
echo ========================================
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0restore-code.ps1"
pause
