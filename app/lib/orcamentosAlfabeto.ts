export const ORCAMENTOS_ALFABETO_INDICE = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), '#'] as const

export function getClienteLetraAlfabeto(nome: string): string {
  const n = (nome || '').trim()
  if (!n) return '#'
  const match = n.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/)
  if (!match) return '#'
  const ch = match[0].toUpperCase()
  const base = ch.normalize('NFD').replace(/\p{M}/gu, '')
  if (/[A-Z]/.test(base)) return base
  return '#'
}

function normalizarLetraPalavra(palavra: string): string | null {
  const match = palavra.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/)
  if (!match) return null
  const base = match[0].toUpperCase().normalize('NFD').replace(/\p{M}/gu, '')
  return /[A-Z]/.test(base) ? base : null
}

export function extrairPalavrasNomeCliente(nome: string): string[] {
  return (nome || '')
    .split(/[\s(,;/\[\]{}]+/)
    .map((p) => p.replace(/^[^A-Za-zÀ-ÖØ-öø-ÿ]+|[^A-Za-zÀ-ÖØ-öø-ÿ]+$/g, '').trim())
    .filter((p) => p.length >= 2)
}

/** Letra principal (secção) ou qualquer palavra do nome — ex.: THOMAS aparece em «T». */
export function clienteNomeMatchesLetraAlfabeto(nome: string, letra: string): boolean {
  const alvo = letra.toUpperCase()
  if (alvo === '#') return getClienteLetraAlfabeto(nome) === '#'
  if (getClienteLetraAlfabeto(nome) === alvo) return true
  return extrairPalavrasNomeCliente(nome).some((palavra) => normalizarLetraPalavra(palavra) === alvo)
}

export function contarClientesPorLetraAlfabeto<T extends { nomeEmpresa?: string | null }>(
  clientes: T[],
  letra: string
): number {
  return clientes.filter((c) => clienteNomeMatchesLetraAlfabeto(c.nomeEmpresa || '', letra)).length
}

export function filtrarClientesPorLetraAlfabeto<T extends { nomeEmpresa?: string | null }>(
  clientes: T[],
  letra: string
): T[] {
  return clientes.filter((c) => clienteNomeMatchesLetraAlfabeto(c.nomeEmpresa || '', letra))
}

export function chaveClienteOrcamento(clienteId?: string, clienteNome?: string, fallbackId?: string): string {
  const id = String(clienteId ?? '').trim()
  if (id) return `id:${id}`
  const nome = String(clienteNome ?? '').trim()
  if (nome) return `nome:${nome.toLowerCase()}`
  return `orc:${fallbackId || 'sem-cliente'}`
}
