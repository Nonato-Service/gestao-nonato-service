@echo off
REM Script simples para iniciar o servidor Next.js
REM Execute este arquivo para iniciar o servidor manualmente

echo ========================================
echo   INICIANDO SERVIDOR NEXT.JS
echo ========================================
echo.

cd /d "%~dp0"

REM Verifica Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Node.js nao encontrado!
    echo Por favor, instale o Node.js primeiro.
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js encontrado
echo.

REM Verifica dependências
if not exist "node_modules" (
    echo [INFO] Instalando dependencias...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERRO] Falha ao instalar dependencias!
        pause
        exit /b 1
    )
    echo [OK] Dependencias instaladas
    echo.
)

REM Verifica se já está rodando
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Servidor ja esta rodando na porta 3000!
    echo.
    echo Acesse: http://localhost:3000
    echo.
    pause
    exit /b 0
)

REM Limpa processos Node antigos (opcional)
echo [INFO] Verificando processos Node antigos...
tasklist /FI "IMAGENAME eq node.exe" 2>nul | find /I "node.exe" >nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Processos Node encontrados. Parando...
    taskkill /F /IM node.exe >nul 2>&1
    timeout /t 2 /nobreak >nul
)

REM Limpa cache do Next.js se necessário
if exist ".next" (
    echo [INFO] Limpando cache do Next.js...
    rmdir /s /q .next >nul 2>&1
)

echo.
echo [INFO] Iniciando servidor Next.js...
echo [INFO] Aguarde 10-15 segundos para o servidor iniciar...
echo.
echo ========================================
echo   SERVIDOR INICIANDO...
echo ========================================
echo.
echo Quando estiver pronto, voce vera:
echo   - Local:        http://localhost:3000
echo   - Ready in X ms
echo.
echo NAO FECHE ESTA JANELA!
echo Para parar o servidor, pressione Ctrl+C
echo.
echo ========================================
echo.

REM Inicia o servidor
npm run dev

REM Se o servidor parar, mostra mensagem
echo.
echo ========================================
echo   SERVIDOR PAROU
echo ========================================
echo.
pause
