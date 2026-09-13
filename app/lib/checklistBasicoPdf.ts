/** I/O do PDF do checklist básico — window/mailto. Builders canónicos no módulo. */

import type { ChecklistBasicoInstancia } from '../modules/checklist/basicoTipos'
import {
  buildChecklistBasicoPrintHtml,
  buildChecklistBasicoEnvioTexto,
  escapeChecklistBasicoHtml,
  telefoneDigitsParaWa,
  type ChecklistBasicoPdfLabels,
} from '../modules/checklist/basicoPdf'

export type { ChecklistBasicoPdfLabels }
export { buildChecklistBasicoPrintHtml, buildChecklistBasicoEnvioTexto, telefoneDigitsParaWa }

export function openChecklistBasicoPrint(
  inst: ChecklistBasicoInstancia,
  labels: ChecklistBasicoPdfLabels,
  logoUrl?: string | null,
  logoType?: string | null
): void {
  const esc = escapeChecklistBasicoHtml
  let logoHtml = '<strong style="font-size:18px;color:#007a33">NONATO SERVICE</strong>'
  if (logoUrl) {
    if (logoType === 'video') {
      logoHtml = `<img class="logo" src="${esc(logoUrl)}" alt="NONATO SERVICE" />`
    } else {
      logoHtml = `<img class="logo" src="${esc(logoUrl)}" alt="NONATO SERVICE" />`
    }
  }
  const html = buildChecklistBasicoPrintHtml(inst, labels, logoHtml)
  const w = window.open('', '_blank', 'noopener,noreferrer')
  if (!w) return
  w.document.write(html)
  w.document.close()
}

export function abrirEmailChecklistBasico(
  email: string,
  inst: ChecklistBasicoInstancia,
  labels: ChecklistBasicoPdfLabels
): void {
  const subject = encodeURIComponent(
    `${labels.checklistBasicoPageTitle || 'CHECKLIST BÁSICO'} — ${inst.clienteNome}`
  )
  const body = encodeURIComponent(buildChecklistBasicoEnvioTexto(inst, labels))
  const mail = (email || '').trim()
  window.open(`mailto:${mail}?subject=${subject}&body=${body}`, '_self')
}

export function abrirWhatsAppChecklistBasico(
  telefones: string,
  inst: ChecklistBasicoInstancia,
  labels: ChecklistBasicoPdfLabels
): void {
  const wa = telefoneDigitsParaWa(telefones)
  const texto = encodeURIComponent(buildChecklistBasicoEnvioTexto(inst, labels))
  const url = wa ? `https://wa.me/${wa}?text=${texto}` : `https://wa.me/?text=${texto}`
  window.open(url, '_blank', 'noopener,noreferrer')
}
