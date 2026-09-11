/** Tipos canónicos do PRE CHECK. */

import type { Equipamento } from '../equipamentos/formState'

export type PreCheckStatus = 'aprovado' | 'reprovado' | 'pendente'

export type PreCheckFormState = {
  data: string
  tecnicoResponsavel: string
  observacoes: string
  status: PreCheckStatus
}

export type PreCheck = {
  id: string
  equipamentoId: string
  equipamentoNumero: string
  data: string
  tecnicoResponsavel: string
  observacoes: string
  status: PreCheckStatus
  equipamento?: Equipamento
}
