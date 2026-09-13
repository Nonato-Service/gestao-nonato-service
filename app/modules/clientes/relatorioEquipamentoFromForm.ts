/** Validação e mapeamento puro da nota/relatório do equipamento do cliente. */

import type { RelatorioEquipamentoFormFields } from './equipamentoClienteForm'
import type { RelatorioEquipamento } from './equipamentoClienteTipos'

export function isRelatorioEquipamentoFormValid(
  form: Pick<RelatorioEquipamentoFormFields, 'titulo' | 'conteudo'>
): boolean {
  return Boolean(form.titulo.trim() && form.conteudo.trim())
}

export type CreateRelatorioEquipamentoFromFormOpts = {
  id?: string
  dataGeracao?: string
  equipamentoId?: string
  nowMs: number
}

export function createRelatorioEquipamentoFromForm(
  form: RelatorioEquipamentoFormFields,
  opts: CreateRelatorioEquipamentoFromFormOpts
): RelatorioEquipamento {
  return {
    id: opts.id ?? opts.nowMs.toString(),
    titulo: form.titulo,
    conteudo: form.conteudo,
    dataGeracao: opts.dataGeracao ?? new Date(opts.nowMs).toLocaleString('pt-BR'),
    equipamentoId: opts.equipamentoId,
  }
}

export function updateRelatorioEquipamentoFromForm(
  existing: RelatorioEquipamento,
  form: RelatorioEquipamentoFormFields
): RelatorioEquipamento {
  return {
    ...existing,
    titulo: form.titulo,
    conteudo: form.conteudo,
  }
}
