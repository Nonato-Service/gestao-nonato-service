/** Rótulos de grupos da sidebar e títulos de hubs do dashboard. */

import type { SidebarGroup } from './tipos'
import { SIDEBAR_GROUPS } from './constantes'

export function getSidebarGroupLabel(
  group: SidebarGroup,
  tr: Record<string, string | undefined>
): string {
  switch (group) {
    case 'gestao-tecnica':
      return tr.gestaoTecnicaTitle || 'GESTÃO TÉCNICA'
    case 'parceiros-comercial':
      return tr.parceirosComercialTitle || 'CLIENTES E FORNECEDORES'
    case 'documentacao-relatorios':
      return tr.documentacaoRelatoriosTitle || 'DOCUMENTAÇÃO E RELATÓRIOS'
    case 'pecas-biblioteca':
      return tr.pecasBibliotecaTitle || 'CADASTRO DE PEÇAS E BIBLIOTECA DE PEÇAS'
    case 'gestao-custos':
      return tr.gestaoCustosTitle || 'GESTÃO DE CUSTOS'
    case 'gestao-industrial':
      return tr.gestaoIndustrialTitle || 'GESTÃO INDUSTRIAL'
    case 'gestao-financeira':
      return tr.gestaoFinanceiraTitle || 'GESTÃO FINANCEIRA'
    case 'checklist-group':
      return tr.checklistGroupTitle || 'GESTÃO DOS CHECKLIST'
    case 'comunicacao-interna':
      return tr.comunicacaoInternaTitle || 'COMUNICAÇÃO INTERNA'
    case 'manuais-informacoes-tecnicas':
      return tr.manuaisInformacoesTecnicasTitle || 'MANUAIS E INFORMAÇÕES TÉCNICAS'
    case 'biblia-nonato-service':
      return tr.bibliaNonatoServiceTitle || 'BÍBLIA DA NONATO SERVICE'
    case 'almoxarifado-armazem':
      return tr.almoxarifadoArmazemTitle || 'ALMOXARIFADO / ARMAZÉM'
    case 'empresa-institucional':
      return tr.empresaInstitucionalTitle || 'EMPRESA & REGISTOS OFICIAIS'
    default:
      return tr.outrosBotoes || 'OUTROS'
  }
}

export function getDashboardMainHubTitle(
  hubId: string,
  tr: Record<string, string | undefined>
): string {
  switch (hubId) {
    case 'protocolos-main':
      return tr.protocolosServicoTitle || 'Protocolos de serviço'
    case 'manual-programa-main':
      return tr.manualProgramaTitle || 'Manual do programa'
    case 'manuais-informacoes-main':
      return tr.manuaisInformacoesTecnicasTitle || 'Manuais e informações técnicas'
    case 'biblia-nonato-main':
      return tr.bibliaNonatoServiceTitle || 'Bíblia da Nonato Service'
    case 'almoxarifado-main':
      return tr.almoxarifadoArmazemTitle || 'Almoxarifado / Armazém'
    case 'empresa-institucional-main':
    case 'cadastro-nonato-main':
      return tr.empresaInstitucionalTitle || tr.cadastroNonatoServiceTitle || 'EMPRESA & REGISTOS OFICIAIS'
    case 'admin-main':
      return tr.administrador || 'ADMINISTRADOR'
    case 'extra':
      return tr.extras || 'EXTRAS'
    default:
      if (SIDEBAR_GROUPS.includes(hubId as SidebarGroup)) {
        return getSidebarGroupLabel(hubId as SidebarGroup, tr)
      }
      return tr.title || ''
  }
}

export function formatNavBackToHub(
  hubId: string,
  tr: Record<string, string | undefined>
): string {
  const hubTitle = getDashboardMainHubTitle(hubId, tr)
  const tpl = tr.navBackToHub || 'Voltar a {hub}'
  return tpl.replace('{hub}', hubTitle)
}
