/** Grupos da grelha e cartões de preset da demo — sem I/O. */

import type { DemoPackagePreset } from './tipos'

export const DEMO_MODULE_GROUP_ORDER = ['clientes', 'tecnica', 'gestao', 'outros'] as const
export type DemoModuleGroupId = (typeof DEMO_MODULE_GROUP_ORDER)[number]

export const DEMO_MODULE_GROUP_LABELS: Record<DemoModuleGroupId, string> = {
  clientes: 'Clientes, comercial e peças',
  tecnica: 'Técnica, operação e checklist',
  gestao: 'Gestão interna, custos e comunicação',
  outros: 'Outros',
}

export type DemoPresetCard = {
  id: DemoPackagePreset
  title: string
  desc: string
  icon: string
  mode: 'legacy-teaser' | 'strict-hidden'
}

export const DEMO_PRESET_CARDS: DemoPresetCard[] = [
  { id: 'commercial', title: 'Comercial', desc: 'Clientes, peças, agenda e relatórios', icon: '💼', mode: 'legacy-teaser' },
  { id: 'technical', title: 'Técnica', desc: 'Equipamentos, checklist, protocolos', icon: '🔧', mode: 'legacy-teaser' },
  { id: 'tecnica-clientes', title: 'Técnica + clientes', desc: 'Operação completa; resto oculto', icon: '⚙️', mode: 'strict-hidden' },
  { id: 'gestao-nucleo', title: 'Só gestão', desc: 'Custos, financeiro, industrial', icon: '📊', mode: 'strict-hidden' },
  { id: 'basic', title: 'Mínima', desc: '3 funções na área técnica', icon: '🎯', mode: 'legacy-teaser' },
  { id: 'partial', title: 'Mista', desc: 'Combinação parcial de áreas', icon: '🔀', mode: 'legacy-teaser' },
]

export function getDemoModuleGroupId(action: string): DemoModuleGroupId {
  const CLIENTES = new Set([
    'open-clientes', 'open-fornecedores', 'open-relatorio-servico', 'open-biblioteca-pecas',
    'open-importacao-pecas', 'open-pecas-substituicao', 'open-solicitacao-servico-tecnico',
    'open-agenda', 'open-biblioteca-relatorios', 'open-biblioteca-hub', 'open-orcamentos-avulso',
    'open-pedido-orcamentos-avulso', 'open-relatorios-excluidos-clientes', 'open-quick-biblioteca-pecas',
    'open-parceiros-comercial', 'open-documentacao-relatorios',
  ])
  const TECNICA = new Set([
    'open-gestores', 'open-equipamentos', 'open-checklist-hub', 'open-pre-checklist', 'open-checklist',
    'open-familias-grupos', 'open-familias-grupos-equipamentos', 'open-desmontados', 'open-cadastro-servicos',
    'open-fechamento-relatorios-servicos', 'open-gestao-industrial', 'open-gestao-tecnica',
    'open-ordem-preparacao', 'open-formularios-checklist-tecnicos', 'open-verificacao-final-entrega',
    'open-protocolos-servico', 'open-gestao-grupos-checklist', 'open-manuais-informacoes-tecnicas',
    'open-almoxarifado-armazem', 'open-mapa-visual-separacao', 'open-mapa-visual-separacao-pecas',
  ])
  const GESTAO = new Set([
    'open-gestao-custos', 'open-gestao-financeira', 'open-comunicacao-interna', 'open-hub-comunicacao',
    'open-mensagens-internas', 'open-mensagens-internas-tecnicos', 'open-alerta-mensagens',
    'open-quick-gestao-custos', 'open-quick-gestao-financeira', 'open-clientes-financeiro',
    'open-comprovantes-despesas', 'open-pagamentos-contador', 'open-orcamento-servico-tecnico',
    'open-registro-despesas',
  ])
  if (CLIENTES.has(action)) return 'clientes'
  if (TECNICA.has(action)) return 'tecnica'
  if (GESTAO.has(action)) return 'gestao'
  return 'outros'
}

export function getDemoPresetLabel(preset?: string): string {
  switch (preset) {
    case 'basic': return 'Demo básica'
    case 'commercial': return 'Demo comercial'
    case 'technical': return 'Demo técnica'
    case 'partial': return 'Demo parcial'
    case 'gestao-nucleo': return 'Gestão (Custos, Fin., Ind., Com.)'
    case 'tecnica-clientes': return 'Gestão técnica + clientes'
    case 'completo': return 'Envio completo'
    case 'custom': return 'Personalizada (módulo a módulo)'
    default: return 'Padrão'
  }
}
