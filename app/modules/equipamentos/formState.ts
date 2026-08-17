/** Formulário de equipamentos do armazém — tipos, estado vazio e mapeamento. */

export type HistoricoEquipamento = {
  id: string
  data: string
  tipo: 'manutencao' | 'reparo' | 'inspecao' | 'transferencia' | 'baixa' | 'outro'
  descricao: string
  responsavel?: string
  observacoes?: string
}

export type ItemIncluso = {
  id: string
  nome: string
  imagem?: string
}

/** Parte de equipamento composto (quando não é uma só parte). */
export type PartEquipamento = {
  ordem: number
  tipoId: 'geral' | 'especifico'
  id?: string
  numeroSerieFabricante?: string
}

export type Equipamento = {
  id: string
  tipoEquipamento: string
  modelo: string
  marca: string
  numeroSerie: string
  familia: string
  grupo: string
  ano?: string
  /** Peso do equipamento (ex: "10 kg") */
  peso?: string
  /** true = uma só parte; false = composto por várias partes */
  umaParteSo?: boolean
  /** Número de partes (quando umaParteSo = false) */
  quantidadePartes?: number
  /** Partes do equipamento (quando umaParteSo = false) */
  partes?: PartEquipamento[]
  photo?: string
  coverPhoto?: string
  photoLibrary?: string[]
  manualPdf?: string
  documentosPdf?: string[]
  itemsIncluded?: ItemIncluso[]
  historico?: HistoricoEquipamento[]
  status?: 'ativo' | 'baixado'
  dataBaixa?: string
  /** Ex.: vendido — baixa automática quando o mesmo ID aparece num relatório de cliente */
  motivoBaixa?: string
  /** ID do modelo em Manuais e Informações Técnicas (Família > Grupo > Modelo) */
  modeloManuaisId?: string
}

export type EquipamentoFormState = {
  id: string
  tipoEquipamento: string
  modelo: string
  marca: string
  numeroSerie: string
  familia: string
  grupo: string
  peso: string
  umaParteSo: boolean
  quantidadePartes: number
  partes: PartEquipamento[]
  photo: string
  coverPhoto: string
  photoLibrary: string[]
  manualPdf: string
  documentosPdf: string[]
  itemsIncluded: ItemIncluso[]
  historico: HistoricoEquipamento[]
  modeloManuaisId: string
}

/** Partes vazias com ordem 1..qtd. */
export function buildPartesPadraoEquipamento(qtd: number): PartEquipamento[] {
  const n = Math.max(1, Math.min(99, Math.floor(qtd) || 1))
  return Array.from({ length: n }, (_, i) => ({
    ordem: i + 1,
    tipoId: 'geral' as const,
    numeroSerieFabricante: '',
  }))
}

/** Redimensiona a lista de partes preservando as existentes. */
export function resizePartesEquipamento(
  partesAtual: PartEquipamento[] | undefined,
  qtd: number
): PartEquipamento[] {
  const n = Math.max(1, Math.min(99, Math.floor(qtd) || 1))
  const prev = partesAtual || []
  return Array.from({ length: n }, (_, i) =>
    prev[i]
      ? { ...prev[i], ordem: i + 1 }
      : { ordem: i + 1, tipoId: 'geral' as const, numeroSerieFabricante: '' }
  )
}

export function createEmptyEquipamentoForm(): EquipamentoFormState {
  return {
    id: '',
    tipoEquipamento: '',
    modelo: '',
    marca: '',
    numeroSerie: '',
    familia: '',
    grupo: '',
    peso: '',
    umaParteSo: true,
    quantidadePartes: 1,
    partes: [],
    photo: '',
    coverPhoto: '',
    photoLibrary: [],
    manualPdf: '',
    documentosPdf: [],
    itemsIncluded: [],
    historico: [],
    modeloManuaisId: '',
  }
}

export function equipamentoToFormState(equipamento: Equipamento): EquipamentoFormState {
  const qtd = Math.max(1, equipamento.quantidadePartes ?? (equipamento.partes?.length ?? 1))
  const partes =
    equipamento.partes && equipamento.partes.length > 0
      ? equipamento.partes
      : buildPartesPadraoEquipamento(qtd)
  return {
    id: equipamento.id,
    tipoEquipamento: equipamento.tipoEquipamento,
    modelo: equipamento.modelo,
    marca: equipamento.marca,
    numeroSerie: equipamento.numeroSerie,
    familia: equipamento.familia,
    grupo: equipamento.grupo,
    peso: equipamento.peso ?? '',
    umaParteSo: equipamento.umaParteSo ?? true,
    quantidadePartes: qtd,
    partes,
    photo: equipamento.photo || '',
    coverPhoto: equipamento.coverPhoto || '',
    photoLibrary: equipamento.photoLibrary || [],
    manualPdf: equipamento.manualPdf || '',
    documentosPdf: equipamento.documentosPdf || [],
    itemsIncluded: equipamento.itemsIncluded || [],
    historico: equipamento.historico || [],
    modeloManuaisId: equipamento.modeloManuaisId || '',
  }
}
