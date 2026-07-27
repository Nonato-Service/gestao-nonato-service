'use client'

import React, { useMemo, useState } from 'react'
import { AssistTextarea } from './AssistTextFields'
import {
  coletarCodigosMatriz,
  formatServicoValorExibicao,
  labelCategoria,
  labelTipoCobranca,
  ordenarServicoGrupos,
  servicoCodParaExibicao,
  servicoPorCodNoGrupo,
  type ServicoCadastroGrupo,
  type ServicoCadastroItem,
} from '../lib/servicosCadastroUtils'

type TabId = 'grupos' | 'matriz' | 'listar'

type Props = {
  servicoGrupos: ServicoCadastroGrupo[]
  servicos: ServicoCadastroItem[]
  clientes: Array<{ id: string; nomeEmpresa?: string; grupoTarifaId?: string }>
  safeT: Record<string, string | undefined>
  activeTabId?: string
  closeTab: (id: string) => void
  voltarPaginaInicial: () => void
  restaurarCadastroServicosDoServidor: () => Promise<number>
  logoSlot: React.ReactNode
  servicoGrupoSelecionadoId: string | null
  setServicoGrupoSelecionadoId: (id: string | null) => void
  servicoGrupoNomeEdicao: string
  setServicoGrupoNomeEdicao: (v: string) => void
  novoServicoGrupoNome: string
  setNovoServicoGrupoNome: (v: string) => void
  showServicoForm: boolean
  setShowServicoForm: (v: boolean) => void
  editingServico: ServicoCadastroItem | null
  setEditingServico: (v: ServicoCadastroItem | null) => void
  servicoForm: {
    cod: string
    nome: string
    descricao: string
    valor: number
    grupoId: string
    tipoCobranca: ServicoCadastroItem['tipoCobranca']
    categoria: ServicoCadastroItem['categoria']
  }
  setServicoForm: React.Dispatch<
    React.SetStateAction<{
      cod: string
      nome: string
      descricao: string
      valor: number
      grupoId: string
      tipoCobranca: ServicoCadastroItem['tipoCobranca']
      categoria: ServicoCadastroItem['categoria']
    }>
  >
  servicoValorInput: string
  setServicoValorInput: (v: string) => void
  servicoGrupoIdPadrao: () => string
  onAddGrupo: () => void
  onDuplicarGrupo: (nomeNovo: string, origemId: string) => void
  onAplicarTemplate: (grupoId: string) => void
  onSalvarNomeGrupo: () => void
  onDeleteGrupo: (grupoId: string) => void
  onMoveGrupo: (grupoId: string, dir: 'up' | 'down') => void
  onAddServico: () => void
  onQuickAddHtt: (grupoId?: string) => void
  onEditServico: (servico: ServicoCadastroItem) => void
  onDeleteServico: (id: string) => void
  onSaveServico: () => void
  onResetServicoForm: () => void
}

function ServicoFormBlock(props: Pick<
  Props,
  | 'safeT'
  | 'servicoGrupos'
  | 'servicoGrupoSelecionadoId'
  | 'servicoForm'
  | 'setServicoForm'
  | 'servicoValorInput'
  | 'setServicoValorInput'
  | 'editingServico'
  | 'onSaveServico'
  | 'onResetServicoForm'
>) {
  const {
    safeT,
    servicoGrupos,
    servicoGrupoSelecionadoId,
    servicoForm,
    setServicoForm,
    servicoValorInput,
    setServicoValorInput,
    editingServico,
    onSaveServico,
    onResetServicoForm,
  } = props

  return (
    <div className="cadastro-valores-v2__card orcamento-pecas-especiais-linha" style={{ marginBottom: '15px' }}>
      <div className="orcamento-pecas-especiais-linha-head">
        <strong>
        {editingServico ? safeT.editarServico || 'Editar Serviço' : safeT.adicionarServico || 'Adicionar Serviço ou Despesa'}
        </strong>
      </div>
      <label className="orcamento-pecas-especiais-label">{safeT.servicosServicoGrupo || 'Grupo'}</label>
      <select
        className="orcamento-pecas-especiais-input cadastro-valores-v2__field"
        value={servicoForm.grupoId || servicoGrupoSelecionadoId || ordenarServicoGrupos(servicoGrupos)[0]?.id || ''}
        onChange={(e) => setServicoForm({ ...servicoForm, grupoId: e.target.value })}
      >
        {ordenarServicoGrupos(servicoGrupos).map((g) => (
          <option key={g.id} value={g.id}>
            {g.nome}
          </option>
        ))}
      </select>
      <label className="orcamento-pecas-especiais-label">{safeT.tipo || 'Tipo'}</label>
      <select
        className="orcamento-pecas-especiais-input cadastro-valores-v2__field"
        value={servicoForm.categoria}
        onChange={(e) => setServicoForm({ ...servicoForm, categoria: e.target.value as 'servico' | 'despesa' })}
      >
        <option value="servico">{safeT.servico || 'SERVIÇO'}</option>
        <option value="despesa">{safeT.despesa || 'DESPESA'}</option>
      </select>
      <div className="cadastro-valores-v2__cod-row">
        <label className="orcamento-pecas-especiais-label cadastro-valores-v2__cod-label">COD</label>
        <input
          type="text"
          className="orcamento-pecas-especiais-input"
          placeholder={(safeT as any).codigoServico || 'HTT'}
          value={servicoForm.cod}
          onChange={(e) => setServicoForm({ ...servicoForm, cod: e.target.value })}
        />
      </div>
      <label className="orcamento-pecas-especiais-label">{safeT.nomeServico || 'Nome do Serviço/Despesa'}</label>
      <input
        type="text"
        className="orcamento-pecas-especiais-input cadastro-valores-v2__field"
        placeholder={safeT.nomeServico || 'Nome do Serviço/Despesa'}
        value={servicoForm.nome}
        onChange={(e) => setServicoForm({ ...servicoForm, nome: e.target.value })}
      />
      <label className="orcamento-pecas-especiais-label">{safeT.descricaoServico || 'Descrição (opcional)'}</label>
      <AssistTextarea
        placeholder={safeT.descricaoServico || 'Descrição (opcional)'}
        value={servicoForm.descricao}
        onValueChange={(v) => setServicoForm({ ...servicoForm, descricao: v })}
        rows={3}
        className="orcamento-pecas-especiais-textarea cadastro-valores-v2__field"
      />
      <label className="orcamento-pecas-especiais-label">{safeT.valorServico || 'Valor (ex.: 60 ou 60,00)'}</label>
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        className="orcamento-pecas-especiais-input cadastro-valores-v2__field"
        placeholder={safeT.valorServico || 'Valor (ex.: 60 ou 60,00)'}
        value={servicoValorInput}
        onChange={(e) => setServicoValorInput(e.target.value)}
      />
      <label className="orcamento-pecas-especiais-label">{safeT.tipoCobranca || 'Tipo de cobrança'}</label>
      <select
        className="orcamento-pecas-especiais-input cadastro-valores-v2__field"
        value={servicoForm.tipoCobranca}
        onChange={(e) =>
          setServicoForm({
            ...servicoForm,
            tipoCobranca: e.target.value as ServicoCadastroItem['tipoCobranca'],
          })
        }
      >
        <option value="unidade">{safeT.tipoCobrancaUnidade || 'Por Unidade'}</option>
        <option value="km">{safeT.tipoCobrancaKm || 'Por KM'}</option>
        <option value="hora">{safeT.tipoCobrancaHora || 'Por Hora'}</option>
        <option value="valor-fixo">{safeT.tipoCobrancaValorFixo || 'Valor Fixo'}</option>
        <option value="diarias">{safeT.tipoCobrancaDiarias || 'Diárias'}</option>
        <option value="extras">{safeT.tipoCobrancaExtras || 'Extras'}</option>
      </select>
      <div className="orcamento-pecas-especiais-actions cadastro-valores-v2__form-actions">
        <button type="button" className="btn-primary" onClick={onSaveServico}>
          {safeT.save || 'Salvar'}
        </button>
        <button type="button" className="cadastro-valores-v2__btn-secondary orcamento-pecas-especiais-btn-cancelar" onClick={onResetServicoForm}>
          {safeT.cancel || 'Cancelar'}
        </button>
      </div>
    </div>
  )
}

export function CadastroServicosContent(props: Props) {
  const {
    servicoGrupos,
    servicos,
    clientes,
    safeT,
    activeTabId,
    closeTab,
    voltarPaginaInicial,
    restaurarCadastroServicosDoServidor,
    logoSlot,
    servicoGrupoSelecionadoId,
    setServicoGrupoSelecionadoId,
    servicoGrupoNomeEdicao,
    setServicoGrupoNomeEdicao,
    novoServicoGrupoNome,
    setNovoServicoGrupoNome,
    showServicoForm,
    onAddGrupo,
    onDuplicarGrupo,
    onAplicarTemplate,
    onSalvarNomeGrupo,
    onDeleteGrupo,
    onMoveGrupo,
    onAddServico,
    onQuickAddHtt,
    onEditServico,
    onDeleteServico,
  } = props

  const [activeTab, setActiveTab] = useState<TabId>('grupos')
  const [duplicarNome, setDuplicarNome] = useState('')
  const [duplicarOrigemId, setDuplicarOrigemId] = useState('')

  const gruposOrdenados = useMemo(() => ordenarServicoGrupos(servicoGrupos), [servicoGrupos])
  const codigosMatriz = useMemo(() => coletarCodigosMatriz(servicos), [servicos])

  const clientesPorGrupo = useMemo(() => {
    const map: Record<string, number> = {}
    clientes.forEach((c) => {
      const gid = c.grupoTarifaId || ''
      if (gid) map[gid] = (map[gid] || 0) + 1
    })
    return map
  }, [clientes])

  const itensGrupoSelecionado = useMemo(() => {
    if (!servicoGrupoSelecionadoId) return []
    return servicos
      .filter((s) => s.grupoId === servicoGrupoSelecionadoId)
      .slice()
      .sort((a, b) => {
        const ca = servicoCodParaExibicao(a)
        const cb = servicoCodParaExibicao(b)
        if (ca && cb) return ca.localeCompare(cb)
        return a.nome.localeCompare(b.nome)
      })
  }, [servicos, servicoGrupoSelecionadoId])

  const statsGrupoSelecionado = useMemo(() => {
    const itens = itensGrupoSelecionado
    const semValor = itens.filter((s) => !s.valor || s.valor <= 0).length
    const servicosCount = itens.filter((s) => s.categoria === 'servico').length
    const despesasCount = itens.filter((s) => s.categoria === 'despesa').length
    const clientesCount = servicoGrupoSelecionadoId ? clientesPorGrupo[servicoGrupoSelecionadoId] || 0 : 0
    return { total: itens.length, semValor, servicosCount, despesasCount, clientesCount }
  }, [itensGrupoSelecionado, servicoGrupoSelecionadoId, clientesPorGrupo])

  const grupoSelecionado = useMemo(
    () => gruposOrdenados.find((g) => g.id === servicoGrupoSelecionadoId) || null,
    [gruposOrdenados, servicoGrupoSelecionadoId]
  )

  const tabClass = (tab: TabId) =>
    'cadastro-valores-v2__tab' + (activeTab === tab ? ' cadastro-valores-v2__tab--active' : '')

  const renderTabs = () => (
    <>
      <button type="button" className={tabClass('grupos')} onClick={() => setActiveTab('grupos')}>
        📁 {safeT.servicosPorGrupoTab || 'Por grupos'}
      </button>
      <button type="button" className={tabClass('matriz')} onClick={() => setActiveTab('matriz')}>
        📊 {safeT.servicosMatrizTab || 'Matriz de tarifas'}
      </button>
      <button type="button" className={tabClass('listar')} onClick={() => setActiveTab('listar')}>
        📋 {safeT.servicosListarTodosTab || 'Ver todos'} ({servicos.length})
      </button>
    </>
  )

  return (
    <div className="tab-content-wrapper tab-glass-root tab-glass-root--wide ns-ui-v2 cadastro-valores-v2 orcamento-pecas-especiais-page">
      <div className="mobile-sticky-toolbar">
        <button className="mobile-toolbar-btn mobile-toolbar-voltar" onClick={() => closeTab(activeTabId || '')} title={safeT.voltar || 'Voltar'}>
          ↶ {safeT.voltar || 'Voltar'}
        </button>
        <button className={`mobile-toolbar-btn ${activeTab === 'grupos' ? 'active' : ''}`} onClick={() => setActiveTab('grupos')}>
          📁 {safeT.servicosPorGrupoTab || 'Grupos'}
        </button>
        <button className={`mobile-toolbar-btn ${activeTab === 'matriz' ? 'active' : ''}`} onClick={() => setActiveTab('matriz')}>
          📊 {safeT.servicosMatrizTab || 'Matriz'}
        </button>
        <button className={`mobile-toolbar-btn ${activeTab === 'listar' ? 'active' : ''}`} onClick={() => setActiveTab('listar')}>
          📋 {servicos.length}
        </button>
        <button className="mobile-toolbar-btn mobile-toolbar-home" onClick={voltarPaginaInicial} title={safeT.paginaInicial || 'Página Inicial'}>
          🏠
        </button>
      </div>

      <div className="cadastro-valores-v2__hero">
        <div className="cadastro-valores-v2__hero-row">
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>{logoSlot}</div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 className="cadastro-valores-v2__hero-title">{safeT.cadastroServicosTitle || 'CADASTRO DE SERVIÇOS / VALORES'}</h1>
            <p className="cadastro-valores-v2__hero-meta">
              {servicoGrupos.length} {safeT.servicosGruposTitulo || 'grupo(s)'} · {servicos.length}{' '}
              {safeT.servicosCadastrados || 'serviço(s) cadastrado(s)'}
            </p>
            <p className="cadastro-valores-v2__hero-meta" style={{ marginTop: '6px' }}>
              {safeT.servicosHubAjuda ||
                'Organize tabelas de preços por grupo (ex.: NONATO SERVICE, HOMAG USA). Cada cliente usa um grupo no cadastro.'}
            </p>
          </div>
          <div className="cadastro-valores-v2__hero-actions">
            <button
              type="button"
              className="cadastro-valores-v2__btn-green"
              onClick={() => {
                void restaurarCadastroServicosDoServidor()
                  .then((n) => {
                    if (n > 0) {
                      alert(safeT.cadastroRecuperadoOk || `Cadastro recuperado: ${n} serviço(s) (HTT, HTV, KRC, etc.).`)
                    }
                  })
                  .catch(() => {
                    alert(
                      safeT.cadastroRecuperadoErro ||
                        'Não foi possível recuperar. Confirme que o servidor está a correr neste PC e volte a tentar.'
                    )
                  })
              }}
            >
              ↻ {safeT.servicosRecuperarCadastro || 'Recuperar cadastro'}
            </button>
            <button type="button" className="cadastro-valores-v2__btn-nav" onClick={() => closeTab(activeTabId || '')} title={safeT.voltar || 'Voltar'}>
              ↶
            </button>
            <button type="button" className="cadastro-valores-v2__btn-nav cadastro-valores-v2__btn-nav--home" onClick={voltarPaginaInicial} title={safeT.paginaInicial || 'Página Inicial'}>
              🏠
            </button>
          </div>
        </div>
      </div>

      <div className="tab-nav-desktop cadastro-valores-v2__tabs">{renderTabs()}</div>

      {servicos.length === 0 && (
        <div className="cadastro-valores-v2__alert">
          {safeT.servicosCadastroVazioAviso ||
            'O cadastro neste aparelho está vazio. Toque em «Recuperar cadastro» ou crie grupos e aplique o template padrão (HTT, KRC, diárias…).'}
        </div>
      )}

      {activeTab === 'grupos' && (
        <div className="cadastro-valores-v2__layout orcamento-pecas-especiais-form">
          <aside className="cadastro-valores-v2__sidebar">
            <h3 className="cadastro-valores-v2__card-title">{safeT.servicosGruposTitulo || 'Grupos de tarifa'}</h3>
            <p className="cadastro-valores-v2__card-hint">
              {safeT.servicosGruposAjuda ||
                'Crie grupos (ex.: NONATO SERVICE, HOMAG USA). Em cada grupo, cadastre HTT e demais valores — os clientes do mesmo grupo usam esta tabela.'}
            </p>
            <div className="cadastro-valores-v2__grupo-list">
              {gruposOrdenados.map((g, index) => {
                const nServ = servicos.filter((s) => s.grupoId === g.id).length
                const nCli = clientesPorGrupo[g.id] || 0
                const nZero = servicos.filter((s) => s.grupoId === g.id && (!s.valor || s.valor <= 0)).length
                const sel = servicoGrupoSelecionadoId === g.id
                return (
                  <button
                    key={g.id}
                    type="button"
                    className={'cadastro-valores-v2__grupo-btn' + (sel ? ' cadastro-valores-v2__grupo-btn--selected' : '')}
                    onClick={() => {
                      setServicoGrupoSelecionadoId(g.id)
                      setServicoGrupoNomeEdicao(g.nome)
                      setDuplicarOrigemId(g.id)
                    }}
                  >
                    <div className="cadastro-valores-v2__grupo-btn-row">
                      <span className="cadastro-valores-v2__grupo-btn-index" aria-hidden>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="cadastro-valores-v2__grupo-btn-body">
                        <div className="cadastro-valores-v2__grupo-btn-name">{g.nome}</div>
                        <div className="cadastro-valores-v2__grupo-btn-meta">
                          <span className="cadastro-valores-v2__grupo-stat">
                            {nServ} {safeT.servicosItensLabel || 'itens'}
                          </span>
                          <span className="cadastro-valores-v2__grupo-stat">
                            {nCli} {safeT.servicosClientesLabel || 'clientes'}
                          </span>
                          {nZero > 0 ? (
                            <span className="cadastro-valores-v2__grupo-stat cadastro-valores-v2__grupo-stat--warn">
                              {nZero} {safeT.servicosSemValorLabel || 'sem valor'}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="cadastro-valores-v2__sidebar-footer">
              <div>
                <div className="cadastro-valores-v2__section-label">{safeT.servicosNovoGrupoTitulo || 'Novo grupo vazio'}</div>
                <input
                  type="text"
                  className="cadastro-valores-v2__input cadastro-valores-v2__field"
                  value={novoServicoGrupoNome}
                  onChange={(e) => setNovoServicoGrupoNome(e.target.value)}
                  placeholder={safeT.servicosGrupoNomePlaceholder || 'Nome do novo grupo'}
                />
                <button type="button" className="cadastro-valores-v2__btn-green" style={{ width: '100%' }} onClick={onAddGrupo}>
                  + {safeT.servicosNovoGrupo || 'Criar grupo'}
                </button>
              </div>

              <div className="cadastro-valores-v2__sidebar-divider">
                <div className="cadastro-valores-v2__section-label">{safeT.servicosDuplicarGrupoTitulo || 'Duplicar tabela de outro grupo'}</div>
                <select
                  className="cadastro-valores-v2__select cadastro-valores-v2__field"
                  value={duplicarOrigemId || servicoGrupoSelecionadoId || gruposOrdenados[0]?.id || ''}
                  onChange={(e) => setDuplicarOrigemId(e.target.value)}
                >
                  {gruposOrdenados.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nome}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  className="cadastro-valores-v2__input cadastro-valores-v2__field"
                  value={duplicarNome}
                  onChange={(e) => setDuplicarNome(e.target.value)}
                  placeholder={safeT.servicosDuplicarGrupoPlaceholder || 'Nome do novo grupo (cópia)'}
                />
                <button
                  type="button"
                  className="cadastro-valores-v2__btn-info"
                  style={{ width: '100%' }}
                  onClick={() => {
                    const origem = duplicarOrigemId || servicoGrupoSelecionadoId || gruposOrdenados[0]?.id
                    if (origem) onDuplicarGrupo(duplicarNome, origem)
                  }}
                >
                  ⧉ {safeT.servicosDuplicarGrupoBtn || 'Duplicar grupo'}
                </button>
              </div>
            </div>
          </aside>

          <section className="cadastro-valores-v2__main">
            {servicoGrupoSelecionadoId && grupoSelecionado ? (
              <>
                <div className="cadastro-valores-v2__group-panel">
                  <div className="cadastro-valores-v2__group-panel-top">
                    <div className="cadastro-valores-v2__group-panel-intro">
                      <span className="cadastro-valores-v2__group-kicker">
                        {safeT.servicosGrupoAtivoLabel || 'Grupo de tarifa activo'}
                      </span>
                      <h2 className="cadastro-valores-v2__group-name">{grupoSelecionado.nome}</h2>
                      <p className="cadastro-valores-v2__group-report-hint">
                        {safeT.servicosGrupoRelatorioHint ||
                          'Os códigos (COD) e valores desta tabela são usados automaticamente nos relatórios de serviço dos clientes deste grupo.'}
                      </p>
                    </div>
                    <div className="cadastro-valores-v2__group-summary">
                      <div className="cadastro-valores-v2__group-summary-item">
                        <span className="cadastro-valores-v2__group-summary-label">{safeT.servicosItensLabel || 'Itens'}</span>
                        <strong>{statsGrupoSelecionado.total}</strong>
                      </div>
                      <div className="cadastro-valores-v2__group-summary-item">
                        <span className="cadastro-valores-v2__group-summary-label">{safeT.servicosClientesLabel || 'Clientes'}</span>
                        <strong>{statsGrupoSelecionado.clientesCount}</strong>
                      </div>
                      <div className="cadastro-valores-v2__group-summary-item">
                        <span className="cadastro-valores-v2__group-summary-label">{safeT.servico || 'Serviços'}</span>
                        <strong>{statsGrupoSelecionado.servicosCount}</strong>
                      </div>
                      <div className="cadastro-valores-v2__group-summary-item">
                        <span className="cadastro-valores-v2__group-summary-label">{safeT.despesa || 'Despesas'}</span>
                        <strong>{statsGrupoSelecionado.despesasCount}</strong>
                      </div>
                      {statsGrupoSelecionado.semValor > 0 ? (
                        <div className="cadastro-valores-v2__group-summary-item cadastro-valores-v2__group-summary-item--warn">
                          <span className="cadastro-valores-v2__group-summary-label">
                            {safeT.servicosSemValorLabel || 'Sem valor'}
                          </span>
                          <strong>{statsGrupoSelecionado.semValor}</strong>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="cadastro-valores-v2__group-rename">
                    <div className="cadastro-valores-v2__section-label">{safeT.servicosRenomearGrupo || 'Nome do grupo'}</div>
                    <div className="cadastro-valores-v2__rename-row">
                      <input
                        type="text"
                        className="cadastro-valores-v2__input"
                        value={servicoGrupoNomeEdicao}
                        onChange={(e) => setServicoGrupoNomeEdicao(e.target.value)}
                      />
                      <button type="button" className="cadastro-valores-v2__btn-green cadastro-valores-v2__btn-sm" onClick={onSalvarNomeGrupo}>
                        {safeT.save || 'Salvar'}
                      </button>
                      <button type="button" className="cadastro-valores-v2__btn-secondary cadastro-valores-v2__btn-sm" onClick={() => onMoveGrupo(servicoGrupoSelecionadoId, 'up')} title={safeT.servicosSubirGrupo || 'Subir'}>
                        ↑
                      </button>
                      <button type="button" className="cadastro-valores-v2__btn-secondary cadastro-valores-v2__btn-sm" onClick={() => onMoveGrupo(servicoGrupoSelecionadoId, 'down')} title={safeT.servicosDescerGrupo || 'Descer'}>
                        ↓
                      </button>
                      <button type="button" className="cadastro-valores-v2__btn-danger cadastro-valores-v2__btn-sm" onClick={() => onDeleteGrupo(servicoGrupoSelecionadoId)}>
                        {safeT.servicosExcluirGrupo || 'Excluir grupo'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="orcamento-pecas-especiais-section cadastro-valores-v2__items-section">
                  <div className="orcamento-pecas-especiais-section-head cadastro-valores-v2__toolbar--items">
                    <div className="cadastro-valores-v2__toolbar-copy">
                      <h3>{safeT.servicosItensDoGrupo || 'Trabalhos e valores'}</h3>
                    </div>
                    <div className="cadastro-valores-v2__toolbar-actions">
                      <button type="button" className="btn-primary cadastro-valores-v2__btn-sm" onClick={onAddServico}>
                        + {safeT.adicionarServico || 'Adicionar'}
                      </button>
                      <button type="button" className="cadastro-valores-v2__btn-info cadastro-valores-v2__btn-sm" onClick={() => onQuickAddHtt(servicoGrupoSelecionadoId || undefined)}>
                        + HTT
                      </button>
                      <button type="button" className="cadastro-valores-v2__btn-warn cadastro-valores-v2__btn-sm" onClick={() => onAplicarTemplate(servicoGrupoSelecionadoId)}>
                        ⚡ {safeT.servicosAplicarTemplate || 'Template padrão'}
                      </button>
                    </div>
                  </div>
                  <p className="orcamento-pecas-especiais-hint">
                    {safeT.servicosTabelaHint ||
                      'Mantenha COD único por grupo. O valor € alimenta linhas de serviço e despesas nos relatórios.'}
                  </p>
                </div>

                {showServicoForm && <ServicoFormBlock {...props} />}

                {itensGrupoSelecionado.length === 0 ? (
                  <p className="cadastro-valores-v2__empty">
                    {safeT.servicosNenhumItemNoGrupo || 'Nenhum item neste grupo.'}{' '}
                    {safeT.servicosUseTemplateHint || 'Use «Template padrão» para criar HTT, KRC, diárias, etc.'}
                  </p>
                ) : (
                  <div className="cadastro-valores-v2__table-wrap cadastro-valores-v2__table-wrap--pro">
                    <table className="cadastro-valores-v2__table cadastro-valores-v2__table--pro">
                      <colgroup>
                        <col className="cadastro-valores-v2__col-cod" />
                        <col className="cadastro-valores-v2__col-nome" />
                        <col className="cadastro-valores-v2__col-tipo" />
                        <col className="cadastro-valores-v2__col-cobranca" />
                        <col className="cadastro-valores-v2__col-valor" />
                        <col className="cadastro-valores-v2__col-acoes" />
                      </colgroup>
                      <thead>
                        <tr>
                          <th>COD</th>
                          <th>{safeT.nomeServico || 'Nome do serviço / despesa'}</th>
                          <th>{safeT.tipo || 'Tipo'}</th>
                          <th>{safeT.tipoCobranca || 'Tipo de cobrança'}</th>
                          <th className="cadastro-valores-v2__th-valor">{safeT.valorServico || 'Valor €'}</th>
                          <th>{safeT.acoes || 'Ações'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itensGrupoSelecionado.map((servico) => {
                          const cod = servicoCodParaExibicao(servico)
                          const valorZero = !servico.valor || servico.valor <= 0
                          return (
                            <tr key={servico.id} className={valorZero ? 'cadastro-valores-v2__row--warn' : undefined}>
                              <td className="cadastro-valores-v2__cod-cell">{cod || '—'}</td>
                              <td className="cadastro-valores-v2__nome-cell">
                                <div className="cadastro-valores-v2__nome-main">{servico.nome}</div>
                                {servico.descricao?.trim() ? (
                                  <div className="cadastro-valores-v2__nome-desc">{servico.descricao.trim()}</div>
                                ) : null}
                              </td>
                              <td>
                                <span
                                  className={`cadastro-valores-v2__tipo-badge cadastro-valores-v2__tipo-badge--${servico.categoria}`}
                                >
                                  {labelCategoria(servico.categoria, safeT)}
                                </span>
                              </td>
                              <td>
                                <span className="cadastro-valores-v2__cobranca-badge">
                                  {labelTipoCobranca(servico.tipoCobranca, safeT)}
                                </span>
                              </td>
                              <td
                                className={
                                  'cadastro-valores-v2__valor-cell' +
                                  (valorZero ? ' cadastro-valores-v2__valor-cell--zero' : '')
                                }
                              >
                                {formatServicoValorExibicao(servico.valor)} €
                              </td>
                              <td>
                                <div className="cadastro-valores-v2__table-actions">
                                  <button type="button" className="cadastro-valores-v2__btn-green cadastro-valores-v2__btn-sm" onClick={() => onEditServico(servico)}>
                                    {safeT.edit || 'Editar'}
                                  </button>
                                  <button type="button" className="cadastro-valores-v2__btn-danger cadastro-valores-v2__btn-sm" onClick={() => onDeleteServico(servico.id)}>
                                    {safeT.delete || 'Excluir'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <div className="cadastro-valores-v2__empty cadastro-valores-v2__empty--panel">
                {safeT.servicosEscolhaGrupo || 'Escolha um grupo à esquerda para ver e editar os valores usados nos relatórios.'}
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === 'matriz' && (
        <div className="orcamento-pecas-especiais-form cadastro-valores-v2__matriz-panel">
          <div className="orcamento-pecas-especiais-section">
            <h3>{safeT.servicosMatrizTitulo || 'Comparar valores entre grupos'}</h3>
            <p className="orcamento-pecas-especiais-hint">
              {safeT.servicosMatrizAjuda || 'Visão geral: compare HTT, km, diárias e outros códigos em todos os grupos de tarifa.'}
            </p>
            <p className="orcamento-pecas-especiais-hint">
              {safeT.servicosMatrizRelatorioHint ||
                'Valores a zero aparecem destacados — corrija no grupo antes de emitir relatórios. Clique no nome do grupo para editar a tabela.'}
            </p>
          </div>
          {gruposOrdenados.length === 0 || codigosMatriz.length === 0 ? (
            <p className="cadastro-valores-v2__empty">{safeT.servicosMatrizVazia || 'Cadastre grupos e serviços para ver a matriz.'}</p>
          ) : (
            <div className="cadastro-valores-v2__table-wrap cadastro-valores-v2__table-wrap--pro cadastro-valores-v2__table-wrap--matriz">
              <table className="cadastro-valores-v2__table cadastro-valores-v2__table--pro cadastro-valores-v2__table--matriz" style={{ minWidth: `${180 + gruposOrdenados.length * 100}px` }}>
                <thead>
                  <tr>
                    <th className="cadastro-valores-v2__matriz-th-sticky">COD</th>
                    {gruposOrdenados.map((g) => (
                      <th key={g.id} className="cadastro-valores-v2__matriz-th-group">
                        <button
                          type="button"
                          className="cadastro-valores-v2__matriz-link"
                          onClick={() => {
                            setActiveTab('grupos')
                            setServicoGrupoSelecionadoId(g.id)
                            setServicoGrupoNomeEdicao(g.nome)
                          }}
                        >
                          {g.nome}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {codigosMatriz.map((cod) => (
                    <tr key={cod}>
                      <td className="cadastro-valores-v2__cod-cell cadastro-valores-v2__matriz-td-sticky">{cod}</td>
                      {gruposOrdenados.map((g) => {
                        const s = servicoPorCodNoGrupo(servicos, g.id, cod)
                        const valorZero = s && (!s.valor || s.valor <= 0)
                        return (
                          <td
                            key={g.id}
                            className={
                              'cadastro-valores-v2__matriz-valor' +
                              (!s ? ' cadastro-valores-v2__matriz-valor--missing' : '') +
                              (valorZero ? ' cadastro-valores-v2__matriz-valor--zero' : '')
                            }
                          >
                            {s ? `${formatServicoValorExibicao(s.valor)} €` : '—'}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'listar' && (
        <div className="orcamento-pecas-especiais-form cadastro-valores-v2__listar-panel">
          <div className="orcamento-pecas-especiais-section cadastro-valores-v2__items-section">
            <h3>{safeT.servicosListarTodosTab || 'Ver todos'}</h3>
            <p className="orcamento-pecas-especiais-hint">
              {safeT.servicosListarTodosAjuda ||
                'Lista completa de serviços e despesas por grupo de tarifa. Use Editar para abrir o grupo correspondente.'}
            </p>
          </div>
          {servicos.length === 0 ? (
            <p className="cadastro-valores-v2__empty">{safeT.noServicos || 'Nenhum serviço ou despesa cadastrado.'}</p>
          ) : (
            <div className="cadastro-valores-v2__list-groups">
              {gruposOrdenados.map((g) => {
                const itens = servicos
                  .filter((s) => s.grupoId === g.id)
                  .slice()
                  .sort((a, b) => {
                    const ca = servicoCodParaExibicao(a)
                    const cb = servicoCodParaExibicao(b)
                    if (ca && cb) return ca.localeCompare(cb)
                    return a.nome.localeCompare(b.nome)
                  })
                if (itens.length === 0) return null
                const nZero = itens.filter((s) => !s.valor || s.valor <= 0).length
                const nCli = clientesPorGrupo[g.id] || 0
                return (
                  <div key={g.id} className="orcamento-pecas-especiais-linha cadastro-valores-v2__list-group-card">
                    <div className="orcamento-pecas-especiais-linha-head cadastro-valores-v2__list-group-header">
                      <div>
                        <span className="cadastro-valores-v2__group-kicker">{safeT.servicosGrupoAtivoLabel || 'Grupo de tarifa'}</span>
                        <h2 className="cadastro-valores-v2__list-group-title">{g.nome}</h2>
                      </div>
                      <div className="cadastro-valores-v2__list-group-stats">
                        <span className="cadastro-valores-v2__grupo-stat">
                          {itens.length} {safeT.servicosItensLabel || 'itens'}
                        </span>
                        <span className="cadastro-valores-v2__grupo-stat">
                          {nCli} {safeT.servicosClientesLabel || 'clientes'}
                        </span>
                        {nZero > 0 ? (
                          <span className="cadastro-valores-v2__grupo-stat cadastro-valores-v2__grupo-stat--warn">
                            {nZero} {safeT.servicosSemValorLabel || 'sem valor'}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="cadastro-valores-v2__table-wrap cadastro-valores-v2__table-wrap--pro">
                      <table className="cadastro-valores-v2__table cadastro-valores-v2__table--pro">
                        <colgroup>
                          <col className="cadastro-valores-v2__col-cod" />
                          <col className="cadastro-valores-v2__col-nome" />
                          <col className="cadastro-valores-v2__col-tipo" />
                          <col className="cadastro-valores-v2__col-cobranca" />
                          <col className="cadastro-valores-v2__col-valor" />
                          <col className="cadastro-valores-v2__col-acoes" />
                        </colgroup>
                        <thead>
                          <tr>
                            <th>COD</th>
                            <th>{safeT.nomeServico || 'Nome'}</th>
                            <th>{safeT.tipo || 'Tipo'}</th>
                            <th>{safeT.tipoCobranca || 'Cobrança'}</th>
                            <th className="cadastro-valores-v2__th-valor">{safeT.valorServico || 'Valor €'}</th>
                            <th>{safeT.acoes || 'Ações'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itens.map((servico) => {
                            const valorZero = !servico.valor || servico.valor <= 0
                            return (
                              <tr key={servico.id} className={valorZero ? 'cadastro-valores-v2__row--warn' : undefined}>
                                <td className="cadastro-valores-v2__cod-cell">{servicoCodParaExibicao(servico) || '—'}</td>
                                <td className="cadastro-valores-v2__nome-cell">
                                  <div className="cadastro-valores-v2__nome-main">{servico.nome}</div>
                                </td>
                                <td>
                                  <span className={`cadastro-valores-v2__tipo-badge cadastro-valores-v2__tipo-badge--${servico.categoria}`}>
                                    {labelCategoria(servico.categoria, safeT)}
                                  </span>
                                </td>
                                <td>
                                  <span className="cadastro-valores-v2__cobranca-badge">
                                    {labelTipoCobranca(servico.tipoCobranca, safeT)}
                                  </span>
                                </td>
                                <td
                                  className={
                                    'cadastro-valores-v2__valor-cell' +
                                    (valorZero ? ' cadastro-valores-v2__valor-cell--zero' : '')
                                  }
                                >
                                  {formatServicoValorExibicao(servico.valor)} €
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="btn-primary cadastro-valores-v2__btn-sm"
                                    onClick={() => {
                                      setActiveTab('grupos')
                                      setServicoGrupoSelecionadoId(servico.grupoId)
                                      const gg = servicoGrupos.find((x) => x.id === servico.grupoId)
                                      if (gg) setServicoGrupoNomeEdicao(gg.nome)
                                      onEditServico(servico)
                                    }}
                                  >
                                    {safeT.edit || 'Editar'}
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
