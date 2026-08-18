/** Módulo admin — utilizadores (tipo/form) + gestor de senhas + logos PDF. */

export type { User, UserPermissions } from './userTipos'

export type { UserFromFormMenuOpts } from './userFromForm'
export { createUserFromForm, updateUserFromForm } from './userFromForm'

export type { UserFormState, UserForForm } from './userForm'
export { createEmptyUserForm, userToFormState } from './userForm'

export type { PasswordEntry } from './passwords'
export { generatePassword } from './passwords'

export type { LogoRelatorio } from './logosRelatorio'
export { parseLogosRelatoriosArr, preferRicherLogosRelatorios } from './logosRelatorio'
