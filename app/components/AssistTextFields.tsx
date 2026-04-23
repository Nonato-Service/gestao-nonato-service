'use client'

import React from 'react'
import { useWritingAssistField } from '../context/WritingAssistFieldContext'

const assistBtnStyle: React.CSSProperties = {
  flexShrink: 0,
  width: 44,
  minWidth: 44,
  height: 44,
  marginTop: 2,
  padding: 0,
  backgroundColor: 'rgba(18, 44, 28, 0.95)',
  border: '1px solid rgba(74, 222, 128, 0.35)',
  borderRadius: '8px',
  color: '#d8ffe8',
  fontSize: '20px',
  cursor: 'pointer',
  lineHeight: 1,
}

const assistBtnStyleInline: React.CSSProperties = {
  ...assistBtnStyle,
  marginTop: 0,
  height: 40,
  alignSelf: 'stretch',
}

/** Ícone assistente: gradiente animado + estrela (SMIL) — cores vivas alinhadas ao Nonato */
function AssistFieldGlyph() {
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const gradStroke = `assist-stroke-${uid}`
  const gradFill = `assist-fill-${uid}`
  return (
    <svg
      className="assist-field-glyph ns-vivid-icon"
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradStroke} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ade80">
            <animate attributeName="stop-color" values="#4ade80;#22d3ee;#a78bfa;#f472b6;#fbbf24;#4ade80" dur="12s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#22d3ee">
            <animate attributeName="stop-color" values="#22d3ee;#c084fc;#4ade80;#38bdf8;#f472b6;#22d3ee" dur="12s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
        <linearGradient id={gradFill} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.55">
            <animate attributeName="stop-color" values="#34d399;#38bdf8;#a78bfa;#34d399" dur="8s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.35">
            <animate attributeName="stop-color" values="#38bdf8;#f472b6;#fbbf24;#38bdf8" dur="8s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      <path
        d="M5 7.5h10M5 12h8M5 16.5h5"
        stroke={`url(#${gradStroke})`}
        strokeWidth="1.45"
        strokeLinecap="round"
      />
      <path
        d="m15.2 9.2 1.35 2.7 2.95.45-2.15 1.9.55 2.95-2.65-1.45-2.65 1.45.55-2.95-2.15-1.9 2.95-.45 1.35-2.7z"
        fill={`url(#${gradFill})`}
      />
      <path
        d="m15.2 9.2 1.35 2.7 2.95.45-2.15 1.9.55 2.95-2.65-1.45-2.65 1.45.55-2.95-2.15-1.9 2.95-.45 1.35-2.7z"
        stroke={`url(#${gradStroke})`}
        strokeWidth={0.85}
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

type TextareaRest = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'onChange' | 'children'
>

export function AssistTextarea(
  props: TextareaRest & {
    value: string
    onValueChange: (v: string) => void
    /** false = sem botão (ex.: só leitura) */
    showAssist?: boolean
    assistButtonTitle?: string
  }
) {
  const { value, onValueChange, showAssist = true, assistButtonTitle = 'Tradução assistida para este campo', ...rest } =
    props
  const { openForField } = useWritingAssistField()

  if (showAssist === false || rest.readOnly) {
    return <textarea {...rest} value={value} onChange={(e) => onValueChange(e.target.value)} />
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-start',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <textarea
        {...rest}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        style={{
          ...(rest.style as React.CSSProperties),
          flex: 1,
          minWidth: 0,
          boxSizing: 'border-box',
        }}
      />
      <button
        type="button"
        className="assist-field-btn"
        title={assistButtonTitle}
        aria-label={assistButtonTitle}
        onClick={() => openForField(value, onValueChange)}
        style={assistBtnStyle}
      >
        <AssistFieldGlyph />
      </button>
    </div>
  )
}

type InputRest = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'children' | 'type'
> & {
  value: string
  onValueChange: (v: string) => void
  type?: 'text' | 'email' | 'search' | 'url' | 'tel' | 'password'
  showAssist?: boolean
  assistButtonTitle?: string
}

export function AssistInput(props: InputRest) {
  const {
    value,
    onValueChange,
    type = 'text',
    showAssist = true,
    assistButtonTitle = 'Tradução assistida para este campo',
    ...rest
  } = props
  const { openForField } = useWritingAssistField()

  /** Palavras-passe: nunca enviar conteúdo ao assistente por defeito. */
  const textLike =
    type !== 'password' &&
    (type === 'text' || type === 'email' || type === 'search' || type === 'url' || type === 'tel')

  if (showAssist === false || rest.readOnly || !textLike) {
    return <input {...rest} type={type} value={value} onChange={(e) => onValueChange(e.target.value)} />
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '10px',
        alignItems: 'stretch',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <input
        {...rest}
        type={type}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        style={{
          ...(rest.style as React.CSSProperties),
          flex: 1,
          minWidth: 0,
          boxSizing: 'border-box',
        }}
      />
      <button
        type="button"
        className="assist-field-btn"
        title={assistButtonTitle}
        aria-label={assistButtonTitle}
        onClick={() => openForField(value, onValueChange)}
        style={assistBtnStyleInline}
      >
        <AssistFieldGlyph />
      </button>
    </div>
  )
}
