/** Mappers puros de itens genéricos → peça da Biblioteca (importação). */

import {
  compactPecaCodigo,
  nucleoCodigoHomag,
  referenciaHomagDeTexto,
  variantesCodigoHomagParaMatch,
} from '../../lib/pecaCodigoBusca'
import { normalizeImportKey } from './merge'
import type { PecaBibliotecaLike } from './tipos'

export function buildImportedPecaDescricao(
  nome: string,
  codigo: string,
  descricaoOriginal: string
): string {
  const nomeLimpo = String(nome || '').trim()
  const codigoLimpo = String(codigo || '').trim()
  const descricaoLimpa = String(descricaoOriginal || '').trim()

  const partesBase = [nomeLimpo, codigoLimpo ? `COD: ${codigoLimpo}` : ''].filter(Boolean)
  const base = partesBase.join(' | ').trim()

  if (!descricaoLimpa) return base || nomeLimpo || codigoLimpo

  const descricaoNorm = normalizeImportKey(descricaoLimpa)
  const nomeNorm = normalizeImportKey(nomeLimpo)
  const codigoNorm = normalizeImportKey(codigoLimpo)
  const temNome = !!nomeNorm && descricaoNorm.includes(nomeNorm)
  const temCodigo = !!codigoNorm && descricaoNorm.includes(codigoNorm)

  if (temNome && temCodigo) return descricaoLimpa
  if (base) return `${base} | ${descricaoLimpa}`
  return descricaoLimpa
}

/** Mapeia objeto genérico (JSON do site / CSV) para peça da biblioteca. */
export function mapItemToPecaBiblioteca(item: any, index: number): PecaBibliotecaLike {
  const codigo = String(
    item?.codigo ?? item?.code ?? item?.partNumber ?? item?.sku ?? item?.numero ?? item?.id ?? item?.ref ?? ''
  ).trim()
  let nome = String(item?.nome ?? item?.name ?? '').trim()
  const descricao = String(item?.descricao ?? item?.description ?? item?.designation ?? '').trim()
  if (!nome) {
    nome = descricao
      ? descricao.length > 220
        ? `${descricao.slice(0, 220)}…`
        : descricao
      : codigo || `Peça ${index + 1}`
  }
  const preco =
    item?.preco != null
      ? String(item.preco)
      : item?.price != null
        ? String(item.price)
        : item?.precoUnitario != null
          ? String(item.precoUnitario)
          : ''
  let imagem = String(
    item?.imagem ??
      item?.image ??
      item?.img ??
      item?.imagem_url ??
      item?.imageUrl ??
      item?.photo ??
      item?.urlImagem ??
      item?.thumbnail ??
      item?.thumb ??
      item?.thumbnailUrl ??
      item?.picture ??
      item?.mainImage ??
      item?.main_image ??
      item?.image_link ??
      item?.imageLink ??
      item?.mediaUrl ??
      item?.url_image ??
      item?.image_url ??
      item?.foto ??
      item?.featuredImage ??
      item?.featured_image ??
      item?.smallImage ??
      item?.largeImage ??
      item?.imagePath ??
      item?.image_path ??
      ''
  ).trim()
  if (!imagem) {
    const maybeImgUrl = String(item?.url ?? item?.link ?? item?.href ?? '').trim()
    if (/\.(jpg|jpeg|png|webp|gif|svg)(\?|#|$)/i.test(maybeImgUrl)) imagem = maybeImgUrl
  }
  // Catálogos JSON: images/gallery como array de URLs ou objetos { url, src, ... }
  if (!imagem) {
    const arr =
      item?.images ?? item?.photos ?? item?.gallery ?? item?.medias ?? item?.pictures ?? item?.media
    if (Array.isArray(arr) && arr.length > 0) {
      const x = arr[0]
      if (typeof x === 'string' && x.trim()) imagem = x.trim()
      else if (x && typeof x === 'object') {
        imagem = String(
          (x as any).url ??
            (x as any).src ??
            (x as any).image ??
            (x as any).href ??
            (x as any).large ??
            (x as any).full ??
            (x as any).original ??
            (x as any).path ??
            (x as any).uri ??
            ''
        ).trim()
      }
    }
  }
  if (!imagem && item?.media && typeof item.media === 'object' && !Array.isArray(item.media)) {
    const m = item.media as Record<string, unknown>
    const u = m.url ?? m.src ?? m.image ?? m.href
    if (typeof u === 'string' && u.trim()) imagem = u.trim()
  }
  // CSV/campos arbitrários: cabeçalhos como "URL da imagem", "Image URL", "Photo link"
  if (!imagem && item && typeof item === 'object') {
    for (const [k, v] of Object.entries(item)) {
      if (typeof v !== 'string' || !v.trim()) continue
      const kn = k.toLowerCase()
      if (!/(imagem|image|photo|foto|miniatura|thumb|picture|capa|poster|banner|galeria|gallery)/i.test(kn))
        continue
      const s = v.trim().replace(/&amp;/g, '&')
      if (/^https?:\/\//i.test(s) || s.startsWith('//') || /\.(jpg|jpeg|png|webp|gif|svg)(\?|#|$)/i.test(s)) {
        imagem = s.startsWith('//') ? `https:${s}` : s
        break
      }
    }
  }
  if (imagem.startsWith('//')) imagem = `https:${imagem}`

  const refsAlt = new Set<string>(
    [...(item?.referenciasAlternativas || []), ...(item?.referenciasAntigas || [])]
      .map((r: unknown) => String(r ?? '').trim())
      .filter(Boolean)
  )
  const codsAlt = new Set<string>(
    [...(item?.codigosAlternativos || []), ...(item?.codigosAntigos || [])]
      .map((c: unknown) => String(c ?? '').trim())
      .filter(Boolean)
  )
  if (codigo) {
    const ref = referenciaHomagDeTexto(codigo)
    if (ref) refsAlt.add(ref)
    const nucleo = nucleoCodigoHomag(codigo)
    if (nucleo) codsAlt.add(nucleo)
    for (const v of variantesCodigoHomagParaMatch(codigo)) {
      if (/^r?\d{7,11}r?$/i.test(v.replace(/[^a-z0-9]/g, ''))) codsAlt.add(v)
      const r = referenciaHomagDeTexto(v)
      if (r) refsAlt.add(r)
    }
  }
  const codigoNorm = compactPecaCodigo(codigo)
  const referenciasAlternativas = [...refsAlt].filter((r) => compactPecaCodigo(r) !== codigoNorm && r !== codigo)
  const codigosAlternativos = [...codsAlt].filter((c) => compactPecaCodigo(c) !== codigoNorm)

  return {
    id:
      item?.id && typeof item.id === 'string'
        ? item.id
        : `import-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 9)}`,
    nome: nome || codigo || `Peça ${index + 1}`,
    codigo: codigo || `IMP-${index + 1}`,
    preco: preco || '',
    descricao: buildImportedPecaDescricao(
      nome || codigo || `Peça ${index + 1}`,
      codigo || `IMP-${index + 1}`,
      descricao || nome
    ),
    categoria: item?.categoria ?? item?.category ?? item?.grupo ?? '',
    categoriaId: item?.categoriaId ?? item?.categoryId ?? '',
    subcategoria: item?.subcategoria ?? item?.subcategory ?? '',
    subcategoriaId: item?.subcategoriaId ?? item?.subcategoryId ?? '',
    importacaoPendente: Boolean(item?.importacaoPendente),
    imagem,
    ...(referenciasAlternativas.length ? { referenciasAlternativas } : {}),
    ...(codigosAlternativos.length ? { codigosAlternativos } : {}),
    dataCriacao: new Date().toISOString(),
  }
}
