/** Tipo canónico do relatório de serviço + formulário vazio. */

import type { DiaTrabalho } from './tipos'
import type { PecaSubstituicao } from './pecaSubstituicao'
import type {
  RelatorioEquipamentoOrigem,
  RelatorioEquipamentoRef,
} from './equipamentoRelatorioForm'

export type RelatorioServico = {
  id: string
  numero: string
  tecnico: string
  cliente: string
  cidade: string
  telefone: string
  data: string
  maquinaModelo: string
  numeroMaquina: string
  tipoServico: string
  diasTrabalho: DiaTrabalho[]
  horasTrabalho: string
  kmsPercorridos: string
  horasViagem: string
  servicoConcluido: boolean
  retornoNecessario: boolean
  entregaDocumentacao: boolean
  liberacaoProducao: boolean
  instrucaoFuncionarios: boolean
  necessarioTrocaPecas: boolean
  /** Peças efetivamente instaladas ou substituídas no serviço (distinto de «necessitam substituição»). */
  pecasInstaladasSubstituidas: boolean
  observacoes: string
  pontosAberto: string
  pecasSubstituicao: PecaSubstituicao[]
  pecasInstaladas: PecaSubstituicao[]
  equipamentoId?: string // cliente: n.º série do equipamento do cliente; armazém: id do equipamento em nonato-equipamentos
  clienteId?: string // Para associar ao cliente
  /** De onde veio o equipamento escolhido no relatório (distinção lógica cliente vs armazém industrial) */
  equipamentoOrigem?: RelatorioEquipamentoOrigem
  /** Até 5 equipamentos no mesmo relatório (IDs, modelos e séries por linha) */
  equipamentos?: RelatorioEquipamentoRef[]
  /** Assinatura do cliente (base64), quando preenchida em tablet/telemóvel */
  assinaturaCliente?: string
  /** Data/hora em que o cliente assinou (ISO) */
  dataAssinaturaCliente?: string
}

/** Estado inicial / limpo do formulário de relatório de serviço. */
export function createEmptyRelatorioServicoForm(
  overrides?: Partial<RelatorioServico>
): RelatorioServico {
  return {
    id: '',
    numero: '',
    tecnico: '',
    cliente: '',
    cidade: '',
    telefone: '',
    data: new Date().toISOString().split('T')[0],
    maquinaModelo: '',
    numeroMaquina: '',
    tipoServico: '',
    diasTrabalho: [],
    horasTrabalho: '',
    kmsPercorridos: '',
    horasViagem: '',
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
    assinaturaCliente: undefined,
    dataAssinaturaCliente: undefined,
    equipamentoOrigem: 'cliente',
    ...overrides,
  }
}
