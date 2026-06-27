# Cria atalho na Área de Trabalho — NONATO SERVICE Gestão (modo app, com ícone)
$ErrorActionPreference = 'Stop'
$proj = Split-Path $PSScriptRoot -Parent
$desktop = [Environment]::GetFolderPath('Desktop')
$urlFile = Join-Path $proj 'gestao-url.txt'
$url = 'https://gest-o-nonato-gestao.up.railway.app/'
if (Test-Path $urlFile) {
  $line = (Get-Content $urlFile -ErrorAction SilentlyContinue | Select-Object -First 1).Trim()
  if ($line -match '^https?://') { $url = $line.TrimEnd('/') + '/' }
}

$launcher = Join-Path $proj 'ABRIR-NONATO-GESTAO.bat'
$launcherContent = @"
@echo off
chcp 65001 >nul
title NONATO SERVICE - Gestao
set "URL=$url"
set "EDGE86=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
set "CHROME86=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if exist "%EDGE86%" ( start "" "%EDGE86%" --app="%URL%" & exit /b 0 )
if exist "%EDGE%" ( start "" "%EDGE%" --app="%URL%" & exit /b 0 )
if exist "%CHROME86%" ( start "" "%CHROME86%" --app="%URL%" & exit /b 0 )
if exist "%CHROME%" ( start "" "%CHROME%" --app="%URL%" & exit /b 0 )
start "" "%URL%"
"@
Set-Content -Path $launcher -Value $launcherContent -Encoding UTF8

$iconCandidates = @(
  (Join-Path $proj 'public\brand\nonato-logo-original.png'),
  (Join-Path $proj 'public\icon-192.png'),
  (Join-Path $proj 'public\icon-512.png'),
  (Join-Path $proj 'app\icon.svg'),
  (Join-Path $proj 'public\icon.svg')
)
$iconPath = $iconCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $iconPath) {
  $iconPath = "$env:SystemRoot\System32\imageres.dll,109"
}

$shortcutPath = Join-Path $desktop 'NONATO SERVICE - Gestao.lnk'
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = $launcher
$Shortcut.WorkingDirectory = $proj
$Shortcut.WindowStyle = 1
$Shortcut.Description = 'Abrir Gestao Tecnica Nonato Service (login obrigatorio)'
$Shortcut.IconLocation = $iconPath
$Shortcut.Save()

Copy-Item -Path $launcher -Destination (Join-Path $desktop 'ABRIR-NONATO-GESTAO.bat') -Force -ErrorAction SilentlyContinue

Write-Host ''
Write-Host '============================================'
Write-Host '  ATALHO CRIADO COM SUCESSO'
Write-Host '============================================'
Write-Host ''
Write-Host "  Area de trabalho: $shortcutPath"
Write-Host "  URL: $url"
Write-Host '  Modo: janela tipo app (Edge/Chrome --app)'
Write-Host ''
Write-Host '  Ao abrir, utilize UTILIZADOR + SENHA.'
Write-Host ''
