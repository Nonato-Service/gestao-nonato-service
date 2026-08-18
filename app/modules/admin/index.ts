/** Módulo admin — formulário de utilizadores + gestor de senhas + logos PDF. */

export type { UserFormState, UserForForm } from './userForm'
export { createEmptyUserForm, userToFormState } from './userForm'

export type { PasswordEntry } from './passwords'
export { generatePassword } from './passwords'

export type { LogoRelatorio } from './logosRelatorio'
export { parseLogosRelatoriosArr, preferRicherLogosRelatorios } from './logosRelatorio'
