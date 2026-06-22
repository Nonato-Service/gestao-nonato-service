'use client'

import React, { useEffect, useState } from 'react'
import {
  DIARIO_LEMBRETE_CUSTOM_KEY,
  DIARIO_LEMBRETE_INTERVALOS_MIN,
  clampDiarioLembreteMinutos,
  diarioLembreteSelectKey,
  formatDiarioLembreteIntervalo,
} from '../lib/diarioLembrete'

type Props = {
  minutes: number
  onMinutesChange: (min: number) => void
  safeT: Record<string, string | undefined>
  idPrefix: string
  disabled?: boolean
}

export function DiarioLembreteIntervalPicker(props: Props) {
  const { minutes, onMinutesChange, safeT, idPrefix, disabled } = props
  const [selectKey, setSelectKey] = useState(() => diarioLembreteSelectKey(minutes))
  const [customMin, setCustomMin] = useState(() =>
    diarioLembreteSelectKey(minutes) === DIARIO_LEMBRETE_CUSTOM_KEY ? minutes : 45
  )

  useEffect(() => {
    const key = diarioLembreteSelectKey(minutes)
    setSelectKey(key)
    if (key === DIARIO_LEMBRETE_CUSTOM_KEY) setCustomMin(minutes)
  }, [minutes])

  return (
    <div className="ns-diario-lembrete__picker">
      <select
        id={`${idPrefix}-intervalo`}
        className="ns-diario-lembrete__select"
        value={selectKey}
        disabled={disabled}
        onChange={(e) => {
          const v = e.target.value
          if (v === DIARIO_LEMBRETE_CUSTOM_KEY) {
            setSelectKey(DIARIO_LEMBRETE_CUSTOM_KEY)
            const next = clampDiarioLembreteMinutos(customMin)
            setCustomMin(next)
            onMinutesChange(next)
            return
          }
          const m = Number(v)
          setSelectKey(String(m))
          onMinutesChange(m)
        }}
      >
        {DIARIO_LEMBRETE_INTERVALOS_MIN.map((min) => (
          <option key={min} value={min}>
            {formatDiarioLembreteIntervalo(min, safeT as Record<string, string>)}
          </option>
        ))}
        <option value={DIARIO_LEMBRETE_CUSTOM_KEY}>
          {safeT.diarioPedidosLembretePersonalizado || 'Personalizado'}
        </option>
      </select>
      {selectKey === DIARIO_LEMBRETE_CUSTOM_KEY ? (
        <div className="ns-diario-lembrete__custom">
          <input
            id={`${idPrefix}-custom-min`}
            type="number"
            className="ns-diario-lembrete__custom-input"
            min={1}
            max={525600}
            step={1}
            value={customMin}
            disabled={disabled}
            onChange={(e) => {
              const next = clampDiarioLembreteMinutos(Number(e.target.value) || 1)
              setCustomMin(next)
              onMinutesChange(next)
            }}
          />
          <label className="ns-diario-lembrete__custom-label" htmlFor={`${idPrefix}-custom-min`}>
            {safeT.diarioPedidosLembreteMinutosLabel || 'minutos'}
          </label>
        </div>
      ) : null}
    </div>
  )
}
