/** Checklist básico (instância de campo) — tipos e id, sem I/O. */

export const CHECKLIST_BASICO_STORAGE_KEY = 'nonato-checklist-basico-instancias'

export type ChecklistBasicoItemStatus = 'pendente' | 'executado' | 'nao_executado'

export type ChecklistBasicoItem = {
  id: string
  descricao: string
  status: ChecklistBasicoItemStatus
  motivoNaoExecutado?: string
}

export type ChecklistBasicoGrupo = {
  id: string
  nome: string
  itens: ChecklistBasicoItem[]
}

export type ChecklistBasicoEquipamentoInfo = {
  tipoEquipamento: string
  modelo: string
  marca: string
  numeroSerie: string
  familia: string
  grupo: string
}

export type ChecklistBasicoInstancia = {
  id: string
  clienteId: string
  clienteNome: string
  equipamentoKey: string
  equipamento: ChecklistBasicoEquipamentoInfo
  data: string
  grupos: ChecklistBasicoGrupo[]
  /** Técnico que realizou a inspeção */
  tecnicoId?: string
  tecnicoNome?: string
  assinaturaTecnico?: string
  dataAssinaturaTecnico?: string
  enviadoClienteEm?: string
  enviadoClienteVia?: 'email' | 'whatsapp'
  criadoEm: string
  atualizadoEm: string
}

/** Relógio (`nowMs`) e aleatório (`random`) injectados. */
export function newChecklistBasicoId(prefix: string, nowMs: number, random: () => number): string {
  return `${prefix}-${nowMs}-${random().toString(36).slice(2, 9)}`
}
