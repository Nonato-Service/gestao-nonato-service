import type { ChecklistBasicoInstancia } from './checklistBasicoTypes'

export type ChecklistBasicoPdfLabels = Record<string, string>

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function telefoneDigitsParaWa(telefones: string): string {
  const s = String(telefones || '')
  const all = s.replace(/\D/g, '')
  if (all.length >= 10 && all.length <= 15) return all
  if (all.length === 9) return all
  const parts = s.split(/[/;,|]+/)
  for (const part of parts) {
    const d = part.replace(/\D/g, '')
    if (d.length >= 10 && d.length <= 15) return d
    if (d.length === 9) return d
  }
  return all.length >= 9 ? all : ''
}

export function buildChecklistBasicoPrintHtml(
  inst: ChecklistBasicoInstancia,
  labels: ChecklistBasicoPdfLabels,
  logoHtml: string
): string {
  const titulo = labels.checklistBasicoPageTitle || labels.checklistBasico || 'CHECKLIST BÁSICO'
  const rows = inst.grupos
    .map((g) => {
      const itens = g.itens
        .map((it) => {
          let statusLabel = labels.checklistBasicoStatusPendente || 'Pendente'
          if (it.status === 'executado') statusLabel = `${labels.checklistBasicoOk || 'OK'} ✓`
          if (it.status === 'nao_executado') statusLabel = labels.checklistBasicoNaoExecutado || 'Não executado'
          const motivo =
            it.status === 'nao_executado' && it.motivoNaoExecutado
              ? `<div class="motivo"><strong>${esc(labels.checklistBasicoMotivoTitulo || 'Motivo')}:</strong> ${esc(it.motivoNaoExecutado)}</div>`
              : ''
          return `<tr><td>${esc(it.descricao)}</td><td>${esc(statusLabel)}</td></tr>${motivo ? `<tr><td colspan="2">${motivo}</td></tr>` : ''}`
        })
        .join('')
      return `<h3>${esc(g.nome)}</h3><table><thead><tr><th>${esc(labels.checklistBasicoNovaSituacao || 'Situação')}</th><th>${esc(labels.checklistBasicoExecutado || 'Estado')}</th></tr></thead><tbody>${itens || `<tr><td colspan="2">—</td></tr>`}</tbody></table>`
    })
    .join('')

  const assinaturaTecnico = inst.assinaturaTecnico
    ? `<img src="${esc(inst.assinaturaTecnico)}" alt="Assinatura técnico" class="sig-img" />`
    : '<div class="sig-line"></div>'

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${esc(titulo)}</title>
<style>
  body { font-family: Arial, sans-serif; color: #111; margin: 24px; font-size: 12px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; border-bottom: 2px solid #00a844; padding-bottom: 12px; margin-bottom: 16px; }
  .logo { max-width: 120px; max-height: 80px; }
  h1 { margin: 0; font-size: 18px; color: #007a33; letter-spacing: 0.04em; }
  .meta { margin: 4px 0; color: #444; }
  h3 { margin: 16px 0 8px; font-size: 13px; color: #007a33; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  th, td { border: 1.5px solid #94a3b8; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #f0f0f0; font-size: 11px; }
  .motivo { font-size: 11px; color: #555; margin-top: 4px; }
  .sigs { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 28px; }
  .sig-box { border-top: 1px solid #333; padding-top: 8px; min-height: 90px; }
  .sig-label { font-size: 10px; font-weight: bold; margin-bottom: 6px; }
  .sig-img { max-width: 220px; max-height: 70px; display: block; }
  .sig-line { height: 50px; }
  .nome-tecnico { font-weight: bold; margin-top: 6px; }
  @media print { body { margin: 12px; } }
</style></head><body>
<div class="head">
  <div>${logoHtml}</div>
  <div style="text-align:right;flex:1">
    <h1>${esc(titulo)}</h1>
    <p class="meta"><strong>${esc(labels.cliente || 'Cliente')}:</strong> ${esc(inst.clienteNome)}</p>
    <p class="meta"><strong>${esc(labels.checklistBasicoDataInspecao || 'Data')}:</strong> ${esc(inst.data)}</p>
    <p class="meta"><strong>${esc(labels.checklistBasicoTipo || 'Tipo')}:</strong> ${esc(inst.equipamento.tipoEquipamento)} · ${esc(inst.equipamento.modelo)} · ${esc(inst.equipamento.numeroSerie)}</p>
  </div>
</div>
${rows || `<p>${esc(labels.checklistBasicoGruposTitulo || '')}</p>`}
<div class="sigs">
  <div class="sig-box">
    <div class="sig-label">${esc(labels.checklistBasicoAssinaturaTecnico || labels.assinaturaTecnico || 'Assinatura do técnico')}</div>
    ${assinaturaTecnico}
    <div class="nome-tecnico">${esc(labels.tecnicoResponsavel || 'Técnico')}: ${esc(inst.tecnicoNome || '—')}</div>
    ${inst.dataAssinaturaTecnico ? `<div class="meta">${esc(labels.dataAssinatura || 'Data')}: ${esc(new Date(inst.dataAssinaturaTecnico).toLocaleString())}</div>` : ''}
  </div>
</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`
}

export function openChecklistBasicoPrint(
  inst: ChecklistBasicoInstancia,
  labels: ChecklistBasicoPdfLabels,
  logoUrl?: string | null,
  logoType?: string | null
): void {
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

export function buildChecklistBasicoEnvioTexto(
  inst: ChecklistBasicoInstancia,
  labels: ChecklistBasicoPdfLabels
): string {
  const titulo = labels.checklistBasicoPageTitle || 'CHECKLIST BÁSICO'
  const lines = [
    titulo,
    `${labels.cliente || 'Cliente'}: ${inst.clienteNome}`,
    `${labels.checklistBasicoDataInspecao || 'Data'}: ${inst.data}`,
    `${labels.tecnicoResponsavel || 'Técnico'}: ${inst.tecnicoNome || '—'}`,
    `${labels.checklistBasicoTipo || 'Equipamento'}: ${[inst.equipamento.tipoEquipamento, inst.equipamento.modelo, inst.equipamento.numeroSerie].filter(Boolean).join(' · ')}`,
    '',
    labels.checklistBasicoEnvioCorpo || 'Segue em anexo o checklist de inspeção/revisão. Obrigado.',
  ]
  return lines.join('\n')
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
