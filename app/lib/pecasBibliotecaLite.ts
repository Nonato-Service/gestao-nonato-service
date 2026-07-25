/** Gera catálogo lite (sem imagens base64) a partir do catálogo completo. */

export function toLitePeca(p: Record<string, unknown>): Record<string, unknown> {
  const out = { ...p }
  const img = out.imagem
  if (typeof img === 'string' && img.startsWith('data:') && img.length > 0) {
    out.temImagemServidor = true
    delete out.imagem
  }
  return out
}

export function buildPecasBibliotecaLite(pecas: unknown): unknown[] {
  if (!Array.isArray(pecas)) return []
  return pecas.map((p) => toLitePeca((p ?? {}) as Record<string, unknown>))
}
