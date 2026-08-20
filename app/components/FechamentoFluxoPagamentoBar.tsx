'use client'

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import {
  classNameFechamentoFluxoBar,
  fechamentoFluxoEhSemFatura,
  getFechamentoFluxoFase,
  type FechamentoFluxoFase,
} from '../lib/fechamentoFluxoFinanceiroUi'

type Props = {
  relatorioId: string
  fluxo: unknown
  labels: Record<string, string | undefined>
  numeroFaturaAtual?: string
  anexoAtual?: { dataUrl?: string; nome?: string; tipo?: string } | null
  onGuardarNumeroFatura: (relatorioId: string, numero: string) => void
  onGuardarAnexoFatura?: (relatorioId: string, file: File) => void | Promise<void>
  onRemoverAnexoFatura?: (relatorioId: string) => void
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

function pararPropagacaoInteracao(e: React.SyntheticEvent) {
  e.stopPropagation()
}

export function FechamentoFluxoPagamentoBar({
  relatorioId,
  fluxo,
  labels,
  numeroFaturaAtual,
  anexoAtual,
  onGuardarNumeroFatura,
  onGuardarAnexoFatura,
  onRemoverAnexoFatura,
  onMarcarPago,
  onMarcarNaoPago,
  compact,
}: Props) {
  const fase = getFechamentoFluxoFase(fluxo)
  const modoSemFatura = fechamentoFluxoEhSemFatura(fluxo)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const aEditarLocalmente = useRef(false)
  const [editandoFatura, setEditandoFatura] = useState(false)
  const [numeroInput, setNumeroInput] = useState(() => String(numeroFaturaAtual ?? '').trim())
  const [anexoBusy, setAnexoBusy] = useState(false)
  const [popoverRect, setPopoverRect] = useState<{ top: number; left: number; width: number } | null>(
    null
  )

  const temAnexo = Boolean(anexoAtual?.dataUrl && String(anexoAtual.dataUrl).startsWith('data:'))

  useEffect(() => {
    if (aEditarLocalmente.current) return
    setNumeroInput(String(numeroFaturaAtual ?? '').trim())
  }, [numeroFaturaAtual, relatorioId])

  useEffect(() => {
    if (fase !== 'sem_numero_fatura' && fase !== 'pago' && fase !== 'nao_pago') {
      setEditandoFatura(false)
    }
  }, [fase])

  const updatePopoverRect = useCallback(() => {
    const el = triggerRef.current
    if (!el || typeof window === 'undefined') return
    const rect = el.getBoundingClientRect()
    const width = Math.max(rect.width, compact ? 280 : 300)
    const gap = 4
    const estimatedHeight = temAnexo || onGuardarAnexoFatura ? 168 : 120
    const spaceBelow = window.innerHeight - rect.bottom - gap
    const openUp = spaceBelow < estimatedHeight && rect.top > spaceBelow
    const top = openUp ? Math.max(gap, rect.top - estimatedHeight - gap) : rect.bottom + gap
    const left = Math.min(
      Math.max(gap, rect.left),
      Math.max(gap, window.innerWidth - width - gap)
    )
    setPopoverRect({ top, left, width })
  }, [compact, temAnexo, onGuardarAnexoFatura])

  useLayoutEffect(() => {
    if (!editandoFatura || !compact) return
    updatePopoverRect()
    const onScrollOrResize = () => updatePopoverRect()
    window.addEventListener('resize', onScrollOrResize)
    window.addEventListener('scroll', onScrollOrResize, true)
    return () => {
      window.removeEventListener('resize', onScrollOrResize)
      window.removeEventListener('scroll', onScrollOrResize, true)
    }
  }, [editandoFatura, compact, updatePopoverRect])

  useEffect(() => {
    if (!editandoFatura || !compact) return
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) return
      aEditarLocalmente.current = false
      setEditandoFatura(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        aEditarLocalmente.current = false
        setEditandoFatura(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [editandoFatura, compact])

  const guardarNumero = (valor?: string) => {
    const n = String(valor ?? numeroInput ?? inputRef.current?.value ?? '').trim()
    if (!n) return
    aEditarLocalmente.current = false
    onGuardarNumeroFatura(relatorioId, n)
    setNumeroInput(n)
    setEditandoFatura(false)
  }

  const abrirEdicaoFatura = () => {
    aEditarLocalmente.current = true
    setNumeroInput(String(numeroFaturaAtual ?? '').trim())
    setEditandoFatura(true)
    if (compact) updatePopoverRect()
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  const abrirAnexo = () => {
    const url = anexoAtual?.dataUrl
    if (!url || typeof window === 'undefined') return
    try {
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      /* ignore */
    }
  }

  const pedirRemoverAnexo = () => {
    if (!onRemoverAnexoFatura || !temAnexo) return
    const msg =
      labels.fechamentoFluxoConfirmarRemoverAnexo ||
      labels.faturaRemoverAnexoConfirm ||
      'Remover o anexo da fatura?'
    if (typeof window !== 'undefined' && !window.confirm(msg)) return
    onRemoverAnexoFatura(relatorioId)
  }

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !onGuardarAnexoFatura) return
    setAnexoBusy(true)
    try {
      await onGuardarAnexoFatura(relatorioId, file)
    } finally {
      setAnexoBusy(false)
    }
  }

  // Compacto: CTA até o utilizador abrir o popover — não estica a linha da tabela
  const mostrarCtaSemFatura =
    !modoSemFatura && fase === 'sem_numero_fatura' && !editandoFatura

  const mostrarLinhaFaturaInline =
    !modoSemFatura &&
    !compact &&
    ((fase === 'sem_numero_fatura' && editandoFatura) ||
      (fase === 'aguardar_pagamento' && String(numeroFaturaAtual ?? '').trim() !== ''))

  const mostrarPopoverFaturaCompact =
    !modoSemFatura && compact && editandoFatura && (fase === 'sem_numero_fatura' || fase === 'pago' || fase === 'nao_pago')

  const mostrarFaixaAnexo =
    !modoSemFatura &&
    Boolean(onGuardarAnexoFatura || onRemoverAnexoFatura) &&
    (fase === 'aguardar_pagamento' ||
      fase === 'pago' ||
      fase === 'nao_pago' ||
      (fase === 'sem_numero_fatura' && editandoFatura) ||
      temAnexo)

  const submitFormularioFatura = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    guardarNumero()
  }

  const renderAnexoControls = (opts?: { inPopover?: boolean }) => {
    if (!mostrarFaixaAnexo && !opts?.inPopover) return null
    if (modoSemFatura) return null
    if (!onGuardarAnexoFatura && !temAnexo) return null
    return (
      <div
        className={
          opts?.inPopover
            ? 'fechamento-fluxo-bar__anexo-row fechamento-fluxo-bar__anexo-row--popover'
            : 'fechamento-fluxo-bar__anexo-row'
        }
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf,image/*"
          className="fechamento-fluxo-bar__anexo-input"
          tabIndex={-1}
          onChange={onFileChange}
        />
        {temAnexo ? (
          <>
            <button
              type="button"
              className="fechamento-fluxo-bar__btn fechamento-fluxo-bar__btn--ghost fechamento-fluxo-bar__btn--mini"
              onClick={e => {
                pararPropagacaoInteracao(e)
                abrirAnexo()
              }}
              title={
                anexoAtual?.nome
                  ? `${labels.faturaAbrirAnexo || labels.fechamentoFluxoVerAnexo || 'Ver anexo'} (${anexoAtual.nome})`
                  : labels.faturaAbrirAnexo || labels.fechamentoFluxoVerAnexo || 'Ver anexo'
              }
            >
              {labels.fechamentoFluxoVerAnexo || labels.faturaAbrirAnexo || 'Ver anexo'}
            </button>
            {onRemoverAnexoFatura ? (
              <button
                type="button"
                className="fechamento-fluxo-bar__btn fechamento-fluxo-bar__btn--ghost fechamento-fluxo-bar__btn--mini"
                disabled={anexoBusy}
                onClick={e => {
                  pararPropagacaoInteracao(e)
                  pedirRemoverAnexo()
                }}
                title={labels.fechamentoFluxoRemoverAnexo || labels.faturaRemoverAnexo || 'Remover anexo'}
              >
                {labels.fechamentoFluxoRemoverAnexo || labels.faturaRemoverAnexo || 'Remover'}
              </button>
            ) : null}
          </>
        ) : onGuardarAnexoFatura ? (
          <button
            type="button"
            className="fechamento-fluxo-bar__btn fechamento-fluxo-bar__btn--save fechamento-fluxo-bar__btn--mini"
            disabled={anexoBusy}
            onClick={e => {
              pararPropagacaoInteracao(e)
              fileInputRef.current?.click()
            }}
            title={labels.fechamentoFluxoAnexarFatura || labels.faturaAnexoLabel || 'Anexar fatura'}
          >
            {anexoBusy
              ? '…'
              : labels.fechamentoFluxoAnexarFatura || 'Anexar'}
          </button>
        ) : null}
      </div>
    )
  }

  const renderFaturaFormFields = (opts?: { showCancel?: boolean; editTitle?: boolean; withAnexo?: boolean }) => (
    <>
      <label className="fechamento-fluxo-bar__fatura-label">
        <span className="fechamento-fluxo-bar__fatura-label-text">
          {opts?.editTitle
            ? labels.fechamentoFluxoEditarNumeroFatura || 'Editar número da fatura'
            : labels.fechamentoFluxoNumeroFaturaLabel || labels.numeroFatura || 'Nº fatura'}
        </span>
        <input
          ref={inputRef}
          type="text"
          className="fechamento-fluxo-bar__fatura-input"
          value={numeroInput}
          onChange={e => {
            aEditarLocalmente.current = true
            setNumeroInput(e.target.value)
          }}
          onFocus={() => {
            aEditarLocalmente.current = true
          }}
          placeholder={labels.fechamentoFluxoNumeroFaturaPlaceholder || 'Ex.: FT 2026/001'}
          autoComplete="off"
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.stopPropagation()
              guardarNumero()
            }
          }}
        />
      </label>
      <button
        type="submit"
        className="fechamento-fluxo-bar__btn fechamento-fluxo-bar__btn--save"
        onClick={pararPropagacaoInteracao}
      >
        {labels.fechamentoFluxoGuardarNumeroFatura || labels.salvar || 'Guardar'}
      </button>
      {opts?.showCancel ? (
        <button
          type="button"
          className="fechamento-fluxo-bar__btn fechamento-fluxo-bar__btn--ghost"
          onClick={e => {
            pararPropagacaoInteracao(e)
            aEditarLocalmente.current = false
            setEditandoFatura(false)
          }}
        >
          {labels.cancelar || 'Cancelar'}
        </button>
      ) : null}
      {opts?.withAnexo ? renderAnexoControls({ inPopover: true }) : null}
    </>
  )

  const popoverFatura =
    mostrarPopoverFaturaCompact && popoverRect && typeof document !== 'undefined'
      ? createPortal(
          <form
            ref={popoverRef}
            data-bib-acoes-nested-portal=""
            className="fechamento-fluxo-bar__fatura-form fechamento-fluxo-bar__fatura-form--popover"
            style={{
              position: 'fixed',
              top: popoverRect.top,
              left: popoverRect.left,
              width: popoverRect.width,
              zIndex: 100075,
            }}
            onSubmit={submitFormularioFatura}
            onClick={pararPropagacaoInteracao}
            onMouseDown={pararPropagacaoInteracao}
            onPointerDown={pararPropagacaoInteracao}
          >
            {renderFaturaFormFields({
              showCancel: true,
              editTitle: fase === 'pago' || fase === 'nao_pago',
              withAnexo: true,
            })}
          </form>,
          document.body
        )
      : null

  return (
    <div
      className={classNameFechamentoFluxoBar(fase, compact)}
      onClick={pararPropagacaoInteracao}
      onMouseDown={pararPropagacaoInteracao}
      onPointerDown={pararPropagacaoInteracao}
    >
      {mostrarCtaSemFatura ? (
        <button
          ref={triggerRef}
          type="button"
          className="fechamento-fluxo-bar__cta fechamento-fluxo-bar__cta--alerta"
          onClick={e => {
            pararPropagacaoInteracao(e)
            abrirEdicaoFatura()
          }}
          title={labels.fechamentoFluxoCliqueAdicionarFatura || 'Clique para adicionar o número da fatura'}
        >
          {compact
            ? labels.fechamentoFluxoNumeroFaturaLabel || labels.numeroFatura || 'Nº fatura'
            : labelFase(fase, labels)}
        </button>
      ) : null}

      {mostrarLinhaFaturaInline ? (
        <form className="fechamento-fluxo-bar__fatura-row" onSubmit={submitFormularioFatura}>
          {fase === 'aguardar_pagamento' ? (
            <span className="fechamento-fluxo-bar__status">{labelFase(fase, labels)}</span>
          ) : null}
          {renderFaturaFormFields({
            showCancel: fase === 'sem_numero_fatura' && editandoFatura,
            withAnexo: true,
          })}
        </form>
      ) : null}

      {/* Compacto + aguardar pagamento: mostra nº fatura inline (já guardado) sem formulário gigante */}
      {compact && !modoSemFatura && fase === 'aguardar_pagamento' && String(numeroFaturaAtual ?? '').trim() !== '' ? (
        <div className="fechamento-fluxo-bar__fatura-row fechamento-fluxo-bar__fatura-row--compact-read">
          <span className="fechamento-fluxo-bar__status">{labelFase(fase, labels)}</span>
          <span className="fechamento-fluxo-bar__formo-fatura">
            {labels.fechamentoFluxoNumeroFaturaLabel || 'Nº fatura'}: {numeroFaturaAtual}
          </span>
        </div>
      ) : null}

      {fase === 'aguardar_pagamento' ? (
        <div className="fechamento-fluxo-bar__pagamento-row">
          {modoSemFatura ? (
            <span className="fechamento-fluxo-bar__status">{labelFase(fase, labels)}</span>
          ) : null}
          <button
            type="button"
            className="fechamento-fluxo-bar__btn fechamento-fluxo-bar__btn--pago"
            onClick={e => {
              pararPropagacaoInteracao(e)
              onMarcarPago(relatorioId)
            }}
          >
            {labels.fechamentoFluxoBtnPago || labels.financeiroDespesasBtnPago || 'Pago'}
          </button>
          <button
            type="button"
            className="fechamento-fluxo-bar__btn fechamento-fluxo-bar__btn--nao-pago"
            onClick={e => {
              pararPropagacaoInteracao(e)
              onMarcarNaoPago(relatorioId)
            }}
          >
            {labels.fechamentoFluxoBtnNaoPago || labels.financeiroDespesasBtnNaoPago || 'Não pago'}
          </button>
        </div>
      ) : null}

      {/* Anexo compacto fora do formulário (aguardar / pago / não pago) */}
      {!editandoFatura && !mostrarLinhaFaturaInline ? renderAnexoControls() : null}

      {fase === 'pago' || fase === 'nao_pago' ? (
        !editandoFatura ? (
          <div className="fechamento-fluxo-bar__formo">
            <span className="fechamento-fluxo-bar__formo-label">{labelFase(fase, labels)}</span>
            {!modoSemFatura && numeroFaturaAtual ? (
              <span className="fechamento-fluxo-bar__formo-fatura">
                {labels.fechamentoFluxoNumeroFaturaLabel || 'Nº fatura'}: {numeroFaturaAtual}
              </span>
            ) : null}
            {!modoSemFatura ? (
              <button
                ref={triggerRef}
                type="button"
                className="fechamento-fluxo-bar__btn fechamento-fluxo-bar__btn--ghost fechamento-fluxo-bar__btn--mini"
                onClick={e => {
                  pararPropagacaoInteracao(e)
                  abrirEdicaoFatura()
                }}
                title={labels.fechamentoFluxoEditarNumeroFatura || 'Editar número da fatura'}
              >
                ✏️
              </button>
            ) : null}
          </div>
        ) : !compact ? (
          <div className="fechamento-fluxo-bar__fatura-row fechamento-fluxo-bar__fatura-row--overlay">
            <form style={{ display: 'contents' }} onSubmit={submitFormularioFatura}>
              {renderFaturaFormFields({ showCancel: true, editTitle: true, withAnexo: true })}
            </form>
          </div>
        ) : null
      ) : null}

      {popoverFatura}
    </div>
  )
}
