/**
 * Backup JSON dedicado da Biblioteca de Peças (códigos, preços, categorias, imagens).
 * Exporta/importa sem misturar com sync completo nem wipe silencioso.
 */

import type { CategoriaPeca, PecaBiblioteca, SubcategoriaPeca } from './pecaTipos'
import { mergePecasBibliotecaArrays, type PecaBibliotecaMerge } from './merge'

export const PECAS_BIBLIOTECA_STORAGE_KEY = 'nonato-pecas-biblioteca'
export const CATEGORIAS_PECAS_STORAGE_KEY = 'nonato-categorias-pecas'
export const SUBCATEGORIAS_PECAS_STORAGE_KEY = 'nonato-subcategorias-pecas'

export const PECAS_BACKUP_TYPE = 'nonato-pecas-biblioteca-backup'
export const PECAS_BACKUP_VERSION = 1 as const

export type PecasBackupPayload = {
  version: typeof PECAS_BACKUP_VERSION
  type: typeof PECAS_BACKUP_TYPE
  exportedAt: string
  key: typeof PECAS_BIBLIOTECA_STORAGE_KEY
  pecas: PecaBiblioteca[]
  categorias: CategoriaPeca[]
  subcategorias: SubcategoriaPeca[]
  stats: {
    pecas: number
    comImagemBase64: number
    categorias: number
    subcategorias: number
  }
}

export type ParsedPecasBackup = {
  pecas: PecaBiblioteca[]
  categorias: CategoriaPeca[]
  subcategorias: SubcategoriaPeca[]
  exportedAt?: string
}

function asPeca(row: unknown): PecaBiblioteca | null {
  if (!row || typeof row !== 'object') return null
  const p = row as Record<string, unknown>
  const id = String(p.id ?? '').trim()
  if (!id) return null
  return { ...(p as PecaBiblioteca), id }
}

function asCategoria(row: unknown): CategoriaPeca | null {
  if (!row || typeof row !== 'object') return null
  const c = row as Record<string, unknown>
  const id = String(c.id ?? '').trim()
  const nome = String(c.nome ?? '').trim()
  if (!id) return null
  return { id, nome }
}

function asSubcategoria(row: unknown): SubcategoriaPeca | null {
  if (!row || typeof row !== 'object') return null
  const s = row as Record<string, unknown>
  const id = String(s.id ?? '').trim()
  const nome = String(s.nome ?? '').trim()
  const categoriaId = String(s.categoriaId ?? '').trim()
  if (!id) return null
  return { id, nome, categoriaId }
}

export function countPecasComImagemBase64(pecas: unknown[]): number {
  let n = 0
  for (const row of pecas) {
    if (!row || typeof row !== 'object') continue
    const img = (row as { imagem?: unknown }).imagem
    const capa = (row as { imagemCapa?: unknown }).imagemCapa
    const hasImg = typeof img === 'string' && img.startsWith('data:') && img.length > 100
    const hasCapa = typeof capa === 'string' && capa.startsWith('data:') && capa.length > 100
    if (hasImg || hasCapa) n += 1
  }
  return n
}

/** Une catálogo em memória com o carregado do servidor/disco — prioriza imagens base64. */
export function enrichPecasParaBackup(
  memory: unknown,
  fromStorage: unknown
): PecaBiblioteca[] {
  const merged = mergePecasBibliotecaArrays(fromStorage, memory) as PecaBibliotecaMerge[]
  return merged.map((p) => ({ ...(p as PecaBiblioteca) }))
}

export function buildPecasBackupPayload(input: {
  pecas: PecaBiblioteca[]
  categorias: CategoriaPeca[]
  subcategorias: SubcategoriaPeca[]
  exportedAt?: string
}): PecasBackupPayload {
  const pecas = Array.isArray(input.pecas) ? input.pecas : []
  const categorias = Array.isArray(input.categorias) ? input.categorias : []
  const subcategorias = Array.isArray(input.subcategorias) ? input.subcategorias : []
  return {
    version: PECAS_BACKUP_VERSION,
    type: PECAS_BACKUP_TYPE,
    exportedAt: input.exportedAt || new Date().toISOString(),
    key: PECAS_BIBLIOTECA_STORAGE_KEY,
    pecas,
    categorias,
    subcategorias,
    stats: {
      pecas: pecas.length,
      comImagemBase64: countPecasComImagemBase64(pecas),
      categorias: categorias.length,
      subcategorias: subcategorias.length,
    },
  }
}

export function pecasBackupFileName(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `nonato-pecas-backup-${y}-${m}-${d}.json`
}

/** Aceita payload tipado ou array cru de peças (legado). */
export function parsePecasBackupJson(raw: unknown): ParsedPecasBackup | null {
  if (Array.isArray(raw)) {
    const pecas = raw.map(asPeca).filter(Boolean) as PecaBiblioteca[]
    if (pecas.length === 0) return null
    return { pecas, categorias: [], subcategorias: [] }
  }
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  const pecasSrc = Array.isArray(obj.pecas) ? obj.pecas : Array.isArray(obj.data) ? obj.data : null
  if (!pecasSrc) return null
  const pecas = pecasSrc.map(asPeca).filter(Boolean) as PecaBiblioteca[]
  if (pecas.length === 0) return null
  const categorias = (Array.isArray(obj.categorias) ? obj.categorias : [])
    .map(asCategoria)
    .filter(Boolean) as CategoriaPeca[]
  const subcategorias = (Array.isArray(obj.subcategorias) ? obj.subcategorias : [])
    .map(asSubcategoria)
    .filter(Boolean) as SubcategoriaPeca[]
  const exportedAt = typeof obj.exportedAt === 'string' ? obj.exportedAt : undefined
  return { pecas, categorias, subcategorias, exportedAt }
}

export function mergeCategoriasPecas(
  current: CategoriaPeca[],
  incoming: CategoriaPeca[]
): CategoriaPeca[] {
  const byId = new Map<string, CategoriaPeca>()
  for (const c of current) {
    if (c?.id) byId.set(String(c.id), c)
  }
  for (const c of incoming) {
    if (!c?.id) continue
    const id = String(c.id)
    const prev = byId.get(id)
    byId.set(id, prev ? { ...prev, ...c, nome: c.nome?.trim() || prev.nome } : c)
  }
  return Array.from(byId.values())
}

export function mergeSubcategoriasPecas(
  current: SubcategoriaPeca[],
  incoming: SubcategoriaPeca[]
): SubcategoriaPeca[] {
  const byId = new Map<string, SubcategoriaPeca>()
  for (const s of current) {
    if (s?.id) byId.set(String(s.id), s)
  }
  for (const s of incoming) {
    if (!s?.id) continue
    const id = String(s.id)
    const prev = byId.get(id)
    byId.set(
      id,
      prev
        ? {
            ...prev,
            ...s,
            nome: s.nome?.trim() || prev.nome,
            categoriaId: s.categoriaId?.trim() || prev.categoriaId,
          }
        : s
    )
  }
  return Array.from(byId.values())
}

export type ApplyPecasBackupMode = 'merge' | 'replace'

export function applyPecasBackupImport(input: {
  mode: ApplyPecasBackupMode
  currentPecas: PecaBiblioteca[]
  currentCategorias: CategoriaPeca[]
  currentSubcategorias: SubcategoriaPeca[]
  incoming: ParsedPecasBackup
}): {
  pecas: PecaBiblioteca[]
  categorias: CategoriaPeca[]
  subcategorias: SubcategoriaPeca[]
} | null {
  const { mode, incoming } = input
  if (!incoming.pecas.length) return null

  if (mode === 'replace') {
    return {
      pecas: incoming.pecas,
      categorias:
        incoming.categorias.length > 0
          ? incoming.categorias
          : input.currentCategorias,
      subcategorias:
        incoming.subcategorias.length > 0
          ? incoming.subcategorias
          : input.currentSubcategorias,
    }
  }

  // merge: servidor/importado fundido com local; classificação local preferida quando existir
  const pecas = mergePecasBibliotecaArrays(incoming.pecas, input.currentPecas) as PecaBiblioteca[]
  return {
    pecas,
    categorias: mergeCategoriasPecas(input.currentCategorias, incoming.categorias),
    subcategorias: mergeSubcategoriasPecas(input.currentSubcategorias, incoming.subcategorias),
  }
}

export function downloadJsonBlob(fileName: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}
