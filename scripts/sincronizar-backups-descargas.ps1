# Copia backups da pasta Descargas para backups/json e backups/codigo do projeto
$ErrorActionPreference = 'SilentlyContinue'
$proj = Split-Path $PSScriptRoot -Parent
$jsonDir = Join-Path $proj 'backups\json'
$codigoDir = Join-Path $proj 'backups\codigo'
$dl = Join-Path $env:USERPROFILE 'Downloads'
New-Item -ItemType Directory -Path $jsonDir, $codigoDir -Force | Out-Null

$jsonCopied = 0
$zipCopied = 0

Get-ChildItem $dl -File | Where-Object { $_.Name -match '^backup-nonato-service-.*\.json$' -or $_.Name -match '^backup-auto-.*\.json$' } | ForEach-Object {
  $destName = if ($_.Name -match '^backup-nonato-service-') {
    $_.Name -replace '^backup-nonato-service-', 'backup-dados-'
  } else {
    $_.Name -replace '^backup-auto-', 'backup-dados-auto-'
  }
  $dest = Join-Path $jsonDir $destName
  if (-not (Test-Path $dest)) {
    Copy-Item $_.FullName $dest
    $jsonCopied++
  }
}

Get-ChildItem $dl -File | Where-Object { $_.Name -match '^backup-codigo-.*\.zip$' } | ForEach-Object {
  $dest = Join-Path $codigoDir $_.Name
  if (-not (Test-Path $dest)) {
    Copy-Item $_.FullName $dest
    $zipCopied++
  }
}

Write-Host "JSON novos copiados: $jsonCopied"
Write-Host "ZIP novos copiados:  $zipCopied"
Write-Host "Total JSON em backups\json:   $((Get-ChildItem $jsonDir -File).Count)"
Write-Host "Total ZIP em backups\codigo: $((Get-ChildItem $codigoDir -File -Filter *.zip).Count)"
