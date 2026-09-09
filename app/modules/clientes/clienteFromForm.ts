/** Criação / actualização pura de Cliente a partir do formulário de cadastro. */

import { normalizeKmForPersist } from '../relatorio-servico/km'
import type { Cliente } from './clienteTipos'
import type { ClienteFormState } from './clienteFormState'

export type ClienteFromFormCreateOpts = {
  id?: string
  codigoCliente: string
}

function fieldsFromClienteForm(form: ClienteFormState) {
  return {
    nomeEmpresa: form.nomeEmpresa,
    morada: form.morada,
    localidade: form.localidade,
    conselho: form.conselho,
    pais: form.pais,
    codigoPostal: form.codigoPostal,
    freguesia: form.freguesia,
    numeroContribuicaoFiscal: form.numeroContribuicaoFiscal,
    telefones: form.telefones,
    email: form.email,
    contato: form.contato,
    photo: form.photo,
    grupoTarifaId: (form.grupoTarifaId || '').trim() || undefined,
    kmIdaPadrao: normalizeKmForPersist(form.kmIdaPadrao),
    kmRetornoPadrao: normalizeKmForPersist(form.kmRetornoPadrao),
    tipoCliente: (form.tipoCliente === 'juridica' ? 'juridica' : 'fisica') as Cliente['tipoCliente'],
  }
}

/** Monta um Cliente novo a partir do form (sem I/O / alertas / persistência). */
export function createClienteFromForm(
  form: ClienteFormState,
  opts: ClienteFromFormCreateOpts
): Cliente {
  return {
    id: opts.id ?? Date.now().toString(),
    codigoCliente: opts.codigoCliente,
    ...fieldsFromClienteForm(form),
    equipamentos: [],
    relatorios: {},
  }
}

/** Actualiza campos editáveis do Cliente a partir do form (preserva id, equipamentos e extras). */
export function updateClienteFromForm(existing: Cliente, form: ClienteFormState): Cliente {
  return {
    ...existing,
    ...fieldsFromClienteForm(form),
  }
}
