import { SIDEBAR_MENU_MODULES } from './sidebarMenuPermissions'
import { helpKeyFromAction, tabTypeFromAction } from './parseHelpContent'

export type ManualProgramaPageDef = {
  id: string
  action: string
  tabType: string | null
  titleKey: string
  fallbackTitle: string
  helpKey: string
  icon: string
  moduleTitle: string
  sidebarPath: string
}

export type ManualProgramaChapterDef = {
  id: string
  titleKey: string
  fallbackTitle: string
  icon: string
  pages: ManualProgramaPageDef[]
}

const SKIP_ACTIONS = new Set(['open-manual-programa'])

export const MANUAL_PROGRAMA_CHAPTERS: ManualProgramaChapterDef[] = (() => {
  const chapters: ManualProgramaChapterDef[] = [
    {
      id: 'intro',
      titleKey: 'manualProChapterIntro',
      fallbackTitle: 'Início e painel',
      icon: '🏠',
      pages: [
        {
          id: 'dashboard',
          action: '',
          tabType: null,
          titleKey: 'helpDashboardTitle',
          fallbackTitle: 'Painel inicial',
          helpKey: 'helpDashboardPainel',
          icon: '🏠',
          moduleTitle: 'Painel',
          sidebarPath: 'Menu lateral › Página inicial',
        },
      ],
    },
  ]

  for (const mod of SIDEBAR_MENU_MODULES) {
    const pages: ManualProgramaPageDef[] = []

    for (const item of mod.items) {
      if (SKIP_ACTIONS.has(item.action)) continue
      const tabType = tabTypeFromAction(item.action)
      pages.push({
        id: item.buttonId,
        action: item.action,
        tabType,
        titleKey: item.labelKey,
        fallbackTitle: item.fallbackLabel,
        helpKey: helpKeyFromAction(item.action, tabType),
        icon: mod.icon,
        moduleTitle: mod.fallbackTitle,
        sidebarPath: `${mod.fallbackTitle} › ${item.fallbackLabel}`,
      })
    }

    if (pages.length > 0) {
      chapters.push({
        id: mod.id,
        titleKey: mod.titleKey,
        fallbackTitle: mod.fallbackTitle,
        icon: mod.icon,
        pages,
      })
    }
  }

  return chapters
})()

export const MANUAL_PROGRAMA_PAGES = MANUAL_PROGRAMA_CHAPTERS.flatMap((c) => c.pages)

export function findManualPage(pageId: string): ManualProgramaPageDef | undefined {
  return MANUAL_PROGRAMA_PAGES.find((p) => p.id === pageId)
}
