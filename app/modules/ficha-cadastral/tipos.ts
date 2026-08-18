/** Tipos da ficha cadastral da Nonato Service (empresa / dados bancários). */

/** Ficha cadastral — nome empresa, NIF, NIB/IBAN, SWIFT, logo, contacto. */
export type FichaCadastral = {
  nomeEmpresa: string
  nif: string
  nib: string
  iban?: string
  swift: string
  nomeBanco?: string
  telefone?: string
  email?: string
  morada?: string
  logo?: string
}

/** Variante com IBAN obrigatório (envio bancário / cobrança). */
export type FichaCadastralBancaria = {
  nomeEmpresa: string
  nif: string
  nib: string
  iban: string
  swift: string
  nomeBanco?: string
  telefone?: string
  email?: string
  morada?: string
  logo?: string
}
