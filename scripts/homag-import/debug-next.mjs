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

const tries = []
for (const sel of [
  'button:has-text("Next")',
  'a:has-text("Next")',
  '[aria-label*="Next" i]',
  'commerce_search-paging',
  'lightning-button-icon',
  'button.slds-button',
]) {
  tries.push({ sel, count: await page.locator(sel).count().catch(() => -1) })
}

const html = await page.content()
const idx = html.toLowerCase().indexOf('next')
const snippet = idx >= 0 ? html.slice(Math.max(0, idx - 80), idx + 120) : 'not found'

const clickNext = await page.getByRole('button', { name: /next/i }).count().catch(() => 0)
const clickLink = await page.getByRole('link', { name: /next/i }).count().catch(() => 0)

console.log(JSON.stringify({ tries, clickNext, clickLink, snippet }, null, 2))
await browser.close()
