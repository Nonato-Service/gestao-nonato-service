@echo off



chcp 65001 >nul



title NONATO - Testar paginacao HOMAG



cd /d "%~dp0"







echo.



echo  TESTAR PAGINACAO HOMAG (descobre botao Next)



echo  =============================================



echo.



echo  LOGIN: NAO e obrigatorio



echo  1. Abre Chromium na lista de spare parts



echo  2. Aguarda carregar (ou prima ENTER se quiser pausar)



echo  3. Veja no terminal os botoes "Next" encontrados



echo.



set HOMAG_MANUAL=1



call npm run homag:import:probe







pause

