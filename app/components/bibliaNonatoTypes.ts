export const BIBLIA_NONATO_STORAGE_KEY = 'nonato-biblia-nonato-service'
export const BIBLIA_LEGACY_CATEGORIES_KEY = 'nonatoServiceBiblia.v1'
export const BIBLIA_ANEXO_MAX_BYTES = 6 * 1024 * 1024
export const BIBLIA_ANEXO_MAX_PER_MODEL = 24

export type BibliaAnexo = {
  id: string
  nome: string
  mime: string
  dataUrl: string
}

export type BibliaModelo = {
  id: string
  nome: string
  ordem: number
  software: string
  mecanica: string
  eletrica: string
  notas: string
  anexos: BibliaAnexo[]
}

export type BibliaLinha = {
  id: string
  titulo: string
  ordem: number
  modelos: BibliaModelo[]
}

export type BibliaFamilia = {
  id: string
  nome: string
  ordem: number
  linhas: BibliaLinha[]
}

export type BibliaStore = {
  familias: BibliaFamilia[]
  updatedAt?: string
}

export function bibliaUid(): string {
  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

function parseInformacoesSections(text: string): Pick<BibliaModelo, 'software' | 'mecanica' | 'eletrica' | 'notas'> {
  const raw = String(text || '')
  const pick = (tag: string): string => {
    const re = new RegExp(`\\[${tag}\\]\\s*([\\s\\S]*?)(?=\\n\\n\\[|$)`, 'i')
    const m = raw.match(re)
    return m ? m[1].trim() : ''
  }
  const software = pick('Software')
  const mecanica = pick('Mecânica') || pick('Mecanica')
  const eletrica = pick('Elétrica') || pick('Eletrica')
  const notas = pick('Notas')
  if (software || mecanica || eletrica || notas) {
    return { software, mecanica, eletrica, notas }
  }
  return { software: '', mecanica: '', eletrica: '', notas: raw.trim() }
}

function normalizeModelo(mod: any, mi: number): BibliaModelo {
  const anexosRaw = Array.isArray(mod?.anexos) ? mod.anexos : []
  const anexos: BibliaAnexo[] = anexosRaw
    .filter((a: any) => a && typeof a.dataUrl === 'string' && a.dataUrl.startsWith('data:'))
    .map((a: any) => ({
      id: a.id || bibliaUid(),
      nome: String(a.nome || a.name || 'ficheiro').slice(0, 200),
      mime: a.mime || 'application/octet-stream',
      dataUrl: a.dataUrl,
    }))
  const parsed =
    mod?.software != null || mod?.mechanical != null || mod?.electrical != null
      ? {
          software: String(mod.software || ''),
          mecanica: String(mod.mechanical || mod.mecanica || ''),
          eletrica: String(mod.electrical || mod.eletrica || ''),
          notas: String(mod.notes || mod.notas || ''),
        }
      : parseInformacoesSections(String(mod?.informacoes || mod?.notas || ''))
  return {
    id: mod?.id || bibliaUid(),
    nome: String(mod?.nome || mod?.name || mod?.titulo || '').trim(),
    ordem: typeof mod?.ordem === 'number' ? mod.ordem : mi,
    software: parsed.software,
    mecanica: parsed.mecanica,
    eletrica: parsed.eletrica,
    notas: parsed.notas,
    anexos,
  }
}

function normalizeLinha(lin: any, bi: number): BibliaLinha {
  const modelosRaw = Array.isArray(lin?.modelos) ? lin.modelos : []
  return {
    id: lin?.id || bibliaUid(),
    titulo: String(lin?.titulo || lin?.name || '').trim(),
    ordem: typeof lin?.ordem === 'number' ? lin.ordem : bi,
    modelos: modelosRaw.map(normalizeModelo).sort((a, b) => a.ordem - b.ordem),
  }
}

function normalizeFamilia(fam: any, ci: number): BibliaFamilia {
  const linhasRaw = Array.isArray(fam?.linhas)
    ? fam.linhas
    : Array.isArray(fam?.grupos)
      ? fam.grupos
      : Array.isArray(fam?.brands)
        ? fam.brands
        : []
  return {
    id: fam?.id || bibliaUid(),
    nome: String(fam?.nome || fam?.name || '').trim(),
    ordem: typeof fam?.ordem === 'number' ? fam.ordem : ci,
    linhas: linhasRaw.map(normalizeLinha).sort((a, b) => a.ordem - b.ordem),
  }
}

export function normalizeBibliaImport(data: unknown): BibliaStore {
  if (!data || typeof data !== 'object') {
    return { familias: [] }
  }
  const obj = data as Record<string, unknown>
  if (Array.isArray(obj.familias)) {
    return {
      familias: obj.familias.map(normalizeFamilia).sort((a, b) => a.ordem - b.ordem),
      updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : undefined,
    }
  }
  if (Array.isArray(obj.categories)) {
    const familias = (obj.categories as any[]).map((cat, ci) =>
      normalizeFamilia(
        {
          id: cat.id,
          nome: cat.name,
          ordem: ci,
          linhas: (cat.brands || []).map((br: any, bi: number) => ({
            id: br.id,
            titulo: br.name,
            ordem: bi,
            modelos: br.models || [],
          })),
        },
        ci
      )
    )
    return { familias }
  }
  return { familias: [] }
}

export function buildInformacoesText(m: BibliaModelo): string {
  const parts: string[] = []
  if (m.software.trim()) parts.push(`[Software]\n${m.software.trim()}`)
  if (m.mecanica.trim()) parts.push(`[Mecânica]\n${m.mecanica.trim()}`)
  if (m.eletrica.trim()) parts.push(`[Elétrica]\n${m.eletrica.trim()}`)
  if (m.notas.trim()) parts.push(`[Notas]\n${m.notas.trim()}`)
  return parts.join('\n\n')
}

export function serializeBibliaForServer(store: BibliaStore): BibliaStore {
  return {
    familias: store.familias.map((fam, fi) => ({
      ...fam,
      ordem: fi,
      linhas: fam.linhas.map((lin, li) => ({
        ...lin,
        ordem: li,
        modelos: lin.modelos.map((mod, mi) => ({
          id: mod.id,
          nome: mod.nome,
          ordem: mi,
          informacoes: buildInformacoesText(mod),
          software: mod.software,
          mecanica: mod.mecanica,
          eletrica: mod.eletrica,
          notas: mod.notas,
          anexos: mod.anexos,
        })),
      })),
    })),
    updatedAt: new Date().toISOString(),
  }
}

export function countBibliaStats(store: BibliaStore) {
  let marcas = 0
  let modelos = 0
  let anexos = 0
  store.familias.forEach((f) => {
    marcas += f.linhas.length
    f.linhas.forEach((l) => {
      modelos += l.modelos.length
      l.modelos.forEach((m) => {
        anexos += m.anexos.length
      })
    })
  })
  return { familias: store.familias.length, marcas, modelos, anexos }
}

export function seedBibliaExample(): BibliaStore {
  const holzmaId = bibliaUid()
  const modelos = ['HPP 230', 'HPP 250', 'HPP 350', 'HPP 380', 'HPL 300', 'HPL 380'].map((nome, i) => ({
    id: bibliaUid(),
    nome,
    ordem: i,
    software: '',
    mecanica: '',
    eletrica: '',
    notas: '',
    anexos: [] as BibliaAnexo[],
  }))
  return {
    familias: [
      {
        id: bibliaUid(),
        nome: 'Seccionadoras',
        ordem: 0,
        linhas: [
          { id: holzmaId, titulo: 'Holzma', ordem: 0, modelos },
          { id: bibliaUid(), titulo: 'Homag (Espanha)', ordem: 1, modelos: [] },
        ],
      },
    ],
    updatedAt: new Date().toISOString(),
  }
}

export function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= arr.length || to >= arr.length || from === to) return arr
  const next = [...arr]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function normalizeSearch(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
}

export function bibliaMatchesSearch(store: BibliaStore, query: string): BibliaStore {
  const q = normalizeSearch(query.trim())
  if (!q) return store
  const familias = store.familias
    .map((fam) => {
      if (normalizeSearch(fam.nome).includes(q)) return fam
      const linhas = fam.linhas
        .map((lin) => {
          if (normalizeSearch(lin.titulo).includes(q)) return lin
          const modelos = lin.modelos.filter(
            (m) =>
              normalizeSearch(m.nome).includes(q) ||
              normalizeSearch(m.software).includes(q) ||
              normalizeSearch(m.mecanica).includes(q) ||
              normalizeSearch(m.eletrica).includes(q) ||
              normalizeSearch(m.notas).includes(q)
          )
          if (modelos.length) return { ...lin, modelos }
          return null
        })
        .filter(Boolean) as BibliaLinha[]
      if (linhas.length) return { ...fam, linhas }
      return null
    })
    .filter(Boolean) as BibliaFamilia[]
  return { familias }
}
