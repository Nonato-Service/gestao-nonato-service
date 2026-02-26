@echo off
echo Limpando cache do Next.js (.next)...
if exist ".next" (
  rmdir /s /q ".next"
  echo Pasta .next removida.
) else (
  echo Pasta .next nao encontrada.
)
echo.
echo Iniciando servidor...
call npm run dev
