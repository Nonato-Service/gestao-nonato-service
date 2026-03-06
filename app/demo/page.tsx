'use client'

import React from 'react'

function getActivateUrl(): string {
  if (typeof window === 'undefined') return '/api/demo/activate'
  const { protocol, hostname, port } = window.location
  if (hostname === '0.0.0.0') {
    const p = port || (protocol === 'https:' ? '443' : '80')
    return `${protocol === 'https:' ? 'http' : 'http'}://localhost:${p}/api/demo/activate`
  }
  return '/api/demo/activate'
}

export default function DemoWelcomePage() {
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
        <div
          style={{
            fontSize: '48px',
            marginBottom: '20px',
            lineHeight: 1,
          }}
        >
          🔒
        </div>
        <h1
          style={{
            color: '#00ff00',
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '16px',
          }}
        >
          Acesso de demonstração
        </h1>
        <p
          style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: '1.1rem',
            lineHeight: 1.6,
            marginBottom: '24px',
          }}
        >
          O seu acesso é válido apenas por <strong style={{ color: '#00ff00' }}>15 dias</strong>.
        </p>
        <p
          style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '0.95rem',
            lineHeight: 1.5,
            marginBottom: '12px',
          }}
        >
          Os dados do teste <strong>não são guardados no nosso banco de dados</strong> — ficam numa área isolada apenas para si. Ao fim de 15 dias o acesso é bloqueado automaticamente.
        </p>
        <p
          style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '0.9rem',
            lineHeight: 1.5,
            marginBottom: '32px',
          }}
        >
          Sem exportação nem backup. Ao clicar em &quot;Aceitar e entrar&quot;, concorda com estes termos.
        </p>
        {/* Link: em 0.0.0.0 usa localhost para evitar NS_ERROR_CONNECTION_REFUSED */}
        <a
          href={getActivateUrl()}
          style={{
            display: 'inline-block',
            padding: '14px 32px',
            background: '#00ff00',
            color: '#000',
            fontWeight: 700,
            fontSize: '1rem',
            borderRadius: '8px',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(0, 255, 0, 0.3)',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#00cc00'
            e.currentTarget.style.transform = 'scale(1.02)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#00ff00'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          Aceitar e entrar
        </a>
      </div>
    </div>
  )
}
