import { nomesClienteCorrespondem, resolverClienteIdRelatorioFlexivel } from './bibliotecaRelatoriosRecovery'

export type ClienteContactoEnvio = {
  id?: string
  nomeEmpresa?: string
  email?: string
  telefones?: string
}

export type ClienteContactoPrefill = {
  clienteId: string
  email: string
  telefoneWhatsApp: string
  nomeEmpresa: string
}

/** Extrai dígitos para wa.me a partir do campo telefones (vários números separados por / , ;). */
export function normalizarTelefoneWhatsApp(telefones: string): string {
  const s = String(telefones || '')
  const all = s.replace(/\D/g, '')
  if (all.length >= 10 && all.length <= 15) return all
  if (all.length === 9 && all.startsWith('9')) return `351${all}`
  const parts = s.split(/[/;,|]+/)
  for (const part of parts) {
    let d = part.replace(/\D/g, '')
    if (d.length === 9 && d.startsWith('9')) d = `351${d}`
    else if (d.length > 0 && d.length < 11 && !d.startsWith('351')) {
      d = `351${d.replace(/^0+/, '')}`
    }
    if (d.length >= 10 && d.length <= 15) return d
  }
  if (all.length === 9) return `351${all}`
  return all.length >= 9 ? all : ''
}

export function prefillContactFromCliente(cliente: ClienteContactoEnvio): ClienteContactoPrefill {
  return {
    clienteId: String(cliente.id ?? ''),
    email: String(cliente.email ?? '').trim(),
    telefoneWhatsApp: normalizarTelefoneWhatsApp(String(cliente.telefones ?? '')),
    nomeEmpresa: String(cliente.nomeEmpresa ?? '').trim(),
  }
}

export function buildMailtoUrl(opts: { to?: string; subject?: string; body?: string }): string {
  const to = String(opts.to ?? '').trim()
  const params = new URLSearchParams()
  if (opts.subject) params.set('subject', opts.subject)
  if (opts.body) params.set('body', opts.body)
  const q = params.toString()
  return q ? `mailto:${to}?${q}` : to ? `mailto:${to}` : 'mailto:'
}

export function buildWhatsAppUrl(opts: { telefone?: string; text?: string }): string {
  const tel = String(opts.telefone ?? '').replace(/\D/g, '')
  const text = opts.text ?? ''
  if (tel.length >= 9) {
    return `https://wa.me/${tel}${text ? `?text=${encodeURIComponent(text)}` : ''}`
  }
  return `https://wa.me/${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

export function findClienteParaEnvio(
  clientes: ClienteContactoEnvio[],
  opts: { clienteId?: string; clienteNome?: string; relatorio?: { clienteId?: string; cliente?: string } }
): ClienteContactoEnvio | null {
  const id = String(opts.clienteId ?? '').trim()
  if (id) {
    const hit = clientes.find((c) => c.id === id)
    if (hit) return hit
  }
  if (opts.relatorio) {
    const rid = resolverClienteIdRelatorioFlexivel(opts.relatorio, clientes as { id: string; nomeEmpresa?: string }[])
    if (rid) {
      const hit = clientes.find((c) => c.id === rid)
      if (hit) return hit
    }
  }
  const nome = String(opts.clienteNome ?? opts.relatorio?.cliente ?? '').trim()
  if (nome) {
    const hit = clientes.find((c) => nomesClienteCorrespondem(String(c.nomeEmpresa ?? ''), nome))
    if (hit) return hit
  }
  return null
}

export function abrirEmailCliente(opts: { email?: string; subject?: string; body?: string }): boolean {
  const email = String(opts.email ?? '').trim()
  if (!email) return false
  window.open(buildMailtoUrl({ to: email, subject: opts.subject, body: opts.body }), '_blank', 'noopener,noreferrer')
  return true
}

export function abrirWhatsAppCliente(opts: { telefone?: string; text?: string }): boolean {
  window.open(buildWhatsAppUrl(opts), '_blank', 'noopener,noreferrer')
  return true
}
