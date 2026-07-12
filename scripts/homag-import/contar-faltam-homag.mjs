#!/usr/bin/env node
/** Quantas peças da API ainda não estão na biblioteca local? (amostra rápida) */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { dismissCookieBanner, waitForHomagRange } from './pagination.mjs'
import { captureAuraSession } from './api-products.mjs'
import {
  buildSearchBuckets,
  fetchAllBucketProducts,
  auraSearch,
  baseInput,
} from './api-import.mjs'
import { normCodigo } from './resume.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..', '..')
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))

function listSubcategories(rawCategories) {
  const out = []
  for (const ch of rawCategories?.children || []) {
    const c = ch?.category
    const count = Number(ch?.productCount) || 0
    if (c?.id && count > 0) out.push({ id: c.id, name: c.name || c.id, count })
  }
  return out
}

function dedupeBuckets(allBuckets) {
  const dedup = []
  const seen = new Set()
  for (const b of allBuckets) {
    const k = `${b.categoryId}|${b.searchTerm}`
    if (seen.has(k)) continue
    seen.add(k)
    dedup.push(b)
  }
  return dedup
}

const bibPath = path.join(root, 'data', 'nonato-pecas-biblioteca.json')
const local = new Set(
  JSON.parse(fs.readFileSync(bibPath, 'utf8')).map((p) => normCodigo(p.codigo)).filter(Boolean)
)

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext()
const page = await context.newPage()
await page.goto(cfg.startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
await dismissCookieBanner(page)
await waitForHomagRange(page, 90000)
const session = await captureAuraSession(page, cfg.startUrl)
const rootId = session.categoryId

const first = await auraSearch(context, session, { ...baseInput(session, rootId), page: 0 })
const subs = listSubcategories(first.rawCategories)

const allBuckets = []
allBuckets.push(...(await buildSearchBuckets(context, session, rootId, '')))
for (const sub of subs) {
  allBuckets.push(...(await buildSearchBuckets(context, session, sub.id, '')))
}
const buckets = dedupeBuckets(allBuckets)

console.log(`Local: ${local.size} | HOMAG reporta: ${first.total} | Buckets: ${buckets.length}`)

const apiAll = new Set()
let fetched = 0
for (let i = 0; i < buckets.length; i++) {
  const b = buckets[i]
  const label = b.searchTerm ? `"${b.searchTerm}"` : '(todos)'
  const prods = await fetchAllBucketProducts(context, session, b, async () => {})
  fetched += prods.length
  for (const p of prods) {
    const c = normCodigo(p.codigo)
    if (c) apiAll.add(c)
  }
  const missingNow = [...apiAll].filter((c) => !local.has(c)).length
  process.stdout.write(`\r  ${i + 1}/${buckets.length} ${label.padEnd(12)} API únicos ${apiAll.size}  faltam ${missingNow}   `)
}

const faltam = [...apiAll].filter((c) => !local.has(c))
const extrasLocal = [...local].filter((c) => !apiAll.has(c))
console.log(`\n\n=== Resultado ===`)
console.log(`Códigos únicos na API (todos buckets): ${apiAll.size}`)
console.log(`Na biblioteca local: ${local.size}`)
console.log(`Ainda em falta (API): ${faltam.length}`)
console.log(`Só na biblioteca local (fora dos buckets API): ${extrasLocal.length}`)
console.log(`HOMAG total UI: ${first.total} (contagem com duplicados entre categorias)`)
console.log(`Soma totals buckets (sem deduplicar): ${buckets.reduce((s, b) => s + b.total, 0)}`)
if (faltam.length > 0) {
  console.log(`Exemplos em falta: ${faltam.slice(0, 8).join(', ')}`)
}

const reportPath = path.join(root, 'data', 'homag-audit-result.json')
fs.writeFileSync(
  reportPath,
  JSON.stringify(
    {
      data: new Date().toISOString(),
      homagTotalUi: first.total,
      apiUnicos: apiAll.size,
      bibliotecaLocal: local.size,
      faltamApi: faltam.length,
      extrasLocal: extrasLocal.length,
      buckets: buckets.length,
      somaTotalsBuckets: buckets.reduce((s, b) => s + b.total, 0),
    },
    null,
    2
  ),
  'utf8'
)
console.log(`\nRelatório: ${reportPath}`)

await browser.close()
