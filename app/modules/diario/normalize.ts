import { DIARIO_PEDIDO_ANEXOS_MAX } from './constantes'
import type { DiarioPedidoAnexo } from './tipos'

export function normalizeDiarioAnexos(raw: unknown): DiarioPedidoAnexo[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const out: DiarioPedidoAnexo[] = []
  for (const a of raw) {
    if (!a || typeof a !== 'object') continue
    const o = a as Record<string, unknown>
    if (typeof o.id !== 'string' || typeof o.nome !== 'string' || typeof o.dataUrl !== 'string') continue
    if (!String(o.dataUrl).startsWith('data:image/')) continue
    out.push({
      id: o.id,
      nome: String(o.nome).slice(0, 160),
      dataUrl: String(o.dataUrl),
    })
    if (out.length >= DIARIO_PEDIDO_ANEXOS_MAX) break
  }
  return out.length ? out : undefined
}
