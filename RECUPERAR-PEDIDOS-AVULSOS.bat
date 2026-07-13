@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo === Recuperar pedidos avulsos ===
echo.
node scripts/recuperar-pedidos-avulsos.mjs
echo.
pause
