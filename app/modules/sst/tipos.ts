/** Documento devolvido pelo cliente (PDF/imagem), em base64 — também replicado na ficha do cliente quando há vínculo */
export type SolicitacaoDocDevolvido = {
  id: string
  nome: string
  tipo: string
  dados: string
  dataUpload: string
}

/** Cópia do documento devolvido guardada na ficha do cliente cadastrado */
export type SolicitacaoDocDevolvidoCliente = SolicitacaoDocDevolvido & { solicitacaoServicoId: string }

/** Solicitação de Serviço Técnico — formulário enviado ao cliente */
export type SolicitacaoServicoTecnico = {
  id: string
  /** Cliente cadastrado (opcional) — anexos devolvidos são também guardados na ficha deste cliente */
  clienteId?: string
  nomeCliente: string
  /** NIF / VAT / identificação fiscal (preenchido a partir do cadastro do cliente quando existir) */
  identificacaoFiscal?: string
  /** E-mail de contacto na solicitação */
  emailContato?: string
  departamento?: string
  /** Tipo de serviço requisitado (ex.: reparação, manutenção) — distinto do tipo de equipamento */
  tipoServico?: string
  /** Local onde o serviço é necessário */
  localServico?: string
  /** Preferência de horário (modelo NSA) */
  horarioPreferido?: '' | 'manha' | 'tarde' | 'dia' | 'noite' | 'livre'
  /** Referência ao equipamento escolhido na lista do cliente: `id:…` ou `idx:n` */
  equipamentoClienteChave?: string
  tipoEquipamento: string
  marca: string
  modelo: string
  numeroSerie: string
  problemasApresentados: string
  endereco: string
  telefone: string
  responsavel: string
  assinaturaCliente?: string
  dataAssinaturaCliente?: string
  nivelUrgencia?: 'baixa' | 'media' | 'alta' | 'critica'
  dataCriacao: string
  dataRecebimento?: string
  documentoDevolvido?: SolicitacaoDocDevolvido
}

export type SolicitacaoServicoTecnicoFormState = Omit<SolicitacaoServicoTecnico, 'id' | 'dataCriacao'>

export type EquipamentoClienteSstLike = {
  id?: string
  tipoEquipamento?: string
  marca?: string
  modelo?: string
  numeroSerie?: string
}

export type ClienteSstLike = {
  id: string
  nomeEmpresa?: string
  morada?: string
  codigoPostal?: string
  telefones?: string
  email?: string
  numeroContribuicaoFiscal?: string
  contato?: string
  equipamentos?: EquipamentoClienteSstLike[]
}
