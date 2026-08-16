/** Tipos canónicos de checklist (templates, grupos, montagem / geração). */

export type ChecklistItemTemplate = {
  id: string
  texto: string
}

export type ChecklistTemplate = {
  id: string
  nome: string
  descricao?: string
  itens: ChecklistItemTemplate[]
  dataCriacao: string
}

export type ManutencaoChecklist = {
  id: string
  nome: string
  avaliacaoFeitaVisual: boolean
  testeMecanico: boolean
  testeEletrico: boolean
  testeOperacional: boolean
  pecas: Array<{
    pecaId: string
    quantidade?: number
  }>
  dataCriacao: string
}

/** Item adicionado na Criação de Checklist por Grupos: manutenção ou outro, com opção de peças */
export type ItemTrabalhoCriacao = {
  id: string
  tipo: string
  descricaoTrabalho: string
  necessitaPecas: boolean
  origemPecas?: 'biblioteca' | 'equipamentos-pdf' | 'codigo-manual'
  codigoPeca?: string
  pecasManuais?: Array<{ codigo: string; quantia: number }>
  dataCriacao: string
  /** Quando origemPecas === 'equipamentos-pdf': equipamento escolhido no armazém */
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
  /** Opcional: tipo/modelo dentro da família (ex: HPP 250 dentro de Seccionadora) */
  parenteId?: string
  tipo: 'basico' | 'equipamentos-aprovados' | 'verificacao-geral-entrega'
  imagem?: string
  trabalhosASeremExecutados?: string
  manutencoes: ManutencaoChecklist[]
  /** Itens adicionados na parte inferior (Adicionar manutenção ou outro) */
  itensTrabalho?: ItemTrabalhoCriacao[]
  /** Opções criadas pelo utilizador (ex: Manutenção, Inspeção) para depois selecionar em cada trabalho */
  opcoesTipo?: string[]
  dataCriacao: string
}

export type ManutencaoFormularioHorario = {
  tipo: 'saida' | 'parada' | 'retoma' | 'almoco' | 'inicio' | 'fim'
  horario: string
  motivo?: string
  tecnico?: string
}

export type ManutencaoFormularioHistoricoTecnico = {
  tecnico: string
  inicioExecucao: string
  fimExecucao?: string
  tempoIndividual: string
}

export type ManutencaoFormularioObservacao = {
  tecnico: string
  observacao: string
  data: string
}

/** Manutenção no formulário gerado para técnicos (campos de execução). */
export type ManutencaoFormularioChecklist = ManutencaoChecklist & {
  inicioExecucao: string
  tecnicoExecucao: string
  tecnicoAtual: string
  statusConclusao: 'pendente' | 'concluido'
  tecnicoConclusao: string
  dataConclusao: string
  historicoTecnicos: ManutencaoFormularioHistoricoTecnico[]
  horarios: ManutencaoFormularioHorario[]
  observacoes: ManutencaoFormularioObservacao[]
  tempoInicio: string
  tempoFim: string
  tempoTotal: string
  tempoIndividual: string
}

export type PecaMontagemChecklist = {
  codigo: string
  nome?: string
  quantidade: number
}

export type PecaPorGrupoVisualizacao = {
  grupoId: string
  numeroGrupo: string
  nomeGrupo: string
  pecas: PecaMontagemChecklist[]
}

export type GrupoComManutencoesFormulario = {
  g: GrupoChecklist
  manutencoes: ManutencaoFormularioChecklist[]
}

/** Equipamento mínimo para gerar checklist (sem importar RelatorioServico/Cliente). */
export type EquipamentoChecklistLike = {
  id: string
  tipoEquipamento: string
  modelo: string
  marca: string
  numeroSerie: string
  familia?: string
  ano?: string | number
}

/** Técnico mínimo para gerar checklist. */
export type TecnicoChecklistLike = {
  id?: string
  name?: string
  type?: string
}

export type GrupoChecklistGerado = {
  grupoId: string
  numeroGrupo: string
  nomeGrupo: string
  familia: string
  tipo: GrupoChecklist['tipo']
  manutencoes: ManutencaoFormularioChecklist[]
}

/** Shape do `novoChecklist` gravado em formulários para técnicos. */
export type ChecklistGeradoRecord = {
  id: string
  tipo: 'checklist-gerado'
  equipamentoId: string
  equipamento: {
    id: string
    tipoEquipamento: string
    modelo: string
    marca: string
    numeroSerie: string
    familia?: string
    ano?: string | number
  }
  data: string
  tecnicoResponsavel: string
  tecnicoNome: string
  tecnicoTipo: string
  grupos: GrupoChecklistGerado[]
  manutencoesSelecionadas: string[]
  dataCriacao: string
  status: 'salvo' | 'gerado' | 'concluido'
  pecasPorGrupoVisualizacao: PecaPorGrupoVisualizacao[]
  dadosBloqueados: {
    equipamento: EquipamentoChecklistLike
    data: string
    tecnicoResponsavel: string
    tecnicoNome: string
    grupos: GrupoChecklistGerado[]
  }
}

/** Shape mínimo de peça solicitada ao armazém a partir do checklist gerado. */
export type PecaSolicitadaArmazemFromChecklist = {
  id: string
  mensagemId: string
  checklistId: string
  equipamentoId: string
  equipamentoNumeroSerie?: string
  nomeGrupo?: string
  numeroGrupo?: string
  nomeSolicitante: string
  nomeGestorAprovador: string
  pecasSolicitadas: Array<{ codigo?: string; nome?: string; quantidade?: number }>
  dataEnvio: string
}
