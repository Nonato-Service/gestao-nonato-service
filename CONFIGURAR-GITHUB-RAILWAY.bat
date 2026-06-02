@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo   LIGAR PROJETO AO GITHUB DO RAILWAY
echo ============================================
echo.
echo Repositorio Railway: Nonato-Service/gestao-nonato-service
echo.

git remote remove origin 2>nul
git remote add origin https://github.com/Nonato-Service/gestao-nonato-service.git

echo Remote configurado:
git remote -v
echo.
echo A enviar para o GitHub...
git push -u origin main

if %errorlevel%==0 (
  echo.
  echo SUCESSO! O Railway vai fazer deploy em 2-5 minutos.
  echo No telemovel: feche o separador e abra de novo o site.
) else (
  echo.
  echo Falha no push. Use Personal Access Token como password.
  echo GitHub - Settings - Developer settings - Personal access tokens
)

pause
