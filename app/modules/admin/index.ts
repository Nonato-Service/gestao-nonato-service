/** Módulo admin — utilizadores (tipo/form) + gestor de senhas + logos PDF. */

export type { User, UserPermissions } from './userTipos'

export type { UserFromFormMenuOpts } from './userFromForm'
export { createUserFromForm, updateUserFromForm } from './userFromForm'

export type { UserFormState } from './userFormState'
export type { UserForForm } from './userForm'
export { createEmptyUserForm, userToFormState } from './userForm'

export type { PasswordEntry } from './passwords'
export { generatePassword } from './passwords'

export type { PasswordFormState } from './passwordForm'
export { emptyPasswordForm, passwordEntryToForm } from './passwordForm'

export {
  isPasswordFormValid,
  passwordFormMissingField,
  createPasswordFromForm,
  updatePasswordFromForm,
} from './passwordFromForm'

export type { LogoRelatorio, LogoRelatorioLabelSource } from './logosRelatorio'
export { parseLogosRelatoriosArr, preferRicherLogosRelatorios, resolveLogoLabel } from './logosRelatorio'

export type { AdminInterfaceLogoDraft, AdminBibliotecaLogoDraft } from './logoDrafts'

export type { NonatoBrandVariant, NonatoBrandVariantLabel } from './brandLogo'
export {
  NONATO_BRAND_VARIANT_CLASS,
  NONATO_BRAND_VARIANT_LABELS,
  brandLogoClassName,
} from './brandLogo'

export type { SyncPendingRemote } from './syncPending'
export {
  isSyncPendingRemote,
  syncPendingRevisionValue,
  syncPendingRevisionDisplay,
} from './syncPending'

export type { CodeBackup, AutoBackup } from './backupTipos'
export { findBackupByTimestamp, formatCodeBackupFilesLabel } from './backupTipos'

export type { ZipDownloadHistoryEntry } from './zipDownloadHistory'
export {
  MAX_BACKUP_HISTORY,
  ZIP_DOWNLOAD_HISTORY_KEY,
  formatBackupBytes,
  normalizeZipDownloadHistory,
  prependZipDownloadHistory,
} from './zipDownloadHistory'
