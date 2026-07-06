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
  pedidoRelatorioPendente,
  pedidoRelatorioAprovado,
  pedidoAvulsoPendente,
  pedidoAvulsoAprovado,
  orcamentoGeradoPendente,
  orcamentoGeradoAprovado,
  rotuloEquipamentoPedidoRelatorio,
  rotuloEquipamentoPedidoAvulso,
  rotuloEquipamentoOrcamentoGerado,
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
    () => pedidosRelatorio.filter((p) => pedidoRelatorioCorrespondeCliente(p, clienteId, clienteNome)),
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
      | { kind: 'relatorio-pedido'; data: PedidoOrcamentoRef; equipLabel: string }
      | { kind: 'avulso-pedido'; data: PedidoAvulsoRef; equipLabel: string }
      | { kind: 'relatorio-orc'; data: OrcamentoGeradoRef; equipLabel: string }
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
        if (!encaixaEquipamento(p)) return
        items.push({ kind: 'relatorio-pedido', data: p, equipLabel: rotuloEquipamentoPedidoRelatorio(p) })
      })
      orcamentosRelatorio.forEach((o) => {
        if (!encaixaEquipamento(undefined, undefined, o)) return
        items.push({ kind: 'relatorio-orc', data: o, equipLabel: rotuloEquipamentoOrcamentoGerado(o) })
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
      if (item.kind === 'relatorio-pedido') {
        return filtroEstado === 'pendentes'
          ? pedidoRelatorioPendente(item.data.status)
          : pedidoRelatorioAprovado(item.data.status)
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

  const totalRelatorio = pedidosRelatorioCliente.length + orcamentosRelatorio.length
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
    return { bg: 'rgba(255,170,0,0.15)', color: '#ffaa00', label: safeT?.pendente || 'Pendente' }
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
      <p className="cliente-detalhe-v2__orcamentos-meta">
        {totalRelatorio} {safeT?.doRelatorio || 'do relatório'} · {totalAvulso} {safeT?.avulsos || 'avulsos'}
      </p>

      {equipamentos.length > 0 && (
        <div className="cliente-detalhe-v2__orcamentos-equip-filter">
          <label htmlFor="cliente-orc-equip-filter">{safeT?.filtrarPorEquipamento || 'Filtrar por equipamento'}</label>
          <select
            id="cliente-orc-equip-filter"
            className="cliente-detalhe-v2__orcamentos-select"
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

      <div className="cliente-equip-orcamentos__filters">
        <div className="cliente-equip-orcamentos__filter-row">
          {(['todos', 'relatorio', 'avulso'] as FiltroOrigem[]).map((f) => (
            <button
              key={f}
              type="button"
              className={`cliente-equip-orcamentos__chip${filtroOrigem === f ? ' is-active' : ''}`}
              onClick={() => setFiltroOrigem(f)}
            >
              {f === 'todos'
                ? safeT?.todos || 'Todos'
                : f === 'relatorio'
                  ? safeT?.orcamentosDoRelatorio || 'Do relatório'
                  : safeT?.orcamentosAvulsos || 'Avulsos'}
            </button>
          ))}
        </div>
        <div className="cliente-equip-orcamentos__filter-row">
          {(['todos', 'pendentes', 'aprovados'] as FiltroEstado[]).map((f) => (
            <button
              key={f}
              type="button"
              className={`cliente-equip-orcamentos__chip cliente-equip-orcamentos__chip--sub${filtroEstado === f ? ' is-active' : ''}`}
              onClick={() => setFiltroEstado(f)}
            >
              {f === 'todos'
                ? safeT?.todosEstados || 'Todos os estados'
                : f === 'pendentes'
                  ? safeT?.pendentesAprovacao || 'Pendentes de aprovação'
                  : safeT?.aprovados || 'Aprovados'}
            </button>
          ))}
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
            if (item.kind === 'relatorio-pedido') {
              const p = item.data
              const badge = badgeRelatorio(p.status)
              return (
                <div key={`rel-${p.id}`} className="cliente-equip-orcamentos__card">
                  <div className="cliente-equip-orcamentos__card-head">
                    <span className="cliente-equip-orcamentos__tag cliente-equip-orcamentos__tag--rel">
                      {safeT?.doRelatorio || 'Relatório'}
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
                    {safeT?.numeroRelatorio || 'Relatório'}: {p.numeroRelatorio}
                  </p>
                  <p className="cliente-equip-orcamentos__line">
                    {safeT?.nomeNoDocumento || 'Nome no documento'}:{' '}
                    {p.emitirComoCliente === 'nonato-service'
                      ? safeT?.nomeNonatoService || 'NONATO SERVICE'
                      : p.cliente}
                  </p>
                  <p className="cliente-equip-orcamentos__line">
                    {new Date(p.dataGeracao).toLocaleDateString('pt-BR')} · {p.pecas?.length ?? 0}{' '}
                    {safeT?.pecas || 'peças'}
                  </p>
                  <div className="cliente-equip-orcamentos__actions">
                    {onVisualizarPdfRelatorio && (
                      <button type="button" className="cliente-equip-orcamentos__btn" onClick={() => onVisualizarPdfRelatorio(p)}>
                        👁️ {safeT?.visualizarPdfPedido || safeT?.visualizar || 'PDF'}
                      </button>
                    )}
                    {onUpdatePedidoRelatorioStatus && p.status !== 'aprovado' && (
                      <button
                        type="button"
                        className="cliente-equip-orcamentos__btn cliente-equip-orcamentos__btn--ok"
                        onClick={() => onUpdatePedidoRelatorioStatus(p.id, 'aprovado')}
                      >
                        ✓ {safeT?.aprovar || 'Aprovar'}
                      </button>
                    )}
                  </div>
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
                    {safeT?.nomeNoDocumento || 'Nome no documento'}:{' '}
                    {p.emitirComoCliente === 'nonato-service'
                      ? safeT?.nomeNonatoService || 'NONATO SERVICE'
                      : p.clienteNomeReal}
                  </p>
                  <p className="cliente-equip-orcamentos__line">
                    {new Date(p.dataGeracao).toLocaleDateString('pt-BR')} · {p.pecas?.length ?? 0}{' '}
                    {safeT?.pecas || 'peças'}
                  </p>
                  <div className="cliente-equip-orcamentos__actions">
                    {onVisualizarPdfAvulso && (
                      <button type="button" className="cliente-equip-orcamentos__btn" onClick={() => onVisualizarPdfAvulso(p)}>
                        👁️ {safeT?.visualizarPdfPedido || safeT?.visualizar || 'PDF'}
                      </button>
                    )}
                    {pedidoAvulsoPendente(p.status) && (
                      <button
                        type="button"
                        className="cliente-equip-orcamentos__btn cliente-equip-orcamentos__btn--ok"
                        onClick={() => atualizarStatusAvulso(p.codigo, 'aprovado')}
                      >
                        ✓ {safeT?.aprovar || 'Aprovar'}
                      </button>
                    )}
                  </div>
                </div>
              )
            }

            const o = item.data
            const badge = badgeAvulso(o.status)
            const isRel = item.kind === 'relatorio-orc'
            return (
              <div key={`orc-${o.id}`} className="cliente-equip-orcamentos__card">
                <div className="cliente-equip-orcamentos__card-head">
                  <span
                    className={`cliente-equip-orcamentos__tag ${isRel ? 'cliente-equip-orcamentos__tag--rel' : 'cliente-equip-orcamentos__tag--av'}`}
                  >
                    {isRel ? safeT?.orcamentoGerado || 'Orçamento gerado' : safeT?.avulso || 'Avulso'}
                  </span>
                  <strong>{o.numeroOrcamento}</strong>
                  <span className="cliente-equip-orcamentos__badge" style={{ background: badge.bg, color: badge.color }}>
                    {badge.label}
                  </span>
                </div>
                <p className="cliente-equip-orcamentos__line">
                  {safeT?.equipamento || 'Equipamento'}: {item.equipLabel}
                </p>
                {o.relatorioNumero && (
                  <p className="cliente-equip-orcamentos__line">
                    {safeT?.numeroRelatorio || 'Relatório'}: {o.relatorioNumero}
                  </p>
                )}
                <p className="cliente-equip-orcamentos__line">{o.descricao || '—'}</p>
                <p className="cliente-equip-orcamentos__line">
                  {new Date(o.dataCriacao || o.data).toLocaleDateString('pt-BR')}
                  {typeof o.total === 'number' && o.total > 0 ? ` · ${o.total.toFixed(2)} €` : ''}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
