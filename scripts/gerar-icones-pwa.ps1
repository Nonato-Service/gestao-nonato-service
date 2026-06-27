# Gera icon-192.png e icon-512.png para PWA (telemovel, tablet, outros PCs via browser)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$proj = Split-Path $PSScriptRoot -Parent
$pngPath = Join-Path $proj 'public\brand\nonato-logo-original.png'
if (-not (Test-Path $pngPath)) {
  Write-Error "Coloque o logo em public/brand/nonato-logo-original.png"
}

function Save-AppIconPng([int]$size, [string]$outPath) {
  $src = [System.Drawing.Image]::FromFile($pngPath)
  try {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    try {
      $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $g.Clear([System.Drawing.Color]::FromArgb(18, 18, 18))
      $margin = [Math]::Max(4, [int]($size * 0.08))
      $inner = $size - (2 * $margin)
      $g.DrawImage($src, $margin, $margin, $inner, $inner)
    } finally {
      $g.Dispose()
    }
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
  } finally {
    $src.Dispose()
  }
  Write-Host "Gerado: $outPath"
}

Save-AppIconPng 192 (Join-Path $proj 'public\icon-192.png')
Save-AppIconPng 512 (Join-Path $proj 'public\icon-512.png')

# Apple touch icon (iPhone/iPad)
Save-AppIconPng 180 (Join-Path $proj 'public\apple-touch-icon.png')
