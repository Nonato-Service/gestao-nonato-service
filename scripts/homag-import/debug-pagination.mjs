#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { discoverHomagProducts } from './discover-products.mjs'
import { goToNextHomagPage, probePaginationCandidates } from './pagination.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.goto(cfg.startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
await page.waitForTimeout(15000)

const before = await discoverHomagProducts(page)
const pag = await probePaginationCandidates(page)
const advanced = await goToNextHomagPage(page, cfg, cfg.list.itemSelector, async () => (await discoverHomagProducts(page)).length)
await page.waitForTimeout(5000)
const after = await discoverHomagProducts(page)

console.log(JSON.stringify({
  before: before.length,
  after: after.length,
  advanced,
  pagination: pag,
  url: page.url(),
  range: await page.evaluate(() => (document.body.innerText.match(/\d+\s*-\s*\d+\s+of\s+\d+\s+Items/i) || [])[0] || ''),
  newCodes: after.filter((x) => !before.some((b) => b.codigo === x.codigo)).slice(0, 5).map((x) => x.codigo),
}, null, 2))
await browser.close()
