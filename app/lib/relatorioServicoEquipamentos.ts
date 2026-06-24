export type RelatorioEquipamentoOrigem = 'cliente' | 'armazem'

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
  if (eq.equipamentoOrigem !== 'cliente') return null
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
  maquinaModelo: string
}

export type RelatorioEquipamentoRef = {
  uid: string
  equipamentoOrigem: RelatorioEquipamentoOrigem
  equipamentoId: string
  maquinaModelo: string
  numeroMaquina: string
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
  eq: { id?: string; numeroSerie?: string },
  idx = 0
): string {
  return String(eq.id || eq.numeroSerie || idx).trim()
}

/** true = ID gerado pela app (UUID ou prefixo eqc-), não código próprio do utilizador. */
export function equipamentoIdETecnicoGerado(id: string | undefined): boolean {
  const t = String(id ?? '').trim()
  if (!t) return true
  if (/^eqc-/i.test(t)) return true
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89abAB][0-9a-f]{3}-[0-9a-f]{12}$/i.test(t)
}

/** ID visível no relatório/PDF: código do cliente, ID do armazém pela série; nunca UUID interno. */
export function resolverIdEquipamentoVisivelCliente(
  eq: { id?: string; numeroSerie?: string },
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = []
): string {
  const idC = String(eq.id ?? '').trim()
  if (idC && !equipamentoIdETecnicoGerado(idC)) return idC
  const s = String(eq.numeroSerie ?? '').trim()
  if (s) {
    const wh = equipamentosArmazem.find(
      (e) => String(e.numeroSerie ?? '').trim().toLowerCase() === s.toLowerCase()
    )
    const idA = String(wh?.id ?? '').trim()
    if (idA && !equipamentoIdETecnicoGerado(idA)) return idA
  }
  return equipamentoIdETecnicoGerado(idC) ? '' : idC
}

export function resolverIdEquipamentoVisivelRelatorio(
  eq: RelatorioEquipamentoRef,
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = []
): string {
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
  rel: { clienteId?: string; cliente?: string },
  clientes: { id: string; nomeEmpresa?: string }[]
): string {
  const cid = String(rel.clienteId ?? '').trim()
  if (cid && clientes.some((c) => c.id === cid)) return cid
  const nome = String(rel.cliente ?? '')
    .trim()
    .toLowerCase()
  if (!nome) return cid
  const hit = clientes.find(
    (c) => String(c.nomeEmpresa ?? '').trim().toLowerCase() === nome
  )
  return hit?.id || cid
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

  return equipamentosRaw.map((eqItem) => {
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
      return {
        ...eqItem,
        equipamentoId: idVis || chave || alvo || sn,
        maquinaModelo:
          eqItem.maquinaModelo ||
          `${String(eqMatch.modelo ?? '').trim()} ${String(eqMatch.marca ?? '').trim()}`.trim(),
        numeroMaquina: eqItem.numeroMaquina || String(eqMatch.numeroSerie ?? '').trim(),
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

export function criarEquipamentoRelatorioVazio(
  origem: RelatorioEquipamentoOrigem = 'cliente'
): RelatorioEquipamentoRef {
  return {
    uid: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    equipamentoOrigem: origem,
    equipamentoId: '',
    maquinaModelo: '',
    numeroMaquina: '',
  }
}

export function equipamentosRelatorioPreenchidos(
  equipamentos: RelatorioEquipamentoRef[]
): RelatorioEquipamentoRef[] {
  return equipamentos.filter((eq) => eq.equipamentoId || eq.maquinaModelo || eq.numeroMaquina)
}

export function normalizarEquipamentosRelatorio(
  r: RelatorioServicoEquipamentosHost
): RelatorioEquipamentoRef[] {
  if (Array.isArray(r.equipamentos) && r.equipamentos.length > 0) {
    return r.equipamentos.slice(0, MAX_EQUIPAMENTOS_RELATORIO).map((eq, i) => ({
      uid: eq.uid || `eq-${i}-${eq.equipamentoId || i}`,
      equipamentoOrigem: eq.equipamentoOrigem === 'armazem' ? 'armazem' : 'cliente',
      equipamentoId: String(eq.equipamentoId ?? '').trim(),
      maquinaModelo: String(eq.maquinaModelo ?? '').trim(),
      numeroMaquina: String(eq.numeroMaquina ?? '').trim(),
    }))
  }

  const id = String(r.equipamentoId ?? '').trim()
  const modelo = String(r.maquinaModelo ?? '').trim()
  const sn = String(r.numeroMaquina ?? '').trim()
  if (!id && !modelo && !sn) return []

  return [
    {
      uid: 'legacy-0',
      equipamentoOrigem: r.equipamentoOrigem === 'armazem' ? 'armazem' : 'cliente',
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
  const origemTag = eq.equipamentoOrigem === 'armazem' ? '(Armazém)' : ''
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
      numeros: list[0].numeroMaquina || '—',
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
    if (eq.equipamentoOrigem === 'cliente' && !eq.equipamentoId && !eq.maquinaModelo) {
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
    const tagArmazem =
      eq.equipamentoOrigem === 'armazem' ? ' (Armazém — gestão industrial)' : ''
    return {
      ...r,
      equipamentos,
      equipamentoId: cabecalho.ids !== '—' ? cabecalho.ids : eq.equipamentoId,
      equipamentoOrigem: eq.equipamentoOrigem,
      maquinaModelo: `${eq.maquinaModelo || '—'}${tagArmazem}`.trim(),
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
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = []
): string[] {
  return [
    ...new Set(
      equipamentosRelatorioPreenchidos(equipamentos)
        .filter((eq) => eq.equipamentoOrigem !== 'armazem')
        .map((eq) => resolverIdEquipamentoVisivelRelatorio(eq, equipamentosArmazem))
        .filter(Boolean)
    ),
  ]
}

type ClienteRelatoriosHost = {
  id: string
  relatorios?: Record<string, Array<{ id: string; data: string; numero: string }>>
}

export function aplicarRelatorioNaBibliotecaCliente<T extends ClienteRelatoriosHost, R extends { id: string; data: string; numero: string } & RelatorioServicoEquipamentosHost>(
  clientes: T[],
  savedRelatorio: R,
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = []
): T[] {
  if (!savedRelatorio.clienteId) return clientes

  const keys = equipamentosClienteParaBiblioteca(
    normalizarEquipamentosRelatorio(savedRelatorio),
    equipamentosArmazem
  )
  const clienteIndex = clientes.findIndex((c) => c.id === savedRelatorio.clienteId)
  if (clienteIndex === -1) return clientes

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
