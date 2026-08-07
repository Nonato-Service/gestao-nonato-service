/** IDs de relatórios especiais eliminados — evita que a sync/outro aparelho os ressuscite. */

export const RELATORIOS_ESPECIAIS_DELETED_IDS_KEY = 'nonato-relatorios-especiais-deleted-ids'

export function normalizeDeletedIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out = new Set<string>()
  for (const x of raw) {
    const id = String(x ?? '').trim()
    if (id) out.add(id)
  }
  return [...out]
}

export function mergeDeletedIds(a: unknown, b: unknown): string[] {
  return normalizeDeletedIds([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])])
}

export function filterByDeletedIds<T extends { id?: unknown }>(list: T[], deleted: unknown): T[] {
  const ban = new Set(normalizeDeletedIds(deleted))
  if (ban.size === 0) return Array.isArray(list) ? list : []
  return (Array.isArray(list) ? list : []).filter((r) => !ban.has(String(r?.id ?? '').trim()))
}

/** Lê tombstones do localStorage (não usar getData do bootstrap — só existe dentro de loadAllData). */
export function readDeletedIdsFromLocalStorage(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RELATORIOS_ESPECIAIS_DELETED_IDS_KEY)
    if (raw == null || raw === '') return []
    return normalizeDeletedIds(JSON.parse(raw) as unknown)
  } catch {
    return []
  }
}
