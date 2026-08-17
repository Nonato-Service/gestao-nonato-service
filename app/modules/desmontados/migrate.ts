/** Migração de registos legados de Desmontados (campos novos). */

import type { GrupoDesmontado, PecaDesmontada } from './tipos'
import { emptyLocalizacaoDesmontado } from './formState'

/** Normaliza um grupo lido do storage (campos opcionais / legado). */
export function migrateGrupoDesmontado(g: Partial<GrupoDesmontado> & Record<string, unknown>): GrupoDesmontado {
  return {
    ...(g as GrupoDesmontado),
    id: String(g.id ?? ''),
    numeroGrupo: String(g.numeroGrupo || g.nome || ''),
    familia: String(g.familia || ''),
    idFabricante: (g.idFabricante as string | undefined) || undefined,
    imagem: (g.imagem as string | undefined) || undefined,
    localizacao:
      (g.localizacao as GrupoDesmontado['localizacao']) || emptyLocalizacaoDesmontado(),
    nome: String(g.nome || g.numeroGrupo || ''),
    descricao: g.descricao as string | undefined,
    dataCriacao: String(g.dataCriacao || ''),
  }
}

/** Normaliza uma peça lida do storage (campos opcionais / legado). */
export function migratePecaDesmontada(p: Partial<PecaDesmontada> & Record<string, unknown>): PecaDesmontada {
  return {
    ...(p as PecaDesmontada),
    id: String(p.id ?? ''),
    numeroPeca: String(p.numeroPeca || p.nome || ''),
    familia: String(p.familia || ''),
    grupoId: String(p.grupoId || ''),
    grupoNome: String(p.grupoNome || ''),
    nome: String(p.nome || p.numeroPeca || ''),
    quantidade: Number(p.quantidade) || 1,
    imagens: (p.imagens as string[] | undefined) || [],
    statusFuncional: (p.statusFuncional as PecaDesmontada['statusFuncional']) || 'nao-testado',
    foiRecuperada: Boolean(p.foiRecuperada),
    foiTestada: Boolean(p.foiTestada),
    tecnicoTeste: (p.tecnicoTeste as string | undefined) || undefined,
    descricaoTeste: (p.descricaoTeste as string | undefined) || undefined,
    localizacao:
      (p.localizacao as PecaDesmontada['localizacao']) || emptyLocalizacaoDesmontado(),
    dataCriacao: String(p.dataCriacao || ''),
  }
}

export function migrateGruposDesmontadosList(raw: unknown): GrupoDesmontado[] {
  if (!Array.isArray(raw)) return []
  return raw.map((g) => migrateGrupoDesmontado((g || {}) as Partial<GrupoDesmontado> & Record<string, unknown>))
}

export function migratePecasDesmontadasList(raw: unknown): PecaDesmontada[] {
  if (!Array.isArray(raw)) return []
  return raw.map((p) => migratePecaDesmontada((p || {}) as Partial<PecaDesmontada> & Record<string, unknown>))
}

/** True se a lista migrada ainda precisa de regravar campos em falta. */
export function precisaRegravarGruposDesmontados(grupos: GrupoDesmontado[]): boolean {
  if (grupos.length === 0) return false
  const g0 = grupos[0]
  return !g0.numeroGrupo || !g0.localizacao
}

export function precisaRegravarPecasDesmontadas(pecas: PecaDesmontada[]): boolean {
  if (pecas.length === 0) return false
  const p0 = pecas[0]
  return !p0.numeroPeca || !p0.localizacao || !p0.quantidade
}
