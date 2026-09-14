/**
 * @deprecated Preferir `app/modules/relatorios-especiais` — reexport de compatibilidade.
 */
import { dataLocalHojeISO as dataLocalHojeISOPure } from '../modules/relatorios-especiais/shared'

export type { PecaSubstituicao } from '../modules/relatorios-especiais/shared'

/** Injeta Date.now() quando o call-site não envia a data. */
export function dataLocalHojeISO(date?: Date): string {
  return dataLocalHojeISOPure(date ? date.getTime() : Date.now())
}
