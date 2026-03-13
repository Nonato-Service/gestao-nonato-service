# Restaurar backup 06/03 000Z
$projectPath = "C:\Users\W10\gestao-tecnica-nonato-service"
$backupPath = Join-Path $projectPath "backups\code-backup-2026-03-06T20-28-36-000Z"

if (-not (Test-Path $backupPath)) {
    Write-Host "Backup nao encontrado: $backupPath" -ForegroundColor Red
    exit 1
}

Set-Location $projectPath

$backupApp = Join-Path $backupPath "app"
if (Test-Path $backupApp) {
    Copy-Item -Path "$backupApp\*" -Destination (Join-Path $projectPath "app") -Recurse -Force
    Write-Host "app restaurado"
}

$backupPublic = Join-Path $backupPath "public"
if (Test-Path $backupPublic) {
    Copy-Item -Path "$backupPublic\*" -Destination (Join-Path $projectPath "public") -Recurse -Force
    Write-Host "public restaurado"
}

foreach ($f in @("package.json", "next.config.js", "tsconfig.json")) {
    $src = Join-Path $backupPath $f
    if (Test-Path $src) {
        Copy-Item $src (Join-Path $projectPath $f) -Force
        Write-Host "$f restaurado"
    }
}

Write-Host "Restauracao 06/03 000Z concluida."
