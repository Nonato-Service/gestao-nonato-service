/** Cadastro de serviços: valores vindos do JSON/localStorage podem ser string. */
export function normalizeServicoValorStored(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const n = parseFloat(String(v ?? '').replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

/** Exibição nos cartões/listas do cadastro: sempre 2 casas e ponto decimal (ex.: 0.60, 70.00). */
export function formatServicoValorExibicao(v: unknown): string {
  return normalizeServicoValorStored(v).toFixed(2)
}

/** Campo de valor (texto): aceita vírgula ou ponto; vazio trata-se como 0 ao guardar. */
export function parseServicoValorInput(raw: string | undefined | null): number {
  const t = String(raw ?? '').trim().replace(/\s/g, '').replace(/€/g, '').replace(',', '.')
  if (t === '' || t === '-' || t === '.') return 0
  const n = parseFloat(t)
  return Number.isFinite(n) ? n : NaN
}

/** Texto inicial do input — sem forçar 0 visível quando o valor é zero. */
export function servicoValorToInputString(v: number): string {
  if (!Number.isFinite(v) || v === 0) return ''
  return String(v)
}
