import { SIDEBAR_GROUPS } from './constantes'
import { getDefaultSidebarGroup, isSidebarButtonLocked } from './grupos'
import type { SidebarButton, SidebarGroup } from './tipos'

/** Substitui o botão legado «ficha-cadastral-default» por dois: transferência e fatura (cliente). */
export function migrateLegacyFichaCadastralSidebarButtons(buttons: SidebarButton[]): SidebarButton[] {
  if (!buttons.some((b) => b.id === 'ficha-cadastral-default')) return buttons
  return buttons.flatMap((b) => {
    if (b.id !== 'ficha-cadastral-default') return [b]
    const ord = typeof b.order === 'number' ? b.order : 20
    const grp = (b.group || 'empresa-institucional') as SidebarGroup
    return [
      {
        ...b,
        id: 'ficha-pagamento-transferencia-default',
        name: 'FICHA PARA TRANSFERÊNCIA / PAGAMENTO',
        action: 'open-ficha-pagamento-transferencia',
        order: ord,
        translationKey: 'fichaPagamentoTransferenciaTitle',
        group: grp,
        customName: false,
      },
      {
        ...b,
        id: 'ficha-fatura-cliente-default',
        name: 'FICHA PARA O CLIENTE EMITIR FATURA',
        action: 'open-ficha-fatura-cliente',
        order: ord + 1,
        translationKey: 'fichaFaturaClienteTitle',
        group: grp,
        customName: false,
      },
    ]
  })
}

export function normalizeSidebarButtons(buttons: SidebarButton[]): SidebarButton[] {
  const sorted = [...buttons].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const grouped = new Map<SidebarGroup, SidebarButton[]>()
  for (const group of SIDEBAR_GROUPS) grouped.set(group, [])

  for (const button of sorted) {
    if (isSidebarButtonLocked(button)) continue
    const group = button.group || getDefaultSidebarGroup(button.id)
    grouped.get(group)!.push({ ...button, group })
  }

  const normalizedMovable = SIDEBAR_GROUPS.flatMap((group) => grouped.get(group) || [])
  const movableById = new Map(normalizedMovable.map((button) => [button.id, button]))

  return sorted.map((button) => {
    if (isSidebarButtonLocked(button)) return button
    const normalized = movableById.get(button.id)
    return normalized ? { ...normalized, order: normalizedMovable.findIndex((entry) => entry.id === button.id) } : button
  })
}
