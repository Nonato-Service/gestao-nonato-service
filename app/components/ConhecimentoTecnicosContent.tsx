'use client'

import React, { useMemo } from 'react'
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

type CampoDescricao = 'mecanico' | 'eletrico' | 'software' | 'programacao'

function tecnicoTypeLabel(tecnico: TecnicoResumo, safeT: Record<string, string | undefined>): string {
  if (tecnico.type === 'internal') return safeT.internal ?? 'Interno'
  if (tecnico.type === 'external') return safeT.external ?? 'Externo'
  return safeT.armazem ?? 'Armazém'
}

function tecnicoTypeClass(tecnico: TecnicoResumo): string {
  if (tecnico.type === 'internal') return 'conhecimento-tecnicos__badge--internal'
  if (tecnico.type === 'external') return 'conhecimento-tecnicos__badge--external'
  return 'conhecimento-tecnicos__badge--warehouse'
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

  const conhecimentosDoTecnico = tecnicoConhecimentoSelecionado
    ? conhecimentoTecnicos.filter((c) => c.tecnicoId === tecnicoConhecimentoSelecionado)
    : []

  const tecnicoSelecionado = tecnicos.find((t) => t.id === tecnicoConhecimentoSelecionado)

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

  const updateConhecimento = (
    id: string,
    field: 'mecanico' | 'eletrico' | 'software' | 'programacao',
    value: number
  ) => {
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

  return (
    <div className="conhecimento-tecnicos ns-ui-v2">
      <header className="conhecimento-tecnicos__hero">
        <div className="conhecimento-tecnicos__hero-glow" aria-hidden />
        <div className="conhecimento-tecnicos__hero-top">
          <div className="conhecimento-tecnicos__hero-brand">
            <div className="conhecimento-tecnicos__hero-icon" aria-hidden>
              CT
            </div>
            <div className="conhecimento-tecnicos__hero-text">
              <p className="conhecimento-tecnicos__eyebrow">
                {safeT.conhecimentoTecnicosEyebrow || 'Competências técnicas'}
              </p>
              <h1 className="conhecimento-tecnicos__title">
                {safeT.informacoesConhecimentoTecnicosTitle || 'INFORMAÇÕES DE CONHECIMENTO DOS TÉCNICOS'}
              </h1>
              <p className="conhecimento-tecnicos__lead">
                {safeT.informacoesConhecimentoTecnicosDesc ||
                  'Área para registar e consultar informações de conhecimento dos técnicos.'}
              </p>
            </div>
          </div>
          <div className="conhecimento-tecnicos__hero-actions">
            <LogoComponent size="small" />
            <button
              type="button"
              className="conhecimento-tecnicos__nav-btn"
              onClick={() => closeTab(activeTabId || '')}
              title={safeT.voltar || 'Voltar'}
              aria-label={safeT.voltar || 'Voltar'}
            >
              ↶
            </button>
            <button
              type="button"
              className="conhecimento-tecnicos__nav-btn conhecimento-tecnicos__nav-btn--home"
              onClick={voltarPaginaInicial}
              title={safeT.paginaInicial || 'Página Inicial'}
              aria-label={safeT.paginaInicial || 'Página Inicial'}
            >
              🏠
            </button>
          </div>
        </div>
        <div className="conhecimento-tecnicos__kpis">
          <div className="conhecimento-tecnicos__kpi">
            <span>{safeT.conhecimentoTecnicosKpiTecnicos || 'Técnicos'}</span>
            <strong>{tecnicos.length}</strong>
          </div>
          <div className="conhecimento-tecnicos__kpi">
            <span>{safeT.conhecimentoTecnicosKpiRegistos || 'Registos'}</span>
            <strong>{conhecimentoTecnicos.length}</strong>
          </div>
          <div className="conhecimento-tecnicos__kpi">
            <span>{safeT.conhecimentoTecnicosKpiAreas || 'Áreas avaliadas'}</span>
            <strong>4</strong>
          </div>
        </div>
      </header>

      <p className="conhecimento-tecnicos__intro">
        {safeT.informacoesConhecimentoTecnicosSelecioneTecnico ||
          'Selecione um técnico abaixo para gerir os tipos de equipamento e os conhecimentos (mecânico, elétrico, software e programação) por equipamento.'}
      </p>

      {tecnicos.length === 0 ? (
        <div className="conhecimento-tecnicos__empty">
          <p>
            {safeT.informacoesConhecimentoSemTecnicos ||
              'Não há técnicos cadastrados. Adicione técnicos em Cadastro de Técnicos (Gestão Técnica).'}
          </p>
        </div>
      ) : (
        <div className="conhecimento-tecnicos__grid">
          {tecnicos.map((tecnico) => (
            <button
              key={tecnico.id}
              type="button"
              className={`conhecimento-tecnicos__card${tecnicoConhecimentoSelecionado === tecnico.id ? ' is-active' : ''}`}
              onClick={() => setTecnicoConhecimentoSelecionado(tecnico.id)}
            >
              <div className="conhecimento-tecnicos__avatar">
                {tecnico.photo ? (
                  <img src={tecnico.photo} alt="" className="conhecimento-tecnicos__avatar-img" />
                ) : (
                  <span className="conhecimento-tecnicos__avatar-fallback" aria-hidden>
                    👤
                  </span>
                )}
              </div>
              <div className="conhecimento-tecnicos__card-name">{tecnico.name}</div>
              <span className={`conhecimento-tecnicos__badge ${tecnicoTypeClass(tecnico)}`}>
                {tecnicoTypeLabel(tecnico, safeT)}
              </span>
            </button>
          ))}
        </div>
      )}

      {tecnicoConhecimentoSelecionado && tecnicos.length > 0 ? (
        <section className="conhecimento-tecnicos__panel" aria-labelledby="conhecimento-tecnicos-panel-title">
          <div className="conhecimento-tecnicos__panel-head">
            <div>
              <h2 id="conhecimento-tecnicos-panel-title" className="conhecimento-tecnicos__panel-title">
                {safeT.informacoesConhecimentoPorEquipamento || 'Tipos de equipamento e conhecimentos'}
              </h2>
              {tecnicoSelecionado ? (
                <p className="conhecimento-tecnicos__panel-sub">
                  {tecnicoSelecionado.name}
                </p>
              ) : null}
            </div>
            <div className="conhecimento-tecnicos__add-row">
              <label className="conhecimento-tecnicos__add-label" htmlFor="conhecimento-tecnicos-add-tipo">
                {safeT.informacoesConhecimentoAdicionarTipo || 'Adicionar tipo de equipamento:'}
              </label>
              <select
                id="conhecimento-tecnicos-add-tipo"
                className="conhecimento-tecnicos__select"
                defaultValue=""
                onChange={(e) => {
                  const v = e.target.value
                  if (!v) return
                  const opt = tiposEquipamentoOpcoes.find((o) => o.id === v)
                  if (opt) addConhecimento(opt.id, opt.nome)
                  e.target.value = ''
                }}
              >
                <option value="">
                  — {safeT.informacoesConhecimentoSelecioneTipo ?? 'Selecione'} —
                </option>
                {tiposEquipamentoOpcoes.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {tiposEquipamentoOpcoes.length === 0 ? (
            <p className="conhecimento-tecnicos__hint">
              {safeT.informacoesConhecimentoSemTipos ||
                'Nenhum tipo de equipamento cadastrado. Configure em Cadastro de Famílias e Grupos para os Equipamentos (Gestão Técnica).'}
            </p>
          ) : null}

          {conhecimentosDoTecnico.length === 0 ? (
            <p className="conhecimento-tecnicos__hint">
              {safeT.informacoesConhecimentoNenhumRegisto ||
                'Nenhum tipo de equipamento adicionado para este técnico. Use o campo acima para adicionar.'}
            </p>
          ) : (
            <div className="conhecimento-tecnicos__table-wrap">
              <table className="conhecimento-tecnicos__table">
                <thead>
                  <tr>
                    <th>{safeT.informacoesConhecimentoTipoEquipamento ?? 'Tipo de equipamento'}</th>
                    <th>{safeT.conhecimentoMecanico ?? 'Mecânico'}</th>
                    <th>{safeT.conhecimentoEletrico ?? 'Elétrico'}</th>
                    <th>{safeT.conhecimentoSoftware ?? 'Software'}</th>
                    <th>{safeT.conhecimentoProgramacao ?? 'Programação'}</th>
                    <th className="conhecimento-tecnicos__th-action" aria-label={safeT.delete || 'Eliminar'} />
                  </tr>
                </thead>
                <tbody>
                  {conhecimentosDoTecnico.map((ent) => {
                    const temAlgumNivel =
                      ent.mecanico > 0 || ent.eletrico > 0 || ent.software > 0 || ent.programacao > 0
                    const campos: { key: CampoDescricao; label: string; value: string }[] = []
                    if (ent.mecanico > 0)
                      campos.push({
                        key: 'mecanico',
                        label: safeT.conhecimentoMecanico ?? 'Mecânico',
                        value: ent.descricaoMecanico ?? '',
                      })
                    if (ent.eletrico > 0)
                      campos.push({
                        key: 'eletrico',
                        label: safeT.conhecimentoEletrico ?? 'Elétrico',
                        value: ent.descricaoEletrico ?? '',
                      })
                    if (ent.software > 0)
                      campos.push({
                        key: 'software',
                        label: safeT.conhecimentoSoftware ?? 'Software',
                        value: ent.descricaoSoftware ?? '',
                      })
                    if (ent.programacao > 0)
                      campos.push({
                        key: 'programacao',
                        label: safeT.conhecimentoProgramacao ?? 'Programação',
                        value: ent.descricaoProgramacao ?? '',
                      })

                    return (
                      <React.Fragment key={ent.id}>
                        <tr className="conhecimento-tecnicos__row-main">
                          <td className="conhecimento-tecnicos__cell-equip">{ent.equipamentoTipoNome}</td>
                          {(['mecanico', 'eletrico', 'software', 'programacao'] as const).map((field) => (
                            <td key={field} className="conhecimento-tecnicos__cell-level">
                              <select
                                className="conhecimento-tecnicos__level-select"
                                value={ent[field]}
                                onChange={(e) => updateConhecimento(ent.id, field, Number(e.target.value))}
                              >
                                {nivelOpcoes.map((o) => (
                                  <option key={o.value} value={o.value}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                          ))}
                          <td className="conhecimento-tecnicos__cell-action">
                            <button
                              type="button"
                              className="conhecimento-tecnicos__remove-btn"
                              onClick={() => removeConhecimento(ent.id)}
                              title={safeT.delete || 'Eliminar'}
                              aria-label={safeT.delete || 'Eliminar'}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                        {temAlgumNivel
                          ? campos.map(({ key, label, value }) => (
                              <tr key={`${ent.id}-${key}`} className="conhecimento-tecnicos__row-detail">
                                <td colSpan={6}>
                                  <div className="conhecimento-tecnicos__detail-block">
                                    <label className="conhecimento-tecnicos__detail-label">
                                      {safeT.conhecimentoDescricaoDetalhada ?? 'Descrição detalhada'} — {label}
                                    </label>
                                    <div className="conhecimento-tecnicos__detail-input-wrap">
                                      <AssistTextarea
                                        value={value}
                                        onValueChange={(v) => updateConhecimentoDescricaoCampo(ent.id, key, v)}
                                        placeholder={
                                          safeT.conhecimentoDescricaoPlaceholder ??
                                          'Descreva em detalhe os conhecimentos nesta área...'
                                        }
                                        rows={2}
                                        style={{
                                          width: '100%',
                                          padding: '10px 12px',
                                          backgroundColor: 'rgba(15, 23, 42, 0.45)',
                                          color: '#e2e8f0',
                                          border: '1px solid rgba(148, 163, 184, 0.22)',
                                          borderRadius: '10px',
                                          fontSize: '13px',
                                          resize: 'vertical',
                                          minHeight: '56px',
                                        }}
                                      />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ))
                          : null}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </div>
  )
}
