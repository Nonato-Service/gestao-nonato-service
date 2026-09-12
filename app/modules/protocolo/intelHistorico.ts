/** Histórico de protocolos do cliente — funções puras, sem I/O. */

import type { ProtocoloServicoMin } from './intelFiltro'

/** Histórico mais recente primeiro; opcionalmente só do mesmo equipamento (série). */
export function historicoProtocolosCliente<T extends ProtocoloServicoMin>(
  todos: T[],
  clienteId: string,
  equipamentoNumeroSerie?: string
): T[] {
  if (!clienteId?.trim()) return []
  const serie = (equipamentoNumeroSerie || '').trim()
  return todos
    .filter((p) => {
      if (p.clienteId !== clienteId) return false
      if (!serie) return true
      return (p.equipamentoNumeroSerie || '').trim() === serie
    })
    .slice()
    .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime())
}

/** Códigos de peça mais frequentes no histórico do cliente/equipamento. */
export function pecasMaisUsadasHistorico(
  todos: ProtocoloServicoMin[],
  clienteId: string,
  equipamentoNumeroSerie?: string,
  limit = 8
): string[] {
  const hist = historicoProtocolosCliente(todos, clienteId, equipamentoNumeroSerie)
  const freq = new Map<string, number>()
  for (const p of hist) {
    for (const raw of p.pecasTrocadasCodigos || []) {
      const c = String(raw || '').trim()
      if (!c) continue
      freq.set(c, (freq.get(c) || 0) + 1)
    }
  }
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([c]) => c)
}
