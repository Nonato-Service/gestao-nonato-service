# Script PowerShell para configurar início automático do servidor Next.js
# Este script cria uma tarefa agendada no Task Scheduler do Windows

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Green
Write-Host "  CONFIGURANDO INICIO AUTOMATICO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Obtém o caminho do projeto
$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$batFile = Join-Path $projectPath "start-server-auto.bat"

# Verifica se o arquivo existe
if (-not (Test-Path $batFile)) {
    Write-Host "ERRO: Arquivo start-server-auto.bat nao encontrado!" -ForegroundColor Red
    exit 1
}

# Nome da tarefa
$taskName = "NextJS-NonatoService-AutoStart"

# Verifica se a tarefa já existe
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "Tarefa ja existe. Removendo tarefa antiga..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Cria a ação (executar o script batch)
$action = New-ScheduledTaskAction -Execute $batFile -WorkingDirectory $projectPath

# Cria múltiplos triggers para garantir execução SEMPRE
# 1. Trigger ao fazer login do usuário
$trigger1 = New-ScheduledTaskTrigger -AtLogOn
$trigger1.Delay = "PT30S"  # Aguarda 30 segundos após login

# 2. Trigger quando o sistema iniciar (mais confiável - funciona mesmo sem login)
$trigger2 = New-ScheduledTaskTrigger -AtStartup
$trigger2.Delay = "PT1M"  # Aguarda 1 minuto após inicialização

# 3. Trigger periódico a cada 5 minutos para garantir que está rodando
$trigger3 = New-ScheduledTaskTrigger -Once -At (Get-Date)
$trigger3.Repetition = New-ScheduledTaskRepetition -Interval (New-TimeSpan -Minutes 5) -Duration (New-TimeSpan -Days 365)
$trigger3.Enabled = $true

# Array de triggers
$triggers = @($trigger1, $trigger2, $trigger3)

# Configurações da tarefa - otimizadas para SEMPRE executar
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable:$false `
    -ExecutionTimeLimit (New-TimeSpan -Hours 0) `  # Sem limite de tempo
    -RestartCount 999 `  # Tenta reiniciar muitas vezes se falhar
    -RestartInterval (New-TimeSpan -Minutes 1) `  # Reinicia após 1 minuto se falhar
    -MultipleInstances IgnoreNew `  # Ignora se já estiver rodando (evita múltiplas instâncias)
    -StopIfGoingOnBatteries:$false `
    -DeleteExpiredTaskAfter (New-TimeSpan -Days 0) `  # Nunca expira
    -WakeToRun  # Acorda o computador se necessário

# Cria o principal (usuário atual) com permissões elevadas
$principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType Interactive `
    -RunLevel Highest  # Executa com privilégios elevados se necessário

# Registra a tarefa
try {
    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $triggers `
        -Settings $settings `
        -Principal $principal `
        -Description "Inicia automaticamente o servidor Next.js da Gestao Tecnica Nonato Service - SEMPRE ATIVO" `
        -Force | Out-Null
    
    Write-Host ""
    Write-Host "SUCESSO! Tarefa de inicio automatico criada!" -ForegroundColor Green
    Write-Host ""
    
    # Agora cria a tarefa de monitoramento
    $monitorTaskName = "NextJS-NonatoService-Monitor"
    $monitorBatFile = Join-Path $projectPath "monitor-server.bat"
    
    if (Test-Path $monitorBatFile) {
        Write-Host "Criando tarefa de monitoramento..." -ForegroundColor Cyan
        
        $existingMonitorTask = Get-ScheduledTask -TaskName $monitorTaskName -ErrorAction SilentlyContinue
        if ($existingMonitorTask) {
            Unregister-ScheduledTask -TaskName $monitorTaskName -Confirm:$false
        }
        
        $monitorAction = New-ScheduledTaskAction -Execute $monitorBatFile -WorkingDirectory $projectPath
        
        # Monitor inicia após o servidor (2 minutos após login/startup)
        $monitorTrigger1 = New-ScheduledTaskTrigger -AtLogOn
        $monitorTrigger1.Delay = "PT2M"
        
        $monitorTrigger2 = New-ScheduledTaskTrigger -AtStartup
        $monitorTrigger2.Delay = "PT2M"
        
        $monitorTriggers = @($monitorTrigger1, $monitorTrigger2)
        
        $monitorSettings = New-ScheduledTaskSettingsSet `
            -AllowStartIfOnBatteries `
            -DontStopIfGoingOnBatteries `
            -StartWhenAvailable `
            -RunOnlyIfNetworkAvailable:$false `
            -ExecutionTimeLimit (New-TimeSpan -Hours 0) `
            -MultipleInstances IgnoreNew `
            -StopIfGoingOnBatteries:$false `
            -WakeToRun
        
        $monitorPrincipal = New-ScheduledTaskPrincipal `
            -UserId $env:USERNAME `
            -LogonType Interactive `
            -RunLevel Highest
        
        Register-ScheduledTask `
            -TaskName $monitorTaskName `
            -Action $monitorAction `
            -Trigger $monitorTriggers `
            -Settings $monitorSettings `
            -Principal $monitorPrincipal `
            -Description "Monitora e reinicia automaticamente o servidor Next.js se parar - SEMPRE ATIVO" `
            -Force | Out-Null
        
        Write-Host "Tarefa de monitoramento criada com sucesso!" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  CONFIGURACAO CONCLUIDA!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Tarefas criadas no Task Scheduler:" -ForegroundColor Cyan
    Write-Host "  1. '$taskName' - Inicia o servidor automaticamente" -ForegroundColor White
    if (Test-Path $monitorBatFile) {
        Write-Host "  2. '$monitorTaskName' - Monitora e reinicia o servidor se parar" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "O servidor iniciara automaticamente:" -ForegroundColor Cyan
    Write-Host "  - Ao fazer login no Windows" -ForegroundColor White
    Write-Host "  - Quando o sistema iniciar" -ForegroundColor White
    Write-Host "  - A cada 5 minutos (verificacao periodica)" -ForegroundColor White
    Write-Host "  - Com reinicio automatico se parar (via monitor)" -ForegroundColor White
    Write-Host ""
    Write-Host "O sistema esta configurado para SEMPRE manter o servidor rodando!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Para desabilitar, execute:" -ForegroundColor Yellow
    Write-Host "  Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false" -ForegroundColor Gray
    if (Test-Path $monitorBatFile) {
        Write-Host "  Unregister-ScheduledTask -TaskName '$monitorTaskName' -Confirm:`$false" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "Para verificar as tarefas:" -ForegroundColor Yellow
    Write-Host "  Get-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
    if (Test-Path $monitorBatFile) {
        Write-Host "  Get-ScheduledTask -TaskName '$monitorTaskName'" -ForegroundColor Gray
    }
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "ERRO ao criar a tarefa agendada:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Tentando metodo alternativo (pasta de inicializacao)..." -ForegroundColor Yellow
    
    # Método alternativo: pasta de inicialização
    $startupPath = [Environment]::GetFolderPath("Startup")
    $shortcutPath = Join-Path $startupPath "NextJS-NonatoService.lnk"
    
    # Remove atalho antigo se existir
    if (Test-Path $shortcutPath) {
        Remove-Item $shortcutPath -Force
    }
    
    $WshShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut($shortcutPath)
    $Shortcut.TargetPath = $batFile
    $Shortcut.WorkingDirectory = $projectPath
    $Shortcut.WindowStyle = 1  # Minimizado
    $Shortcut.Description = "Inicia servidor Next.js da Gestao Tecnica Nonato Service - SEMPRE ATIVO"
    $Shortcut.Save()
    
    Write-Host ""
    Write-Host "SUCESSO! Atalho criado na pasta de inicializacao!" -ForegroundColor Green
    Write-Host "O servidor iniciara automaticamente quando voce fizer login." -ForegroundColor Cyan
    Write-Host "Localizacao: $startupPath" -ForegroundColor Gray
    Write-Host ""
}

    # Não espera entrada se executado automaticamente
    # Comentado para evitar timeout em execução automática
    # if ($Host.Name -eq "ConsoleHost") {
    #     Write-Host "Pressione qualquer tecla para continuar..."
    #     $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    # }
