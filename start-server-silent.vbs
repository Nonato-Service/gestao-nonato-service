' Script VBS para iniciar o servidor Next.js silenciosamente em segundo plano
' Este script mantém o servidor rodando mesmo após o login

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Obtém o diretório do script
scriptPath = fso.GetParentFolderName(WScript.ScriptFullName)

' Muda para o diretório do projeto
WshShell.CurrentDirectory = scriptPath

' Executa o comando npm run dev em uma janela minimizada
' WindowStyle 7 = Minimizado e não focado
WshShell.Run "cmd /c ""cd /d """ & scriptPath & """ && npm run dev""", 7, False

' Aguarda um pouco para garantir que iniciou
WScript.Sleep 3000
