/** Helpers puros — normalize / create / filter / stats / opções de equipamento. */

import type {
  ConhecimentoSkillField,
  ConhecimentoTecnicoEntry,
  ConhecimentoTecnicoStats,
  TipoEquipamentoOpcao,
} from './tipos'

export const CONHECIMENTO_SKILL_FIELDS: readonly ConhecimentoSkillField[] = [
  'mecanico',
  'eletrico',
  'software',
  'programacao',
] as const

const DESCRICAO_KEY: Record<
  ConhecimentoSkillField,
  'descricaoMecanico' | 'descricaoEletrico' | 'descricaoSoftware' | 'descricaoProgramacao'
> = {
  mecanico: 'descricaoMecanico',
  eletrico: 'descricaoEletrico',
  software: 'descricaoSoftware',
  programacao: 'descricaoProgramacao',
}

function strOrEmpty(v: unknown): string {
  if (typeof v === 'string') return v
  if (v == null) return ''
  return String(v)
}

/** Limita nível ao intervalo 0–4 (inteiro). */
export function clampConhecimentoNivel(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(4, Math.round(n)))
}

/** Chave de descrição persistida para uma área de competência. */
export function descricaoKeyForSkill(
  field: ConhecimentoSkillField
): 'descricaoMecanico' | 'descricaoEletrico' | 'descricaoSoftware' | 'descricaoProgramacao' {
  return DESCRICAO_KEY[field]
}

/** Lê a descrição de uma área (string vazia se ausente). */
export function getDescricaoValue(entry: ConhecimentoTecnicoEntry, field: ConhecimentoSkillField): string {
  return entry[DESCRICAO_KEY[field]] ?? ''
}

/** Normaliza payload persistido (localStorage / servidor) para lista de entradas. */
export function normalizeConhecimentoTecnicos(raw: unknown): ConhecimentoTecnicoEntry[] {
  if (!Array.isArray(raw)) return []
  const out: ConhecimentoTecnicoEntry[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue
    const o = item as Record<string, unknown>
    const id = strOrEmpty(o.id)
    const tecnicoId = strOrEmpty(o.tecnicoId)
    const equipamentoTipoId = strOrEmpty(o.equipamentoTipoId)
    const equipamentoTipoNome = strOrEmpty(o.equipamentoTipoNome)
    if (!id && !tecnicoId && !equipamentoTipoId) continue
    const entry: ConhecimentoTecnicoEntry = {
      id: id || `ct-${Date.now()}-${out.length}`,
      tecnicoId,
      equipamentoTipoId,
      equipamentoTipoNome,
      mecanico: clampConhecimentoNivel(o.mecanico),
      eletrico: clampConhecimentoNivel(o.eletrico),
      software: clampConhecimentoNivel(o.software),
      programacao: clampConhecimentoNivel(o.programacao),
    }
    const dM = strOrEmpty(o.descricaoMecanico)
    const dE = strOrEmpty(o.descricaoEletrico)
    const dS = strOrEmpty(o.descricaoSoftware)
    const dP = strOrEmpty(o.descricaoProgramacao)
    if (dM) entry.descricaoMecanico = dM
    if (dE) entry.descricaoEletrico = dE
    if (dS) entry.descricaoSoftware = dS
    if (dP) entry.descricaoProgramacao = dP
    out.push(entry)
  }
  return out
}

/** Filtra entradas de um técnico. */
export function filterConhecimentoByTecnico(
  entries: ConhecimentoTecnicoEntry[],
  tecnicoId: string | null | undefined
): ConhecimentoTecnicoEntry[] {
  if (!tecnicoId) return []
  return entries.filter((c) => c.tecnicoId === tecnicoId)
}

/** Indica se já existe entrada para o par técnico + tipo de equipamento. */
export function conhecimentoEntryExists(
  entries: ConhecimentoTecnicoEntry[],
  tecnicoId: string,
  equipamentoTipoId: string
): boolean {
  return entries.some((c) => c.tecnicoId === tecnicoId && c.equipamentoTipoId === equipamentoTipoId)
}

/** Cria nova entrada com níveis a zero (id gerado se omitido). */
export function createConhecimentoTecnicoEntry(input: {
  tecnicoId: string
  equipamentoTipoId: string
  equipamentoTipoNome: string
  id?: string
}): ConhecimentoTecnicoEntry {
  return {
    id: input.id ?? `ct-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    tecnicoId: input.tecnicoId,
    equipamentoTipoId: input.equipamentoTipoId,
    equipamentoTipoNome: input.equipamentoTipoNome,
    mecanico: 0,
    eletrico: 0,
    software: 0,
    programacao: 0,
  }
}

/** Estatísticas agregadas (média, expert, contagem) sobre uma lista de entradas. */
export function computeTecnicoStats(entries: ConhecimentoTecnicoEntry[]): ConhecimentoTecnicoStats {
  let totalSkills = 0
  let sum = 0
  let expert = 0
  for (const e of entries) {
    for (const field of CONHECIMENTO_SKILL_FIELDS) {
      const v = e[field]
      totalSkills++
      sum += v
      if (v >= 4) expert++
    }
  }
  const media = totalSkills > 0 ? sum / totalSkills : 0
  return { equipamentos: entries.length, media, expert, totalSkills }
}

/** Monta opções de tipo (família › grupo) a partir das listas de equipamento. */
export function buildTiposEquipamentoOpcoes(
  familiasEquipamento: string[] | null | undefined,
  gruposEquipamento: Array<{ familia?: string; nome: string }> | null | undefined
): TipoEquipamentoOpcao[] {
  const out: TipoEquipamentoOpcao[] = []
  const fams = [...(familiasEquipamento || [])].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  )
  const grupos = gruposEquipamento || []
  fams.forEach((f) => {
    const doGrupo = grupos.filter((g) => (g.familia || '') === f)
    if (doGrupo.length === 0) out.push({ id: `${f}|`, nome: f })
    else
      doGrupo.forEach((g) =>
        out.push({ id: `${g.familia || f}|${g.nome}`, nome: `${g.familia || f} › ${g.nome}` })
      )
  })
  return out
}
