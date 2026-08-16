/** Tipos partilhados do módulo Fechamento (cobrança / tarifas). */

export type ServicoCadastroFechamentoMin = {
  id: string
  cod?: string
  nome: string
  descricao?: string
  valor: number
  tipoCobranca: string
  categoria?: string
  grupoId?: string
}

/** Item de cobrança no fechamento de um relatório (vinculado ao Cadastro de Serviços). */
export type FechamentoItem = {
  id: string
  descricao: string
  cod?: string
  servicoId?: string
  tipoCobranca: 'hora' | 'km' | 'valor-fixo' | 'unidade' | 'diarias' | 'extras'
  quantidade: number
  valorUnitario: number
  valorTotal: number
  origem?: 'relatorio' | 'manual'
  /** Nota curta visível para o cliente (itens manuais / peças sem orçamento) */
  infoAdicional?: string
  /** Apenas para item Diárias: false = não cobrar diária ao cliente (Sim/Não) */
  cobrarDiaria?: boolean
}

export const FECHAMENTO_IDS_FIXOS_TEMPLATE = ['ht', 'km', 'diarias', 'hida', 'hret'] as const

export type FechamentoLinhaIdFixo = (typeof FECHAMENTO_IDS_FIXOS_TEMPLATE)[number]
