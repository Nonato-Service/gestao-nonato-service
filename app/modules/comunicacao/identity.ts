/** Resolve a identidade de comunicação a partir do login + cadastros. */

import type {
  CommunicationIdentity,
  GestorComunicacaoLike,
  LoginUserComunicacaoLike,
  TecnicoComunicacaoLike,
} from './tipos'

export function resolveCommunicationIdentity(
  loginUser: LoginUserComunicacaoLike | null | undefined,
  gestores: GestorComunicacaoLike[],
  tecnicos: TecnicoComunicacaoLike[]
): CommunicationIdentity | null {
  if (!loginUser || loginUser.isAdmin) return null

  const loginEmail = (loginUser.email || '').trim().toLowerCase()
  const loginNome = (loginUser.name || '').trim().toLowerCase()

  if (loginUser.linkedProfileType === 'gestor' && loginUser.linkedProfileId) {
    const gestorById = gestores.find((g) => g.id === loginUser.linkedProfileId)
    if (gestorById) {
      return {
        tipo: 'gestor',
        id: gestorById.id,
        nome: gestorById.name,
        area: gestorById.area || 'assistencia-tecnica',
        foto: gestorById.photo || '',
      }
    }
  }

  if (loginUser.linkedProfileType === 'tecnico' && loginUser.linkedProfileId) {
    const tecnicoById = tecnicos.find((t) => t.id === loginUser.linkedProfileId)
    if (tecnicoById) {
      return {
        tipo: 'tecnico',
        id: tecnicoById.id,
        nome: tecnicoById.name,
        area: tecnicoById.type === 'armazem' ? 'armazem' : undefined,
        foto: tecnicoById.photo || '',
        tecnicoTipo: tecnicoById.type,
      }
    }
  }

  const gestor = gestores.find(
    (g) =>
      (loginEmail && (g.email || '').trim().toLowerCase() === loginEmail) ||
      (loginNome && (g.name || '').trim().toLowerCase() === loginNome)
  )
  if (gestor) {
    return {
      tipo: 'gestor',
      id: gestor.id,
      nome: gestor.name,
      area: gestor.area || 'assistencia-tecnica',
      foto: gestor.photo || '',
    }
  }

  const tecnico = tecnicos.find(
    (t) =>
      (loginEmail && (t.email || '').trim().toLowerCase() === loginEmail) ||
      (loginNome && (t.name || '').trim().toLowerCase() === loginNome)
  )
  if (tecnico) {
    return {
      tipo: 'tecnico',
      id: tecnico.id,
      nome: tecnico.name,
      area: tecnico.type === 'armazem' ? 'armazem' : undefined,
      foto: tecnico.photo || '',
      tecnicoTipo: tecnico.type,
    }
  }

  return null
}
