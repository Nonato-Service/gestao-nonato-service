import { buildMailtoUrl, buildWhatsAppUrl } from '../modules/clientes/contactoEnvio'

/** Re-export fino — fonte canónica em `app/modules/clientes/contactoEnvio`. */
export type { ClienteContactoEnvio, ClienteContactoPrefill } from '../modules/clientes/contactoEnvio'
export {
  normalizarTelefoneWhatsApp,
  prefillContactFromCliente,
  buildMailtoUrl,
  buildWhatsAppUrl,
  findClienteParaEnvio,
} from '../modules/clientes/contactoEnvio'

/** Abre URL externa; devolve false só se não foi possível disparar a abertura. */
export function abrirUrlExterna(url: string): boolean {
  if (typeof window === 'undefined' || !url) return false
  try {
    const w = window.open(url, '_blank')
    if (w) {
      try {
        w.opener = null
      } catch {
        /* ignorar */
      }
      return true
    }
  } catch {
    /* continuar para fallback */
  }
  try {
    const a = document.createElement('a')
    a.href = url
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.setAttribute('aria-hidden', 'true')
    document.body.appendChild(a)
    a.click()
    a.remove()
    return true
  } catch {
    return false
  }
}

export function abrirEmailCliente(opts: { email?: string; subject?: string; body?: string }): boolean {
  const email = String(opts.email ?? '').trim()
  if (!email) return false
  return abrirUrlExterna(buildMailtoUrl({ to: email, subject: opts.subject, body: opts.body }))
}

export function abrirWhatsAppCliente(opts: { telefone?: string; text?: string }): boolean {
  const tel = String(opts.telefone ?? '').replace(/\D/g, '')
  if (tel.length < 9) return false
  return abrirUrlExterna(buildWhatsAppUrl(opts))
}
