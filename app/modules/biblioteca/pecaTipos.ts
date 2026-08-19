/** Tipos canónicos da Biblioteca de Peças (cadastro / estado do monólito). */

export type CategoriaPeca = {
  id: string
  nome: string
}

export type SubcategoriaPeca = {
  id: string
  nome: string
  categoriaId: string
}

export type PecaBiblioteca = {
  id: string
  nome: string
  codigo: string
  preco?: string
  descricao?: string
  categoria?: string
  categoriaId?: string
  subcategoria?: string
  subcategoriaId?: string
  imagem?: string
  /** Miniatura opcional na grelha da biblioteca; se vazia, usa `imagem`. */
  imagemCapa?: string
  quantidade?: number
  dataCriacao?: string
  /** Marca de revisão local — classificação em lote, edição manual, etc. */
  dataAtualizacao?: string
  importacaoPendente?: boolean
  /** Referências HOMAG alternativas (ex.: 2-006-80-7481 quando codigo é 2006807481). */
  referenciasAlternativas?: string[]
  /** SKUs alternativos (ex.: R2006215960, 2006808181R). */
  codigosAlternativos?: string[]
  /** @deprecated Use referenciasAlternativas */
  referenciasAntigas?: string[]
  /** @deprecated Use codigosAlternativos */
  codigosAntigos?: string[]
  /** Número sequencial dentro da categoria (01, 02, 03… — ignora subcategoria). */
  numeroSequenciaGrupo?: string
}
