/** Lógica partilhada — gestão de envio de demonstrações (validade configurável). */

export type DemoModuleMode = 'active' | 'teaser' | 'hidden'

export type DemoPackagePreset =
  | 'basic'
  | 'commercial'
  | 'technical'
  | 'partial'
  | 'gestao-nucleo'
  | 'tecnica-clientes'

export type DemoRecipientRecord = {
  id: string
  nome: string
  email: string
  dataEnvio: string
  dataExpiracao?: string
  observacoes?: string
  firstAccessAt?: string
  lastAccessAt?: string
  activationCount?: number
  demoModules?: Record<string, DemoModuleMode>
  demoPreset?: string
  /** Dias de validade após o primeiro «Aceitar e entrar» (definido por si ao criar o link). */
  demoDays?: number
  /** Utilizador gerado automaticamente para o destinatário entrar na demo. */
  demoUsuario?: string
  /** Senha gerada automaticamente (visível só para o administrador). */
  demoSenha?: string
}

export type DemoRecipientStatus = 'pendente' | 'ativo' | 'a-expirar' | 'expirado'

export type DemoRecipientWithState = DemoRecipientRecord & {
  link: string
  status: DemoRecipientStatus
  daysLeft: number | null
}

export const DEMO_DAYS_DEFAULT = 15
export const DEMO_DAYS_MIN = 1
export const DEMO_DAYS_MAX = 90
/** Valor por omissão ao criar novos links (retrocompatível com código existente). */
export const DEMO_DAYS = DEMO_DAYS_DEFAULT
export const DEMO_RECIPIENTS_KEY = 'nonato-demo-link-recipients'

export function clampDemoDays(value: unknown): number {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(n)) return DEMO_DAYS_DEFAULT
  return Math.min(DEMO_DAYS_MAX, Math.max(DEMO_DAYS_MIN, Math.round(n)))
}

export function resolveDemoDaysForRecipient(recipient?: { demoDays?: number } | null): number {
  return clampDemoDays(recipient?.demoDays)
}

/** Utilizador limitado — Gestor Demo (sem acesso de administrador real). */
export const DEMO_VISITOR_USER = {
  id: 'demo-visitor',
  name: 'Gestor Demo',
  email: '',
  role: 'Gestor (Demonstração)',
  isAdmin: false,
  permissions: {
    gestores: true,
    equipamentos: true,
    clientes: true,
    fornecedores: true,
    relatorioServico: true,
    bibliotecaPecas: true,
    agenda: true,
    desmontados: true,
    cadastroServicos: true,
    extras: true,
  },
} as const

export const DEMO_HIDDEN_ACTIONS = new Set([
  'open-administrador',
  'open-cadastro-nonato-service',
  'open-ficha-cadastral',
  'open-ficha-pagamento-transferencia',
  'open-ficha-fatura-cliente',
  'open-translator',
  'open-manual-gestor',
  'open-gestao-demos',
  'open-biblia-nonato-service',
])

export const DEMO_ALLOWED_ACTIONS = new Set([
  'open-clientes',
  'open-fornecedores',
  'open-relatorio-servico',
  'open-biblioteca-pecas',
  'open-importacao-pecas',
  'open-pecas-substituicao',
  'open-solicitacao-servico-tecnico',
  'open-agenda',
  'open-biblioteca-relatorios',
  'open-checklist-hub',
  'open-pre-checklist',
  'open-checklist',
  'open-familias-grupos',
  'open-familias-grupos-equipamentos',
  'open-equipamentos',
  'open-desmontados',
  'open-cadastro-servicos',
  'open-fechamento-relatorios-servicos',
  'open-gestores',
  'open-gestao-industrial',
  'open-gestao-tecnica',
  'open-parceiros-comercial',
  'open-documentacao-relatorios',
  'open-ordem-preparacao',
  'open-formularios-checklist-tecnicos',
  'open-verificacao-final-entrega',
  'open-protocolos-servico',
  'open-extra',
])

export const FULL_DEMO_ACTION_KEYS: string[] = Array.from(
  new Set([
    ...DEMO_ALLOWED_ACTIONS,
    'open-gestao-custos',
    'open-gestao-financeira',
    'open-comunicacao-interna',
    'open-extra',
    'open-biblioteca-hub',
    'open-gestao-grupos-checklist',
    'open-orcamentos-avulso',
    'open-pedido-orcamentos-avulso',
    'open-orcamento-servico-tecnico',
    'open-registro-despesas',
    'open-mapa-visual-separacao',
    'open-mapa-visual-separacao-pecas',
    'open-clientes-financeiro',
    'open-comprovantes-despesas',
    'open-pagamentos-contador',
    'open-hub-comunicacao',
    'open-mensagens-internas',
    'open-mensagens-internas-tecnicos',
    'open-alerta-mensagens',
    'open-quick-gestao-custos',
    'open-quick-gestao-financeira',
    'open-quick-biblioteca-pecas',
    'open-relatorios-excluidos-clientes',
    'open-manuais-informacoes-tecnicas',
    'open-biblia-nonato-service',
    'open-almoxarifado-armazem',
    'open-parceiros-comercial',
    'open-documentacao-relatorios',
    'open-administrador',
    'open-gestao-demos',
  ])
)

export const DEMO_EDITABLE_ACTION_KEYS = FULL_DEMO_ACTION_KEYS.filter(
  (a) => !DEMO_HIDDEN_ACTIONS.has(a)
).sort((a, b) => getDemoModuleLabelForGrid(a).localeCompare(getDemoModuleLabelForGrid(b), 'pt', { sensitivity: 'base' }))

export const DEMO_MODULE_GROUP_ORDER = ['clientes', 'tecnica', 'gestao', 'outros'] as const
export type DemoModuleGroupId = (typeof DEMO_MODULE_GROUP_ORDER)[number]

export const DEMO_MODULE_GROUP_LABELS: Record<DemoModuleGroupId, string> = {
  clientes: 'Clientes, comercial e peças',
  tecnica: 'Técnica, operação e checklist',
  gestao: 'Gestão interna, custos e comunicação',
  outros: 'Outros',
}

export type DemoPresetCard = {
  id: DemoPackagePreset
  title: string
  desc: string
  icon: string
  mode: 'legacy-teaser' | 'strict-hidden'
}

export const DEMO_PRESET_CARDS: DemoPresetCard[] = [
  { id: 'commercial', title: 'Comercial', desc: 'Clientes, peças, agenda e relatórios', icon: '💼', mode: 'legacy-teaser' },
  { id: 'technical', title: 'Técnica', desc: 'Equipamentos, checklist, protocolos', icon: '🔧', mode: 'legacy-teaser' },
  { id: 'tecnica-clientes', title: 'Técnica + clientes', desc: 'Operação completa; resto oculto', icon: '⚙️', mode: 'strict-hidden' },
  { id: 'gestao-nucleo', title: 'Só gestão', desc: 'Custos, financeiro, industrial', icon: '📊', mode: 'strict-hidden' },
  { id: 'basic', title: 'Mínima', desc: '3 funções na área técnica', icon: '🎯', mode: 'legacy-teaser' },
  { id: 'partial', title: 'Mista', desc: 'Combinação parcial de áreas', icon: '🔀', mode: 'legacy-teaser' },
]

export function getDemoModuleLabelForGrid(action: string): string {
  const labels: Record<string, string> = {
    'open-gestores': 'Gestores e Técnicos',
    'open-equipamentos': 'Equipamentos',
    'open-clientes': 'Clientes',
    'open-fornecedores': 'Fornecedores',
    'open-relatorio-servico': 'Relatório de Serviço',
    'open-biblioteca-pecas': 'Biblioteca de Peças',
    'open-importacao-pecas': 'Importação de Peças',
    'open-pecas-substituicao': 'Peças de substituição',
    'open-solicitacao-servico-tecnico': 'Solicitação de serviço técnico',
    'open-agenda': 'Agenda',
    'open-biblioteca-relatorios': 'Biblioteca de relatórios',
    'open-checklist-hub': 'Hub do Checklist',
    'open-pre-checklist': 'Pré-checklist',
    'open-checklist': 'Checklist',
    'open-familias-grupos': 'Famílias e grupos (checklist)',
    'open-familias-grupos-equipamentos': 'Famílias e grupos (equipamentos)',
    'open-desmontados': 'Desmontados',
    'open-cadastro-servicos': 'Cadastro de serviços / valores',
    'open-fechamento-relatorios-servicos': 'Fechamento relatórios de serviço',
    'open-gestao-industrial': 'Gestão Industrial',
    'open-gestao-tecnica': 'Gestão técnica (hub)',
    'open-parceiros-comercial': 'Clientes e fornecedores (hub)',
    'open-documentacao-relatorios': 'Documentação e relatórios (hub)',
    'open-ordem-preparacao': 'Ordem de preparação',
    'open-formularios-checklist-tecnicos': 'Formulários checklist técnicos',
    'open-verificacao-final-entrega': 'Verificação final de entrega',
    'open-protocolos-servico': 'Protocolos de Serviço',
    'open-gestao-custos': 'Gestão de Custos',
    'open-gestao-financeira': 'Gestão Financeira',
    'open-comunicacao-interna': 'Comunicação Interna',
    'open-biblioteca-hub': 'Hub da biblioteca',
    'open-gestao-grupos-checklist': 'Gestão de grupos (checklist)',
    'open-orcamentos-avulso': 'Orçamentos avulso',
    'open-pedido-orcamentos-avulso': 'Pedido de orçamentos avulso',
    'open-orcamento-servico-tecnico': 'Orçamento de serviço técnico',
    'open-registro-despesas': 'Registro de despesas',
    'open-mapa-visual-separacao': 'Mapa visual separação',
    'open-mapa-visual-separacao-pecas': 'Mapa visual separação (peças)',
    'open-clientes-financeiro': 'Clientes (financeiro)',
    'open-comprovantes-despesas': 'Comprovantes de despesas',
    'open-pagamentos-contador': 'Pagamentos ao contador',
    'open-hub-comunicacao': 'Hub de comunicação',
    'open-mensagens-internas': 'Mensagens internas',
    'open-mensagens-internas-tecnicos': 'Mensagens internas (técnicos)',
    'open-alerta-mensagens': 'Alerta de mensagens',
    'open-quick-gestao-custos': 'Atalho: Gestão de custos',
    'open-quick-gestao-financeira': 'Atalho: Gestão financeira',
    'open-quick-biblioteca-pecas': 'Atalho: Biblioteca de peças',
    'open-relatorios-excluidos-clientes': 'Relatórios excluídos (clientes)',
    'open-manuais-informacoes-tecnicas': 'Manuais e informações técnicas',
    'open-biblia-nonato-service': 'Bíblia da Nonato Service',
    'open-almoxarifado-armazem': 'Almoxarifado / armazém',
    'open-ficha-pagamento-transferencia': 'Ficha para transferência / pagamento',
    'open-ficha-fatura-cliente': 'Ficha para o cliente emitir fatura',
    'open-extra': 'Extras (idioma)',
  }
  if (labels[action]) return labels[action]
  return action
    .replace(/^open-/, '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function getDemoModuleGroupId(action: string): DemoModuleGroupId {
  const CLIENTES = new Set([
    'open-clientes', 'open-fornecedores', 'open-relatorio-servico', 'open-biblioteca-pecas',
    'open-importacao-pecas', 'open-pecas-substituicao', 'open-solicitacao-servico-tecnico',
    'open-agenda', 'open-biblioteca-relatorios', 'open-biblioteca-hub', 'open-orcamentos-avulso',
    'open-pedido-orcamentos-avulso', 'open-relatorios-excluidos-clientes', 'open-quick-biblioteca-pecas',
    'open-parceiros-comercial', 'open-documentacao-relatorios',
  ])
  const TECNICA = new Set([
    'open-gestores', 'open-equipamentos', 'open-checklist-hub', 'open-pre-checklist', 'open-checklist',
    'open-familias-grupos', 'open-familias-grupos-equipamentos', 'open-desmontados', 'open-cadastro-servicos',
    'open-fechamento-relatorios-servicos', 'open-gestao-industrial', 'open-gestao-tecnica',
    'open-ordem-preparacao', 'open-formularios-checklist-tecnicos', 'open-verificacao-final-entrega',
    'open-protocolos-servico', 'open-gestao-grupos-checklist', 'open-manuais-informacoes-tecnicas',
    'open-almoxarifado-armazem', 'open-mapa-visual-separacao', 'open-mapa-visual-separacao-pecas',
  ])
  const GESTAO = new Set([
    'open-gestao-custos', 'open-gestao-financeira', 'open-comunicacao-interna', 'open-hub-comunicacao',
    'open-mensagens-internas', 'open-mensagens-internas-tecnicos', 'open-alerta-mensagens',
    'open-quick-gestao-custos', 'open-quick-gestao-financeira', 'open-clientes-financeiro',
    'open-comprovantes-despesas', 'open-pagamentos-contador', 'open-orcamento-servico-tecnico',
    'open-registro-despesas',
  ])
  if (CLIENTES.has(action)) return 'clientes'
  if (TECNICA.has(action)) return 'tecnica'
  if (GESTAO.has(action)) return 'gestao'
  return 'outros'
}

export function getDemoPresetLabel(preset?: string): string {
  switch (preset) {
    case 'basic': return 'Demo básica'
    case 'commercial': return 'Demo comercial'
    case 'technical': return 'Demo técnica'
    case 'partial': return 'Demo parcial'
    case 'gestao-nucleo': return 'Gestão (Custos, Fin., Ind., Com.)'
    case 'tecnica-clientes': return 'Gestão técnica + clientes'
    case 'completo': return 'Envio completo'
    case 'custom': return 'Personalizada (módulo a módulo)'
    default: return 'Padrão'
  }
}

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
  const base: Record<string, DemoModuleMode> = {}
  if (modules && typeof modules === 'object') {
    for (const [key, value] of Object.entries(modules)) {
      if (value === 'active' || value === 'teaser' || value === 'hidden') {
        base[key] = value
      }
    }
  }
  return finalizeDemoModulesPolicy(base)
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
  const demoModules = Object.fromEntries(
    FULL_DEMO_ACTION_KEYS.map((action) => {
      const mode: DemoModuleMode = DEMO_HIDDEN_ACTIONS.has(action)
        ? 'hidden'
        : DEMO_ALLOWED_ACTIONS.has(action)
          ? 'active'
          : 'teaser'
      return [action, mode]
    })
  ) as Record<string, DemoModuleMode>
  return {
    nome: '',
    email: '',
    observacoes: '',
    demoDays: DEMO_DAYS_DEFAULT,
    demoModules,
    demoPreset: 'commercial' as DemoPackagePreset | 'custom',
  }
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

export function countActiveModules(modules: Record<string, DemoModuleMode>): number {
  return Object.values(modules).filter((m) => m === 'active').length
}
