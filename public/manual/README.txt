Manual do Programa — capturas de ecrã
=====================================

O manual in-app usa capturas reais quando existem em:

  public/manual/assets/{locale}/{pageId}/01.png

Exemplo:
  public/manual/assets/pt-BR/agenda-default/01.png

Idiomas suportados: pt-BR, es, fr, it, de, en

Gerar / actualizar capturas
---------------------------
  npm run manual:capture-screenshots

Variáveis úteis:
  MANUAL_LOCALES=pt-BR,es,en
  MANUAL_CAPTURE_PASSWORD=sua_senha
  MANUAL_SKIP_BUILD=1          (servidor já a correr)
  MANUAL_HEADLESS=0            (ver o browser)

Se não existir ficheiro para uma página, o manual mostra o mockup CSS automático.
