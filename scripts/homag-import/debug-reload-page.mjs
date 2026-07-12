#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { dismissCookieBanner, waitForHomagRange, installHomagPaginationGuard, forceHomagGridAtPage } from './pagination.mjs'
import { discoverHomagProducts } from './discover-products.mjs'

const target = parseInt(process.argv[2] || '400', 10)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
await installHomagPaginationGuard(context)
const page = await context.newPage()
await page.goto(cfg.startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
await dismissCookieBanner(page)
await waitForHomagRange(page, 90000)

const rec = await forceHomagGridAtPage(page, target, cfg.startUrl, { allowReload: true })
const dom = await discoverHomagProducts(page)
console.log(JSON.stringify({ target, at: rec.at, first: dom[0]?.codigo, codes: dom.map((d) => d.codigo).slice(0, 8) }, null, 2))
await browser.close()
