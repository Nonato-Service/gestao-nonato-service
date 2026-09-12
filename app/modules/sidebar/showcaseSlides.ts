/** Slides da vitrine do dashboard — defs + mapeamento de cópia, sem I/O. */

import type { VisualId } from './showcaseVisual'

export type ShowcaseSlide = {
  id: VisualId
  title: string
  desc: string
  chip: string
  icon: string
  accent: string
  highlight: string
}

type ShowcaseSlideDef = {
  id: VisualId
  icon: string
  accent: string
  titleKey: string
  titleFallback: string
  descKey: string
  descFallback: string
  chipKey: string
  chipFallback: string
  highlightKey: string
  highlightFallback: string
}

export const SHOWCASE_SLIDE_DEFS: readonly ShowcaseSlideDef[] = [
  {
    id: 'reports',
    icon: '📋',
    accent: '#34d399',
    titleKey: 'dashboardShowcaseSlide1Title',
    titleFallback: 'Relatórios de serviço',
    descKey: 'dashboardShowcaseSlide1Desc',
    descFallback:
      'Protocolos visuais, peças utilizadas, PDF profissional e envio ao cliente — tudo num fluxo claro.',
    chipKey: 'dashboardShowcaseChipReports',
    chipFallback: 'Relatórios',
    highlightKey: 'dashboardShowcaseSlide1Highlight',
    highlightFallback: 'PDF e envio automático',
  },
  {
    id: 'clients',
    icon: '👥',
    accent: '#38bdf8',
    titleKey: 'dashboardShowcaseSlide2Title',
    titleFallback: 'Clientes e equipamentos',
    descKey: 'dashboardShowcaseSlide2Desc',
    descFallback: 'Cadastro completo, histórico por cliente, IDs de equipamento e rastreio em tempo real.',
    chipKey: 'dashboardShowcaseChipClients',
    chipFallback: 'Clientes',
    highlightKey: 'dashboardShowcaseSlide2Highlight',
    highlightFallback: 'Histórico e equipamentos',
  },
  {
    id: 'parts',
    icon: '🔧',
    accent: '#fbbf24',
    titleKey: 'dashboardShowcaseSlide3Title',
    titleFallback: 'Biblioteca de peças',
    descKey: 'dashboardShowcaseSlide3Desc',
    descFallback: 'Catálogo organizado, importação por URL, numeração inteligente e imagens ampliadas.',
    chipKey: 'dashboardShowcaseChipParts',
    chipFallback: 'Peças',
    highlightKey: 'dashboardShowcaseSlide3Highlight',
    highlightFallback: 'Stock e catálogo visual',
  },
  {
    id: 'knowledge',
    icon: '📚',
    accent: '#a78bfa',
    titleKey: 'dashboardShowcaseSlide4Title',
    titleFallback: 'Centro de conhecimento técnico',
    descKey: 'dashboardShowcaseSlide4Desc',
    descFallback: 'Bíblia, manuais, PDFs e fichas técnicas unificados por família, marca e modelo.',
    chipKey: 'dashboardShowcaseChipKnowledge',
    chipFallback: 'Conhecimento',
    highlightKey: 'dashboardShowcaseSlide4Highlight',
    highlightFallback: 'Bíblia e manuais técnicos',
  },
  {
    id: 'warehouse',
    icon: '🏭',
    accent: '#fb7185',
    titleKey: 'dashboardShowcaseSlide5Title',
    titleFallback: 'Armazém e industrial',
    descKey: 'dashboardShowcaseSlide5Desc',
    descFallback: 'Stock, separação de peças, ordens de preparação e almoxarifado ligados à operação.',
    chipKey: 'dashboardShowcaseChipWarehouse',
    chipFallback: 'Armazém',
    highlightKey: 'dashboardShowcaseSlide5Highlight',
    highlightFallback: 'Separação e stock',
  },
  {
    id: 'finance',
    icon: '💬',
    accent: '#2dd4bf',
    titleKey: 'dashboardShowcaseSlide6Title',
    titleFallback: 'Finanças e comunicação',
    descKey: 'dashboardShowcaseSlide6Desc',
    descFallback: 'Orçamentos, custos, mensagens internas e fecho financeiro com transparência.',
    chipKey: 'dashboardShowcaseChipFinance',
    chipFallback: 'Finanças',
    highlightKey: 'dashboardShowcaseSlide6Highlight',
    highlightFallback: 'Orçamentos e mensagens',
  },
  {
    id: 'import',
    icon: '📥',
    accent: '#f97316',
    titleKey: 'dashboardShowcaseSlide7Title',
    titleFallback: 'Importação inteligente de catálogo',
    descKey: 'dashboardShowcaseSlide7Desc',
    descFallback:
      'Cole páginas de fornecedores, analise duplicados em vermelho e amarelo e importe só peças novas.',
    chipKey: 'dashboardShowcaseChipImport',
    chipFallback: 'Importação',
    highlightKey: 'dashboardShowcaseSlide7Highlight',
    highlightFallback: 'Análise vermelho / amarelo',
  },
  {
    id: 'schedule',
    icon: '📅',
    accent: '#818cf8',
    titleKey: 'dashboardShowcaseSlide8Title',
    titleFallback: 'Diário e agendamento',
    descKey: 'dashboardShowcaseSlide8Desc',
    descFallback: 'Pedidos de serviço, visitas técnicas e estados em tempo real — nada se perde na operação.',
    chipKey: 'dashboardShowcaseChipSchedule',
    chipFallback: 'Agenda',
    highlightKey: 'dashboardShowcaseSlide8Highlight',
    highlightFallback: 'OS e visitas agendadas',
  },
  {
    id: 'equipment',
    icon: '⚙️',
    accent: '#e879f9',
    titleKey: 'dashboardShowcaseSlide9Title',
    titleFallback: 'Equipamentos e carga',
    descKey: 'dashboardShowcaseSlide9Desc',
    descFallback: 'Sequência de volumes, etiquetas de armazém e rastreio da máquina até ao camião.',
    chipKey: 'dashboardShowcaseChipEquipment',
    chipFallback: 'Equipamentos',
    highlightKey: 'dashboardShowcaseSlide9Highlight',
    highlightFallback: 'Volumes T/3 · T/2 · T/1',
  },
  {
    id: 'sync',
    icon: '🔄',
    accent: '#22d3ee',
    titleKey: 'dashboardShowcaseSlide10Title',
    titleFallback: 'Sincronização em equipa',
    descKey: 'dashboardShowcaseSlide10Desc',
    descFallback: 'Escritório, campo e servidor alinhados — envie e carregue dados em todos os aparelhos.',
    chipKey: 'dashboardShowcaseChipSync',
    chipFallback: 'Sincronização',
    highlightKey: 'dashboardShowcaseSlide10Highlight',
    highlightFallback: 'Multi-dispositivo',
  },
]

function pickCopy(t: Record<string, string | undefined>, key: string, fallback: string): string {
  return t[key] || fallback
}

export function buildShowcaseSlides(t: Record<string, string | undefined>): ShowcaseSlide[] {
  return SHOWCASE_SLIDE_DEFS.map((d) => ({
    id: d.id,
    icon: d.icon,
    accent: d.accent,
    title: pickCopy(t, d.titleKey, d.titleFallback),
    desc: pickCopy(t, d.descKey, d.descFallback),
    chip: pickCopy(t, d.chipKey, d.chipFallback),
    highlight: pickCopy(t, d.highlightKey, d.highlightFallback),
  }))
}
