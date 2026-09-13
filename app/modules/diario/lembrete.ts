export type DiarioLembreteFields = {
  lembreteAtivo?: boolean
  lembreteIntervaloMinutos?: number
  lembreteProximoEm?: string
  lembreteUltimoEm?: string
}

export type DiarioLembretePatch = {
  ativo: boolean
  intervaloMinutos?: number
  reagendarAgora?: boolean
}

export const DIARIO_LEMBRETE_INTERVALOS_MIN = [15, 30, 60, 120, 240, 480, 1440, 2880, 10080] as const

export type DiarioLembreteIntervaloMin = (typeof DIARIO_LEMBRETE_INTERVALOS_MIN)[number]

export const DIARIO_LEMBRETE_INTERVALO_KEYS: Record<number, string> = {
  15: 'diarioPedidosLembrete15min',
  30: 'diarioPedidosLembrete30min',
  60: 'diarioPedidosLembrete1h',
  120: 'diarioPedidosLembrete2h',
  240: 'diarioPedidosLembrete4h',
  480: 'diarioPedidosLembrete8h',
  1440: 'diarioPedidosLembrete1dia',
  2880: 'diarioPedidosLembrete2dias',
  10080: 'diarioPedidosLembrete1semana',
}

export const DIARIO_LEMBRETE_CUSTOM_KEY = 'custom'

export function scheduleProximoLembrete(from: Date, intervalMinutes: number): string {
  const min = Math.max(1, Math.round(intervalMinutes))
  return new Date(from.getTime() + min * 60 * 1000).toISOString()
}

export function normalizeDiarioItemLembrete(item: DiarioLembreteFields, now: Date): DiarioLembreteFields {
  if (!item.lembreteAtivo) {
    return {
      lembreteAtivo: false,
      lembreteIntervaloMinutos: undefined,
      lembreteProximoEm: undefined,
      lembreteUltimoEm:
        typeof item.lembreteUltimoEm === 'string' && item.lembreteUltimoEm.trim()
          ? item.lembreteUltimoEm
          : undefined,
    }
  }

  const min =
    typeof item.lembreteIntervaloMinutos === 'number' && item.lembreteIntervaloMinutos > 0
      ? Math.round(item.lembreteIntervaloMinutos)
      : 60

  let proximo = item.lembreteProximoEm
  if (typeof proximo !== 'string' || !proximo.trim() || Number.isNaN(Date.parse(proximo))) {
    proximo = scheduleProximoLembrete(now, min)
  }

  return {
    lembreteAtivo: true,
    lembreteIntervaloMinutos: min,
    lembreteProximoEm: proximo,
    lembreteUltimoEm:
      typeof item.lembreteUltimoEm === 'string' && item.lembreteUltimoEm.trim()
        ? item.lembreteUltimoEm
        : undefined,
  }
}

export function applyDiarioLembretePatch(
  item: DiarioLembreteFields,
  patch: DiarioLembretePatch,
  now: Date
): DiarioLembreteFields {
  if (!patch.ativo) {
    return {
      ...item,
      lembreteAtivo: false,
      lembreteIntervaloMinutos: undefined,
      lembreteProximoEm: undefined,
    }
  }

  const min = patch.intervaloMinutos ?? item.lembreteIntervaloMinutos ?? 60
  const base =
    patch.reagendarAgora || !item.lembreteProximoEm
      ? now
      : new Date(item.lembreteProximoEm)

  return {
    ...item,
    lembreteAtivo: true,
    lembreteIntervaloMinutos: min,
    lembreteProximoEm: scheduleProximoLembrete(base, min),
  }
}

export function formatDiarioLembreteIntervalo(minutos: number, t: Record<string, string>): string {
  const key = DIARIO_LEMBRETE_INTERVALO_KEYS[minutos]
  if (key && t[key]) return t[key]
  if (minutos < 60) {
    const unit = t.diarioPedidosLembreteMinutosLabel || 'min'
    return `${minutos} ${unit}`
  }
  if (minutos % 1440 === 0) {
    const dias = minutos / 1440
    if (dias === 1) return t.diarioPedidosLembrete1dia || '1 dia'
    return `${dias} ${t.diarioPedidosLembreteDias || 'dias'}`
  }
  const h = Math.round(minutos / 60)
  const hUnit = t.diarioPedidosLembreteHorasAbrev || 'h'
  return h === 1 ? t.diarioPedidosLembrete1h || '1 hora' : `${h} ${hUnit}`
}

export function isDiarioLembreteDue(
  item: DiarioLembreteFields & { status?: string },
  now: number
): boolean {
  if (!item.lembreteAtivo || item.status === 'concluido') return false
  const prox = item.lembreteProximoEm
  if (!prox) return false
  const ts = Date.parse(prox)
  if (Number.isNaN(ts)) return false
  return ts <= now
}

export function advanceDiarioLembreteAfterFire(item: DiarioLembreteFields, now: Date): DiarioLembreteFields {
  const min = item.lembreteIntervaloMinutos ?? 60
  return {
    ...item,
    lembreteAtivo: true,
    lembreteIntervaloMinutos: min,
    lembreteUltimoEm: now.toISOString(),
    lembreteProximoEm: scheduleProximoLembrete(now, min),
  }
}

export function clearDiarioLembreteOnConcluido(item: DiarioLembreteFields): DiarioLembreteFields {
  return {
    ...item,
    lembreteAtivo: false,
    lembreteProximoEm: undefined,
  }
}

export function clampDiarioLembreteMinutos(raw: number): number {
  if (!Number.isFinite(raw)) return 60
  return Math.min(525_600, Math.max(1, Math.round(raw)))
}

export function diarioLembreteSelectKey(minutos: number): string {
  return (DIARIO_LEMBRETE_INTERVALOS_MIN as readonly number[]).includes(minutos)
    ? String(minutos)
    : DIARIO_LEMBRETE_CUSTOM_KEY
}
