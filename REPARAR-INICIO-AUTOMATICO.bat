@echo off
REM ============================================================
REM   REPARAR INICIO AUTOMATICO
REM   Este script repara e atualiza a configuracao de inicio automatico
REM ============================================================

echo.
echo ============================================================
echo   REPARANDO INICIO AUTOMATICO
echo ============================================================
echo.

cd /d "%~dp0"

echo [1/4] Parando processos Node antigos...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo [OK] Processos parados
echo.

echo [2/4] Removendo atalho antigo da pasta de inicializacao...
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_PATH=%STARTUP_FOLDER%\NextJS-NonatoService-AutoStart.lnk"
if exist "%SHORTCUT_PATH%" (
    del "%SHORTCUT_PATH%" >nul 2>&1
    echo [OK] Atalho antigo removido
) else (
    echo [INFO] Nenhum atalho antigo encontrado
)
echo.

echo [3/4] Criando novo atalho na pasta de inicializacao...

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
    echo [OK] Novo atalho criado com sucesso!
) else (
    echo [ERRO] Falha ao criar atalho
    echo.
    pause
    exit /b 1
)
echo.

echo [4/4] Testando inicio do servidor...
echo [INFO] Aguarde 15 segundos...
call start-server-auto.bat
timeout /t 15 /nobreak >nul

REM Verifica se o servidor está rodando
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Servidor iniciado com sucesso!
    echo.
    echo ============================================================
    echo   REPARACAO CONCLUIDA COM SUCESSO!
    echo ============================================================
    echo.
    echo O servidor esta rodando e configurado para iniciar automaticamente.
    echo.
    echo Acesse: http://localhost:3000
    echo.
    echo Para testar o inicio automatico:
    echo   1. Faca logout e login novamente
    echo   2. OU reinicie o computador
    echo   3. O servidor deve iniciar automaticamente!
    echo.
) else (
    echo [AVISO] Servidor pode nao ter iniciado ainda.
    echo [INFO] Aguarde mais alguns segundos e verifique manualmente.
    echo.
    echo Para verificar se o servidor esta rodando:
    echo   netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"
    echo.
)

pause
