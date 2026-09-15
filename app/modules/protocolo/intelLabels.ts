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

export function rotuloProtocoloPdfModelo(
  n: number,
  t?: ProtocoloUiCopy,
  opts?: { compact?: boolean }
): string {
  const fromT = t?.[`protocolosServicoPdfModelo${n}`]
  if (fromT) return fromT
  return opts?.compact ? `M${n}` : `Modelo ${n}`
}

export function rotuloProtocoloEnviadoVia(
  via: string | undefined,
  t?: ProtocoloUiCopy,
  opts?: { compact?: boolean }
): string {
  if (via === 'email') return t?.protocolosServicoEnviadoViaEmail || 'E-mail'
  if (via === 'whatsapp') {
    return t?.protocolosServicoEnviadoViaWhatsApp || (opts?.compact ? 'WA' : 'WhatsApp')
  }
  if (via === 'manual') return t?.protocolosServicoEnviadoViaManual || 'Manual'
  return ''
}

export function rotuloProtocoloResumoBlocos(n: number, t?: ProtocoloUiCopy): string {
  return (t?.protocolosServicoResumoBlocos || '{n} blocos').replace('{n}', String(n))
}

export function rotuloProtocoloResumoPecas(n: number, t?: ProtocoloUiCopy): string {
  return (t?.protocolosServicoResumoPecas || '{n} peças').replace('{n}', String(n))
}

export function mensagemProtocoloListaVaziaExec(filtroAtivo: boolean, t?: ProtocoloUiCopy): string {
  return filtroAtivo
    ? t?.protocolosServicoListaVaziaFiltro || 'Nenhum protocolo corresponde à pesquisa.'
    : t?.protocolosServicoSemEmExecucao || 'Não há protocolos em execução.'
}
