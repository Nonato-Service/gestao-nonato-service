'use client'

import { useLayoutEffect, useRef } from 'react'
import {
  fetchPecasBibliotecaLiteFromServer,
  fetchPecasBibliotecaServerMeta,
  loadPecasBibliotecaFromBrowserStorage,
  savePecasBibliotecaLocally,
} from '../utils/dataStorage'
import { isPecasBibliotecaCatalogIncomplete } from '../lib/pecasBibliotecaCompleteness'

type PecaLike = { id?: string; codigo?: string; nome?: string; [key: string]: unknown }

type Props = {
  pecasCount: number
  categoriasCount: number
  onLoaded: (pecas: PecaLike[]) => void
  onProgress?: (msg: string) => void
  loadingMessage?: string
}

/** Carrega catálogo completo do servidor quando o browser ficou com cópia parcial. */
export function PecasBibliotecaUrgentLoader({
  pecasCount,
  categoriasCount,
  onLoaded,
  onProgress,
  loadingMessage,
}: Props) {
  const doneRef = useRef(false)

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    if (doneRef.current) return
    if (!isPecasBibliotecaCatalogIncomplete(pecasCount, categoriasCount)) return

    doneRef.current = true
    let cancelled = false

    void (async () => {
      try {
        onProgress?.(loadingMessage || 'A carregar peças do servidor…')
        const meta = await fetchPecasBibliotecaServerMeta()
        const serverTotal = meta?.total ?? null

        if (!isPecasBibliotecaCatalogIncomplete(pecasCount, categoriasCount, serverTotal)) {
          onProgress?.('')
          return
        }

        const local = await loadPecasBibliotecaFromBrowserStorage(categoriasCount)
        if (cancelled) return
        if (
          local &&
          !isPecasBibliotecaCatalogIncomplete(local.length, categoriasCount, serverTotal)
        ) {
          onLoaded(local as PecaLike[])
          onProgress?.('')
          return
        }

        const fromLite = await fetchPecasBibliotecaLiteFromServer()
        if (cancelled) return
        if (
          !Array.isArray(fromLite) ||
          isPecasBibliotecaCatalogIncomplete(fromLite.length, categoriasCount, serverTotal)
        ) {
          throw new Error(`Catálogo inválido (${Array.isArray(fromLite) ? fromLite.length : 0} peças)`)
        }

        await savePecasBibliotecaLocally(fromLite)
        onLoaded(fromLite as PecaLike[])
        onProgress?.('')
        console.info(`[Nonato] Urgent loader: ${fromLite.length} peça(s) carregadas.`)
      } catch (e) {
        console.error('[Nonato] Urgent loader falhou:', e)
        onProgress?.('')
        doneRef.current = false
      }
    })()

    return () => {
      cancelled = true
    }
  }, [pecasCount, categoriasCount, onLoaded, onProgress, loadingMessage])

  return null
}
