import type {
  ChecklistGeradoRecord,
  EquipamentoChecklistLike,
  GrupoChecklist,
  GrupoChecklistGerado,
  GrupoComManutencoesFormulario,
  ManutencaoChecklist,
  ManutencaoFormularioChecklist,
  PecaMontagemChecklist,
  PecaPorGrupoVisualizacao,
  PecaSolicitadaArmazemFromChecklist,
  TecnicoChecklistLike,
} from './tipos'

export function mapManutencaoParaFormulario(m: ManutencaoChecklist): ManutencaoFormularioChecklist {
  return {
    ...m,
    inicioExecucao: '',
    tecnicoExecucao: '',
    tecnicoAtual: '',
    statusConclusao: 'pendente',
    tecnicoConclusao: '',
    dataConclusao: '',
    historicoTecnicos: [],
    horarios: [],
    observacoes: [],
    tempoInicio: '',
    tempoFim: '',
    tempoTotal: '',
    tempoIndividual: '',
  }
}

export type BuildManutencoesDoGrupoOpts = {
  usaMontagemPorFamiliaParente: boolean
  montagemServicosSelecionados: Set<string>
  manutencoesSelecionadas: Set<string>
}

export function buildManutencoesDoGrupo(
  g: GrupoChecklist,
  opts: BuildManutencoesDoGrupoOpts
): ManutencaoFormularioChecklist[] {
  const { usaMontagemPorFamiliaParente, montagemServicosSelecionados, manutencoesSelecionadas } = opts

  if (usaMontagemPorFamiliaParente && g.itensTrabalho && g.itensTrabalho.length > 0) {
    return g.itensTrabalho
      .filter(it => montagemServicosSelecionados.has(`${g.id}-${it.id}`))
      .map(it =>
        mapManutencaoParaFormulario({
          id: it.id,
          nome: it.descricaoTrabalho || it.tipo || '',
          avaliacaoFeitaVisual: false,
          testeMecanico: false,
          testeEletrico: false,
          testeOperacional: false,
          pecas: [],
          dataCriacao: it.dataCriacao || new Date().toISOString(),
        })
      )
  }
  if (usaMontagemPorFamiliaParente) {
    return (g.manutencoes || [])
      .filter(m => montagemServicosSelecionados.has(`${g.id}-${m.id}`))
      .map(m => mapManutencaoParaFormulario(m))
  }
  return (g.manutencoes || [])
    .filter(m => manutencoesSelecionadas.has(`${g.id}-${m.id}`))
    .map(m => mapManutencaoParaFormulario(m))
}

export function buildPecasPorGrupoVisualizacao(
  gruposComSelecao: GrupoComManutencoesFormulario[],
  pecasPorGrupo: Record<string, PecaMontagemChecklist[] | undefined>
): PecaPorGrupoVisualizacao[] {
  return gruposComSelecao
    .filter(({ g }) => (pecasPorGrupo[g.id]?.length ?? 0) > 0)
    .map(({ g }) => ({
      grupoId: g.id,
      numeroGrupo: g.numeroGrupo || '',
      nomeGrupo: g.nomeGrupo || '—',
      pecas: pecasPorGrupo[g.id] || [],
    }))
}

function mapGruposGerados(gruposComSelecao: GrupoComManutencoesFormulario[]): GrupoChecklistGerado[] {
  return gruposComSelecao.map(({ g, manutencoes }) => ({
    grupoId: g.id,
    numeroGrupo: g.numeroGrupo,
    nomeGrupo: g.nomeGrupo,
    familia: g.familia,
    tipo: g.tipo,
    manutencoes,
  }))
}

export type BuildChecklistGeradoRecordInput = {
  checklistId: string
  equipamento: EquipamentoChecklistLike
  data: string
  tecnicoResponsavel: string
  tecnico?: TecnicoChecklistLike | null
  gruposComSelecao: GrupoComManutencoesFormulario[]
  usaMontagemPorFamiliaParente: boolean
  montagemServicosSelecionados: Set<string>
  manutencoesSelecionadas: Set<string>
  pecasPorGrupoVisualizacao: PecaPorGrupoVisualizacao[]
  dataCriacao?: string
}

export function buildChecklistGeradoRecord(input: BuildChecklistGeradoRecordInput): ChecklistGeradoRecord {
  const {
    checklistId,
    equipamento,
    data,
    tecnicoResponsavel,
    tecnico,
    gruposComSelecao,
    usaMontagemPorFamiliaParente,
    montagemServicosSelecionados,
    manutencoesSelecionadas,
    pecasPorGrupoVisualizacao,
    dataCriacao = new Date().toISOString(),
  } = input

  const grupos = mapGruposGerados(gruposComSelecao)
  const tecnicoNome = tecnico?.name || ''
  const tecnicoTipo = tecnico?.type || 'internal'

  return {
    id: checklistId,
    tipo: 'checklist-gerado',
    equipamentoId: equipamento.id,
    equipamento: {
      id: equipamento.id,
      tipoEquipamento: equipamento.tipoEquipamento,
      modelo: equipamento.modelo,
      marca: equipamento.marca,
      numeroSerie: equipamento.numeroSerie,
      familia: equipamento.familia,
      ano: equipamento.ano,
    },
    data,
    tecnicoResponsavel,
    tecnicoNome,
    tecnicoTipo,
    grupos,
    manutencoesSelecionadas: usaMontagemPorFamiliaParente
      ? Array.from(montagemServicosSelecionados)
      : Array.from(manutencoesSelecionadas),
    dataCriacao,
    status: 'gerado',
    pecasPorGrupoVisualizacao,
    dadosBloqueados: {
      equipamento,
      data,
      tecnicoResponsavel,
      tecnicoNome,
      grupos,
    },
  }
}

export type BuildPecasArmazemFromChecklistInput = {
  checklistId: string
  equipamento: EquipamentoChecklistLike
  tecnico?: TecnicoChecklistLike | null
  gruposComSelecao: GrupoComManutencoesFormulario[]
  pecasPorGrupo: Record<string, PecaMontagemChecklist[] | undefined>
  nowMs?: number
  dataEnvio?: string
}

export function buildPecasArmazemFromChecklist(
  input: BuildPecasArmazemFromChecklistInput
): PecaSolicitadaArmazemFromChecklist[] {
  const {
    checklistId,
    equipamento,
    tecnico,
    gruposComSelecao,
    pecasPorGrupo,
    nowMs = Date.now(),
    dataEnvio = new Date(nowMs).toISOString(),
  } = input

  return gruposComSelecao
    .filter(({ g }) => (pecasPorGrupo[g.id]?.length ?? 0) > 0)
    .map(({ g }) => ({
      id: `pecas-armazem-${checklistId}-${g.id}-${nowMs}`,
      mensagemId: '',
      checklistId,
      equipamentoId: equipamento.id,
      equipamentoNumeroSerie: equipamento.numeroSerie,
      nomeGrupo: g.nomeGrupo || '—',
      numeroGrupo: g.numeroGrupo || '',
      nomeSolicitante: tecnico?.name || '',
      nomeGestorAprovador: '-',
      pecasSolicitadas: (pecasPorGrupo[g.id] || []).map(p => ({
        codigo: p.codigo,
        nome: p.nome,
        quantidade: p.quantidade,
      })),
      dataEnvio,
    }))
}
