import type { RelatorioEquipamentoRef } from './relatorioServicoEquipamentos'
import type { SessaoHorasEquipamentoEspecial } from './relatorioEspecialCalculos'
import {
  aplicarTotaisNoRelatorioEspecial,
  atualizarCalculosDiaEspecial,
  calcularTotaisRelatorioEspecial,
  coletarSessoesPorEquipamento,
  formatDiaComDiaSemana,
  formatMinutosComoHHMM,
  getDiaSemanaInfo,
  resumoHorasTrabalhoDia,
  sortDiasTrabalhoEspecialCronologicamente,
} from './relatorioEspecialCalculos'
import type { DiaTrabalhoEspecial, RelatorioEspecial } from './relatorioEspecialTypes'
import {
  buildPdfDocumentFooterHtml,
  buildPdfDocumentHeaderHtml,
  buildPdfMetaSectionHtml,
  escapePdfHtml,
  PDF_TABLE_CELL_BORDER,
  type PdfMetaField,
} from './pdfDocumentLayout'
import { RELATORIO_SERVICO_PDF_PRINT_CSS } from './relatorioServicoPdfPrintCss'
import { wrapRelatorioServicoPrintDocument } from './relatorioServicoPdfShell'

export type RelatorioEspecialPdfLabels = Record<string, string | undefined>

export type RelatorioEspecialPdfOptions = {
  labels?: RelatorioEspecialPdfLabels
  logoHtml?: string
  empresaNome?: string
}

function L(labels: RelatorioEspecialPdfLabels | undefined, key: string, fallback: string): string {
  const v = labels?.[key]
  return v != null && String(v).trim() !== '' ? String(v) : fallback
}

const RELATORIO_ESPECIAL_PDF_CSS = `
body.rs-pdf--especial .re-doc {
  max-width: 100%;
}

.re-secao {
  margin: 0 0 18px;
  break-inside: avoid;
  page-break-inside: avoid;
}

.re-secao__titulo {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 10px;
  margin: 0 0 10px;
  padding: 0 0 7px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #1e293b;
  border-bottom: 2px solid #0d7a3d;
}

.re-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0 0 4px;
  font-size: 0.92em;
  page-break-inside: auto;
}

.re-table th,
.re-table td {
  border: ${PDF_TABLE_CELL_BORDER};
  padding: 7px 9px;
  vertical-align: middle;
  text-align: left;
}

.re-table th {
  background: #1e293b;
  color: #f8fafc;
  font-weight: 600;
  font-size: 0.88em;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.re-table tbody tr:nth-child(even) td {
  background: #f8fafc;
}

.re-table .re-col-num {
  width: 36px;
  text-align: center;
  font-weight: 700;
  color: #1e3a5f;
}

.re-table .re-col-total {
  text-align: center;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.re-table--dias {
  font-size: 0.82em;
}

.re-table--dias th,
.re-table--dias td {
  padding: 5px 4px;
  text-align: center;
  vertical-align: middle;
}

.re-table .re-row-total td {
  background: #e8f5e9 !important;
  border-top: 2px solid #0d7a3d;
  font-weight: 700;
  color: #1b5e20;
}

.re-table .re-row-total .re-col-total {
  font-size: 1.05em;
  color: #0d7a3d;
}

.re-equip-card {
  margin: 0 0 18px;
  border: 2px solid #0d7a3d;
  border-radius: 6px;
  overflow: hidden;
  break-inside: avoid;
  page-break-inside: avoid;
  box-shadow: 0 1px 4px rgba(13, 122, 61, 0.12);
}

.re-equip-card__head {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0;
  background: linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%);
  border-bottom: 2px solid #0d7a3d;
}

.re-equip-card__num {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  padding: 14px 12px;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  background: #0d7a3d;
  border-right: 2px solid #065f2a;
}

.re-equip-card__meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
}

.re-equip-card__field {
  padding: 12px 14px;
  border-right: 1px solid #86efac;
  background: rgba(255, 255, 255, 0.45);
}

.re-equip-card__field:last-child {
  border-right: none;
}

.re-equip-card__label {
  display: block;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #0d7a3d;
  margin-bottom: 6px;
  line-height: 1.25;
}

.re-equip-card__value {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  word-break: break-word;
  line-height: 1.4;
}

.re-equip-card__value--mono {
  font-family: Consolas, "Courier New", monospace;
  font-size: 14px;
  letter-spacing: 0.02em;
  color: #1e3a5f;
}

.re-equip-card__value--modelo {
  font-size: 12px;
  font-weight: 700;
  color: #1b5e20;
}

.re-equip-card__body {
  padding: 0;
}

.re-equip-card__body .re-table {
  margin: 0;
  border: none;
}

.re-equip-card__body .re-table th,
.re-equip-card__body .re-table td {
  border-left: none;
  border-right: none;
}

.re-equip-card__body .re-table th {
  background: #1e293b;
  font-size: 0.9em;
  padding: 9px 10px;
}

.re-equip-card__body .re-table td {
  padding: 9px 10px;
  font-size: 0.95em;
}

.re-total-geral {
  margin: 20px 0 16px;
  padding: 14px 18px;
  background: linear-gradient(135deg, #0d7a3d 0%, #059669 100%);
  border-radius: 4px;
  text-align: center;
  color: #fff;
  break-inside: avoid;
  page-break-inside: avoid;
}

.re-total-geral__label {
  display: block;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.9;
  margin-bottom: 4px;
}

.re-total-geral__valor {
  display: block;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.2;
}

.re-total-geral__detalhe {
  margin-top: 8px;
  font-size: 9px;
  font-weight: 500;
  opacity: 0.92;
  line-height: 1.5;
}

.re-total-geral--topo {
  margin: 0 0 18px;
  padding: 18px 20px;
}

.re-total-geral--topo .re-total-geral__valor {
  font-size: 28px;
}

.re-dia-duracao-detalhe {
  font-size: 7.5px;
  font-weight: 500;
  color: #64748b;
  margin-top: 2px;
  line-height: 1.3;
}

.re-table tfoot .re-row-total td {
  background: #e8f5e9 !important;
  border-top: 2px solid #0d7a3d;
  font-weight: 700;
  color: #1b5e20;
}

.re-equip-card__body .re-sessao-bruto {
  font-size: 7.5px;
  color: #64748b;
  margin-top: 1px;
}

.re-resumo {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 0 0 18px;
}

.re-resumo-card {
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 10px 12px;
  text-align: center;
  background: #fff;
}

.re-resumo-card__label {
  display: block;
  font-size: 7px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 5px;
}

.re-resumo-card__valor {
  display: block;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 16px;
  font-weight: 700;
  color: #0d7a3d;
  font-variant-numeric: tabular-nums;
}

.re-resumo-card--highlight {
  border: 2px solid #0d7a3d;
  background: linear-gradient(180deg, #ecfdf5 0%, #ffffff 100%);
  grid-column: 1 / -1;
}

.re-resumo-card--highlight .re-resumo-card__valor {
  font-size: 24px;
}

.re-assinatura {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  break-inside: avoid;
  page-break-inside: avoid;
}

.re-assinatura__titulo {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 10px;
}

.re-assinatura img {
  display: block;
  max-width: 260px;
  max-height: 80px;
  border: 1px solid #e2e8f0;
  border-radius: 2px;
  padding: 6px;
  background: #fff;
}

.re-obs {
  margin: 0 0 16px;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-left: 3px solid #0d7a3d;
  border-radius: 0 2px 2px 0;
  background: #fafafa;
  break-inside: avoid;
  page-break-inside: avoid;
}

.re-obs__titulo {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #1e293b;
  margin-bottom: 6px;
}

.re-obs__texto {
  font-size: 10px;
  white-space: pre-wrap;
  line-height: 1.55;
  color: #334155;
}

@media print {
  .re-equip-card,
  .re-total-geral,
  .re-secao {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
`.trim()

function formatDuracaoDiaPdf(
  resumo: ReturnType<typeof resumoHorasTrabalhoDia>,
  esc: (s: string) => string,
  labelAlmoco: string
): string {
  if (!resumo.temHoras) return '—'
  if (resumo.almocoMinutos > 0 && resumo.duracaoBruta !== resumo.duracaoLiquida) {
    return `<strong>${esc(resumo.duracaoLiquida)}</strong><div class="re-dia-duracao-detalhe">${esc(resumo.duracaoBruta)} − ${esc(resumo.almocoFmt)} ${esc(labelAlmoco)}</div>`
  }
  return `<strong>${esc(resumo.duracaoLiquida)}</strong>`
}

function buildTotalGeralBannerHtml(
  rel: RelatorioEspecial,
  totais: ReturnType<typeof calcularTotaisRelatorioEspecial>,
  labels: RelatorioEspecialPdfLabels | undefined,
  modifier = ''
): string {
  const esc = escapePdfHtml
  const totalAlmocoFmt =
    totais.horasAlmocoTotal > 0 ? formatMinutosComoHHMM(totais.horasAlmocoTotal) : ''
  const totalBrutoFmt = formatMinutosComoHHMM(totais.horasTrabalhoBruto)
  const detalheAlmoco =
    totais.horasAlmocoTotal > 0
      ? `<div class="re-total-geral__detalhe">${esc(L(labels, 'relatorioEspecialPdfTotalBruto', 'Horas trabalho (bruto)'))}: ${esc(totalBrutoFmt)} · ${esc(L(labels, 'horaAlmoco', 'Almoço descontado'))}: −${esc(totalAlmocoFmt)} · ${esc(L(labels, 'relatorioEspecialPdfTotalLiquido', 'Total líquido'))}: ${esc(rel.horasTrabalho || '0:00')}</div>`
      : `<div class="re-total-geral__detalhe">${esc(L(labels, 'relatorioEspecialPdfTotalLiquidoHint', 'Soma de todas as horas de trabalho nos equipamentos.'))}</div>`

  return `<div class="re-total-geral${modifier}">
    <span class="re-total-geral__label">${esc(L(labels, 'relatorioEspecialPdfTotalGeralLabel', 'TOTAL DE HORAS DE TRABALHO'))}</span>
    <span class="re-total-geral__valor">${esc(rel.horasTrabalho || '0:00')}</span>
    ${detalheAlmoco}
  </div>`
}

function resumoHorasDiaPdf(diaCalc: DiaTrabalhoEspecial): ReturnType<typeof resumoHorasTrabalhoDia> {
  return resumoHorasTrabalhoDia(diaCalc)
}

function formatHorarioIntervalo(inicio: string, fim: string): string {
  const a = (inicio || '').trim()
  const b = (fim || '').trim()
  if (a && b) return `${a} – ${b}`
  if (a) return a
  if (b) return b
  return '—'
}

function buildMetaRelatorioEspecialHtml(
  rel: RelatorioEspecial,
  labels: RelatorioEspecialPdfLabels | undefined
): string {
  const esc = escapePdfHtml
  const fields: PdfMetaField[] = [
    { label: esc(L(labels, 'cliente', 'Cliente')), value: esc(rel.cliente || '—'), fullWidth: true },
    { label: esc(L(labels, 'selecioneTecnico', 'Técnico')), value: esc(rel.tecnico || '—') },
    { label: esc(L(labels, 'data', 'Data ref.')), value: esc(rel.data || '—') },
    { label: esc(L(labels, 'cidade', 'Cidade')), value: esc(rel.cidade || '—') },
    { label: esc(L(labels, 'tipoServico', 'Tipo de serviço')), value: esc(rel.tipoServico || '—') },
  ]
  return buildPdfMetaSectionHtml({
    title: esc(L(labels, 'relatorioEspecialPdfInfoGeral', 'Informações gerais')),
    fields,
    modifier: 'expense',
  })
}

function buildTabelaEquipamentosResumoHtml(
  equipamentos: RelatorioEquipamentoRef[],
  labels: RelatorioEspecialPdfLabels | undefined
): string {
  if (!equipamentos.length) return ''
  const esc = escapePdfHtml
  const rows = equipamentos
    .map(
      (eq, i) =>
        `<tr>
          <td class="re-col-num">${i + 1}</td>
          <td>${esc(eq.equipamentoId || '—')}</td>
          <td>${esc(eq.maquinaModelo || '—')}</td>
          <td style="font-family:Consolas,'Courier New',monospace">${esc(eq.numeroMaquina || '—')}</td>
        </tr>`
    )
    .join('')

  return `<section class="re-secao">
    <h3 class="re-secao__titulo">${esc(L(labels, 'relatorioEspecialEquipamentos', 'Equipamentos'))} (${equipamentos.length})</h3>
    <table class="re-table">
      <thead>
        <tr>
          <th class="re-col-num">#</th>
          <th>${esc(L(labels, 'relatorioEquipamentoIdLabel', 'ID'))}</th>
          <th>${esc(L(labels, 'modelo', 'Modelo'))}</th>
          <th>${esc(L(labels, 'numeroSerie', 'N.º série'))}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </section>`
}

function buildEquipamentoCardHtml(
  eq: RelatorioEquipamentoRef,
  idx: number,
  total: string,
  sessoes: SessaoHorasEquipamentoEspecial[] | undefined,
  labels: RelatorioEspecialPdfLabels | undefined
): string {
  const esc = escapePdfHtml
  const lista = sessoes || []
  const linhas =
    lista.length > 0
      ? lista
          .map(
            (s) =>
              `<tr>
                <td>${esc(s.dataFormatada)}</td>
                <td>${esc(formatHorarioIntervalo(s.horasInicio, s.horasFim))}</td>
                <td class="re-col-total"><strong>${esc(s.horasDuracao || '—')}</strong></td>
              </tr>`
          )
          .join('')
      : `<tr><td colspan="3" style="text-align:center;color:#64748b;font-style:italic">${esc(L(labels, 'relatorioEspecialPdfSemSessoesEquip', 'Sem horas registadas'))}</td></tr>`

  return `<article class="re-equip-card">
    <div class="re-equip-card__head">
      <div class="re-equip-card__num">${idx + 1}</div>
      <div class="re-equip-card__meta">
        <div class="re-equip-card__field">
          <span class="re-equip-card__label">${esc(L(labels, 'relatorioEquipamentoIdLabel', 'ID do equipamento'))}</span>
          <span class="re-equip-card__value re-equip-card__value--mono">${esc(eq.equipamentoId || '—')}</span>
        </div>
        <div class="re-equip-card__field">
          <span class="re-equip-card__label">${esc(L(labels, 'modelo', 'Modelo'))}</span>
          <span class="re-equip-card__value re-equip-card__value--modelo">${esc(eq.maquinaModelo || '—')}</span>
        </div>
        <div class="re-equip-card__field">
          <span class="re-equip-card__label">${esc(L(labels, 'numeroSerie', 'N.º de série'))}</span>
          <span class="re-equip-card__value re-equip-card__value--mono">${esc(eq.numeroMaquina || '—')}</span>
        </div>
      </div>
    </div>
    <div class="re-equip-card__body">
      <table class="re-table">
        <thead>
          <tr>
            <th>${esc(L(labels, 'relatorioEspecialPdfColDias', 'Dias'))}</th>
            <th>${esc(L(labels, 'relatorioEspecialPdfColHorario', 'Horário'))}</th>
            <th style="width:72px">${esc(L(labels, 'relatorioEspecialPdfHorasMaquina', 'Horas na máquina'))}</th>
          </tr>
        </thead>
        <tbody>
          ${linhas}
          <tr class="re-row-total">
            <td colspan="2" style="text-align:right">${esc(L(labels, 'relatorioEspecialTotalEquipamentoBruto', 'Total do equipamento'))}</td>
            <td class="re-col-total">${esc(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </article>`
}

function buildResumoCardsHtml(
  rel: RelatorioEspecial,
  totais: ReturnType<typeof calcularTotaisRelatorioEspecial>,
  labels: RelatorioEspecialPdfLabels | undefined
): string {
  const esc = escapePdfHtml
  const cards = [
    {
      label: L(labels, 'relatorioEspecialPdfHorasTrabalho', 'Horas de trabalho (total)'),
      value: rel.horasTrabalho || '0:00',
      highlight: true,
    },
    { label: L(labels, 'kmTotal', 'KM total'), value: rel.kmsPercorridos || '0' },
    { label: L(labels, 'relatorioEspecialPdfHorasViagem', 'Horas viagem'), value: rel.horasViagem || '0:00' },
    {
      label: L(labels, 'diarias', 'Diárias'),
      value: String(totais.diarias),
    },
    {
      label: L(labels, 'horasViagemIda', 'Horas viagem ida'),
      value: formatMinutosComoHHMM(totais.horasViagemIda),
    },
    {
      label: L(labels, 'horasViagemRetorno', 'Horas viagem retorno'),
      value: formatMinutosComoHHMM(totais.horasViagemRetorno),
    },
  ]

  return `<div class="re-resumo">${cards
    .map(
      (c) =>
        `<div class="re-resumo-card${c.highlight ? ' re-resumo-card--highlight' : ''}">
          <span class="re-resumo-card__label">${esc(c.label)}</span>
          <span class="re-resumo-card__valor">${esc(c.value)}</span>
        </div>`
    )
    .join('')}</div>`
}

export function imprimirRelatorioEspecialPdf(
  relatorio: RelatorioEspecial,
  labelsOrOptions?: RelatorioEspecialPdfLabels | RelatorioEspecialPdfOptions
): void {
  const options: RelatorioEspecialPdfOptions =
    labelsOrOptions && ('logoHtml' in labelsOrOptions || 'empresaNome' in labelsOrOptions)
      ? labelsOrOptions
      : { labels: labelsOrOptions as RelatorioEspecialPdfLabels | undefined }

  const labels = options.labels
  const empresaNome = (options.empresaNome || 'Nonato Service').trim()
  const logoContent = (options.logoHtml || '').trim() || empresaNome

  const rel = aplicarTotaisNoRelatorioEspecial(relatorio)
  const dias = sortDiasTrabalhoEspecialCronologicamente(rel.diasTrabalho || [])
  const equipamentos = rel.equipamentos || []
  const sessoesPorEquip = coletarSessoesPorEquipamento(dias)
  const totais = calcularTotaisRelatorioEspecial(dias)
  const esc = escapePdfHtml
  const labelAlmoco = L(labels, 'horaAlmoco', 'almoço')

  const totalGeralTopoHtml = buildTotalGeralBannerHtml(rel, totais, labels, ' re-total-geral--topo')
  const totalGeralFinalHtml = buildTotalGeralBannerHtml(rel, totais, labels, '')

  const headerHtml = buildPdfDocumentHeaderHtml({
    logoContent,
    title: L(labels, 'relatorioEspecialPdfDocTitle', L(labels, 'relatorioServicoTitle', 'RELATÓRIO DE SERVIÇO')),
    reportNumber: String(rel.numero || ''),
    subtitle: `${L(labels, 'relatorioEspecialSubtitle', 'Horas por equipamento — intervenção fabricante')} · ${empresaNome}`,
    badgeLabel: L(labels, 'relatorioPdfBadgeLabel', 'Relatório n.º'),
    badgeLabelCompact: L(labels, 'relatorioPdfBadgeLabelCompact', 'N.º'),
    variant: 'classic',
    theme: 'expense',
  })

  const metaHtml = buildMetaRelatorioEspecialHtml(rel, labels)
  const equipamentosResumoHtml = buildTabelaEquipamentosResumoHtml(equipamentos, labels)

  const linhasDeslocamento = dias
    .map((diaRaw) => {
      const dia = atualizarCalculosDiaEspecial(diaRaw)
      const almoco = (dia.tempoPausa || '').trim() || (dia.pausa === 'sim' ? '01:00' : dia.pausa || '')
      const horas = resumoHorasDiaPdf(dia)
      const sem = getDiaSemanaInfo(dia.data, labels)
      const dataFmt = formatDiaComDiaSemana(dia.data, labels)
      const fimSemanaStyle = sem.isFimDeSemana ? ' style="color:#b8860b;font-weight:700"' : ''
      return `<tr>
        <td${fimSemanaStyle}>${esc(dataFmt)}</td>
        <td>${esc(dia.idaHora || '—')}</td>
        <td>${esc(dia.idaChegada || '—')}</td>
        <td class="re-col-total">${esc(dia.idaDuracao || '—')}</td>
        <td>${esc(horas.inicio)}</td>
        <td>${esc(horas.fim)}</td>
        <td class="re-col-total">${formatDuracaoDiaPdf(horas, esc, labelAlmoco)}</td>
        <td>${esc(dia.retornoSaida || '—')}</td>
        <td>${esc(dia.retornoChegada || '—')}</td>
        <td class="re-col-total">${esc(dia.retornoDuracao || '—')}</td>
        <td class="re-col-total">${esc(dia.kmIda || '0')}</td>
        <td class="re-col-total">${esc(dia.kmRetorno || '0')}</td>
        <td class="re-col-total">${esc(dia.kmTotal || '—')}</td>
        <td class="re-col-total">${esc(almoco || '—')}</td>
        <td>${esc(dia.descricaoTrabalho || '')}</td>
      </tr>`
    })
    .join('')

  const tfootDeslocamento =
    dias.length > 0
      ? `<tfoot>
          <tr class="re-row-total">
            <td colspan="6" style="text-align:right">${esc(L(labels, 'totais', 'TOTAIS'))}</td>
            <td class="re-col-total">${esc(formatMinutosComoHHMM(totais.horasTrabalhoTotal))}<div class="re-dia-duracao-detalhe">${esc(L(labels, 'relatorioEspecialPdfTotalLiquido', 'Trabalho líquido'))}${totais.horasAlmocoTotal > 0 ? ` · ${esc(formatMinutosComoHHMM(totais.horasTrabalhoBruto))} − ${esc(formatMinutosComoHHMM(totais.horasAlmocoTotal))} ${esc(labelAlmoco)}` : ''}</div></td>
            <td colspan="3"></td>
            <td colspan="2"></td>
            <td class="re-col-total">${esc(String(totais.kmsTotal))}</td>
            <td class="re-col-total">${totais.horasAlmocoTotal > 0 ? `−${esc(formatMinutosComoHHMM(totais.horasAlmocoTotal))}` : '—'}</td>
            <td></td>
          </tr>
        </tfoot>`
      : ''

  const deslocamentosHtml = `<section class="re-secao">
    <h3 class="re-secao__titulo">${esc(L(labels, 'controleHorasDeslocamentos', L(labels, 'relatorioEspecialPdfDeslocamentos', 'Controlo de horas e deslocamentos')))}</h3>
    <p style="font-size:9px;color:#64748b;margin:0 0 8px">${esc(L(labels, 'relatorioEspecialDiasFimSemanaOk', 'Sábado e domingo também contam como dias de trabalho.'))}</p>
    <table class="re-table re-table--dias">
      <thead>
        <tr>
          <th rowspan="2">${esc(L(labels, 'data', 'Data'))}</th>
          <th colspan="3">${esc(L(labels, 'ida', 'Ida'))}</th>
          <th colspan="3">${esc(L(labels, 'relatorioEspecialPdfHorasTrabalho', 'Horas de trabalho'))}</th>
          <th colspan="3">${esc(L(labels, 'retorno', 'Retorno'))}</th>
          <th colspan="3">KM</th>
          <th rowspan="2">${esc(L(labels, 'horaAlmoco', L(labels, 'tempoPausa', 'Almoço')))}</th>
          <th rowspan="2">${esc(L(labels, 'relatorioEspecialPdfDescricao', 'Descrição'))}</th>
        </tr>
        <tr>
          <th>${esc(L(labels, 'saida', 'Saída'))}</th>
          <th>${esc(L(labels, 'chegada', 'Chegada'))}</th>
          <th>${esc(L(labels, 'duracao', 'Duração'))}</th>
          <th>${esc(L(labels, 'inicio', 'Início'))}</th>
          <th>${esc(L(labels, 'fim', 'Fim'))}</th>
          <th>${esc(L(labels, 'relatorioEspecialPdfDuracaoLiquida', 'Líquido'))}</th>
          <th>${esc(L(labels, 'saida', 'Saída'))}</th>
          <th>${esc(L(labels, 'chegada', 'Chegada'))}</th>
          <th>${esc(L(labels, 'duracao', 'Duração'))}</th>
          <th>${esc(L(labels, 'ida', 'Ida'))}</th>
          <th>${esc(L(labels, 'retorno', 'Retorno'))}</th>
          <th>${esc(L(labels, 'total', 'Total'))}</th>
        </tr>
      </thead>
      <tbody>
        ${linhasDeslocamento || `<tr><td colspan="15" style="text-align:center;color:#64748b">${esc(L(labels, 'relatorioEspecialPdfSemDias', 'Sem dias registados'))}</td></tr>`}
      </tbody>
      ${tfootDeslocamento}
    </table>
    <p style="font-size:10px;margin:8px 0 0;color:#1b5e20"><strong>${esc(L(labels, 'diarias', 'Diárias'))}:</strong> ${totais.diarias}</p>
  </section>`

  const blocosEquipamentos = equipamentos
    .map((eq, i) =>
      buildEquipamentoCardHtml(
        eq,
        i,
        rel.horasPorEquipamentoResumo?.[eq.uid] || '0:00',
        sessoesPorEquip[eq.uid],
        labels
      )
    )
    .join('')

  const controloHorasHtml = `<section class="re-secao">
    <h3 class="re-secao__titulo">${esc(L(labels, 'relatorioEspecialPdfControloHoras', 'Controlo de horas por equipamento'))}</h3>
    <p style="font-size:9px;color:#64748b;margin:0 0 10px">${esc(L(labels, 'relatorioEspecialPdfEquipBrutoNota', 'Horas reais em cada máquina (início → fim). O almoço desconta uma vez por dia — no total geral e na tabela de dias acima.'))}</p>
    ${blocosEquipamentos || `<p style="color:#64748b;font-style:italic">${esc(L(labels, 'relatorioEspecialSemEquipamentos', 'Sem equipamentos'))}</p>`}
  </section>`

  const totalGeralHtml = totalGeralFinalHtml

  const resumoHtml = buildResumoCardsHtml(rel, totais, labels)

  const observacoesHtml = rel.observacoes
    ? `<section class="re-obs">
        <div class="re-obs__titulo">${esc(L(labels, 'observacoes', 'Observações'))}</div>
        <div class="re-obs__texto">${esc(rel.observacoes)}</div>
      </section>`
    : ''

  const assinaturaHtml = rel.assinaturaCliente
    ? `<div class="re-assinatura">
        <div class="re-assinatura__titulo">${esc(L(labels, 'relatorioEspecialPdfAssinatura', 'Assinatura do cliente'))}</div>
        <img src="${rel.assinaturaCliente}" alt="${esc(L(labels, 'relatorioEspecialPdfAssinatura', 'Assinatura do cliente'))}" />
      </div>`
    : ''

  const dataGeracao = new Date().toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const pdfDocTitle = L(labels, 'relatorioEspecialPdfDocTitle', L(labels, 'relatorioServicoTitle', 'RELATÓRIO DE SERVIÇO'))
  const footerHtml = buildPdfDocumentFooterHtml(
    `${empresaNome} · ${pdfDocTitle} ${rel.numero} · ${dataGeracao}`
  )

  const body = `
<style>${RELATORIO_ESPECIAL_PDF_CSS}</style>
<div class="re-doc pdf-doc">
  ${headerHtml}
  ${metaHtml}
  ${totalGeralTopoHtml}
  ${equipamentosResumoHtml}
  ${deslocamentosHtml}
  ${controloHorasHtml}
  ${totalGeralHtml}
  ${resumoHtml}
  ${observacoesHtml}
  ${assinaturaHtml}
  ${footerHtml}
</div>`

  const html = wrapRelatorioServicoPrintDocument({
    title: `${pdfDocTitle} ${rel.numero}`,
    bodyClass: 'rs-pdf rs-pdf--classic rs-pdf--especial',
    baseCss: RELATORIO_SERVICO_PDF_PRINT_CSS,
    bodyHtml: body,
    showToolbar: true,
    toolbarLabels: {
      titulo: L(labels, 'relatorioEspecialPdfToolbarTitulo', 'Relatório de Serviço — PDF'),
      imprimir: L(labels, 'imprimirGuardarPDF', 'Imprimir / Guardar PDF'),
      fechar: L(labels, 'voltar', 'Fechar'),
      enviarEmail: L(labels, 'enviarPorEmail', 'E-mail'),
      enviarWhatsApp: L(labels, 'enviarPorWhatsApp', 'WhatsApp'),
      showEnvio: true,
      envioMessageType: 'reEspecialEnvio',
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
