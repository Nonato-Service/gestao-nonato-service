#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { dismissCookieBanner, jumpToHomagPage, waitForHomagRange } from './pagination.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })

async function leafCodes() {
  return page.evaluate(() => {
    function walk(root, fn) {
      fn(root)
      root.querySelectorAll?.('*')?.forEach?.((el) => {
        if (el.shadowRoot) walk(el.shadowRoot, fn)
      })
    }
    const hits = []
    walk(document, (root) => {
      root.querySelectorAll?.('*')?.forEach?.((el) => {
        const t = (el.textContent || '').trim()
        if (!/^\d{10}$/.test(t) || el.children?.length) return
        hits.push({ code: t, top: el.getBoundingClientRect?.().top || 0 })
      })
    })
    hits.sort((a, b) => a.top - b.top)
    return hits.map((h) => h.code).slice(0, 5)
  })
}

async function slowStepFrom250(steps) {
  await jumpToHomagPage(page, 250, { fast: true, sync: true })
  const rows = []
  for (let i = 0; i <= steps; i++) {
    const range = await page.evaluate(() => {
      const re = /\d+\s*-\s*\d+\s+of\s+\d+\s+Items/gi
      const all = document.body.innerText.match(re) || []
      return all[all.length - 1]
    })
    rows.push({ i, range, codes: await leafCodes() })
    if (i < steps) {
      const before = await leafCodes()
      const br = range
      await page.evaluate(() => {
        const re = /\d+\s*-\s*\d+\s+of\s+\d+\s+Items/i
        const nodes = [...document.querySelectorAll('*')]
        for (const el of nodes) {
          const t = el.textContent || ''
          if (re.test(t) && t.length < 80) {
            el.scrollIntoView({ block: 'center' })
            break
          }
        }
      })
      const bar = page.getByText(/\d+\s*-\s*\d+\s+of\s+\d+\s+Items/i).last()
      const anc = bar.locator('xpath=ancestor::*[4]')
      const next = anc.getByRole('button', { name: /^Next Page$/i }).first()
      await next.click({ force: true, timeout: 12000 })
      for (let w = 0; w < 30; w++) {
        await page.waitForTimeout(500)
        const r2 = await page.evaluate(() => {
          const re = /\d+\s*-\s*\d+\s+of\s+\d+\s+Items/gi
          const all = document.body.innerText.match(re) || []
          return all[all.length - 1]
        })
        const after = await leafCodes()
        if (r2 !== br && after.join(',') !== before.join(',')) break
      }
    }
  }
  return rows
}

await page.goto(cfg.startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
await dismissCookieBanner(page)
await waitForHomagRange(page, 90000)

console.log(JSON.stringify(await slowStepFrom250(4), null, 2))
await browser.close()
