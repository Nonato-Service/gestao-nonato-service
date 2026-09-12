/** Módulo pagamentos-contador — tipos e helpers puros de entidades / pagamentos / anexos. */

export type {
  CategoriaEntidadeContador,
  EntidadeContador,
  AnexoContador,
  PagamentoContadorStatus,
  PagamentoContador,
} from './tipos'

export type { EntidadeContadorFormState, PagamentoContadorFormState } from './formState'
export {
  emptyEntidadeContadorForm,
  emptyPagamentoContadorForm,
  pagamentoContadorToForm,
} from './formState'

export type {
  CreateEntidadeContadorFromFormOpts,
  CreatePagamentoContadorFromFormOpts,
  UpdatePagamentoContadorFromFormOpts,
  CreateAnexoContadorFromFormOpts,
} from './fromForm'
export {
  isEntidadeContadorFormValid,
  createEntidadeContadorFromForm,
  isPagamentoContadorFormValid,
  createPagamentoContadorFromForm,
  updatePagamentoContadorFromForm,
  isAnexoContadorFormValid,
  createAnexoContadorFromForm,
} from './fromForm'
