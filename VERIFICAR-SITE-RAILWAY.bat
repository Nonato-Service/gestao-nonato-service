@echo off
chcp 65001 >nul
cd /d "%~dp0"

set URL=https://gest-o-nonato-gestao.up.railway.app

echo.
echo ============================================
echo   VERIFICAR SITE RAILWAY
echo ============================================
echo   URL: %URL%
echo.

echo [1/3] A testar /api/health ...
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri '%URL%/api/health' -TimeoutSec 25 -UseBasicParsing; Write-Host '   OK' $r.StatusCode; Write-Host $r.Content } catch { Write-Host '   FALHOU:' $_.Exception.Message -ForegroundColor Red }"

echo.
echo [2/3] A testar pagina principal ...
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri '%URL%/' -TimeoutSec 25 -UseBasicParsing; Write-Host '   OK' $r.StatusCode } catch { Write-Host '   FALHOU:' $_.Exception.Message -ForegroundColor Red }"

echo.
echo [3/3] Servidor LOCAL (PC) ...
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3000/api/health' -TimeoutSec 5 -UseBasicParsing; Write-Host '   LOCAL OK - pode usar http://127.0.0.1:3000 neste PC' } catch { Write-Host '   Local nao esta a correr. Execute INICIAR-SERVIDOR-LIMPO.bat ou REINICIAR-E-ABRIR-3000.bat' }"

echo.
echo ============================================
echo   SE RAILWAY MOSTRA "Application failed to respond"
echo ============================================
echo.
echo 1. Abra https://railway.app e entre no projeto
echo 2. Clique no servico ^> separador DEPLOYMENTS
echo    - Se o ultimo deploy falhou: abra BUILD LOGS
echo    - Se passou mas site caiu: abra DEPLOY LOGS / HTTP LOGS
echo 3. Procure: Killed, OOM, out of memory, Error, exit code
echo 4. Settings ^> Variables:
echo      DATA_DIR = /app/data
echo      (Volume montado em /app/data)
echo 5. Settings ^> Resources: aumente RAM se possivel (512MB pode ser pouco)
echo 6. Clique REDEPLOY no ultimo deploy ou execute ATUALIZAR-DEPLOY.bat
echo 7. Verifique creditos/plano Railway (servico pausado = site em baixo)
echo.
echo Enquanto corrige: use o PC local com INICIAR-SERVIDOR-LIMPO.bat
echo   Na mesma Wi-Fi, no telemovel: http://IP-DO-PC:3000
echo.
pause
