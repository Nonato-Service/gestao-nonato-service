@echo off
REM Define ORI = pasta raiz do app de referência (com css\style.css), a partir de config-origem-copia.json
set "CFG=%~dp0config-origem-copia.json"
if not exist "%CFG%" (
  echo ERRO: Falta "%CFG%"
  echo Copie config-origem-copia.example.json para config-origem-copia.json
  echo e edite "raizProjetoOriginal" para a pasta do projeto original ^(qualquer nome^).
  exit /b 1
)
set "ORI="
for /f "usebackq delims=" %%O in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $cfgPath = [IO.Path]::GetFullPath((Join-Path '%~dp0' 'config-origem-copia.json')); $j = Get-Content -LiteralPath $cfgPath -Encoding UTF8 -Raw | ConvertFrom-Json; $r = [string]$j.raizProjetoOriginal; if ([string]::IsNullOrWhiteSpace($r)) { throw 'Defina raizProjetoOriginal no JSON.' }; $r = $r.Trim(); $base = [IO.Path]::GetFullPath((Join-Path (Join-Path '%~dp0' '..') '.')); $abs = if ([IO.Path]::IsPathRooted($r)) { [IO.Path]::GetFullPath($r) } else { [IO.Path]::GetFullPath((Join-Path $base $r)) }; Write-Output $abs"`) do set "ORI=%%O"
if not defined ORI (
  echo ERRO: Nao foi possivel ler raizProjetoOriginal do JSON.
  exit /b 1
)
if not exist "%ORI%\css\style.css" (
  echo ERRO: Nao encontrei css\style.css em:
  echo   %ORI%
  echo Corrija raizProjetoOriginal em config-origem-copia.json
  exit /b 1
)
exit /b 0
