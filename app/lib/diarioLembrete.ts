import {
  applyDiarioLembretePatch as applyDiarioLembretePatchPure,
  advanceDiarioLembreteAfterFire as advanceDiarioLembreteAfterFirePure,
  isDiarioLembreteDue as isDiarioLembreteDuePure,
  normalizeDiarioItemLembrete as normalizeDiarioItemLembretePure,
  type DiarioLembreteFields,
} from '../modules/diario/lembrete'

/** Re-export fino — fonte canónica em `app/modules/diario/lembrete`. */
export type { DiarioLembreteFields, DiarioLembreteIntervaloMin, DiarioLembretePatch } from '../modules/diario/lembrete'
export {
  DIARIO_LEMBRETE_INTERVALOS_MIN,
  DIARIO_LEMBRETE_INTERVALO_KEYS,
  DIARIO_LEMBRETE_CUSTOM_KEY,
  scheduleProximoLembrete,
  formatDiarioLembreteIntervalo,
  clearDiarioLembreteOnConcluido,
  clampDiarioLembreteMinutos,
  diarioLembreteSelectKey,
} from '../modules/diario/lembrete'

/** Injeta `new Date()` no normalize canónico. */
export function normalizeDiarioItemLembrete(item: DiarioLembreteFields): DiarioLembreteFields {
  return normalizeDiarioItemLembretePure(item, new Date())
}

/** Injeta `new Date()` no patch canónico. */
export function applyDiarioLembretePatch(
  item: DiarioLembreteFields,
  patch: { ativo: boolean; intervaloMinutos?: number; reagendarAgora?: boolean }
): DiarioLembreteFields {
  return applyDiarioLembretePatchPure(item, patch, new Date())
}

/** Injeta `Date.now()` na verificação canónica. */
export function isDiarioLembreteDue(
  item: DiarioLembreteFields & { status?: string },
  now = Date.now()
): boolean {
  return isDiarioLembreteDuePure(item, now)
}

/** Injeta `new Date()` no avanço canónico. */
export function advanceDiarioLembreteAfterFire(item: DiarioLembreteFields): DiarioLembreteFields {
  return advanceDiarioLembreteAfterFirePure(item, new Date())
}

export async function requestDiarioNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  try {
    const p = await Notification.requestPermission()
    return p === 'granted'
  } catch {
    return false
  }
}

export function showDiarioBrowserNotification(title: string, body: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(title, {
      body,
      tag: `diario-lembrete-${Date.now()}`,
    })
  } catch {
    /* ignore */
  }
}
