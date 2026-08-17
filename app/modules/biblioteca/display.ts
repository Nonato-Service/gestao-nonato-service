/** Helpers de exibição / busca UI da Biblioteca de Peças. */

import { pecaBibliotecaMatchesBuscaCompleta } from '../../lib/pecaCodigoBusca'
import {
  PECA_BIBLIOTECA_LOGO_PADRAO_SRC,
  resolvePecaBibliotecaCapaSrcForDisplay,
  resolvePecaBibliotecaImagemSrcForDisplay,
} from './imagemStats'

/** Sentinel do filtro «sem categoria» na gestão da biblioteca. */
export const BIBLIOTECA_FILTRO_SEM_CATEGORIA = '__sem_categoria__'

/** Peças visíveis de cada vez na gestão (evita milhares de nós DOM). */
export const BIBLIOTECA_ITENS_POR_LOTE = 48

/** Alias histórico — mesmo valor que `PECA_BIBLIOTECA_LOGO_PADRAO_SRC`. */
export const PECA_BIBLIOTECA_IMAGEM_PADRAO_SRC = PECA_BIBLIOTECA_LOGO_PADRAO_SRC

export function pecaBibliotecaSrcImagemDisplay(
  imagemOuPeca: string | undefined | null | { imagem?: string; id?: string; temImagemServidor?: boolean }
): string {
  return resolvePecaBibliotecaImagemSrcForDisplay(imagemOuPeca, PECA_BIBLIOTECA_LOGO_PADRAO_SRC)
}

export function pecaBibliotecaSrcCapaDisplay(
  peca:
    | string
    | undefined
    | null
    | { imagem?: string; imagemCapa?: string; id?: string; temImagemServidor?: boolean }
): string {
  if (peca && typeof peca === 'object') {
    return resolvePecaBibliotecaCapaSrcForDisplay(peca, PECA_BIBLIOTECA_LOGO_PADRAO_SRC)
  }
  return resolvePecaBibliotecaImagemSrcForDisplay(peca, PECA_BIBLIOTECA_LOGO_PADRAO_SRC)
}

export function pecaPassaBuscaBibliotecaTexto(
  peca: {
    codigo?: string
    nome?: string
    descricao?: string
    codigosAlternativos?: string[]
    referenciasAlternativas?: string[]
    referenciasAntigas?: string[]
    codigosAntigos?: string[]
  },
  q: string
): boolean {
  if (!q.trim()) return true
  return pecaBibliotecaMatchesBuscaCompleta(peca, q)
}
