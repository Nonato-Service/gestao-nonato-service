# Restaurar backup 18:22 17 (dia 17 - backup mais proximo: 17 Jan 18:58)
# Nao existe backup exato 18:22 054Z; usa-se code-backup-2026-01-17T18-58-55-974Z
$projectPath = "C:\Users\W10\gestao-tecnica-nonato-service"
$backupPath = Join-Path $projectPath "backups\code-backup-2026-01-17T18-58-55-974Z"

if (-not (Test-Path $backupPath)) {
    Write-Host "Backup nao encontrado: $backupPath" -ForegroundColor Red
    Write-Host "Backups do dia 17 disponiveis:" -ForegroundColor Yellow
    Get-ChildItem (Join-Path $projectPath "backups") -Directory | Where-Object { $_.Name -match "01-17|02-17|03-17" } | ForEach-Object { Write-Host "  $($_.Name)" }
    exit 1
}

Set-Location $projectPath

# app
$backupApp = Join-Path $backupPath "app"
if (Test-Path $backupApp) {
    Copy-Item -Path "$backupApp\*" -Destination (Join-Path $projectPath "app") -Recurse -Force
    Write-Host "app restaurado"
}

# public
$backupPublic = Join-Path $backupPath "public"
if (Test-Path $backupPublic) {
    Copy-Item -Path "$backupPublic\*" -Destination (Join-Path $projectPath "public") -Recurse -Force
    Write-Host "public restaurado"
}

# config
foreach ($f in @("package.json", "next.config.js", "tsconfig.json")) {
    $src = Join-Path $backupPath $f
    if (Test-Path $src) {
        Copy-Item $src (Join-Path $projectPath $f) -Force
        Write-Host "$f restaurado"
    }
}

Write-Host "Restauracao concluida (backup 17 Jan 18:58)."
