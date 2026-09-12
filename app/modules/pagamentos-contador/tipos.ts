/** Tipos canónicos de pagamentos ao contabilista / entidades fiscais. */

export type CategoriaEntidadeContador =
  | 'irs'
  | 'seguranca_social'
  | 'advogado'
  | 'contabilista'
  | 'seguros'
  | 'outro'

export type EntidadeContador = {
  id: string
  nome: string
  categoria: CategoriaEntidadeContador
  nif?: string
  contacto?: string
  notas?: string
  ativo: boolean
  criadoEm: string
}

export type AnexoContador = {
  id: string
  nome: string
  mime: string
  base64: string
  criadoEm: string
}

export type PagamentoContadorStatus = 'pago' | 'pendente'

export type PagamentoContador = {
  id: string
  entidadeId: string
  entidadeNome: string
  dataPagamento: string
  valor: number
  periodoReferencia: string
  numeroDocumento?: string
  descricao?: string
  status: PagamentoContadorStatus
  anexos: AnexoContador[]
  criadoEm: string
  atualizadoEm: string
}
