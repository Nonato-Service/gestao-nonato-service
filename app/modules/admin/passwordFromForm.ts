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

export function createPasswordFromForm(
  form: PasswordFormState,
  opts?: { id?: string; createdAt?: string }
): PasswordEntry {
  return {
    id: opts?.id ?? Date.now().toString() + Math.random().toString(36).substr(2, 9),
    tecnicoName: form.tecnicoName,
    password: form.password,
    createdAt: opts?.createdAt ?? new Date().toISOString(),
  }
}

export function updatePasswordFromForm(
  existing: PasswordEntry,
  form: PasswordFormState,
  opts?: { updatedAt?: string }
): PasswordEntry {
  return {
    ...existing,
    tecnicoName: form.tecnicoName,
    password: form.password,
    updatedAt: opts?.updatedAt ?? new Date().toISOString(),
  }
}
