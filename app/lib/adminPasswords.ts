import { generatePassword as generatePasswordPure } from '../modules/admin/passwords'

/** Injeta Math.random() no gerador canónico de senhas do admin. */
export function generatePassword(length: number = 16): string {
  return generatePasswordPure(length, Math.random)
}
