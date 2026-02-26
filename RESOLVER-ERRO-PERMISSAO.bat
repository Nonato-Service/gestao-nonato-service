@echo off
REM ============================================================
REM   RESOLVER ERRO DE PERMISSAO (EPERM)
REM   Este script resolve problemas de permissao que impedem
REM   o servidor Next.js de iniciar
REM ============================================================

echo.
echo ============================================================
echo   RESOLVENDO ERRO DE PERMISSAO
echo ============================================================
echo.

cd /d "%~dp0"

echo [1/5] Parando todos os processos Node...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 3 /nobreak >nul
echo [OK] Processos Node parados
echo.

echo [2/5] Limpando cache do Next.js...
if exist ".next" (
    rmdir /s /q .next >nul 2>&1
    echo [OK] Cache limpo
) else (
    echo [INFO] Nenhum cache encontrado
)
echo.

echo [3/5] Verificando Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Node.js nao encontrado!
    echo.
    echo Por favor, instale o Node.js primeiro:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js encontrado
node --version
echo.

echo [4/5] Verificando dependencias...
if not exist "node_modules" (
    echo [INFO] Instalando dependencias...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERRO] Falha ao instalar dependencias!
        pause
        exit /b 1
    )
) else (
    echo [OK] Dependencias ja instaladas
)
echo.

echo [5/5] Tentando iniciar o servidor...
echo [INFO] Aguarde 15 segundos...
echo.

REM Tenta iniciar o servidor
start "Next.js Server - Gestao Tecnica" cmd /k "cd /d %~dp0 && npm run dev"

timeout /t 15 /nobreak >nul

REM Verifica se o servidor está rodando
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
    echo IMPORTANTE: Se o servidor iniciou agora, o problema era:
    echo   1. Processos Node travados, OU
    echo   2. Cache do Next.js corrompido
    echo.
    echo O inicio automatico deve funcionar agora!
    echo.
) else (
    echo.
    echo ============================================================
    echo   ERRO: SERVIDOR NAO INICIOU
    echo ============================================================
    echo.
    echo Possiveis causas:
    echo   1. Antivirus bloqueando (adicione a pasta as excecoes)
    echo   2. Permissoes insuficientes (execute como Administrador)
    echo   3. Porta 3000 em uso por outro processo
    echo   4. Node.js ou dependencias com problema
    echo.
    echo SOLUCOES:
    echo.
    echo 1. Execute este script como Administrador:
    echo    - Clique com botao direito neste arquivo
    echo    - Selecione "Executar como administrador"
    echo.
    echo 2. Adicione a pasta as excecoes do antivirus:
    echo    C:\Users\W10\gestao-tecnica-nonato-service
    echo.
    echo 3. Verifique se a porta 3000 esta livre:
    echo    netstat -ano ^| findstr ":3000"
    echo.
    echo 4. Tente reinstalar as dependencias:
    echo    rmdir /s /q node_modules
    echo    npm install
    echo.
)

pause
