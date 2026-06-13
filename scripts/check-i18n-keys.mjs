import fs from 'fs'

const src = fs.readFileSync('app/translations.ts', 'utf8')
const langs = ['pt-BR', 'es', 'fr', 'it', 'de', 'en']
const blocks = {}

for (const lang of langs) {
  const marker = `'${lang}': {`
  const start = src.indexOf(marker)
  if (start < 0) {
    console.error('block not found', lang)
    process.exit(1)
  }
  let depth = 0
  let i = start + marker.length - 1
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++
    else if (src[i] === '}') {
      depth--
      if (depth === 0) break
    }
  }
  const body = src.slice(start, i + 1)
  const re = /^\s+(?:([a-zA-Z_][a-zA-Z0-9_]*)|'([^']+)'|"([^"]+)"):/gm
  const keys = []
  for (const m of body.matchAll(re)) {
    keys.push(m[1] || m[2] || m[3])
  }
  blocks[lang] = new Set(keys)
}

const base = [...blocks['pt-BR']]
let failed = false
for (const lang of langs.slice(1)) {
  const missing = base.filter((k) => !blocks[lang].has(k))
  if (missing.length) {
    failed = true
    console.error(`${lang} missing ${missing.length} keys (first 20): ${missing.slice(0, 20).join(', ')}`)
  } else {
    console.log(`${lang}: OK (${blocks[lang].size} keys)`)
  }
}
console.log('pt-BR keys:', blocks['pt-BR'].size)
process.exit(failed ? 1 : 0)
