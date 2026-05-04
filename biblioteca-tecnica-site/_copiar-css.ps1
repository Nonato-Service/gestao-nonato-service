$src = Join-Path $PSScriptRoot '..\..\biblia-nonato-service\css\style.css' | Resolve-Path
$dstDir = Join-Path $PSScriptRoot 'css'
$dst = Join-Path $dstDir 'style.css'
if (-not (Test-Path $src)) { throw "Origem nao encontrada: $src" }
New-Item -ItemType Directory -Force -Path $dstDir | Out-Null
Copy-Item -LiteralPath $src -Destination $dst -Force
Write-Host "OK" (Get-Item $dst).Length
