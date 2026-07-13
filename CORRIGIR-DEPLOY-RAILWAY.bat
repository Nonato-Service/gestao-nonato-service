@echo off
chcp 65001 >nul
echo.
echo ============================================================
echo   CORRIGIR DEPLOY FALHADO NO RAILWAY
echo ============================================================
echo.
echo ERRO: "Pre-deploy command failed" — npm run build
echo.
echo CAUSA: O build JA e feito dentro do Dockerfile.
echo        O comando pre-deploy tenta correr outra vez na imagem
echo        standalone (sem node_modules) e falha.
echo.
echo PASSOS NO PAINEL RAILWAY (obrigatorio):
echo.
echo   1. Abra https://railway.app
echo   2. Projeto ^> servico gest-o-nonato-gestao
echo   3. Separador SETTINGS
echo   4. Secao DEPLOY ^> Pre-deploy command
echo   5. APAGUE o texto "npm run build" (deixe VAZIO)
echo   6. Guarde
echo.
echo VARIAVEIS (Separador Variables):
echo.
echo   NODE_OPTIONS = --max-old-space-size=6144
echo     (ou APAGUE esta variavel — o Dockerfile ja define 6144)
echo     NAO use 384 — isso causa "out of memory" no arranque!
echo.
echo   DATA_DIR = /data  (confirmar path do volume)
echo.
echo DEPOIS NO PC:
echo   7. Execute ATUALIZAR-DEPLOY.bat
echo      (o railway.json agora tem preDeployCommand: null)
echo.
echo O Railway faz redeploy automatico apos guardar as definicoes.
echo.
pause
