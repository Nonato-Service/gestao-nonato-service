'use client'

import React from 'react'

export default function DemoEncerradoPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #121212 100%)',
        color: '#fff',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          background: '#121212',
          border: '1px solid rgba(0, 200, 83, 0.3)',
          borderRadius: '16px',
          padding: '40px 32px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>✓</div>
        <h1 style={{ color: '#00c853', fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px' }}>
          Demonstração encerrada
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '16px' }}>
          Obrigado por experimentar o sistema NONATO SERVICE.
        </p>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.95rem', lineHeight: 1.5 }}>
          Este acesso era apenas para demonstração. Os dados da produção não estão disponíveis neste link.
          Para contratar ou obter acesso completo, contacte a NONATO SERVICE.
        </p>
      </div>
    </div>
  )
}
