'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  buildDemoMailto,
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
  enrichDemoRecipients,
  getDemoModuleGroupId,
  getDemoModuleLabelForGrid,
  getDemoPresetLabel,
  resolveDemoDaysForRecipient,
  type DemoRecipientWithState,
} from '../lib/demoManagement'

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
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [gridSearch, setGridSearch] = useState('')
  const [groupsExpanded, setGroupsExpanded] = useState<Record<DemoModuleGroupId, boolean>>({
    clientes: false, tecnica: false, gestao: false, outros: false,
  })
  const [lastCreated, setLastCreated] = useState<DemoRecipientWithState | null>(null)
  const [saving, setSaving] = useState(false)

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
          (r.observacoes || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [enriched, statusFilter, search])

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

  const applyPreset = (preset: DemoPresetCard) => {
    setForm((prev) => ({
      ...prev,
      demoPreset: preset.id,
      demoModules: buildDemoModulesFromPreset(preset.id, preset.mode),
    }))
  }

  const handleAdd = async () => {
    if (!form.nome.trim()) {
      alert('Indique o nome da pessoa.')
      return
    }
    if (saving) return
    setSaving(true)
    const novo: DemoRecipientRecord = {
      id: 'demo-' + Date.now(),
      nome: form.nome.trim(),
      email: form.email.trim(),
      dataEnvio: new Date().toISOString(),
      observacoes: form.observacoes.trim() || undefined,
      demoDays: resolveDemoDaysForRecipient({ demoDays: form.demoDays }),
      demoModules: form.demoModules,
      demoPreset: form.demoPreset || 'custom',
    }
    const updated = [...recipients, novo]
    const saved = await persist(updated, { awaitServer: true })
    setSaving(false)
    if (!saved) return
    const created = enrichDemoRecipients([novo], demoLinkBaseUrl)[0]!
    setLastCreated(created)
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
    { id: 'pacote', label: 'Pacote', num: '1' },
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

  const renderPacoteStep = () => (
    <div style={panelStyle}>
      <h4 style={{ margin: '0 0 8px', color: '#8cd8ff', fontSize: compact ? '13px' : '15px' }}>Escolha o pacote de demonstração</h4>
      <p style={{ fontSize: '12px', opacity: 0.75, marginBottom: '14px', lineHeight: 1.5 }}>
        Perfil actual: <strong style={{ color: '#7dffb3' }}>{getDemoPresetLabel(form.demoPreset)}</strong>
        {' · '}
        {countActiveModules(form.demoModules)} módulos activos
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '14px' }}>
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
      {!compact && (
        <button type="button" onClick={() => setStep('destinatario')} style={{ padding: '10px 20px', background: '#00aa55', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
          Seguinte: destinatário →
        </button>
      )}
      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        style={{ marginLeft: compact ? 0 : '12px', marginTop: compact ? '8px' : 0, padding: '8px 14px', background: 'transparent', border: '1px solid rgba(0,180,255,0.35)', color: '#8cd8ff', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}
      >
        {showAdvanced ? '▼ Ocultar ajuste avançado' : '▶ Ajuste avançado (módulo a módulo)'}
      </button>
      {showAdvanced && renderAdvancedGrid()}
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
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            demoPreset: 'custom',
                            demoModules: { ...prev.demoModules, [module]: e.target.value as DemoModuleMode },
                          }))
                        }
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
        Pacote: <strong>{getDemoPresetLabel(form.demoPreset)}</strong> · Gestor Demo: <strong>{resolveDemoDaysForRecipient({ demoDays: form.demoDays })} dia(s)</strong> após «Aceitar e entrar»
      </div>
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
            ← Voltar ao pacote
          </button>
        )}
      </div>
    </div>
  )

  const renderLastCreatedBanner = () =>
    lastCreated ? (
      <div style={{ ...panelStyle, border: '2px solid rgba(0,255,140,0.4)', background: 'rgba(0,255,140,0.06)' }}>
        <h4 style={{ margin: '0 0 8px', color: '#7dffb3' }}>Link criado para {lastCreated.nome}</h4>
        <p style={{ fontSize: '11px', wordBreak: 'break-all', opacity: 0.85, marginBottom: '12px' }}>{lastCreated.link}</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => copyText(lastCreated.link, 'Link')} style={actionBtn('#8cc8ff', 'rgba(0,150,255,0.15)')}>📋 Copiar link</button>
          <button type="button" onClick={() => copyText(buildDemoShareMessage(lastCreated.nome, lastCreated.link, resolveDemoDaysForRecipient(lastCreated)), 'Mensagem')} style={actionBtn('#7dffb3', 'rgba(0,255,140,0.12)')}>📝 Copiar mensagem</button>
          <button type="button" onClick={() => window.open(buildDemoWhatsAppUrl(lastCreated.nome, lastCreated.link), '_blank', 'noopener,noreferrer')} style={actionBtn('#25d366', 'rgba(37,211,102,0.15)')}>💬 WhatsApp</button>
          {lastCreated.email ? (
            <button type="button" onClick={() => window.open(buildDemoMailto(lastCreated.email, lastCreated.nome, lastCreated.link, resolveDemoDaysForRecipient(lastCreated)), '_blank')} style={actionBtn('#ffd36a', 'rgba(255,180,0,0.12)')}>✉️ E-mail</button>
          ) : null}
          <button type="button" onClick={() => setLastCreated(null)} style={actionBtn('#999', 'rgba(255,255,255,0.06)')}>Fechar</button>
        </div>
      </div>
    ) : null

  const renderEnviadosStep = () => (
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
      <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Procurar por nome, e-mail…" style={{ ...inputStyle, width: '100%', maxWidth: '400px', marginBottom: '12px' }} />
      {filtered.length === 0 ? (
        <p style={{ textAlign: 'center', opacity: 0.6, padding: '24px' }}>Nenhuma demonstração neste filtro.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: compact ? '220px' : 'none', overflowY: compact ? 'auto' : 'visible' }}>
          {filtered.map((r) => (
            <div key={r.id} style={{ padding: compact ? '10px' : '14px', background: '#222', borderRadius: '8px', border: '1px solid rgba(0,255,0,0.1)', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '4px' }}>
                  <strong>{r.nome}</strong>
                  <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, ...statusBadgeStyle(r.status) }}>{STATUS_LABELS[r.status]}</span>
                  <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '10px', background: 'rgba(0,180,255,0.12)', color: '#8cd8ff' }}>{getDemoPresetLabel(r.demoPreset)}</span>
                  <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '10px', background: 'rgba(255,180,0,0.12)', color: '#ffd36a' }}>{resolveDemoDaysForRecipient(r)} dia(s)</span>
                </div>
                {r.email && <div style={{ fontSize: '12px', opacity: 0.8 }}>{r.email}</div>}
                <div style={{ fontSize: '10px', opacity: 0.65, marginTop: '6px', lineHeight: 1.5 }}>
                  Enviado: {new Date(r.dataEnvio).toLocaleString('pt-PT')}
                  {r.firstAccessAt ? ` · Entrou: ${new Date(r.firstAccessAt).toLocaleString('pt-PT')}` : ' · Ainda não entrou'}
                  {r.daysLeft !== null && r.status !== 'pendente' && r.status !== 'expirado' ? ` · ${r.daysLeft} dia(s) restante(s)` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => copyText(r.link, 'Link')} style={actionBtn('#8cc8ff', 'rgba(0,150,255,0.12)', compact)}>📋</button>
                <button type="button" onClick={() => window.open(buildDemoWhatsAppUrl(r.nome, r.link, r.email), '_blank', 'noopener,noreferrer')} style={actionBtn('#25d366', 'rgba(37,211,102,0.12)', compact)}>💬</button>
                <button type="button" onClick={() => handleRenew(r.id)} style={actionBtn('#7dffb3', 'rgba(0,255,140,0.1)', compact)} title={`Renovar ${resolveDemoDaysForRecipient(r)} dia(s)`}>↻</button>
                {!compact && (
                  <button type="button" onClick={() => handleReset(r.id)} style={actionBtn('#ffd36a', 'rgba(255,180,0,0.1)', compact)} title="Resetar">⟲</button>
                )}
                <button type="button" onClick={() => handleDelete(r.id)} style={{ ...actionBtn('#ff8888', 'rgba(255,80,80,0.12)', compact), border: '1px solid rgba(255,80,80,0.4)' }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )

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
          <li>Escolha o <strong>pacote</strong> (comercial, técnica, etc.)</li>
          <li>Registe o <strong>destinatário</strong>, defina os <strong>dias de validade</strong> e gere o link</li>
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
  border: '1px solid rgba(0, 255, 0, 0.25)',
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
