/** Estado vazio e normalização da ficha cadastral. */

import type { FichaCadastral, FichaCadastralBancaria } from './tipos'

export function emptyFichaCadastral(): FichaCadastral {
  return { nomeEmpresa: '', nif: '', nib: '', swift: '' }
}

function strOrEmpty(v: unknown): string {
  if (typeof v === 'string') return v
  if (v == null) return ''
  return String(v)
}

function strOrUndef(v: unknown): string | undefined {
  if (v == null) return undefined
  if (typeof v === 'string') return v
  return String(v)
}

/** Normaliza payload persistido (localStorage / servidor) para FichaCadastral. */
export function normalizeFichaCadastral(raw: unknown): FichaCadastral | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  return {
    nomeEmpresa: strOrEmpty(o.nomeEmpresa),
    nif: strOrEmpty(o.nif),
    nib: strOrEmpty(o.nib),
    iban: strOrUndef(o.iban),
    swift: strOrEmpty(o.swift),
    nomeBanco: strOrUndef(o.nomeBanco),
    telefone: strOrUndef(o.telefone),
    email: strOrUndef(o.email),
    morada: strOrUndef(o.morada),
    logo: strOrUndef(o.logo),
  }
}

/** Converte ficha geral em variante bancária (IBAN garantido como string). */
export function fichaCadastralToBancaria(ficha: FichaCadastral): FichaCadastralBancaria {
  return {
    nomeEmpresa: ficha.nomeEmpresa,
    nif: ficha.nif,
    nib: ficha.nib,
    iban: ficha.iban ?? '',
    swift: ficha.swift,
    nomeBanco: ficha.nomeBanco,
    telefone: ficha.telefone,
    email: ficha.email,
    morada: ficha.morada,
    logo: ficha.logo,
  }
}
