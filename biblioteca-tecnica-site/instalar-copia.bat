@echo off
chcp 65001 >nul
set "ORI=C:\Users\W10\biblia-nonato-service"
set "DST=%~dp0"
if not exist "%ORI%\css\style.css" (
  echo ERRO: Nao encontrei a pasta original:
  echo   %ORI%
  echo Edite este .bat e defina ORI= para o caminho correto da biblia-nonato-service.
  pause
  exit /b 1
)
echo A copiar de:
echo   %ORI%
echo Para:
echo   %DST%
if not exist "%DST%css" mkdir "%DST%css"
if not exist "%DST%js" mkdir "%DST%js"
if not exist "%DST%assets" mkdir "%DST%assets"

REM CSS estatico completo (substitui o style.css com @import, se existir)
xcopy "%ORI%\css\*" "%DST%css\" /E /I /Y /Q

REM NAO copiar db.js do original — mantem GestaoBibliaNonatoSite nesta pasta.

REM app.js: copia e ajusta chave do hero para nao misturar com a Biblia no mesmo browser
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$s=[IO.File]::ReadAllText('%ORI%\js\app.js'); ^
   $s=$s.Replace(\"const LS_HERO = 'biblia.heroDismissed';\",\"const LS_HERO = 'gestao.biblia.heroDismissed';\"); ^
   [IO.File]::WriteAllText((Join-Path '%DST%' 'js\app.js'), $s)"

xcopy "%ORI%\js\start-info.js" "%DST%js\" /Y /Q
if exist "%ORI%\assets\*" xcopy "%ORI%\assets\*" "%DST%assets\" /E /I /Y /Q

REM manifest.json e service-worker.js desta pasta ja sao os da gestao — nao sobrescrever com o original.
if exist "%ORI%\iniciar-servidor.bat" copy /Y "%ORI%\iniciar-servidor.bat" "%DST%" >nul 2>nul

echo.
echo Concluido: css, js/app.js ^(com LS_HERO da gestao^), start-info.js, assets.
echo Base IndexedDB: continue a usar js\db.js desta pasta ^(nao foi alterado^).
echo.
pause
