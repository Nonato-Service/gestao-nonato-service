'use client'

import { useLayoutEffect, useRef } from 'react'
import {
  loadPecasBibliotecaFromBrowserStorage,
  savePecasBibliotecaLocally,
} from '../utils/dataStorage'

type PecaLike = { id?: string; codigo?: string; nome?: string; [key: string]: unknown }

type Props = {
  pecasCount: number
  onLoaded: (pecas: PecaLike[]) => void
  onProgress?: (msg: string) => void
  loadingMessage?: string
}

/** Carrega 362 peças do servidor IMEDIATAMENTE — não espera o bootstrap lento. */
export function PecasBibliotecaUrgentLoader({ pecasCount, onLoaded, onProgress, loadingMessage }: Props) {
  const doneRef = useRef(false)

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    if (doneRef.current) return
    if (pecasCount >= 50) return

    doneRef.current = true
    let cancelled = false

    void (async () => {
      try {
        onProgress?.(loadingMessage || 'Loading parts from server…')
        const local = await loadPecasBibliotecaFromBrowserStorage()
        if (cancelled) return
        if (local && local.length >= 50) {
          onLoaded(local as PecaLike[])
          onProgress?.('')
          return
        }

        const res = await fetch(
          `/api/data/pecas-fix?_=${Date.now()}`,
          { cache: 'no-store', credentials: 'same-origin' }
        )
        if (!res.ok) throw new Error(`Servidor respondeu ${res.status}`)
        const json = (await res.json()) as { success?: boolean; pecas?: unknown; total?: number; message?: string }
        const data = json?.pecas
        if (!Array.isArray(data) || data.length < 50) {
          throw new Error(`Catálogo inválido (${Array.isArray(data) ? data.length : 0} peças)`)
        }
        if (cancelled) return
        await savePecasBibliotecaLocally(data)
        onLoaded(data as PecaLike[])
        onProgress?.('')
        console.info(`[Nonato] Urgent loader: ${data.length} peça(s) carregadas.`)
      } catch (e) {
        console.error('[Nonato] Urgent loader falhou:', e)
        onProgress?.('')
        doneRef.current = false
      }
    })()

    return () => {
      cancelled = true
    }
  }, [pecasCount, onLoaded, onProgress])

  return null
}
