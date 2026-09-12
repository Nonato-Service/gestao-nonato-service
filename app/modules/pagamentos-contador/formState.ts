/** Formulários vazios e mapeamento entidade / pagamento → form. */

import type {
  AnexoContador,
  CategoriaEntidadeContador,
  PagamentoContador,
  PagamentoContadorStatus,
} from './tipos'

export type EntidadeContadorFormState = {
  nome: string
  categoria: CategoriaEntidadeContador
  nif: string
  contacto: string
  notas: string
}

export function emptyEntidadeContadorForm(): EntidadeContadorFormState {
  return {
    nome: '',
    categoria: 'irs',
    nif: '',
    contacto: '',
    notas: '',
  }
}

export type PagamentoContadorFormState = {
  entidadeId: string
  entidadeNome: string
  dataPagamento: string
  valor: number
  periodoReferencia: string
  numeroDocumento: string
  descricao: string
  status: PagamentoContadorStatus
  anexos: AnexoContador[]
}

export function emptyPagamentoContadorForm(entidadeId = ''): PagamentoContadorFormState {
  return {
    entidadeId,
    entidadeNome: '',
    dataPagamento: new Date().toISOString().slice(0, 10),
    valor: 0,
    periodoReferencia: '',
    numeroDocumento: '',
    descricao: '',
    status: 'pago',
    anexos: [],
  }
}

export function pagamentoContadorToForm(p: PagamentoContador): PagamentoContadorFormState {
  return {
    entidadeId: p.entidadeId,
    entidadeNome: p.entidadeNome,
    dataPagamento: p.dataPagamento,
    valor: p.valor,
    periodoReferencia: p.periodoReferencia,
    numeroDocumento: p.numeroDocumento ?? '',
    descricao: p.descricao ?? '',
    status: p.status,
    anexos: [...p.anexos],
  }
}
