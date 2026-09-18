# Cria atalho na Área de Trabalho — NONATO SERVICE Gestão (modo app, com ícone)
$ErrorActionPreference = 'Stop'
$proj = Split-Path $PSScriptRoot -Parent
$desktop = [Environment]::GetFolderPath('Desktop')
$urlFile = Join-Path $proj 'gestao-url.txt'
$url = 'https://gest-o-nonato-gestao.up.railway.app/acesso'
if (Test-Path $urlFile) {
  $line = (Get-Content $urlFile -ErrorAction SilentlyContinue | Select-Object -First 1).Trim()
  if ($line -match '^https?://') { $url = $line.TrimEnd('/') + '/acesso' }
}

$launcher = Join-Path $proj 'ABRIR-NONATO-GESTAO.bat'
$launcherFs = Join-Path $proj 'ABRIR-NONATO-GESTAO-TELA-CHEIA.bat'
function Get-LauncherBody([string]$extraFlags) {
  if ([string]::IsNullOrWhiteSpace($extraFlags)) { $extraFlags = '' }
@"
@echo off
chcp 65001 >nul
title NONATO SERVICE - Gestao
set "URL=$url"
set "EDGE86=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
set "EDGEUSER=%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe"
set "CHROME86=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
set "CHROMEUSER=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
if exist "%EDGE86%" ( start "" "%EDGE86%" --app="%URL%"$extraFlags & exit /b 0 )
if exist "%EDGE%" ( start "" "%EDGE%" --app="%URL%"$extraFlags & exit /b 0 )
if exist "%EDGEUSER%" ( start "" "%EDGEUSER%" --app="%URL%"$extraFlags & exit /b 0 )
if exist "%CHROME86%" ( start "" "%CHROME86%" --app="%URL%"$extraFlags & exit /b 0 )
if exist "%CHROME%" ( start "" "%CHROME%" --app="%URL%"$extraFlags & exit /b 0 )
if exist "%CHROMEUSER%" ( start "" "%CHROMEUSER%" --app="%URL%"$extraFlags & exit /b 0 )
start microsoft-edge:"%URL%"
"@
}
Set-Content -Path $launcher -Value (Get-LauncherBody '') -Encoding UTF8
Set-Content -Path $launcherFs -Value (Get-LauncherBody ' --start-fullscreen --start-maximized') -Encoding UTF8

$iconScript = Join-Path $PSScriptRoot 'gerar-icone-app.ps1'
$pwaIconScript = Join-Path $PSScriptRoot 'gerar-icones-pwa.ps1'
if (Test-Path $pwaIconScript) {
  & $pwaIconScript | Out-Null
}
if (Test-Path $iconScript) {
  & $iconScript | Out-Null
}

$iconPath = Join-Path $proj 'public\brand\nonato-app-icon.ico'
if (-not (Test-Path $iconPath)) {
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

$shortcutFsPath = Join-Path $desktop 'NONATO SERVICE - Ecra inteiro.lnk'
$ShortcutFs = $WshShell.CreateShortcut($shortcutFsPath)
$ShortcutFs.TargetPath = $launcherFs
$ShortcutFs.WorkingDirectory = $proj
$ShortcutFs.WindowStyle = 1
$ShortcutFs.Description = 'Abrir Gestao Tecnica Nonato Service em ecra inteiro'
$ShortcutFs.IconLocation = $iconPath
$ShortcutFs.Save()

Copy-Item -Path $launcher -Destination (Join-Path $desktop 'ABRIR-NONATO-GESTAO.bat') -Force -ErrorAction SilentlyContinue
Copy-Item -Path $launcherFs -Destination (Join-Path $desktop 'ABRIR-NONATO-GESTAO-TELA-CHEIA.bat') -Force -ErrorAction SilentlyContinue

Write-Host ''
Write-Host '============================================'
Write-Host '  ATALHO CRIADO COM SUCESSO'
Write-Host '============================================'
Write-Host ''
Write-Host "  Area de trabalho: $shortcutPath"
Write-Host "  Ecra inteiro: $shortcutFsPath"
Write-Host "  Icone: $iconPath"
Write-Host "  URL: $url"
Write-Host '  Modo: janela tipo app (Edge/Chrome --app) — nao abre o Firefox'
Write-Host '  O atalho «Ecra inteiro» ocupa toda a tela.'
Write-Host ''
Write-Host '  Ao abrir, utilize UTILIZADOR + SENHA.'
Write-Host ''
