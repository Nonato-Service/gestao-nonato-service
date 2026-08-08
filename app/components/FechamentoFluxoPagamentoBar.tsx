'use client'



import React, { useEffect, useRef, useState } from 'react'

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



function pararPropagacaoInteracao(e: React.SyntheticEvent) {

  e.stopPropagation()

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

  const modoSemFatura = fechamentoFluxoEhSemFatura(fluxo)

  const inputRef = useRef<HTMLInputElement>(null)

  const aEditarLocalmente = useRef(false)

  const [editandoFatura, setEditandoFatura] = useState(false)

  const [numeroInput, setNumeroInput] = useState(() => String(numeroFaturaAtual ?? '').trim())



  useEffect(() => {

    if (aEditarLocalmente.current) return

    setNumeroInput(String(numeroFaturaAtual ?? '').trim())

  }, [numeroFaturaAtual, relatorioId])



  useEffect(() => {

    if (fase !== 'sem_numero_fatura') setEditandoFatura(false)

  }, [fase])



  const guardarNumero = (valor?: string) => {

    const n = String(valor ?? numeroInput ?? inputRef.current?.value ?? '').trim()

    if (!n) return

    aEditarLocalmente.current = false

    onGuardarNumeroFatura(relatorioId, n)

    setNumeroInput(n)

    if (!compact) setEditandoFatura(false)

  }



  const abrirEdicaoFatura = () => {

    aEditarLocalmente.current = true

    setNumeroInput(String(numeroFaturaAtual ?? '').trim())

    setEditandoFatura(true)

    window.setTimeout(() => inputRef.current?.focus(), 0)

  }



  const mostrarFormularioCompactoSemFatura =

    !modoSemFatura && compact && fase === 'sem_numero_fatura'

  const mostrarCtaSemFatura =

    !modoSemFatura && fase === 'sem_numero_fatura' && !editandoFatura && !compact

  const mostrarLinhaFatura =

    !modoSemFatura &&

    ((fase === 'sem_numero_fatura' && (editandoFatura || compact)) ||

      (fase === 'aguardar_pagamento' && String(numeroFaturaAtual ?? '').trim() !== ''))



  const submitFormularioFatura = (e: React.FormEvent) => {

    e.preventDefault()

    e.stopPropagation()

    guardarNumero()

  }



  return (

    <div

      className={classNameFechamentoFluxoBar(fase, compact)}

      onClick={pararPropagacaoInteracao}

      onMouseDown={pararPropagacaoInteracao}

      onPointerDown={pararPropagacaoInteracao}

    >

      {mostrarCtaSemFatura ? (

        <button

          type="button"

          className="fechamento-fluxo-bar__cta fechamento-fluxo-bar__cta--alerta"

          onClick={(e) => {

            pararPropagacaoInteracao(e)

            abrirEdicaoFatura()

          }}

          title={labels.fechamentoFluxoCliqueAdicionarFatura || 'Clique para adicionar o número da fatura'}

        >

          {labelFase(fase, labels)}

        </button>

      ) : null}



      {mostrarFormularioCompactoSemFatura ? (

        <form className="fechamento-fluxo-bar__fatura-form" onSubmit={submitFormularioFatura}>

          <label className="fechamento-fluxo-bar__fatura-label">

            <span className="fechamento-fluxo-bar__fatura-label-text">

              {labels.fechamentoFluxoNumeroFaturaLabel || labels.numeroFatura || 'Nº fatura'}

            </span>

            <input

              ref={inputRef}

              type="text"

              className="fechamento-fluxo-bar__fatura-input"

              value={numeroInput}

              onChange={(e) => {

                aEditarLocalmente.current = true

                setNumeroInput(e.target.value)

              }}

              onFocus={() => {

                aEditarLocalmente.current = true

              }}

              onBlur={() => {

                window.setTimeout(() => {

                  aEditarLocalmente.current = false

                }, 120)

              }}

              placeholder={labels.fechamentoFluxoNumeroFaturaPlaceholder || 'Ex.: FT 2026/001'}

              autoComplete="off"

            />

          </label>

          <button

            type="submit"

            className="fechamento-fluxo-bar__btn fechamento-fluxo-bar__btn--save"

            onClick={pararPropagacaoInteracao}

          >

            {labels.fechamentoFluxoGuardarNumeroFatura || labels.salvar || 'Guardar'}

          </button>

        </form>

      ) : null}



      {!mostrarFormularioCompactoSemFatura && mostrarLinhaFatura ? (

        <div className="fechamento-fluxo-bar__fatura-row">

          {fase === 'aguardar_pagamento' ? (

            <span className="fechamento-fluxo-bar__status">{labelFase(fase, labels)}</span>

          ) : null}

          <label className="fechamento-fluxo-bar__fatura-label">

            <span className="fechamento-fluxo-bar__fatura-label-text">

              {labels.fechamentoFluxoNumeroFaturaLabel || labels.numeroFatura || 'Nº fatura'}

            </span>

            <input

              ref={inputRef}

              type="text"

              className="fechamento-fluxo-bar__fatura-input"

              value={numeroInput}

              onChange={(e) => {

                aEditarLocalmente.current = true

                setNumeroInput(e.target.value)

              }}

              onFocus={() => {

                aEditarLocalmente.current = true

              }}

              placeholder={labels.fechamentoFluxoNumeroFaturaPlaceholder || 'Ex.: FT 2026/001'}

              onKeyDown={(e) => {

                if (e.key === 'Enter') {

                  e.preventDefault()

                  e.stopPropagation()

                  guardarNumero()

                }

              }}

            />

          </label>

          <button

            type="button"

            className="fechamento-fluxo-bar__btn fechamento-fluxo-bar__btn--save"

            onClick={(e) => {

              pararPropagacaoInteracao(e)

              guardarNumero()

            }}

          >

            {labels.fechamentoFluxoGuardarNumeroFatura || labels.salvar || 'Guardar'}

          </button>

          {fase === 'sem_numero_fatura' && editandoFatura ? (

            <button

              type="button"

              className="fechamento-fluxo-bar__btn fechamento-fluxo-bar__btn--ghost"

              onClick={(e) => {

                pararPropagacaoInteracao(e)

                aEditarLocalmente.current = false

                setEditandoFatura(false)

              }}

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

            onClick={(e) => {

              pararPropagacaoInteracao(e)

              onMarcarPago(relatorioId)

            }}

          >

            {labels.fechamentoFluxoBtnPago || labels.financeiroDespesasBtnPago || 'Pago'}

          </button>

          <button

            type="button"

            className="fechamento-fluxo-bar__btn fechamento-fluxo-bar__btn--nao-pago"

            onClick={(e) => {

              pararPropagacaoInteracao(e)

              onMarcarNaoPago(relatorioId)

            }}

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

              onClick={(e) => {

                pararPropagacaoInteracao(e)

                abrirEdicaoFatura()

              }}

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

              ref={inputRef}

              type="text"

              className="fechamento-fluxo-bar__fatura-input"

              value={numeroInput}

              onChange={(e) => {

                aEditarLocalmente.current = true

                setNumeroInput(e.target.value)

              }}

              onKeyDown={(e) => {

                if (e.key === 'Enter') {

                  e.preventDefault()

                  e.stopPropagation()

                  guardarNumero()

                }

              }}

            />

          </label>

          <button

            type="button"

            className="fechamento-fluxo-bar__btn fechamento-fluxo-bar__btn--save"

            onClick={(e) => {

              pararPropagacaoInteracao(e)

              guardarNumero()

            }}

          >

            {labels.fechamentoFluxoGuardarNumeroFatura || labels.salvar || 'Guardar'}

          </button>

          <button

            type="button"

            className="fechamento-fluxo-bar__btn fechamento-fluxo-bar__btn--ghost"

            onClick={(e) => {

              pararPropagacaoInteracao(e)

              aEditarLocalmente.current = false

              setEditandoFatura(false)

            }}

          >

            {labels.cancelar || 'Cancelar'}

          </button>

        </div>

      ) : null}

    </div>

  )

}


