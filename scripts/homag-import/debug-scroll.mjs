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
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await page.waitForTimeout(3000)

const pag = await page.evaluate(() => {
  function walk(root, fn) {
    fn(root)
    root.querySelectorAll?.('*')?.forEach?.((el) => {
      if (el.shadowRoot) walk(el.shadowRoot, fn)
    })
  }
  const out = []
  walk(document, (root) => {
    root.querySelectorAll?.('button, a, [role="button"], lightning-button, svg')?.forEach?.((el) => {
      const label = [el.getAttribute('aria-label'), el.getAttribute('title'), el.textContent?.trim(), el.getAttribute('data-testid')]
        .filter(Boolean)
        .join(' | ')
      if (/next|weiter|chevron|arrow|›|»|right|forward|page 2|load more/i.test(label)) {
        out.push(label.slice(0, 100))
      }
    })
  })
  return out
})

const before = (await discoverHomagProducts(page)).length
await page.mouse.wheel(0, 5000)
await page.waitForTimeout(5000)
const after = (await discoverHomagProducts(page)).length
console.log(JSON.stringify({ pag, before, after }, null, 2))
await browser.close()
