@echo off

chcp 65001 >nul

title NONATO - Complementar peças HOMAG em falta (~31k)

cd /d "%~dp0"



echo.

echo  ============================================================

echo   COMPLEMENTAR PEÇAS HOMAG EM FALTA

echo  ============================================================

echo.

echo  Tem ~21 400 peças. A HOMAG mostra ~31 130 na loja

echo  mas sao ~18 000 codigos UNICOS na API (duplicados entre categorias).

echo  Auditoria: 0 peças em falta vs API. Use VERIFICAR-CATALOGO-HOMAG.bat

echo.

echo  Este BAT reprocessa TODOS os 62 buckets e adiciona

echo  só as peças novas (não duplica as que já tem).

echo  Demora 2 a 4 horas. NAO FECHE a janela.

echo.

echo  ============================================================

echo.

pause



where node >nul 2>&1

if errorlevel 1 (

  echo ERRO: Node.js nao encontrado.

  pause

  exit /b 1

)



call npm install >nul 2>&1

call npx playwright install chromium



set HOMAG_USE_API=1

set HOMAG_HEADLESS=0

set HOMAG_EMBED_IMAGES=0

set HOMAG_AUTO_MERGE=1

set HOMAG_AUTO_RAILWAY=1

set HOMAG_RESUME=1

set HOMAG_FORCE_ALL_BUCKETS=1

set HOMAG_RAILWAY_EVERY=500

set RAILWAY_URL=https://gest-o-nonato-gestao.up.railway.app



call npm run homag:import

set RC=%ERRORLEVEL%



if %RC%==0 (

  echo.

  echo CONCLUIDO — biblioteca complementada. Abra o site e Actualizar biblioteca.

) else (

  echo.

  echo Terminou com codigo %RC% — pode executar outra vez para continuar.

)



pause

exit /b %RC%

