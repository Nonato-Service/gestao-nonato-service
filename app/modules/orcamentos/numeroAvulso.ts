export type OrcamentoAvulsoNumeroRef = {
  numeroOrcamento: string
  data?: string
  dataCriacao?: string
  id?: string
}

/** Formato: DD/AAAA (1.º do dia) ou DD-N/AAAA (2.º, 3.º… no mesmo dia). */
export function parseNumeroOrcamentoAvulsoSequencial(
  num: string
): { day: string; year: string; seq: number | null } | null {
  const t = (num || '').trim()
  const comSeq = /^(\d{1,2})-(\d+)\/(\d{4})$/.exec(t)
  if (comSeq) {
    return { day: comSeq[1].padStart(2, '0'), year: comSeq[3], seq: parseInt(comSeq[2], 10) }
  }
  const base = /^(\d{1,2})\/(\d{4})$/.exec(t)
  if (base) return { day: base[1].padStart(2, '0'), year: base[2], seq: null }
  return null
}

export function dataIsoParaDiaAnoOrcamento(dataIso: string): { day: string; year: string } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((dataIso || '').trim())
  if (!m) return null
  return { day: m[3], year: m[1] }
}

export function gerarProximoNumeroOrcamentoAvulso(
  dataIso: string,
  orcamentosExistentes: OrcamentoAvulsoNumeroRef[],
  excluirId?: string
): string {
  const da = dataIsoParaDiaAnoOrcamento(dataIso)
  const now = new Date()
  const day = da?.day ?? String(now.getDate()).padStart(2, '0')
  const year = da?.year ?? String(now.getFullYear())

  let hasBase = false
  const seqs = new Set<number>()

  for (const o of orcamentosExistentes) {
    if (excluirId && o.id === excluirId) continue
    const parsed = parseNumeroOrcamentoAvulsoSequencial(o.numeroOrcamento)
    const diaData = o.data ? dataIsoParaDiaAnoOrcamento(o.data) : null
    const diaCriacao = o.dataCriacao ? dataIsoParaDiaAnoOrcamento(o.dataCriacao.slice(0, 10)) : null
    const mesmoDia =
      (parsed && parsed.day === day && parsed.year === year) ||
      (diaData && diaData.day === day && diaData.year === year) ||
      (diaCriacao && diaCriacao.day === day && diaCriacao.year === year)

    if (!mesmoDia) continue

    if (parsed && parsed.day === day && parsed.year === year) {
      if (parsed.seq === null) hasBase = true
      else seqs.add(parsed.seq)
    } else {
      hasBase = true
    }
  }

  if (!hasBase) return `${day}/${year}`

  let nextSeq = 1
  while (seqs.has(nextSeq)) nextSeq++
  return `${day}-${nextSeq}/${year}`
}

export function resolverNumeroOrcamentoAvulsoAoSalvar(
  dataIso: string,
  numeroAtual: string,
  orcamentosExistentes: OrcamentoAvulsoNumeroRef[],
  excluirId?: string
): string {
  let num =
    (numeroAtual || '').trim() ||
    gerarProximoNumeroOrcamentoAvulso(dataIso, orcamentosExistentes, excluirId)

  const outros = orcamentosExistentes.filter((o) => o.id !== excluirId)
  while (outros.some((o) => (o.numeroOrcamento || '').trim() === num)) {
    num = gerarProximoNumeroOrcamentoAvulso(
      dataIso,
      [...outros, { numeroOrcamento: num, data: dataIso }],
      excluirId
    )
  }
  return num
}

export function snapshotDadosClienteOrcamentoAvulso(origem: unknown): Record<string, string> {
  const c = (origem || {}) as Record<string, unknown>
  return {
    nomeEmpresa: String(c.nomeEmpresa || c.cliente || '').trim(),
    morada: String(c.morada || '').trim(),
    localidade: String(c.localidade || '').trim(),
    conselho: String(c.conselho || c.cidade || '').trim(),
    pais: String(c.pais || '').trim(),
    codigoPostal: String(c.codigoPostal || '').trim(),
    freguesia: String(c.freguesia || '').trim(),
    numeroContribuicaoFiscal: String(c.numeroContribuicaoFiscal || '').trim(),
    telefones: String(c.telefones || c.telefone || '').trim(),
    email: String(c.email || '').trim(),
    contato: String(c.contato || '').trim(),
    numeroRelatorio: String(c.numeroRelatorio || c.numero || '').trim(),
  }
}
