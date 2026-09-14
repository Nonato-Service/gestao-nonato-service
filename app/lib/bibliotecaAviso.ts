/**
 * I/O de storage/notificação — aviso de biblioteca canónico em `app/modules/biblioteca/aviso`.
 */
import {
  BIBLIOTECA_AVISO_PERMISSAO_PEDIDA_KEY,
  lerUltimoServidorTotalAvisado as lerUltimoServidorTotalAvisadoPure,
  gravarUltimoServidorTotalAvisado as gravarUltimoServidorTotalAvisadoPure,
} from '../modules/biblioteca/aviso'

export type { BibliotecaNovidadesMsgTemplates } from '../modules/biblioteca/aviso'
export {
  BIBLIOTECA_AVISO_POLL_MS,
  formatBibliotecaNovidadesMsg,
} from '../modules/biblioteca/aviso'

function lsGet(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function lsSet(key: string, value: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}

export function lerUltimoServidorTotalAvisado(): number {
  return lerUltimoServidorTotalAvisadoPure(lsGet)
}

export function gravarUltimoServidorTotalAvisado(total: number): void {
  gravarUltimoServidorTotalAvisadoPure(total, lsSet)
}

export async function pedirPermissaoAvisoBibliotecaSeNecessario(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  try {
    const pediu = lsGet(BIBLIOTECA_AVISO_PERMISSAO_PEDIDA_KEY)
    if (pediu) return false
    const p = await Notification.requestPermission()
    lsSet(BIBLIOTECA_AVISO_PERMISSAO_PEDIDA_KEY, '1')
    return p === 'granted'
  } catch {
    return false
  }
}

export function showBibliotecaBrowserNotification(title: string, body: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(title, {
      body,
      tag: 'nonato-biblioteca-novidades',
    })
  } catch {
    /* ignore */
  }
}
