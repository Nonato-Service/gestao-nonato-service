/** Tipos slim para documentos / texto de contabilidade (sem acoplar ao monólito). */

export type ContabAnexoLike = {
  name: string
  size: number
}

export type ClienteContabEnvioModalOpts = {
  valorFatura?: string
  notaFatura?: string
  anexos?: ContabAnexoLike[]
}

export type ClienteContabLike = {
  id: string
  nomeEmpresa?: string
  numeroContribuicaoFiscal?: string
  morada?: string
  localidade?: string
  codigoPostal?: string
  freguesia?: string
  conselho?: string
  pais?: string
  telefones?: string
  email?: string
  contato?: string
}

export type RelatorioContabLike = {
  id: string
  numero: string
  cliente: string
  maquinaModelo?: string
  data: string
}

/** Totais IVA já calculados (injectar resultado de `totaisFechamentoLiquidoComIva`). */
export type FechamentoIvaTotaisContab = {
  liquido: number
  iva: number
  comIva: number
  incluir: boolean
  taxa: number
}

export type ContabLabels = Record<string, string | undefined>
