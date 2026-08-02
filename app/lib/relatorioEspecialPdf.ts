import type { RelatorioEquipamentoRef } from './relatorioServicoEquipamentos'
import {
  aplicarTotaisNoRelatorioEspecial,
  formatDiaCurtoPt,
  sortDiasTrabalhoEspecialCronologicamente,
} from './relatorioEspecialCalculos'
import type { RelatorioEspecial } from './relatorioEspecialTypes'
import { wrapRelatorioServicoPrintDocument } from './relatorioServicoPdfShell'
import { RELATORIO_SERVICO_PDF_PRINT_CSS } from './relatorioServicoPdfPrintCss'

function labelEquipamento(eq: RelatorioEquipamentoRef, idx: number): string {
  const id = (eq.equipamentoId || eq.numeroMaquina || '').trim()
  const modelo = (eq.maquinaModelo || '').trim()
  const sn = (eq.numeroMaquina || '').trim()
  const parts = [`#${idx + 1}`]
  if (id) parts.push(id)
  if (modelo) parts.push(modelo)
  if (sn && sn !== id) parts.push(`S/N ${sn}`)
  return parts.join(' · ')
}

export function imprimirRelatorioEspecialPdf(relatorio: RelatorioEspecial): void {
  const rel = aplicarTotaisNoRelatorioEspecial(relatorio)
  const dias = sortDiasTrabalhoEspecialCronologicamente(rel.diasTrabalho || [])
  const equipamentos = rel.equipamentos || []

  const theadEquipCols = equipamentos
    .map(
      (eq, i) =>
        `<th colspan="3">${escapeHtml(labelEquipamento(eq, i))}</th>`
    )
    .join('')

  const linhasDias = dias
    .map((dia) => {
      const cols = equipamentos
        .map((eq) => {
          const linha = (dia.horasPorEquipamento || []).find((h) => h.equipamentoUid === eq.uid)
          if (!linha) {
            return '<td>—</td><td>—</td><td>—</td>'
          }
          return `<td>${escapeHtml(linha.horasInicio || '—')}</td><td>${escapeHtml(linha.horasFim || '—')}</td><td><strong>${escapeHtml(linha.horasDuracao || '—')}</strong></td>`
        })
        .join('')
      return `<tr>
        <td>${escapeHtml(formatDiaCurtoPt(dia.data))}</td>
        <td>${escapeHtml(dia.idaHora || '—')}</td>
        <td>${escapeHtml(dia.idaChegada || '—')}</td>
        <td>${escapeHtml(dia.idaDuracao || '—')}</td>
        <td>${escapeHtml(dia.retornoSaida || '—')}</td>
        <td>${escapeHtml(dia.retornoChegada || '—')}</td>
        <td>${escapeHtml(dia.retornoDuracao || '—')}</td>
        <td>${escapeHtml(dia.kmTotal || '—')}</td>
        ${cols}
        <td>${escapeHtml(dia.descricaoTrabalho || '')}</td>
      </tr>`
    })
    .join('')

  const subheadEquip = equipamentos.map(() => '<th>Início</th><th>Fim</th><th>Total</th>').join('')

  const totaisEquip = equipamentos
    .map((eq, i) => {
      const total = rel.horasPorEquipamentoResumo?.[eq.uid] || '0:00'
      return `<tr><td colspan="3"><strong>${escapeHtml(labelEquipamento(eq, i))}</strong></td><td colspan="8"></td><td colspan="3" style="text-align:center;font-weight:700">${escapeHtml(total)}</td><td></td></tr>`
    })
    .join('')

  const body = `
<style>${RELATORIO_SERVICO_PDF_PRINT_CSS}
.re-especial-table { width:100%; border-collapse:collapse; font-size:10px; margin-top:12px; }
.re-especial-table th, .re-especial-table td { border:1px solid #ccc; padding:4px 6px; vertical-align:top; }
.re-especial-table th { background:#e8f5e9; }
.re-totais-box { margin-top:16px; display:flex; flex-wrap:wrap; gap:12px; }
.re-total-card { border:1px solid #00c853; border-radius:8px; padding:10px 14px; min-width:140px; }
.re-total-card strong { display:block; font-size:18px; color:#00695c; }
</style>
<div class="pdf-doc">
  <h1 style="text-align:center;margin:0 0 8px">RELATÓRIO ESPECIAL DE SERVIÇO</h1>
  <p style="text-align:center;margin:0 0 16px;font-size:12px;color:#555">Intervenção fabricante — horas por equipamento</p>
  <table style="width:100%;font-size:11px;margin-bottom:12px">
    <tr><td><strong>N.º</strong> ${escapeHtml(rel.numero)}</td><td><strong>Data ref.</strong> ${escapeHtml(rel.data)}</td></tr>
    <tr><td><strong>Cliente</strong> ${escapeHtml(rel.cliente)}</td><td><strong>Técnico</strong> ${escapeHtml(rel.tecnico)}</td></tr>
    <tr><td><strong>Cidade</strong> ${escapeHtml(rel.cidade || '—')}</td><td><strong>Tipo</strong> ${escapeHtml(rel.tipoServico || '—')}</td></tr>
  </table>
  <h3>Equipamentos (${equipamentos.length})</h3>
  <table class="re-especial-table">
    <thead><tr><th>#</th><th>ID</th><th>Modelo</th><th>S/N</th></tr></thead>
    <tbody>
      ${equipamentos
        .map(
          (eq, i) =>
            `<tr><td>${i + 1}</td><td>${escapeHtml(eq.equipamentoId || '—')}</td><td>${escapeHtml(eq.maquinaModelo || '—')}</td><td>${escapeHtml(eq.numeroMaquina || '—')}</td></tr>`
        )
        .join('')}
    </tbody>
  </table>
  <h3>Controlo de horas por equipamento</h3>
  <table class="re-especial-table">
    <thead>
      <tr>
        <th rowspan="2">Data</th>
        <th colspan="3">Ida</th>
        <th colspan="3">Retorno</th>
        <th rowspan="2">KM</th>
        ${theadEquipCols}
        <th rowspan="2">Descrição</th>
      </tr>
      <tr>
        <th>Início</th><th>Chegada</th><th>Duração</th>
        <th>Saída</th><th>Chegada</th><th>Duração</th>
        ${subheadEquip}
      </tr>
    </thead>
    <tbody>
      ${linhasDias || '<tr><td colspan="20">Sem dias registados</td></tr>'}
      ${totaisEquip}
      <tr style="background:#e8f5e9;font-weight:700">
        <td colspan="${8 + equipamentos.length * 3}">TOTAL GERAL DE HORAS DE TRABALHO</td>
        <td colspan="3" style="text-align:center">${escapeHtml(rel.horasTrabalho || '0:00')}</td>
        <td></td>
      </tr>
    </tbody>
  </table>
  <div class="re-totais-box">
    <div class="re-total-card"><span>Horas trabalho</span><strong>${escapeHtml(rel.horasTrabalho || '0:00')}</strong></div>
    <div class="re-total-card"><span>KM total</span><strong>${escapeHtml(rel.kmsPercorridos || '0')}</strong></div>
    <div class="re-total-card"><span>Horas viagem</span><strong>${escapeHtml(rel.horasViagem || '0:00')}</strong></div>
  </div>
  ${
    rel.observacoes
      ? `<h3>Observações</h3><p style="white-space:pre-wrap;font-size:11px">${escapeHtml(rel.observacoes)}</p>`
      : ''
  }
  ${
    rel.assinaturaCliente
      ? `<div style="margin-top:24px"><p><strong>Assinatura do cliente</strong></p><img src="${rel.assinaturaCliente}" alt="Assinatura" style="max-width:280px;border:1px solid #ccc"/></div>`
      : ''
  }
</div>`

  const html = wrapRelatorioServicoPrintDocument({
    title: `Relatório Especial ${rel.numero}`,
    bodyClass: 'rs-pdf rs-pdf--especial',
    baseCss: RELATORIO_SERVICO_PDF_PRINT_CSS,
    bodyHtml: body,
    showToolbar: true,
    toolbarLabels: {
      titulo: 'Relatório Especial — PDF',
      imprimir: 'Imprimir / Guardar PDF',
      fechar: 'Fechar',
    },
  })

  const w = window.open('', '_blank')
  if (!w) {
    alert('Permita pop-ups para imprimir o PDF.')
    return
  }
  w.document.write(html)
  w.document.close()
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
