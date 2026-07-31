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

export function chaveClienteOrcamento(clienteId?: string, clienteNome?: string, fallbackId?: string): string {
  const id = String(clienteId ?? '').trim()
  if (id) return `id:${id}`
  const nome = String(clienteNome ?? '').trim()
  if (nome) return `nome:${nome.toLowerCase()}`
  return `orc:${fallbackId || 'sem-cliente'}`
}
