#!/usr/bin/env node
/**
 * Junta export.json da HOMAG → data/nonato-pecas-biblioteca.json
 * Uso: node scripts/homag-import/merge-export-para-biblioteca.mjs [caminho/export.json]
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { extractHomagPrecoFromExportItem, formatHomagPreco } from './homag-preco.mjs'
import { enriquecerPecaHomagComReferencias, chavesDedupHomagPeca, normCodigoHomag } from './homag-codigo-ref.mjs'
import { bibliotecaPecaPrecisaFoto } from './imagem-util.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const DATA = path.join(root, 'data')
const KEY = 'nonato-pecas-biblioteca'
const SRC = path.join(root, 'data', `${KEY}.json`)
const EXPORT_DEFAULT = path.join(root, 'scripts', 'homag-import', 'out', 'export.json')
const LITE = path.join(DATA, 'nonato-pecas-biblioteca-lite.json')

function normCodigo(c) {
  return normCodigoHomag(c)
}

function indexPecaKeys(p) {
  return chavesDedupHomagPeca(p)
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

function imagemFromHomagExportItem(item) {
  const img = item?.imagem
  if (typeof img === 'string' && img.startsWith('data:')) return img
  if (typeof img === 'string' && img.startsWith('http')) return img
  const urlImg =
    typeof item?.imagem_url === 'string' && item.imagem_url.startsWith('http')
      ? item.imagem_url
      : ''
  if (urlImg) return urlImg
  const local = String(item?.imagem_local ?? '').trim()
  if (local && fs.existsSync(local)) {
    try {
      const st = fs.statSync(local)
      if (st.size > 0 && st.size <= 800000) {
        const ext = path.extname(local).toLowerCase()
        const mime =
          ext === '.jpg' || ext === '.jpeg'
            ? 'image/jpeg'
            : ext === '.webp'
              ? 'image/webp'
              : ext === '.gif'
                ? 'image/gif'
                : 'image/png'
        return `data:${mime};base64,${fs.readFileSync(local).toString('base64')}`
      }
    } catch {
      /* ignore */
    }
  }
  return ''
}

function homagItemToPeca(item, seq) {
  const codigo = String(item.codigo ?? item.code ?? '').trim()
  const nome = String(item.nome ?? item.descricao ?? codigo ?? `Peça ${seq + 1}`).trim()
  const descricao = String(item.descricao ?? nome).trim()
  const imagemFinal = imagemFromHomagExportItem(item)
  const preco = formatHomagPreco(extractHomagPrecoFromExportItem(item))
  return enriquecerPecaHomagComReferencias({
    id: `import-homag-${Date.now()}-${seq}-${Math.random().toString(36).slice(2, 9)}`,
    nome,
    codigo,
    preco,
    descricao,
    categoria: '',
    categoriaId: '',
    subcategoria: '',
    subcategoriaId: '',
    importacaoPendente: false,
    imagem: imagemFinal,
    dataCriacao: new Date().toISOString(),
  })
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
    for (const k of indexPecaKeys(p)) byCodigo.set(k, p)
  }

  let added = 0
  let updated = 0
  let updatedPrecos = 0
  incoming.forEach((item, idx) => {
    const peca = homagItemToPeca(item, idx)
    let ex = null
    for (const k of indexPecaKeys(peca)) {
      if (byCodigo.has(k)) {
        ex = byCodigo.get(k)
        break
      }
    }
    if (ex) {
      const incImg = peca.imagem || ''
      const faltaOuPlaceholder = bibliotecaPecaPrecisaFoto(ex.imagem)
      if (incImg && (faltaOuPlaceholder || process.env.HOMAG_MERGE_REPLACE_IMAGES === '1')) {
        if (ex.imagem !== incImg) {
          ex.imagem = incImg
          updated++
        }
      }
      if ((!ex.nome || !String(ex.nome).trim()) && peca.nome) ex.nome = peca.nome
      if ((!ex.descricao || !String(ex.descricao).trim()) && peca.descricao) ex.descricao = peca.descricao
      if (peca.preco) {
        const falta = !ex.preco || !String(ex.preco).trim()
        const substituir = process.env.HOMAG_MERGE_REPLACE_PRICES === '1'
        if ((falta || substituir) && ex.preco !== peca.preco) {
          ex.preco = peca.preco
          updatedPrecos++
        }
      }
      const merged = enriquecerPecaHomagComReferencias(ex)
      if (JSON.stringify(merged) !== JSON.stringify(ex)) {
        Object.assign(ex, merged)
        updated++
      }
      return
    }
    list.push(peca)
    byId.set(String(peca.id), peca)
    for (const k of indexPecaKeys(peca)) byCodigo.set(k, peca)
    added++
  })

  return { list, added, updated, updatedPrecos }
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

const { list, added, updated, updatedPrecos } = mergeIntoBiblioteca(existing, incoming)
fs.writeFileSync(SRC, JSON.stringify(list, null, 2) + '\n', 'utf-8')
fs.writeFileSync(LITE, JSON.stringify(list.map(toLite), null, 2) + '\n', 'utf-8')

console.log('')
console.log('=== Biblioteca actualizada ===')
console.log(`  Importados (novos): ${added}`)
console.log(`  Actualizados (fotos/dados): ${updated}`)
console.log(`  Preços preenchidos/actualizados: ${updatedPrecos}`)
console.log(`  Total no disco (este PC): ${list.length} peça(s)`)
console.log(`  Backup: ${backupDir}`)
console.log('')
console.log('  Gravado em: data/nonato-pecas-biblioteca.json (PC local)')
console.log('  Para Railway: execute ENVIAR-362-PECAS-RAILWAY.bat')
console.log('  (IMPORTAR-TUDO-HOMAG.bat envia ao Railway automaticamente no fim)')
console.log('')
