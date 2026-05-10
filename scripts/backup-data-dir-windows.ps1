<#
.SYNOPSIS
    Cópia de segurança da pasta de dados da Gestão Técnica Nonato Service (API / ficheiros em disco).

.DESCRIPTION
    Copia o conteúdo da pasta onde a aplicação grava os dados (por defeito `data` na raiz do projeto,
    ou o caminho em $env:DATA_DIR se estiver definido ao correr o Node).

    Use com o Agendador de Tarefas do Windows (várias vezes ao dia). Guarde o destino num disco
    externo ou noutro PC (rede), não só no mesmo disco do servidor.

.PARAMETER BackupRoot
    Pasta onde serão criadas subpastas `data_aaaa-MM-dd_HHmmss` (obrigatório).

.PARAMETER SourceDataDir
    Pasta a copiar. Se omitido: variável de ambiente DATA_DIR; se vazia: `<raiz do repo>\data`.

.PARAMETER MaxKeep
    Apaga cópias antigas em BackupRoot, mantendo só as N mais recentes (0 = não apagar).

.EXAMPLE
    .\scripts\backup-data-dir-windows.ps1 -BackupRoot "E:\BackupsNonato"

.EXAMPLE
    $env:DATA_DIR = "D:\NonatoData"; .\scripts\backup-data-dir-windows.ps1 -BackupRoot "\\NAS\backup\nonato"
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string] $BackupRoot,

    [Parameter(Mandatory = $false)]
    [string] $SourceDataDir = "",

    [Parameter(Mandatory = $false)]
    [int] $MaxKeep = 0
)

$ErrorActionPreference = "Stop"

function Resolve-SourceDataPath {
    if ($SourceDataDir -and (Test-Path -LiteralPath $SourceDataDir)) {
        return (Resolve-Path -LiteralPath $SourceDataDir).Path
    }
    $fromEnv = [Environment]::GetEnvironmentVariable("DATA_DIR", "Process")
    if ($fromEnv -and (Test-Path -LiteralPath $fromEnv)) {
        return (Resolve-Path -LiteralPath $fromEnv).Path
    }
    $repoRoot = Split-Path -Parent $PSScriptRoot
    $defaultData = Join-Path $repoRoot "data"
    if (-not (Test-Path -LiteralPath $defaultData)) {
        throw "Pasta de dados não encontrada: $defaultData. Defina -SourceDataDir ou a variável DATA_DIR."
    }
    return (Resolve-Path -LiteralPath $defaultData).Path
}

$source = Resolve-SourceDataPath
if (-not (Test-Path -LiteralPath $BackupRoot)) {
    New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null
}
$destRoot = Resolve-Path -LiteralPath $BackupRoot
$stamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$dest = Join-Path $destRoot.Path "data_$stamp"

Write-Host "Origem:  $source"
Write-Host "Destino: $dest"

New-Item -ItemType Directory -Path $dest -Force | Out-Null

# /E = inclui subpastas vazias; /COPY:DAT = dados, atributos, horas; /R /W = tentativas em ficheiros bloqueados
# /MT = vários ficheiros em paralelo (ajuste se o disco for lento)
$robolog = Join-Path $dest "_robocopy.log"
& robocopy.exe $source $dest /E /COPY:DAT /R:3 /W:10 /MT:8 /NP /NDL /NFL /LOG:$robolog | Out-Host
$rc = $LASTEXITCODE
# Robocopy: 0–7 = concluído sem erros fatais; ≥8 = erro
if ($rc -ge 8) {
    throw "robocopy terminou com código $rc (ver $robolog)"
}

Write-Host "OK — cópia concluída (código robocopy: $rc)."

if ($MaxKeep -gt 0) {
    $dirs = Get-ChildItem -LiteralPath $destRoot.Path -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match '^data_\d{4}-\d{2}-\d{2}_\d{6}$' } |
        Sort-Object Name -Descending
    if ($dirs.Count -gt $MaxKeep) {
        $toRemove = $dirs | Select-Object -Skip $MaxKeep
        foreach ($d in $toRemove) {
            Write-Host "A remover cópia antiga: $($d.FullName)"
            Remove-Item -LiteralPath $d.FullName -Recurse -Force -ErrorAction Continue
        }
    }
}
