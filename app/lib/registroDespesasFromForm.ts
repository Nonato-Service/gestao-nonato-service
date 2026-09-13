/**
 * I/O de relógio — fromForm canónico em `app/modules/registro-despesas/fromForm`.
 */
import {
  createCartaoEmpresaDespesasFromForm as createCartaoEmpresaDespesasFromFormPure,
  createDespesaDocumentoFromForm as createDespesaDocumentoFromFormPure,
  createDespesaRegistroFromForm as createDespesaRegistroFromFormPure,
  type CreateCartaoEmpresaDespesasFromFormOpts,
  type CreateDespesaDocumentoFromFormOpts,
  type CreateDespesaRegistroFromFormOpts,
} from '../modules/registro-despesas/fromForm'
import type { CartaoEmpresaDespesasFormState, DespesaRegistroFormState } from '../modules/registro-despesas/formState'
import type { CartaoEmpresaDespesas, DespesaDocumento, DespesaRegistro } from '../modules/registro-despesas/tipos'

/** Injeta Date.now() no id e nas datas quando o call-site não envia. */
export function createCartaoEmpresaDespesasFromForm(
  form: CartaoEmpresaDespesasFormState,
  opts: Omit<CreateCartaoEmpresaDespesasFromFormOpts, 'nowMs'> = {}
): CartaoEmpresaDespesas {
  return createCartaoEmpresaDespesasFromFormPure(form, { ...opts, nowMs: Date.now() })
}

export function createDespesaRegistroFromForm(
  form: Pick<
    DespesaRegistroFormState,
    'tipoId' | 'tipoNome' | 'valor' | 'descricao' | 'codigoBarras' | 'fotos' | 'data' | 'cartaoId'
  >,
  opts: Omit<CreateDespesaRegistroFromFormOpts, 'nowMs'> = {}
): DespesaRegistro {
  return createDespesaRegistroFromFormPure(form, { ...opts, nowMs: Date.now() })
}

export function createDespesaDocumentoFromForm(
  form: Pick<DespesaDocumento, 'clienteId' | 'clienteNome'> & {
    relatorioId?: string
    relatorioNumero?: string
  },
  opts: Omit<CreateDespesaDocumentoFromFormOpts, 'nowMs'> = {}
): DespesaDocumento {
  return createDespesaDocumentoFromFormPure(form, { ...opts, nowMs: Date.now() })
}
