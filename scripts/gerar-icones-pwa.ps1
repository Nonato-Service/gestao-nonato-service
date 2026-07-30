# Gera icon-192.png, icon-512.png e apple-touch-icon.png (PWA / telemóvel)
# Recorta margens transparentes do PNG e centra a marca no quadrado.
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'icon-brand-utils.ps1')

$proj = Split-Path $PSScriptRoot -Parent
$pngPath = Join-Path $proj 'public\brand\nonato-logo-original.png'
if (-not (Test-Path $pngPath)) {
  Write-Error "Coloque o logo em public/brand/nonato-logo-original.png"
}

Save-CenteredAppIconPng -SourcePath $pngPath -Size 192 -OutPath (Join-Path $proj 'public\icon-192.png') -FillRatio 0.88
Save-CenteredAppIconPng -SourcePath $pngPath -Size 512 -OutPath (Join-Path $proj 'public\icon-512.png') -FillRatio 0.88
Save-CenteredAppIconPng -SourcePath $pngPath -Size 512 -OutPath (Join-Path $proj 'public\icon-512-maskable.png') -FillRatio 0.72
Save-CenteredAppIconPng -SourcePath $pngPath -Size 180 -OutPath (Join-Path $proj 'public\apple-touch-icon.png') -FillRatio 0.88

Write-Host 'Icones PWA gerados (marca centrada, maskable com margem segura Android).'
