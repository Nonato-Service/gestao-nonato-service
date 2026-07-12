@echo off
rem Liberta portas 3000-3003 (evita Next.js saltar para 3001)
for %%P in (3000 3001 3002 3003) do (
  for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%%P" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
  )
)
timeout /t 2 /nobreak >nul
