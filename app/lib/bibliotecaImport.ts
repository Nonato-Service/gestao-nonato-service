/**
 * I/O de relógio/aleatório — importação canónica em `app/modules/biblioteca`.
 */
import {
  mapItemToPecaBiblioteca as mapItemToPecaBibliotecaPure,
  type MapItemToPecaBibliotecaOpts,
} from '../modules/biblioteca/importMappers'
import { parseRawToPecas as parseRawToPecasPure } from '../modules/biblioteca/importParse'
import type { PecaBibliotecaLike } from '../modules/biblioteca/tipos'

function importClock(): MapItemToPecaBibliotecaOpts {
  return { nowMs: Date.now(), random: Math.random }
}

/** Injeta Date.now() e Math.random() no id/dataCriacao da peça importada. */
export function mapItemToPecaBiblioteca(item: any, index: number): PecaBibliotecaLike {
  return mapItemToPecaBibliotecaPure(item, index, importClock())
}

export function parseRawToPecas(
  raw: string,
  lojaBaseUrl = '',
  pageUrl = ''
): PecaBibliotecaLike[] {
  return parseRawToPecasPure(raw, lojaBaseUrl, pageUrl, importClock())
}
