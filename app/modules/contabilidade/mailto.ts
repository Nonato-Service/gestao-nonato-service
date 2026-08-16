/** Prefixo `mailto:` para o e-mail da contabilidade (puro). */
export function mailtoPrefixContabilidade(email: string): string {
  const e = String(email ?? '').trim()
  return e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? `mailto:${e}` : 'mailto:'
}
