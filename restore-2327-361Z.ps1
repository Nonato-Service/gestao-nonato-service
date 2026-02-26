# Restaurar backup 23:27 361Z
$projectPath = "C:\Users\W10\gestao-tecnica-nonato-service"
$backupPath = Join-Path $projectPath "backups\code-backup-2026-02-04T23-27-06-361Z"

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

Write-Host "Restauracao 23:27 361Z concluida."
