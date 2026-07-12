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
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await page.waitForTimeout(2000)

const buttons = await page.locator('button').evaluateAll((els) =>
  els.map((el, idx) => ({
    idx,
    text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40),
    y: el.getBoundingClientRect().y,
    x: el.getBoundingClientRect().x,
    disabled: el.disabled,
  }))
)

const rangeY = await page.getByText(/\d+\s*-\s*\d+\s+of\s+\d+\s+Items/i).first().boundingBox()
console.log('rangeY', rangeY)
console.log('buttons near', buttons.filter((b) => b.y > 500).slice(0, 15))

// click bottom-most Next-like button
const candidates = buttons.filter((b) => /^next$/i.test(b.text) && !b.disabled)
console.log('next candidates', candidates)

if (candidates.length) {
  const pick = candidates.sort((a, b) => b.y - a.y)[0]
  console.log('clicking', pick)
  await page.locator('button').nth(pick.idx).click({ force: true })
  await page.waitForTimeout(12000)
  const range = await page.evaluate(() => (document.body.innerText.match(/\d+\s*-\s*\d+\s+of\s+\d+\s+Items/i) || [])[0] || '')
  const items = await discoverHomagProducts(page)
  console.log({ range, count: items.length, first: items[0]?.codigo })
}

await browser.close()
