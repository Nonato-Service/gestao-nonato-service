/** Equipamento no relatório de serviço (tipo puro + form vazio). */

export type RelatorioEquipamentoOrigem = 'cliente' | 'armazem' | 'clientes-externos'

export type RelatorioEquipamentoRef = {
  uid: string
  equipamentoOrigem: RelatorioEquipamentoOrigem
  equipamentoId: string
  maquinaModelo: string
  numeroMaquina: string
  /** Quando origem = clientes-externos: id do outro cliente no cadastro. */
  clienteExternoId?: string
  /** Nome do cliente externo (persistido para PDF/resumo se o cadastro mudar). */
  clienteExternoNome?: string
}

/** Normaliza origem antiga/desconhecida sem perder dados do utilizador. */
export function normalizarEquipamentoOrigem(origem: unknown): RelatorioEquipamentoOrigem {
  if (origem === 'armazem' || origem === 'clientes-externos') return origem
  return 'cliente'
}

/** Clientes do cadastro excepto o cliente principal do relatório. */
export function clientesExternosParaEquipamentoRelatorio<T extends { id?: string }>(
  clientes: T[],
  clientePrincipalId: string
): T[] {
  const principal = String(clientePrincipalId || '').trim()
  return (clientes || []).filter((c) => {
    if (c == null || typeof c !== 'object') return false
    const id = String(c.id ?? '').trim()
    return id !== '' && id !== principal
  })
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
    clienteExternoId: '',
    clienteExternoNome: '',
  }
}

/** Alias alinhado aos createEmpty*Form do módulo. */
export function createEmptyEquipamentoRelatorioForm(
  origem: RelatorioEquipamentoOrigem = 'cliente'
): RelatorioEquipamentoRef {
  return criarEquipamentoRelatorioVazio(origem)
}
