@echo off

chcp 65001 >nul

title NONATO - Enviar 362 pecas para Railway

cd /d "%~dp0"



echo.

echo  ENVIAR 362 PECAS DESTE PC PARA A NUVEM (Railway)

echo  =================================================

echo.

echo  As 362 pecas estao NESTE PC (pasta data\).

echo  O site https://gest-o-nonato-gestao.up.railway.app/

echo  e outro servidor — por isso la aparece 0 pecas.

echo.

echo  Este script copia o catalogo deste PC para a nuvem.

echo  Vai pedir utilizador e senha do sistema.

echo.



node scripts\gerar-biblioteca-lite.mjs 2>nul



node scripts\enviar-biblioteca-railway.mjs https://gest-o-nonato-gestao.up.railway.app



echo.

call scripts\abrir-edge.bat "https://gest-o-nonato-gestao.up.railway.app/"

pause

