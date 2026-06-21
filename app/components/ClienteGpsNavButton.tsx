'use client'

import React, { useMemo } from 'react'
import {
  buildEnderecoMapsQuery,
  buildGoogleMapsNavigationUrl,
  type EnderecoMapsParts,
} from '../lib/enderecoMapsUtils'
import { uiTr } from '../lib/uiTr'

type Props = {
  endereco: EnderecoMapsParts
  language: string
  className?: string
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}

export function ClienteGpsNavButton({ endereco, language, className, onClick }: Props) {
  const mapsQuery = useMemo(() => buildEnderecoMapsQuery(endereco), [endereco])
  const mapsNavUrl = useMemo(() => buildGoogleMapsNavigationUrl(mapsQuery), [mapsQuery])
  const label = uiTr(language, 'clienteGpsAtalho')
  const ariaPrefix = uiTr(language, 'clienteGpsNavAria')

  if (!mapsQuery.trim()) return null

  const ariaLabel = `${ariaPrefix}: ${mapsQuery}`

  return (
    <a
      href={mapsNavUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={'cliente-gps-nav-btn' + (className ? ` ${className}` : '')}
      title={ariaLabel}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <span className="cliente-gps-nav-btn__icon" aria-hidden>
        🧭
      </span>
      <span className="cliente-gps-nav-btn__label">{label}</span>
    </a>
  )
}
