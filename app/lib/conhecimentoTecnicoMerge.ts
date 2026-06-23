import {
  BIBLIA_NONATO_STORAGE_KEY,
  BIBLIA_LEGACY_CATEGORIES_KEY,
  BibliaAnexo,
  BibliaStore,
  bibliaUid,
  normalizeBibliaImport,
  serializeBibliaForServer,
} from '../components/bibliaNonatoTypes'
import type { ManuaisGrupo, ManuaisModelo } from './manuaisTypes'

export const CONHECIMENTO_TECNICO_STORAGE_KEY = 'nonato-conhecimento-tecnico-unificado'
export const MANUAIS_STORAGE_KEY = 'nonato-manuais-familias-grupos'
export const DEFAULT_MARCA_NAME = '__default__'

export type ManuaisFamiliasGruposPayload = {
  familias: string[]
  grupos: ManuaisGrupo[]
  modelos: ManuaisModelo[]
}

function normName(s: string): string {
  return String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

function mergeTexto(a?: string, b?: string): string {
  const A = a?.trim() ?? ''
  const B = b?.trim() ?? ''
  if (!A) return B
  if (!B) return A
  if (A === B) return A
  if (A.includes(B)) return A
  if (B.includes(A)) return B
  return B.length >= A.length ? B : A
}

function mergeAnexos(a: BibliaAnexo[] = [], b: BibliaAnexo[] = []): BibliaAnexo[] {
  const map = new Map<string, BibliaAnexo>()
  for (const x of a) map.set(x.id, x)
  for (const x of b) map.set(x.id, x)
  return Array.from(map.values())
}

function mergeModeloUnificado(s: ManuaisModelo, l: ManuaisModelo): ManuaisModelo {
  const docMap = new Map<string, NonNullable<ManuaisModelo['documentos']>[number]>()
  for (const d of s.documentos || []) docMap.set(d.id, d)
  for (const d of l.documentos || []) docMap.set(d.id, d)
  const imgMap = new Map<string, NonNullable<ManuaisModelo['imagens']>[number]>()
  for (const i of s.imagens || []) imgMap.set(i.id, i)
  for (const i of l.imagens || []) imgMap.set(i.id, i)
  return {
    ...s,
    ...l,
    nome: l.nome || s.nome,
    grupoId: l.grupoId || s.grupoId,
    documentos: Array.from(docMap.values()),
    imagens: Array.from(imgMap.values()),
    software: mergeTexto(s.software, l.software),
    notas: mergeTexto(s.notas, l.notas),
    infoTecnicas: mergeTexto(s.infoTecnicas, l.infoTecnicas),
    infoMecanicas: mergeTexto(s.infoMecanicas, l.infoMecanicas),
    infoEletricas: mergeTexto(s.infoEletricas, l.infoEletricas),
    anexos: mergeAnexos(s.anexos, l.anexos),
    bibliaModeloId: l.bibliaModeloId || s.bibliaModeloId,
    bibliaLinhaId: l.bibliaLinhaId || s.bibliaLinhaId,
    bibliaFamiliaId: l.bibliaFamiliaId || s.bibliaFamiliaId,
  }
}

export function mergeManuaisPayloads(server: ManuaisFamiliasGruposPayload, local: ManuaisFamiliasGruposPayload): ManuaisFamiliasGruposPayload {
  const famSet = new Set<string>([...(server?.familias || []), ...(local?.familias || [])])
  const familias = Array.from(famSet).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))

  const gruposMap = new Map<string, ManuaisGrupo>()
  for (const g of server?.grupos || []) gruposMap.set(g.id, { ...g })
  for (const g of local?.grupos || []) gruposMap.set(g.id, { ...g })
  const grupos = Array.from(gruposMap.values())

  const modelosMap = new Map<string, ManuaisModelo>()
  for (const m of server?.modelos || []) modelosMap.set(m.id, m)
  for (const m of local?.modelos || []) {
    const existing = modelosMap.get(m.id)
    modelosMap.set(m.id, existing ? mergeModeloUnificado(existing, m) : m)
  }
  return { familias, grupos, modelos: Array.from(modelosMap.values()) }
}

function ensureFamilia(familias: string[], nome: string): string[] {
  const trimmed = nome.trim()
  if (!trimmed) return familias
  if (familias.some((f) => normName(f) === normName(trimmed))) return familias
  return [...familias, trimmed].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
}

function findFamiliaName(familias: string[], nome: string): string | null {
  const n = normName(nome)
  return familias.find((f) => normName(f) === n) ?? null
}

function ensureGrupo(grupos: ManuaisGrupo[], familia: string, marcaNome: string): { grupos: ManuaisGrupo[]; grupoId: string } {
  const marca = marcaNome.trim() || DEFAULT_MARCA_NAME
  const existing = grupos.find((g) => g.familia === familia && normName(g.nome) === normName(marca))
  if (existing) return { grupos, grupoId: existing.id }
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ctg-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const novo: ManuaisGrupo = { id, nome: marca, familia }
  return { grupos: [...grupos, novo], grupoId: id }
}

function findModeloInGrupo(modelos: ManuaisModelo[], grupoId: string, nome: string, bibliaId?: string): ManuaisModelo | undefined {
  if (bibliaId) {
    const byBiblia = modelos.find((m) => m.bibliaModeloId === bibliaId)
    if (byBiblia) return byBiblia
    const byId = modelos.find((m) => m.id === bibliaId)
    if (byId) return byId
  }
  const n = normName(nome)
  return modelos.find((m) => m.grupoId === grupoId && normName(m.nome) === n)
}

/** Importa dados da Bíblia para a estrutura unificada (família → marca → modelo). */
export function mergeBibliaIntoManuais(
  bibliaRaw: unknown,
  manuais: ManuaisFamiliasGruposPayload
): ManuaisFamiliasGruposPayload {
  const biblia = normalizeBibliaImport(bibliaRaw)
  let familias = [...(manuais.familias || [])]
  let grupos = [...(manuais.grupos || [])]
  let modelos = [...(manuais.modelos || [])]

  for (const fam of biblia.familias) {
    const famNome = fam.nome.trim()
    if (!famNome) continue
    familias = ensureFamilia(familias, famNome)
    const familiaKey = findFamiliaName(familias, famNome) || famNome

    for (const lin of fam.linhas) {
      const marcaNome = lin.titulo.trim() || DEFAULT_MARCA_NAME
      const { grupos: gNext, grupoId } = ensureGrupo(grupos, familiaKey, marcaNome)
      grupos = gNext

      for (const mod of lin.modelos) {
        const modNome = mod.nome.trim()
        if (!modNome) continue
        const existing = findModeloInGrupo(modelos, grupoId, modNome, mod.id)
        const mergedFields = {
          software: mod.software,
          infoMecanicas: mod.mecanica,
          infoEletricas: mod.eletrica,
          notas: mod.notas,
          anexos: mod.anexos,
          bibliaModeloId: mod.id,
          bibliaLinhaId: lin.id,
          bibliaFamiliaId: fam.id,
        }
        if (existing) {
          modelos = modelos.map((m) =>
            m.id === existing.id
              ? mergeModeloUnificado(m, { ...m, ...mergedFields, nome: modNome, grupoId })
              : m
          )
        } else {
          const id =
            typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ctm-${Date.now()}-${Math.random().toString(36).slice(2)}`
          modelos.push({
            id,
            nome: modNome,
            grupoId,
            documentos: [],
            imagens: [],
            ...mergedFields,
          })
        }
      }
    }
  }

  return { familias, grupos, modelos }
}

/** Converte a estrutura unificada de volta para o formato da Bíblia (compatibilidade legado). */
export function manuaisToBibliaStore(payload: ManuaisFamiliasGruposPayload): BibliaStore {
  const familias = (payload.familias || [])
    .map((famNome, fi) => {
      const famGrupos = (payload.grupos || []).filter((g) => g.familia === famNome)
      const linhas = famGrupos
        .sort((a, b) => a.nome.localeCompare(b.nome, undefined, { sensitivity: 'base' }))
        .map((gr, li) => {
          const modelos = (payload.modelos || [])
            .filter((m) => m.grupoId === gr.id)
            .sort((a, b) => a.nome.localeCompare(b.nome, undefined, { sensitivity: 'base' }))
            .map((m, mi) => ({
              id: m.bibliaModeloId || m.id,
              nome: m.nome,
              ordem: mi,
              software: mergeTexto(m.software, m.infoTecnicas),
              mecanica: m.infoMecanicas ?? '',
              eletrica: m.infoEletricas ?? '',
              notas: m.notas ?? '',
              anexos: Array.isArray(m.anexos) ? m.anexos : [],
            }))
          return {
            id: gr.id,
            titulo: gr.nome === DEFAULT_MARCA_NAME ? 'Geral' : gr.nome,
            ordem: li,
            modelos,
          }
        })
      return {
        id: famGrupos[0]?.id ? `fam-${normName(famNome)}` : bibliaUid(),
        nome: famNome,
        ordem: fi,
        linhas,
      }
    })
    .filter((f) => f.linhas.some((l) => l.modelos.length > 0) || f.linhas.length > 0)

  return serializeBibliaForServer({ familias })
}

export function buildManuaisFromSources(
  manuaisRaw: unknown,
  idbManuaisRaw?: unknown,
  unifiedRaw?: unknown
): ManuaisFamiliasGruposPayload {
  const baseManuais: ManuaisFamiliasGruposPayload = {
    familias: [],
    grupos: [],
    modelos: [],
  }
  const fromUnified =
    unifiedRaw && typeof unifiedRaw === 'object'
      ? (unifiedRaw as ManuaisFamiliasGruposPayload)
      : baseManuais
  const fromServer =
    manuaisRaw && typeof manuaisRaw === 'object'
      ? (manuaisRaw as ManuaisFamiliasGruposPayload)
      : baseManuais
  const fromIdb =
    idbManuaisRaw && typeof idbManuaisRaw === 'object'
      ? (idbManuaisRaw as ManuaisFamiliasGruposPayload)
      : baseManuais
  let mergedManuais = mergeManuaisPayloads(fromUnified, fromServer)
  mergedManuais = mergeManuaisPayloads(mergedManuais, fromIdb)
  return mergedManuais
}

export function buildBibliaConhecimentoFromSources(
  bibliaRaw: unknown,
  bibliaLegacyRaw?: unknown,
  idbBibliaRaw?: unknown
): ManuaisFamiliasGruposPayload {
  const empty: ManuaisFamiliasGruposPayload = { familias: [], grupos: [], modelos: [] }
  let merged = mergeBibliaIntoManuais(bibliaRaw, empty)
  if (bibliaLegacyRaw) {
    merged = mergeBibliaIntoManuais(bibliaLegacyRaw, merged)
  }
  if (idbBibliaRaw && typeof idbBibliaRaw === 'object') {
    merged = mergeManuaisPayloads(merged, idbBibliaRaw as ManuaisFamiliasGruposPayload)
  }
  return merged
}

/** @deprecated Preferir buildManuaisFromSources + buildBibliaConhecimentoFromSources separados. */
export function buildConhecimentoTecnicoFromSources(
  manuaisRaw: unknown,
  bibliaRaw: unknown,
  idbManuaisRaw?: unknown,
  bibliaLegacyRaw?: unknown,
  unifiedRaw?: unknown
): ManuaisFamiliasGruposPayload {
  let merged = buildManuaisFromSources(manuaisRaw, idbManuaisRaw, unifiedRaw)
  merged = mergeBibliaIntoManuais(bibliaRaw, merged)
  if (bibliaLegacyRaw) {
    merged = mergeBibliaIntoManuais(bibliaLegacyRaw, merged)
  }
  return merged
}

export async function syncManuaisConhecimentoStores(
  payload: ManuaisFamiliasGruposPayload,
  saveData: (key: string, value: unknown, saveToLocalStorage?: boolean, awaitServer?: boolean) => Promise<boolean>
): Promise<void> {
  await saveData(CONHECIMENTO_TECNICO_STORAGE_KEY, payload, false).catch(() => {})
}

export async function syncBibliaConhecimentoStore(
  payload: ManuaisFamiliasGruposPayload,
  saveData: (key: string, value: unknown, saveToLocalStorage?: boolean, awaitServer?: boolean) => Promise<boolean>
): Promise<void> {
  const bibliaStore = manuaisToBibliaStore(payload)
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(BIBLIA_NONATO_STORAGE_KEY, JSON.stringify(bibliaStore))
    }
  } catch {
    /* ignorar */
  }
  await saveData(BIBLIA_NONATO_STORAGE_KEY, bibliaStore, false).catch(() => {})
}

export async function syncConhecimentoTecnicoLegacyStores(
  payload: ManuaisFamiliasGruposPayload,
  saveData: (key: string, value: unknown, saveToLocalStorage?: boolean, awaitServer?: boolean) => Promise<boolean>
): Promise<void> {
  await syncManuaisConhecimentoStores(payload, saveData)
  await syncBibliaConhecimentoStore(payload, saveData)
}

export { BIBLIA_NONATO_STORAGE_KEY, BIBLIA_LEGACY_CATEGORIES_KEY }
