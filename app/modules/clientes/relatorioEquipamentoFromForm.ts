/** Validação e mapeamento puro da nota/relatório do equipamento do cliente. */

import type { RelatorioEquipamentoFormFields } from './equipamentoClienteForm'
import type { RelatorioEquipamento } from './equipamentoClienteTipos'

export function isRelatorioEquipamentoFormValid(
  form: Pick<RelatorioEquipamentoFormFields, 'titulo' | 'conteudo'>
): boolean {
  return Boolean(form.titulo.trim() && form.conteudo.trim())
}

export function createRelatorioEquipamentoFromForm(
  form: RelatorioEquipamentoFormFields,
  opts?: { id?: string; dataGeracao?: string; equipamentoId?: string }
): RelatorioEquipamento {
  return {
    id: opts?.id ?? Date.now().toString(),
    titulo: form.titulo,
    conteudo: form.conteudo,
    dataGeracao: opts?.dataGeracao ?? new Date().toLocaleString('pt-BR'),
    equipamentoId: opts?.equipamentoId,
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
