#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { dismissCookieBanner, waitForHomagRange } from './pagination.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))

const browser = await chromium.launch({ headless: false, slowMo: 50 })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
await page.goto(cfg.startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
await dismissCookieBanner(page)
await waitForHomagRange(page, 90000)
await page.waitForTimeout(5000)

const info = await page.evaluate(() => {
  function walk(root, fn) {
    fn(root)
    root.querySelectorAll?.('*')?.forEach?.((el) => {
      if (el.shadowRoot) walk(el.shadowRoot, fn)
    })
  }
  const inputs = []
  const buttons = []
  walk(document, (root) => {
    root.querySelectorAll?.('input')?.forEach?.((inp) => {
      const r = inp.getBoundingClientRect()
      if (r.width < 2) return
      inputs.push({
        type: inp.type,
        value: inp.value,
        placeholder: inp.placeholder,
        aria: inp.getAttribute('aria-label'),
        name: inp.name,
        id: inp.id,
      })
    })
    root.querySelectorAll?.('button, [role="button"]')?.forEach?.((btn) => {
      const r = btn.getBoundingClientRect()
      if (r.width < 2) return
      const t = [
        btn.getAttribute('aria-label'),
        btn.getAttribute('title'),
        btn.textContent?.trim(),
      ]
        .filter(Boolean)
        .join(' | ')
      if (!/page|next|prev|go|\d+/i.test(t) && !/^\s*$/.test(btn.textContent || '')) return
      buttons.push({
        text: t.slice(0, 80),
        disabled: !!btn.disabled,
        empty: !(btn.textContent || '').trim(),
      })
    })
  })
  return { inputs, buttons: buttons.slice(0, 40) }
})

console.log(JSON.stringify(info, null, 2))
await page.waitForTimeout(3000)
await browser.close()
