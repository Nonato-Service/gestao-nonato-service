#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { discoverHomagProducts } from './discover-products.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
await page.goto(cfg.startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
await page.waitForTimeout(15000)

const info = await page.evaluate(() => {
  function walk(root, fn) {
    fn(root)
    root.querySelectorAll?.('*')?.forEach?.((el) => {
      if (el.shadowRoot) walk(el.shadowRoot, fn)
    })
  }
  const imgs = []
  walk(document, (root) => {
    root.querySelectorAll?.('img[src*="cms/delivery/media"]')?.forEach?.((img) => {
      imgs.push(img.getAttribute('src'))
    })
  })
  return { imgCount: imgs.length, imgs: imgs.slice(0, 3) }
})
const prods = await discoverHomagProducts(page)
console.log(JSON.stringify({ imgCount: info.imgCount, prodCount: prods.length, sample: prods.slice(0,2) }, null, 2))
await browser.close()
