/** Hub profissional do equipamento do cliente — chips de estado + timeline (funções puras). */

export type HubEqChipTone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral'

export type HubEqChip = {
  id: string
  tone: HubEqChipTone
  labelKey: string
  fallback: string
  count: number
}

export type HubEqTimelineTipo = 'relatorio' | 'pedido' | 'orcamento' | 'fatura'

export type HubEqTimelineItem = {
  id: string
  tipo: HubEqTimelineTipo
  dataIso: string
  titulo: string
  subtitulo?: string
  statusLabel?: string
}

export type HubEqFaturaLike = {
  id: string
  numeroFatura?: string
  dataEmissao?: string
  status?: string
  valorTotal?: number
  equipamentoId?: string
  equipamentoTexto?: string
}

/** Liga fatura ao equipamento do cliente (legado sem id fica de fora desta máquina). */
export function faturaCorrespondeEquipamento(
  fatura: HubEqFaturaLike,
  equipamento: { id?: string; numeroSerie?: string },
  equipamentoIndex: number
): boolean {
  const eqId = String(fatura.equipamentoId || '').trim()
  if (!eqId) return false
  const ids = [equipamento.id, equipamento.numeroSerie]
    .map((v) => String(v || '').trim())
    .filter(Boolean)
  if (ids.some((id) => id === eqId)) return true
  return eqId === `idx:${equipamentoIndex}`
}

export function filtrarFaturasDoEquipamento(
  faturas: HubEqFaturaLike[],
  equipamento: { id?: string; numeroSerie?: string },
  equipamentoIndex: number
): HubEqFaturaLike[] {
  return (faturas || []).filter((f) => faturaCorrespondeEquipamento(f, equipamento, equipamentoIndex))
}

export function buildHubEqChips(input: {
  rsAbertos: number
  orcPendentes: number
  fatPendentes: number
  fatVencidas: number
}): HubEqChip[] {
  const chips: HubEqChip[] = []
  if (input.rsAbertos > 0) {
    chips.push({
      id: 'rs-abertos',
      tone: 'info',
      labelKey: 'hubEqChipRsAbertos',
      fallback: 'RS em aberto',
      count: input.rsAbertos,
    })
  }
  if (input.orcPendentes > 0) {
    chips.push({
      id: 'orc-pend',
      tone: 'warn',
      labelKey: 'hubEqChipOrcPendentes',
      fallback: 'Orçamentos pendentes',
      count: input.orcPendentes,
    })
  }
  if (input.fatVencidas > 0) {
    chips.push({
      id: 'fat-venc',
      tone: 'danger',
      labelKey: 'hubEqChipFatVencidas',
      fallback: 'Faturas vencidas',
      count: input.fatVencidas,
    })
  }
  if (input.fatPendentes > 0) {
    chips.push({
      id: 'fat-pend',
      tone: 'warn',
      labelKey: 'hubEqChipFatPendentes',
      fallback: 'Faturas pendentes',
      count: input.fatPendentes,
    })
  }
  if (chips.length === 0) {
    chips.push({
      id: 'em-dia',
      tone: 'ok',
      labelKey: 'hubEqChipEmDia',
      fallback: 'Em dia',
      count: 0,
    })
  }
  return chips
}

export function hubEqChipToneStyle(tone: HubEqChipTone): {
  background: string
  border: string
  color: string
} {
  if (tone === 'ok') {
    return {
      background: 'rgba(0, 200, 83, 0.16)',
      border: '1px solid rgba(0, 200, 83, 0.45)',
      color: '#b9ffd0',
    }
  }
  if (tone === 'warn') {
    return {
      background: 'rgba(255, 193, 7, 0.14)',
      border: '1px solid rgba(255, 193, 7, 0.45)',
      color: '#ffe08a',
    }
  }
  if (tone === 'danger') {
    return {
      background: 'rgba(255, 80, 80, 0.14)',
      border: '1px solid rgba(255, 80, 80, 0.5)',
      color: '#ffb0b0',
    }
  }
  if (tone === 'info') {
    return {
      background: 'rgba(56, 189, 248, 0.12)',
      border: '1px solid rgba(56, 189, 248, 0.4)',
      color: '#bae6fd',
    }
  }
  return {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: 'rgba(255,255,255,0.75)',
  }
}

export function sortHubEqTimeline(items: HubEqTimelineItem[]): HubEqTimelineItem[] {
  return [...items].sort((a, b) => {
    const da = String(a.dataIso || '')
    const db = String(b.dataIso || '')
    if (da && db) return db.localeCompare(da)
    if (da) return -1
    if (db) return 1
    return String(b.id).localeCompare(String(a.id))
  })
}

export function hubEqTimelineTipoIcon(tipo: HubEqTimelineTipo): string {
  if (tipo === 'relatorio') return '📋'
  if (tipo === 'pedido') return '🔧'
  if (tipo === 'orcamento') return '💶'
  return '🧾'
}
