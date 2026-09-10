/** Formulário do gestor de senhas — estado vazio e mapeamento. */

import type { PasswordEntry } from './passwords'

export type PasswordFormState = {
  tecnicoName: string
  password: string
}

export function emptyPasswordForm(): PasswordFormState {
  return { tecnicoName: '', password: '' }
}

export function passwordEntryToForm(entry: PasswordEntry): PasswordFormState {
  return {
    tecnicoName: entry.tecnicoName,
    password: entry.password,
  }
}
