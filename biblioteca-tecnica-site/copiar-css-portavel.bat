@echo off
chcp 65001 >nul
call "%~dp0carregar-origem.bat"
if errorlevel 1 (
  pause
  exit /b 1
)
set "SRC=%ORI%\css\style.css"
set "DST=%~dp0css\style.css"
if not exist "%SRC%" (
  echo ERRO: Nao encontrei: %SRC%
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
echo Caminho do original vem de config-origem-copia.json ^(qualquer nome de pasta^).
pause
