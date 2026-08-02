import type { RelatorioEquipamentoRef } from './relatorioServicoEquipamentos'
import type { PecaSubstituicao } from './relatorioEspecialShared'

export const RELATORIOS_ESPECIAIS_STORAGE_KEY = 'nonato-relatorios-especiais'
export const MAX_EQUIPAMENTOS_RELATORIO_ESPECIAL_MES = 11
/** Máximo de equipamentos diferentes com horas no mesmo dia */
export const MAX_EQUIPAMENTOS_RELATORIO_ESPECIAL_DIA = 4
/** Máximo de linhas de horário no mesmo dia (permite várias sessões no mesmo equipamento) */
export const MAX_LINHAS_HORAS_RELATORIO_ESPECIAL_DIA = 12

export type HorasEquipamentoDia = {
  equipamentoUid: string
  horasInicio: string
  horasFim: string
  horasDuracao: string
}

export type DiaTrabalhoEspecial = {
  id: string
  data: string
  idaHora: string
  idaChegada: string
  idaDuracao: string
  retornoSaida: string
  retornoChegada: string
  retornoDuracao: string
  kmIda: string
  kmRetorno: string
  kmTotal: string
  pausa: string
  tempoPausa?: string
  descricaoTrabalho: string
  /** Até 4 equipamentos com horas neste dia */
  horasPorEquipamento: HorasEquipamentoDia[]
}

export type FechamentoEquipamentoEspecial = {
  equipamentoUid: string
  horasTotal: string
  fechadoEm: string
}

export type FechamentoRelatorioEspecial = {
  porEquipamento: FechamentoEquipamentoEspecial[]
  totalGeral?: { horasTotal: string; fechadoEm: string }
}

export type RelatorioEspecial = {
  id: string
  numero: string
  tecnico: string
  cliente: string
  cidade: string
  telefone: string
  data: string
  tipoServico: string
  equipamentos: RelatorioEquipamentoRef[]
  diasTrabalho: DiaTrabalhoEspecial[]
  horasTrabalho: string
  horasPorEquipamentoResumo: Record<string, string>
  kmsPercorridos: string
  horasViagem: string
  servicoConcluido: boolean
  retornoNecessario: boolean
  entregaDocumentacao: boolean
  liberacaoProducao: boolean
  instrucaoFuncionarios: boolean
  necessarioTrocaPecas: boolean
  pecasInstaladasSubstituidas: boolean
  observacoes: string
  pontosAberto: string
  pecasSubstituicao: PecaSubstituicao[]
  pecasInstaladas: PecaSubstituicao[]
  clienteId?: string
  assinaturaCliente?: string
  dataAssinaturaCliente?: string
  fechamento?: FechamentoRelatorioEspecial
}

export function criarHorasEquipamentoDiaVazio(equipamentoUid = ''): HorasEquipamentoDia {
  return { equipamentoUid, horasInicio: '', horasFim: '', horasDuracao: '' }
}

export function criarDiaTrabalhoEspecialVazio(data = ''): DiaTrabalhoEspecial {
  return {
    id: `dia-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    data,
    idaHora: '',
    idaChegada: '',
    idaDuracao: '',
    retornoSaida: '',
    retornoChegada: '',
    retornoDuracao: '',
    kmIda: '',
    kmRetorno: '',
    kmTotal: '',
    pausa: '',
    tempoPausa: '',
    descricaoTrabalho: '',
    horasPorEquipamento: [criarHorasEquipamentoDiaVazio()],
  }
}

export function criarRelatorioEspecialVazio(): RelatorioEspecial {
  const hoje = new Date().toISOString().split('T')[0]
  return {
    id: `re-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    numero: '',
    tecnico: '',
    cliente: '',
    cidade: '',
    telefone: '',
    data: hoje,
    tipoServico: '',
    equipamentos: [],
    diasTrabalho: [],
    horasTrabalho: '0:00',
    horasPorEquipamentoResumo: {},
    kmsPercorridos: '0',
    horasViagem: '0:00',
    servicoConcluido: false,
    retornoNecessario: false,
    entregaDocumentacao: false,
    liberacaoProducao: false,
    instrucaoFuncionarios: false,
    necessarioTrocaPecas: false,
    pecasInstaladasSubstituidas: false,
    observacoes: '',
    pontosAberto: '',
    pecasSubstituicao: [],
    pecasInstaladas: [],
  }
}
