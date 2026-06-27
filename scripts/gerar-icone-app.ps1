# Gera public/brand/nonato-app-icon.ico a partir do logo PNG (Windows exige .ico no atalho)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$proj = Split-Path $PSScriptRoot -Parent
$pngCandidates = @(
  (Join-Path $proj 'public\brand\nonato-logo-original.png'),
  (Join-Path $proj 'public\icon-512.png'),
  (Join-Path $proj 'public\icon-192.png')
)
$pngPath = $pngCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $pngPath) {
  Write-Error 'Nenhum PNG encontrado em public/brand/nonato-logo-original.png'
}

$icoPath = Join-Path $proj 'public\brand\nonato-app-icon.ico'
$src = [System.Drawing.Image]::FromFile($pngPath)

try {
  $sizes = @(256, 128, 64, 48, 32, 16)
  $images = New-Object System.Collections.Generic.List[System.Drawing.Bitmap]

  foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    try {
      $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $g.Clear([System.Drawing.Color]::FromArgb(18, 18, 18))
      $margin = [Math]::Max(2, [int]($size * 0.08))
      $inner = $size - (2 * $margin)
      $g.DrawImage($src, $margin, $margin, $inner, $inner)
    } finally {
      $g.Dispose()
    }
    [void]$images.Add($bmp)
  }

  $ms = New-Object System.IO.MemoryStream
  try {
    $writer = New-Object System.IO.BinaryWriter $ms
    $writer.Write([UInt16]0)
    $writer.Write([UInt16]1)
    $writer.Write([UInt16]$images.Count)

    $offset = 6 + (16 * $images.Count)
    $pngDataList = New-Object System.Collections.Generic.List[byte[]]

    foreach ($img in $images) {
      $pngMs = New-Object System.IO.MemoryStream
      try {
        $img.Save($pngMs, [System.Drawing.Imaging.ImageFormat]::Png)
        [void]$pngDataList.Add($pngMs.ToArray())
      } finally {
        $pngMs.Dispose()
      }
    }

    for ($i = 0; $i -lt $images.Count; $i++) {
      $img = $images[$i]
      $w = [Math]::Min(255, $img.Width)
      $h = [Math]::Min(255, $img.Height)
      $writer.Write([byte]$w)
      $writer.Write([byte]$h)
      $writer.Write([byte]0)
      $writer.Write([byte]0)
      $writer.Write([UInt16]1)
      $writer.Write([UInt16]32)
      $writer.Write([UInt32]$pngDataList[$i].Length)
      $writer.Write([UInt32]$offset)
      $offset += $pngDataList[$i].Length
    }

    foreach ($data in $pngDataList) {
      $writer.Write($data)
    }

    [System.IO.File]::WriteAllBytes($icoPath, $ms.ToArray())
  } finally {
    $ms.Dispose()
  }

  foreach ($img in $images) { $img.Dispose() }
} finally {
  $src.Dispose()
}

Write-Host "Icone gerado: $icoPath"
