/**
 * Evita várias cargas de biblioteca em paralelo (tablet a «saltar» 1000→16000→200).
 */

import { getCachedPecasBibliotecaServerTotal } from './completeness'

let syncInFlight: Promise<unknown> | null = null
let syncOwner = ''

export function isPecasBibliotecaSyncInFlight(): boolean {
  return syncInFlight !== null
}

export function getPecasBibliotecaSyncOwner(): string {
  return syncOwner
}

/** Executa uma operação de sync/repor de peças de cada vez. */
export async function runPecasBibliotecaSyncExclusive<T>(
  owner: string,
  fn: () => Promise<T>
): Promise<T | null> {
  if (syncInFlight) {
    console.info(`[Nonato] Sync peças «${owner}» ignorada — «${syncOwner}» em curso.`)
    try {
      await syncInFlight
    } catch {
      /* ignorar */
    }
    return null
  }
  syncOwner = owner
  const job = fn()
  syncInFlight = job
  try {
    return await job
  } finally {
    syncInFlight = null
    syncOwner = ''
  }
}

/** Tablet/telemóvel: carregar só catálogo (sem fotos base64) — poupa memória e rede. */
export function shouldDeferPecasBibliotecaImageHydration(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const narrow = window.matchMedia('(max-width: 900px)').matches
    const ua = navigator.userAgent || ''
    const mobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(ua)
    return coarse || narrow || mobileUa
  } catch {
    return false
  }
}

export function isBibliotecaMobileDevice(): boolean {
  return shouldDeferPecasBibliotecaImageHydration()
}

export function shouldRejectPartialPecasSave(count: number, expected?: number | null): boolean {
  const exp = expected ?? getCachedPecasBibliotecaServerTotal()
  if (!exp || exp <= 0) return false
  return count < exp
}
