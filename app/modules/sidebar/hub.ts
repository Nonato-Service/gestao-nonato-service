import type { TabType } from './tipos'

/** Hub pai por defeito quando a aba é aberta pela sidebar (sem hub activo no centro). */
export const TAB_DEFAULT_PARENT_HUB: Partial<Record<TabType, string>> = {
  gestores: 'gestao-tecnica',
  agenda: 'gestao-tecnica',
  'diario-pedidos-dia': 'gestao-tecnica',
  'estado-visual-tecnico': 'gestao-tecnica',
  'informacoes-conhecimento-tecnicos': 'gestao-tecnica',
  'cadastro-servicos': 'gestao-tecnica',
  clientes: 'parceiros-comercial',
  fornecedores: 'parceiros-comercial',
  'relatorio-servico': 'documentacao-relatorios',
  'relatorio-especial': 'documentacao-relatorios',
  'biblioteca-relatorios': 'documentacao-relatorios',
  'relatorios-excluidos-clientes': 'documentacao-relatorios',
  'fechamento-relatorios-servicos': 'documentacao-relatorios',
  'biblioteca-pecas': 'pecas-biblioteca',
  'pecas-substituicao': 'pecas-biblioteca',
  'importacao-pecas': 'pecas-biblioteca',
  'solicitacao-servico-tecnico': 'pecas-biblioteca',
  'mapa-visual-separacao-pecas': 'pecas-biblioteca',
  'gestao-custos': 'gestao-custos',
  'orcamentos-avulso': 'gestao-custos',
  'pedido-orcamentos-avulso': 'gestao-custos',
  'orcamentos-pecas-especiais': 'gestao-custos',
  'orcamento-servico-tecnico': 'gestao-custos',
  'registro-despesas': 'gestao-financeira',
  'checklist-hub': 'checklist-group',
  'pre-checklist': 'checklist-group',
  'checklist-basico': 'checklist-group',
  checklist: 'checklist-group',
  'gestao-grupos-checklist': 'checklist-group',
  'ordem-preparacao': 'checklist-group',
  'formularios-checklist-tecnicos': 'checklist-group',
  'verificacao-final-entrega': 'checklist-group',
  equipamentos: 'gestao-industrial',
  'familias-grupos': 'gestao-industrial',
  'familias-grupos-equipamentos': 'gestao-industrial',
  desmontados: 'gestao-industrial',
  'hub-comunicacao': 'comunicacao-interna',
  'mensagens-internas': 'comunicacao-interna',
  'mensagens-internas-tecnicos': 'comunicacao-interna',
  'tecnicos-internos': 'comunicacao-interna',
  'tecnicos-externos': 'comunicacao-interna',
  'alerta-mensagens': 'comunicacao-interna',
  'comunicacao-interna': 'comunicacao-interna',
  'manuais-informacoes-tecnicas': 'manuais-informacoes-main',
  'biblia-nonato-service': 'biblia-nonato-main',
  'almoxarifado-armazem': 'almoxarifado-main',
  'gestao-financeira': 'gestao-financeira',
  'clientes-financeiro': 'gestao-financeira',
  'comprovantes-despesas': 'gestao-financeira',
  'pagamentos-contador': 'gestao-financeira',
  'protocolos-servico': 'protocolos-main',
  'manual-programa': 'manual-programa-main',
  'cadastro-nonato-service': 'empresa-institucional-main',
  'ficha-pagamento-transferencia': 'empresa-institucional-main',
  'ficha-fatura-cliente': 'empresa-institucional-main',
  translator: 'extra',
  administrador: 'admin-main',
  'gestao-demos': 'admin-main',
}

/** Título traduzido de uma aba/módulo — usado na barra inferior e ao mudar idioma. */
export function getTabTitleForBundle(type: TabType, tRaw: Record<string, unknown>): string {
  const t = tRaw as Record<string, string | undefined>
  const titles: Record<TabType, string> = {
    gestores: t?.gestoresTitle || 'Gestores e Técnicos',
    equipamentos: t?.equipamentos || 'CADASTRAR EQUIPAMENTOS E VISUALIZAR EQUIPAMENTOS DO ARMAZÉM',
    'familias-grupos': t?.familiasGruposTitle || 'Cadastro de Famílias e Grupos para Checklist',
    'familias-grupos-equipamentos':
      t?.familiasGruposEquipamentosTitle || 'Cadastro de Famílias e Grupos para os Equipamentos',
    'pre-checklist': t?.preChecklistTitle || 'PRE CHECKLIST',
    users: t?.userManagement || 'Gestão de Usuários',
    extras: t?.extras || 'Extras',
    'cadastro-nonato-service': t?.cadastroNonatoServiceTitle || 'CADASTRO DA NONATO SERVICE',
    'ficha-pagamento-transferencia':
      t?.fichaPagamentoTransferenciaTitle || 'FICHA PARA TRANSFERÊNCIA / PAGAMENTO',
    'ficha-fatura-cliente': t?.fichaFaturaClienteTitle || 'FICHA PARA O CLIENTE EMITIR FATURA',
    clientes: t?.clientes || 'Clientes',
    fornecedores: t?.fornecedores || 'Fornecedores',
    'relatorio-servico': t?.relatorioServico || 'Relatório de Serviço',
    'relatorio-especial': t?.relatorioEspecialTitle || 'Relatórios Especiais',
    'pecas-substituicao': t?.pecasSubstituicao || 'Peças de Substituição',
    'biblioteca-pecas': t?.bibliotecaPecas || 'Biblioteca de Peças',
    'importacao-pecas': t?.importacaoPecas || 'Importação de Peças',
    'solicitacao-servico-tecnico': t?.solicitacaoServicoTecnicoTitle || 'SOLICITAÇÃO DE SERVIÇO TÉCNICO',
    agenda: t?.agenda || 'Agenda',
    'diario-pedidos-dia': t?.diarioPedidosTitle || 'DIÁRIO DE ANOTAÇÃO',
    desmontados: t?.desmontados || 'Desmontados',
    'cadastro-servicos': t?.cadastroServicos || 'Cadastro de Serviços / Valores',
    'fechamento-relatorios-servicos':
      t?.fechamentoRelatoriosServicosTitle || 'Fechamento dos Relatórios de Serviços',
    translator: t?.translator || 'Tradutor de Idiomas',
    administrador: t?.administrador || 'Administrador',
    'gestao-demos': 'Gestão de envio de demonstrações',
    'estado-visual-tecnico': t?.estadoVisualTecnico || 'Estado Visual do Técnico',
    'informacoes-conhecimento-tecnicos':
      t?.informacoesConhecimentoTecnicosTitle || 'Informações de Conhecimento dos Técnicos',
    'gestao-custos': t?.gestaoCustosTitle || 'Gestão de Custos',
    'biblioteca-relatorios': t?.bibliotecaRelatoriosTitle || 'Biblioteca de Relatórios Salvos',
    'relatorios-excluidos-clientes': t?.relatoriosExcluidosClientesTitle || 'Relatórios Excluídos / Clientes',
    'gestao-financeira': t?.gestaoFinanceiraTitle || 'Gestão Financeira',
    'clientes-financeiro': t?.clientesFinanceiroTitle || 'Clientes / Financeiro',
    'orcamentos-avulso': t?.orcamentosAvulsoTitle || 'Orçamentos Avulso',
    'pedido-orcamentos-avulso': t?.pedidoOrcamentosAvulsoTitle || 'PEDIDO DE ORÇAMENTOS AVULSO',
    'orcamentos-pecas-especiais': t?.orcamentoPecasEspeciaisTitle || 'ORÇAMENTOS DE PEÇAS ESPECIAIS',
    'orcamento-servico-tecnico': t?.orcamentoServicoTecnicoTitle || 'ORÇAMENTO DE SERVIÇO TÉCNICO',
    'registro-despesas': t?.registroDespesasTitle || 'REGISTRO DE DESPESAS',
    'pagamentos-contador': t?.pagamentosContadorTitle || 'PAGAMENTOS AO CONTADOR',
    'comprovantes-despesas':
      t?.comprovantesDespesasTitle || 'REGISTRO DE DESPESAS PAGAS COM O CARTÃO PARA DECLARAÇÃO DE IRS',
    'mapa-visual-separacao-pecas':
      t?.mapaVisualSeparacaoPecasTitle || 'Mapa Visual de Separação de Peças / Cliente',
    'manuais-informacoes-tecnicas':
      t?.manuaisInformacoesTecnicasTitle || 'MANUAIS E INFORMAÇÕES TÉCNICA DOS EQUIPAMENTOS',
    'biblia-nonato-service': t?.bibliaNonatoServiceTitle || 'BÍBLIA DA NONATO SERVICE',
    'almoxarifado-armazem': t?.almoxarifadoArmazemTitle || 'Almoxarifado / Armazém',
    checklist: t?.checklistTitle || 'CHECKLIST',
    'checklist-basico': t?.checklistBasicoPageTitle || t?.checklistBasicoSubTitle || 'CHECKLIST BÁSICO',
    'checklist-hub': t?.checklistGroupTitle || 'GESTÃO DOS CHECKLIST',
    'gestao-grupos-checklist':
      t?.gestaoGruposChecklistTitle || 'GESTÃO DOS GRUPOS PARA CHECKLIST (CHECKLIST FINAL PARA A ENTREGA)',
    'ordem-preparacao': t?.ordemPreparacaoTitle || 'ORDEM DE PREPARAÇÃO',
    'formularios-checklist-tecnicos':
      t?.formulariosChecklistTecnicosTitle || 'FORMULARIOS E CHECKLIST P/ TECNICOS',
    'verificacao-final-entrega':
      t?.verificacaoFinalEntregaTitle || 'VERIFICAÇÃO FINAL ANTES DA ENTREGA DO EQUIPAMENTO P/ O CLIENTE',
    'comunicacao-interna': t?.comunicacaoInternaTitle || 'COMUNICAÇÃO INTERNA C/ GESTORES E TECNICOS',
    'hub-comunicacao': t?.hubComunicacao || 'HUB DE COMUNICAÇÃO',
    'mensagens-internas': t?.mensagensInternas || 'MENSAGENS INTERNAS / GESTORES',
    'mensagens-internas-tecnicos': t?.mensagensInternasTecnicos || 'MENSAGENS INTERNAS / TÉCNICOS',
    'tecnicos-internos': t?.tecnicosInternos || 'TÉCNICOS INTERNOS',
    'tecnicos-externos': t?.tecnicosExternos || 'TÉCNICOS EXTERNOS',
    'alerta-mensagens': t?.alertaMensagens || 'ALERTA DE MENSAGENS',
    'protocolos-servico': t?.protocolosServicoTitle || 'PROTOCOLOS DE SERVIÇO',
    'manual-programa': t?.manualProgramaTitle || 'Manual do Programa',
    'informacoes-mecanicas-eletricas':
      t?.informacoesMecanicasEletricasTitle || 'Informações Mecânicas e Elétricas dos Equipamentos',
  }
  return titles[type] || type
}

/** Chaves de tradução para subtítulo dos cartões do hub e das entradas da sidebar (por id de botão). */
export const HUB_CARD_DESC_BY_BUTTON_ID: Record<string, readonly string[]> = {
  'gestores-default': ['gestoresSubtitle'],
  'clientes-default': ['clientesSubtitle'],
  'fornecedores-default': ['fornecedoresSubtitle'],
  'relatorio-servico-default': ['relatorioServicoSubtitle'],
  'relatorio-especial-default': ['relatorioEspecialSubtitle'],
  'biblioteca-relatorios-default': ['quickAccessBibliotecaRelatoriosDesc'],
  'relatorios-excluidos-clientes-default': ['relatoriosExcluidosClientesDesc'],
  'biblioteca-pecas-default': ['quickAccessBibliotecaPecasDesc'],
  'agenda-default': ['quickAccessAgendaDesc'],
  'diario-pedidos-dia-default': ['diarioPedidosHubCardDesc'],
  'estado-visual-tecnico-default': ['estadoVisualHubCardDesc'],
  'informacoes-conhecimento-tecnicos-default': ['informacoesConhecimentoTecnicosDesc'],
  'cadastro-servicos-default': ['cadastroServicosSubtitle'],
  'fechamento-relatorios-servicos-default': ['fechamentoRelatoriosServicosDesc'],
  'orcamentos-avulso-default': ['orcamentosAvulsoHubCardDesc'],
  'pedido-orcamentos-avulso-default': ['pedidoOrcamentosAvulsoHubCardDesc'],
  'orcamentos-pecas-especiais-default': ['orcamentoPecasEspeciaisHubCardDesc'],
  'orcamento-servico-tecnico-default': ['orcamentoServicoTecnicoSubtitle'],
  'registro-despesas-default': ['registroDespesasDesc'],
  'mapa-visual-separacao-pecas-default': ['mapaVisualSeparacaoPecasHubCardDesc'],
  'checklist-group-default': ['quickAccessChecklistHubDesc'],
  'familias-grupos-equipamentos-default': ['familiasGruposEquipamentosHubCardDesc'],
  'equipamentos-default': ['equipamentosSubtitle'],
  'desmontados-default': ['desmontadosSubtitle'],
  'familias-grupos-default': ['familiasGruposDesc'],
  'pre-checklist-default': ['preChecklistDesc'],
  'checklist-basico-default': ['checklistBasicoDesc'],
  'checklist-default': ['checklistDesc'],
  'verificacao-final-entrega-default': ['verificacaoFinalEntregaDesc'],
  'gestao-grupos-checklist-default': ['gestaoGruposChecklistDesc'],
  'ordem-preparacao-default': ['ordemPreparacaoDesc'],
  'formularios-checklist-tecnicos-default': ['formulariosChecklistTecnicosDesc'],
  'hub-comunicacao-default': ['hubComunicacaoDesc'],
  'mensagens-internas-default': ['mensagensInternasHubCardDesc'],
  'mensagens-internas-tecnicos-default': ['mensagensInternasTecnicosHubCardDesc'],
  'alerta-mensagens-default': ['alertaMensagensDesc'],
  'manuais-informacoes-tecnicas-default': ['manuaisInformacoesTecnicasDesc', 'quickAccessManuaisDesc'],
  'biblia-nonato-service-default': ['bibliaNonatoHubCardDesc', 'bibliaNonatoQuickDesc'],
  'almoxarifado-armazem-default': ['quickAccessAlmoxarifadoDesc', 'almoxarifadoArmazemDesc'],
  'cadastro-nonato-service-default': ['cadastroNonatoServiceInfo'],
  'ficha-pagamento-transferencia-default': ['empresaInstHubCardPagamento'],
  'ficha-fatura-cliente-default': ['empresaInstHubCardFaturaCliente'],
  'administrador-default': ['administradorGeralDesc'],
  'clientes-financeiro-default': ['clientesFinanceiroHubCardDesc'],
  'comprovantes-despesas-default': ['comprovantesDespesasDesc'],
  'pagamentos-contador-default': ['pagamentosContadorDesc'],
  'open-translator': ['quickAccessTranslatorDesc'],
  'open-manual-gestor': ['manualUsoGestorHubCardDesc'],
}

export const HUB_CARD_DESC_BY_ACTION: Record<string, readonly string[]> = {
  'open-gestao-demos': ['adminJumpDemosDesc'],
  'open-manual-programa': ['manualProgramaSubtitle'],
  'open-protocolos-servico': ['protocolosServicoDesc'],
}

export function pickTrChain(tr: Record<string, string | undefined>, keys: readonly string[]): string {
  for (const k of keys) {
    const v = tr[k]
    if (typeof v === 'string' && v.trim().length > 0) return v.trim()
  }
  return ''
}

export function resolveActionCardDescription(
  tr: Record<string, string | undefined>,
  buttonId?: string,
  action?: string,
  fallback?: string
): string {
  const fromId = pickTrChain(tr, HUB_CARD_DESC_BY_BUTTON_ID[buttonId || ''] || [])
  if (fromId) return fromId
  if (action) {
    const fromAction = pickTrChain(tr, HUB_CARD_DESC_BY_ACTION[action] || [])
    if (fromAction) return fromAction
  }
  const fb = (fallback ?? pickTrChain(tr, ['mainHubCardHint'])) || ''
  return fb
}
