/** Estado vazio, mapeamento e criação/atualização pura do cliente prioritário. */

import {
  CLIENTE_PRIORITARIO_FORM_TRACKED_FIELDS,
  type ClientePrioritario,
  type ClientePrioritarioForm,
} from './prioritarioTipos'

export function emptyClientePrioritarioForm(): ClientePrioritarioForm {
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
  }
}

export function clientePrioritarioToForm(
  cliente: ClientePrioritario
): ClientePrioritarioForm {
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
  }
}

/** Campos obrigatórios no save (nome, morada, email). */
export function isClientePrioritarioFormValid(form: ClientePrioritarioForm): boolean {
  return Boolean(form.nomeEmpresa && form.morada && form.email)
}

export function createClientePrioritarioFromForm(
  form: ClientePrioritarioForm,
  id?: string
): ClientePrioritario {
  return {
    id: id ?? Date.now().toString(),
    ...form,
    equipamentos: [],
    relatorios: {},
  }
}

export function updateClientePrioritarioFromForm(
  existing: ClientePrioritario,
  form: ClientePrioritarioForm
): ClientePrioritario {
  return {
    ...existing,
    ...form,
    equipamentos: existing.equipamentos || [],
    relatorios: existing.relatorios || {},
  }
}

export function clientePrioritarioFormCompleteness(
  data: Partial<ClientePrioritarioForm> | ClientePrioritario | null
): number {
  if (!data) return 0
  const filled = CLIENTE_PRIORITARIO_FORM_TRACKED_FIELDS.filter(
    (key) => String((data as ClientePrioritarioForm)[key] || '').trim().length > 0
  ).length
  return Math.round((filled / CLIENTE_PRIORITARIO_FORM_TRACKED_FIELDS.length) * 100)
}

export function formatClientePrioritarioAddress(
  data: Pick<
    ClientePrioritarioForm,
    'morada' | 'localidade' | 'freguesia' | 'conselho' | 'codigoPostal' | 'pais'
  >
): string {
  return [data.morada, data.localidade, data.freguesia, data.conselho, data.codigoPostal, data.pais]
    .map((part) => (part || '').trim())
    .filter(Boolean)
    .join(' · ')
}
