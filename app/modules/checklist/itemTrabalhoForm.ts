/** Formulário vazio e mapeamento ItemTrabalhoCriacao → form. */

import type { ItemTrabalhoCriacao } from './tipos'

export type CriacaoChecklistItemForm = {
  tipo: string
  descricaoTrabalho: string
  necessitaPecas: boolean
  origemPecas?: 'biblioteca' | 'equipamentos-pdf' | 'codigo-manual'
  codigoPeca: string
  pecasManuais: Array<{ codigo: string; quantia: number }>
}

export function emptyCriacaoChecklistItemForm(tipo = 'Manutencao'): CriacaoChecklistItemForm {
  return {
    tipo,
    descricaoTrabalho: '',
    necessitaPecas: false,
    codigoPeca: '',
    pecasManuais: [],
  }
}

export function itemTrabalhoCriacaoToForm(item: ItemTrabalhoCriacao): CriacaoChecklistItemForm {
  return {
    tipo: item.tipo,
    descricaoTrabalho: item.descricaoTrabalho,
    necessitaPecas: item.necessitaPecas,
    origemPecas: item.origemPecas,
    codigoPeca: item.codigoPeca || '',
    pecasManuais: item.pecasManuais?.length ? item.pecasManuais : [{ codigo: '', quantia: 1 }],
  }
}
