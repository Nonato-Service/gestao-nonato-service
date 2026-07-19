#!/usr/bin/env node
/**
 * Corrige biblioteca local: placeholders HOMAG deixam de contar como foto.
 * Gera lite + opcional envio Railway.
 *
 * Uso:
 *   node scripts/corrigir-placeholders-biblioteca.mjs
 *   node scripts/corrigir-placeholders-biblioteca.mjs --enviar
 */
import fs from 'fs'
import path from 'path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'url'
import { bibliotecaPecaPrecisaFoto, isHomagPlaceholderImagem } from './homag-import/imagem-util.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA = process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.DATA_DIR || path.join(root, 'data')
const SRC = path.join(DATA, 'nonato-pecas-biblioteca.json')
const LITE = path.join(DATA, 'nonato-pecas-biblioteca-lite.json')
const KEY = 'nonato-pecas-biblioteca'

function toLite(p) {
  const out = { ...p }
  const img = out.imagem
  if (typeof img === 'string' && img.startsWith('data:') && img.length > 0) {
    out.temImagemServidor = true
    delete out.imagem
  }
  return out
}

function stats(pecas) {
  let b64 = 0
  let url = 0
  let ph = 0
  let empty = 0
  for (const p of pecas) {
    const img = typeof p.imagem === 'string' ? p.imagem.trim() : ''
    if (img.startsWith('data:')) b64++
    else if (isHomagPlaceholderImagem(img)) ph++
    else if (/^https?:/.test(img)) url++
    else empty++
  }
  return { total: pecas.length, b64, url, ph, empty, comFoto: b64 + url }
}

if (!fs.existsSync(SRC)) {
  console.error('Ficheiro não encontrado:', SRC)
  process.exit(1)
}

const pecas = JSON.parse(fs.readFileSync(SRC, 'utf-8'))
if (!Array.isArray(pecas)) {
  console.error('Formato inválido:', SRC)
  process.exit(1)
}

const antes = stats(pecas)
let limpos = 0
let mantidos = 0

for (const p of pecas) {
  const img = typeof p.imagem === 'string' ? p.imagem.trim() : ''
  if (isHomagPlaceholderImagem(img)) {
    p.imagem = ''
    limpos++
  } else if (img) {
    mantidos++
  }
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const backupDir = path.join(DATA, `_pre-placeholder-fix-${stamp}`)
fs.mkdirSync(backupDir, { recursive: true })
fs.copyFileSync(SRC, path.join(backupDir, `${KEY}.json`))

fs.writeFileSync(SRC, JSON.stringify(pecas, null, 2) + '\n', 'utf-8')
fs.writeFileSync(LITE, JSON.stringify(pecas.map(toLite), null, 2) + '\n', 'utf-8')

const depois = stats(pecas)

console.log('')
console.log('=== Biblioteca corrigida (placeholders HOMAG) ===')
console.log(`  Placeholders removidos: ${limpos}`)
console.log(`  Antes — com foto: ${antes.comFoto} (base64 ${antes.b64}, URL ${antes.url}, placeholder ${antes.ph})`)
console.log(`  Depois — com foto: ${depois.comFoto} (base64 ${depois.b64}, URL ${depois.url})`)
console.log(`  Backup: ${backupDir}`)
console.log('')

if (process.argv.includes('--enviar')) {
  const railwayUrl = process.env.RAILWAY_URL || 'https://gest-o-nonato-gestao.up.railway.app'
  console.log('A enviar para Railway…')
  const r = spawnSync(process.execPath, [path.join(root, 'scripts', 'enviar-biblioteca-railway.mjs'), railwayUrl], {
    stdio: 'inherit',
  })
  process.exit(r.status ?? 1)
}

console.log('Próximo passo: node scripts/corrigir-placeholders-biblioteca.mjs --enviar')
console.log('Ou execute ENVIAR-PECAS-RAILWAY.bat')
console.log('Depois: PREENCHER-FOTOS-HOMAG.bat (com merge corrigido) para encher fotos em falta.')
console.log('')
