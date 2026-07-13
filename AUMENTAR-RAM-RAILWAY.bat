@echo off
chcp 65001 >nul
echo.
echo ============================================================
echo   CORRIGIR: JavaScript heap out of memory (Railway)
echo ============================================================
echo.
echo O log mostrou:
echo   FATAL ERROR: Reached heap limit - JavaScript heap out of memory
echo.
echo A aplicacao precisa de MAIS RAM do que o plano 512 MB permite.
echo O volume /data esta OK (94 ficheiros) — o problema e memoria no arranque.
echo.
echo NOVO: a app principal passa a carregar so no browser (menos RAM no servidor).
echo Mesmo assim, 1 GB no Railway e recomendado para margem de seguranca.
echo.
echo PASSOS NO PAINEL RAILWAY (obrigatorio):
echo.
echo   1. Abra https://railway.app
echo   2. Projeto gest-o-nonato-gestao ^> clique no servico
echo   3. Separador SETTINGS
echo   4. Secao RESOURCES (ou Compute)
echo   5. Aumente Memory para 1 GB (recomendado 2 GB se disponivel)
echo   6. Guarde — o Railway faz redeploy automatico
echo.
echo DEPOIS NO PC:
echo   7. Execute ATUALIZAR-DEPLOY.bat (codigo optimizado standalone)
echo.
echo Variaveis (confirmar):
echo   DATA_DIR = /data   (ou o path do seu volume — nos logs aparece /data)
echo   Volume montado no mesmo path
echo.
echo Enquanto nao aumentar RAM, use no PC:
echo   INICIAR-SERVIDOR-LIMPO.bat
echo.
pause
