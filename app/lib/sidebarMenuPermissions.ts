/** Re-export fino — fonte canónica em `app/modules/sidebar/menuPermissions`. */

export type { SidebarMenuItemDef, SidebarMenuModuleDef, LegacyAccessCheck } from '../modules/sidebar/menuPermissions'
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
} from '../modules/sidebar/menuPermissions'
