/** Textos de envio (WhatsApp / e-mail / copiar) para comprovantes de despesas. */

import type { ComprovanteDespesa } from './tipos'

export type MensagemEnvioComprovanteTemplateId = 1 | 2 | 3 | 4 | 5

export type PeriodoViewComprovantes = 'mensal' | 'semanal' | 'anual' | string

/** Rótulo do período activo nos filtros (mês / semana / ano / «Todos»). */
export function buildPeriodoLabelEnvioComprovantes(params: {
  filtroPeriodoView: PeriodoViewComprovantes
  filtroMes?: string
  filtroSemana?: string
  filtroAno?: string
  labelTodos: string
}): string {
  const { filtroPeriodoView, filtroMes, filtroSemana, filtroAno, labelTodos } = params
  if (filtroPeriodoView === 'mensal' && filtroMes) return filtroMes
  if (filtroPeriodoView === 'semanal' && filtroSemana) return filtroSemana
  if (filtroPeriodoView === 'anual' && filtroAno) return filtroAno
  return labelTodos
}

/** Período curto para PDF (só mensal/semanal quando definidos). */
export function buildPeriodoPdfEnvioComprovantes(params: {
  filtroPeriodoView: PeriodoViewComprovantes
  filtroMes?: string
  filtroSemana?: string
}): string {
  const { filtroPeriodoView, filtroMes, filtroSemana } = params
  if (filtroPeriodoView === 'mensal' && filtroMes) return filtroMes
  if (filtroPeriodoView === 'semanal' && filtroSemana) return filtroSemana
  return ''
}

function linhasTotaisPorCliente(totalPorCliente: Record<string, number>, bullet = false): string {
  return Object.entries(totalPorCliente)
    .sort((a, b) => b[1] - a[1])
    .map(([nome, tot]) => (bullet ? `• ${nome}: ${tot.toFixed(2)} €` : `${nome}: ${tot.toFixed(2)} €`))
    .join('\n')
}

export type BuildMensagemEnvioComprovantesParams = {
  templateId: MensagemEnvioComprovanteTemplateId
  tituloRelatorio: string
  periodoLabel: string
  filtrados: ComprovanteDespesa[]
  totalGeral: number
  totalPorCliente: Record<string, number>
  labelCliente: (c: ComprovanteDespesa) => string
  reportDate?: Date
}

export function buildMensagemEnvioComprovantes(params: BuildMensagemEnvioComprovantesParams): string {
  const {
    templateId,
    tituloRelatorio,
    periodoLabel,
    filtrados,
    totalGeral,
    totalPorCliente,
    labelCliente,
    reportDate = new Date(),
  } = params

  if (templateId === 1) {
    const porCli = linhasTotaisPorCliente(totalPorCliente)
    return `${tituloRelatorio}\n\nTotal geral: ${totalGeral.toFixed(2)} €\n\n${porCli}`.trim()
  }
  if (templateId === 2) {
    let msg = `${tituloRelatorio}\n\n`
    filtrados.forEach((c) => {
      msg += `${c.data} | ${labelCliente(c)} | ${c.valorTotal.toFixed(2)} €${
        c.descricao ? ' | ' + c.descricao : ''
      }\n`
    })
    msg += `\nTotal: ${totalGeral.toFixed(2)} €`
    return msg.trim()
  }
  if (templateId === 3) {
    const porCli = linhasTotaisPorCliente(totalPorCliente)
    return `${tituloRelatorio}\nPeríodo: ${periodoLabel}\n\nTotal do período: ${totalGeral.toFixed(2)} €\n\n${porCli}`.trim()
  }
  if (templateId === 4) {
    const porCli = linhasTotaisPorCliente(totalPorCliente, true)
    let msg = `NONATO SERVICE\nRelatório de Comprovantes de Despesas\nData do relatório: ${reportDate.toLocaleDateString('pt-PT')}\n────────────────────────\n\n`
    msg += `Total geral: ${totalGeral.toFixed(2)} €\n\nPor cliente/beneficiário:\n`
    msg += porCli
    msg += `\n\n────────────────────────\nFim do relatório.`
    return msg
  }
  if (templateId === 5) {
    let msg = `Total: ${totalGeral.toFixed(2)} €`
    Object.entries(totalPorCliente)
      .sort((a, b) => b[1] - a[1])
      .forEach(([nome, tot]) => {
        msg += `\n${nome}: ${tot.toFixed(2)} €`
      })
    return msg
  }
  return ''
}

/** Prefixa a mensagem com o nome do técnico, se existir. */
export function prefixarMensagemEnvioComTecnico(base: string, tecnicoNome?: string | null): string {
  if (tecnicoNome) return `Técnico: ${tecnicoNome}\n\n` + base
  return base
}
