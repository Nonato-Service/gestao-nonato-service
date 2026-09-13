/**
 * I/O de relógio — fromForm canónico em `app/modules/sst/fromForm`.
 */
import {
  createSolicitacaoServicoTecnicoFromForm as createSolicitacaoServicoTecnicoFromFormPure,
  type CreateSolicitacaoServicoTecnicoFromFormOpts,
} from '../modules/sst/fromForm'
import type { SolicitacaoServicoTecnico, SolicitacaoServicoTecnicoFormState } from '../modules/sst/tipos'

/** Injeta Date.now() no id e na data quando o call-site não envia. */
export function createSolicitacaoServicoTecnicoFromForm(
  form: SolicitacaoServicoTecnicoFormState,
  opts: Omit<CreateSolicitacaoServicoTecnicoFromFormOpts, 'nowMs'> = {}
): SolicitacaoServicoTecnico {
  return createSolicitacaoServicoTecnicoFromFormPure(form, { ...opts, nowMs: Date.now() })
}
