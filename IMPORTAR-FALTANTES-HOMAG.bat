@echo off

chcp 65001 >nul

title NONATO - Importar TODAS as peças HOMAG em falta

cd /d "%~dp0"

echo.

echo  ============================================================

echo   IMPORTAR TODAS AS PEÇAS HOMAG EM FALTA

echo  ============================================================

echo.

echo  • Traz tudo o que falta na biblioteca (API HOMAG completa)

echo  • Código HOMAG = sem hífen (ex.: 3607066730)

echo  • Busca funciona COM e SEM hífen (ex.: 3-607-06-6730)

echo  • Não duplica peças que já existem

echo.

echo  Demora 2 a 4 horas. NÃO FECHE esta janela.

echo  Na 1.ª vez pode abrir o browser para login HOMAG.

echo.

echo  No fim: ENVIAR-PECAS-RAILWAY.bat

echo.

pause

where node >nul 2>&1

if errorlevel 1 (

  echo ERRO: Node.js não encontrado.

  pause

  exit /b 1

)

call npm install >nul 2>&1

call npx playwright install chromium

set HOMAG_HEADLESS=0

set HOMAG_EMBED_IMAGES=0

set HOMAG_AUTO_RAILWAY=0

node scripts/homag-import/importar-faltantes-homag.mjs

set RC=%ERRORLEVEL%

echo.

if %RC%==0 (

  echo CONCLUÍDO — execute ENVIAR-PECAS-RAILWAY.bat e actualize o site (Ctrl+Shift+R).

) else (

  echo Terminou com código %RC% — pode executar outra vez para continuar.

)

pause

exit /b %RC%
