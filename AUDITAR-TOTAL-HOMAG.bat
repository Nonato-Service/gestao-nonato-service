@echo off

chcp 65001 >nul

title NONATO - Auditar total HOMAG

cd /d "%~dp0"

call npm install >nul 2>&1

call npx playwright install chromium >nul 2>&1

node scripts/homag-import/auditar-total-homag.mjs

pause

