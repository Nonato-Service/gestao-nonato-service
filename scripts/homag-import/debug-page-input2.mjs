#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { dismissCookieBanner, waitForHomagRange, getCurrentHomagPage } from './pagination.mjs'
import { discoverHomagProducts } from './discover-products.mjs'

const target = parseInt(process.argv[2] || '250', 10)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
await page.goto(cfg.startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
await dismissCookieBanner(page)
await waitForHomagRange(page, 90000)
await page.waitForTimeout(5000)

const before = await getCurrentHomagPage(page)

const info = await page.evaluate(() => {
  function walk(root, fn) {
    fn(root)
    root.querySelectorAll?.('*')?.forEach?.((el) => {
      if (el.shadowRoot) walk(el.shadowRoot, fn)
    })
  }
  const inputs = []
  walk(document, (root) => {
    root.querySelectorAll?.('input, lightning-input')?.forEach?.((el) => {
      const r = el.getBoundingClientRect?.()
      if (r && r.width < 15) return
      const tag = el.tagName
      const type = el.type || el.getAttribute('type') || ''
      const ph = el.placeholder || el.getAttribute('placeholder') || ''
      const aria = el.getAttribute('aria-label') || ''
      const val = el.value || ''
      if (tag === 'LIGHTNING-INPUT' || type === 'number' || type === 'text' || /page/i.test(ph + aria)) {
        inputs.push({ tag, type, ph: ph.slice(0, 40), aria: aria.slice(0, 40), val, w: r?.width })
      }
    })
  })
  return inputs
})
console.log('inputs found', JSON.stringify(info, null, 2))

// Playwright: try all inputs except search
for (const sel of ['input[type="text"]', 'input[type="number"]', 'input:not([type="search"])']) {
  const loc = page.locator(sel)
  const n = await loc.count()
  for (let i = 0; i < n; i++) {
    const inp = loc.nth(i)
    const ph = ((await inp.getAttribute('placeholder').catch(() => '')) || '').toLowerCase()
    if (/keyword|product id|search/.test(ph)) continue
    try {
      await inp.scrollIntoViewIfNeeded()
      await inp.click({ timeout: 3000 })
      await inp.fill(String(target))
      await page.keyboard.press('Enter')
      await page.waitForTimeout(8000)
      const after = await getCurrentHomagPage(page)
      const range = await page.evaluate(
        () => (document.body.innerText.match(/\d+\s*-\s*\d+\s+of\s+\d+\s+Items/i) || [])[0] || ''
      )
      const dom = await discoverHomagProducts(page)
      console.log('TRY', { sel, i, ph, before, after, range, count: dom.length, first: dom[0]?.codigo })
      if (after > before + 5) break
    } catch (e) {
      console.log('skip', i, e.message?.slice(0, 60))
    }
  }
}

await browser.close()
