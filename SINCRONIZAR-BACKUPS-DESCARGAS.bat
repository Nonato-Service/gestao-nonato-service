@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Sincronizar backups das Descargas

echo.
echo  A copiar backups de Downloads para backups\json e backups\codigo ...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\sincronizar-backups-descargas.ps1"

echo.
echo  A abrir pastas...
call "%~dp0ABRI-PASTAS-BACKUP.bat"
