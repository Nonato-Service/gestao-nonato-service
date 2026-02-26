@echo off
echo ========================================
echo   CRIAR ATALHOS NA AREA DE TRABALHO
echo ========================================
cd /d "%~dp0"

set "desktop=%USERPROFILE%\Desktop"
set "projectPath=%~dp0"

echo Criando atalhos na area de trabalho...
echo.

REM Criar atalho para iniciar servidor
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%desktop%\Iniciar Servidor.lnk'); $Shortcut.TargetPath = '%projectPath%start-server.bat'; $Shortcut.WorkingDirectory = '%projectPath%'; $Shortcut.IconLocation = 'shell32.dll,13'; $Shortcut.Description = 'Iniciar servidor Next.js'; $Shortcut.Save()"

REM Criar atalho para parar servidor
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%desktop%\Parar Servidor.lnk'); $Shortcut.TargetPath = '%projectPath%stop-server.bat'; $Shortcut.WorkingDirectory = '%projectPath%'; $Shortcut.IconLocation = 'shell32.dll,28'; $Shortcut.Description = 'Parar servidor Next.js'; $Shortcut.Save()"

REM Criar atalho para reiniciar servidor
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%desktop%\Reiniciar Servidor.lnk'); $Shortcut.TargetPath = '%projectPath%restart-server.bat'; $Shortcut.WorkingDirectory = '%projectPath%'; $Shortcut.IconLocation = 'shell32.dll,238'; $Shortcut.Description = 'Reiniciar servidor Next.js'; $Shortcut.Save()"

REM Criar atalho para restaurar codigo
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%desktop%\Restaurar Codigo.lnk'); $Shortcut.TargetPath = '%projectPath%restore-code.bat'; $Shortcut.WorkingDirectory = '%projectPath%'; $Shortcut.IconLocation = 'shell32.dll,32'; $Shortcut.Description = 'Restaurar codigo de backup'; $Shortcut.Save()"

REM Criar atalho para listar backups
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%desktop%\Listar Backups.lnk'); $Shortcut.TargetPath = '%projectPath%list-backups.bat'; $Shortcut.WorkingDirectory = '%projectPath%'; $Shortcut.IconLocation = 'shell32.dll,4'; $Shortcut.Description = 'Listar backups disponiveis'; $Shortcut.Save()"

echo.
echo ========================================
echo   ATALHOS CRIADOS COM SUCESSO!
echo ========================================
echo.
echo Os seguintes atalhos foram criados na sua area de trabalho:
echo   - Iniciar Servidor
echo   - Parar Servidor
echo   - Reiniciar Servidor
echo   - Restaurar Codigo
echo   - Listar Backups
echo.
pause
