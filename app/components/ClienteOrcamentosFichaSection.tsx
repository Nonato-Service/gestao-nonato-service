'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  OrcamentoGeradoRef,
  PedidoAvulsoRef,
  PedidoOrcamentoRef,
  EquipamentoClienteRef,
  pedidoRelatorioCorrespondeEquipamento,
  pedidoAvulsoCorrespondeEquipamento,
  orcamentoGeradoCorrespondeEquipamento,
  pedidoRelatorioCorrespondeCliente,
  pedidoAvulsoCorrespondeCliente,
  orcamentoGeradoCorrespondeCliente,
  pedidoRelatorioPendenteComOrcamento,
  pedidoRelatorioAprovadoComOrcamento,
  pedidoAvulsoPendente,
  pedidoAvulsoAprovado,
  orcamentoGeradoPendente,
  orcamentoGeradoAprovado,
  rotuloEquipamentoPedidoRelatorio,
  rotuloEquipamentoPedidoAvulso,
  rotuloEquipamentoOrcamentoGerado,
  dedupePedidosRelatorioCliente,
  findOrcamentoGeradoParaPedidoRelatorio,
  statusEfetivoPedidoRelatorio,
  chaveOrcamentoRelatorioJaTemPedido,
} from '../lib/clienteEquipamentoOrcamentos'

type FiltroOrigem = 'todos' | 'relatorio' | 'avulso'
type FiltroEstado = 'todos' | 'pendentes' | 'aprovados'

type Props = {
  clienteId: string
  clienteNome: string
  equipamentos: EquipamentoClienteRef[]
  pedidosRelatorio: PedidoOrcamentoRef[]
  safeT: Record<string, string | undefined>
  loadData?: (key: string) => Promise<unknown>
  onUpdatePedidoRelatorioStatus?: (id: string, status: PedidoOrcamentoRef['status']) => void
  onVisualizarPdfRelatorio?: (pedido: PedidoOrcamentoRef) => void
  onVisualizarPdfAvulso?: (pedido: PedidoAvulsoRef) => void
  onAtualizarPedidoAvulso?: (pedidos: PedidoAvulsoRef[]) => void
  onAtualizarOrcamentosGerados?: (orcamentos: OrcamentoGeradoRef[]) => void
}

const PEDIDOS_AVULSO_KEY = 'nonato-pedidos-orcamento-avulso'
const ORCAMENTOS_AVULSO_KEY = 'nonato-orcamentos-avulso'

export function ClienteOrcamentosFichaSection({
  clienteId,
  clienteNome,
  equipamentos,
  pedidosRelatorio,
  safeT,
  loadData,
  onUpdatePedidoRelatorioStatus,
  onVisualizarPdfRelatorio,
  onVisualizarPdfAvulso,
  onAtualizarPedidoAvulso,
  onAtualizarOrcamentosGerados,
}: Props) {
  const [filtroOrigem, setFiltroOrigem] = useState<FiltroOrigem>('todos')
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos')
  const [filtroEquipamento, setFiltroEquipamento] = useState<string>('todos')
  const [pedidosAvulso, setPedidosAvulso] = useState<PedidoAvulsoRef[]>([])
  const [orcamentosGerados, setOrcamentosGerados] = useState<OrcamentoGeradoRef[]>([])

  useEffect(() => {
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
  }, [loadData, clienteId])

  const pedidosRelatorioCliente = useMemo(
    () =>
      dedupePedidosRelatorioCliente(
        pedidosRelatorio.filter((p) => pedidoRelatorioCorrespondeCliente(p, clienteId, clienteNome))
      ),
    [pedidosRelatorio, clienteId, clienteNome]
  )

  const pedidosAvulsoCliente = useMemo(
    () => pedidosAvulso.filter((p) => pedidoAvulsoCorrespondeCliente(p, clienteId, clienteNome)),
    [pedidosAvulso, clienteId, clienteNome]
  )

  const orcamentosGeradosCliente = useMemo(
    () => orcamentosGerados.filter((o) => orcamentoGeradoCorrespondeCliente(o, clienteId, clienteNome)),
    [orcamentosGerados, clienteId, clienteNome]
  )

  const numerosRelatorioCliente = useMemo(
    () => pedidosRelatorioCliente.map((p) => p.numeroRelatorio),
    [pedidosRelatorioCliente]
  )

  const passaFiltroEquipamento = (
    eqIndex: number,
    equipamento: EquipamentoClienteRef,
    pedidoRel?: PedidoOrcamentoRef,
    pedidoAv?: PedidoAvulsoRef,
    orc?: OrcamentoGeradoRef
  ) => {
    if (filtroEquipamento === 'todos') return true
    const idx = parseInt(filtroEquipamento, 10)
    if (Number.isNaN(idx)) return true
    if (pedidoRel) {
      return pedidoRelatorioCorrespondeEquipamento(pedidoRel, clienteId, equipamento, idx, clienteNome)
    }
    if (pedidoAv) {
      return pedidoAvulsoCorrespondeEquipamento(pedidoAv, clienteId, equipamento, idx, clienteNome)
    }
    if (orc) {
      return orcamentoGeradoCorrespondeEquipamento(
        orc,
        clienteId,
        equipamento,
        idx,
        clienteNome,
        numerosRelatorioCliente
      )
    }
    return eqIndex === idx
  }

  const orcamentosRelatorio = useMemo(
    () =>
      orcamentosGeradosCliente.filter(
        (o) =>
          o.tipo === 'orcamento-relatorio' ||
          o.tipo === 'cliente-cadastrado' ||
          Boolean(o.relatorioId || o.relatorioNumero)
      ),
    [orcamentosGeradosCliente]
  )

  const orcamentosAvulso = useMemo(
    () => orcamentosGeradosCliente.filter((o) => o.tipo === 'pedido-avulso'),
    [orcamentosGeradosCliente]
  )

  const itensVisiveis = useMemo(() => {
    type Item =
      | {
          kind: 'relatorio-unificado'
          pedido: PedidoOrcamentoRef
          orcamento?: OrcamentoGeradoRef
          equipLabel: string
        }
      | { kind: 'relatorio-orc-solo'; data: OrcamentoGeradoRef; equipLabel: string }
      | { kind: 'avulso-pedido'; data: PedidoAvulsoRef; equipLabel: string }
      | { kind: 'avulso-orc'; data: OrcamentoGeradoRef; equipLabel: string }

    const items: Item[] = []

    const encaixaEquipamento = (
      pedidoRel?: PedidoOrcamentoRef,
      pedidoAv?: PedidoAvulsoRef,
      orc?: OrcamentoGeradoRef
    ) => {
      if (filtroEquipamento === 'todos') return true
      const idx = parseInt(filtroEquipamento, 10)
      if (Number.isNaN(idx) || !equipamentos[idx]) return false
      return passaFiltroEquipamento(idx, equipamentos[idx], pedidoRel, pedidoAv, orc)
    }

    if (filtroOrigem === 'todos' || filtroOrigem === 'relatorio') {
      pedidosRelatorioCliente.forEach((p) => {
        const orc = findOrcamentoGeradoParaPedidoRelatorio(p, orcamentosRelatorio)
        if (!encaixaEquipamento(p, undefined, orc)) return
        items.push({
          kind: 'relatorio-unificado',
          pedido: p,
          orcamento: orc,
          equipLabel: rotuloEquipamentoPedidoRelatorio(p),
        })
      })
      orcamentosRelatorio.forEach((o) => {
        if (chaveOrcamentoRelatorioJaTemPedido(o, pedidosRelatorioCliente)) return
        if (!encaixaEquipamento(undefined, undefined, o)) return
        items.push({
          kind: 'relatorio-orc-solo',
          data: o,
          equipLabel: rotuloEquipamentoOrcamentoGerado(o),
        })
      })
    }
    if (filtroOrigem === 'todos' || filtroOrigem === 'avulso') {
      pedidosAvulsoCliente.forEach((p) => {
        if (!encaixaEquipamento(undefined, p)) return
        items.push({ kind: 'avulso-pedido', data: p, equipLabel: rotuloEquipamentoPedidoAvulso(p) })
      })
      orcamentosAvulso.forEach((o) => {
        if (!encaixaEquipamento(undefined, undefined, o)) return
        items.push({ kind: 'avulso-orc', data: o, equipLabel: rotuloEquipamentoOrcamentoGerado(o) })
      })
    }

    return items.filter((item) => {
      if (filtroEstado === 'todos') return true
      if (item.kind === 'relatorio-unificado') {
        return filtroEstado === 'pendentes'
          ? pedidoRelatorioPendenteComOrcamento(item.pedido, item.orcamento)
          : pedidoRelatorioAprovadoComOrcamento(item.pedido, item.orcamento)
      }
      if (item.kind === 'relatorio-orc-solo') {
        return filtroEstado === 'pendentes'
          ? orcamentoGeradoPendente(item.data.status)
          : orcamentoGeradoAprovado(item.data.status)
      }
      if (item.kind === 'avulso-pedido') {
        return filtroEstado === 'pendentes'
          ? pedidoAvulsoPendente(item.data.status)
          : pedidoAvulsoAprovado(item.data.status)
      }
      return filtroEstado === 'pendentes'
        ? orcamentoGeradoPendente(item.data.status)
        : orcamentoGeradoAprovado(item.data.status)
    })
  }, [
    filtroOrigem,
    filtroEstado,
    filtroEquipamento,
    pedidosRelatorioCliente,
    pedidosAvulsoCliente,
    orcamentosRelatorio,
    orcamentosAvulso,
    equipamentos,
  ])

  const totalRelatorio = useMemo(() => {
    const pedidosKeys = new Set(
      pedidosRelatorioCliente.map((p) =>
        [
          String(p.numeroRelatorio ?? '').trim(),
          String(p.relatorioId ?? '').trim(),
          String(p.equipamentoId ?? '').trim(),
        ].join('::')
      )
    )
    const orfaos = orcamentosRelatorio.filter((o) => !chaveOrcamentoRelatorioJaTemPedido(o, pedidosRelatorioCliente)).length
    return pedidosKeys.size + orfaos
  }, [pedidosRelatorioCliente, orcamentosRelatorio])
  const totalAvulso = pedidosAvulsoCliente.length + orcamentosAvulso.length

  const atualizarStatusAvulso = async (codigo: string, status: PedidoAvulsoRef['status']) => {
    const novos = pedidosAvulso.map((p) => (p.codigo === codigo ? { ...p, status } : p))
    setPedidosAvulso(novos)
    onAtualizarPedidoAvulso?.(novos)
    const novosOrc = orcamentosGerados.map((o) =>
      o.id === `avulso-${codigo}` ? { ...o, status } : o
    )
    setOrcamentosGerados(novosOrc)
    onAtualizarOrcamentosGerados?.(novosOrc)
  }

  const badgeRelatorio = (status: PedidoOrcamentoRef['status']) => {
    if (status === 'aprovado') return { bg: 'rgba(0,200,83,0.15)', color: '#00c853', label: safeT?.aprovado || 'Aprovado' }
    if (status === 'rejeitado') return { bg: 'rgba(255,68,68,0.15)', color: '#ff6666', label: safeT?.rejeitado || 'Rejeitado' }
    if (status === 'enviado') return { bg: 'rgba(77,166,255,0.15)', color: '#4da6ff', label: safeT?.statusEnviado || 'Enviado' }
    if (status === 'recebido') return { bg: 'rgba(0,200,83,0.1)', color: '#7dd3a8', label: safeT?.statusRecebido || 'Recebido' }
    return {
      bg: 'rgba(255,170,0,0.15)',
      color: '#ffaa00',
      label: safeT?.aguardaAprovacao || safeT?.pendentesAprovacao || 'Aguarda aprovação',
    }
  }

  const badgeAvulso = (status?: PedidoAvulsoRef['status']) => {
    if (status === 'aprovado') return { bg: 'rgba(0,200,83,0.15)', color: '#00c853', label: safeT?.aprovado || 'Aprovado' }
    if (status === 'concluido') return { bg: 'rgba(0,200,83,0.12)', color: '#7dd3a8', label: safeT?.concluido || 'Concluído' }
    if (status === 'entregue') return { bg: 'rgba(0,200,83,0.2)', color: '#00c853', label: safeT?.entregue || 'Entregue' }
    if (status === 'cancelado') return { bg: 'rgba(255,68,68,0.15)', color: '#ff6666', label: safeT?.cancelado || 'Cancelado' }
    return { bg: 'rgba(255,170,0,0.15)', color: '#ffaa00', label: safeT?.pendente || 'Pendente' }
  }

  return (
    <section className="cliente-detalhe-v2__card cliente-detalhe-v2__orcamentos">
      <h3 className="cliente-detalhe-v2__section-title cliente-detalhe-v2__section-title--solo">
        <span className="cliente-detalhe-v2__euro-icon">💰</span>
        {safeT?.orcamentosClienteTitulo || 'Orçamentos do cliente'}
      </h3>
      <p className="cliente-detalhe-v2__orcamentos-meta cliente-detalhe-v2__orcamentos-meta--visual">
        {safeT?.orcamentosClienteSomenteVisual ||
          'Consulta visual — gerir orçamentos em Orçamentos → Orçamentos Gerados.'}
      </p>
      <p className="cliente-detalhe-v2__orcamentos-meta">
        {totalRelatorio} {safeT?.doRelatorio || 'do relatório'} · {totalAvulso} {safeT?.avulsos || 'avulsos'}
      </p>

      <div className="cliente-orc-ficha-filters">
        {equipamentos.length > 0 && (
          <div className="cliente-orc-ficha-filters__group cliente-orc-ficha-filters__group--equip">
            <label className="cliente-orc-ficha-filters__label" htmlFor="cliente-orc-equip-filter">
              {safeT?.filtrarPorEquipamento || 'Filtrar por equipamento'}
            </label>
            <select
              id="cliente-orc-equip-filter"
              className="cliente-orc-ficha-filters__select"
              value={filtroEquipamento}
              onChange={(e) => setFiltroEquipamento(e.target.value)}
            >
              <option value="todos">{safeT?.todosEquipamentos || 'Todos os equipamentos'}</option>
              {equipamentos.map((eq, index) => {
                const label = [eq.marca, eq.modelo].filter(Boolean).join(' ') || eq.tipoEquipamento || `#${index + 1}`
                const serie = eq.numeroSerie ? ` · ${eq.numeroSerie}` : ''
                return (
                  <option key={eq.id || `${eq.numeroSerie}-${index}`} value={String(index)}>
                    {label}
                    {serie}
                  </option>
                )
              })}
            </select>
          </div>
        )}

        <div className="cliente-orc-ficha-filters__duo">
          <div className="cliente-orc-ficha-filters__group">
            <span className="cliente-orc-ficha-filters__label">{safeT?.tipoOrigem || 'Origem'}</span>
            <div
              className="cliente-orc-ficha-filters__segmented cliente-orc-ficha-filters__segmented--origem"
              role="group"
              aria-label={safeT?.tipoOrigem || 'Origem'}
            >
              {(['todos', 'relatorio', 'avulso'] as FiltroOrigem[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`cliente-orc-ficha-filters__segment-btn${filtroOrigem === f ? ' is-active' : ''}`}
                  onClick={() => setFiltroOrigem(f)}
                  aria-pressed={filtroOrigem === f}
                >
                  {f === 'todos'
                    ? safeT?.todos || 'Todos'
                    : f === 'relatorio'
                      ? safeT?.orcamentosDoRelatorio || 'Do relatório'
                      : safeT?.orcamentosAvulsos || 'Avulsos'}
                </button>
              ))}
            </div>
          </div>

          <div className="cliente-orc-ficha-filters__group">
            <span className="cliente-orc-ficha-filters__label">{safeT?.estado || 'Estado'}</span>
            <div
              className="cliente-orc-ficha-filters__segmented cliente-orc-ficha-filters__segmented--estado"
              role="group"
              aria-label={safeT?.estado || 'Estado'}
            >
              {(['todos', 'pendentes', 'aprovados'] as FiltroEstado[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`cliente-orc-ficha-filters__segment-btn${filtroEstado === f ? ' is-active' : ''}`}
                  onClick={() => setFiltroEstado(f)}
                  aria-pressed={filtroEstado === f}
                >
                  {f === 'todos'
                    ? safeT?.todosEstados || 'Todos'
                    : f === 'pendentes'
                      ? safeT?.pendentesAprovacao || 'Pendentes'
                      : safeT?.aprovados || 'Aprovados'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {totalRelatorio === 0 && totalAvulso === 0 ? (
        <p className="cliente-equip-orcamentos__empty">
          {safeT?.nenhumOrcamentoCliente || safeT?.nenhumOrcamentoEquipamento ||
            'Ainda não há orçamentos deste cliente. Gere a partir do relatório de serviço ou em Pedido de Orçamentos Avulso.'}
        </p>
      ) : itensVisiveis.length === 0 ? (
        <p className="cliente-equip-orcamentos__empty">
          {safeT?.nenhumOrcamentoFiltro || 'Nenhum orçamento com estes filtros.'}
        </p>
      ) : (
        <div className="cliente-equip-orcamentos__list cliente-detalhe-v2__orcamentos-list">
          {itensVisiveis.map((item) => {
            if (item.kind === 'relatorio-unificado') {
              const p = item.pedido
              const statusEfetivo = statusEfetivoPedidoRelatorio(p, item.orcamento)
              const badge = badgeRelatorio(statusEfetivo)
              return (
                <div key={`rel-${p.id}`} className="cliente-equip-orcamentos__card">
                  <div className="cliente-equip-orcamentos__card-head">
                    <span className="cliente-equip-orcamentos__tag cliente-equip-orcamentos__tag--rel">
                      {safeT?.doRelatorio || 'Do relatório'}
                    </span>
                    <strong>{p.codigo || p.numeroRelatorio}</strong>
                    <span className="cliente-equip-orcamentos__badge" style={{ background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="cliente-equip-orcamentos__line">
                    {safeT?.equipamento || 'Equipamento'}: {item.equipLabel}
                  </p>
                  <p className="cliente-equip-orcamentos__line">
                    {new Date(p.dataGeracao).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )
            }

            if (item.kind === 'relatorio-orc-solo') {
              const o = item.data
              const badge = badgeAvulso(o.status)
              return (
                <div key={`orc-solo-${o.id}`} className="cliente-equip-orcamentos__card">
                  <div className="cliente-equip-orcamentos__card-head">
                    <span className="cliente-equip-orcamentos__tag cliente-equip-orcamentos__tag--rel">
                      {safeT?.doRelatorio || 'Do relatório'}
                    </span>
                    <strong>{o.numeroOrcamento}</strong>
                    <span className="cliente-equip-orcamentos__badge" style={{ background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="cliente-equip-orcamentos__line">
                    {safeT?.equipamento || 'Equipamento'}: {item.equipLabel}
                  </p>
                  <p className="cliente-equip-orcamentos__line">
                    {new Date(o.dataCriacao || o.data).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )
            }

            if (item.kind === 'avulso-pedido') {
              const p = item.data
              const badge = badgeAvulso(p.status)
              return (
                <div key={`av-${p.codigo}`} className="cliente-equip-orcamentos__card">
                  <div className="cliente-equip-orcamentos__card-head">
                    <span className="cliente-equip-orcamentos__tag cliente-equip-orcamentos__tag--av">
                      {safeT?.avulso || 'Avulso'}
                    </span>
                    <strong>{p.codigo}</strong>
                    <span className="cliente-equip-orcamentos__badge" style={{ background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="cliente-equip-orcamentos__line">
                    {safeT?.equipamento || 'Equipamento'}: {item.equipLabel}
                  </p>
                  <p className="cliente-equip-orcamentos__line">
                    {new Date(p.dataGeracao).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )
            }

            const o = item.data
            const badge = badgeAvulso(o.status)
            return (
              <div key={`orc-${o.id}`} className="cliente-equip-orcamentos__card">
                <div className="cliente-equip-orcamentos__card-head">
                  <span className="cliente-equip-orcamentos__tag cliente-equip-orcamentos__tag--av">
                    {safeT?.avulso || 'Avulso'}
                  </span>
                  <strong>{o.numeroOrcamento}</strong>
                  <span className="cliente-equip-orcamentos__badge" style={{ background: badge.bg, color: badge.color }}>
                    {badge.label}
                  </span>
                </div>
                <p className="cliente-equip-orcamentos__line">
                  {safeT?.equipamento || 'Equipamento'}: {item.equipLabel}
                </p>
                <p className="cliente-equip-orcamentos__line">
                  {new Date(o.dataCriacao || o.data).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
