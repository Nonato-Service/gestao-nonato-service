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

/** data: URLs em itens incham o sessionStorage e congelam a UI em cada remount/write. */
function sanitizarRascunhoParaSession(
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

let gravarOrcamentoAvulsoRascunhoTimer: ReturnType<typeof setTimeout> | null = null
let gravarOrcamentoAvulsoRascunhoPendente: OrcamentoAvulsoRascunhoPersist | null = null

function gravarOrcamentoAvulsoRascunhoSessionNow(rascunho: OrcamentoAvulsoRascunhoPersist) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(
      ORCAMENTO_AVULSO_RASCUNHO_LS,
      JSON.stringify(sanitizarRascunhoParaSession(rascunho))
    )
  } catch (err) {
    console.warn('Não foi possível guardar rascunho do orçamento avulso:', err)
  }
}

/** Grava rascunho em sessionStorage. `sync: true` — imediato (mudança de tipo). */
export function gravarOrcamentoAvulsoRascunhoSession(
  rascunho: OrcamentoAvulsoRascunhoPersist,
  opts?: { sync?: boolean }
) {
  if (typeof window === 'undefined') return
  if (opts?.sync) {
    if (gravarOrcamentoAvulsoRascunhoTimer) {
      clearTimeout(gravarOrcamentoAvulsoRascunhoTimer)
      gravarOrcamentoAvulsoRascunhoTimer = null
    }
    gravarOrcamentoAvulsoRascunhoPendente = null
    gravarOrcamentoAvulsoRascunhoSessionNow(rascunho)
    return
  }
  gravarOrcamentoAvulsoRascunhoPendente = rascunho
  if (gravarOrcamentoAvulsoRascunhoTimer) clearTimeout(gravarOrcamentoAvulsoRascunhoTimer)
  gravarOrcamentoAvulsoRascunhoTimer = setTimeout(() => {
    gravarOrcamentoAvulsoRascunhoTimer = null
    const pending = gravarOrcamentoAvulsoRascunhoPendente
    gravarOrcamentoAvulsoRascunhoPendente = null
    if (pending) gravarOrcamentoAvulsoRascunhoSessionNow(pending)
  }, 250)
}

export function limparOrcamentoAvulsoRascunhoSession() {
  if (typeof window === 'undefined') return
  if (gravarOrcamentoAvulsoRascunhoTimer) {
    clearTimeout(gravarOrcamentoAvulsoRascunhoTimer)
    gravarOrcamentoAvulsoRascunhoTimer = null
  }
  gravarOrcamentoAvulsoRascunhoPendente = null
  try {
    sessionStorage.removeItem(ORCAMENTO_AVULSO_RASCUNHO_LS)
  } catch {
    /* ignore */
  }
}
