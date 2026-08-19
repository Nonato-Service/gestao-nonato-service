/** Formulário vazio da peça na Biblioteca (função pura). */

import type { PecaBiblioteca } from './pecaTipos'

export type EmptyPecaBibliotecaFormOpts = {
  categoria?: string
  categoriaId?: string
  subcategoria?: string
  subcategoriaId?: string
  /** Após salvar: limpa capa (opcional). */
  imagemCapa?: string
  /** Após salvar: força flag de importação (opcional). */
  importacaoPendente?: boolean
}

/** Estado inicial / limpo do formulário de peça na biblioteca. */
export function createEmptyPecaBibliotecaForm(
  opts: EmptyPecaBibliotecaFormOpts = {}
): PecaBiblioteca {
  const form: PecaBiblioteca = {
    id: '',
    nome: '',
    codigo: '',
    preco: '',
    descricao: '',
    categoria: opts.categoria ?? '',
    categoriaId: opts.categoriaId ?? '',
    subcategoria: opts.subcategoria ?? '',
    subcategoriaId: opts.subcategoriaId ?? '',
    imagem: '',
    dataCriacao: new Date().toISOString(),
  }
  if (opts.imagemCapa !== undefined) form.imagemCapa = opts.imagemCapa
  if (opts.importacaoPendente !== undefined) form.importacaoPendente = opts.importacaoPendente
  return form
}
