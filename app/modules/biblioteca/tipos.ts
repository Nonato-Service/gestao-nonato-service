/** Tipos mínimos da Biblioteca de Peças (funções puras). */

export type PecaBibliotecaLike = {
  id: string
  codigo?: string
  nome?: string
  categoriaId?: string
  categoria?: string
  subcategoriaId?: string
  subcategoria?: string
  imagem?: string
  importacaoPendente?: boolean | string | number
  numeroSequenciaGrupo?: string
  dataCriacao?: string
}

export type CategoriaPecaLike = {
  id: string
  nome?: string
}

export type SubcategoriaPecaLike = {
  id: string
  nome?: string
  categoriaId: string
}
