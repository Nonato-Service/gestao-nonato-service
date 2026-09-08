import fs from 'fs'
import path from 'path'

const langs = ['pt-BR', 'es', 'fr', 'it', 'de', 'en']
const msgDir = path.join(process.cwd(), 'app', 'i18n', 'messages')

const blocks = {}
for (const lang of langs) {
  const file = path.join(msgDir, `${lang}.json`)
  if (!fs.existsSync(file)) {
    console.error('em falta:', file)
    process.exit(1)
  }
  const obj = JSON.parse(fs.readFileSync(file, 'utf8'))
  blocks[lang] = new Set(Object.keys(obj))
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
