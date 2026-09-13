/** Texto e URLs de envio da demo (mailto / WhatsApp) — sem I/O. */

import { DEMO_DAYS_DEFAULT, clampDemoDays } from './limits'

export type DemoShareCreds = {
  demoUsuario?: string
  demoSenha?: string
}

export function buildDemoShareMessage(
  nome: string,
  link: string,
  demoDays = DEMO_DAYS_DEFAULT,
  creds?: DemoShareCreds
): string {
  const quem = nome.trim() || 'cliente'
  const dias = clampDemoDays(demoDays)
  const credBlock =
    creds?.demoUsuario && creds?.demoSenha
      ? `Utilizador: ${creds.demoUsuario}\nSenha: ${creds.demoSenha}\n\n`
      : ''
  return (
    `Olá ${quem}! Segue o acesso Gestor Demo do sistema NONATO SERVICE (${dias} dia${dias === 1 ? '' : 's'}):\n\n` +
    `${link}\n\n` +
    credBlock +
    `1) Abra o link ou entre com utilizador e senha\n2) Clique em «Aceitar e entrar» (se usar o link)\n3) Explore o sistema — os dados ficam isolados.\n\n` +
    `NONATO SERVICE`
  )
}

export function buildDemoMailto(
  email: string,
  nome: string,
  link: string,
  demoDays = DEMO_DAYS_DEFAULT,
  creds?: DemoShareCreds
): string {
  const dias = clampDemoDays(demoDays)
  const assunto = `Demonstração NONATO SERVICE — ${dias} dia${dias === 1 ? '' : 's'}`
  const corpo = buildDemoShareMessage(nome, link, dias, creds)
  const to = email.trim()
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`
}

export function buildDemoWhatsAppUrl(
  nome: string,
  link: string,
  phone?: string,
  creds?: DemoShareCreds,
  demoDays = DEMO_DAYS_DEFAULT
): string {
  const msg = encodeURIComponent(buildDemoShareMessage(nome, link, demoDays, creds))
  const digits = (phone || '').replace(/\D/g, '')
  if (digits.length >= 8) return `https://wa.me/${digits}?text=${msg}`
  return `https://wa.me/?text=${msg}`
}
