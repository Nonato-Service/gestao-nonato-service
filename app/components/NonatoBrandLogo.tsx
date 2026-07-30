'use client'

import React, { useCallback, useState } from 'react'
import {
  applyNonatoBrandLogoImgFallback,
  getNonatoBrandLogoFallbackSrc,
  isNonatoBrandLogoPngSrc,
  NONATO_BRAND_LOGO_PNG_SRC,
} from '../lib/nonatoBrandAssets'

/** Variantes visuais derivadas do ficheiro original (filtros CSS — mesma identidade, cor por situação). */
export type NonatoBrandVariant =
  | 'original'
  | 'sucesso'
  | 'alerta'
  | 'devedor'
  | 'financeiro'
  | 'informacao'

const VARIANT_CLASS: Record<NonatoBrandVariant, string> = {
  original: 'ns-brand-logo ns-brand-logo--original',
  sucesso: 'ns-brand-logo ns-brand-logo--sucesso',
  alerta: 'ns-brand-logo ns-brand-logo--alerta',
  devedor: 'ns-brand-logo ns-brand-logo--devedor',
  financeiro: 'ns-brand-logo ns-brand-logo--financeiro',
  informacao: 'ns-brand-logo ns-brand-logo--informacao',
}

export function NonatoBrandLogo({
  variant = 'original',
  className = '',
  alt = 'NONATO SERVICE',
  src,
  ...rest
}: {
  variant?: NonatoBrandVariant
  className?: string
  alt?: string
  src?: string
} & React.ImgHTMLAttributes<HTMLImageElement>) {
  const [resolvedSrc, setResolvedSrc] = useState(src || NONATO_BRAND_LOGO_PNG_SRC)
  const isBrandFile = !src && isNonatoBrandLogoPngSrc(resolvedSrc)

  const onError = useCallback(() => {
    setResolvedSrc((cur) => {
      if (cur === getNonatoBrandLogoFallbackSrc()) return cur
      if (cur === NONATO_BRAND_LOGO_PNG_SRC) return getNonatoBrandLogoFallbackSrc()
      return getNonatoBrandLogoFallbackSrc()
    })
  }, [])

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={`${VARIANT_CLASS[variant] ?? VARIANT_CLASS.original}${isBrandFile ? ' ns-brand-logo--brand-file' : ''} ${className}`.trim()}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        onError()
        applyNonatoBrandLogoImgFallback(e.currentTarget)
      }}
      {...rest}
    />
  )
}
