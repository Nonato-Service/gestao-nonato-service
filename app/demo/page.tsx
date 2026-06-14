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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#0a0a0a', color: '#fff', textAlign: 'center' }}>
        <div style={{ maxWidth: '440px' }}>
          <h1 style={{ color: '#ff9b9b', marginBottom: '12px' }}>Link inválido</h1>
          <p style={{ opacity: 0.85, lineHeight: 1.6 }}>
            Este link de demonstração não existe ou está incompleto. Peça um link personalizado a quem lhe enviou o acesso.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          background: '#1a1a1a',
          border: '1px solid rgba(0, 255, 0, 0.3)',
          borderRadius: '16px',
          padding: '40px 32px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 255, 0, 0.08)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '20px', lineHeight: 1 }}>🔒</div>
        <h1 style={{ color: '#00ff00', fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px' }}>
          Gestor Demo — NONATO SERVICE
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '24px' }}>
          O seu acesso é válido por{' '}
          <strong style={{ color: '#00ff00' }}>
            {demoDays} dia{demoDays === 1 ? '' : 's'}
          </strong>{' '}
          após entrar.
        </p>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '16px' }}>
          Os dados desta demonstração ficam isolados. Ao clicar em «Aceitar e entrar», concorda com estes termos.
        </p>
        {demoUsuario && (
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', lineHeight: 1.55, marginBottom: '24px', padding: '12px', borderRadius: '10px', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.25)' }}>
            Utilizador de acesso: <strong style={{ color: '#ffd36a' }}>{demoUsuario}</strong>
            <br />
            A senha foi enviada pelo administrador (WhatsApp, e-mail ou mensagem).
          </p>
        )}
        <button
          type="button"
          onClick={handleActivate}
          disabled={loading}
          style={{
            display: 'inline-block',
            padding: '14px 32px',
            background: loading ? '#00aa00' : '#00ff00',
            color: '#000',
            fontWeight: 700,
            fontSize: '1rem',
            borderRadius: '8px',
            border: 'none',
            cursor: loading ? 'wait' : 'pointer',
            boxShadow: '0 4px 12px rgba(0, 255, 0, 0.3)',
          }}
        >
          {loading ? 'A entrar…' : 'Aceitar e entrar'}
        </button>
      </div>
    </div>
  )
}
