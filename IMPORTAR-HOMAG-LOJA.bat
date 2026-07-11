@echo off
chcp 65001 >nul
title NONATO - Importar peças HOMAG
cd /d "%~dp0"

echo.
echo  IMPORTAR DA HOMAG eShop
echo  =======================
echo  URL: spare-parts (shop.homag.com)
echo.
echo  1. Abre o browser Chromium
echo  2. Faca LOGIN na HOMAG
echo  3. Va a lista de spare parts
echo  4. Volte aqui e prima ENTER
echo.

set HOMAG_MANUAL=1
set HOMAG_HEADLESS=0
npm run homag:import

echo.
echo  Depois: Biblioteca de Pecas - Importacao - Carregar
echo  scripts\homag-import\out\export.json
echo.
pause
