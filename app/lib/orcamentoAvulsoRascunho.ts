/**
 * I/O do rascunho de orçamento avulso — parse/sanitize canónicos em `app/modules/orcamentos`.
 */
import {
  ORCAMENTO_AVULSO_RASCUNHO_LS,
  criarOrcamentoAvulsoRascunhoVazio as criarOrcamentoAvulsoRascunhoVazioPure,
  parseOrcamentoAvulsoRascunhoRaw,
  sanitizarRascunhoParaSession,
  type OrcamentoAvulsoRascunhoPersist,
} from '../modules/orcamentos/rascunhoAvulso'

/** Injeta Date.now() na data inicial do rascunho vazio. */
export function criarOrcamentoAvulsoRascunhoVazio(): OrcamentoAvulsoRascunhoPersist {
  return criarOrcamentoAvulsoRascunhoVazioPure(Date.now())
}

export function lerOrcamentoAvulsoRascunhoSession(): OrcamentoAvulsoRascunhoPersist | null {
  if (typeof window === 'undefined') return null
  try {
    return parseOrcamentoAvulsoRascunhoRaw(sessionStorage.getItem(ORCAMENTO_AVULSO_RASCUNHO_LS), Date.now())
  } catch {
    return null
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
