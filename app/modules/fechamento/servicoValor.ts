import { formatMoneyNumber, parseMoneyInput, toMoneyNumber } from '../financeiro/money'

/** Cadastro de serviços: valores vindos do JSON/localStorage podem ser string. */
export function normalizeServicoValorStored(v: unknown): number {
  return toMoneyNumber(v)
}

/**
 * Quantidade de linha do fechamento (JSON/localStorage pode vir string).
 * Aceita vírgula europeia via parseMoneyInput — nunca devolve NaN.
 */
export function normalizeFechamentoQuantidade(v: unknown): number {
  return toMoneyNumber(v)
}

/**
 * Rótulo de qty na UI/PDF do fechamento — seguro se qty for string/null
 * (evita crash TypeError em `.toFixed` ao editar tarifas com dados legados).
 */
export function formatFechamentoQuantidadeLabel(
  quantidade: unknown,
  tipoCobranca?: string | null
): string {
  const q = normalizeFechamentoQuantidade(quantidade)
  if (tipoCobranca === 'hora') return `${q.toFixed(2)} h`
  if (tipoCobranca === 'km') return `${q.toFixed(0)} km`
  return String(q)
}

/** Exibição nos cartões/listas do cadastro: 14.087,50 (pt-PT). */
export function formatServicoValorExibicao(v: unknown): string {
  return formatMoneyNumber(v)
}

/** Campo de valor (texto): aceita vírgula ou ponto; vazio trata-se como 0 ao guardar. */
export function parseServicoValorInput(raw: string | undefined | null): number {
  const t = String(raw ?? '')
    .trim()
    .replace(/\s/g, '')
    .replace(/€/gi, '')
  if (t === '' || t === '-' || t === '.' || t === ',') return 0
  const n = parseMoneyInput(raw)
  return Number.isFinite(n) ? n : NaN
}

/** Texto inicial do input — sem forçar 0 visível quando o valor é zero. */
export function servicoValorToInputString(v: number): string {
  if (!Number.isFinite(v) || v === 0) return ''
  return String(v)
}
