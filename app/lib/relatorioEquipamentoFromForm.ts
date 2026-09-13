import { createRelatorioEquipamentoFromForm as createRelatorioEquipamentoFromFormPure } from '../modules/clientes/relatorioEquipamentoFromForm'
import type { RelatorioEquipamentoFormFields } from '../modules/clientes/equipamentoClienteForm'
import type { RelatorioEquipamento } from '../modules/clientes/equipamentoClienteTipos'

/** Injeta Date.now() no id e na data de geração quando o call-site não envia. */
export function createRelatorioEquipamentoFromForm(
  form: RelatorioEquipamentoFormFields,
  opts?: { id?: string; dataGeracao?: string; equipamentoId?: string }
): RelatorioEquipamento {
  return createRelatorioEquipamentoFromFormPure(form, { ...opts, nowMs: Date.now() })
}
