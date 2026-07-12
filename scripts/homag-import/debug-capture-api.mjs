#!/usr/bin/env node
/**
 * Captura pedidos Aura/Commerce ao paginar — descobre API de produtos.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { dismissCookieBanner, jumpToHomagPage, waitForHomagRange, goToNextHomagPage } from './pagination.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))
const OUT = path.join(__dirname, 'out', 'api-capture.json')

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })

const hits = []
page.on('request', (req) => {
  const url = req.url()
  if (!/\/aura/.test(url) && !/commerce|search|product/i.test(url)) return
  const post = req.postData() || ''
  if (post.length > 100 || /search|product|category|page/i.test(url + post)) {
    hits.push({
      kind: 'request',
      method: req.method(),
      url: url.slice(0, 200),
      postLen: post.length,
      postSample: post.slice(0, 800),
    })
  }
})

page.on('response', async (res) => {
  const url = res.url()
  if (!/\/aura/.test(url) && !/commerce|search|product/i.test(url)) return
  try {
    const body = await res.text()
    const codes = [...body.matchAll(/\b([1-9]\d{9})\b/g)].map((m) => m[1])
    const uniq = [...new Set(codes)]
    if (uniq.length >= 5 || /productFields|Product|searchResults|records/i.test(body)) {
      hits.push({
        kind: 'response',
        url: url.slice(0, 200),
        len: body.length,
        codes: uniq.slice(0, 15),
        codeCount: uniq.length,
        sample: body.slice(0, 1200),
      })
    }
  } catch {
    /* ignore */
  }
})

await page.goto(cfg.startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
await dismissCookieBanner(page)
await waitForHomagRange(page, 90000)
await page.waitForTimeout(3000)
hits.length = 0

await jumpToHomagPage(page, 300)
await page.waitForTimeout(4000)
const r1 = await page.evaluate(() => {
  const re = /\d+\s*-\s*\d+\s+of\s+\d+\s+Items/gi
  const all = document.body.innerText.match(re) || []
  return all[all.length - 1]
})
hits.push({ kind: 'marker', page: 300, range: r1 })

await goToNextHomagPage(page, cfg, cfg.list?.itemSelector || '')
await page.waitForTimeout(4000)
const r2 = await page.evaluate(() => {
  const re = /\d+\s*-\s*\d+\s+of\s+\d+\s+Items/gi
  const all = document.body.innerText.match(re) || []
  return all[all.length - 1]
})
hits.push({ kind: 'marker', page: 301, range: r2 })

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify(hits, null, 2))
console.log('saved', hits.length, 'entries to', OUT)
console.log('responses with codes:', hits.filter((h) => h.kind === 'response' && h.codeCount >= 5).length)
for (const h of hits.filter((x) => x.kind === 'response' && x.codeCount >= 5).slice(0, 3)) {
  console.log('---', h.url, 'codes:', h.codeCount, h.codes?.slice(0, 5))
}
await browser.close()
