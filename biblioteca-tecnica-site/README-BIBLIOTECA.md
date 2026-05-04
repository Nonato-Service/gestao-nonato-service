# Biblioteca técnica (cópia do app HTML estático)

Esta pasta é uma **cópia de trabalho** do projeto HTML original, com **base de dados IndexedDB separada**, para não misturar dados com o app de referência.

## Configurar o caminho do projeto original (obrigatório para copiar ficheiros)

1. Copie **`config-origem-copia.example.json`** para **`config-origem-copia.json`** (mesma pasta).
2. Edite **`raizProjetoOriginal`**: pode ser **qualquer nome de pasta** — relativo à raiz do repo `gestao-tecnica-nonato-service` (ex.: `../MinhaPastaSozinha`) ou **caminho absoluto** (ex.: `D:\apps\meu-site-original`). Tem de ser a pasta onde existe **`css/style.css`**.

O ficheiro `config-origem-copia.json` está no `.gitignore` para não ir para o Git com caminhos da sua máquina.

## Primeiro uso

O ficheiro **`css/style.css`** desta pasta já pode trazer o **CSS completo** (portável, sem `@import` para fora). Pode abrir **`index.html`** em qualquer sítio.

**Quando atualizar o visual no app de referência**, sincronize o CSS desta pasta de uma destas formas:

1. Na raiz de `gestao-tecnica-nonato-service`: **`npm run biblio:css-portavel`**, ou **`copiar-css-portavel.bat`** (usa o mesmo JSON).
2. Ou **`instalar-copia.bat`**: copia `css` completo, `js/start-info.js`, `assets` (se existirem) e gera `js/app.js` a partir do original com a chave do hero da gestão. **Não** sobrescreve `js/db.js`, `manifest.json` nem `service-worker.js` desta pasta.

Abra **`index.html`** no browser ou use `iniciar-servidor.bat` (copiado pelo `.bat` se existir no original).

## O que já vem pronto nesta pasta

- `index.html` — título “Gestão técnica” e textos ajustados  
- `js/db.js` — nome da base **`GestaoBibliaNonatoSite`** (dados distintos da Bíblia original)  
- `js/app.js` — chave localStorage do hero **`gestao.biblia.heroDismissed`**  
- `js/start-info.js` — textos da secção informativa (igual ao original; pode editar)  
- `instalar-copia.bat` / `carregar-origem.bat` — leem `config-origem-copia.json`  
- `copy-css.mjs` / `copiar-css-portavel.bat` — só CSS portável (Node ou `copy`)  

## Original intacto

Nada é alterado na pasta indicada em `raizProjetoOriginal` por este fluxo.
