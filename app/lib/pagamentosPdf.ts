/** I/O de janela — HTML canónico em `app/modules/pagamentos/pdfHtml`. */

export function abrirPdfPagamentos(html: string): boolean {
  const w = window.open('', '_blank')
  if (!w) return false
  w.document.write(html)
  w.document.close()
  return true
}
