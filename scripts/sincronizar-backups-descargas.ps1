# Copia backups da pasta Descargas para backups/json e backups/codigo do projeto
$ErrorActionPreference = 'SilentlyContinue'
$proj = Split-Path $PSScriptRoot -Parent
$jsonDir = Join-Path $proj 'backups\json'
$codigoDir = Join-Path $proj 'backups\codigo'
$dl = Join-Path $env:USERPROFILE 'Downloads'
New-Item -ItemType Directory -Path $jsonDir, $codigoDir -Force | Out-Null

$jsonCopied = 0
$zipCopied = 0
$dataZipCopied = 0

Get-ChildItem $dl -File | Where-Object { $_.Name -match '^backup-nonato-service-.*\.json$' -or $_.Name -match '^backup-auto-.*\.json$' -or $_.Name -match '^backup-dados-.*\.json$' } | ForEach-Object {
  $destName = if ($_.Name -match '^backup-nonato-service-') {
    $_.Name -replace '^backup-nonato-service-', 'backup-dados-'
  } elseif ($_.Name -match '^backup-auto-') {
    $_.Name -replace '^backup-auto-', 'backup-dados-auto-'
  } else {
    $_.Name
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

Get-ChildItem $dl -File | Where-Object { $_.Name -match '^backup-dados-completo-.*\.zip$' } | ForEach-Object {
  $dest = Join-Path $jsonDir $_.Name
  if (-not (Test-Path $dest)) {
    Copy-Item $_.FullName $dest
    $dataZipCopied++
  }
}

Write-Host "JSON novos copiados:      $jsonCopied"
Write-Host "ZIP codigo novos copiados: $zipCopied"
Write-Host "ZIP dados novos copiados:  $dataZipCopied"
Write-Host "Total JSON em backups\json:   $((Get-ChildItem $jsonDir -File -Filter *.json).Count)"
Write-Host "Total ZIP codigo em backups\codigo: $((Get-ChildItem $codigoDir -File -Filter backup-codigo-*.zip).Count)"
Write-Host "Total ZIP dados em backups\json:    $((Get-ChildItem $jsonDir -File -Filter backup-dados-completo-*.zip).Count)"
