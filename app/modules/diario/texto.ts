/** Primeira linha não vazia = título na lista (ex.: cliente na agenda); o resto abre ao expandir. */
export function diarioPedidoTituloECorpo(texto: string): { titulo: string; corpo: string } {
  const lines = String(texto ?? '').split(/\r?\n/)
  let i = 0
  while (i < lines.length && !lines[i].trim()) i++
  if (i >= lines.length) return { titulo: '', corpo: '' }
  const titulo = lines[i].trim()
  const corpo = lines.slice(i + 1).join('\n').trim()
  return { titulo, corpo }
}

/** Linhas de tarefas (corpo do diário), uma bolinha por linha na lista. */
export function diarioPedidoLinhasTarefas(corpo: string): string[] {
  return String(corpo ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
}
