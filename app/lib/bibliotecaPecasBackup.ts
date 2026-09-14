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

export function downloadJsonBlob(fileName: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}
