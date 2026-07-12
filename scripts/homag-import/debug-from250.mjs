#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { dismissCookieBanner, jumpToHomagPage, waitForHomagRange, goToNextHomagPage } from './pagination.mjs'
import { discoverHomagProducts } from './discover-products.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))

async function getRange(page) {
  return page.evaluate(() => {
    const re = /\d+\s*-\s*\d+\s+of\s+\d+\s+Items/gi
    const all = document.body.innerText.match(re) || []
    return all.length ? all[all.length - 1] : ''
  })
}

/** Estratégia tile visível — só elementos no viewport */
async function discoverFromTiles(page) {
  return page.evaluate(() => {
    function walk(root, fn) {
      fn(root)
      root.querySelectorAll?.('*')?.forEach?.((el) => {
        if (el.shadowRoot) walk(el.shadowRoot, fn)
      })
    }
    const items = []
    const seen = new Set()
    walk(document, (root) => {
      for (const sel of ['commerce_product-tile', 'commerce-product-tile', '[data-product-code]', 'c-product-tile']) {
        root.querySelectorAll?.(sel)?.forEach?.((el) => {
          const r = el.getBoundingClientRect?.()
          if (!r || r.width < 20 || r.height < 20) return
          if (r.bottom < -50 || r.top > window.innerHeight + 100) return
          const t = el.textContent || ''
          if (t.length > 800) return
          const m = t.match(/\b([1-9]\d{9})\b/)
          if (!m || seen.has(m[1])) return
          seen.add(m[1])
          items.push(m[1])
        })
      }
    })
    items.sort((a, b) => {
      /* keep DOM order via re-query */
      return 0
    })
    return items.slice(0, 25)
  })
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
await page.goto(cfg.startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
await dismissCookieBanner(page)
await waitForHomagRange(page, 90000)
await jumpToHomagPage(page, 250, { fast: true, sync: true })
await page.waitForTimeout(3000)

const rows = []
for (let i = 0; i < 8; i++) {
  const range = await getRange(page)
  const dom = await discoverHomagProducts(page)
  const tiles = await discoverFromTiles(page)
  rows.push({
    i,
    range,
    domFirst: dom[0]?.codigo,
    domN: dom.length,
    tiles: tiles.slice(0, 4),
    tileN: tiles.length,
  })
  if (i < 7) {
    await goToNextHomagPage(page, cfg, cfg.list?.itemSelector || '')
    await page.waitForTimeout(2000)
  }
}
console.log(JSON.stringify(rows, null, 2))
await browser.close()
