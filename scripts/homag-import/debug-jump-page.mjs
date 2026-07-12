#!/usr/bin/env node
/** Testa saltar para página N via clique no número */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { dismissCookieBanner } from './pagination.mjs'
import { discoverHomagProducts } from './discover-products.mjs'

const target = parseInt(process.argv[2] || '110', 10)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
await page.goto(cfg.startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
await dismissCookieBanner(page)
await page.waitForTimeout(12000)

async function range() {
  return page.evaluate(() => (document.body.innerText.match(/\d+\s*-\s*\d+\s+of\s+\d+\s+Items/i) || [])[0] || '')
}

console.log('start', await range())
const bar = page.getByText(/\d+\s*-\s*\d+\s+of\s+\d+\s+Items/i).first().locator('xpath=ancestor::*[.//button][1]')
const btn = bar.locator('button').filter({ hasText: new RegExp(`^${target}$`) }).first()
if ((await btn.count()) > 0) {
  await btn.click({ force: true })
  await page.waitForTimeout(8000)
  console.log('jump', await range(), (await discoverHomagProducts(page))[0]?.codigo)
} else {
  console.log('button not visible, trying last page button trick')
}
await browser.close()
