/** Helpers puros de deduplicação na importação da Biblioteca de Peças. */

import { ehImportacaoPendenteStrict } from './cadastroForm'
import { normalizeImportKey, variantesCodigoPecaBiblioteca } from './merge'
import type { PecaBibliotecaLike } from './tipos'

export function indiceVariantesPecaBiblioteca(p: PecaBibliotecaLike): string[] {
  const out = new Set<string>()
  for (const v of variantesCodigoPecaBiblioteca(p.codigo)) out.add(v)
  for (const c of [...(p.codigosAlternativos || []), ...(p.codigosAntigos || [])]) {
    for (const v of variantesCodigoPecaBiblioteca(c)) out.add(v)
  }
  for (const r of [...(p.referenciasAlternativas || []), ...(p.referenciasAntigas || [])]) {
    for (const v of variantesCodigoPecaBiblioteca(r)) out.add(v)
  }
  return [...out]
}

export function pecaBibliotecaEstaNoCatalogo(
  p: Pick<PecaBibliotecaLike, 'importacaoPendente'>
): boolean {
  return !ehImportacaoPendenteStrict(p)
}

export function construirIndiceCodigosBiblioteca(biblioteca: PecaBibliotecaLike[]): Set<string> {
  const idx = new Set<string>()
  for (const p of biblioteca) {
    for (const v of indiceVariantesPecaBiblioteca(p)) idx.add(v)
  }
  return idx
}

export function codigoExisteNaBibliotecaPecas(
  codigo: string | undefined | null,
  biblioteca: PecaBibliotecaLike[],
  excluirId?: string
): boolean {
  const alvo = variantesCodigoPecaBiblioteca(codigo)
  if (alvo.length === 0) return false
  return biblioteca.some((p) => {
    if (excluirId && p.id === excluirId) return false
    const existentes = indiceVariantesPecaBiblioteca(p)
    return existentes.some((v) => alvo.includes(v))
  })
}

export function chavePecaBibliotecaParaImport(p: { codigo?: string; nome?: string }): string {
  return normalizeImportKey(p.codigo) || `n:${normalizeImportKey(p.nome)}`
}

export function codigoNormalizadoImport(codigo: string | undefined | null): string {
  return normalizeImportKey(codigo)
}

export type SepararPecasImportacaoResultado<T extends PecaBibliotecaLike = PecaBibliotecaLike> = {
  novas: T[]
  duplicadas: T[]
  duplicadasCatalogo: T[]
  duplicadasFila: T[]
  duplicadasLote: T[]
  semCodigo: T[]
}

/** Separa peças do lote em novas vs duplicadas (catálogo / fila / lote) e sem código. */
export function separarPecasImportacao<T extends PecaBibliotecaLike>(
  pecas: T[],
  biblioteca: T[]
): SepararPecasImportacaoResultado<T> {
  const catalogo = biblioteca.filter(pecaBibliotecaEstaNoCatalogo)
  const filaPendente = biblioteca.filter((p) => ehImportacaoPendenteStrict(p))
  const indiceCatalogo = construirIndiceCodigosBiblioteca(catalogo)
  const indiceFila = construirIndiceCodigosBiblioteca(filaPendente)
  const novas: T[] = []
  const duplicadasCatalogo: T[] = []
  const duplicadasFila: T[] = []
  const duplicadasLote: T[] = []
  const semCodigo: T[] = []
  const vistoCodigoLote = new Set<string>()

  for (const p of pecas) {
    const codigo = String(p.codigo ?? '').trim()
    if (!codigo) {
      semCodigo.push(p)
      continue
    }
    const variantes = variantesCodigoPecaBiblioteca(codigo)
    if (variantes.length === 0) {
      semCodigo.push(p)
      continue
    }
    if (variantes.some((v) => indiceCatalogo.has(v))) {
      duplicadasCatalogo.push(p)
      continue
    }
    if (variantes.some((v) => indiceFila.has(v))) {
      duplicadasFila.push(p)
      continue
    }
    if (variantes.some((v) => vistoCodigoLote.has(v))) {
      duplicadasLote.push(p)
      continue
    }
    variantes.forEach((v) => vistoCodigoLote.add(v))
    novas.push(p)
  }

  const duplicadas = [...duplicadasCatalogo, ...duplicadasFila, ...duplicadasLote]
  return { novas, duplicadas, duplicadasCatalogo, duplicadasFila, duplicadasLote, semCodigo }
}
