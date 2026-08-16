/** Tipos canónicos de Protocolo de Serviço (blocos + documento guardado). */

export type ProtocoloEstadoAcao = 'bom' | 'reparar' | 'substituir' | 'nd'

export type ProtocoloBloco = {
  /** Identificador estável por bloco (evita FileReader async gravar no índice errado). */
  id?: string
  tipo: 'texto' | 'imagens' | 'acao'
  /** Cabeçalho desta acção / secção (PDF e formulário). */
  titulo?: string
  texto?: string
  imagens?: string[] // máx. 2, uma ao lado da outra (bloco imagens ou acção)
  /** Apenas `acao`: ordem entre quadro de imagens e balão de texto. */
  ordemConteudo?: 'texto_primeiro' | 'imagens_primeiro'
  /** Apenas `acao`: estado técnico visível no PDF (Bom / Reparar / Substituir / N/D). */
  estadoAcao?: ProtocoloEstadoAcao
}

/** Alias legado usado em PDF / inteligência — mesmo shape estrito. */
export type ProtocoloBlocoMin = ProtocoloBloco

export type ProtocoloServicoStatus = 'em_execucao' | 'executado_enviado'

export type ProtocoloServico = {
  id: string
  clienteId: string
  equipamentoNumeroSerie: string
  /** Quando não há equipamento: descrição da situação ou do serviço (obrigatório se série vazia). */
  situacaoDescricao?: string
  textoInicial: string
  blocos: ProtocoloBloco[]
  pecasTrocadasCodigos: string[]
  dataCriacao: string
  /** 1–12: modelo visual do PDF (impressão / Guardar como PDF) */
  pdfModelo?: number
  /** Relatório de Serviço associado (abrir / rastrear no mesmo atendimento). */
  relatorioServicoId?: string
  /** em_execucao = aberto; executado_enviado = concluído / enviado ao cliente */
  status?: ProtocoloServicoStatus
  dataConclusao?: string
  enviadoVia?: 'email' | 'whatsapp' | 'manual'
  condicaoGeral?: string
  ativoSeguroUso?: 'sim' | 'nao'
  manutencaoNecessaria?: 'sim' | 'nao'
  observacaoCondicoes?: string
}
