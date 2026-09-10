/** Detecção pura de cadastro duplicado (mesmo nome ou NIF). */

export type ClienteDuplicadoMotivo = 'nome' | 'nif'

export type ClienteCadastroDuplicado<T extends { id: string; nomeEmpresa?: string; numeroContribuicaoFiscal?: string }> = {
  cliente: T
  motivo: ClienteDuplicadoMotivo
}

export function normalizarNomeClienteComparacao(nome: string): string {
  return String(nome ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function tokensNomeClienteComparacao(nome: string): string[] {
  return normalizarNomeClienteComparacao(nome).split(' ').filter(Boolean)
}

/** Só é o mesmo cliente se o nome inteiro for igual (Ferwood ≠ Ferwood Manuel). */
export function saoNomesClienteIguais(a: string, b: string): boolean {
  const na = normalizarNomeClienteComparacao(a)
  const nb = normalizarNomeClienteComparacao(b)
  return Boolean(na && nb && na === nb)
}

/** Um nome é o outro com palavras a mais (variante distinta, não duplicado). */
export function eVarianteNomeClienteComExtra(a: string, b: string): boolean {
  const ta = tokensNomeClienteComparacao(a)
  const tb = tokensNomeClienteComparacao(b)
  if (ta.length === 0 || tb.length === 0 || ta.length === tb.length) return false
  const [curto, longo] = ta.length < tb.length ? [ta, tb] : [tb, ta]
  return curto.every((tok, i) => longo[i] === tok)
}

export function normalizarNifClienteComparacao(nif: string): string {
  return String(nif ?? '').replace(/[\s.\-/]/g, '').toUpperCase()
}

/** Evita cadastros duplicados (mesmo nome ou NIF). */
export function encontrarClienteDuplicadoCadastro<
  T extends { id: string; nomeEmpresa?: string; numeroContribuicaoFiscal?: string },
>(
  clientes: T[],
  opts: { nomeEmpresa: string; numeroContribuicaoFiscal?: string; excludeId?: string }
): ClienteCadastroDuplicado<T> | null {
  const excludeId = String(opts.excludeId ?? '').trim()
  const nifKey = normalizarNifClienteComparacao(opts.numeroContribuicaoFiscal || '')
  if (nifKey.length >= 3) {
    const byNif = clientes.find(
      (c) =>
        c.id !== excludeId &&
        normalizarNifClienteComparacao(c.numeroContribuicaoFiscal || '') === nifKey
    )
    if (byNif) return { cliente: byNif, motivo: 'nif' }
  }
  const nomeKey = normalizarNomeClienteComparacao(opts.nomeEmpresa)
  if (!nomeKey) return null
  const byNome = clientes.find(
    (c) => c.id !== excludeId && saoNomesClienteIguais(c.nomeEmpresa || '', opts.nomeEmpresa)
  )
  if (byNome) return { cliente: byNome, motivo: 'nome' }
  return null
}

/** Só avisa em tempo real quando há dados suficientes para evitar falsos positivos. */
export function encontrarClienteDuplicadoCadastroAntecipado<
  T extends { id: string; nomeEmpresa?: string; numeroContribuicaoFiscal?: string },
>(
  clientes: T[],
  opts: { nomeEmpresa: string; numeroContribuicaoFiscal?: string; excludeId?: string }
): ClienteCadastroDuplicado<T> | null {
  const nomeKey = normalizarNomeClienteComparacao(opts.nomeEmpresa)
  const nifKey = normalizarNifClienteComparacao(opts.numeroContribuicaoFiscal || '')
  const nomePronto = nomeKey.length >= 3
  const nifPronto = nifKey.length >= 3
  if (!nomePronto && !nifPronto) return null
  return encontrarClienteDuplicadoCadastro(clientes, {
    nomeEmpresa: nomePronto ? opts.nomeEmpresa : '',
    numeroContribuicaoFiscal: nifPronto ? opts.numeroContribuicaoFiscal : '',
    excludeId: opts.excludeId,
  })
}

/** Sugere clientes com nome parecido enquanto o utilizador digita (evita surpresa no fim). */
export function listarClientesNomeSimilarCadastro<
  T extends { id: string; nomeEmpresa?: string; numeroContribuicaoFiscal?: string },
>(
  clientes: T[],
  opts: { nomeEmpresa: string; excludeId?: string },
  limit = 5
): T[] {
  const excludeId = String(opts.excludeId ?? '').trim()
  const nomeKey = normalizarNomeClienteComparacao(opts.nomeEmpresa)
  if (nomeKey.length < 3) return []

  const matches: T[] = []
  for (const cliente of clientes) {
    if (cliente.id === excludeId) continue
    const existente = normalizarNomeClienteComparacao(cliente.nomeEmpresa || '')
    if (!existente) continue
    if (saoNomesClienteIguais(existente, nomeKey)) continue
    if (eVarianteNomeClienteComExtra(existente, nomeKey)) continue
    if (existente.includes(nomeKey) || nomeKey.includes(existente)) {
      matches.push(cliente)
      if (matches.length >= limit) break
    }
  }
  return matches
}
