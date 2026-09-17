/**
 * Select de equipamento no dia do relatório especial:
 * lista o cadastro do cliente de «Local deste dia» (não só as linhas já no relatório).
 */
import type { RelatorioEquipamentoOrigem, RelatorioEquipamentoRef } from '../relatorio-servico'
import {
  equipamentoArmazemEstaAtivo,
  equipamentoIdPlaceholderInvalido,
  equipamentosClienteParaSelectRelatorio,
  encontrarEquipamentoClientePorRefRelatorio,
  formatarLabelEquipamentoSelectCurto,
  idEquipamentoCadastroParaGravarNoRelatorio,
  opcaoEquipamentoClienteSelectRelatorio,
  segmentoIdEquipamentoExibivel,
  type EquipamentoArmazemBaixaLookup,
  type EquipamentoClienteIdLookup,
} from '../equipamentos'
import { rotuloEquipamentoDiaComClientesEspecial } from './calculos'

export const PREFIXO_OPCAO_CADASTRO_DIA = 'cad::'
export const PREFIXO_OPCAO_ARMAZEM_DIA = 'arm::'

export type ClienteCadastroDiaEspecial = {
  id?: string
  nomeEmpresa?: string
  equipamentos?: EquipamentoClienteIdLookup[]
}

export type OpcaoEquipamentoDiaEspecial = { value: string; label: string }

export type ContextoSelectEquipamentoDiaEspecial = {
  dia: {
    localTrabalho?: string
    clienteTrabalhoId?: string
    clienteTrabalhoNome?: string
  }
  equipamentosRelatorio: RelatorioEquipamentoRef[]
  clientes: ClienteCadastroDiaEspecial[]
  clientePrincipalId: string
  clientePrincipalNome?: string
  equipamentosArmazem: EquipamentoArmazemBaixaLookup[]
}

export type ResultadoSelecaoEquipamentoDiaEspecial =
  | { ok: true; equipamentoUid: string; equipamentos: RelatorioEquipamentoRef[] }
  | { ok: false; motivo: 'max' | 'invalido' }

function chaveNorm(v: string | undefined): string {
  return String(v || '')
    .trim()
    .toLowerCase()
}

function slotEquipamentoVazio(eq: RelatorioEquipamentoRef): boolean {
  return (
    !String(eq.equipamentoId || '').trim() &&
    !String(eq.numeroMaquina || '').trim() &&
    !String(eq.maquinaModelo || '').trim()
  )
}

export function encodeOpcaoCadastroDiaEspecial(clienteId: string, chave: string): string {
  return `${PREFIXO_OPCAO_CADASTRO_DIA}${encodeURIComponent(clienteId)}::${encodeURIComponent(chave)}`
}

export function parseOpcaoCadastroDiaEspecial(
  value: string
): { clienteId: string; chave: string } | null {
  const raw = String(value || '')
  if (!raw.startsWith(PREFIXO_OPCAO_CADASTRO_DIA)) return null
  const rest = raw.slice(PREFIXO_OPCAO_CADASTRO_DIA.length)
  const i = rest.indexOf('::')
  if (i < 0) return null
  try {
    return {
      clienteId: decodeURIComponent(rest.slice(0, i)),
      chave: decodeURIComponent(rest.slice(i + 2)),
    }
  } catch {
    return null
  }
}

export function encodeOpcaoArmazemDiaEspecial(equipamentoId: string): string {
  return `${PREFIXO_OPCAO_ARMAZEM_DIA}${encodeURIComponent(equipamentoId)}`
}

export function parseOpcaoArmazemDiaEspecial(value: string): string | null {
  const raw = String(value || '')
  if (!raw.startsWith(PREFIXO_OPCAO_ARMAZEM_DIA)) return null
  try {
    return decodeURIComponent(raw.slice(PREFIXO_OPCAO_ARMAZEM_DIA.length))
  } catch {
    return null
  }
}

export function resolverClienteIdDoDiaEspecial(
  dia: {
    localTrabalho?: string
    clienteTrabalhoId?: string
    clienteTrabalhoNome?: string
  },
  clientes: ClienteCadastroDiaEspecial[],
  clientePrincipalId: string
): { kind: 'armazem' } | { kind: 'cliente'; id: string } {
  if (String(dia.localTrabalho || '').trim() === 'armazem') return { kind: 'armazem' }
  const id = String(dia.clienteTrabalhoId || '').trim()
  if (id) return { kind: 'cliente', id }
  const nome = chaveNorm(dia.clienteTrabalhoNome)
  if (nome) {
    const found = clientes.find((c) => chaveNorm(c.nomeEmpresa) === nome)
    const fid = String(found?.id || '').trim()
    if (fid) return { kind: 'cliente', id: fid }
  }
  return { kind: 'cliente', id: String(clientePrincipalId || '').trim() }
}

export function origemEquipamentoParaClienteDia(
  clienteId: string,
  clientePrincipalId: string
): RelatorioEquipamentoOrigem {
  const cid = String(clienteId || '').trim()
  const pid = String(clientePrincipalId || '').trim()
  return cid && cid === pid ? 'cliente' : 'clientes-externos'
}

export function refPertenceAoClienteDiaEspecial(
  eq: RelatorioEquipamentoRef,
  clienteId: string,
  clientePrincipalId: string
): boolean {
  const cid = String(clienteId || '').trim()
  if (!cid) return false
  if (eq.equipamentoOrigem === 'armazem') {
    return String(eq.clienteInstalacaoId || '').trim() === cid
  }
  if (eq.equipamentoOrigem === 'clientes-externos') {
    return String(eq.clienteExternoId || '').trim() === cid
  }
  return cid === String(clientePrincipalId || '').trim()
}

export function refCobreCadastroClienteDia(
  eq: RelatorioEquipamentoRef,
  cadastro: EquipamentoClienteIdLookup,
  equipamentosArmazem: EquipamentoArmazemBaixaLookup[]
): boolean {
  if (slotEquipamentoVazio(eq)) return false
  return encontrarEquipamentoClientePorRefRelatorio(eq, [cadastro], equipamentosArmazem) != null
}

export function encontrarRefCadastroNoRelatorio(
  existentes: RelatorioEquipamentoRef[],
  cadastro: EquipamentoClienteIdLookup,
  clienteId: string,
  clientePrincipalId: string,
  equipamentosArmazem: EquipamentoArmazemBaixaLookup[]
): RelatorioEquipamentoRef | undefined {
  return existentes.find(
    (eq) =>
      refPertenceAoClienteDiaEspecial(eq, clienteId, clientePrincipalId) &&
      refCobreCadastroClienteDia(eq, cadastro, equipamentosArmazem)
  )
}

export function aplicarCadastroClienteEmRefRelatorio(
  item: RelatorioEquipamentoRef,
  cadastro: EquipamentoClienteIdLookup,
  idx: number,
  opts: {
    clienteId: string
    clienteNome: string
    clientePrincipalId: string
    equipamentosArmazem: EquipamentoArmazemBaixaLookup[]
  }
): RelatorioEquipamentoRef {
  const origem = origemEquipamentoParaClienteDia(opts.clienteId, opts.clientePrincipalId)
  const idGravar = idEquipamentoCadastroParaGravarNoRelatorio(
    cadastro,
    idx,
    opts.equipamentosArmazem
  )
  const snSel =
    segmentoIdEquipamentoExibivel(cadastro.numeroSerie) ||
    (equipamentoIdPlaceholderInvalido(cadastro.numeroSerie)
      ? ''
      : String(cadastro.numeroSerie || '').trim())
  return {
    ...item,
    equipamentoOrigem: origem,
    clienteExternoId: origem === 'clientes-externos' ? opts.clienteId : '',
    clienteExternoNome: origem === 'clientes-externos' ? opts.clienteNome : '',
    equipamentoId: idGravar || snSel || '',
    numeroMaquina: snSel,
    maquinaModelo: `${String(cadastro.modelo || '').trim()} ${String(cadastro.marca || '').trim()}`.trim(),
  }
}

export function aplicarArmazemEmRefRelatorio(
  item: RelatorioEquipamentoRef,
  wh: EquipamentoArmazemBaixaLookup
): RelatorioEquipamentoRef {
  return {
    ...item,
    equipamentoOrigem: 'armazem',
    equipamentoId: String(wh.id || '').trim(),
    numeroMaquina: segmentoIdEquipamentoExibivel(wh.numeroSerie) || String(wh.numeroSerie || '').trim(),
    maquinaModelo: `${String(wh.modelo || '').trim()} ${String(wh.marca || '').trim()}`.trim(),
  }
}

function encontrarCadastroPorChave(
  lista: EquipamentoClienteIdLookup[],
  chave: string,
  equipamentosArmazem: EquipamentoArmazemBaixaLookup[]
): { cadastro: EquipamentoClienteIdLookup; idx: number } | null {
  const alvo = String(chave || '').trim()
  if (!alvo) return null
  for (let idx = 0; idx < lista.length; idx++) {
    const item = lista[idx]
    const op = opcaoEquipamentoClienteSelectRelatorio(item, idx, equipamentosArmazem)
    if (
      op.value === alvo ||
      String(item.id || '').trim() === alvo ||
      String(item.numeroSerie || '').trim() === alvo
    ) {
      return { cadastro: item, idx }
    }
  }
  return null
}

function encontrarSlotVazioCompativel(
  existentes: RelatorioEquipamentoRef[],
  origem: RelatorioEquipamentoOrigem,
  clienteExternoId?: string
): number {
  const cid = String(clienteExternoId || '').trim()
  return existentes.findIndex((eq) => {
    if (!slotEquipamentoVazio(eq)) return false
    if (eq.equipamentoOrigem !== origem) return false
    if (origem === 'clientes-externos') {
      const atual = String(eq.clienteExternoId || '').trim()
      return !atual || atual === cid
    }
    return true
  })
}

function refArmazemCobreWh(eq: RelatorioEquipamentoRef, wh: EquipamentoArmazemBaixaLookup): boolean {
  if (eq.equipamentoOrigem !== 'armazem' || slotEquipamentoVazio(eq)) return false
  const idWh = chaveNorm(wh.id)
  const snWh = chaveNorm(segmentoIdEquipamentoExibivel(wh.numeroSerie) || wh.numeroSerie)
  const idEq = chaveNorm(eq.equipamentoId)
  const snEq = chaveNorm(eq.numeroMaquina)
  if (idWh && (idEq === idWh || snEq === idWh)) return true
  if (snWh && (snEq === snWh || idEq === snWh)) return true
  return false
}

function labelRefDia(
  eq: RelatorioEquipamentoRef,
  idx: number,
  clientePrincipalNome: string | undefined,
  equipamentosArmazem: EquipamentoArmazemBaixaLookup[]
): string {
  const curto = formatarLabelEquipamentoSelectCurto(eq, idx, { equipamentosArmazem })
  return (
    rotuloEquipamentoDiaComClientesEspecial(eq, idx, {
      clientePrincipalNome,
      labelOpts: { equipamentosArmazem },
    }) || curto
  )
}

/** Opções do select de horas: cadastro do local do dia + linhas já no relatório desse local. */
export function opcoesEquipamentoSelectDiaEspecial(
  ctx: ContextoSelectEquipamentoDiaEspecial
): OpcaoEquipamentoDiaEspecial[] {
  const alvo = resolverClienteIdDoDiaEspecial(
    ctx.dia,
    ctx.clientes,
    ctx.clientePrincipalId
  )
  const existentes = Array.isArray(ctx.equipamentosRelatorio) ? ctx.equipamentosRelatorio : []
  const out: OpcaoEquipamentoDiaEspecial[] = []
  const seen = new Set<string>()
  const push = (value: string, label: string) => {
    const v = String(value || '').trim()
    if (!v || seen.has(v)) return
    seen.add(v)
    out.push({ value: v, label: String(label || '').trim() || v })
  }

  if (alvo.kind === 'armazem') {
    const ativos = (ctx.equipamentosArmazem || []).filter(equipamentoArmazemEstaAtivo)
    for (const wh of ativos) {
      const idWh = String(wh.id || '').trim()
      const existente = existentes.find((eq) => refArmazemCobreWh(eq, wh))
      const label = existente
        ? labelRefDia(
            existente,
            existentes.indexOf(existente),
            ctx.clientePrincipalNome,
            ctx.equipamentosArmazem
          )
        : formatarLabelEquipamentoSelectCurto(
            {
              id: wh.id,
              equipamentoId: wh.id,
              modelo: wh.modelo,
              marca: wh.marca,
              numeroSerie: wh.numeroSerie,
            },
            0
          )
      if (existente) push(existente.uid, label)
      else if (idWh) push(encodeOpcaoArmazemDiaEspecial(idWh), label)
    }
    existentes.forEach((eq, ei) => {
      if (eq.equipamentoOrigem !== 'armazem' || slotEquipamentoVazio(eq)) return
      push(eq.uid, labelRefDia(eq, ei, ctx.clientePrincipalNome, ctx.equipamentosArmazem))
    })
    return out
  }

  const clienteId = alvo.id
  if (!clienteId) {
    existentes.forEach((eq, ei) => {
      if (slotEquipamentoVazio(eq)) return
      push(eq.uid, labelRefDia(eq, ei, ctx.clientePrincipalNome, ctx.equipamentosArmazem))
    })
    return out
  }

  const cliente = ctx.clientes.find((c) => String(c.id || '').trim() === clienteId)
  const cadastroLista = equipamentosClienteParaSelectRelatorio(cliente?.equipamentos)
  for (let idx = 0; idx < cadastroLista.length; idx++) {
    const cad = cadastroLista[idx]
    const existente = encontrarRefCadastroNoRelatorio(
      existentes,
      cad,
      clienteId,
      ctx.clientePrincipalId,
      ctx.equipamentosArmazem
    )
    const op = opcaoEquipamentoClienteSelectRelatorio(cad, idx, ctx.equipamentosArmazem)
    const label = existente
      ? labelRefDia(
          existente,
          existentes.indexOf(existente),
          ctx.clientePrincipalNome,
          ctx.equipamentosArmazem
        )
      : op.label
    if (existente) push(existente.uid, label)
    else if (op.value) push(encodeOpcaoCadastroDiaEspecial(clienteId, op.value), label)
  }

  existentes.forEach((eq, ei) => {
    if (slotEquipamentoVazio(eq)) return
    if (!refPertenceAoClienteDiaEspecial(eq, clienteId, ctx.clientePrincipalId)) return
    push(eq.uid, labelRefDia(eq, ei, ctx.clientePrincipalNome, ctx.equipamentosArmazem))
  })

  return out
}

function inserirOuPreencherRef(
  existentes: RelatorioEquipamentoRef[],
  novo: RelatorioEquipamentoRef,
  origem: RelatorioEquipamentoOrigem,
  maxEquipamentos: number,
  clienteExternoId?: string
): { list: RelatorioEquipamentoRef[]; uid: string } | null {
  const slot = encontrarSlotVazioCompativel(existentes, origem, clienteExternoId)
  if (slot >= 0) {
    const uid = existentes[slot].uid
    const next = [...existentes]
    next[slot] = { ...novo, uid }
    return { list: next, uid }
  }
  if (existentes.length >= maxEquipamentos) return null
  return { list: [...existentes, novo], uid: novo.uid }
}

export function aplicarSelecaoEquipamentoDiaEspecial(
  value: string,
  existentes: RelatorioEquipamentoRef[],
  opts: {
    clientes: ClienteCadastroDiaEspecial[]
    clientePrincipalId: string
    equipamentosArmazem: EquipamentoArmazemBaixaLookup[]
    maxEquipamentos: number
    criarRef: (origem: RelatorioEquipamentoOrigem) => RelatorioEquipamentoRef
  }
): ResultadoSelecaoEquipamentoDiaEspecial {
  const v = String(value || '').trim()
  const lista = Array.isArray(existentes) ? existentes : []
  if (!v) return { ok: true, equipamentoUid: '', equipamentos: lista }

  if (lista.some((eq) => eq.uid === v)) {
    return { ok: true, equipamentoUid: v, equipamentos: lista }
  }

  const cad = parseOpcaoCadastroDiaEspecial(v)
  if (cad) {
    const cliente = opts.clientes.find((c) => String(c.id || '').trim() === cad.clienteId)
    const cadastroLista = equipamentosClienteParaSelectRelatorio(cliente?.equipamentos)
    const found = encontrarCadastroPorChave(cadastroLista, cad.chave, opts.equipamentosArmazem)
    if (!found) return { ok: false, motivo: 'invalido' }
    const ja = encontrarRefCadastroNoRelatorio(
      lista,
      found.cadastro,
      cad.clienteId,
      opts.clientePrincipalId,
      opts.equipamentosArmazem
    )
    if (ja) return { ok: true, equipamentoUid: ja.uid, equipamentos: lista }
    const origem = origemEquipamentoParaClienteDia(cad.clienteId, opts.clientePrincipalId)
    const preenchido = aplicarCadastroClienteEmRefRelatorio(opts.criarRef(origem), found.cadastro, found.idx, {
      clienteId: cad.clienteId,
      clienteNome: String(cliente?.nomeEmpresa || '').trim(),
      clientePrincipalId: opts.clientePrincipalId,
      equipamentosArmazem: opts.equipamentosArmazem,
    })
    const next = inserirOuPreencherRef(
      lista,
      preenchido,
      origem,
      opts.maxEquipamentos,
      origem === 'clientes-externos' ? cad.clienteId : undefined
    )
    if (!next) return { ok: false, motivo: 'max' }
    return { ok: true, equipamentoUid: next.uid, equipamentos: next.list }
  }

  const idArm = parseOpcaoArmazemDiaEspecial(v)
  if (idArm) {
    const wh = (opts.equipamentosArmazem || []).find(
      (e) => String(e.id || '').trim() === idArm || String(e.numeroSerie || '').trim() === idArm
    )
    if (!wh) return { ok: false, motivo: 'invalido' }
    const ja = lista.find((eq) => refArmazemCobreWh(eq, wh))
    if (ja) return { ok: true, equipamentoUid: ja.uid, equipamentos: lista }
    const preenchido = aplicarArmazemEmRefRelatorio(opts.criarRef('armazem'), wh)
    const next = inserirOuPreencherRef(lista, preenchido, 'armazem', opts.maxEquipamentos)
    if (!next) return { ok: false, motivo: 'max' }
    return { ok: true, equipamentoUid: next.uid, equipamentos: next.list }
  }

  return { ok: false, motivo: 'invalido' }
}
