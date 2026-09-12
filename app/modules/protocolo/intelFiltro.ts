/** Filtro e completude do protocolo — tipos e funções puras, sem I/O. */

import type { ProtocoloBlocoMin, ProtocoloServicoStatus } from './tipos'

export type ProtocoloIntelFiltroChip = 'todos' | 'ultimos7d' | 'com_fotos' | 'com_pecas' | 'incompletos'

export type ProtocoloCondicaoSimNao = 'sim' | 'nao' | ''

export type ProtocoloFormMin = {
  clienteId: string
  equipamentoNumeroSerie: string
  situacaoDescricao: string
  textoInicial: string
  blocos: ProtocoloBlocoMin[]
  pecasTrocadasCodigos: string[]
  pdfModelo: number
  /** Condição geral do equipamento após o serviço (ex.: «Boa condição»). */
  condicaoGeral?: string
  ativoSeguroUso?: ProtocoloCondicaoSimNao
  manutencaoNecessaria?: ProtocoloCondicaoSimNao
  observacaoCondicoes?: string
}

export type ProtocoloServicoMin = ProtocoloFormMin & {
  id: string
  dataCriacao: string
  situacaoDescricao?: string
  status?: ProtocoloServicoStatus
  dataConclusao?: string
  enviadoVia?: 'email' | 'whatsapp' | 'manual'
}

export type ProtocoloCompletudeItem = {
  id: string
  ok: boolean
  peso: number
}

export const PROTOCOLO_FILTRO_CHIPS: ProtocoloIntelFiltroChip[] = [
  'todos',
  'ultimos7d',
  'com_fotos',
  'com_pecas',
  'incompletos',
]

const MS_7_DIAS = 7 * 24 * 60 * 60 * 1000

export function protocoloTemImagens(p: { blocos?: ProtocoloBlocoMin[] }): boolean {
  return (p.blocos || []).some(
    (b) =>
      !!b &&
      (b.tipo === 'imagens' || b.tipo === 'acao') &&
      Array.isArray(b.imagens) &&
      b.imagens.some((src) => String(src || '').trim().length > 0)
  )
}

export function protocoloTemPecas(p: { pecasTrocadasCodigos?: string[] }): boolean {
  return (p.pecasTrocadasCodigos || []).some((c) => String(c || '').trim().length > 0)
}

export function protocoloIdentificacaoOk(p: ProtocoloFormMin): boolean {
  if (!p.clienteId?.trim()) return false
  const temEq = Boolean(p.equipamentoNumeroSerie?.trim())
  const temSit = Boolean((p.situacaoDescricao || '').trim())
  return temEq || temSit
}

function protocoloBlocoTemImagem(b: ProtocoloBlocoMin): boolean {
  return Array.isArray(b?.imagens) && b.imagens.some((s) => String(s || '').trim().length > 0)
}

export function protocoloConteudoOk(p: ProtocoloFormMin): boolean {
  const textoIni = Boolean((p.textoInicial || '').trim())
  const blocosComDado = (p.blocos || []).some((b) => {
    if (!b || typeof b !== 'object') return false
    if (b.tipo === 'texto') return Boolean((b.texto || '').trim())
    if (b.tipo === 'imagens') return protocoloBlocoTemImagem(b)
    if (b.tipo === 'acao') return Boolean((b.texto || '').trim()) || protocoloBlocoTemImagem(b)
    return false
  })
  return textoIni || blocosComDado
}

/** Protocolo guardado sem conteúdo narrativo ou imagens — útil para filtro «incompletos». */
export function protocoloEstaIncompleto(p: ProtocoloServicoMin): boolean {
  return !protocoloConteudoOk(p)
}

export function avaliarCompletudeProtocolo(form: ProtocoloFormMin): {
  percent: number
  itens: ProtocoloCompletudeItem[]
  pronto: boolean
} {
  const itens: ProtocoloCompletudeItem[] = [
    { id: 'cliente', ok: Boolean(form.clienteId?.trim()), peso: 20 },
    { id: 'ident', ok: protocoloIdentificacaoOk(form), peso: 15 },
    { id: 'conteudo', ok: protocoloConteudoOk(form), peso: 35 },
    { id: 'blocos', ok: (form.blocos || []).length > 0, peso: 15 },
    { id: 'fotos', ok: protocoloTemImagens(form), peso: 10 },
    { id: 'pecas', ok: protocoloTemPecas(form), peso: 5 },
  ]
  const totalPeso = itens.reduce((s, i) => s + i.peso, 0)
  const ganho = itens.filter((i) => i.ok).reduce((s, i) => s + i.peso, 0)
  const percent = totalPeso > 0 ? Math.round((ganho / totalPeso) * 100) : 0
  const pronto = protocoloIdentificacaoOk(form) && protocoloConteudoOk(form)
  return { percent, itens, pronto }
}

export function aplicarFiltroInteligenteChip<T extends ProtocoloServicoMin>(
  lista: T[],
  chip: ProtocoloIntelFiltroChip
): T[] {
  if (chip === 'todos') return lista
  const agora = Date.now()
  return lista.filter((p) => {
    if (!p || typeof p !== 'object') return false
    switch (chip) {
      case 'ultimos7d': {
        const t = new Date(p.dataCriacao).getTime()
        return !Number.isNaN(t) && agora - t <= MS_7_DIAS
      }
      case 'com_fotos':
        return protocoloTemImagens(p)
      case 'com_pecas':
        return protocoloTemPecas(p)
      case 'incompletos':
        return protocoloEstaIncompleto(p)
      default:
        return true
    }
  })
}
