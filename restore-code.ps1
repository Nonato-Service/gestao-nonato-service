# Script para restaurar código a partir de backups
param(
    [string]$BackupName = ""
)

$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backupsPath = Join-Path $projectPath "backups"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   RESTAURAR CÓDIGO DE BACKUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Listar backups disponíveis
$backups = Get-ChildItem -Path $backupsPath -Directory | Sort-Object LastWriteTime -Descending

if ($backups.Count -eq 0) {
    Write-Host "Nenhum backup encontrado na pasta 'backups'!" -ForegroundColor Red
    pause
    exit
}

Write-Host "Backups disponíveis:" -ForegroundColor Yellow
Write-Host ""

$index = 1
$backupList = @()
foreach ($backup in $backups) {
    $backupInfo = Get-Content (Join-Path $backup.FullName "INFO-BACKUP.txt") -ErrorAction SilentlyContinue
    $dateInfo = if ($backupInfo) { ($backupInfo | Select-String "Data:").ToString().Replace("Data:", "").Trim() } else { $backup.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss") }
    
    Write-Host "[$index] $($backup.Name)" -ForegroundColor Green
    Write-Host "    Data: $dateInfo" -ForegroundColor Gray
    Write-Host ""
    
    $backupList += $backup
    $index++
}

# Selecionar backup
if ($BackupName -eq "") {
    Write-Host "Digite o número do backup que deseja restaurar (ou 0 para cancelar): " -ForegroundColor Yellow -NoNewline
    $selection = Read-Host
    
    if ($selection -eq "0" -or $selection -eq "") {
        Write-Host "Operação cancelada." -ForegroundColor Red
        exit
    }
    
    $selectedIndex = [int]$selection - 1
    if ($selectedIndex -lt 0 -or $selectedIndex -ge $backupList.Count) {
        Write-Host "Número inválido!" -ForegroundColor Red
        pause
        exit
    }
    
    $selectedBackup = $backupList[$selectedIndex]
} else {
    $selectedBackup = $backups | Where-Object { $_.Name -eq $BackupName } | Select-Object -First 1
    if (-not $selectedBackup) {
        Write-Host "Backup '$BackupName' não encontrado!" -ForegroundColor Red
        pause
        exit
    }
}

Write-Host ""
Write-Host "ATENÇÃO: Esta operação irá substituir os arquivos atuais!" -ForegroundColor Red
Write-Host "Backup selecionado: $($selectedBackup.Name)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Deseja continuar? (S/N): " -ForegroundColor Yellow -NoNewline
$confirm = Read-Host

if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "Operação cancelada." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Restaurando código..." -ForegroundColor Cyan

# Parar servidor se estiver rodando
Write-Host "Parando servidor (se estiver rodando)..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*$projectPath*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Fazer backup do estado atual antes de restaurar
$currentBackupName = "backup-before-restore-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$currentBackupPath = Join-Path $backupsPath $currentBackupName
Write-Host "Criando backup do estado atual em: $currentBackupName" -ForegroundColor Yellow
New-Item -ItemType Directory -Path $currentBackupPath -Force | Out-Null

# Copiar arquivos importantes antes de restaurar
$filesToBackup = @("app\page.tsx", "app\translations.ts", "package.json", "next.config.js")
foreach ($file in $filesToBackup) {
    $sourcePath = Join-Path $projectPath $file
    if (Test-Path $sourcePath) {
        $destPath = Join-Path $currentBackupPath $file
        $destDir = Split-Path $destPath -Parent
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        Copy-Item $sourcePath $destPath -Force
    }
}

# Restaurar arquivos do backup selecionado
$backupAppPath = Join-Path $selectedBackup.FullName "app"
$backupPublicPath = Join-Path $selectedBackup.FullName "public"

if (Test-Path $backupAppPath) {
    Write-Host "Restaurando pasta 'app'..." -ForegroundColor Green
    Copy-Item -Path "$backupAppPath\*" -Destination (Join-Path $projectPath "app") -Recurse -Force
}

if (Test-Path $backupPublicPath) {
    Write-Host "Restaurando pasta 'public'..." -ForegroundColor Green
    Copy-Item -Path "$backupPublicPath\*" -Destination (Join-Path $projectPath "public") -Recurse -Force
}

# Restaurar arquivos de configuração se existirem
$configFiles = @("package.json", "next.config.js", "tsconfig.json")
foreach ($configFile in $configFiles) {
    $backupConfigPath = Join-Path $selectedBackup.FullName $configFile
    if (Test-Path $backupConfigPath) {
        Write-Host "Restaurando $configFile..." -ForegroundColor Green
        Copy-Item $backupConfigPath (Join-Path $projectPath $configFile) -Force
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   CÓDIGO RESTAURADO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backup do estado anterior salvo em: $currentBackupName" -ForegroundColor Yellow
Write-Host ""
Write-Host "Deseja instalar dependências? (S/N): " -ForegroundColor Yellow -NoNewline
$installDeps = Read-Host

if ($installDeps -eq "S" -or $installDeps -eq "s") {
    Write-Host "Instalando dependências..." -ForegroundColor Cyan
    Set-Location $projectPath
    npm install
}

Write-Host ""
Write-Host "Restauração concluída!" -ForegroundColor Green
Write-Host "Execute 'start-server.bat' para iniciar o servidor." -ForegroundColor Yellow
Write-Host ""
pause
