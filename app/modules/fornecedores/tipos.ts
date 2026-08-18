/** Tipos canónicos de fornecedores e faturas associadas. */

export type FaturaFornecedor = {
  id: string
  numeroFatura: string
  mes: string // Formato: "YYYY-MM" (ex: "2024-01")
  valor: number
  /** ID do cliente OU do fornecedor (ver entidadeOrigem); nome em clienteNome */
  clienteId: string
  clienteNome: string
  dataVencimento?: string
  status: 'pendente' | 'paga' | 'vencida'
  observacoes?: string
  /** Legado: omitido = tratado como cliente */
  entidadeOrigem?: 'cliente' | 'fornecedor'
}

export type Fornecedor = {
  id: string
  nomeEmpresa: string
  morada: string
  localidade: string
  conselho: string
  pais: string
  codigoPostal: string
  freguesia: string
  numeroContribuicaoFiscal: string
  telefones: string
  email: string
  contato: string
  iban: string
  faturas: FaturaFornecedor[]
}

export type FornecedorFormState = {
  nomeEmpresa: string
  morada: string
  localidade: string
  conselho: string
  pais: string
  codigoPostal: string
  freguesia: string
  numeroContribuicaoFiscal: string
  telefones: string
  email: string
  contato: string
  iban: string
}

export type FaturaFornecedorFormState = {
  numeroFatura: string
  mes: string
  /** Texto do valor em formato PT (ex.: 350,00); evita input type=number com zero inicial. */
  valorText: string
  clienteId: string
  clienteNome: string
  dataVencimento: string
  status: 'pendente' | 'paga' | 'vencida'
  observacoes: string
  entidadeOrigem: 'fornecedor' | 'cliente'
}
