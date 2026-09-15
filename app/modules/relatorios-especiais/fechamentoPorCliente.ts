/**
 * Fechamento do Relatório Especial por cliente de trabalho (e equipamentos),
 * sem inflar totais: HT já vem por máquina; KM / diárias / viagem repartem-se
 * pelos clientes presentes em cada dia.
 */
import { formatarLabelEquipamentoSelectCurto } from '../equipamentos'
import type { RelatorioEquipamentoRef } from '../relatorio-servico'
import {
  calcularTotaisRelatorioEspecial,
  minutosDeDuracaoHHMM,
  atualizarCalculosDiaEspecial,
  diaContaComoDiariaEspecial,
} from './calculos'
import type { RelatorioEspecial } from './tipos'

export const FECHAMENTO_ESPECIAL_GRUPO_PRINCIPAL = 'p'

export type EquipamentoGrupoFechamentoEspecial = {
  uid: string
  label: string
}

export type GrupoFechamentoEspecial = {
  key: string
  clienteId: string
  clienteNome: string
  equipamentos: EquipamentoGrupoFechamentoEspecial[]
  ht: number
  km: number
  diarias: number
  hida: number
  hret: number
}

function sanitizarChave(raw: string, prefix: string): string {
  const t = String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  return t ? `${prefix}${t}` : ''
}

export function chaveGrupoClienteFechamentoEspecial(eq: {
  equipamentoOrigem?: string
  clienteExternoId?: string
  clienteExternoNome?: string
}): string {
  if (eq.equipamentoOrigem === 'clientes-externos') {
    const byId = sanitizarChave(String(eq.clienteExternoId || ''), 'c_')
    if (byId) return byId
    const byNome = sanitizarChave(String(eq.clienteExternoNome || '').toLowerCase(), 'n_')
    if (byNome) return byNome
  }
  return FECHAMENTO_ESPECIAL_GRUPO_PRINCIPAL
}

export function rotuloEquipamentoGrupoFechamento(eq: RelatorioEquipamentoRef, idx: number): string {
  const label = formatarLabelEquipamentoSelectCurto(eq, idx)
  return String(label || eq.maquinaModelo || eq.numeroMaquina || `#${idx + 1}`).trim()
}

export function rotuloGrupoFechamentoEspecial(grupo: Pick<GrupoFechamentoEspecial, 'clienteNome' | 'equipamentos'>): string {
  const nome = String(grupo.clienteNome || '').trim() || '—'
  const eqs = (grupo.equipamentos || []).map((e) => e.label).filter(Boolean)
  const eqTxt = eqs.length ? eqs.join(' · ') : ''
  return eqTxt ? `${nome} — ${eqTxt}` : nome
}

function roundN(n: number, decimals: number): number {
  const f = 10 ** decimals
  return Math.round((Number(n) || 0) * f) / f
}

/** Parte um total em N quotas cuja soma é o total (resto na primeira). */
export function repartirTotalEquitativo(total: number, partes: number, decimals: number): number[] {
  const n = Math.max(0, Math.floor(partes) || 0)
  if (n <= 0) return []
  const t = Number(total) || 0
  if (n === 1) return [roundN(t, decimals)]
  const factor = 10 ** decimals
  const totalI = Math.round(t * factor)
  const base = Math.floor(totalI / n)
  const rem = totalI - base * n
  return Array.from({ length: n }, (_, i) => (base + (i < rem ? 1 : 0)) / factor)
}

function nomeClientePrincipal(r: RelatorioEspecial): string {
  return String(r.cliente || '').trim() || '—'
}

export function listarGruposClienteFechamentoEspecial(r: RelatorioEspecial): GrupoFechamentoEspecial[] {
  const principalId = String(r.clienteId || '').trim()
  const principalNome = nomeClientePrincipal(r)
  const map = new Map<string, GrupoFechamentoEspecial>()
  const ensure = (key: string, clienteId: string, clienteNome: string) => {
    let g = map.get(key)
    if (!g) {
      g = {
        key,
        clienteId,
        clienteNome,
        equipamentos: [],
        ht: 0,
        km: 0,
        diarias: 0,
        hida: 0,
        hret: 0,
      }
      map.set(key, g)
    }
    return g
  }

  ensure(FECHAMENTO_ESPECIAL_GRUPO_PRINCIPAL, principalId, principalNome)

  const eqs = Array.isArray(r.equipamentos) ? r.equipamentos : []
  eqs.forEach((eq, idx) => {
    const key = chaveGrupoClienteFechamentoEspecial(eq)
    const isExt = eq.equipamentoOrigem === 'clientes-externos'
    const g = ensure(
      key,
      isExt ? String(eq.clienteExternoId || '').trim() : principalId,
      isExt ? String(eq.clienteExternoNome || '').trim() || '—' : principalNome
    )
    const uid = String(eq.uid || '').trim()
    if (uid && !g.equipamentos.some((e) => e.uid === uid)) {
      g.equipamentos.push({ uid, label: rotuloEquipamentoGrupoFechamento(eq, idx) })
    }
  })

  const all = [...map.values()]
  const withEq = all.filter((g) => g.equipamentos.length > 0)
  if (withEq.length > 0) return withEq
  return all.filter((g) => g.key === FECHAMENTO_ESPECIAL_GRUPO_PRINCIPAL)
}

export function deveSepararFechamentoEspecialPorCliente(r: RelatorioEspecial | null | undefined): boolean {
  if (!r) return false
  return listarGruposClienteFechamentoEspecial(r).length >= 2
}

function uidParaGrupo(r: RelatorioEspecial): Map<string, string> {
  const m = new Map<string, string>()
  for (const eq of r.equipamentos || []) {
    const uid = String(eq.uid || '').trim()
    if (!uid) continue
    m.set(uid, chaveGrupoClienteFechamentoEspecial(eq))
  }
  return m
}

export function calcularTotaisFechamentoEspecialPorCliente(
  r: RelatorioEspecial
): GrupoFechamentoEspecial[] {
  const grupos = listarGruposClienteFechamentoEspecial(r)
  const byKey = new Map(grupos.map((g) => [g.key, g]))
  const uidMap = uidParaGrupo(r)
  const totais = calcularTotaisRelatorioEspecial(r.diasTrabalho)

  for (const [uid, min] of Object.entries(totais.horasPorEquipamento || {})) {
    const key = uidMap.get(uid) || FECHAMENTO_ESPECIAL_GRUPO_PRINCIPAL
    const g = byKey.get(key)
    if (g) g.ht += min
  }

  const lista = Array.isArray(r.diasTrabalho) ? r.diasTrabalho : []
  for (const diaRaw of lista) {
    const dia = atualizarCalculosDiaEspecial(diaRaw)
    const presentes = new Set<string>()
    for (const linha of dia.horasPorEquipamento || []) {
      const uid = String(linha.equipamentoUid || '').trim()
      if (!uid) continue
      const bruto = minutosDeDuracaoHHMM(
        linha.horasInicio && linha.horasFim
          ? linha.horasDuracao || ''
          : linha.horasDuracao || ''
      )
      if (bruto <= 0 && !(linha.horasInicio && linha.horasFim)) continue
      const iniFim =
        linha.horasInicio && linha.horasFim
          ? minutosDeDuracaoHHMM(
              // duração já actualizada em atualizarCalculosDiaEspecial
              linha.horasDuracao || ''
            )
          : bruto
      if (iniFim <= 0) continue
      presentes.add(uidMap.get(uid) || FECHAMENTO_ESPECIAL_GRUPO_PRINCIPAL)
    }
    if (presentes.size === 0) {
      for (const g of grupos) presentes.add(g.key)
    }
    const keys = [...presentes].filter((k) => byKey.has(k))
    if (keys.length === 0) continue

    const kmDia = parseFloat(String(dia.kmTotal || '0')) || 0
    const ida = minutosDeDuracaoHHMM(dia.idaDuracao || '')
    const ret = minutosDeDuracaoHHMM(dia.retornoDuracao || '')
    const diaria = diaContaComoDiariaEspecial(dia) ? 1 : 0
    const kmPartes = repartirTotalEquitativo(kmDia, keys.length, 2)
    const idaPartes = repartirTotalEquitativo(ida, keys.length, 0)
    const retPartes = repartirTotalEquitativo(ret, keys.length, 0)
    const diaPartes = repartirTotalEquitativo(diaria, keys.length, 2)
    keys.forEach((k, i) => {
      const g = byKey.get(k)
      if (!g) return
      g.km += kmPartes[i] || 0
      g.hida += idaPartes[i] || 0
      g.hret += retPartes[i] || 0
      g.diarias += diaPartes[i] || 0
    })
  }

  return grupos.map((g) => ({
    ...g,
    ht: Math.round(g.ht) / 60,
    km: roundN(g.km, 2),
    diarias: roundN(g.diarias, 2),
    hida: Math.round(g.hida) / 60,
    hret: Math.round(g.hret) / 60,
  }))
}
