#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { discoverHomagProducts } from './discover-products.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))

async function test(viewport) {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport })
  await page.goto(cfg.startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.waitForTimeout(15000)
  const before = (await discoverHomagProducts(page)).length
  const nextCount = await page.locator('button:has-text("Next")').count()
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(1000)
  let clicked = false
  try {
    const btn = page.locator('button:has-text("Next")').first()
    if (await btn.isVisible()) {
      await btn.click({ timeout: 10000 })
      clicked = true
    }
  } catch (e) {
    clicked = false
  }
  await page.waitForTimeout(8000)
  const after = (await discoverHomagProducts(page)).length
  const range = await page.evaluate(() => (document.body.innerText.match(/\d+\s*-\s*\d+\s+of\s+\d+\s+Items/i) || [])[0] || '')
  await browser.close()
  return { viewport, before, after, nextCount, clicked, range }
}

console.log(JSON.stringify({
  v1400: await test({ width: 1400, height: 900 }),
  v1920: await test({ width: 1920, height: 1080 }),
}, null, 2))
