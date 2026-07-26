import type { ManualProgramaPageDef } from './manualProgramaCatalog'

export type ManualPreviewLayout =
  | 'dashboard'
  | 'agenda'
  | 'table'
  | 'checklist'
  | 'document'
  | 'catalog'
  | 'finance'
  | 'admin'
  | 'generic'

export type ManualPreviewAction = { label: string; variant?: 'primary' | 'ghost' | 'gold' | 'purple' }
export type ManualPreviewBlock = { type: 'row' | 'card' | 'filter' | 'stat'; width?: 'full' | 'short' | 'half' }

export type ManualPreviewConfig = {
  layout: ManualPreviewLayout
  actions: ManualPreviewAction[]
  blocks: ManualPreviewBlock[]
  heroSub?: string
}

const TAB_LAYOUT: Record<string, ManualPreviewLayout> = {
  agenda: 'agenda',
  clientes: 'table',
  fornecedores: 'table',
  gestores: 'table',
  equipamentos: 'catalog',
  'biblioteca-pecas': 'catalog',
  'relatorio-servico': 'document',
  'protocolos-servico': 'document',
  checklist: 'checklist',
  'checklist-hub': 'checklist',
  'pre-checklist': 'checklist',
  'gestao-financeira': 'finance',
  'clientes-financeiro': 'finance',
  administrador: 'admin',
}

export function previewLayoutForPage(page: ManualProgramaPageDef): ManualPreviewLayout {
  if (page.id === 'dashboard' || !page.tabType) return page.id === 'dashboard' ? 'dashboard' : 'generic'
  return TAB_LAYOUT[page.tabType] || 'generic'
}

export function previewConfigForPage(page: ManualProgramaPageDef, title: string): ManualPreviewConfig {
  const layout = previewLayoutForPage(page)

  switch (layout) {
    case 'dashboard':
      return {
        layout,
        heroSub: 'Atalhos e resumo',
        actions: [
          { label: '🏠 Página inicial', variant: 'ghost' },
          { label: '❓ F1 / HELP', variant: 'ghost' },
        ],
        blocks: [
          { type: 'stat', width: 'half' },
          { type: 'stat', width: 'half' },
          { type: 'card' },
          { type: 'card' },
          { type: 'row', width: 'full' },
        ],
      }
    case 'agenda':
      return {
        layout,
        heroSub: 'Agendamentos e situação operacional',
        actions: [
          { label: '➕ Novo agendamento', variant: 'primary' },
          { label: '📋 Lista', variant: 'primary' },
          { label: '📅 Calendário', variant: 'ghost' },
        ],
        blocks: [
          { type: 'filter' },
          { type: 'card' },
          { type: 'card' },
          { type: 'card', width: 'half' },
          { type: 'card', width: 'half' },
        ],
      }
    case 'table':
      return {
        layout,
        heroSub: title,
        actions: [
          { label: '➕ Novo registo', variant: 'primary' },
          { label: '🔍 Pesquisar', variant: 'ghost' },
          { label: '📄 Exportar', variant: 'ghost' },
        ],
        blocks: [
          { type: 'filter' },
          { type: 'row' },
          { type: 'row' },
          { type: 'row' },
          { type: 'row', width: 'short' },
        ],
      }
    case 'checklist':
      return {
        layout,
        heroSub: 'Execução técnica',
        actions: [
          { label: '▶ Iniciar', variant: 'primary' },
          { label: '📷 Fotos', variant: 'ghost' },
          { label: '✓ Concluir', variant: 'gold' },
        ],
        blocks: [
          { type: 'card' },
          { type: 'row' },
          { type: 'row' },
          { type: 'row', width: 'short' },
        ],
      }
    case 'document':
      return {
        layout,
        heroSub: 'Documento / relatório',
        actions: [
          { label: '💾 Guardar', variant: 'primary' },
          { label: '📄 PDF', variant: 'ghost' },
          { label: '📤 Partilhar', variant: 'ghost' },
        ],
        blocks: [
          { type: 'filter' },
          { type: 'card' },
          { type: 'row' },
          { type: 'row', width: 'short' },
        ],
      }
    case 'catalog':
      return {
        layout,
        heroSub: 'Catálogo e grupos',
        actions: [
          { label: '➕ Nova peça', variant: 'primary' },
          { label: '📥 Importar', variant: 'ghost' },
        ],
        blocks: [
          { type: 'filter' },
          { type: 'card', width: 'half' },
          { type: 'card', width: 'half' },
          { type: 'card', width: 'half' },
          { type: 'card', width: 'half' },
        ],
      }
    case 'finance':
      return {
        layout,
        heroSub: 'Controlo financeiro',
        actions: [
          { label: '💶 Registar', variant: 'primary' },
          { label: '📊 Resumo', variant: 'ghost' },
        ],
        blocks: [
          { type: 'stat', width: 'half' },
          { type: 'stat', width: 'half' },
          { type: 'row' },
          { type: 'row' },
        ],
      }
    case 'admin':
      return {
        layout,
        heroSub: 'Administração do sistema',
        actions: [
          { label: '👤 Utilizadores', variant: 'primary' },
          { label: '💾 Backup', variant: 'ghost' },
        ],
        blocks: [
          { type: 'card', width: 'half' },
          { type: 'card', width: 'half' },
          { type: 'card', width: 'half' },
          { type: 'card', width: 'half' },
        ],
      }
    default:
      return {
        layout: 'generic',
        heroSub: title,
        actions: [
          { label: '➕ Novo registo', variant: 'primary' },
          { label: '🔍 Pesquisar', variant: 'ghost' },
        ],
        blocks: [{ type: 'row' }, { type: 'row' }, { type: 'row', width: 'short' }],
      }
  }
}
