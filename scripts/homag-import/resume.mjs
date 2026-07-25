/**
 * Retomar importação HOMAG sem recomeçar do zero.
 */
import fs from 'fs'
import path from 'path'
import { jumpToHomagPage } from './pagination.mjs'
import {
  chavesDedupHomagPeca,
  nucleoCodigoHomag,
  variantesCodigoHomagParaMatch,
} from './homag-codigo-ref.mjs'

const EXPORT_LITE_MIN_ITEMS = Number(process.env.HOMAG_EXPORT_LITE_MIN_ITEMS) || 200

/** Item leve para export.json — sem base64 grande (evita RangeError com 10k+ peças). */
export function exportItemLite(item) {
  const o = {
    codigo: String(item?.codigo ?? '').trim(),
    nome: String(item?.nome ?? item?.descricao ?? '').trim(),
    descricao: String(item?.descricao ?? item?.nome ?? item?.codigo ?? '').trim(),
    imagem_url: String(item?.imagem_url ?? '').trim(),
    imagem_local: String(item?.imagem_local ?? '').trim(),
    preco: String(item?.preco ?? '').trim(),
    imagem: '',
  }
  const img = item?.imagem
  if (typeof img === 'string') {
    if (img.startsWith('http')) o.imagem = img
    else if (img.startsWith('data:') && img.length <= 12000) o.imagem = img
  }
  return o
}

function shouldUseLiteExport(items) {
  if (process.env.HOMAG_EXPORT_FULL === '1') return false
  if (process.env.HOMAG_EMBED_IMAGES === '0') return true
  return Array.isArray(items) && items.length >= EXPORT_LITE_MIN_ITEMS
}

function itemsForExportDisk(items) {
  return shouldUseLiteExport(items) ? items.map(exportItemLite) : items
}

function writeJsonFile(filePath, data, pretty = false) {
  const body = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data)
  fs.writeFileSync(filePath, body, 'utf8')
}

function writeExportPayload(exportPath, payload, items) {
  const lite = shouldUseLiteExport(items)
  const out = {
    ...payload,
    itens: itemsForExportDisk(items),
    export_lite: lite,
  }
  const pretty = process.env.HOMAG_EXPORT_PRETTY === '1'
  try {
    writeJsonFile(exportPath, out, pretty)
    return true
  } catch (e) {
    if (!(e instanceof RangeError) && !String(e?.message || '').includes('Invalid string length')) {
      throw e
    }
    console.warn('[HOMAG] export.json demasiado grande — a gravar versão lite compacta…')
    out.itens = items.map(exportItemLite)
    out.export_lite = true
    writeJsonFile(exportPath, out, false)
    return true
  }
}

export function normCodigo(c) {
  return nucleoCodigoHomag(c) || String(c ?? '').trim().toLowerCase().replace(/\s+/g, '')
}

export function parseRangePage(range) {
  const m = String(range || '').match(/(\d+)\s*-\s*(\d+)\s+of\s+(\d+)/i)
  if (!m) return { page: 0, start: 0, end: 0, total: 0, pageSize: 20 }
  const start = parseInt(m[1], 10)
  const end = parseInt(m[2], 10)
  const total = parseInt(m[3], 10)
  const pageSize = Math.max(1, end - start + 1)
  const page = Math.ceil(start / pageSize)
  return { page, start, end, total, pageSize }
}

export function computeHomagTargetPage(items, lastPageNum, lastRange = '') {
  const fromItems = items.length > 0 ? Math.max(1, Math.ceil(items.length / 20)) : 0
  const rangePage = parseRangePage(lastRange).page || 0
  const savedPage = Math.max(Number(lastPageNum) || 0, rangePage)
  const nextFromState = Math.max(1, savedPage) + 1
  const fromItemsNext = fromItems > 0 ? fromItems + 1 : nextFromState

  /** Importação não sequencial: continuar após o último range visitado. */
  if (rangePage > fromItems + 3) {
    return rangePage + 1
  }

  /** lastPageNum inflado sem range coerente (grelha presa antiga). */
  if (fromItems >= 500 && Number(lastPageNum) > fromItems + 30 && rangePage <= fromItems + 5) {
    return fromItemsNext
  }
  return Math.max(nextFromState, fromItemsNext)
}

export function clampResumePage(items, lastPageNum) {
  const fromItems = items.length > 0 ? Math.max(1, Math.ceil(items.length / 20)) : 0
  if (fromItems > 5 && Number(lastPageNum) < fromItems - 3) {
    return fromItems
  }
  return Number(lastPageNum) || 0
}

export function loadResume(outDir, dataDir) {
  const exportPath = path.join(outDir, 'export.json')
  const statePath = path.join(outDir, 'import-state.json')
  const bibliotecaPath = path.join(dataDir, 'nonato-pecas-biblioteca.json')

  let items = []
  let lastPageNum = 0
  let lastRange = ''
  let apiMode = false
  let apiDoneBuckets = []

  if (fs.existsSync(statePath)) {
    try {
      const s = JSON.parse(fs.readFileSync(statePath, 'utf8'))
      lastPageNum = Number(s.lastPageNum) || 0
      lastRange = String(s.lastRange || '')
      apiMode = s.apiMode === true
      apiDoneBuckets = Array.isArray(s.apiDoneBuckets) ? s.apiDoneBuckets : []
    } catch {
      /* ignore */
    }
  }

  if (fs.existsSync(exportPath)) {
    try {
      const stat = fs.statSync(exportPath)
      if (stat.size > 80 * 1024 * 1024) {
        console.warn(
          `[HOMAG] export.json muito grande (${Math.round(stat.size / 1024 / 1024)} MB) — ignorado; usa data/nonato-pecas-biblioteca.json + import-state.`
        )
      } else {
        const j = JSON.parse(fs.readFileSync(exportPath, 'utf8'))
        if (Array.isArray(j.itens) && j.itens.length) items = j.itens
        if (!lastPageNum && j.lastPageNum) lastPageNum = Number(j.lastPageNum) || 0
        if (!lastRange && j.lastRange) lastRange = String(j.lastRange || '')
      }
    } catch (e) {
      console.warn(
        `[HOMAG] export.json ilegível ou demasiado grande (${e?.message || e}) — a usar biblioteca local + import-state.`
      )
    }
  }

  if (fs.existsSync(bibliotecaPath)) {
    try {
      const bib = JSON.parse(fs.readFileSync(bibliotecaPath, 'utf8'))
      if (Array.isArray(bib) && bib.length > items.length) {
        const fromBib = bib
          .filter((p) => p?.codigo && nucleoCodigoHomag(p.codigo))
          .map((p) => ({
            codigo: nucleoCodigoHomag(p.codigo) || String(p.codigo).trim(),
            nome: String(p.nome || p.descricao || p.codigo).trim(),
            descricao: String(p.descricao || p.nome || p.codigo).trim(),
            imagem: typeof p.imagem === 'string' && p.imagem.startsWith('data:') ? p.imagem : '',
            imagem_url: p.imagem_url || '',
            imagem_local: p.imagem_local || '',
            referenciasAlternativas: p.referenciasAlternativas || p.referenciasAntigas || [],
            codigosAlternativos: p.codigosAlternativos || p.codigosAntigos || [],
          }))
        if (fromBib.length > items.length) {
          items = fromBib
        }
      }
    } catch {
      /* ignore */
    }
  }

  if (!lastPageNum && items.length > 0) {
    lastPageNum = Math.ceil(items.length / 20)
  }

  const clamped = clampResumePage(items, lastPageNum)
  if (clamped !== lastPageNum && items.length >= 500) {
    console.warn(
      `[HOMAG] Estado corrigido: pág.${lastPageNum} → ${clamped} (${items.length} peças já na biblioteca — evita 1-a-1 desde pág.1)`
    )
    lastPageNum = clamped
  }

  const codigosVistos = new Set()
  for (const it of items) {
    for (const k of chavesDedupHomagPeca(it)) codigosVistos.add(k)
    const c = normCodigo(it.codigo)
    if (c) codigosVistos.add(c)
  }

  return { items, codigosVistos, lastPageNum, lastRange, exportPath, statePath, apiMode, apiDoneBuckets }
}

export function saveResume(statePath, exportPath, payload) {
  const { items, startUrl, pageNum, range, interactive, apiMode, apiDoneBuckets } = payload
  const floor = items.length >= 500 ? Math.max(1, Math.ceil(items.length / 20)) : 0
  const rangePage = parseRangePage(range).page || 0
  let savePage = rangePage > 0 ? rangePage : Number(pageNum) || 0

  if (floor > 0 && savePage < floor && rangePage === 0) {
    savePage = floor
  }
  /** Página inflada sem range (grelha presa antiga). */
  if (floor > 0 && savePage > floor + 250 && rangePage === 0) {
    savePage = floor
  }
  /** Nunca regredir o progresso de paginação guardado. */
  if (fs.existsSync(statePath)) {
    try {
      const prev = JSON.parse(fs.readFileSync(statePath, 'utf8'))
      const prevPage = Math.max(Number(prev.lastPageNum) || 0, parseRangePage(prev.lastRange || '').page || 0)
      if (prevPage > savePage) savePage = prevPage
    } catch {
      /* ignore */
    }
  }

  const stateObj = {
    lastPageNum: savePage,
    lastRange: range,
    totalItems: items.length,
    updated: new Date().toISOString(),
    apiMode: apiMode === true,
    apiDoneBuckets: Array.isArray(apiDoneBuckets) ? apiDoneBuckets : undefined,
    exportLite: shouldUseLiteExport(items),
  }

  /** Estado primeiro — se export.json falhar, a retoma API/DOM continua válida. */
  fs.writeFileSync(statePath, JSON.stringify(stateObj, null, 2), 'utf8')

  try {
    writeExportPayload(
      exportPath,
      {
        gerado_em: new Date().toISOString(),
        origem_url: startUrl,
        modo: interactive ? 'interativo' : 'automatico',
        total: items.length,
        lastPageNum: savePage,
        lastRange: range || '',
        em_progresso: true,
      },
      items
    )
  } catch (e) {
    console.warn(
      `[HOMAG] Aviso: export.json não gravado (${e?.message || e}). Estado guardado (${items.length} peças em memória).`
    )
  }
}

export function finalizeExport(exportPath, statePath, payload) {
  const { items, startUrl, interactive, pageNum, range } = payload
  try {
    writeExportPayload(
      exportPath,
      {
        gerado_em: new Date().toISOString(),
        origem_url: startUrl,
        modo: interactive ? 'interativo' : 'automatico',
        total: items.length,
        lastPageNum: pageNum || Math.ceil(items.length / 20),
        lastRange: range || '',
        em_progresso: false,
      },
      items
    )
  } catch (e) {
    console.warn(`[HOMAG] finalizeExport: ${e?.message || e}`)
  }
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath)
}

export async function skipToPage(page, targetPage, opts = {}) {
  if (targetPage <= 1) return 1
  /** Salto de navegação: só range, sem resync 1-a-1 (evita loop 250→253). */
  return jumpToHomagPage(page, targetPage, { fast: opts.fast !== false, sync: false })
}
