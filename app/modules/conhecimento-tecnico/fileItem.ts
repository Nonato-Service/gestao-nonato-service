/** Anexo/ficheiro no visualizador de conhecimento técnico / manuais. */

export type ConhecimentoFileItem = {
  id: string
  nome: string
  dataUrl: string
  mime?: string
  tipo?: string
}

export function guessMime(nome: string, mime?: string, tipo?: string): string {
  if (mime && mime !== 'application/octet-stream') return mime
  if (tipo && tipo !== 'application/octet-stream') return tipo
  const n = nome.toLowerCase()
  if (n.endsWith('.pdf')) return 'application/pdf'
  if (n.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  if (n.endsWith('.doc')) return 'application/msword'
  if (n.endsWith('.txt')) return 'text/plain'
  if (n.endsWith('.md')) return 'text/markdown'
  if (n.endsWith('.json')) return 'application/json'
  if (n.endsWith('.csv')) return 'text/csv'
  if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(n)) return 'image/*'
  return mime || tipo || 'application/octet-stream'
}

export function isPdf(m: string, nome: string) {
  return m === 'application/pdf' || nome.toLowerCase().endsWith('.pdf')
}

export function isImage(m: string, nome: string) {
  return m.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(nome)
}

export function isTextLike(m: string, nome: string) {
  return (
    m.startsWith('text/') ||
    m === 'application/json' ||
    /\.(txt|md|csv|json|log|xml|html?)$/i.test(nome)
  )
}

export function isWord(m: string, nome: string) {
  return (
    m.includes('wordprocessingml') ||
    m === 'application/msword' ||
    /\.(docx?|rtf)$/i.test(nome)
  )
}

export function isZip(m: string, nome: string) {
  return m === 'application/zip' || m === 'application/x-zip-compressed' || /\.zip$/i.test(nome)
}

export function supportsTranslation(m: string, nome: string) {
  return isPdf(m, nome) || isTextLike(m, nome) || isWord(m, nome)
}
