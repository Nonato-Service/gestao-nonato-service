/** Leitura/compressão de anexo de fatura (PDF ou imagem → data URL). */

import { compressImageFileToJpegDataUrl } from '../diario'

export const MAX_FATURA_ANEXO_BYTES = 4 * 1024 * 1024

export type FaturaAnexoPayload = {
  arquivoAnexo: string
  nomeArquivoOriginal: string
  tipoArquivo: string
}

function isImageFile(file: File): boolean {
  if (file.type && file.type.startsWith('image/')) return true
  return /\.(jpe?g|png|gif|webp|bmp)$/i.test(file.name || '')
}

/**
 * Lê ficheiro de fatura: imagens comprimidas (padrão diário);
 * PDF e outros tipos como data URL directa.
 */
export async function readFaturaAnexoFromFile(file: File): Promise<FaturaAnexoPayload> {
  if (file.size > MAX_FATURA_ANEXO_BYTES) {
    throw new Error('FATURA_ANEXO_GRANDE')
  }
  if (isImageFile(file)) {
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

export function abrirFaturaAnexoDataUrl(dataUrl: string): void {
  if (!dataUrl || typeof window === 'undefined') return
  try {
    window.open(dataUrl, '_blank', 'noopener,noreferrer')
  } catch {
    /* ignore */
  }
}
