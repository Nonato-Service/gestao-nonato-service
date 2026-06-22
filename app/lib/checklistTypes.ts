export type ItemTrabalhoCriacao = {
  id: string
  tipo: string
  descricaoTrabalho: string
  necessitaPecas: boolean
  origemPecas?: 'biblioteca' | 'equipamentos-pdf' | 'codigo-manual'
  codigoPeca?: string
  pecasManuais?: Array<{ codigo: string; quantia: number }>
  dataCriacao: string
  equipamentoPdfId?: string
  equipamentoPdfUrl?: string
}

export type ParenteChecklist = {
  id: string
  nome: string
  familia: string
  imagem?: string
}

export type GrupoChecklist = {
  id: string
  numeroGrupo: string
  nomeGrupo: string
  familia: string
  parenteId?: string
  tipo: 'basico' | 'equipamentos-aprovados' | 'verificacao-geral-entrega'
  imagem?: string
  trabalhosASeremExecutados?: string
  manutencoes: unknown[]
  itensTrabalho?: ItemTrabalhoCriacao[]
  opcoesTipo?: string[]
  dataCriacao: string
}
