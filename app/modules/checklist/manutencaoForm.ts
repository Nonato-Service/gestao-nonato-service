/** Formulário de manutenção de checklist — estado vazio e mapeamento. */

import type { ManutencaoChecklist } from './tipos'

export type ManutencaoChecklistFormState = {
  nome: string
  avaliacaoFeitaVisual: boolean
  testeMecanico: boolean
  testeEletrico: boolean
  testeOperacional: boolean
  pecas: ManutencaoChecklist['pecas']
}

export function emptyManutencaoChecklistForm(): ManutencaoChecklistFormState {
  return {
    nome: '',
    avaliacaoFeitaVisual: false,
    testeMecanico: false,
    testeEletrico: false,
    testeOperacional: false,
    pecas: [],
  }
}

export function manutencaoChecklistToForm(manutencao: ManutencaoChecklist): ManutencaoChecklistFormState {
  return {
    nome: manutencao.nome,
    avaliacaoFeitaVisual: manutencao.avaliacaoFeitaVisual,
    testeMecanico: manutencao.testeMecanico,
    testeEletrico: manutencao.testeEletrico,
    testeOperacional: manutencao.testeOperacional,
    pecas: manutencao.pecas || [],
  }
}
