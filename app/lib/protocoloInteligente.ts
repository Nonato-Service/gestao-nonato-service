/**
 * Lógica inteligente para Protocolos de Serviço — completude, histórico, templates e filtros.
 */

export type {
  ProtocoloEstadoAcao,
  ProtocoloBlocoMin,
  ProtocoloServicoStatus,
} from '../modules/protocolo'
export { newProtocoloBlocoId, ensureProtocoloBlocosIds } from '../modules/protocolo'

import type { ProtocoloServicoStatus } from '../modules/protocolo'

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

export type { ProtocoloTemplateId } from '../modules/protocolo/intelTemplates'
export { PROTOCOLO_TEMPLATE_IDS, blocosDeTemplate } from '../modules/protocolo/intelTemplates'

export { historicoProtocolosCliente, pecasMaisUsadasHistorico } from '../modules/protocolo/intelHistorico'

export { emptyProtocoloServicoForm as protocoloFormVazio, protocoloServicoToForm as formRascunhoDeProtocolo } from '../modules/protocolo'

export type { RelatorioServicoMin } from '../modules/protocolo/intelRelatorio'
export { relatoriosServicoParaProtocolo, sugerirRelatorioServicoId } from '../modules/protocolo/intelRelatorio'

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
