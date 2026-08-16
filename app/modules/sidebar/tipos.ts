export type SidebarGroup =
  | 'gestao-tecnica'
  | 'parceiros-comercial'
  | 'documentacao-relatorios'
  | 'pecas-biblioteca'
  | 'gestao-custos'
  | 'gestao-industrial'
  | 'gestao-financeira'
  | 'checklist-group'
  | 'comunicacao-interna'
  | 'manuais-informacoes-tecnicas'
  | 'biblia-nonato-service'
  | 'almoxarifado-armazem'
  | 'empresa-institucional'
  | 'outros'

export type SidebarButton = {
  id: string
  name: string
  action: string
  order: number
  translationKey?: string // Chave de tradução opcional
  group?: SidebarGroup // Grupo ao qual o botão pertence
  customName?: boolean // Indica se o nome foi customizado pelo usuário (não muda com idioma)
}

export type TabType =
  | 'gestores'
  | 'equipamentos'
  | 'familias-grupos'
  | 'familias-grupos-equipamentos'
  | 'users'
  | 'extras'
  | 'cadastro-nonato-service'
  | 'ficha-pagamento-transferencia'
  | 'ficha-fatura-cliente'
  | 'clientes'
  | 'fornecedores'
  | 'relatorio-servico'
  | 'relatorio-especial'
  | 'pecas-substituicao'
  | 'biblioteca-pecas'
  | 'importacao-pecas'
  | 'solicitacao-servico-tecnico'
  | 'agenda'
  | 'diario-pedidos-dia'
  | 'desmontados'
  | 'cadastro-servicos'
  | 'fechamento-relatorios-servicos'
  | 'translator'
  | 'administrador'
  | 'gestao-demos'
  | 'estado-visual-tecnico'
  | 'informacoes-conhecimento-tecnicos'
  | 'gestao-custos'
  | 'biblioteca-relatorios'
  | 'relatorios-excluidos-clientes'
  | 'gestao-financeira'
  | 'clientes-financeiro'
  | 'comprovantes-despesas'
  | 'orcamentos-avulso'
  | 'pedido-orcamentos-avulso'
  | 'orcamentos-pecas-especiais'
  | 'orcamento-servico-tecnico'
  | 'registro-despesas'
  | 'pagamentos-contador'
  | 'manuais-informacoes-tecnicas'
  | 'biblia-nonato-service'
  | 'almoxarifado-armazem'
  | 'pre-checklist'
  | 'checklist'
  | 'checklist-basico'
  | 'checklist-hub'
  | 'comunicacao-interna'
  | 'hub-comunicacao'
  | 'mensagens-internas'
  | 'mensagens-internas-tecnicos'
  | 'tecnicos-internos'
  | 'tecnicos-externos'
  | 'alerta-mensagens'
  | 'gestao-grupos-checklist'
  | 'mapa-visual-separacao-pecas'
  | 'ordem-preparacao'
  | 'formularios-checklist-tecnicos'
  | 'verificacao-final-entrega'
  | 'protocolos-servico'
  | 'manual-programa'
  | 'informacoes-mecanicas-eletricas'

export type Tab = {
  id: string
  type: TabType
  title: string
  icon?: string
  /** Hub do painel principal para «Voltar» quando a aba foi aberta a partir de um hub */
  returnHubId?: string | null
}
