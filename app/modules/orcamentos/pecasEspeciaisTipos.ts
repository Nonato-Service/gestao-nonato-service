/** Tipos canónicos do orçamento de peças especiais. */

export type ModoCalculoTotalPecasEsp = 'linhas' | 'valor-final'

export type ClienteOrcamentoPecasEsp = {
  id: string
  nomeEmpresa: string
  morada?: string
  localidade?: string
  codigoPostal?: string
  pais?: string
  telefones?: string
  email?: string
  contato?: string
  codigoCliente?: string
}

export type PecaBibliotecaPecasEsp = {
  id: string
  codigo: string
  nome: string
  descricao?: string
  imagem?: string
  preco?: string
}

export type LinhaOrcamentoPecasEsp = {
  rowId: string
  numeroArtigo: string
  quantidade: string
  precoUnitario: string
  titulo: string
  descricao: string
  descricaoOriginal: string
  infoExtra: string
  imagem: string
  pecaId: string
}

export type OrcamentoPecasEspeciaisSalvo = {
  id: string
  numeroOferta: string
  dataIso: string
  clienteId: string
  clienteNome: string
  clienteCodigo: string
  contactoNome: string
  contactoTelefone: string
  contactoEmail: string
  linhas: LinhaOrcamentoPecasEsp[]
  linhaEmbalagemTitulo: string
  linhaEmbalagemDescricao: string
  condicoesPagamento: string
  notasRodape: string
  totalLiquido: string
  totalIva?: string
  totalComIva?: string
  incluirIva?: boolean
  taxaIva?: number
  modoCalculoTotal?: ModoCalculoTotalPecasEsp
  valorFinalComIva?: string
  dataCriacao: string
}

export type EmpresaOrcamentoPecasEsp = {
  nomeEmpresa?: string
  morada?: string
  nif?: string
  telefone?: string
  email?: string
}
