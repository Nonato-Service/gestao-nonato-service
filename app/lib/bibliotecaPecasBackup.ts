/**
 * I/O de relógio — backup de peças canónico em `app/modules/biblioteca/pecasBackup`.
 */
import {
  buildPecasBackupPayload as buildPecasBackupPayloadPure,
  pecasBackupFileName as pecasBackupFileNamePure,
} from '../modules/biblioteca/pecasBackup'
import type { CategoriaPeca, PecaBiblioteca, SubcategoriaPeca } from '../modules/biblioteca/pecaTipos'

/** Injeta Date.now() em exportedAt e no nome do ficheiro. */
export function buildPecasBackupPayload(input: {
  pecas: PecaBiblioteca[]
  categorias: CategoriaPeca[]
  subcategorias: SubcategoriaPeca[]
  exportedAt?: string
}) {
  return buildPecasBackupPayloadPure({ ...input, nowMs: Date.now() })
}

export function pecasBackupFileName(date?: Date): string {
  return pecasBackupFileNamePure((date ?? new Date()).getTime())
}
