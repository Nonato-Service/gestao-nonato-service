/** Verifica se o payload de manuais/bíblia tem estrutura vazia (sem famílias, grupos nem modelos). */
export function isEmptyManuaisPayload(value: unknown): boolean {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return true
  const v = value as { familias?: unknown[]; grupos?: unknown[]; modelos?: unknown[] }
  const hasFam = Array.isArray(v.familias) && v.familias.length > 0
  const hasGrp = Array.isArray(v.grupos) && v.grupos.length > 0
  const hasMod = Array.isArray(v.modelos) && v.modelos.length > 0
  return !hasFam && !hasGrp && !hasMod
}

/** Indica se há PDFs, anexos, imagens ou texto técnico guardado. */
export function manuaisPayloadHasRichContent(value: unknown): boolean {
  if (isEmptyManuaisPayload(value)) return false
  const v = value as {
    modelos?: Array<{
      documentos?: unknown[]
      imagens?: unknown[]
      anexos?: unknown[]
      software?: string
      notas?: string
      infoTecnicas?: string
      infoMecanicas?: string
      infoEletricas?: string
    }>
  }
  for (const m of v.modelos || []) {
    if ((m.documentos?.length ?? 0) > 0) return true
    if ((m.imagens?.length ?? 0) > 0) return true
    if ((m.anexos?.length ?? 0) > 0) return true
    if (String(m.software || '').trim()) return true
    if (String(m.notas || '').trim()) return true
    if (String(m.infoTecnicas || '').trim()) return true
    if (String(m.infoMecanicas || '').trim()) return true
    if (String(m.infoEletricas || '').trim()) return true
  }
  return (v.modelos?.length ?? 0) > 0
}

/**
 * Funde dados do servidor com os do localStorage para a secção Manuais e Informações Técnicas.
 * Evita perder PDFs/anexos quando o servidor ainda não sincronizou ou tem versão antiga.
 */
export function mergeManuaisFamiliasGrupos(server: any, local: any): any {
  const famSet = new Set<string>([...(server?.familias || []), ...(local?.familias || [])])
  const familias = Array.from(famSet).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))

  const gruposMap = new Map<string, any>()
  for (const g of server?.grupos || []) gruposMap.set(g.id, { ...g })
  for (const g of local?.grupos || []) gruposMap.set(g.id, { ...g })
  const grupos = Array.from(gruposMap.values())

  const mergeTexto = (a?: string, b?: string) => {
    const A = a?.trim() ?? ''
    const B = b?.trim() ?? ''
    if (B.length >= A.length) return B || A
    return A || B
  }

  const mergeModelo = (s: any, l: any): any => {
    const docMap = new Map<string, any>()
    for (const d of s.documentos || []) docMap.set(d.id, d)
    for (const d of l.documentos || []) docMap.set(d.id, d)
    const imgMap = new Map<string, any>()
    for (const i of s.imagens || []) imgMap.set(i.id, i)
    for (const i of l.imagens || []) imgMap.set(i.id, i)
    const anexoMap = new Map<string, any>()
    for (const a of s.anexos || []) anexoMap.set(a.id, a)
    for (const a of l.anexos || []) anexoMap.set(a.id, a)
    return {
      ...s,
      ...l,
      nome: l.nome || s.nome,
      grupoId: l.grupoId || s.grupoId,
      documentos: Array.from(docMap.values()),
      imagens: Array.from(imgMap.values()),
      anexos: Array.from(anexoMap.values()),
      software: mergeTexto(s.software, l.software),
      notas: mergeTexto(s.notas, l.notas),
      infoTecnicas: mergeTexto(s.infoTecnicas, l.infoTecnicas),
      infoMecanicas: mergeTexto(s.infoMecanicas, l.infoMecanicas),
      infoEletricas: mergeTexto(s.infoEletricas, l.infoEletricas),
      bibliaModeloId: l.bibliaModeloId || s.bibliaModeloId,
      bibliaLinhaId: l.bibliaLinhaId || s.bibliaLinhaId,
      bibliaFamiliaId: l.bibliaFamiliaId || s.bibliaFamiliaId,
    }
  }

  const modelosMap = new Map<string, any>()
  for (const m of server?.modelos || []) modelosMap.set(m.id, m)
  for (const m of local?.modelos || []) {
    const existing = modelosMap.get(m.id)
    modelosMap.set(m.id, existing ? mergeModelo(existing, m) : m)
  }
  return { familias, grupos, modelos: Array.from(modelosMap.values()) }
}
