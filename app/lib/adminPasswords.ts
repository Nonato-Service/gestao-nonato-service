import { generatePassword as generatePasswordPure } from '../modules/admin/passwords'
import {
  createPasswordFromForm as createPasswordFromFormPure,
  updatePasswordFromForm as updatePasswordFromFormPure,
} from '../modules/admin/passwordFromForm'
import type { PasswordFormState } from '../modules/admin/passwordForm'
import type { PasswordEntry } from '../modules/admin/passwords'

/** Injeta Math.random() no gerador canónico de senhas do admin. */
export function generatePassword(length: number = 16): string {
  return generatePasswordPure(length, Math.random)
}

/** Injeta Date.now() / Math.random() nos IDs e datas do gestor de senhas. */
export function createPasswordFromForm(
  form: PasswordFormState,
  opts?: { id?: string; createdAt?: string }
): PasswordEntry {
  return createPasswordFromFormPure(form, {
    ...opts,
    nowMs: Date.now(),
    random: Math.random,
  })
}

export function updatePasswordFromForm(
  existing: PasswordEntry,
  form: PasswordFormState,
  opts?: { updatedAt?: string }
): PasswordEntry {
  return updatePasswordFromFormPure(existing, form, {
    ...opts,
    nowMs: Date.now(),
  })
}
