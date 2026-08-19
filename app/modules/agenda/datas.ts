import type { Agendamento } from './tipos'

/** Normaliza chave YYYY-MM-DD (evita falha em includes por zeros à esquerda). */
export function normalizeDataKeyAgenda(s: string): string {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(String(s ?? '').trim())
  if (!m) return String(s ?? '').trim()
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
}

/**
 * Interpreta data do agendamento no fuso local.
 * `new Date('YYYY-MM-DD')` é meia-noite UTC e desloca o dia (ex.: Brasil → dia anterior), quebrando período e cor dos chips.
 */
export function parseDataAgendaLocal(dataStr: string): Date {
  const norm = normalizeDataKeyAgenda(dataStr)
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(norm)
  if (!m) return new Date(dataStr)
  return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10))
}

export function formatDataYYYYMMDDLocal(d: Date): string {
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

/**
 * Preenche todos os dias entre a primeira e a última data (inclusive).
 * A duração da agenda é contínua: marcar início + fim (ex. 11/08 e 04/09) cobre o intervalo inteiro,
 * inclusive dias do mês seguinte.
 */
export function expandirIntervaloDatasContinuo(datas: string[]): string[] {
  const sorted = [
    ...new Set(datas.map((d) => normalizeDataKeyAgenda(String(d))).filter(Boolean)),
  ].sort()
  if (sorted.length === 0) return []
  if (sorted.length === 1) return sorted
  const inicio = parseDataAgendaLocal(sorted[0])
  const fim = parseDataAgendaLocal(sorted[sorted.length - 1])
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime()) || fim < inicio) return sorted
  const keys: string[] = []
  const cur = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate())
  const end = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate())
  for (let i = 0; i < 400 && cur <= end; i++) {
    keys.push(formatDataYYYYMMDDLocal(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return keys
}

/** Datas YYYY-MM-DD do período do agendamento (diasSelecionados ou data + duração). */
export function getDatasPeriodoAgendamento(ag: Agendamento): string[] {
  if (ag.diasSelecionados && ag.diasSelecionados.length > 0) {
    return expandirIntervaloDatasContinuo(ag.diasSelecionados)
  }
  const dataInicio = parseDataAgendaLocal(ag.data)
  const duracaoDias = Math.min(400, Math.max(1, parseInt(String(ag.duracaoEstimada || '1'), 10) || 1))
  const keys: string[] = []
  for (let i = 0; i < duracaoDias; i++) {
    const dataAtual = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), dataInicio.getDate() + i)
    keys.push(formatDataYYYYMMDDLocal(dataAtual))
  }
  return keys
}

/** Algum dia do período cai no mês (mes0 = 0..11). */
export function agendamentoCaiNoAnoMes(ag: Agendamento, ano: number, mes0: number): boolean {
  return getDatasPeriodoAgendamento(ag).some((d) => {
    const p = d.split('-').map(Number)
    return p[0] === ano && p[1] === mes0 + 1
  })
}

/** Verifica se a data (YYYY-MM-DD local) está dentro do período do agendamento. */
export function agendamentoIncluiData(ag: Agendamento, dataKey: string): boolean {
  const alvo = normalizeDataKeyAgenda(dataKey)
  return getDatasPeriodoAgendamento(ag).some((d) => normalizeDataKeyAgenda(d) === alvo)
}

/** Algum dia do período cai no intervalo [inicio, fim] (inclusive), datas YYYY-MM-DD. */
export function agendamentoPeriodoIntersectaIntervalo(ag: Agendamento, inicio: string, fim: string): boolean {
  const a = normalizeDataKeyAgenda(inicio)
  const b = normalizeDataKeyAgenda(fim)
  return getDatasPeriodoAgendamento(ag).some((d) => {
    const k = normalizeDataKeyAgenda(d)
    return k >= a && k <= b
  })
}

export function rotuloPeriodoAgendamento(ag: Agendamento): string {
  const keys = getDatasPeriodoAgendamento(ag)
  if (keys.length <= 1) return keys[0] || ag.data
  const fmt = (k: string) => parseDataAgendaLocal(k).toLocaleDateString('pt-PT')
  return `${fmt(keys[0])} — ${fmt(keys[keys.length - 1])}`
}
