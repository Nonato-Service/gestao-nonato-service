'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { DEMO_DAYS_DEFAULT } from '../lib/demoManagement'

export default function DemoWelcomePage() {
  const searchParams = useSearchParams()
  const rid = searchParams.get('rid')?.trim()
  const [loading, setLoading] = useState(false)
  const [demoDays, setDemoDays] = useState(DEMO_DAYS_DEFAULT)
  const [demoUsuario, setDemoUsuario] = useState<string | null>(null)
  const [invalidLink, setInvalidLink] = useState(!rid)

  useEffect(() => {
    if (!rid) return
    fetch(`/api/demo/activate?rid=${encodeURIComponent(rid)}&preview=1`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { demoDays?: number; found?: boolean; demoUsuario?: string | null }) => {
        if (data.found === false) {
          setInvalidLink(true)
          return
        }
        if (typeof data.demoDays === 'number') setDemoDays(data.demoDays)
        if (data.demoUsuario) setDemoUsuario(data.demoUsuario)
      })
      .catch(() => setInvalidLink(true))
  }, [rid])

  const activateHref = `/api/demo/activate?rid=${encodeURIComponent(rid || '')}`

  const handleActivate = async () => {
    if (!rid || loading) return
    setLoading(true)
    try {
      const res = await fetch(activateHref, {
        credentials: 'include',
        redirect: 'manual',
        headers: { Accept: 'application/json' },
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; message?: string }
      if (res.ok && data.ok !== false) {
        window.location.assign('/')
        return
      }
      if (data.error === 'owner_session') {
        window.alert(data.message || 'Use janela anónima para testar a demo.')
        setLoading(false)
        return
      }
      setInvalidLink(true)
      setLoading(false)
    } catch {
      setInvalidLink(true)
      setLoading(false)
    }
  }

  if (invalidLink || !rid) {
    return (
      <div className="ns-init-shell">
        <div className="ns-init-card ns-init-card--error">
          <div className="ns-init-icon" aria-hidden>
            !
          </div>
          <h1 className="ns-init-title ns-init-title--error">Link inválido</h1>
          <p className="ns-init-lead">
            Este link de demonstração não existe ou está incompleto. Peça um link personalizado a quem lhe enviou o
            acesso.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="ns-init-shell">
      <div className="ns-init-card">
        <div className="ns-init-icon" aria-hidden>
          🔒
        </div>
        <h1 className="ns-init-title">Gestor Demo — NONATO SERVICE</h1>
        <p className="ns-init-lead">
          O seu acesso é válido por{' '}
          <strong style={{ color: '#6ee7b7' }}>
            {demoDays} dia{demoDays === 1 ? '' : 's'}
          </strong>{' '}
          após entrar.
        </p>
        <p className="ns-init-note">
          Os dados desta demonstração ficam isolados. Ao clicar em «Aceitar e entrar», concorda com estes termos.
        </p>
        {demoUsuario && (
          <p className="ns-init-user-box">
            Utilizador de acesso: <strong style={{ color: '#ffd36a' }}>{demoUsuario}</strong>
            <br />A senha foi enviada pelo administrador (WhatsApp, e-mail ou mensagem).
          </p>
        )}
        <button type="button" className="ns-init-cta" onClick={handleActivate} disabled={loading}>
          {loading ? 'A entrar…' : 'Aceitar e entrar'}
        </button>
      </div>
    </div>
  )
}
