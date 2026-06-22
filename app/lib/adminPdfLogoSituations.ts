export type PdfLogoSituationId =
  | 'relatorios'
  | 'fechamentos'
  | 'orcamentoPecas'
  | 'orcamentoServico'
  | 'documentos'
  | 'protocolos'
  | 'checklist'
  | 'preChecklist'

export type PdfLogoSituationDef = {
  id: PdfLogoSituationId
  badge: string
  icon: string
  titleKey: string
  titleFallback: string
  descKey: string
  descFallback: string
  storageKey: string
  includeToggle?: 'relatorios' | 'fechamentos'
}

export const PDF_LOGO_SITUATIONS: PdfLogoSituationDef[] = [
  {
    id: 'relatorios',
    badge: '01',
    icon: '📋',
    titleKey: 'escolherLogoRelatorios',
    titleFallback: 'Relatórios de serviço',
    descKey: 'escolherLogoRelatoriosDesc',
    descFallback: 'Cabeçalho dos relatórios de assistência técnica exportados em PDF.',
    storageKey: 'nonato-relatorios-logo-id',
    includeToggle: 'relatorios',
  },
  {
    id: 'fechamentos',
    badge: '02',
    icon: '💶',
    titleKey: 'escolherLogoFechamentos',
    titleFallback: 'Relatórios de despesas',
    descKey: 'escolherLogoFechamentosDesc',
    descFallback: 'PDF de fechamento e relatórios de despesas dos serviços.',
    storageKey: 'nonato-fechamentos-logo-id',
    includeToggle: 'fechamentos',
  },
  {
    id: 'orcamentoPecas',
    badge: '03',
    icon: '🔩',
    titleKey: 'escolherLogoOrcamentoPecas',
    titleFallback: 'Orçamento de peças',
    descKey: 'escolherLogoOrcamentoPecasDesc',
    descFallback: 'Orçamentos avulsos, pedidos de peças e propostas com linhas da biblioteca.',
    storageKey: 'nonato-orcamento-pecas-logo-id',
  },
  {
    id: 'orcamentoServico',
    badge: '04',
    icon: '🛠️',
    titleKey: 'escolherLogoOrcamentoServico',
    titleFallback: 'Orçamento de serviço',
    descKey: 'escolherLogoOrcamentoServicoDesc',
    descFallback: 'Propostas de serviço técnico em papel timbrado (horas, km, diárias, etc.).',
    storageKey: 'nonato-orcamento-servico-logo-id',
  },
  {
    id: 'documentos',
    badge: '05',
    icon: '📑',
    titleKey: 'escolherLogoDocumentos',
    titleFallback: 'Documentos',
    descKey: 'escolherLogoDocumentosDesc',
    descFallback: 'Solicitações de serviço técnico e outros documentos PDF gerados pelo sistema.',
    storageKey: 'nonato-documentos-logo-id',
  },
  {
    id: 'protocolos',
    badge: '06',
    icon: '📄',
    titleKey: 'escolherLogoProtocoloServico',
    titleFallback: 'Protocolos de serviço',
    descKey: 'escolherLogoProtocoloServicoDesc',
    descFallback: 'Cabeçalho dos protocolos de intervenção com blocos, fotos e peças.',
    storageKey: 'nonato-protocolo-servico-logo-id',
  },
  {
    id: 'checklist',
    badge: '07',
    icon: '✅',
    titleKey: 'escolherLogoChecklist',
    titleFallback: 'Checklist',
    descKey: 'escolherLogoChecklistDesc',
    descFallback: 'Formulários e checklists gerados para técnicos em campo.',
    storageKey: 'nonato-checklist-logo-id',
  },
  {
    id: 'preChecklist',
    badge: '08',
    icon: '📝',
    titleKey: 'escolherLogoPreChecklist',
    titleFallback: 'Pré-checklist',
    descKey: 'escolherLogoPreChecklistDesc',
    descFallback: 'Verificação pré-operacional antes da intervenção técnica.',
    storageKey: 'nonato-pre-checklist-logo-id',
  },
]

export const PDF_LOGO_SITUATION_STORAGE_KEYS = PDF_LOGO_SITUATIONS.map((s) => s.storageKey)

/** Chaves antigas usadas antes da separação por tipo de documento. */
export const PDF_LOGO_LEGACY_STORAGE_KEYS: Partial<Record<PdfLogoSituationId, string>> = {
  orcamentoPecas: 'nonato-orcamento-logo-id',
  orcamentoServico: 'nonato-orcamento-logo-id',
  documentos: 'nonato-protocolo-servico-logo-id',
}

export function buildEmptyPdfLogoSelection(): Record<PdfLogoSituationId, string> {
  return Object.fromEntries(PDF_LOGO_SITUATIONS.map((s) => [s.id, ''])) as Record<PdfLogoSituationId, string>
}
