/** Equipamento no checklist básico — resumo e rótulos puros, sem I/O. */

export type ChecklistBasicoEquipamentoResumo = {
  id?: string
  tipoEquipamento: string
  modelo: string
  marca: string
  numeroSerie: string
  familia: string
  grupo: string
  photo?: string
  coverPhoto?: string
}

export function checklistBasicoEquipamentoKey(
  eq: ChecklistBasicoEquipamentoResumo,
  index: number
): string {
  const id = (eq.id || '').trim()
  if (id) return id
  return `eq-${index}-${(eq.numeroSerie || eq.modelo || 'x').trim()}`
}

export function checklistBasicoEquipamentoLabel(eq: ChecklistBasicoEquipamentoResumo): string {
  const parts = [eq.tipoEquipamento, eq.modelo, eq.marca].filter(Boolean)
  const base = parts.join(' · ').trim()
  const serie = (eq.numeroSerie || '').trim()
  if (base && serie) return `${base} — ${serie}`
  return base || serie || '—'
}
