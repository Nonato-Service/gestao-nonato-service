import type {
  RelatorioEquipamentoOrigem,
  RelatorioEquipamentoRef,
} from '../relatorio-servico/equipamentoRelatorioForm'
import { normalizarEquipamentoOrigem } from '../relatorio-servico/equipamentoRelatorioForm'
export type {
  RelatorioEquipamentoOrigem,
  RelatorioEquipamentoRef,
} from '../relatorio-servico/equipamentoRelatorioForm'
export {
  criarEquipamentoRelatorioVazio,
  normalizarEquipamentoOrigem,
  clientesExternosParaEquipamentoRelatorio,
} from '../relatorio-servico/equipamentoRelatorioForm'

export type EquipamentoArmazemIdLookup = { id?: string; numeroSerie?: string }

export type EquipamentoArmazemBaixaLookup = EquipamentoArmazemIdLookup & {
  status?: 'ativo' | 'baixado'
  modelo?: string
  marca?: string
  motivoBaixa?: string
  dataBaixa?: string
  historico?: Array<{
    id: string
    data: string
    tipo: 'manutencao' | 'reparo' | 'inspecao' | 'transferencia' | 'baixa' | 'outro'
    descricao: string
    responsavel?: string
    observacoes?: string
  }>
}

export type EquipamentoArmazemVendidoInfo = {
  id: string
  modelo?: string
  marca?: string
}

export const MOTIVO_BAIXA_EQUIPAMENTO_VENDIDO = 'vendido' as const
export const TEXTO_EQUIPAMENTO_VENDIDO = 'EQUIPAMENTO VENDIDO'

export function normalizarChaveIdEquipamento(valor: string | undefined): string {
  return String(valor ?? '').trim().toLowerCase()
}

export function equipamentoArmazemEstaAtivo(e: { status?: string }): boolean {
  return (e.status || 'ativo') !== 'baixado'
}

export function coletarIdsComparacaoEquipamentoCliente(
  eq: RelatorioEquipamentoRef,
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = []
): string[] {
  const ids = new Set<string>()
  const idEq = String(eq.equipamentoId ?? '').trim()
  const sn = String(eq.numeroMaquina ?? '').trim()
  if (idEq) ids.add(normalizarChaveIdEquipamento(idEq))
  if (sn) ids.add(normalizarChaveIdEquipamento(sn))
  const vis = resolverIdEquipamentoVisivelRelatorio(eq, equipamentosArmazem)
  if (vis) ids.add(normalizarChaveIdEquipamento(vis))
  return [...ids].filter(Boolean)
}

export function chavesEquipamentoArmazem(e: EquipamentoArmazemIdLookup): string[] {
  return [e.id, e.numeroSerie].map(normalizarChaveIdEquipamento).filter(Boolean)
}

export function encontrarEquipamentoArmazemCorrespondenteCliente(
  eq: RelatorioEquipamentoRef,
  equipamentosArmazem: EquipamentoArmazemBaixaLookup[]
): EquipamentoArmazemBaixaLookup | null {
  if (eq.equipamentoOrigem !== 'cliente' && eq.equipamentoOrigem !== 'clientes-externos') return null
  const chavesCliente = coletarIdsComparacaoEquipamentoCliente(eq, equipamentosArmazem)
  if (chavesCliente.length === 0) return null

  return (
    equipamentosArmazem.find((wh) => {
      if (!equipamentoArmazemEstaAtivo(wh)) return false
      const chavesWh = chavesEquipamentoArmazem(wh)
      return chavesWh.some((ch) => chavesCliente.includes(ch))
    }) ?? null
  )
}

export function aplicarBaixaVendaEquipamentosArmazemRelatorio<
  T extends EquipamentoArmazemBaixaLookup
>(
  relatorio: RelatorioServicoEquipamentosHost & {
    data?: string
    numero?: string
    cliente?: string
    tecnico?: string
  },
  equipamentosArmazem: T[]
): { equipamentos: T[]; vendidos: EquipamentoArmazemVendidoInfo[] } {
  const list = equipamentosRelatorioPreenchidos(normalizarEquipamentosRelatorio(relatorio))
  const vendidos: EquipamentoArmazemVendidoInfo[] = []
  const idsBaixados = new Set<string>()
  let equipamentos = equipamentosArmazem
  const dataBaixa = String(relatorio.data ?? '').trim() || new Date().toISOString().split('T')[0]
  const obsRelatorio = [
    relatorio.numero ? `Relatório n.º ${relatorio.numero}` : '',
    relatorio.cliente ? `Cliente: ${relatorio.cliente}` : '',
  ]
    .filter(Boolean)
    .join(' · ')

  for (const eq of list) {
    const match = encontrarEquipamentoArmazemCorrespondenteCliente(eq, equipamentos)
    if (!match?.id || idsBaixados.has(match.id)) continue

    idsBaixados.add(match.id)
    vendidos.push({
      id: match.id,
      modelo: match.modelo,
      marca: match.marca,
    })

    equipamentos = equipamentos.map((item) => {
      if (item.id !== match.id) return item
      const historico = [...(item.historico ?? [])]
      historico.unshift({
        id: `venda-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        data: dataBaixa,
        tipo: 'baixa',
        descricao: TEXTO_EQUIPAMENTO_VENDIDO,
        responsavel: relatorio.tecnico,
        observacoes: obsRelatorio || undefined,
      })
      return {
        ...item,
        status: 'baixado' as const,
        dataBaixa,
        motivoBaixa: MOTIVO_BAIXA_EQUIPAMENTO_VENDIDO,
        historico,
      }
    })
  }

  return { equipamentos, vendidos }
}

export type EquipamentoClienteIdLookup = {
  id?: string
  numeroSerie?: string
  modelo?: string
  marca?: string
}

export type RelatorioEquipamentoCabecalhoLinha = {
  numero: number
  equipamentoId: string
  numeroMaquina: string
  maquinaModelo: string
}

export const MAX_EQUIPAMENTOS_RELATORIO = 5

export type RelatorioServicoEquipamentosHost = {
  equipamentoId?: string
  equipamentoOrigem?: RelatorioEquipamentoOrigem
  maquinaModelo: string
  numeroMaquina: string
  equipamentos?: RelatorioEquipamentoRef[]
}

/** ID técnico do equipamento no cadastro do cliente (prioriza `id`, depois n.º série). */
export function resolverIdEquipamentoCliente(
  eq: { id?: string; numeroSerie?: string } | null | undefined,
  idx = 0
): string {
  if (eq == null || typeof eq !== 'object') return String(idx).trim()
  return String(eq.id || eq.numeroSerie || idx).trim()
}

/** true = ID gerado pela app (UUID ou prefixo eqc-), não código próprio do utilizador. */
export function equipamentoIdETecnicoGerado(id: string | undefined): boolean {
  const t = String(id ?? '').trim()
  if (!t) return true
  if (/^eqc-/i.test(t)) return true
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89abAB][0-9a-f]{3}-[0-9a-f]{12}$/i.test(t)
}

/** ID de armazém/placeholder inválido para mostrar (ex. 0000000000). */
export function equipamentoIdPlaceholderInvalido(id: string | undefined): boolean {
  const t = String(id ?? '').trim()
  if (!t) return true
  // Só zeros / lixo óbvio — não é código real do utilizador nem do armazém.
  if (/^0+$/.test(t)) return true
  return false
}

/** Segmento seguro para UI: omite vazio e IDs só-zeros. */
export function segmentoIdEquipamentoExibivel(valor: string | undefined): string {
  const t = String(valor ?? '').trim()
  if (!t || equipamentoIdPlaceholderInvalido(t)) return ''
  return t
}

/**
 * N.º de série só a partir de campos dedicados (`numeroMaquina` / `numeroSerie` / etc.).
 * Nunca inventa série a partir de `id`/`equipamentoId` (ex. `S_001321` é ID, não série).
 * Omite vazio e placeholder só-zeros (`0000000000`).
 */
export function resolverSegmentoSerieEquipamento(
  eq:
    | {
        numeroMaquina?: string
        numeroSerie?: string
        nSerie?: string
        serie?: string
        serialNumber?: string
        equipamentoId?: string
        id?: string
      }
    | null
    | undefined
): string {
  if (eq == null || typeof eq !== 'object') return ''
  const dedicados = [eq.numeroMaquina, eq.numeroSerie, eq.nSerie, eq.serie, eq.serialNumber]
  for (const c of dedicados) {
    const s = segmentoIdEquipamentoExibivel(c)
    if (s) return s
  }
  return ''
}

/**
 * ID próprio para label: omite vazio, zeros e UUID/eqc.
 * Mantém códigos de cadastro (ex. `S_001321`, `008323`) como segmento de ID.
 */
export function segmentoIdProprioEquipamentoParaLabel(
  idRaw: string | undefined,
  _serie?: string
): string {
  const id = segmentoIdEquipamentoExibivel(idRaw)
  if (!id || equipamentoIdETecnicoGerado(id)) return ''
  return id
}

/**
 * Série no snapshot do relatório: omite vazio/zeros e eco do ID
 * (ex. `numeroMaquina === equipamentoId === S_001321` não conta como série).
 */
export function serieSnapshotRelatorioUtil(
  eq:
    | {
        equipamentoId?: string
        id?: string
        numeroMaquina?: string
        numeroSerie?: string
      }
    | null
    | undefined
): string {
  if (eq == null || typeof eq !== 'object') return ''
  const id = String(eq.equipamentoId ?? eq.id ?? '').trim()
  for (const c of [eq.numeroMaquina, eq.numeroSerie]) {
    const s = segmentoIdEquipamentoExibivel(c)
    if (!s) continue
    if (id && s.toLowerCase() === id.toLowerCase()) continue
    return s
  }
  return ''
}

/** Preferir cartão com série real (evita fantasma `0000000000` com o mesmo ID). */
function preferirEquipamentoClienteComSerie(
  candidatos: EquipamentoClienteIdLookup[],
  seriePreferida = ''
): EquipamentoClienteIdLookup | null {
  if (candidatos.length === 0) return null
  if (candidatos.length === 1) return candidatos[0]
  const pref = String(seriePreferida || '')
    .trim()
    .toLowerCase()
  if (pref) {
    const exact = candidatos.find(
      (e) => segmentoIdEquipamentoExibivel(e.numeroSerie).toLowerCase() === pref
    )
    if (exact) return exact
  }
  const comSerie = candidatos.filter((e) => segmentoIdEquipamentoExibivel(e.numeroSerie))
  return comSerie[0] || candidatos[0]
}

/**
 * Localiza o equipamento do cadastro do cliente a partir da linha do relatório.
 * Aceita ID próprio (`S_001321`), UUID, série, e ponte via armazém (id armazém → série → cliente).
 * Se houver vários com o mesmo ID, prefere o que tem `numeroSerie` real (não zeros).
 */
export function encontrarEquipamentoClientePorRefRelatorio(
  eq:
    | {
        equipamentoId?: string
        numeroMaquina?: string
        numeroSerie?: string
      }
    | null
    | undefined,
  clienteEquipamentos: EquipamentoClienteIdLookup[] | undefined,
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = []
): EquipamentoClienteIdLookup | null {
  if (eq == null || typeof eq !== 'object') return null
  const list = equipamentosClienteParaSelectRelatorio(clienteEquipamentos)
  if (list.length === 0) return null

  const alvo = String(eq.equipamentoId ?? '').trim()
  const snSnap = serieSnapshotRelatorioUtil(eq)

  let serieViaArmazem = ''
  if (alvo && !equipamentoIdPlaceholderInvalido(alvo)) {
    const wh = (equipamentosArmazem || []).find((e) => {
      if (e == null || typeof e !== 'object') return false
      const idWh = String(e.id ?? '').trim()
      const snWh = segmentoIdEquipamentoExibivel(e.numeroSerie)
      return (
        (idWh && idWh === alvo) ||
        (snWh && snWh.toLowerCase() === alvo.toLowerCase())
      )
    })
    serieViaArmazem = segmentoIdEquipamentoExibivel(wh?.numeroSerie)
  }

  const candidatos: EquipamentoClienteIdLookup[] = []
  for (let idx = 0; idx < list.length; idx++) {
    const e = list[idx]
    if (e == null || typeof e !== 'object') continue
    const chaves = chavesLookupEquipamentoCliente(e, idx, equipamentosArmazem).map(
      normalizarChaveIdEquipamento
    )
    const snCad = segmentoIdEquipamentoExibivel(e.numeroSerie)
    const hitId = Boolean(alvo && chaves.includes(normalizarChaveIdEquipamento(alvo)))
    const hitSnap = Boolean(snSnap && chaves.includes(normalizarChaveIdEquipamento(snSnap)))
    const hitWh = Boolean(
      serieViaArmazem && snCad && snCad.toLowerCase() === serieViaArmazem.toLowerCase()
    )
    if (hitId || hitSnap || hitWh) candidatos.push(e)
  }
  return preferirEquipamentoClienteComSerie(candidatos, snSnap || serieViaArmazem)
}

export type FormatLabelEquipamentoOpts = {
  equipamentosCliente?: EquipamentoClienteIdLookup[] | null
  equipamentosArmazem?: EquipamentoArmazemIdLookup[] | null
}

/**
 * Label curto do select (horas / resumos): **ID · modelo · série**.
 * Com opts de cadastro, completa a série a partir de `numeroSerie` do cartão (mesma propriedade).
 * Omite segmentos vazios/zeros; se a série for igual ao ID, omite a série (não duplica).
 * Nunca promove o ID a segmento de série.
 */
export function formatarLabelEquipamentoSelectCurto(
  eq:
    | {
        equipamentoId?: string
        id?: string
        maquinaModelo?: string
        modelo?: string
        marca?: string
        numeroMaquina?: string
        numeroSerie?: string
        nSerie?: string
        serie?: string
        serialNumber?: string
      }
    | null
    | undefined,
  idx = 0,
  opts?: FormatLabelEquipamentoOpts
): string {
  if (eq == null || typeof eq !== 'object') return `#${idx + 1}`

  const cli = opts?.equipamentosCliente ?? undefined
  const armazem = opts?.equipamentosArmazem ?? []
  const match =
    cli && Array.isArray(cli) && cli.length > 0
      ? encontrarEquipamentoClientePorRefRelatorio(eq, cli, armazem || [])
      : null

  const idDoSnap = segmentoIdProprioEquipamentoParaLabel(
    String(eq.equipamentoId ?? eq.id ?? '').trim()
  )
  const idDoCadastro = match
    ? segmentoIdProprioEquipamentoParaLabel(
        resolverIdEquipamentoVisivelCliente(match, armazem || []) ||
          idEquipamentoCadastroParaGravarNoRelatorio(
            match,
            (cli || []).indexOf(match),
            armazem || []
          )
      )
    : ''
  const id = idDoSnap || idDoCadastro

  let serie =
    (match ? segmentoIdEquipamentoExibivel(match.numeroSerie) : '') ||
    serieSnapshotRelatorioUtil(eq) ||
    resolverSegmentoSerieEquipamento(eq)
  if (serie && id && serie.toLowerCase() === id.toLowerCase()) serie = ''

  const modeloCadastro = match
    ? `${String(match.modelo ?? '').trim()} ${String(match.marca ?? '').trim()}`.trim()
    : ''
  // Preferir modelo do snapshot do relatório (ex. «KFL HOMAG»); cadastro só se faltar.
  const modelo =
    String(eq.maquinaModelo ?? '').trim() ||
    modeloCadastro ||
    `${String(eq.modelo ?? '').trim()} ${String(eq.marca ?? '').trim()}`.trim()

  const parts: string[] = []
  if (id) parts.push(id)
  if (modelo) parts.push(modelo)
  if (serie) parts.push(serie)
  return parts.length > 0 ? parts.join(' · ') : `#${idx + 1}`
}

/**
 * Valor + texto da `<option>` do cadastro do cliente.
 * Label unificado via `formatarLabelEquipamentoSelectCurto` (id · modelo · série).
 * `value` nunca fica preso em placeholder se existir UUID/série equivalente.
 */
export function opcaoEquipamentoClienteSelectRelatorio(
  item: EquipamentoClienteIdLookup,
  idx: number,
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = []
): { value: string; label: string } {
  const snLimpo = resolverSegmentoSerieEquipamento(item)
  const value =
    idEquipamentoCadastroParaGravarNoRelatorio(item, idx, equipamentosArmazem) ||
    snLimpo ||
    resolverIdEquipamentoCliente(item, idx) ||
    `eq-cli-${idx}`
  const label = formatarLabelEquipamentoSelectCurto(
    {
      id: item.id,
      equipamentoId: item.id,
      modelo: item.modelo,
      marca: item.marca,
      numeroSerie: item.numeroSerie,
    },
    idx
  )
  return { value, label: label || snLimpo || value || '—' }
}

/**
 * ID visível no relatório/PDF: código do cliente, ID do armazém pela série; nunca UUID interno.
 * Aceita `eq` null/undefined — listas com buracos no boot (tabs RR) não podem crashar a app.
 */
export function resolverIdEquipamentoVisivelCliente(
  eq: { id?: string; numeroSerie?: string } | null | undefined,
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = []
): string {
  if (eq == null || typeof eq !== 'object') return ''
  const idC = String(eq.id ?? '').trim()
  if (idC && !equipamentoIdETecnicoGerado(idC) && !equipamentoIdPlaceholderInvalido(idC)) return idC
  const s = String(eq.numeroSerie ?? '').trim()
  const sVis = segmentoIdEquipamentoExibivel(s)
  if (sVis) {
    const wh = (equipamentosArmazem || []).find(
      (e) =>
        e != null &&
        segmentoIdEquipamentoExibivel(e.numeroSerie).toLowerCase() === sVis.toLowerCase()
    )
    const idA = String(wh?.id ?? '').trim()
    if (idA && !equipamentoIdETecnicoGerado(idA) && !equipamentoIdPlaceholderInvalido(idA)) return idA
  }
  // Sem código útil: preferir n.º de série real a UUID/placeholder (nunca 0000000000).
  if (sVis) return sVis
  return equipamentoIdETecnicoGerado(idC) || equipamentoIdPlaceholderInvalido(idC) ? '' : idC
}

export function resolverIdEquipamentoVisivelRelatorio(
  eq: RelatorioEquipamentoRef | null | undefined,
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = []
): string {
  if (eq == null || typeof eq !== 'object') return ''
  if (eq.equipamentoOrigem === 'armazem') {
    const id = String(eq.equipamentoId ?? '').trim()
    if (equipamentoIdETecnicoGerado(id) || equipamentoIdPlaceholderInvalido(id)) {
      const sn = String(eq.numeroMaquina ?? '').trim()
      return sn || ''
    }
    return id
  }
  return resolverIdEquipamentoVisivelCliente(
    { id: eq.equipamentoId, numeroSerie: eq.numeroMaquina },
    equipamentosArmazem
  )
}

/**
 * ID a gravar na linha do relatório a partir do cadastro do cliente.
 * Nunca devolve placeholder (ex. 0000000000): código próprio → chave técnica (UUID) → série.
 */
export function idEquipamentoCadastroParaGravarNoRelatorio(
  eq: EquipamentoClienteIdLookup | null | undefined,
  idx = 0,
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = []
): string {
  if (eq == null || typeof eq !== 'object') return ''
  const chave = resolverIdEquipamentoCliente(eq, idx)
  const idVis = resolverIdEquipamentoVisivelCliente(eq, equipamentosArmazem)
  const sn = String(eq.numeroSerie ?? '').trim()
  // Código próprio real (não série “eco”, não UUID, não zeros).
  if (
    idVis &&
    !equipamentoIdPlaceholderInvalido(idVis) &&
    !equipamentoIdETecnicoGerado(idVis) &&
    idVis.toLowerCase() !== sn.toLowerCase()
  ) {
    return idVis
  }
  // Preferir UUID/eqc do cadastro (o select usa esta chave) em vez de zeros/série só.
  if (chave && !equipamentoIdPlaceholderInvalido(chave)) return chave
  if (idVis && !equipamentoIdPlaceholderInvalido(idVis)) return idVis
  const snVis = segmentoIdEquipamentoExibivel(sn)
  if (snVis) return snVis
  return ''
}

/** Lista do select: colapsa duplicados por série real (UUID vence 0000000000).
 * Série vazia / só-zeros NÃO funde itens — dedupe só por ID real; sem ID mantém todos. */
export function equipamentosClienteParaSelectRelatorio(
  list: EquipamentoClienteIdLookup[] | undefined | null
): EquipamentoClienteIdLookup[] {
  const raw = (Array.isArray(list) ? list : []).filter(
    (e): e is EquipamentoClienteIdLookup => e != null && typeof e === 'object'
  )
  if (raw.length <= 1) return raw
  const bySerial = new Map<string, { eq: EquipamentoClienteIdLookup; idx: number }>()
  const byIdSemSerie = new Map<string, EquipamentoClienteIdLookup>()
  const semSerieSemId: EquipamentoClienteIdLookup[] = []
  const scoreId = (id: string) => {
    if (!id) return 0
    if (/^0+$/.test(id)) return 1
    if (/^eqc-/i.test(id)) return 4
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89abAB][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
      return 4
    if (/^\d+$/.test(id) && id.length <= 12) return 2
    return 3
  }
  raw.forEach((eq, idx) => {
    const sRaw = String(eq.numeroSerie ?? '')
      .trim()
      .toLowerCase()
    // Placeholder 0000000000 conta como «sem série» — não colapsar por essa chave fantasma.
    const s = !sRaw || /^0+$/.test(sRaw) ? '' : sRaw
    if (!s) {
      const id = String(eq.id ?? '').trim()
      if (id && !/^0+$/.test(id)) {
        const prev = byIdSemSerie.get(id)
        if (!prev || scoreId(id) >= scoreId(String(prev.id ?? '').trim())) {
          byIdSemSerie.set(id, eq)
        }
      } else {
        semSerieSemId.push(eq)
      }
      return
    }
    const prev = bySerial.get(s)
    if (!prev) {
      bySerial.set(s, { eq, idx })
      return
    }
    const idA = String(prev.eq.id ?? '').trim()
    const idB = String(eq.id ?? '').trim()
    const sa = scoreId(idA)
    const sb = scoreId(idB)
    if (sb > sa) bySerial.set(s, { eq, idx })
  })
  // Mesmo ID com série real e fantasma sem série (0000000000): ficar só com o da série.
  const idsComSerieReal = new Set(
    [...bySerial.values()]
      .map((x) => String(x.eq.id ?? '').trim().toLowerCase())
      .filter(Boolean)
  )
  for (const idKey of [...byIdSemSerie.keys()]) {
    if (idsComSerieReal.has(String(idKey).trim().toLowerCase())) {
      byIdSemSerie.delete(idKey)
    }
  }
  return [
    ...byIdSemSerie.values(),
    ...semSerieSemId,
    ...[...bySerial.values()].map((x) => x.eq),
  ]
}

/** Resolve `clienteId` quando o relatório antigo só tem o nome do cliente. */
export function resolverClienteIdRelatorio(
  rel: { clienteId?: string; cliente?: string } | null | undefined,
  clientes: { id: string; nomeEmpresa?: string }[]
): string {
  if (rel == null || typeof rel !== 'object') return ''
  const lista = (clientes || []).filter(
    (c): c is { id: string; nomeEmpresa?: string } =>
      c != null && typeof c === 'object' && String(c.id ?? '').trim() !== ''
  )
  const cid = String(rel.clienteId ?? '').trim()
  if (cid && lista.some((c) => c.id === cid)) return cid
  const nome = String(rel.cliente ?? '').trim()
  if (!nome) return cid
  const nomeNorm = nome.toLowerCase()
  const hitExact = lista.find(
    (c) => String(c.nomeEmpresa ?? '').trim().toLowerCase() === nomeNorm
  )
  if (hitExact) return hitExact.id
  // Correspondência parcial (ex.: «Ferwood» ↔ «FERWOOD THOMAS»)
  const tokens = nomeNorm
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split(/\s+/)
    .filter((w) => w.length >= 3)
  if (tokens.length > 0) {
    const hitPartial = lista.find((c) => {
      const cn = String(c.nomeEmpresa ?? '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
      if (!cn) return false
      if (cn.includes(nomeNorm) || nomeNorm.includes(cn)) return true
      const ct = cn.split(/\s+/).filter((w) => w.length >= 3)
      return tokens.some((t) => ct.includes(t)) || ct.some((t) => tokens.includes(t))
    })
    if (hitPartial) return hitPartial.id
  }
  return cid
}

/** Chave interna do select (UUID / id / série) a partir do ID visível ou técnico guardado. */
export function resolverChaveEquipamentoClienteRelatorio(
  equipamentoId: string,
  clienteEquipamentos: EquipamentoClienteIdLookup[] | undefined,
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = []
): string {
  const alvo = String(equipamentoId ?? '').trim()
  const list = equipamentosClienteParaSelectRelatorio(clienteEquipamentos)
  if (!alvo || list.length === 0) {
    return equipamentoIdPlaceholderInvalido(alvo) ? '' : alvo
  }
  for (let idx = 0; idx < list.length; idx++) {
    const item = list[idx]
    if (item == null || typeof item !== 'object') continue
    const key = resolverIdEquipamentoCliente(item, idx)
    const vis = resolverIdEquipamentoVisivelCliente(item, equipamentosArmazem)
    const idGravar = idEquipamentoCadastroParaGravarNoRelatorio(item, idx, equipamentosArmazem)
    const sn = String(item.numeroSerie ?? '').trim()
    const idRaw = String(item.id ?? '').trim()
    if (
      key === alvo ||
      vis === alvo ||
      idGravar === alvo ||
      sn === alvo ||
      idRaw === alvo
    ) {
      return (
        idGravar ||
        segmentoIdEquipamentoExibivel(key) ||
        segmentoIdEquipamentoExibivel(sn) ||
        ''
      )
    }
  }
  // Alvo é placeholder: o prepararEquipamentosRelatorioParaEdicao rematch pela série.
  if (equipamentoIdPlaceholderInvalido(alvo)) return ''
  return alvo
}

/** Normaliza linhas de equipamento ao abrir um relatório para edição (IDs visíveis + dados do cadastro). */
export function prepararEquipamentosRelatorioParaEdicao(
  equipamentosRaw: RelatorioEquipamentoRef[],
  clienteEquipamentos: EquipamentoClienteIdLookup[] | undefined,
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = []
): RelatorioEquipamentoRef[] {
  const cliEq = equipamentosClienteParaSelectRelatorio(clienteEquipamentos)

  return (equipamentosRaw || [])
    .filter((eqItem): eqItem is RelatorioEquipamentoRef => eqItem != null && typeof eqItem === 'object')
    .map((eqItem) => {
    if (eqItem.equipamentoOrigem === 'armazem') {
      const idArmazem =
        resolverIdEquipamentoVisivelRelatorio(eqItem, equipamentosArmazem) ||
        (equipamentoIdPlaceholderInvalido(eqItem.equipamentoId)
          ? String(eqItem.numeroMaquina ?? '').trim()
          : eqItem.equipamentoId)
      const wh = (equipamentosArmazem || []).find(
        (e) => String(e?.id ?? '').trim() === String(idArmazem || '').trim()
      )
      const serieArmazem =
        segmentoIdEquipamentoExibivel(wh?.numeroSerie) ||
        serieSnapshotRelatorioUtil(eqItem)
      return {
        ...eqItem,
        equipamentoId: idArmazem,
        numeroMaquina: serieArmazem || (equipamentoIdPlaceholderInvalido(eqItem.numeroMaquina) ? '' : String(eqItem.numeroMaquina ?? '').trim()),
        maquinaModelo:
          (wh ? `${String(wh.modelo ?? '').trim()} ${String(wh.marca ?? '').trim()}`.trim() : '') ||
          eqItem.maquinaModelo,
      }
    }

    const eqMatch = encontrarEquipamentoClientePorRefRelatorio(
      eqItem,
      cliEq,
      equipamentosArmazem
    )

    if (eqMatch) {
      const idx = cliEq.indexOf(eqMatch)
      const idGravar = idEquipamentoCadastroParaGravarNoRelatorio(eqMatch, idx >= 0 ? idx : 0, equipamentosArmazem)
      const modeloCadastro =
        `${String(eqMatch.modelo ?? '').trim()} ${String(eqMatch.marca ?? '').trim()}`.trim()
      // Mesma propriedade do cartão do cliente: `numeroSerie`.
      const serieFinal =
        segmentoIdEquipamentoExibivel(eqMatch.numeroSerie) ||
        serieSnapshotRelatorioUtil(eqItem) ||
        ''
      return {
        ...eqItem,
        equipamentoId:
          idGravar ||
          segmentoIdEquipamentoExibivel(eqItem.equipamentoId) ||
          serieFinal ||
          '',
        maquinaModelo: modeloCadastro || eqItem.maquinaModelo,
        numeroMaquina: serieFinal,
      }
    }

    const idFallback = resolverIdEquipamentoVisivelRelatorio(eqItem, equipamentosArmazem)
    const serieLimpa = serieSnapshotRelatorioUtil(eqItem)
    const idLimpo =
      segmentoIdEquipamentoExibivel(idFallback) ||
      segmentoIdEquipamentoExibivel(eqItem.equipamentoId) ||
      serieLimpa
    return {
      ...eqItem,
      equipamentoId: idLimpo,
      numeroMaquina: serieLimpa || (equipamentoIdPlaceholderInvalido(eqItem.numeroMaquina) ? '' : String(eqItem.numeroMaquina ?? '').trim()),
    }
  })
}

export function resolverEquipamentoRelatorioParaExibicao(
  eq: RelatorioEquipamentoRef,
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = [],
  equipamentosCliente: EquipamentoClienteIdLookup[] = []
): string {
  if (eq.equipamentoOrigem === 'armazem') {
    const id = String(eq.equipamentoId ?? '').trim()
    return equipamentoIdETecnicoGerado(id) ? '' : id
  }

  const idStored = String(eq.equipamentoId ?? '').trim()
  const snStored = String(eq.numeroMaquina ?? '').trim()

  for (let idx = 0; idx < equipamentosCliente.length; idx++) {
    const e = equipamentosCliente[idx]
    const idCli = String(e.id ?? '').trim()
    const snCli = String(e.numeroSerie ?? '').trim()
    const matches =
      (idStored && (idCli === idStored || snCli === idStored || resolverIdEquipamentoCliente(e, idx) === idStored)) ||
      (snStored && snCli === snStored)
    if (matches) {
      const vis = resolverIdEquipamentoVisivelCliente(e, equipamentosArmazem)
      if (vis) return vis
    }
  }

  const vis = resolverIdEquipamentoVisivelRelatorio(eq, equipamentosArmazem)
  if (vis) return vis
  return equipamentoIdETecnicoGerado(idStored) ? '' : idStored
}

export function equipamentoClienteCorrespondeRelatorio(
  eq: RelatorioEquipamentoRef,
  e: EquipamentoClienteIdLookup,
  idx: number,
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = []
): boolean {
  const idStored = String(eq.equipamentoId ?? '').trim()
  const snStored = String(eq.numeroMaquina ?? '').trim()
  const idCli = String(e.id ?? '').trim()
  const snCli = String(e.numeroSerie ?? '').trim()
  const key = resolverIdEquipamentoCliente(e, idx)
  const vis = resolverIdEquipamentoVisivelCliente(e, equipamentosArmazem)
  return Boolean(
    (idStored &&
      (idCli === idStored ||
        snCli === idStored ||
        key === idStored ||
        vis === idStored)) ||
    (snStored && snCli === snStored)
  )
}

/** N.º de série / número do equipamento no cadastro (cliente ou armazém). */
export function resolverNumeroMaquinaRelatorioParaExibicao(
  eq: RelatorioEquipamentoRef,
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = [],
  equipamentosCliente: EquipamentoClienteIdLookup[] = []
): string {
  const matchCli = encontrarEquipamentoClientePorRefRelatorio(
    eq,
    equipamentosCliente,
    equipamentosArmazem
  )
  const serieCadastro = segmentoIdEquipamentoExibivel(matchCli?.numeroSerie)
  if (serieCadastro) return serieCadastro

  const snSnap = serieSnapshotRelatorioUtil(eq)
  if (snSnap) return snSnap

  const idStored = String(eq.equipamentoId ?? '').trim()

  if (eq.equipamentoOrigem === 'armazem') {
    const wh = equipamentosArmazem.find(
      (e) =>
        String(e.id ?? '').trim() === idStored ||
        String(e.numeroSerie ?? '').trim() === idStored
    )
    return segmentoIdEquipamentoExibivel(wh?.numeroSerie)
  }

  return ''
}

export function equipamentosRelatorioPreenchidos(
  equipamentos: RelatorioEquipamentoRef[]
): RelatorioEquipamentoRef[] {
  return (equipamentos || []).filter(
    (eq) =>
      eq != null &&
      typeof eq === 'object' &&
      Boolean(eq.equipamentoId || eq.maquinaModelo || eq.numeroMaquina)
  )
}

export function normalizarEquipamentosRelatorio(
  r: RelatorioServicoEquipamentosHost
): RelatorioEquipamentoRef[] {
  if (Array.isArray(r.equipamentos) && r.equipamentos.length > 0) {
    return r.equipamentos.slice(0, MAX_EQUIPAMENTOS_RELATORIO).map((eq, i) => ({
      uid: eq.uid || `eq-${i}-${eq.equipamentoId || i}`,
      equipamentoOrigem: normalizarEquipamentoOrigem(eq.equipamentoOrigem),
      equipamentoId: String(eq.equipamentoId ?? '').trim(),
      maquinaModelo: String(eq.maquinaModelo ?? '').trim(),
      numeroMaquina: String(eq.numeroMaquina ?? '').trim(),
      clienteExternoId: String(eq.clienteExternoId ?? '').trim() || undefined,
      clienteExternoNome: String(eq.clienteExternoNome ?? '').trim() || undefined,
    }))
  }

  const id = String(r.equipamentoId ?? '').trim()
  const modelo = String(r.maquinaModelo ?? '').trim()
  const sn = String(r.numeroMaquina ?? '').trim()
  if (!id && !modelo && !sn) return []

  return [
    {
      uid: 'legacy-0',
      equipamentoOrigem: normalizarEquipamentoOrigem(r.equipamentoOrigem),
      equipamentoId: id,
      maquinaModelo: modelo,
      numeroMaquina: sn,
    },
  ]
}

export function formatarEquipamentoRelatorioLinha(
  eq: RelatorioEquipamentoRef,
  indice?: number,
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = []
): string {
  const prefix = indice != null ? `Equip. ${indice}` : ''
  const idVis = resolverIdEquipamentoVisivelRelatorio(eq, equipamentosArmazem)
  const idPart = idVis ? `ID: ${idVis}` : ''
  const modelo = eq.maquinaModelo
  const origemTag =
    eq.equipamentoOrigem === 'armazem'
      ? '(Armazém)'
      : eq.equipamentoOrigem === 'clientes-externos'
        ? eq.clienteExternoNome
          ? `(${eq.clienteExternoNome})`
          : '(Cliente externo)'
        : ''
  const partes = [idPart, modelo, origemTag].filter(Boolean)
  const corpo = partes.join(' · ')
  if (!corpo) return prefix || '—'
  return prefix ? `${prefix} — ${corpo}` : corpo
}

export function formatarEquipamentosIdsRelatorio(
  equipamentos: RelatorioEquipamentoRef[],
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = []
): string {
  return equipamentosRelatorioPreenchidos(equipamentos)
    .map((eq) => resolverIdEquipamentoVisivelRelatorio(eq, equipamentosArmazem))
    .filter(Boolean)
    .join(' · ')
}

/** Texto resumido para UI / WhatsApp / e-mail (relatório de despesas). */
export function textoEquipamentosResumoRelatorioDespesas(
  r: RelatorioServicoEquipamentosHost,
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = [],
  equipamentosCliente: EquipamentoClienteIdLookup[] = []
): string {
  const linhas = linhasTextoEquipamentosRelatorioDespesas(r, equipamentosArmazem, equipamentosCliente)
  if (linhas.length <= 1) return linhas[0]?.texto ?? '—'
  return linhas.map((l) => `Equip. ${l.numero}: ${l.texto}`).join('\n')
}

/** Uma ou várias linhas de equipamento para tabelas / PDF de despesas. */
export function linhasTextoEquipamentosRelatorioDespesas(
  r: RelatorioServicoEquipamentosHost,
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = [],
  equipamentosCliente: EquipamentoClienteIdLookup[] = []
): Array<{ numero: number; texto: string }> {
  const cab = getRelatorioCabecalhoEquipamentoDados(r, equipamentosArmazem, equipamentosCliente)
  if (cab.multiplos && cab.linhas.length > 1) {
    return cab.linhas.map((l) => ({
      numero: l.numero,
      texto:
        [
          l.equipamentoId !== '—' ? `ID ${l.equipamentoId}` : '',
          l.maquinaModelo !== '—' ? l.maquinaModelo : '',
          l.numeroMaquina !== '—' ? `S/N ${l.numeroMaquina}` : '',
        ]
          .filter(Boolean)
          .join(' · ') || '—',
    }))
  }
  const texto =
    cab.modelos !== '—' ? cab.modelos : String(r.maquinaModelo ?? '').trim() || '—'
  return [{ numero: 1, texto }]
}

export function relatorioTemMultiplosEquipamentosDespesas(
  r: RelatorioServicoEquipamentosHost,
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = [],
  equipamentosCliente: EquipamentoClienteIdLookup[] = []
): boolean {
  const cab = getRelatorioCabecalhoEquipamentoDados(r, equipamentosArmazem, equipamentosCliente)
  return cab.multiplos && cab.linhas.length > 1
}

export function getRelatorioCabecalhoEquipamentoDados(
  r: RelatorioServicoEquipamentosHost,
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = [],
  equipamentosCliente: EquipamentoClienteIdLookup[] = []
): {
  ids: string
  modelos: string
  numeros: string
  multiplos: boolean
  linhas: RelatorioEquipamentoCabecalhoLinha[]
} {
  const list = equipamentosRelatorioPreenchidos(normalizarEquipamentosRelatorio(r))
  const linhas = list.map((eq, i) => ({
    numero: i + 1,
    equipamentoId:
      resolverEquipamentoRelatorioParaExibicao(eq, equipamentosArmazem, equipamentosCliente) || '—',
    numeroMaquina:
      resolverNumeroMaquinaRelatorioParaExibicao(eq, equipamentosArmazem, equipamentosCliente) || '—',
    maquinaModelo: eq.maquinaModelo || '—',
  }))

  if (list.length === 0) {
    const idLegacy = String(r.equipamentoId ?? '').trim()
    const idVis =
      idLegacy && !equipamentoIdETecnicoGerado(idLegacy) ? idLegacy : '—'
    return {
      ids: idVis,
      modelos: String(r.maquinaModelo ?? '').trim() || '—',
      numeros: String(r.numeroMaquina ?? '').trim() || '—',
      multiplos: false,
      linhas: [],
    }
  }

  if (list.length === 1) {
    const linha = linhas[0]
    return {
      ids: linha.equipamentoId,
      modelos: linha.maquinaModelo,
      numeros: linha.numeroMaquina,
      multiplos: false,
      linhas: [linha],
    }
  }

  return {
    ids: '—',
    modelos: '—',
    numeros: '—',
    multiplos: true,
    linhas,
  }
}

export function sincronizarCamposLegadoEquipamentos(
  equipamentos: RelatorioEquipamentoRef[],
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = []
): {
  equipamentoId?: string
  equipamentoOrigem?: RelatorioEquipamentoOrigem
  maquinaModelo: string
  numeroMaquina: string
  equipamentos: RelatorioEquipamentoRef[]
} {
  const raw = equipamentos.slice(0, MAX_EQUIPAMENTOS_RELATORIO)
  const list = equipamentosRelatorioPreenchidos(raw)
  const principal = list[0]

  if (!principal) {
    return {
      equipamentoId: '',
      equipamentoOrigem: 'cliente',
      maquinaModelo: '',
      numeroMaquina: '',
      equipamentos: raw,
    }
  }

  const idVis = resolverIdEquipamentoVisivelRelatorio(principal, equipamentosArmazem)

  return {
    equipamentoId: idVis,
    equipamentoOrigem: principal.equipamentoOrigem,
    maquinaModelo: principal.maquinaModelo,
    numeroMaquina: principal.numeroMaquina,
    equipamentos: raw,
  }
}

export function validarEquipamentosRelatorio(equipamentos: RelatorioEquipamentoRef[]): string | null {
  const list = equipamentosRelatorioPreenchidos(equipamentos)
  if (list.length > MAX_EQUIPAMENTOS_RELATORIO) {
    return `Máximo de ${MAX_EQUIPAMENTOS_RELATORIO} equipamentos por relatório.`
  }

  for (let i = 0; i < list.length; i++) {
    const eq = list[i]
    if (eq.equipamentoOrigem === 'armazem' && !eq.equipamentoId) {
      return `Equipamento ${i + 1}: selecione o equipamento do armazém ou remova a linha.`
    }
    if (
      eq.equipamentoOrigem === 'clientes-externos' &&
      !eq.clienteExternoId &&
      !eq.equipamentoId &&
      !eq.maquinaModelo
    ) {
      return `Equipamento ${i + 1}: selecione o cliente externo e o equipamento.`
    }
    if (
      (eq.equipamentoOrigem === 'cliente' || eq.equipamentoOrigem === 'clientes-externos') &&
      !eq.equipamentoId &&
      !eq.maquinaModelo
    ) {
      return `Equipamento ${i + 1}: selecione um equipamento do cliente.`
    }
  }

  const chaves = list
    .filter((eq) => eq.equipamentoId)
    .map((eq) => `${eq.equipamentoOrigem}:${eq.equipamentoId}`)
  const duplicado = chaves.find((chave, idx) => chaves.indexOf(chave) !== idx)
  if (duplicado) return 'Não repita o mesmo equipamento duas vezes no relatório.'

  return null
}

export function prepararRelatorioServicoEquipamentos<T extends RelatorioServicoEquipamentosHost>(
  form: T,
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = []
): T {
  const normalizados = normalizarEquipamentosRelatorio(form).map((eq) => ({
    ...eq,
    equipamentoId:
      eq.equipamentoOrigem === 'armazem'
        ? eq.equipamentoId
        : resolverIdEquipamentoVisivelRelatorio(eq, equipamentosArmazem) || eq.equipamentoId,
  }))
  const synced = sincronizarCamposLegadoEquipamentos(normalizados, equipamentosArmazem)
  return { ...form, ...synced }
}

export function relatorioParaImprimirPDFEquipamentos<T extends RelatorioServicoEquipamentosHost>(
  r: T,
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = []
): T {
  const equipamentos = equipamentosRelatorioPreenchidos(normalizarEquipamentosRelatorio(r)).map(
    (eq) => ({
      ...eq,
      equipamentoId: resolverIdEquipamentoVisivelRelatorio(eq, equipamentosArmazem) || eq.equipamentoId,
    })
  )
  const cabecalho = getRelatorioCabecalhoEquipamentoDados(r, equipamentosArmazem)

  if (equipamentos.length === 0) {
    if (cabecalho.ids === '—' && cabecalho.modelos === '—') return r
    return {
      ...r,
      equipamentoId: cabecalho.ids === '—' ? r.equipamentoId : cabecalho.ids,
      maquinaModelo: cabecalho.modelos === '—' ? r.maquinaModelo : cabecalho.modelos,
      numeroMaquina: cabecalho.numeros === '—' ? r.numeroMaquina : cabecalho.numeros,
    }
  }

  if (equipamentos.length === 1) {
    const eq = equipamentos[0]
    const tagOrigem =
      eq.equipamentoOrigem === 'armazem'
        ? ' (Armazém — gestão industrial)'
        : eq.equipamentoOrigem === 'clientes-externos'
          ? eq.clienteExternoNome
            ? ` (${eq.clienteExternoNome})`
            : ' (Cliente externo)'
          : ''
    return {
      ...r,
      equipamentos,
      equipamentoId: cabecalho.ids !== '—' ? cabecalho.ids : eq.equipamentoId,
      equipamentoOrigem: eq.equipamentoOrigem,
      maquinaModelo: `${eq.maquinaModelo || '—'}${tagOrigem}`.trim(),
      numeroMaquina: eq.numeroMaquina,
    }
  }

  const principal = equipamentos[0]
  return {
    ...r,
    equipamentos,
    equipamentoId: cabecalho.linhas[0]?.equipamentoId || principal.equipamentoId,
    equipamentoOrigem: principal.equipamentoOrigem,
    maquinaModelo: principal.maquinaModelo,
    numeroMaquina: principal.numeroMaquina,
  }
}

export function equipamentosClienteParaBiblioteca(
  equipamentos: RelatorioEquipamentoRef[],
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = [],
  equipamentosCliente: EquipamentoClienteIdLookup[] = []
): string[] {
  const chave = (eq: RelatorioEquipamentoRef): string => {
    const vis = resolverIdEquipamentoVisivelRelatorio(eq, equipamentosArmazem)
    if (vis) return vis
    const sn = String(eq.numeroMaquina ?? '').trim()
    if (sn) return sn
    for (let idx = 0; idx < equipamentosCliente.length; idx++) {
      const ce = equipamentosCliente[idx]
      if (equipamentoClienteCorrespondeRelatorio(eq, ce, idx, equipamentosArmazem)) {
        const ck =
          String(ce.numeroSerie ?? '').trim() ||
          resolverIdEquipamentoVisivelCliente(ce, equipamentosArmazem) ||
          resolverIdEquipamentoCliente(ce, idx)
        if (ck) return ck
      }
    }
    const id = String(eq.equipamentoId ?? '').trim()
    if (id) return id
    return String(eq.maquinaModelo ?? '').trim()
  }

  return [
    ...new Set(
      equipamentosRelatorioPreenchidos(equipamentos)
        .filter((eq) => eq.equipamentoOrigem === 'cliente')
        .map((eq) => chave(eq))
        .filter(Boolean)
    ),
  ]
}

/** Chaves possíveis em `cliente.relatorios` para um equipamento do cadastro. */
export function chavesLookupEquipamentoCliente(
  equipamento: EquipamentoClienteIdLookup | null | undefined,
  equipamentoIndex: number,
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = []
): string[] {
  if (equipamento == null || typeof equipamento !== 'object') return [String(equipamentoIndex)]
  const vis = resolverIdEquipamentoVisivelCliente(equipamento, equipamentosArmazem)
  const key = resolverIdEquipamentoCliente(equipamento, equipamentoIndex)
  const serie = String(equipamento.numeroSerie ?? '').trim()
  const modelo = String(equipamento.modelo ?? '').trim()
  const marca = String(equipamento.marca ?? '').trim()
  const id = String(equipamento.id ?? '').trim()
  const modeloMarca = `${modelo} ${marca}`.trim()
  return [
    ...new Set(
      [vis, key, serie, id, modelo, modeloMarca, String(equipamentoIndex)].filter(Boolean)
    ),
  ]
}

/** Relatórios de serviço ligados a um equipamento — mescla `cliente.relatorios` + `relatoriosServico`. */
export function coletarRelatoriosServicoPorEquipamentoCliente<
  R extends { id: string; data: string; numero: string; clienteId?: string; cliente?: string } & RelatorioServicoEquipamentosHost
>(params: {
  cliente: {
    id: string
    nomeEmpresa?: string
    relatorios?: Record<string, R[]>
    equipamentos?: EquipamentoClienteIdLookup[]
  }
  equipamento: EquipamentoClienteIdLookup
  equipamentoIndex: number
  relatoriosServico?: R[]
  equipamentosArmazem?: EquipamentoArmazemIdLookup[]
  clientes?: { id: string; nomeEmpresa?: string }[]
}): R[] {
  const map = new Map<string, R>()
  const armazem = params.equipamentosArmazem ?? []
  const eq = params.equipamento
  const idx = params.equipamentoIndex
  const clientes = params.clientes ?? [{ id: params.cliente.id, nomeEmpresa: params.cliente.nomeEmpresa }]

  const relatorioCasaComEquipamento = (rel: R): boolean => {
    const eqs = normalizarEquipamentosRelatorio(rel)
    if (eqs.length === 0) {
      const legado: RelatorioEquipamentoRef = {
        uid: 'legado',
        equipamentoOrigem: 'cliente',
        equipamentoId: String(rel.equipamentoId ?? ''),
        maquinaModelo: String(rel.maquinaModelo ?? ''),
        numeroMaquina: String(rel.numeroMaquina ?? ''),
      }
      return equipamentoClienteCorrespondeRelatorio(legado, eq, idx, armazem)
    }
    return eqs.some((eqRef) => equipamentoClienteCorrespondeRelatorio(eqRef, eq, idx, armazem))
  }

  for (const k of chavesLookupEquipamentoCliente(eq, idx, armazem)) {
    for (const r of params.cliente.relatorios?.[k] ?? []) {
      if (r?.id && relatorioCasaComEquipamento(r)) map.set(r.id, r)
    }
  }

  for (const rel of params.relatoriosServico ?? []) {
    const cid = resolverClienteIdRelatorio(rel, clientes)
    if (cid !== params.cliente.id) continue
    if (relatorioCasaComEquipamento(rel)) map.set(rel.id, rel)
  }

  for (const rel of params.relatoriosServico ?? []) {
    if (map.has(rel.id)) map.set(rel.id, rel)
  }

  return Array.from(map.values()).sort((a, b) => {
    const dataA = new Date(a.data).getTime()
    const dataB = new Date(b.data).getTime()
    if (dataA === dataB) return b.numero.localeCompare(a.numero)
    return dataB - dataA
  })
}

type ClienteRelatoriosHost = {
  id: string
  equipamentos?: EquipamentoClienteIdLookup[]
  relatorios?: Record<string, Array<{ id: string; data: string; numero: string }>>
}

export function aplicarRelatorioNaBibliotecaCliente<
  T extends ClienteRelatoriosHost,
  R extends { id: string; data: string; numero: string; clienteId?: string; cliente?: string } & RelatorioServicoEquipamentosHost
>(
  clientes: T[],
  savedRelatorio: R,
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = []
): T[] {
  const clienteId = resolverClienteIdRelatorio(savedRelatorio, clientes)
  if (!clienteId) return clientes

  const clienteIndex = clientes.findIndex((c) => c.id === clienteId)
  if (clienteIndex === -1) return clientes

  const clienteOrig = clientes[clienteIndex]

  let keys = equipamentosClienteParaBiblioteca(
    normalizarEquipamentosRelatorio(savedRelatorio),
    equipamentosArmazem,
    clienteOrig.equipamentos ?? []
  )
  if (keys.length === 0) {
    const legadoSn = String(savedRelatorio.numeroMaquina ?? '').trim()
    const legadoMod = String(savedRelatorio.maquinaModelo ?? '').trim()
    const legadoId = String(savedRelatorio.equipamentoId ?? '').trim()
    if (legadoSn) keys = [legadoSn]
    else if (legadoMod) keys = [legadoMod]
    else if (legadoId) keys = [legadoId]
  }

  const updated = [...clientes]
  const cliente = { ...updated[clienteIndex] }
  const relatorios: Record<string, R[]> = { ...(cliente.relatorios as Record<string, R[]> | undefined) }

  for (const k of Object.keys(relatorios)) {
    const list = relatorios[k]
    if (!Array.isArray(list)) continue
    const filtered = list.filter((item) => item.id !== savedRelatorio.id)
    if (filtered.length !== list.length) {
      if (filtered.length === 0) delete relatorios[k]
      else relatorios[k] = filtered
    }
  }

  for (const key of keys) {
    if (!relatorios[key]) relatorios[key] = []
    const list = [...relatorios[key]]
    const existingIndex = list.findIndex((item) => item.id === savedRelatorio.id)
    if (existingIndex !== -1) list[existingIndex] = savedRelatorio
    else list.push(savedRelatorio)
    list.sort((a, b) => {
      const dataA = new Date(a.data).getTime()
      const dataB = new Date(b.data).getTime()
      if (dataA === dataB) return b.numero.localeCompare(a.numero)
      return dataB - dataA
    })
    relatorios[key] = list
  }

  updated[clienteIndex] = { ...cliente, relatorios } as T
  return updated
}
