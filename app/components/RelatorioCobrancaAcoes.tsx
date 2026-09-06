'use client'

/**
 * Acções de cobrança no relatório (normal / especial):
 * «Tipo de cobrança» (grupo de tarifas do cadastro) + «Ir ao fechamento».
 * Só renderiza quando o relatório está marcado como concluído.
 */
import React, { useState } from 'react'

export type RelatorioCobrancaGrupoMin = {
  id: string
  nome: string
  httLabel?: string
}

export type RelatorioCobrancaAcoesProps = {
  concluido: boolean
  labels: Record<string, string | undefined>
  grupos: RelatorioCobrancaGrupoMin[]
  grupoIdAtual: string
  grupoSugeridoNome?: string
  onSelectGrupo: (grupoId: string) => void
  onIrAoFechamento: () => void
  /** Estilo mais compacto (cards da lista). */
  compact?: boolean
  className?: string
}

export function RelatorioCobrancaAcoes({
  concluido,
  labels: t,
  grupos,
  grupoIdAtual,
  grupoSugeridoNome,
  onSelectGrupo,
  onIrAoFechamento,
  compact = false,
  className,
}: RelatorioCobrancaAcoesProps) {
  const [showTipo, setShowTipo] = useState(false)
  const [draftGrupo, setDraftGrupo] = useState(grupoIdAtual)

  if (!concluido) return null

  const abrirTipo = () => {
    setDraftGrupo(grupoIdAtual || grupos[0]?.id || '')
    setShowTipo(true)
  }

  const confirmarTipo = () => {
    if (!draftGrupo) {
      alert(t.relatorioTipoCobrancaSemGrupos || 'Configure grupos no Cadastro de Serviços / Valores.')
      return
    }
    onSelectGrupo(draftGrupo)
    setShowTipo(false)
  }

  const btnPad = compact ? '8px 12px' : '8px 16px'
  const btnFont = compact ? '12px' : '13px'

  return (
    <>
      <div
        className={className || 'relatorio-cobranca-acoes'}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: compact ? 8 : 10,
          alignItems: 'center',
        }}
      >
        <button
          type="button"
          className="btn-primary"
          onClick={abrirTipo}
          style={{
            padding: btnPad,
            fontSize: btnFont,
            backgroundColor: 'rgba(0, 200, 83, 0.14)',
            borderColor: 'rgba(0, 200, 83, 0.55)',
            color: '#fff',
          }}
          title={
            t.relatorioTipoCobrancaDica ||
            'Escolher grupo de tarifas do Cadastro de Serviços / Valores (por tipo de cliente)'
          }
        >
          💶 {t.relatorioTipoCobranca || 'Tipo de cobrança'}
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={onIrAoFechamento}
          style={{
            padding: btnPad,
            fontSize: btnFont,
            backgroundColor: 'rgba(255, 165, 0, 0.18)',
            borderColor: 'rgba(255, 165, 0, 0.55)',
            color: '#fff',
          }}
          title={
            t.relatorioIrAoFechamentoDica ||
            'Abrir fechamento com horas, km e diárias do relatório; pode acrescentar despesas'
          }
        >
          📋 {t.relatorioIrAoFechamento || 'Ir ao fechamento'}
        </button>
      </div>

      {showTipo && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setShowTipo(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 12000,
            background: 'rgba(0,0,0,0.72)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 440,
              background: '#2a2a2a',
              border: '1px solid #00ff00',
              borderRadius: 12,
              padding: 20,
              color: '#fff',
              boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
            }}
          >
            <h3 style={{ margin: '0 0 8px', color: '#00ff00', fontSize: 18 }}>
              {t.relatorioTipoCobranca || 'Tipo de cobrança'}
            </h3>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: '#c8c8c8', lineHeight: 1.45 }}>
              {t.fechamentoGrupoAjuda ||
                'Escolha o grupo de tarifas do Cadastro de Serviços (valores conforme o tipo de cliente).'}
            </p>
            {grupoSugeridoNome ? (
              <p style={{ margin: '0 0 10px', fontSize: 12, color: '#9f9' }}>
                {t.fechamentoGrupoClienteSugerido || 'Tarifa definida no cadastro do cliente'}:{' '}
                <strong>{grupoSugeridoNome}</strong>
              </p>
            ) : null}
            {grupos.length === 0 ? (
              <p style={{ color: '#ffcc80', fontSize: 13 }}>
                {t.relatorioTipoCobrancaSemGrupos ||
                  'Configure grupos no Cadastro de Serviços / Valores.'}
              </p>
            ) : (
              <select
                value={draftGrupo}
                onChange={(e) => setDraftGrupo(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#404040',
                  color: '#fff',
                  border: '1px solid rgba(0,255,0,0.45)',
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                {grupos.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nome}
                    {g.httLabel ? ` — ${g.httLabel}` : ''}
                  </option>
                ))}
              </select>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowTipo(false)}
                style={{ padding: '8px 16px', background: '#333', borderColor: '#666' }}
              >
                {t.cancel || t.fechar || 'Cancelar'}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={confirmarTipo}
                disabled={grupos.length === 0}
                style={{ padding: '8px 16px' }}
              >
                {t.confirm || t.salvar || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default RelatorioCobrancaAcoes
