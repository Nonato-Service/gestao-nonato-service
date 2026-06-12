'use client'

import React, { useMemo, useState } from 'react'
import { AssistTextarea } from './AssistTextFields'
import { ACCENT_GREEN, glassCardHover, glassCardStyle } from '../utils/accentGlassCard'
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

const tabBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: '12px 20px',
  fontSize: '14px',
  fontWeight: 'bold',
  border: '1px solid',
  borderColor: active ? 'rgba(0, 200, 80, 0.55)' : 'rgba(0, 255, 0, 0.22)',
  backgroundColor: active ? 'rgba(18, 52, 24, 0.96)' : 'rgba(22, 28, 28, 0.88)',
  color: '#ffffff',
  transition: 'border-color 0.2s ease, background-color 0.2s ease',
  borderRadius: '8px',
  cursor: 'pointer',
})

const thStyle: React.CSSProperties = {
  padding: '10px 8px',
  textAlign: 'left',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#7dff9e',
  borderBottom: '1px solid rgba(0, 255, 0, 0.25)',
  background: 'rgba(18, 52, 24, 0.5)',
}

const tdStyle: React.CSSProperties = {
  padding: '8px',
  fontSize: '13px',
  color: '#fff',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  verticalAlign: 'middle',
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
    <div
      style={{
        ...glassCardStyle(ACCENT_GREEN, { padding: '20px', radius: '12px', borderAlpha: 0.2 }),
        marginBottom: '15px',
      }}
    >
      <h4 style={{ color: '#ffffff', margin: '0 0 12px' }}>
        {editingServico ? safeT.editarServico || 'Editar Serviço' : safeT.adicionarServico || 'Adicionar Serviço ou Despesa'}
      </h4>
      <label style={{ display: 'block', color: 'rgba(255,255,255,0.85)', fontSize: '12px', marginBottom: '4px' }}>
        {safeT.servicosServicoGrupo || 'Grupo'}
      </label>
      <select
        value={servicoForm.grupoId || servicoGrupoSelecionadoId || ordenarServicoGrupos(servicoGrupos)[0]?.id || ''}
        onChange={(e) => setServicoForm({ ...servicoForm, grupoId: e.target.value })}
        style={{
          width: '100%',
          padding: '8px',
          marginBottom: '10px',
          backgroundColor: '#222222',
          color: '#fff',
          border: '1px solid rgba(0, 255, 0, 0.3)',
          borderRadius: '4px',
        }}
      >
        {ordenarServicoGrupos(servicoGrupos).map((g) => (
          <option key={g.id} value={g.id}>
            {g.nome}
          </option>
        ))}
      </select>
      <select
        value={servicoForm.categoria}
        onChange={(e) => setServicoForm({ ...servicoForm, categoria: e.target.value as 'servico' | 'despesa' })}
        style={{
          width: '100%',
          padding: '8px',
          marginBottom: '10px',
          backgroundColor: '#222222',
          color: '#fff',
          border: '1px solid rgba(0, 255, 0, 0.3)',
          borderRadius: '4px',
        }}
      >
        <option value="servico">{safeT.servico || 'SERVIÇO'}</option>
        <option value="despesa">{safeT.despesa || 'DESPESA'}</option>
      </select>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', width: '100%' }}>
        <span style={{ color: '#7dff9e', fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap', flexShrink: 0 }}>COD:</span>
        <input
          type="text"
          placeholder={(safeT as any).codigoServico || 'HTT'}
          value={servicoForm.cod}
          onChange={(e) => setServicoForm({ ...servicoForm, cod: e.target.value })}
          style={{
            flex: 1,
            minWidth: 0,
            padding: '8px',
            backgroundColor: '#222222',
            color: '#fff',
            border: '1px solid rgba(0, 255, 0, 0.3)',
            borderRadius: '4px',
          }}
        />
      </div>
      <input
        type="text"
        placeholder={safeT.nomeServico || 'Nome do Serviço/Despesa'}
        value={servicoForm.nome}
        onChange={(e) => setServicoForm({ ...servicoForm, nome: e.target.value })}
        style={{
          width: '100%',
          padding: '8px',
          marginBottom: '10px',
          backgroundColor: '#222222',
          color: '#fff',
          border: '1px solid rgba(0, 255, 0, 0.3)',
          borderRadius: '4px',
        }}
      />
      <AssistTextarea
        placeholder={safeT.descricaoServico || 'Descrição (opcional)'}
        value={servicoForm.descricao}
        onValueChange={(v) => setServicoForm({ ...servicoForm, descricao: v })}
        rows={3}
        style={{
          width: '100%',
          padding: '10px',
          marginBottom: '10px',
          backgroundColor: '#222222',
          color: '#fff',
          border: '1px solid rgba(0, 255, 0, 0.3)',
          borderRadius: '4px',
        }}
      />
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder={safeT.valorServico || 'Valor (ex.: 60 ou 60,00)'}
        value={servicoValorInput}
        onChange={(e) => setServicoValorInput(e.target.value)}
        style={{
          width: '100%',
          padding: '8px',
          marginBottom: '10px',
          backgroundColor: '#222222',
          color: '#fff',
          border: '1px solid rgba(0, 255, 0, 0.3)',
          borderRadius: '4px',
        }}
      />
      <select
        value={servicoForm.tipoCobranca}
        onChange={(e) =>
          setServicoForm({
            ...servicoForm,
            tipoCobranca: e.target.value as ServicoCadastroItem['tipoCobranca'],
          })
        }
        style={{
          width: '100%',
          padding: '8px',
          marginBottom: '10px',
          backgroundColor: '#222222',
          color: '#fff',
          border: '1px solid rgba(0, 255, 0, 0.3)',
          borderRadius: '4px',
        }}
      >
        <option value="unidade">{safeT.tipoCobrancaUnidade || 'Por Unidade'}</option>
        <option value="km">{safeT.tipoCobrancaKm || 'Por KM'}</option>
        <option value="hora">{safeT.tipoCobrancaHora || 'Por Hora'}</option>
        <option value="valor-fixo">{safeT.tipoCobrancaValorFixo || 'Valor Fixo'}</option>
        <option value="diarias">{safeT.tipoCobrancaDiarias || 'Diárias'}</option>
        <option value="extras">{safeT.tipoCobrancaExtras || 'Extras'}</option>
      </select>
      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
        <button
          className="btn-primary"
          type="button"
          onClick={onSaveServico}
          style={{ flex: 1, backgroundColor: 'rgba(18, 52, 24, 0.96)', border: '1px solid rgba(0, 200, 80, 0.55)', color: '#ffffff' }}
        >
          {safeT.save || 'Salvar'}
        </button>
        <button
          className="btn-primary"
          type="button"
          onClick={onResetServicoForm}
          style={{ flex: 1, backgroundColor: 'rgba(22, 28, 28, 0.88)', border: '1px solid rgba(0, 255, 0, 0.22)', color: '#ffffff' }}
        >
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

  const renderTabs = () => (
    <>
      <button type="button" className="btn-primary" style={tabBtnStyle(activeTab === 'grupos')} onClick={() => setActiveTab('grupos')}>
        📁 {safeT.servicosPorGrupoTab || 'Por grupos'}
      </button>
      <button type="button" className="btn-primary" style={tabBtnStyle(activeTab === 'matriz')} onClick={() => setActiveTab('matriz')}>
        📊 {safeT.servicosMatrizTab || 'Matriz de tarifas'}
      </button>
      <button type="button" className="btn-primary" style={tabBtnStyle(activeTab === 'listar')} onClick={() => setActiveTab('listar')}>
        📋 {safeT.servicosListarTodosTab || 'Ver todos'} ({servicos.length})
      </button>
    </>
  )

  return (
    <div className="tab-content-wrapper tab-glass-root tab-glass-root--wide">
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

      <div className="tab-header-desktop tab-glass-hero">
        <div className="tab-glass-hero-top">
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>{logoSlot}</div>
          <div className="tab-glass-hero-heading">
            <h1 className="tab-glass-hero-title">{safeT.cadastroServicosTitle || 'CADASTRO DE SERVIÇOS / VALORES'}</h1>
            <p className="tab-glass-hero-meta">
              {servicoGrupos.length} {safeT.servicosGruposTitulo || 'grupo(s)'} · {servicos.length}{' '}
              {safeT.servicosCadastrados || 'serviço(s) cadastrado(s)'}
            </p>
            <p className="tab-glass-hero-meta" style={{ marginTop: '6px', opacity: 0.85 }}>
              {safeT.servicosHubAjuda ||
                'Organize tabelas de preços por grupo (ex.: NONATO SERVICE, HOMAG USA). Cada cliente usa um grupo no cadastro.'}
            </p>
          </div>
          <div className="tab-glass-hero-actions">
            <div className="tab-glass-hero-actions-row">
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  void restaurarCadastroServicosDoServidor()
                    .then((n) => {
                      if (n > 0) {
                        alert(
                          safeT.cadastroRecuperadoOk || `Cadastro recuperado: ${n} serviço(s) (HTT, HTV, KRC, etc.).`
                        )
                      }
                    })
                    .catch(() => {
                      alert(
                        safeT.cadastroRecuperadoErro ||
                          'Não foi possível recuperar. Confirme que o servidor está a correr neste PC e volte a tentar.'
                      )
                    })
                }}
                style={{ padding: '8px 14px', fontSize: '12px', borderRadius: '8px' }}
              >
                ↻ {safeT.servicosRecuperarCadastro || 'Recuperar cadastro'}
              </button>
              <button onClick={() => closeTab(activeTabId || '')} className="btn-primary" style={{ padding: '6px 8px', width: '32px', height: '32px' }} title={safeT.voltar || 'Voltar'}>
                ↶
              </button>
              <button onClick={voltarPaginaInicial} className="btn-primary" style={{ padding: '6px 8px', width: '32px', height: '32px' }} title={safeT.paginaInicial || 'Página Inicial'}>
                🏠
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="tab-nav-desktop tab-glass-nav" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {renderTabs()}
      </div>

      {servicos.length === 0 && (
        <div
          style={{
            marginTop: '14px',
            padding: '14px 16px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 180, 0, 0.5)',
            background: 'rgba(255, 160, 0, 0.12)',
            color: '#ffcc80',
            fontSize: '13px',
            lineHeight: 1.45,
          }}
        >
          {safeT.servicosCadastroVazioAviso ||
            'O cadastro neste aparelho está vazio. Toque em «Recuperar cadastro» ou crie grupos e aplique o template padrão (HTT, KRC, diárias…).'}
        </div>
      )}

      {activeTab === 'grupos' && (
        <div style={{ display: 'flex', gap: '18px', alignItems: 'stretch', flexWrap: 'wrap', marginTop: '12px' }}>
          <aside
            style={{
              ...glassCardStyle(ACCENT_GREEN, { padding: '16px', radius: '12px', borderAlpha: 0.2 }),
              flex: '0 1 300px',
              minWidth: '240px',
              maxHeight: '75vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <h3 style={{ margin: '0 0 8px', color: '#ffffff', fontSize: '16px' }}>{safeT.servicosGruposTitulo || 'Grupos de tarifa'}</h3>
            <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'rgba(255,255,255,0.72)', lineHeight: 1.45 }}>
              {safeT.servicosGruposAjuda ||
                'Crie grupos (ex.: NONATO SERVICE, HOMAG USA). Em cada grupo, cadastre HTT e demais valores — os clientes do mesmo grupo usam esta tabela.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', flex: 1, marginBottom: '12px' }}>
              {gruposOrdenados.map((g) => {
                const nServ = servicos.filter((s) => s.grupoId === g.id).length
                const nCli = clientesPorGrupo[g.id] || 0
                const sel = servicoGrupoSelecionadoId === g.id
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setServicoGrupoSelecionadoId(g.id)
                      setServicoGrupoNomeEdicao(g.nome)
                      setDuplicarOrigemId(g.id)
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: sel ? '1px solid rgba(0, 200, 80, 0.65)' : '1px solid rgba(0, 255, 0, 0.18)',
                      background: sel ? 'rgba(18, 52, 24, 0.95)' : 'rgba(22, 28, 28, 0.75)',
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{g.nome}</div>
                    <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px' }}>
                      {nServ} {safeT.servicosItensLabel || 'itens'} · {nCli} {safeT.servicosClientesLabel || 'clientes'}
                    </div>
                  </button>
                )
              })}
            </div>

            <div style={{ borderTop: '1px solid rgba(0,255,0,0.15)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#7dff9e', marginBottom: '6px', fontWeight: 700 }}>
                  {safeT.servicosNovoGrupoTitulo || 'Novo grupo vazio'}
                </div>
                <input
                  type="text"
                  value={novoServicoGrupoNome}
                  onChange={(e) => setNovoServicoGrupoNome(e.target.value)}
                  placeholder={safeT.servicosGrupoNomePlaceholder || 'Nome do novo grupo'}
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginBottom: '8px',
                    backgroundColor: '#222',
                    color: '#fff',
                    border: '1px solid rgba(0, 255, 0, 0.3)',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                  }}
                />
                <button className="btn-primary" type="button" onClick={onAddGrupo} style={{ width: '100%' }}>
                  + {safeT.servicosNovoGrupo || 'Criar grupo'}
                </button>
              </div>

              <div style={{ borderTop: '1px dashed rgba(0,255,0,0.2)', paddingTop: '10px' }}>
                <div style={{ fontSize: '11px', color: '#7dff9e', marginBottom: '6px', fontWeight: 700 }}>
                  {safeT.servicosDuplicarGrupoTitulo || 'Duplicar tabela de outro grupo'}
                </div>
                <select
                  value={duplicarOrigemId || servicoGrupoSelecionadoId || gruposOrdenados[0]?.id || ''}
                  onChange={(e) => setDuplicarOrigemId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginBottom: '8px',
                    backgroundColor: '#222',
                    color: '#fff',
                    border: '1px solid rgba(0, 255, 0, 0.3)',
                    borderRadius: '6px',
                  }}
                >
                  {gruposOrdenados.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nome}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={duplicarNome}
                  onChange={(e) => setDuplicarNome(e.target.value)}
                  placeholder={safeT.servicosDuplicarGrupoPlaceholder || 'Nome do novo grupo (cópia)'}
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginBottom: '8px',
                    backgroundColor: '#222',
                    color: '#fff',
                    border: '1px solid rgba(100, 180, 255, 0.4)',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  className="btn-primary"
                  type="button"
                  style={{ width: '100%', background: 'rgba(0, 120, 200, 0.35)', border: '1px solid rgba(100, 180, 255, 0.55)' }}
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

          <section style={{ flex: '1 1 480px', minWidth: 0 }}>
            {servicoGrupoSelecionadoId ? (
              <>
                <div style={{ ...glassCardStyle(ACCENT_GREEN, { padding: '14px', radius: '12px', borderAlpha: 0.18 }), marginBottom: '14px' }}>
                  <div style={{ fontSize: '12px', color: '#7dff9e', marginBottom: '6px' }}>{safeT.servicosRenomearGrupo || 'Nome do grupo'}</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={servicoGrupoNomeEdicao}
                      onChange={(e) => setServicoGrupoNomeEdicao(e.target.value)}
                      style={{
                        flex: '1 1 180px',
                        minWidth: 0,
                        padding: '8px',
                        backgroundColor: '#222',
                        color: '#fff',
                        border: '1px solid rgba(0, 255, 0, 0.3)',
                        borderRadius: '6px',
                      }}
                    />
                    <button className="btn-primary" type="button" onClick={onSalvarNomeGrupo}>
                      {safeT.save || 'Salvar'}
                    </button>
                    <button className="btn-primary" type="button" onClick={() => onMoveGrupo(servicoGrupoSelecionadoId, 'up')} title={safeT.servicosSubirGrupo || 'Subir'}>
                      ↑
                    </button>
                    <button className="btn-primary" type="button" onClick={() => onMoveGrupo(servicoGrupoSelecionadoId, 'down')} title={safeT.servicosDescerGrupo || 'Descer'}>
                      ↓
                    </button>
                    <button className="btn-danger" type="button" onClick={() => onDeleteGrupo(servicoGrupoSelecionadoId)}>
                      {safeT.servicosExcluirGrupo || 'Excluir grupo'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px', alignItems: 'center' }}>
                  <h3 style={{ color: '#fff', margin: 0, fontSize: '17px', flex: '1 1 auto' }}>
                    {safeT.servicosItensDoGrupo || 'Trabalhos e valores'}
                  </h3>
                  <button className="btn-primary" type="button" onClick={onAddServico}>
                    + {safeT.adicionarServico || 'Adicionar'}
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => onQuickAddHtt(servicoGrupoSelecionadoId || undefined)}
                    style={{ background: 'rgba(0, 120, 200, 0.35)', border: '1px solid rgba(100, 180, 255, 0.55)' }}
                  >
                    + HTT
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => onAplicarTemplate(servicoGrupoSelecionadoId)}
                    style={{ background: 'rgba(80, 60, 0, 0.45)', border: '1px solid rgba(255, 200, 80, 0.55)' }}
                  >
                    ⚡ {safeT.servicosAplicarTemplate || 'Template padrão'}
                  </button>
                </div>

                {showServicoForm && <ServicoFormBlock {...props} />}

                {itensGrupoSelecionado.length === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.55)', marginTop: '8px' }}>
                    {safeT.servicosNenhumItemNoGrupo || 'Nenhum item neste grupo.'}{' '}
                    {safeT.servicosUseTemplateHint || 'Use «Template padrão» para criar HTT, KRC, diárias, etc.'}
                  </p>
                ) : (
                  <div style={{ overflowX: 'auto', marginTop: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px' }}>
                      <thead>
                        <tr>
                          <th style={thStyle}>COD</th>
                          <th style={thStyle}>{safeT.nomeServico || 'Nome'}</th>
                          <th style={thStyle}>{safeT.tipo || 'Tipo'}</th>
                          <th style={thStyle}>{safeT.tipoCobranca || 'Cobrança'}</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>{safeT.valorServico || 'Valor €'}</th>
                          <th style={{ ...thStyle, width: '120px' }}>{safeT.acoes || 'Ações'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itensGrupoSelecionado.map((servico) => {
                          const cod = servicoCodParaExibicao(servico)
                          return (
                            <tr key={servico.id}>
                              <td style={{ ...tdStyle, color: '#7dff9e', fontWeight: 700 }}>{cod || '—'}</td>
                              <td style={tdStyle}>
                                <div>{servico.nome}</div>
                                {servico.descricao?.trim() ? (
                                  <div style={{ fontSize: '11px', opacity: 0.65 }}>{servico.descricao.trim()}</div>
                                ) : null}
                              </td>
                              <td style={tdStyle}>{labelCategoria(servico.categoria, safeT)}</td>
                              <td style={tdStyle}>{labelTipoCobranca(servico.tipoCobranca, safeT)}</td>
                              <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{formatServicoValorExibicao(servico.valor)} €</td>
                              <td style={tdStyle}>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button className="btn-primary" type="button" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => onEditServico(servico)}>
                                    {safeT.edit || 'Editar'}
                                  </button>
                                  <button className="btn-danger" type="button" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => onDeleteServico(servico.id)}>
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
              <p style={{ color: 'rgba(255,255,255,0.55)' }}>{safeT.servicosEscolhaGrupo || 'Escolha um grupo à esquerda.'}</p>
            )}
          </section>
        </div>
      )}

      {activeTab === 'matriz' && (
        <div style={{ marginTop: '14px', ...glassCardStyle(ACCENT_GREEN, { padding: '16px', radius: '12px', borderAlpha: 0.18 }) }}>
          <h3 style={{ margin: '0 0 8px', color: '#fff' }}>{safeT.servicosMatrizTitulo || 'Comparar valores entre grupos'}</h3>
          <p style={{ margin: '0 0 14px', fontSize: '12px', color: 'rgba(255,255,255,0.72)', lineHeight: 1.45 }}>
            {safeT.servicosMatrizAjuda || 'Visão geral: compare HTT, km, diárias e outros códigos em todos os grupos de tarifa.'}
          </p>
          {gruposOrdenados.length === 0 || codigosMatriz.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.55)' }}>{safeT.servicosMatrizVazia || 'Cadastre grupos e serviços para ver a matriz.'}</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: `${180 + gruposOrdenados.length * 100}px` }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, position: 'sticky', left: 0, background: 'rgba(18, 52, 24, 0.95)', zIndex: 1 }}>COD</th>
                    {gruposOrdenados.map((g) => (
                      <th key={g.id} style={{ ...thStyle, textAlign: 'center', minWidth: '90px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('grupos')
                            setServicoGrupoSelecionadoId(g.id)
                            setServicoGrupoNomeEdicao(g.nome)
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#7dff9e',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '11px',
                            textDecoration: 'underline',
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
                      <td style={{ ...tdStyle, position: 'sticky', left: 0, background: 'rgba(22, 28, 28, 0.98)', fontWeight: 700, color: '#7dff9e' }}>{cod}</td>
                      {gruposOrdenados.map((g) => {
                        const s = servicoPorCodNoGrupo(servicos, g.id, cod)
                        return (
                          <td key={g.id} style={{ ...tdStyle, textAlign: 'center' }}>
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
        <div style={{ marginTop: '14px' }}>
          {servicos.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.55)' }}>{safeT.noServicos || 'Nenhum serviço ou despesa cadastrado.'}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {gruposOrdenados.map((g) => {
                const itens = servicos.filter((s) => s.grupoId === g.id)
                if (itens.length === 0) return null
                return (
                  <div key={g.id}>
                    <h2 style={{ margin: '0 0 10px', fontSize: '18px', color: '#7dff9e' }}>
                      {g.nome}
                      <span style={{ fontSize: '12px', opacity: 0.65, marginLeft: '8px' }}>
                        ({itens.length} {safeT.servicosItensLabel || 'itens'})
                      </span>
                    </h2>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '480px' }}>
                        <thead>
                          <tr>
                            <th style={thStyle}>COD</th>
                            <th style={thStyle}>{safeT.nomeServico || 'Nome'}</th>
                            <th style={thStyle}>{safeT.tipoCobranca || 'Cobrança'}</th>
                            <th style={{ ...thStyle, textAlign: 'right' }}>{safeT.valorServico || 'Valor'}</th>
                            <th style={{ ...thStyle, width: '100px' }}>{safeT.acoes || 'Ações'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itens.map((servico) => (
                            <tr key={servico.id}>
                              <td style={{ ...tdStyle, color: '#7dff9e', fontWeight: 700 }}>{servicoCodParaExibicao(servico) || '—'}</td>
                              <td style={tdStyle}>{servico.nome}</td>
                              <td style={tdStyle}>{labelTipoCobranca(servico.tipoCobranca, safeT)}</td>
                              <td style={{ ...tdStyle, textAlign: 'right' }}>{formatServicoValorExibicao(servico.valor)} €</td>
                              <td style={tdStyle}>
                                <button
                                  className="btn-primary"
                                  type="button"
                                  style={{ padding: '4px 8px', fontSize: '11px' }}
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
                          ))}
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
