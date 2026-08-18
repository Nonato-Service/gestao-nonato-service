import type { RelatorioEquipamentoRef } from '../equipamentos/relatorio'
import type { SessaoHorasEquipamentoEspecial, DiaSemanaLabels, DiaSemMaquinaResumoEspecial } from './calculos'
import {
  aplicarTotaisNoRelatorioEspecial,
  atualizarCalculosDiaEspecial,
  calcularTotaisRelatorioEspecial,
  coletarDiasSemMaquinaResumo,
  coletarSessoesPorEquipamento,
  formatDiaComDiaSemana,
  formatMinutosComoHHMM,
  getDiaSemanaInfo,
  resumoHorasTrabalhoDia,
  sortDiasTrabalhoEspecialCronologicamente,
} from './calculos'
import type { DiaTrabalhoEspecial, RelatorioEspecial } from './tipos'
import {
  buildPdfDocumentFooterHtml,
  buildPdfDocumentHeaderHtml,
  buildPdfMetaSectionHtml,
  escapePdfHtml,
  PDF_TABLE_CELL_BORDER,
  type PdfMetaField,
} from '../../lib/pdfDocumentLayout'
import { RELATORIO_SERVICO_PDF_PRINT_CSS } from '../../lib/relatorioServicoPdfPrintCss'
import { wrapRelatorioServicoPrintDocument } from '../../lib/relatorioServicoPdfShell'

export type RelatorioEspecialPdfLabels = Record<string, string | undefined>

export type RelatorioEspecialPdfOptions = {
  labels?: RelatorioEspecialPdfLabels
  logoHtml?: string
  empresaNome?: string
  /** Idioma do HTML (ex.: pt-BR, en). */
  lang?: string
}

function L(labels: RelatorioEspecialPdfLabels | undefined, key: string, fallback: string): string {
  const v = labels?.[key]
  return v != null && String(v).trim() !== '' ? String(v) : fallback
}

const RELATORIO_ESPECIAL_PDF_CSS = `
body.rs-pdf--especial .re-doc {
  max-width: 100%;
  counter-reset: re-sec;
  color: #1e293b;
  font-family: "Segoe UI", system-ui, -apple-system, Arial, sans-serif;
}

.re-doc-flow {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* Resumo executivo — caixa sóbria */
.re-kpi-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
  margin: 0 0 18px;
  border: 1px solid #cbd5e1;
  background: #fff;
  break-inside: avoid;
  page-break-inside: avoid;
}

.re-kpi {
  padding: 12px 10px 11px;
  text-align: left;
  border-right: 1px solid #e2e8f0;
  background: #f8fafc;
}

.re-kpi:last-child {
  border-right: none;
}

.re-kpi--main {
  background: #fff;
}

.re-kpi__label {
  display: block;
  font-size: 7.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 6px;
}

.re-kpi__valor {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.re-kpi--main .re-kpi__valor {
  color: #0d7a3d;
  font-size: 18px;
}

.re-kpi__hint {
  display: block;
  margin-top: 5px;
  font-size: 7.5px;
  color: #64748b;
  line-height: 1.35;
}

.re-secao {
  margin: 0 0 18px;
  break-inside: avoid;
  page-break-inside: avoid;
}

.re-secao__titulo {
  counter-increment: re-sec;
  margin: 0 0 10px;
  padding: 0 0 6px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #0f172a;
  border-bottom: 1.5px solid #1e293b;
}

.re-secao__titulo::before {
  content: counter(re-sec, decimal-leading-zero) ". ";
  color: #0d7a3d;
  font-weight: 700;
  letter-spacing: 0;
}

.re-secao__ajuda {
  font-size: 8.5px;
  color: #64748b;
  margin: -2px 0 10px;
  line-height: 1.45;
}

.re-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0 0 4px;
  font-size: 0.9em;
  page-break-inside: auto;
}

.re-table th,
.re-table td {
  border: ${PDF_TABLE_CELL_BORDER};
  padding: 6px 8px;
  vertical-align: middle;
  text-align: left;
}

.re-table th {
  background: #1e293b;
  color: #f8fafc;
  font-weight: 600;
  font-size: 0.82em;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.re-table tbody tr:nth-child(even) td {
  background: #f8fafc;
}

.re-table .re-col-num {
  width: 32px;
  text-align: center;
  font-weight: 600;
  color: #334155;
}

.re-table .re-col-total {
  text-align: center;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.re-table--dias {
  font-size: 0.8em;
}

.re-table--dias th,
.re-table--dias td {
  padding: 5px 3px;
  text-align: center;
  vertical-align: middle;
}

.re-table .re-row-total td,
.re-table tfoot .re-row-total td {
  background: #f1f5f9 !important;
  border-top: 1.5px solid #1e293b;
  font-weight: 700;
  color: #0f172a;
}

.re-table .re-row-total .re-col-total {
  font-size: 1.02em;
  color: #0d7a3d;
}

.re-equip-card {
  margin: 0 0 14px;
  border: 1px solid #cbd5e1;
  background: #fff;
  break-inside: avoid;
  page-break-inside: avoid;
}

.re-equip-card__head {
  display: grid;
  grid-template-columns: 40px 1fr;
  border-bottom: 1px solid #cbd5e1;
  background: #f8fafc;
}

.re-equip-card__num {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  background: #1e293b;
}

.re-equip-card__meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.re-equip-card__field {
  padding: 10px 12px;
  border-right: 1px solid #e2e8f0;
}

.re-equip-card__field:last-child {
  border-right: none;
}

.re-equip-card__label {
  display: block;
  font-size: 7.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 4px;
}

.re-equip-card__value {
  display: block;
  font-size: 11.5px;
  font-weight: 600;
  color: #0f172a;
  word-break: break-word;
  line-height: 1.35;
}

.re-equip-card__value--mono {
  font-family: Consolas, "Courier New", monospace;
  font-size: 12px;
  letter-spacing: 0.01em;
  color: #1e293b;
}

.re-equip-card__value--modelo {
  font-size: 11.5px;
  font-weight: 600;
  color: #0f172a;
}

.re-equip-card__body {
  padding: 0;
}

.re-equip-card__body .re-table {
  margin: 0;
}

.re-equip-card__body .re-table th,
.re-equip-card__body .re-table td {
  border-left: none;
  border-right: none;
}

.re-equip-card__body .re-table th {
  background: #334155;
  font-size: 0.84em;
  padding: 7px 9px;
}

.re-equip-card__body .re-table td {
  padding: 7px 9px;
  font-size: 0.92em;
}

.re-total-geral {
  margin: 6px 0 18px;
  padding: 14px 16px;
  border: 1.5px solid #1e293b;
  background: #fff;
  text-align: left;
  break-inside: avoid;
  page-break-inside: avoid;
}

.re-total-geral__label {
  display: block;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 4px;
}

.re-total-geral__valor {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: 0.01em;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.re-total-geral__detalhe {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e2e8f0;
  font-size: 9px;
  color: #475569;
  line-height: 1.45;
}

.re-total-geral--fecho {
  margin: 2px 0 18px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px 16px;
  align-items: end;
}

.re-total-geral--fecho .re-total-geral__label {
  grid-column: 1;
}

.re-total-geral--fecho .re-total-geral__valor {
  grid-column: 2;
  grid-row: 1 / span 2;
  align-self: center;
  font-size: 24px;
  color: #0d7a3d;
}

.re-total-geral--fecho .re-total-geral__detalhe {
  grid-column: 1;
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.re-dia-duracao-detalhe {
  font-size: 7px;
  font-weight: 500;
  color: #64748b;
  margin-top: 2px;
  line-height: 1.3;
}

.re-resumo {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  margin: 0;
  border: 1px solid #cbd5e1;
}

.re-resumo-card {
  padding: 10px 12px;
  text-align: left;
  background: #fff;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}

.re-resumo-card:nth-child(3n) {
  border-right: none;
}

.re-resumo-card__label {
  display: block;
  font-size: 7px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 4px;
}

.re-resumo-card__valor {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
}

.re-encerramento {
  margin-top: 4px;
  padding: 0;
  border: none;
  background: transparent;
}

.re-assinatura {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid #cbd5e1;
  break-inside: avoid;
  page-break-inside: avoid;
}

.re-assinatura__titulo {
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 10px;
}

.re-assinatura img {
  display: block;
  max-width: 240px;
  max-height: 72px;
  border: 1px solid #cbd5e1;
  padding: 6px;
  background: #fff;
}

.re-obs {
  margin: 0 0 14px;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-left: 3px solid #1e293b;
  background: #f8fafc;
  break-inside: avoid;
  page-break-inside: avoid;
}

.re-obs__titulo {
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #334155;
  margin-bottom: 6px;
}

.re-obs__texto {
  font-size: 10px;
  white-space: pre-wrap;
  line-height: 1.5;
  color: #334155;
}

@media print {
  .re-equip-card,
  .re-total-geral,
  .re-secao,
  .re-kpi-strip {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
`.trim()

function formatDuracaoDiaPdf(
  resumo: ReturnType<typeof resumoHorasTrabalhoDia>,
  esc: (s: string) => string,
  labelAlmoco: string,
  labelViagem: string
): string {
  if (resumo.soViagem) {
    return `<strong>${esc(resumo.viagemFmt)}</strong><div class="re-dia-duracao-detalhe">${esc(labelViagem)}</div>`
  }
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
    modifier: '',
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

function buildKpiStripHtml(
  rel: RelatorioEspecial,
  totais: ReturnType<typeof calcularTotaisRelatorioEspecial>,
  equipamentosCount: number,
  labels: RelatorioEspecialPdfLabels | undefined
): string {
  const esc = escapePdfHtml
  const almocoHint =
    totais.horasAlmocoTotal > 0
      ? `${L(labels, 'relatorioEspecialPdfTotalBruto', 'Bruto')} ${formatMinutosComoHHMM(totais.horasTrabalhoBruto)} − ${L(labels, 'horaAlmoco', 'almoço')} ${formatMinutosComoHHMM(totais.horasAlmocoTotal)}`
      : L(labels, 'relatorioEspecialPdfTotalLiquidoHint', 'Total líquido de horas de trabalho')

  return `<div class="re-kpi-strip">
    <div class="re-kpi re-kpi--main">
      <span class="re-kpi__label">${esc(L(labels, 'relatorioEspecialPdfHorasTrabalho', 'Horas de trabalho'))}</span>
      <span class="re-kpi__valor">${esc(rel.horasTrabalho || '0:00')}</span>
      <span class="re-kpi__hint">${esc(almocoHint)}</span>
    </div>
    <div class="re-kpi">
      <span class="re-kpi__label">${esc(L(labels, 'kmTotal', 'KM total'))}</span>
      <span class="re-kpi__valor">${esc(rel.kmsPercorridos || '0')}</span>
      <span class="re-kpi__hint">${esc(L(labels, 'relatorioEspecialPdfHorasViagem', 'Horas viagem'))}: ${esc(rel.horasViagem || '0:00')}</span>
    </div>
    <div class="re-kpi">
      <span class="re-kpi__label">${esc(L(labels, 'relatorioEspecialTotalDiarias', L(labels, 'diarias', 'Diárias')))}</span>
      <span class="re-kpi__valor">${esc(String(totais.diarias))}</span>
      <span class="re-kpi__hint">${esc(
        (totais.datasDiarias || []).length > 0
          ? (totais.datasDiarias || []).map((d) => formatDiaComDiaSemana(d, labels as DiaSemanaLabels)).join(' · ')
          : L(labels, 'relatorioEspecialDiariasAjuda', 'Dias registados (inclui sáb./dom. sem HT)')
      )}</span>
    </div>
    <div class="re-kpi">
      <span class="re-kpi__label">${esc(L(labels, 'relatorioEspecialEquipamentos', 'Equipamentos'))}</span>
      <span class="re-kpi__valor">${esc(String(equipamentosCount))}</span>
      <span class="re-kpi__hint">${esc(L(labels, 'relatorioEspecialSubtitle', 'Horas por equipamento'))}</span>
    </div>
  </div>`
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
            <th style="width:72px">${esc(L(labels, 'relatorioEspecialPdfHorasMaquina', 'Horas cobráveis'))}</th>
          </tr>
        </thead>
        <tbody>
          ${linhas}
          <tr class="re-row-total">
            <td colspan="2" style="text-align:right">${esc(L(labels, 'relatorioEspecialTotalEquipamentoLiquido', 'Total cobrável do equipamento'))}</td>
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
      highlight: false,
    },
    { label: L(labels, 'kmTotal', 'KM total'), value: rel.kmsPercorridos || '0' },
    { label: L(labels, 'relatorioEspecialPdfHorasViagem', 'Horas viagem'), value: rel.horasViagem || '0:00' },
    {
      label: L(labels, 'relatorioEspecialTotalDiarias', L(labels, 'diarias', 'Diárias')),
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

function buildResumoViagemHtml(
  diasSemMaquina: DiaSemMaquinaResumoEspecial[],
  labels: RelatorioEspecialPdfLabels | undefined
): string {
  if (!diasSemMaquina.length) return ''
  const esc = escapePdfHtml
  const labelViagem = L(
    labels,
    'relatorioEspecialDiaSoViagem',
    L(labels, 'relatorioEspecialPdfHorasViagem', 'viagem')
  )
  const rows = diasSemMaquina
    .map((d) => {
      const duracaoCell = d.soViagem && d.duracaoFmt
        ? `<strong>${esc(d.duracaoFmt)}</strong><div class="re-dia-duracao-detalhe">${esc(labelViagem)}</div>`
        : '—'
      return `<tr>
        <td>${esc(d.dataFormatada)}</td>
        <td>${esc(d.horarioFmt || '—')}</td>
        <td class="re-col-total">${duracaoCell}</td>
        <td>${esc(d.descricao || '—')}</td>
      </tr>`
    })
    .join('')

  return `<div style="margin-top:12px">
    <h4 style="margin:0 0 6px;font-size:12px;color:#0f172a">${esc(L(labels, 'relatorioEspecialResumoViagem', 'Viagem / deslocação'))}</h4>
    <p style="margin:0 0 8px;font-size:9px;color:#64748b">${esc(L(labels, 'relatorioEspecialResumoViagemAjuda', 'Dias só com viagem ou registados sem horas em máquina.'))}</p>
    <table class="re-table">
      <thead>
        <tr>
          <th>${esc(L(labels, 'relatorioEspecialPdfColDias', 'Dias'))}</th>
          <th>${esc(L(labels, 'relatorioEspecialPdfColHorario', 'Horário'))}</th>
          <th style="width:88px">${esc(L(labels, 'relatorioEspecialPdfHorasViagem', 'Horas viagem'))}</th>
          <th>${esc(L(labels, 'relatorioEspecialResumoNota', L(labels, 'descricao', 'Nota')))}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`
}

export function imprimirRelatorioEspecialPdf(
  relatorio: RelatorioEspecial,
  labelsOrOptions?: RelatorioEspecialPdfLabels | RelatorioEspecialPdfOptions
): void {
  const options: RelatorioEspecialPdfOptions =
    labelsOrOptions &&
    ('logoHtml' in labelsOrOptions || 'empresaNome' in labelsOrOptions || 'lang' in labelsOrOptions)
      ? labelsOrOptions
      : { labels: labelsOrOptions as RelatorioEspecialPdfLabels | undefined }

  const labels = options.labels
  const empresaNome = (options.empresaNome || 'Nonato Service').trim()
  const logoContent = (options.logoHtml || '').trim() || empresaNome

  const rel = aplicarTotaisNoRelatorioEspecial(relatorio)
  const dias = sortDiasTrabalhoEspecialCronologicamente(rel.diasTrabalho || [])
  const equipamentos = rel.equipamentos || []
  const sessoesPorEquip = coletarSessoesPorEquipamento(dias)
  const diasSemMaquinaResumo = coletarDiasSemMaquinaResumo(dias)
  const totais = calcularTotaisRelatorioEspecial(dias)
  const esc = escapePdfHtml
  const labelAlmoco = L(labels, 'horaAlmoco', 'almoço')
  const labelViagem = L(labels, 'relatorioEspecialDiaSoViagem', L(labels, 'relatorioEspecialPdfHorasViagem', 'viagem'))

  const totalGeralFinalHtml = buildTotalGeralBannerHtml(rel, totais, labels, ' re-total-geral--fecho')
  const kpiStripHtml = buildKpiStripHtml(rel, totais, equipamentos.length, labels)

  const headerHtml = buildPdfDocumentHeaderHtml({
    logoContent,
    title: L(labels, 'relatorioEspecialPdfDocTitle', L(labels, 'relatorioServicoTitle', 'RELATÓRIO DE SERVIÇO')),
    reportNumber: String(rel.numero || ''),
    subtitle: `${L(labels, 'relatorioEspecialSubtitle', 'Horas por equipamento — intervenção fabricante')} · ${empresaNome}`,
    badgeLabel: L(labels, 'relatorioPdfBadgeLabel', 'Relatório n.º'),
    badgeLabelCompact: L(labels, 'relatorioPdfBadgeLabelCompact', 'N.º'),
    variant: 'classic',
    theme: 'service',
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
        <td class="re-col-total">${formatDuracaoDiaPdf(horas, esc, labelAlmoco, labelViagem)}</td>
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
            <td class="re-col-total">${esc(formatMinutosComoHHMM(totais.horasTrabalhoTotal))}<div class="re-dia-duracao-detalhe">${esc(L(labels, 'relatorioEspecialPdfTotalLiquido', 'Trabalho líquido'))}${totais.horasAlmocoTotal > 0 ? ` · ${esc(formatMinutosComoHHMM(totais.horasTrabalhoBruto))} − ${esc(formatMinutosComoHHMM(totais.horasAlmocoTotal))} ${esc(labelAlmoco)}` : ''}${totais.horasViagemTotal > 0 ? ` · ${esc(labelViagem)} ${esc(formatMinutosComoHHMM(totais.horasViagemTotal))}` : ''}</div></td>
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
    <p class="re-secao__ajuda">${esc(L(labels, 'relatorioEspecialDiasFimSemanaOk', 'Sábado e domingo também contam como dias de trabalho.'))}</p>
    <table class="re-table re-table--dias">
      <thead>
        <tr>
          <th rowspan="2">${esc(L(labels, 'data', 'Data'))}</th>
          <th colspan="3">${esc(L(labels, 'ida', 'Ida'))}</th>
          <th colspan="3">${esc(L(labels, 'relatorioEspecialPdfHorasTrabalho', 'Horas de trabalho'))}</th>
          <th colspan="3">${esc(L(labels, 'retorno', 'Retorno'))}</th>
          <th colspan="3">${esc(L(labels, 'km', 'KM'))}</th>
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
    <p style="font-size:10px;margin:8px 0 0;color:#1b5e20"><strong>${esc(L(labels, 'relatorioEspecialTotalDiarias', L(labels, 'diarias', 'TOTAL DE DIÁRIAS')))}:</strong> ${totais.diarias}${(totais.datasDiarias || []).length > 0 ? ` — ${esc((totais.datasDiarias || []).map((d) => formatDiaComDiaSemana(d, labels as DiaSemanaLabels)).join(' · '))}` : ''}</p>
    <p style="font-size:9px;margin:4px 0 0;color:#64748b">${esc(L(labels, 'relatorioEspecialDiariasAjuda', 'Cada dia registado conta como diária (inclui sáb./dom. e dias só com viagem), mesmo sem horas em máquina.'))}</p>
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
    <p class="re-secao__ajuda">${esc(L(labels, 'relatorioEspecialPdfEquipLiquidoNota', 'Horas cobráveis em cada máquina (almoço descontado de forma proporcional no dia). Dias sem horas em máquina também contam para diárias se estiverem registados.'))}</p>
    ${blocosEquipamentos || `<p style="color:#64748b;font-style:italic">${esc(L(labels, 'relatorioEspecialSemEquipamentos', 'Sem equipamentos'))}</p>`}
  </section>`

  const resumoHtml = `<section class="re-secao">
    <h3 class="re-secao__titulo">${esc(L(labels, 'resumo', 'Resumo'))}</h3>
    ${buildResumoCardsHtml(rel, totais, labels)}
    ${buildResumoViagemHtml(diasSemMaquinaResumo, labels)}
  </section>`

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

  const encerramentoHtml =
    observacoesHtml || assinaturaHtml
      ? `<section class="re-secao re-encerramento">
          <h3 class="re-secao__titulo">${esc(L(labels, 'relatorioEspecialPdfEncerramento', 'Encerramento'))}</h3>
          ${observacoesHtml}
          ${assinaturaHtml}
        </section>`
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
<div class="re-doc pdf-doc re-doc-flow">
  ${headerHtml}
  ${kpiStripHtml}
  ${metaHtml}
  ${equipamentosResumoHtml}
  ${deslocamentosHtml}
  ${controloHorasHtml}
  ${totalGeralFinalHtml}
  ${resumoHtml}
  ${encerramentoHtml}
  ${footerHtml}
</div>`

  const html = wrapRelatorioServicoPrintDocument({
    title: `${pdfDocTitle} ${rel.numero}`,
    bodyClass: 'rs-pdf rs-pdf--service rs-pdf--especial',
    baseCss: RELATORIO_SERVICO_PDF_PRINT_CSS,
    bodyHtml: body,
    pdfModelo: 'service',
    htmlLang: options.lang || 'pt-BR',
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
