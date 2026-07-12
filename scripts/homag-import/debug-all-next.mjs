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

async function getRange() {
  return page.evaluate(() => (document.body.innerText.match(/\d+\s*-\s*\d+\s+of\s+\d+\s+Items/i) || [])[0] || '')
}

const buttons = await page.evaluate(() => {
  return [...document.querySelectorAll('button')]
    .map((b, i) => ({
      i,
      text: (b.textContent || b.getAttribute('aria-label') || '').trim().slice(0, 30),
      disabled: b.disabled,
      y: b.getBoundingClientRect().y,
      x: b.getBoundingClientRect().x,
    }))
    .filter((b) => /next|›|»|>/i.test(b.text) || b.text === 'Next')
})

console.log('before', await getRange(), (await discoverHomagProducts(page)).length)
console.log('buttons', buttons)

for (const b of buttons) {
  const rangeBefore = await getRange()
  await page.evaluate((idx) => document.querySelectorAll('button')[idx]?.click(), b.i)
  await page.waitForTimeout(8000)
  const rangeAfter = await getRange()
  const count = (await discoverHomagProducts(page)).length
  console.log({ tried: b.text, rangeBefore, rangeAfter, count })
  if (rangeAfter !== rangeBefore) break
}

await browser.close()
