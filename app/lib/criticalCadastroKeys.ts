/**
 * Chaves de cadastro críticas — usadas para backup antes de sync total e recuperação pós-deploy.
 */
export const NONATO_CRITICAL_CADASTRO_KEYS = [
  'nonato-clientes',
  'nonato-fornecedores',
  'nonato-servicos',
  'nonato-servicos-grupos',
  'nonato-equipamentos',
  'nonato-relatorios-servico',
  'nonato-gestores',
  'nonato-tecnicos',
  'nonato-pecas-biblioteca',
  'nonato-agendamentos',
  'nonato-pedidos-separacao',
  'nonato-faturas-pecas',
  'nonato-ordens-servico',
  'nonato-comprovantes-despesas',
  'nonato-protocolos-servico',
] as const

export type NonatoCriticalCadastroKey = (typeof NONATO_CRITICAL_CADASTRO_KEYS)[number]

export function serverKeyHasMeaningfulData(value: unknown): boolean {
  if (value == null || value === '') return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value as object).length > 0
  if (typeof value === 'string') return value.trim().length > 0
  return true
}

export function serverCadastroBundleIsEmpty(server: Record<string, unknown>): boolean {
  return !NONATO_CRITICAL_CADASTRO_KEYS.some((key) =>
    serverKeyHasMeaningfulData(server[key])
  )
}

export function localStorageKeyHasMeaningfulCadastro(raw: string | null | undefined): boolean {
  if (raw == null || raw.trim() === '') return false
  try {
    const parsed = JSON.parse(raw) as unknown
    return serverKeyHasMeaningfulData(parsed)
  } catch {
    return raw.trim().length > 4
  }
}
