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

export function criarOrcamentoAvulsoRascunhoVazio(nowMs: number): OrcamentoAvulsoRascunhoPersist {
  return {
    v: 1,
    dadosOrcamento: {
      numeroOrcamento: '',
      data: new Date(nowMs).toISOString().split('T')[0],
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

export function parseOrcamentoAvulsoRascunhoRaw(
  raw: string | null,
  nowMs: number
): OrcamentoAvulsoRascunhoPersist | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<OrcamentoAvulsoRascunhoPersist>
    if (!parsed || parsed.v !== 1 || !parsed.dadosOrcamento) return null
    const base = criarOrcamentoAvulsoRascunhoVazio(nowMs)
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

/** data: URLs em itens incham o sessionStorage e congelam a UI em cada remount/write. */
export function sanitizarRascunhoParaSession(
  rascunho: OrcamentoAvulsoRascunhoPersist
): OrcamentoAvulsoRascunhoPersist {
  const itens = Array.isArray(rascunho.dadosOrcamento?.itens)
    ? rascunho.dadosOrcamento.itens.map((item) => {
        const img = typeof item.imagem === 'string' ? item.imagem : ''
        if (img.startsWith('data:')) {
          const { imagem: _omit, ...rest } = item
          return rest
        }
        return item
      })
    : []
  return {
    ...rascunho,
    dadosOrcamento: {
      ...rascunho.dadosOrcamento,
      itens,
    },
  }
}
