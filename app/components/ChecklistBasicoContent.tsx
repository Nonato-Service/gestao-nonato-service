'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadData, saveData } from '../utils/dataStorage'
import {
  openChecklistBasicoPrint,
} from '../lib/checklistBasicoPdf'
import {
  useDocumentoEnvioCliente,
  buildTextoEnvioGenerico,
} from '../context/DocumentoEnvioClienteContext'
import {
  CHECKLIST_BASICO_STORAGE_KEY,
  ChecklistBasicoGrupo,
  ChecklistBasicoInstancia,
  ChecklistBasicoItem,
  ChecklistBasicoItemStatus,
  newChecklistBasicoId,
} from '../lib/checklistBasicoTypes'
import { ClienteAlfabetoPicker } from './ClienteAlfabetoPicker'

type EquipamentoClienteResumo = {
  id?: string
  tipoEquipamento: string
  modelo: string
  marca: string
  numeroSerie: string
  familia: string
  grupo: string
  photo?: string
  coverPhoto?: string
}

type ClienteResumo = {
  id: string
  nomeEmpresa: string
  email?: string
  telefones?: string
  equipamentos: EquipamentoClienteResumo[]
}

type TecnicoResumo = {
  id: string
  name: string
}

export type ChecklistBasicoContentProps = {
  safeT: Record<string, string | undefined>
  LogoComponent: React.ComponentType<{ size?: 'small' | 'medium' | 'large' }>
  closeTab: (tabId: string) => void
  activeTabId: string | null
  voltarPaginaInicial: () => void
  clientes: ClienteResumo[]
  tecnicos: TecnicoResumo[]
  logoUrl?: string | null
  logoType?: string | null
}

function equipamentoClienteKey(eq: EquipamentoClienteResumo, index: number): string {
  const id = (eq.id || '').trim()
  if (id) return id
  return `eq-${index}-${(eq.numeroSerie || eq.modelo || 'x').trim()}`
}

function equipamentoLabel(eq: EquipamentoClienteResumo): string {
  const parts = [eq.tipoEquipamento, eq.modelo, eq.marca].filter(Boolean)
  const base = parts.join(' · ').trim()
  const serie = (eq.numeroSerie || '').trim()
  if (base && serie) return `${base} — ${serie}`
  return base || serie || '—'
}

function todayIsoDate(): string {
  return new Date().toISOString().split('T')[0]
}

function SignatureCanvas(props: {
  value?: string
  onSave: (dataUrl: string) => void
  onClear: () => void
  labels: Record<string, string | undefined>
}) {
  const { value, onSave, onClear, labels } = props
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const lastPosRef = useRef<{ x: number; y: number } | null>(null)
  const [editing, setEditing] = useState(!value)

  useEffect(() => {
    setEditing(!value)
  }, [value])

  useEffect(() => {
    if (!editing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  }, [editing])

  const getPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY }
  }

  const startDraw = (x: number, y: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    isDrawingRef.current = true
    lastPosRef.current = { x, y }
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(x, y)
    }
  }

  const moveDraw = (x: number, y: number) => {
    if (!isDrawingRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.lineTo(x, y)
      ctx.stroke()
    }
    lastPosRef.current = { x, y }
  }

  const endDraw = () => {
    isDrawingRef.current = false
    lastPosRef.current = null
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }
    onClear()
    setEditing(true)
  }

  if (value && !editing) {
    return (
      <div className="cb-pro__sig-view">
        <img src={value} alt="" className="cb-pro__sig-img" />
        <div className="cb-pro__sig-actions">
          <button type="button" className="cb-pro__btn cb-pro__btn--secondary" onClick={() => setEditing(true)}>
            {labels.substituirAssinatura || 'Substituir assinatura'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="cb-pro__sig-edit">
      <canvas
        ref={canvasRef}
        width={320}
        height={140}
        className="cb-pro__sig-canvas"
        onMouseDown={(e) => {
          const p = getPoint(e.clientX, e.clientY)
          if (p) startDraw(p.x, p.y)
        }}
        onMouseMove={(e) => {
          const p = getPoint(e.clientX, e.clientY)
          if (p) moveDraw(p.x, p.y)
        }}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={(e) => {
          e.preventDefault()
          if (!e.touches.length) return
          const p = getPoint(e.touches[0].clientX, e.touches[0].clientY)
          if (p) startDraw(p.x, p.y)
        }}
        onTouchMove={(e) => {
          e.preventDefault()
          if (!e.touches.length) return
          const p = getPoint(e.touches[0].clientX, e.touches[0].clientY)
          if (p) moveDraw(p.x, p.y)
        }}
        onTouchEnd={endDraw}
      />
      <div className="cb-pro__sig-actions">
        <button
          type="button"
          className="cb-pro__btn cb-pro__btn--primary"
          onClick={() => {
            const canvas = canvasRef.current
            if (!canvas) return
            onSave(canvas.toDataURL('image/png'))
            setEditing(false)
          }}
        >
          {labels.guardarAssinatura || 'Guardar assinatura'}
        </button>
        <button type="button" className="cb-pro__btn cb-pro__btn--ghost" onClick={clearCanvas}>
          {labels.limparAssinatura || 'Limpar'}
        </button>
      </div>
    </div>
  )
}

export function ChecklistBasicoContent(props: ChecklistBasicoContentProps) {
  const { safeT, LogoComponent, closeTab, activeTabId, voltarPaginaInicial, clientes, tecnicos, logoUrl, logoType } =
    props
  const abrirEnvio = useDocumentoEnvioCliente()

  const [hydrated, setHydrated] = useState(false)
  const [instancia, setInstancia] = useState<ChecklistBasicoInstancia | null>(null)
  const [clienteId, setClienteId] = useState('')
  const [equipamentoKey, setEquipamentoKey] = useState('')
  const [novoGrupoNome, setNovoGrupoNome] = useState('')
  const [novaSituacaoPorGrupo, setNovaSituacaoPorGrupo] = useState<Record<string, string>>({})
  const [motivoModal, setMotivoModal] = useState<{ grupoId: string; itemId: string; texto: string } | null>(null)
  const [motivoErro, setMotivoErro] = useState('')
  const [saveFlash, setSaveFlash] = useState(false)
  const [envioErro, setEnvioErro] = useState('')

  const clientesOrdenados = useMemo(
    () => [...clientes].sort((a, b) => (a.nomeEmpresa || '').localeCompare(b.nomeEmpresa || '', 'pt', { sensitivity: 'base' })),
    [clientes]
  )

  const clienteSelecionado = useMemo(
    () => clientesOrdenados.find((c) => c.id === clienteId) ?? null,
    [clientesOrdenados, clienteId]
  )

  const equipamentosCliente = useMemo(() => {
    if (!clienteSelecionado) return [] as Array<{ key: string; eq: EquipamentoClienteResumo; index: number }>
    return (clienteSelecionado.equipamentos || []).map((eq, index) => ({
      key: equipamentoClienteKey(eq, index),
      eq,
      index,
    }))
  }, [clienteSelecionado])

  const equipamentoSelecionado = useMemo(
    () => equipamentosCliente.find((e) => e.key === equipamentoKey) ?? null,
    [equipamentosCliente, equipamentoKey]
  )

  const tecnicosOrdenados = useMemo(
    () => [...tecnicos].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt', { sensitivity: 'base' })),
    [tecnicos]
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const raw = await loadData(CHECKLIST_BASICO_STORAGE_KEY)
        if (cancelled) return
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
          const draft = raw as Partial<ChecklistBasicoInstancia>
          if (draft.id && draft.clienteId && draft.equipamentoKey && Array.isArray(draft.grupos)) {
            setInstancia(draft as ChecklistBasicoInstancia)
            setClienteId(draft.clienteId)
            setEquipamentoKey(draft.equipamentoKey)
          }
        }
      } catch {
        /* ignorar */
      } finally {
        if (!cancelled) setHydrated(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const persist = useCallback(async (next: ChecklistBasicoInstancia | null) => {
    if (!next) {
      await saveData(CHECKLIST_BASICO_STORAGE_KEY, null)
      return
    }
    await saveData(CHECKLIST_BASICO_STORAGE_KEY, next)
    setSaveFlash(true)
    window.setTimeout(() => setSaveFlash(false), 1800)
  }, [])

  useEffect(() => {
    if (!hydrated || !instancia) return
    void persist(instancia)
  }, [hydrated, instancia, persist])

  const iniciarChecklist = () => {
    if (!clienteSelecionado || !equipamentoSelecionado) return
    const eq = equipamentoSelecionado.eq
    const now = new Date().toISOString()
    const next: ChecklistBasicoInstancia = {
      id: newChecklistBasicoId('cb'),
      clienteId: clienteSelecionado.id,
      clienteNome: clienteSelecionado.nomeEmpresa,
      equipamentoKey: equipamentoSelecionado.key,
      equipamento: {
        tipoEquipamento: eq.tipoEquipamento || '',
        modelo: eq.modelo || '',
        marca: eq.marca || '',
        numeroSerie: eq.numeroSerie || '',
        familia: eq.familia || '',
        grupo: eq.grupo || '',
      },
      data: todayIsoDate(),
      grupos: [],
      tecnicoId: '',
      tecnicoNome: '',
      criadoEm: now,
      atualizadoEm: now,
    }
    setInstancia(next)
  }

  const reiniciarSelecao = () => {
    setInstancia(null)
    setNovoGrupoNome('')
    setNovaSituacaoPorGrupo({})
    setEnvioErro('')
    void persist(null)
  }

  const patchInstancia = (patch: (prev: ChecklistBasicoInstancia) => ChecklistBasicoInstancia) => {
    setInstancia((prev) => {
      if (!prev) return prev
      return { ...patch(prev), atualizadoEm: new Date().toISOString() }
    })
  }

  const adicionarGrupo = () => {
    const nome = novoGrupoNome.trim()
    if (!nome || !instancia) return
    patchInstancia((prev) => ({
      ...prev,
      grupos: [...prev.grupos, { id: newChecklistBasicoId('cbg'), nome, itens: [] }],
    }))
    setNovoGrupoNome('')
  }

  const adicionarSituacao = (grupoId: string) => {
    const descricao = (novaSituacaoPorGrupo[grupoId] || '').trim()
    if (!descricao || !instancia) return
    patchInstancia((prev) => ({
      ...prev,
      grupos: prev.grupos.map((g) =>
        g.id === grupoId
          ? {
              ...g,
              itens: [
                ...g.itens,
                {
                  id: newChecklistBasicoId('cbi'),
                  descricao,
                  status: 'pendente' as ChecklistBasicoItemStatus,
                },
              ],
            }
          : g
      ),
    }))
    setNovaSituacaoPorGrupo((prev) => ({ ...prev, [grupoId]: '' }))
  }

  const setItemStatus = (grupoId: string, itemId: string, status: ChecklistBasicoItemStatus, motivo?: string) => {
    patchInstancia((prev) => ({
      ...prev,
      grupos: prev.grupos.map((g) =>
        g.id === grupoId
          ? {
              ...g,
              itens: g.itens.map((it) =>
                it.id === itemId
                  ? {
                      ...it,
                      status,
                      motivoNaoExecutado: status === 'nao_executado' ? (motivo || '').trim() : undefined,
                    }
                  : it
              ),
            }
          : g
      ),
    }))
  }

  const confirmarMotivo = () => {
    if (!motivoModal) return
    const texto = motivoModal.texto.trim()
    if (!texto) {
      setMotivoErro(safeT.checklistBasicoMotivoObrigatorio || 'Indique o motivo para marcar como não executado.')
      return
    }
    setItemStatus(motivoModal.grupoId, motivoModal.itemId, 'nao_executado', texto)
    setMotivoModal(null)
    setMotivoErro('')
  }

  const validarParaEnvio = (): boolean => {
    if (!instancia) return false
    if (!(instancia.tecnicoNome || '').trim()) {
      setEnvioErro(safeT.checklistBasicoTecnicoObrigatorio || 'Indique o nome do técnico que fez a inspeção.')
      return false
    }
    if (!instancia.assinaturaTecnico) {
      setEnvioErro(safeT.checklistBasicoAssinaturaObrigatoria || 'Guarde a assinatura do técnico antes de enviar.')
      return false
    }
    setEnvioErro('')
    return true
  }

  const marcarEnviado = (via: 'email' | 'whatsapp') => {
    patchInstancia((prev) => ({
      ...prev,
      enviadoClienteEm: new Date().toISOString(),
      enviadoClienteVia: via,
    }))
  }

  const handleGerarPdf = () => {
    if (!instancia || !validarParaEnvio()) return
    openChecklistBasicoPrint(instancia, safeT, logoUrl, logoType)
  }

  const montarEnvioChecklist = (canal: 'email' | 'whatsapp') => {
    if (!instancia || !validarParaEnvio()) return
    const nomeCli = clienteSelecionado?.nomeEmpresa || instancia.clienteNome || 'Cliente'
    const equip = [instancia.equipamento.tipoEquipamento, instancia.equipamento.modelo, instancia.equipamento.numeroSerie]
      .filter(Boolean)
      .join(' · ')
    const titulo = `${safeT.checklistBasico || 'Checklist básico'} — ${nomeCli}`
    abrirEnvio({
      title: safeT.checklistBasicoEnvioCliente || 'Envio ao cliente',
      subject: titulo,
      body: buildTextoEnvioGenerico(
        titulo,
        equip ? `${safeT.equipamento || 'Equipamento'}: ${equip}` : undefined,
        safeT
      ),
      clienteId: instancia.clienteId || clienteSelecionado?.id,
      clienteNome: nomeCli,
      defaultChannel: canal,
      onOpenPdf: handleGerarPdf,
    })
    marcarEnviado(canal)
  }

  const stats = useMemo(() => {
    if (!instancia) return { total: 0, executado: 0, nao: 0, pendente: 0 }
    let total = 0
    let executado = 0
    let nao = 0
    let pendente = 0
    for (const g of instancia.grupos) {
      for (const it of g.itens) {
        total++
        if (it.status === 'executado') executado++
        else if (it.status === 'nao_executado') nao++
        else pendente++
      }
    }
    return { total, executado, nao, pendente }
  }, [instancia])

  const renderItemRow = (grupoId: string, item: ChecklistBasicoItem) => (
    <div key={item.id} className={`cb-pro__item cb-pro__item--${item.status}`}>
      <div className="cb-pro__item-main">
        <span className="cb-pro__item-desc">{item.descricao}</span>
        {item.status === 'executado' && (
          <span className="cb-pro__item-ok" title={safeT.checklistBasicoOk || 'OK'}>
            ✓ {safeT.checklistBasicoOk || 'OK'}
          </span>
        )}
        {item.status === 'nao_executado' && item.motivoNaoExecutado && (
          <p className="cb-pro__item-motivo">
            <strong>{safeT.checklistBasicoMotivoTitulo || 'Motivo'}:</strong> {item.motivoNaoExecutado}
          </p>
        )}
      </div>
      <div className="cb-pro__item-actions" role="group" aria-label={item.descricao}>
        <button
          type="button"
          className={`cb-pro__pill cb-pro__pill--ok${item.status === 'executado' ? ' is-active' : ''}`}
          onClick={() => setItemStatus(grupoId, item.id, 'executado')}
        >
          {safeT.checklistBasicoExecutado || 'Executado'}
        </button>
        <button
          type="button"
          className={`cb-pro__pill cb-pro__pill--no${item.status === 'nao_executado' ? ' is-active' : ''}`}
          onClick={() => {
            setMotivoErro('')
            setMotivoModal({
              grupoId,
              itemId: item.id,
              texto: item.motivoNaoExecutado || '',
            })
          }}
        >
          {safeT.checklistBasicoNaoExecutado || 'Não executado'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="cb-pro ns-ui-v2">
      <div className="cb-pro__ambient" aria-hidden>
        <span className="cb-pro__orb cb-pro__orb--a" />
        <span className="cb-pro__orb cb-pro__orb--b" />
      </div>

      <header className="cb-pro__hero">
        <div className="cb-pro__hero-top">
          <LogoComponent size="small" />
          <div className="cb-pro__hero-actions">
            {activeTabId && (
              <button type="button" className="cb-pro__btn cb-pro__btn--ghost" onClick={() => closeTab(activeTabId)}>
                {safeT.voltar || 'Voltar'}
              </button>
            )}
            <button type="button" className="cb-pro__btn cb-pro__btn--ghost" onClick={voltarPaginaInicial}>
              {safeT.paginaInicial || 'Página inicial'}
            </button>
          </div>
        </div>
        <h1 className="cb-pro__title">{safeT.checklistBasicoPageTitle || safeT.checklistBasico || 'CHECKLIST BÁSICO'}</h1>
        <p className="cb-pro__subtitle">{safeT.checklistBasicoDesc || 'Revisão rápida em campo com grupos e situações.'}</p>
        {saveFlash && (
          <p className="cb-pro__save-flash" role="status">
            {safeT.checklistBasicoSalvoAuto || 'Gravado automaticamente'}
          </p>
        )}
      </header>

      {!instancia ? (
        <section className="cb-pro__panel">
          <div className="cb-pro__grid-2">
            <div className="cb-pro__field cb-pro__field--full">
              <span>{safeT.checklistBasicoSelecionarCliente || 'Selecionar cliente'}</span>
              <ClienteAlfabetoPicker
                clientes={clientesOrdenados}
                selectedId={clienteId}
                labels={{
                  buscar: safeT.buscarCliente,
                  nenhumEncontrado: safeT.nenhumEncontrado,
                  selecioneLetra: safeT.clientesAlfabetoSelecioneLetra,
                  prompt: safeT.clientesAlfabetoPrompt,
                  mostrando: safeT.mostrando,
                  de: safeT.de,
                  clientes: safeT.clientes,
                  comInicial: safeT.clientesAlfabetoComInicial,
                  outros: safeT.clientesAlfabetoOutros,
                  semClientesLetra: safeT.clientesAlfabetoSemClientes,
                  indiceAz: safeT.clientesAlfabetoIndice,
                  limpar: safeT.delete,
                  cliente: safeT.cliente,
                  filtrados: safeT.filtrados,
                }}
                listMaxHeight={280}
                onSelect={(c) => {
                  setClienteId(c.id)
                  setEquipamentoKey('')
                }}
                onClear={() => {
                  setClienteId('')
                  setEquipamentoKey('')
                }}
              />
            </div>

            <label className="cb-pro__field">
              <span>{safeT.checklistBasicoSelecionarEquipamento || 'Selecionar equipamento'}</span>
              <select
                value={equipamentoKey}
                onChange={(e) => setEquipamentoKey(e.target.value)}
                disabled={!clienteSelecionado || equipamentosCliente.length === 0}
              >
                <option value="">—</option>
                {equipamentosCliente.map(({ key, eq }) => (
                  <option key={key} value={key}>
                    {equipamentoLabel(eq)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {clientesOrdenados.length === 0 && (
            <p className="cb-pro__hint">{safeT.checklistBasicoSemClientes || 'Nenhum cliente cadastrado.'}</p>
          )}
          {clienteSelecionado && equipamentosCliente.length === 0 && (
            <p className="cb-pro__hint">{safeT.checklistBasicoSemEquipamentos || 'Este cliente não tem equipamentos.'}</p>
          )}

          {equipamentoSelecionado && (
            <div className="cb-pro__equip-card">
              <h2>{safeT.checklistBasicoInfoEquipamento || 'Informações do equipamento'}</h2>
              <dl className="cb-pro__equip-dl">
                <div>
                  <dt>{safeT.checklistBasicoTipo || 'Tipo'}</dt>
                  <dd>{equipamentoSelecionado.eq.tipoEquipamento || '—'}</dd>
                </div>
                <div>
                  <dt>{safeT.checklistBasicoModelo || 'Modelo'}</dt>
                  <dd>{equipamentoSelecionado.eq.modelo || '—'}</dd>
                </div>
                <div>
                  <dt>{safeT.checklistBasicoMarca || 'Marca'}</dt>
                  <dd>{equipamentoSelecionado.eq.marca || '—'}</dd>
                </div>
                <div>
                  <dt>{safeT.checklistBasicoNumeroSerie || 'N.º de série'}</dt>
                  <dd>{equipamentoSelecionado.eq.numeroSerie || '—'}</dd>
                </div>
                <div>
                  <dt>{safeT.checklistBasicoFamilia || 'Família'}</dt>
                  <dd>{equipamentoSelecionado.eq.familia || '—'}</dd>
                </div>
                <div>
                  <dt>{safeT.checklistBasicoGrupoEquip || 'Grupo'}</dt>
                  <dd>{equipamentoSelecionado.eq.grupo || '—'}</dd>
                </div>
              </dl>
              <button type="button" className="cb-pro__btn cb-pro__btn--primary" onClick={iniciarChecklist}>
                {safeT.checklistBasicoIniciar || 'Criar checklist'}
              </button>
            </div>
          )}
        </section>
      ) : (
        <>
          <section className="cb-pro__context">
            <div>
              <span className="cb-pro__ctx-label">{clienteSelecionado?.nomeEmpresa || instancia.clienteNome}</span>
              <span className="cb-pro__ctx-sub">
                {[instancia.equipamento.tipoEquipamento, instancia.equipamento.modelo, instancia.equipamento.numeroSerie]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </div>
            <div className="cb-pro__kpis">
              <span>{stats.executado} ✓</span>
              <span>{stats.nao} ✗</span>
              <span>{stats.pendente} …</span>
            </div>
            <button type="button" className="cb-pro__btn cb-pro__btn--ghost" onClick={reiniciarSelecao}>
              {safeT.checklistBasicoNovoChecklist || 'Novo checklist'}
            </button>
          </section>

          <section className="cb-pro__panel">
            <h2 className="cb-pro__section-title">{safeT.checklistBasicoNovoGrupo || 'Novo grupo'}</h2>
            <div className="cb-pro__add-row">
              <input
                type="text"
                value={novoGrupoNome}
                onChange={(e) => setNovoGrupoNome(e.target.value)}
                placeholder={safeT.checklistBasicoNomeGrupo || 'Nome do grupo'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') adicionarGrupo()
                }}
              />
              <button type="button" className="cb-pro__btn cb-pro__btn--primary" onClick={adicionarGrupo}>
                {safeT.checklistBasicoAdicionarGrupo || 'Adicionar grupo'}
              </button>
            </div>
          </section>

          {instancia.grupos.length === 0 && (
            <p className="cb-pro__hint cb-pro__hint--center">
              {safeT.checklistBasicoGruposTitulo ||
                'Crie grupos (ex.: Entrada, Saída) e adicione situações dentro de cada um.'}
            </p>
          )}

          {instancia.grupos.map((grupo) => (
            <section key={grupo.id} className="cb-pro__grupo">
              <header className="cb-pro__grupo-head">
                <h3>{grupo.nome}</h3>
                <span className="cb-pro__grupo-count">{grupo.itens.length}</span>
              </header>

              <div className="cb-pro__add-row">
                <input
                  type="text"
                  value={novaSituacaoPorGrupo[grupo.id] || ''}
                  onChange={(e) => setNovaSituacaoPorGrupo((prev) => ({ ...prev, [grupo.id]: e.target.value }))}
                  placeholder={safeT.checklistBasicoPlaceholderSituacao || 'Ex.: Régua de entrada'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') adicionarSituacao(grupo.id)
                  }}
                />
                <button type="button" className="cb-pro__btn cb-pro__btn--secondary" onClick={() => adicionarSituacao(grupo.id)}>
                  {safeT.checklistBasicoAdicionarSituacao || 'Adicionar situação'}
                </button>
              </div>

              <div className="cb-pro__items">
                {grupo.itens.length === 0 ? (
                  <p className="cb-pro__hint">{safeT.checklistBasicoNovaSituacao || 'Adicione situações a verificar.'}</p>
                ) : (
                  grupo.itens.map((item) => renderItemRow(grupo.id, item))
                )}
              </div>
            </section>
          ))}

          <section className="cb-pro__panel cb-pro__panel--tecnico">
            <h2 className="cb-pro__section-title">
              {safeT.checklistBasicoTecnicoInspecao || 'Técnico da inspeção'}
            </h2>
            <div className="cb-pro__grid-2">
              <label className="cb-pro__field">
                <span>{safeT.tecnicoResponsavel || 'Técnico Responsável'}</span>
                <select
                  value={instancia.tecnicoId || ''}
                  onChange={(e) => {
                    const id = e.target.value
                    const t = tecnicosOrdenados.find((x) => x.id === id)
                    patchInstancia((prev) => ({
                      ...prev,
                      tecnicoId: id,
                      tecnicoNome: t?.name || '',
                    }))
                  }}
                >
                  <option value="">—</option>
                  {tecnicosOrdenados.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="cb-pro__field">
                <span>{safeT.checklistBasicoNomeTecnico || 'Nome do técnico (inspeção)'}</span>
                <input
                  type="text"
                  value={instancia.tecnicoNome || ''}
                  onChange={(e) =>
                    patchInstancia((prev) => ({
                      ...prev,
                      tecnicoNome: e.target.value,
                      tecnicoId: tecnicosOrdenados.some((t) => t.name === e.target.value && t.id === prev.tecnicoId)
                        ? prev.tecnicoId
                        : '',
                    }))
                  }
                  placeholder={safeT.checklistBasicoNomeTecnicoPlaceholder || 'Nome completo do técnico'}
                />
              </label>
            </div>

            <h3 className="cb-pro__sub-title">{safeT.checklistBasicoAssinaturaTecnico || 'Assinatura do técnico'}</h3>
            <p className="cb-pro__hint">{safeT.checklistBasicoAssinaturaTecnicoDesc || 'Assine no ecrã (tablet ou telemóvel). A assinatura aparece no PDF enviado ao cliente.'}</p>
            <SignatureCanvas
              value={instancia.assinaturaTecnico}
              labels={safeT}
              onSave={(dataUrl) =>
                patchInstancia((prev) => ({
                  ...prev,
                  assinaturaTecnico: dataUrl,
                  dataAssinaturaTecnico: new Date().toISOString(),
                }))
              }
              onClear={() =>
                patchInstancia((prev) => ({
                  ...prev,
                  assinaturaTecnico: undefined,
                  dataAssinaturaTecnico: undefined,
                }))
              }
            />
          </section>

          <section className="cb-pro__panel cb-pro__panel--envio">
            <h2 className="cb-pro__section-title">{safeT.checklistBasicoEnvioCliente || 'Envio ao cliente'}</h2>
            <p className="cb-pro__hint">
              {safeT.checklistBasicoEnvioHint ||
                'Gera o PDF para imprimir ou guardar. Use e-mail ou WhatsApp com os dados do cadastro do cliente.'}
            </p>
            {(clienteSelecionado?.email || clienteSelecionado?.telefones) && (
              <p className="cb-pro__contact">
                {clienteSelecionado?.email && (
                  <span>
                    {safeT.email || 'E-mail'}: {clienteSelecionado.email}
                  </span>
                )}
                {clienteSelecionado?.telefones && (
                  <span>
                    {safeT.telefone || 'Telefone'}: {clienteSelecionado.telefones}
                  </span>
                )}
              </p>
            )}
            {instancia.enviadoClienteEm && (
              <p className="cb-pro__enviado-ok" role="status">
                {safeT.checklistBasicoEnviadoEm || 'Enviado ao cliente em'}{' '}
                {new Date(instancia.enviadoClienteEm).toLocaleString()}
                {instancia.enviadoClienteVia ? ` (${instancia.enviadoClienteVia})` : ''}
              </p>
            )}
            {envioErro && <p className="cb-pro__error">{envioErro}</p>}
            <div className="cb-pro__envio-actions">
              <button type="button" className="cb-pro__btn cb-pro__btn--secondary" onClick={handleGerarPdf}>
                {safeT.checklistBasicoGerarPdf || 'Gerar PDF / Imprimir'}
              </button>
              <button type="button" className="cb-pro__btn cb-pro__btn--primary" onClick={() => montarEnvioChecklist('email')}>
                📧 {safeT.checklistBasicoEnviarEmail || 'Enviar por e-mail'}
              </button>
              <button type="button" className="cb-pro__btn cb-pro__btn--wa" onClick={() => montarEnvioChecklist('whatsapp')}>
                💬 {safeT.checklistBasicoEnviarWhatsApp || 'Enviar por WhatsApp'}
              </button>
            </div>
          </section>
        </>
      )}

      {motivoModal && (
        <div className="cb-pro__modal-backdrop" role="presentation" onClick={() => setMotivoModal(null)}>
          <div
            className="cb-pro__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cb-motivo-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="cb-motivo-title">{safeT.checklistBasicoMotivoTitulo || 'Motivo de não executado'}</h2>
            <textarea
              rows={4}
              value={motivoModal.texto}
              onChange={(e) => setMotivoModal({ ...motivoModal, texto: e.target.value })}
              placeholder={safeT.checklistBasicoMotivoPlaceholder || 'Descreva o motivo…'}
              autoFocus
            />
            {motivoErro && <p className="cb-pro__error">{motivoErro}</p>}
            <div className="cb-pro__modal-actions">
              <button type="button" className="cb-pro__btn cb-pro__btn--ghost" onClick={() => setMotivoModal(null)}>
                {safeT.cancelar || 'Cancelar'}
              </button>
              <button type="button" className="cb-pro__btn cb-pro__btn--primary" onClick={confirmarMotivo}>
                {safeT.confirmar || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
