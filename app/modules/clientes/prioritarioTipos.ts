/** Tipos canónicos do cliente prioritário (cadastro admin / dados fiscais Nonato). */

export type ClientePrioritario = {
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
  photo?: string
  /** Equipamentos associados (legado; UI admin não edita esta coleção). */
  equipamentos?: unknown[]
  /** Relatórios por equipamento (legado). */
  relatorios?: Record<string, unknown[]>
}

export type ClientePrioritarioForm = {
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
  photo: string
}

/** Campos considerados no indicador de completude do formulário. */
export const CLIENTE_PRIORITARIO_FORM_TRACKED_FIELDS: (keyof ClientePrioritarioForm)[] = [
  'nomeEmpresa',
  'morada',
  'localidade',
  'conselho',
  'pais',
  'codigoPostal',
  'freguesia',
  'numeroContribuicaoFiscal',
  'telefones',
  'email',
  'contato',
  'photo',
]
