/**
 * I/O de relógio — fromForm canónico em `app/modules/comprovantes/fromForm`.
 */
import {
  createComprovanteDespesaFromForm as createComprovanteDespesaFromFormPure,
  type CreateComprovanteDespesaFromFormOpts,
} from '../modules/comprovantes/fromForm'
import type { ComprovanteDespesaFormState } from '../modules/comprovantes/formState'
import {
  emptyComprovanteDespesaForm as emptyComprovanteDespesaFormPure,
  formCompComClienteSugerido as formCompComClienteSugeridoPure,
  type EstadoClienteParaFormComp,
} from '../modules/comprovantes/formState'
import type { ComprovanteDespesa } from '../modules/comprovantes/tipos'
import { mesesRollingCompetenciaKeys as mesesRollingCompetenciaKeysPure } from '../modules/comprovantes/periodo'
import {
  buildMensagemEnvioComprovantes as buildMensagemEnvioComprovantesPure,
  type BuildMensagemEnvioComprovantesParams,
} from '../modules/comprovantes/envioMensagem'

/** Injeta Date.now() no id e nas datas quando o call-site não envia. */
export function createComprovanteDespesaFromForm(
  form: ComprovanteDespesaFormState,
  opts: Omit<CreateComprovanteDespesaFromFormOpts, 'nowMs'> = {}
): ComprovanteDespesa {
  return createComprovanteDespesaFromFormPure(form, { ...opts, nowMs: Date.now() })
}

export function emptyComprovanteDespesaForm(): ComprovanteDespesaFormState {
  return emptyComprovanteDespesaFormPure({ nowMs: Date.now() })
}

export function formCompComClienteSugerido(
  dataIso: string,
  horaIso: string | null | undefined,
  base: Partial<ComprovanteDespesaFormState> | undefined,
  resolverEstado: (data: string, hora: string) => EstadoClienteParaFormComp
): ComprovanteDespesaFormState {
  return formCompComClienteSugeridoPure(dataIso, horaIso, base, resolverEstado, {
    nowMs: Date.now(),
  })
}

/** Injeta Date.now() na janela de meses de competência. */
export function mesesRollingCompetenciaKeys(count = 30, now?: Date): string[] {
  return mesesRollingCompetenciaKeysPure(count, (now ?? new Date()).getTime())
}

export function buildMensagemEnvioComprovantes(
  params: Omit<BuildMensagemEnvioComprovantesParams, 'reportDate'> & { reportDate?: Date }
): string {
  return buildMensagemEnvioComprovantesPure({
    ...params,
    reportDate: params.reportDate ?? new Date(),
  })
}
