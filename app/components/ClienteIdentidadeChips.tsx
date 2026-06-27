'use client'

import { useMemo } from 'react'
import { codigoClienteExibicao } from '../lib/clienteCodigoUtils'
import { translations, translationBundleKey } from '../translations'

type ClienteIdentidade = {
  codigoCliente?: string
  id?: string
  nomeEmpresa?: string
}

function useIdentTr(language: string) {
  return useMemo(() => {
    const primary = (translations[translationBundleKey(language)] || translations['pt-BR']) as Record<
      string,
      string | undefined
    >
    const en = translations.en as Record<string, string | undefined>
    const pt = translations['pt-BR'] as Record<string, string | undefined>
    return (key: string) => primary[key] ?? en[key] ?? pt[key] ?? key
  }, [language])
}

/** Texto plano: «Cód. = NS000042 · Cliente = ACME» (selects, alertas). */
export function formatClienteIdentidadeTexto(
  cliente: ClienteIdentidade | null | undefined,
  labels?: { cod?: string; nome?: string }
): string {
  if (!cliente) return '—'
  const cod = codigoClienteExibicao(cliente)
  const nome = (cliente.nomeEmpresa || '').trim() || '—'
  const lblCod = labels?.cod || 'Cód.'
  const lblNome = labels?.nome || 'Cliente'
  if (cod === '—') return `${lblNome} = ${nome}`
  return `${lblCod} = ${cod}  ·  ${lblNome} = ${nome}`
}

type Props = {
  cliente: ClienteIdentidade
  language?: string
  className?: string
  /** Só o código (ex.: breadcrumb) */
  codOnly?: boolean
}

export function ClienteIdentidadeChips({ cliente, language = 'pt-BR', className, codOnly }: Props) {
  const tr = useIdentTr(language)
  const cod = codigoClienteExibicao(cliente)
  const nome = (cliente.nomeEmpresa || '').trim() || '—'
  const lblCod = tr('clienteIdentTagCod')
  const lblNome = tr('clienteIdentTagNome')

  if (codOnly && cod !== '—') {
    return (
      <span className={`cliente-ident-chips cliente-ident-chips--inline ${className || ''}`}>
        <span className="cliente-ident-chips__item cliente-ident-chips__item--cod">
          <span className="cliente-ident-chips__label">{lblCod}</span>
          <span className="cliente-ident-chips__eq" aria-hidden>=</span>
          <span className="cliente-ident-chips__value">{cod}</span>
        </span>
      </span>
    )
  }

  return (
    <span className={`cliente-ident-chips ${className || ''}`}>
      {cod !== '—' ? (
        <span className="cliente-ident-chips__item cliente-ident-chips__item--cod">
          <span className="cliente-ident-chips__label">{lblCod}</span>
          <span className="cliente-ident-chips__eq" aria-hidden>=</span>
          <span className="cliente-ident-chips__value">{cod}</span>
        </span>
      ) : null}
      {!codOnly ? (
        <span className="cliente-ident-chips__item cliente-ident-chips__item--nome">
          <span className="cliente-ident-chips__label">{lblNome}</span>
          <span className="cliente-ident-chips__eq" aria-hidden>=</span>
          <span className="cliente-ident-chips__value">{nome}</span>
        </span>
      ) : null}
    </span>
  )
}
