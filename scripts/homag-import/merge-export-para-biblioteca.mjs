#!/usr/bin/env node
/**
 * Junta export.json da HOMAG → data/nonato-pecas-biblioteca.json
 * Uso: node scripts/homag-import/merge-export-para-biblioteca.mjs [caminho/export.json]
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const DATA = path.join(root, 'data')
const KEY = 'nonato-pecas-biblioteca'
const SRC = path.join(root, 'data', `${KEY}.json`)
const EXPORT_DEFAULT = path.join(root, 'scripts', 'homag-import', 'out', 'export.json')
const LITE = path.join(DATA, 'nonato-pecas-biblioteca-lite.json')

function normCodigo(c) {
  return String(c ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
}

function toLite(p) {
  const out = { ...p }
  const img = out.imagem
  if (typeof img === 'string' && img.startsWith('data:') && img.length > 0) {
    out.temImagemServidor = true
    delete out.imagem
  }
  return out
}

function homagItemToPeca(item, seq) {
  const codigo = String(item.codigo ?? item.code ?? '').trim()
  const nome = String(item.nome ?? item.descricao ?? codigo ?? `Peça ${seq + 1}`).trim()
  const descricao = String(item.descricao ?? nome).trim()
  const imagem = typeof item.imagem === 'string' && item.imagem.startsWith('data:') ? item.imagem : ''
  return {
    id: `import-homag-${Date.now()}-${seq}-${Math.random().toString(36).slice(2, 9)}`,
    nome,
    codigo,
    preco: '',
    descricao,
    categoria: '',
    categoriaId: '',
    subcategoria: '',
    subcategoriaId: '',
    importacaoPendente: false,
    imagem,
    dataCriacao: new Date().toISOString(),
  }
}

function loadExport(file) {
  const j = JSON.parse(fs.readFileSync(file, 'utf-8'))
  if (Array.isArray(j)) return j
  if (Array.isArray(j.itens)) return j.itens
  if (Array.isArray(j.pecas)) return j.pecas
  if (Array.isArray(j.data)) return j.data
  throw new Error('export.json: formato não reconhecido (esperado { itens: [...] })')
}

function mergeIntoBiblioteca(existing, incoming) {
  const list = Array.isArray(existing) ? [...existing] : []
  const byCodigo = new Map()
  const byId = new Map()
  for (const p of list) {
    if (p && typeof p === 'object' && p.id) byId.set(String(p.id), p)
    const c = normCodigo(p.codigo)
    if (c) byCodigo.set(c, p)
  }

  let added = 0
  let updated = 0
  incoming.forEach((item, idx) => {
    const peca = homagItemToPeca(item, idx)
    const c = normCodigo(peca.codigo)
    const ex = c ? byCodigo.get(c) : null
    if (ex) {
      if (!ex.imagem && peca.imagem) {
        ex.imagem = peca.imagem
        updated++
      }
      if ((!ex.nome || !String(ex.nome).trim()) && peca.nome) ex.nome = peca.nome
      if ((!ex.descricao || !String(ex.descricao).trim()) && peca.descricao) ex.descricao = peca.descricao
      return
    }
    list.push(peca)
    byId.set(String(peca.id), peca)
    if (c) byCodigo.set(c, peca)
    added++
  })

  return { list, added, updated }
}

const exportPath = process.argv[2] ? path.resolve(process.argv[2]) : EXPORT_DEFAULT
if (!fs.existsSync(exportPath)) {
  console.error('Ficheiro não encontrado:', exportPath)
  console.error('Corra primeiro: npm run homag:import')
  process.exit(1)
}

const incoming = loadExport(exportPath)
if (incoming.length === 0) {
  console.error('export.json vazio — faça login na HOMAG e exporte de novo.')
  process.exit(1)
}

let existing = []
if (fs.existsSync(SRC)) {
  try {
    existing = JSON.parse(fs.readFileSync(SRC, 'utf-8'))
    if (!Array.isArray(existing)) existing = []
  } catch {
    existing = []
  }
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const backupDir = path.join(DATA, `_pre-homag-merge-${stamp}`)
fs.mkdirSync(backupDir, { recursive: true })
if (fs.existsSync(SRC)) fs.copyFileSync(SRC, path.join(backupDir, `${KEY}.json`))

const { list, added, updated } = mergeIntoBiblioteca(existing, incoming)
fs.writeFileSync(SRC, JSON.stringify(list, null, 2) + '\n', 'utf-8')
fs.writeFileSync(LITE, JSON.stringify(list.map(toLite), null, 2) + '\n', 'utf-8')

console.log('')
console.log('=== Biblioteca actualizada ===')
console.log(`  Importados (novos): ${added}`)
console.log(`  Actualizados (fotos/dados): ${updated}`)
console.log(`  Total no servidor: ${list.length} peça(s)`)
console.log(`  Backup: ${backupDir}`)
console.log('')
console.log('Próximo passo: abra http://localhost:3000/recuperar-biblioteca.html')
console.log('(ou Ctrl+Shift+R na Biblioteca de Peças)')
console.log('')
