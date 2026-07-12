@echo off
chcp 65001 >nul
title NONATO - Preparar retoma HOMAG
cd /d "%~dp0"
echo A preparar retoma a partir da biblioteca local (2197+ pecas)...
node scripts/homag-import/preparar-resume.mjs
echo.
echo Agora execute IMPORTAR-TUDO-HOMAG.bat — continua da pagina ~110.
pause
