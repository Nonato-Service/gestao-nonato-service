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

const before = await discoverHomagProducts(page)
const rangeEl = page.getByText(/\d+\s*-\s*\d+\s+of\s+\d+\s+Items/i).first()
await rangeEl.scrollIntoViewIfNeeded().catch(() => {})

const nearby = await page.evaluate(() => {
  const re = /\d+\s*-\s*\d+\s+of\s+\d+\s+Items/i
  let anchor = null
  function walk(root) {
    root.querySelectorAll?.('*')?.forEach?.((el) => {
      if (anchor) return
      if (re.test(el.textContent || '') && el.children.length < 8) anchor = el
      if (el.shadowRoot) walk(el.shadowRoot)
    })
  }
  walk(document)
  if (!anchor) return { found: false }
  const parent = anchor.closest('div, nav, section') || anchor.parentElement
  const buttons = [...(parent?.querySelectorAll('button, a, [role="button"]') || [])].map((b) => ({
    text: (b.textContent || b.getAttribute('aria-label') || '').trim().slice(0, 40),
    disabled: !!b.disabled,
  }))
  return { found: true, anchor: anchor.textContent?.trim().slice(0, 40), buttons }
})

console.log('nearby', JSON.stringify(nearby, null, 2))

// click last enabled button in paging area
const pagingButtons = page.locator('button').filter({ hasText: /^(Next|›|>|»)?$/i })
const count = await pagingButtons.count()
console.log('pagingButtons', count)

// Try Playwright getByLabel
for (const name of ['Next Page', 'Next', 'Go to next page']) {
  const n = await page.getByRole('button', { name: new RegExp(name, 'i') }).count()
  console.log('role button', name, n)
}

await browser.close()
