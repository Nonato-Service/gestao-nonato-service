/** Formulário de gestores/técnicos — estado vazio e mapeamento. */

import type { Gestor, GestorFormState, Tecnico, TecnicoFormState, TecnicoType } from './tipos'

export function emptyGestorForm(defaultArea = 'assistencia-tecnica'): GestorFormState {
  return { name: '', email: '', phone: '', address: '', area: defaultArea, photo: '' }
}

export function emptyTecnicoForm(type: TecnicoType = 'internal'): TecnicoFormState {
  return { name: '', email: '', phone: '', address: '', type, photo: '' }
}

export function gestorToForm(g: Gestor): GestorFormState {
  return {
    name: g.name,
    email: g.email,
    phone: g.phone,
    address: g.address,
    area: g.area,
    photo: g.photo || '',
  }
}

export function tecnicoToForm(t: Tecnico): TecnicoFormState {
  return {
    name: t.name,
    email: t.email,
    phone: t.phone,
    address: t.address,
    type: t.type,
    photo: t.photo || '',
  }
}

export function iniciaisPessoa(nome: string): string {
  const parts = String(nome || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
