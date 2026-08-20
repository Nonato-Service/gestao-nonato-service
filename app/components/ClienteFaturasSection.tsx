'use client'

import React, { useMemo } from 'react'

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
}

function rotuloEquipamento(eq: EquipamentoOpt, index: number): string {
  const parts = [eq.marca, eq.modelo, eq.numeroSerie].filter(Boolean)
  if (parts.length) return parts.join(' · ')
  if (eq.tipoEquipamento) return eq.tipoEquipamento
  return eq.id || `#${index + 1}`
}

export function ClienteFaturasSection({ faturas, equipamentos, safeT, language = 'pt-BR', onOpenAnexo }: Props) {
  const tr = (key: string, fb: string) => safeT[key] || fb

  const eqLabelById = useMemo(() => {
    const map = new Map<string, string>()
    equipamentos.forEach((eq, i) => {
      if (eq.id) map.set(String(eq.id), rotuloEquipamento(eq, i))
    })
    return map
  }, [equipamentos])

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

  return (
    <section className="cliente-detalhe-v2__card">
      <h3 className="cliente-detalhe-v2__section-title cliente-detalhe-v2__section-title--solo">
        🧾 {tr('clienteFaturasTitle', 'Faturas')}
      </h3>
      <p style={{ margin: '0 0 14px', fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>
        {tr('clienteFaturasHint', 'Cada fatura pode estar ligada a um equipamento deste cliente.')}
      </p>
      {faturas.length === 0 ? (
        <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
          {tr('clienteFaturasVazio', 'Nenhuma fatura registada para este cliente.')}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {faturas.map((f) => {
            const eqTxt =
              f.equipamentoTexto ||
              (f.equipamentoId ? eqLabelById.get(String(f.equipamentoId)) : undefined) ||
              tr('clienteFaturaSemEquipamento', 'Sem equipamento')
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
                <div style={{ marginTop: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.65)', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  <span>{tr('dataLabel', 'Data')}: {fmtDate(f.dataEmissao)}</span>
                  <span>{tr('totalLabel', 'Total')}: {fmt(f.valorTotal)}</span>
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
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
