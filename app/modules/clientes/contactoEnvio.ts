/** Contacto do cliente para e-mail / WhatsApp — tipos e funções puras, sem I/O. */

import { nomesClienteCorrespondem, resolverClienteIdRelatorioFlexivel } from '../biblioteca/relatoriosRecovery'

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

/** Limite seguro para query string do WhatsApp (URLs muito longas falham em silêncio). */
const WHATSAPP_TEXT_MAX = 1800

export function buildWhatsAppUrl(opts: { telefone?: string; text?: string }): string {
  const tel = String(opts.telefone ?? '').replace(/\D/g, '')
  let text = String(opts.text ?? '')
  if (text.length > WHATSAPP_TEXT_MAX) {
    text = `${text.slice(0, WHATSAPP_TEXT_MAX - 1)}…`
  }
  // api.whatsapp.com é mais fiável que wa.me em PWA / browsers móveis
  const q = new URLSearchParams()
  if (tel.length >= 9) q.set('phone', tel)
  if (text) q.set('text', text)
  const qs = q.toString()
  return qs ? `https://api.whatsapp.com/send?${qs}` : 'https://api.whatsapp.com/send'
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
