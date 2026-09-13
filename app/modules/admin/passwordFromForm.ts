/** Validação e mapeamento puro do gestor de senhas. */

import type { PasswordFormState } from './passwordForm'
import type { PasswordEntry } from './passwords'

export function passwordFormMissingField(
  form: Pick<PasswordFormState, 'tecnicoName' | 'password'>
): 'name' | 'password' | null {
  if (!form.tecnicoName.trim()) return 'name'
  if (!form.password.trim()) return 'password'
  return null
}

export function isPasswordFormValid(
  form: Pick<PasswordFormState, 'tecnicoName' | 'password'>
): boolean {
  return passwordFormMissingField(form) === null
}

export type CreatePasswordFromFormOpts = {
  id?: string
  createdAt?: string
  nowMs: number
  random: () => number
}

export function createPasswordFromForm(
  form: PasswordFormState,
  opts: CreatePasswordFromFormOpts
): PasswordEntry {
  return {
    id: opts.id ?? opts.nowMs.toString() + opts.random().toString(36).substr(2, 9),
    tecnicoName: form.tecnicoName,
    password: form.password,
    createdAt: opts.createdAt ?? new Date(opts.nowMs).toISOString(),
  }
}

export type UpdatePasswordFromFormOpts = {
  updatedAt?: string
  nowMs: number
}

export function updatePasswordFromForm(
  existing: PasswordEntry,
  form: PasswordFormState,
  opts: UpdatePasswordFromFormOpts
): PasswordEntry {
  return {
    ...existing,
    tecnicoName: form.tecnicoName,
    password: form.password,
    updatedAt: opts.updatedAt ?? new Date(opts.nowMs).toISOString(),
  }
}
