/** Tipos canónicos do orçamento de serviço técnico (OST). */

export type ServicoOrcamentoTipoCobranca =
  | 'unidade'
  | 'km'
  | 'hora'
  | 'valor-fixo'
  | 'diarias'
  | 'extras'

export type ServicoOrcamentoLinha = {
  id: string
  cod?: string
  nome: string
  descricao?: string
  valor: number
  tipoCobranca: ServicoOrcamentoTipoCobranca
  categoria: 'servico' | 'despesa'
}

export type ClienteOrcamentoLite = {
  id: string
  nomeEmpresa: string
  morada?: string
  localidade?: string
  codigoPostal?: string
  conselho?: string
  pais?: string
  telefones?: string
  email?: string
}

export type OstPropostaLinha = {
  rowId: string
  servicoId: string
  quantidadeStr: string
}

export type OstPropostaPayload = {
  clienteId: string
  clienteManual: string
  refDoc: string
  localServico: string
  dataDoc: string
  validade: string
  intro: string
  clausulas: string
  linhas: OstPropostaLinha[]
}

export type OstPropostaSalva = {
  id: string
  nome: string
  criadoEm: string
  atualizadoEm: string
  payload: OstPropostaPayload
}

export type OstRascunhoAtual = OstPropostaPayload & {
  v: 1
  propostaEditandoId: string | null
  propostaNome: string
  guardadoEm: string
}
