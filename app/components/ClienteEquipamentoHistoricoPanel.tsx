'use client'

import React, { useEffect, useMemo, useState } from 'react'
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
  equipamentosArmazem?: EquipamentoArmazemRef[]
  language?: string
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

export function ClienteEquipamentoHistoricoPanel({
  relatorios,
  clienteId,
  clienteNome,
  equipamento,
  equipamentoIndex,
  pedidosRelatorio,
  equipamentosArmazem = [],
  language = 'pt-BR',
  safeT,
  loadData,
  relatorioComDivida,
  onVerRelatorio,
  onUpdatePedidoRelatorioStatus,
  onVisualizarPdfRelatorio,
  onVisualizarPdfAvulso,
}: Props) {
  const tr = (key: string) => safeT[key] ?? key
  const locale = localeDatetimeGeneral(language)

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

  if (gruposPorNumero.length === 0 && pedidosAvulsoFiltrados.length === 0) {
    return (
      <div className="cliente-equip-hist cliente-equip-hist--empty">
        <p className="cliente-equip-hist__empty">{tr('nenhumHistoricoEquipamento')}</p>
      </div>
    )
  }

  return (
    <div className="cliente-equip-hist">
      <div className="cliente-equip-hist__header">
        <h4 className="cliente-equip-hist__title">📂 {tr('equipHistoricoDesteEquipamento')}</h4>
        {equipLabel && <p className="cliente-equip-hist__equip-label">{equipLabel}</p>}
        <p className="cliente-equip-hist__hint">{tr('equipHistoricoIsoladoHint')}</p>
        <p className="cliente-equip-hist__meta">
          {gruposPorNumero.length} {tr('relatoriosNumerados')} · {pedidosAvulsoFiltrados.length}{' '}
          {tr('avulsos')}
        </p>
      </div>

      <div className="cliente-equip-hist__grupos">
        {gruposPorNumero.map((grupo) => {
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

                <section className="cliente-equip-hist__col cliente-equip-hist__col--somente-pecas">
                  <h5 className="cliente-equip-hist__col-title">
                    📦 {tr('somentePecas')}
                  </h5>
                  {grupo.pedidosPecas.length === 0 ? (
                    <p className="cliente-equip-hist__col-empty">{tr('semPedidoPecasRelatorio')}</p>
                  ) : (
                    grupo.pedidosPecas.map((pedido) => {
                      const orc = findOrcamentoGeradoParaPedidoRelatorio(pedido, orcamentosGerados)
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
              </div>
            </article>
          )
        })}
      </div>

      {pedidosAvulsoFiltrados.length > 0 && (
        <section className="cliente-equip-hist__avulsos">
          <h4 className="cliente-equip-hist__avulsos-title">🧩 {tr('pecasAvulsas')}</h4>
          <div className="cliente-equip-hist__avulsos-list">
            {pedidosAvulsoFiltrados.map((p) => {
              const badge =
                p.status === 'aprovado' ? tr('aprovado') : tr('aguardaAprovacao')
              return (
                <div key={p.codigo} className="cliente-equip-hist__pedido-card">
                  <div className="cliente-equip-hist__pedido-head">
                    <span className="cliente-equip-hist__pedido-cod">{p.codigo}</span>
                    <span className="cliente-equip-hist__badge is-pendente">{badge}</span>
                  </div>
                  {(p.pecas?.length ?? 0) > 0 && renderListaPecas(p.pecas!, `av-${p.codigo}`)}
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
            })}
          </div>
        </section>
      )}
    </div>
  )
}
