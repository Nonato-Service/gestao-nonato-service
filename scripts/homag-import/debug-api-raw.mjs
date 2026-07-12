#!/usr/bin/env node
import fs from 'fs'
import { chromium } from 'playwright'
import { dismissCookieBanner, waitForHomagRange } from './pagination.mjs'
import { captureAuraSession } from './api-products.mjs'

const cfg = JSON.parse(fs.readFileSync('config.json', 'utf8'))
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext()
const page = await context.newPage()
await page.goto(cfg.startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
await dismissCookieBanner(page)
await waitForHomagRange(page, 90000)
const session = await captureAuraSession(page, cfg.startUrl)

async function rawPage(pageIndex) {
  const message = {
    actions: [{
      id: '1;a',
      descriptor: 'aura://ApexActionController/ACTION$execute',
      callingDescriptor: 'UNKNOWN',
      params: {
        namespace: 'commerce',
        classname: 'SearchController',
        method: 'searchProducts',
        params: {
          webstoreId: session.webstoreId,
          effectiveAccountId: null,
          searchInput: {
            ...session.searchInputTemplate,
            categoryId: session.categoryId,
            page: pageIndex,
          },
        },
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
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Referer: `https://shop.homag.com${session.pageURI}`,
      },
      data: body.toString(),
    }
  )
  const text = await res.text()
  fs.writeFileSync(`out/api-page-${pageIndex}.json`, text)
  console.log('pageIndex', pageIndex, 'status', res.status(), 'len', text.length)
  try {
    const j = JSON.parse(text)
    const act = j.actions?.[0]
    console.log('state', act?.state, 'error', act?.error, 'keys', Object.keys(act?.returnValue || {}))
    const pp = act?.returnValue?.returnValue?.productsPage
    console.log('products', pp?.products?.length, 'total', pp?.total, 'first', pp?.products?.[0]?.fields?.StockKeepingUnit?.value)
  } catch (e) {
    console.log('parse err', text.slice(0, 300))
  }
}

for (const idx of [0, 1, 2, 299, 1535]) {
  await rawPage(idx)
}
await browser.close()
