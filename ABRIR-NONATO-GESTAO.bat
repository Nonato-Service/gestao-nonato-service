@echo off
chcp 65001 >nul
title NONATO SERVICE - Gestao
set "URL=https://gest-o-nonato-gestao.up.railway.app/"
set "EDGE86=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
set "CHROME86=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if exist "%EDGE86%" ( start "" "%EDGE86%" --app="%URL%" & exit /b 0 )
if exist "%EDGE%" ( start "" "%EDGE%" --app="%URL%" & exit /b 0 )
if exist "%CHROME86%" ( start "" "%CHROME86%" --app="%URL%" & exit /b 0 )
if exist "%CHROME%" ( start "" "%CHROME%" --app="%URL%" & exit /b 0 )
start "" "%URL%"
