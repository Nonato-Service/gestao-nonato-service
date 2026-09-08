/**
 * Extrai os 6 blocos de app/translations.ts para app/i18n/messages/*.json
 * (uma vez — depois o source of truth dos textos passa a ser o JSON + o loader).
 */
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const SRC = path.join(ROOT, 'app', 'translations.ts')
const OUT_DIR = path.join(ROOT, 'app', 'i18n', 'messages')
const LANGS = ['pt-BR', 'es', 'fr', 'it', 'de', 'en']

function extractBlock(src, lang) {
  const marker = `'${lang}': {`
  const start = src.indexOf(marker)
  if (start < 0) throw new Error(`bloco não encontrado: ${lang}`)
  let depth = 0
  let i = start + marker.length - 1
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++
    else if (src[i] === '}') {
      depth--
      if (depth === 0) break
    }
  }
  return src.slice(start + `'${lang}': `.length, i + 1)
}

const src = fs.readFileSync(SRC, 'utf8')
fs.mkdirSync(OUT_DIR, { recursive: true })

for (const lang of LANGS) {
  const body = extractBlock(src, lang)
  const obj = new Function(`"use strict"; return (${body})`)()
  const dest = path.join(OUT_DIR, `${lang}.json`)
  fs.writeFileSync(dest, JSON.stringify(obj), 'utf8')
  console.log(`[i18n:extract] ${lang} → ${Object.keys(obj).length} chaves`)
}
