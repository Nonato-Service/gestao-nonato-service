@echo off
REM ============================================================
REM   CONFIGURAR INICIO AUTOMATICO DEFINITIVO
REM   Este script configura o servidor para iniciar SEMPRE
REM ============================================================

echo.
echo ============================================================
echo   CONFIGURANDO INICIO AUTOMATICO DEFINITIVO
echo ============================================================
echo.

cd /d "%~dp0"

REM Verifica se está executando como administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [AVISO] Executando sem privilegios de administrador...
    echo [INFO] Tentando metodo alternativo (pasta de inicializacao)...
    echo.
    goto :metodo_alternativo
)

echo [OK] Privilegios de administrador detectados
echo [INFO] Configurando Task Scheduler...
echo.

REM Executa o script PowerShell
powershell.exe -ExecutionPolicy Bypass -File "%~dp0configurar-inicio-automatico.ps1"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo   CONFIGURACAO CONCLUIDA COM SUCESSO!
    echo ============================================================
    echo.
    echo O servidor agora iniciara automaticamente:
    echo   - Ao fazer login no Windows
    echo   - Quando o sistema iniciar
    echo   - A cada 5 minutos (verificacao periodica)
    echo   - Com reinicio automatico se parar (via monitor)
    echo.
    echo Teste: Faca logout e login novamente para verificar!
    echo.
    pause
    exit /b 0
) else (
    echo.
    echo [AVISO] Falha ao configurar Task Scheduler
    echo [INFO] Tentando metodo alternativo...
    echo.
    goto :metodo_alternativo
)

:metodo_alternativo
echo ============================================================
echo   CONFIGURANDO VIA PASTA DE INICIALIZACAO
echo ============================================================
echo.

REM Obtém a pasta de inicialização
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_NAME=NextJS-NonatoService-AutoStart.lnk"
set "SHORTCUT_PATH=%STARTUP_FOLDER%\%SHORTCUT_NAME%"

REM Remove atalho antigo se existir
if exist "%SHORTCUT_PATH%" (
    echo [INFO] Removendo atalho antigo...
    del "%SHORTCUT_PATH%" >nul 2>&1
)

REM Cria o script VBS para criar o atalho
set "VBS_SCRIPT=%TEMP%\create_shortcut_%RANDOM%.vbs"

(
echo Set oWS = WScript.CreateObject^("WScript.Shell"^)
echo sLinkFile = "%SHORTCUT_PATH%"
echo Set oLink = oWS.CreateShortcut^(sLinkFile^)
echo oLink.TargetPath = "%~dp0start-server-auto.bat"
echo oLink.WorkingDirectory = "%~dp0"
echo oLink.WindowStyle = 1
echo oLink.Description = "Inicia automaticamente o servidor Next.js da Gestao Tecnica Nonato Service"
echo oLink.Save
) > "%VBS_SCRIPT%"

REM Executa o VBS para criar o atalho
cscript //nologo "%VBS_SCRIPT%" >nul 2>&1

REM Remove o script temporário
del "%VBS_SCRIPT%" >nul 2>&1

if exist "%SHORTCUT_PATH%" (
    echo [OK] Atalho criado na pasta de inicializacao!
    echo.
    echo ============================================================
    echo   CONFIGURACAO CONCLUIDA!
    echo ============================================================
    echo.
    echo O servidor iniciara automaticamente quando voce fizer login.
    echo.
    echo Localizacao do atalho:
    echo   %STARTUP_FOLDER%
    echo.
    echo Para testar: Faca logout e login novamente!
    echo.
) else (
    echo [ERRO] Falha ao criar atalho na pasta de inicializacao
    echo.
    echo Tente executar este script como Administrador:
    echo   1. Clique com botao direito neste arquivo
    echo   2. Selecione "Executar como administrador"
    echo.
)

pause
