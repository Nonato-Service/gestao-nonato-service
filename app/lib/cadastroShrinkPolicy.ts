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
  'nonato-orcamentos-pecas-especiais',
  'nonato-pedidos-orcamento',
  'nonato-pedidos-orcamento-avulso',
  'nonato-mensagens-comunicacao',
  'nonato-pecas-solicitadas-armazem',
])

function itemId(item: unknown): string {
  if (!item || typeof item !== 'object') return ''
  return String((item as { id?: unknown }).id ?? '').trim()
}

/**
 * Cadastros mestres: se o aparelho tiver lista incompleta e gravar um novo,
 * o servidor funde em vez de recusar (409). Não inclui peças (risco de perder fotos).
 */
export const MERGE_ON_SHRINK_KEYS = new Set<string>([
  'nonato-clientes',
  'nonato-fornecedores',
  'nonato-gestores',
  'nonato-tecnicos',
  'nonato-equipamentos',
  'nonato-servicos',
  'nonato-servicos-grupos',
  'nonato-faturas-pecas',
  'nonato-ordens-servico',
  'nonato-comprovantes-despesas',
])

export function incomingHasNewIds(existing: unknown[], incoming: unknown[]): boolean {
  const oldIds = new Set(existing.map(itemId).filter(Boolean))
  for (const item of incoming) {
    const id = itemId(item)
    if (id && !oldIds.has(id)) return true
  }
  return false
}

/** Mantém o que o servidor já tem e aplica altas/edições do aparelho. */
export function mergeProtectedArrayById(existing: unknown[], incoming: unknown[]): unknown[] {
  const byId = new Map<string, unknown>()
  const semId: unknown[] = []
  for (const item of existing) {
    const id = itemId(item)
    if (id) byId.set(id, item)
    else semId.push(item)
  }
  for (const item of incoming) {
    const id = itemId(item)
    if (id) byId.set(id, item)
    else semId.push(item)
  }
  return [...byId.values(), ...semId]
}

/**
 * Todos os IDs novos existiam na lista antiga — exclusão intencional, não substituição parcial.
 * Lista vazia NÃO conta: wipe total exige tombstones / outro fluxo — nunca apagar o servidor com `[]`.
 */
export function isIntentionalSubsetShrink(existing: unknown[], next: unknown[]): boolean {
  if (!Array.isArray(next) || next.length === 0) return false
  const oldIds = new Set(existing.map(itemId).filter(Boolean))
  if (oldIds.size === 0) return false
  for (const item of next) {
    const id = itemId(item)
    if (!id || !oldIds.has(id)) return false
  }
  return true
}
