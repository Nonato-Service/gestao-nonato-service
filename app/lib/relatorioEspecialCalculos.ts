import type {
  DiaTrabalhoEspecial,
  HorasEquipamentoDia,
  RelatorioEspecial,
} from './relatorioEspecialTypes'

export function calcularDuracaoHoras(horaInicio: string, horaFim: string): string {
  if (!horaInicio || !horaFim) return ''
  try {
    const [hInicio, mInicio] = horaInicio.split(':').map(Number)
    const [hFim, mFim] = horaFim.split(':').map(Number)
    const inicioMinutos = hInicio * 60 + mInicio
    const fimMinutos = hFim * 60 + mFim
    let diffMinutos = fimMinutos - inicioMinutos
    if (diffMinutos < 0) diffMinutos += 24 * 60
    const horas = Math.floor(diffMinutos / 60)
    const minutos = diffMinutos % 60
    return `${horas}:${String(minutos).padStart(2, '0')}`
  } catch {
    return ''
  }
}

export function minutosDeDuracaoHHMM(duracao: string | undefined): number {
  if (!duracao) return 0
  const parts = duracao.split(':')
  if (parts.length !== 2) return 0
  const h = parseInt(parts[0], 10) || 0
  const m = parseInt(parts[1], 10) || 0
  return h * 60 + m
}

export function formatMinutosComoHHMM(minutos: number): string {
  const m = Math.max(0, minutos)
  const h = Math.floor(m / 60)
  const rest = m % 60
  return `${h}:${String(rest).padStart(2, '0')}`
}

export function minutosAlmocoDia(dia: DiaTrabalhoEspecial): number {
  const tempoPausa = String(dia.tempoPausa ?? '').trim()
  if (/^\d{1,2}:\d{2}$/.test(tempoPausa)) return minutosDeDuracaoHHMM(tempoPausa)
  const pausa = String(dia.pausa ?? '').trim()
  if (/^\d{1,2}:\d{2}$/.test(pausa)) return minutosDeDuracaoHHMM(pausa)
  return 0
}

/** Bruto início→fim por linha de equipamento (hora corrida). */
export function horasEquipamentoDiaBruto(linha: HorasEquipamentoDia): string {
  if (linha.horasInicio && linha.horasFim) {
    return calcularDuracaoHoras(linha.horasInicio, linha.horasFim)
  }
  return linha.horasDuracao || ''
}

export function atualizarHorasEquipamentoDia(linha: HorasEquipamentoDia): HorasEquipamentoDia {
  return { ...linha, horasDuracao: horasEquipamentoDiaBruto(linha) }
}

/** Desconta almoço/pausa do total do dia, repartido pelas linhas de equipamento. */
export function aplicarDescontoAlmocoHorasEquipamento(
  linhas: HorasEquipamentoDia[],
  pausaMin: number
): HorasEquipamentoDia[] {
  const comBruto = linhas.map((l) => ({
    ...l,
    horasDuracao: horasEquipamentoDiaBruto(l),
  }))
  if (pausaMin <= 0) return comBruto

  const brutoMin = comBruto.map((l) => minutosDeDuracaoHHMM(l.horasDuracao))
  const totalBruto = brutoMin.reduce((a, b) => a + b, 0)
  if (totalBruto <= 0) return comBruto

  const pausaEfetiva = Math.min(pausaMin, totalBruto)
  let pausaAlocada = 0
  const liquidoMin = brutoMin.map((bruto, idx) => {
    if (idx === brutoMin.length - 1) {
      return Math.max(0, bruto - (pausaEfetiva - pausaAlocada))
    }
    const desconto = Math.floor((bruto / totalBruto) * pausaEfetiva)
    pausaAlocada += desconto
    return Math.max(0, bruto - desconto)
  })

  return comBruto.map((l, idx) => ({
    ...l,
    horasDuracao: formatMinutosComoHHMM(liquidoMin[idx]),
  }))
}

export function atualizarCalculosDiaEspecial(dia: DiaTrabalhoEspecial): DiaTrabalhoEspecial {
  const idaDuracao =
    dia.idaHora && dia.idaChegada ? calcularDuracaoHoras(dia.idaHora, dia.idaChegada) : dia.idaDuracao
  const retornoDuracao =
    dia.retornoSaida && dia.retornoChegada
      ? calcularDuracaoHoras(dia.retornoSaida, dia.retornoChegada)
      : dia.retornoDuracao
  const kmIda = parseFloat(dia.kmIda) || 0
  const kmRetorno = parseFloat(dia.kmRetorno) || 0
  const horasPorEquipamento = aplicarDescontoAlmocoHorasEquipamento(
    (dia.horasPorEquipamento || []).map(atualizarHorasEquipamentoDia),
    minutosAlmocoDia(dia)
  )
  return {
    ...dia,
    idaDuracao,
    retornoDuracao,
    kmTotal: String(kmIda + kmRetorno),
    horasPorEquipamento,
  }
}

export type TotaisRelatorioEspecial = {
  horasPorEquipamento: Record<string, number>
  horasTrabalhoTotal: number
  kmsTotal: number
  horasViagemTotal: number
  horasViagemIda: number
  horasViagemRetorno: number
  diarias: number
}

export function calcularTotaisRelatorioEspecial(
  dias: DiaTrabalhoEspecial[] | undefined | null
): TotaisRelatorioEspecial {
  const lista = Array.isArray(dias) ? dias : []
  const horasPorEquipamento: Record<string, number> = {}
  let horasTrabalhoTotal = 0
  let kmsTotal = 0
  let horasViagemIda = 0
  let horasViagemRetorno = 0
  const datasUnicas = new Set<string>()

  for (const diaRaw of lista) {
    const dia = atualizarCalculosDiaEspecial(diaRaw)
    if (dia.data) datasUnicas.add(dia.data.slice(0, 10))

    kmsTotal += parseFloat(dia.kmTotal) || 0
    horasViagemIda += minutosDeDuracaoHHMM(dia.idaDuracao)
    horasViagemRetorno += minutosDeDuracaoHHMM(dia.retornoDuracao)

    for (const linha of dia.horasPorEquipamento || []) {
      const uid = (linha.equipamentoUid || '').trim()
      if (!uid) continue
      const min = minutosDeDuracaoHHMM(linha.horasDuracao)
      if (min <= 0) continue
      horasPorEquipamento[uid] = (horasPorEquipamento[uid] || 0) + min
      horasTrabalhoTotal += min
    }
  }

  return {
    horasPorEquipamento,
    horasTrabalhoTotal,
    kmsTotal,
    horasViagemTotal: horasViagemIda + horasViagemRetorno,
    horasViagemIda,
    horasViagemRetorno,
    diarias: datasUnicas.size,
  }
}

export function aplicarTotaisNoRelatorioEspecial(relatorio: RelatorioEspecial): RelatorioEspecial {
  const dias = (relatorio.diasTrabalho || []).map(atualizarCalculosDiaEspecial)
  const totais = calcularTotaisRelatorioEspecial(dias)
  const horasPorEquipamentoResumo: Record<string, string> = {}
  for (const [uid, min] of Object.entries(totais.horasPorEquipamento)) {
    horasPorEquipamentoResumo[uid] = formatMinutosComoHHMM(min)
  }
  return {
    ...relatorio,
    diasTrabalho: dias,
    horasPorEquipamentoResumo,
    horasTrabalho: formatMinutosComoHHMM(totais.horasTrabalhoTotal),
    kmsPercorridos: String(totais.kmsTotal),
    horasViagem: formatMinutosComoHHMM(totais.horasViagemTotal),
  }
}

export function diaTrabalhoDataChaveOrdenacao(data: string | undefined): string {
  if (!data) return ''
  const s = String(data).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  if (s.includes('T') && s.length >= 10) return s.slice(0, 10)
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  return s
}

export function sortDiasTrabalhoEspecialCronologicamente(dias: DiaTrabalhoEspecial[]): DiaTrabalhoEspecial[] {
  return [...dias].sort((a, b) => {
    const ka = diaTrabalhoDataChaveOrdenacao(a.data)
    const kb = diaTrabalhoDataChaveOrdenacao(b.data)
    const c = ka.localeCompare(kb)
    if (c !== 0) return c
    return String(a.id).localeCompare(String(b.id))
  })
}

export function formatDiaCurtoPt(dataRaw: string | undefined): string {
  const key = diaTrabalhoDataChaveOrdenacao(dataRaw)
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return (dataRaw && String(dataRaw).trim()) || '-'
  const [y, m, d] = key.split('-').map((x) => parseInt(x, 10))
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export type SessaoHorasEquipamentoEspecial = {
  equipamentoUid: string
  diaId: string
  data: string
  dataFormatada: string
  horasInicio: string
  horasFim: string
  horasDuracao: string
}

export function contarEquipamentosUnicosDia(dia: DiaTrabalhoEspecial): number {
  const uids = new Set<string>()
  for (const h of dia.horasPorEquipamento || []) {
    const uid = (h.equipamentoUid || '').trim()
    if (uid) uids.add(uid)
  }
  return uids.size
}

/** Todas as sessões de horas agrupadas por equipamento (várias linhas no mesmo dia permitidas). */
export function coletarSessoesPorEquipamento(
  dias: DiaTrabalhoEspecial[] | undefined | null
): Record<string, SessaoHorasEquipamentoEspecial[]> {
  const porUid: Record<string, SessaoHorasEquipamentoEspecial[]> = {}
  const diasOrd = sortDiasTrabalhoEspecialCronologicamente(Array.isArray(dias) ? dias : [])

  for (const diaRaw of diasOrd) {
    const dia = atualizarCalculosDiaEspecial(diaRaw)
    const dataFmt = formatDiaCurtoPt(dia.data)
    for (const linha of dia.horasPorEquipamento || []) {
      const uid = (linha.equipamentoUid || '').trim()
      if (!uid) continue
      const bruto = horasEquipamentoDiaBruto(linha)
      const liquido = linha.horasDuracao || bruto
      if (!linha.horasInicio && !linha.horasFim && !liquido) continue
      if (!porUid[uid]) porUid[uid] = []
      porUid[uid].push({
        equipamentoUid: uid,
        diaId: dia.id,
        data: dia.data,
        dataFormatada: dataFmt,
        horasInicio: linha.horasInicio,
        horasFim: linha.horasFim,
        horasDuracao: liquido,
      })
    }
  }

  for (const uid of Object.keys(porUid)) {
    porUid[uid].sort((a, b) => {
      const ka = diaTrabalhoDataChaveOrdenacao(a.data)
      const kb = diaTrabalhoDataChaveOrdenacao(b.data)
      const c = ka.localeCompare(kb)
      if (c !== 0) return c
      return (a.horasInicio || '').localeCompare(b.horasInicio || '')
    })
  }
  return porUid
}
