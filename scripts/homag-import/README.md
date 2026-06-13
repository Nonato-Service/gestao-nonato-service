# Importação HOMAG eShop → Biblioteca de Peças

A loja [HOMAG eShop](https://shop.homag.com/s/category/spare-parts/0ZG0900000059puGAA?language=en_US) **não devolve a lista de peças num ficheiro JSON** quando cola o link no programa. O site é **Salesforce Commerce** (JavaScript): os produtos só aparecem **depois do login** no browser.

Por isso **copiar/colar texto** funciona parcialmente (código + nome), mas **não traz fotos nem todos os campos** de forma fiável.

## Solução recomendada (com imagens)

### 1. Preparar (uma vez)

Na pasta do projeto `gestao-tecnica-nonato-service`:

```powershell
npm install
npx playwright install chromium
copy scripts\homag-import\config.example.json scripts\homag-import\config.json
```

Edite `config.json` se a sua categoria for outra URL.

### 2. Importar da HOMAG

```powershell
$env:HOMAG_MANUAL="1"
$env:HOMAG_HEADLESS="0"
npm run homag:import
```

1. Abre o Chromium.
2. Faça **login** na HOMAG.
3. Navegue até à categoria de peças (spare parts).
4. Volte ao terminal e prima **Enter**.
5. O script grava `scripts/homag-import/out/export.json` e imagens em `out/images/`.

Modo interativo (escolher linha a linha):

```powershell
$env:HOMAG_MANUAL="1"
$env:HOMAG_INTERACTIVE="1"
npm run homag:import
```

### 3. Carregar no programa

1. **Biblioteca de Peças** → **Importação de Peças**
2. **Carregar ficheiro** → escolha `scripts/homag-import/out/export.json`
3. Confirme a pré-visualização → **Adicionar à Biblioteca**

---

## Se o script disser «0 linhas»

Os seletores CSS podem ter mudado. Descubra os corretos:

```powershell
$env:HOMAG_MANUAL="1"
npm run homag:import:probe
```

Copie os seletores sugeridos para `config.json` → `list.itemSelector`, etc.

---

## Alternativa: copiar JSON da rede (sem Playwright)

1. Na HOMAG, com login, abra **F12** → separador **Network**.
2. Recarregue a lista de peças.
3. Filtre por **Fetch/XHR** e procure pedidos com `product`, `search` ou `commerce`.
4. Abra a resposta em **JSON**, copie o conteúdo.
5. No programa: **Importação** → cole no campo de texto → **Importar catálogo colado**.

---

## O que não funciona na HOMAG

| Método | Resultado |
|--------|-----------|
| **Buscar da URL** na app | Só HTML vazio (sem lista) |
| Colar só texto | Código/nome, **sem fotos** |
| **homag:import** + export.json | **Completo** (código, nome, imagem) |

URL base para imagens relativas na colagem manual: `https://shop.homag.com`
