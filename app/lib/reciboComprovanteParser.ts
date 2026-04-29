/**
 * Heurísticas para extrair total (€) e data a partir do texto OCR de recibos (PT / ES comuns).
 * Não substitui revisão humana; prioriza linhas com TOTAL / PAGAMENTO / etc.
 */

function parseEuroToken(raw: string): number {
  const t = raw.replace(/\s/g, '').replace(/€/g, '').replace(/EUR/gi, '').trim()
  if (/^\d{1,3}(\.\d{3})*,\d{2}$/.test(t)) {
    return parseFloat(t.replace(/\./g, '').replace(',', '.'))
  }
  if (/^\d+,\d{2}$/.test(t)) return parseFloat(t.replace(',', '.'))
  if (/^\d+\.\d{2}$/.test(t)) return parseFloat(t)
  return NaN
}

/** Extrai montante em euros (total provável). 0 se não encontrar. */
export function parseTotalEurosFromReceiptText(text: string): number {
  const lines = text.split(/\n/)
  const fromLine = (l: string): number[] => {
    const out: number[] = []
    for (const m of l.matchAll(/(\d{1,3}(?:\.\d{3})*,\d{2}|\d+[.,]\d{2})/g)) {
      const v = parseEuroToken(m[1])
      if (Number.isFinite(v) && v > 0 && v < 500_000) out.push(v)
    }
    return out
  }
  const keyword: number[] = []
  for (const line of lines) {
    const l = line.trim()
    if (/TOTAL|TOTAIS|A\s+PAGAR|VALOR|IMPORTE|PAGAMENTO|PAID|AMOUNT|IVA\s+INCL/i.test(l)) {
      keyword.push(...fromLine(l))
    }
  }
  const pool = keyword.length ? keyword : lines.flatMap((line) => fromLine(line.trim()))
  if (!pool.length) return 0
  return Math.round(Math.max(...pool) * 100) / 100
}

/** Data em ISO YYYY-MM-DD ou null */
export function parseDataReciboIso(text: string): string | null {
  const m = text.match(/\b(\d{2})[./-](\d{2})[./-](\d{4})\b/)
  if (m) {
    const y = m[3]
    const mo = m[2]
    const d = m[1]
    const iso = `${y}-${mo}-${d}`
    const dt = new Date(iso + 'T12:00:00')
    if (!Number.isNaN(dt.getTime())) return iso
  }
  return null
}

/** Primeira linha com texto «humano» (nome de estabelecimento). */
export function extrairDescricaoRecibo(text: string): string {
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  for (const line of lines) {
    if (/^\d+$/.test(line)) continue
    if (/^[\d\s.,€$/-]+$/i.test(line)) continue
    if (line.length < 3 || line.length > 80) continue
    if (/^\d{2}[./-]\d{2}[./-]\d{4}$/.test(line)) continue
    return line.slice(0, 80)
  }
  return 'Recibo'
}
