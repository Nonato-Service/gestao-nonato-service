@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo === Deploy: reorganizacao do Administrador ===
echo.

git status --short
echo.

git add app/page.tsx app/components/admin/
git commit -m "Reorganizar painel Administrador em componentes dedicados." -m "Extrai seccoes para app/components/admin/ e unifica aba full e modal compact."

if errorlevel 1 (
  echo.
  echo Commit falhou ou nada novo para enviar. A tentar push mesmo assim...
  echo.
)

git push origin main

if errorlevel 1 (
  echo.
  echo ERRO no push. Verifique internet e credenciais GitHub.
  pause
  exit /b 1
)

echo.
echo OK — push feito. O Railway faz deploy automaticamente em 1-3 minutos.
echo Site: https://gest-o-nonato-gestao.up.railway.app
echo.
pause
