/** Trilha recomendada — reutiliza chaves manualSecao* já traduzidas nos 6 idiomas */
export type ManualTrailStepDef = {
  id: string
  icon: string
  titleKey: string
  descKey: string
  fallbackTitle: string
  fallbackDesc: string
  /** Página do manual a abrir ao clicar na trilha */
  targetPageId: string
}

export const MANUAL_PROGRAMA_TRAIL: ManualTrailStepDef[] = [
  {
    id: 'inicio',
    icon: '🚀',
    titleKey: 'manualSecaoInicio',
    descKey: 'manualSecaoInicioDesc',
    fallbackTitle: '1) Início rápido',
    fallbackDesc: 'Faça login, escolha o idioma, confirme as permissões e organize a sidebar.',
    targetPageId: 'dashboard',
  },
  {
    id: 'cadastro',
    icon: '📋',
    titleKey: 'manualSecaoCadastro',
    descKey: 'manualSecaoCadastroDesc',
    fallbackTitle: '2) Cadastro base',
    fallbackDesc: 'Cadastre gestores, equipamentos, clientes e fornecedores.',
    targetPageId: 'gestores-default',
  },
  {
    id: 'operacao',
    icon: '🔧',
    titleKey: 'manualSecaoOperacao',
    descKey: 'manualSecaoOperacaoDesc',
    fallbackTitle: '3) Operação técnica',
    fallbackDesc: 'Relatórios, protocolos, agenda e checklist.',
    targetPageId: 'agenda-default',
  },
  {
    id: 'pecas',
    icon: '📦',
    titleKey: 'manualSecaoPecas',
    descKey: 'manualSecaoPecasDesc',
    fallbackTitle: '4) Peças e biblioteca',
    fallbackDesc: 'Biblioteca de peças e importação em lote.',
    targetPageId: 'biblioteca-pecas-default',
  },
  {
    id: 'financeiro',
    icon: '💰',
    titleKey: 'manualSecaoFinanceiro',
    descKey: 'manualSecaoFinanceiroDesc',
    fallbackTitle: '5) Financeiro',
    fallbackDesc: 'Custos, despesas, comprovantes e fecho.',
    targetPageId: 'gestao-financeira-default',
  },
  {
    id: 'ajuda',
    icon: '❓',
    titleKey: 'manualSecaoAjuda',
    descKey: 'manualSecaoAjudaDesc',
    fallbackTitle: '6) Ajuda e suporte',
    fallbackDesc: 'F1, HELP e este manual.',
    targetPageId: 'dashboard',
  },
  {
    id: 'boas-praticas',
    icon: '✅',
    titleKey: 'manualSecaoBoasPraticas',
    descKey: 'manualSecaoBoasPraticasDesc',
    fallbackTitle: '7) Boas práticas',
    fallbackDesc: 'Padronização e qualidade dos dados.',
    targetPageId: 'clientes-default',
  },
  {
    id: 'seguranca',
    icon: '🔒',
    titleKey: 'manualSecaoSeguranca',
    descKey: 'manualSecaoSegurancaDesc',
    fallbackTitle: '8) Segurança e backup',
    fallbackDesc: 'Sincronização, actualização e cópias de segurança.',
    targetPageId: 'administrador-default',
  },
]
