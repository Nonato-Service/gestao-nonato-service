'use client'

import React, { useEffect, useMemo, useState } from 'react'
import type { SafeT } from './adminTypes'

const STORAGE_KEY = 'nonato-confianca-checklist-v1'

type StepId =
  | 'abrirApp'
  | 'listarClientes'
  | 'letraInicial'
  | 'detalheValores'
  | 'fechamentoGrupo'
  | 'devedorVermelho'
  | 'whatsapp'
  | 'backupServidor'

const STEP_IDS: StepId[] = [
  'abrirApp',
  'listarClientes',
  'letraInicial',
  'detalheValores',
  'fechamentoGrupo',
  'devedorVermelho',
  'whatsapp',
  'backupServidor',
]

function tr(safeT: SafeT, key: string, fallback: string): string {
  return (safeT as Record<string, string | undefined>)[key] || fallback
}

type Props = { safeT: SafeT }

export function AdminConfiancaChecklist({ safeT }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [lastOkAt, setLastOkAt] = useState<string>('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as { checked?: Record<string, boolean>; lastOkAt?: string }
      if (parsed.checked && typeof parsed.checked === 'object') setChecked(parsed.checked)
      if (typeof parsed.lastOkAt === 'string') setLastOkAt(parsed.lastOkAt)
    } catch {
      /* ignorar */
    }
  }, [])

  const persist = (nextChecked: Record<string, boolean>, nextLastOk: string) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ checked: nextChecked, lastOkAt: nextLastOk })
      )
    } catch {
      /* ignorar */
    }
  }

  const steps = useMemo(
    () =>
      STEP_IDS.map((id) => ({
        id,
        label: tr(
          safeT,
          `confiancaStep_${id}`,
          {
            abrirApp: 'Abrir a app e ver o painel inicial',
            listarClientes: 'Clientes → Listar — aparece a lista A–Z',
            letraInicial: 'Tocar numa letra — só clientes dessa letra inicial',
            detalheValores: 'Abrir um cliente — ver situação financeira / valores',
            fechamentoGrupo: 'Fechamento — mudar grupo de tarifas actualiza € unitário',
            devedorVermelho: 'Cliente com «não pago» aparece a vermelho (badge Devedor)',
            whatsapp: 'Enviar relatório — botão «Enviar por WhatsApp» abre o WhatsApp',
            backupServidor: 'Administrador → Backup / Enviar tudo ao servidor (PC estável)',
          }[id]
        ),
      })),
    [safeT]
  )

  const doneCount = STEP_IDS.filter((id) => checked[id]).length
  const allDone = doneCount === STEP_IDS.length

  const toggle = (id: StepId) => {
    const next = { ...checked, [id]: !checked[id] }
    setChecked(next)
    persist(next, lastOkAt)
  }

  const marcarTudoOk = () => {
    const next: Record<string, boolean> = {}
    for (const id of STEP_IDS) next[id] = true
    const when = new Date().toISOString()
    setChecked(next)
    setLastOkAt(when)
    persist(next, when)
  }

  const limpar = () => {
    setChecked({})
    setLastOkAt('')
    persist({}, '')
  }

  return (
    <div className="admin-confianca">
      <p className="admin-confianca__lead">
        {tr(
          safeT,
          'confiancaLead',
          'Depois de cada actualização, valide só estes passos (cerca de 10 minutos). Se todos passarem, pode confiar mais no dia-a-dia — sem repassar o programa inteiro.'
        )}
      </p>
      <div className="admin-confianca__progress" aria-live="polite">
        <strong>
          {doneCount}/{STEP_IDS.length}
        </strong>{' '}
        {tr(safeT, 'confiancaConcluidos', 'concluídos')}
        {lastOkAt ? (
          <span className="admin-confianca__last">
            {' '}
            · {tr(safeT, 'confiancaUltimoOk', 'Último OK')}:{' '}
            {new Date(lastOkAt).toLocaleString()}
          </span>
        ) : null}
      </div>
      <ul className="admin-confianca__list">
        {steps.map((s) => (
          <li key={s.id}>
            <label className={`admin-confianca__item${checked[s.id] ? ' is-done' : ''}`}>
              <input
                type="checkbox"
                checked={Boolean(checked[s.id])}
                onChange={() => toggle(s.id)}
              />
              <span>{s.label}</span>
            </label>
          </li>
        ))}
      </ul>
      <div className="admin-confianca__actions">
        <button type="button" className="btn-primary" onClick={marcarTudoOk}>
          {tr(safeT, 'confiancaMarcarTudo', 'Marcar tudo como OK agora')}
        </button>
        <button type="button" className="btn-secondary" onClick={limpar}>
          {tr(safeT, 'confiancaLimpar', 'Limpar checklist')}
        </button>
      </div>
      {allDone ? (
        <p className="admin-confianca__ok">
          {tr(
            safeT,
            'confiancaTudoOk',
            'Checklist completo. Guarde esta confiança até à próxima alteração publicada.'
          )}
        </p>
      ) : null}
    </div>
  )
}
