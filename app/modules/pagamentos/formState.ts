/** Formulários vazios e mapeamento empresa / pagamento → form. */

import { metodoPadraoPagamento } from './oficiais'
import { dataLocalISOFromMs, normalizarDataPagamento } from './resumo'
import type { AnexoPagamento, EmpresaRecebedora, PagamentoMetodo, PagamentoSaida, PagamentoSaidaStatus } from './tipos'

export type EmpresaRecebedoraFormState = {
  nome: string
  nif: string
  contribuinte: string
  iban: string
  banco: string
  notas: string
}

export function emptyEmpresaRecebedoraForm(): EmpresaRecebedoraFormState {
  return { nome: '', nif: '', contribuinte: '', iban: '', banco: '', notas: '' }
}

export function empresaRecebedoraToForm(e: EmpresaRecebedora): EmpresaRecebedoraFormState {
  return {
    nome: e.nome || '',
    nif: e.nif || '',
    contribuinte: e.contribuinte || e.nif || '',
    iban: e.iban || '',
    banco: e.banco || '',
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
  contribuinte: string
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
    contribuinte: '',
    valor: '',
    dataPagamento: dataLocalISOFromMs(opts.nowMs),
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
    contribuinte: p.contribuinte || '',
    valor: p.valor > 0 ? String(p.valor) : '',
    dataPagamento: normalizarDataPagamento(p.dataPagamento) || p.dataPagamento || '',
    descricao: p.descricao || '',
    status: p.status || 'pendente',
    anexos: Array.isArray(p.anexos) ? [...p.anexos] : [],
  }
}

export function pagamentoFormDaInstituicao(
  e: Pick<EmpresaRecebedora, 'id' | 'nome' | 'nif' | 'iban' | 'banco' | 'contribuinte'>,
  opts: { nowMs: number }
): PagamentoSaidaFormState {
  return {
    ...emptyPagamentoSaidaForm({ nowMs: opts.nowMs, empresaId: e.id }),
    paraQuem: e.nome || '',
    metodo: metodoPadraoPagamento(e.id),
    iban: e.iban || '',
    banco: e.banco || '',
    contribuinte: e.contribuinte || e.nif || '',
    referencia: '',
    entidade: '',
  }
}
