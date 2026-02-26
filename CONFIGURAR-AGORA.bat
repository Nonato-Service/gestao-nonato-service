@echo off
REM Script para configurar início automático - EXECUTAR COMO ADMINISTRADOR
echo ========================================
echo   CONFIGURANDO INICIO AUTOMATICO
echo   (Execute como Administrador)
echo ========================================
echo.

cd /d "%~dp0"

REM Verifica se está executando como administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo ERRO: Este script precisa ser executado como Administrador!
    echo.
    echo Como executar:
    echo 1. Clique com botao direito neste arquivo
    echo 2. Selecione "Executar como administrador"
    echo.
    pause
    exit /b 1
)

echo Executando configuracao...
echo.

powershell.exe -ExecutionPolicy Bypass -File "%~dp0configurar-inicio-automatico.ps1"

echo.
echo ========================================
echo   CONFIGURACAO CONCLUIDA!
echo ========================================
echo.
echo O servidor agora iniciara automaticamente:
echo   - Ao fazer login no Windows
echo   - Quando o sistema iniciar
echo   - A cada 5 minutos (verificacao)
echo   - Com reinicio automatico se parar
echo.
pause
