/**
 * Lógica inteligente para Protocolos de Serviço — completude, histórico, templates e filtros.
 */

export type {
  ProtocoloEstadoAcao,
  ProtocoloBlocoMin,
  ProtocoloServicoStatus,
} from '../modules/protocolo'
export { newProtocoloBlocoId, ensureProtocoloBlocosIds } from '../modules/protocolo'

import type { ProtocoloBlocoMin, ProtocoloServicoStatus } from '../modules/protocolo'
import type { ProtocoloServicoMin } from '../modules/protocolo/intelFiltro'

export type {
  ProtocoloIntelFiltroChip,
  ProtocoloCondicaoSimNao,
  ProtocoloFormMin,
  ProtocoloServicoMin,
  ProtocoloCompletudeItem,
} from '../modules/protocolo/intelFiltro'
export {
  PROTOCOLO_FILTRO_CHIPS,
  protocoloTemImagens,
  protocoloTemPecas,
  protocoloIdentificacaoOk,
  protocoloConteudoOk,
  protocoloEstaIncompleto,
  avaliarCompletudeProtocolo,
  aplicarFiltroInteligenteChip,
} from '../modules/protocolo/intelFiltro'

export type ProtocoloTemplateId = 'diagnostico' | 'antes_depois' | 'intervencao' | 'conclusao'

/** Histórico mais recente primeiro; opcionalmente só do mesmo equipamento (série). */
export function historicoProtocolosCliente<T extends ProtocoloServicoMin>(
  todos: T[],
  clienteId: string,
  equipamentoNumeroSerie?: string
): T[] {
  if (!clienteId?.trim()) return []
  const serie = (equipamentoNumeroSerie || '').trim()
  return todos
    .filter((p) => {
      if (p.clienteId !== clienteId) return false
      if (!serie) return true
      return (p.equipamentoNumeroSerie || '').trim() === serie
    })
    .slice()
    .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime())
}

/** Códigos de peça mais frequentes no histórico do cliente/equipamento. */
export function pecasMaisUsadasHistorico(
  todos: ProtocoloServicoMin[],
  clienteId: string,
  equipamentoNumeroSerie?: string,
  limit = 8
): string[] {
  const hist = historicoProtocolosCliente(todos, clienteId, equipamentoNumeroSerie)
  const freq = new Map<string, number>()
  for (const p of hist) {
    for (const raw of p.pecasTrocadasCodigos || []) {
      const c = String(raw || '').trim()
      if (!c) continue
      freq.set(c, (freq.get(c) || 0) + 1)
    }
  }
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([c]) => c)
}

export { emptyProtocoloServicoForm as protocoloFormVazio, protocoloServicoToForm as formRascunhoDeProtocolo } from '../modules/protocolo'

type TemplateDef = {
  id: ProtocoloTemplateId
  textoInicial?: string
  blocos: Array<Omit<ProtocoloBlocoMin, 'id'> & { tipo: 'texto' | 'imagens' | 'acao' }>
}

const TEMPLATES: Record<ProtocoloTemplateId, TemplateDef> = {
  diagnostico: {
    id: 'diagnostico',
    textoInicial: 'Motivo da visita e estado inicial observado no local.',
    blocos: [
      {
        tipo: 'acao',
        titulo: 'Diagnóstico inicial',
        texto: 'Sintomas reportados, medições e hipótese técnica.',
        imagens: [],
        ordemConteudo: 'texto_primeiro',
      },
      {
        tipo: 'imagens',
        titulo: 'Registo fotográfico',
        imagens: [],
      },
    ],
  },
  antes_depois: {
    id: 'antes_depois',
    blocos: [
      { tipo: 'imagens', titulo: 'Antes da intervenção', imagens: [] },
      { tipo: 'acao', titulo: 'Intervenção realizada', texto: 'Descrição do trabalho executado.', imagens: [], ordemConteudo: 'texto_primeiro' },
      { tipo: 'imagens', titulo: 'Depois da intervenção', imagens: [] },
    ],
  },
  intervencao: {
    id: 'intervencao',
    textoInicial: 'Resumo da intervenção técnica no equipamento/situação descrita.',
    blocos: [
      { tipo: 'texto', titulo: 'Procedimento', texto: 'Passos executados, ferramentas e tempo de paragem.' },
      { tipo: 'texto', titulo: 'Resultado', texto: 'Estado final, testes realizados e observações.' },
      { tipo: 'acao', titulo: 'Evidência visual', texto: '', imagens: [], ordemConteudo: 'imagens_primeiro' },
    ],
  },
  conclusao: {
    id: 'conclusao',
    blocos: [
      { tipo: 'texto', titulo: 'Conclusão', texto: 'Serviço concluído com sucesso. Equipamento operacional.' },
      { tipo: 'texto', titulo: 'Recomendações', texto: 'Manutenção preventiva sugerida e próximos passos.' },
    ],
  },
}

export function blocosDeTemplate(
  templateId: ProtocoloTemplateId,
  newId: () => string
): { textoInicial?: string; blocos: ProtocoloBlocoMin[] } {
  const t = TEMPLATES[templateId]
  if (!t) return { blocos: [] }
  return {
    textoInicial: t.textoInicial,
    blocos: t.blocos.map((b) => ({ ...b, id: newId() })),
  }
}

export const PROTOCOLO_TEMPLATE_IDS: ProtocoloTemplateId[] = ['diagnostico', 'antes_depois', 'intervencao', 'conclusao']

export type RelatorioServicoMin = {
  id: string
  numero?: string
  cliente?: string
  clienteId?: string
  numeroMaquina?: string
  equipamentoId?: string
  data?: string
  tecnico?: string
}

/** Relatórios de serviço do mesmo cliente (e equipamento, se indicado), mais recentes primeiro. */
export function relatoriosServicoParaProtocolo(
  relatorios: RelatorioServicoMin[],
  clienteId: string,
  clienteNome: string,
  equipamentoNumeroSerie?: string
): RelatorioServicoMin[] {
  const cid = (clienteId || '').trim()
  const nome = (clienteNome || '').trim().toLowerCase()
  const serie = (equipamentoNumeroSerie || '').trim()
  if (!cid && !nome) return []

  const hits = relatorios.filter((r) => {
    const matchCliente =
      (cid && (r.clienteId || '').trim() === cid) ||
      (nome && (r.cliente || '').trim().toLowerCase() === nome)
    if (!matchCliente) return false
    if (!serie) return true
    const sn = (r.numeroMaquina || '').trim()
    const eqId = (r.equipamentoId || '').trim()
    return sn === serie || eqId === serie
  })

  return hits.slice().sort((a, b) => {
    const ta = new Date(a.data || 0).getTime()
    const tb = new Date(b.data || 0).getTime()
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta)
  })
}

/** Sugere o relatório mais provável (mesmo cliente + série, ou o mais recente do cliente). */
export function sugerirRelatorioServicoId(
  relatorios: RelatorioServicoMin[],
  clienteId: string,
  clienteNome: string,
  equipamentoNumeroSerie?: string,
  atual?: string
): string {
  if (atual?.trim()) return atual.trim()
  const lista = relatoriosServicoParaProtocolo(relatorios, clienteId, clienteNome, equipamentoNumeroSerie)
  return lista[0]?.id || ''
}

export function normalizeProtocoloStatus(p: { status?: string }): ProtocoloServicoStatus {
  return p.status === 'executado_enviado' ? 'executado_enviado' : 'em_execucao'
}

export function protocoloEstaEmExecucao(p: { status?: string }): boolean {
  return normalizeProtocoloStatus(p) === 'em_execucao'
}

export function protocoloEstaExecutadoEnviado(p: { status?: string }): boolean {
  return normalizeProtocoloStatus(p) === 'executado_enviado'
}

export function dataChaveArquivoProtocolo(p: { dataConclusao?: string; dataCriacao?: string }): string {
  const raw = p.dataConclusao || p.dataCriacao || ''
  const t = new Date(raw).getTime()
  if (!raw || Number.isNaN(t)) return '—'
  return new Date(t).toISOString().slice(0, 10)
}

export type ProtocoloArquivoItem = {
  id: string
  clienteId: string
  dataCriacao: string
  status?: ProtocoloServicoStatus | string
  dataConclusao?: string
  enviadoVia?: 'email' | 'whatsapp' | 'manual'
}

export type GrupoProtocolosExecutadosCliente<T extends ProtocoloArquivoItem = ProtocoloArquivoItem> = {
  clienteId: string
  nomeCliente: string
  porData: Array<{ dataKey: string; itens: T[] }>
}

/** Arquivo: agrupa protocolos concluídos/enviados por cliente e depois por data. */
export function agruparProtocolosExecutadosPorClienteEData<T extends ProtocoloArquivoItem>(
  lista: T[],
  nomeClienteFn: (clienteId: string) => string
): GrupoProtocolosExecutadosCliente<T>[] {
  const exec = lista.filter((p) => p && protocoloEstaExecutadoEnviado(p))
  const mapCliente = new Map<string, T[]>()
  for (const p of exec) {
    if (!p?.id) continue
    const id = p.clienteId || '__sem_cliente__'
    if (!mapCliente.has(id)) mapCliente.set(id, [])
    mapCliente.get(id)!.push(p)
  }
  return Array.from(mapCliente.entries())
    .sort((a, b) => {
      const na = a[0] === '__sem_cliente__' ? '\uffff' : nomeClienteFn(a[0])
      const nb = b[0] === '__sem_cliente__' ? '\uffff' : nomeClienteFn(b[0])
      return na.localeCompare(nb, undefined, { sensitivity: 'base' })
    })
    .map(([clienteId, itens]) => {
      const mapData = new Map<string, T[]>()
      for (const p of itens) {
        const dk = dataChaveArquivoProtocolo(p)
        if (!mapData.has(dk)) mapData.set(dk, [])
        mapData.get(dk)!.push(p)
      }
      const porData = Array.from(mapData.entries())
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([dataKey, grupoItens]) => ({
          dataKey,
          itens: grupoItens.slice().sort((x, y) => new Date(y.dataConclusao || y.dataCriacao).getTime() - new Date(x.dataConclusao || x.dataCriacao).getTime()),
        }))
      return {
        clienteId,
        nomeCliente: clienteId === '__sem_cliente__' ? '—' : nomeClienteFn(clienteId),
        porData,
      }
    })
}
