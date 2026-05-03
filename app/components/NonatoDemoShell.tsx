'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ensureNonatoDemoClockStarted,
  getNonatoDemoDaysRemaining,
  getNonatoDemoExpiresAtMs,
  isNonatoDemoBuild,
  isNonatoDemoExpired,
} from '@/app/utils/nonatoDemoMode'

function formatEndDate(ms: number | null, lang: string): string {
  if (ms === null) return ''
  try {
    const d = new Date(ms)
    if (lang.startsWith('pt')) return d.toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })
    if (lang.startsWith('es')) return d.toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })
    return d.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return ''
  }
}

export function NonatoDemoShell() {
  const [, setTick] = useState(0)
  const show = isNonatoDemoBuild()

  useEffect(() => {
    if (!show) return
    ensureNonatoDemoClockStarted()
    const id = window.setInterval(() => setTick((n) => n + 1), 60_000)
    return () => window.clearInterval(id)
  }, [show])

  const lang = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : 'pt'
  const copy = useMemo(() => {
    const es = lang.startsWith('es')
    const en = lang.startsWith('en') && !lang.startsWith('en-pt')
    if (es) {
      return {
        banner:
          'DEMO — solo almacenamiento local · sin servidor ni sincronización · caduca en {d} día(s) ({fecha})',
        lockTitle: 'Período de demostración finalizado',
        lockBody:
          'Esta copia de demostración ya no está disponible. Los datos siguen solo en este navegador; no se enviaron a ningún servidor. Para seguir usando el sistema completo, use una instalación normal.',
      }
    }
    if (en) {
      return {
        banner:
          'DEMO — local storage only · no server or sync · expires in {d} day(s) ({fecha})',
        lockTitle: 'Demo period has ended',
        lockBody:
          'This demo build is no longer available. Your data stayed in this browser only and was never sent to a server. For full use, install the regular build.',
      }
    }
    return {
      banner:
        'DEMO — só armazenamento local · sem servidor nem sincronização · expira em {d} dia(s) ({fecha})',
      lockTitle: 'Demonstração terminada',
      lockBody:
        'Este executável de demonstração já não está disponível. Os dados ficaram apenas neste navegador e nunca foram enviados a um servidor. Para uso completo, utilize uma instalação normal da aplicação.',
    }
  }, [lang])

  if (!show) return null

  const expired = isNonatoDemoExpired()
  const daysLeft = getNonatoDemoDaysRemaining()
  const endsAt = getNonatoDemoExpiresAtMs()
  const fecha = formatEndDate(endsAt, lang)

  if (expired) {
    return (
      <div
        className="nonato-demo-lock"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="nonato-demo-lock-title"
        aria-describedby="nonato-demo-lock-desc"
      >
        <div className="nonato-demo-lock__card">
          <h1 id="nonato-demo-lock-title" className="nonato-demo-lock__title">
            {copy.lockTitle}
          </h1>
          <p id="nonato-demo-lock-desc" className="nonato-demo-lock__text">
            {copy.lockBody}
          </p>
        </div>
      </div>
    )
  }

  const bannerText = copy.banner.replace('{d}', String(daysLeft)).replace('{fecha}', fecha)

  return (
    <div className="nonato-demo-banner" role="status">
      <span className="nonato-demo-banner__label">DEMO</span>
      <span className="nonato-demo-banner__msg">{bannerText}</span>
    </div>
  )
}
