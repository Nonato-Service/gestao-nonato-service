import { minutosPausaOuAlmocoDia } from '../relatorios-especiais'
import type { DiaTrabalho } from './tipos'

/** Duração HH:MM entre duas horas (suporta atravessar meia-noite). */
export function calcularDuracao(horaInicio: string, horaFim: string): string {
  if (!horaInicio || !horaFim) return ''
  try {
    const [hInicio, mInicio] = horaInicio.split(':').map(Number)
    const [hFim, mFim] = horaFim.split(':').map(Number)
    const inicioMinutos = hInicio * 60 + mInicio
    const fimMinutos = hFim * 60 + mFim
    let diffMinutos = fimMinutos - inicioMinutos
    if (diffMinutos < 0) diffMinutos += 24 * 60 // Se passar da meia-noite
    const horas = Math.floor(diffMinutos / 60)
    const minutos = diffMinutos % 60
    return `${horas}:${String(minutos).padStart(2, '0')}`
  } catch {
    return ''
  }
}

/** Recalcula durações de ida/retorno/horas (com pausa) e KM total do dia. */
export function atualizarCalculosDia(dia: DiaTrabalho): DiaTrabalho {
  let idaDuracao = dia.idaDuracao
  if (dia.idaHora && dia.idaChegada) {
    idaDuracao = calcularDuracao(dia.idaHora, dia.idaChegada)
  }

  let retornoDuracao = dia.retornoDuracao
  if (dia.retornoSaida && dia.retornoChegada) {
    retornoDuracao = calcularDuracao(dia.retornoSaida, dia.retornoChegada)
  }

  let horasDuracao = dia.horasDuracao
  if (dia.horasInicio && dia.horasFim) {
    horasDuracao = calcularDuracao(dia.horasInicio, dia.horasFim)
    const pausaMinutos = minutosPausaOuAlmocoDia(dia)
    if (pausaMinutos > 0) {
      try {
        const [hDuracao, mDuracao] = horasDuracao.split(':').map(Number)
        const duracaoMinutos = (hDuracao || 0) * 60 + (mDuracao || 0)
        const diffMinutos = Math.max(0, duracaoMinutos - pausaMinutos)
        const horas = Math.floor(diffMinutos / 60)
        const minutos = diffMinutos % 60
        horasDuracao = `${horas}:${String(minutos).padStart(2, '0')}`
      } catch {
        /* manter bruto */
      }
    }
  }

  const kmIda = parseFloat(dia.kmIda) || 0
  const kmRetorno = parseFloat(dia.kmRetorno) || 0
  const kmTotal = (kmIda + kmRetorno).toString()

  return {
    ...dia,
    idaDuracao,
    retornoDuracao,
    horasDuracao,
    kmTotal,
  }
}

export type TotaisDiasTrabalho = {
  horasTrabalho: string
  /** Minutos após descontar pausa — uso no fechamento para evitar erros de arredondamento HH:MM */
  horasTrabalhoMinutos: number
  kmsPercorridos: string
  horasViagem: string
  horasViagemMinutos: number
  horasViagemIda: string
  horasViagemIdaMinutos: number
  horasViagemRetorno: string
  horasViagemRetornoMinutos: number
}

/** Agrega totais de horas/KM a partir dos dias de trabalho. */
export function calcularTotais(dias: DiaTrabalho[] | undefined | null): TotaisDiasTrabalho {
  const listaDias = Array.isArray(dias) ? dias : []
  let totalHorasTrabalho = 0
  let totalKms = 0
  let totalHorasViagem = 0
  let totalHorasViagemIda = 0
  let totalHorasViagemRetorno = 0

  listaDias.forEach((dia) => {
    const diaCalculado = atualizarCalculosDia(dia)

    if (diaCalculado.horasDuracao) {
      const horasDuracao = diaCalculado.horasDuracao.split(':')
      if (horasDuracao.length === 2) {
        const horas = parseInt(horasDuracao[0]) || 0
        const minutos = parseInt(horasDuracao[1]) || 0
        totalHorasTrabalho += horas * 60 + minutos
      }
    }

    if (diaCalculado.idaDuracao) {
      const idaDuracao = diaCalculado.idaDuracao.split(':')
      if (idaDuracao.length === 2) {
        const horas = parseInt(idaDuracao[0]) || 0
        const minutos = parseInt(idaDuracao[1]) || 0
        totalHorasViagemIda += horas * 60 + minutos
        totalHorasViagem += horas * 60 + minutos
      }
    }

    if (diaCalculado.retornoDuracao) {
      const retornoDuracao = diaCalculado.retornoDuracao.split(':')
      if (retornoDuracao.length === 2) {
        const horas = parseInt(retornoDuracao[0]) || 0
        const minutos = parseInt(retornoDuracao[1]) || 0
        totalHorasViagemRetorno += horas * 60 + minutos
        totalHorasViagem += horas * 60 + minutos
      }
    }

    totalKms += parseFloat(diaCalculado.kmTotal) || 0
  })

  const horasTrabalho = Math.floor(totalHorasTrabalho / 60) + ':' + String(totalHorasTrabalho % 60).padStart(2, '0')
  const horasViagem = Math.floor(totalHorasViagem / 60) + ':' + String(totalHorasViagem % 60).padStart(2, '0')
  const horasViagemIda = Math.floor(totalHorasViagemIda / 60) + ':' + String(totalHorasViagemIda % 60).padStart(2, '0')
  const horasViagemRetorno =
    Math.floor(totalHorasViagemRetorno / 60) + ':' + String(totalHorasViagemRetorno % 60).padStart(2, '0')

  return {
    horasTrabalho,
    horasTrabalhoMinutos: totalHorasTrabalho,
    kmsPercorridos: totalKms.toFixed(2),
    horasViagem,
    horasViagemMinutos: totalHorasViagem,
    horasViagemIda,
    horasViagemIdaMinutos: totalHorasViagemIda,
    horasViagemRetorno,
    horasViagemRetornoMinutos: totalHorasViagemRetorno,
  }
}
