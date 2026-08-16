import { ehImportacaoPendenteStrict } from './cadastroForm'
import type { CategoriaPecaLike, PecaBibliotecaLike } from './tipos'

export const BIBLIOTECA_SEM_GRUPO_SEQUENCIA_KEY = '__sem_grupo__'

export type CategoriaRefSequencia = Pick<CategoriaPecaLike, 'id' | 'nome'>

/** Peças na fila amarela (importação pendente) não entram na numeração do catálogo. */
export function pecaEntraNaNumeracaoSequenciaBiblioteca(
  p: Pick<PecaBibliotecaLike, 'importacaoPendente'>
): boolean {
  return !ehImportacaoPendenteStrict(p)
}

export function resolverChaveSequenciaNumeroPecaBiblioteca(
  p: Pick<PecaBibliotecaLike, 'categoriaId' | 'categoria' | 'importacaoPendente'>,
  categorias?: CategoriaRefSequencia[]
): string | null {
  if (!pecaEntraNaNumeracaoSequenciaBiblioteca(p)) return null
  let catId = String(p.categoriaId || '').trim()
  if (!catId && p.categoria?.trim() && categorias?.length) {
    const alvo = p.categoria.trim().toLowerCase()
    const porNome = categorias.find((c) => (c.nome || '').trim().toLowerCase() === alvo)
    if (porNome) catId = porNome.id
  }
  if (!catId) return BIBLIOTECA_SEM_GRUPO_SEQUENCIA_KEY
  return catId
}

export function chaveSequenciaNumeroPecaBiblioteca(
  p: Pick<PecaBibliotecaLike, 'categoriaId' | 'subcategoriaId' | 'categoria' | 'importacaoPendente'>,
  categorias?: CategoriaRefSequencia[]
): string {
  return resolverChaveSequenciaNumeroPecaBiblioteca(p, categorias) ?? BIBLIOTECA_SEM_GRUPO_SEQUENCIA_KEY
}

export function formatNumeroSequenciaPecaBiblioteca(n: number): string {
  if (!Number.isFinite(n) || n < 1) return '01'
  if (n > 999) return String(n)
  return String(n).padStart(n > 99 ? 3 : 2, '0')
}

export function parseNumeroSequenciaPecaBiblioteca(raw: string | undefined | null): number {
  const digits = String(raw || '').replace(/\D/g, '')
  const n = parseInt(digits, 10)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export function proximoNumeroSequenciaPecaBiblioteca<T extends PecaBibliotecaLike>(
  categoriaId: string,
  subcategoriaId: string,
  pecas: T[],
  excludeId?: string,
  categorias?: CategoriaRefSequencia[]
): string {
  const key = chaveSequenciaNumeroPecaBiblioteca({ categoriaId, subcategoriaId }, categorias)
  let count = 0
  for (const p of pecas) {
    if (excludeId && p.id === excludeId) continue
    if (!pecaEntraNaNumeracaoSequenciaBiblioteca(p)) continue
    if (chaveSequenciaNumeroPecaBiblioteca(p, categorias) !== key) continue
    count++
  }
  return formatNumeroSequenciaPecaBiblioteca(count + 1)
}

export function garantirNumerosSequenciaPecaBiblioteca<T extends PecaBibliotecaLike>(
  pecas: T[],
  categorias?: CategoriaRefSequencia[]
): { lista: T[]; alterou: boolean } {
  const grupos = new Map<string, T[]>()
  for (const p of pecas) {
    const k = resolverChaveSequenciaNumeroPecaBiblioteca(p, categorias)
    if (k === null) continue
    if (!grupos.has(k)) grupos.set(k, [])
    grupos.get(k)!.push(p)
  }
  let alterou = false
  const out = pecas.map((p) => ({ ...p }))
  const byId = new Map(out.map((p) => [p.id, p]))

  for (const [, list] of grupos) {
    const ordenada = [...list].sort((a, b) => {
      const dateCmp = String(a.dataCriacao || '').localeCompare(String(b.dataCriacao || ''))
      if (dateCmp !== 0) return dateCmp
      return String(a.nome || a.codigo || '').localeCompare(String(b.nome || b.codigo || ''), undefined, {
        numeric: true,
      })
    })
    ordenada.forEach((p, idx) => {
      const fmt = formatNumeroSequenciaPecaBiblioteca(idx + 1)
      const cur = byId.get(p.id)!
      const atual = String(cur.numeroSequenciaGrupo ?? '').trim()
      const atualFmt =
        parseNumeroSequenciaPecaBiblioteca(atual) > 0
          ? formatNumeroSequenciaPecaBiblioteca(parseNumeroSequenciaPecaBiblioteca(atual))
          : ''
      if (atualFmt !== fmt) {
        cur.numeroSequenciaGrupo = fmt
        alterou = true
      }
    })
  }

  for (const p of out) {
    if (!pecaEntraNaNumeracaoSequenciaBiblioteca(p) && p.numeroSequenciaGrupo) {
      byId.get(p.id)!.numeroSequenciaGrupo = ''
      alterou = true
    }
  }

  return { lista: out, alterou }
}

export function chavePecaBibliotecaSequenciaPreview(p: { codigo?: string; nome?: string }): string {
  const cod = String(p.codigo ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
  if (cod) return cod
  const nome = String(p.nome ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
  return nome ? `n:${nome}` : ''
}

export function indiceOrdemCategoriaPecaBiblioteca(
  p: Pick<PecaBibliotecaLike, 'categoriaId'>,
  categorias?: CategoriaRefSequencia[]
): number {
  const catId = String(p.categoriaId || '').trim()
  if (!catId) return (categorias?.length ?? 0) + 1
  if (!categorias?.length) return 0
  const idx = categorias.findIndex((c) => c.id === catId)
  return idx >= 0 ? idx : categorias.length
}

export function compararPecasBibliotecaPorNumeroSequencia(
  a: PecaBibliotecaLike,
  b: PecaBibliotecaLike,
  categorias?: CategoriaRefSequencia[]
): number {
  const ca = indiceOrdemCategoriaPecaBiblioteca(a, categorias)
  const cb = indiceOrdemCategoriaPecaBiblioteca(b, categorias)
  if (ca !== cb) return ca - cb

  const na = parseNumeroSequenciaPecaBiblioteca(a.numeroSequenciaGrupo)
  const nb = parseNumeroSequenciaPecaBiblioteca(b.numeroSequenciaGrupo)
  if (na && nb && na !== nb) return na - nb
  if (na && !nb) return -1
  if (!na && nb) return 1
  return String(a.nome || a.codigo || '').localeCompare(String(b.nome || b.codigo || ''), undefined, {
    numeric: true,
  })
}

export function ordenarPecasBibliotecaParaExibicao<T extends PecaBibliotecaLike>(
  pecas: T[],
  categorias?: CategoriaRefSequencia[]
): T[] {
  return [...pecas].sort((a, b) => compararPecasBibliotecaPorNumeroSequencia(a, b, categorias))
}

export function atribuirNumerosSequenciaNovasPecas<T extends PecaBibliotecaLike>(
  novas: T[],
  existentes: T[],
  categorias?: CategoriaRefSequencia[]
): T[] {
  if (novas.length === 0) return novas
  const merged = [...existentes, ...novas.map((p) => ({ ...p, numeroSequenciaGrupo: '' }))]
  const { lista } = garantirNumerosSequenciaPecaBiblioteca(merged, categorias)
  const numeroPorChave = new Map<string, string>()
  for (const p of lista) {
    const k = p.id || chavePecaBibliotecaSequenciaPreview(p)
    if (k && p.numeroSequenciaGrupo) numeroPorChave.set(k, p.numeroSequenciaGrupo)
  }
  return novas.map((p) => {
    const k = p.id || chavePecaBibliotecaSequenciaPreview(p)
    const num = k ? numeroPorChave.get(k) : undefined
    return num ? { ...p, numeroSequenciaGrupo: num } : p
  })
}

export function resolverNumeroSequenciaAoSalvarPecaBiblioteca(
  form: PecaBibliotecaLike,
  pecas: PecaBibliotecaLike[],
  editing?: PecaBibliotecaLike | null,
  categorias?: CategoriaRefSequencia[]
): string {
  let gid = form.categoriaId || ''
  if (!gid && form.categoria?.trim() && categorias?.length) {
    const alvo = form.categoria.trim().toLowerCase()
    const porNome = categorias.find((c) => (c.nome || '').trim().toLowerCase() === alvo)
    if (porNome) gid = porNome.id
  }
  const sid = form.subcategoriaId || ''
  if (editing) {
    const oldKey = chaveSequenciaNumeroPecaBiblioteca(editing, categorias)
    const newKey = chaveSequenciaNumeroPecaBiblioteca({ categoriaId: gid, subcategoriaId: sid }, categorias)
    const existente = parseNumeroSequenciaPecaBiblioteca(editing.numeroSequenciaGrupo)
    if (oldKey === newKey && existente > 0) {
      return formatNumeroSequenciaPecaBiblioteca(existente)
    }
  }
  return proximoNumeroSequenciaPecaBiblioteca(gid, sid, pecas, editing?.id, categorias)
}

export function rotuloNumeroSequenciaPecaBiblioteca(
  peca: Pick<
    PecaBibliotecaLike,
    'numeroSequenciaGrupo' | 'categoriaId' | 'subcategoriaId' | 'categoria' | 'subcategoria'
  >,
  categorias?: { id: string; nome: string }[],
  _subcategorias?: { id: string; nome: string }[]
): string {
  const num = String(peca.numeroSequenciaGrupo || '').trim()
  if (!num) return ''
  const cat =
    peca.categoriaId && categorias
      ? categorias.find((c) => c.id === peca.categoriaId)?.nome || peca.categoria
      : peca.categoria
  const grupo = String(cat || '').trim()
  return grupo ? `${grupo} ${num}` : num
}
