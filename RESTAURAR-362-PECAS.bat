@echo off
chcp 65001 >nul
title NONATO - RESTAURAR 362 PECAS
cd /d "%~dp0"

echo.
echo  RESTAURACAO - 362 PECAS (porta 3000, Microsoft Edge)
echo  =====================================================
echo.

node scripts\gerar-biblioteca-lite.mjs 2>nul
node scripts\restaurar-biblioteca-pecas-seguro.mjs 2>nul

call scripts\libera-porta-3000.bat

echo  A limpar cache .next...
if exist .next rmdir /s /q .next

echo  A iniciar servidor em http://localhost:3000
start "NONATO Servidor" cmd /k "cd /d %~dp0 && npm run dev"
timeout /t 15 /nobreak >nul

echo  A abrir no Microsoft Edge...
call scripts\abrir-edge.bat "http://localhost:3000/recuperar-biblioteca.html"

echo.
echo  Aguarde ate dizer "Concluido" com 362 pecas.
echo  Depois abra a aplicacao no Edge e prima Ctrl+Shift+R.
echo.
pause
