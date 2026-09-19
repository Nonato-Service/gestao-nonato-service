/** Formulários vazios e mapeamento empresa / pagamento → form. */

import type { AnexoPagamento, EmpresaRecebedora, PagamentoMetodo, PagamentoSaida, PagamentoSaidaStatus } from './tipos'

export type EmpresaRecebedoraFormState = {
  nome: string
  nif: string
  notas: string
}

export function emptyEmpresaRecebedoraForm(): EmpresaRecebedoraFormState {
  return { nome: '', nif: '', notas: '' }
}

export function empresaRecebedoraToForm(e: EmpresaRecebedora): EmpresaRecebedoraFormState {
  return {
    nome: e.nome || '',
    nif: e.nif || '',
    notas: e.notas || '',
  }
}

export type PagamentoSaidaFormState = {
  empresaId: string
  paraQuem: string
  metodo: PagamentoMetodo
  referencia: string
  entidade: string
  iban: string
  banco: string
  valor: string
  dataPagamento: string
  descricao: string
  status: PagamentoSaidaStatus
  anexos: AnexoPagamento[]
}

export function emptyPagamentoSaidaForm(opts: { nowMs: number; empresaId?: string }): PagamentoSaidaFormState {
  return {
    empresaId: opts.empresaId || '',
    paraQuem: '',
    metodo: 'referencia',
    referencia: '',
    entidade: '',
    iban: '',
    banco: '',
    valor: '',
    dataPagamento: new Date(opts.nowMs).toISOString().slice(0, 10),
    descricao: '',
    status: 'pendente',
    anexos: [],
  }
}

export function pagamentoSaidaToForm(p: PagamentoSaida): PagamentoSaidaFormState {
  return {
    empresaId: p.empresaId || '',
    paraQuem: p.paraQuem || '',
    metodo: p.metodo,
    referencia: p.referencia || '',
    entidade: p.entidade || '',
    iban: p.iban || '',
    banco: p.banco || '',
    valor: p.valor > 0 ? String(p.valor) : '',
    dataPagamento: p.dataPagamento || '',
    descricao: p.descricao || '',
    status: p.status || 'pendente',
    anexos: Array.isArray(p.anexos) ? [...p.anexos] : [],
  }
}
