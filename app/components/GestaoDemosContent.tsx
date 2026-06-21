'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  buildDemoMailto,
  buildDemoModulesComplete,
  buildDemoModulesFromPreset,
  buildDemoShareMessage,
  buildDemoWhatsAppUrl,
  countActiveModules,
  createDefaultDemoLinkForm,
  DEMO_DAYS_MAX,
  DEMO_DAYS_MIN,
  DEMO_EDITABLE_ACTION_KEYS,
  DEMO_MODULE_GROUP_LABELS,
  DEMO_MODULE_GROUP_ORDER,
  DEMO_PRESET_CARDS,
  DEMO_RECIPIENTS_KEY,
  DemoModuleGroupId,
  DemoModuleMode,
  DemoPackagePreset,
  DemoPresetCard,
  DemoRecipientRecord,
  DemoRecipientStatus,
  finalizeDemoModulesPolicy,
  enrichDemoRecipients,
  getDemoModuleGroupId,
  getDemoModuleLabelForGrid,
  getDemoPresetLabel,
  resolveDemoDaysForRecipient,
  type DemoRecipientWithState,
} from '../lib/demoManagement'
import { buildDemoUsername, formatDemoCredentialsText, generateDemoAccessCredentials } from '../lib/demoCredentials'

type Variant = 'full' | 'embedded' | 'compact'

type Props = {
  variant?: Variant
  saveData?: (key: string, value: unknown, saveToLocalStorage?: boolean, awaitServer?: boolean) => Promise<boolean>
  loadData?: (key: string) => Promise<unknown>
  onOpenFullTab?: () => void
  closeTab?: (tabId: string) => void
  activeTabId?: string
  voltarPaginaInicial?: () => void
  LogoComponent?: React.ComponentType<{ size?: 'small' | 'medium' | 'large' }>
}

type WizardStep = 'pacote' | 'destinatario' | 'enviados'
type ModuleSelectionMode = 'pacote-completo' | 'modulo-a-modulo'

const MODULE_MODE_LABELS: Record<DemoModuleMode, string> = {
  active: 'Ativo',
  teaser: 'Mostrar bloqueado',
  hidden: 'Oculto',
}

const STATUS_LABELS: Record<DemoRecipientStatus, string> = {
  pendente: 'Aguardando entrada',
  ativo: 'Ativo',
  'a-expirar': 'A expirar',
  expirado: 'Expirado',
}

function statusBadgeStyle(status: DemoRecipientStatus): React.CSSProperties {
  if (status === 'pendente') return { color: '#bdbdff', border: '1px solid rgba(160,160,255,0.35)', background: 'rgba(120,120,255,0.08)' }
  if (status === 'expirado') return { color: '#ff9b9b', border: '1px solid rgba(255,120,120,0.35)', background: 'rgba(255,80,80,0.08)' }
  if (status === 'a-expirar') return { color: '#ffd36a', border: '1px solid rgba(255,180,0,0.35)', background: 'rgba(255,180,0,0.08)' }
  return { color: '#7dffb3', border: '1px solid rgba(0,255,140,0.35)', background: 'rgba(0,255,140,0.08)' }
}

export function GestaoDemosContent({
  variant = 'full',
  saveData,
  loadData,
  onOpenFullTab,
  closeTab,
  activeTabId,
  voltarPaginaInicial,
  LogoComponent,
}: Props) {
  const compact = variant === 'compact'
  const demoLinkBaseUrl = typeof window !== 'undefined' ? `${window.location.origin}/demo` : '/demo'

  const [recipients, setRecipients] = useState<DemoRecipientRecord[]>([])
  const [form, setForm] = useState(createDefaultDemoLinkForm)
  const [step, setStep] = useState<WizardStep>(variant === 'compact' ? 'destinatario' : 'pacote')
  const [statusFilter, setStatusFilter] = useState<'todos' | DemoRecipientStatus>('todos')
  const [search, setSearch] = useState('')
  const [moduleSelectionMode, setModuleSelectionMode] = useState<ModuleSelectionMode>('pacote-completo')
  const [moduleWalkIndex, setModuleWalkIndex] = useState(0)
  const [showFullModuleGrid, setShowFullModuleGrid] = useState(false)
  const [gridSearch, setGridSearch] = useState('')
  const [groupsExpanded, setGroupsExpanded] = useState<Record<DemoModuleGroupId, boolean>>({
    clientes: false, tecnica: false, gestao: false, outros: false,
  })
  const [lastCreated, setLastCreated] = useState<DemoRecipientWithState | null>(null)
  const [saving, setSaving] = useState(false)
  const [revealedPasswordIds, setRevealedPasswordIds] = useState<Record<string, boolean>>({})
  const [demoListaDetalheId, setDemoListaDetalheId] = useState<string | null>(null)

  useEffect(() => {
    setDemoListaDetalheId(null)
  }, [statusFilter, search])

  useEffect(() => {
    if (!loadData) return
    loadData(DEMO_RECIPIENTS_KEY).then((data) => {
      if (Array.isArray(data)) setRecipients(data as DemoRecipientRecord[])
    }).catch(() => {})
  }, [loadData])

  const persist = useCallback(
    async (list: DemoRecipientRecord[], opts?: { awaitServer?: boolean }): Promise<boolean> => {
      if (!saveData) {
        setRecipients(list)
        return true
      }
      try {
        if (opts?.awaitServer) {
          const ok = await saveData(DEMO_RECIPIENTS_KEY, list, true, true)
          if (!ok) {
            alert(
              'Não foi possível gravar a demonstração no servidor. Verifique a ligação à internet e tente novamente antes de enviar o link.'
            )
            return false
          }
        } else {
          void saveData(DEMO_RECIPIENTS_KEY, list, true, false).catch(() => {})
        }
        setRecipients(list)
        return true
      } catch {
        if (opts?.awaitServer) {
          alert(
            'Erro ao gravar a demonstração no servidor. Verifique a ligação e tente novamente antes de enviar o link.'
          )
        }
        return false
      }
    },
    [saveData]
  )

  const enriched = useMemo(() => enrichDemoRecipients(recipients, demoLinkBaseUrl), [recipients, demoLinkBaseUrl])

  const filtered = useMemo(() => {
    let list = enriched
    if (statusFilter !== 'todos') list = list.filter((r) => r.status === statusFilter)
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (r) =>
          r.nome.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          (r.demoUsuario || '').toLowerCase().includes(q) ||
          (r.observacoes || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [enriched, statusFilter, search])

  const demoListaAgrupada = useMemo(() => {
    const map = new Map<string, DemoRecipientWithState[]>()
    for (const r of filtered) {
      const raw = r.nome.trim().charAt(0)
      const base = raw ? raw.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase() : ''
      const letra = base && /[A-Z]/.test(base) ? base : 'Outros'
      const arr = map.get(letra) || []
      arr.push(r)
      map.set(letra, arr)
    }
    const letras = Array.from(map.keys()).sort((a, b) => {
      if (a === 'Outros') return 1
      if (b === 'Outros') return -1
      return a.localeCompare(b, 'pt', { sensitivity: 'base' })
    })
    for (const arr of map.values()) {
      arr.sort((a, b) => a.nome.localeCompare(b.nome, 'pt', { sensitivity: 'base' }))
    }
    return letras.map((letra) => ({ letra, items: map.get(letra)! }))
  }, [filtered])

  const demoDetalhe = useMemo(
    () => (demoListaDetalheId ? filtered.find((r) => r.id === demoListaDetalheId) ?? enriched.find((r) => r.id === demoListaDetalheId) : null),
    [demoListaDetalheId, filtered, enriched]
  )

  const stats = useMemo(
    () => ({
      total: enriched.length,
      pendente: enriched.filter((r) => r.status === 'pendente').length,
      ativo: enriched.filter((r) => r.status === 'ativo').length,
      aExpirar: enriched.filter((r) => r.status === 'a-expirar').length,
      expirado: enriched.filter((r) => r.status === 'expirado').length,
    }),
    [enriched]
  )

  const editableModuleKeys = DEMO_EDITABLE_ACTION_KEYS

  const applyPreset = (preset: DemoPresetCard) => {
    setModuleSelectionMode('pacote-completo')
    setForm((prev) => ({
      ...prev,
      demoPreset: preset.id,
      demoModules: buildDemoModulesFromPreset(preset.id, preset.mode),
    }))
  }

  const applyEnvioCompleto = () => {
    setModuleSelectionMode('pacote-completo')
    setForm((prev) => ({
      ...prev,
      demoPreset: 'completo',
      demoModules: buildDemoModulesComplete(),
    }))
  }

  const switchModuleSelectionMode = (mode: ModuleSelectionMode) => {
    setModuleSelectionMode(mode)
    setModuleWalkIndex(0)
    setShowFullModuleGrid(false)
    if (mode === 'modulo-a-modulo') {
      setForm((prev) => ({
        ...prev,
        demoPreset: 'custom',
        demoModules: Object.fromEntries(
          editableModuleKeys.map((action) => [action, prev.demoModules[action] || 'teaser'])
        ) as Record<string, DemoModuleMode>,
      }))
    }
  }

  const setModuleMode = (action: string, mode: DemoModuleMode) => {
    setForm((prev) => ({
      ...prev,
      demoPreset: 'custom',
      demoModules: { ...prev.demoModules, [action]: mode },
    }))
  }

  const previewUsername = useMemo(() => {
    if (!form.nome.trim()) return ''
    const draftId = `demo-preview-${form.nome.trim().length}`
    return buildDemoUsername(
      form.nome,
      form.email,
      draftId,
      recipients.map((r) => r.demoUsuario || '').filter(Boolean)
    )
  }, [form.nome, form.email, recipients])

  const handleAdd = async () => {
    if (!form.nome.trim()) {
      alert('Indique o nome da pessoa.')
      return
    }
    if (saving) return
    setSaving(true)
    const id = 'demo-' + Date.now()
    const { demoUsuario, demoSenha } = generateDemoAccessCredentials(
      form.nome,
      form.email,
      id,
      recipients.map((r) => r.demoUsuario || '').filter(Boolean)
    )
    const novo: DemoRecipientRecord = {
      id,
      nome: form.nome.trim(),
      email: form.email.trim(),
      dataEnvio: new Date().toISOString(),
      observacoes: form.observacoes.trim() || undefined,
      demoDays: resolveDemoDaysForRecipient({ demoDays: form.demoDays }),
      demoModules: finalizeDemoModulesPolicy(form.demoModules),
      demoPreset: form.demoPreset || 'custom',
      demoUsuario,
      demoSenha,
    }
    const updated = [...recipients, novo]
    const saved = await persist(updated, { awaitServer: true })
    setSaving(false)
    if (!saved) return
    const created = enrichDemoRecipients([novo], demoLinkBaseUrl)[0]!
    setLastCreated(created)
    setDemoListaDetalheId(created.id)
    setForm((prev) => ({ ...createDefaultDemoLinkForm(), demoModules: prev.demoModules, demoPreset: prev.demoPreset }))
    setStep('enviados')
  }

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert(`${label} copiado.`)
    } catch {
      alert(`${label}:\n${text}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remover este registo?')) return
    await persist(recipients.filter((x) => x.id !== id))
  }

  const handleRenew = async (id: string) => {
    const item = recipients.find((x) => x.id === id)
    const dias = resolveDemoDaysForRecipient(item)
    if (!window.confirm(`Renovar esta demo por mais ${dias} dia${dias === 1 ? '' : 's'} a partir de agora?`)) return
    const agora = new Date().toISOString()
    const dataExpiracao = new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString()
    await persist(
      recipients.map((entry) =>
        entry.id === id ? { ...entry, firstAccessAt: agora, lastAccessAt: agora, dataExpiracao } : entry
      )
    )
  }

  const handleGenerateCredentials = async (id: string) => {
    const item = recipients.find((x) => x.id === id)
    if (!item) return
    const { demoUsuario, demoSenha } = generateDemoAccessCredentials(
      item.nome,
      item.email,
      item.id,
      recipients.filter((r) => r.id !== id).map((r) => r.demoUsuario || '').filter(Boolean)
    )
    await persist(recipients.map((entry) => (entry.id === id ? { ...entry, demoUsuario, demoSenha } : entry)))
  }

  const handleReset = async (id: string) => {
    if (!window.confirm('Resetar esta demo e aguardar novo primeiro acesso?')) return
    await persist(
      recipients.map((item) =>
        item.id === id
          ? { ...item, firstAccessAt: undefined, lastAccessAt: undefined, activationCount: 0, dataExpiracao: undefined }
          : item
      )
    )
  }

  const stepTabs: { id: WizardStep; label: string; num: string }[] = [
    { id: 'pacote', label: 'Módulos', num: '1' },
    { id: 'destinatario', label: 'Destinatário', num: '2' },
    { id: 'enviados', label: 'Enviados', num: '3' },
  ]

  const panelStyle: React.CSSProperties = {
    marginBottom: compact ? '12px' : '16px',
    padding: compact ? '12px' : '16px',
    backgroundColor: '#222',
    borderRadius: '10px',
    border: '1px solid rgba(0, 180, 255, 0.15)',
  }

  const renderStats = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: compact ? '6px' : '10px', marginBottom: compact ? '12px' : '16px' }}>
      {[
        { n: stats.total, label: 'Registadas', color: '#9be7ff' },
        { n: stats.pendente, label: 'Pendentes', color: '#bdbdff' },
        { n: stats.ativo, label: 'Ativas', color: '#7dffb3' },
        { n: stats.aExpirar, label: 'A expirar', color: '#ffd36a' },
        { n: stats.expirado, label: 'Expiradas', color: '#ff9b9b' },
      ].map((s) => (
        <div key={s.label} style={{ padding: compact ? '8px' : '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
          <strong style={{ display: 'block', fontSize: compact ? '18px' : '22px', color: s.color }}>{s.n}</strong>
          <span style={{ fontSize: compact ? '10px' : '11px', opacity: 0.75 }}>{s.label}</span>
        </div>
      ))}
    </div>
  )

  const renderStepNav = () =>
    !compact ? (
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {stepTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setStep(t.id)}
            style={{
              flex: '1 1 140px',
              padding: '12px 14px',
              borderRadius: '10px',
              border: step === t.id ? '2px solid rgba(0,255,140,0.5)' : '1px solid rgba(255,255,255,0.12)',
              background: step === t.id ? 'rgba(0,255,140,0.1)' : 'rgba(255,255,255,0.03)',
              color: step === t.id ? '#7dffb3' : '#ccc',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ fontWeight: 800, marginRight: '8px', opacity: 0.7 }}>{t.num}.</span>
            {t.label}
          </button>
        ))}
      </div>
    ) : null

  const renderModuleModeSelector = () => (
    <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
      {([
        {
          id: 'pacote-completo' as const,
          title: 'Envio completo (pacote)',
          desc: 'Escolha um perfil pronto ou todos os módulos de uma vez',
          icon: '📦',
        },
        {
          id: 'modulo-a-modulo' as const,
          title: 'Passo a passo (item a item)',
          desc: 'Configure cada módulo um de cada vez, no seu ritmo',
          icon: '🧩',
        },
      ]).map((opt) => {
        const selected = moduleSelectionMode === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => switchModuleSelectionMode(opt.id)}
            style={{
              textAlign: 'left',
              padding: '14px',
              borderRadius: '10px',
              cursor: 'pointer',
              border: selected ? '2px solid rgba(0,255,140,0.55)' : '1px solid rgba(255,255,255,0.12)',
              background: selected ? 'rgba(0,255,140,0.1)' : 'rgba(255,255,255,0.03)',
              color: '#fff',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>{opt.icon}</div>
            <div style={{ fontWeight: 700, marginBottom: '4px' }}>{opt.title}</div>
            <div style={{ fontSize: '11px', opacity: 0.75, lineHeight: 1.45 }}>{opt.desc}</div>
          </button>
        )
      })}
    </div>
  )

  const renderPacoteCompleto = () => (
    <>
      <p style={{ fontSize: '12px', opacity: 0.75, marginBottom: '12px', lineHeight: 1.5 }}>
        Escolha um pacote pronto ou active <strong>todos os módulos</strong> disponíveis para o cliente.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '14px' }}>
        <button
          type="button"
          onClick={applyEnvioCompleto}
          style={{
            textAlign: 'left',
            padding: '14px',
            borderRadius: '10px',
            cursor: 'pointer',
            border: form.demoPreset === 'completo' ? '2px solid rgba(255,215,0,0.6)' : '1px solid rgba(255,215,0,0.25)',
            background: form.demoPreset === 'completo' ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.03)',
            color: '#fff',
          }}
        >
          <div style={{ fontSize: '22px', marginBottom: '6px' }}>✨</div>
          <div style={{ fontWeight: 700, marginBottom: '4px' }}>Envio completo</div>
          <div style={{ fontSize: '11px', opacity: 0.72, lineHeight: 1.4 }}>
            Todos os módulos operacionais ({editableModuleKeys.length} funções) — <strong>sem Administrador</strong>, com <strong>Extras (idioma)</strong>
          </div>
        </button>
        {DEMO_PRESET_CARDS.map((card) => {
          const selected = form.demoPreset === card.id
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => applyPreset(card)}
              style={{
                textAlign: 'left',
                padding: '14px',
                borderRadius: '10px',
                cursor: 'pointer',
                border: selected ? '2px solid rgba(0,255,140,0.55)' : '1px solid rgba(255,255,255,0.1)',
                background: selected ? 'rgba(0,255,140,0.08)' : 'rgba(255,255,255,0.03)',
                color: '#fff',
              }}
            >
              <div style={{ fontSize: '22px', marginBottom: '6px' }}>{card.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>{card.title}</div>
              <div style={{ fontSize: '11px', opacity: 0.72, lineHeight: 1.4 }}>{card.desc}</div>
            </button>
          )
        })}
      </div>
      <button
        type="button"
        onClick={() => setShowFullModuleGrid((v) => !v)}
        style={{ padding: '8px 14px', background: 'transparent', border: '1px solid rgba(0,180,255,0.35)', color: '#8cd8ff', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}
      >
        {showFullModuleGrid ? '▼ Ocultar lista de módulos' : '▶ Ver ou ajustar módulos na lista'}
      </button>
      {showFullModuleGrid && renderAdvancedGrid()}
    </>
  )

  const renderModuloAModulo = () => {
    const total = editableModuleKeys.length
    const safeIndex = Math.min(Math.max(moduleWalkIndex, 0), Math.max(total - 1, 0))
    const currentAction = editableModuleKeys[safeIndex]
    const currentMode = (currentAction && form.demoModules[currentAction]) || 'teaser'
    const currentGroup = currentAction ? DEMO_MODULE_GROUP_LABELS[getDemoModuleGroupId(currentAction)] : ''

    return (
      <>
        <p style={{ fontSize: '12px', opacity: 0.75, marginBottom: '12px', lineHeight: 1.5 }}>
          Percorra cada módulo e defina se fica <strong>Ativo</strong>, <strong>bloqueado (teaser)</strong> ou <strong>Oculto</strong>.
        </p>
        <div style={{ marginBottom: '12px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(0,180,255,0.08)', border: '1px solid rgba(0,180,255,0.2)', fontSize: '11px', opacity: 0.85 }}>
          Progresso: <strong>{safeIndex + 1}</strong> de <strong>{total}</strong>
          {' · '}
          {countActiveModules(form.demoModules)} activos
          {' · '}
          {Object.values(form.demoModules).filter((m) => m === 'teaser').length} teaser
          {' · '}
          {Object.values(form.demoModules).filter((m) => m === 'hidden').length} ocultos
        </div>
        {currentAction && (
          <div style={{ padding: compact ? '14px' : '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,255,140,0.25)', marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', opacity: 0.65, marginBottom: '6px' }}>{currentGroup}</div>
            <div style={{ fontSize: compact ? '15px' : '17px', fontWeight: 700, marginBottom: '14px', color: '#7dffb3' }}>
              {getDemoModuleLabelForGrid(currentAction)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
              {(['active', 'teaser', 'hidden'] as DemoModuleMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setModuleMode(currentAction, mode)}
                  style={{
                    padding: '12px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '12px',
                    border: currentMode === mode ? '2px solid rgba(0,255,140,0.6)' : '1px solid rgba(255,255,255,0.15)',
                    background:
                      currentMode === mode
                        ? mode === 'active'
                          ? 'rgba(0,255,140,0.15)'
                          : mode === 'teaser'
                            ? 'rgba(255,180,0,0.12)'
                            : 'rgba(255,80,80,0.1)'
                        : 'rgba(255,255,255,0.03)',
                    color: mode === 'active' ? '#7dffb3' : mode === 'teaser' ? '#ffd36a' : '#ff9b9b',
                  }}
                >
                  {MODULE_MODE_LABELS[mode]}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                disabled={safeIndex <= 0}
                onClick={() => setModuleWalkIndex((i) => Math.max(0, i - 1))}
                style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#ccc', borderRadius: '8px', cursor: safeIndex <= 0 ? 'not-allowed' : 'pointer', opacity: safeIndex <= 0 ? 0.5 : 1 }}
              >
                ← Anterior
              </button>
              <button
                type="button"
                disabled={safeIndex >= total - 1}
                onClick={() => setModuleWalkIndex((i) => Math.min(total - 1, i + 1))}
                style={{ padding: '8px 14px', background: '#00aa55', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 700, cursor: safeIndex >= total - 1 ? 'not-allowed' : 'pointer', opacity: safeIndex >= total - 1 ? 0.5 : 1 }}
              >
                Próximo →
              </button>
              {safeIndex < total - 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setModuleMode(currentAction, 'active')
                    setModuleWalkIndex((i) => Math.min(total - 1, i + 1))
                  }}
                  style={{ padding: '8px 14px', background: 'rgba(0,255,140,0.12)', border: '1px solid rgba(0,255,140,0.35)', color: '#7dffb3', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Ativo e seguinte
                </button>
              )}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <button
            type="button"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                demoPreset: 'custom',
                demoModules: Object.fromEntries(editableModuleKeys.map((a) => [a, 'active'])) as Record<string, DemoModuleMode>,
              }))
            }
            style={{ padding: '7px 12px', fontSize: '11px', background: 'rgba(0,255,140,0.1)', border: '1px solid rgba(0,255,140,0.3)', color: '#7dffb3', borderRadius: '6px', cursor: 'pointer' }}
          >
            Marcar todos Ativo
          </button>
          <button
            type="button"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                demoPreset: 'custom',
                demoModules: Object.fromEntries(editableModuleKeys.map((a) => [a, 'hidden'])) as Record<string, DemoModuleMode>,
              }))
            }
            style={{ padding: '7px 12px', fontSize: '11px', background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.3)', color: '#ff9b9b', borderRadius: '6px', cursor: 'pointer' }}
          >
            Marcar todos Oculto
          </button>
          <button
            type="button"
            onClick={() => setShowFullModuleGrid((v) => !v)}
            style={{ padding: '7px 12px', fontSize: '11px', background: 'transparent', border: '1px solid rgba(0,180,255,0.35)', color: '#8cd8ff', borderRadius: '6px', cursor: 'pointer' }}
          >
            {showFullModuleGrid ? 'Ocultar grelha' : 'Ver grelha completa'}
          </button>
        </div>
        {showFullModuleGrid && renderAdvancedGrid()}
      </>
    )
  }

  const renderPacoteStep = () => (
    <div style={panelStyle}>
      <h4 style={{ margin: '0 0 8px', color: '#8cd8ff', fontSize: compact ? '13px' : '15px' }}>Escolha como configurar os módulos</h4>
      <p style={{ fontSize: '12px', opacity: 0.75, marginBottom: '14px', lineHeight: 1.5 }}>
        Perfil: <strong style={{ color: '#7dffb3' }}>{getDemoPresetLabel(form.demoPreset)}</strong>
        {' · '}
        {countActiveModules(form.demoModules)} módulos activos
      </p>
      {renderModuleModeSelector()}
      {moduleSelectionMode === 'pacote-completo' ? renderPacoteCompleto() : renderModuloAModulo()}
      {!compact && (
        <button
          type="button"
          onClick={() => setStep('destinatario')}
          style={{ marginTop: '14px', padding: '10px 20px', background: '#00aa55', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
        >
          Seguinte: destinatário →
        </button>
      )}
    </div>
  )

  const renderAdvancedGrid = () => {
    const q = gridSearch.trim().toLowerCase()
    const filteredModules = DEMO_EDITABLE_ACTION_KEYS.filter((action) => {
      if (!q) return true
      return getDemoModuleLabelForGrid(action).toLowerCase().includes(q) || action.includes(q)
    })
    const grouped: Record<DemoModuleGroupId, string[]> = { clientes: [], tecnica: [], gestao: [], outros: [] }
    for (const action of filteredModules) grouped[getDemoModuleGroupId(action)].push(action)

    return (
      <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <input
          type="search"
          value={gridSearch}
          onChange={(e) => setGridSearch(e.target.value)}
          placeholder="Filtrar módulos…"
          style={{ width: '100%', maxWidth: '360px', marginBottom: '10px', padding: '8px 12px', background: '#141414', color: '#fff', border: '1px solid rgba(0,180,255,0.28)', borderRadius: '8px' }}
        />
        {DEMO_MODULE_GROUP_ORDER.map((groupId) => {
          const items = grouped[groupId]
          if (!items.length) return null
          const open = groupsExpanded[groupId]
          return (
            <div key={groupId} style={{ marginBottom: '10px' }}>
              <button
                type="button"
                onClick={() => setGroupsExpanded((p) => ({ ...p, [groupId]: !p[groupId] }))}
                style={{ width: '100%', textAlign: 'left', padding: '8px 10px', background: 'rgba(0,180,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#d7f4ff', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
              >
                {open ? '▼' : '▶'} {DEMO_MODULE_GROUP_LABELS[groupId]} ({items.length})
              </button>
              {open && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', marginTop: '8px' }}>
                  {items.map((module) => (
                    <div key={module} style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '6px' }}>{getDemoModuleLabelForGrid(module)}</div>
                      <select
                        value={form.demoModules[module] || 'teaser'}
                        onChange={(e) => {
                          setModuleSelectionMode('modulo-a-modulo')
                          setModuleMode(module, e.target.value as DemoModuleMode)
                        }}
                        style={{ width: '100%', padding: '6px', background: '#141414', color: '#fff', border: '1px solid rgba(0,180,255,0.25)', borderRadius: '4px', fontSize: '11px' }}
                      >
                        <option value="active">Ativo</option>
                        <option value="teaser">Mostrar bloqueado</option>
                        <option value="hidden">Oculto</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderCredentialsBlock = (recipient: Pick<DemoRecipientRecord, 'id' | 'demoUsuario' | 'demoSenha'>, opts?: { compact?: boolean; showCopy?: boolean }) => {
    if (!recipient.demoUsuario || !recipient.demoSenha) return null
    const revealed = revealedPasswordIds[recipient.id] ?? opts?.showCopy ?? false
    return (
      <div
        style={{
          marginTop: opts?.compact ? '8px' : '10px',
          padding: '10px 12px',
          borderRadius: '8px',
          background: 'rgba(255,215,0,0.08)',
          border: '1px solid rgba(255,215,0,0.28)',
          fontSize: '12px',
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: '#ffd36a' }}>Acesso gerado</strong>
        <div style={{ marginTop: '6px' }}>
          Utilizador: <code style={{ color: '#fff' }}>{recipient.demoUsuario}</code>
        </div>
        <div>
          Senha:{' '}
          <code style={{ color: '#fff' }}>{revealed ? recipient.demoSenha : '••••••••'}</code>
          {!opts?.showCopy && (
            <button
              type="button"
              onClick={() => setRevealedPasswordIds((p) => ({ ...p, [recipient.id]: !revealed }))}
              style={{ marginLeft: '8px', padding: '2px 8px', fontSize: '10px', background: 'transparent', border: '1px solid rgba(255,215,0,0.35)', color: '#ffd36a', borderRadius: '4px', cursor: 'pointer' }}
            >
              {revealed ? 'Ocultar' : 'Mostrar'}
            </button>
          )}
        </div>
        {opts?.showCopy !== false && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
            <button type="button" onClick={() => copyText(recipient.demoUsuario!, 'Utilizador')} style={actionBtn('#ffd36a', 'rgba(255,215,0,0.1)', opts?.compact)}>
              Copiar utilizador
            </button>
            <button type="button" onClick={() => copyText(recipient.demoSenha!, 'Senha')} style={actionBtn('#ffd36a', 'rgba(255,215,0,0.1)', opts?.compact)}>
              Copiar senha
            </button>
            <button
              type="button"
              onClick={() => copyText(formatDemoCredentialsText(recipient), 'Credenciais')}
              style={actionBtn('#7dffb3', 'rgba(0,255,140,0.1)', opts?.compact)}
            >
              Copiar ambos
            </button>
          </div>
        )}
      </div>
    )
  }

  const renderDestinatarioStep = () => (
    <div style={panelStyle}>
      <h4 style={{ margin: '0 0 12px', color: '#7dffb3', fontSize: compact ? '13px' : '15px' }}>Registar destinatário e gerar link</h4>
      <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '12px' }}>
        <input type="text" placeholder="Nome *" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} style={inputStyle} />
        <input type="email" placeholder="E-mail (opcional)" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} style={inputStyle} />
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', opacity: 0.85 }}>
          <span>Validade (dias) *</span>
          <input
            type="number"
            min={DEMO_DAYS_MIN}
            max={DEMO_DAYS_MAX}
            value={form.demoDays}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                demoDays: resolveDemoDaysForRecipient({ demoDays: Number(e.target.value) }),
              }))
            }
            style={inputStyle}
          />
        </label>
        <input type="text" placeholder="Observações" value={form.observacoes} onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))} style={inputStyle} />
      </div>
      <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '12px', lineHeight: 1.5 }}>
        Módulos: <strong>{getDemoPresetLabel(form.demoPreset)}</strong> ({countActiveModules(form.demoModules)} activos) · Validade: <strong>{resolveDemoDaysForRecipient({ demoDays: form.demoDays })} dia(s)</strong>
      </div>
      {form.nome.trim() && (
        <div style={{ marginBottom: '12px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,215,0,0.06)', border: '1px dashed rgba(255,215,0,0.25)', fontSize: '11px', lineHeight: 1.55 }}>
          Ao gerar o link, será criado automaticamente um utilizador de demo com base no nome/e-mail.
          {previewUsername ? (
            <>
              {' '}
              Pré-visualização do utilizador: <strong style={{ color: '#ffd36a' }}>{previewUsername}</strong> · a senha será gerada ao confirmar.
            </>
          ) : null}
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleAdd}
          disabled={saving}
          style={{
            padding: '10px 20px',
            background: saving ? '#006633' : '#00aa55',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: saving ? 'wait' : 'pointer',
            opacity: saving ? 0.85 : 1,
          }}
        >
          {saving ? 'A gravar no servidor…' : '✓ Gerar link personalizado'}
        </button>
        {!compact && (
          <button type="button" onClick={() => setStep('pacote')} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#ccc', borderRadius: '8px', cursor: 'pointer' }}>
            ← Voltar aos módulos
          </button>
        )}
      </div>
    </div>
  )

  const renderLastCreatedBanner = () =>
    lastCreated ? (
      <div style={{ ...panelStyle, border: '2px solid rgba(0,255,140,0.4)', background: 'rgba(0,255,140,0.06)' }}>
        <h4 style={{ margin: '0 0 8px', color: '#7dffb3' }}>Link criado para {lastCreated.nome}</h4>
        <p style={{ fontSize: '11px', wordBreak: 'break-all', opacity: 0.85, marginBottom: '8px' }}>{lastCreated.link}</p>
        {renderCredentialsBlock(lastCreated, { showCopy: true })}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
          <button type="button" onClick={() => copyText(lastCreated.link, 'Link')} style={actionBtn('#8cc8ff', 'rgba(0,150,255,0.15)')}>📋 Copiar link</button>
          <button
            type="button"
            onClick={() =>
              copyText(
                buildDemoShareMessage(lastCreated.nome, lastCreated.link, resolveDemoDaysForRecipient(lastCreated), {
                  demoUsuario: lastCreated.demoUsuario,
                  demoSenha: lastCreated.demoSenha,
                }),
                'Mensagem'
              )
            }
            style={actionBtn('#7dffb3', 'rgba(0,255,140,0.12)')}
          >
            📝 Copiar mensagem
          </button>
          <button
            type="button"
            onClick={() =>
              window.open(
                buildDemoWhatsAppUrl(lastCreated.nome, lastCreated.link, lastCreated.email, {
                  demoUsuario: lastCreated.demoUsuario,
                  demoSenha: lastCreated.demoSenha,
                }, resolveDemoDaysForRecipient(lastCreated)),
                '_blank',
                'noopener,noreferrer'
              )
            }
            style={actionBtn('#25d366', 'rgba(37,211,102,0.15)')}
          >
            💬 WhatsApp
          </button>
          {lastCreated.email ? (
            <button
              type="button"
              onClick={() =>
                window.open(
                  buildDemoMailto(lastCreated.email, lastCreated.nome, lastCreated.link, resolveDemoDaysForRecipient(lastCreated), {
                    demoUsuario: lastCreated.demoUsuario,
                    demoSenha: lastCreated.demoSenha,
                  }),
                  '_blank'
                )
              }
              style={actionBtn('#ffd36a', 'rgba(255,180,0,0.12)')}
            >
              ✉️ E-mail
            </button>
          ) : null}
          <button type="button" onClick={() => setLastCreated(null)} style={actionBtn('#999', 'rgba(255,255,255,0.06)')}>Fechar</button>
        </div>
      </div>
    ) : null

  const renderEnviadosStep = () => {
    const renderRecipientDetail = (r: DemoRecipientWithState) => (
      <div style={{ ...panelStyle, border: '2px solid rgba(0,180,255,0.35)', background: 'rgba(0,180,255,0.04)' }}>
        <button
          type="button"
          onClick={() => setDemoListaDetalheId(null)}
          style={{ marginBottom: '14px', padding: '8px 14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#ccc', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}
        >
          ← Voltar à lista de nomes
        </button>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '10px' }}>
          <h4 style={{ margin: 0, color: '#8cd8ff', fontSize: compact ? '16px' : '18px' }}>{r.nome}</h4>
          <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, ...statusBadgeStyle(r.status) }}>
            {STATUS_LABELS[r.status]}
          </span>
        </div>
        {r.email ? <div style={{ fontSize: '13px', opacity: 0.85, marginBottom: '10px' }}>{r.email}</div> : null}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '10px', background: 'rgba(0,180,255,0.12)', color: '#8cd8ff' }}>
            {getDemoPresetLabel(r.demoPreset)}
          </span>
          <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '10px', background: 'rgba(255,180,0,0.12)', color: '#ffd36a' }}>
            {resolveDemoDaysForRecipient(r)} dia(s)
          </span>
          <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '10px', background: 'rgba(0,255,140,0.1)', color: '#7dffb3' }}>
            {countActiveModules(r.demoModules || {})} módulos activos
          </span>
        </div>
        <p style={{ fontSize: '11px', wordBreak: 'break-all', opacity: 0.9, margin: '0 0 10px', lineHeight: 1.5 }}>
          <strong style={{ color: '#8cd8ff' }}>Link:</strong> {r.link}
        </p>
        {r.demoUsuario && r.demoSenha ? (
          renderCredentialsBlock(r, { showCopy: true })
        ) : (
          <button
            type="button"
            onClick={() => handleGenerateCredentials(r.id)}
            style={{ marginBottom: '12px', padding: '8px 12px', fontSize: '12px', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.35)', color: '#ffd36a', borderRadius: '6px', cursor: 'pointer' }}
          >
            Gerar utilizador e senha
          </button>
        )}
        <div style={{ fontSize: '11px', opacity: 0.75, lineHeight: 1.6, marginBottom: '14px' }}>
          <div>Enviado: {new Date(r.dataEnvio).toLocaleString('pt-PT')}</div>
          <div>{r.firstAccessAt ? `Entrou: ${new Date(r.firstAccessAt).toLocaleString('pt-PT')}` : 'Ainda não entrou na demo'}</div>
          {r.daysLeft !== null && r.status !== 'pendente' && r.status !== 'expirado' ? (
            <div>{r.daysLeft} dia(s) restante(s)</div>
          ) : null}
          {r.observacoes ? <div style={{ marginTop: '6px' }}>Obs.: {r.observacoes}</div> : null}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => copyText(r.link, 'Link')} style={actionBtn('#8cc8ff', 'rgba(0,150,255,0.15)', compact)}>
            📋 Copiar link
          </button>
          <button
            type="button"
            onClick={() =>
              copyText(
                buildDemoShareMessage(r.nome, r.link, resolveDemoDaysForRecipient(r), {
                  demoUsuario: r.demoUsuario,
                  demoSenha: r.demoSenha,
                }),
                'Mensagem'
              )
            }
            style={actionBtn('#7dffb3', 'rgba(0,255,140,0.12)', compact)}
          >
            📝 Copiar mensagem
          </button>
          <button
            type="button"
            onClick={() =>
              window.open(
                buildDemoWhatsAppUrl(r.nome, r.link, r.email, { demoUsuario: r.demoUsuario, demoSenha: r.demoSenha }, resolveDemoDaysForRecipient(r)),
                '_blank',
                'noopener,noreferrer'
              )
            }
            style={actionBtn('#25d366', 'rgba(37,211,102,0.15)', compact)}
          >
            💬 WhatsApp
          </button>
          {r.email ? (
            <button
              type="button"
              onClick={() =>
                window.open(
                  buildDemoMailto(r.email, r.nome, r.link, resolveDemoDaysForRecipient(r), {
                    demoUsuario: r.demoUsuario,
                    demoSenha: r.demoSenha,
                  }),
                  '_blank'
                )
              }
              style={actionBtn('#ffd36a', 'rgba(255,180,0,0.12)', compact)}
            >
              ✉️ E-mail
            </button>
          ) : null}
          <button type="button" onClick={() => handleRenew(r.id)} style={actionBtn('#7dffb3', 'rgba(0,255,140,0.1)', compact)} title={`Renovar ${resolveDemoDaysForRecipient(r)} dia(s)`}>
            ↻ Renovar
          </button>
          {!compact && (
            <button type="button" onClick={() => handleReset(r.id)} style={actionBtn('#ffd36a', 'rgba(255,180,0,0.1)', compact)} title="Resetar">
              ⟲ Resetar
            </button>
          )}
          <button type="button" onClick={() => handleDelete(r.id)} style={{ ...actionBtn('#ff8888', 'rgba(255,80,80,0.12)', compact), border: '1px solid rgba(255,80,80,0.4)' }}>
            🗑 Remover
          </button>
        </div>
      </div>
    )

    return (
      <>
        {renderLastCreatedBanner()}
        {renderStats()}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {(['todos', 'pendente', 'ativo', 'a-expirar', 'expirado'] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setStatusFilter(id)}
              style={{
                padding: '6px 12px',
                borderRadius: '999px',
                border: statusFilter === id ? '1px solid rgba(0,255,140,0.45)' : '1px solid rgba(255,255,255,0.12)',
                background: statusFilter === id ? 'rgba(0,255,140,0.1)' : 'rgba(255,255,255,0.04)',
                color: statusFilter === id ? '#7dffb3' : '#ccc',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {id === 'todos' ? `Todos (${stats.total})` : `${STATUS_LABELS[id as DemoRecipientStatus]} (${enriched.filter((r) => r.status === id).length})`}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Procurar por nome, e-mail ou utilizador…"
          style={{ ...inputStyle, width: '100%', maxWidth: '400px', marginBottom: '12px' }}
        />

        {demoDetalhe ? (
          renderRecipientDetail(demoDetalhe)
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', opacity: 0.6, padding: '24px' }}>Nenhuma demonstração neste filtro.</p>
        ) : (
          <div className="clientes-alfa-wrap" style={{ maxHeight: compact ? '280px' : 'none', overflowY: compact ? 'auto' : 'visible' }}>
            <p style={{ fontSize: '12px', opacity: 0.75, margin: '0 0 12px' }}>
              Clique num <strong>nome</strong> para ver link, credenciais, estado e acções.
            </p>
            {demoListaAgrupada.length > 1 && (
              <nav className="clientes-alfa-jump" aria-label="Índice alfabético">
                {demoListaAgrupada.map(({ letra }) => (
                  <a key={letra} className="clientes-alfa-jump-link" href={`#demo-alfa-${letra}`}>
                    {letra}
                  </a>
                ))}
              </nav>
            )}
            {demoListaAgrupada.map(({ letra, items }) => (
              <section key={letra} id={`demo-alfa-${letra}`} className="clientes-alfa-secao">
                <div className="clientes-alfa-letra">{letra}</div>
                <div className="clientes-alfa-nomes">
                  {items.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className="clientes-alfa-nome-btn"
                      onClick={() => setDemoListaDetalheId(r.id)}
                      title={`${STATUS_LABELS[r.status]} · ${getDemoPresetLabel(r.demoPreset)}`}
                    >
                      {r.nome}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </>
    )
  }

  const body = (
    <>
      <div style={{ ...panelStyle, background: 'rgba(255,120,80,0.08)', border: '1px solid rgba(255,120,80,0.35)' }}>
        <strong style={{ color: '#ffb199' }}>Importante — não misture com o seu programa principal</strong>
        <p style={{ margin: '8px 0 0', fontSize: '12px', opacity: 0.9, lineHeight: 1.6 }}>
          Envie o link <strong>só aos clientes</strong>. Não abra links de demo no browser onde trabalha no sistema real —
          isso activava modo demonstração no seu programa. Para testar, use <strong>janela anónima</strong> ou outro browser.
        </p>
        <button
          type="button"
          onClick={() => {
            void fetch('/api/demo/clear', { credentials: 'include' })
              .then(() => window.location.assign('/'))
              .catch(() => window.location.assign('/api/demo/clear'))
          }}
          style={{ marginTop: '10px', padding: '8px 14px', background: 'rgba(255,120,80,0.15)', border: '1px solid rgba(255,120,80,0.45)', color: '#ffb199', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
        >
          Sair do modo demo neste browser
        </button>
      </div>

      <div style={{ ...panelStyle, background: 'rgba(0,180,255,0.06)', border: '1px solid rgba(0,180,255,0.2)' }}>
        <strong style={{ color: '#8cd8ff' }}>Como enviar um Gestor Demo em 3 passos</strong>
        <ol style={{ margin: '8px 0 0', paddingLeft: '20px', fontSize: '12px', opacity: 0.85, lineHeight: 1.6 }}>
          <li>Escolha <strong>envio completo</strong> (pacote) ou <strong>módulo a módulo</strong></li>
          <li>Registe o <strong>destinatário</strong> — o sistema gera <strong>utilizador e senha</strong> automaticamente</li>
          <li>Envie por <strong>WhatsApp, e-mail ou cópia</strong> — o sistema não envia automaticamente</li>
        </ol>
        <p style={{ fontSize: '11px', opacity: 0.65, margin: '8px 0 0' }}>Link base: {demoLinkBaseUrl}</p>
      </div>

      {onOpenFullTab && variant !== 'full' && (
        <div style={{ marginBottom: '12px', textAlign: 'right' }}>
          <button type="button" onClick={onOpenFullTab} style={{ padding: '8px 14px', fontSize: '12px', background: 'rgba(0,180,255,0.12)', border: '1px solid rgba(0,200,255,0.45)', color: '#9be7ff', borderRadius: '8px', cursor: 'pointer' }}>
            Abrir ecrã completo numa aba
          </button>
        </div>
      )}

      {renderStepNav()}

      {compact ? (
        <>
          {renderPacoteStep()}
          {renderDestinatarioStep()}
          {renderEnviadosStep()}
        </>
      ) : (
        <>
          {step === 'pacote' && renderPacoteStep()}
          {step === 'destinatario' && renderDestinatarioStep()}
          {step === 'enviados' && renderEnviadosStep()}
        </>
      )}
    </>
  )

  if (variant === 'full') {
    return (
      <div className="tab-content-wrapper" style={{ padding: compact ? '12px' : '20px' }}>
        {(closeTab || voltarPaginaInicial) && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            {LogoComponent && <LogoComponent size="small" />}
            <h1 style={{ flex: 1, margin: 0, fontSize: '1.25rem', color: '#8cd8ff' }}>📤 Gestão de envio de demonstrações</h1>
            {closeTab && activeTabId && (
              <button type="button" onClick={() => closeTab(activeTabId)} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}>↶ Voltar</button>
            )}
            {voltarPaginaInicial && (
              <button type="button" onClick={voltarPaginaInicial} style={{ padding: '8px 12px', background: 'rgba(0,150,255,0.12)', border: '1px solid rgba(0,150,255,0.35)', color: '#8cc8ff', borderRadius: '6px', cursor: 'pointer' }}>🏠 Início</button>
            )}
          </div>
        )}
        {body}
      </div>
    )
  }

  return <div className="gestao-demos-embed">{body}</div>
}

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  backgroundColor: '#141414',
  color: '#fff',
  border: '1px solid rgba(0, 200, 83, 0.25)',
  borderRadius: '8px',
  fontSize: '14px',
}

function actionBtn(color: string, bg: string, compact?: boolean): React.CSSProperties {
  return {
    padding: compact ? '6px 10px' : '8px 12px',
    fontSize: compact ? '12px' : '13px',
    background: bg,
    border: `1px solid ${color}55`,
    color,
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
  }
}
