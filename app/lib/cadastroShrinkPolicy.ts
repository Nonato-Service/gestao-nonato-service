/**
 * Política de redução de listas protegidas (partilhada cliente/servidor).
 * Sem dependências de Node (`fs`).
 */

/**
 * Listas de documentos onde eliminar itens é normal (relatórios, protocolos…).
 * Catálogos mestres (peças, clientes) NÃO entram aqui.
 */
export const ALLOW_PROTECTED_SUBSET_SHRINK_KEYS = new Set<string>([
  'nonato-relatorios-especiais',
  'nonato-relatorios-servico',
  'nonato-protocolos-servico',
  'nonato-agendamentos',
  'nonato-solicitacoes-servico-tecnico',
  'nonato-orcamentos-avulso',
  'nonato-pedidos-orcamento',
  'nonato-pedidos-orcamento-avulso',
])

function itemId(item: unknown): string {
  if (!item || typeof item !== 'object') return ''
  return String((item as { id?: unknown }).id ?? '').trim()
}

/** Todos os IDs novos existiam na lista antiga — exclusão intencional, não substituição parcial. */
export function isIntentionalSubsetShrink(existing: unknown[], next: unknown[]): boolean {
  const oldIds = new Set(existing.map(itemId).filter(Boolean))
  if (oldIds.size === 0) return false
  for (const item of next) {
    const id = itemId(item)
    if (!id || !oldIds.has(id)) return false
  }
  return true
}
