/** Tipo canónico do item no Cadastro de Serviços. */

export type ServicoCadastroTipoCobranca =
  | 'unidade'
  | 'km'
  | 'hora'
  | 'valor-fixo'
  | 'diarias'
  | 'extras'

export type ServicoCadastroCategoria = 'servico' | 'despesa'

export type ServicoCadastroItem = {
  id: string
  grupoId: string
  cod?: string
  nome: string
  descricao?: string
  valor: number
  tipoCobranca: ServicoCadastroTipoCobranca
  categoria: ServicoCadastroCategoria
}
