@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul 2>&1
title Nonato Service — Hub local (PC + tablet)

REM ============================================================================
REM  Hub local: PC fica ligado; tablet na mesma Wi‑Fi abre http://IP:PORT
REM  Dados em .\data-local (nunca apaga cadastros existentes)
REM  Não altera configuração Railway — modo só local
REM  SEMPRE next/dev (UI fresca) — NÃO serve .next de produção antigo
REM ============================================================================

cd /d "%~dp0"

set "PORT=3000"
set "HOSTNAME=0.0.0.0"
set "DATA_DIR=%~dp0data-local"
REM Remover barra final se existir (evita paths estranhos)
if "%DATA_DIR:~-1%"=="\" set "DATA_DIR=%DATA_DIR:~0,-1%"

REM Forçar next/dev mesmo se existir .next/BUILD_ID (evita UI desatualizada)
set "NONATO_FORCE_DEV=1"
set "NONATO_LOCAL_DEV=1"
REM Cliente: silenciar nags de atualizar servidor / Railway no uso diario
set "NEXT_PUBLIC_NONATO_LOCAL_HUB=1"

echo.
echo ========================================
echo   NONATO SERVICE — MODO LOCAL PC
echo ========================================
echo.
echo  Pasta: %CD%
echo  Dados: %DATA_DIR%
echo  Escuta: %HOSTNAME%:%PORT%
echo  Modo: next/dev ^(UI sempre fresca apos alteracoes^)
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

REM Se data-local estiver vazia e existir .\data com cadastros, copiar (sem apagar .\data)
set "SEED_SRC=%~dp0data"
if exist "%SEED_SRC%\nonato-clientes.json" (
  dir /b "%DATA_DIR%\*.json" >nul 2>&1
  if errorlevel 1 (
    echo [INFO] data-local vazia — a copiar cadastros de .\data ^(origem intacta^)...
    robocopy "%SEED_SRC%" "%DATA_DIR%" /E /XO /R:1 /W:1 /NFL /NDL /NJH /NJS /nc /ns /np >nul
    echo [OK] data-local semeada a partir de .\data
  )
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
echo   - Apos actualizar codigo: feche o bat, volte a abrir, e no browser Ctrl+Shift+R
echo     ^(recarregar forçado — limpa cache PWA/antiga^).
echo   - «Por periodos» esta em Cobrança / Ir ao fechamento ^(nao so em Fechamento de horas^).
echo   - Guia: MODO-LOCAL-PC-TABLET.md
echo ========================================
echo.
echo [INFO] A iniciar next/dev... NAO FECHE ESTA JANELA.
echo.

set "PORT=%PORT%"
set "HOSTNAME=%HOSTNAME%"
set "DATA_DIR=%DATA_DIR%"
set "NONATO_FORCE_DEV=%NONATO_FORCE_DEV%"
set "NONATO_LOCAL_DEV=%NONATO_LOCAL_DEV%"
set "NEXT_PUBLIC_NONATO_LOCAL_HUB=%NEXT_PUBLIC_NONATO_LOCAL_HUB%"

REM start-server.js com NONATO_FORCE_DEV=1 → sempre next/dev no hub local (nao rebuild a cada clique)
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
