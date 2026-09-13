/** Bloco vazio e normalização do pedido avulso. */

import type { EquipamentoBlocoPedido, PecaPedido, PedidoAvulsoGuardado } from './pedidoAvulsoTipos'

/** Relógio (`nowMs`) e aleatório (`random`) injectados. */
export function newPedidoAvulsoEntityId(prefix: string, nowMs: number, random: () => number): string {
  return `${prefix}-${nowMs}-${random().toString(36).slice(2, 7)}`
}

export type EmptyEquipamentoBlocoPedidoOpts = {
  id?: string
  nowMs: number
  random: () => number
}

export function emptyEquipamentoBlocoPedido(opts: EmptyEquipamentoBlocoPedidoOpts): EquipamentoBlocoPedido {
  return {
    id: opts.id ?? newPedidoAvulsoEntityId('bloco', opts.nowMs, opts.random),
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
