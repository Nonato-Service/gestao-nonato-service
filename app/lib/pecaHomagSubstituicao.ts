/**
 * Ligação de códigos HOMAG — máquina antiga + máquina nova (mesma peça, referências diferentes).
 * NÃO remove nem substitui entradas: os dois códigos ficam no catálogo.
 */

import {
  compactPecaCodigo,
  homagReferenciaParaCodigoSku,
  referenciaHomagDeTexto,
  referenciaHomagParaCodigoDireto,
} from './pecaCodigoBusca.ts'

export type PecaComCodigosAlternativos = {
  id?: string
  codigo?: string
  nome?: string
  descricao?: string
  imagem?: string
  codigosAlternativos?: string[]
  referenciasAlternativas?: string[]
  /** Legado — mantido em sync com codigosAlternativos */
  referenciasAntigas?: string[]
  codigosAntigos?: string[]
  substituidaPor?: string
}

export type LigacaoCodigosHomag = {
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

export function parseCodigoNovoHomagDeTexto(texto: string): string | null {
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

type ManualLigacao = {
  referenciaAntiga?: string
  referenciaMaquinaAntiga?: string
  codigoAntigo?: string
  codigoMaquinaAntiga?: string
  referenciaNova?: string
  referenciaMaquinaNova?: string
  codigoNovo?: string
  codigoMaquinaNova?: string
}

/** @deprecated Use detectarLigacoesCodigosHomag */
export function detectarSubstituicoesHomag(
  pecas: PecaComCodigosAlternativos[],
  manual: ManualLigacao[] = []
): LigacaoCodigosHomag[] {
  return detectarLigacoesCodigosHomag(pecas, manual)
}

export function detectarLigacoesCodigosHomag(
  pecas: PecaComCodigosAlternativos[],
  manual: ManualLigacao[] = []
): LigacaoCodigosHomag[] {
  const out: LigacaoCodigosHomag[] = []
  const seen = new Set<string>()

  for (const p of pecas) {
    const antigo = compactPecaCodigo(p.codigo)
    if (!antigo) continue
    const texto = `${p.nome || ''} ${p.descricao || ''}`
    const novo = parseCodigoNovoHomagDeTexto(texto)
    if (!novo || novo === antigo) continue
    const key = [antigo, novo].sort().join('<->')
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
    const refAntigaRaw = (m.referenciaMaquinaAntiga || m.referenciaAntiga || '').trim()
    const refNovaRaw = (m.referenciaMaquinaNova || m.referenciaNova || '').trim()
    const codAntigoRaw = (m.codigoMaquinaAntiga || m.codigoAntigo || refAntigaRaw).trim()
    const codNovoRaw = (m.codigoMaquinaNova || m.codigoNovo || refNovaRaw).trim()
    const novo = resolverSkuHomag(codNovoRaw)
    if (!novo) continue
    const antigo =
      resolverSkuHomag(codAntigoRaw) ||
      (refAntigaRaw ? referenciaHomagParaCodigoDireto(refAntigaRaw) : null)
    const refAntiga = refAntigaRaw || referenciaHomagDeTexto(codAntigoRaw) || undefined
    const refNova = refNovaRaw || referenciaHomagDeTexto(novo) || undefined
    const codigoAntigo = antigo ? compactPecaCodigo(antigo) : refAntiga ? compactPecaCodigo(refAntiga) : ''
    if (!codigoAntigo || codigoAntigo === novo) continue
    const key = [codigoAntigo, novo].sort().join('<->')
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      codigoAntigo,
      referenciaAntiga: refAntiga,
      codigoNovo: novo,
      referenciaNova: refNova,
      fonte: 'manual',
    })
  }

  return out
}

function adicionarCodigoAlternativo(
  peca: PecaComCodigosAlternativos,
  codigo: string,
  referencia?: string
): void {
  const refExtra = referenciaHomagDeTexto(codigo)
  const cods = uniqStrings([
    ...(peca.codigosAlternativos || []),
    ...(peca.codigosAntigos || []),
    compactPecaCodigo(codigo),
  ])
  const refs = uniqStrings([
    ...(peca.referenciasAlternativas || []),
    ...(peca.referenciasAntigas || []),
    ...(referencia ? [referencia] : []),
    ...(refExtra ? [refExtra] : []),
  ])
  peca.codigosAlternativos = cods
  peca.referenciasAlternativas = refs
  peca.codigosAntigos = cods
  peca.referenciasAntigas = refs
  delete peca.substituidaPor
}

/** @deprecated Use aplicarLigacoesCodigosHomagNoCatalogo */
export function aplicarSubstituicoesHomagNoCatalogo<T extends PecaComCodigosAlternativos>(
  pecas: T[],
  manual: ManualLigacao[] = []
): { pecas: T[]; stats: { aplicadas: number; imagensMantidas: number; removidas: number } } {
  return aplicarLigacoesCodigosHomagNoCatalogo(pecas, manual)
}

export function aplicarLigacoesCodigosHomagNoCatalogo<T extends PecaComCodigosAlternativos>(
  pecas: T[],
  manual: ManualLigacao[] = []
): { pecas: T[]; stats: { aplicadas: number; imagensMantidas: number; removidas: number } } {
  const ligs = detectarLigacoesCodigosHomag(pecas, manual)
  const byCodigo = new Map<string, T>()
  for (const p of pecas) {
    const c = compactPecaCodigo(p.codigo)
    if (c) byCodigo.set(c, p)
  }

  let aplicadas = 0
  let imagensMantidas = 0

  for (const lig of ligs) {
    const pecaAntiga = byCodigo.get(lig.codigoAntigo)
    const pecaNova = byCodigo.get(lig.codigoNovo)

    if (pecaNova) {
      adicionarCodigoAlternativo(pecaNova, lig.codigoAntigo, lig.referenciaAntiga)
    }
    if (pecaAntiga) {
      adicionarCodigoAlternativo(pecaAntiga, lig.codigoNovo, lig.referenciaNova)
      if (pecaNova) {
        const mesmaImagem = imagensPecaCorrespondem(pecaAntiga.imagem, pecaNova.imagem)
        const novaSemFoto = !pecaTemImagemUtil(pecaNova.imagem)
        const antigaSemFoto = !pecaTemImagemUtil(pecaAntiga.imagem)
        if (mesmaImagem || (novaSemFoto && pecaTemImagemUtil(pecaAntiga.imagem))) {
          pecaNova.imagem = pecaAntiga.imagem
          imagensMantidas++
        } else if (mesmaImagem || (antigaSemFoto && pecaTemImagemUtil(pecaNova.imagem))) {
          pecaAntiga.imagem = pecaNova.imagem
          imagensMantidas++
        }
      }
    }

    if (pecaAntiga || pecaNova) aplicadas++
  }

  return {
    pecas,
    stats: { aplicadas, imagensMantidas, removidas: 0 },
  }
}
