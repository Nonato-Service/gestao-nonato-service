/** Bloco vazio e normalização do pedido avulso. */

import type { EquipamentoBlocoPedido, PecaPedido, PedidoAvulsoGuardado } from './pedidoAvulsoTipos'

export function newPedidoAvulsoEntityId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function emptyEquipamentoBlocoPedido(opts: { id?: string } = {}): EquipamentoBlocoPedido {
  return {
    id: opts.id ?? newPedidoAvulsoEntityId('bloco'),
    equipamento: null,
    equipamentoManual: '',
    pecas: [],
  }
}

export function todasPecasDosBlocosPedido(blocos: readonly EquipamentoBlocoPedido[]): PecaPedido[] {
  return blocos.flatMap((b) => b.pecas)
}

export function normalizePedidoAvulsoCarregado(p: PedidoAvulsoGuardado): PedidoAvulsoGuardado {
  if (p.equipamentosBlocos && p.equipamentosBlocos.length > 0) return p
  return {
    ...p,
    equipamentosBlocos: [
      {
        id: `bloco-legado-${p.codigo}`,
        equipamento: null,
        equipamentoManual: p.equipamentoTexto || '',
        pecas: Array.isArray(p.pecas) ? [...p.pecas] : [],
      },
    ],
  }
}
