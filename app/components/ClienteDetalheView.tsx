'use client'

import React, { useMemo } from 'react'
import { IconHome, IconIdCard } from './UiIcons'
import { translations, translationBundleKey } from '../translations'
import { ClienteEnderecoMapsActions } from './ClienteEnderecoMapsActions'
import {
  buildServicosFinanceirosCliente,
  calcularResumoFinanceiroCliente,
  coletarRelatoriosCliente,
  coletarRelatoriosFinanceirosCliente,
  coletarRelatoriosServicoCliente,
  dataClienteDesde,
  type RelatorioServicoFinanceiroLike,
  fmtEuro,
  formatarData,
  idClienteExibicao,
  relatorioServicoConsideradoConcluido,
  rotuloIdEquipamentoCliente,
  type EquipamentoArmazemIdLookup,
  type EquipamentoClienteLike,
  type FaturaPecasLike,
  type FechamentoItemLike,
  type FechamentoIvaLike,
  type RelatorioClienteLike,
} from '../lib/clienteDetalheUtils'
import { codigoClienteExibicao } from '../lib/clienteCodigoUtils'
import { isClienteMarcadoDevedor } from '../lib/clienteDevedorUtils'
import { ClienteOrcamentosFichaSection } from './ClienteOrcamentosFichaSection'
import type { PedidoOrcamentoRef, PedidoAvulsoRef, OrcamentoGeradoRef } from '../lib/clienteEquipamentoOrcamentos'

function useDetalheTr(language: string) {
  return useMemo(() => {
    const primary = (translations[translationBundleKey(language)] || translations['pt-BR']) as Record<
      string,
      string | undefined
    >
    const en = translations.en as Record<string, string | undefined>
    const pt = translations['pt-BR'] as Record<string, string | undefined>
    return (key: string) => primary[key] ?? en[key] ?? pt[key] ?? key
  }, [language])
}

export type ClienteDetalheData = {
  id: string
  codigoCliente?: string
  nomeEmpresa: string
  morada: string
  localidade?: string
  conselho?: string
  pais?: string
  codigoPostal: string
  numeroContribuicaoFiscal: string
  telefones: string
  photo?: string
  equipamentos: EquipamentoClienteLike[]
  relatorios?: Record<string, RelatorioClienteLike[]>
  saldoPendente?: number
  isDevedor?: boolean
  relatoriosNaoPagoCount?: number
}

type Props = {
  cliente: ClienteDetalheData
  language: string
  equipamentosArmazem?: EquipamentoArmazemIdLookup[]
  faturasPecas: FaturaPecasLike[]
  relatoriosServico?: RelatorioServicoFinanceiroLike[]
  fechamentosGuardadosBibliotecaIds: string[]
  fechamentosRelatorios: Record<string, FechamentoItemLike[]>
  fechamentoFluxoFinanceiroPorRelatorioId: Record<string, unknown>
  fechamentoIvaPorRelatorioId: Record<string, FechamentoIvaLike | undefined>
  fechamentoItensOmitidosPorRelatorio: Record<string, string[]>
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
  onAddEquipamento: () => void
  onViewEquipamentos: () => void
  pedidosRelatorio?: PedidoOrcamentoRef[]
  loadData?: (key: string) => Promise<unknown>
  onUpdatePedidoRelatorioStatus?: (id: string, status: PedidoOrcamentoRef['status']) => void
  onVisualizarPdfRelatorio?: (pedido: PedidoOrcamentoRef) => void
  onVisualizarPdfAvulso?: (pedido: PedidoAvulsoRef) => void
  onAtualizarPedidoAvulso?: (pedidos: PedidoAvulsoRef[]) => void
  onAtualizarOrcamentosGerados?: (orcamentos: OrcamentoGeradoRef[]) => void
}

function IconArrowLeft({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconPhone({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.65">
      <path d="M6.5 4h3l1.5 4-2 1.2a11 11 0 0 0 5.8 5.8L16 13l4 1.5v3a1.5 1.5 0 0 1-1.4 1.5C9.8 19 5 14.2 5 7.9A1.5 1.5 0 0 1 6.5 4z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconMapPin({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.65">
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.65">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
    </svg>
  )
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.65">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
    </svg>
  )
}

function IconPrinter({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.65">
      <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" strokeLinecap="round" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  )
}

function IconHash({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.65">
      <path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18" strokeLinecap="round" />
    </svg>
  )
}

function IconPencil({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label?: string; value: string }) {
  return (
    <div className="cliente-detalhe-v2__info-row">
      <span className="cliente-detalhe-v2__info-row-icon" aria-hidden>
        {icon}
      </span>
      <div className="cliente-detalhe-v2__info-row-text">
        {label ? <span className="cliente-detalhe-v2__info-row-label">{label}</span> : null}
        <span className="cliente-detalhe-v2__info-row-value">{value}</span>
      </div>
    </div>
  )
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="cliente-detalhe-v2__stat-row">
      <span className="cliente-detalhe-v2__stat-icon" aria-hidden>
        {icon}
      </span>
      <span className="cliente-detalhe-v2__stat-label">{label}</span>
      <span className="cliente-detalhe-v2__stat-value">{value}</span>
    </div>
  )
}

function PagamentoPills({ pagamento, tr }: { pagamento: 'pago' | 'pendente' | 'devedor'; tr: (k: string) => string }) {
  const items: Array<{ key: 'pago' | 'pendente' | 'devedor'; label: string }> = [
    { key: 'pago', label: tr('pagoStatus') },
    { key: 'pendente', label: tr('pagamentoPendenteStatus') || tr('pendenteStatus') },
    { key: 'devedor', label: tr('devedorStatus') },
  ]
  return (
    <div className="cliente-detalhe-v2__pagamento-pills">
      {items.map((item) => (
        <span
          key={item.key}
          className={
            'cliente-detalhe-v2__pagamento-pill' +
            (pagamento === item.key ? ` cliente-detalhe-v2__pagamento-pill--${item.key}` : '')
          }
        >
          {item.label}
        </span>
      ))}
    </div>
  )
}

export function ClienteDetalheView({
  cliente,
  language,
  equipamentosArmazem = [],
  faturasPecas,
  relatoriosServico = [],
  fechamentosGuardadosBibliotecaIds,
  fechamentosRelatorios,
  fechamentoFluxoFinanceiroPorRelatorioId,
  fechamentoIvaPorRelatorioId,
  fechamentoItensOmitidosPorRelatorio,
  onBack,
  onEdit,
  onDelete,
  onAddEquipamento,
  onViewEquipamentos,
  pedidosRelatorio = [],
  loadData,
  onUpdatePedidoRelatorioStatus,
  onVisualizarPdfRelatorio,
  onVisualizarPdfAvulso,
  onAtualizarPedidoAvulso,
  onAtualizarOrcamentosGerados,
}: Props) {
  const tr = useDetalheTr(language)

  const safeT = useMemo(() => {
    return (translations[translationBundleKey(language)] || translations['pt-BR']) as Record<
      string,
      string | undefined
    >
  }, [language])

  const relatorios = useMemo(
    () =>
      coletarRelatoriosServicoCliente({
        relatoriosCliente: cliente.relatorios,
        relatoriosServico,
      }),
    [cliente.relatorios, relatoriosServico]
  )
  const relatoriosFinanceiros = useMemo(
    () =>
      coletarRelatoriosFinanceirosCliente({
        relatoriosCliente: cliente.relatorios,
        relatoriosServico,
        fechamentosGuardadosBibliotecaIds,
        fechamentosRelatorios,
      }),
    [cliente.relatorios, relatoriosServico, fechamentosGuardadosBibliotecaIds, fechamentosRelatorios]
  )
  const relatorioIds = useMemo(() => relatoriosFinanceiros.map((r) => r.id), [relatoriosFinanceiros])

  const resumoFinanceiro = useMemo(
    () =>
      calcularResumoFinanceiroCliente({
        clienteId: cliente.id,
        relatorioIds,
        faturasPecas,
        fechamentosGuardadosBibliotecaIds,
        fechamentosRelatorios,
        fechamentoFluxoFinanceiroPorRelatorioId,
        fechamentoIvaPorRelatorioId,
        fechamentoItensOmitidosPorRelatorio,
        saldoDevedorPecas: Number(cliente.saldoPendente ?? 0),
      }),
    [
      cliente.id,
      cliente.saldoPendente,
      relatorioIds,
      faturasPecas,
      fechamentosGuardadosBibliotecaIds,
      fechamentosRelatorios,
      fechamentoFluxoFinanceiroPorRelatorioId,
      fechamentoIvaPorRelatorioId,
      fechamentoItensOmitidosPorRelatorio,
    ]
  )

  const servicosFinanceiros = useMemo(
    () =>
      buildServicosFinanceirosCliente({
        relatorios: relatoriosFinanceiros,
        fechamentosGuardadosBibliotecaIds,
        fechamentosRelatorios,
        fechamentoFluxoFinanceiroPorRelatorioId,
        fechamentoIvaPorRelatorioId,
        fechamentoItensOmitidosPorRelatorio,
      }),
    [
      relatoriosFinanceiros,
      fechamentosGuardadosBibliotecaIds,
      fechamentosRelatorios,
      fechamentoFluxoFinanceiroPorRelatorioId,
      fechamentoIvaPorRelatorioId,
      fechamentoItensOmitidosPorRelatorio,
    ]
  )

  const relatoriosConcluidos = useMemo(
    () =>
      relatorios.filter((r) =>
        relatorioServicoConsideradoConcluido(r, fechamentosGuardadosBibliotecaIds)
      ),
    [relatorios, fechamentosGuardadosBibliotecaIds]
  )
  const relatoriosEmAberto = useMemo(
    () =>
      relatorios.filter(
        (r) => !relatorioServicoConsideradoConcluido(r, fechamentosGuardadosBibliotecaIds)
      ),
    [relatorios, fechamentosGuardadosBibliotecaIds]
  )

  const iniciais = useMemo(() => {
    const palavras = cliente.nomeEmpresa.trim().split(/\s+/)
    if (palavras.length >= 2) return (palavras[0][0] + palavras[1][0]).toUpperCase()
    return cliente.nomeEmpresa.substring(0, 2).toUpperCase()
  }, [cliente.nomeEmpresa])

  const equipamentos = cliente.equipamentos || []
  const vazio = tr('na')
  const fmt = (v: number) => fmtEuro(v, language)
  const fmtData = (d: string | undefined) => formatarData(d, language, vazio)

  const pagamentoLabel = (pag: 'pago' | 'pendente' | 'devedor') =>
    pag === 'pago'
      ? tr('pagoStatus')
      : pag === 'devedor'
        ? tr('devedorStatus')
        : tr('pagamentoPendenteStatus') || tr('pendenteStatus')

  const cidadeExibicao = [cliente.localidade, cliente.conselho].map((s) => String(s || '').trim()).filter(Boolean).join(' · ')

  const codigoExib = codigoClienteExibicao(cliente)
  const devedor = isClienteMarcadoDevedor(cliente)

  const renderHistoricoLista = (items: typeof relatorios) => (
    <ul className="cliente-detalhe-v2__hist-list">
      {items.map((rel) => (
        <li key={rel.id} className="cliente-detalhe-v2__hist-item">
          <div className="cliente-detalhe-v2__hist-main">
            <strong>{rel.tipoServico || rel.numero}</strong>
            <span className="cliente-detalhe-v2__hist-id">{rel.numero}</span>
            <span className="cliente-detalhe-v2__hist-date">{fmtData(rel.data)}</span>
          </div>
          <span
            className={
              'cliente-detalhe-v2__status-pill' +
              (rel.servicoConcluido
                ? ' cliente-detalhe-v2__status-pill--pago'
                : ' cliente-detalhe-v2__status-pill--pendente')
            }
          >
            {rel.servicoConcluido ? tr('fechado') : tr('pendenteStatus')}
          </span>
        </li>
      ))}
    </ul>
  )

  return (
    <div className={`cliente-detalhe-v2${devedor ? ' cliente-detalhe-v2--devedor' : ''}`}>
      <header className="cliente-detalhe-v2__page-header">
        <nav className="cliente-detalhe-v2__breadcrumb" aria-label="Breadcrumb">
          <span className="cliente-detalhe-v2__breadcrumb-home">
            <IconHome size={14} />
          </span>
          <span className="cliente-detalhe-v2__breadcrumb-sep">/</span>
          <span>{codigoExib}</span>
        </nav>
        <div className="cliente-detalhe-v2__title-row">
          <div>
            <h2 className="cliente-detalhe-v2__title">{tr('detalhesCliente')}</h2>
            <p className="cliente-detalhe-v2__subtitle">{tr('detalhesClienteSubtitle')}</p>
          </div>
          <button type="button" className="cliente-detalhe-v2__back-btn" onClick={onBack} title={tr('voltar')}>
            <IconArrowLeft />
          </button>
        </div>
      </header>

      <section className="cliente-detalhe-v2__card cliente-detalhe-v2__card--info">
        <div className="cliente-detalhe-v2__card-top">
          <h3 className="cliente-detalhe-v2__card-main-title">{tr('informacoesCliente')}</h3>
          <div className="cliente-detalhe-v2__info-actions">
            <button type="button" className="cliente-detalhe-v2__btn cliente-detalhe-v2__btn--edit" onClick={onEdit}>
              <IconPencil />
              {tr('edit')}
            </button>
            <button type="button" className="cliente-detalhe-v2__btn cliente-detalhe-v2__btn--delete" onClick={onDelete}>
              <IconTrash />
              {tr('delete')}
            </button>
          </div>
        </div>

        <ClienteEnderecoMapsActions
          endereco={{
            morada: cliente.morada,
            localidade: cliente.localidade,
            conselho: cliente.conselho,
            codigoPostal: cliente.codigoPostal,
            pais: cliente.pais,
          }}
          tr={tr}
          className="cliente-detalhe-v2__maps-hero"
        />

        <div className="cliente-detalhe-v2__info-grid">
          <div className="cliente-detalhe-v2__profile">
            <div className="cliente-detalhe-v2__avatar">
              {cliente.photo ? (
                <img src={cliente.photo} alt="" className="cliente-detalhe-v2__avatar-img" />
              ) : (
                <span className="cliente-detalhe-v2__avatar-iniciais">{iniciais}</span>
              )}
            </div>
            <h3 className="cliente-detalhe-v2__profile-name">{cliente.nomeEmpresa}</h3>
            <p className="cliente-detalhe-v2__profile-nif">{tr('clienteCodigoLabel')}: {codigoExib}</p>
            {cliente.numeroContribuicaoFiscal ? (
              <p className="cliente-detalhe-v2__profile-nif">{cliente.numeroContribuicaoFiscal}</p>
            ) : null}
          </div>

          <div className="cliente-detalhe-v2__info-col">
            <h4 className="cliente-detalhe-v2__col-title">{tr('informacoesContato')}</h4>
            <InfoRow icon={<IconPhone />} value={cliente.telefones?.trim() || vazio} />
            <InfoRow icon={<IconMapPin />} value={cliente.morada?.trim() || vazio} />
            {cidadeExibicao ? (
              <InfoRow icon={<IconMapPin />} label={tr('cidade')} value={cidadeExibicao} />
            ) : null}
            {cliente.codigoPostal ? (
              <InfoRow icon={<IconMapPin />} label={tr('codigoPostal')} value={cliente.codigoPostal} />
            ) : null}
            <InfoRow
              icon={<IconIdCard size={16} />}
              label={tr('nif')}
              value={cliente.numeroContribuicaoFiscal?.trim() || vazio}
            />
          </div>

          <div className="cliente-detalhe-v2__info-col">
            <h4 className="cliente-detalhe-v2__col-title">{tr('estatisticasCliente')}</h4>
            <StatRow icon={<IconCalendar />} label={tr('clienteDesde')} value={dataClienteDesde(relatorios, language, vazio)} />
            <StatRow icon={<IconUsers />} label={tr('totalServicos')} value={String(relatorios.length)} />
            <StatRow icon={<IconPrinter />} label={tr('equipamentosTitulo')} value={String(equipamentos.length)} />
            <StatRow icon={<IconHash />} label={tr('clienteCodigoLabel')} value={codigoExib} />
            <StatRow icon={<IconHash />} label={tr('idCliente')} value={idClienteExibicao(cliente.id)} />
          </div>
        </div>
      </section>

      <section className="cliente-detalhe-v2__card">
        <div className="cliente-detalhe-v2__section-header">
          <h3 className="cliente-detalhe-v2__section-title">
            <IconPrinter className="cliente-detalhe-v2__section-title-icon" />
            {tr('equipamentosTitulo')} ({equipamentos.length})
          </h3>
          <button type="button" className="cliente-detalhe-v2__btn-add" onClick={onAddEquipamento}>
            <span>+</span>
            {tr('addEquipamento')}
          </button>
        </div>
        {equipamentos.length === 0 ? (
          <p className="cliente-detalhe-v2__empty">{tr('noEquipamentos')}</p>
        ) : (
          <div className="cliente-detalhe-v2__equip-grid">
            {equipamentos.map((eq, index) => {
              const photo = eq.photo || eq.coverPhoto
              const idEquip = rotuloIdEquipamentoCliente(eq, equipamentosArmazem, index)
              return (
                <button
                  key={eq.id || `${eq.numeroSerie}-${index}`}
                  type="button"
                  className="cliente-detalhe-v2__equip-card"
                  onClick={onViewEquipamentos}
                >
                  <div className="cliente-detalhe-v2__equip-icon">
                    {photo ? (
                      <img src={photo} alt="" />
                    ) : (
                      <IconPrinter />
                    )}
                  </div>
                  <div className="cliente-detalhe-v2__equip-body">
                    <strong>{[eq.marca, eq.modelo].filter(Boolean).join(' ') || eq.tipoEquipamento}</strong>
                    {idEquip ? (
                      <span className="cliente-detalhe-v2__equip-id" title={idEquip.titulo || idEquip.texto}>
                        {tr('equipamentoId')}: {idEquip.texto}
                      </span>
                    ) : null}
                    {eq.numeroSerie ? <span>{eq.numeroSerie}</span> : null}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <ClienteOrcamentosFichaSection
        clienteId={cliente.id}
        clienteNome={cliente.nomeEmpresa}
        equipamentos={equipamentos}
        equipamentosArmazem={equipamentosArmazem}
        pedidosRelatorio={pedidosRelatorio}
        safeT={safeT}
        loadData={loadData}
        onUpdatePedidoRelatorioStatus={onUpdatePedidoRelatorioStatus}
        onVisualizarPdfRelatorio={onVisualizarPdfRelatorio}
        onVisualizarPdfAvulso={onVisualizarPdfAvulso}
        onAtualizarPedidoAvulso={onAtualizarPedidoAvulso}
        onAtualizarOrcamentosGerados={onAtualizarOrcamentosGerados}
      />

      <section className="cliente-detalhe-v2__card">
        <h3 className="cliente-detalhe-v2__section-title cliente-detalhe-v2__section-title--solo">
          <span className="cliente-detalhe-v2__euro-icon">€</span>
          {tr('situacaoFinanceira')}
        </h3>

        <div className="cliente-detalhe-v2__fin-grid cliente-detalhe-v2__fin-grid--4">
          <div className="cliente-detalhe-v2__fin-stat">
            <span className="cliente-detalhe-v2__fin-stat-label">{tr('totalFaturado')}</span>
            <span className="cliente-detalhe-v2__fin-stat-value">{fmt(resumoFinanceiro.totalFaturado)}</span>
          </div>
          <div className="cliente-detalhe-v2__fin-stat cliente-detalhe-v2__fin-stat--green">
            <span className="cliente-detalhe-v2__fin-stat-label">{tr('pagosLabel')}</span>
            <span className="cliente-detalhe-v2__fin-stat-value">{fmt(resumoFinanceiro.pagos)}</span>
          </div>
          <div className="cliente-detalhe-v2__fin-stat cliente-detalhe-v2__fin-stat--yellow">
            <span className="cliente-detalhe-v2__fin-stat-label">{tr('pendentesLabel')}</span>
            <span className="cliente-detalhe-v2__fin-stat-value">{fmt(resumoFinanceiro.pendentes)}</span>
          </div>
          <div className="cliente-detalhe-v2__fin-stat cliente-detalhe-v2__fin-stat--red">
            <span className="cliente-detalhe-v2__fin-stat-label">{tr('devedoresLabel')}</span>
            <span className="cliente-detalhe-v2__fin-stat-value">{fmt(resumoFinanceiro.devedores)}</span>
          </div>
        </div>

        <div className="cliente-detalhe-v2__fin-grid cliente-detalhe-v2__fin-grid--2">
          <div className="cliente-detalhe-v2__fin-stat cliente-detalhe-v2__fin-stat--wide cliente-detalhe-v2__fin-stat--blue">
            <span className="cliente-detalhe-v2__fin-stat-label">{tr('ivaTotalLabel')}</span>
            <span className="cliente-detalhe-v2__fin-stat-value">{fmt(resumoFinanceiro.ivaTotal)}</span>
          </div>
          <div className="cliente-detalhe-v2__fin-stat cliente-detalhe-v2__fin-stat--wide cliente-detalhe-v2__fin-stat--purple">
            <span className="cliente-detalhe-v2__fin-stat-label">{tr('vendasSemIva')}</span>
            <span className="cliente-detalhe-v2__fin-stat-value">{fmt(resumoFinanceiro.vendasSemIva)}</span>
          </div>
        </div>

        {servicosFinanceiros.length > 0 ? (
          <div className="cliente-detalhe-v2__fin-historico">
            <h4 className="cliente-detalhe-v2__fin-historico-title">
              {tr('historicoServicos')} ({servicosFinanceiros.length})
            </h4>
            {servicosFinanceiros.map((srv) => (
              <div key={srv.relatorioId} className="cliente-detalhe-v2__fin-servico">
                <div className="cliente-detalhe-v2__fin-servico-head">
                  <div>
                    <strong>{srv.titulo}</strong>
                    <span className="cliente-detalhe-v2__fin-servico-id">{srv.numero}</span>
                    {srv.servicoConcluido ? (
                      <span
                        className="cliente-detalhe-v2__status-pill cliente-detalhe-v2__status-pill--pago"
                        style={{ marginLeft: 8, fontSize: '0.72rem' }}
                      >
                        {tr('servicoConcluido') || 'Serviço concluído'}
                      </span>
                    ) : null}
                  </div>
                  <span className={`cliente-detalhe-v2__status-pill cliente-detalhe-v2__status-pill--${srv.pagamento}`}>
                    {pagamentoLabel(srv.pagamento)}
                  </span>
                </div>
                <div className="cliente-detalhe-v2__fin-servico-meta">
                  <span>
                    {tr('dataLabel')}: {fmtData(srv.data)}
                  </span>
                  <span>
                    {tr('subtotalLabel')}: {fmt(srv.subtotal)}
                  </span>
                  <span>
                    {tr('ivaTotalLabel')}: {fmt(srv.iva)}
                  </span>
                  <span>
                    {tr('totalLabel')}: {fmt(srv.total)}
                  </span>
                </div>
                <PagamentoPills pagamento={srv.pagamento} tr={tr} />
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="cliente-detalhe-v2__card">
        <h3 className="cliente-detalhe-v2__section-title cliente-detalhe-v2__section-title--solo">
          <IconUsers className="cliente-detalhe-v2__section-title-icon" />
          {tr('historicoServicos')} ({relatorios.length})
        </h3>
        {relatorios.length === 0 ? (
          <p className="cliente-detalhe-v2__empty">{tr('noHistoricoServicos')}</p>
        ) : (
          <div className="cliente-detalhe-v2__hist-groups">
            {relatoriosConcluidos.length > 0 ? (
              <div className="cliente-detalhe-v2__hist-group">
                <h4 className="cliente-detalhe-v2__hist-group-title">
                  {tr('servicoConcluido') || tr('fechado') || 'Concluídos'} ({relatoriosConcluidos.length})
                </h4>
                {renderHistoricoLista(relatoriosConcluidos)}
              </div>
            ) : null}
            {relatoriosEmAberto.length > 0 ? (
              <div className="cliente-detalhe-v2__hist-group">
                <h4 className="cliente-detalhe-v2__hist-group-title">
                  {tr('pendenteStatus') || 'Sem conclusão'} ({relatoriosEmAberto.length})
                </h4>
                {renderHistoricoLista(relatoriosEmAberto)}
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  )
}
