/** Gestor de senhas (admin) — tipo e gerador aleatório. */

export type PasswordEntry = {
  id: string
  tecnicoName: string
  password: string
  createdAt: string
  updatedAt?: string
}

/** Gera senha com maiúscula, minúscula, dígito e símbolo; embaralha o resto. Aleatório injectado. */
export function generatePassword(length: number, random: () => number): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  const allChars = uppercase + lowercase + numbers + symbols

  let password = ''
  password += uppercase[Math.floor(random() * uppercase.length)]
  password += lowercase[Math.floor(random() * lowercase.length)]
  password += numbers[Math.floor(random() * numbers.length)]
  password += symbols[Math.floor(random() * symbols.length)]

  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(random() * allChars.length)]
  }

  return password
    .split('')
    .sort(() => random() - 0.5)
    .join('')
}
