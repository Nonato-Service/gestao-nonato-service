/** Cliente «ativo» no dia para anexar comprovantes (relatório aberto → agenda). */
export type ClienteAtivoComprovante = {
  clienteId: string
  clienteNome: string
  origem: 'relatorio' | 'agenda'
  detalhe: string
}

export function isoHojeLocal(): string {
  return new Date().toISOString().slice(0, 10)
}

type RelatorioAbertoRef = {
  id: string
  cliente: string
  clienteId?: string
  data: string
  numero?: string
}

type AgendamentoRef = {
  id: string
  cliente: string
  clienteId?: string
  data: string
  hora?: string
  status: string
}

function chaveCliente(clienteId: string | undefined, clienteNome: string): string {
  const id = String(clienteId || '').trim()
  if (id) return `id:${id}`
  return `nome:${clienteNome.trim().toLowerCase()}`
}

function clientesDeRelatoriosAbertosHoje(
  relatoriosAbertos: RelatorioAbertoRef[],
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
  return Array.from(map.values()).sort((a, b) => a.clienteNome.localeCompare(b.clienteNome, 'pt-BR'))
}

function clientesDeAgendaHoje(agendamentos: AgendamentoRef[], hoje: string): ClienteAtivoComprovante[] {
  const map = new Map<string, ClienteAtivoComprovante>()
  for (const a of agendamentos) {
    if (a.status === 'cancelado') continue
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
  return Array.from(map.values()).sort((a, b) => a.clienteNome.localeCompare(b.clienteNome, 'pt-BR'))
}

/**
 * Resolve clientes ativos para comprovantes do dia.
 * Prioridade: 1) relatórios abertos (lista principal) com data de hoje;
 *             2) agenda de hoje (só se não houver relatório de hoje).
 */
export function resolverClientesAtivosComprovanteHoje(params: {
  hoje?: string
  relatoriosAbertos: RelatorioAbertoRef[]
  agendamentos: AgendamentoRef[]
}): ClienteAtivoComprovante[] {
  const hoje = params.hoje || isoHojeLocal()
  const deRelatorios = clientesDeRelatoriosAbertosHoje(params.relatoriosAbertos, hoje)
  if (deRelatorios.length > 0) return deRelatorios
  return clientesDeAgendaHoje(params.agendamentos, hoje)
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
