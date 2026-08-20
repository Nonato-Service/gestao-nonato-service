'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { localeDatetimeGeneral } from '../translations'
import {
  PedidoOrcamentoRef,
  PedidoAvulsoRef,
  EquipamentoClienteRef,
  EquipamentoArmazemRef,
  pedidoRelatorioCorrespondeEquipamento,
  pedidoAvulsoCorrespondeEquipamento,
  pedidoRelatorioPendente,
  findOrcamentoGeradoParaPedidoRelatorio,
  findOrcamentoGeradoParaPedidoAvulso,
  statusEfetivoPedidoRelatorio,
  statusEfetivoPedidoAvulso,
  pedidoAvulsoAprovado,
  pedidoRelatorioAprovado,
  pedidoAvulsoCancelado,
  pedidoRelatorioCancelado,
  orcamentoGeradoCorrespondeEquipamento,
  orcamentoGeradoPendente,
  orcamentoGeradoAprovado,
  orcamentoGeradoCancelado,
  dedupePedidosRelatorioCliente,
} from '../lib/clienteEquipamentoOrcamentos'
import type { OrcamentoGeradoRef } from '../lib/clienteEquipamentoOrcamentos'
import {
  buildHubEqChips,
  buildItensFaturaDeOrcamentoAprovado,
  filtrarFaturasDoEquipamento,
  hubEqChipToneStyle,
  hubEqTimelineTipoIcon,
  sortHubEqTimeline,
  type HubEqCriarFaturaDeOrcamentoPayload,
  type HubEqFaturaLike,
  type HubEqTimelineItem,
} from '../modules/clientes/equipamentoHubPro'

export type RelatorioEquipamentoHistorico = {
  id: string
  numero: string
  data: string
  tecnico: string
  tipoServico?: string
  pecasSubstituicao?: Array<{ codigo: string; descricao: string; quantidade: number | string }>
  pecasInstaladas?: Array<{ codigo: string; descricao: string; quantidade: number | string }>
  servicoConcluido?: boolean
  necessarioTrocaPecas?: boolean
  pecasInstaladasSubstituidas?: boolean
}

/** Vista do hub: filtra secções sem perder dados. */
export type ClienteEquipamentoHistVista = 'todas' | 'relatorios' | 'pecas' | 'orcamentos' | 'timeline'

type Props = {
  relatorios: RelatorioEquipamentoHistorico[]
  clienteId: string
  clienteNome: string
  equipamento: EquipamentoClienteRef
  equipamentoIndex: number
  pedidosRelatorio: PedidoOrcamentoRef[]
  equipamentosArmazem?: EquipamentoArmazemRef[]
  /** Faturas do cliente (filtradas no painel por equipamento). */
  faturasCliente?: HubEqFaturaLike[]
  language?: string
  safeT: Record<string, string | undefined>
  loadData?: (key: string) => Promise<unknown>
  relatorioComDivida?: (relatorioId: string) => boolean
  onVerRelatorio?: (relatorio: RelatorioEquipamentoHistorico) => void
  onUpdatePedidoRelatorioStatus?: (id: string, status: PedidoOrcamentoRef['status']) => void
  onVisualizarPdfRelatorio?: (pedido: PedidoOrcamentoRef) => void
  onVisualizarPdfAvulso?: (pedido: PedidoAvulsoRef) => void
  onAtualizarPedidoAvulso?: (pedidos: PedidoAvulsoRef[]) => void
  /** Criar fatura a partir de orçamento/pedido aprovado. */
  onCriarFaturaDeOrcamento?: (payload: HubEqCriarFaturaDeOrcamentoPayload) => void
  /** Abrir item da timeline (RS, fatura, pedido, orçamento). */
  onAbrirTimelineItem?: (item: HubEqTimelineItem) => void
  /** Hub Cliente→Equipamento: mostrar só a secção pedida */
  vista?: ClienteEquipamentoHistVista
  /** Chips de estado no topo (visão profissional do hub). */
  mostrarBarraEstado?: boolean
}

const PEDIDOS_AVULSO_KEY = 'nonato-pedidos-orcamento-avulso'
const ORCAMENTOS_AVULSO_KEY = 'nonato-orcamentos-avulso'

function relatorioTemPecas(rel: RelatorioEquipamentoHistorico): boolean {
  const subs = rel.pecasSubstituicao?.length ?? 0
  const inst = rel.pecasInstaladas?.length ?? 0
  return subs > 0 || inst > 0 || Boolean(rel.necessarioTrocaPecas || rel.pecasInstaladasSubstituidas)
}

function todasPecasRelatorio(rel: RelatorioEquipamentoHistorico) {
  const list = [...(rel.pecasInstaladas ?? []), ...(rel.pecasSubstituicao ?? [])]
  const map = new Map<string, { codigo: string; descricao: string; quantidade: number | string }>()
  for (const p of list) {
    const key = `${p.codigo}::${p.descricao}`
    const prev = map.get(key)
    if (!prev) {
      map.set(key, { ...p })
      continue
    }
    const qPrev = parseFloat(String(prev.quantidade)) || 0
    const qNew = parseFloat(String(p.quantidade)) || 0
    map.set(key, { ...prev, quantidade: qPrev + qNew })
  }
  return [...map.values()]
}

export function ClienteEquipamentoHistoricoPanel({
  relatorios,
  clienteId,
  clienteNome,
  equipamento,
  equipamentoIndex,
  pedidosRelatorio,
  equipamentosArmazem = [],
  faturasCliente = [],
  language = 'pt-BR',
  safeT,
  loadData,
  relatorioComDivida,
  onVerRelatorio,
  onUpdatePedidoRelatorioStatus,
  onVisualizarPdfRelatorio,
  onVisualizarPdfAvulso,
  onCriarFaturaDeOrcamento,
  onAbrirTimelineItem,
  vista = 'todas',
  mostrarBarraEstado = false,
}: Props) {
  const tr = (key: string) => safeT[key] ?? key
  const locale = localeDatetimeGeneral(language)
  const showGrupos = vista === 'todas' || vista === 'relatorios' || vista === 'pecas'
  const showOrcamentos = vista === 'todas' || vista === 'orcamentos'
  const showColServico = vista === 'todas' || vista === 'relatorios'
  const showColPecas = vista === 'todas' || vista === 'pecas'
  const showTimeline = vista === 'timeline'

  const fmtDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString(locale)
    } catch {
      return d
    }
  }

  const badgePedido = (status: PedidoOrcamentoRef['status']) => {
    if (status === 'aprovado') return { cls: 'is-aprovado', label: tr('aprovado') }
    if (status === 'rejeitado') return { cls: 'is-rejeitado', label: tr('rejeitado') }
    if (status === 'enviado') return { cls: 'is-enviado', label: tr('statusEnviado') }
    if (status === 'recebido') return { cls: 'is-recebido', label: tr('statusRecebido') }
    return { cls: 'is-pendente', label: tr('aguardaAprovacao') }
  }

  const [pedidosAvulso, setPedidosAvulso] = useState<PedidoAvulsoRef[]>([])
  const [orcamentosGerados, setOrcamentosGerados] = useState<OrcamentoGeradoRef[]>([])
  const [reloadTick, setReloadTick] = useState(0)

  const recarregarDados = useCallback(() => {
    if (!loadData) return
    loadData(PEDIDOS_AVULSO_KEY)
      .then((data) => {
        if (Array.isArray(data)) setPedidosAvulso(data as PedidoAvulsoRef[])
      })
      .catch(() => {})
    loadData(ORCAMENTOS_AVULSO_KEY)
      .then((data) => {
        if (Array.isArray(data)) setOrcamentosGerados(data as OrcamentoGeradoRef[])
      })
      .catch(() => {})
  }, [loadData])

  useEffect(() => {
    recarregarDados()
  }, [recarregarDados, clienteId, equipamentoIndex, reloadTick])

  useEffect(() => {
    const onChanged = () => setReloadTick((n) => n + 1)
    window.addEventListener('nonato-equip-orcamentos-changed', onChanged)
    return () => window.removeEventListener('nonato-equip-orcamentos-changed', onChanged)
  }, [])

  const pedidosFiltrados = useMemo(
    () =>
      dedupePedidosRelatorioCliente(
        pedidosRelatorio.filter((p) =>
          pedidoRelatorioCorrespondeEquipamento(
            p,
            clienteId,
            equipamento,
            equipamentoIndex,
            clienteNome,
            equipamentosArmazem
          )
        )
      ),
    [pedidosRelatorio, clienteId, equipamento, equipamentoIndex, clienteNome, equipamentosArmazem]
  )

  const pedidosAvulsoFiltrados = useMemo(
    () =>
      pedidosAvulso.filter((p) =>
        pedidoAvulsoCorrespondeEquipamento(
          p,
          clienteId,
          equipamento,
          equipamentoIndex,
          clienteNome,
          equipamentosArmazem
        )
      ),
    [pedidosAvulso, clienteId, equipamento, equipamentoIndex, clienteNome, equipamentosArmazem]
  )

  const numerosRelatorioEquip = useMemo(
    () =>
      [
        ...new Set([
          ...relatorios.map((r) => r.numero),
          ...pedidosFiltrados.map((p) => p.numeroRelatorio),
        ]),
      ].filter(Boolean),
    [relatorios, pedidosFiltrados]
  )

  const orcamentosEquipamento = useMemo(
    () =>
      orcamentosGerados.filter((o) =>
        orcamentoGeradoCorrespondeEquipamento(
          o,
          clienteId,
          equipamento,
          equipamentoIndex,
          clienteNome,
          numerosRelatorioEquip,
          equipamentosArmazem
        )
      ),
    [
      orcamentosGerados,
      clienteId,
      equipamento,
      equipamentoIndex,
      clienteNome,
      numerosRelatorioEquip,
      equipamentosArmazem,
    ]
  )

  const pedidosOrcamentoPendentes = useMemo(() => {
    const items: Array<
      | { tipo: 'pedido-relatorio'; data: PedidoOrcamentoRef }
      | { tipo: 'pedido-avulso'; data: PedidoAvulsoRef }
      | { tipo: 'orcamento'; data: OrcamentoGeradoRef }
    > = []
    for (const p of pedidosFiltrados) {
      const orc = findOrcamentoGeradoParaPedidoRelatorio(p, orcamentosEquipamento)
      const st = statusEfetivoPedidoRelatorio(p, orc)
      if (pedidoRelatorioPendente(st) && !pedidoRelatorioCancelado(st)) {
        items.push({ tipo: 'pedido-relatorio', data: p })
      }
    }
    for (const p of pedidosAvulsoFiltrados) {
      const orc = findOrcamentoGeradoParaPedidoAvulso(p, orcamentosEquipamento)
      if (pedidoAvulsoCancelado(p, orc)) continue
      const st = statusEfetivoPedidoAvulso(p, orc)
      if (pedidoAvulsoAprovado(st)) continue
      if (
        orc &&
        (orc.workflowStatus === 'gerado' ||
          orc.workflowStatus === 'cotacao_recebida' ||
          orcamentoGeradoPendente(orc.status))
      ) {
        continue
      }
      items.push({ tipo: 'pedido-avulso', data: p })
    }
    for (const o of orcamentosEquipamento) {
      if (orcamentoGeradoCancelado(o.status)) continue
      if (orcamentoGeradoAprovado(o.status)) continue
      if (o.workflowStatus === 'enviado_fornecedor') continue
      if (
        o.workflowStatus === 'gerado' ||
        o.workflowStatus === 'cotacao_recebida' ||
        orcamentoGeradoPendente(o.status)
      ) {
        items.push({ tipo: 'orcamento', data: o })
      }
    }
    return items
  }, [pedidosFiltrados, pedidosAvulsoFiltrados, orcamentosEquipamento])

  const orcamentosAprovados = useMemo(() => {
    const items: Array<
      | { tipo: 'pedido-relatorio'; data: PedidoOrcamentoRef }
      | { tipo: 'pedido-avulso'; data: PedidoAvulsoRef }
      | { tipo: 'orcamento'; data: OrcamentoGeradoRef }
    > = []
    const orcNums = new Set<string>()
    for (const p of pedidosFiltrados) {
      const orc = findOrcamentoGeradoParaPedidoRelatorio(p, orcamentosEquipamento)
      const st = statusEfetivoPedidoRelatorio(p, orc)
      if (pedidoRelatorioAprovado(st)) {
        items.push({ tipo: 'pedido-relatorio', data: p })
        if (orc) orcNums.add(orc.id)
      }
    }
    for (const p of pedidosAvulsoFiltrados) {
      const orc = findOrcamentoGeradoParaPedidoAvulso(p, orcamentosEquipamento)
      const st = statusEfetivoPedidoAvulso(p, orc)
      if (pedidoAvulsoAprovado(st)) {
        items.push({ tipo: 'pedido-avulso', data: p })
        if (orc) orcNums.add(orc.id)
      }
    }
    for (const o of orcamentosEquipamento) {
      if (orcamentoGeradoCancelado(o.status)) continue
      if (orcNums.has(o.id)) continue
      if (
        orcamentoGeradoAprovado(o.status) ||
        o.workflowStatus === 'pedido_confirmado' ||
        o.workflowStatus === 'aguardando_separacao' ||
        o.workflowStatus === 'mercadoria_recebida'
      ) {
        items.push({ tipo: 'orcamento', data: o })
      }
    }
    return items
  }, [pedidosFiltrados, pedidosAvulsoFiltrados, orcamentosEquipamento])

  const orcamentosCancelados = useMemo(() => {
    const items: Array<
      | { tipo: 'pedido-relatorio'; data: PedidoOrcamentoRef }
      | { tipo: 'pedido-avulso'; data: PedidoAvulsoRef }
      | { tipo: 'orcamento'; data: OrcamentoGeradoRef }
    > = []
    for (const p of pedidosFiltrados) {
      if (pedidoRelatorioCancelado(p.status)) items.push({ tipo: 'pedido-relatorio', data: p })
    }
    for (const p of pedidosAvulsoFiltrados) {
      const orc = findOrcamentoGeradoParaPedidoAvulso(p, orcamentosEquipamento)
      if (pedidoAvulsoCancelado(p, orc)) items.push({ tipo: 'pedido-avulso', data: p })
    }
    for (const o of orcamentosEquipamento) {
      if (orcamentoGeradoCancelado(o.status)) items.push({ tipo: 'orcamento', data: o })
    }
    return items
  }, [pedidosFiltrados, pedidosAvulsoFiltrados, orcamentosEquipamento])

  const gruposPorNumero = useMemo(() => {
    type Grupo = {
      numero: string
      relatorio?: RelatorioEquipamentoHistorico
      pedidosPecas: PedidoOrcamentoRef[]
    }
    const map = new Map<string, Grupo>()

    const ensure = (num: string): Grupo => {
      const n = String(num ?? '').trim()
      if (!map.has(n)) map.set(n, { numero: n, pedidosPecas: [] })
      return map.get(n)!
    }

    for (const rel of relatorios) {
      const g = ensure(rel.numero)
      if (!g.relatorio) g.relatorio = rel
    }

    for (const pedido of pedidosFiltrados) {
      const num = String(pedido.numeroRelatorio ?? '').trim()
      if (!num) continue
      const g = ensure(num)
      g.pedidosPecas.push(pedido)
    }

    return [...map.values()]
      .filter((g) => g.numero)
      .sort((a, b) => {
        const da = a.relatorio?.data ?? ''
        const db = b.relatorio?.data ?? ''
        if (da && db) return db.localeCompare(da)
        return b.numero.localeCompare(a.numero)
      })
  }, [relatorios, pedidosFiltrados])

  const equipLabel = [equipamento.modelo, equipamento.marca, equipamento.numeroSerie]
    .filter(Boolean)
    .join(' · ')

  const equipamentoIdHub = String(equipamento.id || equipamento.numeroSerie || `idx:${equipamentoIndex}`).trim()
  const equipamentoTextoHub =
    equipLabel || String(equipamento.tipoEquipamento || equipamentoIdHub).trim()

  const emitirCriarFaturaDeAprovado = (input: {
    orc?: OrcamentoGeradoRef | null
    pedidoRelatorio?: PedidoOrcamentoRef | null
    pedidoAvulso?: PedidoAvulsoRef | null
    sourceLabel: string
  }) => {
    if (!onCriarFaturaDeOrcamento) return
    const built = buildItensFaturaDeOrcamentoAprovado({
      orc: input.orc || null,
      pedidoRelatorio: input.pedidoRelatorio || null,
      pedidoAvulso: input.pedidoAvulso || null,
    })
    onCriarFaturaDeOrcamento({
      clienteId,
      clienteNome,
      equipamentoId: equipamentoIdHub,
      equipamentoTexto: equipamentoTextoHub,
      sourceLabel: input.sourceLabel,
      itens: built.itens,
      valorTotalHint: built.valorTotalHint,
    })
  }

  const labelCriarFaturaOrc =
    tr('hubEqCriarFaturaDeOrcamento') !== 'hubEqCriarFaturaDeOrcamento'
      ? tr('hubEqCriarFaturaDeOrcamento')
      : 'Criar fatura'

  const renderListaPecas = (
    pecas: Array<{ codigo: string; descricao: string; quantidade: number | string }>,
    keyPrefix: string
  ) => (
    <ul className="cliente-equip-hist__pecas-list">
      {pecas.map((p, i) => (
        <li key={`${keyPrefix}-${p.codigo}-${i}`} className="cliente-equip-hist__peca-item">
          <span className="cliente-equip-hist__peca-cod">{p.codigo || '—'}</span>
          <span className="cliente-equip-hist__peca-desc">{p.descricao || '—'}</span>
          <span className="cliente-equip-hist__peca-qtd">×{p.quantidade}</span>
        </li>
      ))}
    </ul>
  )

  const renderCardOrcamento = (o: OrcamentoGeradoRef, tag: string) => (
    <div key={`orc-${o.id}`} className="cliente-equip-hist__pedido-card">
      <div className="cliente-equip-hist__pedido-head">
        <span className="cliente-equip-hist__pedido-cod">{o.numeroOrcamento}</span>
        <span className="cliente-equip-hist__badge is-aprovado">{tag}</span>
      </div>
      {o.relatorioNumero && (
        <p className="cliente-equip-hist__line">
          {tr('numeroRelatorio')}: {o.relatorioNumero}
        </p>
      )}
      <p className="cliente-equip-hist__line">{o.descricao || '—'}</p>
      <p className="cliente-equip-hist__line">
        {fmtDate(o.dataCriacao || o.data)}
        {typeof o.total === 'number' && o.total > 0 ? ` · ${o.total.toFixed(2)} €` : ''}
      </p>
      {onCriarFaturaDeOrcamento && (
        <div className="cliente-equip-hist__pedido-actions">
          <button
            type="button"
            className="cliente-equip-hist__btn"
            onClick={() =>
              emitirCriarFaturaDeAprovado({
                orc: o,
                sourceLabel: o.numeroOrcamento || o.id,
              })
            }
          >
            💶 {labelCriarFaturaOrc}
          </button>
        </div>
      )}
    </div>
  )

  const renderSecaoResumo = (
    titulo: string,
    count: number,
    empty: string,
    children: React.ReactNode,
    open = count > 0
  ) => (
    <details className="cliente-equip-hist__secao" open={open}>
      <summary className="cliente-equip-hist__secao-summary">
        {titulo} <span className="cliente-equip-hist__secao-count">{count}</span>
      </summary>
      <div className="cliente-equip-hist__secao-body">
        {count === 0 ? <p className="cliente-equip-hist__col-empty">{empty}</p> : children}
      </div>
    </details>
  )

  const badgeWorkflow = (o: OrcamentoGeradoRef) => {
    if (o.workflowStatus === 'pedido_confirmado') return tr('pedidoConfirmado')
    if (o.workflowStatus === 'mercadoria_recebida') return tr('mercadoriaRecebida')
    if (o.workflowStatus === 'gerado') return tr('aguardaAprovacao')
    if (o.workflowStatus === 'cotacao_recebida') return tr('cotacaoRecebida')
    return tr('aguardaAprovacao')
  }

  const gruposComPecas = gruposPorNumero.filter(
    (g) => g.pedidosPecas.length > 0 || (g.relatorio != null && relatorioTemPecas(g.relatorio))
  )
  const gruposParaVista = vista === 'pecas' ? gruposComPecas : gruposPorNumero

  const faturasEquipamento = useMemo(
    () => filtrarFaturasDoEquipamento(faturasCliente, equipamento, equipamentoIndex),
    [faturasCliente, equipamento, equipamentoIndex]
  )

  const hubChips = useMemo(() => {
    const rsAbertos = relatorios.filter((r) => !r.servicoConcluido).length
    const fatPendentes = faturasEquipamento.filter((f) => f.status === 'pendente').length
    const fatVencidas = faturasEquipamento.filter((f) => f.status === 'vencida').length
    return buildHubEqChips({
      rsAbertos,
      orcPendentes: pedidosOrcamentoPendentes.length,
      fatPendentes,
      fatVencidas,
    })
  }, [relatorios, pedidosOrcamentoPendentes.length, faturasEquipamento])

  const timelineItems = useMemo(() => {
    const items: HubEqTimelineItem[] = []
    for (const rel of relatorios) {
      items.push({
        id: `rs-${rel.id}`,
        tipo: 'relatorio',
        dataIso: rel.data || '',
        titulo: `${tr('numeroRelatorio')} ${rel.numero}`,
        subtitulo: [rel.tecnico, rel.tipoServico].filter(Boolean).join(' · ') || undefined,
        statusLabel: rel.servicoConcluido
          ? tr('concluido') !== 'concluido'
            ? tr('concluido')
            : 'Concluído'
          : tr('emAberto') !== 'emAberto'
            ? tr('emAberto')
            : 'Em aberto',
        action: { kind: 'relatorio', id: rel.id },
      })
    }
    for (const p of pedidosFiltrados) {
      const st = badgePedido(p.status)
      items.push({
        id: `pr-${p.id}`,
        tipo: 'pedido',
        dataIso: p.dataGeracao || p.data || '',
        titulo: `${tr('pedidosOrcamento')} · ${p.numeroRelatorio || p.codigo || p.id}`,
        subtitulo: p.maquinaModelo || p.cliente,
        statusLabel: st.label,
        action: { kind: 'pedido-relatorio', id: p.id },
      })
    }
    for (const p of pedidosAvulsoFiltrados) {
      const orc = findOrcamentoGeradoParaPedidoAvulso(p, orcamentosEquipamento)
      const stRaw = statusEfetivoPedidoAvulso(p, orc) || 'pendente'
      items.push({
        id: `pa-${p.codigo}`,
        tipo: 'pedido',
        dataIso: p.dataGeracao || p.geradoEm || '',
        titulo: `${tr('hubEqTabPecas')} · ${p.codigo}`,
        subtitulo: p.equipamentoTexto || p.clienteNomeReal,
        statusLabel: String(stRaw),
        action: { kind: 'pedido-avulso', id: p.codigo },
      })
    }
    for (const o of orcamentosEquipamento) {
      items.push({
        id: `og-${o.id}`,
        tipo: 'orcamento',
        dataIso: o.dataCriacao || o.geradoEm || o.data || '',
        titulo: `${tr('hubEqTabOrcamentos')} · ${o.numeroOrcamento || o.id}`,
        subtitulo: o.descricao || badgeWorkflow(o),
        statusLabel: badgeWorkflow(o),
        action: { kind: 'orcamento', id: o.id },
      })
    }
    for (const f of faturasEquipamento) {
      const st =
        f.status === 'paga'
          ? tr('pagosLabel') !== 'pagosLabel'
            ? tr('pagosLabel')
            : 'Paga'
          : f.status === 'vencida'
            ? tr('vencida') !== 'vencida'
              ? tr('vencida')
              : 'Vencida'
            : f.status === 'cancelada'
              ? tr('cancelado') !== 'cancelado'
                ? tr('cancelado')
                : 'Cancelada'
              : tr('pendentesLabel') !== 'pendentesLabel'
                ? tr('pendentesLabel')
                : 'Pendente'
      items.push({
        id: `fat-${f.id}`,
        tipo: 'fatura',
        dataIso: f.dataEmissao || '',
        titulo: `${tr('clienteFaturasTitle') !== 'clienteFaturasTitle' ? tr('clienteFaturasTitle') : 'Fatura'} ${f.numeroFatura || f.id}`,
        subtitulo:
          typeof f.valorTotal === 'number' ? `${f.valorTotal.toFixed(2)} €` : undefined,
        statusLabel: st,
        action: {
          kind: 'fatura',
          id: f.id,
          arquivoAnexo: f.arquivoAnexo,
        },
      })
    }
    return sortHubEqTimeline(items)
  }, [
    relatorios,
    pedidosFiltrados,
    pedidosAvulsoFiltrados,
    orcamentosEquipamento,
    faturasEquipamento,
    language,
    safeT,
  ])

  const emptyMsgKey =
    vista === 'pecas'
      ? 'hubEqPecasVazio'
      : vista === 'orcamentos'
        ? 'hubEqOrcamentosVazio'
        : vista === 'relatorios'
          ? 'hubEqRelatoriosVazio'
          : vista === 'timeline'
            ? 'hubEqTimelineVazio'
            : 'nenhumHistoricoEquipamento'

  const barraEstado = mostrarBarraEstado ? (
    <div
      className="cliente-equip-hist__estado"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '14px',
      }}
    >
      {hubChips.map((chip) => {
        const tone = hubEqChipToneStyle(chip.tone)
        return (
          <span
            key={chip.id}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.02em',
              ...tone,
            }}
          >
            {tr(chip.labelKey) !== chip.labelKey ? tr(chip.labelKey) : chip.fallback}
            {chip.count > 0 ? (
              <span style={{ opacity: 0.9 }}>({chip.count})</span>
            ) : null}
          </span>
        )
      })}
    </div>
  ) : null

  if (showTimeline) {
    if (timelineItems.length === 0) {
      return (
        <div className="cliente-equip-hist cliente-equip-hist--empty">
          {barraEstado}
          <p className="cliente-equip-hist__empty">{tr(emptyMsgKey)}</p>
        </div>
      )
    }
    return (
      <div className="cliente-equip-hist">
        {barraEstado}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {timelineItems.map((item) => {
            const clickable = Boolean(item.action && onAbrirTimelineItem)
            const rowStyle: React.CSSProperties = {
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              gap: '12px',
              alignItems: 'start',
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(0, 200, 83, 0.18)',
              background: 'rgba(0,0,0,0.28)',
              width: '100%',
              textAlign: 'left',
              color: 'inherit',
              font: 'inherit',
              cursor: clickable ? 'pointer' : undefined,
              transition: 'border-color 0.15s ease, background 0.15s ease',
            }
            const titleAbrir = 'Abrir'
            if (clickable) {
              return (
                <button
                  key={item.id}
                  type="button"
                  className="cliente-equip-hist__timeline-item is-clickable"
                  title={titleAbrir}
                  aria-label={titleAbrir}
                  onClick={() => onAbrirTimelineItem?.(item)}
                  style={rowStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 200, 83, 0.55)'
                    e.currentTarget.style.background = 'rgba(0, 200, 83, 0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 200, 83, 0.18)'
                    e.currentTarget.style.background = 'rgba(0,0,0,0.28)'
                  }}
                >
                  <span style={{ fontSize: '18px', lineHeight: 1 }}>{hubEqTimelineTipoIcon(item.tipo)}</span>
                  <div>
                    <div style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>{item.titulo}</div>
                    {item.subtitulo ? (
                      <div style={{ marginTop: '4px', fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>
                        {item.subtitulo}
                      </div>
                    ) : null}
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '11px', color: 'rgba(185,255,208,0.85)' }}>
                    <div>{item.dataIso ? fmtDate(item.dataIso) : '—'}</div>
                    {item.statusLabel ? (
                      <div style={{ marginTop: '4px', color: 'rgba(255,255,255,0.55)' }}>{item.statusLabel}</div>
                    ) : null}
                  </div>
                </button>
              )
            }
            return (
              <div key={item.id} className="cliente-equip-hist__timeline-item" style={rowStyle}>
                <span style={{ fontSize: '18px', lineHeight: 1 }}>{hubEqTimelineTipoIcon(item.tipo)}</span>
                <div>
                  <div style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>{item.titulo}</div>
                  {item.subtitulo ? (
                    <div style={{ marginTop: '4px', fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>
                      {item.subtitulo}
                    </div>
                  ) : null}
                </div>
                <div style={{ textAlign: 'right', fontSize: '11px', color: 'rgba(185,255,208,0.85)' }}>
                  <div>{item.dataIso ? fmtDate(item.dataIso) : '—'}</div>
                  {item.statusLabel ? (
                    <div style={{ marginTop: '4px', color: 'rgba(255,255,255,0.55)' }}>{item.statusLabel}</div>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (
    (vista === 'relatorios' && gruposPorNumero.length === 0) ||
    (vista === 'pecas' && gruposComPecas.length === 0) ||
    (vista === 'orcamentos' &&
      pedidosOrcamentoPendentes.length === 0 &&
      orcamentosAprovados.length === 0 &&
      orcamentosCancelados.length === 0) ||
    (vista === 'todas' &&
      gruposPorNumero.length === 0 &&
      pedidosAvulsoFiltrados.length === 0 &&
      orcamentosEquipamento.length === 0)
  ) {
    return (
      <div className="cliente-equip-hist cliente-equip-hist--empty">
        {barraEstado}
        <p className="cliente-equip-hist__empty">{tr(emptyMsgKey)}</p>
      </div>
    )
  }

  return (
    <div className="cliente-equip-hist">
      {barraEstado}
      {vista === 'todas' && (
      <div className="cliente-equip-hist__header">
        <h4 className="cliente-equip-hist__title">📂 {tr('equipHistoricoDesteEquipamento')}</h4>
        {equipLabel && <p className="cliente-equip-hist__equip-label">{equipLabel}</p>}
        <p className="cliente-equip-hist__hint">{tr('equipHistoricoIsoladoHint')}</p>
        <p className="cliente-equip-hist__meta">
          {gruposPorNumero.length} {tr('relatoriosNumerados')} · {pedidosOrcamentoPendentes.length}{' '}
          {tr('pedidosOrcamento').toLowerCase()} · {orcamentosAprovados.length} {tr('aprovado').toLowerCase()}
          {orcamentosCancelados.length > 0 ? ` · ${orcamentosCancelados.length} ${tr('cancelado').toLowerCase()}` : ''}
        </p>
      </div>
      )}

      {showGrupos && renderSecaoResumo(
        vista === 'pecas'
          ? `🔧 ${tr('hubEqTabPecas')}`
          : vista === 'relatorios'
            ? `📋 ${tr('hubEqTabRelatorios')}`
            : `📋 ${tr('relatorioServico')} / ${tr('relatoriosNumerados').replace(/\(s\).*/, '')}`,
        gruposParaVista.length,
        tr(emptyMsgKey),
        <div className="cliente-equip-hist__grupos">
          {gruposParaVista.map((grupo) => {
          const rel = grupo.relatorio
          const temPecasNoRel = rel ? relatorioTemPecas(rel) : false
          const pecasRel = rel ? todasPecasRelatorio(rel) : []
          const divida = rel && relatorioComDivida?.(rel.id)
          const pecasLabel =
            pecasRel.length === 1 ? tr('pecaSingular') : tr('pecasPlural')

          return (
            <article key={grupo.numero} className="cliente-equip-hist__grupo">
              <header className="cliente-equip-hist__grupo-head">
                <span className="cliente-equip-hist__grupo-num">
                  {tr('numeroRelatorio')} <strong>{grupo.numero}</strong>
                </span>
                {rel?.data && (
                  <span className="cliente-equip-hist__grupo-data">{fmtDate(rel.data)}</span>
                )}
                {divida && (
                  <span className="cliente-equip-hist__grupo-alerta">{tr('clienteRelatorioDivida')}</span>
                )}
              </header>

              <div className="cliente-equip-hist__cols">
                {showColServico && (
                <section className="cliente-equip-hist__col cliente-equip-hist__col--servico">
                  <h5 className="cliente-equip-hist__col-title">
                    📋 {tr('relatorioServico')}
                  </h5>
                  {!rel ? (
                    <p className="cliente-equip-hist__col-empty">{tr('relatorioNaoEncontrado')}</p>
                  ) : (
                    <div className={`cliente-equip-hist__servico-card${divida ? ' is-divida' : ''}`}>
                      <p className="cliente-equip-hist__line">
                        <span>{tr('tecnico')}:</span> {rel.tecnico || '—'}
                      </p>
                      {rel.tipoServico && (
                        <p className="cliente-equip-hist__line">
                          <span>{tr('tipoServico')}:</span> {rel.tipoServico}
                        </p>
                      )}
                      <p className="cliente-equip-hist__line">
                        <span>{tr('estado')}:</span>{' '}
                        {rel.servicoConcluido ? tr('concluido') : tr('emAberto')}
                      </p>
                      {!temPecasNoRel && (
                        <p className="cliente-equip-hist__col-hint">{tr('relatorioSomenteServico')}</p>
                      )}
                      {onVerRelatorio && (
                        <button
                          type="button"
                          className="cliente-equip-hist__btn cliente-equip-hist__btn--ver"
                          onClick={() => onVerRelatorio(rel)}
                        >
                          👁️ {tr('verRelatorio')}
                        </button>
                      )}
                    </div>
                  )}
                </section>
                )}

                {showColPecas && (
                <section className="cliente-equip-hist__col cliente-equip-hist__col--com-pecas">
                  <h5 className="cliente-equip-hist__col-title">
                    🔧 {tr('relatorioComPecas')}
                  </h5>
                  {!temPecasNoRel || pecasRel.length === 0 ? (
                    <p className="cliente-equip-hist__col-empty">{tr('semPecasNoRelatorio')}</p>
                  ) : (
                    <div className="cliente-equip-hist__pecas-block">
                      <p className="cliente-equip-hist__pecas-ref">
                        {tr('referenteRelatorio')} <strong>{grupo.numero}</strong> · {pecasRel.length}{' '}
                        {pecasLabel}
                      </p>
                      {renderListaPecas(pecasRel, `rel-${grupo.numero}`)}
                    </div>
                  )}
                </section>
                )}

                {showColPecas && (
                <section className="cliente-equip-hist__col cliente-equip-hist__col--somente-pecas">
                  <h5 className="cliente-equip-hist__col-title">
                    📦 {tr('somentePecas')}
                  </h5>
                  {grupo.pedidosPecas.length === 0 ? (
                    <p className="cliente-equip-hist__col-empty">{tr('semPedidoPecasRelatorio')}</p>
                  ) : (
                    grupo.pedidosPecas.map((pedido) => {
                      const orc = findOrcamentoGeradoParaPedidoRelatorio(pedido, orcamentosEquipamento)
                      const status = statusEfetivoPedidoRelatorio(pedido, orc)
                      const badge = badgePedido(status)
                      const pecas = pedido.pecas ?? []
                      return (
                        <div key={pedido.id} className="cliente-equip-hist__pedido-card">
                          <div className="cliente-equip-hist__pedido-head">
                            <span className="cliente-equip-hist__pedido-cod">
                              {pedido.codigo || pedido.numeroRelatorio}
                            </span>
                            <span className={`cliente-equip-hist__badge ${badge.cls}`}>{badge.label}</span>
                          </div>
                          <p className="cliente-equip-hist__pecas-ref">
                            {tr('referenteRelatorio')} <strong>{pedido.numeroRelatorio}</strong>
                          </p>
                          {pecas.length > 0 ? (
                            renderListaPecas(pecas, `ped-${pedido.id}`)
                          ) : (
                            <p className="cliente-equip-hist__col-empty">{tr('pedidoSemPecas')}</p>
                          )}
                          <div className="cliente-equip-hist__pedido-actions">
                            {onVisualizarPdfRelatorio && (
                              <button
                                type="button"
                                className="cliente-equip-hist__btn"
                                onClick={() => onVisualizarPdfRelatorio(pedido)}
                              >
                                👁️ {tr('visualizarPdfBtn')}
                              </button>
                            )}
                            {onUpdatePedidoRelatorioStatus && pedidoRelatorioPendente(status) && (
                              <button
                                type="button"
                                className="cliente-equip-hist__btn cliente-equip-hist__btn--ok"
                                onClick={() => onUpdatePedidoRelatorioStatus(pedido.id, 'aprovado')}
                              >
                                ✓ {tr('aprovar')}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </section>
                )}
              </div>
            </article>
          )
        })}
        </div>,
        gruposParaVista.length > 0
      )}

      {showOrcamentos && renderSecaoResumo(
        `📨 ${tr('pedidosOrcamento')}`,
        pedidosOrcamentoPendentes.length,
        tr('semPedidoPecasRelatorio'),
        <div className="cliente-equip-hist__lista-orc">
          {pedidosOrcamentoPendentes.map((item) => {
            if (item.tipo === 'pedido-relatorio') {
              const pedido = item.data
              const orc = findOrcamentoGeradoParaPedidoRelatorio(pedido, orcamentosEquipamento)
              const status = statusEfetivoPedidoRelatorio(pedido, orc)
              const badge = badgePedido(status)
              const pecas = pedido.pecas ?? []
              return (
                <div key={`pend-rel-${pedido.id}`} className="cliente-equip-hist__pedido-card">
                  <div className="cliente-equip-hist__pedido-head">
                    <span className="cliente-equip-hist__pedido-cod">
                      {pedido.codigo || pedido.numeroRelatorio}
                    </span>
                    <span className={`cliente-equip-hist__badge ${badge.cls}`}>{badge.label}</span>
                  </div>
                  <p className="cliente-equip-hist__line">
                    {tr('numeroRelatorio')}: {pedido.numeroRelatorio}
                  </p>
                  {pecas.length > 0 ? (
                    renderListaPecas(pecas, `pend-rel-${pedido.id}`)
                  ) : (
                    <p className="cliente-equip-hist__col-empty">{tr('pedidoSemPecas')}</p>
                  )}
                  <div className="cliente-equip-hist__pedido-actions">
                    {onVisualizarPdfRelatorio && (
                      <button
                        type="button"
                        className="cliente-equip-hist__btn"
                        onClick={() => onVisualizarPdfRelatorio(pedido)}
                      >
                        👁️ {tr('visualizarPdfBtn')}
                      </button>
                    )}
                    {onUpdatePedidoRelatorioStatus && pedidoRelatorioPendente(status) && (
                      <button
                        type="button"
                        className="cliente-equip-hist__btn cliente-equip-hist__btn--ok"
                        onClick={() => onUpdatePedidoRelatorioStatus(pedido.id, 'aprovado')}
                      >
                        ✓ {tr('aprovar')}
                      </button>
                    )}
                  </div>
                </div>
              )
            }
            if (item.tipo === 'pedido-avulso') {
              const p = item.data
              const wf = p.workflowStatus === 'enviado_fornecedor' ? tr('statusEnviado') : tr('aguardaAprovacao')
              return (
                <div key={`pend-av-${p.codigo}`} className="cliente-equip-hist__pedido-card">
                  <div className="cliente-equip-hist__pedido-head">
                    <span className="cliente-equip-hist__pedido-cod">{p.codigo}</span>
                    <span className="cliente-equip-hist__badge is-pendente">{wf}</span>
                  </div>
                  {p.equipamentoTexto && (
                    <p className="cliente-equip-hist__line">{p.equipamentoTexto}</p>
                  )}
                  {(p.pecas?.length ?? 0) > 0 && renderListaPecas(p.pecas!, `pend-av-${p.codigo}`)}
                  <div className="cliente-equip-hist__pedido-actions">
                    {onVisualizarPdfAvulso && (
                      <button
                        type="button"
                        className="cliente-equip-hist__btn"
                        onClick={() => onVisualizarPdfAvulso(p)}
                      >
                        👁️ {tr('visualizarPdfBtn')}
                      </button>
                    )}
                  </div>
                </div>
              )
            }
            const o = item.data
            return (
              <div key={`pend-orc-${o.id}`} className="cliente-equip-hist__pedido-card">
                <div className="cliente-equip-hist__pedido-head">
                  <span className="cliente-equip-hist__pedido-cod">{o.numeroOrcamento}</span>
                  <span className="cliente-equip-hist__badge is-pendente">{badgeWorkflow(o)}</span>
                </div>
                <p className="cliente-equip-hist__line">{o.descricao || '—'}</p>
                <p className="cliente-equip-hist__line">
                  {fmtDate(o.dataCriacao || o.data)}
                  {typeof o.total === 'number' && o.total > 0 ? ` · ${o.total.toFixed(2)} €` : ''}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {showOrcamentos && renderSecaoResumo(
        `✅ ${tr('aprovado')} — ${tr('orcamentosGerados')}`,
        orcamentosAprovados.length,
        tr('nenhumOrcamentoEquipamento'),
        <div className="cliente-equip-hist__lista-orc">
          {orcamentosAprovados.map((item) => {
            if (item.tipo === 'pedido-relatorio') {
              const pedido = item.data
              const orc = findOrcamentoGeradoParaPedidoRelatorio(pedido, orcamentosEquipamento)
              return (
                <div key={`ap-rel-${pedido.id}`} className="cliente-equip-hist__pedido-card">
                  <div className="cliente-equip-hist__pedido-head">
                    <span className="cliente-equip-hist__pedido-cod">
                      {pedido.codigo || pedido.numeroRelatorio}
                    </span>
                    <span className="cliente-equip-hist__badge is-aprovado">{tr('aprovado')}</span>
                  </div>
                  <p className="cliente-equip-hist__line">
                    {tr('numeroRelatorio')}: {pedido.numeroRelatorio}
                  </p>
                  {orc && (
                    <p className="cliente-equip-hist__line">
                      {tr('orcamentosGerados')}: {orc.numeroOrcamento}
                      {typeof orc.total === 'number' && orc.total > 0 ? ` · ${orc.total.toFixed(2)} €` : ''}
                    </p>
                  )}
                  {onCriarFaturaDeOrcamento && (
                    <div className="cliente-equip-hist__pedido-actions">
                      <button
                        type="button"
                        className="cliente-equip-hist__btn"
                        onClick={() =>
                          emitirCriarFaturaDeAprovado({
                            orc,
                            pedidoRelatorio: pedido,
                            sourceLabel:
                              orc?.numeroOrcamento ||
                              pedido.codigo ||
                              pedido.numeroRelatorio ||
                              pedido.id,
                          })
                        }
                      >
                        💶 {labelCriarFaturaOrc}
                      </button>
                    </div>
                  )}
                </div>
              )
            }
            if (item.tipo === 'pedido-avulso') {
              const p = item.data
              const orc = findOrcamentoGeradoParaPedidoAvulso(p, orcamentosEquipamento)
              const tag =
                orc?.workflowStatus === 'mercadoria_recebida'
                  ? tr('mercadoriaRecebida') || 'Mercadoria recebida'
                  : orc?.workflowStatus === 'pedido_confirmado'
                    ? tr('pedidoConfirmado') || 'Pedido confirmado'
                    : tr('aprovado')
              return (
                <div key={`ap-av-${p.codigo}`} className="cliente-equip-hist__pedido-card">
                  <div className="cliente-equip-hist__pedido-head">
                    <span className="cliente-equip-hist__pedido-cod">{p.codigo}</span>
                    <span className="cliente-equip-hist__badge is-aprovado">{tag}</span>
                  </div>
                  {orc && (
                    <p className="cliente-equip-hist__line">
                      {orc.descricao || p.equipamentoTexto || '—'}
                      {typeof orc.total === 'number' && orc.total > 0 ? ` · ${orc.total.toFixed(2)} €` : ''}
                    </p>
                  )}
                  {onCriarFaturaDeOrcamento && (
                    <div className="cliente-equip-hist__pedido-actions">
                      <button
                        type="button"
                        className="cliente-equip-hist__btn"
                        onClick={() =>
                          emitirCriarFaturaDeAprovado({
                            orc,
                            pedidoAvulso: p,
                            sourceLabel: orc?.numeroOrcamento || p.codigo,
                          })
                        }
                      >
                        💶 {labelCriarFaturaOrc}
                      </button>
                    </div>
                  )}
                </div>
              )
            }
            const o = item.data
            return renderCardOrcamento(o, badgeWorkflow(o))
          })}
        </div>
      )}

      {showOrcamentos && renderSecaoResumo(
        `❌ ${tr('cancelado')} / ${tr('rejeitado')}`,
        orcamentosCancelados.length,
        tr('nenhumOrcamentoFiltro'),
        <div className="cliente-equip-hist__lista-orc">
          {orcamentosCancelados.map((item) => {
            if (item.tipo === 'pedido-relatorio') {
              const pedido = item.data
              const badge = badgePedido(pedido.status)
              return (
                <div key={`cx-rel-${pedido.id}`} className="cliente-equip-hist__pedido-card">
                  <div className="cliente-equip-hist__pedido-head">
                    <span className="cliente-equip-hist__pedido-cod">
                      {pedido.codigo || pedido.numeroRelatorio}
                    </span>
                    <span className={`cliente-equip-hist__badge ${badge.cls}`}>{badge.label}</span>
                  </div>
                  <p className="cliente-equip-hist__line">
                    {tr('numeroRelatorio')}: {pedido.numeroRelatorio}
                  </p>
                </div>
              )
            }
            if (item.tipo === 'pedido-avulso') {
              const p = item.data
              return (
                <div key={`cx-av-${p.codigo}`} className="cliente-equip-hist__pedido-card">
                  <div className="cliente-equip-hist__pedido-head">
                    <span className="cliente-equip-hist__pedido-cod">{p.codigo}</span>
                    <span className="cliente-equip-hist__badge is-rejeitado">{tr('cancelado')}</span>
                  </div>
                  {p.equipamentoTexto && (
                    <p className="cliente-equip-hist__line">{p.equipamentoTexto}</p>
                  )}
                </div>
              )
            }
            const o = item.data
            return (
              <div key={`cx-orc-${o.id}`} className="cliente-equip-hist__pedido-card">
                <div className="cliente-equip-hist__pedido-head">
                  <span className="cliente-equip-hist__pedido-cod">{o.numeroOrcamento}</span>
                  <span className="cliente-equip-hist__badge is-rejeitado">{tr('cancelado')}</span>
                </div>
                <p className="cliente-equip-hist__line">{o.descricao || '—'}</p>
              </div>
            )
          })}
        </div>,
        false
      )}
    </div>
  )
}
