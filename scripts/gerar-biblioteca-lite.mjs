#!/usr/bin/env node
/** Gera nonato-pecas-biblioteca-lite.json (~160 KB) a partir do catálogo completo. */
import fs from 'fs'
import path from 'path'

const DATA_DIR =
  process.env.RAILWAY_VOLUME_MOUNT_PATH ||
  process.env.DATA_DIR ||
  path.join(process.cwd(), 'data')

const SRC = path.join(DATA_DIR, 'nonato-pecas-biblioteca.json')
const DST = path.join(DATA_DIR, 'nonato-pecas-biblioteca-lite.json')

function toLite(p) {
  const out = { ...p }
  const img = out.imagem
  if (typeof img === 'string' && img.startsWith('data:') && img.length > 0) {
    out.temImagemServidor = true
    delete out.imagem
  }
  return out
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

const lite = pecas.map(toLite)
fs.writeFileSync(DST, JSON.stringify(lite), 'utf-8')
console.log(`OK: ${lite.length} peça(s) → ${DST} (${(fs.statSync(DST).size / 1024).toFixed(1)} KB)`)
