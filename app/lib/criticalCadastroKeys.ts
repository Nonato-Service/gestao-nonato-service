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
  'nonato-relatorios-especiais',
  'nonato-relatorios-especiais-deleted-ids',
  'nonato-gestores',
  'nonato-tecnicos',
  'nonato-pecas-biblioteca',
  'nonato-agendamentos',
  'nonato-pedidos-separacao',
  'nonato-faturas-pecas',
  'nonato-ordens-servico',
  'nonato-comprovantes-despesas',
  'nonato-protocolos-servico',
  'nonato-fechamentos-guardados-biblioteca',
] as const

export type NonatoCriticalCadastroKey = (typeof NONATO_CRITICAL_CADASTRO_KEYS)[number]

/**
 * Objetos (Record) críticos — backup e guarda de overwrite vazio.
 * Fechamentos de cobrança: mapa relatorioId → itens.
 */
export const NONATO_CRITICAL_OBJECT_KEYS = [
  'nonato-fechamentos-relatorios',
  'nonato-fechamentos-fluxo-financeiro',
] as const

/** Todas as chaves-array que nunca podem ser apagadas ou encolhidas no servidor. */
export const NONATO_PROTECTED_ARRAY_KEYS = new Set<string>([
  ...NONATO_CRITICAL_CADASTRO_KEYS,
  'nonato-biblioteca-pecas',
  'nonato-diario-pedidos-dia',
  'nonato-conhecimento-tecnicos',
  'nonato-checklist-basico-instancias',
])

/**
 * Objetos (Record) protegidos — nunca gravar `{}` sobre dados existentes.
 */
export const NONATO_PROTECTED_OBJECT_KEYS = new Set<string>([...NONATO_CRITICAL_OBJECT_KEYS])

/** Tombstones: só podem crescer (união), nunca ser substituídos por lista menor/vazia. */
export const NONATO_TOMBSTONE_UNION_KEYS = new Set<string>([
  'nonato-relatorios-especiais-deleted-ids',
])

/** Chaves incluídas no backup de segurança (arrays críticos + objetos críticos). */
export const NONATO_BACKUP_CADASTRO_KEYS = [
  ...NONATO_CRITICAL_CADASTRO_KEYS,
  ...NONATO_CRITICAL_OBJECT_KEYS,
] as const

/** Chaves IndexedDB que nunca apagar durante wipe/sync total. */
export const NONATO_IDB_KEYS_NEVER_DELETE = new Set<string>([
  'nonato-cadastro-safety-backup',
  'nonato-offline-server-snapshot',
])

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
