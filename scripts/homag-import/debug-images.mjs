#!/usr/bin/env node
/** Testa imagens e URL de paginação directa na HOMAG */
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

const imgs = await page.evaluate(() => {
  function walk(root, fn) {
    fn(root)
    root.querySelectorAll?.('*')?.forEach?.((el) => {
      if (el.shadowRoot) walk(el.shadowRoot, fn)
    })
  }
  const out = []
  walk(document, (root) => {
    root.querySelectorAll?.('img[src]')?.forEach?.((img) => {
      const src = img.getAttribute('src') || ''
      if (/product|cms|thumb|image|media/i.test(src)) {
        out.push({ src: src.slice(0, 120), alt: (img.alt || '').slice(0, 40) })
      }
    })
  })
  return out.slice(0, 15)
})

console.log('imgs', JSON.stringify(imgs, null, 2))
console.log('url', page.url())
await browser.close()
