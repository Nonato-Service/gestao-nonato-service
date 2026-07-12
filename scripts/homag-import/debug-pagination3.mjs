#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { discoverHomagProducts } from './discover-products.mjs'
import { goToNextHomagPage } from './pagination.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
await page.goto(cfg.startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
await page.waitForTimeout(15000)

const getDomCount = async () => (await discoverHomagProducts(page)).length
getDomCount.firstCode = async () => (await discoverHomagProducts(page))[0]?.codigo || ''

const before = await discoverHomagProducts(page)
const rangeBefore = await page.evaluate(() => (document.body.innerText.match(/\d+\s*-\s*\d+\s+of\s+\d+\s+Items/i) || [])[0] || '')
const ok = await goToNextHomagPage(page, cfg, cfg.list.itemSelector, getDomCount)
await page.waitForTimeout(5000)
const after = await discoverHomagProducts(page)
const rangeAfter = await page.evaluate(() => (document.body.innerText.match(/\d+\s*-\s*\d+\s+of\s+\d+\s+Items/i) || [])[0] || '')

console.log(JSON.stringify({
  ok,
  rangeBefore,
  rangeAfter,
  before: before.length,
  after: after.length,
  firstBefore: before[0]?.codigo,
  firstAfter: after[0]?.codigo,
  newCodes: after.filter((x) => !before.some((b) => b.codigo === x.codigo)).length,
}, null, 2))
await browser.close()
