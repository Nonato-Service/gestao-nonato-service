/** Por relatório de serviço com fechamento na biblioteca: fluxo fatura → pagamento (com/sem fatura) */
export const FECHAMENTO_FLUXO_FINANCEIRO_KEY = 'nonato-fechamentos-fluxo-financeiro'
/** E-mail da contabilidade e opção de abrir envio após guardar fechamento na Biblioteca */
export const CONTABILIDADE_CONFIG_KEY = 'nonato-contabilidade-config'

export type ContabilidadeConfig = {
  emailContabilidade: string
  enviarFechamentoContabilidadeAuto: boolean
}

export const defaultContabilidadeConfig: ContabilidadeConfig = {
  emailContabilidade: '',
  enviarFechamentoContabilidadeAuto: true,
}

export type FechamentoFluxoFinanceiroEtapa = 'none' | 'enviado_fatura' | 'controlo_pagamento'
export type FechamentoFluxoFinanceiroModo = 'com_fatura' | 'sem_fatura'
export type FechamentoFluxoFinanceiroPagamento = 'pendente' | 'pago' | 'devedor'
/** Situação explícita da fatura (complementa etapa/pagamento na gestão financeira / OS) */
export type FechamentoSituacaoFatura = 'emitida' | 'no_prazo' | 'paga' | 'nao_paga'

export type FechamentoFluxoFinanceiroEntry = {
  etapa: Exclude<FechamentoFluxoFinanceiroEtapa, 'none'>
  modo: FechamentoFluxoFinanceiroModo
  pagamento: FechamentoFluxoFinanceiroPagamento
  updatedAt: string
  numeroFatura?: string
  situacaoFatura?: FechamentoSituacaoFatura
  dataVencimentoFatura?: string
  /** PDF ou imagem (data URL) — mesmo registo do nº fatura */
  arquivoAnexo?: string
  nomeArquivoOriginal?: string
  tipoArquivo?: string
}

export type FechamentoFluxoFinanceiroMap = Record<
  string,
  FechamentoFluxoFinanceiroEntry | FechamentoFluxoFinanceiroEtapa
>

export type FechamentoFluxoFinanceiroPatchOpts = {
  modo?: FechamentoFluxoFinanceiroModo
  pagamento?: FechamentoFluxoFinanceiroPagamento
  numeroFatura?: string
  situacaoFatura?: FechamentoSituacaoFatura
  dataVencimentoFatura?: string
  /** Data URL do anexo; string vazia limpa o anexo */
  arquivoAnexo?: string
  nomeArquivoOriginal?: string
  tipoArquivo?: string
}

export function defaultFluxoEntryParaBiblioteca(nowIso?: string): FechamentoFluxoFinanceiroEntry {
  return {
    etapa: 'controlo_pagamento',
    modo: 'com_fatura',
    pagamento: 'pendente',
    updatedAt: nowIso ?? new Date().toISOString(),
  }
}
