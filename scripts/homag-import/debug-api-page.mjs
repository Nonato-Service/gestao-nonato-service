#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { dismissCookieBanner, waitForHomagRange } from './pagination.mjs'
import { fetchHomagProductsViaApi, captureAuraSession, parseHomagAuraProducts } from './api-products.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext()
const page = await context.newPage()
await page.goto(cfg.startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
await dismissCookieBanner(page)
await waitForHomagRange(page, 90000)
await page.waitForTimeout(5000)

const session = await captureAuraSession(page, cfg.startUrl)
for (const pg of [1, 300, 800, 1536]) {
  const res = await fetchHomagProductsViaApi(context, session, pg)
  console.log(
    `pág.${pg} → ${res.products.length} produtos, total=${res.total}, 1º=${res.products[0]?.codigo}`
  )
}
await browser.close()
