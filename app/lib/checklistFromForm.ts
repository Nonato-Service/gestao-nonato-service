/**
 * I/O de relógio — fromForm canónico em `app/modules/checklist`.
 */
import {
  createChecklistTemplateFromForm as createChecklistTemplateFromFormPure,
  updateChecklistTemplateFromForm,
  type CreateChecklistTemplateFromFormOpts,
} from '../modules/checklist/templateFromForm'
import {
  createGrupoChecklistFromForm as createGrupoChecklistFromFormPure,
  updateGrupoChecklistFromForm,
  type CreateGrupoChecklistFromFormOpts,
} from '../modules/checklist/grupoFromForm'
import {
  createManutencaoChecklistFromForm as createManutencaoChecklistFromFormPure,
  updateManutencaoChecklistFromForm,
  type CreateManutencaoChecklistFromFormOpts,
} from '../modules/checklist/manutencaoFromForm'
import type { ChecklistTemplateFormState } from '../modules/checklist/templateForm'
import type { GrupoChecklistFormState } from '../modules/checklist/grupoForm'
import type { ManutencaoChecklistFormState } from '../modules/checklist/manutencaoForm'
import type { ChecklistTemplate, GrupoChecklist, ManutencaoChecklist } from '../modules/checklist/tipos'

export { updateChecklistTemplateFromForm, updateGrupoChecklistFromForm, updateManutencaoChecklistFromForm }

/** Injeta Date.now() no id e na data quando o call-site não envia. */
export function createChecklistTemplateFromForm(
  form: ChecklistTemplateFormState,
  opts: Omit<CreateChecklistTemplateFromFormOpts, 'nowMs'> = {}
): ChecklistTemplate {
  return createChecklistTemplateFromFormPure(form, { ...opts, nowMs: Date.now() })
}

export function createGrupoChecklistFromForm(
  form: GrupoChecklistFormState,
  novaFamilia: string,
  opts: Omit<CreateGrupoChecklistFromFormOpts, 'nowMs'> = {}
): GrupoChecklist {
  return createGrupoChecklistFromFormPure(form, novaFamilia, { ...opts, nowMs: Date.now() })
}

export function createManutencaoChecklistFromForm(
  form: ManutencaoChecklistFormState,
  opts: Omit<CreateManutencaoChecklistFromFormOpts, 'nowMs'> = {}
): ManutencaoChecklist {
  return createManutencaoChecklistFromFormPure(form, { ...opts, nowMs: Date.now() })
}
