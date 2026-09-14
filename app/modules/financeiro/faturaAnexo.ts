/** Tipos e limites do anexo de fatura — I/O em `app/lib/financeiroFaturaAnexo`. */

export const MAX_FATURA_ANEXO_BYTES = 4 * 1024 * 1024

export type FaturaAnexoPayload = {
  arquivoAnexo: string
  nomeArquivoOriginal: string
  tipoArquivo: string
}

export function isFaturaAnexoImageFile(file: File): boolean {
  if (file.type && file.type.startsWith('image/')) return true
  return /\.(jpe?g|png|gif|webp|bmp)$/i.test(file.name || '')
}
