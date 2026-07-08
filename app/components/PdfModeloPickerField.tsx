'use client'

import React from 'react'
import { RelatorioPdfModeloPicker } from './RelatorioPdfModeloPicker'

type Props = {
  value: string
  onChange: (model: string) => void
  labels: Record<string, string>
  title?: string
  label?: string
  hint?: string
  compact?: boolean
  className?: string
}

export function PdfModeloPickerField({
  value,
  onChange,
  labels,
  title,
  label,
  hint,
  compact = false,
  className = '',
}: Props) {
  return (
    <div className={`pdf-modelo-picker-field${className ? ` ${className}` : ''}`}>
      {label ? <label className="pdf-modelo-picker-field__label">{label}</label> : null}
      <RelatorioPdfModeloPicker
        value={value}
        onChange={onChange}
        title={title || label || labels.selecioneModeloPDF || 'Modelo de PDF'}
        labels={labels}
        groupRecomendados={labels.relatorioPdfOptgroupRecomendados || 'Recomendados para cliente'}
        groupOutros={labels.relatorioPdfOptgroupOutros || 'Outros estilos'}
        compact={compact}
      />
      {hint ? <p className="pdf-modelo-picker-field__hint">{hint}</p> : null}
    </div>
  )
}
