@echo off
REM Script de monitoramento que verifica se o servidor está rodando
REM e o reinicia automaticamente se parar
REM Este script roda em loop infinito e verifica a cada 30 segundos

cd /d "%~dp0"

REM Habilita expansão de variáveis atrasada para o contador
setlocal enabledelayedexpansion

echo ========================================
echo   MONITOR DO SERVIDOR INICIADO
echo   Verificando a cada 30 segundos...
echo   Data/Hora: %date% %time%
echo ========================================
echo.

set counter=0

:loop
REM Verifica se o servidor está rodando na porta 3000
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [%date% %time%] AVISO: Servidor nao esta rodando na porta 3000
    echo [%date% %time%] Tentando reiniciar o servidor...
    
    REM Aguarda um pouco antes de tentar reiniciar
    timeout /t 5 /nobreak >nul
    
    REM Chama o script de início
    call start-server-auto.bat
    
    REM Aguarda mais um pouco para o servidor iniciar
    timeout /t 10 /nobreak >nul
    
    REM Verifica novamente se iniciou
    netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [%date% %time%] SUCESSO: Servidor reiniciado com sucesso!
    ) else (
        echo [%date% %time%] ERRO: Falha ao reiniciar o servidor. Tentando novamente em 30 segundos...
    )
) else (
    REM Servidor está rodando - apenas registra a cada 5 minutos
    set /a counter+=1
    if !counter! GEQ 10 (
        echo [%date% %time%] Servidor rodando normalmente na porta 3000
        set counter=0
    )
)

REM Aguarda 30 segundos antes de verificar novamente
timeout /t 30 /nobreak >nul
goto loop
