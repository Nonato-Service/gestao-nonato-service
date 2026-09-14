/**
 * I/O de relógio/aleatório — Bíblia canónica em `app/modules/manuais/bibliaTipos`.
 */
import {
  bibliaUid as bibliaUidPure,
  normalizeBibliaImport as normalizeBibliaImportPure,
  serializeBibliaForServer as serializeBibliaForServerPure,
  seedBibliaExample as seedBibliaExamplePure,
  type BibliaClockOpts,
  type BibliaStore,
} from '../modules/manuais/bibliaTipos'

function bibliaClock(): BibliaClockOpts {
  return { nowMs: Date.now(), random: Math.random }
}

/** Injeta Date.now() e Math.random() no uid da Bíblia. */
export function bibliaUid(): string {
  return bibliaUidPure(bibliaClock())
}

export function normalizeBibliaImport(data: unknown): BibliaStore {
  return normalizeBibliaImportPure(data, bibliaClock())
}

export function serializeBibliaForServer(store: BibliaStore): BibliaStore {
  return serializeBibliaForServerPure(store, { nowMs: Date.now() })
}

export function seedBibliaExample(): BibliaStore {
  return seedBibliaExamplePure(bibliaClock())
}
