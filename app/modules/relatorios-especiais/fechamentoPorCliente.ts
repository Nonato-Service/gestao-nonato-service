/**
 * Fechamento do Relatório Especial por cliente de trabalho (e equipamentos),
 * sem inflar totais: HT já vem por máquina; KM / diárias / viagem repartem-se
 * pelos clientes presentes em cada dia.
 */
import { formatarLabelEquipamentoSelectCurto, preservarVinculoClienteLinhaEquipamentoRelatorio } from '../equipamentos'
import type { ClienteCadastroEquipamentosLookup, EquipamentoArmazemIdLookup } from '../equipamentos'
import type { RelatorioEquipamentoRef } from '../relatorio-servico'
import {
  minutosDeDuracaoHHMM,
  atualizarCalculosDiaEspecial,
  diaContaComoDiariaEspecial,
  distribuirAlmocoPorLinhaEquipamentoDia,
  minutosAlmocoDia,
  horasEquipamentoDiaBruto,
} from './calculos'
import type { RelatorioEspecial } from './tipos'

export const FECHAMENTO_ESPECIAL_GRUPO_PRINCIPAL = 'p'
/** Oficina / armazém (Ferwood), distinto do cliente de instalação (ex.: Burie). */
export const FECHAMENTO_ESPECIAL_GRUPO_ARMAZEM = 'a'

export type ContextoVinculoClienteRelatorioEspecial = {
  clientes?: ClienteCadastroEquipamentosLookup[]
  equipamentosArmazem?: EquipamentoArmazemIdLookup[]
}

export function aplicarVinculoClientesRelatorioEspecial(
  r: RelatorioEspecial,
  ctx?: ContextoVinculoClienteRelatorioEspecial | null
): RelatorioEspecial {
  const clientes = ctx?.clientes
  if (!r || !Array.isArray(r.equipamentos) || !clientes?.length) return r
  return {
    ...r,
    equipamentos: r.equipamentos.map((eq) =>
      preservarVinculoClienteLinhaEquipamentoRelatorio(eq, {
        clientePrincipalId: r.clienteId,
        clientes,
        equipamentosArmazem: ctx?.equipamentosArmazem,
      })
    ),
  }
}

export type EquipamentoGrupoFechamentoEspecial = {
  uid: string
  label: string
}

export type GrupoFechamentoEspecial = {
  key: string
  clienteId: string
  clienteNome: string
  /** Bloco da oficina (Ferwood), não misturar com o cliente de instalação. */
  oficina?: boolean
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

export function chaveGrupoPorClienteIdNome(clienteId: string, clienteNome: string): string {
  const byId = sanitizarChave(clienteId, 'c_')
  if (byId) return byId
  const byNome = sanitizarChave(String(clienteNome || '').toLowerCase(), 'n_')
  return byNome || FECHAMENTO_ESPECIAL_GRUPO_PRINCIPAL
}

export function chaveGrupoClienteFechamentoEspecial(eq: {
  equipamentoOrigem?: string
  clienteExternoId?: string
  clienteExternoNome?: string
}): string {
  const cid = String(eq.clienteExternoId || '').trim()
  const nome = String(eq.clienteExternoNome || '').trim()
  const eExterno =
    eq.equipamentoOrigem === 'clientes-externos' ||
    (!!cid && eq.equipamentoOrigem !== 'armazem') ||
    (!!nome && eq.equipamentoOrigem === 'clientes-externos')
  if (eExterno) return chaveGrupoPorClienteIdNome(cid, nome)
  if (eq.equipamentoOrigem === 'armazem') return FECHAMENTO_ESPECIAL_GRUPO_ARMAZEM
  return FECHAMENTO_ESPECIAL_GRUPO_PRINCIPAL
}

/** Local explícito do dia: oficina (Ferwood) ou casa do cliente. Null = herdar do equipamento. */
export function chaveLocalDiaTrabalhoEspecial(
  dia: {
    localTrabalho?: string
    clienteTrabalhoId?: string
    clienteTrabalhoNome?: string
  },
  principalId?: string
): string | null {
  const loc = String(dia.localTrabalho || '').trim()
  if (loc === 'armazem') return FECHAMENTO_ESPECIAL_GRUPO_ARMAZEM
  if (loc === 'cliente') {
    const cid = String(dia.clienteTrabalhoId || '').trim()
    if (cid && principalId && cid === String(principalId).trim()) {
      return FECHAMENTO_ESPECIAL_GRUPO_PRINCIPAL
    }
    const k = chaveGrupoPorClienteIdNome(cid, dia.clienteTrabalhoNome || '')
    return k === FECHAMENTO_ESPECIAL_GRUPO_PRINCIPAL && !cid ? null : k
  }
  return null
}

export function chaveGrupoLinhaHorasEspecial(
  dia: { localTrabalho?: string; clienteTrabalhoId?: string; clienteTrabalhoNome?: string },
  eq: RelatorioEquipamentoRef | undefined,
  principalId?: string
): string {
  const diaKey = chaveLocalDiaTrabalhoEspecial(dia, principalId)
  if (diaKey) return diaKey
  if (!eq) return FECHAMENTO_ESPECIAL_GRUPO_PRINCIPAL
  return chaveGrupoClienteFechamentoEspecial(eq)
}

export function rotuloEquipamentoGrupoFechamento(eq: RelatorioEquipamentoRef, idx: number): string {
  const label = formatarLabelEquipamentoSelectCurto(eq, idx)
  return String(label || eq.maquinaModelo || eq.numeroMaquina || `#${idx + 1}`).trim()
}

export function rotuloGrupoFechamentoEspecial(
  grupo: Pick<GrupoFechamentoEspecial, 'clienteNome' | 'equipamentos' | 'oficina' | 'key'>,
  opts?: { oficinaLabel?: string }
): string {
  let nome = String(grupo.clienteNome || '').trim() || '—'
  if (grupo.oficina || grupo.key === FECHAMENTO_ESPECIAL_GRUPO_ARMAZEM) {
    const of = String(opts?.oficinaLabel || '').trim()
    if (of) nome = nome === '—' ? of : `${nome} · ${of}`
  }
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
        oficina: key === FECHAMENTO_ESPECIAL_GRUPO_ARMAZEM,
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

  const eqs = Array.isArray(r.equipamentos) ? r.equipamentos : []
  const temArmazem = eqs.some((eq) => eq.equipamentoOrigem === 'armazem')
  if (temArmazem) {
    ensure(FECHAMENTO_ESPECIAL_GRUPO_ARMAZEM, principalId, principalNome)
  }
  ensure(FECHAMENTO_ESPECIAL_GRUPO_PRINCIPAL, principalId, principalNome)
  const addEq = (key: string, clienteId: string, clienteNome: string, eq: RelatorioEquipamentoRef, idx: number) => {
    const g = ensure(key, clienteId, clienteNome)
    const uid = String(eq.uid || '').trim()
    if (uid && !g.equipamentos.some((e) => e.uid === uid)) {
      g.equipamentos.push({ uid, label: rotuloEquipamentoGrupoFechamento(eq, idx) })
    }
  }

  eqs.forEach((eq, idx) => {
    const key = chaveGrupoClienteFechamentoEspecial(eq)
    const isExt =
      eq.equipamentoOrigem === 'clientes-externos' ||
      (String(eq.clienteExternoId || '').trim() !== '' && eq.equipamentoOrigem !== 'armazem')
    addEq(
      key,
      isExt ? String(eq.clienteExternoId || '').trim() : principalId,
      isExt ? String(eq.clienteExternoNome || '').trim() || '—' : principalNome,
      eq,
      idx
    )
    if (eq.equipamentoOrigem === 'armazem') {
      const instId = String(eq.clienteInstalacaoId || '').trim()
      const instNome = String(eq.clienteInstalacaoNome || '').trim()
      if ((instId || instNome) && instId !== principalId) {
        addEq(chaveGrupoPorClienteIdNome(instId, instNome), instId, instNome || '—', eq, idx)
      }
    }
  })

  for (const dia of r.diasTrabalho || []) {
    const k = chaveLocalDiaTrabalhoEspecial(dia, principalId)
    if (!k || k === FECHAMENTO_ESPECIAL_GRUPO_PRINCIPAL) continue
    const cid = String(dia.clienteTrabalhoId || '').trim()
    const nome = String(dia.clienteTrabalhoNome || '').trim() || '—'
    ensure(k, cid, nome)
    for (const linha of dia.horasPorEquipamento || []) {
      const uid = String(linha.equipamentoUid || '').trim()
      if (!uid) continue
      const idx = eqs.findIndex((e) => e.uid === uid)
      const eq = idx >= 0 ? eqs[idx] : undefined
      if (eq) addEq(k, cid, nome, eq, idx)
    }
  }

  const all = [...map.values()]
  const withEq = all.filter((g) => g.equipamentos.length > 0)
  if (withEq.length > 0) return withEq
  return all.filter(
    (g) => g.key === FECHAMENTO_ESPECIAL_GRUPO_PRINCIPAL || g.key === FECHAMENTO_ESPECIAL_GRUPO_ARMAZEM
  ).slice(0, 1)
}

export function deveSepararFechamentoEspecialPorCliente(r: RelatorioEspecial | null | undefined): boolean {
  if (!r) return false
  return calcularTotaisFechamentoEspecialPorCliente(r).length >= 2
}

export function calcularTotaisFechamentoEspecialPorCliente(
  r: RelatorioEspecial
): GrupoFechamentoEspecial[] {
  const grupos = listarGruposClienteFechamentoEspecial(r)
  const byKey = new Map(grupos.map((g) => [g.key, g]))
  const eqs = Array.isArray(r.equipamentos) ? r.equipamentos : []
  const eqByUid = new Map(eqs.map((e) => [String(e.uid || '').trim(), e]))
  const principalId = String(r.clienteId || '').trim()

  const lista = Array.isArray(r.diasTrabalho) ? r.diasTrabalho : []
  for (const diaRaw of lista) {
    const dia = atualizarCalculosDiaEspecial(diaRaw)
    const locDia = chaveLocalDiaTrabalhoEspecial(dia, principalId)
    const almoco = minutosAlmocoDia(dia)
    const linhas = dia.horasPorEquipamento || []
    const { liquidos } = distribuirAlmocoPorLinhaEquipamentoDia(linhas, almoco)
    const presentes = new Set<string>()

    for (let i = 0; i < linhas.length; i++) {
      const uid = String(linhas[i].equipamentoUid || '').trim()
      if (!uid) continue
      const bruto = minutosDeDuracaoHHMM(horasEquipamentoDiaBruto(linhas[i]))
      if (bruto <= 0 && !(linhas[i].horasInicio && linhas[i].horasFim)) continue
      const liq = liquidos[i] ?? Math.max(0, bruto)
      if (liq <= 0 && bruto <= 0) continue
      const eq = eqByUid.get(uid)
      const key = chaveGrupoLinhaHorasEspecial(dia, eq, principalId)
      presentes.add(key)
      let g = byKey.get(key)
      if (!g && key !== FECHAMENTO_ESPECIAL_GRUPO_PRINCIPAL) {
        g = {
          key,
          clienteId: String(dia.clienteTrabalhoId || eq?.clienteExternoId || eq?.clienteInstalacaoId || '').trim(),
          clienteNome:
            String(dia.clienteTrabalhoNome || eq?.clienteExternoNome || eq?.clienteInstalacaoNome || '').trim() ||
            '—',
          oficina: key === FECHAMENTO_ESPECIAL_GRUPO_ARMAZEM,
          equipamentos: [],
          ht: 0,
          km: 0,
          diarias: 0,
          hida: 0,
          hret: 0,
        }
        grupos.push(g)
        byKey.set(key, g)
      }
      if (g) {
        g.ht += liq
        if (eq && !g.equipamentos.some((e) => e.uid === uid)) {
          const idx = eqs.findIndex((e) => e.uid === uid)
          g.equipamentos.push({ uid, label: rotuloEquipamentoGrupoFechamento(eq, idx >= 0 ? idx : 0) })
        }
      }
    }

    if (presentes.size === 0) {
      if (locDia) presentes.add(locDia)
      else if (eqs.some((e) => e.equipamentoOrigem === 'armazem')) {
        presentes.add(FECHAMENTO_ESPECIAL_GRUPO_ARMAZEM)
      } else presentes.add(FECHAMENTO_ESPECIAL_GRUPO_PRINCIPAL)
    }
    const keys = [...presentes].filter((k) => byKey.has(k))
    if (keys.length === 0) continue

    const kmDia = parseFloat(String(dia.kmTotal || '0')) || 0
    const ida = minutosDeDuracaoHHMM(dia.idaDuracao || '')
    const ret = minutosDeDuracaoHHMM(dia.retornoDuracao || '')
    const diaria = diaContaComoDiariaEspecial(dia) ? 1 : 0
    const destKeys = locDia && byKey.has(locDia) ? [locDia] : keys
    const kmPartes = repartirTotalEquitativo(kmDia, destKeys.length, 2)
    const idaPartes = repartirTotalEquitativo(ida, destKeys.length, 0)
    const retPartes = repartirTotalEquitativo(ret, destKeys.length, 0)
    const diaPartes = repartirTotalEquitativo(diaria, destKeys.length, 2)
    destKeys.forEach((k, i) => {
      const g = byKey.get(k)
      if (!g) return
      g.km += kmPartes[i] || 0
      g.hida += idaPartes[i] || 0
      g.hret += retPartes[i] || 0
      g.diarias += diaPartes[i] || 0
    })
  }

  const converted = grupos.map((g) => ({
    ...g,
    ht: Math.round(g.ht) / 60,
    km: roundN(g.km, 2),
    diarias: roundN(g.diarias, 2),
    hida: Math.round(g.hida) / 60,
    hret: Math.round(g.hret) / 60,
  }))
  const filled = converted.filter((g) => g.ht || g.km || g.diarias || g.hida || g.hret)
  return filled.length > 0 ? filled : converted.slice(0, 1)
}
