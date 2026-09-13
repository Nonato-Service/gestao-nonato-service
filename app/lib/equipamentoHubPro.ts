import { buildItensFaturaDeOrcamentoAprovado as buildItensFaturaDeOrcamentoAprovadoPure } from '../modules/clientes/equipamentoHubPro'

/** Injeta Date.now() nos ids das linhas de fatura do hub do equipamento. */
export function buildItensFaturaDeOrcamentoAprovado(
  input: Omit<Parameters<typeof buildItensFaturaDeOrcamentoAprovadoPure>[0], 'nowMs'>
) {
  return buildItensFaturaDeOrcamentoAprovadoPure({ ...input, nowMs: Date.now() })
}
