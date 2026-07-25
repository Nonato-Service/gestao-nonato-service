/** Peça mínima para fundir listas servidor + local sem perder cadastros recentes após deploy/sync. */
export type PecaBibliotecaMerge = {
  id: string
  codigo?: string
  dataCriacao?: string
  dataAtualizacao?: string
  categoriaId?: string
  categoria?: string
  subcategoriaId?: string
  subcategoria?: string
  numeroSequenciaGrupo?: string
  imagem?: string
  imagemCapa?: string
  [key: string]: unknown
}

function normalizeImportKey(v: unknown): string {
  return String(v ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

/** Variantes do código para detetar duplicados (espaços, pontuação, zeros à esquerda). */
export function variantesCodigoPecaBiblioteca(codigo: string | undefined | null): string[] {
  const norm = normalizeImportKey(codigo)
  if (!norm) return []
  const out = new Set<string>([norm])
  const compact = norm.replace(/[^a-z0-9]/g, '')
  if (compact && compact !== norm && compact.length >= 3) {
    out.add(compact)
  }
  if (/^\d+$/.test(compact) && compact.length >= 5) {
    const semZeros = compact.replace(/^0+/, '') || compact
    if (semZeros !== compact) out.add(semZeros)
  }
  return [...out]
}

function normalizeCodigoPeca(codigo: string | undefined | null): string {
  return String(codigo ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
}

function parseDataCriacaoMs(dataCriacao?: string): number {
  const n = Date.parse(String(dataCriacao ?? ''))
  return Number.isFinite(n) ? n : 0
}

export function pecaRevisionScore(p: PecaBibliotecaMerge): number {
  const updated = parseDataCriacaoMs(String(p.dataAtualizacao ?? ''))
  const created = parseDataCriacaoMs(p.dataCriacao)
  return Math.max(updated, created)
}

function temImagemBase64Peca(p: PecaBibliotecaMerge): boolean {
  const img = p.imagem
  return typeof img === 'string' && img.startsWith('data:') && img.length > 100
}

/** Funde dois registos da mesma peça — prioriza classificação e revisão mais recente. */
export function mergePecaBibliotecaFields(
  a: PecaBibliotecaMerge,
  b: PecaBibliotecaMerge
): PecaBibliotecaMerge {
  const scoreA = pecaRevisionScore(a)
  const scoreB = pecaRevisionScore(b)
  const newer = scoreB >= scoreA ? b : a
  const older = scoreB >= scoreA ? a : b
  const out: PecaBibliotecaMerge = { ...older, ...newer }

  const newerCat = String(newer.categoriaId ?? '').trim()
  const olderCat = String(older.categoriaId ?? '').trim()
  if (!newerCat && olderCat) {
    out.categoriaId = older.categoriaId
    out.categoria = older.categoria
    out.subcategoriaId = older.subcategoriaId
    out.subcategoria = older.subcategoria
    if (older.numeroSequenciaGrupo !== undefined) {
      out.numeroSequenciaGrupo = older.numeroSequenciaGrupo
    }
  }

  if (!temImagemBase64Peca(newer) && temImagemBase64Peca(older)) {
    out.imagem = older.imagem
  }
  if (!out.imagemCapa && older.imagemCapa) {
    out.imagemCapa = older.imagemCapa
  }

  out.dataAtualizacao =
    pecaRevisionScore(out) === scoreB ? String(newer.dataAtualizacao ?? '') : String(older.dataAtualizacao ?? '')
  if (!out.dataAtualizacao) {
    delete out.dataAtualizacao
  }

  return out
}

/** Remove duplicados por código — mantém classificação e dados mais recentes em vez de descartar. */
export function deduplicarPecasBibliotecaPorCodigo<T extends PecaBibliotecaMerge>(pecas: T[]): T[] {
  const byKey = new Map<string, T>()
  const variantToKey = new Map<string, string>()

  for (const peca of pecas) {
    const variantes = variantesCodigoPecaBiblioteca(peca.codigo)
    let key: string | null = null
    for (const v of variantes) {
      const existingKey = variantToKey.get(v)
      if (existingKey) {
        key = existingKey
        break
      }
    }
    if (!key) key = String(peca.id)

    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, peca)
      for (const v of variantes) variantToKey.set(v, key)
      continue
    }

    const merged = mergePecaBibliotecaFields(existing, peca) as T
    byKey.set(key, merged)
    for (const v of variantes) variantToKey.set(v, key)
  }

  return Array.from(byKey.values())
}

/**
 * Funde catálogo do servidor com cópia local: união por id; em conflito fica a entrada mais recente.
 * Peças só locais (ex.: gravadas antes do save no servidor completar) mantêm-se.
 */
export function mergePecasBibliotecaArrays(
  server: unknown,
  local: unknown
): PecaBibliotecaMerge[] {
  const srv = (Array.isArray(server) ? server : []) as PecaBibliotecaMerge[]
  const loc = (Array.isArray(local) ? local : []) as PecaBibliotecaMerge[]

  if (loc.length === 0) return srv
  if (srv.length === 0) return loc

  const byId = new Map<string, PecaBibliotecaMerge>()

  for (const p of srv) {
    if (p && typeof p === 'object' && p.id) byId.set(String(p.id), p)
  }

  for (const p of loc) {
    if (!p || typeof p !== 'object' || !p.id) continue
    const id = String(p.id)
    const existing = byId.get(id)
    if (!existing) {
      byId.set(id, p)
      continue
    }
    byId.set(id, mergePecaBibliotecaFields(existing, p))
  }

  const codigoPrincipal = new Map<string, string>()
  for (const p of byId.values()) {
    const c = normalizeCodigoPeca(p.codigo)
    if (c) codigoPrincipal.set(c, String(p.id))
  }

  for (const p of loc) {
    if (!p?.id || byId.has(String(p.id))) continue
    const c = normalizeCodigoPeca(p.codigo)
    if (c && codigoPrincipal.has(c)) continue
    byId.set(String(p.id), p)
    if (c) codigoPrincipal.set(c, String(p.id))
  }

  return deduplicarPecasBibliotecaPorCodigo(Array.from(byId.values()))
}

export function pecasBibliotecaArraysDiffer(a: unknown, b: unknown): boolean {
  try {
    return JSON.stringify(a) !== JSON.stringify(b)
  } catch {
    return true
  }
}
