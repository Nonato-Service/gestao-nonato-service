/** Peça mínima para fundir listas servidor + local sem perder cadastros recentes após deploy/sync. */
export type PecaBibliotecaMerge = {
  id: string
  codigo?: string
  dataCriacao?: string
  [key: string]: unknown
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

/**
 * Funde catálogo do servidor com cópia local: união por id; em conflito de id fica a entrada mais recente.
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
    if (parseDataCriacaoMs(p.dataCriacao) >= parseDataCriacaoMs(existing.dataCriacao)) {
      byId.set(id, p)
    }
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

  return Array.from(byId.values())
}

export function pecasBibliotecaArraysDiffer(a: unknown, b: unknown): boolean {
  try {
    return JSON.stringify(a) !== JSON.stringify(b)
  } catch {
    return true
  }
}
