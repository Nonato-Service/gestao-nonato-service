/** Funde listas por `id`: campos do servidor prevalecem; itens só locais são mantidos. */
export function mergeArraysByIdDeferServerLocal<T extends { id?: unknown }>(
  serverList: unknown,
  localList: unknown
): T[] {
  if (!Array.isArray(serverList)) return Array.isArray(localList) ? (localList as T[]) : []
  if (!Array.isArray(localList)) return serverList as T[]
  const srv = serverList as T[]
  const loc = localList as T[]
  const localById = new Map<string, T>()
  for (const item of loc) {
    const id = String(item?.id ?? '').trim()
    if (id) localById.set(id, item)
  }
  const serverIds = new Set<string>()
  const out: T[] = []
  for (const sc of srv) {
    const id = String(sc?.id ?? '').trim()
    if (id) serverIds.add(id)
    const lc = id ? localById.get(id) : undefined
    out.push(lc ? ({ ...lc, ...sc } as T) : sc)
  }
  for (const lc of loc) {
    const id = String(lc?.id ?? '').trim()
    if (id && !serverIds.has(id)) out.push(lc)
  }
  return out
}
