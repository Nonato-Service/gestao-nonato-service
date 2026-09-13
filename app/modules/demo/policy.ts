/** Política de módulos da demo (preset / sessão / form inicial) — sem I/O. */

import type { DemoModuleMode, DemoPackagePreset } from './tipos'
import { pickValidDemoModuleModes } from './modulesMode'
import { defaultDemoModulesForActions, emptyDemoRecipientForm } from './formState'
import { DEMO_DAYS_DEFAULT } from './limits'
import { DEMO_ALLOWED_ACTIONS, DEMO_HIDDEN_ACTIONS, FULL_DEMO_ACTION_KEYS } from './actions'

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

export function buildDemoModulesComplete(): Record<string, DemoModuleMode> {
  return finalizeDemoModulesPolicy(
    Object.fromEntries(
      FULL_DEMO_ACTION_KEYS.map((action) => [action, DEMO_HIDDEN_ACTIONS.has(action) ? 'hidden' : 'active'])
    ) as Record<string, DemoModuleMode>
  )
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
