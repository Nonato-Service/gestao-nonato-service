# Utilitários partilhados — ícones PWA / favicon a partir de nonato-logo-original.png
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

function Get-ImageOpaqueBounds {
  param(
    [System.Drawing.Image]$Image,
    [int]$AlphaThreshold = 24
  )
  $minX = $Image.Width
  $minY = $Image.Height
  $maxX = -1
  $maxY = -1

  for ($y = 0; $y -lt $Image.Height; $y++) {
    for ($x = 0; $x -lt $Image.Width; $x++) {
      if ($Image.GetPixel($x, $y).A -ge $AlphaThreshold) {
        if ($x -lt $minX) { $minX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }

  if ($maxX -lt $minX) { return $null }

  return [PSCustomObject]@{
    X      = $minX
    Y      = $minY
    Width  = ($maxX - $minX + 1)
    Height = ($maxY - $minY + 1)
  }
}

function Save-CenteredAppIconPng {
  param(
    [string]$SourcePath,
    [int]$Size,
    [string]$OutPath,
    [double]$FillRatio = 0.86,
    [int]$BackgroundArgb = 0xFF121212
  )

  $src = [System.Drawing.Image]::FromFile($SourcePath)
  try {
    $bmp = New-Object System.Drawing.Bitmap $Size, $Size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    try {
      $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $g.Clear([System.Drawing.Color]::FromArgb($BackgroundArgb))

      $bounds = Get-ImageOpaqueBounds -Image $src
      if ($bounds) {
        $srcRect = [System.Drawing.Rectangle]::new($bounds.X, $bounds.Y, $bounds.Width, $bounds.Height)
      } else {
        $srcRect = [System.Drawing.Rectangle]::new(0, 0, $src.Width, $src.Height)
      }

      $inner = [Math]::Floor($Size * $FillRatio)
      $scale = [Math]::Min($inner / $srcRect.Width, $inner / $srcRect.Height)
      $drawW = $srcRect.Width * $scale
      $drawH = $srcRect.Height * $scale
      $destX = ($Size - $drawW) / 2.0
      $destY = ($Size - $drawH) / 2.0

      $destRect = [System.Drawing.Rectangle]::new(
        [int][Math]::Round($destX),
        [int][Math]::Round($destY),
        [int][Math]::Round($drawW),
        [int][Math]::Round($drawH)
      )

      $g.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    } finally {
      $g.Dispose()
    }

    $dir = Split-Path $OutPath -Parent
    if ($dir -and -not (Test-Path $dir)) {
      New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
  } finally {
    $src.Dispose()
  }

  Write-Host "Gerado: $OutPath (${Size}px, fill $FillRatio)"
}
