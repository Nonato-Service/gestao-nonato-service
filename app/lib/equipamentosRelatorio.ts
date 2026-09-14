/**
 * I/O de relógio/aleatório — baixa por venda canónica em `app/modules/equipamentos/relatorio`.
 */
import {
  aplicarBaixaVendaEquipamentosArmazemRelatorio as aplicarBaixaVendaEquipamentosArmazemRelatorioPure,
  type EquipamentoArmazemBaixaLookup,
  type EquipamentoArmazemVendidoInfo,
  type RelatorioServicoEquipamentosHost,
} from '../modules/equipamentos/relatorio'

/** Injeta Date.now() e Math.random() na data de baixa e no id do histórico. */
export function aplicarBaixaVendaEquipamentosArmazemRelatorio<
  T extends EquipamentoArmazemBaixaLookup
>(
  relatorio: RelatorioServicoEquipamentosHost & {
    data?: string
    numero?: string
    cliente?: string
    tecnico?: string
  },
  equipamentosArmazem: T[]
): { equipamentos: T[]; vendidos: EquipamentoArmazemVendidoInfo[] } {
  return aplicarBaixaVendaEquipamentosArmazemRelatorioPure(relatorio, equipamentosArmazem, {
    nowMs: Date.now(),
    random: Math.random,
  })
}
