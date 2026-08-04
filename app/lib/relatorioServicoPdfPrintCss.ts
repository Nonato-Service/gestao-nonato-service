/**
 * Estilos de impressão / PDF para relatórios de serviço (A4).
 * Cabeçalho e meta alinhados via pdfDocumentLayout.
 */

import {
  PDF_DOCUMENT_LAYOUT_CSS,
  PDF_TABLE_CELL_BORDER,
  buildPdfDocumentHeaderHtml,
  buildPdfMetaSectionHtml,
  escapePdfHtml,
  type PdfDocumentHeaderVariant,
  type PdfMetaField,
} from './pdfDocumentLayout'
import {
  getRelatorioCabecalhoEquipamentoDados,
  type EquipamentoArmazemIdLookup,
  type EquipamentoClienteIdLookup,
  type RelatorioEquipamentoCabecalhoLinha,
  type RelatorioServicoEquipamentosHost,
} from './relatorioServicoEquipamentos'

export type RelatorioServicoPdfHeaderVariant = PdfDocumentHeaderVariant

export { escapePdfHtml }

export function buildRelatorioServicoPdfHeaderHtml(options: {
  logoContent: string
  title: string
  reportNumber: string
  subtitle?: string
  badgeLabel?: string
  badgeLabelCompact?: string
  variant?: RelatorioServicoPdfHeaderVariant
}): string {
  return buildPdfDocumentHeaderHtml({
    ...options,
    theme: 'service',
  })
}

export type RelatorioServicoPdfMetaLabels = {
  tecnico: string
  data: string
  cliente: string
  equipamentoId: string
  maquinaModelo: string
  numeroMaquina: string
  equipNumero: string
  cidade: string
  telefone: string
  tipoServico: string
}

function buildPdfEquipamentosRelatorioTableHtml(
  linhas: RelatorioEquipamentoCabecalhoLinha[],
  labels: Pick<RelatorioServicoPdfMetaLabels, 'equipNumero' | 'equipamentoId' | 'numeroMaquina' | 'maquinaModelo'>,
  esc: (s: string | undefined | null) => string
): string {
  const rows = linhas
    .map(
      (linha) => `<tr>
      <td class="ns-pdf-meta__equip-num">${linha.numero}</td>
      <td class="ns-pdf-meta__equip-id">${esc(linha.equipamentoId)}</td>
      <td class="ns-pdf-meta__equip-sn">${esc(linha.numeroMaquina)}</td>
      <td class="ns-pdf-meta__equip-modelo">${esc(linha.maquinaModelo)}</td>
    </tr>`
    )
    .join('')

  return `<table class="ns-pdf-meta__equip-table" role="presentation">
    <thead>
      <tr>
        <th scope="col">${labels.equipNumero}</th>
        <th scope="col">${labels.equipamentoId}</th>
        <th scope="col">${labels.numeroMaquina}</th>
        <th scope="col">${labels.maquinaModelo}</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`
}

/** Meta (cliente + equipamentos) para PDF de fechamento / despesas — lista todos os equipamentos se > 1. */
export type FechamentoClienteCadastroRef = {
  codigoCliente?: string
  nomeEmpresa?: string
  morada?: string
  localidade?: string
  conselho?: string
  codigoPostal?: string
  pais?: string
  numeroContribuicaoFiscal?: string
  telefones?: string
  email?: string
  contato?: string
}

function montarMoradaClientePdf(c: FechamentoClienteCadastroRef): string {
  return [
    c.morada,
    [c.codigoPostal, c.localidade].filter(Boolean).join(' '),
    c.conselho,
    c.pais,
  ]
    .filter(Boolean)
    .join(' · ')
}

/** Campos extra do cadastro do cliente (morada, telefone, NIF, etc.). */
export function buildFechamentoDespesasClienteMetaFields(
  relatorio: { telefone?: string; cidade?: string },
  clienteCadastro: FechamentoClienteCadastroRef | null | undefined,
  labels: {
    codigoCliente?: string
    morada?: string
    telefone?: string
    email?: string
    contribuicaoFiscal?: string
    contato?: string
    cidade?: string
  },
  esc: (s: string | undefined | null) => string
): PdfMetaField[] {
  const fields: PdfMetaField[] = []
  if (clienteCadastro) {
    const cod = String(clienteCadastro.codigoCliente ?? '').trim()
    if (cod) {
      fields.push({ label: esc(labels.codigoCliente || 'Cód. cliente'), value: esc(cod) })
    }
    const morada = montarMoradaClientePdf(clienteCadastro)
    if (morada) {
      fields.push({ label: esc(labels.morada || 'Morada'), value: esc(morada), fullWidth: true })
    }
    const tel = String(clienteCadastro.telefones || relatorio.telefone || '').trim()
    if (tel) {
      fields.push({ label: esc(labels.telefone || 'Telefone'), value: esc(tel) })
    }
    const email = String(clienteCadastro.email ?? '').trim()
    if (email) {
      fields.push({ label: esc(labels.email || 'E-mail'), value: esc(email) })
    }
    const nif = String(clienteCadastro.numeroContribuicaoFiscal ?? '').trim()
    if (nif) {
      fields.push({
        label: esc(labels.contribuicaoFiscal || 'NIF'),
        value: esc(nif),
      })
    }
    const contato = String(clienteCadastro.contato ?? '').trim()
    if (contato) {
      fields.push({ label: esc(labels.contato || 'Contacto'), value: esc(contato) })
    }
  } else {
    const tel = String(relatorio.telefone ?? '').trim()
    if (tel) {
      fields.push({ label: esc(labels.telefone || 'Telefone'), value: esc(tel) })
    }
    const cid = String(relatorio.cidade ?? '').trim()
    if (cid) {
      fields.push({ label: esc(labels.cidade || 'Cidade'), value: esc(cid) })
    }
  }
  return fields
}

export function buildFechamentoDespesasRelatorioInfoHtml(options: {
  relatorio: RelatorioServicoEquipamentosHost & {
    cliente?: string
    data?: string
    numero?: string
    telefone?: string
    cidade?: string
  }
  title: string
  labels: {
    cliente: string
    numeroRelatorio: string
    equipamento: string
    data: string
    equipNumero: string
    equipamentoId: string
    numeroMaquina: string
    maquinaModelo: string
    codigoCliente?: string
    morada?: string
    telefone?: string
    email?: string
    contribuicaoFiscal?: string
    contato?: string
    cidade?: string
  }
  clienteCadastro?: FechamentoClienteCadastroRef | null
  esc?: (s: string | undefined | null) => string
  equipamentosArmazem?: EquipamentoArmazemIdLookup[]
  equipamentosCliente?: EquipamentoClienteIdLookup[]
}): string {
  const {
    relatorio,
    title,
    labels,
    clienteCadastro,
    esc = escapePdfHtml,
    equipamentosArmazem = [],
    equipamentosCliente = [],
  } = options
  const cab = getRelatorioCabecalhoEquipamentoDados(relatorio, equipamentosArmazem, equipamentosCliente)
  const nomeCliente =
    String(clienteCadastro?.nomeEmpresa ?? '').trim() ||
    String(relatorio.cliente ?? '').trim() ||
    '—'
  const fields: PdfMetaField[] = [
    { label: esc(labels.cliente), value: esc(nomeCliente), fullWidth: true },
    ...buildFechamentoDespesasClienteMetaFields(relatorio, clienteCadastro, labels, esc),
    { label: esc(labels.numeroRelatorio), value: esc(relatorio.numero) },
  ]
  if (!cab.multiplos || cab.linhas.length <= 1) {
    const equipTexto =
      cab.modelos !== '—' ? cab.modelos : String(relatorio.maquinaModelo ?? '').trim() || '—'
    fields.push({
      label: esc(labels.equipamento),
      value: esc(equipTexto),
      fullWidth: String(equipTexto).length > 42,
    })
  }
  fields.push({ label: esc(labels.data), value: esc(relatorio.data) })
  let html = buildPdfMetaSectionHtml({ title: esc(title), fields, modifier: 'expense' })
  if (cab.multiplos && cab.linhas.length > 1) {
    const tableHtml = buildPdfEquipamentosRelatorioTableHtml(
      cab.linhas,
      {
        equipNumero: labels.equipNumero,
        equipamentoId: labels.equipamentoId,
        numeroMaquina: labels.numeroMaquina,
        maquinaModelo: labels.maquinaModelo,
      },
      esc
    )
    html = html.replace('</section>', `<div class="ns-pdf-meta__equip-wrap">${tableHtml}</div></section>`)
  }
  return html
}

export function buildRelatorioServicoPdfMetaSectionHtml(options: {
  relatorio: RelatorioServicoEquipamentosHost & {
    tecnico?: string
    cliente?: string
    cidade?: string
    telefone?: string
    tipoServico?: string
    maquinaModelo?: string
    numeroMaquina?: string
  }
  title: string
  labels: RelatorioServicoPdfMetaLabels
  dataFormatada: string
  modifier?: '' | 'dark' | 'expense'
  equipamentosArmazem?: EquipamentoArmazemIdLookup[]
  equipamentosCliente?: EquipamentoClienteIdLookup[]
}): string {
  const {
    relatorio,
    title,
    labels,
    dataFormatada,
    modifier = '',
    equipamentosArmazem = [],
    equipamentosCliente = [],
  } = options
  const eq = getRelatorioCabecalhoEquipamentoDados(relatorio, equipamentosArmazem, equipamentosCliente)
  const esc = escapePdfHtml

  const fields: PdfMetaField[] = [
    { label: labels.tecnico, value: esc(relatorio.tecnico || '—') },
    { label: labels.data, value: esc(dataFormatada || '—') },
    { label: labels.cliente, value: esc(relatorio.cliente || '—') },
    { label: labels.telefone, value: esc(relatorio.telefone || '—') },
  ]

  if (!eq.multiplos) {
    if (eq.ids && eq.ids !== '—') {
      fields.push({
        label: labels.equipamentoId,
        value: esc(eq.ids),
        fullWidth: eq.ids.length > 28,
      })
    }
    if (eq.numeros && eq.numeros !== '—') {
      fields.push({
        label: labels.numeroMaquina,
        value: esc(eq.numeros),
      })
    }
    fields.push({
      label: labels.maquinaModelo,
      value: esc(eq.modelos !== '—' ? eq.modelos : relatorio.maquinaModelo || '—'),
    })
  }

  fields.push(
    { label: labels.cidade, value: esc(relatorio.cidade || '—') },
    { label: labels.tipoServico, value: esc(relatorio.tipoServico || '—') }
  )

  const metaHtml = buildPdfMetaSectionHtml({ title, fields, modifier })

  if (eq.multiplos && eq.linhas.length > 1) {
    const tableHtml = buildPdfEquipamentosRelatorioTableHtml(eq.linhas, labels, esc)
    return metaHtml.replace('</section>', `${tableHtml}</section>`)
  }

  return metaHtml
}

/** CSS do cabeçalho PDF — reutilizado em todos os modelos (exceto Ferwood). */
export const RELATORIO_SERVICO_PDF_HEADER_CSS = PDF_DOCUMENT_LAYOUT_CSS

/** Alias legado para compatibilidade com templates antigos */
export const RELATORIO_SERVICO_PDF_HEADER_CSS_LEGACY = `
.pdf-header { margin-bottom: 18px; }
`.trim()

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
  return `<div class="${wrap}">${items
    .map((it) => {
      const labelAttr = labelCls ? ` class="${labelCls}"` : ''
      const labelHtml =
        labelAs === 'div'
          ? `<div${labelAttr}>${escapePdfHtml(it.label)}</div>`
          : `<h4${labelAttr}>${escapePdfHtml(it.label)}</h4>`
      return `<div class="${card}">${labelHtml}<div class="value">${it.html}</div></div>`
    })
    .join('')}</div>`
}

export const RELATORIO_SERVICO_PDF_PRINT_CSS = `
@page { size: A4 portrait; margin: 12mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body.rs-pdf {
  font-family: "Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif;
  color: #0f172a;
  background: #ffffff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
body.rs-pdf--classic { font-size: 10px; line-height: 1.5; padding: 8px 10px 18px; }
body.rs-pdf--detailed { font-size: 11px; line-height: 1.55; padding: 10px 12px 20px; }
body.rs-pdf--compact { font-size: 8px; line-height: 1.38; padding: 6px 8px 14px; }

${PDF_DOCUMENT_LAYOUT_CSS}

.ns-pdf-meta__equip-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
  font-size: 0.92em;
}
.ns-pdf-meta__equip-table th,
.ns-pdf-meta__equip-table td {
  border: ${PDF_TABLE_CELL_BORDER};
  padding: 7px 8px;
  text-align: left;
  vertical-align: middle;
}
.ns-pdf-meta__equip-table th {
  background: #1e293b;
  color: #f8fafc;
  font-weight: 600;
  font-size: 0.82em;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.ns-pdf-meta__equip-table .ns-pdf-meta__equip-num {
  width: 52px;
  text-align: center;
  font-weight: 700;
  color: #1e3a5f;
}
.ns-pdf-meta__equip-table .ns-pdf-meta__equip-sn {
  min-width: 88px;
  font-family: Consolas, "Courier New", monospace;
  font-size: 0.95em;
}
.ns-pdf-meta__equip-table tbody tr:nth-child(even) td {
  background: #f8fafc;
}
.ns-pdf-meta--dark .ns-pdf-meta__equip-table th {
  background: #0f172a;
}
.ns-pdf-meta--dark .ns-pdf-meta__equip-table tbody tr:nth-child(even) td {
  background: #1e293b22;
}

.rs-pdf .info-section {
  margin-bottom: 16px;
  break-inside: avoid;
  page-break-inside: avoid;
}

.rs-pdf .info-section h3 {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 10px;
  margin: 0 0 14px 0;
  padding: 0 0 8px 0;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #1e293b;
  border-bottom: 1px solid #cbd5e1;
}

.rs-pdf .info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px 18px;
  font-size: inherit;
}

.rs-pdf .info-item { display: flex; gap: 8px; align-items: baseline; }
.rs-pdf .info-label {
  font-weight: 600;
  color: #64748b;
  flex-shrink: 0;
  font-size: 0.92em;
  letter-spacing: 0.02em;
}
.rs-pdf .info-item > :not(.info-label) {
  color: #0f172a;
  font-weight: 500;
}

.rs-pdf table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 12px;
  font-size: 0.92em;
  page-break-inside: auto;
}
.rs-pdf th, .rs-pdf td {
  border: ${PDF_TABLE_CELL_BORDER};
  padding: 6px 5px;
  text-align: center;
  vertical-align: middle;
}
.rs-pdf th {
  background: #1e293b;
  color: #f8fafc;
  font-weight: 600;
  font-size: 0.82em;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.rs-pdf tbody tr:nth-child(even) td { background: #f8fafc; }
.rs-pdf tbody tr td[style*="text-align:left"] {
  background: #fafafa !important;
  border-color: #e2e8f0 !important;
  text-align: left !important;
  font-size: 0.95em;
  line-height: 1.45;
  color: #334155;
}

.rs-pdf .summary {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  margin: 14px 0 4px;
}
.rs-pdf .summary-card {
  border: 1px solid #e2e8f0;
  border-top: 3px solid #1e3a5f;
  border-radius: 4px;
  padding: 10px 6px 12px;
  text-align: center;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  min-height: 72px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.rs-pdf .summary-card h4 {
  font-size: 0.68em;
  margin-bottom: 6px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1.25;
  max-width: 100%;
}
.rs-pdf .summary-card .value {
  font-family: "Segoe UI", system-ui, -apple-system, Arial, sans-serif;
  font-size: 1.45em;
  font-weight: 700;
  color: #1e3a5f;
  line-height: 1.1;
  font-variant-numeric: tabular-nums lining-nums;
  letter-spacing: -0.02em;
}
.rs-pdf .rs-resumo-valor,
.rs-resumo-valor {
  display: inline-flex;
  align-items: baseline;
  justify-content: center;
  flex-wrap: nowrap;
  gap: 0;
}
.rs-pdf .rs-resumo-num,
.rs-resumo-num {
  font-weight: 700;
  font-variant-numeric: tabular-nums lining-nums;
}
.rs-pdf .rs-resumo-sep,
.rs-resumo-sep {
  opacity: 0.45;
  font-weight: 600;
  padding: 0 1px;
}
.rs-pdf .rs-resumo-un,
.rs-resumo-un {
  font-size: 0.58em;
  font-weight: 600;
  color: #64748b;
  margin-left: 0.2em;
  letter-spacing: 0.03em;
  text-transform: lowercase;
}

.rs-pdf .resultados-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px 16px;
  margin: 10px 0;
}
.rs-pdf .resultado-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1em;
  color: #334155;
}
.rs-pdf .checkbox {
  width: 12px;
  height: 12px;
  border: 1.5px solid #94a3b8;
  border-radius: 2px;
  display: inline-block;
  flex-shrink: 0;
}
.rs-pdf .checkbox.checked {
  background: #1e293b;
  border-color: #1e293b;
}

.rs-pdf .observacoes {
  margin-top: 14px;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-left: 3px solid #1e3a5f;
  border-radius: 0 2px 2px 0;
  background: #fafafa;
}
.rs-pdf .observacoes h4 {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1.05em;
  margin-bottom: 8px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 0.04em;
}
.rs-pdf .observacoes p {
  font-size: 1em;
  white-space: pre-wrap;
  line-height: 1.55;
  color: #334155;
}

.rs-pdf .pecas-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
  font-size: 1em;
}
.rs-pdf .pecas-table th, .rs-pdf .pecas-table td {
  border: ${PDF_TABLE_CELL_BORDER};
  padding: 8px 6px;
  text-align: left;
  vertical-align: middle;
}
.rs-pdf .pecas-table th {
  background: #1e293b;
  color: #f8fafc;
  font-weight: 600;
}
.rs-pdf .pecas-table .imagem-col { width: 76px; text-align: center; }
.rs-pdf .pecas-table .imagem-col img {
  max-width: 68px;
  max-height: 68px;
  width: auto;
  height: auto;
  object-fit: contain;
  border: 1px solid #e2e8f0;
  border-radius: 2px;
  padding: 3px;
  background: #fff;
}

body.rs-pdf--detailed .pecas-table .imagem-col { width: 88px; }
body.rs-pdf--detailed .pecas-table .imagem-col img { max-width: 80px; max-height: 80px; }

body.rs-pdf--compact .summary { gap: 6px; }
body.rs-pdf--compact .summary-card { padding: 7px 4px; }
body.rs-pdf--compact .resultados-grid {
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
body.rs-pdf--compact .pecas-table .imagem-col { width: 56px; }
body.rs-pdf--compact .pecas-table .imagem-col img { max-width: 48px; max-height: 48px; }

.rs-pdf .descricao-trabalho {
  margin-top: 8px;
  padding: 8px 10px;
  background: #f8fafc;
  border-left: 2px solid #475569;
  border-radius: 0 2px 2px 0;
  font-size: 0.95em;
  color: #334155;
}

.rs-pdf .pdf-rs-footer {
  margin-top: 22px;
  padding-top: 14px;
  border-top: 1px solid #e2e8f0;
  font-size: 8px;
  color: #94a3b8;
  text-align: center;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

@media print {
  body.rs-pdf { padding-bottom: 8mm; }
  .rs-pdf .info-section:has(table) {
    break-inside: auto;
    page-break-inside: auto;
  }
  .rs-pdf .summary {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
`.trim()
