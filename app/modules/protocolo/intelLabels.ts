/** Rótulos de UI do protocolo (filtro, modelos, wizard) — puros, sem I/O. */

import type { ProtocoloIntelFiltroChip } from './intelFiltro'
import type { ProtocoloTemplateId } from './intelTemplates'

export type ProtocoloUiCopy = Record<string, string | undefined>

export function rotuloProtocoloIntelFiltroChip(
  chip: ProtocoloIntelFiltroChip,
  t?: ProtocoloUiCopy
): string {
  const map: Record<ProtocoloIntelFiltroChip, string> = {
    todos: t?.protocolosServicoFiltroChipTodos || 'Todos',
    ultimos7d: t?.protocolosServicoFiltroChip7d || 'Últimos 7 dias',
    com_fotos: t?.protocolosServicoFiltroChipFotos || 'Com fotos',
    com_pecas: t?.protocolosServicoFiltroChipPecas || 'Com peças',
    incompletos: t?.protocolosServicoFiltroChipIncompletos || 'Incompletos',
  }
  return map[chip]
}

export function rotuloProtocoloTemplate(id: ProtocoloTemplateId, t?: ProtocoloUiCopy): string {
  const map: Record<ProtocoloTemplateId, string> = {
    diagnostico: t?.protocolosServicoTemplateDiagnostico || 'Diagnóstico',
    antes_depois: t?.protocolosServicoTemplateAntesDepois || 'Antes / Depois',
    intervencao: t?.protocolosServicoTemplateIntervencao || 'Intervenção',
    conclusao: t?.protocolosServicoTemplateConclusao || 'Conclusão',
  }
  return map[id]
}

export function rotulosProtocoloWizardPassos(t?: ProtocoloUiCopy): string[] {
  return [
    t?.protocolosServicoWizardPasso1 || 'Identificação',
    t?.protocolosServicoWizardPasso2 || 'Relatório',
    t?.protocolosServicoWizardPasso3 || 'Peças',
    t?.protocolosServicoWizardPasso4 || 'Concluir',
  ]
}
