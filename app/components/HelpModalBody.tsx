'use client'

import React from 'react'

/** Separador entre «para que serve» e «como fazer» (mesmo em todos os idiomas). */
export const HELP_COMO_DELIMITER = '\n---COMO---\n'

type Props = {
  text: string
  titlePara: string
  titleComo: string
  titleResumo: string
}

/** Linha de agrupamento no bloco «Como fazer»: começa por «— » (em dash + espaço). */
function isComoGroupHeading(line: string): boolean {
  return line.startsWith('— ')
}

export function HelpModalBody({ text, titlePara, titleComo, titleResumo }: Props) {
  const raw = (text || '').trim()
  if (!raw) return null

  const idx = raw.indexOf(HELP_COMO_DELIMITER)
  if (idx === -1) {
    return (
      <div className="help-modal-body">
        <h3
          style={{
            color: '#00ff88',
            fontSize: 15,
            margin: '0 0 12px',
            fontWeight: 700,
            letterSpacing: '0.02em',
          }}
        >
          {titleResumo}
        </h3>
        <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>{raw}</p>
      </div>
    )
  }

  const para = raw.slice(0, idx).trim()
  const comoBlock = raw.slice(idx + HELP_COMO_DELIMITER.length).trim()
  const lines = comoBlock
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  return (
    <div className="help-modal-body">
      <section style={{ marginBottom: 22 }}>
        <h3
          style={{
            color: '#00ff88',
            fontSize: 15,
            margin: '0 0 10px',
            fontWeight: 700,
            letterSpacing: '0.02em',
          }}
        >
          {titlePara}
        </h3>
        <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>{para}</p>
      </section>
      <section>
        <h3
          style={{
            color: '#00ff88',
            fontSize: 15,
            margin: '0 0 10px',
            fontWeight: 700,
            letterSpacing: '0.02em',
          }}
        >
          {titleComo}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {lines.map((line, i) => {
            if (isComoGroupHeading(line)) {
              return (
                <div
                  key={`g-${i}`}
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: '#9efacb',
                    letterSpacing: '0.04em',
                    marginTop: i === 0 ? 0 : 14,
                    marginBottom: 8,
                    paddingBottom: 4,
                    borderBottom: '1px solid rgba(0, 255, 136, 0.2)',
                  }}
                >
                  {line.slice(2).trim()}
                </div>
              )
            }
            const itemText = line.replace(/^[•\-\*]\s*/, '')
            return (
              <div
                key={`i-${i}`}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  marginBottom: 10,
                  lineHeight: 1.65,
                  paddingLeft: 2,
                }}
              >
                <span style={{ color: '#00cc66', flexShrink: 0, marginTop: 2 }} aria-hidden>
                  •
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>{itemText}</span>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
