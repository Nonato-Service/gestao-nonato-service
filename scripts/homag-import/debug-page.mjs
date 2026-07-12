#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { discoverHomagProducts } from './discover-products.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.goto(cfg.startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
await page.waitForTimeout(12000)

const report = await page.evaluate(() => {
  function deepQueryAll(selector) {
    const out = []
    const seen = new Set()
    function walk(root) {
      if (!root || seen.has(root)) return
      seen.add(root)
      try {
        root.querySelectorAll(selector).forEach((el) => out.push(el))
      } catch {
        /* ignore */
      }
      root.querySelectorAll?.('*')?.forEach?.((el) => {
        if (el.shadowRoot) walk(el.shadowRoot)
      })
    }
    walk(document)
    return out
  }

  const bodyText = document.body?.innerText?.slice(0, 500) || ''
  const codes = [...(document.body?.innerText?.matchAll(/\b(\d{10})\b/g) || [])].map((m) => m[1]).slice(0, 5)
  return {
    title: document.title,
    url: location.href,
    bodyPreview: bodyText,
    sampleCodes: codes,
    tiles: document.querySelectorAll('commerce_product-tile').length,
    tilesDeep: deepQueryAll('commerce_product-tile').length,
    imgs: document.querySelectorAll('img').length,
  }
})

const dom = await discoverHomagProducts(page)
console.log(JSON.stringify({ report, domCount: dom.length, domSample: dom.slice(0, 3) }, null, 2))
await browser.close()
