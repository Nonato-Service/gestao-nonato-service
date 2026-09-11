/** Formulário vazio do comprovante de despesa. */

import { horaAtualLocal } from './clientesAtivos'
import type { ClienteAtivoComprovante, MotivoAssociacaoRecibo } from './clientesAtivos'

export type ComprovanteDespesaFormState = {
  tipo: 'cliente' | 'pessoal'
  cliente: string
  data: string
  horaUsada: string
  mesCompetencia: string
  valorUnitario: number
  quantidade: number
  descricao: string
  imagemBase64: string
  clientesSugeridos: ClienteAtivoComprovante[]
  motivoAssociacao: MotivoAssociacaoRecibo
}

export function emptyComprovanteDespesaForm(): ComprovanteDespesaFormState {
  return {
    tipo: 'cliente',
    cliente: '',
    data: new Date().toISOString().slice(0, 10),
    horaUsada: horaAtualLocal(),
    mesCompetencia: new Date().toISOString().slice(0, 7),
    valorUnitario: 0,
    quantidade: 1,
    descricao: '',
    imagemBase64: '',
    clientesSugeridos: [],
    motivoAssociacao: 'perguntar',
  }
}
