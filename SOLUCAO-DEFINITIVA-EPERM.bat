@echo off
echo ========================================
echo   SOLUCAO DEFINITIVA PARA ERRO EPERM
echo ========================================
echo.

cd /d "%~dp0"

echo [1/6] Parando todos os processos Node.js...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 3 /nobreak >nul

echo [2/6] Limpando cache do Next.js...
if exist .next (
    echo Limpando pasta .next...
    rmdir /s /q .next
    timeout /t 1 /nobreak >nul
)

echo [3/6] Verificando Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Node.js nao encontrado!
    echo Instale o Node.js de: https://nodejs.org
    pause
    exit /b 1
)
node --version
echo.

echo [4/6] Verificando dependencias...
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERRO: Falha ao instalar dependencias!
        pause
        exit /b 1
    )
)

echo [5/6] Verificando porta 3000...
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo AVISO: Porta 3000 ja esta em uso!
    echo Tentando liberar...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
        echo Encerrando processo %%a...
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)

echo [6/6] Iniciando servidor Next.js...
echo.
echo IMPORTANTE: Se o erro EPERM persistir:
echo   1. Execute este script como Administrador
echo      (Botao direito -^> Executar como administrador)
echo   2. Adicione esta pasta nas excecoes do antivirus:
echo      %CD%
echo   3. Verifique o Windows Defender
echo.
echo Iniciando servidor...
echo.

REM Tenta usar o comando npm diretamente
start "Next.js Server - Gestao Tecnica" cmd /k "npm run dev"

echo.
echo Aguarde 20-30 segundos para o servidor compilar...
echo.
timeout /t 20 /nobreak >nul

echo Verificando status do servidor...
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   SUCESSO! SERVIDOR ESTA RODANDO!
    echo ========================================
    echo.
    echo Acesse: http://localhost:3000
    echo.
    echo A janela do servidor foi aberta.
    echo NAO FECHE essa janela enquanto usar o sistema!
    echo.
) else (
    echo.
    echo ========================================
    echo   ATENCAO: Servidor ainda nao esta respondendo
    echo ========================================
    echo.
    echo Possiveis causas:
    echo - Erro EPERM (permissao negada)
    echo - Antivirus bloqueando
    echo - Arquivo page.tsx muito grande (37.000+ linhas)
    echo.
    echo SOLUCOES:
    echo 1. Execute este script como Administrador
    echo 2. Verifique a janela do servidor para ver o erro
    echo 3. Adicione a pasta nas excecoes do antivirus
    echo 4. Tente usar uma porta diferente:
    echo    npm run dev -- -p 3001
    echo.
)

pause
