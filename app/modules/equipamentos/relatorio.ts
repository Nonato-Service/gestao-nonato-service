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
  if (s) {
    const wh = (equipamentosArmazem || []).find(
      (e) => e != null && String(e.numeroSerie ?? '').trim().toLowerCase() === s.toLowerCase()
    )
    const idA = String(wh?.id ?? '').trim()
    if (idA && !equipamentoIdETecnicoGerado(idA) && !equipamentoIdPlaceholderInvalido(idA)) return idA
  }
  // Sem código útil: preferir n.º de série a UUID/placeholder.
  if (s) return s
  return equipamentoIdETecnicoGerado(idC) || equipamentoIdPlaceholderInvalido(idC) ? '' : idC
}

export function resolverIdEquipamentoVisivelRelatorio(
  eq: RelatorioEquipamentoRef | null | undefined,
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = []
): string {
  if (eq == null || typeof eq !== 'object') return ''
  if (eq.equipamentoOrigem === 'armazem') {
    const id = String(eq.equipamentoId ?? '').trim()
    return equipamentoIdETecnicoGerado(id) ? '' : id
  }
  return resolverIdEquipamentoVisivelCliente(
    { id: eq.equipamentoId, numeroSerie: eq.numeroMaquina },
    equipamentosArmazem
  )
}

/** ID para ecrã/PDF: resolve código visível; nunca mostra UUID interno se existir alternativa no cliente/armazém. */
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
  if (!alvo || !clienteEquipamentos?.length) return alvo
  for (let idx = 0; idx < clienteEquipamentos.length; idx++) {
    const item = clienteEquipamentos[idx]
    if (item == null || typeof item !== 'object') continue
    const key = resolverIdEquipamentoCliente(item, idx)
    const vis = resolverIdEquipamentoVisivelCliente(item, equipamentosArmazem)
    if (
      key === alvo ||
      vis === alvo ||
      String(item.numeroSerie ?? '').trim() === alvo ||
      String(item.id ?? '').trim() === alvo
    ) {
      return key
    }
  }
  return alvo
}

/** Normaliza linhas de equipamento ao abrir um relatório para edição (IDs visíveis + dados do cadastro). */
export function prepararEquipamentosRelatorioParaEdicao(
  equipamentosRaw: RelatorioEquipamentoRef[],
  clienteEquipamentos: EquipamentoClienteIdLookup[] | undefined,
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = []
): RelatorioEquipamentoRef[] {
  const cliEq = clienteEquipamentos ?? []

  return (equipamentosRaw || [])
    .filter((eqItem): eqItem is RelatorioEquipamentoRef => eqItem != null && typeof eqItem === 'object')
    .map((eqItem) => {
    if (eqItem.equipamentoOrigem === 'armazem') {
      return {
        ...eqItem,
        equipamentoId:
          resolverIdEquipamentoVisivelRelatorio(eqItem, equipamentosArmazem) ||
          eqItem.equipamentoId,
      }
    }

    const alvo = String(eqItem.equipamentoId ?? '').trim()
    const sn = String(eqItem.numeroMaquina ?? '').trim()

    const eqMatch = cliEq.find((e, idx) => {
      if (e == null || typeof e !== 'object') return false
      const key = resolverIdEquipamentoCliente(e, idx)
      const vis = resolverIdEquipamentoVisivelCliente(e, equipamentosArmazem)
      return (
        (alvo &&
          (String(e.id ?? '').trim() === alvo ||
            String(e.numeroSerie ?? '').trim() === alvo ||
            key === alvo ||
            vis === alvo)) ||
        (sn && String(e.numeroSerie ?? '').trim() === sn)
      )
    })

    if (eqMatch) {
      const idx = cliEq.indexOf(eqMatch)
      const idVis = resolverIdEquipamentoVisivelCliente(eqMatch, equipamentosArmazem)
      const chave = resolverIdEquipamentoCliente(eqMatch, idx)
      const modeloCadastro =
        `${String(eqMatch.modelo ?? '').trim()} ${String(eqMatch.marca ?? '').trim()}`.trim()
      const serieCadastro = String(eqMatch.numeroSerie ?? '').trim()
      // Preferir sempre o cadastro actual (evita snapshot com ID apagado / série trocada).
      return {
        ...eqItem,
        equipamentoId: idVis || chave || alvo || sn,
        maquinaModelo: modeloCadastro || eqItem.maquinaModelo,
        numeroMaquina: serieCadastro || eqItem.numeroMaquina,
      }
    }

    return {
      ...eqItem,
      equipamentoId:
        resolverIdEquipamentoVisivelRelatorio(eqItem, equipamentosArmazem) || eqItem.equipamentoId,
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
  const sn = String(eq.numeroMaquina ?? '').trim()
  if (sn) return sn

  const idStored = String(eq.equipamentoId ?? '').trim()

  if (eq.equipamentoOrigem === 'armazem') {
    const wh = equipamentosArmazem.find(
      (e) =>
        String(e.id ?? '').trim() === idStored ||
        String(e.numeroSerie ?? '').trim() === idStored
    )
    return String(wh?.numeroSerie ?? '').trim()
  }

  for (let idx = 0; idx < equipamentosCliente.length; idx++) {
    const e = equipamentosCliente[idx]
    if (equipamentoClienteCorrespondeRelatorio(eq, e, idx, equipamentosArmazem)) {
      return String(e.numeroSerie ?? '').trim()
    }
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
