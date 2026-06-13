/**
 * Sincroniza app/translations.ts: todas as chaves de pt-BR nos 6 idiomas.
 * Preenche chaves em falta com tradução automática (google-translate-api-x).
 */
import fs from 'fs'
import path from 'path'
import translate from 'google-translate-api-x'

const ROOT = path.resolve(import.meta.dirname, '..')
const FILE = path.join(ROOT, 'app', 'translations.ts')
const CACHE = path.join(ROOT, 'scripts', '.i18n-sync-cache.json')

const LANGS = ['pt-BR', 'es', 'fr', 'it', 'de', 'en']
const TARGETS = ['es', 'fr', 'it', 'de', 'en']
const GOOGLE_TO = { es: 'es', fr: 'fr', it: 'it', de: 'de', en: 'en' }

const BATCH = 40
const DELAY_MS = 350
const MAX_RETRIES = 4

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function extractBlock(src, lang) {
  const marker = `'${lang}': {`
  const start = src.indexOf(marker)
  if (start < 0) throw new Error(`Locale block not found: ${lang}`)
  let depth = 0
  let i = start + marker.length - 1
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++
    else if (src[i] === '}') {
      depth--
      if (depth === 0) break
    }
  }
  return src.slice(start, i + 1)
}

function keyOrderFromBlock(body) {
  const re = /^\s+(?:([a-zA-Z_][a-zA-Z0-9_]*)|'([^']+)'|"([^"]+)"):/gm
  const keys = []
  for (const m of body.matchAll(re)) {
    keys.push(m[1] || m[2] || m[3])
  }
  const lastIdx = new Map()
  keys.forEach((k, i) => lastIdx.set(k, i))
  return keys.filter((k, i) => lastIdx.get(k) === i)
}

function formatKey(key) {
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) return key
  return JSON.stringify(key)
}

function parseTranslations(src) {
  const a = src.indexOf('export const translations = ')
  const b = src.indexOf('\nexport type TranslationKey')
  if (a < 0 || b < 0) throw new Error('Could not locate translations object')
  const head = src.slice(0, a)
  const tail = src.slice(b)
  const code = src.slice(a + 'export const translations = '.length, b).trim()
  const data = new Function(`return ${code}`)()
  const order = {}
  for (const lang of LANGS) {
    order[lang] = keyOrderFromBlock(extractBlock(src, lang))
  }
  return { head, tail, data, order }
}

function protectPlaceholders(text) {
  const placeholders = []
  const out = text.replace(/\{[^}]+\}/g, (m) => {
    placeholders.push(m)
    return `__PH${placeholders.length - 1}__`
  })
  return { out, placeholders }
}

function restorePlaceholders(text, placeholders) {
  let out = text
  for (let i = 0; i < placeholders.length; i++) {
    out = out.split(`__PH${i}__`).join(placeholders[i])
  }
  return out
}

function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE, 'utf8'))
  } catch {
    return {}
  }
}

function saveCache(cache) {
  fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2), 'utf8')
}

async function translateBatch(texts, toLang) {
  if (!texts.length) return []
  const { out: protectedTexts, placeholdersList } = texts.reduce(
    (acc, t) => {
      const { out, placeholders } = protectPlaceholders(t)
      acc.out.push(out)
      acc.placeholdersList.push(placeholders)
      return acc
    },
    { out: [], placeholdersList: [] }
  )

  let lastErr
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await translate(protectedTexts, { from: 'pt', to: GOOGLE_TO[toLang] })
      const arr = Array.isArray(res) ? res : [res]
      return arr.map((item, i) => restorePlaceholders(item.text, placeholdersList[i]))
    } catch (err) {
      lastErr = err
      await sleep(DELAY_MS * attempt * 2)
    }
  }
  throw lastErr
}

function escapeString(s) {
  return JSON.stringify(String(s))
}

function formatEntry(key, value) {
  return `    ${formatKey(key)}: ${escapeString(value)},`
}

function buildLocaleBlock(lang, entries, keyOrder) {
  const lines = [`  '${lang}': {`]
  const used = new Set()
  for (const key of keyOrder) {
    if (!Object.prototype.hasOwnProperty.call(entries, key)) continue
    lines.push(formatEntry(key, entries[key]))
    used.add(key)
  }
  for (const key of Object.keys(entries)) {
    if (used.has(key)) continue
    lines.push(formatEntry(key, entries[key]))
  }
  lines.push('  }')
  return lines.join('\n')
}

async function main() {
  console.log('Reading translations.ts …')
  const src = fs.readFileSync(FILE, 'utf8')
  const { head, tail, data, order } = parseTranslations(src)
  const cache = loadCache()
  const masterKeys = order['pt-BR']
  const master = data['pt-BR']

  if (masterKeys.length !== Object.keys(master).length) {
    console.warn(`pt-BR: ${masterKeys.length} ordered keys, ${Object.keys(master).length} unique values (duplicates in file)`)
  }

  let translatedCount = 0

  for (const lang of TARGETS) {
    const missing = masterKeys.filter((k) => !Object.prototype.hasOwnProperty.call(data[lang], k))
    console.log(`\n[${lang}] missing ${missing.length} keys`)
    if (!missing.length) continue

    for (let i = 0; i < missing.length; i += BATCH) {
      const chunkKeys = missing.slice(i, i + BATCH)
      const chunkTexts = chunkKeys.map((k) => master[k])
      const cacheHits = chunkKeys.map((k) => cache[`${lang}:${k}`])
      const needIdx = []
      const needTexts = []
      chunkKeys.forEach((k, idx) => {
        if (cacheHits[idx] !== undefined) {
          data[lang][k] = cacheHits[idx]
        } else {
          needIdx.push(idx)
          needTexts.push(chunkTexts[idx])
        }
      })

      if (needTexts.length) {
        process.stdout.write(`  translate ${lang} ${i + 1}-${i + chunkKeys.length}/${missing.length} … `)
        const translated = await translateBatch(needTexts, lang)
        needIdx.forEach((idx, j) => {
          const key = chunkKeys[idx]
          const val = translated[j]
          data[lang][key] = val
          cache[`${lang}:${key}`] = val
          translatedCount++
        })
        saveCache(cache)
        console.log('ok')
        await sleep(DELAY_MS)
      } else {
        chunkKeys.forEach((k, idx) => {
          data[lang][k] = cacheHits[idx]
        })
      }
    }

    // Garantir todas as chaves master
    for (const key of masterKeys) {
      if (data[lang][key] === undefined) {
        data[lang][key] = master[key]
      }
    }
  }

  console.log('\nWriting translations.ts …')
  const blocks = LANGS.map((lang) => {
    const keys = [...masterKeys]
    for (const k of order[lang]) {
      if (!keys.includes(k)) keys.push(k)
    }
    return buildLocaleBlock(lang, data[lang], keys)
  })

  const out =
    head +
    'export const translations = {\n' +
    blocks.join(',\n') +
    '\n}\n' +
    tail

  // Validar sintaxe antes de gravar
  try {
    const code = out.slice(out.indexOf('export const translations = ') + 'export const translations = '.length, out.indexOf('\nexport type TranslationKey')).trim()
    new Function(`return ${code}`)()
  } catch (err) {
    throw new Error(`Generated translations.ts is invalid JS: ${err.message}`)
  }

  fs.writeFileSync(FILE, out, 'utf8')

  // Verificação final
  const verifySrc = fs.readFileSync(FILE, 'utf8')
  const { data: verifyData } = parseTranslations(verifySrc)
  let failed = false
  for (const lang of TARGETS) {
    const miss = masterKeys.filter((k) => verifyData[lang][k] === undefined)
    if (miss.length) {
      failed = true
      console.error(`FAIL ${lang}: still missing ${miss.length} keys`)
    } else {
      console.log(`OK ${lang}: ${Object.keys(verifyData[lang]).length} keys`)
    }
  }

  console.log(`\nAuto-translated ${translatedCount} new strings (cache: ${CACHE})`)
  if (failed) process.exit(1)
  console.log('i18n sync complete — 6 idiomas alinhados.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
