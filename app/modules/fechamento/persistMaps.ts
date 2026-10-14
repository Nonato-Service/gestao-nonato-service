import { isLinhaFechamentoFixaId } from './tipos'
import {
  normalizarFechamentoIvaOpcoes,
  type FechamentoIvaOpcoesRelatorio,
} from './iva'

/**
 * Alinha IDs omitidos com as linhas actuais do fechamento.
 * - Descarta IDs obsoletos (ex.: `km` após migração para `km__g_…`).
 * - Se todas as linhas (ou todas as fixas) ficariam escondidas, limpa omitidos
 *   para a tabela de cobrança não aparecer vazia («não aparece nada»).
 */
export function alinharOmitidosFechamentoComItensAtuais(
  omitidos: string[] | undefined | null,
  itensAtuais: { id: string }[]
): { omitidos: string[]; mudou: boolean; restaurouTudo: boolean } {
  const raw = Array.isArray(omitidos)
    ? omitidos.filter((x): x is string => typeof x === 'string' && !!x.trim())
    : []
  if (raw.length === 0) return { omitidos: [], mudou: false, restaurouTudo: false }

  const idsAtuais = new Set(itensAtuais.map((i) => String(i.id)))
  const aligned = raw.filter((id) => idsAtuais.has(id))
  const omitSet = new Set(aligned)
  const visiveis = itensAtuais.filter((i) => !omitSet.has(i.id))
  const fixos = itensAtuais.filter((i) => isLinhaFechamentoFixaId(i.id))
  const fixosVisiveis = fixos.filter((i) => !omitSet.has(i.id))

  if (itensAtuais.length > 0 && visiveis.length === 0) {
    return { omitidos: [], mudou: true, restaurouTudo: true }
  }
  if (fixos.length > 0 && fixosVisiveis.length === 0) {
    return { omitidos: [], mudou: true, restaurouTudo: true }
  }

  const mudou =
    aligned.length !== raw.length || aligned.some((id, i) => id !== raw[i])
  return { omitidos: aligned, mudou, restaurouTudo: false }
}

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
  const out: Record<string, string[]> = {}
  for (const k of Object.keys(raw as Record<string, unknown>)) {
    const v = (raw as Record<string, unknown>)[k]
    if (!Array.isArray(v)) continue
    const arr = v.filter((x): x is string => typeof x === 'string' && isLinhaFechamentoFixaId(x))
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
