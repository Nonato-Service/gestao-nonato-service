'use client'

import React, { useMemo, useState } from 'react'
import { saveData } from '../utils/dataStorage'
import { AssistTextarea } from './AssistTextFields'

export type ConhecimentoTecnicoEntry = {
  id: string
  tecnicoId: string
  equipamentoTipoId: string
  equipamentoTipoNome: string
  mecanico: number
  eletrico: number
  software: number
  programacao: number
  descricaoMecanico?: string
  descricaoEletrico?: string
  descricaoSoftware?: string
  descricaoProgramacao?: string
}

type TecnicoResumo = {
  id: string
  name: string
  photo?: string
  type: string
}

type NivelOpcao = { value: number; label: string }
type TipoEquipamentoOpcao = { id: string; nome: string }

type SkillField = 'mecanico' | 'eletrico' | 'software' | 'programacao'
type CampoDescricao = SkillField

const SKILL_META: Array<{ field: SkillField; icon: string; tone: string }> = [
  { field: 'mecanico', icon: '⚙', tone: 'mech' },
  { field: 'eletrico', icon: '⚡', tone: 'elec' },
  { field: 'software', icon: '◈', tone: 'soft' },
  { field: 'programacao', icon: '⌘', tone: 'prog' },
]

export type ConhecimentoTecnicosContentProps = {
  safeT: Record<string, string | undefined>
  LogoComponent: React.ComponentType<{ size?: 'small' | 'medium' | 'large' }>
  closeTab: (tabId: string) => void
  activeTabId: string | null
  voltarPaginaInicial: () => void
  tecnicos: TecnicoResumo[]
  tecnicoConhecimentoSelecionado: string | null
  setTecnicoConhecimentoSelecionado: (id: string) => void
  conhecimentoTecnicos: ConhecimentoTecnicoEntry[]
  setConhecimentoTecnicos: React.Dispatch<React.SetStateAction<ConhecimentoTecnicoEntry[]>>
  familiasEquipamento: string[]
  gruposEquipamento: Array<{ familia?: string; nome: string }>
}

function tecnicoTypeLabel(tecnico: TecnicoResumo, safeT: Record<string, string | undefined>): string {
  if (tecnico.type === 'internal') return safeT.internal ?? 'Interno'
  if (tecnico.type === 'external') return safeT.external ?? 'Externo'
  return safeT.armazem ?? 'Armazém'
}

function tecnicoTypeClass(tecnico: TecnicoResumo): string {
  if (tecnico.type === 'internal') return 'ct-pro__badge--internal'
  if (tecnico.type === 'external') return 'ct-pro__badge--external'
  return 'ct-pro__badge--warehouse'
}

function nivelTone(value: number): string {
  if (value >= 4) return 'expert'
  if (value >= 3) return 'advanced'
  if (value >= 2) return 'medium'
  if (value >= 1) return 'basic'
  return 'none'
}

function computeTecnicoStats(entries: ConhecimentoTecnicoEntry[]) {
  let totalSkills = 0
  let sum = 0
  let expert = 0
  for (const e of entries) {
    for (const f of SKILL_META) {
      const v = e[f.field]
      totalSkills++
      sum += v
      if (v >= 4) expert++
    }
  }
  const media = totalSkills > 0 ? sum / totalSkills : 0
  return { equipamentos: entries.length, media, expert, totalSkills }
}

function SkillPillar(props: {
  label: string
  icon: string
  tone: string
  value: number
  nivelOpcoes: NivelOpcao[]
  onChange: (v: number) => void
}) {
  const { label, icon, tone, value, nivelOpcoes, onChange } = props
  const activeLabel = nivelOpcoes.find((o) => o.value === value)?.label ?? '—'
  return (
    <div className={`ct-pro__pillar ct-pro__pillar--${tone} ct-pro__pillar--${nivelTone(value)}`}>
      <div className="ct-pro__pillar-top">
        <span className="ct-pro__pillar-icon" aria-hidden>
          {icon}
        </span>
        <div className="ct-pro__pillar-copy">
          <span className="ct-pro__pillar-label">{label}</span>
          <span className="ct-pro__pillar-level">{activeLabel}</span>
        </div>
        <span className="ct-pro__pillar-score">{value}/4</span>
      </div>
      <div className="ct-pro__pillar-meter" aria-hidden>
        {[1, 2, 3, 4].map((step) => (
          <span key={step} className={`ct-pro__pillar-seg${value >= step ? ' is-lit' : ''}`} />
        ))}
      </div>
      <div className="ct-pro__pillar-picker" role="group" aria-label={label}>
        {nivelOpcoes.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`ct-pro__lvl-btn${value === o.value ? ' is-active' : ''}`}
            title={o.label}
            aria-label={`${label}: ${o.label}`}
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
          >
            {o.value}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ConhecimentoTecnicosContent(props: ConhecimentoTecnicosContentProps) {
  const {
    safeT,
    LogoComponent,
    closeTab,
    activeTabId,
    voltarPaginaInicial,
    tecnicos,
    tecnicoConhecimentoSelecionado,
    setTecnicoConhecimentoSelecionado,
    conhecimentoTecnicos,
    setConhecimentoTecnicos,
    familiasEquipamento,
    gruposEquipamento,
  } = props

  const [buscaTecnico, setBuscaTecnico] = useState('')

  const nivelOpcoes: NivelOpcao[] = [
    { value: 0, label: safeT.conhecimentoNivelNenhum ?? 'Nenhum' },
    { value: 1, label: safeT.conhecimentoNivelBasico ?? 'Básico' },
    { value: 2, label: safeT.conhecimentoNivelMedio ?? 'Médio' },
    { value: 3, label: safeT.conhecimentoNivelAvancado ?? 'Avançado' },
    { value: 4, label: safeT.conhecimentoNivelEspecialista ?? 'Especialista' },
  ]

  const tiposEquipamentoOpcoes = useMemo((): TipoEquipamentoOpcao[] => {
    const out: TipoEquipamentoOpcao[] = []
    const fams = [...(familiasEquipamento || [])].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    fams.forEach((f) => {
      const grupos = (gruposEquipamento || []).filter((g) => (g.familia || '') === f)
      if (grupos.length === 0) out.push({ id: `${f}|`, nome: f })
      else grupos.forEach((g) => out.push({ id: `${g.familia || f}|${g.nome}`, nome: `${g.familia || f} › ${g.nome}` }))
    })
    return out
  }, [familiasEquipamento, gruposEquipamento])

  const tecnicosFiltrados = useMemo(() => {
    const q = buscaTecnico.trim().toLowerCase()
    if (!q) return tecnicos
    return tecnicos.filter((t) => t.name.toLowerCase().includes(q))
  }, [buscaTecnico, tecnicos])

  const conhecimentosDoTecnico = tecnicoConhecimentoSelecionado
    ? conhecimentoTecnicos.filter((c) => c.tecnicoId === tecnicoConhecimentoSelecionado)
    : []

  const tecnicoSelecionado = tecnicos.find((t) => t.id === tecnicoConhecimentoSelecionado)
  const stats = computeTecnicoStats(conhecimentosDoTecnico)

  const addConhecimento = (equipamentoTipoId: string, equipamentoTipoNome: string) => {
    if (!tecnicoConhecimentoSelecionado) return
    const existe = conhecimentoTecnicos.some(
      (c) => c.tecnicoId === tecnicoConhecimentoSelecionado && c.equipamentoTipoId === equipamentoTipoId
    )
    if (existe) return
    const novo: ConhecimentoTecnicoEntry = {
      id: `ct-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      tecnicoId: tecnicoConhecimentoSelecionado,
      equipamentoTipoId,
      equipamentoTipoNome,
      mecanico: 0,
      eletrico: 0,
      software: 0,
      programacao: 0,
    }
    const next = [...conhecimentoTecnicos, novo]
    setConhecimentoTecnicos(next)
    void saveData('nonato-conhecimento-tecnicos', next)
  }

  const updateConhecimento = (id: string, field: SkillField, value: number) => {
    const next = conhecimentoTecnicos.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    setConhecimentoTecnicos(next)
    void saveData('nonato-conhecimento-tecnicos', next)
  }

  const updateConhecimentoDescricaoCampo = (id: string, campo: CampoDescricao, value: string) => {
    const key =
      campo === 'mecanico'
        ? 'descricaoMecanico'
        : campo === 'eletrico'
          ? 'descricaoEletrico'
          : campo === 'software'
            ? 'descricaoSoftware'
            : 'descricaoProgramacao'
    const next = conhecimentoTecnicos.map((c) => (c.id === id ? { ...c, [key]: value } : c))
    setConhecimentoTecnicos(next)
    void saveData('nonato-conhecimento-tecnicos', next)
  }

  const removeConhecimento = (id: string) => {
    const next = conhecimentoTecnicos.filter((c) => c.id !== id)
    setConhecimentoTecnicos(next)
    void saveData('nonato-conhecimento-tecnicos', next)
  }

  const skillLabel = (field: SkillField) => {
    if (field === 'mecanico') return safeT.conhecimentoMecanico ?? 'Mecânico'
    if (field === 'eletrico') return safeT.conhecimentoEletrico ?? 'Elétrico'
    if (field === 'software') return safeT.conhecimentoSoftware ?? 'Software'
    return safeT.conhecimentoProgramacao ?? 'Programação'
  }

  const descricaoValue = (ent: ConhecimentoTecnicoEntry, field: CampoDescricao) => {
    if (field === 'mecanico') return ent.descricaoMecanico ?? ''
    if (field === 'eletrico') return ent.descricaoEletrico ?? ''
    if (field === 'software') return ent.descricaoSoftware ?? ''
    return ent.descricaoProgramacao ?? ''
  }

  return (
    <div className="ct-pro ns-ui-v2">
      <div className="ct-pro__ambient" aria-hidden>
        <span className="ct-pro__orb ct-pro__orb--a" />
        <span className="ct-pro__orb ct-pro__orb--b" />
        <span className="ct-pro__orb ct-pro__orb--c" />
        <span className="ct-pro__gridlines" />
      </div>

      <div className="ct-pro__shell">
        <header className="ct-pro__masthead">
          <div className="ct-pro__masthead-left">
            <div className="ct-pro__mark" aria-hidden>
              CT
            </div>
            <div>
              <p className="ct-pro__eyebrow">{safeT.conhecimentoTecnicosEyebrow || 'Centro de competências'}</p>
              <h1 className="ct-pro__title">
                {safeT.informacoesConhecimentoTecnicosTitle || 'CONHECIMENTO DOS TÉCNICOS'}
              </h1>
            </div>
          </div>
          <div className="ct-pro__masthead-actions">
            <LogoComponent size="small" />
            <button
              type="button"
              className="ct-pro__icon-btn"
              onClick={() => closeTab(activeTabId || '')}
              title={safeT.voltar || 'Voltar'}
              aria-label={safeT.voltar || 'Voltar'}
            >
              ↶
            </button>
            <button
              type="button"
              className="ct-pro__icon-btn ct-pro__icon-btn--accent"
              onClick={voltarPaginaInicial}
              title={safeT.paginaInicial || 'Página Inicial'}
              aria-label={safeT.paginaInicial || 'Página Inicial'}
            >
              🏠
            </button>
          </div>
        </header>

        <div className="ct-pro__stats-row">
          <div className="ct-pro__stat">
            <span>{safeT.conhecimentoTecnicosKpiTecnicos || 'Técnicos'}</span>
            <strong>{tecnicos.length}</strong>
          </div>
          <div className="ct-pro__stat">
            <span>{safeT.conhecimentoTecnicosKpiRegistos || 'Registos'}</span>
            <strong>{conhecimentoTecnicos.length}</strong>
          </div>
          <div className="ct-pro__stat">
            <span>{safeT.conhecimentoTecnicosKpiAreas || 'Pilares'}</span>
            <strong>4</strong>
          </div>
          <p className="ct-pro__lead">
            {safeT.informacoesConhecimentoTecnicosSelecioneTecnico ||
              'Escolha o técnico na coluna esquerda. Defina níveis por equipamento com toques rápidos — sem listas escondidas.'}
          </p>
        </div>

        {tecnicos.length === 0 ? (
          <div className="ct-pro__empty-hero">
            <div className="ct-pro__empty-icon" aria-hidden>
              ◎
            </div>
            <h2>{safeT.conhecimentoTecnicosEmptyTitle || 'Sem técnicos no sistema'}</h2>
            <p>
              {safeT.informacoesConhecimentoSemTecnicos ||
                'Não há técnicos cadastrados. Adicione técnicos em Cadastro de Técnicos (Gestão Técnica).'}
            </p>
          </div>
        ) : (
          <div className="ct-pro__workspace">
            <aside className="ct-pro__rail" aria-label={safeT.conhecimentoTecnicosRailLabel || 'Lista de técnicos'}>
              <div className="ct-pro__rail-head">
                <span className="ct-pro__rail-title">{safeT.conhecimentoTecnicosRailTitle || 'Equipa técnica'}</span>
                <span className="ct-pro__rail-count">{tecnicosFiltrados.length}</span>
              </div>
              <label className="ct-pro__search-wrap">
                <span className="ct-pro__search-icon" aria-hidden>
                  ⌕
                </span>
                <input
                  type="search"
                  className="ct-pro__search"
                  value={buscaTecnico}
                  onChange={(e) => setBuscaTecnico(e.target.value)}
                  placeholder={safeT.conhecimentoTecnicosBuscaPlaceholder || 'Filtrar técnico…'}
                  autoComplete="off"
                />
              </label>
              <div className="ct-pro__rail-list">
                {tecnicosFiltrados.map((tecnico) => {
                  const nReg = conhecimentoTecnicos.filter((c) => c.tecnicoId === tecnico.id).length
                  const isActive = tecnicoConhecimentoSelecionado === tecnico.id
                  return (
                    <button
                      key={tecnico.id}
                      type="button"
                      className={`ct-pro__rail-item${isActive ? ' is-active' : ''}`}
                      onClick={() => setTecnicoConhecimentoSelecionado(tecnico.id)}
                    >
                      <div className="ct-pro__rail-avatar">
                        {tecnico.photo ? (
                          <img src={tecnico.photo} alt="" />
                        ) : (
                          <span aria-hidden>👤</span>
                        )}
                      </div>
                      <div className="ct-pro__rail-body">
                        <span className="ct-pro__rail-name">{tecnico.name}</span>
                        <span className={`ct-pro__badge ${tecnicoTypeClass(tecnico)}`}>
                          {tecnicoTypeLabel(tecnico, safeT)}
                        </span>
                      </div>
                      <span className="ct-pro__rail-meta">{nReg}</span>
                    </button>
                  )
                })}
              </div>
            </aside>

            <main className="ct-pro__stage">
              {!tecnicoSelecionado ? (
                <div className="ct-pro__pick-hint">
                  <div className="ct-pro__pick-hint-icon" aria-hidden>
                    ←
                  </div>
                  <h2>{safeT.conhecimentoTecnicosPickTitle || 'Selecione um técnico'}</h2>
                  <p>
                    {safeT.conhecimentoTecnicosPickDesc ||
                      'A matriz de competências aparece aqui com cartões por equipamento e níveis visuais.'}
                  </p>
                </div>
              ) : (
                <>
                  <div
                    className="ct-pro__profile"
                    style={
                      tecnicoSelecionado.photo
                        ? ({ ['--ct-pro-photo' as string]: `url(${tecnicoSelecionado.photo})` } as React.CSSProperties)
                        : undefined
                    }
                  >
                    <div className="ct-pro__profile-main">
                      <div className="ct-pro__profile-avatar">
                        {tecnicoSelecionado.photo ? (
                          <img src={tecnicoSelecionado.photo} alt="" />
                        ) : (
                          <span aria-hidden>👤</span>
                        )}
                      </div>
                      <div>
                        <p className="ct-pro__profile-eyebrow">
                          {safeT.informacoesConhecimentoPorEquipamento || 'Matriz de competências'}
                        </p>
                        <h2 className="ct-pro__profile-name">{tecnicoSelecionado.name}</h2>
                        <span className={`ct-pro__badge ct-pro__badge--lg ${tecnicoTypeClass(tecnicoSelecionado)}`}>
                          {tecnicoTypeLabel(tecnicoSelecionado, safeT)}
                        </span>
                      </div>
                    </div>
                    <div className="ct-pro__profile-stats">
                      <div className="ct-pro__profile-chip">
                        <strong>{stats.equipamentos}</strong>
                        <span>{safeT.conhecimentoTecnicosChipEquip || 'Equipamentos'}</span>
                      </div>
                      <div className="ct-pro__profile-chip">
                        <strong>{stats.media.toFixed(1)}</strong>
                        <span>{safeT.conhecimentoTecnicosChipMedia || 'Média geral'}</span>
                      </div>
                      <div className="ct-pro__profile-chip ct-pro__profile-chip--gold">
                        <strong>{stats.expert}</strong>
                        <span>{safeT.conhecimentoTecnicosChipExpert || 'Especialista'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="ct-pro__toolbar">
                    <label className="ct-pro__add-wrap" htmlFor="ct-pro-add-equip">
                      <span className="ct-pro__add-label">
                        {safeT.informacoesConhecimentoAdicionarTipo || 'Adicionar equipamento'}
                      </span>
                      <select
                        id="ct-pro-add-equip"
                        className="ct-pro__add-select"
                        defaultValue=""
                        onChange={(e) => {
                          const v = e.target.value
                          if (!v) return
                          const opt = tiposEquipamentoOpcoes.find((o) => o.id === v)
                          if (opt) addConhecimento(opt.id, opt.nome)
                          e.target.value = ''
                        }}
                      >
                        <option value="">+ {safeT.informacoesConhecimentoSelecioneTipo ?? 'Selecionar tipo'}</option>
                        {tiposEquipamentoOpcoes.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.nome}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {tiposEquipamentoOpcoes.length === 0 ? (
                    <p className="ct-pro__hint">
                      {safeT.informacoesConhecimentoSemTipos ||
                        'Nenhum tipo de equipamento cadastrado. Configure em Cadastro de Famílias e Grupos.'}
                    </p>
                  ) : null}

                  {conhecimentosDoTecnico.length === 0 ? (
                    <div className="ct-pro__empty-stage">
                      <div className="ct-pro__empty-stage-icon" aria-hidden>
                        ▣
                      </div>
                      <p>
                        {safeT.informacoesConhecimentoNenhumRegisto ||
                          'Nenhum equipamento neste técnico. Use o selector acima para começar.'}
                      </p>
                    </div>
                  ) : (
                    <div className="ct-pro__cards">
                      {conhecimentosDoTecnico.map((ent) => {
                        const camposDesc = SKILL_META.filter((s) => ent[s.field] > 0)
                        return (
                          <article key={ent.id} className="ct-pro__equip-card">
                            <header className="ct-pro__equip-head">
                              <div>
                                <p className="ct-pro__equip-kicker">
                                  {safeT.informacoesConhecimentoTipoEquipamento ?? 'Equipamento'}
                                </p>
                                <h3 className="ct-pro__equip-title">{ent.equipamentoTipoNome}</h3>
                              </div>
                              <button
                                type="button"
                                className="ct-pro__equip-remove"
                                onClick={() => removeConhecimento(ent.id)}
                                title={safeT.delete || 'Eliminar'}
                                aria-label={safeT.delete || 'Eliminar'}
                              >
                                ✕
                              </button>
                            </header>
                            <div className="ct-pro__matrix">
                              {SKILL_META.map((s) => (
                                <SkillPillar
                                  key={s.field}
                                  label={skillLabel(s.field)}
                                  icon={s.icon}
                                  tone={s.tone}
                                  value={ent[s.field]}
                                  nivelOpcoes={nivelOpcoes}
                                  onChange={(v) => updateConhecimento(ent.id, s.field, v)}
                                />
                              ))}
                            </div>
                            {camposDesc.length > 0 ? (
                              <div className="ct-pro__notes">
                                {camposDesc.map((s) => (
                                  <div key={s.field} className="ct-pro__note">
                                    <label className="ct-pro__note-label">
                                      {safeT.conhecimentoDescricaoDetalhada ?? 'Notas'} — {skillLabel(s.field)}
                                    </label>
                                    <AssistTextarea
                                      value={descricaoValue(ent, s.field)}
                                      onValueChange={(v) => updateConhecimentoDescricaoCampo(ent.id, s.field, v)}
                                      placeholder={
                                        safeT.conhecimentoDescricaoPlaceholder ??
                                        'Detalhe experiência, certificações, limitações…'
                                      }
                                      rows={2}
                                      style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        background: 'rgba(2, 6, 23, 0.55)',
                                        color: '#f1f5f9',
                                        border: '1px solid rgba(148, 163, 184, 0.2)',
                                        borderRadius: '12px',
                                        fontSize: '13px',
                                        resize: 'vertical',
                                        minHeight: '64px',
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </article>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  )
}
