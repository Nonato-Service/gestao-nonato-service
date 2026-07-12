#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { dismissCookieBanner, jumpToHomagPage, waitForHomagRange, goToNextHomagPage } from './pagination.mjs'
import { discoverHomagProducts } from './discover-products.mjs'

const startPage = parseInt(process.argv[2] || '256', 10)
const steps = parseInt(process.argv[3] || '3', 10)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
await page.goto(cfg.startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
await dismissCookieBanner(page)
await waitForHomagRange(page, 90000)
await page.waitForTimeout(3000)
await jumpToHomagPage(page, startPage)
await page.waitForTimeout(3000)

const rows = []
for (let i = 0; i < steps; i++) {
  const range = await page.evaluate(() => {
    const re = /\d+\s*-\s*\d+\s+of\s+\d+\s+Items/gi
    const all = document.body.innerText.match(re) || []
    return all.length ? all[all.length - 1] : ''
  })
  const dom = await discoverHomagProducts(page)
  const tiles = await page.evaluate(() => {
    function walk(root, fn) {
      fn(root)
      root.querySelectorAll?.('*')?.forEach?.((el) => {
        if (el.shadowRoot) walk(el.shadowRoot, fn)
      })
    }
    const codes = []
    walk(document, (root) => {
      root.querySelectorAll?.('commerce_product-tile, commerce-product-tile')?.forEach?.((tile) => {
        const r = tile.getBoundingClientRect?.()
        if (!r || r.width < 10 || r.height < 10) return
        if (r.bottom < 0 || r.top > window.innerHeight + 400) return
        const t = tile.textContent || ''
        const m = t.match(/\b([1-9]\d{9})\b/)
        if (m) codes.push(m[1])
      })
    })
    return codes.slice(0, 25)
  })
  rows.push({ range, firstDom: dom[0]?.codigo, domCount: dom.length, domCodes: dom.map((d) => d.codigo).slice(0, 5), tileCodes: tiles.slice(0, 5) })
  if (i < steps - 1) {
    await goToNextHomagPage(page, cfg, cfg.list?.itemSelector || '')
    await page.waitForTimeout(2500)
  }
}
console.log(JSON.stringify(rows, null, 2))
await browser.close()
