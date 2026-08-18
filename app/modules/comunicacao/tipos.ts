/** Tipos canónicos de mensagens internas e peças solicitadas ao armazém. */

export type MensagemComunicacao = {
  id: string
  remetenteId: string
  remetenteNome: string
  remetenteTipo: 'gestor' | 'tecnico' | 'armazem' | 'sistema'
  remetenteClasse: 'gestor' | 'gestor-industrial' | 'tecnico-interno' | 'tecnico-externo' | 'armazem'
  remetenteArea?: 'assistencia-tecnica' | 'industrial' | 'armazem'
  destinatarioId: string
  destinatarioNome: string
  destinatarioTipo: 'gestor' | 'tecnico' | 'armazem'
  destinatarioClasse:
    | 'gestor'
    | 'gestor-industrial'
    | 'tecnico-interno'
    | 'tecnico-externo'
    | 'armazem'
    | 'todos-gestores'
    | 'todos-tecnicos'
    | 'todos-tecnicos-internos'
    | 'todos-tecnicos-externos'
    | 'todos-gestores-industrial'
  destinatarioTipoTecnico?: 'interno' | 'externo' | 'armazem'
  assunto: string
  mensagem: string
  arquivos?: Array<{ nome: string; tipo: string; dados: string }>
  imagens?: Array<{ nome: string; dados: string }>
  dataEnvio: string
  lida: boolean
  dataLeitura?: string
  tipoMensagem?: 'normal' | 'solicitacao-pecas'
  motivoSolicitacaoPecas?: string
  checklistId?: string
  equipamentoId?: string
  equipamentoNumeroSerie?: string
  pecasSolicitadas?: Array<{
    id?: string
    codigo?: string
    nome?: string
    quantidade?: number
    tecnicoSolicitante?: string
    dataSolicitacao?: string
  }>
  statusSolicitacao?: 'pendente' | 'aceite' | 'enviado-armazem'
  gestorAprovadorId?: string
  gestorAprovadorNome?: string
  dataAceite?: string
  dataEnvioArmazem?: string
}

export type PecaSolicitadaArmazem = {
  id: string
  mensagemId: string
  checklistId: string
  equipamentoId: string
  equipamentoNumeroSerie?: string
  nomeGrupo?: string
  numeroGrupo?: string
  nomeSolicitante: string
  nomeGestorAprovador: string
  motivoSolicitacaoPecas?: string
  pecasSolicitadas: Array<{
    id?: string
    codigo?: string
    nome?: string
    quantidade?: number
    tecnicoSolicitante?: string
    separada?: boolean
  }>
  dataEnvio: string
  enviadoAvisoRetirada?: boolean
}

/** Identidade efectiva do utilizador no hub de comunicação (não-admin). */
export type CommunicationIdentity = {
  tipo: 'gestor' | 'tecnico'
  id: string
  nome: string
  area?: string
  foto: string
  tecnicoTipo?: string
}

/** Subconjunto do login necessário para resolver a identidade de comunicação. */
export type LoginUserComunicacaoLike = {
  isAdmin?: boolean
  email?: string
  name?: string
  linkedProfileType?: string | null
  linkedProfileId?: string | null
}

/** Gestor mínimo para resolução de identidade. */
export type GestorComunicacaoLike = {
  id: string
  name: string
  email?: string
  photo?: string
  area?: string
}

/** Técnico mínimo para resolução de identidade. */
export type TecnicoComunicacaoLike = {
  id: string
  name: string
  email?: string
  photo?: string
  type?: string
}
