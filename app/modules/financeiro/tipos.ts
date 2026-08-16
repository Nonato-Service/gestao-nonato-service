/** Tipos do módulo Financeiro (devedores / cobrança). */

export type ClienteDevedorFaturaPendente = {
  faturaId: string
  numeroFatura: string
  numeroOS?: string
  valor: number
  dataVencimento?: string
  diasVencido?: number
}

export type ClienteDevedor = {
  clienteId: string
  clienteNome: string
  totalDevido: number
  totalPago: number
  saldoPendente: number
  numeroFaturasPendentes: number
  numeroFaturasVencidas: number
  ultimaAtualizacao: string
  faturasPendentes: ClienteDevedorFaturaPendente[]
  isDevedor: boolean
  /** Relatórios com fechamento «não pago» / devedor */
  relatoriosNaoPagoCount?: number
  /** Relatório mais recente ainda «não pago»/devedor */
  ultimoRelatorioNaoPagoId?: string
}

export type FaturaPecasDevedorLike = {
  id: string
  clienteId: string
  clienteNome: string
  numeroFatura: string
  numeroOS?: string
  valorTotal: number
  status: string
  dataVencimento?: string
}

export type RelatorioParaDevedorLike = {
  id: string
  numero?: string
  data?: string
  cliente?: string
  clienteId?: string
}

export type FechamentoItemDevedorLike = {
  id: string
  valorTotal: number
  cobrarDiaria?: boolean
}

export type FechamentoIvaDevedorLike = {
  incluirIva: boolean
  taxaIva: number
}

export type ClienteCadastroDevedorFlags = {
  id: string
  isDevedor?: boolean
  saldoPendente?: number
  relatoriosNaoPagoCount?: number
  ultimoRelatorioDevedorId?: string
}
