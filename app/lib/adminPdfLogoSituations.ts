export type PdfLogoSituationId = 'relatorios' | 'fechamentos' | 'orcamentos' | 'protocolos'

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
    id: 'orcamentos',
    badge: '03',
    icon: '🧾',
    titleKey: 'escolherLogoOrcamento',
    titleFallback: 'Orçamentos',
    descKey: 'escolherLogoOrcamentoDesc',
    descFallback: 'Cabeçalho dos orçamentos e propostas comerciais em PDF.',
    storageKey: 'nonato-orcamento-logo-id',
  },
  {
    id: 'protocolos',
    badge: '04',
    icon: '📄',
    titleKey: 'escolherLogoProtocoloServico',
    titleFallback: 'Documentos e protocolos',
    descKey: 'escolherLogoProtocoloServicoDesc',
    descFallback: 'Protocolos de serviço e outros documentos PDF gerados pelo sistema.',
    storageKey: 'nonato-protocolo-servico-logo-id',
  },
]

export const PDF_LOGO_SITUATION_STORAGE_KEYS = PDF_LOGO_SITUATIONS.map((s) => s.storageKey)
