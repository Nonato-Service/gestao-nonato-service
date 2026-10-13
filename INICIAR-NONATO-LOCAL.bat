@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul 2>&1
title Nonato Service — Hub local (PC + tablet)

REM ============================================================================
REM  Hub local: PC fica ligado; tablet na mesma Wi‑Fi abre http://IP:PORT
REM  Dados em .\data-local (nunca apaga cadastros existentes)
REM  Não altera configuração Railway — modo só local
REM ============================================================================

cd /d "%~dp0"

set "PORT=3000"
set "HOSTNAME=0.0.0.0"
set "DATA_DIR=%~dp0data-local"
REM Remover barra final se existir (evita paths estranhos)
if "%DATA_DIR:~-1%"=="\" set "DATA_DIR=%DATA_DIR:~0,-1%"

echo.
echo ========================================
echo   NONATO SERVICE — MODO LOCAL PC
echo ========================================
echo.
echo  Pasta: %CD%
echo  Dados: %DATA_DIR%
echo  Escuta: %HOSTNAME%:%PORT%
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado. Instale Node 20+ e tente de novo.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERRO] npm nao encontrado. Reinstale o Node.js ^(inclui npm^).
  pause
  exit /b 1
)

for /f "tokens=*" %%v in ('node -v 2^>nul') do set "NODE_VER=%%v"
echo [OK] Node %NODE_VER%

REM Pasta de dados no disco do PC — cria se faltar; NUNCA apaga conteudo
if not exist "%DATA_DIR%" (
  mkdir "%DATA_DIR%" 2>nul
  echo [OK] Criada pasta de dados: %DATA_DIR%
) else (
  echo [OK] Pasta de dados ja existe ^(cadastros preservados^)
)

if not exist "node_modules\next\package.json" (
  echo.
  echo [INFO] A instalar dependencias ^(npm install^)...
  call npm install
  if errorlevel 1 (
    echo [ERRO] Falha no npm install.
    pause
    exit /b 1
  )
  echo [OK] Dependencias instaladas.
) else (
  echo [OK] node_modules presente.
)

REM Opcional: forcar build de producao antes de arrancar
if /i "%NONATO_LOCAL_BUILD%"=="1" (
  echo.
  echo [INFO] NONATO_LOCAL_BUILD=1 — a fazer build de producao...
  call npm run build
  if errorlevel 1 (
    echo [AVISO] Build falhou — start-server.js pode usar next/dev no hub local.
  ) else (
    echo [OK] Build concluido.
  )
)

if exist ".next\BUILD_ID" (
  echo [OK] Build .next — npm start em producao ^(0.0.0.0^).
) else (
  echo [INFO] Sem BUILD_ID — start-server.js inicia next/dev em 0.0.0.0:%PORT%
  echo        ^(Opcional depois: npm run build  ou  set NONATO_LOCAL_BUILD=1^)
)

REM IPs da LAN para o tablet
echo.
echo ========================================
echo   URL PARA O TABLET ^(mesma Wi‑Fi^)
echo ========================================
set "FOUND_IP=0"
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
  set "IP=%%a"
  set "IP=!IP: =!"
  if not "!IP!"=="" if not "!IP!"=="127.0.0.1" (
    echo   http://!IP!:%PORT%
    set "FOUND_IP=1"
  )
)
if "!FOUND_IP!"=="0" (
  echo   ^(Nao foi possivel detectar IPv4 — veja o IP em ipconfig^)
  echo   Exemplo: http://192.168.1.XX:%PORT%
)
echo.
echo   Neste PC:  http://localhost:%PORT%
echo.
echo   IMPORTANTE:
echo   - Deixe esta janela aberta; o PC deve ficar ligado.
echo   - Tablet so na mesma Wi‑Fi ^(nao precisa Railway / nuvem^).
echo   - Se o tablet nao ligar: Firewall do Windows - permitir porta %PORT% TCP.
echo     ^(PowerShell Admin: netsh advfirewall firewall add rule name="Nonato Local %PORT%" dir=in action=allow protocol=TCP localport=%PORT%^)
echo   - Guia: MODO-LOCAL-PC-TABLET.md
echo ========================================
echo.
echo [INFO] A iniciar servidor... NAO FECHE ESTA JANELA.
echo.

set "PORT=%PORT%"
set "HOSTNAME=%HOSTNAME%"
set "DATA_DIR=%DATA_DIR%"

REM start-server.js: producao se houver BUILD_ID; senao next/dev local ^(nunca no Railway^)
call npm start

echo.
echo ========================================
echo   SERVIDOR PAROU
echo ========================================
echo Dados continuam em: %DATA_DIR%
echo.
pause
endlocal
exit /b 0
