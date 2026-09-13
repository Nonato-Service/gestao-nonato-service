/** Validação e mapeamento puro da anotação do diário. */

import type { DiarioPedidoAnexo, DiarioPedidoItem } from './tipos'

export function isDiarioPedidoConteudoValid(
  texto: string,
  anexos: { length: number }
): boolean {
  return Boolean(texto.trim() || anexos.length)
}

/** Título (cliente) + bloco de tarefas, no mesmo formato do composer. */
export function buildDiarioPedidoTexto(nomeCliente: string, tarefasBloco: string): string {
  return tarefasBloco.length > 0 ? `${nomeCliente}\n${tarefasBloco}` : `${nomeCliente}\n`
}

export function cloneDiarioPedidoAnexos(
  anexos: DiarioPedidoAnexo[]
): DiarioPedidoAnexo[] | undefined {
  return anexos.length > 0 ? anexos.map((a) => ({ ...a })) : undefined
}

export type CreateDiarioPedidoFromFormOpts = {
  id?: string
  criadoEm?: string
  clienteCadastroId?: string
  extra?: Partial<DiarioPedidoItem>
  nowMs: number
  random: () => number
}

export function createDiarioPedidoFromForm(
  form: { texto: string; anexos?: DiarioPedidoAnexo[] },
  opts: CreateDiarioPedidoFromFormOpts
): DiarioPedidoItem {
  return {
    id: opts.id ?? `dp-${opts.nowMs}-${opts.random().toString(36).slice(2, 9)}`,
    texto: form.texto,
    status: 'planeado',
    criadoEm: opts.criadoEm ?? new Date(opts.nowMs).toISOString(),
    anexos: form.anexos,
    ...(opts.clienteCadastroId ? { clienteCadastroId: opts.clienteCadastroId } : {}),
    ...opts.extra,
  }
}

export type UpdateDiarioPedidoFromFormOpts = {
  atualizadoEm?: string
  nowMs: number
}

export function updateDiarioPedidoFromForm(
  existing: DiarioPedidoItem,
  form: { texto: string; anexos?: DiarioPedidoAnexo[]; clienteCadastroId?: string },
  opts: UpdateDiarioPedidoFromFormOpts
): DiarioPedidoItem {
  return {
    ...existing,
    texto: form.texto,
    anexos: form.anexos,
    atualizadoEm: opts.atualizadoEm ?? new Date(opts.nowMs).toISOString(),
    clienteCadastroId: form.clienteCadastroId,
  }
}
