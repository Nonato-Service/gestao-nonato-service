'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  PedidoOrcamentoRef,
  PedidoAvulsoRef,
  EquipamentoClienteRef,
  EquipamentoArmazemRef,
  pedidoRelatorioCorrespondeEquipamento,
  pedidoAvulsoCorrespondeEquipamento,
  pedidoRelatorioPendente,
  findOrcamentoGeradoParaPedidoRelatorio,
  statusEfetivoPedidoRelatorio,
  dedupePedidosRelatorioCliente,
} from '../lib/clienteEquipamentoOrcamentos'
import type { OrcamentoGeradoRef } from '../lib/clienteEquipamentoOrcamentos'

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

type Props = {
  relatorios: RelatorioEquipamentoHistorico[]
  clienteId: string
  clienteNome: string
  equipamento: EquipamentoClienteRef
  equipamentoIndex: number
  pedidosRelatorio: PedidoOrcamentoRef[]
  numerosRelatorioEquipamento?: string[]
  equipamentosArmazem?: EquipamentoArmazemRef[]
  safeT: Record<string, string | undefined>
  loadData?: (key: string) => Promise<unknown>
  relatorioComDivida?: (relatorioId: string) => boolean
  onVerRelatorio?: (relatorio: RelatorioEquipamentoHistorico) => void
  onUpdatePedidoRelatorioStatus?: (id: string, status: PedidoOrcamentoRef['status']) => void
  onVisualizarPdfRelatorio?: (pedido: PedidoOrcamentoRef) => void
  onVisualizarPdfAvulso?: (pedido: PedidoAvulsoRef) => void
  onAtualizarPedidoAvulso?: (pedidos: PedidoAvulsoRef[]) => void
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

function badgePedido(status: PedidoOrcamentoRef['status'], safeT: Record<string, string | undefined>) {
  if (status === 'aprovado') return { cls: 'is-aprovado', label: safeT.aprovado || 'Aprovado' }
  if (status === 'rejeitado') return { cls: 'is-rejeitado', label: safeT.rejeitado || 'Rejeitado' }
  if (status === 'enviado') return { cls: 'is-enviado', label: safeT.statusEnviado || 'Enviado' }
  if (status === 'recebido') return { cls: 'is-recebido', label: safeT.statusRecebido || 'Recebido' }
  return { cls: 'is-pendente', label: safeT.aguardaAprovacao || safeT.pendente || 'Aguarda aprovação' }
}

export function ClienteEquipamentoHistoricoPanel({
  relatorios,
  clienteId,
  clienteNome,
  equipamento,
  equipamentoIndex,
  pedidosRelatorio,
  numerosRelatorioEquipamento = [],
  equipamentosArmazem = [],
  safeT,
  loadData,
  relatorioComDivida,
  onVerRelatorio,
  onUpdatePedidoRelatorioStatus,
  onVisualizarPdfRelatorio,
  onVisualizarPdfAvulso,
  onAtualizarPedidoAvulso,
}: Props) {
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
  }, [loadData, clienteId, equipamentoIndex])

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
            equipamentosArmazem,
            numerosRelatorioEquipamento
          )
        )
      ),
    [
      pedidosRelatorio,
      clienteId,
      equipamento,
      equipamentoIndex,
      clienteNome,
      equipamentosArmazem,
      numerosRelatorioEquipamento,
    ]
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
      const g = ensure(pedido.numeroRelatorio)
      g.pedidosPecas.push(pedido)
    }

    for (const num of numerosRelatorioEquipamento) {
      if (String(num).trim()) ensure(String(num).trim())
    }

    return [...map.values()]
      .filter((g) => g.numero)
      .sort((a, b) => {
        const da = a.relatorio?.data ?? ''
        const db = b.relatorio?.data ?? ''
        if (da && db) return db.localeCompare(da)
        return b.numero.localeCompare(a.numero)
      })
  }, [relatorios, pedidosFiltrados, numerosRelatorioEquipamento])

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

  if (
    gruposPorNumero.length === 0 &&
    pedidosAvulsoFiltrados.length === 0 &&
    relatorios.length === 0
  ) {
    return (
      <div className="cliente-equip-hist cliente-equip-hist--empty">
        <p className="cliente-equip-hist__empty">
          {safeT.nenhumHistoricoEquipamento ||
            'Ainda não há relatórios, serviços ou peças ligados a este equipamento.'}
        </p>
      </div>
    )
  }

  return (
    <div className="cliente-equip-hist">
      <div className="cliente-equip-hist__header">
        <h4 className="cliente-equip-hist__title">
          📂 {safeT.historicoEquipamento || 'Histórico do equipamento'}
        </h4>
        <p className="cliente-equip-hist__meta">
          {gruposPorNumero.length}{' '}
          {safeT.relatoriosNumerados || 'relatório(s) numerado(s)'} · {pedidosAvulsoFiltrados.length}{' '}
          {safeT.avulsos || 'avulso(s)'}
        </p>
      </div>

      <div className="cliente-equip-hist__grupos">
        {gruposPorNumero.map((grupo) => {
          const rel = grupo.relatorio
          const temPecasNoRel = rel ? relatorioTemPecas(rel) : false
          const pecasRel = rel ? todasPecasRelatorio(rel) : []
          const divida = rel && relatorioComDivida?.(rel.id)

          return (
            <article key={grupo.numero} className="cliente-equip-hist__grupo">
              <header className="cliente-equip-hist__grupo-head">
                <span className="cliente-equip-hist__grupo-num">
                  {safeT.numeroRelatorio || 'Relatório'} <strong>{grupo.numero}</strong>
                </span>
                {rel?.data && (
                  <span className="cliente-equip-hist__grupo-data">
                    {new Date(rel.data).toLocaleDateString('pt-BR')}
                  </span>
                )}
                {divida && (
                  <span className="cliente-equip-hist__grupo-alerta">
                    {safeT.clienteRelatorioDivida || 'Situação financeira pendente'}
                  </span>
                )}
              </header>

              <div className="cliente-equip-hist__cols">
                {/* Coluna 1 — Relatório de serviço (sem peças ou resumo do serviço) */}
                <section className="cliente-equip-hist__col cliente-equip-hist__col--servico">
                  <h5 className="cliente-equip-hist__col-title">
                    📋 {safeT.relatorioServico || 'Relatório de serviço'}
                  </h5>
                  {!rel ? (
                    <p className="cliente-equip-hist__col-empty">
                      {safeT.relatorioNaoEncontrado || 'Relatório não encontrado na lista de serviços.'}
                    </p>
                  ) : (
                    <div className={`cliente-equip-hist__servico-card${divida ? ' is-divida' : ''}`}>
                      <p className="cliente-equip-hist__line">
                        <span>{safeT.tecnico || 'Técnico'}:</span> {rel.tecnico || '—'}
                      </p>
                      {rel.tipoServico && (
                        <p className="cliente-equip-hist__line">
                          <span>{safeT.tipoServico || 'Tipo'}:</span> {rel.tipoServico}
                        </p>
                      )}
                      <p className="cliente-equip-hist__line">
                        <span>{safeT.estado || 'Estado'}:</span>{' '}
                        {rel.servicoConcluido
                          ? safeT.concluido || 'Concluído'
                          : safeT.emAberto || 'Em aberto'}
                      </p>
                      {!temPecasNoRel && (
                        <p className="cliente-equip-hist__col-hint">
                          {safeT.relatorioSomenteServico || 'Serviço sem peças registadas.'}
                        </p>
                      )}
                      {onVerRelatorio && (
                        <button
                          type="button"
                          className="cliente-equip-hist__btn cliente-equip-hist__btn--ver"
                          onClick={() => onVerRelatorio(rel)}
                        >
                          👁️ {safeT.verRelatorio || safeT.ver || 'Ver relatório'}
                        </button>
                      )}
                    </div>
                  )}
                </section>

                {/* Coluna 2 — Relatório com peças */}
                <section className="cliente-equip-hist__col cliente-equip-hist__col--com-pecas">
                  <h5 className="cliente-equip-hist__col-title">
                    🔧 {safeT.relatorioComPecas || 'Relatório com peças'}
                  </h5>
                  {!temPecasNoRel || pecasRel.length === 0 ? (
                    <p className="cliente-equip-hist__col-empty">
                      {safeT.semPecasNoRelatorio || 'Este relatório não regista peças no serviço.'}
                    </p>
                  ) : (
                    <div className="cliente-equip-hist__pecas-block">
                      <p className="cliente-equip-hist__pecas-ref">
                        {safeT.referenteRelatorio || 'Referente ao relatório'}{' '}
                        <strong>{grupo.numero}</strong> · {pecasRel.length}{' '}
                        {safeT.pecas || 'peça(s)'}
                      </p>
                      {renderListaPecas(pecasRel, `rel-${grupo.numero}`)}
                    </div>
                  )}
                </section>

                {/* Coluna 3 — Somente peças (pedido de orçamento) */}
                <section className="cliente-equip-hist__col cliente-equip-hist__col--somente-pecas">
                  <h5 className="cliente-equip-hist__col-title">
                    📦 {safeT.somentePecas || 'Somente peças (orçamento)'}
                  </h5>
                  {grupo.pedidosPecas.length === 0 ? (
                    <p className="cliente-equip-hist__col-empty">
                      {safeT.semPedidoPecasRelatorio ||
                        'Sem pedido de orçamento de peças para este número de relatório.'}
                    </p>
                  ) : (
                    grupo.pedidosPecas.map((pedido) => {
                      const orc = findOrcamentoGeradoParaPedidoRelatorio(pedido, orcamentosGerados)
                      const status = statusEfetivoPedidoRelatorio(pedido, orc)
                      const badge = badgePedido(status, safeT)
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
                            {safeT.referenteRelatorio || 'Referente ao relatório'}{' '}
                            <strong>{pedido.numeroRelatorio}</strong>
                          </p>
                          {pecas.length > 0 ? (
                            renderListaPecas(pecas, `ped-${pedido.id}`)
                          ) : (
                            <p className="cliente-equip-hist__col-empty">
                              {safeT.pedidoSemPecas || 'Pedido sem lista de peças.'}
                            </p>
                          )}
                          <div className="cliente-equip-hist__pedido-actions">
                            {onVisualizarPdfRelatorio && (
                              <button
                                type="button"
                                className="cliente-equip-hist__btn"
                                onClick={() => onVisualizarPdfRelatorio(pedido)}
                              >
                                👁️ PDF
                              </button>
                            )}
                            {onUpdatePedidoRelatorioStatus && pedidoRelatorioPendente(status) && (
                                <button
                                  type="button"
                                  className="cliente-equip-hist__btn cliente-equip-hist__btn--ok"
                                  onClick={() => onUpdatePedidoRelatorioStatus(pedido.id, 'aprovado')}
                                >
                                  ✓ {safeT.aprovar || 'Aprovar'}
                                </button>
                              )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </section>
              </div>
            </article>
          )
        })}
      </div>

      {/* Relatórios só serviço agrupados sem número duplicado — já cobertos acima */}

      {pedidosAvulsoFiltrados.length > 0 && (
        <section className="cliente-equip-hist__avulsos">
          <h4 className="cliente-equip-hist__avulsos-title">
            🧩 {safeT.pecasAvulsas || 'Peças avulsas (sem relatório de serviço)'}
          </h4>
          <div className="cliente-equip-hist__avulsos-list">
            {pedidosAvulsoFiltrados.map((p) => {
              const badge = p.status === 'aprovado' ? safeT.aprovado : safeT.pendente
              return (
                <div key={p.codigo} className="cliente-equip-hist__pedido-card">
                  <div className="cliente-equip-hist__pedido-head">
                    <span className="cliente-equip-hist__pedido-cod">{p.codigo}</span>
                    <span className="cliente-equip-hist__badge is-pendente">{badge || 'Pendente'}</span>
                  </div>
                  {(p.pecas?.length ?? 0) > 0 && renderListaPecas(p.pecas!, `av-${p.codigo}`)}
                  <div className="cliente-equip-hist__pedido-actions">
                    {onVisualizarPdfAvulso && (
                      <button
                        type="button"
                        className="cliente-equip-hist__btn"
                        onClick={() => onVisualizarPdfAvulso(p)}
                      >
                        👁️ PDF
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
