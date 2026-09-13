/** Resumo tipográfico do PDF de relatório de serviço (horas, km, diárias). Sem I/O. */

import { escapePdfHtml } from '../pdf/documentLayout'

export type RelatorioServicoTotaisResumo = {
  horasTrabalho: string
  kmsPercorridos: string
  horasViagem: string
  horasViagemIda?: string
  horasViagemRetorno?: string
}

/** Horas HH:MM → valor tipográfico consistente (ex.: 8:30h). */
export function formatHorasResumoPdf(hhmm: string | undefined | null): string {
  const s = String(hhmm ?? '').trim()
  if (!s || s === '-') return '—'
  const m = s.match(/^(\d+):(\d{1,2})$/)
  if (!m) return escapePdfHtml(s)
  const h = parseInt(m[1], 10) || 0
  const min = parseInt(m[2], 10) || 0
  return `<span class="rs-resumo-valor rs-resumo-valor--horas"><span class="rs-resumo-num">${h}</span><span class="rs-resumo-sep">:</span><span class="rs-resumo-num rs-resumo-num--min">${String(min).padStart(2, '0')}</span><span class="rs-resumo-un">h</span></span>`
}

/** KM sem zeros desnecessários (352 em vez de 352,00). */
export function formatKmResumoPdf(km: string | number | undefined | null): string {
  const raw = typeof km === 'number' ? km : parseFloat(String(km ?? '').replace(',', '.').replace(/[^\d.-]/g, ''))
  if (!Number.isFinite(raw)) return '—'
  const rounded = Math.round(raw * 10) / 10
  const isWhole = Math.abs(rounded - Math.round(rounded)) < 0.05
  const numStr = isWhole
    ? new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 0 }).format(Math.round(rounded))
    : new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(rounded)
  return `<span class="rs-resumo-valor rs-resumo-valor--km"><span class="rs-resumo-num">${numStr}</span><span class="rs-resumo-un">km</span></span>`
}

export function formatDiariasResumoPdf(n: number): string {
  return `<span class="rs-resumo-valor rs-resumo-valor--diarias"><span class="rs-resumo-num">${n}</span></span>`
}

/** Grelha de totais (horas, km, diárias) — formatação uniforme em todos os modelos PDF. */
export function buildRelatorioServicoSummaryCardsHtml(
  totais: RelatorioServicoTotaisResumo,
  numDiarias: number,
  labels: Record<string, string | undefined>,
  opts?: {
    wrapperClass?: string
    cardClass?: string
    labelClass?: string
    /** `h4` (default) ou `div` com classe `.label` */
    labelAs?: 'h4' | 'div'
  }
): string {
  const wrap = opts?.wrapperClass ?? 'summary'
  const card = opts?.cardClass ?? 'summary-card'
  const labelAs = opts?.labelAs ?? 'h4'
  const labelCls = opts?.labelClass ?? (labelAs === 'div' ? 'label' : '')
  const items = [
    { label: labels.horasTrabalho || 'Horas de Trabalho', html: formatHorasResumoPdf(totais.horasTrabalho) },
    { label: labels.kmsPercorridos || "Km's Percorridos", html: formatKmResumoPdf(totais.kmsPercorridos) },
    { label: labels.horasViagem || 'Horas de Viagem', html: formatHorasResumoPdf(totais.horasViagem) },
    { label: labels.diarias || 'DIÁRIAS', html: formatDiariasResumoPdf(numDiarias) },
    { label: labels.horasViagemIda || 'Horas de Viagem de Ida', html: formatHorasResumoPdf(totais.horasViagemIda) },
    {
      label: labels.horasViagemRetorno || 'Horas de Viagem de Retorno',
      html: formatHorasResumoPdf(totais.horasViagemRetorno),
    },
  ]
  return `<div class="rs-resumo-bloco"><div class="${wrap}">${items
    .map((it, idx) => {
      const labelAttr = labelCls ? ` class="${labelCls}"` : ''
      const labelHtml =
        labelAs === 'div'
          ? `<div${labelAttr}>${escapePdfHtml(it.label)}</div>`
          : `<h4${labelAttr}>${escapePdfHtml(it.label)}</h4>`
      const mainCls = idx === 0 ? ` ${card}--main` : ''
      return `<div class="${card}${mainCls}">${labelHtml}<div class="value">${it.html}</div></div>`
    })
    .join('')}</div></div>`
}

/** Envelope de fluxo do PDF comum (não usar em especiais). */
export function wrapRelatorioServicoPdfDocHtml(innerHtml: string): string {
  return `<div class="rs-doc rs-doc-flow">${innerHtml}</div>`
}
