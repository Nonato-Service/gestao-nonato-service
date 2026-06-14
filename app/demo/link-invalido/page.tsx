'use client'

export default function DemoLinkInvalidoPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#0a0a0a',
        color: '#fff',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: '440px' }}>
        <h1 style={{ color: '#ff9b9b', marginBottom: '12px' }}>Link inválido</h1>
        <p style={{ opacity: 0.85, lineHeight: 1.6, marginBottom: '20px' }}>
          Este link de demonstração não existe ou está incompleto. Peça um link personalizado a quem lhe enviou o acesso.
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: '#00ff00',
            color: '#000',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 700,
          }}
        >
          Voltar ao início
        </a>
      </div>
    </div>
  )
}
