/** Módulo Sidebar — grupos, normalize, tip bubble, hub/tabs, intro/help e rótulos de hub. */

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

export { SIDEBAR_ACTION_GLYPHS, getSidebarActionGlyph } from './navGlyphs'

export { extractSidebarButtonTip } from './tipBubble'

export {
  TAB_DEFAULT_PARENT_HUB,
  getTabTitleForBundle,
  HUB_CARD_DESC_BY_BUTTON_ID,
  HUB_CARD_DESC_BY_ACTION,
  pickTrChain,
  resolveActionCardDescription,
} from './hub'

export {
  TAB_MODULE_INTRO_KEYS,
  getTabModuleIntroText,
  getBottomTabAccentClass,
  getHelpKey,
  getHelpContent,
} from './tabIntro'

export {
  getSidebarGroupLabel,
  getSidebarGroupSub,
  getDashboardMainHubTitle,
  formatNavBackToHub,
} from './hubLabels'

export type { SidebarButtonFormState } from './buttonForm'
export { emptySidebarButtonForm, sidebarButtonToForm } from './buttonForm'

export {
  isSidebarButtonFormValid,
  findSidebarButtonTranslationKey,
  isSidebarButtonCustomName,
  createSidebarButtonFromForm,
  updateSidebarButtonFromForm,
} from './buttonFromForm'

export type { HubPainelModulo, HubPainelStatus } from './hubPainel'
export {
  HUB_PAINEL_LS_PREFIX_BY_MODULO,
  hubPainelLsPrefix,
  hubPainelLsKey,
} from './hubPainel'

export type { VisualId, ShowcaseMenuItem } from './showcaseVisual'
export { SHOWCASE_MENU, showcaseNavItemClass } from './showcaseVisual'

export type { ShowcaseSlide } from './showcaseSlides'
export { SHOWCASE_SLIDE_DEFS, buildShowcaseSlides } from './showcaseSlides'

export type { SidebarMenuItemDef, SidebarMenuModuleDef, LegacyAccessCheck } from './menuPermissions'
export {
  SIDEBAR_MENU_MODULES,
  ALL_MENU_ITEM_IDS,
  LINKED_MENU_PARENTS,
  getMenuItemDef,
  getButtonIdForAction,
  hasLinkedMenuAccess,
  applyLinkedMenuItemAccess,
  inferMenuItemsConfigured,
  hasStrictMenuPolicy,
  ensureUserMenuPolicy,
  normalizeMenuItems,
  normalizeMenuItemsWithLegacyFallback,
  buildMenuItemsFromLegacyPermissions,
  syncLegacyPermissionsFromMenuItems,
  setModuleMenuItems,
  countModuleActiveItems,
  canAccessSidebarMenuItem,
  canAccessSidebarModule,
} from './menuPermissions'

export type { SidebarButtonMerge } from './merge'
export {
  mergeSidebarButtonsDeferLocal,
  REQUIRED_SIDEBAR_BUTTON_IDS,
  SIDEBAR_BUTTON_CATALOG,
  repairSidebarButtonsFromCatalog,
} from './merge'
