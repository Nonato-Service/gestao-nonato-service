# Biblioteca técnica (cópia da Bíblia — HTML estático)

Esta pasta é uma **cópia de trabalho** do projeto `biblia-nonato-service`, com **base de dados IndexedDB separada**, para não interferir com o original.

## Primeiro uso

**Opção A — só abrir com a estrutura de pastas habitual**  
Se `biblia-nonato-service` e `gestao-tecnica-nonato-service` estiverem na **mesma pasta pai** (por exemplo ambos em `C:\Users\W10\`), o ficheiro `css/style.css` desta cópia usa `@import` para o CSS da Bíblia original. Não precisa de copiar o CSS.

**Opção B — pasta portável ou sem o original ao lado**  
Execute **`instalar-copia.bat`** (duplo clique). Ele copia `css` completo, `js/start-info.js`, `assets` (se existirem) e gera `js/app.js` a partir do original com a chave do hero da gestão. **Não** sobrescreve `js/db.js`, `manifest.json` nem `service-worker.js` desta pasta.

Ajuste a variável `ORI=` no `.bat` se a sua Bíblia original estiver noutro caminho.

Abra **`index.html`** no browser ou use `iniciar-servidor.bat` (copiado pelo `.bat` se existir no original).

## O que já vem pronto nesta pasta

- `index.html` — título “Gestão técnica” e textos ajustados  
- `js/db.js` — nome da base **`GestaoBibliaNonatoSite`** (dados distintos da Bíblia original)  
- `js/app.js` — chave localStorage do hero **`gestao.biblia.heroDismissed`**  
- `js/start-info.js` — textos da secção informativa (igual ao original; pode editar)  
- `instalar-copia.bat` — cópia fiável de CSS/assets/app a partir do original  

## Original intacto

Nada é alterado em `biblia-nonato-service` por este fluxo.
