/**
 * Formatação monetária única (europa/BR): 14.087,50 / 14.087,50 €
 * Display ≠ parse: inputs continuam a aceitar 0,6 e 0.6.
 *
 * Nota: não usamos Intl.NumberFormat('pt-PT') para o agrupamento —
 * em vários runtimes o milhar vem como espaço fino; o programa exige ponto.
 */

/** Converte texto monetário para número (aceita 0,6 / 0.6 / 14.087,50 / 14087.50). */
export function parseMoneyInput(raw: unknown): number {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : NaN
  let t = String(raw ?? '')
    .trim()
    .replace(/\s/g, '')
    .replace(/€/gi, '')
    .replace(/EUR/gi, '')
  if (!t || t === '-' || t === '.' || t === ',') return NaN

  if (t.includes(',') && t.includes('.')) {
    // 14.087,50 (EU) ou 14,087.50 (US)
    if (t.lastIndexOf(',') > t.lastIndexOf('.')) {
      t = t.replace(/\./g, '').replace(',', '.')
    } else {
      t = t.replace(/,/g, '')
    }
  } else if (t.includes(',')) {
    t = t.replace(',', '.')
  } else if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
    // só milhares: 14.087
    t = t.replace(/\./g, '')
  }

  const n = parseFloat(t)
  return Number.isFinite(n) ? n : NaN
}

export function toMoneyNumber(valor: unknown): number {
  if (typeof valor === 'number' && Number.isFinite(valor)) return valor
  const n = parseMoneyInput(valor)
  return Number.isFinite(n) ? n : 0
}

/** Só o número: 14.087,50 */
export function formatMoneyNumber(valor: unknown, digits = 2): string {
  const n = toMoneyNumber(valor)
  const neg = n < 0
  const abs = Math.abs(n)
  const factor = 10 ** digits
  const fixed = (Math.round(abs * factor) / factor).toFixed(digits)
  const [intPart, decPart] = fixed.split('.')
  const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${neg ? '-' : ''}${withDots},${decPart}`
}

/** Com euro à direita: 14.087,50 € */
export function formatMoneyEUR(valor: unknown, digits = 2): string {
  return `${formatMoneyNumber(valor, digits)} €`
}
