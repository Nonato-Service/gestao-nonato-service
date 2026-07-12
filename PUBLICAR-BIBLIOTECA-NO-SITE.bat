@echo off
chcp 65001 >nul
title NONATO - Publicar biblioteca no site Railway
cd /d "%~dp0"

echo.
echo  ============================================================
echo   PUBLICAR NO SITE (Railway)
echo  ============================================================
echo.
echo  As novidades (busca por NOME, Sync HOMAG, Actualizar biblioteca)
echo  estao no PC mas o site https://gest-o-nonato-gestao.up.railway.app
echo  so actualiza DEPOIS deste passo.
echo.
echo  Vai enviar codigo para GitHub e o Railway faz deploy (2-5 min).
echo.
pause

call "%~dp0ATUALIZAR-DEPLOY.bat" "Biblioteca: busca por nome + sync HOMAG + actualizar"
