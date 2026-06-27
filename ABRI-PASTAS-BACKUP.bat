@echo off
chcp 65001 >nul
title Nonato — Pastas de Backup

set "BASE=C:\Users\W10\gestao-tecnica-nonato-service\backups"
set "JSON=%BASE%\json"
set "CODIGO=%BASE%\codigo"

if not exist "%JSON%" mkdir "%JSON%"
if not exist "%CODIGO%" mkdir "%CODIGO%"

echo.
echo  ============================================
echo   PASTAS DE BACKUP — NONATO GESTAO
echo  ============================================
echo.
echo  JSON (dados):  %JSON%
echo  CODIGO (ZIP):  %CODIGO%
echo.
echo  A abrir as duas pastas no Explorador...
echo.

start "" explorer "%JSON%"
timeout /t 1 /nobreak >nul
start "" explorer "%CODIGO%"
start "" notepad "%BASE%\LEIA-ME.txt"

echo  Se estiver vazio: use http://localhost:3000 (ou 3001)
echo  Administrador - Backup - Criar JSON / Descarregar ZIP
echo.
pause
