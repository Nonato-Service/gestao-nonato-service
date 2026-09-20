import {
  createUserFromForm as createUserFromFormPure,
  updateUserFromForm as updateUserFromFormPure,
  type UserFromFormMenuOpts,
} from '../modules/admin/userFromForm'
import type { UserFormState } from '../modules/admin/userFormState'
import type { User } from '../modules/admin/userTipos'

/** Injeta Date.now() no id quando o call-site não envia um. */
export function createUserFromForm(form: UserFormState, opts: UserFromFormMenuOpts): User {
  return createUserFromFormPure(form, { ...opts, nowMs: Date.now() })
}

export function updateUserFromForm(
  existing: User,
  form: UserFormState,
  opts: Omit<UserFromFormMenuOpts, 'id'>
): User {
  return updateUserFromFormPure(existing, form, { ...opts, nowMs: Date.now() })
}
