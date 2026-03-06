@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo   ATUALIZAR DEPLOY (Git + Railway)
echo ============================================
echo.

:: Verificar se existe repositório git
git rev-parse --is-inside-work-tree >nul 2>&1
if %errorlevel% neq 0 (
  echo ERRO: Esta pasta não é um repositório Git.
  echo Execute primeiro ENVIAR-PARA-GITHUB.bat para configurar.
  pause
  exit /b 1
)

:: Mensagem de commit: pode passar como argumento (ex: ATUALIZAR-DEPLOY.bat "Correção X")
set MSG=%~1
if "%MSG%"=="" set MSG=Atualização

echo 1. A adicionar ficheiros...
git add .
if %errorlevel% neq 0 (
  echo Erro ao fazer git add.
  pause
  exit /b 1
)

echo 2. A gravar alterações: "%MSG%"
git commit -m "%MSG%"
if %errorlevel% neq 0 (
  echo Nenhuma alteração para gravar, ou erro no commit.
  echo Se não há mudanças, está tudo em dia.
  pause
  exit /b 0
)

echo 3. A enviar para o GitHub...
git push
if %errorlevel%==0 (
  echo.
  echo ============================================
  echo   SUCESSO
  echo ============================================
  echo O Railway vai atualizar o deploy em 2-5 min.
  echo Consulte o painel do Railway para ver o progresso.
) else (
  echo.
  echo Falha no push. Se pedir autenticação:
  echo - Username: o seu utilizador GitHub
  echo - Password: use um Personal Access Token
  echo   (GitHub ^> Settings ^> Developer settings ^> Personal access tokens)
)
echo.
pause
