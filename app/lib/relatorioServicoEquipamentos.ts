export type RelatorioEquipamentoOrigem = 'cliente' | 'armazem'

export type EquipamentoArmazemIdLookup = { id?: string; numeroSerie?: string }

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
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = []
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
    equipamentoId: resolverIdEquipamentoVisivelRelatorio(eq, equipamentosArmazem) || '—',
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
