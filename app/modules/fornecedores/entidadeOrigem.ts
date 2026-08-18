/** Inferência pura da origem (cliente vs fornecedor) numa fatura de fornecedor. */

import type { FaturaFornecedor } from './tipos'

type IdHolder = { id: string }

function hasId(list: ReadonlyArray<IdHolder> | ReadonlySet<string>, id: string): boolean {
  if (list instanceof Set) return list.has(id)
  return list.some((x) => x.id === id)
}

/**
 * Resolve se a fatura está ligada a um cliente ou a um fornecedor.
 * Sem `entidadeOrigem` explícito (legado), tenta pelo `clienteId` nas listas.
 */
export function inferFaturaFornecedorEntidadeOrigem(
  f: Pick<FaturaFornecedor, 'entidadeOrigem' | 'clienteId'>,
  clientes: ReadonlyArray<IdHolder> | ReadonlySet<string>,
  fornecedores: ReadonlyArray<IdHolder> | ReadonlySet<string>
): 'cliente' | 'fornecedor' {
  if (f.entidadeOrigem === 'fornecedor' || f.entidadeOrigem === 'cliente') return f.entidadeOrigem
  if (hasId(clientes, f.clienteId)) return 'cliente'
  if (hasId(fornecedores, f.clienteId)) return 'fornecedor'
  return 'cliente'
}
