# Solução para Erro EPERM no Next.js
# Execute este script como Administrador

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESOLVENDO ERRO EPERM - Next.js" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectPath

Write-Host "[1/7] Parando processos Node.js..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "[2/7] Limpando cache do Next.js..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

Write-Host "[3/7] Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERRO: Node.js não encontrado!" -ForegroundColor Red
    Write-Host "Instale o Node.js de: https://nodejs.org" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host "[4/7] Verificando dependências..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependências..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERRO: Falha ao instalar dependências!" -ForegroundColor Red
        Read-Host "Pressione Enter para sair"
        exit 1
    }
}

Write-Host "[5/7] Verificando porta 3000..." -ForegroundColor Yellow
$port3000 = netstat -ano | Select-String ":3000.*LISTENING"
if ($port3000) {
    Write-Host "Porta 3000 em uso. Tentando liberar..." -ForegroundColor Yellow
    $port3000 | ForEach-Object {
        if ($_ -match '\s+(\d+)$') {
            $pid = $matches[1]
            Write-Host "Encerrando processo $pid..." -ForegroundColor Yellow
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 2
}

Write-Host "[6/7] Configurando variáveis de ambiente..." -ForegroundColor Yellow
$env:NODE_OPTIONS = "--no-warnings --max-old-space-size=4096"
$env:PORT = "3000"

Write-Host "[7/7] Iniciando servidor Next.js..." -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANTE:" -ForegroundColor Yellow
Write-Host "Se o erro EPERM persistir:" -ForegroundColor Yellow
Write-Host "  1. Execute este script como Administrador" -ForegroundColor Yellow
Write-Host "  2. Adicione esta pasta nas exceções do antivírus:" -ForegroundColor Yellow
Write-Host "     $projectPath" -ForegroundColor Cyan
Write-Host "  3. Verifique o Windows Defender" -ForegroundColor Yellow
Write-Host ""

# Tenta iniciar o servidor
Write-Host "Iniciando servidor..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectPath'; `$env:NODE_OPTIONS='--no-warnings --max-old-space-size=4096'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "Aguarde 20-30 segundos para o servidor compilar..." -ForegroundColor Yellow
Start-Sleep -Seconds 25

Write-Host ""
Write-Host "Verificando status do servidor..." -ForegroundColor Yellow
$serverRunning = netstat -ano | Select-String ":3000.*LISTENING"

if ($serverRunning) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  SUCESSO! SERVIDOR ESTÁ RODANDO!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Acesse: http://localhost:3000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "A janela do servidor foi aberta." -ForegroundColor Yellow
    Write-Host "NÃO FECHE essa janela enquanto usar o sistema!" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ATENÇÃO: Servidor ainda não está respondendo" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possíveis causas:" -ForegroundColor Yellow
    Write-Host "- Erro EPERM (permissão negada)" -ForegroundColor Yellow
    Write-Host "- Antivírus bloqueando" -ForegroundColor Yellow
    Write-Host "- Arquivo page.tsx muito grande (37.000+ linhas)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "SOLUÇÕES:" -ForegroundColor Yellow
    Write-Host "1. Execute este script como Administrador" -ForegroundColor Yellow
    Write-Host "2. Verifique a janela do servidor para ver o erro" -ForegroundColor Yellow
    Write-Host "3. Adicione a pasta nas exceções do antivírus" -ForegroundColor Yellow
    Write-Host "4. Tente usar uma porta diferente:" -ForegroundColor Yellow
    Write-Host "   npm run dev -- -p 3001" -ForegroundColor Cyan
    Write-Host ""
}

Read-Host "Pressione Enter para sair"
