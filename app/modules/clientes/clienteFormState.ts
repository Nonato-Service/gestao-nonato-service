/** Estado do formulário de cadastro de cliente (tipo + empty puro). */

export type ClienteFormState = {
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
  grupoTarifaId: string
  kmIdaPadrao: string
  kmRetornoPadrao: string
  tipoCliente: 'fisica' | 'juridica'
}

/** Estado inicial / limpo do formulário de cadastro de cliente. */
export function emptyClienteFormState(grupoTarifaId = ''): ClienteFormState {
  return {
    nomeEmpresa: '',
    morada: '',
    localidade: '',
    conselho: '',
    pais: '',
    codigoPostal: '',
    freguesia: '',
    numeroContribuicaoFiscal: '',
    telefones: '',
    email: '',
    contato: '',
    photo: '',
    grupoTarifaId,
    kmIdaPadrao: '',
    kmRetornoPadrao: '',
    tipoCliente: 'fisica',
  }
}
