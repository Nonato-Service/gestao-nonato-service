/** Cliente «ativo» no dia para anexar comprovantes (relatório aberto → fechado → agenda). */
export type ClienteAtivoComprovante = {
  clienteId: string
  clienteNome: string
  origem: 'relatorio' | 'relatorio-fechado' | 'agenda'
  detalhe: string
  /** Minutos até a janela de visita mais próxima (ordenação quando há dúvida). */
  distanciaMinutos?: number
}

export type MotivoAssociacaoRecibo = 'unico' | 'hora' | 'perguntar' | 'pessoal'

export function isoHojeLocal(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Hora local actual HH:MM (ex.: hora da foto). */
export function horaAtualLocal(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

type DiaTrabalhoRef = {
  data: string
  idaChegada?: string
  horasInicio?: string
  horasFim?: string
  retornoSaida?: string
}

type RelatorioRef = {
  id: string
  cliente: string
  clienteId?: string
  data: string
  numero?: string
  servicoConcluido?: boolean
  diasTrabalho?: DiaTrabalhoRef[]
}

type AgendamentoRef = {
  id: string
  cliente: string
  clienteId?: string
  data: string
  hora?: string
  duracaoEstimada?: string
  status: string
  categoria?: string
}

type JanelaPresenca = {
  clienteId: string
  clienteNome: string
  origem: ClienteAtivoComprovante['origem']
  inicioMin: number
  fimMin: number
  detalhe: string
}

function chaveCliente(clienteId: string | undefined, clienteNome: string): string {
  const id = String(clienteId || '').trim()
  if (id) return `id:${id}`
  return `nome:${clienteNome.trim().toLowerCase()}`
}

function mesclarClientesPrioridade(...fontes: ClienteAtivoComprovante[][]): ClienteAtivoComprovante[] {
  const map = new Map<string, ClienteAtivoComprovante>()
  for (const fonte of fontes) {
    for (const c of fonte) {
      const key = chaveCliente(c.clienteId, c.clienteNome)
      if (!map.has(key)) map.set(key, c)
    }
  }
  return Array.from(map.values()).sort((a, b) => a.clienteNome.localeCompare(b.clienteNome, 'pt-BR'))
}

/** Converte HH:MM ou H:MM para minutos desde meia-noite. */
export function parseHoraMinutos(hora: string | undefined | null): number | null {
  const s = String(hora || '').trim()
  if (!s) return null
  const m = s.match(/^(\d{1,2})[:hH](\d{2})$/)
  if (!m) return null
  const h = parseInt(m[1], 10)
  const min = parseInt(m[2], 10)
  if (!Number.isFinite(h) || !Number.isFinite(min) || h < 0 || h > 23 || min < 0 || min > 59) return null
  return h * 60 + min
}

function formatHoraMinutos(minutos: number): string {
  const h = Math.floor(minutos / 60) % 24
  const m = minutos % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function normalizarDataRef(data: string | undefined): string {
  return String(data || '').trim().slice(0, 10)
}

function clientesDeRelatoriosAbertosHoje(
  relatoriosAbertos: RelatorioRef[],
  hoje: string
): ClienteAtivoComprovante[] {
  const map = new Map<string, ClienteAtivoComprovante>()
  for (const r of relatoriosAbertos) {
    const dataRel = normalizarDataRef(r.data)
    if (dataRel !== hoje) continue
    const nome = String(r.cliente || '').trim()
    if (!nome) continue
    const key = chaveCliente(r.clienteId, nome)
    if (map.has(key)) continue
    map.set(key, {
      clienteId: r.clienteId || nome,
      clienteNome: nome,
      origem: 'relatorio',
      detalhe: r.numero ? `Relatório ${r.numero}` : 'Relatório de serviço',
    })
  }
  return Array.from(map.values())
}

function clientesDeRelatoriosFechados(
  relatorios: RelatorioRef[],
  hoje: string,
  diasRecentes?: number
): ClienteAtivoComprovante[] {
  const map = new Map<string, ClienteAtivoComprovante>()
  const hojeDate = new Date(`${hoje}T12:00:00`)
  for (const r of relatorios) {
    if (!r.servicoConcluido) continue
    const dataRel = normalizarDataRef(r.data)
    if (!dataRel) continue
    if (diasRecentes != null && diasRecentes > 0) {
      const dataReport = new Date(`${dataRel}T12:00:00`)
      if (Number.isNaN(dataReport.getTime())) continue
      const diffDias = Math.floor((hojeDate.getTime() - dataReport.getTime()) / (24 * 60 * 60 * 1000))
      if (diffDias < 0 || diffDias > diasRecentes) continue
    } else if (dataRel !== hoje) {
      continue
    }
    const nome = String(r.cliente || '').trim()
    if (!nome) continue
    const key = chaveCliente(r.clienteId, nome)
    if (map.has(key)) continue
    map.set(key, {
      clienteId: r.clienteId || nome,
      clienteNome: nome,
      origem: 'relatorio-fechado',
      detalhe: r.numero ? `Relatório fechado ${r.numero}` : 'Relatório fechado',
    })
  }
  return Array.from(map.values())
}

function clientesDeAgendaHoje(agendamentos: AgendamentoRef[], hoje: string): ClienteAtivoComprovante[] {
  const map = new Map<string, ClienteAtivoComprovante>()
  for (const a of agendamentos) {
    if (a.status === 'cancelado') continue
    if (a.categoria === 'pessoal') continue
    const dataAg = normalizarDataRef(a.data)
    if (dataAg !== hoje) continue
    const nome = String(a.cliente || '').trim()
    if (!nome) continue
    const key = chaveCliente(a.clienteId, nome)
    if (map.has(key)) continue
    map.set(key, {
      clienteId: a.clienteId || nome,
      clienteNome: nome,
      origem: 'agenda',
      detalhe: a.hora ? `Agenda ${a.hora}` : 'Agenda',
    })
  }
  return Array.from(map.values())
}

/** Dias para procurar relatórios fechados quando não há cliente ativo hoje. */
const DIAS_RELATORIOS_FECHADOS_RECENTES = 30

const MINUTOS_JANELA_PADRAO = 4 * 60
const MINUTOS_JANELA_RELATORIO_PADRAO = 8 * 60

function janelasDeRelatorios(relatorios: RelatorioRef[], dataRef: string): JanelaPresenca[] {
  const out: JanelaPresenca[] = []
  for (const r of relatorios) {
    const nome = String(r.cliente || '').trim()
    if (!nome) continue
    const dias = Array.isArray(r.diasTrabalho) ? r.diasTrabalho : []
    for (const dia of dias) {
      if (normalizarDataRef(dia.data) !== dataRef) continue
      const inicio =
        parseHoraMinutos(dia.idaChegada) ??
        parseHoraMinutos(dia.horasInicio) ??
        null
      if (inicio == null) continue
      const fimExplicito =
        parseHoraMinutos(dia.retornoSaida) ?? parseHoraMinutos(dia.horasFim) ?? null
      const fim = fimExplicito != null && fimExplicito > inicio ? fimExplicito : inicio + MINUTOS_JANELA_RELATORIO_PADRAO
      out.push({
        clienteId: r.clienteId || nome,
        clienteNome: nome,
        origem: r.servicoConcluido ? 'relatorio-fechado' : 'relatorio',
        inicioMin: inicio,
        fimMin: fim,
        detalhe:
          fimExplicito != null
            ? `Relatório ${formatHoraMinutos(inicio)}–${formatHoraMinutos(fim)}`
            : `Relatório desde ${formatHoraMinutos(inicio)}`,
      })
    }
  }
  return out
}

function janelasDeAgenda(agendamentos: AgendamentoRef[], dataRef: string): JanelaPresenca[] {
  const doDia = agendamentos
    .filter((a) => {
      if (a.status === 'cancelado') return false
      if (a.categoria === 'pessoal') return false
      return normalizarDataRef(a.data) === dataRef
    })
    .map((a) => ({
      ...a,
      inicioMin: parseHoraMinutos(a.hora),
    }))
    .filter((a) => a.inicioMin != null)
    .sort((a, b) => (a.inicioMin as number) - (b.inicioMin as number))

  const out: JanelaPresenca[] = []
  for (let i = 0; i < doDia.length; i++) {
    const a = doDia[i]
    const nome = String(a.cliente || '').trim()
    if (!nome) continue
    const inicio = a.inicioMin as number
    const proximo = i + 1 < doDia.length ? (doDia[i + 1].inicioMin as number) : null
    const fim = proximo != null && proximo > inicio ? proximo : inicio + MINUTOS_JANELA_PADRAO
    out.push({
      clienteId: a.clienteId || nome,
      clienteNome: nome,
      origem: 'agenda',
      inicioMin: inicio,
      fimMin: fim,
      detalhe: proximo != null ? `Agenda ${formatHoraMinutos(inicio)}–${formatHoraMinutos(fim)}` : `Agenda desde ${formatHoraMinutos(inicio)}`,
    })
  }
  return out
}

function mesclarJanelas(...fontes: JanelaPresenca[][]): JanelaPresenca[] {
  const map = new Map<string, JanelaPresenca>()
  for (const fonte of fontes) {
    for (const j of fonte) {
      const key = chaveCliente(j.clienteId, j.clienteNome)
      const existente = map.get(key)
      if (!existente) {
        map.set(key, j)
        continue
      }
      // Relatório (horários reais) tem prioridade sobre agenda
      const prioridadeNova = j.origem === 'relatorio' || j.origem === 'relatorio-fechado' ? 2 : 1
      const prioridadeExistente =
        existente.origem === 'relatorio' || existente.origem === 'relatorio-fechado' ? 2 : 1
      if (prioridadeNova > prioridadeExistente) map.set(key, j)
    }
  }
  return Array.from(map.values())
}

function distanciaAteJanela(janela: JanelaPresenca, horaMin: number): number {
  if (horaMin >= janela.inicioMin && horaMin < janela.fimMin) return 0
  if (horaMin < janela.inicioMin) return janela.inicioMin - horaMin
  return horaMin - janela.fimMin
}

function ordenarPorProximidadeHora(
  candidatos: ClienteAtivoComprovante[],
  janelas: JanelaPresenca[],
  horaMin: number
): ClienteAtivoComprovante[] {
  const distPorCliente = new Map<string, { dist: number; detalhe: string }>()
  for (const j of janelas) {
    const key = chaveCliente(j.clienteId, j.clienteNome)
    const dist = distanciaAteJanela(j, horaMin)
    const cur = distPorCliente.get(key)
    if (!cur || dist < cur.dist) {
      distPorCliente.set(key, { dist, detalhe: j.detalhe })
    }
  }
  return [...candidatos]
    .map((c) => {
      const info = distPorCliente.get(chaveCliente(c.clienteId, c.clienteNome))
      return {
        ...c,
        distanciaMinutos: info?.dist ?? 9999,
        detalhe: info?.detalhe || c.detalhe,
      }
    })
    .sort((a, b) => {
      const da = a.distanciaMinutos ?? 9999
      const db = b.distanciaMinutos ?? 9999
      if (da !== db) return da - db
      return a.clienteNome.localeCompare(b.clienteNome, 'pt-BR')
    })
}

/** Resolve clientes ativos para comprovantes numa data (relatório / agenda). */
export function resolverClientesAtivosComprovanteHoje(params: {
  /** Data do recibo ou do dia de atendimento (YYYY-MM-DD). Por omissão: hoje. */
  dataReferencia?: string
  /** @deprecated use dataReferencia */
  hoje?: string
  relatoriosAbertos: RelatorioRef[]
  relatoriosFechados?: RelatorioRef[]
  agendamentos: AgendamentoRef[]
}): ClienteAtivoComprovante[] {
  const dataRef = String(params.dataReferencia || params.hoje || isoHojeLocal())
    .trim()
    .slice(0, 10)
  const fechados = params.relatoriosFechados ?? []

  const deAbertos = clientesDeRelatoriosAbertosHoje(params.relatoriosAbertos, dataRef)
  const deFechadosNoDia = clientesDeRelatoriosFechados(fechados, dataRef)
  const deAgenda = clientesDeAgendaHoje(params.agendamentos, dataRef)

  const mesclado = mesclarClientesPrioridade(deAbertos, deFechadosNoDia, deAgenda)
  if (mesclado.length > 0) return mesclado

  if (dataRef === isoHojeLocal()) {
    return mesclarClientesPrioridade(
      clientesDeRelatoriosFechados(fechados, dataRef, DIAS_RELATORIOS_FECHADOS_RECENTES)
    )
  }
  return []
}

export function labelOrigemClienteComprovante(
  origem: ClienteAtivoComprovante['origem'],
  t: Record<string, string | undefined>
): string {
  if (origem === 'relatorio') return t.comprovantesClientesAtivosRelatorio || 'Relatório aberto'
  if (origem === 'relatorio-fechado') return t.comprovantesClientesAtivosRelatorioFechado || 'Relatório fechado'
  return t.comprovantesClientesAtivosAgenda || 'Agenda'
}

export function estadoClienteReciboRapido(sugeridos: ClienteAtivoComprovante[]): {
  clientesSugeridos: ClienteAtivoComprovante[]
  tipoSelecionado: 'cliente' | 'pessoal'
  clienteSelecionado: string
  clienteIdSelecionado: string
} {
  if (sugeridos.length === 1) {
    return {
      clientesSugeridos: sugeridos,
      tipoSelecionado: 'cliente',
      clienteSelecionado: sugeridos[0].clienteNome,
      clienteIdSelecionado: sugeridos[0].clienteId,
    }
  }
  if (sugeridos.length > 1) {
    return {
      clientesSugeridos: sugeridos,
      tipoSelecionado: 'cliente',
      clienteSelecionado: '',
      clienteIdSelecionado: '',
    }
  }
  return {
    clientesSugeridos: [],
    tipoSelecionado: 'pessoal',
    clienteSelecionado: '',
    clienteIdSelecionado: '',
  }
}

/**
 * Foto do recibo → cliente por data + hora (OCR ou hora da foto).
 * Vários clientes no mesmo dia: a hora determina; se houver dúvida, pede escolha.
 */
export function resolverEstadoClienteComprovanteRecibo(params: {
  dataReferencia: string
  /** HH:MM do recibo (OCR) ou hora da captura */
  horaReferencia?: string | null
  relatoriosAbertos: RelatorioRef[]
  relatoriosFechados?: RelatorioRef[]
  agendamentos: AgendamentoRef[]
}): {
  clientesSugeridos: ClienteAtivoComprovante[]
  tipoSelecionado: 'cliente' | 'pessoal'
  clienteSelecionado: string
  clienteIdSelecionado: string
  horaUsada: string | null
  horaOrigem: 'recibo' | 'foto' | null
  motivoAssociacao: MotivoAssociacaoRecibo
} {
  const dataRef = normalizarDataRef(params.dataReferencia)
  const candidatos = resolverClientesAtivosComprovanteHoje({
    dataReferencia: dataRef,
    relatoriosAbertos: params.relatoriosAbertos,
    relatoriosFechados: params.relatoriosFechados,
    agendamentos: params.agendamentos,
  })

  const horaOcr = params.horaReferencia?.trim() || null
  const horaFoto = horaAtualLocal()
  const horaUsada = horaOcr || horaFoto
  const horaOrigem: 'recibo' | 'foto' | null = horaOcr ? 'recibo' : horaUsada ? 'foto' : null
  const horaMin = parseHoraMinutos(horaUsada)

  if (candidatos.length === 0) {
    return {
      ...estadoClienteReciboRapido([]),
      horaUsada: horaMin != null ? horaUsada : null,
      horaOrigem,
      motivoAssociacao: 'pessoal',
    }
  }

  if (candidatos.length === 1) {
    return {
      ...estadoClienteReciboRapido(candidatos),
      horaUsada: horaMin != null ? horaUsada : null,
      horaOrigem,
      motivoAssociacao: 'unico',
    }
  }

  if (horaMin == null) {
    return {
      ...estadoClienteReciboRapido(candidatos),
      horaUsada: null,
      horaOrigem: null,
      motivoAssociacao: 'perguntar',
    }
  }

  const todosRelatorios = [
    ...params.relatoriosAbertos,
    ...(params.relatoriosFechados ?? []),
  ]
  const janelas = mesclarJanelas(
    janelasDeRelatorios(todosRelatorios, dataRef),
    janelasDeAgenda(params.agendamentos, dataRef)
  )

  const matches = janelas.filter((j) => horaMin >= j.inicioMin && horaMin < j.fimMin)

  if (matches.length === 1) {
    const m = matches[0]
    const cliente: ClienteAtivoComprovante = {
      clienteId: m.clienteId,
      clienteNome: m.clienteNome,
      origem: m.origem,
      detalhe: m.detalhe,
      distanciaMinutos: 0,
    }
    return {
      clientesSugeridos: [cliente],
      tipoSelecionado: 'cliente',
      clienteSelecionado: cliente.clienteNome,
      clienteIdSelecionado: cliente.clienteId,
      horaUsada,
      horaOrigem,
      motivoAssociacao: 'hora',
    }
  }

  const ordenados = ordenarPorProximidadeHora(candidatos, janelas, horaMin)
  return {
    ...estadoClienteReciboRapido(ordenados),
    horaUsada,
    horaOrigem,
    motivoAssociacao: 'perguntar',
  }
}
