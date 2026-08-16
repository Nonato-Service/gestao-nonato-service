import { localeForLongDatetime } from '../../translations'

/** Compara nomes de clientes respeitando acentos, maiúsculas e números. */
export function cmpNomeCliente(a: string, b: string, locale?: string): number {
  return (a || '').localeCompare(b || '', locale || undefined, {
    sensitivity: 'base',
    numeric: true,
  })
}

/** Ordena clientes alfabeticamente pelo nome da empresa. */
export function ordenarClientesPorNome<T extends { nomeEmpresa?: string | null }>(
  clientes: readonly T[],
  locale?: string
): T[] {
  return [...clientes].sort((a, b) =>
    cmpNomeCliente(String(a.nomeEmpresa ?? ''), String(b.nomeEmpresa ?? ''), locale)
  )
}

/** Locale BCP 47 para ordenação alfabética conforme o idioma do programa. */
export function localeOrdenacaoClientes(lang: string): string {
  return localeForLongDatetime(lang)
}

/** Ordena nomes de clientes (strings) alfabeticamente. */
export function ordenarNomesClientes(nomes: readonly string[], locale?: string): string[] {
  return [...nomes].sort((a, b) => cmpNomeCliente(a, b, locale))
}
