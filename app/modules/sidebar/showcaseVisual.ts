/** Vitrine do dashboard — ids e menu decorativo da sidebar (sem I/O). */

export type VisualId =
  | 'reports'
  | 'clients'
  | 'parts'
  | 'knowledge'
  | 'warehouse'
  | 'finance'
  | 'import'
  | 'schedule'
  | 'equipment'
  | 'sync'

export type ShowcaseMenuItem = { id: VisualId; icon: string; label: string }

export const SHOWCASE_MENU: ShowcaseMenuItem[] = [
  { id: 'reports', icon: '📋', label: 'Relatórios' },
  { id: 'clients', icon: '👥', label: 'Clientes' },
  { id: 'parts', icon: '🔧', label: 'Peças' },
  { id: 'knowledge', icon: '📚', label: 'Conhecimento' },
  { id: 'warehouse', icon: '🏭', label: 'Armazém' },
  { id: 'finance', icon: '💬', label: 'Finanças' },
  { id: 'import', icon: '📥', label: 'Importação' },
  { id: 'schedule', icon: '📅', label: 'Agenda' },
  { id: 'equipment', icon: '⚙️', label: 'Equipamentos' },
  { id: 'sync', icon: '🔄', label: 'Sincronização' },
]

export function showcaseNavItemClass(active: VisualId, id: VisualId): string {
  return `ns-showcase-screen__nav-item${id === active ? ' is-active' : ''}`
}
