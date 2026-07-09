'use client'

import React, { useEffect, useState } from 'react'
import {
  classNameFechamentoFluxoBar,
  getFechamentoFluxoFase,
  type FechamentoFluxoFase,
} from '../lib/fechamentoFluxoFinanceiroUi'

type Props = {
  relatorioId: string
  fluxo: unknown
  labels: Record<string, string | undefined>
  numeroFaturaAtual?: string
  onGuardarNumeroFatura: (relatorioId: string, numero: string) => void
  onMarcarPago: (relatorioId: string) => void
  onMarcarNaoPago: (relatorioId: string) => void
  compact?: boolean
}

function labelFase(fase: FechamentoFluxoFase, labels: Record<string, string | undefined>): string {
  if (fase === 'sem_numero_fatura') {
    return labels.fechamentoFluxoFavorAdicionarFatura || 'Favor adicionar número da fatura'
  }
  if (fase === 'aguardar_pagamento') {
    return labels.fechamentoFluxoAguardarPagamento || 'Aguardar confirmação de pagamento'
  }
  if (fase === 'pago') {
    return labels.fechamentoFluxoEstadoPago || labels.financeiroDespesasBadgePago || 'Pago'
  }
  return labels.fechamentoFluxoEstadoNaoPago || labels.financeiroDespesasBadgeNaoPago || 'Não pago'
}

export function FechamentoFluxoPagamentoBar({
  relatorioId,
  fluxo,
  labels,
  numeroFaturaAtual,
  onGuardarNumeroFatura,
  onMarcarPago,
  onMarcarNaoPago,
  compact,
}: Props) {
  const fase = getFechamentoFluxoFase(fluxo)
  const [editandoFatura, setEditandoFatura] = useState(() => compact && fase === 'sem_numero_fatura')
  const [numeroInput, setNumeroInput] = useState('')

  useEffect(() => {
    setNumeroInput(String(numeroFaturaAtual ?? '').trim())
  }, [numeroFaturaAtual, relatorioId, fase])

  useEffect(() => {
    if (fase !== 'sem_numero_fatura') setEditandoFatura(false)
    else if (compact) setEditandoFatura(true)
  }, [fase, compact])

  const guardarNumero = () => {
    const n = numeroInput.trim()
    if (!n) return
    onGuardarNumeroFatura(relatorioId, n)
    if (!compact) setEditandoFatura(false)
  }

  const abrirEdicaoFatura = () => {
    setNumeroInput(String(numeroFaturaAtual ?? '').trim())
    setEditandoFatura(true)
  }

  const mostrarCtaSemFatura = fase === 'sem_numero_fatura' && !editandoFatura && !compact
  const mostrarLinhaFatura =
    (fase === 'sem_numero_fatura' && editandoFatura) || fase === 'aguardar_pagamento'

  const pararPropagacaoInteracao = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
  }

  return (
    <div
      className={classNameFechamentoFluxoBar(fase, compact)}
      onClick={pararPropagacaoInteracao}
      onMouseDown={pararPropagacaoInteracao}
      onKeyDown={pararPropagacaoInteracao}
    >
      {mostrarCtaSemFatura ? (
        <button
          type="button"
          className="fechamento-fluxo-bar__cta fechamento-fluxo-bar__cta--alerta"
          onClick={abrirEdicaoFatura}
          title={labels.fechamentoFluxoCliqueAdicionarFatura || 'Clique para adicionar o número da fatura'}
        >
          {labelFase(fase, labels)}
        </button>
      ) : null}

      {mostrarLinhaFatura ? (
        <div className="fechamento-fluxo-bar__fatura-row">
          {fase === 'aguardar_pagamento' ? (
            <span className="fechamento-fluxo-bar__status">{labelFase(fase, labels)}</span>
          ) : null}
          <label className="fechamento-fluxo-bar__fatura-label">
            <span className="fechamento-fluxo-bar__fatura-label-text">
              {labels.fechamentoFluxoNumeroFaturaLabel || labels.numeroFatura || 'Nº fatura'}
            </span>
            <input
              type="text"
              className="fechamento-fluxo-bar__fatura-input"
              value={numeroInput}
              onChange={(e) => setNumeroInput(e.target.value)}
              placeholder={labels.fechamentoFluxoNumeroFaturaPlaceholder || 'Ex.: FT 2026/001'}
              onKeyDown={(e) => {
                if (e.key === 'Enter') guardarNumero()
              }}
            />
          </label>
          <button type="button" className="fechamento-fluxo-bar__btn fechamento-fluxo-bar__btn--save" onClick={guardarNumero}>
            {labels.fechamentoFluxoGuardarNumeroFatura || labels.salvar || 'Guardar'}
          </button>
          {fase === 'sem_numero_fatura' && editandoFatura && !compact ? (
            <button
              type="button"
              className="fechamento-fluxo-bar__btn fechamento-fluxo-bar__btn--ghost"
              onClick={() => setEditandoFatura(false)}
            >
              {labels.cancelar || 'Cancelar'}
            </button>
          ) : null}
        </div>
      ) : null}

      {fase === 'aguardar_pagamento' ? (
        <div className="fechamento-fluxo-bar__pagamento-row">
          <button
            type="button"
            className="fechamento-fluxo-bar__btn fechamento-fluxo-bar__btn--pago"
            onClick={() => onMarcarPago(relatorioId)}
          >
            {labels.fechamentoFluxoBtnPago || labels.financeiroDespesasBtnPago || 'Pago'}
          </button>
          <button
            type="button"
            className="fechamento-fluxo-bar__btn fechamento-fluxo-bar__btn--nao-pago"
            onClick={() => onMarcarNaoPago(relatorioId)}
          >
            {labels.fechamentoFluxoBtnNaoPago || labels.financeiroDespesasBtnNaoPago || 'Não pago'}
          </button>
        </div>
      ) : null}

      {fase === 'pago' || fase === 'nao_pago' ? (
        !editandoFatura ? (
        <div className="fechamento-fluxo-bar__fixo">
          <span className="fechamento-fluxo-bar__fixo-label">{labelFase(fase, labels)}</span>
          {numeroFaturaAtual ? (
            <span className="fechamento-fluxo-bar__fixo-fatura">
              {labels.fechamentoFluxoNumeroFaturaLabel || 'Nº fatura'}: {numeroFaturaAtual}
            </span>
          ) : null}
          <button
            type="button"
            className="fechamento-fluxo-bar__btn fechamento-fluxo-bar__btn--ghost fechamento-fluxo-bar__btn--mini"
            onClick={abrirEdicaoFatura}
            title={labels.fechamentoFluxoEditarNumeroFatura || 'Editar número da fatura'}
          >
            ✏️
          </button>
        </div>
        ) : null
      ) : null}

      {(fase === 'pago' || fase === 'nao_pago') && editandoFatura ? (
        <div className="fechamento-fluxo-bar__fatura-row fechamento-fluxo-bar__fatura-row--overlay">
          <label className="fechamento-fluxo-bar__fatura-label">
            <span className="fechamento-fluxo-bar__fatura-label-text">
              {labels.fechamentoFluxoEditarNumeroFatura || 'Editar número da fatura'}
            </span>
            <input
              type="text"
              className="fechamento-fluxo-bar__fatura-input"
              value={numeroInput}
              onChange={(e) => setNumeroInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') guardarNumero()
              }}
            />
          </label>
          <button type="button" className="fechamento-fluxo-bar__btn fechamento-fluxo-bar__btn--save" onClick={guardarNumero}>
            {labels.fechamentoFluxoGuardarNumeroFatura || labels.salvar || 'Guardar'}
          </button>
          <button
            type="button"
            className="fechamento-fluxo-bar__btn fechamento-fluxo-bar__btn--ghost"
            onClick={() => setEditandoFatura(false)}
          >
            {labels.cancelar || 'Cancelar'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
