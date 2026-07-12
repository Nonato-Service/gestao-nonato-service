#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { dismissCookieBanner, jumpToHomagPage, waitForHomagRange } from './pagination.mjs'

const target = parseInt(process.argv[2] || '1', 10)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
await page.goto(cfg.startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
await dismissCookieBanner(page)
await waitForHomagRange(page, 90000)
await page.waitForTimeout(8000)
if (target > 1) await jumpToHomagPage(page, target)
await page.waitForTimeout(8000)

const report = await page.evaluate(() => {
  function walk(root, fn) {
    fn(root)
    root.querySelectorAll?.('*')?.forEach?.((el) => {
      if (el.shadowRoot) walk(el.shadowRoot, fn)
    })
  }

  const rangeRe = /\d+\s*-\s*\d+\s+of\s+\d+\s+Items/i
  const range = (document.body.innerText.match(rangeRe) || [])[0] || ''

  /** Estratégia A: códigos após o texto do range no innerText completo */
  const full = document.body.innerText || ''
  const rangeIdx = full.search(rangeRe)
  const afterRange = rangeIdx >= 0 ? full.slice(rangeIdx) : full
  const codesAfterRange = []
  const seen = new Set()
  for (const m of afterRange.matchAll(/\b([1-9]\d{9})\b/g)) {
    if (seen.has(m[1])) continue
    seen.add(m[1])
    codesAfterRange.push(m[1])
    if (codesAfterRange.length >= 25) break
  }

  /** Estratégia B: par img CMS + ancestral com código */
  const fromImgs = []
  const seenB = new Set()
  walk(document, (root) => {
    root.querySelectorAll?.('img[src*="cms/delivery/media"]')?.forEach?.((img) => {
      let el = img
      for (let i = 0; i < 12 && el; i++) {
        const t = el.textContent || ''
        const m = t.match(/\b([1-9]\d{9})\b/)
        if (m && t.length < 500 && !seenB.has(m[1])) {
          seenB.add(m[1])
          fromImgs.push({
            codigo: m[1],
            img: (img.getAttribute('src') || '').slice(0, 80),
            tag: el.tagName,
          })
          break
        }
        el = el.parentElement
      }
    })
  })

  /** Estratégia C: scoped root actual */
  let rangeEl = null
  walk(document, (root) => {
    root.querySelectorAll?.('*')?.forEach?.((el) => {
      if (rangeEl) return
      const t = (el.textContent || '').trim()
      if (rangeRe.test(t) && t.length < 80) rangeEl = el
    })
  })
  let node = rangeEl
  let best = rangeEl
  let bestScore = 0
  for (let i = 0; i < 14 && node; i++) {
    let imgs = 0
    walk(node, (root) => {
      imgs += root.querySelectorAll?.('img[src*="cms/delivery/media"]')?.length || 0
    })
    if (imgs >= bestScore) {
      bestScore = imgs
      best = node
    }
    node = node.parentElement
  }
  const root = bestScore >= 1 ? best : rangeEl?.parentElement
  const rootCodes = [...(root?.innerText || '').matchAll(/\b([1-9]\d{9})\b/g)].map((m) => m[1]).slice(0, 25)

  const cmsCount = []
  walk(document, (root) => {
    cmsCount.push(root.querySelectorAll?.('img[src*="cms/delivery/media"]')?.length || 0)
  })
  const totalCms = cmsCount.reduce((a, b) => a + b, 0)

  return {
    range,
    codesAfterRange: codesAfterRange.slice(0, 10),
    codesAfterRangeCount: codesAfterRange.length,
    fromImgs: fromImgs.slice(0, 10),
    fromImgsCount: fromImgs.length,
    rootCodes: rootCodes.slice(0, 10),
    rootCodesCount: rootCodes.length,
    bestScore,
    totalCms,
  }
})

console.log(JSON.stringify(report, null, 2))
await browser.close()
