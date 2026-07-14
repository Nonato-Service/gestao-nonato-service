/**
 * Heurísticas para extrair total (€) e data a partir do texto OCR de recibos (PT / ES comuns).
 * Não substitui revisão humana; prioriza linhas com TOTAL / LIQUIDO / PAGAMENTO.
 */

/** Corrige erros frequentes do OCR antes de parsear montantes. */
export function normalizarTextoOcrRecibo(text: string): string {
  return text
    .replace(/\r/g, '\n')
    .replace(/[|]/g, '1')
    .replace(/(\d)[oO](\d)/g, '$10$2')
    .replace(/(\d)[lL](\d)/g, '$11$2')
    .replace(/(\d)[sS](\d)/g, '$15$2')
    .replace(/€\s+/g, '€ ')
    .replace(/\s{2,}/g, ' ')
}

function parseEuroToken(raw: string): number {
  let t = raw.replace(/\s/g, '').replace(/€/g, '').replace(/EUR/gi, '').trim()
  if (!t) return NaN
  // 1.234,56 ou 1 234,56
  if (/^\d{1,3}(?:[.\s]\d{3})*,\d{2}$/.test(t)) {
    return parseFloat(t.replace(/[.\s]/g, '').replace(',', '.'))
  }
  // 1234,56
  if (/^\d+,\d{2}$/.test(t)) return parseFloat(t.replace(',', '.'))
  // 12.50 (ponto decimal — comum quando OCR confunde)
  if (/^\d+\.\d{2}$/.test(t)) return parseFloat(t)
  // 12,5 → 12,50
  if (/^\d+,\d{1}$/.test(t)) return parseFloat(t.replace(',', '.'))
  return NaN
}

const AMOUNT_TOKEN =
  /(\d{1,3}(?:[.\s]\d{3})*,\d{2}|\d{1,3}(?:[.\s]\d{3})*,\d{1}|\d+[.,]\d{2}|\d+[.,]\d{1})/g

const TOTAL_KEYWORD =
  /TOTAL|TOTAIS|TOT\.?|LIQ(?:UIDO)?|LÍQUIDO|A\s+PAGAR|IMPORTE(?:\s+TOTAL)?|VALOR\s+(?:TOTAL|PAG(?:AR)?)|PAG(?:AMENTO)?|AMOUNT|PAID|IVA\s+INCL|GRAND\s+TOTAL|SALDO\s+A\s+PAGAR|AP\s+PAGAR/i

function amountsFromLine(line: string): number[] {
  const out: number[] = []
  for (const m of Array.from(line.matchAll(AMOUNT_TOKEN))) {
    const v = parseEuroToken(m[1])
    if (Number.isFinite(v) && v > 0 && v < 500_000) out.push(v)
  }
  return out
}

/** Preferir último montante numa linha (total costuma estar no fim). */
function lastAmountOnLine(line: string): number | null {
  const vals = amountsFromLine(line)
  return vals.length ? vals[vals.length - 1]! : null
}

function scanExplicitTotals(text: string): number[] {
  const found: number[] = []
  const patterns = [
    new RegExp(
      `(?:${TOTAL_KEYWORD.source})\\s*[:\\-]?\\s*€?\\s*(\\d{1,3}(?:[.\\s]\\d{3})*,\\d{2}|\\d+[.,]\\d{2})`,
      'gi'
    ),
    /€\s*(\d{1,3}(?:[.\s]\d{3})*,\d{2}|\d+[.,]\d{2})/gi,
  ]
  for (const re of patterns) {
    for (const m of Array.from(text.matchAll(re))) {
      const v = parseEuroToken(m[1])
      if (Number.isFinite(v) && v > 0 && v < 500_000) found.push(v)
    }
  }
  return found
}

/** Extrai montante em euros (total provável). 0 se não encontrar. */
export function parseTotalEurosFromReceiptText(text: string): number {
  const normalized = normalizarTextoOcrRecibo(text)
  const lines = normalized.split(/\n/).map((l) => l.trim()).filter(Boolean)

  // 1) Padrões explícitos «TOTAL … 12,34» no texto completo — último match costuma ser o total final
  const explicit = scanExplicitTotals(normalized)
  if (explicit.length) {
    return Math.round(explicit[explicit.length - 1]! * 100) / 100
  }

  // 2) Linhas com palavra-chave de total — último valor da linha
  const fromKeywordLines: number[] = []
  for (const line of lines) {
    if (!TOTAL_KEYWORD.test(line)) continue
    const v = lastAmountOnLine(line)
    if (v != null) fromKeywordLines.push(v)
  }
  if (fromKeywordLines.length) {
    return Math.round(fromKeywordLines[fromKeywordLines.length - 1]! * 100) / 100
  }

  // 3) Linhas com símbolo €
  const withEuro: number[] = []
  for (const line of lines) {
    if (!/€|EUR/i.test(line)) continue
    const v = lastAmountOnLine(line)
    if (v != null) withEuro.push(v)
  }
  if (withEuro.length) {
    return Math.round(withEuro[withEuro.length - 1]! * 100) / 100
  }

  // 4) Último terço do recibo (totais no fim) — maior valor plausível nessa zona
  const tailStart = Math.max(0, Math.floor(lines.length * 0.55))
  const tailAmounts = lines.slice(tailStart).flatMap((line) => amountsFromLine(line))
  if (tailAmounts.length) {
    return Math.round(Math.max(...tailAmounts) * 100) / 100
  }

  // 5) Fallback: maior valor de todo o texto (menos fiável)
  const pool = lines.flatMap((line) => amountsFromLine(line))
  if (!pool.length) return 0
  return Math.round(Math.max(...pool) * 100) / 100
}

function isoFromParts(day: string, month: string, year: string): string | null {
  const iso = `${year}-${month}-${day}`
  const dt = new Date(iso + 'T12:00:00')
  if (Number.isNaN(dt.getTime())) return null
  return iso
}

/** Data em ISO YYYY-MM-DD ou null */
export function parseDataReciboIso(text: string): string | null {
  const normalized = normalizarTextoOcrRecibo(text)

  const m4 = normalized.match(/\b(\d{2})[./-](\d{2})[./-](\d{4})\b/)
  if (m4) return isoFromParts(m4[1], m4[2], m4[3])

  const m2 = normalized.match(/\b(\d{2})[./-](\d{2})[./-](\d{2})\b/)
  if (m2) {
    const yy = parseInt(m2[3], 10)
    const year = yy >= 70 ? 1900 + yy : 2000 + yy
    return isoFromParts(m2[1], m2[2], String(year))
  }
  return null
}

function formatHora(h: number, min: number): string {
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

/** Hora HH:MM (24h) a partir do OCR — recibos PT/ES comuns. */
export function parseHoraRecibo(text: string): string | null {
  const normalized = normalizarTextoOcrRecibo(text)

  // Data + hora na mesma linha: 07/03/2026 14:35
  const dtHora = normalized.match(
    /\b\d{2}[./-]\d{2}[./-]\d{2,4}\s+([01]?\d|2[0-3])[:.\-hH]([0-5]\d)\b/
  )
  if (dtHora) {
    return formatHora(parseInt(dtHora[1], 10), parseInt(dtHora[2], 10))
  }

  const lines = normalized.split(/\n/)
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    if (/HORA|TIME|HORÁRIO|HORARIO/i.test(line)) {
      const mH = line.match(/\b([01]?\d|2[0-3])[:.\-hH]([0-5]\d)\b/)
      if (mH) return formatHora(parseInt(mH[1], 10), parseInt(mH[2], 10))
    }

    const m24 = line.match(/\b([01]?\d|2[0-3])[:.\-hH]([0-5]\d)\b/)
    if (m24) {
      return formatHora(parseInt(m24[1], 10), parseInt(m24[2], 10))
    }

    const m12 = line.match(/\b(0?\d|1[0-2])[:.\-]([0-5]\d)\s*(AM|PM|am|pm|A\.M\.|P\.M\.)\b/i)
    if (m12) {
      let h = parseInt(m12[1], 10)
      const min = parseInt(m12[2], 10)
      const pm = /p/i.test(m12[3])
      if (pm && h < 12) h += 12
      if (!pm && h === 12) h = 0
      return formatHora(h, min)
    }
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
