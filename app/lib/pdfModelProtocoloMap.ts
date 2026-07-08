import { normalizePdfModelo, PDF_MODELO_PADRAO } from './pdfModelTypes'
import { clampProtocoloPdfModelo, PROTOCOLO_PDF_MODELO_PADRAO } from '../utils/protocoloServicoPdfThemes'

/** Modelo de PDF partilhado (string) → tema numérico do protocolo (1–15). */
export const PDF_MODELO_TO_PROTOCOLO_NUM: Record<string, number> = {
  classico: 1,
  moderno: 2,
  executivo: 3,
  detalhado: 4,
  minimalista: 5,
  formal: 6,
  tecnico: 7,
  compacto: 8,
  colorido: 9,
  resumido: 10,
  lista: 11,
  profissional: 15,
  negro: 13,
  ferwood: 14,
}

const PROTOCOLO_NUM_TO_PDF_MODELO: Record<number, string> = {
  1: 'classico',
  2: 'moderno',
  3: 'executivo',
  4: 'detalhado',
  5: 'minimalista',
  6: 'formal',
  7: 'tecnico',
  8: 'compacto',
  9: 'colorido',
  10: 'resumido',
  11: 'lista',
  12: 'tecnico',
  13: 'negro',
  14: 'ferwood',
  15: 'profissional',
}

export function pdfModeloToProtocoloNum(model: string | undefined | null): number {
  const m = normalizePdfModelo(model || PDF_MODELO_PADRAO)
  return clampProtocoloPdfModelo(PDF_MODELO_TO_PROTOCOLO_NUM[m] ?? PROTOCOLO_PDF_MODELO_PADRAO)
}

export function protocoloNumToPdfModelo(num: number | undefined | null): string {
  const n = clampProtocoloPdfModelo(Number(num) || PROTOCOLO_PDF_MODELO_PADRAO)
  return PROTOCOLO_NUM_TO_PDF_MODELO[n] ?? PDF_MODELO_PADRAO
}
