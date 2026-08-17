/** Intro de módulo, accent da barra inferior e conteúdo Help por TabType. */

import type { TabType } from './tipos'
import { pickTrChain } from './hub'

/** Chaves de tradução (por ordem) para o texto de intro de cada módulo. */
export const TAB_MODULE_INTRO_KEYS: Partial<Record<TabType, readonly string[]>> = {
  gestores: ['gestoresSubtitle'],
  equipamentos: ['equipamentosSubtitle'],
  clientes: ['clientesSubtitle'],
  fornecedores: ['fornecedoresSubtitle'],
  'relatorio-servico': ['relatorioServicoSubtitle'],
  'biblioteca-pecas': ['quickAccessBibliotecaPecasDesc'],
  'solicitacao-servico-tecnico': ['solicitacaoServicoTecnicoSubtitle'],
  desmontados: ['desmontadosSubtitle'],
  'cadastro-servicos': ['cadastroServicosSubtitle'],
  'gestao-custos': ['quickAccessGestaoCustosDesc'],
  'orcamento-servico-tecnico': ['orcamentoServicoTecnicoSubtitle'],
  'biblioteca-relatorios': ['quickAccessBibliotecaRelatoriosDesc'],
  'gestao-financeira': ['gestaoFinanceiraDesc'],
  'manuais-informacoes-tecnicas': ['manuaisInformacoesTecnicasDesc', 'manuaisInformacoesTecnicasConteudo'],
  'biblia-nonato-service': ['bibliaNonatoServiceDesc', 'bibliaNonatoQuickDesc'],
  'almoxarifado-armazem': ['almoxarifadoArmazemDesc'],
  'hub-comunicacao': ['hubComunicacaoDesc'],
  'protocolos-servico': ['protocolosServicoDesc'],
  'manual-programa': ['manualProgramaSubtitle'],
  'cadastro-nonato-service': ['cadastroNonatoServiceSubtitle', 'cadastroNonatoServiceInfo'],
  'ficha-pagamento-transferencia': ['fichaPagamentoTransferenciaSubtitle'],
  'ficha-fatura-cliente': ['fichaFaturaClienteSubtitle'],
  translator: ['quickAccessTranslatorDesc'],
  'checklist-hub': ['quickAccessChecklistHubDesc'],
  agenda: ['quickAccessAgendaDesc'],
  'diario-pedidos-dia': ['diarioPedidosHubCardDesc'],
  'estado-visual-tecnico': ['estadoVisualHubCardDesc'],
  'relatorios-excluidos-clientes': ['relatoriosExcluidosClientesDesc'],
  'fechamento-relatorios-servicos': ['fechamentoRelatoriosServicosDesc'],
  'orcamentos-avulso': ['orcamentosAvulsoHubCardDesc'],
  'pedido-orcamentos-avulso': ['pedidoOrcamentosAvulsoHubCardDesc'],
  'orcamentos-pecas-especiais': ['orcamentoPecasEspeciaisHubCardDesc'],
  'registro-despesas': ['registroDespesasDesc'],
  'mapa-visual-separacao-pecas': ['mapaVisualSeparacaoPecasHubCardDesc'],
  'clientes-financeiro': ['clientesFinanceiroHubCardDesc'],
  'comprovantes-despesas': ['comprovantesDespesasDesc'],
  'pagamentos-contador': ['pagamentosContadorDesc'],
  'mensagens-internas': ['mensagensInternasHubCardDesc'],
  'mensagens-internas-tecnicos': ['mensagensInternasTecnicosHubCardDesc'],
  'alerta-mensagens': ['alertaMensagensDesc'],
  'gestao-grupos-checklist': ['gestaoGruposChecklistDesc'],
  'ordem-preparacao': ['ordemPreparacaoDesc'],
  'formularios-checklist-tecnicos': ['formulariosChecklistTecnicosDesc'],
  'verificacao-final-entrega': ['verificacaoFinalEntregaDesc'],
  'gestao-demos': ['adminJumpDemosDesc'],
  'familias-grupos': ['familiasGruposDesc'],
  'familias-grupos-equipamentos': ['familiasGruposEquipamentosHubCardDesc'],
  'pre-checklist': ['preChecklistDesc'],
  checklist: ['checklistDesc'],
  'checklist-basico': ['checklistBasicoDesc'],
  administrador: ['administradorGeralDesc'],
  'informacoes-conhecimento-tecnicos': ['informacoesConhecimentoTecnicosDesc'],
}

const BOTTOM_TAB_ACCENT_FINANCE: readonly TabType[] = [
  'gestao-financeira',
  'clientes-financeiro',
  'comprovantes-despesas',
  'orcamentos-avulso',
  'pedido-orcamentos-avulso',
  'orcamentos-pecas-especiais',
  'orcamento-servico-tecnico',
  'registro-despesas',
  'pagamentos-contador',
]

const BOTTOM_TAB_ACCENT_CHECK: readonly TabType[] = [
  'pre-checklist',
  'checklist',
  'checklist-hub',
  'gestao-grupos-checklist',
]

export function getTabModuleIntroText(
  type: TabType,
  tr: Record<string, string | undefined>
): string {
  const keys = TAB_MODULE_INTRO_KEYS[type]
  const txt = keys ? pickTrChain(tr, keys) : ''
  if (txt) return txt
  return pickTrChain(tr, ['mainModuleIntroFallback'])
}

export function getBottomTabAccentClass(type: TabType): string {
  if (BOTTOM_TAB_ACCENT_FINANCE.includes(type)) return 'bottom-tab-item--accent-finance'
  if (type === 'alerta-mensagens') return 'bottom-tab-item--accent-alert'
  if (BOTTOM_TAB_ACCENT_CHECK.includes(type)) return 'bottom-tab-item--accent-check'
  return ''
}

/** Chave de tradução Help da secção (ex.: equipamentos → helpEquipamentos). */
export function getHelpKey(type: TabType): string {
  return 'help' + type.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('')
}

export function getHelpContent(
  type: TabType,
  tr: Record<string, string | undefined>
): string {
  const key = getHelpKey(type)
  const text = tr[key]
  return (
    text ||
    tr.helpDefault ||
    'Consulte o manual do sistema para mais informações sobre esta secção.'
  )
}
