'use client'

import React, { useMemo, useState } from 'react'

export type ClienteFaturaListItem = {
  id: string
  numeroFatura: string
  dataEmissao?: string
  valorTotal: number
  status: string
  equipamentoId?: string
  equipamentoTexto?: string
  arquivoAnexo?: string
  nomeArquivoOriginal?: string
}

type EquipamentoOpt = {
  id?: string
  modelo?: string
  marca?: string
  numeroSerie?: string
  tipoEquipamento?: string
}

type Props = {
  faturas: ClienteFaturaListItem[]
  equipamentos: EquipamentoOpt[]
  safeT: Record<string, string | undefined>
  language?: string
  onOpenAnexo?: (fatura: ClienteFaturaListItem) => void
  onAssociarEquipamento?: (faturaId: string, equipamentoId: string, equipamentoTexto: string) => void
}

export function rotuloEquipamentoFatura(eq: EquipamentoOpt, index: number): string {
  const parts = [eq.marca, eq.modelo, eq.numeroSerie].filter(Boolean)
  if (parts.length) return parts.join(' · ')
  if (eq.tipoEquipamento) return eq.tipoEquipamento
  return eq.id || `#${index + 1}`
}

function faturaSemEquipamentoUtil(f: ClienteFaturaListItem): boolean {
  return !String(f.equipamentoId || '').trim() && !String(f.equipamentoTexto || '').trim()
}

export function ClienteFaturasSection({
  faturas,
  equipamentos,
  safeT,
  language = 'pt-BR',
  onOpenAnexo,
  onAssociarEquipamento,
}: Props) {
  const tr = (key: string, fb: string) => safeT[key] || fb
  const [selByFat, setSelByFat] = useState<Record<string, string>>({})

  const eqLabelById = useMemo(() => {
    const map = new Map<string, string>()
    equipamentos.forEach((eq, i) => {
      if (eq.id) map.set(String(eq.id), rotuloEquipamentoFatura(eq, i))
    })
    return map
  }, [equipamentos])

  const equipamentosComId = useMemo(
    () => equipamentos.map((eq, i) => ({ eq, i })).filter(({ eq }) => String(eq.id || '').trim()),
    [equipamentos]
  )

  const fmt = (n: number) => {
    try {
      return new Intl.NumberFormat(language === 'en' ? 'en-GB' : 'pt-PT', {
        style: 'currency',
        currency: 'EUR',
      }).format(n || 0)
    } catch {
      return `${(n || 0).toFixed(2)} €`
    }
  }

  const fmtDate = (d?: string) => {
    if (!d) return '—'
    try {
      return new Date(d).toLocaleDateString(language === 'en' ? 'en-GB' : 'pt-PT')
    } catch {
      return d
    }
  }

  const statusLabel = (s: string) => {
    if (s === 'paga') return tr('pagosLabel', 'Paga')
    if (s === 'pendente') return tr('pendentesLabel', 'Pendente')
    if (s === 'vencida') return tr('vencida', 'Vencida')
    if (s === 'cancelada') return tr('cancelado', 'Cancelada')
    return s || '—'
  }

  const temOrfas =
    Boolean(onAssociarEquipamento) &&
    faturas.some(faturaSemEquipamentoUtil) &&
    equipamentosComId.length > 0

  const associar = (faturaId: string) => {
    if (!onAssociarEquipamento) return
    const eqId = String(selByFat[faturaId] || '').trim()
    if (!eqId) return
    const found = equipamentosComId.find(({ eq }) => String(eq.id) === eqId)
    if (!found?.eq.id) return
    onAssociarEquipamento(faturaId, found.eq.id, rotuloEquipamentoFatura(found.eq, found.i))
  }

  return (
    <section className="cliente-detalhe-v2__card">
      <h3 className="cliente-detalhe-v2__section-title cliente-detalhe-v2__section-title--solo">
        🧾 {tr('clienteFaturasTitle', 'Faturas')}
      </h3>
      <p style={{ margin: '0 0 14px', fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>
        {tr('clienteFaturasHint', 'Cada fatura pode estar ligada a um equipamento deste cliente.')}
      </p>
      {temOrfas ? (
        <p style={{ margin: '0 0 14px', fontSize: '12px', color: 'rgba(255, 193, 7, 0.85)' }}>
          {tr(
            'clienteFaturaAssociarHint',
            'Há faturas sem equipamento. Escolha o equipamento e toque em Associar.'
          )}
        </p>
      ) : null}
      {faturas.length === 0 ? (
        <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
          {tr('clienteFaturasVazio', 'Nenhuma fatura registada para este cliente.')}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {faturas.map((f) => {
            const semEq = faturaSemEquipamentoUtil(f)
            const eqTxt =
              f.equipamentoTexto ||
              (f.equipamentoId ? eqLabelById.get(String(f.equipamentoId)) : undefined) ||
              tr('clienteFaturaSemEquipamento', 'Sem equipamento')
            const podeAssociar =
              Boolean(onAssociarEquipamento) && equipamentosComId.length > 0 && semEq
            return (
              <div
                key={f.id}
                style={{
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 200, 83, 0.2)',
                  background: 'rgba(0,0,0,0.28)',
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                  <strong style={{ color: '#fff', fontSize: '14px' }}>
                    {f.numeroFatura || f.id}
                  </strong>
                  <span style={{ fontSize: '12px', color: 'rgba(185,255,208,0.9)' }}>{statusLabel(f.status)}</span>
                </div>
                <div
                  style={{
                    marginTop: '6px',
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.65)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    alignItems: 'center',
                  }}
                >
                  <span>
                    {tr('dataLabel', 'Data')}: {fmtDate(f.dataEmissao)}
                  </span>
                  <span>
                    {tr('totalLabel', 'Total')}: {fmt(f.valorTotal)}
                  </span>
                  <span>🔧 {eqTxt}</span>
                </div>
                {f.arquivoAnexo && onOpenAnexo && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => onOpenAnexo(f)}
                    style={{
                      marginTop: '10px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0, 200, 83, 0.4)',
                      background: 'rgba(0, 200, 83, 0.12)',
                      color: '#00c853',
                    }}
                  >
                    📎 {tr('verAnexoFatura', 'Ver anexo')}
                  </button>
                )}
                {podeAssociar ? (
                  <div
                    style={{
                      marginTop: '10px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      alignItems: 'center',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <select
                      value={selByFat[f.id] || ''}
                      onChange={(e) => setSelByFat((prev) => ({ ...prev, [f.id]: e.target.value }))}
                      aria-label={tr('clienteFaturaEscolherEquipamento', 'Escolher equipamento')}
                      style={{
                        flex: '1 1 180px',
                        minWidth: '160px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid rgba(0, 200, 83, 0.35)',
                        background: '#1a1a1a',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    >
                      <option value="">
                        {tr('clienteFaturaEscolherEquipamento', 'Escolher equipamento…')}
                      </option>
                      {equipamentosComId.map(({ eq, i }) => (
                        <option key={String(eq.id)} value={String(eq.id)}>
                          {rotuloEquipamentoFatura(eq, i)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={!selByFat[f.id]}
                      onClick={() => associar(f.id)}
                      style={{
                        padding: '8px 12px',
                        fontSize: '12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(0, 200, 83, 0.45)',
                        background: selByFat[f.id]
                          ? 'rgba(0, 200, 83, 0.18)'
                          : 'rgba(255,255,255,0.06)',
                        color: selByFat[f.id] ? '#00c853' : 'rgba(255,255,255,0.4)',
                        cursor: selByFat[f.id] ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {tr('clienteFaturaAssociar', 'Associar')}
                    </button>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
