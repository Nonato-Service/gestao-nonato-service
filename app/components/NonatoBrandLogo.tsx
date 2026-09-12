'use client'

import React, { useCallback, useState } from 'react'
import {
  applyNonatoBrandLogoImgFallback,
  getNonatoBrandLogoFallbackSrc,
  isNonatoBrandLogoPngSrc,
  NONATO_BRAND_LOGO_PNG_SRC,
} from '../lib/nonatoBrandAssets'
import { brandLogoClassName, type NonatoBrandVariant } from '../modules/admin'

export type { NonatoBrandVariant }

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
      className={brandLogoClassName(variant, { isBrandFile, className })}
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
