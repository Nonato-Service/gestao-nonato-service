const BIBLIOTECA_ULTIMO_SERVIDOR_AVISADO_KEY = 'nonato-biblioteca-ultimo-servidor-total-avisado'
const BIBLIOTECA_AVISO_PERMISSAO_PEDIDA_KEY = 'nonato-biblioteca-aviso-permissao-pedida'

export const BIBLIOTECA_AVISO_POLL_MS = 5 * 60 * 1000

export function lerUltimoServidorTotalAvisado(): number {
  if (typeof window === 'undefined') return 0
  try {
    const v = localStorage.getItem(BIBLIOTECA_ULTIMO_SERVIDOR_AVISADO_KEY)
    return v ? Number(v) || 0 : 0
  } catch {
    return 0
  }
}

export function gravarUltimoServidorTotalAvisado(total: number): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(BIBLIOTECA_ULTIMO_SERVIDOR_AVISADO_KEY, String(total))
  } catch {
    /* ignore */
  }
}

export async function pedirPermissaoAvisoBibliotecaSeNecessario(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  try {
    const pediu = localStorage.getItem(BIBLIOTECA_AVISO_PERMISSAO_PEDIDA_KEY)
    if (pediu) return false
    const p = await Notification.requestPermission()
    localStorage.setItem(BIBLIOTECA_AVISO_PERMISSAO_PEDIDA_KEY, '1')
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

export function formatBibliotecaNovidadesMsg(novidades: number, servidorTotal: number): string {
  if (novidades === 1) {
    return `Há 1 peça nova no servidor (${servidorTotal} total). Abra Biblioteca de Peças e clique «Actualizar biblioteca».`
  }
  return `Há ${novidades} peças novas no servidor (${servidorTotal} total). Abra Biblioteca de Peças e clique «Actualizar biblioteca».`
}
