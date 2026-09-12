/** Tipos canónicos do registo de despesas (cartão, linha e documento). */

export type CartaoEmpresaDespesas = {
  id: string
  apelido: string
  ultimos4: string
  criadoEm: string
}

export type DespesaRegistro = {
  id: string
  tipoId: string
  tipoNome: string
  valor: number
  descricao: string
  codigoBarras?: string
  fotos: string[]
  data: string
  /** Id do cartão no cadastro; opcional */
  cartaoId?: string
  /** Rótulo fixo na linha (ex.: "Combustível •••• 1234") para PDF mesmo se o cartão for removido depois */
  cartaoRotulo?: string
}

export type DespesaDocumento = {
  id: string
  clienteId: string
  clienteNome: string
  relatorioId?: string
  relatorioNumero?: string
  data: string
  despesas: DespesaRegistro[]
  dataCriacao: string
}
