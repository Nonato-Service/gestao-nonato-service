'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import '../papel-timbrado/papel-timbrado.css'

const PAPEL_STORAGE_KEY = 'nonato-papel-timbrado-v1'
const FALLBACK_LOGO = '/brand/nonato-letterhead-logo.svg'

type PapelTimbradoConfig = {
  nomeEmpresa: string
  cidade: string
  freguesia: string
  rua: string
  cep: string
  telefone: string
  logoUrl: string
}

const PAPEL_DEFAULTS: PapelTimbradoConfig = {
  nomeEmpresa: 'NONATO SERVICE',
  cidade: 'Viana do Castelo',
  freguesia: 'Vila de Punhe',
  rua: 'Rua das Mimosas, 303',
  cep: '4905-642',
  telefone: '+351-91111-5479',
  logoUrl: '/brand/nonato-logo-papel-timbrado.png',
}

function loadPapelTimbradoConfig(): PapelTimbradoConfig {
  if (typeof window === 'undefined') return { ...PAPEL_DEFAULTS }
  try {
    const raw = localStorage.getItem(PAPEL_STORAGE_KEY)
    if (!raw) return { ...PAPEL_DEFAULTS }
    const j = JSON.parse(raw) as Partial<PapelTimbradoConfig>
    return {
      nomeEmpresa: typeof j.nomeEmpresa === 'string' && j.nomeEmpresa.trim() ? j.nomeEmpresa.trim() : PAPEL_DEFAULTS.nomeEmpresa,
      cidade: typeof j.cidade === 'string' && j.cidade.trim() ? j.cidade.trim() : PAPEL_DEFAULTS.cidade,
      freguesia: typeof j.freguesia === 'string' && j.freguesia.trim() ? j.freguesia.trim() : PAPEL_DEFAULTS.freguesia,
      rua: typeof j.rua === 'string' && j.rua.trim() ? j.rua.trim() : PAPEL_DEFAULTS.rua,
      cep: typeof j.cep === 'string' && j.cep.trim() ? j.cep.trim() : PAPEL_DEFAULTS.cep,
      telefone: typeof j.telefone === 'string' && j.telefone.trim() ? j.telefone.trim() : PAPEL_DEFAULTS.telefone,
      logoUrl: typeof j.logoUrl === 'string' && j.logoUrl.trim() ? j.logoUrl.trim() : PAPEL_DEFAULTS.logoUrl,
    }
  } catch {
    return { ...PAPEL_DEFAULTS }
  }
}

export type ServicoOrcamentoLinha = {
  id: string
  cod?: string
  nome: string
  descricao?: string
  valor: number
  tipoCobranca: 'unidade' | 'km' | 'hora' | 'valor-fixo' | 'diarias' | 'extras'
  categoria: 'servico' | 'despesa'
}

export type ClienteOrcamentoLite = {
  id: string
  nomeEmpresa: string
  morada?: string
  localidade?: string
  codigoPostal?: string
  conselho?: string
  pais?: string
  telefones?: string
  email?: string
}

type LinhaOrcamento = {
  rowId: string
  servicoId: string
  quantidadeStr: string
}

const TEXTO_CLAUSULAS_PADRAO_PT = `Orçamento relativo à prestação de serviço técnico, com base nos itens e valores indicados neste documento e nos serviços cadastrados no sistema.

As despesas de estadia (hotel), alimentação e passagens aéreas ou de transporte, quando necessárias à execução do serviço e previamente acordadas, correm por conta do cliente.

Despesas pessoais ou extra-profissionais, bem como despesas não diretamente relacionadas com o trabalho contratado, não devem constar nem ser apresentadas neste documento.`

function parseDecimalInput(raw: string): number {
  const s = String(raw ?? '').trim().replace(/\s/g, '').replace(',', '.')
  if (!s) return 0
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

function formatMoneyEUR(n: number): string {
  try {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n)
  } catch {
    return `${n.toFixed(2)} €`
  }
}

function labelTipoCobranca(
  tipo: ServicoOrcamentoLinha['tipoCobranca'],
  t: Record<string, string | undefined>
): string {
  const m: Record<ServicoOrcamentoLinha['tipoCobranca'], string | undefined> = {
    hora: t.tipoCobrancaHora,
    km: t.tipoCobrancaKm,
    unidade: t.tipoCobrancaUnidade,
    'valor-fixo': t.tipoCobrancaValorFixo,
    diarias: t.tipoCobrancaDiarias,
    extras: t.tipoCobrancaExtras,
  }
  return m[tipo] || tipo
}

function unidadeQuantidade(tipo: ServicoOrcamentoLinha['tipoCobranca'], t: Record<string, string | undefined>): string {
  if (tipo === 'hora') return t.orcamentoServicoTecnicoUnidadeHora || 'h'
  if (tipo === 'km') return t.orcamentoServicoTecnicoUnidadeKm || 'km'
  if (tipo === 'diarias') return t.orcamentoServicoTecnicoUnidadeDiaria || 'dia(s)'
  if (tipo === 'unidade') return t.orcamentoServicoTecnicoUnidadeUnidade || 'un.'
  if (tipo === 'valor-fixo') return t.orcamentoServicoTecnicoUnidadeFixo || 'forfait'
  return t.orcamentoServicoTecnicoUnidadeExtra || 'qtd'
}

function newRowId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

type Props = {
  clientes: ClienteOrcamentoLite[]
  servicos: ServicoOrcamentoLinha[]
  safeT: Record<string, string | undefined>
  openTab: (type: string, title: string) => void
  getTabTitle: (type: string) => string
}

export function OrcamentoServicoTecnicoContent({ clientes, servicos, safeT, openTab, getTabTitle }: Props) {
  const t = safeT
  const [cfg, setCfg] = useState<PapelTimbradoConfig>(() => loadPapelTimbradoConfig())
  const [logoBroken, setLogoBroken] = useState(false)

  const [clienteId, setClienteId] = useState('')
  const [clienteManual, setClienteManual] = useState('')
  const [refDoc, setRefDoc] = useState('')
  const [localServico, setLocalServico] = useState('')
  const [dataDoc, setDataDoc] = useState(() => new Date().toISOString().slice(0, 10))
  const [validade, setValidade] = useState('')
  const [intro, setIntro] = useState(
    () =>
      t.orcamentoServicoTecnicoIntroDefault ||
      'Documento sem valor fiscal. Os valores apresentados constituem proposta comercial para serviço técnico.'
  )
  const [clausulas, setClausulas] = useState(() => t.orcamentoServicoTecnicoClausulasDefault || TEXTO_CLAUSULAS_PADRAO_PT)
  const [linhas, setLinhas] = useState<LinhaOrcamento[]>(() => [{ rowId: newRowId(), servicoId: '', quantidadeStr: '1' }])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === PAPEL_STORAGE_KEY || e.key === null) {
        setCfg(loadPapelTimbradoConfig())
        setLogoBroken(false)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const refreshPapel = useCallback(() => {
    setCfg(loadPapelTimbradoConfig())
    setLogoBroken(false)
  }, [])

  const servicosLista = useMemo(() => {
    return [...servicos].filter((s) => s && typeof s.nome === 'string' && s.nome.trim() !== '')
  }, [servicos])

  const clienteSelecionado = useMemo(() => clientes.find((c) => c.id === clienteId), [clientes, clienteId])
  const nomeClienteDoc = (clienteSelecionado?.nomeEmpresa || clienteManual || '').trim()

  const linhasResolvidas = useMemo(() => {
    return linhas.map((L) => {
      const svc = servicosLista.find((s) => s.id === L.servicoId)
      const q = parseDecimalInput(L.quantidadeStr)
      const unit = svc && Number.isFinite(svc.valor) ? svc.valor : 0
      const sub = unit * q
      return { L, svc, q, sub }
    })
  }, [linhas, servicosLista])

  const totalGeral = useMemo(() => linhasResolvidas.reduce((s, r) => s + r.sub, 0), [linhasResolvidas])

  const logoSrc = logoBroken ? FALLBACK_LOGO : cfg.logoUrl || FALLBACK_LOGO

  const imprimir = useCallback(() => {
    setCfg(loadPapelTimbradoConfig())
    setLogoBroken(false)
    requestAnimationFrame(() => window.print())
  }, [])

  const abrirCadastroServicos = useCallback(() => {
    openTab('cadastro-servicos', getTabTitle('cadastro-servicos'))
  }, [openTab, getTabTitle])

  const abrirPapelTimbrado = useCallback(() => {
    window.open('/papel-timbrado', '_blank', 'noopener,noreferrer')
  }, [])

  const addLinha = useCallback(() => {
    setLinhas((prev) => [...prev, { rowId: newRowId(), servicoId: '', quantidadeStr: '1' }])
  }, [])

  const removeLinha = useCallback((rowId: string) => {
    setLinhas((prev) => (prev.length <= 1 ? prev : prev.filter((x) => x.rowId !== rowId)))
  }, [])

  const updateLinha = useCallback((rowId: string, patch: Partial<LinhaOrcamento>) => {
    setLinhas((prev) => prev.map((x) => (x.rowId === rowId ? { ...x, ...patch } : x)))
  }, [])

  const tx = t as Record<string, string>

  return (
    <div className="papel-timbrado-root">
      <div className="papel-timbrado-toolbar">
        <button type="button" className="secondary" onClick={refreshPapel}>
          {t.orcamentoServicoTecnicoAtualizarPapel || 'Atualizar papel timbrado'}
        </button>
        <button type="button" className="secondary" onClick={abrirPapelTimbrado}>
          {t.orcamentoServicoTecnicoConfigPapel || 'Configurar papel timbrado'}
        </button>
        <button type="button" className="secondary" onClick={abrirCadastroServicos}>
          {t.orcamentoServicoTecnicoAbrirCadastroServicos || 'Abrir cadastro de serviços / valores'}
        </button>
        <button type="button" className="primary" onClick={imprimir}>
          {tx.papelTimbradoImprimir || t.orcamentoServicoTecnicoImprimir || 'Imprimir / PDF'}
        </button>
      </div>

      <div className="papel-timbrado-layout">
        <div className="papel-timbrado-form">
          <h1>{t.orcamentoServicoTecnicoTituloForm || t.orcamentoServicoTecnicoTitle || 'Orçamento de serviço técnico'}</h1>
          <p className="lead">{t.orcamentoServicoTecnicoSubtitle || ''}</p>

          <div className="papel-timbrado-field">
            <label>{t.orcamentoServicoTecnicoCliente || 'Cliente'}</label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', borderRadius: 10, padding: '10px 12px', background: '#0b1220', color: '#f1f5f9', border: '1px solid rgba(148,163,184,0.28)' }}
            >
              <option value="">{t.orcamentoServicoTecnicoClientePlaceholder || 'Selecione um cliente cadastrado (opcional)…'}</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nomeEmpresa}
                </option>
              ))}
            </select>
          </div>
          <div className="papel-timbrado-field">
            <label>{t.orcamentoServicoTecnicoClienteManual || 'Nome do cliente (se não estiver na lista)'}</label>
            <input value={clienteManual} onChange={(e) => setClienteManual(e.target.value)} placeholder={t.orcamentoServicoTecnicoClienteManualPh || ''} />
          </div>
          <div className="papel-timbrado-field">
            <label>{t.orcamentoServicoTecnicoRef || 'Referência / proposta n.º'}</label>
            <input value={refDoc} onChange={(e) => setRefDoc(e.target.value)} placeholder="ex.: OST-2026-0042" />
          </div>
          <div className="papel-timbrado-field">
            <label>{t.orcamentoServicoTecnicoLocal || 'Local de execução (opcional)'}</label>
            <input value={localServico} onChange={(e) => setLocalServico(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="papel-timbrado-field" style={{ marginBottom: 0 }}>
              <label>{t.orcamentoServicoTecnicoData || 'Data'}</label>
              <input type="date" value={dataDoc} onChange={(e) => setDataDoc(e.target.value)} />
            </div>
            <div className="papel-timbrado-field" style={{ marginBottom: 0 }}>
              <label>{t.orcamentoServicoTecnicoValidade || 'Validade (texto livre)'}</label>
              <input value={validade} onChange={(e) => setValidade(e.target.value)} placeholder={t.orcamentoServicoTecnicoValidadePh || 'ex.: 30 dias'} />
            </div>
          </div>

          <div className="papel-timbrado-field" style={{ marginTop: 14 }}>
            <label>{t.orcamentoServicoTecnicoIntro || 'Texto de abertura'}</label>
            <textarea value={intro} onChange={(e) => setIntro(e.target.value)} rows={3} />
          </div>

          <div className="papel-timbrado-field">
            <label>{t.orcamentoServicoTecnicoItens || 'Itens (cadastro de serviços)'}</label>
            {servicosLista.length === 0 ? (
              <p className="papel-timbrado-hint" style={{ color: '#fbbf24' }}>
                {t.orcamentoServicoTecnicoSemServicos || 'Não há serviços cadastrados. Abra o cadastro de serviços e adicione horas, viagens, quilómetros, etc.'}
              </p>
            ) : null}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {linhas.map(({ rowId, servicoId, quantidadeStr }) => {
                const svc = servicosLista.find((s) => s.id === servicoId)
                return (
                  <div
                    key={rowId}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0,1.4fr) minmax(72px,0.5fr) auto',
                      gap: 8,
                      alignItems: 'end',
                      padding: 10,
                      borderRadius: 10,
                      border: '1px solid rgba(148,163,184,0.22)',
                      background: 'rgba(15,23,42,0.5)',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {t.orcamentoServicoTecnicoServico || 'Serviço'}
                      </span>
                      <select
                        value={servicoId}
                        onChange={(e) => updateLinha(rowId, { servicoId: e.target.value })}
                        style={{
                          marginTop: 6,
                          width: '100%',
                          boxSizing: 'border-box',
                          borderRadius: 8,
                          padding: '8px 10px',
                          background: '#0b1220',
                          color: '#f1f5f9',
                          border: '1px solid rgba(148,163,184,0.28)',
                        }}
                      >
                        <option value="">{t.orcamentoServicoTecnicoEscolherServico || 'Escolher…'}</option>
                        {servicosLista.map((s) => (
                          <option key={s.id} value={s.id}>
                            {(s.cod ? `${s.cod} — ` : '') + s.nome} ({labelTipoCobranca(s.tipoCobranca, t)} — {formatMoneyEUR(Number(s.valor) || 0)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {(t.orcamentoServicoTecnicoQuantidade || 'Quantidade') + (svc ? ` (${unidadeQuantidade(svc.tipoCobranca, t)})` : '')}
                      </span>
                      <input
                        style={{ marginTop: 6 }}
                        value={quantidadeStr}
                        onChange={(e) => updateLinha(rowId, { quantidadeStr: e.target.value })}
                        inputMode="decimal"
                      />
                    </div>
                    <button type="button" className="secondary" onClick={() => removeLinha(rowId)} style={{ padding: '8px 10px' }} aria-label={t.orcamentoServicoTecnicoRemover || 'Remover'}>
                      ×
                    </button>
                  </div>
                )
              })}
            </div>
            <button type="button" className="secondary" style={{ marginTop: 10 }} onClick={addLinha}>
              {t.orcamentoServicoTecnicoAdicionarLinha || '+ Adicionar linha'}
            </button>
          </div>

          <div className="papel-timbrado-field">
            <label>{t.orcamentoServicoTecnicoClausulas || 'Condições e exclusões (editável)'}</label>
            <textarea value={clausulas} onChange={(e) => setClausulas(e.target.value)} rows={8} />
          </div>

          <p className="papel-timbrado-hint">{tx.papelTimbradoDicaImpressao || ''}</p>
        </div>

        <div className="papel-timbrado-sheet-wrap">
          <div className="papel-timbrado-sheet" id="orcamento-servico-tecnico-print-area">
            <div className="papel-timbrado-sheet-inner">
              <header className="papel-timbrado-header">
                <img className="papel-timbrado-logo" src={logoSrc} alt="" onError={() => setLogoBroken(true)} />
                <div className="papel-timbrado-header-text">
                  <strong>{cfg.nomeEmpresa}</strong>
                </div>
              </header>

              <section
                className="papel-timbrado-body-zone"
                style={{
                  minHeight: 'auto',
                  borderStyle: 'solid',
                  borderColor: '#e2e8f0',
                  background: '#fff',
                  color: '#0f172a',
                  padding: '16px 14px',
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: 14 }}>
                  <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em', color: '#64748b', textTransform: 'uppercase' }}>
                    {t.orcamentoServicoTecnicoDocTitulo || 'Orçamento de serviço técnico'}
                  </div>
                  {refDoc.trim() ? (
                    <div style={{ marginTop: 4, fontSize: 11, fontWeight: 700 }}>{refDoc.trim()}</div>
                  ) : null}
                </div>

                <div style={{ fontSize: 10.5, lineHeight: 1.45, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <span>
                      <strong>{t.orcamentoServicoTecnicoData || 'Data'}:</strong> {dataDoc}
                    </span>
                    {validade.trim() ? (
                      <span>
                        <strong>{t.orcamentoServicoTecnicoValidade || 'Validade'}:</strong> {validade.trim()}
                      </span>
                    ) : null}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <strong>{t.orcamentoServicoTecnicoCliente || 'Cliente'}:</strong> {nomeClienteDoc || '—'}
                  </div>
                  {localServico.trim() ? (
                    <div style={{ marginTop: 4 }}>
                      <strong>{t.orcamentoServicoTecnicoLocal || 'Local'}:</strong> {localServico.trim()}
                    </div>
                  ) : null}
                </div>

                {intro.trim() ? (
                  <p style={{ fontSize: 10.2, lineHeight: 1.5, margin: '0 0 12px', whiteSpace: 'pre-wrap' }}>{intro.trim()}</p>
                ) : null}

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, marginBottom: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #0f172a' }}>
                      <th style={{ textAlign: 'left', padding: '6px 4px' }}>{t.orcamentoServicoTecnicoColDescricao || 'Descrição'}</th>
                      <th style={{ textAlign: 'center', padding: '6px 4px', width: 72 }}>{t.orcamentoServicoTecnicoColTipo || 'Tipo'}</th>
                      <th style={{ textAlign: 'right', padding: '6px 4px', width: 56 }}>{t.orcamentoServicoTecnicoColQtd || 'Qtd'}</th>
                      <th style={{ textAlign: 'right', padding: '6px 4px', width: 72 }}>{t.orcamentoServicoTecnicoColPreco || 'Preço'}</th>
                      <th style={{ textAlign: 'right', padding: '6px 4px', width: 80 }}>{t.orcamentoServicoTecnicoColTotal || 'Total'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhasResolvidas.map(({ L, svc, q, sub }) => (
                      <tr key={L.rowId} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '6px 4px', verticalAlign: 'top' }}>
                          {svc ? (
                            <>
                              <div style={{ fontWeight: 700 }}>{svc.nome}</div>
                              {svc.descricao?.trim() ? <div style={{ color: '#475569', marginTop: 2 }}>{svc.descricao.trim()}</div> : null}
                            </>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '6px 4px', textAlign: 'center', verticalAlign: 'top' }}>
                          {svc ? labelTipoCobranca(svc.tipoCobranca, t) : '—'}
                        </td>
                        <td style={{ padding: '6px 4px', textAlign: 'right', verticalAlign: 'top' }}>{svc ? `${String(L.quantidadeStr).trim()} ${unidadeQuantidade(svc.tipoCobranca, t)}` : '—'}</td>
                        <td style={{ padding: '6px 4px', textAlign: 'right', verticalAlign: 'top' }}>{svc ? formatMoneyEUR(svc.valor) : '—'}</td>
                        <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 700, verticalAlign: 'top' }}>{svc ? formatMoneyEUR(sub) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ textAlign: 'right', fontSize: 11.5, fontWeight: 800, marginBottom: 14 }}>
                  {t.orcamentoServicoTecnicoTotalGeral || 'Total'}: {formatMoneyEUR(totalGeral)}
                </div>

                {clausulas.trim() ? (
                  <div style={{ fontSize: 9.5, lineHeight: 1.48, color: '#334155', whiteSpace: 'pre-wrap', borderTop: '1px solid #cbd5e1', paddingTop: 10 }}>
                    {clausulas.trim()}
                  </div>
                ) : null}
              </section>

              <footer className="papel-timbrado-footer" aria-label="Contactos">
                <div className="papel-timbrado-footer-row">
                  <span className="papel-timbrado-footer-item">
                    <span className="papel-timbrado-footer-label">{tx.papelTimbradoLabelCidade}</span>
                    <span className="papel-timbrado-footer-val">{cfg.cidade}</span>
                  </span>
                  <span className="papel-timbrado-footer-sep" aria-hidden="true">
                    |
                  </span>
                  <span className="papel-timbrado-footer-item">
                    <span className="papel-timbrado-footer-label">{tx.papelTimbradoLabelFreguesia}</span>
                    <span className="papel-timbrado-footer-val">{cfg.freguesia}</span>
                  </span>
                  <span className="papel-timbrado-footer-sep" aria-hidden="true">
                    |
                  </span>
                  <span className="papel-timbrado-footer-item">
                    <span className="papel-timbrado-footer-label">{tx.papelTimbradoLabelRua}</span>
                    <span className="papel-timbrado-footer-val">{cfg.rua}</span>
                  </span>
                  <span className="papel-timbrado-footer-sep" aria-hidden="true">
                    |
                  </span>
                  <span className="papel-timbrado-footer-item">
                    <span className="papel-timbrado-footer-label">{tx.papelTimbradoLabelCep}</span>
                    <span className="papel-timbrado-footer-val">{cfg.cep}</span>
                  </span>
                  <span className="papel-timbrado-footer-sep" aria-hidden="true">
                    |
                  </span>
                  <span className="papel-timbrado-footer-item">
                    <span className="papel-timbrado-footer-label">{tx.papelTimbradoLabelFone}</span>
                    <span className="papel-timbrado-footer-val">{cfg.telefone}</span>
                  </span>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
