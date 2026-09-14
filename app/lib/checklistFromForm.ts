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
import type { ChecklistTemplate, GrupoChecklist, ItemTrabalhoCriacao, ManutencaoChecklist } from '../modules/checklist/tipos'
import {
  createChecklistSalvoFromForm as createChecklistSalvoFromFormPure,
  type ChecklistSalvo,
  type CreateChecklistSalvoFromFormInput,
} from '../modules/checklist/salvoFromForm'
import {
  createItemTrabalhoCriacaoFromForm as createItemTrabalhoCriacaoFromFormPure,
  type CreateItemTrabalhoCriacaoFromFormOpts,
} from '../modules/checklist/itemTrabalhoFromForm'
import type { CriacaoChecklistItemForm } from '../modules/checklist/itemTrabalhoForm'
import {
  buildChecklistGeradoRecord as buildChecklistGeradoRecordPure,
  buildManutencoesDoGrupo as buildManutencoesDoGrupoPure,
  buildPecasArmazemFromChecklist as buildPecasArmazemFromChecklistPure,
  type BuildChecklistGeradoRecordInput,
  type BuildManutencoesDoGrupoOpts,
  type BuildPecasArmazemFromChecklistInput,
} from '../modules/checklist/gerarMappers'

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

export function createChecklistSalvoFromForm<E extends { id: string }>(
  input: Omit<CreateChecklistSalvoFromFormInput<E>, 'nowMs'>
): ChecklistSalvo<E> {
  return createChecklistSalvoFromFormPure({ ...input, nowMs: Date.now() })
}

export function createItemTrabalhoCriacaoFromForm(
  form: CriacaoChecklistItemForm,
  opts: Omit<CreateItemTrabalhoCriacaoFromFormOpts, 'nowMs'> = {}
): ItemTrabalhoCriacao {
  return createItemTrabalhoCriacaoFromFormPure(form, { ...opts, nowMs: Date.now() })
}

/** Injeta Date.now() na data de criação das manutenções geradas. */
export function buildManutencoesDoGrupo(
  g: GrupoChecklist,
  opts: Omit<BuildManutencoesDoGrupoOpts, 'nowMs'>
) {
  return buildManutencoesDoGrupoPure(g, { ...opts, nowMs: Date.now() })
}

export function buildChecklistGeradoRecord(
  input: Omit<BuildChecklistGeradoRecordInput, 'nowMs'> & { nowMs?: number }
) {
  return buildChecklistGeradoRecordPure({ ...input, nowMs: input.nowMs ?? Date.now() })
}

export function buildPecasArmazemFromChecklist(
  input: Omit<BuildPecasArmazemFromChecklistInput, 'nowMs'> & { nowMs?: number }
) {
  return buildPecasArmazemFromChecklistPure({ ...input, nowMs: input.nowMs ?? Date.now() })
}
