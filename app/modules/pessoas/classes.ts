/** Classes / rótulos de papel para hub de comunicação (gestor vs técnico). */

import type { Gestor, Tecnico } from './tipos'

export type GestorClasse = 'gestor' | 'gestor-industrial' | 'armazem'
export type TecnicoClasse = 'tecnico-interno' | 'tecnico-externo' | 'armazem'
export type TecnicoTipoUi = 'interno' | 'externo' | 'armazem'

export function getGestorClasse(gestor?: Pick<Gestor, 'area'> | null): GestorClasse {
  if (gestor?.area === 'industrial') return 'gestor-industrial'
  if (gestor?.area === 'armazem') return 'armazem'
  return 'gestor'
}

export function getTecnicoClasse(tecnico?: Pick<Tecnico, 'type'> | null): TecnicoClasse {
  if (tecnico?.type === 'internal') return 'tecnico-interno'
  if (tecnico?.type === 'external') return 'tecnico-externo'
  return 'armazem'
}

export function getTecnicoTipo(t: Pick<Tecnico, 'type'>): TecnicoTipoUi {
  if (t.type === 'internal') return 'interno'
  if (t.type === 'external') return 'externo'
  return 'armazem'
}
