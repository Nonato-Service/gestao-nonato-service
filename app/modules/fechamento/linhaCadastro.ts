import type { FechamentoItem, ServicoCadastroFechamentoMin } from './tipos'
import { normalizeServicoValorStored } from './servicoValor'
import { servicoCodParaExibicao, servicoDescricaoLegivelFechamento } from './servicoRotulos'

/** Restringe o cadastro ao grupo escolhido no fechamento (ex.: HTT 70 € vs 95 € por grupo). */
export function filtrarServicosCadastroPorGrupo(
  servicos: ServicoCadastroFechamentoMin[],
  grupoId?: string | null
): ServicoCadastroFechamentoMin[] {
  if (!grupoId) return servicos
  const filtered = servicos.filter((s) => s.grupoId === grupoId)
  return filtered.length > 0 ? filtered : servicos
}

function txtServicoFechamento(s: ServicoCadastroFechamentoMin): string {
  return `${s.nome || ''} ${s.descricao || ''} ${s.cod || ''}`.toLowerCase()
}

/** Associa cada linha do fechamento (ht, km, diárias, ida, retorno) ao serviço certo do cadastro. */
export function resolverServicosFechamentoTemplate(
  servicos: ServicoCadastroFechamentoMin[],
  grupoId?: string | null
) {
  const pool = filtrarServicosCadastroPorGrupo(servicos, grupoId)
  const horaServs = pool.filter((s) => s.tipoCobranca === 'hora')
  const txt = txtServicoFechamento
  const porCod = (re: RegExp) => pool.find((s) => re.test(String(s.cod || '').trim()))

  const fechServHt =
    porCod(/^(ht|htt)$/i) ||
    horaServs.find(
      (s) =>
        (/trabalho/i.test(txt(s)) || /^(ht|htt)$/i.test(String(s.cod || '').trim())) &&
        !/viaj|viagem|\bida\b|\bretorno\b/i.test(txt(s))
    ) ||
    horaServs.find((s) => /trabalho/i.test(txt(s))) ||
    horaServs[0]

  const fechServHida =
    porCod(/^(hvi|hida|hvida)$/i) ||
    pool.find((s) => /viaj/i.test(txt(s)) && /\bida\b/i.test(txt(s)) && !/retorno/i.test(txt(s))) ||
    horaServs.find((s) => /\bida\b/i.test(txt(s)) && !/retorno/i.test(txt(s))) ||
    horaServs.find((s) => s.id && s.id !== fechServHt?.id)

  const fechServHret =
    porCod(/^(hvr|hret|hvret)$/i) ||
    pool.find((s) => /viaj/i.test(txt(s)) && /(retorno|volta)/i.test(txt(s))) ||
    horaServs.find((s) => /retorno|volta/i.test(txt(s))) ||
    horaServs.find((s) => s.id && s.id !== fechServHt?.id && s.id !== fechServHida?.id) ||
    fechServHida

  const fechServKm = porCod(/^krc$/i) || pool.find((s) => s.tipoCobranca === 'km')

  const diariasLista = pool
    .filter((s) => s.tipoCobranca === 'diarias')
    .slice()
    .sort((a, b) => {
      const va = normalizeServicoValorStored(a.valor)
      const vb = normalizeServicoValorStored(b.valor)
      const sa = a.categoria === 'servico' ? 1 : 0
      const sb = b.categoria === 'servico' ? 1 : 0
      if (sa !== sb) return sb - sa
      if (vb !== va) return vb - va
      return String(a.cod || '').localeCompare(String(b.cod || ''))
    })
  const fechServDiarias =
    porCod(/^dfc$/i) ||
    porCod(/^ddt$/i) ||
    diariasLista.find((s) => normalizeServicoValorStored(s.valor) > 0 && s.categoria === 'servico') ||
    diariasLista.find((s) => normalizeServicoValorStored(s.valor) > 0) ||
    diariasLista[0]

  return { fechServHt, fechServHida, fechServHret, fechServKm, fechServDiarias }
}

export function servicoCombinaLinhaFechamento(
  s: ServicoCadastroFechamentoMin,
  linhaId: string
): boolean {
  const cod = String(s.cod || '').trim().toUpperCase()
  const t = txtServicoFechamento(s)
  if (linhaId === 'ht') {
    return (
      /^(HT|HTT)$/i.test(cod) ||
      (s.tipoCobranca === 'hora' && /trabalho/i.test(t) && !/viaj|viagem|\bida\b|\bretorno\b/i.test(t))
    )
  }
  if (linhaId === 'hida') {
    return (
      /^(HVI|HIDA|HVIDA)$/i.test(cod) ||
      (/viaj|viagem/i.test(t) && /\bida\b/i.test(t) && !/retorno|volta/i.test(t))
    )
  }
  if (linhaId === 'hret') {
    return (
      /^(HVR|HRET|HVRET)$/i.test(cod) ||
      (/viaj|viagem/i.test(t) && /(retorno|volta)/i.test(t))
    )
  }
  if (linhaId === 'km') return s.tipoCobranca === 'km' || /^KRC$/i.test(cod)
  if (linhaId === 'diarias') {
    if (s.tipoCobranca !== 'diarias') return false
    const codDiaria = String(s.cod || '').trim().toUpperCase()
    const v = normalizeServicoValorStored(s.valor)
    if (/^(DFC|DDT|DIAR|DIARIAS)$/i.test(codDiaria)) return true
    if (s.categoria === 'servico' && v > 0) return true
    return v > 0
  }
  return true
}

export function servicoPertenceAoGrupoFechamento(
  s: ServicoCadastroFechamentoMin | undefined,
  grupoId?: string | null
): boolean {
  if (!s) return false
  if (!grupoId) return true
  const gid = String(s.grupoId || '').trim()
  return !gid || gid === grupoId
}

export function getServicoParaLinhaFechamento(
  servicos: ServicoCadastroFechamentoMin[],
  linhaId: string,
  savedServicoId?: string,
  grupoId?: string | null
): ServicoCadastroFechamentoMin | undefined {
  if (savedServicoId) {
    const byId = servicos.find((s) => s.id === savedServicoId)
    if (
      byId &&
      servicoCombinaLinhaFechamento(byId, linhaId) &&
      servicoPertenceAoGrupoFechamento(byId, grupoId)
    ) {
      return byId
    }
  }
  const r = resolverServicosFechamentoTemplate(servicos, grupoId)
  if (linhaId === 'ht') return r.fechServHt
  if (linhaId === 'hida') return r.fechServHida
  if (linhaId === 'hret') return r.fechServHret
  if (linhaId === 'km') return r.fechServKm
  if (linhaId === 'diarias') return r.fechServDiarias
  return undefined
}

/** Preenche código, valor unitário e total de uma linha do fechamento a partir do cadastro. */
export function enriquecerLinhaFechamentoComCadastro(
  item: FechamentoItem,
  servicos: ServicoCadastroFechamentoMin[],
  savedServicoId?: string,
  grupoId?: string | null,
  opts?: { forcarValorCadastro?: boolean }
): FechamentoItem {
  const tpl = getServicoParaLinhaFechamento(servicos, item.id, undefined, grupoId)
  let svc = tpl
  const savedRaw = savedServicoId ? servicos.find((s) => s.id === savedServicoId) : undefined
  const savedMesmoGrupo =
    !!savedRaw &&
    servicoCombinaLinhaFechamento(savedRaw, item.id) &&
    servicoPertenceAoGrupoFechamento(savedRaw, grupoId)
  if (savedMesmoGrupo && savedServicoId) {
    const bySaved = getServicoParaLinhaFechamento(servicos, item.id, savedServicoId, grupoId)
    const vSaved = bySaved ? normalizeServicoValorStored(bySaved.valor) : 0
    if (item.id === 'diarias') {
      const cod = String(bySaved?.cod || '').trim().toUpperCase()
      if (bySaved && vSaved > 0 && /^(DFC|DDT|DIAR|DIARIAS)$/i.test(cod)) svc = bySaved
    } else if (bySaved && vSaved > 0) {
      svc = bySaved
    }
  }
  if (!svc) return item
  const valorUnit = normalizeServicoValorStored(svc.valor)
  const qty = item.quantidade || 0
  const valorUnitStored = normalizeServicoValorStored(item.valorUnitario)
  /**
   * Se o serviço guardado é de outro grupo (ex.: HTT 50 → grupo HTT 70),
   * ou ao mudar o grupo, ou se o € guardado coincide com HTT/KM de outro grupo,
   * usar o valor do cadastro do grupo atual.
   */
  const valorCoincideComOutroGrupo =
    valorUnit > 0 &&
    valorUnitStored > 0 &&
    Math.abs(valorUnit - valorUnitStored) > 0.009 &&
    servicos.some(
      (s) =>
        s.id !== svc.id &&
        servicoCombinaLinhaFechamento(s, item.id) &&
        (!grupoId || String(s.grupoId || '').trim() !== grupoId) &&
        Math.abs(normalizeServicoValorStored(s.valor) - valorUnitStored) < 0.009
    )
  const deveUsarCadastro =
    opts?.forcarValorCadastro === true ||
    !savedMesmoGrupo ||
    valorUnitStored <= 0 ||
    valorCoincideComOutroGrupo
  const valorUnitFinal = deveUsarCadastro
    ? valorUnit > 0
      ? valorUnit
      : valorUnitStored
    : valorUnitStored > 0
      ? valorUnitStored
      : valorUnit
  const mult =
    item.tipoCobranca === 'hora' ||
    item.tipoCobranca === 'km' ||
    item.tipoCobranca === 'diarias' ||
    item.id === 'hida' ||
    item.id === 'hret'
  const valorTotal = mult ? Math.round(qty * valorUnitFinal * 100) / 100 : valorUnitFinal
  const cod =
    (typeof svc.cod === 'string' && svc.cod.trim()) || servicoCodParaExibicao(svc) || undefined
  const codCmp = (cod || '').trim().toUpperCase()
  const descLegivel = servicoDescricaoLegivelFechamento(svc)
  const descricao =
    descLegivel && descLegivel.trim().toUpperCase() !== codCmp ? descLegivel : item.descricao
  return {
    ...item,
    tipoCobranca: item.tipoCobranca,
    servicoId: svc.id,
    cod,
    descricao,
    valorUnitario: valorUnitFinal,
    valorTotal,
  }
}
