#!/usr/bin/env node
/**
 * Repõe biblioteca unindo TODAS as fontes — usa o backup com MAIS peças
 * e funde com o catálogo actual (mantém fotos quando existirem).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const DATA = process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.DATA_DIR || path.join(ROOT, 'data')
const KEY = 'nonato-pecas-biblioteca'
const TARGET = path.join(DATA, `${KEY}.json`)

function normCodigo(c) {
  return String(c ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
}

function pecasFromFile(p) {
  try {
    const raw = JSON.parse(fs.readFileSync(p, 'utf-8'))
    if (Array.isArray(raw)) return raw
    if (Array.isArray(raw[KEY])) return raw[KEY]
    if (raw.data && Array.isArray(raw.data[KEY])) return raw.data[KEY]
    if (raw.dados && Array.isArray(raw.dados[KEY])) return raw.dados[KEY]
    for (const k of Object.keys(raw || {})) {
      if (/pecas-biblioteca/i.test(k) && Array.isArray(raw[k])) return raw[k]
    }
  } catch {
    /* ignorar */
  }
  return null
}

function scanSources() {
  const out = []
  const cur = pecasFromFile(TARGET)
  if (cur) out.push({ label: 'actual', path: TARGET, pecas: cur })

  const bdir = path.join(ROOT, 'backups', 'json')
  if (fs.existsSync(bdir)) {
    for (const f of fs.readdirSync(bdir).filter((x) => x.endsWith('.json'))) {
      const arr = pecasFromFile(path.join(bdir, f))
      if (arr?.length) out.push({ label: `backup:${f}`, path: path.join(bdir, f), pecas: arr })
    }
  }

  const dl = path.join(process.env.USERPROFILE || '', 'Downloads')
  if (fs.existsSync(dl)) {
    for (const f of fs.readdirSync(dl)) {
      if (!/\.json$/i.test(f)) continue
      if (!/backup|nonato|pecas|biblioteca|dados/i.test(f)) continue
      const arr = pecasFromFile(path.join(dl, f))
      if (arr?.length) out.push({ label: `downloads:${f}`, path: path.join(dl, f), pecas: arr })
    }
  }

  return out
}

function temImagem(p) {
  const img = p?.imagem
  return typeof img === 'string' && img.startsWith('data:') && img.length > 100
}

function mergePecas(base, extra) {
  const byId = new Map()
  const byCodigo = new Map()

  for (const p of base) {
    if (!p?.id) continue
    byId.set(String(p.id), { ...p })
    const c = normCodigo(p.codigo)
    if (c) byCodigo.set(c, String(p.id))
  }

  let added = 0
  let enriched = 0

  for (const p of extra) {
    if (!p || typeof p !== 'object') continue
    const c = normCodigo(p.codigo)
    const existingId = c ? byCodigo.get(c) : null
    if (existingId && byId.has(existingId)) {
      const ex = byId.get(existingId)
      if (!temImagem(ex) && temImagem(p)) {
        byId.set(existingId, { ...ex, imagem: p.imagem, temImagemServidor: false })
        enriched++
      }
      continue
    }
    const id = String(p.id || `recovered-${c || Date.now()}-${Math.random().toString(36).slice(2, 7)}`)
    if (byId.has(id)) continue
    const copy = { ...p, id, importacaoPendente: false }
    byId.set(id, copy)
    if (c) byCodigo.set(c, id)
    added++
  }

  return { lista: Array.from(byId.values()), added, enriched }
}

function main() {
  const sources = scanSources()
  if (!sources.length) {
    console.error('Nenhuma fonte encontrada.')
    process.exit(1)
  }

  sources.sort((a, b) => b.pecas.length - a.pecas.length)
  const best = sources[0]
  const actual = sources.find((s) => s.label === 'actual')?.pecas || []

  console.log('=== Repor biblioteca completa (máximo backup) ===')
  for (const s of sources.slice(0, 8)) {
    console.log(`  ${s.label}: ${s.pecas.length} peça(s)`)
  }
  console.log(`\nFonte principal: ${best.label} (${best.pecas.length} peças)`)
  console.log(`Actual disco: ${actual.length} peças`)

  const { lista, added, enriched } = mergePecas(best.pecas, actual)
  // Também fundir actual→best para fotos que só existem no actual
  const pass2 = mergePecas(lista, actual)
  const final = pass2.lista

  console.log(`\nResultado: ${final.length} peças (${added} recuperadas, ${pass2.enriched} fotos repostas)`)

  if (fs.existsSync(TARGET)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const safety = path.join(DATA, `_pre-merge-max-${stamp}`, `${KEY}.json`)
    fs.mkdirSync(path.dirname(safety), { recursive: true })
    fs.copyFileSync(TARGET, safety)
    console.log(`Cópia segurança: ${safety}`)
  }

  fs.writeFileSync(TARGET, JSON.stringify(final, null, 2), 'utf-8')
  console.log(`✓ Gravado: ${TARGET}`)

  const faltam = best.pecas.length - final.length
  if (faltam > 0) console.warn(`Aviso: ainda faltam ${faltam} vs backup principal (duplicados por código?).`)

  // lista códigos recuperados vs actual
  const curCodes = new Set(actual.map((p) => normCodigo(p.codigo)).filter(Boolean))
  const newOnes = final.filter((p) => !curCodes.has(normCodigo(p.codigo)))
  if (newOnes.length) {
    console.log(`\nPeças recuperadas (${newOnes.length}):`)
    for (const p of newOnes.slice(0, 15)) {
      console.log(`  - ${p.codigo || '?'} | ${String(p.nome || '').slice(0, 50)}`)
    }
    if (newOnes.length > 15) console.log(`  ... e mais ${newOnes.length - 15}`)
  }
}

main()
