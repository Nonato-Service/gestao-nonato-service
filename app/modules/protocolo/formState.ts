/** Formulário vazio e mapeamento do protocolo de serviço. */

import { ensureProtocoloBlocosIds } from './blocos'
import type { ProtocoloBloco, ProtocoloServico } from './tipos'

export type ProtocoloServicoFormSimNao = 'sim' | 'nao' | ''

export type ProtocoloServicoFormState = {
  clienteId: string
  equipamentoNumeroSerie: string
  situacaoDescricao: string
  textoInicial: string
  blocos: ProtocoloBloco[]
  pecasTrocadasCodigos: string[]
  pdfModelo: number
  relatorioServicoId: string
  condicaoGeral: string
  ativoSeguroUso: ProtocoloServicoFormSimNao
  manutencaoNecessaria: ProtocoloServicoFormSimNao
  observacaoCondicoes: string
}

export function emptyProtocoloServicoForm(pdfPadrao: number): ProtocoloServicoFormState {
  return {
    clienteId: '',
    equipamentoNumeroSerie: '',
    situacaoDescricao: '',
    textoInicial: '',
    blocos: [],
    pecasTrocadasCodigos: [],
    pdfModelo: pdfPadrao,
    relatorioServicoId: '',
    condicaoGeral: '',
    ativoSeguroUso: '',
    manutencaoNecessaria: '',
    observacaoCondicoes: '',
  }
}

export function protocoloServicoToForm(
  p: Partial<ProtocoloServico> & {
    clienteId?: string
    equipamentoNumeroSerie?: string
    textoInicial?: string
    blocos?: ProtocoloBloco[]
    pecasTrocadasCodigos?: string[]
    relatorioServicoId?: string
  },
  pdfPadrao: number
): ProtocoloServicoFormState {
  return {
    clienteId: p.clienteId || '',
    equipamentoNumeroSerie: p.equipamentoNumeroSerie || '',
    situacaoDescricao: typeof p.situacaoDescricao === 'string' ? p.situacaoDescricao : '',
    textoInicial: p.textoInicial || '',
    blocos: ensureProtocoloBlocosIds(p.blocos),
    pecasTrocadasCodigos: [...(p.pecasTrocadasCodigos || [])].map((c) => String(c ?? '')),
    pdfModelo: p.pdfModelo ?? pdfPadrao,
    relatorioServicoId: typeof p.relatorioServicoId === 'string' ? p.relatorioServicoId : '',
    condicaoGeral: typeof p.condicaoGeral === 'string' ? p.condicaoGeral : '',
    ativoSeguroUso: p.ativoSeguroUso === 'sim' || p.ativoSeguroUso === 'nao' ? p.ativoSeguroUso : '',
    manutencaoNecessaria:
      p.manutencaoNecessaria === 'sim' || p.manutencaoNecessaria === 'nao' ? p.manutencaoNecessaria : '',
    observacaoCondicoes: typeof p.observacaoCondicoes === 'string' ? p.observacaoCondicoes : '',
  }
}
