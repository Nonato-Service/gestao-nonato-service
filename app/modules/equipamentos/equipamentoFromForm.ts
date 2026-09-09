/** Validação, duplicado de ID e mapeamento puro do equipamento do armazém. */

import type { Equipamento, EquipamentoFormState } from './formState'

const CAMPOS_OBRIGATORIOS = [
  'id',
  'tipoEquipamento',
  'modelo',
  'marca',
  'numeroSerie',
  'familia',
  'grupo',
] as const

export type EquipamentoFormCamposObrigatorios = Pick<
  EquipamentoFormState,
  (typeof CAMPOS_OBRIGATORIOS)[number]
>

/** Campos obrigatórios no save (ID, tipo, modelo, marca, n.º de série, família, grupo). */
export function isEquipamentoFormValid(form: EquipamentoFormCamposObrigatorios): boolean {
  return Boolean(
    form.id &&
      form.tipoEquipamento &&
      form.modelo &&
      form.marca &&
      form.numeroSerie &&
      form.familia &&
      form.grupo
  )
}

/** Mesmo ID noutro equipamento do armazém (na edição exclui o próprio). */
export function equipamentoIdDuplicado(
  equipamentos: Pick<Equipamento, 'id'>[],
  id: string,
  excludeId?: string
): boolean {
  return equipamentos.some((e) => e.id === id && e.id !== excludeId)
}

/** Monta um Equipamento novo a partir do form (status activo; sem I/O / alertas). */
export function createEquipamentoFromForm(form: EquipamentoFormState): Equipamento {
  return {
    ...form,
    status: 'ativo',
  }
}

/** Actualiza campos do form (preserva status e dataBaixa do existente). */
export function updateEquipamentoFromForm(
  existing: Equipamento,
  form: EquipamentoFormState
): Equipamento {
  return {
    ...form,
    status: existing.status || 'ativo',
    dataBaixa: existing.dataBaixa,
  }
}
