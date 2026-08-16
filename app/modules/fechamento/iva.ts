import type { FechamentoItem } from './tipos'

export function filtrarFechamentoItensPorOmitidos(
  omitidosPorRelatorio: Record<string, string[]>,
  relatorioId: string,
  itens: FechamentoItem[]
): FechamentoItem[] {
  const omit = omitidosPorRelatorio[relatorioId]
  if (!omit || omit.length === 0) return itens
  const setO = new Set(omit)
  return itens.filter((i) => !setO.has(i.id))
}

/** Opções de IVA no fechamento de despesas (por relatório / OS). */
export type FechamentoIvaOpcoesRelatorio = { incluirIva: boolean; taxaIva: number }

export const FECHAMENTO_IVA_PADRAO: FechamentoIvaOpcoesRelatorio = { incluirIva: false, taxaIva: 23 }

export function parseFechamentoIncluirIva(v: unknown): boolean {
  return v === true || v === 1 || v === '1' || v === 'true'
}

export function normalizarFechamentoIvaOpcoes(
  raw?: Partial<FechamentoIvaOpcoesRelatorio> | null
): FechamentoIvaOpcoesRelatorio {
  const tx = Number(raw?.taxaIva)
  return {
    incluirIva: parseFechamentoIncluirIva(raw?.incluirIva),
    taxaIva: Number.isFinite(tx)
      ? Math.min(100, Math.max(0, Math.round(tx * 100) / 100))
      : FECHAMENTO_IVA_PADRAO.taxaIva,
  }
}

export function resolveFechamentoIvaOpcoes(
  relatorioId: string,
  map: Record<string, FechamentoIvaOpcoesRelatorio>,
  relatorioNumero?: string
): FechamentoIvaOpcoesRelatorio {
  if (map[relatorioId]) return normalizarFechamentoIvaOpcoes(map[relatorioId])
  const num = String(relatorioNumero ?? '').trim()
  if (num && map[num]) return normalizarFechamentoIvaOpcoes(map[num])
  return { ...FECHAMENTO_IVA_PADRAO }
}

/** Soma linhas (base) e, se ativo, IVA e total com IVA. */
export function totaisFechamentoLiquidoComIva(
  itens: FechamentoItem[],
  opts?: FechamentoIvaOpcoesRelatorio | null
): { liquido: number; iva: number; comIva: number; incluir: boolean; taxa: number } {
  const liquido = itens.reduce(
    (s, i) => s + (i.id === 'diarias' && i.cobrarDiaria === false ? 0 : Number(i.valorTotal) || 0),
    0
  )
  const o = normalizarFechamentoIvaOpcoes(opts ?? FECHAMENTO_IVA_PADRAO)
  const incluir = o.incluirIva
  let taxa = o.taxaIva
  if (!Number.isFinite(taxa) || taxa < 0) taxa = 0
  if (taxa > 100) taxa = 100
  taxa = Math.round(taxa * 100) / 100
  const iva = incluir ? Math.round(liquido * (taxa / 100) * 100) / 100 : 0
  const comIva = Math.round((liquido + iva) * 100) / 100
  return { liquido, iva, comIva, incluir, taxa }
}
