#!/usr/bin/env node
/**
 * Importa uma peça da HOMAG por código ou referência (ex.: 3-835-16-6080 ou 3835166080).
 * Uso: node scripts/homag-import/importar-peca-por-codigo.mjs "3-835-16-6080"
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { captureAuraSession, parseCategoryIdFromUrl } from './api-products.mjs'
import { auraSearch, baseInput } from './api-import.mjs'
import { downloadHomagImage } from './images.mjs'
import { formatHomagPreco } from './homag-preco.mjs'
import { enriquecerPecaHomagComReferencias } from './homag-codigo-ref.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..', '..')
const DATA = path.join(ROOT, 'data')
const BIB = path.join(DATA, 'nonato-pecas-biblioteca.json')
const LITE = path.join(DATA, 'nonato-pecas-biblioteca-lite.json')

function loadConfig() {
  const p = path.join(__dirname, 'config.json')
  if (!fs.existsSync(p)) throw new Error('Falta scripts/homag-import/config.json')
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function normCodigo(c) {
  return String(c ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function termosBusca(codigo) {
  const raw = String(codigo || '').trim()
  const compact = normCodigo(raw)
  const terms = new Set([raw, compact])
  const m = compact.match(/^(\d)(\d{3})(\d{2})(\d{3,4})$/)
  if (m) terms.add(`${m[1]}-${m[2]}-${m[3]}-${m[4]}`)
  return [...terms].filter(Boolean)
}

function toLite(p) {
  const out = { ...p }
  if (typeof out.imagem === 'string' && out.imagem.startsWith('data:') && out.imagem.length > 0) {
    out.temImagemServidor = true
    delete out.imagem
  }
  return out
}

function mergePeca(existing, incoming) {
  const list = Array.isArray(existing) ? [...existing] : []
  const byCodigo = new Map()
  for (const p of list) {
    const c = normCodigo(p.codigo)
    if (c) byCodigo.set(c, p)
  }
  const key = normCodigo(incoming.codigo)
  const ex = key ? byCodigo.get(key) : null
  if (ex) {
    if (incoming.nome && (!ex.nome || ex.nome.length < incoming.nome.length)) ex.nome = incoming.nome
    if (incoming.descricao) ex.descricao = incoming.descricao
    if (incoming.preco && !ex.preco) ex.preco = incoming.preco
    if (incoming.imagem && !ex.imagem) ex.imagem = incoming.imagem
    return { list, added: false, peca: ex }
  }
  list.push(incoming)
  return { list, added: true, peca: incoming }
}

async function main() {
  const codigoArg = process.argv[2]
  if (!codigoArg) {
    console.error('Uso: node scripts/homag-import/importar-peca-por-codigo.mjs "3-835-16-6080"')
    process.exit(1)
  }

  const config = loadConfig()
  const startUrl = config.startUrl || 'https://shop.homag.com/s/category/spare-parts/0ZG0900000059puGAA'
  const categoryId = parseCategoryIdFromUrl(startUrl)
  const alvos = new Set(termosBusca(codigoArg).map(normCodigo))

  console.log('[HOMAG] A procurar:', [...termosBusca(codigoArg)].join(' | '))

  const browser = await chromium.launch({
    headless: process.env.HOMAG_HEADLESS !== '0',
    slowMo: process.env.HOMAG_HEADLESS === '0' ? 80 : 0,
  })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })
    await page.waitForTimeout(8000)

    const session = await captureAuraSession(page, startUrl)
    let found = null

    for (const term of termosBusca(codigoArg)) {
      const r = await auraSearch(context, session, {
        ...baseInput(session, categoryId, term),
        page: 0,
      })
      console.log(`[HOMAG] Busca "${term}": ${r.products.length} resultado(s)`)
      for (const p of r.products) {
        const c = normCodigo(p.codigo)
        if (!c || !alvos.has(c)) continue
        found = p
        console.log(`[HOMAG] Correspondência exacta: SKU ${p.codigo} — ${p.descricao}`)
        break
      }
      if (found) break
    }

    if (!found) {
      console.error(
        '[HOMAG] Peça não encontrada com código exacto na loja HOMAG.\n' +
          '        Não foi criada nenhuma peça inventada — só entram dados confirmados pela HOMAG.'
      )
      process.exit(2)
    }

    let imagem = ''
    if (found.imagemUrl) {
      const imgDir = path.join(__dirname, 'out', 'images')
      fs.mkdirSync(imgDir, { recursive: true })
      const imgPath = path.join(imgDir, `${normCodigo(found.codigo)}.png`)
      try {
        const ok = await downloadHomagImage(context, found.imagemUrl, imgPath)
        if (ok && fs.existsSync(imgPath)) {
          const buf = fs.readFileSync(imgPath)
          if (buf.length > 0 && buf.length <= 800000) {
            imagem = `data:image/png;base64,${buf.toString('base64')}`
          }
        }
      } catch {
        /* sem foto */
      }
    }

    const refComHifens = termosBusca(codigoArg).find((t) => t.includes('-')) || ''
    const nomeHomag = String(found.descricao || found.codigo || '').trim()
    const incoming = enriquecerPecaHomagComReferencias({
      id: `import-homag-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      nome: nomeHomag,
      codigo: found.codigo,
      preco: found.preco || '',
      descricao: `${nomeHomag}${refComHifens ? ` | REF HOMAG ${refComHifens}` : ''}`,
      categoria: '',
      categoriaId: '',
      subcategoria: '',
      subcategoriaId: '',
      importacaoPendente: false,
      imagem,
      dataCriacao: new Date().toISOString(),
    })

    const existing = fs.existsSync(BIB) ? JSON.parse(fs.readFileSync(BIB, 'utf8')) : []
    const { list, added, peca } = mergePeca(existing, incoming)
    fs.writeFileSync(BIB, JSON.stringify(list, null, 2))
    fs.writeFileSync(LITE, JSON.stringify(list.map(toLite)))
    console.log(
      added ? `[OK] Peça adicionada: ${peca.codigo} — ${peca.nome}` : `[OK] Peça actualizada: ${peca.codigo} — ${peca.nome}`
    )
    console.log(`Biblioteca: ${list.length} peça(s).`)
  } finally {
    await browser.close()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
