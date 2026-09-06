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
  // ID primeiro: ao editar e mudar n.º de série, o mesmo equipamento não pode virar 2 entradas no merge/sync.
  // Placeholder 0000000000 NÃO conta como ID — cai para série real ou chave fraca.
  const id = String(e?.id ?? '').trim()
  if (id && !/^0+$/.test(id)) return `i:${id}`
  const s = String(e?.numeroSerie ?? '').trim()
  if (s && !/^0+$/.test(s)) return `s:${s}`
  return `h:${JSON.stringify({ m: e?.modelo, t: e?.tipoEquipamento, b: e?.marca })}`
}

function isEquipamentoClienteMergeEntry(
  e: unknown
): e is EquipamentoClienteMerge {
  return e != null && typeof e === 'object'
}

function serialNormEquipamento(e: EquipamentoClienteMerge): string {
  const s = String(e?.numeroSerie ?? '')
    .trim()
    .toLowerCase()
  // 0000000000 / só-zeros não é série real — não usar como chave de merge/dedupe.
  if (!s || /^0+$/.test(s)) return ''
  return s
}

/** Prefere UUID técnico / registo mais completo face a ID de armazém fantasma (ex. 0000000000). */
export function preferEquipamentoClienteMerge(
  a: EquipamentoClienteMerge,
  b: EquipamentoClienteMerge
): EquipamentoClienteMerge {
  const idA = String(a?.id ?? '').trim()
  const idB = String(b?.id ?? '').trim()
  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89abAB][0-9a-f]{3}-[0-9a-f]{12}$/i
  const eqc = (id: string) => /^eqc-/i.test(id)
  const zeros = (id: string) => /^0+$/.test(id)
  const score = (id: string) => {
    if (!id) return 0
    if (zeros(id)) return 1
    if (eqc(id) || uuidRe.test(id)) return 4
    if (/^\d+$/.test(id) && id.length <= 12) return 2
    return 3
  }
  const sa = score(idA)
  const sb = score(idB)
  if (sa !== sb) return sa > sb ? a : b
  const filled = (e: EquipamentoClienteMerge) =>
    [e.modelo, e.marca, e.tipoEquipamento, e.numeroSerie].filter((x) => String(x ?? '').trim()).length
  return filled(a) >= filled(b) ? a : b
}

/**
 * Colapsa duplicados da mesma série (IDs diferentes) — típico do bug edição→duplicado armazém/técnico.
 * Sem série (ou só-zeros): dedupe só por ID real; sem ID mantém entradas distintas (não funde por modelo).
 */
export function dedupeEquipamentosClientePorSerie(
  list: EquipamentoClienteMerge[]
): EquipamentoClienteMerge[] {
  const bySerial = new Map<string, EquipamentoClienteMerge>()
  const byIdSemSerie = new Map<string, EquipamentoClienteMerge>()
  const semSerieSemId: EquipamentoClienteMerge[] = []
  for (const e of list) {
    const s = serialNormEquipamento(e)
    if (!s) {
      const id = String(e?.id ?? '').trim()
      if (id && !/^0+$/.test(id)) {
        const prev = byIdSemSerie.get(id)
        byIdSemSerie.set(id, prev ? preferEquipamentoClienteMerge(prev, e) : e)
      } else {
        semSerieSemId.push(e)
      }
      continue
    }
    const prev = bySerial.get(s)
    bySerial.set(s, prev ? preferEquipamentoClienteMerge(prev, e) : e)
  }
  return [...byIdSemSerie.values(), ...semSerieSemId, ...bySerial.values()]
}

/**
 * Une equipamentos local/servidor.
 * - Mesmo ID: campos do servidor prevalecem.
 * - Mesma série com IDs diferentes: mantém o local (não ressuscita duplicado apagado no aparelho).
 * - Série nova só no servidor: adiciona (outro dispositivo).
 * No fim, colapsa residual por série.
 */
export function mergeEquipamentosClienteLists(
  serverEq: EquipamentoClienteMerge[] | undefined,
  localEq: EquipamentoClienteMerge[] | undefined
): EquipamentoClienteMerge[] {
  const sm = (Array.isArray(serverEq) ? serverEq : []).filter(isEquipamentoClienteMergeEntry)
  const lm = (Array.isArray(localEq) ? localEq : []).filter(isEquipamentoClienteMergeEntry)

  if (lm.length === 0) return dedupeEquipamentosClientePorSerie(sm)
  if (sm.length === 0) return dedupeEquipamentosClientePorSerie(lm)

  const byId = new Map<string, EquipamentoClienteMerge>()
  const serialToKey = new Map<string, string>()

  const rememberSerial = (e: EquipamentoClienteMerge, key: string) => {
    const s = serialNormEquipamento(e)
    if (s) serialToKey.set(s, key)
  }

  for (const e of lm) {
    const k = equipamentoClienteDedupeKey(e)
    byId.set(k, e)
    rememberSerial(e, k)
  }

  for (const e of sm) {
    const k = equipamentoClienteDedupeKey(e)
    const s = serialNormEquipamento(e)
    if (byId.has(k)) {
      byId.set(k, { ...byId.get(k)!, ...e })
      rememberSerial(e, k)
      continue
    }
    // Mesma série, IDs diferentes: ficar com o melhor (UUID > código > zeros),
    // senão o fantasma 0000000000 local bloqueava o UUID correcto do servidor (ou vice-versa).
    if (s && serialToKey.has(s)) {
      const prevKey = serialToKey.get(s)!
      const prev = byId.get(prevKey)
      if (!prev) {
        byId.set(k, e)
        rememberSerial(e, k)
        continue
      }
      const preferred = preferEquipamentoClienteMerge(prev, e)
      if (preferred === prev) continue
      byId.delete(prevKey)
      const newKey = equipamentoClienteDedupeKey(preferred)
      byId.set(newKey, preferred)
      rememberSerial(preferred, newKey)
      continue
    }
    byId.set(k, e)
    rememberSerial(e, k)
  }

  return dedupeEquipamentosClientePorSerie(Array.from(byId.values()))
}

/** Funde listas de clientes: campos do servidor prevalecem; equipamentos = união inteligente local/servidor. */
export function mergeNonatoClientesDeferServerLocal(
  serverList: unknown,
  localList: unknown
): ClienteMerge[] {
  if (!Array.isArray(serverList)) return Array.isArray(localList) ? (localList as ClienteMerge[]) : []
  if (!Array.isArray(localList)) return serverList as ClienteMerge[]
  const srv = (serverList as ClienteMerge[]).filter(
    (c): c is ClienteMerge => c != null && typeof c === 'object' && String(c.id ?? '').trim() !== ''
  )
  const loc = (localList as ClienteMerge[]).filter(
    (c): c is ClienteMerge => c != null && typeof c === 'object' && String(c.id ?? '').trim() !== ''
  )
  const localById = new Map(loc.map((c) => [c.id, c]))
  const serverIds = new Set(srv.map((c) => c.id))
  const out: ClienteMerge[] = []
  for (const sc of srv) {
    const lc = localById.get(sc.id)
    if (!lc) {
      out.push({
        ...sc,
        equipamentos: mergeEquipamentosClienteLists(sc.equipamentos, undefined),
      })
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
    if (!serverIds.has(lc.id)) {
      out.push({
        ...lc,
        equipamentos: mergeEquipamentosClienteLists(undefined, lc.equipamentos),
      })
    }
  }
  return out
}
