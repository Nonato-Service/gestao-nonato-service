@echo off



chcp 65001 >nul



title NONATO - Ligar codigos HOMAG (maq. antiga + maq. nova)



cd /d "%~dp0"



echo.



echo  Liga codigos de maquina ANTIGA e maquina NOVA (mesma peca).



echo  OS DOIS CODIGOS FICAM — nada e removido do catalogo.



echo.



echo  Para mapeamentos manuais reais, edite:



echo    data\homag-substituicoes-manuais.json



echo.



echo  Formato (exemplo de estrutura — NAO usar codigos ficticios):



echo    codigoMaquinaAntiga / referenciaMaquinaAntiga



echo    codigoMaquinaNova   / referenciaMaquinaNova



echo.



node --experimental-strip-types scripts/homag-import/aplicar-substituicoes-homag.mjs



echo.



pause

