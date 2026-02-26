# Script PowerShell para remover o início automático do servidor

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  REMOVENDO INICIO AUTOMATICO" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

$taskName = "NextJS-NonatoService-AutoStart"
$monitorTaskName = "NextJS-NonatoService-Monitor"

# Tenta remover a tarefa de início automático
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($existingTask) {
    try {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        Write-Host "Tarefa de inicio automatico removida com sucesso!" -ForegroundColor Green
    } catch {
        Write-Host "ERRO ao remover tarefa de inicio automatico:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
} else {
    Write-Host "Nenhuma tarefa de inicio automatico encontrada." -ForegroundColor Gray
}

# Tenta remover a tarefa de monitoramento
$existingMonitorTask = Get-ScheduledTask -TaskName $monitorTaskName -ErrorAction SilentlyContinue

if ($existingMonitorTask) {
    try {
        Unregister-ScheduledTask -TaskName $monitorTaskName -Confirm:$false
        Write-Host "Tarefa de monitoramento removida com sucesso!" -ForegroundColor Green
    } catch {
        Write-Host "ERRO ao remover tarefa de monitoramento:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
} else {
    Write-Host "Nenhuma tarefa de monitoramento encontrada." -ForegroundColor Gray
}

# Remove o atalho da pasta de inicialização (método alternativo)
$startupPath = [Environment]::GetFolderPath("Startup")
$shortcutPath = Join-Path $startupPath "NextJS-NonatoService.lnk"

if (Test-Path $shortcutPath) {
    try {
        Remove-Item $shortcutPath -Force
        Write-Host "Atalho da pasta de inicializacao removido!" -ForegroundColor Green
    } catch {
        Write-Host "ERRO ao remover atalho:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
} else {
    Write-Host "Nenhum atalho encontrado na pasta de inicializacao." -ForegroundColor Gray
}

Write-Host ""
Write-Host "Inicio automatico removido com sucesso!" -ForegroundColor Green
Write-Host ""
# Não espera entrada se executado automaticamente
if ($Host.Name -eq "ConsoleHost") {
    Write-Host "Pressione qualquer tecla para continuar..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
