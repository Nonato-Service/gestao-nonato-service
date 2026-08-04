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
  const parts = duracao.trim().split(':').map((p) => parseInt(p, 10) || 0)
  if (parts.length >= 2) return parts[0] * 60 + parts[1]
  return 0
}

function minutosDeTextoLivrePausa(raw: string): number {
  const s = String(raw ?? '').trim().toLowerCase()
  if (!s) return 0
  if (/^\d+$/.test(s)) {
    const n = parseInt(s, 10)
    return n > 0 && n <= 480 ? n : 0
  }
  const hm = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (hm) return (parseInt(hm[1], 10) || 0) * 60 + (parseInt(hm[2], 10) || 0)
  const horaDecimal = s.match(/^(\d+(?:[.,]\d+)?)\s*h(?:oras?)?$/)
  if (horaDecimal) {
    const h = parseFloat(horaDecimal[1].replace(',', '.'))
    return Number.isFinite(h) && h > 0 ? Math.round(h * 60) : 0
  }
  if (/^(\d+(?:[.,]\d+)?)\s*hora(?:s)?$/.test(s)) {
    const m = s.match(/^(\d+(?:[.,]\d+)?)\s*hora(?:s)?$/)
    if (m) {
      const h = parseFloat(m[1].replace(',', '.'))
      return Number.isFinite(h) && h > 0 ? Math.round(h * 60) : 0
    }
  }
  if (s === '1 hora' || s === 'uma hora') return 60
  return 0
}

/** Minutos de pausa/almoço — aceita tempoPausa HH:MM(:SS), texto livre, pausa legado ou «sim» (= 1h). */
export function minutosPausaOuAlmocoDia(dia: {
  tempoPausa?: string
  pausa?: string
}): number {
  const tempoPausa = String(dia.tempoPausa ?? '').trim()
  if (tempoPausa) {
    if (/^\d{1,2}:\d{2}/.test(tempoPausa)) return minutosDeDuracaoHHMM(tempoPausa)
    const livre = minutosDeTextoLivrePausa(tempoPausa)
    if (livre > 0) return livre
  }
  const pausa = String(dia.pausa ?? '').trim()
  if (/^\d{1,2}:\d{2}/.test(pausa)) return minutosDeDuracaoHHMM(pausa)
  const pausaLivre = minutosDeTextoLivrePausa(pausa)
  if (pausaLivre > 0) return pausaLivre
  if (pausa === 'sim' || pausa === 'true' || pausa === '1') return 60
  return 0
}

export function minutosAlmocoDia(dia: DiaTrabalhoEspecial): number {
  return minutosPausaOuAlmocoDia(dia)
}

/** Minutos de trabalho no dia (equipamentos) já descontando almoço/pausa desse dia. */
export function minutosTrabalhoLiquidoDia(dia: DiaTrabalhoEspecial): number {
  const calc = atualizarCalculosDiaEspecial(dia)
  let bruto = 0
  for (const linha of calc.horasPorEquipamento || []) {
    bruto += minutosDeDuracaoHHMM(horasEquipamentoDiaBruto(linha))
  }
  return Math.max(0, bruto - minutosAlmocoDia(calc))
}

export function formatMinutosComoHHMM(minutos: number): string {
  const m = Math.max(0, minutos)
  const h = Math.floor(m / 60)
  const rest = m % 60
  return `${h}:${String(rest).padStart(2, '0')}`
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

export function atualizarCalculosDiaEspecial(dia: DiaTrabalhoEspecial): DiaTrabalhoEspecial {
  const idaDuracao =
    dia.idaHora && dia.idaChegada ? calcularDuracaoHoras(dia.idaHora, dia.idaChegada) : dia.idaDuracao
  const retornoDuracao =
    dia.retornoSaida && dia.retornoChegada
      ? calcularDuracaoHoras(dia.retornoSaida, dia.retornoChegada)
      : dia.retornoDuracao
  const kmIda = parseFloat(dia.kmIda) || 0
  const kmRetorno = parseFloat(dia.kmRetorno) || 0
  /** Horas por linha = hora corrida (bruto). Almoço desconta só no total geral. */
  const horasPorEquipamento = (dia.horasPorEquipamento || []).map(atualizarHorasEquipamentoDia)
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
  horasTrabalhoBruto: number
  horasAlmocoTotal: number
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
  let horasTrabalhoBruto = 0
  let horasAlmocoTotal = 0
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
    horasAlmocoTotal += minutosAlmocoDia(dia)

    const brutoDiaPorUid: Array<{ uid: string; min: number }> = []
    let brutoDia = 0
    for (const linha of dia.horasPorEquipamento || []) {
      const uid = (linha.equipamentoUid || '').trim()
      if (!uid) continue
      const min = minutosDeDuracaoHHMM(horasEquipamentoDiaBruto(linha))
      if (min <= 0) continue
      brutoDiaPorUid.push({ uid, min })
      brutoDia += min
    }
    const almocoDia = minutosAlmocoDia(dia)
    const netDia = Math.max(0, brutoDia - almocoDia)
    if (brutoDia > 0 && brutoDiaPorUid.length > 0) {
      let repartido = 0
      brutoDiaPorUid.forEach((row, idx) => {
        let netMin =
          idx === brutoDiaPorUid.length - 1
            ? netDia - repartido
            : Math.round((row.min / brutoDia) * netDia)
        netMin = Math.max(0, netMin)
        repartido += netMin
        horasPorEquipamento[row.uid] = (horasPorEquipamento[row.uid] || 0) + netMin
        horasTrabalhoBruto += row.min
      })
    }
  }

  const horasTrabalhoTotal = Math.max(0, horasTrabalhoBruto - horasAlmocoTotal)

  return {
    horasPorEquipamento,
    horasTrabalhoTotal,
    horasTrabalhoBruto,
    horasAlmocoTotal,
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
  const m2 = s.match(/^(\d{2})\/(\d{2})\/(\d{2})$/)
  if (m2) {
    const yy = parseInt(m2[3], 10)
    const yyyy = Number.isFinite(yy) ? 2000 + yy : 2000
    return `${yyyy}-${m2[2]}-${m2[1]}`
  }
  const d = new Date(s)
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return s
}

export type DiaSemanaLabels = Record<string, string | undefined>

export function getDiaSemanaInfo(
  dataRaw: string | undefined,
  labels?: DiaSemanaLabels
): { abrev: string; isFimDeSemana: boolean } {
  const key = diaTrabalhoDataChaveOrdenacao(dataRaw)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return { abrev: '', isFimDeSemana: false }
  const [y, m, d] = key.split('-').map((x) => parseInt(x, 10))
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return { abrev: '', isFimDeSemana: false }
  }
  const dow = new Date(y, m - 1, d).getDay()
  const nomes = [
    labels?.domingo || 'Dom',
    labels?.segunda || 'Seg',
    labels?.terca || 'Ter',
    labels?.quarta || 'Qua',
    labels?.quinta || 'Qui',
    labels?.sexta || 'Sex',
    labels?.sabado || 'Sáb',
  ]
  return { abrev: nomes[dow] || '', isFimDeSemana: dow === 0 || dow === 6 }
}

export function formatDiaComDiaSemana(dataRaw: string | undefined, labels?: DiaSemanaLabels): string {
  const fmt = formatDiaCurtoPt(dataRaw)
  const { abrev } = getDiaSemanaInfo(dataRaw, labels)
  return abrev ? `${fmt} (${abrev})` : fmt
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
    const linhasDia = (dia.horasPorEquipamento || []).filter((linha) => {
      const uid = (linha.equipamentoUid || '').trim()
      if (!uid) return false
      const bruto = horasEquipamentoDiaBruto(linha)
      return Boolean(linha.horasInicio || linha.horasFim || bruto)
    })
    const brutoDia = linhasDia.reduce(
      (s, linha) => s + minutosDeDuracaoHHMM(horasEquipamentoDiaBruto(linha)),
      0
    )
    const almocoDia = minutosAlmocoDia(dia)
    const netDia = Math.max(0, brutoDia - almocoDia)
    let repartido = 0

    linhasDia.forEach((linha, idx) => {
      const uid = (linha.equipamentoUid || '').trim()
      const brutoMin = minutosDeDuracaoHHMM(horasEquipamentoDiaBruto(linha))
      let netMin = brutoMin
      if (brutoDia > 0 && almocoDia > 0) {
        netMin =
          idx === linhasDia.length - 1
            ? netDia - repartido
            : Math.round((brutoMin / brutoDia) * netDia)
        netMin = Math.max(0, netMin)
        repartido += netMin
      }
      if (!porUid[uid]) porUid[uid] = []
      porUid[uid].push({
        equipamentoUid: uid,
        diaId: dia.id,
        data: dia.data,
        dataFormatada: dataFmt,
        horasInicio: linha.horasInicio,
        horasFim: linha.horasFim,
        horasDuracao: formatMinutosComoHHMM(netMin),
      })
    })
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
