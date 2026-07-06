/** Tipos mínimos para merge de clientes/equipamentos entre local e servidor. */
export type EquipamentoClienteMerge = {
  id?: string
  numeroSerie?: string
  modelo?: string
  tipoEquipamento?: string
  marca?: string
  [key: string]: unknown
}

export type ClienteMerge = {
  id: string
  equipamentos?: EquipamentoClienteMerge[]
  [key: string]: unknown
}

export function equipamentoClienteDedupeKey(e: EquipamentoClienteMerge): string {
  const s = String(e?.numeroSerie ?? '').trim()
  if (s) return `s:${s}`
  const id = String(e?.id ?? '').trim()
  if (id) return `i:${id}`
  return `h:${JSON.stringify({ m: e?.modelo, t: e?.tipoEquipamento })}`
}

export function mergeEquipamentosClienteLists(
  serverEq: EquipamentoClienteMerge[] | undefined,
  localEq: EquipamentoClienteMerge[] | undefined
): EquipamentoClienteMerge[] {
  const sm = Array.isArray(serverEq) ? serverEq : []
  const lm = Array.isArray(localEq) ? localEq : []
  const by = new Map<string, EquipamentoClienteMerge>()
  for (const e of lm) by.set(equipamentoClienteDedupeKey(e), e)
  for (const e of sm) by.set(equipamentoClienteDedupeKey(e), e)
  return Array.from(by.values())
}

/** Funde listas de clientes: campos do servidor prevalecem; equipamentos = união por n.º de série. */
export function mergeNonatoClientesDeferServerLocal(
  serverList: unknown,
  localList: unknown
): ClienteMerge[] {
  if (!Array.isArray(serverList)) return Array.isArray(localList) ? (localList as ClienteMerge[]) : []
  if (!Array.isArray(localList)) return serverList as ClienteMerge[]
  const srv = serverList as ClienteMerge[]
  const loc = localList as ClienteMerge[]
  const localById = new Map(loc.map((c) => [c.id, c]))
  const serverIds = new Set(srv.map((c) => c.id))
  const out: ClienteMerge[] = []
  for (const sc of srv) {
    const lc = localById.get(sc.id)
    if (!lc) {
      out.push(sc)
    } else {
      out.push({
        ...lc,
        ...sc,
        equipamentos: mergeEquipamentosClienteLists(
          sc.equipamentos as EquipamentoClienteMerge[] | undefined,
          lc.equipamentos as EquipamentoClienteMerge[] | undefined
        ),
      })
    }
  }
  for (const lc of loc) {
    if (!serverIds.has(lc.id)) out.push(lc)
  }
  return out
}
