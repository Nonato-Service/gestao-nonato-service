#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { dismissCookieBanner, jumpToHomagPage, waitForHomagRange, goToNextHomagPage } from './pagination.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })

const auraBodies = []
page.on('response', async (res) => {
  const url = res.url()
  if (!url.includes('/aura?')) return
  try {
    const body = await res.text()
    if (body.includes('220166') || body.includes('productCode') || body.includes('ProductCode')) {
      auraBodies.push({ url: url.slice(0, 120), len: body.length, sample: body.slice(0, 500) })
    }
  } catch {
    /* ignore */
  }
})

await page.goto(cfg.startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
await dismissCookieBanner(page)
await waitForHomagRange(page, 90000)
await jumpToHomagPage(page, 251)
await page.waitForTimeout(2000)

async function scanDom() {
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
        if (!/^\d{10}$/.test(t)) return
        if (el.children?.length > 0) return
        const r = el.getBoundingClientRect?.()
        hits.push({ code: t, tag: el.tagName, top: Math.round(r?.top || 0), vis: r && r.top >= 0 && r.top < window.innerHeight })
      })
    })
    hits.sort((a, b) => a.top - b.top)
    const visible = hits.filter((h) => h.vis).map((h) => h.code)
    const all = [...new Set(hits.map((h) => h.code))]
    return { visible: visible.slice(0, 25), visibleN: visible.length, uniqueAll: all.slice(0, 30), totalNodes: hits.length }
  })
}

const before = await scanDom()
await goToNextHomagPage(page, cfg, cfg.list?.itemSelector || '')
await page.waitForTimeout(3000)
const after = await scanDom()

console.log(JSON.stringify({ before, after, auraCount: auraBodies.length, aura: auraBodies.slice(0, 2) }, null, 2))
await browser.close()
