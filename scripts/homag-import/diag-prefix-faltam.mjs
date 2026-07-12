#!/usr/bin/env node
/** Diagnóstico rápido: quantas peças faltam por bucket raiz (só pág.0). */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { dismissCookieBanner, waitForHomagRange } from './pagination.mjs'
import { captureAuraSession } from './api-products.mjs'
import { buildSearchBuckets, fetchBucketPage, auraSearch, baseInput } from './api-import.mjs'
import { normCodigo } from './resume.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..', '..')
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))
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
const rootBuckets = await buildSearchBuckets(context, session, rootId, '')

console.log(`\nLocal: ${local.size} | HOMAG total: ${first.total} | Buckets raiz: ${rootBuckets.length}\n`)
console.log('Bucket raiz          API total   amostra pág.1   faltam na amostra')
console.log('-------------------  ---------   -------------   ------------------')

let sumTotal = 0
let sumMissingSample = 0
for (const b of rootBuckets.sort((a, z) => String(a.searchTerm).localeCompare(String(z.searchTerm)))) {
  const label = (b.searchTerm || '(todos)').padEnd(18)
  const prods = await fetchBucketPage(context, session, b, 0)
  const missing = prods.filter((p) => !local.has(normCodigo(p.codigo))).length
  sumTotal += b.total
  sumMissingSample += missing
  console.log(`${label}  ${String(b.total).padStart(9)}   ${String(prods.length).padStart(13)}   ${missing}`)
}

console.log(`\nSoma totals buckets raiz: ${sumTotal}`)
console.log(`Faltam na amostra (só 1ª pág. de cada bucket): ${sumMissingSample}`)
await browser.close()
