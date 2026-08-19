/** Equipamento no relatório de serviço (tipo puro + form vazio). */

export type RelatorioEquipamentoOrigem = 'cliente' | 'armazem'

export type RelatorioEquipamentoRef = {
  uid: string
  equipamentoOrigem: RelatorioEquipamentoOrigem
  equipamentoId: string
  maquinaModelo: string
  numeroMaquina: string
}

/** Estado inicial / limpo de uma linha de equipamento no relatório. */
export function criarEquipamentoRelatorioVazio(
  origem: RelatorioEquipamentoOrigem = 'cliente'
): RelatorioEquipamentoRef {
  return {
    uid: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    equipamentoOrigem: origem,
    equipamentoId: '',
    maquinaModelo: '',
    numeroMaquina: '',
  }
}

/** Alias alinhado aos createEmpty*Form do módulo. */
export function createEmptyEquipamentoRelatorioForm(
  origem: RelatorioEquipamentoOrigem = 'cliente'
): RelatorioEquipamentoRef {
  return criarEquipamentoRelatorioVazio(origem)
}
