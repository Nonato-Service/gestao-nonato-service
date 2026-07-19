@echo off
chcp 65001 >nul
title NONATO - Corrigir e enviar biblioteca para Railway
cd /d "%~dp0"

echo.
echo  ============================================================
echo   CORRIGIR + ENVIAR BIBLIOTECA PARA RAILWAY
echo  ============================================================
echo.
echo  O DEPLOY (GitHub) NAO envia as fotos — so o codigo!
echo  Este script envia data\nonato-pecas-biblioteca.json para a nuvem.
echo.
echo  ============================================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo ERRO: Node.js nao encontrado.
  pause
  exit /b 1
)

node scripts\corrigir-placeholders-biblioteca.mjs --enviar
pause
