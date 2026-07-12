#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { dismissCookieBanner, waitForHomagRange } from './pagination.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))
const OUT_DIR = path.join(__dirname, 'out', 'api-samples')

function extractProducts(body) {
  const items = []
  const seen = new Set()
  /** Salesforce often embeds SKU in JSON as "sku":"1234567890" or productCode */
  for (const m of body.matchAll(
    /"(?:sku|productCode|ProductCode|materialNumber|Material_Number__c)"\s*:\s*"([1-9]\d{9})"/gi
  )) {
    if (!seen.has(m[1])) {
      seen.add(m[1])
      items.push(m[1])
    }
  }
  if (items.length < 3) {
    for (const m of body.matchAll(/\b([1-9]\d{9})\b/g)) {
      if (!seen.has(m[1])) {
        seen.add(m[1])
        items.push(m[1])
      }
      if (items.length >= 25) break
    }
  }
  return items.slice(0, 25)
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
const samples = []

page.on('response', async (res) => {
  const url = res.url()
  if (!/aura|commerce|search|sfsites/i.test(url)) return
  try {
    const ct = res.headers()['content-type'] || ''
    if (!/json|javascript|text/i.test(ct) && !/aura/.test(url)) return
    const body = await res.text()
    const codes = extractProducts(body)
    if (codes.length >= 8) {
      const id = `${samples.length}`.padStart(3, '0')
      samples.push({ url: url.slice(0, 180), len: body.length, codes: codes.slice(0, 12), codeCount: codes.length })
      fs.mkdirSync(OUT_DIR, { recursive: true })
      fs.writeFileSync(path.join(OUT_DIR, `resp-${id}.txt`), body.slice(0, 500000))
    }
  } catch {
    /* ignore */
  }
})

page.on('request', (req) => {
  const url = req.url()
  const post = req.postData() || ''
  if (!/aura/.test(url) || post.length < 50) return
  if (/search|product|category|getProducts|Search/i.test(post)) {
    samples.push({
      kind: 'req',
      url: url.slice(0, 180),
      post: post.slice(0, 4000),
    })
  }
})

await page.goto(cfg.startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
await dismissCookieBanner(page)
await waitForHomagRange(page, 90000)
await page.waitForTimeout(12000)

async function clickNext() {
  const bar = page.getByText(/\d+\s*-\s*\d+\s+of\s+\d+\s+Items/i).last()
  const anc = bar.locator('xpath=ancestor::*[4]')
  await anc.getByRole('button', { name: /^Next Page$/i }).first().click({ force: true, timeout: 15000 })
  await page.waitForTimeout(8000)
}

await clickNext()
await clickNext()

fs.writeFileSync(path.join(__dirname, 'out', 'api-samples-index.json'), JSON.stringify(samples, null, 2))
console.log('samples', samples.length)
for (const s of samples.filter((x) => x.codes).slice(0, 5)) {
  console.log(s.url, s.codeCount, s.codes?.slice(0, 4))
}
await browser.close()
