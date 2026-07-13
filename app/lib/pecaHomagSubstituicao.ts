/**
 * Substituições de códigos HOMAG (REPLACED BY / código antigo → SKU novo).
 * Se a imagem da peça antiga corresponde à nova, mantém-se na peça nova.
 */

import {
  compactPecaCodigo,
  homagReferenciaParaCodigoSku,
  referenciaHomagDeTexto,
  referenciaHomagParaCodigoDireto,
} from './pecaCodigoBusca.ts'

export type PecaComSubstituicao = {
  id?: string
  codigo?: string
  nome?: string
  descricao?: string
  imagem?: string
  referenciasAntigas?: string[]
  codigosAntigos?: string[]
  substituidaPor?: string
}

export type SubstituicaoHomag = {
  codigoAntigo: string
  referenciaAntiga?: string
  codigoNovo: string
  referenciaNova?: string
  fonte: 'replaced-by' | 'manual'
}

const REPLACED_BY_RE =
  /replaced\s+by[:\s]+(\d[\d-]{4,}|\d{9,11})/gi

export function imagemPecaFingerprint(imagem: unknown): string {
  if (typeof imagem !== 'string' || !imagem.trim()) return ''
  const s = imagem.trim()
  if (s.startsWith('data:') && s.length > 120) {
    return s.slice(0, 120) + ':' + s.length
  }
  return s.toLowerCase()
}

export function imagensPecaCorrespondem(a: unknown, b: unknown): boolean {
  const fa = imagemPecaFingerprint(a)
  const fb = imagemPecaFingerprint(b)
  if (!fa || !fb) return false
  return fa === fb
}

export function pecaTemImagemUtil(imagem: unknown): boolean {
  if (typeof imagem !== 'string') return false
  const s = imagem.trim()
  return s.length > 0 && s !== 'false'
}

export function parseSubstituicaoHomagDeTexto(texto: string): string | null {
  const t = String(texto || '')
  REPLACED_BY_RE.lastIndex = 0
  const m = REPLACED_BY_RE.exec(t)
  if (!m) return null
  return resolverSkuHomag(m[1].trim())
}

function resolverSkuHomag(valor: string): string | null {
  const v = valor.trim()
  if (!v) return null
  const sku = homagReferenciaParaCodigoSku(v) || referenciaHomagParaCodigoDireto(v)
  if (sku) return compactPecaCodigo(sku)
  const c = compactPecaCodigo(v)
  return /^\d{9,11}$/.test(c) ? c : null
}

function uniqStrings(list: string[]): string[] {
  return [...new Set(list.map((s) => s.trim()).filter(Boolean))]
}

export function detectarSubstituicoesHomag(
  pecas: PecaComSubstituicao[],
  manual: Array<{ referenciaAntiga?: string; codigoAntigo?: string; codigoNovo: string }> = []
): SubstituicaoHomag[] {
  const out: SubstituicaoHomag[] = []
  const seen = new Set<string>()

  for (const p of pecas) {
    const antigo = compactPecaCodigo(p.codigo)
    if (!antigo) continue
    const texto = `${p.nome || ''} ${p.descricao || ''}`
    const novo = parseSubstituicaoHomagDeTexto(texto)
    if (!novo || novo === antigo) continue
    const key = `${antigo}->${novo}`
    if (seen.has(key)) continue
    seen.add(key)
    const refAntiga = referenciaHomagDeTexto(antigo) || referenciaHomagDeTexto(texto)
    out.push({
      codigoAntigo: antigo,
      referenciaAntiga: refAntiga || undefined,
      codigoNovo: novo,
      referenciaNova: referenciaHomagDeTexto(novo) || undefined,
      fonte: 'replaced-by',
    })
  }

  for (const m of manual) {
    const novo = resolverSkuHomag(m.codigoNovo)
    if (!novo) continue
    const antigo =
      resolverSkuHomag(m.codigoAntigo || '') ||
      (m.referenciaAntiga ? referenciaHomagParaCodigoDireto(m.referenciaAntiga) : null)
    const refAntiga = m.referenciaAntiga?.trim() || referenciaHomagDeTexto(m.referenciaAntiga || '')
    const codigoAntigo = antigo ? compactPecaCodigo(antigo) : refAntiga ? compactPecaCodigo(refAntiga) : ''
    const key = `${refAntiga || codigoAntigo}->${novo}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      codigoAntigo: codigoAntigo || compactPecaCodigo(refAntiga || ''),
      referenciaAntiga: refAntiga || undefined,
      codigoNovo: novo,
      referenciaNova: referenciaHomagDeTexto(novo) || undefined,
      fonte: 'manual',
    })
  }

  return out
}

function adicionarAntigo(peca: PecaComSubstituicao, sub: SubstituicaoHomag): void {
  const refs = [...(peca.referenciasAntigas || [])]
  const cods = [...(peca.codigosAntigos || [])]
  if (sub.referenciaAntiga) refs.push(sub.referenciaAntiga)
  if (sub.codigoAntigo) cods.push(sub.codigoAntigo)
  const refDoAntigo = referenciaHomagDeTexto(sub.codigoAntigo)
  if (refDoAntigo) refs.push(refDoAntigo)
  peca.referenciasAntigas = uniqStrings(refs)
  peca.codigosAntigos = uniqStrings(cods.map(compactPecaCodigo))
}

export function aplicarSubstituicoesHomagNoCatalogo<T extends PecaComSubstituicao>(
  pecas: T[],
  manual: Array<{ referenciaAntiga?: string; codigoAntigo?: string; codigoNovo: string }> = []
): { pecas: T[]; stats: { aplicadas: number; imagensMantidas: number; removidas: number } } {
  const subs = detectarSubstituicoesHomag(pecas, manual)
  const byCodigo = new Map<string, T>()
  for (const p of pecas) {
    const c = compactPecaCodigo(p.codigo)
    if (c) byCodigo.set(c, p)
  }

  const remover = new Set<string>()
  let aplicadas = 0
  let imagensMantidas = 0

  for (const sub of subs) {
    const antiga = byCodigo.get(sub.codigoAntigo)
    const nova = byCodigo.get(sub.codigoNovo)

    if (nova) {
      adicionarAntigo(nova, sub)
      if (antiga) {
        const imgAntiga = antiga.imagem
        const imgNova = nova.imagem
        const mesmaImagem = imagensPecaCorrespondem(imgAntiga, imgNova)
        const novaSemFoto = !pecaTemImagemUtil(imgNova)
        if (antiga.nome && (!nova.nome || /replaced by/i.test(nova.nome))) {
          nova.nome = antiga.nome.replace(/\s*replaced\s+by.*/i, '').trim() || nova.nome
        }
        if (mesmaImagem || (novaSemFoto && pecaTemImagemUtil(imgAntiga))) {
          nova.imagem = imgAntiga
          imagensMantidas++
        }
        antiga.substituidaPor = sub.codigoNovo
        remover.add(sub.codigoAntigo)
      }
      aplicadas++
    } else if (antiga) {
      adicionarAntigo(antiga, sub)
      antiga.substituidaPor = sub.codigoNovo
      if (!antiga.descricao?.includes('SUBSTITUÍDO POR')) {
        antiga.descricao = `${antiga.descricao || antiga.nome || ''} | SUBSTITUÍDO POR ${sub.codigoNovo}${sub.referenciaAntiga ? ` (ref. antiga ${sub.referenciaAntiga})` : ''}`.trim()
      }
      aplicadas++
    } else if (sub.fonte === 'manual' && sub.referenciaAntiga) {
      aplicadas++
    }
  }

  const filtradas = pecas.filter((p) => {
    const c = compactPecaCodigo(p.codigo)
    return !c || !remover.has(c)
  })

  return {
    pecas: filtradas,
    stats: { aplicadas, imagensMantidas, removidas: remover.size },
  }
}
