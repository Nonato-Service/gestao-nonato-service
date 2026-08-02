import type { RelatorioEquipamentoRef } from './relatorioServicoEquipamentos'
import {
  aplicarTotaisNoRelatorioEspecial,
  calcularTotaisRelatorioEspecial,
  coletarSessoesPorEquipamento,
  formatDiaCurtoPt,
  formatMinutosComoHHMM,
  sortDiasTrabalhoEspecialCronologicamente,
} from './relatorioEspecialCalculos'
import type { RelatorioEspecial } from './relatorioEspecialTypes'
import { wrapRelatorioServicoPrintDocument } from './relatorioServicoPdfShell'
import { RELATORIO_SERVICO_PDF_PRINT_CSS } from './relatorioServicoPdfPrintCss'

export type RelatorioEspecialPdfLabels = Record<string, string | undefined>

function L(labels: RelatorioEspecialPdfLabels | undefined, key: string, fallback: string): string {
  const v = labels?.[key]
  return v != null && String(v).trim() !== '' ? String(v) : fallback
}

function cabecalhoEquipamentoPdf(
  eq: RelatorioEquipamentoRef,
  labels: RelatorioEspecialPdfLabels | undefined,
  idx: number
): string {
  const id = (eq.equipamentoId || '').trim() || '—'
  const modelo = (eq.maquinaModelo || '').trim() || '—'
  const sn = (eq.numeroMaquina || '').trim() || '—'
  return `
    <table class="re-especial-table re-equip-ident" style="margin-bottom:8px">
      <thead>
        <tr>
          <th>#</th>
          <th>${escapeHtml(L(labels, 'relatorioEquipamentoIdLabel', 'ID'))}</th>
          <th>${escapeHtml(L(labels, 'modelo', 'Modelo'))}</th>
          <th>S/N</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${idx + 1}</td>
          <td>${escapeHtml(id)}</td>
          <td>${escapeHtml(modelo)}</td>
          <td>${escapeHtml(sn)}</td>
        </tr>
      </tbody>
    </table>`
}

function formatHorarioIntervalo(inicio: string, fim: string): string {
  const a = (inicio || '').trim()
  const b = (fim || '').trim()
  if (a && b) return `${a} – ${b}`
  if (a) return a
  if (b) return b
  return '—'
}

export function imprimirRelatorioEspecialPdf(
  relatorio: RelatorioEspecial,
  labels?: RelatorioEspecialPdfLabels
): void {
  const rel = aplicarTotaisNoRelatorioEspecial(relatorio)
  const dias = sortDiasTrabalhoEspecialCronologicamente(rel.diasTrabalho || [])
  const equipamentos = rel.equipamentos || []
  const sessoesPorEquip = coletarSessoesPorEquipamento(dias)
  const totais = calcularTotaisRelatorioEspecial(dias)
  const totalAlmocoFmt =
    totais.horasAlmocoTotal > 0 ? formatMinutosComoHHMM(totais.horasAlmocoTotal) : ''
  const totalBrutoFmt = formatMinutosComoHHMM(totais.horasTrabalhoBruto)
  const linhaDescontoAlmoco =
    totais.horasAlmocoTotal > 0
      ? `<div style="font-size:11px;font-weight:500;margin-top:4px;color:#555">${escapeHtml(L(labels, 'relatorioEspecialPdfTotalBruto', 'Total bruto'))}: ${escapeHtml(totalBrutoFmt)} · ${escapeHtml(L(labels, 'horaAlmoco', 'Almoço'))}: −${escapeHtml(totalAlmocoFmt)}</div>`
      : ''

  const tabelaEquipamentos = equipamentos.length
    ? `<h3 class="re-secao-titulo">${escapeHtml(L(labels, 'relatorioEspecialEquipamentos', 'Equipamentos'))} (${equipamentos.length})</h3>
  <table class="re-especial-table">
    <thead><tr><th>#</th><th>${escapeHtml(L(labels, 'relatorioEquipamentoIdLabel', 'ID'))}</th><th>${escapeHtml(L(labels, 'modelo', 'Modelo'))}</th><th>S/N</th></tr></thead>
    <tbody>
      ${equipamentos
        .map(
          (eq, i) =>
            `<tr><td>${i + 1}</td><td>${escapeHtml(eq.equipamentoId || '—')}</td><td>${escapeHtml(eq.maquinaModelo || '—')}</td><td>${escapeHtml(eq.numeroMaquina || '—')}</td></tr>`
        )
        .join('')}
    </tbody>
  </table>`
    : ''

  const linhasDeslocamento = dias
    .map((dia) => {
      const almoco = (dia.tempoPausa || '').trim()
      return `<tr>
        <td>${escapeHtml(formatDiaCurtoPt(dia.data))}</td>
        <td>${escapeHtml(formatHorarioIntervalo(dia.idaHora, dia.idaChegada))}</td>
        <td>${escapeHtml(dia.idaDuracao || '—')}</td>
        <td>${escapeHtml(formatHorarioIntervalo(dia.retornoSaida, dia.retornoChegada))}</td>
        <td>${escapeHtml(dia.retornoDuracao || '—')}</td>
        <td>${escapeHtml(dia.kmTotal || '—')}</td>
        <td>${escapeHtml(almoco || '—')}</td>
        <td>${escapeHtml(dia.descricaoTrabalho || '')}</td>
      </tr>`
    })
    .join('')

  const blocosEquipamentos = equipamentos
    .map((eq, i) => {
      const sessoes = sessoesPorEquip[eq.uid] || []
      const total = rel.horasPorEquipamentoResumo?.[eq.uid] || '0:00'
      const linhas =
        sessoes.length > 0
          ? sessoes
              .map(
                (s) =>
                  `<tr>
            <td>${escapeHtml(s.dataFormatada)}</td>
            <td>${escapeHtml(formatHorarioIntervalo(s.horasInicio, s.horasFim))}</td>
            <td style="text-align:center;font-weight:600">${escapeHtml(s.horasDuracao || '—')}</td>
          </tr>`
              )
              .join('')
          : `<tr><td colspan="3" style="text-align:center;color:#666">${escapeHtml(L(labels, 'relatorioEspecialPdfSemSessoesEquip', 'Sem horas registadas'))}</td></tr>`

      return `
      <div class="re-equip-bloco">
        ${cabecalhoEquipamentoPdf(eq, labels, i)}
        <table class="re-especial-table re-equip-bloco__tabela">
          <thead>
            <tr>
              <th>${escapeHtml(L(labels, 'relatorioEspecialPdfColDias', 'Dias'))}</th>
              <th>${escapeHtml(L(labels, 'relatorioEspecialPdfColHorario', 'Horário'))}</th>
              <th>${escapeHtml(L(labels, 'total', 'Total'))}</th>
            </tr>
          </thead>
          <tbody>
            ${linhas}
            <tr class="re-equip-bloco__total">
              <td colspan="2" style="text-align:right;font-weight:700">${escapeHtml(L(labels, 'relatorioEspecialTotalEquipamento', 'Total do equipamento'))}</td>
              <td style="text-align:center;font-weight:700;color:#00695c">${escapeHtml(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>`
    })
    .join('')

  const body = `
<style>${RELATORIO_SERVICO_PDF_PRINT_CSS}
.re-especial-table { width:100%; border-collapse:collapse; font-size:10px; margin-top:8px; }
.re-especial-table th, .re-especial-table td { border:1px solid #ccc; padding:5px 8px; vertical-align:top; }
.re-especial-table th { background:#e8f5e9; text-align:left; }
.re-equip-bloco { margin-top:18px; page-break-inside:avoid; }
.re-equip-bloco__titulo { margin:0 0 6px; font-size:12px; color:#00695c; }
.re-equip-bloco__total td { background:#f1f8e9; }
.re-totais-box { margin-top:20px; display:flex; flex-wrap:wrap; gap:12px; }
.re-total-card { border:1px solid #00c853; border-radius:8px; padding:10px 14px; min-width:140px; }
.re-total-card strong { display:block; font-size:18px; color:#00695c; }
.re-secao-titulo { margin:20px 0 8px; font-size:13px; color:#333; border-bottom:1px solid #ccc; padding-bottom:4px; }
</style>
<div class="pdf-doc">
  <h1 style="text-align:center;margin:0 0 8px">${escapeHtml(L(labels, 'relatorioEspecialPdfDocTitle', 'RELATÓRIO ESPECIAL DE SERVIÇO'))}</h1>
  <p style="text-align:center;margin:0 0 16px;font-size:12px;color:#555">${escapeHtml(L(labels, 'relatorioEspecialSubtitle', 'Intervenção fabricante — horas por equipamento'))}</p>
  <table style="width:100%;font-size:11px;margin-bottom:12px">
    <tr><td><strong>${escapeHtml(L(labels, 'numeroRelatorio', 'N.º'))}</strong> ${escapeHtml(rel.numero)}</td><td><strong>${escapeHtml(L(labels, 'data', 'Data ref.'))}</strong> ${escapeHtml(rel.data)}</td></tr>
    <tr><td><strong>${escapeHtml(L(labels, 'cliente', 'Cliente'))}</strong> ${escapeHtml(rel.cliente)}</td><td><strong>${escapeHtml(L(labels, 'selecioneTecnico', 'Técnico'))}</strong> ${escapeHtml(rel.tecnico)}</td></tr>
    <tr><td><strong>${escapeHtml(L(labels, 'cidade', 'Cidade'))}</strong> ${escapeHtml(rel.cidade || '—')}</td><td><strong>${escapeHtml(L(labels, 'tipoServico', 'Tipo'))}</strong> ${escapeHtml(rel.tipoServico || '—')}</td></tr>
  </table>

  ${tabelaEquipamentos}

  <h3 class="re-secao-titulo">${escapeHtml(L(labels, 'relatorioEspecialPdfDeslocamentos', 'Deslocamentos por dia'))}</h3>
  <table class="re-especial-table">
    <thead>
      <tr>
        <th>${escapeHtml(L(labels, 'data', 'Data'))}</th>
        <th>${escapeHtml(L(labels, 'relatorioEspecialIdaCliente', L(labels, 'relatorioEspecialPdfIda', 'Ida')))}</th>
        <th>${escapeHtml(L(labels, 'duracao', 'Duração'))}</th>
        <th>${escapeHtml(L(labels, 'relatorioEspecialSaidaCliente', L(labels, 'relatorioEspecialPdfRetorno', 'Retorno')))}</th>
        <th>${escapeHtml(L(labels, 'duracao', 'Duração'))}</th>
        <th>KM</th>
        <th>${escapeHtml(L(labels, 'horaAlmoco', L(labels, 'tempoPausa', 'Almoço')))}</th>
        <th>${escapeHtml(L(labels, 'relatorioEspecialPdfDescricao', 'Descrição'))}</th>
      </tr>
    </thead>
    <tbody>
      ${linhasDeslocamento || `<tr><td colspan="8">${escapeHtml(L(labels, 'relatorioEspecialPdfSemDias', 'Sem dias registados'))}</td></tr>`}
    </tbody>
  </table>

  <h3 class="re-secao-titulo">${escapeHtml(L(labels, 'relatorioEspecialPdfControloHoras', 'Controlo de horas por equipamento'))}</h3>
  ${blocosEquipamentos || `<p>${escapeHtml(L(labels, 'relatorioEspecialSemEquipamentos', 'Sem equipamentos'))}</p>`}

  <div style="margin-top:16px;padding:10px 14px;background:#e8f5e9;border:1px solid #00c853;border-radius:8px;font-weight:700;text-align:center">
    ${escapeHtml(L(labels, 'relatorioEspecialPdfTotalGeralLabel', 'TOTAL GERAL DE HORAS DE TRABALHO'))}: ${escapeHtml(rel.horasTrabalho || '0:00')}
    ${linhaDescontoAlmoco}
  </div>

  <div class="re-totais-box">
    <div class="re-total-card"><span>${escapeHtml(L(labels, 'relatorioEspecialPdfHorasTrabalho', 'Horas trabalho'))}</span><strong>${escapeHtml(rel.horasTrabalho || '0:00')}</strong></div>
    <div class="re-total-card"><span>${escapeHtml(L(labels, 'kmTotal', 'KM total'))}</span><strong>${escapeHtml(rel.kmsPercorridos || '0')}</strong></div>
    <div class="re-total-card"><span>${escapeHtml(L(labels, 'relatorioEspecialPdfHorasViagem', 'Horas viagem'))}</span><strong>${escapeHtml(rel.horasViagem || '0:00')}</strong></div>
  </div>
  ${
    rel.observacoes
      ? `<h3>${escapeHtml(L(labels, 'observacoes', 'Observações'))}</h3><p style="white-space:pre-wrap;font-size:11px">${escapeHtml(rel.observacoes)}</p>`
      : ''
  }
  ${
    rel.assinaturaCliente
      ? `<div style="margin-top:24px"><p><strong>${escapeHtml(L(labels, 'relatorioEspecialPdfAssinatura', 'Assinatura do cliente'))}</strong></p><img src="${rel.assinaturaCliente}" alt="Assinatura" style="max-width:280px;border:1px solid #ccc"/></div>`
      : ''
  }
</div>`

  const html = wrapRelatorioServicoPrintDocument({
    title: `${L(labels, 'relatorioEspecialTitle', 'Relatório Especial')} ${rel.numero}`,
    bodyClass: 'rs-pdf rs-pdf--especial',
    baseCss: RELATORIO_SERVICO_PDF_PRINT_CSS,
    bodyHtml: body,
    showToolbar: true,
    toolbarLabels: {
      titulo: L(labels, 'relatorioEspecialPdfToolbarTitulo', 'Relatório Especial — PDF'),
      imprimir: L(labels, 'imprimirGuardarPDF', 'Imprimir / Guardar PDF'),
      fechar: L(labels, 'voltar', 'Fechar'),
    },
  })

  const w = window.open('', '_blank')
  if (!w) {
    alert(L(labels, 'relatorioEspecialPdfPopupBlocked', 'Permita pop-ups para imprimir o PDF.'))
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
