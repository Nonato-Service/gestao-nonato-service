#!/usr/bin/env node
import fs from 'fs'
import { chromium } from 'playwright'
import { dismissCookieBanner, waitForHomagRange } from './pagination.mjs'
import { captureAuraSession, parseHomagAuraProducts } from './api-products.mjs'

const cfg = JSON.parse(fs.readFileSync('config.json', 'utf8'))
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext()
const page = await context.newPage()
await page.goto(cfg.startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
await dismissCookieBanner(page)
await waitForHomagRange(page, 90000)
const session = await captureAuraSession(page, cfg.startUrl)

async function fetch(searchInput) {
  const message = {
    actions: [{
      id: '1;a',
      descriptor: 'aura://ApexActionController/ACTION$execute',
      callingDescriptor: 'UNKNOWN',
      params: {
        namespace: 'commerce',
        classname: 'SearchController',
        method: 'searchProducts',
        params: { webstoreId: session.webstoreId, effectiveAccountId: null, searchInput },
        cacheable: false,
        isContinuation: false,
      },
    }],
  }
  const body = new URLSearchParams({
    message: JSON.stringify(message),
    'aura.context': session.auraContext,
    'aura.pageURI': session.pageURI,
    'aura.token': 'undefined',
  })
  const res = await context.request.post(
    'https://shop.homag.com/s/sfsites/aura?aura.ApexAction.execute=1',
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: `https://shop.homag.com${session.pageURI}` },
      data: body.toString(),
    }
  )
  return parseHomagAuraProducts(await res.text())
}

const base = { ...session.searchInputTemplate, refinements: [], includeQuantityRule: true, includePrices: false }

// subcategory DIN 3627
const sub = await fetch({ ...base, categoryId: '0ZG090000005AhmGAE', searchTerm: '', page: 50 })
console.log('subcat DIN p50', sub.products.length, sub.total, sub.products[0]?.codigo)

for (const term of ['2', '22', '220', '2201', '']) {
  const r = await fetch({ ...base, categoryId: session.categoryId, searchTerm: term, page: 0 })
  console.log('term', JSON.stringify(term), 'total', r.total, 'first', r.products[0]?.codigo)
}

// facet refinement Technology CNC
const ref = await fetch({
  ...base,
  categoryId: session.categoryId,
  searchTerm: '',
  page: 0,
  refinements: [{ nameOrId: 'Technology__c', type: 'DistinctValue', values: [{ nameOrId: 'CNC and Drilling' }] }],
})
console.log('facet CNC', ref.products.length, ref.total, ref.products[0]?.codigo)

// page 249 main cat
const p249 = await fetch({ ...base, categoryId: session.categoryId, searchTerm: '', page: 249 })
console.log('main p249', p249.products.length, p249.total, p249.products[0]?.codigo)

await browser.close()
