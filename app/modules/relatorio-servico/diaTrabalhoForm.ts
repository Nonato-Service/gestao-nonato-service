import type { DiaTrabalho } from './tipos'

/** Estado inicial / limpo do formulário de dia de trabalho. */
export function createEmptyDiaTrabalhoForm(opts: { nowMs: number }): DiaTrabalho {
  return {
    data: new Date(opts.nowMs).toISOString().split('T')[0],
    idaHora: '',
    idaChegada: '',
    idaDuracao: '',
    horasInicio: '',
    horasFim: '',
    horasDuracao: '',
    retornoSaida: '',
    retornoChegada: '',
    retornoDuracao: '',
    kmIda: '',
    kmRetorno: '',
    kmTotal: '',
    pausa: '',
    tempoPausa: '',
    descricaoTrabalho: '',
  }
}
