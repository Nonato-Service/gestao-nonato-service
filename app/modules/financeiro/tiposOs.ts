import type { FechamentoItem } from '../fechamento/tipos'
import type { FechamentoIvaOpcoesRelatorio } from '../fechamento/iva'
import type { ClienteDevedor } from './tipos'
import type { FechamentoFluxoFinanceiroEntryLike } from './fluxoUi'

/** Tipos do módulo Financeiro (OS / faturas / período / IVA). */

export type OrdemServico = {
  id: string
  numeroOS: string // Número único da ordem de serviço
  clienteId: string
  clienteNome: string
  dataAbertura: string // ISO date string
  dataFechamento?: string // ISO date string
  status: 'aberta' | 'em-andamento' | 'concluida' | 'cancelada'
  valorServico: number
  valorPecas: number
  valorTotal: number
  valorIVA: number
  valorSemIVA: number
  taxaIVA?: number
  observacoes?: string
  tecnicoResponsavel?: string
  equipamentoId?: string
  faturasPecas: string[] // IDs das faturas de peças anexadas
}

export type FaturaPecas = {
  id: string
  numeroFatura: string
  ordemServicoId: string // ID da OS à qual está anexada (vazio se só cliente)
  numeroOS: string // Número da OS (para exibição)
  clienteId: string
  clienteNome: string
  dataEmissao: string // ISO date string
  dataVencimento?: string // ISO date string
  valorTotal: number
  valorIVA: number
  valorSemIVA: number
  taxaIVA: number // Percentual de IVA (ex: 23 para 23%)
  status: 'pendente' | 'paga' | 'vencida' | 'cancelada'
  itens: Array<{
    id: string
    descricao: string
    quantidade: number
    precoUnitario: number
    valorTotal: number
    codigoPeca?: string
  }>
  observacoes?: string
  /** PDF ou imagem (base64 data URL) */
  arquivoAnexo?: string
  nomeArquivoOriginal?: string
  tipoArquivo?: string
  /** Indica se já foram enviados ao cliente os dados de conta / IBAN para pagamento */
  contaPagamentoEnviada?: boolean
}

export type IVAControle = {
  id: string
  periodo: string // Formato: "YYYY-MM" para mensal, "YYYY-WW" para semanal, "YYYY" para anual
  tipoPeriodo: 'semanal' | 'mensal' | 'anual'
  dataInicio: string // ISO date string
  dataFim: string // ISO date string
  valorTotalVendas: number
  valorTotalCompras: number
  IVACobrado: number // IVA cobrado nas vendas
  IVAPago: number // IVA pago nas compras
  IVAApagar: number // IVA a pagar (IVA cobrado - IVA pago)
  faturasVendas: string[] // IDs das faturas de vendas
  faturasCompras: string[] // IDs das faturas de compras
  status: 'aberto' | 'fechado' | 'pago'
  dataPagamento?: string // ISO date string
  observacoes?: string
}

export type RelatorioFinanceiro = {
  id: string
  tipo: 'semanal' | 'mensal' | 'anual'
  periodo: string
  dataInicio: string
  dataFim: string
  totalVendas: number
  totalCompras: number
  totalRecebido: number
  totalPago: number
  saldo: number
  totalIVA: number
  numeroOS: number
  numeroFaturas: number
  clientesDevedores: number
  valorTotalDevedores: number
  dataGeracao: string
  /** Fechamentos guardados na biblioteca (serviços) */
  numeroFechamentosBiblioteca?: number
  totalFechamentosBiblioteca?: number
  ivaFechamentosBiblioteca?: number
  recebidoFechamentosBiblioteca?: number
  pendenteFechamentosBiblioteca?: number
}

export type TipoPeriodoFinanceiro = 'semanal' | 'mensal' | 'anual'

export type RelatorioServicoLike = { id: string; data?: string }

export type BuildFinanceiroPeriodoInput = {
  tipo: TipoPeriodoFinanceiro
  agora?: Date
  faturasPecas: FaturaPecas[]
  ordensServico: OrdemServico[]
  relatoriosServico: RelatorioServicoLike[]
  fechamentosGuardadosBibliotecaIds: string[]
  fechamentosRelatorios: Record<string, FechamentoItem[]>
  fechamentoFluxoFinanceiroPorRelatorioId: Record<string, FechamentoFluxoFinanceiroEntryLike | string>
  fechamentoIvaPorRelatorioId: Record<string, FechamentoIvaOpcoesRelatorio>
  fechamentoItensOmitidosPorRelatorio: Record<string, string[]>
  clientesDevedores: ClienteDevedor[]
}
