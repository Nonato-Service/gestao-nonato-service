'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  orcamentoGeradoPendente,
  orcamentoEntregaAguardandoNotaFiscal,
  orcamentoGeradoAprovadoSemEntrega,
  PedidoAvulsoRef,
  PedidoOrcamentoRef,
  aplicarPatchPedidoFromOrcamentoGerado,
} from '../lib/clienteEquipamentoOrcamentos'
import {
  type OrcamentoWorkflowStatus,
  orcamentoAguardandoConfirmacaoCliente,
  orcamentoPedidoConfirmado,
  orcamentoMercadoriaRecebida,
  notifyEquipamentoOrcamentosChanged,
} from '../lib/orcamentoWorkflow'
import {
  ORCAMENTOS_ALFABETO_INDICE,
  getClienteLetraAlfabeto,
  chaveClienteOrcamento,
  clienteNomeMatchesLetraAlfabeto,
} from '../lib/orcamentosAlfabeto'

export type OrcamentoGeradoItem = {
  id: string
  numeroOrcamento: string
  data: string
  validade?: string
  descricao?: string
  observacoes?: string
  tipo?: string
  status?: 'pendente' | 'cancelado' | 'concluido' | 'aprovado' | 'entregue'
  workflowStatus?: OrcamentoWorkflowStatus
  clienteId?: string
  clienteNome?: string
  relatorioId?: string
  relatorioNumero?: string
  equipamentoChave?: string
  equipamentoNumeroSerie?: string
  dadosCliente?: { nomeEmpresa?: string }
  numeroNotaFiscalEntrega?: string
  entregaConfirmadaEm?: string
  geradoEm?: string
  dataCriacao: string
  total?: number
}

type ClienteRef = { id: string; nomeEmpresa: string }

type Props = {
  orcamentos: OrcamentoGeradoItem[]
  clientes: ClienteRef[]
  safeT: Record<string, string | undefined>
  saveData?: (key: string, data: unknown) => Promise<void>
  loadData?: (key: string) => Promise<unknown>
  onOrcamentosChange: (lista: OrcamentoGeradoItem[]) => void
  onPedidoConfirmado?: (orc: OrcamentoGeradoItem) => void | Promise<void>
  onMercadoriaRecebida?: (orc: OrcamentoGeradoItem) => void | Promise<void>
  children: (filtrados: OrcamentoGeradoItem[]) => React.ReactNode
}

const PEDIDOS_AVULSO_KEY = 'nonato-pedidos-orcamento-avulso'
const ORCAMENTOS_AVULSO_KEY = 'nonato-orcamentos-avulso'
const PEDIDOS_RELATORIO_KEY = 'nonato-pedidos-orcamento'

function resolverNomeCliente(orc: OrcamentoGeradoItem, clientes: ClienteRef[]): string {
  const nome = String(orc.clienteNome ?? '').trim()
  if (nome) return nome
  if (orc.clienteId) {
    const c = clientes.find((x) => x.id === orc.clienteId)
    if (c?.nomeEmpresa) return c.nomeEmpresa
  }
  const dados = String(orc.dadosCliente?.nomeEmpresa ?? '').trim()
  if (dados) return dados
  return ''
}

export function OrcamentosGeradosBrowse({
  orcamentos,
  clientes,
  safeT,
  saveData,
  loadData,
  onOrcamentosChange,
  onPedidoConfirmado,
  onMercadoriaRecebida,
  children,
}: Props) {
  const [busca, setBusca] = useState('')
  const [letraFiltro, setLetraFiltro] = useState<string | null>(null)
  const [clienteChave, setClienteChave] = useState<string | null>(null)
  const [notaFiscalInputs, setNotaFiscalInputs] = useState<Record<string, string>>({})
  const [pedidosAvulso, setPedidosAvulso] = useState<PedidoAvulsoRef[]>([])

  useEffect(() => {
    if (!loadData) return
    loadData(PEDIDOS_AVULSO_KEY)
      .then((data) => {
        if (Array.isArray(data)) setPedidosAvulso(data as PedidoAvulsoRef[])
      })
      .catch(() => {})
  }, [loadData])

  const buscaAtiva = busca.trim().length > 0

  const orcamentosPosBusca = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return orcamentos
    return orcamentos.filter((o) => {
      const num = String(o.numeroOrcamento ?? '').toLowerCase()
      const nome = resolverNomeCliente(o, clientes).toLowerCase()
      return num.includes(q) || nome.includes(q)
    })
  }, [orcamentos, busca, clientes])

  const clientesComOrcamentos = useMemo(() => {
    const map = new Map<
      string,
      { chave: string; nome: string; letra: string; count: number }
    >()
    for (const o of orcamentosPosBusca) {
      const nome = resolverNomeCliente(o, clientes) || '—'
      const chave = chaveClienteOrcamento(o.clienteId, nome !== '—' ? nome : undefined, o.id)
      const letra = getClienteLetraAlfabeto(nome)
      const existente = map.get(chave)
      if (existente) {
        existente.count += 1
      } else {
        map.set(chave, { chave, nome, letra, count: 1 })
      }
    }
    return [...map.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [orcamentosPosBusca, clientes])


  const clientesNaLetraAlfabeto = (letra: string) =>
    clientesComOrcamentos.filter((c) => clienteNomeMatchesLetraAlfabeto(c.nome, letra))

  const letraAtiva =
    letraFiltro && clientesNaLetraAlfabeto(letraFiltro).length > 0 ? letraFiltro : null

  const itensPastaAguardando = useMemo(
    () =>
      orcamentosPosBusca.filter(
        (o) =>
          orcamentoAguardandoConfirmacaoCliente(o) &&
          orcamentoGeradoPendente(o.status) &&
          o.workflowStatus !== 'cotacao_recebida'
      ),
    [orcamentosPosBusca]
  )

  const itensPastaConfirmados = useMemo(
    () => orcamentosPosBusca.filter((o) => orcamentoPedidoConfirmado(o)),
    [orcamentosPosBusca]
  )

  const itensPastaMercadoria = useMemo(
    () => orcamentosPosBusca.filter((o) => orcamentoMercadoriaRecebida(o)),
    [orcamentosPosBusca]
  )

  const itensPastaEntrega = useMemo(
    () => orcamentosPosBusca.filter((o) => orcamentoEntregaAguardandoNotaFiscal(o)),
    [orcamentosPosBusca]
  )

  const orcamentosRecentes = useMemo(
    () =>
      [...orcamentos].sort(
        (a, b) =>
          new Date(b.dataCriacao || b.geradoEm || 0).getTime() -
          new Date(a.dataCriacao || a.geradoEm || 0).getTime()
      ).slice(0, 25),
    [orcamentos]
  )

  const orcamentosVisiveis = useMemo(() => {
    if (buscaAtiva) return orcamentosPosBusca
    if (letraAtiva && clienteChave) {
      return orcamentosPosBusca.filter((o) => {
        const nome = resolverNomeCliente(o, clientes) || '—'
        const chave = chaveClienteOrcamento(o.clienteId, nome !== '—' ? nome : undefined, o.id)
        return clienteNomeMatchesLetraAlfabeto(nome, letraAtiva) && chave === clienteChave
      })
    }
    if (!letraAtiva) return orcamentosRecentes
    return []
  }, [buscaAtiva, orcamentosPosBusca, letraAtiva, clienteChave, clientes, orcamentosRecentes])

  const sincronizarPedidoAvulso = async (
    codigo: string,
    patch: Partial<PedidoAvulsoRef>
  ) => {
    const novos = pedidosAvulso.map((p) => (p.codigo === codigo ? { ...p, ...patch } : p))
    setPedidosAvulso(novos)
    if (saveData) await saveData(PEDIDOS_AVULSO_KEY, novos)
  }

  const sincronizarPedidoRelatorio = async (orc: OrcamentoGeradoItem, patch: Partial<OrcamentoGeradoItem>) => {
    const isRel =
      orc.tipo === 'orcamento-relatorio' ||
      orc.tipo === 'cliente-cadastrado' ||
      Boolean(orc.relatorioId || orc.relatorioNumero)
    if (!isRel || !loadData || !saveData) return
    try {
      const raw = await loadData(PEDIDOS_RELATORIO_KEY)
      const pedidos: PedidoOrcamentoRef[] = Array.isArray(raw) ? raw : []
      const merged = { ...orc, ...patch }
      const updated = aplicarPatchPedidoFromOrcamentoGerado(merged, pedidos, patch.status ?? orc.status)
      if (updated !== pedidos) {
        await saveData(PEDIDOS_RELATORIO_KEY, updated)
      }
    } catch (_) {}
  }

  const atualizarOrcamento = async (id: string, patch: Partial<OrcamentoGeradoItem>) => {
    const novos = orcamentos.map((o) => (o.id === id ? { ...o, ...patch } : o))
    onOrcamentosChange(novos)
    if (saveData) await saveData(ORCAMENTOS_AVULSO_KEY, novos)
    const orc = novos.find((o) => o.id === id)
    if (orc?.tipo === 'pedido-avulso') {
      const codigo = orc.numeroOrcamento
      await sincronizarPedidoAvulso(codigo, {
        ...(patch as Partial<PedidoAvulsoRef>),
        status: patch.status as PedidoAvulsoRef['status'],
      })
    } else if (orc) {
      await sincronizarPedidoRelatorio(orc, patch)
    }
    notifyEquipamentoOrcamentosChanged()
  }

  const aprovarOrcamento = async (id: string) => {
    await atualizarOrcamento(id, {
      status: 'aprovado',
      workflowStatus: 'pedido_confirmado',
    })
    const orc = orcamentos.find((o) => o.id === id)
    if (orc && onPedidoConfirmado) {
      await onPedidoConfirmado({ ...orc, status: 'aprovado', workflowStatus: 'pedido_confirmado' })
    }
  }

  const marcarMercadoriaRecebida = async (id: string) => {
    const msg =
      safeT?.confirmarMercadoriaRecebida ||
      'Confirmar que a mercadoria deste orçamento chegou e deve ser separada para envio?'
    if (!confirm(msg)) return
    await atualizarOrcamento(id, {
      workflowStatus: 'mercadoria_recebida',
      status: 'aprovado',
    })
    const orc = orcamentos.find((o) => o.id === id)
    if (orc && onMercadoriaRecebida) {
      await onMercadoriaRecebida({ ...orc, workflowStatus: 'mercadoria_recebida' })
    }
  }

  const marcarEntregue = (id: string) => atualizarOrcamento(id, { status: 'entregue' })

  const confirmarNotaFiscal = async (orc: OrcamentoGeradoItem) => {
    const nf = String(notaFiscalInputs[orc.id] ?? '').trim()
    if (!nf) {
      alert(safeT?.informeNumeroNotaFiscal || 'Informe o número da nota fiscal.')
      return
    }
    const agora = new Date().toISOString()
    await atualizarOrcamento(orc.id, {
      numeroNotaFiscalEntrega: nf,
      entregaConfirmadaEm: agora,
    })
    setNotaFiscalInputs((prev) => {
      const next = { ...prev }
      delete next[orc.id]
      return next
    })
  }

  const totalFiltrados = buscaAtiva
    ? orcamentosPosBusca.length
    : letraAtiva && clienteChave
      ? orcamentosVisiveis.length
      : 0

  return (
    <div className="orc-gerados-browse">
      <div className="orc-gerados-browse__search-row">
        <input
          type="text"
          className="orc-pro__search orc-gerados-browse__search"
          placeholder={
            safeT?.buscarOrcamentoNumeroOuCliente ||
            'Buscar pelo número do orçamento ou nome do cliente...'
          }
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value)
            if (e.target.value.trim()) {
              setLetraFiltro(null)
              setClienteChave(null)
            }
          }}
        />
        {buscaAtiva && (
          <button
            type="button"
            className="orc-pro__btn orc-pro__btn--secondary orc-gerados-browse__clear"
            onClick={() => setBusca('')}
          >
            ✕ {safeT?.limparBusca || safeT?.limpar || 'Limpar'}
          </button>
        )}
      </div>

      <div className="cliente-orc-pastas orc-gerados-browse__pastas">
        <details
          className={`cliente-orc-pasta cliente-orc-pasta--aguardando${itensPastaAguardando.length > 0 ? ' is-blinking' : ''}`}
          open={itensPastaAguardando.length > 0}
        >
          <summary className="cliente-orc-pasta__summary">
            <span className="cliente-orc-pasta__icon">📁</span>
            {safeT?.pastaOrcamentoAguardando || 'Orçamento Gerado — Esperando Confirmação'}
            <span className="cliente-orc-pasta__count">{itensPastaAguardando.length}</span>
          </summary>
          <div className="cliente-orc-pasta__body">
            {itensPastaAguardando.length === 0 ? (
              <p className="cliente-orc-pasta__empty">
                {safeT?.pastaVaziaAguardando || 'Nenhum orçamento aguardando confirmação.'}
              </p>
            ) : (
              itensPastaAguardando.map((o) => (
                <div key={o.id} className="cliente-equip-orcamentos__card orc-gerados-browse__pasta-card">
                  <div className="cliente-equip-orcamentos__card-head">
                    <strong>{o.numeroOrcamento}</strong>
                    <span className="cliente-equip-orcamentos__badge" style={{ background: 'rgba(255,170,0,0.15)', color: '#ffaa00' }}>
                      {safeT?.pendente || 'Pendente'}
                    </span>
                  </div>
                  <p className="cliente-equip-orcamentos__line">
                    {safeT?.cliente || 'Cliente'}: {resolverNomeCliente(o, clientes) || '—'}
                  </p>
                  <div className="cliente-equip-orcamentos__actions">
                    <button
                      type="button"
                      className="cliente-equip-orcamentos__btn cliente-equip-orcamentos__btn--ok"
                      onClick={() => void aprovarOrcamento(o.id)}
                    >
                      ✓ {safeT?.aprovar || 'Aprovar'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </details>

        <details
          className={`cliente-orc-pasta cliente-orc-pasta--confirmados${itensPastaConfirmados.length > 0 ? ' is-blinking' : ''}`}
          open={itensPastaConfirmados.length > 0}
        >
          <summary className="cliente-orc-pasta__summary">
            <span className="cliente-orc-pasta__icon">📁</span>
            {safeT?.pastaPedidosConfirmados || 'Pedidos Confirmados — Aguardando Mercadoria'}
            <span className="cliente-orc-pasta__count">{itensPastaConfirmados.length}</span>
          </summary>
          <div className="cliente-orc-pasta__body">
            {itensPastaConfirmados.length === 0 ? (
              <p className="cliente-orc-pasta__empty">
                {safeT?.pastaVaziaConfirmados || 'Nenhum pedido confirmado pelo cliente.'}
              </p>
            ) : (
              itensPastaConfirmados.map((o) => (
                <div key={o.id} className="cliente-equip-orcamentos__card orc-gerados-browse__pasta-card">
                  <div className="cliente-equip-orcamentos__card-head">
                    <strong>{o.numeroOrcamento}</strong>
                    <span
                      className="cliente-equip-orcamentos__badge"
                      style={{ background: 'rgba(0,200,83,0.2)', color: '#00c853' }}
                    >
                      {safeT?.pedidoConfirmado || 'Confirmado'}
                    </span>
                  </div>
                  <p className="cliente-equip-orcamentos__line">
                    {safeT?.cliente || 'Cliente'}: {resolverNomeCliente(o, clientes) || '—'}
                  </p>
                  <div className="cliente-equip-orcamentos__actions">
                    <button
                      type="button"
                      className="cliente-equip-orcamentos__btn cliente-equip-orcamentos__btn--ok"
                      onClick={() => void marcarMercadoriaRecebida(o.id)}
                    >
                      📦 {safeT?.mercadoriaChegou || 'Mercadoria chegou — separar'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </details>

        {itensPastaMercadoria.length > 0 ? (
          <details className="cliente-orc-pasta cliente-orc-pasta--mercadoria" open>
            <summary className="cliente-orc-pasta__summary">
              <span className="cliente-orc-pasta__icon">📁</span>
              {safeT?.pastaMercadoriaRecebida || 'Mercadoria Recebida — Em Separação'}
              <span className="cliente-orc-pasta__count">{itensPastaMercadoria.length}</span>
            </summary>
            <div className="cliente-orc-pasta__body">
              {itensPastaMercadoria.map((o) => (
                <div key={o.id} className="cliente-equip-orcamentos__card orc-gerados-browse__pasta-card">
                  <div className="cliente-equip-orcamentos__card-head">
                    <strong>{o.numeroOrcamento}</strong>
                    <span
                      className="cliente-equip-orcamentos__badge"
                      style={{ background: 'rgba(255,165,0,0.2)', color: '#ffa500' }}
                    >
                      {safeT?.aguardandoSeparacao || 'Aguardando separação'}
                    </span>
                  </div>
                  <p className="cliente-equip-orcamentos__line">
                    {safeT?.cliente || 'Cliente'}: {resolverNomeCliente(o, clientes) || '—'}
                  </p>
                </div>
              ))}
            </div>
          </details>
        ) : null}

        <details
          className={`cliente-orc-pasta cliente-orc-pasta--entrega${itensPastaEntrega.length > 0 ? ' is-blinking' : ''}`}
          open={itensPastaEntrega.length > 0}
        >
          <summary className="cliente-orc-pasta__summary">
            <span className="cliente-orc-pasta__icon">📁</span>
            {safeT?.pastaPedidoEntregue || 'Pedido Entregue — Aguardando Nota Fiscal'}
            <span className="cliente-orc-pasta__count">{itensPastaEntrega.length}</span>
          </summary>
          <div className="cliente-orc-pasta__body">
            {itensPastaEntrega.length === 0 ? (
              <p className="cliente-orc-pasta__empty">
                {safeT?.pastaVaziaEntrega || 'Nenhum pedido entregue aguardando nota fiscal.'}
              </p>
            ) : (
              itensPastaEntrega.map((o) => (
                <div key={o.id} className="cliente-equip-orcamentos__card orc-gerados-browse__pasta-card">
                  <div className="cliente-equip-orcamentos__card-head">
                    <strong>{o.numeroOrcamento}</strong>
                    <span className="cliente-equip-orcamentos__badge" style={{ background: 'rgba(0,200,83,0.2)', color: '#00c853' }}>
                      {safeT?.entregue || 'Entregue'}
                    </span>
                  </div>
                  <p className="cliente-equip-orcamentos__line">
                    {safeT?.cliente || 'Cliente'}: {resolverNomeCliente(o, clientes) || '—'}
                  </p>
                  <div className="cliente-orc-pasta__nf-row">
                    <input
                      type="text"
                      className="cliente-orc-pasta__nf-input"
                      placeholder={safeT?.numeroNotaFiscalPlaceholder || 'Nº da nota fiscal'}
                      value={notaFiscalInputs[o.id] ?? ''}
                      onChange={(e) =>
                        setNotaFiscalInputs((prev) => ({ ...prev, [o.id]: e.target.value }))
                      }
                    />
                    <button
                      type="button"
                      className="cliente-equip-orcamentos__btn cliente-equip-orcamentos__btn--nf"
                      onClick={() => confirmarNotaFiscal(o)}
                    >
                      ✓ {safeT?.confirmarEntregaComNf || 'Confirmar entrega com NF'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </details>
      </div>

      {!buscaAtiva && !letraAtiva && orcamentosVisiveis.length > 0 ? (
        <section className="orc-gerados-browse__recentes">
          <h3 className="orc-gerados-browse__recentes-title">
            {safeT?.orcamentosRecentes || 'Orçamentos recentes'}
          </h3>
          {children(orcamentosVisiveis)}
        </section>
      ) : null}

      {!buscaAtiva && (
        <div className="clientes-alfa-wrap orc-gerados-browse__alfa">
          <p className="orc-gerados-browse__meta">
            {orcamentos.length} {safeT?.orcamentosGerados || 'orçamentos gerados'}
            {letraAtiva
              ? ` · ${clientesNaLetraAlfabeto(letraAtiva).length} ${safeT?.clientes || 'cliente(s)'} ${safeT?.clientesAlfabetoComInicial || 'com inicial'} «${letraAtiva === '#' ? safeT?.clientesAlfabetoOutros || 'Outros' : letraAtiva}»`
              : ` — ${orcamentosRecentes.length} ${safeT?.recentes || 'recentes'}`}
          </p>
          <nav
            className="clientes-alfa-jump clientes-alfa-jump--modern"
            aria-label={safeT?.clientesAlfabetoIndice || 'Índice A–Z'}
          >
            {ORCAMENTOS_ALFABETO_INDICE.map((letra) => {
              const count = clientesNaLetraAlfabeto(letra).length
              const tem = count > 0
              const active = letraAtiva === letra
              return (
                <button
                  key={letra}
                  type="button"
                  className={`clientes-alfa-jump-btn${active ? ' is-active' : ''}${!tem ? ' is-empty' : ''}`}
                  disabled={!tem}
                  aria-pressed={active}
                  title={
                    tem
                      ? `${count} ${safeT?.clientes || 'cliente(s)'}`
                      : safeT?.clientesAlfabetoSemClientes || 'Sem clientes nesta letra'
                  }
                  onClick={() => {
                    setLetraFiltro((prev) => (prev === letra ? null : letra))
                    setClienteChave(null)
                  }}
                >
                  <span className="clientes-alfa-jump-btn__letter">{letra === '#' ? '#' : letra}</span>
                  {tem ? (
                    <span className="clientes-alfa-jump-btn__count" aria-hidden>
                      {count}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </nav>

          {!letraAtiva ? (
            <p className="clientes-alfa-prompt">
              {safeT?.orcamentosGeradosRecentesHint ||
                'Os orçamentos mais recentes aparecem abaixo. Use o alfabeto para filtrar por cliente.'}
            </p>
          ) : !clienteChave ? (
            <section className="clientes-alfa-secao">
              <h3 className="clientes-alfa-letra">
                {letraAtiva === '#'
                  ? safeT?.clientesAlfabetoOutros || 'Outros'
                  : letraAtiva}
                <span className="clientes-alfa-letra__count">
                  {clientesNaLetraAlfabeto(letraAtiva).length}
                </span>
              </h3>
              <p className="orc-gerados-browse__hint">
                {safeT?.orcamentosGeradosSelecioneCliente ||
                  'Selecione o cliente para ver os orçamentos gerados.'}
              </p>
              <ul className="clientes-alfa-nomes">
                {clientesNaLetraAlfabeto(letraAtiva).map((c) => (
                  <li key={c.chave} className="clientes-alfa-item">
                    <button
                      type="button"
                      className="clientes-alfa-nome-btn"
                      onClick={() => setClienteChave(c.chave)}
                    >
                      <span className="clientes-alfa-nome-btn__titulo">{c.nome}</span>
                      <span className="orc-gerados-browse__cliente-count">
                        {c.count} {safeT?.orcamentosGerados || 'orçamentos'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="orc-pro__btn orc-pro__btn--secondary orc-gerados-browse__voltar"
                onClick={() => setLetraFiltro(null)}
              >
                ↶ {safeT?.clientesAlfabetoVoltarLista || 'Voltar à lista por letra'}
              </button>
            </section>
          ) : (
            <div className="orc-gerados-browse__cliente-head">
              <button
                type="button"
                className="orc-pro__btn orc-pro__btn--secondary orc-gerados-browse__voltar"
                onClick={() => setClienteChave(null)}
              >
                ↶ {safeT?.clientesAlfabetoVoltarLista || 'Voltar'}
              </button>
              <span className="orc-gerados-browse__cliente-ativo">
                {(clientesComOrcamentos.find((c) => c.chave === clienteChave)?.nome || '—') +
                  ` · ${totalFiltrados} ${safeT?.orcamentosGerados || 'orçamentos'}`}
              </span>
            </div>
          )}
        </div>
      )}

      {buscaAtiva && (
        <p className="orc-gerados-browse__meta">
          {orcamentosPosBusca.length} {safeT?.resultados || 'resultado(s)'} — {safeT?.buscarOrcamentoNumeroOuCliente || 'busca por número ou cliente'}
        </p>
      )}

      {(buscaAtiva || (letraAtiva && clienteChave)) && (
        <>
          {orcamentosVisiveis.length === 0 ? (
            <div className="orc-pro__empty-state">
              <p className="orc-pro__empty-hint orc-pro__empty-hint--lg">
                {safeT?.nenhumOrcamentoFiltro || 'Nenhum orçamento com estes filtros.'}
              </p>
            </div>
          ) : (
            children(orcamentosVisiveis)
          )}
        </>
      )}
    </div>
  )
}