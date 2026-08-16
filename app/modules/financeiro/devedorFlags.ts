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

/**
 * Fluxo financeiro da OS: «não pago» ou marcado devedor —
 * mesmo critério do cartão vermelho no cadastro.
 */
export function relatorioFluxoFinanceiroNaoPago(fr: unknown): boolean {
  const frObj =
    fr && typeof fr === 'object' && !Array.isArray(fr)
      ? (fr as { situacaoFatura?: string; pagamento?: string })
      : null
  if (!frObj) return false
  return frObj.situacaoFatura === 'nao_paga' || frObj.pagamento === 'devedor'
}
