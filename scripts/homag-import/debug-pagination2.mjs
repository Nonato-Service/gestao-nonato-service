#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.goto(cfg.startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
await page.waitForTimeout(15000)

const info = await page.evaluate(() => {
  function walk(root, fn) {
    fn(root)
    root.querySelectorAll?.('*')?.forEach?.((el) => {
      if (el.shadowRoot) walk(el.shadowRoot, fn)
    })
  }
  const clicks = []
  walk(document, (root) => {
    root.querySelectorAll?.('button, a, [role="button"], lightning-button, span')?.forEach?.((el) => {
      const label = [el.getAttribute('aria-label'), el.getAttribute('title'), el.textContent?.trim()]
        .filter(Boolean)
        .join(' | ')
      if (!label) return
      if (/next|weiter|>|›|»|page|2|load more|show more|chevron/i.test(label)) {
        const rect = el.getBoundingClientRect()
        clicks.push({ label: label.slice(0, 80), tag: el.tagName, w: rect.width, h: rect.height })
      }
    })
  })
  const links = [...document.querySelectorAll('a[href]')]
    .map((a) => a.getAttribute('href'))
    .filter((h) => /page|offset|cursor|start/i.test(h || ''))
    .slice(0, 10)
  return { clicks: clicks.slice(0, 30), links, htmlSnippet: document.body.innerHTML.includes('commerce_search-paging') }
})
console.log(JSON.stringify(info, null, 2))
await browser.close()
