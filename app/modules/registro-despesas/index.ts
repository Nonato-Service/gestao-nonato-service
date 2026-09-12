/** Módulo registro-despesas — tipos e helpers puros de cartão / linha / documento. */

export type { CartaoEmpresaDespesas, DespesaRegistro, DespesaDocumento } from './tipos'

export type { CartaoEmpresaDespesasFormState, DespesaRegistroFormState } from './formState'
export {
  emptyCartaoEmpresaDespesasForm,
  emptyDespesaRegistroForm,
  rotuloCartaoEmpresaDespesas,
  rotuloLinhaCartaoEmpresa,
} from './formState'

export type {
  CreateCartaoEmpresaDespesasFromFormOpts,
  CreateDespesaRegistroFromFormOpts,
  CreateDespesaDocumentoFromFormOpts,
} from './fromForm'
export {
  normalizeCartaoEmpresaUltimos4,
  isCartaoEmpresaApelidoValid,
  isCartaoEmpresaUltimos4Valid,
  isCartaoEmpresaDespesasFormValid,
  createCartaoEmpresaDespesasFromForm,
  isDespesaRegistroTipoValid,
  createDespesaRegistroFromForm,
  isDespesaDocumentoClienteValid,
  createDespesaDocumentoFromForm,
} from './fromForm'
