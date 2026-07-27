/**
 * Ordem pedagógica do Manual do Programa — independente da ordem da sidebar.
 * Cada página aparece exactamente uma vez; prev/next e trilha seguem esta sequência.
 */
export type ManualReadingSectionDef = {
  id: string
  icon: string
  titleKey: string
  descKey: string
  fallbackTitle: string
  fallbackDesc: string
  pageIds: string[]
}

export const MANUAL_READING_SECTIONS: ManualReadingSectionDef[] = [
  {
    id: 'inicio',
    icon: '🚀',
    titleKey: 'manualSecaoInicio',
    descKey: 'manualSecaoInicioDesc',
    fallbackTitle: '1) Início rápido',
    fallbackDesc: 'Painel, idioma, permissões e ferramentas de administrador.',
    pageIds: ['dashboard', 'administrador-default', 'extras-default', 'translator-default'],
  },
  {
    id: 'cadastro',
    icon: '📋',
    titleKey: 'manualSecaoCadastro',
    descKey: 'manualSecaoCadastroDesc',
    fallbackTitle: '2) Cadastro base',
    fallbackDesc: 'Gestores, equipamentos, clientes, fornecedores e dados da empresa.',
    pageIds: [
      'gestores-default',
      'equipamentos-default',
      'familias-grupos-equipamentos-default',
      'desmontados-default',
      'clientes-default',
      'fornecedores-default',
      'cadastro-nonato-service-default',
      'cadastro-servicos-default',
    ],
  },
  {
    id: 'operacao',
    icon: '🔧',
    titleKey: 'manualSecaoOperacao',
    descKey: 'manualSecaoOperacaoDesc',
    fallbackTitle: '3) Operação técnica',
    fallbackDesc: 'Solicitações, relatórios, protocolos, agenda, checklist e fecho.',
    pageIds: [
      'solicitacao-servico-tecnico-default',
      'relatorio-servico-default',
      'biblioteca-relatorios-default',
      'protocolos-servico-default',
      'agenda-default',
      'diario-pedidos-dia-default',
      'estado-visual-tecnico-default',
      'informacoes-conhecimento-tecnicos-default',
      'checklist-group-default',
      'pre-checklist-default',
      'checklist-basico-default',
      'checklist-default',
      'gestao-grupos-checklist-default',
      'familias-grupos-default',
      'ordem-preparacao-default',
      'formularios-checklist-tecnicos-default',
      'verificacao-final-entrega-default',
      'fechamento-relatorios-servicos-default',
      'relatorios-excluidos-clientes-default',
    ],
  },
  {
    id: 'pecas',
    icon: '📦',
    titleKey: 'manualSecaoPecas',
    descKey: 'manualSecaoPecasDesc',
    fallbackTitle: '4) Peças e armazém',
    fallbackDesc: 'Biblioteca, importação e separação no armazém.',
    pageIds: [
      'biblioteca-pecas-default',
      'importacao-pecas-default',
      'almoxarifado-armazem-default',
      'mapa-visual-separacao-pecas-default',
    ],
  },
  {
    id: 'financeiro',
    icon: '💰',
    titleKey: 'manualSecaoFinanceiro',
    descKey: 'manualSecaoFinanceiroDesc',
    fallbackTitle: '5) Financeiro e custos',
    fallbackDesc: 'Orçamentos, despesas, comprovantes e fecho financeiro.',
    pageIds: [
      'orcamentos-avulso-default',
      'pedido-orcamentos-avulso-default',
      'orcamento-servico-tecnico-default',
      'orcamentos-pecas-especiais-default',
      'gestao-financeira-default',
      'clientes-financeiro-default',
      'comprovantes-despesas-default',
      'registro-despesas-default',
      'pagamentos-contador-default',
      'ficha-pagamento-transferencia-default',
      'ficha-fatura-cliente-default',
    ],
  },
  {
    id: 'ajuda',
    icon: '❓',
    titleKey: 'manualSecaoAjuda',
    descKey: 'manualSecaoAjudaDesc',
    fallbackTitle: '6) Ajuda, comunicação e referência',
    fallbackDesc: 'Mensagens internas, manuais técnicos, Bíblia e F1.',
    pageIds: [
      'hub-comunicacao-default',
      'mensagens-internas-default',
      'mensagens-internas-tecnicos-default',
      'alerta-mensagens-default',
      'manuais-informacoes-tecnicas-default',
      'biblia-nonato-service-default',
      'manual-gestor-default',
    ],
  },
]

export const MANUAL_READING_ORDER: string[] = MANUAL_READING_SECTIONS.flatMap((s) => s.pageIds)

const PAGE_TO_SECTION = new Map<string, ManualReadingSectionDef>()
for (const section of MANUAL_READING_SECTIONS) {
  for (const pageId of section.pageIds) {
    PAGE_TO_SECTION.set(pageId, section)
  }
}

const PAGE_ORDER_INDEX = new Map<string, number>()
MANUAL_READING_ORDER.forEach((id, idx) => PAGE_ORDER_INDEX.set(id, idx))

export function manualSectionForPage(pageId: string): ManualReadingSectionDef | undefined {
  return PAGE_TO_SECTION.get(pageId)
}

export function manualPageOrderIndex(pageId: string): number {
  const idx = PAGE_ORDER_INDEX.get(pageId)
  return idx === undefined ? -1 : idx
}

export function manualSectionPageIndex(pageId: string): { section: ManualReadingSectionDef; indexInSection: number } | null {
  const section = PAGE_TO_SECTION.get(pageId)
  if (!section) return null
  const indexInSection = section.pageIds.indexOf(pageId)
  if (indexInSection < 0) return null
  return { section, indexInSection }
}

export function manualFirstPageOfSection(sectionId: string): string | undefined {
  return MANUAL_READING_SECTIONS.find((s) => s.id === sectionId)?.pageIds[0]
}
