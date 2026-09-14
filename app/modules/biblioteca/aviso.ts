export const BIBLIOTECA_ULTIMO_SERVIDOR_AVISADO_KEY = 'nonato-biblioteca-ultimo-servidor-total-avisado'
export const BIBLIOTECA_AVISO_PERMISSAO_PEDIDA_KEY = 'nonato-biblioteca-aviso-permissao-pedida'

export const BIBLIOTECA_AVISO_POLL_MS = 5 * 60 * 1000

export function lerUltimoServidorTotalAvisado(readItem: (key: string) => string | null): number {
  try {
    const v = readItem(BIBLIOTECA_ULTIMO_SERVIDOR_AVISADO_KEY)
    return v ? Number(v) || 0 : 0
  } catch {
    return 0
  }
}

export function gravarUltimoServidorTotalAvisado(
  total: number,
  writeItem: (key: string, value: string) => void
): void {
  try {
    writeItem(BIBLIOTECA_ULTIMO_SERVIDOR_AVISADO_KEY, String(total))
  } catch {
    /* ignore */
  }
}

export type BibliotecaNovidadesMsgTemplates = {
  one?: string
  many?: string
}

export function formatBibliotecaNovidadesMsg(
  novidades: number,
  servidorTotal: number,
  templates?: BibliotecaNovidadesMsgTemplates
): string {
  if (novidades === 1 && templates?.one) {
    return templates.one.replace(/\{servidorTotal\}/g, String(servidorTotal))
  }
  if (templates?.many) {
    return templates.many
      .replace(/\{novidades\}/g, String(novidades))
      .replace(/\{servidorTotal\}/g, String(servidorTotal))
  }
  if (novidades === 1) {
    return `Há 1 peça nova no servidor (${servidorTotal} total). Abra Biblioteca de Peças e clique «Actualizar biblioteca».`
  }
  return `Há ${novidades} peças novas no servidor (${servidorTotal} total). Abra Biblioteca de Peças e clique «Actualizar biblioteca».`
}
