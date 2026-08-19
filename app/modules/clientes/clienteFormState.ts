/** Estado do formulário de cadastro de cliente (tipo + empty / toForm puros). */

import { kmStringForNumberField } from '../relatorio-servico/km'
import type { Cliente } from './clienteTipos'

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

/** Mapa Cliente → estado do formulário de cadastro (edição / sync pós-save). */
export function clienteToForm(cliente: Cliente): ClienteFormState {
  return {
    nomeEmpresa: cliente.nomeEmpresa,
    morada: cliente.morada,
    localidade: cliente.localidade,
    conselho: cliente.conselho,
    pais: cliente.pais,
    codigoPostal: cliente.codigoPostal,
    freguesia: cliente.freguesia,
    numeroContribuicaoFiscal: cliente.numeroContribuicaoFiscal || '',
    telefones: cliente.telefones,
    email: cliente.email,
    contato: cliente.contato,
    photo: cliente.photo || '',
    grupoTarifaId: cliente.grupoTarifaId || '',
    kmIdaPadrao: kmStringForNumberField(cliente.kmIdaPadrao),
    kmRetornoPadrao: kmStringForNumberField(cliente.kmRetornoPadrao),
    tipoCliente: cliente.tipoCliente === 'juridica' ? 'juridica' : 'fisica',
  }
}
