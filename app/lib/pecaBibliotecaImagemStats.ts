/** Classificação e contagens de imagens na Biblioteca de Peças. */

export const PECA_BIBLIOTECA_PLACEHOLDER_PATTERNS = [/default-product-image\.svg/i]

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
  imagem?: unknown
  temImagemServidor?: unknown
}

export function isPecaBibliotecaImagemPlaceholder(imagem: string | undefined | null): boolean {
  const s = String(imagem ?? '').trim()
  if (!s) return false
  return PECA_BIBLIOTECA_PLACEHOLDER_PATTERNS.some((re) => re.test(s))
}

/** Foto própria da peça (não placeholder HOMAG nem string vazia). Inclui URL https e base64. */
export function pecaBibliotecaTemImagemPropria(imagem: string | undefined | null): boolean {
  const s = String(imagem ?? '').trim()
  if (!s) return false
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

/** Src para <img>: proxy same-origin para URLs HOMAG (Referer / cookies). */
export function resolvePecaBibliotecaImagemSrcForDisplay(
  imagem: string | undefined | null,
  fallbackSrc = '/brand/nonato-logo-original.png'
): string {
  if (!pecaBibliotecaTemImagemPropria(imagem)) return fallbackSrc
  const s = String(imagem).trim()
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
