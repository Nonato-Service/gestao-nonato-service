/** Re-export fino — fonte canónica em `app/modules/admin/userPermissions`. */

export type {
  UserPermissionKey,
  UserPermissionGroupId,
  UserPermissionMeta,
  UserPermissionGroup,
  UserPermissionPresetId,
} from '../modules/admin/userPermissions'
export {
  USER_PERMISSION_GROUPS,
  USER_PERMISSION_KEYS,
  USER_PERMISSION_PRESETS,
  countActivePermissions,
  getActivePermissionKeys,
  applyPermissionPreset,
  setGroupPermissions,
} from '../modules/admin/userPermissions'
