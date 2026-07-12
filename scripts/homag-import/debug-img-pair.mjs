#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
await page.goto(cfg.startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
await page.waitForTimeout(15000)

const pairs = await page.evaluate(() => {
  function walk(root, fn) {
    fn(root)
    root.querySelectorAll?.('*')?.forEach?.((el) => {
      if (el.shadowRoot) walk(el.shadowRoot, fn)
    })
  }
  const items = []
  walk(document, (root) => {
    root.querySelectorAll?.('a, li, article, div, tr')?.forEach?.((el) => {
      const text = el.textContent || ''
      const m = text.match(/\b([1-9]\d{9})\b/)
      if (!m) return
      const img = el.querySelector('img[src*="cms"], img[src*="media"]')
      if (!img) return
      const src = img.getAttribute('src') || ''
      if (items.some((x) => x.codigo === m[1])) return
      items.push({ codigo: m[1], img: src.slice(0, 100) })
    })
  })
  return items.slice(0, 8)
})
console.log(JSON.stringify(pairs, null, 2))
await browser.close()
