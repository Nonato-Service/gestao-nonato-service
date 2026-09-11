/** Formulário de grupo de checklist — estado vazio e mapeamento. */

import type { GrupoChecklist } from './tipos'

export type GrupoChecklistFormState = {
  numeroGrupo: string
  nomeGrupo: string
  familia: string
  tipo: GrupoChecklist['tipo']
  imagem?: string
  trabalhosASeremExecutados?: string
}

export function emptyGrupoChecklistForm(): GrupoChecklistFormState {
  return {
    numeroGrupo: '',
    nomeGrupo: '',
    familia: '',
    tipo: 'basico',
    imagem: undefined,
    trabalhosASeremExecutados: '',
  }
}

export function grupoChecklistToForm(
  grupo: GrupoChecklist,
  opts?: { familiaFallback?: string }
): GrupoChecklistFormState {
  return {
    numeroGrupo: grupo.numeroGrupo,
    nomeGrupo: grupo.nomeGrupo,
    familia: grupo.familia || opts?.familiaFallback || '',
    tipo: grupo.tipo || 'basico',
    imagem: grupo.imagem,
    trabalhosASeremExecutados: grupo.trabalhosASeremExecutados || '',
  }
}
