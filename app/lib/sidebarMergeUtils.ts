/** Tipos mínimos para merge da barra lateral entre local e servidor. */
export type SidebarButtonMerge = {
  id: string
  order?: number
  name?: string
  action?: string
  group?: string
  translationKey?: string
  customName?: boolean
  [key: string]: unknown
}

/** Funde listas de botões: união por id; campos locais prevalecem (ordem, nomes personalizados). */
export function mergeSidebarButtonsDeferLocal(
  serverList: unknown,
  localList: unknown
): SidebarButtonMerge[] {
  if (!Array.isArray(serverList)) return Array.isArray(localList) ? (localList as SidebarButtonMerge[]) : []
  if (!Array.isArray(localList)) return serverList as SidebarButtonMerge[]

  const server = serverList as SidebarButtonMerge[]
  const local = localList as SidebarButtonMerge[]
  const serverById = new Map(server.filter((b) => b?.id).map((b) => [b.id, b]))
  const seen = new Set<string>()
  const out: SidebarButtonMerge[] = []

  for (const lb of local) {
    if (!lb?.id || seen.has(lb.id)) continue
    seen.add(lb.id)
    const sb = serverById.get(lb.id)
    out.push(sb ? { ...sb, ...lb, id: lb.id } : lb)
  }

  for (const sb of server) {
    if (!sb?.id || seen.has(sb.id)) continue
    seen.add(sb.id)
    out.push(sb)
  }

  return out.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

/** IDs de botões padrão que o programa espera encontrar na barra lateral. */
export const REQUIRED_SIDEBAR_BUTTON_IDS = [
  'gestao-financeira-default',
  'clientes-financeiro-default',
  'comprovantes-despesas-default',
  'pagamentos-contador-default',
  'administrador-default',
  'cadastro-nonato-service-default',
  'ficha-pagamento-transferencia-default',
  'ficha-fatura-cliente-default',
  'gestores-default',
  'familias-grupos-default',
  'familias-grupos-equipamentos-default',
  'equipamentos-default',
  'checklist-group-default',
  'pre-checklist-default',
  'checklist-basico-default',
  'checklist-default',
  'gestao-grupos-checklist-default',
  'ordem-preparacao-default',
  'formularios-checklist-tecnicos-default',
  'verificacao-final-entrega-default',
  'comunicacao-interna-default',
  'mensagens-internas-default',
  'alerta-mensagens-default',
  'mensagens-internas-tecnicos-default',
  'clientes-default',
  'fornecedores-default',
  'relatorio-servico-default',
  'biblioteca-relatorios-default',
  'relatorios-excluidos-clientes-default',
  'biblioteca-pecas-default',
  'solicitacao-servico-tecnico-default',
  'agenda-default',
  'diario-pedidos-dia-default',
  'estado-visual-tecnico-default',
  'informacoes-conhecimento-tecnicos-default',
  'cadastro-servicos-default',
  'fechamento-relatorios-servicos-default',
  'orcamentos-avulso-default',
  'pedido-orcamentos-avulso-default',
  'orcamentos-pecas-especiais-default',
  'orcamento-servico-tecnico-default',
  'registro-despesas-default',
  'mapa-visual-separacao-pecas-default',
  'desmontados-default',
  'gestao-tecnica-default',
  'parceiros-comercial-default',
  'documentacao-relatorios-default',
  'pecas-biblioteca-default',
  'gestao-industrial-default',
  'manuais-informacoes-tecnicas-default',
  'biblia-nonato-service-default',
  'almoxarifado-armazem-default',
] as const

/** Catálogo mínimo para repor botões em falta (mesmos ids/actions do bootstrap). */
export const SIDEBAR_BUTTON_CATALOG: SidebarButtonMerge[] = [
  {
    id: 'gestao-financeira-default',
    name: 'GESTÃO FINANCEIRA',
    action: 'open-gestao-financeira',
    order: 9998,
    translationKey: 'gestaoFinanceiraTitle',
  },
  {
    id: 'clientes-financeiro-default',
    name: 'CLIENTES / FINANCEIRO',
    action: 'open-clientes-financeiro',
    order: 1,
    translationKey: 'clientesFinanceiroTitle',
    group: 'gestao-financeira',
  },
  {
    id: 'comprovantes-despesas-default',
    name: 'REGISTRO DE DESPESAS PAGAS COM O CARTÃO PARA DECLARAÇÃO DE IRS',
    action: 'open-comprovantes-despesas',
    order: 2,
    translationKey: 'comprovantesDespesasTitle',
    group: 'gestao-financeira',
  },
  {
    id: 'pagamentos-contador-default',
    name: 'PAGAMENTOS AO CONTADOR',
    action: 'open-pagamentos-contador',
    order: 3,
    translationKey: 'pagamentosContadorTitle',
    group: 'gestao-financeira',
  },
  {
    id: 'administrador-default',
    name: 'ADMINISTRADOR',
    action: 'open-administrador',
    order: 9999,
    translationKey: 'administrador',
  },
  {
    id: 'cadastro-nonato-service-default',
    name: 'CADASTRO DA NONATO SERVICE',
    action: 'open-cadastro-nonato-service',
    order: 10,
    translationKey: 'cadastroNonatoServiceTitle',
    group: 'empresa-institucional',
  },
  {
    id: 'ficha-pagamento-transferencia-default',
    name: 'FICHA PARA TRANSFERÊNCIA / PAGAMENTO',
    action: 'open-ficha-pagamento-transferencia',
    order: 20,
    translationKey: 'fichaPagamentoTransferenciaTitle',
    group: 'empresa-institucional',
  },
  {
    id: 'ficha-fatura-cliente-default',
    name: 'FICHA PARA O CLIENTE EMITIR FATURA',
    action: 'open-ficha-fatura-cliente',
    order: 21,
    translationKey: 'fichaFaturaClienteTitle',
    group: 'empresa-institucional',
  },
  {
    id: 'gestores-default',
    name: 'CADASTRO DE GESTORES TECNICOS INTERNOS E EXTERNOS',
    action: 'open-gestores',
    order: 1,
    translationKey: 'gestoresTitle',
    group: 'gestao-tecnica',
  },
  {
    id: 'familias-grupos-default',
    name: 'CADASTRO DE FAMÍLIAS E GRUPOS PARA CHECKLIST',
    action: 'open-familias-grupos',
    order: 2,
    translationKey: 'familiasGruposTitle',
    group: 'checklist-group',
  },
  {
    id: 'familias-grupos-equipamentos-default',
    name: 'CADASTRO DE FAMÍLIAS E GRUPOS PARA OS EQUIPAMENTOS',
    action: 'open-familias-grupos-equipamentos',
    order: 2.5,
    translationKey: 'familiasGruposEquipamentosTitle',
    group: 'gestao-industrial',
  },
  {
    id: 'equipamentos-default',
    name: 'CADASTRAR EQUIPAMENTOS E VISUALIZAR EQUIPAMENTOS DO ARMAZÉM',
    action: 'open-equipamentos',
    order: 3,
    translationKey: 'equipamentosTitle',
    group: 'gestao-industrial',
  },
  {
    id: 'checklist-group-default',
    name: 'GESTÃO DOS CHECKLIST',
    action: 'open-checklist-group',
    order: 4,
    translationKey: 'checklistGroupTitle',
  },
  {
    id: 'pre-checklist-default',
    name: 'PRÉ-CHECKLIST',
    action: 'open-pre-checklist',
    order: 5,
    translationKey: 'preChecklistSubTitle',
    group: 'checklist-group',
  },
  {
    id: 'checklist-basico-default',
    name: 'CHECKLIST BÁSICO',
    action: 'open-checklist-basico',
    order: 5.5,
    translationKey: 'checklistBasicoSubTitle',
    group: 'checklist-group',
  },
  {
    id: 'checklist-default',
    name: 'CHECKLIST',
    action: 'open-checklist',
    order: 6,
    translationKey: 'checklistSubTitle',
    group: 'checklist-group',
  },
  {
    id: 'gestao-grupos-checklist-default',
    name: 'GESTÃO DE GRUPOS DE CHECKLIST',
    action: 'open-gestao-grupos-checklist',
    order: 6.5,
    translationKey: 'gestaoGruposChecklistTitle',
    group: 'checklist-group',
  },
  {
    id: 'ordem-preparacao-default',
    name: 'ORDEM DE PREPARAÇÃO',
    action: 'open-ordem-preparacao',
    order: 7,
    translationKey: 'ordemPreparacaoTitle',
    group: 'checklist-group',
  },
  {
    id: 'formularios-checklist-tecnicos-default',
    name: 'FORMULÁRIOS E CHECKLIST PARA TÉCNICOS',
    action: 'open-formularios-checklist-tecnicos',
    order: 7.5,
    translationKey: 'formulariosChecklistTecnicosTitle',
    group: 'checklist-group',
  },
  {
    id: 'verificacao-final-entrega-default',
    name: 'VERIFICAÇÃO FINAL DE ENTREGA',
    action: 'open-verificacao-final-entrega',
    order: 8,
    translationKey: 'verificacaoFinalEntregaTitle',
    group: 'checklist-group',
  },
  {
    id: 'comunicacao-interna-default',
    name: 'COMUNICAÇÃO INTERNA',
    action: 'open-comunicacao-interna',
    order: 8.5,
    translationKey: 'comunicacaoInternaTitle',
    group: 'comunicacao-interna',
  },
  {
    id: 'mensagens-internas-default',
    name: 'MENSAGENS INTERNAS',
    action: 'open-mensagens-internas',
    order: 9,
    translationKey: 'mensagensInternas',
    group: 'comunicacao-interna',
  },
  {
    id: 'alerta-mensagens-default',
    name: 'ALERTA DE MENSAGENS',
    action: 'open-alerta-mensagens',
    order: 9.5,
    translationKey: 'alertaMensagens',
    group: 'comunicacao-interna',
  },
  {
    id: 'mensagens-internas-tecnicos-default',
    name: 'MENSAGENS INTERNAS TÉCNICOS',
    action: 'open-mensagens-internas-tecnicos',
    order: 10,
    translationKey: 'mensagensInternasTecnicos',
    group: 'comunicacao-interna',
  },
  {
    id: 'clientes-default',
    name: 'CADASTRO DE CLIENTES',
    action: 'open-clientes',
    order: 4,
    translationKey: 'clientesTitle',
    group: 'parceiros-comercial',
  },
  {
    id: 'fornecedores-default',
    name: 'FORNECEDORES',
    action: 'open-fornecedores',
    order: 5,
    translationKey: 'fornecedoresTitle',
    group: 'parceiros-comercial',
  },
  {
    id: 'relatorio-servico-default',
    name: 'RELATÓRIO DE SERVIÇO',
    action: 'open-relatorio-servico',
    order: 6,
    translationKey: 'relatorioServicoTitle',
    group: 'documentacao-relatorios',
  },
  {
    id: 'biblioteca-relatorios-default',
    name: 'BIBLIOTECA DE RELATÓRIOS',
    action: 'open-biblioteca-relatorios',
    order: 7,
    translationKey: 'bibliotecaRelatoriosTitle',
    group: 'documentacao-relatorios',
  },
  {
    id: 'relatorios-excluidos-clientes-default',
    name: 'RELATÓRIOS EXCLUÍDOS DOS CLIENTES',
    action: 'open-relatorios-excluidos-clientes',
    order: 7.5,
    translationKey: 'relatoriosExcluidosClientesTitle',
    group: 'documentacao-relatorios',
  },
  {
    id: 'biblioteca-pecas-default',
    name: 'CADASTRO DE PEÇAS E BIBLIOTECA DE PEÇAS',
    action: 'open-biblioteca-hub',
    order: 7,
    translationKey: 'cadastroPecasBibliotecaTitle',
    group: 'pecas-biblioteca',
  },
  {
    id: 'solicitacao-servico-tecnico-default',
    name: 'SOLICITAÇÃO DE SERVIÇO TÉCNICO',
    action: 'open-solicitacao-servico-tecnico',
    order: 30,
    translationKey: 'solicitacaoServicoTecnicoTitle',
    group: 'empresa-institucional',
  },
  {
    id: 'agenda-default',
    name: 'AGENDA TÉCNICA',
    action: 'open-agenda',
    order: 8,
    translationKey: 'agendaTitle',
    group: 'gestao-tecnica',
  },
  {
    id: 'diario-pedidos-dia-default',
    name: 'DIÁRIO DE ANOTAÇÃO',
    action: 'open-diario-pedidos-dia',
    order: 8.5,
    translationKey: 'diarioPedidosTitle',
    group: 'gestao-tecnica',
  },
  {
    id: 'estado-visual-tecnico-default',
    name: 'ESTADO VISUAL DO TÉCNICO',
    action: 'open-estado-visual-tecnico',
    order: 9,
    translationKey: 'estadoVisualTecnico',
    group: 'gestao-tecnica',
  },
  {
    id: 'informacoes-conhecimento-tecnicos-default',
    name: 'INFORMAÇÕES DE CONHECIMENTO DOS TÉCNICOS',
    action: 'open-informacoes-conhecimento-tecnicos',
    order: 9.5,
    translationKey: 'informacoesConhecimentoTecnicosTitle',
    group: 'gestao-tecnica',
  },
  {
    id: 'cadastro-servicos-default',
    name: 'CADASTRO DE SERVIÇOS / VALORES',
    action: 'open-cadastro-servicos',
    order: 11,
    translationKey: 'cadastroServicosTitle',
    group: 'gestao-tecnica',
  },
  {
    id: 'fechamento-relatorios-servicos-default',
    name: 'FECHAMENTO DOS RELATÓRIOS DE SERVIÇOS',
    action: 'open-fechamento-relatorios-servicos',
    order: 11.5,
    translationKey: 'fechamentoRelatoriosServicosTitle',
    group: 'documentacao-relatorios',
  },
  {
    id: 'orcamentos-avulso-default',
    name: 'ORÇAMENTOS AVULSOS',
    action: 'open-orcamentos-avulso',
    order: 12,
    translationKey: 'orcamentosAvulsoTitle',
    group: 'gestao-custos',
  },
  {
    id: 'pedido-orcamentos-avulso-default',
    name: 'PEDIDO DE ORÇAMENTOS AVULSOS',
    action: 'open-pedido-orcamentos-avulso',
    order: 12.5,
    translationKey: 'pedidoOrcamentosAvulsoTitle',
    group: 'gestao-custos',
  },
  {
    id: 'orcamentos-pecas-especiais-default',
    name: 'ORÇAMENTOS DE PEÇAS ESPECIAIS',
    action: 'open-orcamentos-pecas-especiais',
    order: 13,
    translationKey: 'orcamentoPecasEspeciaisTitle',
    group: 'gestao-custos',
  },
  {
    id: 'orcamento-servico-tecnico-default',
    name: 'ORÇAMENTO DE SERVIÇO TÉCNICO',
    action: 'open-orcamento-servico-tecnico',
    order: 13.5,
    translationKey: 'orcamentoServicoTecnicoTitle',
    group: 'gestao-custos',
  },
  {
    id: 'registro-despesas-default',
    name: 'REGISTRO DE DESPESAS',
    action: 'open-registro-despesas',
    order: 14,
    translationKey: 'registroDespesasTitle',
    group: 'gestao-financeira',
  },
  {
    id: 'mapa-visual-separacao-pecas-default',
    name: 'MAPA VISUAL DE SEPARAÇÃO DE PEÇAS',
    action: 'open-mapa-visual-separacao-pecas',
    order: 15,
    translationKey: 'mapaVisualSeparacaoPecasTitle',
    group: 'pecas-biblioteca',
  },
  {
    id: 'desmontados-default',
    name: 'CADASTRO DE GRUPOS DE EQUIPAMENTOS DESMONTADOS',
    action: 'open-desmontados',
    order: 10,
    translationKey: 'desmontadosTitle',
    group: 'gestao-industrial',
  },
  {
    id: 'gestao-tecnica-default',
    name: 'GESTÃO TÉCNICA',
    action: 'open-gestao-tecnica',
    order: 100,
    translationKey: 'gestaoTecnicaTitle',
  },
  {
    id: 'parceiros-comercial-default',
    name: 'CLIENTES E FORNECEDORES',
    action: 'open-parceiros-comercial',
    order: 101,
    translationKey: 'parceirosComercialTitle',
  },
  {
    id: 'documentacao-relatorios-default',
    name: 'DOCUMENTAÇÃO E RELATÓRIOS',
    action: 'open-documentacao-relatorios',
    order: 102,
    translationKey: 'documentacaoRelatoriosTitle',
  },
  {
    id: 'pecas-biblioteca-default',
    name: 'CADASTRO DE PEÇAS E BIBLIOTECA DE PEÇAS',
    action: 'open-pecas-biblioteca',
    order: 103,
    translationKey: 'pecasBibliotecaTitle',
  },
  {
    id: 'gestao-industrial-default',
    name: 'GESTÃO INDUSTRIAL',
    action: 'open-gestao-industrial',
    order: 104,
    translationKey: 'gestaoIndustrialTitle',
  },
  {
    id: 'manuais-informacoes-tecnicas-default',
    name: 'MANUAIS E INFORMAÇÕES TÉCNICAS',
    action: 'open-manuais-informacoes-tecnicas',
    order: 105,
    translationKey: 'manuaisInformacoesTecnicasTitle',
    group: 'manuais-informacoes-tecnicas',
  },
  {
    id: 'biblia-nonato-service-default',
    name: 'BÍBLIA DA NONATO SERVICE',
    action: 'open-biblia-nonato-service',
    order: 106,
    translationKey: 'bibliaNonatoServiceTitle',
    group: 'biblia-nonato-service',
  },
  {
    id: 'almoxarifado-armazem-default',
    name: 'ALMOXARIFADO / ARMAZÉM',
    action: 'open-almoxarifado-armazem',
    order: 107,
    translationKey: 'almoxarifadoArmazemTitle',
    group: 'almoxarifado-armazem',
  },
]

/** Repõe botões em falta a partir do catálogo, preservando ordem e personalizações existentes. */
export function repairSidebarButtonsFromCatalog(buttons: SidebarButtonMerge[]): SidebarButtonMerge[] {
  const merged = mergeSidebarButtonsDeferLocal(SIDEBAR_BUTTON_CATALOG, buttons)
  return merged.map((btn, idx) => ({ ...btn, order: typeof btn.order === 'number' ? btn.order : idx }))
}
