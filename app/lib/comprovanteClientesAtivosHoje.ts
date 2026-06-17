/** Cliente «ativo» no dia para anexar comprovantes (relatório aberto → fechado → agenda). */
export type ClienteAtivoComprovante = {
  clienteId: string
  clienteNome: string
  origem: 'relatorio' | 'relatorio-fechado' | 'agenda'
  detalhe: string
}

export function isoHojeLocal(): string {
  return new Date().toISOString().slice(0, 10)
}

type RelatorioRef = {
  id: string
  cliente: string
  clienteId?: string
  data: string
  numero?: string
  servicoConcluido?: boolean
}

type AgendamentoRef = {
  id: string
  cliente: string
  clienteId?: string
  data: string
  hora?: string
  status: string
  categoria?: string
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

function clientesDeRelatoriosAbertosHoje(
  relatoriosAbertos: RelatorioRef[],
  hoje: string
): ClienteAtivoComprovante[] {
  const map = new Map<string, ClienteAtivoComprovante>()
  for (const r of relatoriosAbertos) {
    const dataRel = String(r.data || '').trim().slice(0, 10)
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
    const dataRel = String(r.data || '').trim().slice(0, 10)
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
    const dataAg = String(a.data || '').trim().slice(0, 10)
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

/**
 * Resolve clientes ativos para comprovantes do dia.
 * Prioridade (primeira origem vence por cliente): 1) relatórios abertos de hoje;
 * 2) relatórios já fechados de hoje; 3) agenda de hoje;
 * 4) se ainda vazio, relatórios fechados dos últimos 30 dias.
 */
export function resolverClientesAtivosComprovanteHoje(params: {
  hoje?: string
  relatoriosAbertos: RelatorioRef[]
  relatoriosFechados?: RelatorioRef[]
  agendamentos: AgendamentoRef[]
}): ClienteAtivoComprovante[] {
  const hoje = params.hoje || isoHojeLocal()
  const fechados = params.relatoriosFechados ?? []

  const deAbertos = clientesDeRelatoriosAbertosHoje(params.relatoriosAbertos, hoje)
  const deFechadosHoje = clientesDeRelatoriosFechados(fechados, hoje)
  const deAgenda = clientesDeAgendaHoje(params.agendamentos, hoje)

  const mesclado = mesclarClientesPrioridade(deAbertos, deFechadosHoje, deAgenda)
  if (mesclado.length > 0) return mesclado

  return mesclarClientesPrioridade(clientesDeRelatoriosFechados(fechados, hoje, DIAS_RELATORIOS_FECHADOS_RECENTES))
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
