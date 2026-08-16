/** Módulo Sidebar — grupos, normalize, tip bubble e hub/tabs. */

export type { SidebarGroup, SidebarButton, TabType, Tab } from './tipos'

export {
  SIDEBAR_GROUPS,
  SIDEBAR_GROUP_LAUNCHER_IDS,
  SIDEBAR_PINNED_IDS,
  GESTAO_FINANCEIRA_TAB_TYPES,
  SIDEBAR_TRANSLATION_KEY_BY_ID,
  SIDEBAR_SECTION_ICONS,
} from './constantes'

export {
  getDefaultSidebarGroup,
  isSidebarButtonLocked,
  sidebarGroupChevronClass,
  getGestaoFinanceiraUiSubgroup,
} from './grupos'

export {
  migrateLegacyFichaCadastralSidebarButtons,
  normalizeSidebarButtons,
} from './normalize'

export { extractSidebarButtonTip } from './tipBubble'

export {
  TAB_DEFAULT_PARENT_HUB,
  getTabTitleForBundle,
  HUB_CARD_DESC_BY_BUTTON_ID,
  HUB_CARD_DESC_BY_ACTION,
  pickTrChain,
  resolveActionCardDescription,
} from './hub'
