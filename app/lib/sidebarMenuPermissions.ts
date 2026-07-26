import type { UserFormState, SidebarGroup } from '../components/admin/adminTypes'
import { USER_PERMISSION_KEYS, type UserPermissionKey } from './adminUserPermissions'

export type SidebarMenuItemDef = {
  buttonId: string
  action: string
  labelKey: string
  fallbackLabel: string
  legacyKey?: UserPermissionKey
}

export type SidebarMenuModuleDef = {
  id: SidebarGroup
  titleKey: string
  fallbackTitle: string
  descKey: string
  fallbackDesc: string
  icon: string
  items: SidebarMenuItemDef[]
}

/** Módulos da sidebar com sub-itens configuráveis no Administrador. */
export const SIDEBAR_MENU_MODULES: SidebarMenuModuleDef[] = [
  {
    id: 'gestao-tecnica',
    titleKey: 'gestaoTecnicaTitle',
    fallbackTitle: 'Gestão Técnica',
    descKey: 'adminUsersModuleGestaoTecnicaDesc',
    fallbackDesc: 'Escolha quais opções aparecem dentro de Gestão Técnica.',
    icon: '🔧',
    items: [
      { buttonId: 'gestores-default', action: 'open-gestores', labelKey: 'gestoresTitle', fallbackLabel: 'Gestores', legacyKey: 'gestores' },
      { buttonId: 'agenda-default', action: 'open-agenda', labelKey: 'agendaTitle', fallbackLabel: 'Agenda', legacyKey: 'agenda' },
      { buttonId: 'diario-pedidos-dia-default', action: 'open-diario-pedidos-dia', labelKey: 'diarioPedidosTitle', fallbackLabel: 'Diário de pedidos', legacyKey: 'agenda' },
      { buttonId: 'estado-visual-tecnico-default', action: 'open-estado-visual-tecnico', labelKey: 'estadoVisualTecnico', fallbackLabel: 'Estado visual do técnico', legacyKey: 'gestores' },
      { buttonId: 'informacoes-conhecimento-tecnicos-default', action: 'open-informacoes-conhecimento-tecnicos', labelKey: 'informacoesConhecimentoTecnicosTitle', fallbackLabel: 'Conhecimento dos técnicos', legacyKey: 'gestores' },
      { buttonId: 'cadastro-servicos-default', action: 'open-cadastro-servicos', labelKey: 'cadastroServicosTitle', fallbackLabel: 'Cadastro de serviços', legacyKey: 'cadastroServicos' },
    ],
  },
  {
    id: 'parceiros-comercial',
    titleKey: 'parceirosComercialTitle',
    fallbackTitle: 'Clientes e Fornecedores',
    descKey: 'adminUsersModuleParceirosDesc',
    fallbackDesc: 'Itens visíveis em Clientes e Fornecedores.',
    icon: '🤝',
    items: [
      { buttonId: 'clientes-default', action: 'open-clientes', labelKey: 'clientesTitle', fallbackLabel: 'Clientes', legacyKey: 'clientes' },
      { buttonId: 'fornecedores-default', action: 'open-fornecedores', labelKey: 'fornecedoresTitle', fallbackLabel: 'Fornecedores', legacyKey: 'fornecedores' },
    ],
  },
  {
    id: 'documentacao-relatorios',
    titleKey: 'documentacaoRelatoriosTitle',
    fallbackTitle: 'Documentação e Relatórios',
    descKey: 'adminUsersModuleDocumentacaoDesc',
    fallbackDesc: 'Relatórios e documentação visíveis.',
    icon: '📋',
    items: [
      { buttonId: 'relatorio-servico-default', action: 'open-relatorio-servico', labelKey: 'relatorioServicoTitle', fallbackLabel: 'Relatório de serviço', legacyKey: 'relatorioServico' },
      { buttonId: 'biblioteca-relatorios-default', action: 'open-biblioteca-relatorios', labelKey: 'bibliotecaRelatoriosTitle', fallbackLabel: 'Biblioteca de relatórios', legacyKey: 'relatorioServico' },
      { buttonId: 'relatorios-excluidos-clientes-default', action: 'open-relatorios-excluidos-clientes', labelKey: 'relatoriosExcluidosClientesTitle', fallbackLabel: 'Relatórios excluídos', legacyKey: 'clientes' },
      { buttonId: 'fechamento-relatorios-servicos-default', action: 'open-fechamento-relatorios-servicos', labelKey: 'fechamentoRelatoriosServicosTitle', fallbackLabel: 'Fechamento de relatórios', legacyKey: 'relatorioServico' },
      { buttonId: 'protocolos-servico-default', action: 'open-protocolos-servico', labelKey: 'protocolosServicoTitle', fallbackLabel: 'Protocolos de serviço', legacyKey: 'relatorioServico' },
      { buttonId: 'manual-programa-default', action: 'open-manual-programa', labelKey: 'manualProgramaTitle', fallbackLabel: 'Manual do Programa', legacyKey: 'extras' },
    ],
  },
  {
    id: 'pecas-biblioteca',
    titleKey: 'pecasBibliotecaTitle',
    fallbackTitle: 'Peças e Biblioteca',
    descKey: 'adminUsersModulePecasDesc',
    fallbackDesc: 'Peças e biblioteca visíveis.',
    icon: '📚',
    items: [
      { buttonId: 'biblioteca-pecas-default', action: 'open-biblioteca-pecas', labelKey: 'cadastroPecasBibliotecaTitle', fallbackLabel: 'Biblioteca de peças', legacyKey: 'bibliotecaPecas' },
      { buttonId: 'importacao-pecas-default', action: 'open-importacao-pecas', labelKey: 'importacaoPecas', fallbackLabel: 'Importação de peças', legacyKey: 'bibliotecaPecas' },
    ],
  },
  {
    id: 'gestao-custos',
    titleKey: 'gestaoCustosTitle',
    fallbackTitle: 'Gestão de Custos',
    descKey: 'adminUsersModuleCustosDesc',
    fallbackDesc: 'Orçamentos e custos visíveis.',
    icon: '💶',
    items: [
      { buttonId: 'orcamentos-avulso-default', action: 'open-orcamentos-avulso', labelKey: 'orcamentosAvulsoTitle', fallbackLabel: 'Orçamentos avulso', legacyKey: 'cadastroServicos' },
      { buttonId: 'orcamento-servico-tecnico-default', action: 'open-orcamento-servico-tecnico', labelKey: 'orcamentoServicoTecnicoTitle', fallbackLabel: 'Orçamento serviço técnico', legacyKey: 'cadastroServicos' },
      { buttonId: 'orcamentos-pecas-especiais-default', action: 'open-orcamentos-pecas-especiais', labelKey: 'orcamentoPecasEspeciaisTitle', fallbackLabel: 'Orçamentos peças especiais', legacyKey: 'cadastroServicos' },
      { buttonId: 'pedido-orcamentos-avulso-default', action: 'open-pedido-orcamentos-avulso', labelKey: 'pedidoOrcamentosAvulsoTitle', fallbackLabel: 'Pedido de orçamentos', legacyKey: 'cadastroServicos' },
    ],
  },
  {
    id: 'gestao-industrial',
    titleKey: 'gestaoIndustrialTitle',
    fallbackTitle: 'Gestão Industrial',
    descKey: 'adminUsersModuleIndustrialDesc',
    fallbackDesc: 'Equipamentos e desmontados visíveis.',
    icon: '🏭',
    items: [
      { buttonId: 'equipamentos-default', action: 'open-equipamentos', labelKey: 'equipamentosTitle', fallbackLabel: 'Equipamentos', legacyKey: 'equipamentos' },
      { buttonId: 'familias-grupos-equipamentos-default', action: 'open-familias-grupos-equipamentos', labelKey: 'familiasGruposEquipamentosTitle', fallbackLabel: 'Famílias e grupos', legacyKey: 'equipamentos' },
      { buttonId: 'desmontados-default', action: 'open-desmontados', labelKey: 'desmontadosTitle', fallbackLabel: 'Desmontados', legacyKey: 'desmontados' },
    ],
  },
  {
    id: 'checklist-group',
    titleKey: 'checklistGroupTitle',
    fallbackTitle: 'Gestão dos Checklist',
    descKey: 'adminUsersModuleChecklistDesc',
    fallbackDesc: 'Checklists visíveis.',
    icon: '✅',
    items: [
      { buttonId: 'checklist-group-default', action: 'open-checklist-hub', labelKey: 'checklistGroupTitle', fallbackLabel: 'Hub do checklist', legacyKey: 'extras' },
      { buttonId: 'pre-checklist-default', action: 'open-pre-checklist', labelKey: 'preChecklistSubTitle', fallbackLabel: 'Pré-checklist', legacyKey: 'extras' },
      { buttonId: 'checklist-basico-default', action: 'open-checklist-basico', labelKey: 'checklistBasicoSubTitle', fallbackLabel: 'Checklist básico', legacyKey: 'extras' },
      { buttonId: 'checklist-default', action: 'open-checklist', labelKey: 'checklistSubTitle', fallbackLabel: 'Checklist', legacyKey: 'extras' },
      { buttonId: 'gestao-grupos-checklist-default', action: 'open-gestao-grupos-checklist', labelKey: 'gestaoGruposChecklistTitle', fallbackLabel: 'Grupos checklist', legacyKey: 'extras' },
      { buttonId: 'ordem-preparacao-default', action: 'open-ordem-preparacao', labelKey: 'ordemPreparacaoTitle', fallbackLabel: 'Ordem de preparação', legacyKey: 'extras' },
      { buttonId: 'formularios-checklist-tecnicos-default', action: 'open-formularios-checklist-tecnicos', labelKey: 'formulariosChecklistTecnicosTitle', fallbackLabel: 'Formulários técnicos', legacyKey: 'extras' },
      { buttonId: 'verificacao-final-entrega-default', action: 'open-verificacao-final-entrega', labelKey: 'verificacaoFinalEntregaTitle', fallbackLabel: 'Verificação final', legacyKey: 'extras' },
      { buttonId: 'familias-grupos-default', action: 'open-familias-grupos', labelKey: 'familiasGruposTitle', fallbackLabel: 'Famílias e grupos (checklist)', legacyKey: 'extras' },
    ],
  },
  {
    id: 'comunicacao-interna',
    titleKey: 'comunicacaoInternaTitle',
    fallbackTitle: 'Comunicação Interna',
    descKey: 'adminUsersModuleComunicacaoDesc',
    fallbackDesc: 'Mensagens e alertas visíveis.',
    icon: '💬',
    items: [
      { buttonId: 'hub-comunicacao-default', action: 'open-hub-comunicacao', labelKey: 'hubComunicacao', fallbackLabel: 'Hub comunicação', legacyKey: 'extras' },
      { buttonId: 'mensagens-internas-default', action: 'open-mensagens-internas', labelKey: 'mensagensInternas', fallbackLabel: 'Mensagens internas', legacyKey: 'extras' },
      { buttonId: 'mensagens-internas-tecnicos-default', action: 'open-mensagens-internas-tecnicos', labelKey: 'mensagensInternasTecnicos', fallbackLabel: 'Mensagens técnicos', legacyKey: 'extras' },
      { buttonId: 'alerta-mensagens-default', action: 'open-alerta-mensagens', labelKey: 'alertaMensagens', fallbackLabel: 'Alertas', legacyKey: 'extras' },
    ],
  },
  {
    id: 'manuais-informacoes-tecnicas',
    titleKey: 'manuaisInformacoesTecnicasTitle',
    fallbackTitle: 'Manuais e Informações Técnicas',
    descKey: 'adminUsersModuleManuaisDesc',
    fallbackDesc: 'Manuais técnicos visíveis.',
    icon: '📖',
    items: [
      { buttonId: 'manuais-informacoes-tecnicas-default', action: 'open-manuais-informacoes-tecnicas', labelKey: 'manuaisInformacoesTecnicasTitle', fallbackLabel: 'Manuais e informações', legacyKey: 'equipamentos' },
    ],
  },
  {
    id: 'biblia-nonato-service',
    titleKey: 'bibliaNonatoServiceTitle',
    fallbackTitle: 'Bíblia da Nonato Service',
    descKey: 'adminUsersModuleBibliaDesc',
    fallbackDesc: 'Bíblia técnica visível.',
    icon: '📘',
    items: [
      { buttonId: 'biblia-nonato-service-default', action: 'open-biblia-nonato-service', labelKey: 'bibliaNonatoServiceTitle', fallbackLabel: 'Bíblia Nonato Service', legacyKey: 'equipamentos' },
    ],
  },
  {
    id: 'almoxarifado-armazem',
    titleKey: 'almoxarifadoArmazemTitle',
    fallbackTitle: 'Almoxarifado / Armazém',
    descKey: 'adminUsersModuleAlmoxarifadoDesc',
    fallbackDesc: 'Armazém visível.',
    icon: '📦',
    items: [
      { buttonId: 'almoxarifado-armazem-default', action: 'open-almoxarifado-armazem', labelKey: 'almoxarifadoArmazemTitle', fallbackLabel: 'Almoxarifado', legacyKey: 'extras' },
      { buttonId: 'mapa-visual-separacao-pecas-default', action: 'open-mapa-visual-separacao-pecas', labelKey: 'mapaVisualSeparacaoPecasTitle', fallbackLabel: 'Mapa visual separação', legacyKey: 'bibliotecaPecas' },
    ],
  },
  {
    id: 'gestao-financeira',
    titleKey: 'gestaoFinanceiraTitle',
    fallbackTitle: 'Gestão Financeira',
    descKey: 'adminUsersModuleFinanceiraDesc',
    fallbackDesc: 'Financeiro visível.',
    icon: '💰',
    items: [
      { buttonId: 'gestao-financeira-default', action: 'open-gestao-financeira', labelKey: 'gestaoFinanceiraTitle', fallbackLabel: 'Gestão financeira (painel)', legacyKey: 'extras' },
      { buttonId: 'clientes-financeiro-default', action: 'open-clientes-financeiro', labelKey: 'clientesFinanceiroTitle', fallbackLabel: 'Clientes financeiro', legacyKey: 'extras' },
      { buttonId: 'comprovantes-despesas-default', action: 'open-comprovantes-despesas', labelKey: 'comprovantesDespesasTitle', fallbackLabel: 'Comprovantes despesas', legacyKey: 'extras' },
      { buttonId: 'registro-despesas-default', action: 'open-registro-despesas', labelKey: 'registroDespesasTitle', fallbackLabel: 'Registo despesas', legacyKey: 'cadastroServicos' },
      { buttonId: 'pagamentos-contador-default', action: 'open-pagamentos-contador', labelKey: 'pagamentosContadorTitle', fallbackLabel: 'Pagamentos contador', legacyKey: 'cadastroServicos' },
    ],
  },
  {
    id: 'empresa-institucional',
    titleKey: 'empresaInstitucionalTitle',
    fallbackTitle: 'Empresa & Registos Oficiais',
    descKey: 'adminUsersModuleEmpresaDesc',
    fallbackDesc: 'Registos oficiais visíveis.',
    icon: '🏢',
    items: [
      { buttonId: 'cadastro-nonato-service-default', action: 'open-cadastro-nonato-service', labelKey: 'cadastroNonatoServiceTitle', fallbackLabel: 'Cadastro Nonato Service', legacyKey: 'extras' },
      { buttonId: 'ficha-pagamento-transferencia-default', action: 'open-ficha-pagamento-transferencia', labelKey: 'fichaPagamentoTransferenciaTitle', fallbackLabel: 'Ficha pagamento', legacyKey: 'extras' },
      { buttonId: 'ficha-fatura-cliente-default', action: 'open-ficha-fatura-cliente', labelKey: 'fichaFaturaClienteTitle', fallbackLabel: 'Ficha fatura cliente', legacyKey: 'extras' },
      { buttonId: 'solicitacao-servico-tecnico-default', action: 'open-solicitacao-servico-tecnico', labelKey: 'solicitacaoServicoTecnicoTitle', fallbackLabel: 'Solicitação serviço', legacyKey: 'agenda' },
    ],
  },
  {
    id: 'outros',
    titleKey: 'administrador',
    fallbackTitle: 'Administrador e Extras',
    descKey: 'adminUsersModuleOutrosDesc',
    fallbackDesc: 'Ferramentas avançadas visíveis.',
    icon: '⚙️',
    items: [
      { buttonId: 'administrador-default', action: 'open-administrador', labelKey: 'administrador', fallbackLabel: 'Administrador', legacyKey: 'extras' },
      { buttonId: 'extras-default', action: 'open-extra', labelKey: 'extras', fallbackLabel: 'Extras', legacyKey: 'extras' },
      { buttonId: 'manual-gestor-default', action: 'open-manual-gestor', labelKey: 'manualUsoGestorNonatoService', fallbackLabel: 'Manual do gestor', legacyKey: 'extras' },
      { buttonId: 'translator-default', action: 'open-translator', labelKey: 'translator', fallbackLabel: 'Tradutor', legacyKey: 'extras' },
    ],
  },
]

export const ALL_MENU_ITEM_IDS = SIDEBAR_MENU_MODULES.flatMap((m) => m.items.map((i) => i.buttonId))

const ACTION_TO_BUTTON_ID: Record<string, string> = Object.fromEntries(
  SIDEBAR_MENU_MODULES.flatMap((mod) => mod.items.map((item) => [item.action, item.buttonId]))
)

export function getMenuItemDef(buttonId: string): SidebarMenuItemDef | undefined {
  for (const mod of SIDEBAR_MENU_MODULES) {
    const item = mod.items.find((i) => i.buttonId === buttonId)
    if (item) return item
  }
  return undefined
}

export function getButtonIdForAction(action: string): string | undefined {
  return ACTION_TO_BUTTON_ID[action]
}

/** Detecta menu personalizado mesmo em gravações antigas sem a flag explícita. */
export function inferMenuItemsConfigured(
  menuItems?: Record<string, boolean | undefined>,
  menuItemsConfigured?: boolean
): boolean {
  if (menuItemsConfigured) return true
  if (!menuItems || typeof menuItems !== 'object') return false
  const keys = Object.keys(menuItems)
  if (keys.length === 0) return false
  if (keys.some((k) => menuItems[k] === false)) return true
  const knownCount = keys.filter((k) => ALL_MENU_ITEM_IDS.includes(k)).length
  return knownCount >= 2
}

/** Utilizador com menu personalizado gravado (modo estrito). */
export function hasStrictMenuPolicy(
  menuItems?: Record<string, boolean | undefined>,
  menuItemsConfigured?: boolean
): boolean {
  return inferMenuItemsConfigured(menuItems, menuItemsConfigured)
}

/** Normaliza política de menu ao carregar/gravar utilizadores não-admin. */
export function ensureUserMenuPolicy<
  T extends {
    menuItems?: Record<string, boolean | undefined>
    menuItemsConfigured?: boolean
    isAdmin?: boolean
    permissions?: UserFormState['permissions']
  }
>(user: T): T {
  if (user.isAdmin) return user
  const configured = inferMenuItemsConfigured(user.menuItems, user.menuItemsConfigured)
  if (!configured) return user
  const menuItems =
    user.permissions != null
      ? normalizeMenuItemsWithLegacyFallback(user.menuItems, user.permissions)
      : normalizeMenuItems(user.menuItems)
  return {
    ...user,
    menuItemsConfigured: true,
    menuItems,
  }
}

/** Garante todas as chaves conhecidas — ausentes ficam desligados. */
export function normalizeMenuItems(partial?: Record<string, boolean | undefined>): Record<string, boolean> {
  const items: Record<string, boolean> = {}
  for (const id of ALL_MENU_ITEM_IDS) {
    items[id] = Boolean(partial?.[id])
  }
  return items
}

/**
 * Preserva escolhas explícitas do administrador; chaves novas (ex.: peças especiais)
 * herdam permissões legadas em vez de ficarem ocultas para utilizadores antigos.
 */
export function normalizeMenuItemsWithLegacyFallback(
  partial: Record<string, boolean | undefined> | undefined,
  permissions: UserFormState['permissions']
): Record<string, boolean> {
  const legacyDefaults = buildMenuItemsFromLegacyPermissions(permissions, partial)
  const items: Record<string, boolean> = {}
  for (const id of ALL_MENU_ITEM_IDS) {
    if (partial && Object.prototype.hasOwnProperty.call(partial, id)) {
      items[id] = Boolean(partial[id])
    } else {
      items[id] = Boolean(legacyDefaults[id])
    }
  }
  return items
}

/** Constrói menuItems a partir das permissões legadas (utilizadores antigos). */
export function buildMenuItemsFromLegacyPermissions(
  permissions: UserFormState['permissions'],
  savedMenuItems?: Record<string, boolean | undefined>
): Record<string, boolean> {
  const saved = savedMenuItems || {}
  const items: Record<string, boolean> = {}

  for (const mod of SIDEBAR_MENU_MODULES) {
    for (const item of mod.items) {
      if (saved[item.buttonId] !== undefined) {
        items[item.buttonId] = Boolean(saved[item.buttonId])
        continue
      }
      if (item.legacyKey) {
        items[item.buttonId] = Boolean(permissions[item.legacyKey])
      } else {
        items[item.buttonId] = false
      }
    }
  }
  return items
}

/** Sincroniza flags legadas a partir dos itens do menu (gravação). */
export function syncLegacyPermissionsFromMenuItems(
  menuItems: Record<string, boolean>,
  base: UserFormState['permissions']
): UserFormState['permissions'] {
  const next = { ...base }

  for (const key of USER_PERMISSION_KEYS) {
    const mapped = SIDEBAR_MENU_MODULES.flatMap((m) => m.items).filter((i) => i.legacyKey === key)
    if (mapped.length > 0) {
      next[key] = mapped.some((i) => Boolean(menuItems[i.buttonId]))
    }
  }

  return next
}

export function setModuleMenuItems(
  menuItems: Record<string, boolean>,
  module: SidebarMenuModuleDef,
  enabled: boolean
): Record<string, boolean> {
  const next = { ...menuItems }
  module.items.forEach((item) => {
    next[item.buttonId] = enabled
  })
  return next
}

export function countModuleActiveItems(
  menuItems: Record<string, boolean>,
  module: SidebarMenuModuleDef
): number {
  return module.items.filter((i) => menuItems[i.buttonId]).length
}

export type LegacyAccessCheck = (action: string) => boolean

/** Verifica se um botão da sidebar deve aparecer para o utilizador. */
export function canAccessSidebarMenuItem(
  menuItems: Record<string, boolean | undefined> | undefined,
  isAdmin: boolean | undefined,
  buttonId: string,
  action: string,
  legacyAccess: LegacyAccessCheck,
  menuItemsConfigured?: boolean
): boolean {
  if (isAdmin) return true

  if (hasStrictMenuPolicy(menuItems, menuItemsConfigured)) {
    return Boolean(menuItems?.[buttonId])
  }

  const def = getMenuItemDef(buttonId)
  if (def) {
    if (menuItems && Object.prototype.hasOwnProperty.call(menuItems, buttonId)) {
      return Boolean(menuItems[buttonId])
    }
    if (def.legacyKey) return legacyAccess(action)
    return legacyAccess(action)
  }

  return legacyAccess(action)
}

/** Verifica se algum item de um módulo está activo (para ocultar cabeçalhos da sidebar). */
export function canAccessSidebarModule(
  menuItems: Record<string, boolean | undefined> | undefined,
  isAdmin: boolean | undefined,
  moduleId: SidebarGroup,
  legacyAccess: LegacyAccessCheck,
  menuItemsConfigured?: boolean
): boolean {
  if (isAdmin) return true
  const mod = SIDEBAR_MENU_MODULES.find((m) => m.id === moduleId)
  if (!mod) return false
  return mod.items.some((item) =>
    canAccessSidebarMenuItem(menuItems, isAdmin, item.buttonId, item.action, legacyAccess, menuItemsConfigured)
  )
}
