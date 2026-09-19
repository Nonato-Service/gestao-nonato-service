/** Módulo PAGAMENTOS — empresas recebedoras (isolado de fornecedores) e saídas. */

export type {
  PagamentoMetodo,
  EmpresaRecebedora,
  EmpresaRecebedoraTipo,
  PagamentoSaida,
  PagamentoSaidaStatus,
  AnexoPagamento,
  AnexoPagamentoPapel,
} from './tipos'
export {
  PAGAMENTOS_EMPRESAS_STORAGE_KEY,
  PAGAMENTOS_REGISTOS_STORAGE_KEY,
  PAGAMENTO_METODOS,
} from './tipos'

export type { EmpresaRecebedoraOficialId, EmpresaRecebedoraOficialDef } from './oficiais'
export {
  PAGAMENTOS_EMPRESAS_OFICIAIS,
  isEmpresaRecebedoraOficial,
  isDestinoTransferenciaBancaria,
  metodoPadraoPagamento,
  ensureEmpresasOficiaisPagamentos,
} from './oficiais'

export type { EmpresaRecebedoraFormState, PagamentoSaidaFormState } from './formState'
export {
  emptyEmpresaRecebedoraForm,
  empresaRecebedoraToForm,
  emptyPagamentoSaidaForm,
  pagamentoSaidaToForm,
  pagamentoFormDaInstituicao,
} from './formState'

export type {
  CreateEmpresaRecebedoraFromFormOpts,
  CreatePagamentoSaidaFromFormOpts,
  CreateAnexoPagamentoFromFormOpts,
  PagamentoValidacaoErro,
} from './fromForm'
export type { TotalInstituicaoPagamento, GrupoMesPagamento } from './resumo'
export {
  PAGAMENTOS_MES_SEM_DATA,
  dataLocalISOFromMs,
  normalizarDataPagamento,
  formatarDataPagamentoVisivel,
  mesKeyPagamento,
  pagamentosDoMes,
  somarValorPagamentos,
  mergePagamentosPorId,
  asListaPagamentos,
  totaisPorInstituicao,
  mesesDisponiveisPagamentos,
  agruparPagamentosPorMes,
} from './resumo'

export {
  isEmpresaRecebedoraFormValid,
  createEmpresaRecebedoraFromForm,
  updateEmpresaRecebedoraFromForm,
  isPagamentoSaidaFormValid,
  erroValidacaoPagamentoSaida,
  pagamentoPodeSerPago,
  createPagamentoSaidaFromForm,
  updatePagamentoSaidaFromForm,
  isAnexoPagamentoFormValid,
  createAnexoPagamentoFromForm,
  arquivarAnexosAPagarComoPagos,
  marcarPagamentoSaidaComoPago,
  normalizePagamentoSaida,
} from './fromForm'
