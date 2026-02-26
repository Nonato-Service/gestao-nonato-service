@echo off
echo ========================================
echo   RESOLVENDO ERRO EPERM - Next.js
echo ========================================
echo.

cd /d "%~dp0"

echo Parando todos os processos Node.js...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo Limpando cache do Next.js...
if exist .next rmdir /s /q .next

echo Verificando Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Node.js nao encontrado!
    pause
    exit /b 1
)

echo.
echo Tentando iniciar servidor na porta 3000...
echo.

REM Tenta iniciar o servidor
start "Next.js Server" cmd /k "npm run dev"

echo.
echo Servidor iniciando...
echo Aguarde 15-20 segundos...
echo.
echo Se o erro EPERM persistir:
echo 1. Execute este script como Administrador (botao direito)
echo 2. Adicione a pasta do projeto nas excecoes do antivirus
echo 3. Verifique se o Windows Defender nao esta bloqueando
echo.
timeout /t 5
echo.
echo Verificando se o servidor esta rodando...
timeout /t 10 /nobreak >nul
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCESSO! Servidor esta rodando!
    echo Acesse: http://localhost:3000
) else (
    echo.
    echo Servidor ainda nao esta respondendo.
    echo Verifique a janela do servidor para ver os erros.
)
echo.
pause
