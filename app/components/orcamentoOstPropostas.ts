/** Propostas de orçamento de serviço técnico (guardadas com saveData / servidor). */

export const OST_PROPOSTAS_STORAGE_KEY = 'nonato-ost-propostas-tecnico-v1'

/** Rascunho em curso (auto-guardado) — evita perder linhas ao mudar de separador ou recarregar. */
export const OST_RASCUNHO_ATUAL_KEY = 'nonato-ost-rascunho-atual-v1'

export type OstPropostaLinha = { rowId: string; servicoId: string; quantidadeStr: string }

export type OstPropostaPayload = {
  clienteId: string
  clienteManual: string
  refDoc: string
  localServico: string
  dataDoc: string
  validade: string
  intro: string
  clausulas: string
  linhas: OstPropostaLinha[]
}

export type OstPropostaSalva = {
  id: string
  nome: string
  criadoEm: string
  atualizadoEm: string
  payload: OstPropostaPayload
}

function parseLista(raw: unknown): OstPropostaSalva[] {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw.filter((x) => x && typeof (x as OstPropostaSalva).id === 'string' && (x as OstPropostaSalva).payload) as OstPropostaSalva[]
  }
  return []
}

export async function loadOstPropostas(loadData?: (key: string, fromServer?: boolean) => Promise<unknown>): Promise<OstPropostaSalva[]> {
  if (loadData) {
    try {
      const v = await loadData(OST_PROPOSTAS_STORAGE_KEY, true)
      return parseLista(v)
    } catch {
      return []
    }
  }
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(OST_PROPOSTAS_STORAGE_KEY)
    if (!raw) return []
    return parseLista(JSON.parse(raw))
  } catch {
    return []
  }
}

export async function saveOstPropostas(
  lista: OstPropostaSalva[],
  saveData?: (key: string, value: unknown) => Promise<void>
): Promise<void> {
  if (saveData) {
    await saveData(OST_PROPOSTAS_STORAGE_KEY, lista)
    return
  }
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(OST_PROPOSTAS_STORAGE_KEY, JSON.stringify(lista))
  } catch {
    /* ignore */
  }
}

export type OstRascunhoAtual = OstPropostaPayload & {
  v: 1
  propostaEditandoId: string | null
  propostaNome: string
  guardadoEm: string
}

function parseRascunho(raw: unknown): OstRascunhoAtual | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Partial<OstRascunhoAtual>
  if (o.v !== 1 || !Array.isArray(o.linhas)) return null
  return {
    v: 1,
    clienteId: String(o.clienteId || ''),
    clienteManual: String(o.clienteManual || ''),
    refDoc: String(o.refDoc || ''),
    localServico: String(o.localServico || ''),
    dataDoc: String(o.dataDoc || new Date().toISOString().slice(0, 10)),
    validade: String(o.validade || ''),
    intro: String(o.intro || ''),
    clausulas: String(o.clausulas || ''),
    linhas: o.linhas
      .filter((L) => L && typeof L === 'object')
      .map((L) => ({
        rowId: String((L as OstPropostaLinha).rowId || ''),
        servicoId: String((L as OstPropostaLinha).servicoId || ''),
        quantidadeStr: String((L as OstPropostaLinha).quantidadeStr ?? '1'),
      })),
    propostaEditandoId: o.propostaEditandoId ? String(o.propostaEditandoId) : null,
    propostaNome: String(o.propostaNome || ''),
    guardadoEm: String(o.guardadoEm || ''),
  }
}

export function loadOstRascunhoAtualSession(): OstRascunhoAtual | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(OST_RASCUNHO_ATUAL_KEY)
    if (!raw) return null
    return parseRascunho(JSON.parse(raw))
  } catch {
    return null
  }
}

export async function loadOstRascunhoAtual(
  loadData?: (key: string, fromServer?: boolean) => Promise<unknown>
): Promise<OstRascunhoAtual | null> {
  const fromSession = loadOstRascunhoAtualSession()
  if (fromSession) return fromSession
  if (loadData) {
    try {
      const v = await loadData(OST_RASCUNHO_ATUAL_KEY, false)
      return parseRascunho(v)
    } catch {
      return null
    }
  }
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(OST_RASCUNHO_ATUAL_KEY)
    if (!raw) return null
    return parseRascunho(JSON.parse(raw))
  } catch {
    return null
  }
}

export async function saveOstRascunhoAtual(
  rascunho: OstRascunhoAtual,
  saveData?: (key: string, value: unknown) => Promise<void>
): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(OST_RASCUNHO_ATUAL_KEY, JSON.stringify(rascunho))
    } catch {
      /* ignore */
    }
  }
  if (saveData) {
    try {
      await saveData(OST_RASCUNHO_ATUAL_KEY, rascunho)
    } catch {
      /* ignore */
    }
    return
  }
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(OST_RASCUNHO_ATUAL_KEY, JSON.stringify(rascunho))
  } catch {
    /* ignore */
  }
}

export async function clearOstRascunhoAtual(
  saveData?: (key: string, value: unknown) => Promise<void>
): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(OST_RASCUNHO_ATUAL_KEY)
    } catch {
      /* ignore */
    }
  }
  if (saveData) {
    try {
      await saveData(OST_RASCUNHO_ATUAL_KEY, null)
    } catch {
      /* ignore */
    }
  }
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(OST_RASCUNHO_ATUAL_KEY)
  } catch {
    /* ignore */
  }
}
