export type ParsedHelpContent = {
  purpose: string
  steps: string[]
  sections: Array<{ title: string; items: string[] }>
  tips: string[]
  warnings: string[]
}

const COMO_MARKER = '---COMO---'

function isTipLine(line: string): boolean {
  const t = line.trim()
  return t.startsWith('💡') || /^(\[?DICA\]?:?|\[?TIP\]?:?)/i.test(t)
}

function isWarningLine(line: string): boolean {
  const t = line.trim()
  return t.startsWith('⚠') || /^(\[?ATEN[ÇC][ÃA]O\]?:?|\[?WARNING\]?:?|\[?AVISO\]?:?)/i.test(t)
}

function cleanMarkerLine(line: string): string {
  return line
    .trim()
    .replace(/^💡\s*/, '')
    .replace(/^⚠️?\s*/, '')
    .replace(/^(\[?DICA\]?:?|\[?TIP\]?:?|\[?ATEN[ÇC][ÃA]O\]?:?|\[?WARNING\]?:?|\[?AVISO\]?:?)\s*/i, '')
    .trim()
}

/** Divide textos F1 / manual no bloco «para que serve» e passos. */
export function parseHelpContent(raw: string): ParsedHelpContent {
  const text = (raw || '').trim()
  if (!text) {
    return { purpose: '', steps: [], sections: [], tips: [], warnings: [] }
  }

  const markerIdx = text.indexOf(COMO_MARKER)
  const purposeBlock = markerIdx >= 0 ? text.slice(0, markerIdx).trim() : text
  const comoBlock = markerIdx >= 0 ? text.slice(markerIdx + COMO_MARKER.length).trim() : ''

  const lines = comoBlock.split('\n')
  const sections: Array<{ title: string; items: string[] }> = []
  const tips: string[] = []
  const warnings: string[] = []
  let current: { title: string; items: string[] } | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (isTipLine(trimmed)) {
      tips.push(cleanMarkerLine(trimmed))
      continue
    }
    if (isWarningLine(trimmed)) {
      warnings.push(cleanMarkerLine(trimmed))
      continue
    }

    if (trimmed.startsWith('—') || trimmed.startsWith('- ')) {
      const title = trimmed.replace(/^—\s*/, '').replace(/^-\s*/, '').trim()
      current = { title, items: [] }
      sections.push(current)
      continue
    }

    if (trimmed.startsWith('•')) {
      const item = trimmed.replace(/^•\s*/, '').trim()
      if (isTipLine(item)) {
        tips.push(cleanMarkerLine(item))
        continue
      }
      if (isWarningLine(item)) {
        warnings.push(cleanMarkerLine(item))
        continue
      }
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
  return { purpose: purposeBlock, steps, sections, tips, warnings }
}

const MANUAL_INDEX_SECTION_RE =
  /^(índice|indice|index|module index|índice dos módulos|indice de modulos|liste des modules|elenco moduli|modulübersicht)/i

/** Passos F1 adaptados ao manual — evita listas gigantes (ex.: índice do painel). */
export function parseHelpContentForManual(raw: string, pageId?: string): ParsedHelpContent {
  const parsed = parseHelpContent(raw)

  let sections = parsed.sections.filter((s) => {
    const t = (s.title || '').trim()
    if (!t) return true
    return !MANUAL_INDEX_SECTION_RE.test(t)
  })

  if (pageId === 'dashboard') {
    sections = sections.slice(0, 2)
  }

  const maxSteps = pageId === 'dashboard' ? 6 : 10
  let stepCount = 0
  const trimmedSections: typeof sections = []

  for (const section of sections) {
    const items: string[] = []
    for (const item of section.items) {
      if (stepCount >= maxSteps) break
      items.push(item)
      stepCount += 1
    }
    if (items.length > 0) trimmedSections.push({ ...section, items })
    if (stepCount >= maxSteps) break
  }

  const steps = trimmedSections.flatMap((s) => s.items)
  return { ...parsed, sections: trimmedSections, steps }
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
