#!/usr/bin/env node
/** Compara total HOMAG vs buckets vs biblioteca local. */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { dismissCookieBanner, waitForHomagRange } from './pagination.mjs'
import { captureAuraSession } from './api-products.mjs'
import { buildSearchBuckets, fetchAllBucketProducts, auraSearch, baseInput } from './api-import.mjs'

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

const bibPath = path.join(root, 'data', 'nonato-pecas-biblioteca.json')
const localCount = fs.existsSync(bibPath)
  ? JSON.parse(fs.readFileSync(bibPath, 'utf8')).length
  : 0

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

const rootBuckets = await buildSearchBuckets(context, session, rootId, '')
let allBuckets = [...rootBuckets]
for (const sub of subs) {
  const subBuckets = await buildSearchBuckets(context, session, sub.id, '')
  allBuckets.push(...subBuckets)
}

const seen = new Set()
const uniqueBuckets = []
for (const b of allBuckets) {
  const k = `${b.categoryId}|${b.searchTerm}`
  if (seen.has(k)) continue
  seen.add(k)
  uniqueBuckets.push(b)
}

console.log('')
console.log('=== Auditoria catálogo HOMAG ===')
console.log(`Total reportado pela HOMAG (categoria raiz): ${first.total}`)
console.log(`Subcategorias: ${subs.length} (soma counts: ${subs.reduce((s, x) => s + x.count, 0)})`)
console.log(`Buckets únicos (raiz + subs): ${uniqueBuckets.length}`)
console.log(`Soma totals dos buckets: ${uniqueBuckets.reduce((s, b) => s + b.total, 0)}`)
console.log(`Peças na biblioteca local: ${localCount}`)
console.log('')

if (process.env.HOMAG_AUDIT_FETCH === '1') {
  console.log('A buscar TODOS os buckets (demora 1-3 horas)…')
  const codigos = new Set()
  for (let i = 0; i < uniqueBuckets.length; i++) {
    const b = uniqueBuckets[i]
    const label = b.searchTerm ? `"${b.searchTerm}"` : '(todos)'
    const prods = await fetchAllBucketProducts(context, session, b, async (pg, pgTotal) => {
      if (pg % 50 === 0 || pg === pgTotal) {
        process.stdout.write(`\r  bucket ${i + 1}/${uniqueBuckets.length} ${label} pág.${pg}/${pgTotal} unique ${codigos.size}   `)
      }
    })
    for (const p of prods) if (p.codigo) codigos.add(p.codigo)
    console.log(`\n  bucket ${i + 1}/${uniqueBuckets.length} ${label} — got ${prods.length}, unique total ${codigos.size}`)
  }
  console.log(`\nCódigos únicos API (amostra completa): ${codigos.size}`)
  console.log(`Em falta vs HOMAG total: ${Math.max(0, first.total - codigos.size)}`)
}

await browser.close()
