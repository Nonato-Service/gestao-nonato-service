@echo off
set "URL=%~1"
if "%URL%"=="" exit /b 1
set "EDGE86=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if exist "%EDGE86%" ( start "" "%EDGE86%" "%URL%" & exit /b 0 )
if exist "%EDGE%" ( start "" "%EDGE%" "%URL%" & exit /b 0 )
echo Microsoft Edge nao encontrado. Abra manualmente: %URL%
exit /b 1
