export type ParsedHelpContent = {
  purpose: string
  steps: string[]
  sections: Array<{ title: string; items: string[] }>
}

const COMO_MARKER = '---COMO---'

/** Divide textos F1 / manual no bloco «para que serve» e passos. */
export function parseHelpContent(raw: string): ParsedHelpContent {
  const text = (raw || '').trim()
  if (!text) {
    return { purpose: '', steps: [], sections: [] }
  }

  const markerIdx = text.indexOf(COMO_MARKER)
  const purposeBlock = markerIdx >= 0 ? text.slice(0, markerIdx).trim() : text
  const comoBlock = markerIdx >= 0 ? text.slice(markerIdx + COMO_MARKER.length).trim() : ''

  const lines = comoBlock.split('\n')
  const sections: Array<{ title: string; items: string[] }> = []
  let current: { title: string; items: string[] } | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (trimmed.startsWith('—') || trimmed.startsWith('- ')) {
      const title = trimmed.replace(/^—\s*/, '').replace(/^-\s*/, '').trim()
      current = { title, items: [] }
      sections.push(current)
      continue
    }

    if (trimmed.startsWith('•')) {
      const item = trimmed.replace(/^•\s*/, '').trim()
      if (current) current.items.push(item)
      else {
        current = { title: '', items: [item] }
        sections.push(current)
      }
      continue
    }

    if (current) current.items.push(trimmed)
    else {
      current = { title: '', items: [trimmed] }
      sections.push(current)
    }
  }

  const steps = sections.flatMap((s) => s.items)
  return { purpose: purposeBlock, steps, sections }
}

export function helpKeyFromTabType(tabType: string): string {
  return (
    'help' +
    tabType
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('')
  )
}

/** Converte action da sidebar (open-clientes) em tipo de aba (clientes). */
export function tabTypeFromAction(action: string): string | null {
  if (!action) return null
  if (action === 'open-manual-programa' || action === 'open-manual-gestor') return null

  const overrides: Record<string, string | null> = {
    'open-extra': 'extras',
    'open-administrador': 'administrador',
    'open-gestao-custos': 'gestao-custos',
    'open-gestao-financeira': 'gestao-financeira',
    'open-comunicacao-interna': 'comunicacao-interna',
    'open-diario-pedidos-dia': null,
    'open-gestao-industrial': 'equipamentos',
    'open-parceiros-comercial': 'clientes',
    'open-documentacao-relatorios': 'relatorio-servico',
  }

  if (Object.prototype.hasOwnProperty.call(overrides, action)) {
    return overrides[action] ?? null
  }

  if (action.startsWith('open-')) return action.slice(5)
  return null
}

export function helpKeyFromAction(action: string, tabType: string | null): string {
  if (action === 'open-diario-pedidos-dia') return '__manualDiarioPedidos__'
  if (tabType) return helpKeyFromTabType(tabType)
  return 'helpDefault'
}
