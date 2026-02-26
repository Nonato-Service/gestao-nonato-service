@echo off
REM Script para iniciar o servidor Next.js automaticamente
REM Este script roda em segundo plano e garante que o servidor sempre esteja rodando

cd /d "%~dp0"

REM Verifica se o Node.js está instalado
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Node.js nao encontrado!
    exit /b 1
)

REM Verifica se as dependências estão instaladas
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
)

REM Verifica se o servidor já está rodando na porta 3000
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [%date% %time%] Servidor ja esta rodando na porta 3000
    REM Mesmo assim, verifica se o processo está realmente ativo
    timeout /t 2 /nobreak >nul
    netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        exit /b 0
    )
)

REM Verifica se já existe um processo do Next.js rodando
tasklist /FI "IMAGENAME eq node.exe" 2>nul | find /I "node.exe" >nul
if %ERRORLEVEL% EQU 0 (
    REM Verifica se algum processo node está usando a porta 3000
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
        tasklist /FI "PID eq %%a" 2>nul | find /I "node.exe" >nul
        if %ERRORLEVEL% EQU 0 (
            echo [%date% %time%] Processo do servidor ja esta em execucao (PID: %%a)
            exit /b 0
        )
    )
)

REM Aguarda alguns segundos para garantir que o sistema está pronto
timeout /t 10 /nobreak >nul

REM Inicia o servidor Next.js em uma janela minimizada
echo [%date% %time%] Iniciando servidor Next.js em http://localhost:3000

REM Cria um arquivo batch temporário para iniciar o servidor
set "TEMP_BAT=%TEMP%\start_nextjs_%RANDOM%.bat"
(
echo @echo off
echo cd /d "%~dp0"
echo npm run dev
) > "%TEMP_BAT%"

REM Inicia o servidor em uma nova janela minimizada que permanece aberta
REM Usa start /min para minimizar e cmd /k para manter a janela aberta
start /min "Next.js Server - Gestao Tecnica" cmd /k "%TEMP_BAT%"

REM Aguarda um pouco antes de remover o arquivo temporário
timeout /t 3 /nobreak >nul

REM Aguarda alguns segundos para verificar se iniciou corretamente
timeout /t 5 /nobreak >nul

REM Verifica novamente se o servidor está rodando
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [%date% %time%] Servidor iniciado com sucesso!
    echo [%date% %time%] Acesse: http://localhost:3000
) else (
    echo [%date% %time%] AVISO: Servidor pode nao ter iniciado corretamente
)
