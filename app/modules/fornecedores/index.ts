/** Módulo fornecedores — tipos e helpers puros de cadastro / faturas. */

export type {
  Fornecedor,
  FaturaFornecedor,
  FornecedorFormState,
  FaturaFornecedorFormState,
} from './tipos'

export {
  emptyFornecedorFormState,
  fornecedorToFormState,
  emptyFaturaFornecedorFormState,
  formatFaturaFornecedorValorText,
  faturaFornecedorToFormState,
} from './formState'

export { inferFaturaFornecedorEntidadeOrigem } from './entidadeOrigem'
