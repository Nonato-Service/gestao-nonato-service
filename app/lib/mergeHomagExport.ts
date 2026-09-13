import {
  homagItemToPecaMerge as homagItemToPecaMergePure,
  mergeHomagExportIntoBiblioteca as mergeHomagExportIntoBibliotecaPure,
  type HomagExportIdentity,
  type MergeHomagExportOptions,
  type MergeHomagExportResult,
  type PecaHomagMerge,
} from '../modules/biblioteca/homagExport'

/** Re-export fino — fonte canónica em `app/modules/biblioteca/homagExport`. */
export type {
  HomagExportIdentity,
  MergeHomagExportOptions,
  MergeHomagExportResult,
  PecaHomagMerge,
} from '../modules/biblioteca/homagExport'
export {
  normCodigoHomag,
  formatHomagPreco,
  extrairPrecoHomagItem,
  extrairImagemHomagItem,
  parseHomagExportJson,
} from '../modules/biblioteca/homagExport'

function makeHomagExportIdentity(seq: number): HomagExportIdentity {
  return {
    id: `import-homag-${Date.now()}-${seq}-${Math.random().toString(36).slice(2, 9)}`,
    dataCriacao: new Date().toISOString(),
  }
}

/** Injeta Date.now() / Math.random() no mapper canónico. */
export function homagItemToPecaMerge(item: Record<string, unknown>, seq: number): PecaHomagMerge {
  return homagItemToPecaMergePure(item, seq, makeHomagExportIdentity(seq))
}

/** Injeta identidade (relógio/aleatório) no merge canónico. */
export function mergeHomagExportIntoBiblioteca<T extends PecaHomagMerge>(
  existing: T[],
  incomingRaw: Record<string, unknown>[],
  opts: MergeHomagExportOptions = {}
): MergeHomagExportResult & { list: T[] } {
  return mergeHomagExportIntoBibliotecaPure(existing, incomingRaw, opts, makeHomagExportIdentity)
}
