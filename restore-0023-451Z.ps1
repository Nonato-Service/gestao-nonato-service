# Restaurar backup 00:23 451Z
$projectPath = "C:\Users\W10\gestao-tecnica-nonato-service"
$backupPath = Join-Path $projectPath "backups\code-backup-2026-02-05T00-00-23-451Z"

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

Write-Host "Restauracao 00:23 451Z concluida."
