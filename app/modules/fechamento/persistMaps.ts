import { FECHAMENTO_IDS_FIXOS_TEMPLATE } from './tipos'
import {
  normalizarFechamentoIvaOpcoes,
  type FechamentoIvaOpcoesRelatorio,
} from './iva'

/** Decisão «cobrar / não cobrar» no resumo do relatório (por id do relatório) */
export const RESUMO_COBRANCA_DECISAO_KEY = 'nonato-resumo-cobranca-decisao'
/** Linhas fixas do fechamento (resumo) que podem ser retiradas da cobrança e restauradas depois */
export const FECHAMENTO_ITENS_OMITIDOS_KEY = 'nonato-fechamentos-itens-omitidos-por-relatorio'
/** Por relatório: fecho com IVA opcional e taxa (ex.: PT/ES/IT) */
export const FECHAMENTO_IVA_POR_RELATORIO_KEY = 'nonato-fechamentos-iva-por-relatorio'
/** Grupo do Cadastro de Serviços aplicado à ordem de cobrança de cada relatório (HTT/KRC/… por tarifa). */
export const FECHAMENTO_GRUPO_POR_RELATORIO_KEY = 'nonato-fechamentos-grupo-por-relatorio'

export type ResumoCobrancaDecisao = 'sim' | 'nao'

/** Remove entradas cujo id está em `ids`. Devolve se alguma chave foi apagada. */
export function pruneRelatorioIdsFromMap<T>(
  map: Record<string, T>,
  ids: Iterable<string>
): { map: Record<string, T>; dirty: boolean } {
  let dirty = false
  const next = { ...map }
  for (const id of ids) {
    if (id in next) {
      delete next[id]
      dirty = true
    }
  }
  return { map: next, dirty }
}

export function normalizeResumoCobrancaDecisaoMap(raw: unknown): Record<string, ResumoCobrancaDecisao> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: Record<string, ResumoCobrancaDecisao> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (v === 'sim' || v === 'nao') out[k] = v
  }
  return out
}

export function normalizeFechamentoItensOmitidosMap(raw: unknown): Record<string, string[]> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const fixos = new Set<string>([...FECHAMENTO_IDS_FIXOS_TEMPLATE])
  const out: Record<string, string[]> = {}
  for (const k of Object.keys(raw as Record<string, unknown>)) {
    const v = (raw as Record<string, unknown>)[k]
    if (!Array.isArray(v)) continue
    const arr = v.filter((x): x is string => typeof x === 'string' && fixos.has(x))
    if (arr.length > 0) out[k] = arr
  }
  return out
}

export function normalizeFechamentoIvaPorRelatorioMap(
  raw: unknown
): Record<string, FechamentoIvaOpcoesRelatorio> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: Record<string, FechamentoIvaOpcoesRelatorio> = {}
  for (const k of Object.keys(raw as Record<string, unknown>)) {
    const v = (raw as Record<string, unknown>)[k]
    if (!v || typeof v !== 'object' || Array.isArray(v)) continue
    out[k] = normalizarFechamentoIvaOpcoes(v as Partial<FechamentoIvaOpcoesRelatorio>)
  }
  return out
}

export function normalizeFechamentoGrupoPorRelatorioMap(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: Record<string, string> = {}
  for (const k of Object.keys(raw as Record<string, unknown>)) {
    const v = (raw as Record<string, unknown>)[k]
    if (typeof v === 'string' && v.trim()) out[k] = v.trim()
  }
  return out
}
