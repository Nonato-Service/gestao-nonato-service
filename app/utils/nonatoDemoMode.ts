/**
 * Modo DEMO (build com `NEXT_PUBLIC_NONATO_DEMO=1`):
 * — Sem chamadas a `/api/data/*` (nada de servidor / “base” remota).
 * — Só armazenamento local (localStorage / IndexedDB como já está na app).
 * — Após 15 dias desde a primeira abertura neste browser, o período de demonstração expira (bloqueio total na UI).
 *
 * Build de demonstração: `npm run build:demo` (define a variável e corre `next build`).
 */

const LS_FIRST_OPEN_MS = 'nonato-demo-first-open-ms'
const DEMO_DURATION_MS = 15 * 24 * 60 * 60 * 1000

export function isNonatoDemoBuild(): boolean {
  return process.env.NEXT_PUBLIC_NONATO_DEMO === '1'
}

/** Grava o instante da primeira abertura (uma vez por browser / origem). */
export function ensureNonatoDemoClockStarted(): void {
  if (typeof window === 'undefined' || !isNonatoDemoBuild()) return
  try {
    if (!localStorage.getItem(LS_FIRST_OPEN_MS)) {
      localStorage.setItem(LS_FIRST_OPEN_MS, String(Date.now()))
    }
  } catch {
    /* ignorar */
  }
}

export function getNonatoDemoFirstOpenMs(): number | null {
  if (typeof window === 'undefined' || !isNonatoDemoBuild()) return null
  try {
    const raw = localStorage.getItem(LS_FIRST_OPEN_MS)
    const n = raw ? parseInt(raw, 10) : NaN
    return Number.isFinite(n) && n > 0 ? n : null
  } catch {
    return null
  }
}

export function getNonatoDemoExpiresAtMs(): number | null {
  const start = getNonatoDemoFirstOpenMs()
  if (start === null) return null
  return start + DEMO_DURATION_MS
}

export function isNonatoDemoExpired(): boolean {
  const end = getNonatoDemoExpiresAtMs()
  if (end === null) return false
  return Date.now() >= end
}

/** Dias completos restantes (0 = último dia ou já expirado). */
export function getNonatoDemoDaysRemaining(): number {
  const end = getNonatoDemoExpiresAtMs()
  if (end === null) return 0
  const ms = end - Date.now()
  if (ms <= 0) return 0
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)))
}
