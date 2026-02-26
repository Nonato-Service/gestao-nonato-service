@echo off
echo ========================================
echo   INICIANDO SERVIDOR NEXT.JS
echo ========================================
echo.

cd /d "%~dp0"

REM Verifica se o Node.js está instalado
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Node.js nao encontrado!
    echo Por favor, instale o Node.js primeiro.
    pause
    exit /b 1
)

REM Verifica se as dependências estão instaladas
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERRO: Falha ao instalar dependencias!
        pause
        exit /b 1
    )
)

REM Verifica se o servidor já está rodando
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo.
    echo O servidor ja esta rodando na porta 3000!
    echo Acesse: http://localhost:3000
    echo.
    pause
    exit /b 0
)

echo.
echo Iniciando servidor Next.js...
echo Aguarde alguns segundos...
echo.

REM Inicia o servidor
start "Next.js Server - Gestao Tecnica" cmd /k "npm run dev"

echo.
echo Servidor iniciando...
echo Aguarde aproximadamente 10-15 segundos...
echo.
echo Quando o servidor estiver pronto, voce vera:
echo   - Local:        http://localhost:3000
echo   - Ready in X ms
echo.
echo A janela do servidor foi aberta. Nao feche essa janela!
echo.
echo Para parar o servidor, feche a janela do servidor ou pressione Ctrl+C nela.
echo.
pause
