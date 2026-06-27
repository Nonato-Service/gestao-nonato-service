@echo off
chcp 65001 >nul
title NONATO SERVICE - Criar atalho na Area de Trabalho
cd /d "%~dp0"

echo.
echo  ============================================
echo   CRIAR ICONE / ATALHO — NONATO GESTAO
echo  ============================================
echo.
echo  Vai criar na Area de Trabalho:
echo    NONATO SERVICE - Gestao.lnk
echo.
echo  Abre o programa em janela propria (como app).
echo  Login: UTILIZADOR + SENHA obrigatorios.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\criar-atalho-gestao.ps1"

echo.
pause
