/** Tipos e chave de persistência dos painéis retraíveis dos hubs. */

export type HubPainelModulo = 'biblioteca' | 'relatorio-servico' | 'relatorio-especial'
export type HubPainelStatus = 'ok' | 'incomplete' | 'empty'

export const HUB_PAINEL_LS_PREFIX_BY_MODULO: Record<HubPainelModulo, string> = {
  biblioteca: 'nonato-biblioteca-painel-',
  'relatorio-servico': 'nonato-relatorio-servico-painel-',
  'relatorio-especial': 'nonato-relatorio-especial-painel-',
}

export function hubPainelLsPrefix(modulo: HubPainelModulo): string {
  return HUB_PAINEL_LS_PREFIX_BY_MODULO[modulo]
}

export function hubPainelLsKey(modulo: HubPainelModulo, id: string): string {
  return `${hubPainelLsPrefix(modulo)}${id}`
}
