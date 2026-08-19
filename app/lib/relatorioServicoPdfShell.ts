import { escapePdfHtml } from './pdfDocumentLayout'
import { normalizePdfModelo } from './pdfModelTypes'
import { relatorioPdfThemeCss } from './pdfDocumentThemes'

export const RELATORIO_SERVICO_PDF_TOOLBAR_CSS = `
.rs-pdf-toolbar {
  z-index: 100;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  padding: 12px 16px;
  margin: 0 0 20px;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
  border-bottom: 1px solid #cbd5e1;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
}
@media screen {
  .rs-pdf-toolbar {
    position: sticky;
    top: 0;
  }
}
.rs-pdf-toolbar__title {
  flex: 1 1 180px;
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
}
.rs-pdf-toolbar__btn {
  padding: 9px 16px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #1e293b;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.15s;
}
.rs-pdf-toolbar__btn:hover {
  box-shadow: 0 4px 12px rgba(30, 58, 95, 0.15);
  transform: translateY(-1px);
}
.rs-pdf-toolbar__btn--print {
  background: linear-gradient(135deg, #0d7a3d 0%, #059669 100%);
  border-color: #059669;
  color: #fff;
}
.rs-pdf-toolbar__btn--close {
  background: #f1f5f9;
}
.rs-pdf-toolbar__btn--email {
  background: rgba(18, 38, 62, 0.96);
  border-color: rgba(80, 160, 255, 0.55);
  color: #fff;
}
.rs-pdf-toolbar__btn--wa {
  background: rgba(18, 52, 32, 0.92);
  border-color: rgba(37, 211, 102, 0.55);
  color: #fff;
}
@media print {
  .rs-pdf-toolbar, .no-print {
    display: none !important;
    position: static !important;
    height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    box-shadow: none !important;
  }
}
`.trim()

export function buildRelatorioServicoPdfToolbarHtml(labels?: {
  titulo?: string
  imprimir?: string
  fechar?: string
  enviarEmail?: string
  enviarWhatsApp?: string
  showEnvio?: boolean
  envioMessageType?: string
}): string {
  const titulo = escapePdfHtml(labels?.titulo || 'Relatório de Serviço — PDF')
  const imprimir = escapePdfHtml(labels?.imprimir || 'Imprimir / Guardar PDF')
  const fechar = escapePdfHtml(labels?.fechar || 'Fechar')
  const email = escapePdfHtml(labels?.enviarEmail || 'E-mail')
  const whats = escapePdfHtml(labels?.enviarWhatsApp || 'WhatsApp')
  const msgType = escapePdfHtml(labels?.envioMessageType || 'documentoEnvio')
  const envioBtns =
    labels?.showEnvio
      ? `<button type="button" class="rs-pdf-toolbar__btn rs-pdf-toolbar__btn--email" onclick="if(window.opener){window.opener.postMessage({type:'${msgType}',channel:'email'},window.location.origin)}">📧 ${email}</button>
    <button type="button" class="rs-pdf-toolbar__btn rs-pdf-toolbar__btn--wa" onclick="if(window.opener){window.opener.postMessage({type:'${msgType}',channel:'whatsapp'},window.location.origin)}">💬 ${whats}</button>`
      : ''
  return `<div class="rs-pdf-toolbar no-print">
    <p class="rs-pdf-toolbar__title">${titulo}</p>
    ${envioBtns}
    <button type="button" class="rs-pdf-toolbar__btn rs-pdf-toolbar__btn--print" onclick="window.print()">🖨️ ${imprimir}</button>
    <button type="button" class="rs-pdf-toolbar__btn rs-pdf-toolbar__btn--close" onclick="window.close()">✕ ${fechar}</button>
  </div>`
}

export function wrapRelatorioServicoPrintDocument(options: {
  title: string
  bodyClass: string
  baseCss: string
  bodyHtml: string
  pdfModelo?: string
  /** Idioma do documento HTML (ex.: pt-BR, en). */
  htmlLang?: string
  showToolbar?: boolean
  toolbarLabels?: {
    titulo?: string
    imprimir?: string
    fechar?: string
    enviarEmail?: string
    enviarWhatsApp?: string
    showEnvio?: boolean
    envioMessageType?: string
  }
}): string {
  const model = normalizePdfModelo(options.pdfModelo)
  const themeCss = relatorioPdfThemeCss(model)
  const lang = String(options.htmlLang || 'pt-BR').trim() || 'pt-BR'
  const toolbar =
    options.showToolbar !== false
      ? buildRelatorioServicoPdfToolbarHtml(options.toolbarLabels)
      : ''
  return `<!DOCTYPE html>
<html lang="${escapePdfHtml(lang)}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapePdfHtml(options.title)}</title>
  <style>
    ${options.baseCss}
    ${RELATORIO_SERVICO_PDF_TOOLBAR_CSS}
    ${themeCss}
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body class="${escapePdfHtml(options.bodyClass)}">
  ${toolbar}
  ${options.bodyHtml}
</body>
</html>`
}
