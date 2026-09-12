/** Rótulos e mapeamento visual do painel Gestores / Técnicos. */

import type { TecnicoType } from './tipos'

export type GestoresTecnicosLabels = {
  gestoresTitle?: string
  gestoresTab?: string
  tecnicosTab?: string
  totalCadastrados?: string
  addGestor?: string
  addTecnico?: string
  editGestor?: string
  editTecnico?: string
  noGestores?: string
  noTecnicos?: string
  nenhumGestorFiltro?: string
  name?: string
  email?: string
  phone?: string
  address?: string
  photo?: string
  save?: string
  cancel?: string
  edit?: string
  delete?: string
  areaAtuacao?: string
  filtrarPorArea?: string
  type?: string
  internal?: string
  external?: string
  armazem?: string
  searchPlaceholder?: string
  fotoPerfil?: string
  cliqueAdicionarFoto?: string
  removePhoto?: string
  fotoHint?: string
  fillAllFields?: string
  confirmDeleteGestor?: string
  confirmDeleteTecnico?: string
  gestorSaved?: string
  gestorUpdated?: string
  recebeAvisosOS?: string
  esteGestorRecebeAvisosOS?: string
  gerenciarTiposTitulo?: string
  gerenciarTiposDesc?: string
  gerenciarTiposBtn?: string
  todosTecnicos?: string
  tecnicosInternos?: string
  tecnicosExternos?: string
  tecnicosArmazem?: string
  cadastrados?: string
  fechar?: string
  novoCadastro?: string
  editarCadastro?: string
  listaCarregarMais?: string
}

export function tipoTecnicoLabel(type: TecnicoType, labels: GestoresTecnicosLabels): string {
  if (type === 'internal') return labels.internal || 'Interno'
  if (type === 'external') return labels.external || 'Externo'
  return labels.armazem || 'Armazém'
}

export function tipoTecnicoIcon(type: TecnicoType): string {
  if (type === 'internal') return '🏢'
  if (type === 'external') return '🌐'
  return '📦'
}
