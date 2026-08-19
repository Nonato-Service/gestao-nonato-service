/** Peça de substituição / instalação no relatório de serviço (tipo puro + form vazio). */

export type PecaSubstituicao = {
  id: string
  imagem?: string
  descricao: string
  codigo: string
  quantidade: string
}

/** Estado inicial / limpo do formulário de peça (substituição ou instalação). */
export function createEmptyPecaSubstituicaoForm(): PecaSubstituicao {
  return {
    id: '',
    descricao: '',
    codigo: '',
    quantidade: '',
  }
}
