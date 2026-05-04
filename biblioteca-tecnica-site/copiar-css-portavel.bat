@echo off
chcp 65001 >nul
set "SRC=%~dp0..\..\biblia-nonato-service\css\style.css"
set "DST=%~dp0css\style.css"
if not exist "%SRC%" (
  echo ERRO: Nao encontrei: %SRC%
  echo Coloque biblia-nonato-service ao lado de gestao-tecnica-nonato-service ^(mesma pasta pai^).
  pause
  exit /b 1
)
if not exist "%~dp0css" mkdir "%~dp0css"
copy /Y "%SRC%" "%DST%" >nul
if errorlevel 1 (
  echo Falha ao copiar.
  pause
  exit /b 1
)
echo OK: CSS completo copiado para
echo   %DST%
echo Esta pasta ja nao depende de @import para o tema.
pause
