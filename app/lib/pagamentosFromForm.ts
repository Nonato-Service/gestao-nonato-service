/**
 * I/O de relógio — fromForm canónico em `app/modules/pagamentos/fromForm`.
 */
import {
  createAnexoPagamentoFromForm as createAnexoPagamentoFromFormPure,
  createEmpresaRecebedoraFromForm as createEmpresaRecebedoraFromFormPure,
  createPagamentoSaidaFromForm as createPagamentoSaidaFromFormPure,
  marcarPagamentoSaidaComoPago as marcarPagamentoSaidaComoPagoPure,
  updateEmpresaRecebedoraFromForm as updateEmpresaRecebedoraFromFormPure,
  updatePagamentoSaidaFromForm as updatePagamentoSaidaFromFormPure,
  type CreateAnexoPagamentoFromFormOpts,
  type CreateEmpresaRecebedoraFromFormOpts,
  type CreatePagamentoSaidaFromFormOpts,
} from '../modules/pagamentos/fromForm'
import type { EmpresaRecebedoraFormState, PagamentoSaidaFormState } from '../modules/pagamentos/formState'
import {
  emptyPagamentoSaidaForm as emptyPagamentoSaidaFormPure,
  pagamentoFormDaInstituicao as pagamentoFormDaInstituicaoPure,
} from '../modules/pagamentos/formState'
import type { AnexoPagamento, EmpresaRecebedora, PagamentoSaida } from '../modules/pagamentos/tipos'
import {
  ensureEmpresasOficiaisPagamentos as ensureEmpresasOficiaisPagamentosPure,
  type EnsureEmpresasOficiaisPagamentosOpts,
} from '../modules/pagamentos/oficiais'

export function ensureEmpresasOficiaisPagamentos(
  existing: EmpresaRecebedora[],
  opts: Omit<EnsureEmpresasOficiaisPagamentosOpts, 'nowMs'> = {}
) {
  return ensureEmpresasOficiaisPagamentosPure(existing, { ...opts, nowMs: Date.now() })
}

export function createEmpresaRecebedoraFromForm(
  form: EmpresaRecebedoraFormState,
  opts: Omit<CreateEmpresaRecebedoraFromFormOpts, 'nowMs'> = {}
): EmpresaRecebedora {
  return createEmpresaRecebedoraFromFormPure(form, { ...opts, nowMs: Date.now() })
}

export function updateEmpresaRecebedoraFromForm(
  existing: EmpresaRecebedora,
  form: EmpresaRecebedoraFormState,
  opts: Omit<CreateEmpresaRecebedoraFromFormOpts, 'nowMs' | 'id' | 'criadoEm'> = {}
): EmpresaRecebedora {
  return updateEmpresaRecebedoraFromFormPure(existing, form, { ...opts, nowMs: Date.now() })
}

export function createPagamentoSaidaFromForm(
  form: PagamentoSaidaFormState,
  opts: Omit<CreatePagamentoSaidaFromFormOpts, 'nowMs'>
): PagamentoSaida {
  return createPagamentoSaidaFromFormPure(form, { ...opts, nowMs: Date.now() })
}

export function updatePagamentoSaidaFromForm(
  existing: PagamentoSaida,
  form: PagamentoSaidaFormState,
  opts: { empresaNome: string; atualizadoEm?: string }
): PagamentoSaida {
  return updatePagamentoSaidaFromFormPure(existing, form, { ...opts, nowMs: Date.now() })
}

export function emptyPagamentoSaidaForm(empresaId = ''): PagamentoSaidaFormState {
  return emptyPagamentoSaidaFormPure({ nowMs: Date.now(), empresaId })
}

export function pagamentoFormDaInstituicao(e: EmpresaRecebedora): PagamentoSaidaFormState {
  return pagamentoFormDaInstituicaoPure(e, { nowMs: Date.now() })
}

export function createAnexoPagamentoFromForm(
  form: Pick<AnexoPagamento, 'nome' | 'mime' | 'base64' | 'papel'>,
  opts: Omit<CreateAnexoPagamentoFromFormOpts, 'nowMs' | 'random'> = {}
): AnexoPagamento {
  return createAnexoPagamentoFromFormPure(form, { ...opts, nowMs: Date.now(), random: Math.random })
}

export function marcarPagamentoSaidaComoPago(existing: PagamentoSaida): PagamentoSaida {
  return marcarPagamentoSaidaComoPagoPure(existing, { nowMs: Date.now() })
}
