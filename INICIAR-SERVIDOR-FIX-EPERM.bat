@echo off
REM Solução definitiva para erro EPERM
REM Execute como Administrador se necessário

cd /d "%~dp0"

echo ========================================
echo   INICIANDO SERVIDOR - FIX EPERM
echo ========================================
echo.

REM Para todos os processos Node
echo [1] Parando processos Node.js...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Limpa cache
echo [2] Limpando cache...
if exist .next rmdir /s /q .next >nul 2>&1

REM Verifica Node
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Node.js nao encontrado!
    pause
    exit /b 1
)

REM Verifica porta
echo [3] Verificando porta 3000...
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Porta 3000 em uso. Liberando...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)

echo [4] Iniciando servidor...
echo.

REM Tenta usar npx que pode contornar alguns problemas de permissão
start "Next.js Server" cmd /k "npx next dev"

echo.
echo Servidor iniciando em nova janela...
echo Aguarde 20-30 segundos...
echo.
echo Se ainda houver erro EPERM:
echo 1. Execute este arquivo como Administrador
echo 2. Adicione a pasta nas excecoes do antivirus
echo 3. Verifique o Windows Defender
echo.

timeout /t 25 /nobreak >nul

netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   SUCESSO! Servidor rodando!
    echo ========================================
    echo.
    echo Acesse: http://localhost:3000
    echo.
) else (
    echo.
    echo Servidor ainda nao esta respondendo.
    echo Verifique a janela do servidor.
    echo.
)

pause
