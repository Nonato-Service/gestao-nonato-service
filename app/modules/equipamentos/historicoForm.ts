/** Formulário vazio do histórico de equipamento. */

import type { HistoricoEquipamento } from './formState'

export type HistoricoEquipamentoTipo = HistoricoEquipamento['tipo']

export type HistoricoEquipamentoFormState = {
  tipo: HistoricoEquipamentoTipo
  descricao: string
  responsavel: string
  observacoes: string
}

export function emptyHistoricoEquipamentoForm(): HistoricoEquipamentoFormState {
  return { tipo: 'outro', descricao: '', responsavel: '', observacoes: '' }
}
