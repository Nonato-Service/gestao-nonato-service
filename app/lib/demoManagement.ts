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
  DemoModuleMode,
  DemoPackagePreset,
  DemoRecipientRecord,
  DemoRecipientStatus,
  DemoRecipientWithState,
} from '../modules/demo'
import {
  pickValidDemoModuleModes,
  defaultDemoModulesForActions,
  emptyDemoRecipientForm,
} from '../modules/demo'
import { DEMO_DAYS_DEFAULT, clampDemoDays } from '../modules/demo/limits'
import {
  DEMO_HIDDEN_ACTIONS,
  DEMO_ALLOWED_ACTIONS,
  FULL_DEMO_ACTION_KEYS,
} from '../modules/demo/actions'

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

export function buildDemoModulesComplete(): Record<string, DemoModuleMode> {
  return finalizeDemoModulesPolicy(
    Object.fromEntries(
      FULL_DEMO_ACTION_KEYS.map((action) => [action, DEMO_HIDDEN_ACTIONS.has(action) ? 'hidden' : 'active'])
    ) as Record<string, DemoModuleMode>
  )
}

/** Garante que módulos sensíveis (Administrador, backup, etc.) nunca ficam activos na demo. */
export function finalizeDemoModulesPolicy(modules: Record<string, DemoModuleMode>): Record<string, DemoModuleMode> {
  const out: Record<string, DemoModuleMode> = { ...modules }
  for (const action of FULL_DEMO_ACTION_KEYS) {
    if (out[action] === undefined) {
      out[action] = DEMO_HIDDEN_ACTIONS.has(action) ? 'hidden' : 'teaser'
    }
  }
  for (const action of DEMO_HIDDEN_ACTIONS) {
    out[action] = 'hidden'
  }
  // Idioma sempre disponível na demo (Administrador e restantes sensíveis continuam ocultos).
  out['open-extra'] = 'active'
  return out
}

/** Normaliza módulos guardados/cookie — útil para demos já enviadas antes de Extras estar activo. */
export function normalizeDemoModulesForSession(
  modules: Record<string, DemoModuleMode | string> | undefined
): Record<string, DemoModuleMode> {
  return finalizeDemoModulesPolicy(pickValidDemoModuleModes(modules))
}

export function buildDemoModulesFromPreset(
  preset: DemoPackagePreset,
  mode: 'legacy-teaser' | 'strict-hidden' = 'legacy-teaser'
): Record<string, DemoModuleMode> {
  const activeByPreset: Record<'basic' | 'commercial' | 'technical' | 'partial', string[]> = {
    basic: ['open-gestao-tecnica', 'open-clientes', 'open-fornecedores', 'open-relatorio-servico'],
    commercial: [
      'open-gestao-tecnica', 'open-biblioteca-hub', 'open-clientes', 'open-fornecedores',
      'open-relatorio-servico', 'open-biblioteca-pecas', 'open-importacao-pecas', 'open-agenda',
    ],
    technical: [
      'open-gestao-tecnica', 'open-gestao-industrial', 'open-gestores', 'open-equipamentos',
      'open-checklist-hub', 'open-checklist', 'open-desmontados', 'open-protocolos-servico',
    ],
    partial: [
      'open-gestao-tecnica', 'open-clientes', 'open-fornecedores', 'open-relatorio-servico',
      'open-biblioteca-pecas', 'open-importacao-pecas', 'open-agenda', 'open-checklist-hub',
      'open-protocolos-servico',
    ],
  }

  const GESTAO_NUCLEO_ACTIVE = new Set([
    'open-gestao-custos', 'open-gestao-financeira', 'open-gestao-industrial', 'open-comunicacao-interna',
    'open-cadastro-servicos', 'open-orcamentos-avulso', 'open-pedido-orcamentos-avulso',
    'open-orcamento-servico-tecnico', 'open-registro-despesas', 'open-mapa-visual-separacao',
    'open-mapa-visual-separacao-pecas', 'open-fechamento-relatorios-servicos', 'open-quick-gestao-custos',
    'open-quick-gestao-financeira', 'open-clientes-financeiro', 'open-comprovantes-despesas',
    'open-pagamentos-contador', 'open-familias-grupos-equipamentos', 'open-equipamentos', 'open-desmontados',
    'open-manuais-informacoes-tecnicas', 'open-almoxarifado-armazem', 'open-hub-comunicacao',
    'open-mensagens-internas', 'open-mensagens-internas-tecnicos', 'open-alerta-mensagens',
  ])

  const TECNICA_CLIENTES_ACTIVE = new Set([
    'open-gestao-tecnica', 'open-biblioteca-hub', 'open-clientes', 'open-fornecedores', 'open-relatorio-servico',
    'open-biblioteca-pecas', 'open-importacao-pecas', 'open-solicitacao-servico-tecnico', 'open-agenda',
    'open-biblioteca-relatorios', 'open-relatorios-excluidos-clientes', 'open-gestores', 'open-equipamentos',
    'open-familias-grupos', 'open-familias-grupos-equipamentos', 'open-checklist-hub', 'open-pre-checklist',
    'open-checklist', 'open-gestao-grupos-checklist', 'open-formularios-checklist-tecnicos',
    'open-verificacao-final-entrega', 'open-desmontados', 'open-cadastro-servicos',
    'open-fechamento-relatorios-servicos', 'open-protocolos-servico', 'open-gestao-industrial',
    'open-manuais-informacoes-tecnicas', 'open-almoxarifado-armazem', 'open-ordem-preparacao',
  ])

  let active: Set<string>
  if (preset === 'gestao-nucleo') active = GESTAO_NUCLEO_ACTIVE
  else if (preset === 'tecnica-clientes') active = TECNICA_CLIENTES_ACTIVE
  else active = new Set(activeByPreset[preset])

  const restMode: DemoModuleMode =
    mode === 'strict-hidden' && (preset === 'gestao-nucleo' || preset === 'tecnica-clientes') ? 'hidden' : 'teaser'

  const out: Record<string, DemoModuleMode> = {}
  for (const action of FULL_DEMO_ACTION_KEYS) {
    if (DEMO_HIDDEN_ACTIONS.has(action)) {
      out[action] = 'hidden'
      continue
    }
    out[action] = active.has(action) ? 'active' : restMode
  }
  return finalizeDemoModulesPolicy(out)
}

export function createDefaultDemoLinkForm() {
  return emptyDemoRecipientForm(
    defaultDemoModulesForActions(FULL_DEMO_ACTION_KEYS, DEMO_HIDDEN_ACTIONS, DEMO_ALLOWED_ACTIONS),
    { demoDays: DEMO_DAYS_DEFAULT, demoPreset: 'commercial' }
  )
}

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

