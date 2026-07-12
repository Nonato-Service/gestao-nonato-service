'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Peca = Record<string, unknown>

export default function MinhasPecasPage() {
  const [status, setStatus] = useState('A carregar as suas peças do servidor deste PC…')
  const [total, setTotal] = useState(0)
  const [ok, setOk] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const res = await fetch(`/api/data/pecas-fix?_=${Date.now()}`, { cache: 'no-store' })
        const json = (await res.json()) as { success?: boolean; pecas?: Peca[]; total?: number; message?: string }
        if (!res.ok || !json.success || !Array.isArray(json.pecas) || json.pecas.length === 0) {
          throw new Error(json.message || `Servidor respondeu ${res.status}`)
        }
        if (cancelled) return

        const KEY = 'nonato-pecas-biblioteca'
        const DB = 'nonato-gestao-tecnica-v1'
        const STORE = 'kv'
        const pecas = json.pecas

        try {
          localStorage.removeItem(`${KEY}--idb`)
          localStorage.setItem(KEY, JSON.stringify(pecas))
        } catch {
          /* quota — IndexedDB abaixo */
        }

        if (typeof indexedDB !== 'undefined') {
          const db = await new Promise<IDBDatabase>((resolve, reject) => {
            const req = indexedDB.open(DB, 2)
            req.onerror = () => reject(req.error)
            req.onsuccess = () => resolve(req.result)
            req.onupgradeneeded = () => {
              const d = req.result
              if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE)
            }
          })
          await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE, 'readwrite')
            tx.objectStore(STORE).put(JSON.parse(JSON.stringify(pecas)), KEY)
            tx.oncomplete = () => resolve()
            tx.onerror = () => reject(tx.error)
          })
        }

        sessionStorage.setItem('nonato-pecas-biblioteca-count', String(pecas.length))
        setTotal(pecas.length)
        setOk(true)
        setStatus(`${pecas.length} peça(s) gravadas neste browser. Pode abrir a Biblioteca de Peças.`)
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : String(e))
          setStatus('Falhou')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div style={{ fontFamily: 'system-ui,sans-serif', maxWidth: 520, margin: '2rem auto', padding: '0 1rem', background: '#0f1419', color: '#e8eef4', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '1.35rem' }}>As suas peças — restauração directa</h1>
      <p style={{ opacity: 0.9, lineHeight: 1.5 }}>
        Os backups guardaram <strong>362 peças</strong> no disco deste PC. Esta página grava-as no browser — sem testes, sem ir ao site HOMAG.
      </p>
      <div
        style={{
          margin: '1rem 0',
          padding: '1rem',
          borderRadius: 8,
          background: '#1a2332',
          border: `1px solid ${err ? '#c44' : ok ? '#3d9a5a' : '#555'}`,
        }}
      >
        {err ? <strong style={{ color: '#f88' }}>Erro: {err}</strong> : status}
        {ok && total > 0 ? (
          <p style={{ marginTop: 12, marginBottom: 0 }}>
            <Link href="/" style={{ color: '#7dffb0', fontWeight: 700, fontSize: '1.1rem' }}>
              → Abrir aplicação (Biblioteca de Peças)
            </Link>
          </p>
        ) : null}
      </div>
      {!ok && !err ? <p style={{ fontSize: '0.85rem', color: '#888' }}>Aguarde…</p> : null}
      {err ? (
        <p style={{ fontSize: '0.9rem' }}>
          Confirme que a janela do servidor está aberta (<code>npm run dev</code>) em{' '}
          <a href="http://localhost:3000" style={{ color: '#7dffb0' }}>
            localhost:3000
          </a>
        </p>
      ) : null}
    </div>
  )
}
