/**
 * Merge export.json HOMAG → biblioteca local (novos + fotos/nomes em falta).
 */
import {
  isPecaBibliotecaImagemPlaceholder,
  pecaBibliotecaTemImagemPropria,
} from './pecaBibliotecaImagemStats'

export type PecaHomagMerge = {
  id: string
  nome: string
  codigo: string
  preco?: string
  descricao?: string
  categoria?: string
  categoriaId?: string
  subcategoria?: string
  subcategoriaId?: string
  imagem?: string
  dataCriacao?: string
  importacaoPendente?: boolean
  numeroSequenciaGrupo?: string
}

export type MergeHomagExportOptions = {
  /** Preenche imagem quando a peça existente não tem foto (default: true). */
  atualizarFotosEmFalta?: boolean
  /** Substitui foto mesmo quando já existe (ex.: HOMAG mudou imagem). */
  substituirFotosExistentes?: boolean
  /** Preenche preço quando a peça existente não tem preço (default: true). */
  atualizarPrecosEmFalta?: boolean
  /** Substitui preço mesmo quando já existe. */
  substituirPrecosExistentes?: boolean
  /** Preenche nome/descrição vazios (default: true). */
  atualizarTextosVazios?: boolean
  /** Novas peças entram directo no catálogo, não na fila amarela (default: true). */
  novosDirectoCatalogo?: boolean
}

export type MergeHomagExportResult = {
  list: PecaHomagMerge[]
  added: number
  updatedImages: number
  updatedNames: number
  updatedDescricoes: number
  updatedPrecos: number
  unchanged: number
}

export function normCodigoHomag(c: string | undefined | null): string {
  return String(c ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
}

function parsePrecoNumero(raw: unknown): number {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : NaN
  const t = String(raw ?? '')
    .trim()
    .replace(/[€$£\s]/g, '')
  if (!t) return NaN
  if (t.includes(',') && t.includes('.')) {
    if (t.lastIndexOf(',') > t.lastIndexOf('.')) {
      return parseFloat(t.replace(/\./g, '').replace(',', '.'))
    }
    return parseFloat(t.replace(/,/g, ''))
  }
  if (t.includes(',')) return parseFloat(t.replace(',', '.'))
  return parseFloat(t)
}

export function formatHomagPreco(raw: unknown): string {
  if (raw == null || raw === '') return ''
  let v: unknown = raw
  if (typeof raw === 'object' && raw !== null && 'value' in raw) {
    v = (raw as { value?: unknown }).value
  }
  const n = parsePrecoNumero(v)
  if (!Number.isFinite(n) || n < 0) return ''
  return n.toFixed(2).replace('.', ',')
}

export function extrairPrecoHomagItem(item: Record<string, unknown>): string {
  const fields = item.fields
  const fromFields =
    fields && typeof fields === 'object'
      ? (fields as Record<string, unknown>).From_price__c ??
        (fields as Record<string, unknown>).from_price__c
      : undefined
  const raw = item.preco ?? item.price ?? item.From_price__c ?? fromFields ?? ''
  return formatHomagPreco(raw)
}

export function extrairImagemHomagItem(item: Record<string, unknown>): string {
  const raw =
    item.imagem ??
    item.image ??
    item.imagem_url ??
    item.imageUrl ??
    item.imagemUrl ??
    item.url ??
    ''
  let imagem = String(raw ?? '').trim()
  if (!imagem && item.defaultImage && typeof item.defaultImage === 'object') {
    const di = item.defaultImage as Record<string, unknown>
    imagem = String(di.url ?? di.thumbnailUrl ?? '').trim()
  }
  if (imagem.startsWith('//')) imagem = `https:${imagem}`
  if (imagem.startsWith('/') && !imagem.startsWith('//')) {
    imagem = `https://shop.homag.com${imagem}`
  }
  if (isPecaBibliotecaImagemPlaceholder(imagem)) return ''
  return imagem
}

export function homagItemToPecaMerge(item: Record<string, unknown>, seq: number): PecaHomagMerge {
  const codigo = String(item.codigo ?? item.code ?? item.sku ?? '').trim()
  const descricao = String(item.descricao ?? item.description ?? '').trim()
  let nome = String(item.nome ?? item.name ?? '').trim()
  if (!nome) nome = descricao || codigo || `Peça ${seq + 1}`
  const imagem = extrairImagemHomagItem(item)
  const preco = extrairPrecoHomagItem(item)
  return {
    id: `import-homag-${Date.now()}-${seq}-${Math.random().toString(36).slice(2, 9)}`,
    nome,
    codigo,
    preco,
    descricao: descricao || nome,
    categoria: '',
    categoriaId: '',
    subcategoria: '',
    subcategoriaId: '',
    importacaoPendente: false,
    imagem,
    dataCriacao: new Date().toISOString(),
  }
}

export function parseHomagExportJson(raw: string): Record<string, unknown>[] {
  const j = JSON.parse(raw) as unknown
  if (Array.isArray(j)) return j as Record<string, unknown>[]
  if (j && typeof j === 'object') {
    const o = j as Record<string, unknown>
    for (const key of ['itens', 'pecas', 'items', 'data', 'parts']) {
      if (Array.isArray(o[key])) return o[key] as Record<string, unknown>[]
    }
  }
  throw new Error('Formato não reconhecido — esperado array ou { itens: [...] }')
}

function pecaTemImagemUtil(imagem: string | undefined | null): boolean {
  return pecaBibliotecaTemImagemPropria(imagem)
}

function imagensDiferentes(a: string | undefined, b: string | undefined): boolean {
  const sa = String(a ?? '').trim()
  const sb = String(b ?? '').trim()
  if (!sa || !sb) return sa !== sb
  if (sa === sb) return false
  if (sa.startsWith('data:') && sb.startsWith('data:')) return sa.slice(0, 120) !== sb.slice(0, 120)
  return true
}

export function mergeHomagExportIntoBiblioteca<T extends PecaHomagMerge>(
  existing: T[],
  incomingRaw: Record<string, unknown>[],
  opts: MergeHomagExportOptions = {}
): MergeHomagExportResult & { list: T[] } {
  const atualizarFotosEmFalta = opts.atualizarFotosEmFalta !== false
  const substituirFotos = opts.substituirFotosExistentes === true
  const atualizarPrecosEmFalta = opts.atualizarPrecosEmFalta !== false
  const substituirPrecos = opts.substituirPrecosExistentes === true
  const atualizarTextosVazios = opts.atualizarTextosVazios !== false
  const novosDirectoCatalogo = opts.novosDirectoCatalogo !== false

  const list = [...existing]
  const byCodigo = new Map<string, T>()
  for (const p of list) {
    const c = normCodigoHomag(p.codigo)
    if (c) byCodigo.set(c, p)
  }

  let added = 0
  let updatedImages = 0
  let updatedNames = 0
  let updatedDescricoes = 0
  let updatedPrecos = 0
  let unchanged = 0

  incomingRaw.forEach((item, idx) => {
    const incoming = homagItemToPecaMerge(item, idx) as T
    if (novosDirectoCatalogo) incoming.importacaoPendente = false

    const c = normCodigoHomag(incoming.codigo)
    if (!c) {
      unchanged++
      return
    }

    const ex = byCodigo.get(c)
    if (ex) {
      let mudou = false
      const incImg = incoming.imagem?.trim() || ''

      if (incImg) {
        const falta = !pecaTemImagemUtil(ex.imagem)
        const substituir = substituirFotos && imagensDiferentes(ex.imagem, incImg)
        if ((atualizarFotosEmFalta && falta) || substituir) {
          ex.imagem = incImg
          updatedImages++
          mudou = true
        }
      }

      if (atualizarTextosVazios) {
        if ((!ex.nome || !String(ex.nome).trim()) && incoming.nome) {
          ex.nome = incoming.nome
          updatedNames++
          mudou = true
        }
        if ((!ex.descricao || !String(ex.descricao).trim()) && incoming.descricao) {
          ex.descricao = incoming.descricao
          updatedDescricoes++
          mudou = true
        }
      }

      if (incoming.preco) {
        const falta = !ex.preco || !String(ex.preco).trim()
        const substituir = substituirPrecos && ex.preco !== incoming.preco
        if ((atualizarPrecosEmFalta && falta) || substituir) {
          ex.preco = incoming.preco
          updatedPrecos++
          mudou = true
        }
      }

      if (!mudou) unchanged++
      return
    }

    list.push(incoming)
    byCodigo.set(c, incoming)
    added++
  })

  return { list, added, updatedImages, updatedNames, updatedDescricoes, updatedPrecos, unchanged }
}
