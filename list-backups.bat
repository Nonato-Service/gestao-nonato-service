@echo off
echo ========================================
echo   LISTAR BACKUPS DISPONIVEIS
echo ========================================
cd /d "%~dp0"

if not exist "backups" (
    echo Pasta 'backups' nao encontrada!
    pause
    exit
)

echo.
echo Backups disponiveis:
echo.

for /f "delims=" %%i in ('dir /b /ad /o-d backups') do (
    echo [%%i]
    if exist "backups\%%i\INFO-BACKUP.txt" (
        type "backups\%%i\INFO-BACKUP.txt" | findstr /C:"Data:"
    ) else (
        echo    Data: (informacao nao disponivel)
    )
    echo.
)

pause
