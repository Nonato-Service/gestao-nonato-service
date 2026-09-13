/** Lógica partilhada — gestão de envio de demonstrações (validade configurável). */

/** Tipos canónicos → `app/modules/demo` (re-export fino para consumidores existentes). */
export type {
  DemoModuleMode,
  DemoPackagePreset,
  DemoRecipientRecord,
  DemoRecipientStatus,
  DemoRecipientWithState,
} from '../modules/demo'
export { isDemoModuleMode, pickValidDemoModuleModes, countActiveModules } from '../modules/demo'

import type {
  DemoRecipientRecord,
  DemoRecipientStatus,
  DemoRecipientWithState,
} from '../modules/demo'
import { DEMO_DAYS_DEFAULT, clampDemoDays, resolveDemoDaysForRecipient } from '../modules/demo/limits'

export {
  DEMO_DAYS_DEFAULT,
  DEMO_DAYS_MIN,
  DEMO_DAYS_MAX,
  DEMO_DAYS,
  DEMO_RECIPIENTS_KEY,
  clampDemoDays,
  resolveDemoDaysForRecipient,
  DEMO_VISITOR_USER,
} from '../modules/demo/limits'
export {
  DEMO_HIDDEN_ACTIONS,
  DEMO_ALLOWED_ACTIONS,
  FULL_DEMO_ACTION_KEYS,
  DEMO_EDITABLE_ACTION_KEYS,
  getDemoModuleLabelForGrid,
} from '../modules/demo/actions'
export type { DemoModuleGroupId, DemoPresetCard } from '../modules/demo/groups'
export {
  DEMO_MODULE_GROUP_ORDER,
  DEMO_MODULE_GROUP_LABELS,
  DEMO_PRESET_CARDS,
  getDemoModuleGroupId,
  getDemoPresetLabel,
} from '../modules/demo/groups'
export {
  finalizeDemoModulesPolicy,
  buildDemoModulesComplete,
  normalizeDemoModulesForSession,
  buildDemoModulesFromPreset,
  createDefaultDemoLinkForm,
} from '../modules/demo/policy'

export function enrichDemoRecipients(
  recipients: DemoRecipientRecord[],
  demoLinkBaseUrl: string
): DemoRecipientWithState[] {
  const agora = Date.now()
  return recipients
    .map((recipient) => {
      const link = `${demoLinkBaseUrl}?rid=${encodeURIComponent(recipient.id)}`
      const demoDays = resolveDemoDaysForRecipient(recipient)
      const dataBaseAtivacao = recipient.firstAccessAt || recipient.dataEnvio
      const dataBaseMs = new Date(dataBaseAtivacao).getTime()
      const dataExpiracao =
        recipient.dataExpiracao ||
        (dataBaseMs ? new Date(dataBaseMs + demoDays * 24 * 60 * 60 * 1000).toISOString() : undefined)
      const expiracaoMs = dataExpiracao ? new Date(dataExpiracao).getTime() : NaN
      const diffMs = isNaN(expiracaoMs) ? NaN : expiracaoMs - agora
      const daysLeft = isNaN(diffMs) ? null : Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
      const status: DemoRecipientStatus = !recipient.firstAccessAt
        ? 'pendente'
        : diffMs <= 0
          ? 'expirado'
          : daysLeft !== null && daysLeft <= 3
            ? 'a-expirar'
            : 'ativo'
      return { ...recipient, link, dataExpiracao, daysLeft, status }
    })
    .sort((a, b) => new Date(b.dataEnvio).getTime() - new Date(a.dataEnvio).getTime())
}

export function buildDemoShareMessage(
  nome: string,
  link: string,
  demoDays = DEMO_DAYS_DEFAULT,
  creds?: { demoUsuario?: string; demoSenha?: string }
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
  creds?: { demoUsuario?: string; demoSenha?: string }
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
  creds?: { demoUsuario?: string; demoSenha?: string },
  demoDays = DEMO_DAYS_DEFAULT
): string {
  const msg = encodeURIComponent(buildDemoShareMessage(nome, link, demoDays, creds))
  const digits = (phone || '').replace(/\D/g, '')
  if (digits.length >= 8) return `https://wa.me/${digits}?text=${msg}`
  return `https://wa.me/?text=${msg}`
}

