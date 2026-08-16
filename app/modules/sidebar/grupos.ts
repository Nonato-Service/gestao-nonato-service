import { SIDEBAR_GROUP_LAUNCHER_IDS } from './constantes'
import type { SidebarButton, SidebarGroup } from './tipos'

export function getDefaultSidebarGroup(buttonId: string): SidebarGroup {
  if ([
    'gestores-default',
    'cadastro-servicos-default',
    'agenda-default',
    'diario-pedidos-dia-default',
    'estado-visual-tecnico-default',
    'informacoes-conhecimento-tecnicos-default',
  ].includes(buttonId)) return 'gestao-tecnica'

  if (['clientes-default', 'fornecedores-default'].includes(buttonId)) return 'parceiros-comercial'

  if (
    [
      'relatorio-servico-default',
      'relatorio-especial-default',
      'biblioteca-relatorios-default',
      'relatorios-excluidos-clientes-default',
      'fechamento-relatorios-servicos-default',
    ].includes(buttonId)
  ) {
    return 'documentacao-relatorios'
  }

  if (buttonId === 'biblioteca-pecas-default') {
    return 'pecas-biblioteca'
  }

  if ([
    'orcamentos-avulso-default',
    'orcamento-servico-tecnico-default',
    'orcamentos-pecas-especiais-default',
    'pedido-orcamentos-avulso-default',
  ].includes(buttonId)) return 'gestao-custos'

  if (['registro-despesas-default', 'pagamentos-contador-default'].includes(buttonId)) return 'gestao-financeira'

  if (['mapa-visual-separacao-pecas-default'].includes(buttonId)) return 'almoxarifado-armazem'

  if ([
    'equipamentos-default',
    'desmontados-default',
    'familias-grupos-equipamentos-default',
  ].includes(buttonId)) return 'gestao-industrial'

  if ([
    'pre-checklist-default',
    'checklist-basico-default',
    'checklist-default',
    'gestao-grupos-checklist-default',
    'ordem-preparacao-default',
    'formularios-checklist-tecnicos-default',
    'verificacao-final-entrega-default',
    'familias-grupos-default',
  ].includes(buttonId)) return 'checklist-group'

  if (['clientes-financeiro-default'].includes(buttonId)) return 'gestao-financeira'
  if (['hub-comunicacao-default', 'mensagens-internas-default', 'mensagens-internas-tecnicos-default', 'alerta-mensagens-default'].includes(buttonId)) return 'comunicacao-interna'
  if (['manuais-informacoes-tecnicas-default'].includes(buttonId)) return 'manuais-informacoes-tecnicas'
  if (['biblia-nonato-service-default'].includes(buttonId)) return 'biblia-nonato-service'
  if (['almoxarifado-armazem-default'].includes(buttonId)) return 'almoxarifado-armazem'
  if (
    [
      'cadastro-nonato-service-default',
      'ficha-pagamento-transferencia-default',
      'ficha-fatura-cliente-default',
      'solicitacao-servico-tecnico-default',
    ].includes(buttonId)
  ) {
    return 'empresa-institucional'
  }
  return 'outros'
}

export function isSidebarButtonLocked(button: SidebarButton): boolean {
  return SIDEBAR_GROUP_LAUNCHER_IDS.has(button.id)
}

export function sidebarGroupChevronClass(isExpanded: boolean): string {
  return `sidebar-nav-chevron${isExpanded ? ' sidebar-nav-chevron--expanded' : ''}`
}

/** Subsecções fixas dentro da Gestão Financeira (sidebar e hub) — botões desconhecidos ficam em «outros». */
export function getGestaoFinanceiraUiSubgroup(buttonId: string): 'clientes' | 'despesas' | 'outros' {
  if (buttonId === 'clientes-financeiro-default') return 'clientes'
  if (
    buttonId === 'registro-despesas-default' ||
    buttonId === 'comprovantes-despesas-default' ||
    buttonId === 'pagamentos-contador-default'
  )
    return 'despesas'
  return 'outros'
}
