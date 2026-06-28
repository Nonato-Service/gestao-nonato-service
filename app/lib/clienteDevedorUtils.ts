export type ClienteDevedorLike = {
  isDevedor?: boolean
  saldoPendente?: number
  relatoriosNaoPagoCount?: number
}

/** Cliente marcado como devedor (faturas em aberto ou relatório «não pago»). */
export function isClienteMarcadoDevedor(cliente: ClienteDevedorLike | null | undefined): boolean {
  if (!cliente) return false
  if (Boolean(cliente.isDevedor)) return true
  return Number(cliente.saldoPendente ?? 0) > 0 || Number(cliente.relatoriosNaoPagoCount ?? 0) > 0
}
