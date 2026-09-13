/**
 * I/O de relógio/aleatório — fromForm canónico em `app/modules/ordem-preparacao`.
 */
import {
  createOrdemPreparacaoFromForm as createOrdemPreparacaoFromFormPure,
  type CreateOrdemPreparacaoFromFormOpts,
} from '../modules/ordem-preparacao/fromForm'
import {
  createFormularioChecklistFromOrdem as createFormularioChecklistFromOrdemPure,
  type CreateFormularioChecklistFromOrdemOpts,
} from '../modules/ordem-preparacao/formularioChecklistFromOrdem'
import type {
  FormularioChecklistFromOrdem,
  OrdemPreparacao,
  OrdemPreparacaoFormState,
} from '../modules/ordem-preparacao/tipos'

/** Injeta Date.now() (e Math.random no checklist) quando o call-site não envia. */
export function createOrdemPreparacaoFromForm(
  form: OrdemPreparacaoFormState,
  opts: Omit<CreateOrdemPreparacaoFromFormOpts, 'nowMs'> = {}
): OrdemPreparacao {
  return createOrdemPreparacaoFromFormPure(form, { ...opts, nowMs: Date.now() })
}

export function createFormularioChecklistFromOrdem(
  form: OrdemPreparacaoFormState,
  opts: Omit<CreateFormularioChecklistFromOrdemOpts, 'nowMs' | 'random'> = {}
): FormularioChecklistFromOrdem {
  return createFormularioChecklistFromOrdemPure(form, {
    ...opts,
    nowMs: Date.now(),
    random: Math.random,
  })
}
