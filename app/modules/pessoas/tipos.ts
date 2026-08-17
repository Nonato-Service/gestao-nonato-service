/** Tipos de gestores e técnicos (cadastro de pessoas). */

export type TipoGestor = {
  id: string
  nome: string
  cor: string
  icone: string
  ordem: number
}

export type Gestor = {
  id: string
  name: string
  email: string
  phone: string
  address: string
  area: string
  photo?: string
  dataAtualizacao?: string
}

export type TecnicoType = 'internal' | 'external' | 'armazem'

export type Tecnico = {
  id: string
  name: string
  email: string
  phone: string
  address: string
  type: TecnicoType
  photo?: string
  dataAtualizacao?: string
}

export type GestorFormState = {
  name: string
  email: string
  phone: string
  address: string
  area: string
  photo: string
}

export type TecnicoFormState = {
  name: string
  email: string
  phone: string
  address: string
  type: TecnicoType
  photo: string
}

export type TipoGestorFormState = {
  id: string
  nome: string
  cor: string
  icone: string
  ordem: number
}
