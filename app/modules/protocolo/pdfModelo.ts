/** Tema numérico do PDF de protocolo — constantes e clamp puros, sem HTML. */

export const PROTOCOLO_SERVICO_PDF_MODELOS_MAX = 15
/** Modelo recomendado para novos protocolos — visual forte (navy + verde). */
export const PROTOCOLO_PDF_MODELO_PADRAO = 15

export function clampProtocoloPdfModelo(n: number | undefined): number {
  return Math.min(PROTOCOLO_SERVICO_PDF_MODELOS_MAX, Math.max(1, Number(n) || 1))
}
