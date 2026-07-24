/** Classificação e contagens de imagens na Biblioteca de Peças. */

export const PECA_BIBLIOTECA_PLACEHOLDER_PATTERNS = [/default-product-image\.svg/i]

/** Logo Nonato na grelha quando a peça não tem foto própria (não gravar como `imagem` da peça). */
export const PECA_BIBLIOTECA_LOGO_PADRAO_SRC = '/brand/nonato-logo-original.png'

export function pecaBibliotecaSrcEhLogoPadrao(src: string | undefined | null): boolean {
  const s = String(src ?? '').trim()
  if (!s) return false
  if (s === PECA_BIBLIOTECA_LOGO_PADRAO_SRC) return true
  return /\/nonato-logo-original\.png(?:\?.*)?$/i.test(s)
}

export type PecaBibliotecaImagemKind =
  | 'base64'
  | 'url'
  | 'placeholder'
  | 'vazia'
  | 'pendenteServidor'

export type PecaBibliotecaImagemStats = {
  total: number
  comFotoReal: number
  comBase64: number
  comUrlHomag: number
  placeholder: number
  semImagem: number
  pendenteServidor: number
  faltam: number
}

export type PecaBibliotecaImagemInput = {
  id?: unknown
  imagem?: unknown
  /** Miniatura opcional na grelha da biblioteca; se vazia, usa `imagem`. */
  imagemCapa?: unknown
  temImagemServidor?: unknown
}

export function pecaBibliotecaTemImagemNoServidor(peca: PecaBibliotecaImagemInput): boolean {
  const v = peca.temImagemServidor
  return v === true || v === 'true' || v === 1 || v === '1'
}

/** Peça mostra foto na grelha (local, URL HOMAG ou pendente no Railway). */
export function pecaBibliotecaTemFotoVisivel(peca: PecaBibliotecaImagemInput): boolean {
  return pecaBibliotecaTemImagemPropria(typeof peca.imagem === 'string' ? peca.imagem : '') || pecaBibliotecaTemImagemNoServidor(peca)
}

export function isPecaBibliotecaImagemPlaceholder(imagem: string | undefined | null): boolean {
  const s = String(imagem ?? '').trim()
  if (!s) return false
  return PECA_BIBLIOTECA_PLACEHOLDER_PATTERNS.some((re) => re.test(s))
}

/** Foto própria da peça (não placeholder HOMAG, logo padrão nem string vazia). Inclui URL https e base64. */
export function pecaBibliotecaTemImagemPropria(imagem: string | undefined | null): boolean {
  const s = String(imagem ?? '').trim()
  if (!s) return false
  if (pecaBibliotecaSrcEhLogoPadrao(s)) return false
  if (isPecaBibliotecaImagemPlaceholder(s)) return false
  return true
}

export function classificarImagemPecaBiblioteca(peca: PecaBibliotecaImagemInput): PecaBibliotecaImagemKind {
  const img = typeof peca.imagem === 'string' ? peca.imagem.trim() : ''
  const temServidor =
    peca.temImagemServidor === true ||
    peca.temImagemServidor === 'true' ||
    peca.temImagemServidor === 1 ||
    peca.temImagemServidor === '1'

  if (img.startsWith('data:') && img.length > 0) return 'base64'
  if (pecaBibliotecaTemImagemPropria(img)) {
    if (/^https?:\/\//i.test(img)) return 'url'
    return 'url'
  }
  if (isPecaBibliotecaImagemPlaceholder(img)) return 'placeholder'
  if (temServidor) return 'pendenteServidor'
  return 'vazia'
}

export function calcularPecasBibliotecaImagemStats(
  pecas: PecaBibliotecaImagemInput[]
): PecaBibliotecaImagemStats {
  let comBase64 = 0
  let comUrlHomag = 0
  let placeholder = 0
  let semImagem = 0
  let pendenteServidor = 0

  for (const peca of pecas) {
    const kind = classificarImagemPecaBiblioteca(peca)
    switch (kind) {
      case 'base64':
        comBase64++
        break
      case 'url':
        comUrlHomag++
        break
      case 'placeholder':
        placeholder++
        break
      case 'pendenteServidor':
        pendenteServidor++
        break
      default:
        semImagem++
        break
    }
  }

  const total = pecas.length
  const comFotoReal = comBase64 + comUrlHomag
  const faltam = total - comFotoReal

  return {
    total,
    comFotoReal,
    comBase64,
    comUrlHomag,
    placeholder,
    semImagem,
    pendenteServidor,
    faltam,
  }
}

export function pecaBibliotecaTemFotoReal(peca: PecaBibliotecaImagemInput): boolean {
  const kind = classificarImagemPecaBiblioteca(peca)
  return kind === 'base64' || kind === 'url'
}

const HOMAG_IMG_HOST = /^(shop\.)?homag\.com$/i

function resolveHomagOrDirectSrc(s: string, fallbackSrc: string): string {
  if (s.startsWith('data:') || s.startsWith('/')) return s
  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s)
      if (HOMAG_IMG_HOST.test(u.hostname)) {
        return `/api/data/homag-imagem?url=${encodeURIComponent(s)}`
      }
    } catch {
      /* usar URL directa */
    }
    return s
  }
  return fallbackSrc
}

/** Src para <img>: proxy HOMAG, foto no Railway por id, ou logo padrão. */
export function resolvePecaBibliotecaImagemSrcForDisplay(
  input: string | undefined | null | PecaBibliotecaImagemInput,
  fallbackSrc = PECA_BIBLIOTECA_LOGO_PADRAO_SRC
): string {
  if (input && typeof input === 'object') {
    const peca = input
    const img = typeof peca.imagem === 'string' ? peca.imagem.trim() : ''
    if (pecaBibliotecaTemImagemPropria(img)) {
      return resolveHomagOrDirectSrc(img, fallbackSrc)
    }
    if (pecaBibliotecaTemImagemNoServidor(peca) && peca.id) {
      return `/api/data/peca-biblioteca-imagem?id=${encodeURIComponent(String(peca.id))}`
    }
    return fallbackSrc
  }
  const imagem = input
  if (!pecaBibliotecaTemImagemPropria(imagem)) return fallbackSrc
  return resolveHomagOrDirectSrc(String(imagem).trim(), fallbackSrc)
}

/** Miniatura na grelha: `imagemCapa` personalizada, senão foto da peça / servidor. */
export function resolvePecaBibliotecaCapaSrcForDisplay(
  peca: PecaBibliotecaImagemInput,
  fallbackSrc = PECA_BIBLIOTECA_LOGO_PADRAO_SRC
): string {
  const capa = typeof peca.imagemCapa === 'string' ? peca.imagemCapa.trim() : ''
  if (pecaBibliotecaTemImagemPropria(capa)) {
    return resolveHomagOrDirectSrc(capa, fallbackSrc)
  }
  return resolvePecaBibliotecaImagemSrcForDisplay(peca, fallbackSrc)
}

/** Há imagem para mostrar na grelha (capa, foto local ou pendente no servidor). */
export function pecaBibliotecaTemCapaOuFotoVisivel(peca: PecaBibliotecaImagemInput): boolean {
  const capa = typeof peca.imagemCapa === 'string' ? peca.imagemCapa : ''
  if (pecaBibliotecaTemImagemPropria(capa)) return true
  return pecaBibliotecaTemFotoVisivel(peca)
}

/** Miniatura na grelha deve usar estilo do logo (contain + margem), não crop. */
export function pecaBibliotecaUsarEstiloLogoPadrao(peca: PecaBibliotecaImagemInput): boolean {
  return !pecaBibliotecaTemCapaOuFotoVisivel(peca)
}
