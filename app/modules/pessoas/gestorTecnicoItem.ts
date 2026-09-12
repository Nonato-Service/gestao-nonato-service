/** Subconjunto gestor/técnico para vínculo no formulário de utilizador — sem I/O. */

export type GestorItem = { id: string; name: string; area?: string }
export type TecnicoItem = { id: string; name: string; type?: 'internal' | 'external' | string }

export type TecnicoItemTypeLabels = {
  interno: string
  externo: string
  armazem: string
}

export function formatGestorItemOption(item: GestorItem, areaFallback = '-'): string {
  return `${item.name} (${item.area || areaFallback})`
}

export function formatTecnicoItemTypeLabel(
  type: TecnicoItem['type'],
  labels: TecnicoItemTypeLabels
): string {
  if (type === 'internal') return labels.interno
  if (type === 'external') return labels.externo
  return labels.armazem
}

export function formatTecnicoItemOption(
  item: TecnicoItem,
  labels: TecnicoItemTypeLabels
): string {
  return `${item.name} (${formatTecnicoItemTypeLabel(item.type, labels)})`
}
