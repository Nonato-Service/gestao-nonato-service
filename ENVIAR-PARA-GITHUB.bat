@echo off
chcp 65001 >nul
echo ============================================
echo   ENVIAR PROJETO PARA O GITHUB
echo ============================================
echo.
echo ANTES DE EXECUTAR:
echo 1. Crie uma conta em https://github.com
echo 2. Crie um repositório vazio (sem README)
echo 3. Copie o endereço do repositório
echo.
set /p REPO_URL="Cole aqui o endereço (ex: https://github.com/seu-user/gestao-nonato-service.git): "
if "%REPO_URL%"=="" (
  echo Erro: Precisa indicar o endereço do repositório.
  pause
  exit /b 1
)
echo.
echo A configurar e enviar...
cd /d "%~dp0"
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main
git push -u origin main
if %errorlevel%==0 (
  echo.
  echo SUCESSO! O projeto foi enviado para o GitHub.
  echo.
  echo Próximo passo: abra DEPLOY-RAILWAY.md e siga a partir do passo 4.
) else (
  echo.
  echo Falha no envio. Se pedir login:
  echo - Use o seu nome de utilizador do GitHub
  echo - Em vez da password, use um Personal Access Token
  echo   (GitHub - Settings - Developer settings - Personal access tokens)
)
echo.
pause
