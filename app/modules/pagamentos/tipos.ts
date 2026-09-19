/** Tipos canónicos de PAGAMENTOS — empresas recebedoras (não fornecedores) e saídas. */

export const PAGAMENTOS_EMPRESAS_STORAGE_KEY = 'nonato-pagamentos-empresas'
export const PAGAMENTOS_REGISTOS_STORAGE_KEY = 'nonato-pagamentos-registos'

export type PagamentoMetodo = 'referencia' | 'transferencia' | 'entidade-referencia'

export type EmpresaRecebedoraTipo =
  | 'financas'
  | 'seguranca-social'
  | 'imposto-nsa'
  | 'irs'
  | 'contadora'
  | 'advogada'
  | 'outra'

export type EmpresaRecebedora = {
  id: string
  nome: string
  tipo?: EmpresaRecebedoraTipo
  nif?: string
  contribuinte?: string
  iban?: string
  banco?: string
  notas?: string
  apagado?: boolean
  criadoEm: string
  atualizadoEm: string
}

export type PagamentoSaidaStatus = 'pendente' | 'pago'

export type AnexoPagamentoPapel = 'a-pagar' | 'pago'

export type AnexoPagamento = {
  id: string
  nome: string
  mime: string
  base64: string
  papel: AnexoPagamentoPapel
  criadoEm: string
}

export type PagamentoSaida = {
  id: string
  empresaId: string
  empresaNome: string
  paraQuem: string
  metodo: PagamentoMetodo
  referencia?: string
  entidade?: string
  iban?: string
  banco?: string
  contribuinte?: string
  valor: number
  dataPagamento: string
  descricao?: string
  status: PagamentoSaidaStatus
  anexos: AnexoPagamento[]
  criadoEm: string
  atualizadoEm: string
}

export const PAGAMENTO_METODOS: readonly PagamentoMetodo[] = [
  'referencia',
  'transferencia',
  'entidade-referencia',
]
