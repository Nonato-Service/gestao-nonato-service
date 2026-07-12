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

const btn = page.locator('button:has-text("Next")').first()
const meta = {
  count: await page.locator('button:has-text("Next")').count(),
  visible: await btn.isVisible().catch(() => false),
  disabled: await btn.isDisabled().catch(() => null),
  box: await btn.boundingBox().catch(() => null),
  text: await btn.innerText().catch(() => ''),
}

let clicked = 'none'
try {
  await btn.click({ force: true, timeout: 15000 })
  clicked = 'force'
} catch (e) {
  clicked = String(e.message).slice(0, 120)
}

await page.waitForTimeout(10000)
const after = await discoverHomagProducts(page)
const range = await page.evaluate(() => (document.body.innerText.match(/\d+\s*-\s*\d+\s+of\s+\d+\s+Items/i) || [])[0] || '')

console.log(JSON.stringify({ meta, clicked, range, count: after.length, first: after[0]?.codigo, last: after.at(-1)?.codigo }, null, 2))
await browser.close()
