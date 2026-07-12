#!/usr/bin/env node
/** Testa preencher campo «ir para página» se existir */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { dismissCookieBanner, waitForHomagRange } from './pagination.mjs'
import { discoverHomagProducts } from './discover-products.mjs'

const target = parseInt(process.argv[2] || '250', 10)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))

const browser = await chromium.launch({ headless: false })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
await page.goto(cfg.startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
await dismissCookieBanner(page)
await waitForHomagRange(page, 90000)
await page.waitForTimeout(5000)

const found = await page.evaluate((n) => {
  function walk(root, fn) {
    fn(root)
    root.querySelectorAll?.('*')?.forEach?.((el) => {
      if (el.shadowRoot) walk(el.shadowRoot, fn)
    })
  }
  const inputs = []
  walk(document, (root) => {
    root.querySelectorAll?.('input')?.forEach?.((inp) => {
      const r = inp.getBoundingClientRect()
      if (r.width < 20) return
      const ph = (inp.placeholder || inp.getAttribute('aria-label') || '').toLowerCase()
      if (/page|página|go to|jump|number|keyword|search|product id/.test(ph)) {
        inputs.push({ ph, type: inp.type, id: inp.id })
      }
    })
  })
  return inputs
}, target)

console.log('inputs', found)

// Try spinbutton or number input near paging
for (const sel of [
  'input[type="number"]',
  'input[inputmode="numeric"]',
  'input[aria-label*="page" i]',
  'input[placeholder*="page" i]',
]) {
  const loc = page.locator(sel)
  const c = await loc.count()
  if (c > 0) {
    console.log('try', sel, c)
    try {
      await loc.first().fill(String(target))
      await page.keyboard.press('Enter')
      await page.waitForTimeout(8000)
      const range = await page.evaluate(
        () => (document.body.innerText.match(/\d+\s*-\s*\d+\s+of\s+\d+\s+Items/i) || [])[0] || ''
      )
      const dom = await discoverHomagProducts(page)
      console.log({ sel, range, count: dom.length, first: dom[0]?.codigo })
    } catch (e) {
      console.log('fail', sel, e.message)
    }
  }
}

await page.waitForTimeout(5000)
await browser.close()
