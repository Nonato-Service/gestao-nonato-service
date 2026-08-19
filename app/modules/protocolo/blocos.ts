import type { ProtocoloBloco } from './tipos'

export function newProtocoloBlocoId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `bloco-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/** Remove buracos/null e garante `id` + shape estável em cada bloco. */
export function ensureProtocoloBlocosIds(blocos: ProtocoloBloco[] | null | undefined): ProtocoloBloco[] {
  if (!Array.isArray(blocos)) return []
  return blocos
    .filter((raw): raw is ProtocoloBloco => raw != null && typeof raw === 'object')
    .map((raw) => {
      const b = raw as ProtocoloBloco
      const tipo = b.tipo === 'imagens' || b.tipo === 'acao' || b.tipo === 'texto' ? b.tipo : 'texto'
      const base: ProtocoloBloco = {
        ...b,
        tipo,
        imagens: tipo === 'acao' || tipo === 'imagens' ? (Array.isArray(b.imagens) ? b.imagens : []) : b.imagens,
        ordemConteudo:
          tipo === 'acao' && (b.ordemConteudo === 'imagens_primeiro' || b.ordemConteudo === 'texto_primeiro')
            ? b.ordemConteudo
            : tipo === 'acao'
              ? 'texto_primeiro'
              : undefined,
        estadoAcao:
          tipo === 'acao' &&
          (b.estadoAcao === 'bom' ||
            b.estadoAcao === 'reparar' ||
            b.estadoAcao === 'substituir' ||
            b.estadoAcao === 'nd')
            ? b.estadoAcao
            : undefined,
      }
      return base.id ? base : { ...base, id: newProtocoloBlocoId() }
    })
}
