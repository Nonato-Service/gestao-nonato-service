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

/** Datas YYYY-MM-DD do período do agendamento (diasSelecionados ou data + duração). */
export function getDatasPeriodoAgendamento(ag: Agendamento): string[] {
  if (ag.diasSelecionados && ag.diasSelecionados.length > 0) {
    return [...new Set(ag.diasSelecionados.map((d) => normalizeDataKeyAgenda(String(d))))].sort()
  }
  const dataInicio = parseDataAgendaLocal(ag.data)
  const duracaoDias = parseInt(String(ag.duracaoEstimada || '1'), 10) || 1
  const keys: string[] = []
  for (let i = 0; i < duracaoDias; i++) {
    const dataAtual = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), dataInicio.getDate() + i)
    keys.push(formatDataYYYYMMDDLocal(dataAtual))
  }
  return keys
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
