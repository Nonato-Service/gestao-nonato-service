import type { RelatorioEquipamentoRef } from './relatorioServicoEquipamentos'
import type { SessaoHorasEquipamentoEspecial } from './relatorioEspecialCalculos'
import {
  aplicarTotaisNoRelatorioEspecial,
  atualizarCalculosDiaEspecial,
  calcularTotaisRelatorioEspecial,
  coletarSessoesPorEquipamento,
  minutosTrabalhoLiquidoDia,
  formatDiaComDiaSemana,
  formatMinutosComoHHMM,
  getDiaSemanaInfo,
  minutosDeDuracaoHHMM,
  sortDiasTrabalhoEspecialCronologicamente,
} from './relatorioEspecialCalculos'
import type { DiaTrabalhoEspecial, RelatorioEspecial } from './relatorioEspecialTypes'
import {
  buildPdfDocumentFooterHtml,
  buildPdfDocumentHeaderHtml,
  buildPdfMetaSectionHtml,
  escapePdfHtml,
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
  border: 1px solid #e2e8f0;
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
  margin: 0 0 16px;
  border: 1px solid #c8e6c9;
  border-radius: 4px;
  overflow: hidden;
  break-inside: avoid;
  page-break-inside: avoid;
}

.re-equip-card__head {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0;
  background: linear-gradient(180deg, #f1f8e9 0%, #e8f5e9 100%);
  border-bottom: 1px solid #c8e6c9;
}

.re-equip-card__num {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  padding: 10px 12px;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 16px;
  font-weight: 700;
  color: #0d7a3d;
  border-right: 1px solid #c8e6c9;
}

.re-equip-card__meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
}

.re-equip-card__field {
  padding: 8px 12px;
  border-right: 1px solid #dcedc8;
}

.re-equip-card__field:last-child {
  border-right: none;
}

.re-equip-card__label {
  display: block;
  font-size: 7px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #558b2f;
  margin-bottom: 3px;
}

.re-equip-card__value {
  display: block;
  font-size: 10px;
  font-weight: 600;
  color: #1b5e20;
  word-break: break-word;
  line-height: 1.35;
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
  background: #2e7d32;
  font-size: 0.82em;
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

function resumoHorasDiaPdf(diaCalc: DiaTrabalhoEspecial): { inicio: string; fim: string; duracao: string } {
  const linhas = (diaCalc.horasPorEquipamento || []).filter(
    (h) => (h.horasInicio || h.horasFim || h.horasDuracao) && h.equipamentoUid
  )
  if (linhas.length === 0) return { inicio: '—', fim: '—', duracao: '—' }
  const liquido = minutosTrabalhoLiquidoDia(diaCalc)
  if (linhas.length === 1) {
    return {
      inicio: linhas[0].horasInicio || '—',
      fim: linhas[0].horasFim || '—',
      duracao: formatMinutosComoHHMM(liquido),
    }
  }
  return { inicio: '…', fim: '…', duracao: formatMinutosComoHHMM(liquido) }
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
                <td class="re-col-total">${esc(s.horasDuracao || '—')}</td>
              </tr>`
          )
          .join('')
      : `<tr><td colspan="3" style="text-align:center;color:#64748b;font-style:italic">${esc(L(labels, 'relatorioEspecialPdfSemSessoesEquip', 'Sem horas registadas'))}</td></tr>`

  return `<article class="re-equip-card">
    <div class="re-equip-card__head">
      <div class="re-equip-card__num">${idx + 1}</div>
      <div class="re-equip-card__meta">
        <div class="re-equip-card__field">
          <span class="re-equip-card__label">${esc(L(labels, 'relatorioEquipamentoIdLabel', 'ID'))}</span>
          <span class="re-equip-card__value">${esc(eq.equipamentoId || '—')}</span>
        </div>
        <div class="re-equip-card__field">
          <span class="re-equip-card__label">${esc(L(labels, 'modelo', 'Modelo'))}</span>
          <span class="re-equip-card__value">${esc(eq.maquinaModelo || '—')}</span>
        </div>
        <div class="re-equip-card__field">
          <span class="re-equip-card__label">${esc(L(labels, 'numeroSerie', 'N.º série'))}</span>
          <span class="re-equip-card__value">${esc(eq.numeroMaquina || '—')}</span>
        </div>
      </div>
    </div>
    <div class="re-equip-card__body">
      <table class="re-table">
        <thead>
          <tr>
            <th>${esc(L(labels, 'relatorioEspecialPdfColDias', 'Dias'))}</th>
            <th>${esc(L(labels, 'relatorioEspecialPdfColHorario', 'Horário'))}</th>
            <th style="width:72px">${esc(L(labels, 'total', 'Total'))}</th>
          </tr>
        </thead>
        <tbody>
          ${linhas}
          <tr class="re-row-total">
            <td colspan="2" style="text-align:right">${esc(L(labels, 'relatorioEspecialTotalEquipamento', 'Total do equipamento'))}</td>
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
    { label: L(labels, 'relatorioEspecialPdfHorasTrabalho', 'Horas trabalho'), value: rel.horasTrabalho || '0:00' },
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
        `<div class="re-resumo-card">
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

  const totalAlmocoFmt =
    totais.horasAlmocoTotal > 0 ? formatMinutosComoHHMM(totais.horasAlmocoTotal) : ''
  const totalBrutoFmt = formatMinutosComoHHMM(totais.horasTrabalhoBruto)
  const detalheAlmoco =
    totais.horasAlmocoTotal > 0
      ? `<div class="re-total-geral__detalhe">${esc(L(labels, 'relatorioEspecialPdfTotalBruto', 'Total bruto'))}: ${esc(totalBrutoFmt)} · ${esc(L(labels, 'horaAlmoco', 'Almoço'))}: −${esc(totalAlmocoFmt)}</div>`
      : ''

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
      const almoco = (dia.tempoPausa || '').trim()
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
        <td class="re-col-total">${esc(horas.duracao)}</td>
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

  const deslocamentosHtml = `<section class="re-secao">
    <h3 class="re-secao__titulo">${esc(L(labels, 'controleHorasDeslocamentos', L(labels, 'relatorioEspecialPdfDeslocamentos', 'Controlo de horas e deslocamentos')))}</h3>
    <p style="font-size:9px;color:#64748b;margin:0 0 8px">${esc(L(labels, 'relatorioEspecialDiasFimSemanaOk', 'Sábado e domingo também contam como dias de trabalho.'))}</p>
    <table class="re-table re-table--dias">
      <thead>
        <tr>
          <th rowspan="2">${esc(L(labels, 'data', 'Data'))}</th>
          <th colspan="3">${esc(L(labels, 'ida', 'Ida'))}</th>
          <th colspan="3">${esc(L(labels, 'horas', 'Horas'))}</th>
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
          <th>${esc(L(labels, 'duracao', 'Duração'))}</th>
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
    ${blocosEquipamentos || `<p style="color:#64748b;font-style:italic">${esc(L(labels, 'relatorioEspecialSemEquipamentos', 'Sem equipamentos'))}</p>`}
  </section>`

  const totalGeralHtml = `<div class="re-total-geral">
    <span class="re-total-geral__label">${esc(L(labels, 'relatorioEspecialPdfTotalGeralLabel', 'Total geral de horas de trabalho'))}</span>
    <span class="re-total-geral__valor">${esc(rel.horasTrabalho || '0:00')}</span>
    ${detalheAlmoco}
  </div>`

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
