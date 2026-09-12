/** Ligação relatório de serviço ↔ protocolo — tipo mínimo e funções puras, sem I/O. */

export type RelatorioServicoMin = {
  id: string
  numero?: string
  cliente?: string
  clienteId?: string
  numeroMaquina?: string
  equipamentoId?: string
  data?: string
  tecnico?: string
}

/** Relatórios de serviço do mesmo cliente (e equipamento, se indicado), mais recentes primeiro. */
export function relatoriosServicoParaProtocolo(
  relatorios: RelatorioServicoMin[],
  clienteId: string,
  clienteNome: string,
  equipamentoNumeroSerie?: string
): RelatorioServicoMin[] {
  const cid = (clienteId || '').trim()
  const nome = (clienteNome || '').trim().toLowerCase()
  const serie = (equipamentoNumeroSerie || '').trim()
  if (!cid && !nome) return []

  const hits = relatorios.filter((r) => {
    const matchCliente =
      (cid && (r.clienteId || '').trim() === cid) ||
      (nome && (r.cliente || '').trim().toLowerCase() === nome)
    if (!matchCliente) return false
    if (!serie) return true
    const sn = (r.numeroMaquina || '').trim()
    const eqId = (r.equipamentoId || '').trim()
    return sn === serie || eqId === serie
  })

  return hits.slice().sort((a, b) => {
    const ta = new Date(a.data || 0).getTime()
    const tb = new Date(b.data || 0).getTime()
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta)
  })
}

/** Sugere o relatório mais provável (mesmo cliente + série, ou o mais recente do cliente). */
export function sugerirRelatorioServicoId(
  relatorios: RelatorioServicoMin[],
  clienteId: string,
  clienteNome: string,
  equipamentoNumeroSerie?: string,
  atual?: string
): string {
  if (atual?.trim()) return atual.trim()
  const lista = relatoriosServicoParaProtocolo(relatorios, clienteId, clienteNome, equipamentoNumeroSerie)
  return lista[0]?.id || ''
}
