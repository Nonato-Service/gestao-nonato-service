'use client'

import React, { useMemo } from 'react'
import {
  buildEnderecoMapsQuery,
  buildGoogleMapsNavigationUrl,
  buildGoogleMapsSearchUrl,
  type EnderecoMapsParts,
} from '../lib/enderecoMapsUtils'

type Props = {
  endereco: EnderecoMapsParts
  tr: (key: string) => string
  className?: string
  showPreview?: boolean
}

export function ClienteEnderecoMapsActions({ endereco, tr, className, showPreview = true }: Props) {
  const mapsQuery = useMemo(() => buildEnderecoMapsQuery(endereco), [endereco])
  const mapsSearchUrl = useMemo(() => buildGoogleMapsSearchUrl(mapsQuery), [mapsQuery])
  const mapsNavUrl = useMemo(() => buildGoogleMapsNavigationUrl(mapsQuery), [mapsQuery])

  if (!mapsQuery.trim()) return null

  return (
    <div className={'cliente-endereco-maps' + (className ? ` ${className}` : '')}>
      {showPreview ? (
        <>
          <span className="cliente-endereco-maps__titulo">{tr('clienteEnderecoMapsTitulo')}</span>
          <p className="cliente-endereco-maps__preview" title={mapsQuery}>
            {mapsQuery}
          </p>
        </>
      ) : null}
      <div className="cliente-endereco-maps__actions">
        <a
          href={mapsNavUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="cliente-endereco-maps__btn cliente-endereco-maps__btn--nav"
        >
          🧭 {tr('clienteAbrirGpsNavegar')}
        </a>
        <a
          href={mapsSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="cliente-endereco-maps__btn"
        >
          🗺️ {tr('clienteVerNoMapa')}
        </a>
      </div>
    </div>
  )
}
