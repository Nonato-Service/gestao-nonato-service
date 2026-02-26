@echo off
REM Script para testar se o início automático está funcionando
REM Execute este script para simular o que acontece no login

echo ============================================================
echo   TESTANDO INICIO AUTOMATICO
echo ============================================================
echo.
echo Este script simula o que acontece quando voce faz login.
echo.
echo Verificando se o servidor esta rodando...
echo.

cd /d "%~dp0"

REM Verifica se o servidor já está rodando
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Servidor ja esta rodando na porta 3000!
    echo.
    echo Acesse: http://localhost:3000
    echo.
    pause
    exit /b 0
)

echo [INFO] Servidor nao esta rodando. Iniciando...
echo.

REM Executa o script de início automático
call start-server-auto.bat

echo.
echo Aguardando 15 segundos para o servidor iniciar...
timeout /t 15 /nobreak >nul

REM Verifica novamente
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo   SUCESSO! SERVIDOR INICIADO!
    echo ============================================================
    echo.
    echo O servidor esta rodando na porta 3000
    echo Acesse: http://localhost:3000
    echo.
    echo Se este teste funcionou, o inicio automatico tambem funcionara!
    echo.
) else (
    echo.
    echo ============================================================
    echo   ERRO: SERVIDOR NAO INICIOU
    echo ============================================================
    echo.
    echo O servidor nao iniciou corretamente.
    echo.
    echo Possiveis causas:
    echo   1. Node.js nao esta instalado
    echo   2. Dependencias nao estao instaladas (execute: npm install)
    echo   3. Porta 3000 esta em uso por outro processo
    echo   4. Erro de permissao
    echo.
    echo Tente executar manualmente:
    echo   npm run dev
    echo.
)

pause
