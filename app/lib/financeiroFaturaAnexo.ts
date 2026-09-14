/**
 * I/O de janela/ficheiro — anexo de fatura canónico em `app/modules/financeiro/faturaAnexo`.
 */
import { compressImageFileToJpegDataUrl } from './diarioCompressImage'
import {
  MAX_FATURA_ANEXO_BYTES,
  isFaturaAnexoImageFile,
  type FaturaAnexoPayload,
} from '../modules/financeiro/faturaAnexo'

export { MAX_FATURA_ANEXO_BYTES, isFaturaAnexoImageFile } from '../modules/financeiro/faturaAnexo'
export type { FaturaAnexoPayload } from '../modules/financeiro/faturaAnexo'

export function abrirFaturaAnexoDataUrl(dataUrl: string): void {
  if (!dataUrl || typeof window === 'undefined') return
  try {
    window.open(dataUrl, '_blank', 'noopener,noreferrer')
  } catch {
    /* ignore */
  }
}

/**
 * Lê ficheiro de fatura: imagens comprimidas (padrão diário);
 * PDF e outros tipos como data URL directa.
 */
export async function readFaturaAnexoFromFile(file: File): Promise<FaturaAnexoPayload> {
  if (file.size > MAX_FATURA_ANEXO_BYTES) {
    throw new Error('FATURA_ANEXO_GRANDE')
  }
  if (isFaturaAnexoImageFile(file)) {
    try {
      const dataUrl = await compressImageFileToJpegDataUrl(file)
      return {
        arquivoAnexo: dataUrl,
        nomeArquivoOriginal: file.name || 'fatura.jpg',
        tipoArquivo: 'image/jpeg',
      }
    } catch {
      // fallback: data URL sem compressão
    }
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('FATURA_ANEXO_READ'))
    reader.readAsDataURL(file)
  })
  if (!dataUrl.startsWith('data:')) {
    throw new Error('FATURA_ANEXO_READ')
  }
  return {
    arquivoAnexo: dataUrl,
    nomeArquivoOriginal: file.name || 'anexo',
    tipoArquivo: file.type || '',
  }
}
