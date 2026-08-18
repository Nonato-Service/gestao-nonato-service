import type {
  DiaTrabalhoEspecial,
  HorasEquipamentoDia,
  RelatorioEspecial,
} from './tipos'

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

/** Minutos de viagem (ida + retorno) no dia. */
export function minutosViagemDia(dia: DiaTrabalhoEspecial): number {
  const calc = atualizarCalculosDiaEspecial(dia)
  return (
    minutosDeDuracaoHHMM(calc.idaDuracao || '') + minutosDeDuracaoHHMM(calc.retornoDuracao || '')
  )
}

/** Minutos de trabalho bruto no dia (soma equipamentos, sem descontar almoço). */
export function minutosTrabalhoBrutoDia(dia: DiaTrabalhoEspecial): number {
  const calc = atualizarCalculosDiaEspecial(dia)
  let bruto = 0
  for (const linha of calc.horasPorEquipamento || []) {
    bruto += minutosDeDuracaoHHMM(horasEquipamentoDiaBruto(linha))
  }
  return bruto
}

/**
 * Almoço/pausa só conta em dias com horas em máquina.
 * Dia só de viagem não desconta almoço do total de trabalho.
 */
export function minutosAlmocoDia(dia: DiaTrabalhoEspecial): number {
  if (minutosTrabalhoBrutoDia(dia) <= 0) return 0
  return minutosPausaOuAlmocoDia(dia)
}

/** Minutos de trabalho no dia (equipamentos) já descontando almoço/pausa desse dia. */
export function minutosTrabalhoLiquidoDia(dia: DiaTrabalhoEspecial): number {
  return Math.max(0, minutosTrabalhoBrutoDia(dia) - minutosAlmocoDia(dia))
}

/**
 * Distribui o almoço do dia proporcionalmente ao tempo bruto de cada linha de máquina.
 * A soma dos líquidos = bruto do dia − almoço (sem deriva de arredondamento).
 * Dia só com viagem (sem linhas de máquina) → lista vazia / zeros.
 */
export function minutosLiquidosPorLinhaEquipamentoDia(
  linhas: HorasEquipamentoDia[] | undefined | null,
  almocoMinutos: number
): number[] {
  const lista = Array.isArray(linhas) ? linhas : []
  const brutos = lista.map((l) => minutosDeDuracaoHHMM(horasEquipamentoDiaBruto(l)))
  const brutoTotal = brutos.reduce((acc, m) => acc + m, 0)
  if (brutoTotal <= 0) return brutos.map(() => 0)
  const almoco = Math.min(Math.max(0, Math.round(almocoMinutos) || 0), brutoTotal)
  if (almoco <= 0) return brutos.slice()

  const indicesComHoras: number[] = []
  for (let i = 0; i < brutos.length; i++) {
    if (brutos[i] > 0) indicesComHoras.push(i)
  }
  const descontos = new Array(brutos.length).fill(0)
  let alocado = 0
  for (let k = 0; k < indicesComHoras.length; k++) {
    const i = indicesComHoras[k]
    if (k === indicesComHoras.length - 1) {
      descontos[i] = Math.max(0, almoco - alocado)
    } else {
      const d = Math.floor((brutos[i] * almoco) / brutoTotal)
      descontos[i] = d
      alocado += d
    }
  }
  return brutos.map((b, i) => Math.max(0, b - descontos[i]))
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
  /** Horas por linha = hora corrida (bruto no formulário). Almoço desconta no resumo/totais por máquina (proporcional). */
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
  /** Minutos cobráveis por equipamento (almoço já descontado de forma proporcional por dia). */
  horasPorEquipamento: Record<string, number>
  horasTrabalhoTotal: number
  horasTrabalhoBruto: number
  horasAlmocoTotal: number
  kmsTotal: number
  horasViagemTotal: number
  horasViagemIda: number
  horasViagemRetorno: number
  /** Quantidade de diárias = dias de missão registados (com data), mesmo sem HT. */
  diarias: number
  /** Datas ISO (YYYY-MM-DD) que contam como diária, ordenadas. */
  datasDiarias: string[]
}

/**
 * Dia conta como diária se tiver data de missão/fora.
 * Não exige horas em máquina, viagem nem KM — sáb./dom. e dias só com viagem também contam.
 * Devolve a chave estável (ISO YYYY-MM-DD quando possível) para deduplicar.
 */
export function diaContaComoDiariaEspecial(dia: DiaTrabalhoEspecial | undefined | null): string {
  if (!dia) return ''
  const chave = diaTrabalhoDataChaveOrdenacao(dia.data)
  if (/^\d{4}-\d{2}-\d{2}$/.test(chave)) return chave
  /** Legado / formatos estranhos: ainda conta se houver texto de data não vazio. */
  const raw = String(dia.data ?? '').trim()
  return raw ? raw.slice(0, 40) : ''
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
    const chaveDiaria = diaContaComoDiariaEspecial(dia)
    if (chaveDiaria) datasUnicas.add(chaveDiaria)

    kmsTotal += parseFloat(dia.kmTotal) || 0
    horasViagemIda += minutosDeDuracaoHHMM(dia.idaDuracao)
    horasViagemRetorno += minutosDeDuracaoHHMM(dia.retornoDuracao)
    const almocoDia = minutosAlmocoDia(dia)
    horasAlmocoTotal += almocoDia

    const linhas = dia.horasPorEquipamento || []
    const liquidos = minutosLiquidosPorLinhaEquipamentoDia(linhas, almocoDia)
    for (let i = 0; i < linhas.length; i++) {
      const uid = (linhas[i].equipamentoUid || '').trim()
      if (!uid) continue
      const bruto = minutosDeDuracaoHHMM(horasEquipamentoDiaBruto(linhas[i]))
      if (bruto <= 0) continue
      horasTrabalhoBruto += bruto
      const liq = liquidos[i] ?? Math.max(0, bruto)
      horasPorEquipamento[uid] = (horasPorEquipamento[uid] || 0) + liq
    }
  }

  const horasTrabalhoTotal = Math.max(0, horasTrabalhoBruto - horasAlmocoTotal)
  const datasDiarias = Array.from(datasUnicas).sort()

  return {
    horasPorEquipamento,
    horasTrabalhoTotal,
    horasTrabalhoBruto,
    horasAlmocoTotal,
    kmsTotal,
    horasViagemTotal: horasViagemIda + horasViagemRetorno,
    horasViagemIda,
    horasViagemRetorno,
    diarias: datasDiarias.length,
    datasDiarias,
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

export type ResumoHorasTrabalhoDia = {
  inicio: string
  fim: string
  duracaoBruta: string
  duracaoLiquida: string
  almocoMinutos: number
  almocoFmt: string
  temHoras: boolean
  /** Ida + retorno (minutos). */
  viagemMinutos: number
  viagemFmt: string
  /** Sem horas em máquina, mas com deslocamento registado. */
  soViagem: boolean
}

/** Primeiro início e último fim das linhas de equipamento no dia. */
export function intervaloHorasTrabalhoDia(dia: DiaTrabalhoEspecial): { inicio: string; fim: string } {
  const calc = atualizarCalculosDiaEspecial(dia)
  const linhas = (calc.horasPorEquipamento || []).filter(
    (h) => h.equipamentoUid && (h.horasInicio || h.horasFim || h.horasDuracao)
  )
  if (linhas.length === 0) return { inicio: '—', fim: '—' }
  const inicios = linhas.map((l) => l.horasInicio).filter(Boolean).sort() as string[]
  const fins = linhas.map((l) => l.horasFim).filter(Boolean).sort() as string[]
  return {
    inicio: inicios[0] || '—',
    fim: fins.length > 0 ? fins[fins.length - 1] : '—',
  }
}

/** Resumo claro do dia para tabela/PDF: intervalo, bruto, líquido, almoço e viagem. */
export function resumoHorasTrabalhoDia(dia: DiaTrabalhoEspecial): ResumoHorasTrabalhoDia {
  const calc = atualizarCalculosDiaEspecial(dia)
  const { inicio, fim } = intervaloHorasTrabalhoDia(calc)
  const bruto = minutosTrabalhoBrutoDia(calc)
  const almoco = minutosAlmocoDia(calc)
  const liquido = Math.max(0, bruto - almoco)
  const viagemMinutos = minutosViagemDia(calc)
  const temHoras = bruto > 0
  return {
    inicio,
    fim,
    duracaoBruta: formatMinutosComoHHMM(bruto),
    duracaoLiquida: formatMinutosComoHHMM(liquido),
    almocoMinutos: almoco,
    almocoFmt: almoco > 0 ? formatMinutosComoHHMM(almoco) : '',
    temHoras,
    viagemMinutos,
    viagemFmt: viagemMinutos > 0 ? formatMinutosComoHHMM(viagemMinutos) : '',
    soViagem: !temHoras && viagemMinutos > 0,
  }
}

export function contarEquipamentosUnicosDia(dia: DiaTrabalhoEspecial): number {
  const uids = new Set<string>()
  for (const h of dia.horasPorEquipamento || []) {
    const uid = (h.equipamentoUid || '').trim()
    if (uid) uids.add(uid)
  }
  return uids.size
}

/**
 * Intervalo de deslocação do dia (ida e/ou retorno) para o Resumo.
 * Preferência: só ida → saída–chegada ida; só retorno → saída–chegada retorno;
 * ambos → início da ida até fim do retorno.
 */
export function intervaloViagemDia(dia: DiaTrabalhoEspecial): { inicio: string; fim: string } {
  const calc = atualizarCalculosDiaEspecial(dia)
  const idaIni = (calc.idaHora || '').trim()
  const idaFim = (calc.idaChegada || '').trim()
  const retIni = (calc.retornoSaida || '').trim()
  const retFim = (calc.retornoChegada || '').trim()
  const temIda = Boolean(idaIni || idaFim)
  const temRet = Boolean(retIni || retFim)
  if (temIda && !temRet) return { inicio: idaIni || '—', fim: idaFim || '—' }
  if (!temIda && temRet) return { inicio: retIni || '—', fim: retFim || '—' }
  if (temIda && temRet) {
    return {
      inicio: idaIni || retIni || '—',
      fim: retFim || idaFim || '—',
    }
  }
  return { inicio: '—', fim: '—' }
}

export type EquipamentoRefMinEspecial = {
  uid: string
  equipamentoId?: string
  maquinaModelo?: string
  numeroMaquina?: string
}

export type DiaSemMaquinaResumoEspecial = {
  diaId: string
  data: string
  dataFormatada: string
  /** Ex.: "04:00 – 15:00" */
  horarioFmt: string
  /** Duração total viagem (ida+retorno), ou '' se não houver. */
  duracaoFmt: string
  descricao: string
  /** Sem horas em máquina e com deslocamento. */
  soViagem: boolean
  /** Dia registado (diária) sem máquina e sem viagem (ex. domingo). */
  soRegisto: boolean
  /** Série / modelo / marca dos equipamentos ligados ao dia (ou do relatório). */
  equipamentoFmt: string
  /** Cliente do relatório especial. */
  clienteFmt: string
  /**
   * Texto pronto para Resumo/PDF, ex.:
   * «Viagem / deslocação — Equipamento: HOLZMA · Cliente: ACME»
   */
  contextoFmt: string
}

export type ColetarDiasSemMaquinaOpts = {
  equipamentos?: EquipamentoRefMinEspecial[] | null
  cliente?: string | null
  /** Rótulos curtos (já traduzidos) para montar contextoFmt. */
  labelEquipamento?: string
  labelCliente?: string
  labelSecaoViagem?: string
}

function labelEquipamentoRefMin(eq: EquipamentoRefMinEspecial, idx: number): string {
  const serie = String(eq.numeroMaquina || '').trim()
  const modelo = String(eq.maquinaModelo || '').trim()
  const id = String(eq.equipamentoId || '').trim()
  const parts: string[] = []
  if (serie) parts.push(serie)
  if (modelo) parts.push(modelo)
  if (id && id !== serie && !parts.includes(id)) parts.push(id)
  return parts.length > 0 ? parts.join(' · ') : `#${idx + 1}`
}

/** Equipamentos do dia (uids nas linhas); se nenhum, todos os do relatório. */
export function equipamentosContextoDiaEspecial(
  dia: DiaTrabalhoEspecial,
  equipamentosRelatorio: EquipamentoRefMinEspecial[] | undefined | null
): EquipamentoRefMinEspecial[] {
  const lista = Array.isArray(equipamentosRelatorio) ? equipamentosRelatorio : []
  const porUid = new Map(lista.map((e) => [String(e.uid || '').trim(), e]))
  const uidsDia: string[] = []
  const seen = new Set<string>()
  for (const h of dia.horasPorEquipamento || []) {
    const uid = String(h.equipamentoUid || '').trim()
    if (!uid || seen.has(uid)) continue
    seen.add(uid)
    uidsDia.push(uid)
  }
  if (uidsDia.length > 0) {
    const doDia: EquipamentoRefMinEspecial[] = []
    for (const uid of uidsDia) {
      const eq = porUid.get(uid)
      if (eq) doDia.push(eq)
      else doDia.push({ uid, equipamentoId: uid })
    }
    return doDia
  }
  return lista.filter(
    (e) =>
      String(e.equipamentoId || '').trim() ||
      String(e.maquinaModelo || '').trim() ||
      String(e.numeroMaquina || '').trim()
  )
}

function montarContextoViagemFmt(
  equipamentoFmt: string,
  clienteFmt: string,
  opts?: ColetarDiasSemMaquinaOpts
): string {
  const labEq = (opts?.labelEquipamento || 'Equipamento').trim()
  const labCli = (opts?.labelCliente || 'Cliente').trim()
  const labSec = (opts?.labelSecaoViagem || 'Viagem / deslocação').trim()
  const partes: string[] = []
  if (equipamentoFmt) partes.push(`${labEq}: ${equipamentoFmt}`)
  if (clienteFmt) partes.push(`${labCli}: ${clienteFmt}`)
  if (partes.length === 0) return labSec
  return `${labSec} — ${partes.join(' · ')}`
}

/**
 * Dias que não aparecem nas tabelas por máquina do Resumo:
 * só viagem e (opcionalmente) dias registados sem horas em máquina.
 * Inclui equipamento(s) e cliente para quem só lê o Resumo.
 */
export function coletarDiasSemMaquinaResumo(
  dias: DiaTrabalhoEspecial[] | undefined | null,
  opts?: ColetarDiasSemMaquinaOpts
): DiaSemMaquinaResumoEspecial[] {
  const diasOrd = sortDiasTrabalhoEspecialCronologicamente(Array.isArray(dias) ? dias : [])
  const out: DiaSemMaquinaResumoEspecial[] = []
  const clienteFmt = String(opts?.cliente || '').trim()

  for (const diaRaw of diasOrd) {
    const dia = atualizarCalculosDiaEspecial(diaRaw)
    const resumo = resumoHorasTrabalhoDia(dia)
    if (resumo.temHoras) continue

    const contaDiaria = Boolean(diaContaComoDiariaEspecial(dia))
    if (!resumo.soViagem && !contaDiaria) continue

    const { inicio, fim } = intervaloViagemDia(dia)
    let horarioFmt = '—'
    if (resumo.soViagem || inicio !== '—' || fim !== '—') {
      if (inicio !== '—' && fim !== '—') horarioFmt = `${inicio} – ${fim}`
      else if (inicio !== '—') horarioFmt = inicio
      else if (fim !== '—') horarioFmt = fim
    }

    const eqs = equipamentosContextoDiaEspecial(dia, opts?.equipamentos)
    const equipamentoFmt = eqs.map((eq, i) => labelEquipamentoRefMin(eq, i)).join('; ')

    out.push({
      diaId: dia.id,
      data: dia.data,
      dataFormatada: formatDiaCurtoPt(dia.data),
      horarioFmt,
      duracaoFmt: resumo.viagemFmt,
      descricao: (dia.descricaoTrabalho || '').trim(),
      soViagem: resumo.soViagem,
      soRegisto: !resumo.soViagem && contaDiaria,
      equipamentoFmt,
      clienteFmt,
      contextoFmt: montarContextoViagemFmt(equipamentoFmt, clienteFmt, opts),
    })
  }

  return out
}

/** Todas as sessões de horas agrupadas por equipamento (duração = líquida/cobrável). */
export function coletarSessoesPorEquipamento(
  dias: DiaTrabalhoEspecial[] | undefined | null
): Record<string, SessaoHorasEquipamentoEspecial[]> {
  const porUid: Record<string, SessaoHorasEquipamentoEspecial[]> = {}
  const diasOrd = sortDiasTrabalhoEspecialCronologicamente(Array.isArray(dias) ? dias : [])

  for (const diaRaw of diasOrd) {
    const dia = atualizarCalculosDiaEspecial(diaRaw)
    const dataFmt = formatDiaCurtoPt(dia.data)
    const linhas = dia.horasPorEquipamento || []
    const liquidos = minutosLiquidosPorLinhaEquipamentoDia(linhas, minutosAlmocoDia(dia))
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i]
      const uid = (linha.equipamentoUid || '').trim()
      if (!uid) continue
      const brutoMin = minutosDeDuracaoHHMM(horasEquipamentoDiaBruto(linha))
      if (!linha.horasInicio && !linha.horasFim && brutoMin <= 0) continue
      if (!porUid[uid]) porUid[uid] = []
      porUid[uid].push({
        equipamentoUid: uid,
        diaId: dia.id,
        data: dia.data,
        dataFormatada: dataFmt,
        horasInicio: linha.horasInicio,
        horasFim: linha.horasFim,
        horasDuracao: formatMinutosComoHHMM(liquidos[i] ?? Math.max(0, brutoMin)),
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
