/** Módulo PAGAMENTOS — empresas recebedoras (isolado de fornecedores) e saídas. */

export type { PagamentoMetodo, EmpresaRecebedora, EmpresaRecebedoraTipo, PagamentoSaida } from './tipos'
export {
  PAGAMENTOS_EMPRESAS_STORAGE_KEY,
  PAGAMENTOS_REGISTOS_STORAGE_KEY,
  PAGAMENTO_METODOS,
} from './tipos'

export type { EmpresaRecebedoraOficialId, EmpresaRecebedoraOficialDef } from './oficiais'
export {
  PAGAMENTOS_EMPRESAS_OFICIAIS,
  isEmpresaRecebedoraOficial,
  ensureEmpresasOficiaisPagamentos,
} from './oficiais'

export type { EmpresaRecebedoraFormState, PagamentoSaidaFormState } from './formState'
export {
  emptyEmpresaRecebedoraForm,
  empresaRecebedoraToForm,
  emptyPagamentoSaidaForm,
  pagamentoSaidaToForm,
} from './formState'

export type { CreateEmpresaRecebedoraFromFormOpts, CreatePagamentoSaidaFromFormOpts } from './fromForm'
export {
  isEmpresaRecebedoraFormValid,
  createEmpresaRecebedoraFromForm,
  updateEmpresaRecebedoraFromForm,
  isPagamentoSaidaFormValid,
  createPagamentoSaidaFromForm,
  updatePagamentoSaidaFromForm,
} from './fromForm'
