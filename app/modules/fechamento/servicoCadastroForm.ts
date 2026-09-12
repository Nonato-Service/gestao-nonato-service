/** Estado vazio e mapeamento ServicoCadastroItem → formulário. */

import type {
  ServicoCadastroCategoria,
  ServicoCadastroItem,
  ServicoCadastroTipoCobranca,
} from './servicoCadastroTipos'

export type ServicoCadastroFormState = {
  cod: string
  nome: string
  descricao: string
  valor: number
  grupoId: string
  tipoCobranca: ServicoCadastroTipoCobranca
  categoria: ServicoCadastroCategoria
}

export function emptyServicoCadastroFormState(
  overrides?: Partial<ServicoCadastroFormState>
): ServicoCadastroFormState {
  return {
    cod: '',
    nome: '',
    descricao: '',
    valor: 0,
    grupoId: '',
    tipoCobranca: 'unidade',
    categoria: 'servico',
    ...overrides,
  }
}

/** Payload opcional do ecrã de cadastro → handleSaveServico. */
export type CadastroServicoSavePayload = {
  form: ServicoCadastroFormState
  valorInput: string
}

export function servicoCadastroToFormState(servico: ServicoCadastroItem): ServicoCadastroFormState {
  return {
    cod: servico.cod || '',
    nome: servico.nome,
    descricao: servico.descricao || '',
    valor: servico.valor,
    grupoId: servico.grupoId,
    tipoCobranca: servico.tipoCobranca,
    categoria: servico.categoria,
  }
}
