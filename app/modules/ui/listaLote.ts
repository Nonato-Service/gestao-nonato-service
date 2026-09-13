/** Quantos cartões/linhas desenhar de cada vez nas listas longas. */
export const LISTA_UI_LOTE = 40

export function limiteListaUi(atual: number | undefined, lote: number = LISTA_UI_LOTE): number {
  return typeof atual === 'number' && atual > 0 ? atual : lote
}
