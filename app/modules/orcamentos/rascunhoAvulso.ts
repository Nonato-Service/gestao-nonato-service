export const ORCAMENTO_AVULSO_RASCUNHO_LS = 'nonato-orcamento-avulso-rascunho'

export type OrcamentoAvulsoTipoRascunho =
  | 'dados-fixos'
  | 'cliente-cadastrado'
  | 'orcamento-relatorio'
  | 'cliente-prioritario-fixo'
  | 'cliente-prioritario-valores'
  | 'orcamentos-gerados'

export type OrcamentoAvulsoItemRascunho = {
  id?: string
  descricao: string
  quantidade: number
  precoUnitario: number
  total: number
  codigo?: string
  tipoItem?: 'sem-valor' | 'com-valor'
  iva?: number
  pecaId?: string
  imagem?: string
  incluirObservacao?: boolean
  observacao?: string
}

export type OrcamentoAvulsoRascunhoPersist = {
  v: 1
  dadosOrcamento: {
    numeroOrcamento: string
    data: string
    validade: string
    descricao: string
    observacoes: string
    itens: OrcamentoAvulsoItemRascunho[]
  }
  tipoOrcamento: OrcamentoAvulsoTipoRascunho
  clienteSelecionadoId: string | null
  relatorioSelecionadoId: string | null
  clienteCadastroPrioritarioFixoId: string | null
  numeroOrcamentoManual: boolean
  buscaCliente: string
  buscaRelatorio: string
  buscaClientePrioritarioFixo: string
}

export function criarOrcamentoAvulsoRascunhoVazio(): OrcamentoAvulsoRascunhoPersist {
  return {
    v: 1,
    dadosOrcamento: {
      numeroOrcamento: '',
      data: new Date().toISOString().split('T')[0],
      validade: '',
      descricao: '',
      observacoes: '',
      itens: [],
    },
    tipoOrcamento: 'dados-fixos',
    clienteSelecionadoId: null,
    relatorioSelecionadoId: null,
    clienteCadastroPrioritarioFixoId: null,
    numeroOrcamentoManual: false,
    buscaCliente: '',
    buscaRelatorio: '',
    buscaClientePrioritarioFixo: '',
  }
}

export function lerOrcamentoAvulsoRascunhoSession(): OrcamentoAvulsoRascunhoPersist | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(ORCAMENTO_AVULSO_RASCUNHO_LS)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<OrcamentoAvulsoRascunhoPersist>
    if (!parsed || parsed.v !== 1 || !parsed.dadosOrcamento) return null
    const base = criarOrcamentoAvulsoRascunhoVazio()
    return {
      ...base,
      ...parsed,
      dadosOrcamento: {
        ...base.dadosOrcamento,
        ...parsed.dadosOrcamento,
        itens: Array.isArray(parsed.dadosOrcamento.itens) ? parsed.dadosOrcamento.itens : [],
      },
    }
  } catch {
    return null
  }
}

export function gravarOrcamentoAvulsoRascunhoSession(rascunho: OrcamentoAvulsoRascunhoPersist) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(ORCAMENTO_AVULSO_RASCUNHO_LS, JSON.stringify(rascunho))
  } catch (err) {
    console.warn('Não foi possível guardar rascunho do orçamento avulso:', err)
  }
}

export function limparOrcamentoAvulsoRascunhoSession() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(ORCAMENTO_AVULSO_RASCUNHO_LS)
  } catch {
    /* ignore */
  }
}
