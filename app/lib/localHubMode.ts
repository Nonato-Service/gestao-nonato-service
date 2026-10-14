/**
 * Modo hub local (PC + tablet na Wi‑Fi, sem Railway).
 * Usado para silenciar nags de «atualizar/enviar ao servidor» no uso diário.
 *
 * Activa-se com NEXT_PUBLIC_NONATO_LOCAL_HUB=1 (INICIAR-NONATO-LOCAL.bat)
 * ou quando o hostname é localhost / IP privado de LAN.
 */

export function isNonatoLocalHubMode(): boolean {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_NONATO_LOCAL_HUB === '1') {
    return true
  }
  if (typeof window === 'undefined') {
    return (
      process.env?.NONATO_LOCAL_DEV === '1' ||
      process.env?.NONATO_FORCE_DEV === '1'
    )
  }
  try {
    const h = String(window.location.hostname || '').toLowerCase()
    if (!h || h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '::1') {
      return true
    }
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)) return true
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(h)) return true
  } catch {
    /* ignorar */
  }
  return false
}
