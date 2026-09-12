/** Validação e mapeamento puro de peça e pedido avulso. */

import type { EquipamentoBlocoPedido, PecaPedido, PedidoAvulsoGuardado } from './pedidoAvulsoTipos'

export function isPecaPedidoManualFormValid(codigo: string, nome: string): boolean {
  return Boolean(codigo.trim() || nome.trim())
}

export type CreatePecaPedidoFromFormOpts = {
  id?: string
}

export function createPecaPedidoFromForm(
  form: Omit<PecaPedido, 'id'> & { id?: string },
  opts: CreatePecaPedidoFromFormOpts = {}
): PecaPedido {
  return {
    ...form,
    id: form.id || opts.id || `peca-${Date.now()}`,
  }
}

export function addPecaPedidoToList(pecas: readonly PecaPedido[], nova: PecaPedido): PecaPedido[] {
  const existente = pecas.find((p) => p.codigo && p.codigo === nova.codigo)
  if (existente && nova.codigo) {
    return pecas.map((p) =>
      p.codigo === nova.codigo ? { ...p, quantidade: p.quantidade + nova.quantidade } : p
    )
  }
  return [...pecas, nova]
}

export function addPecaPedidoAoBloco(
  bloco: EquipamentoBlocoPedido,
  peca: PecaPedido
): EquipamentoBlocoPedido {
  return { ...bloco, pecas: addPecaPedidoToList(bloco.pecas, peca) }
}

export function isPedidoAvulsoPecasValid(pecas: readonly PecaPedido[]): boolean {
  return pecas.length > 0
}

export type CreatePedidoAvulsoFromFormOpts = {
  dataGeracao?: string
  geradoEm?: string
  status?: PedidoAvulsoGuardado['status']
}

export function createPedidoAvulsoFromForm(
  form: Omit<PedidoAvulsoGuardado, 'dataGeracao' | 'geradoEm' | 'status'> & {
    dataGeracao?: string
    geradoEm?: string
    status?: PedidoAvulsoGuardado['status']
  },
  opts: CreatePedidoAvulsoFromFormOpts = {}
): PedidoAvulsoGuardado {
  const now = opts.dataGeracao ?? form.dataGeracao ?? new Date().toISOString()
  return {
    ...form,
    pecas: [...form.pecas],
    equipamentosBlocos: form.equipamentosBlocos?.map((b) => ({ ...b, pecas: [...b.pecas] })),
    status: opts.status ?? form.status ?? 'pendente',
    dataGeracao: now,
    geradoEm: opts.geradoEm ?? form.geradoEm ?? now,
  }
}
