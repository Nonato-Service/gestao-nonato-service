'use client'

import { useLayoutEffect, useRef } from 'react'
import {
  fetchPecasBibliotecaLiteFromServer,
  fetchPecasBibliotecaServerMeta,
  loadPecasBibliotecaFromBrowserStorage,
  savePecasBibliotecaLocally,
  waitForDataApiAuth,
} from '../utils/dataStorage'
import { isPecasBibliotecaCatalogIncomplete } from '../lib/pecasBibliotecaCompleteness'
import {
  isPecasBibliotecaSyncInFlight,
  runPecasBibliotecaSyncExclusive,
} from '../lib/pecasBibliotecaSyncCoordinator'

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
  const startedIncompleteRef = useRef(false)

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    if (doneRef.current) return
    if (isPecasBibliotecaSyncInFlight()) return

    const incomplete = isPecasBibliotecaCatalogIncomplete(pecasCount, categoriasCount)
    if (!incomplete && !startedIncompleteRef.current) return
    startedIncompleteRef.current = true
    doneRef.current = true

    let cancelled = false

    void runPecasBibliotecaSyncExclusive('urgent-loader', async () => {
      try {
        onProgress?.(loadingMessage || 'A carregar peças do servidor…')
        await waitForDataApiAuth(25_000)
        const meta = await fetchPecasBibliotecaServerMeta()
        const serverTotal = meta?.total ?? null

        if (cancelled) return null

        if (!isPecasBibliotecaCatalogIncomplete(pecasCount, categoriasCount, serverTotal)) {
          onProgress?.('')
          return null
        }

        const local = await loadPecasBibliotecaFromBrowserStorage(categoriasCount)
        if (cancelled) return null
        if (
          local &&
          !isPecasBibliotecaCatalogIncomplete(local.length, categoriasCount, serverTotal)
        ) {
          onLoaded(local as PecaLike[])
          onProgress?.('')
          return local
        }

        const fromLite = await fetchPecasBibliotecaLiteFromServer()
        if (cancelled) return null
        if (
          !Array.isArray(fromLite) ||
          isPecasBibliotecaCatalogIncomplete(fromLite.length, categoriasCount, serverTotal)
        ) {
          throw new Error(`Catálogo inválido (${Array.isArray(fromLite) ? fromLite.length : 0}${serverTotal ? `/${serverTotal}` : ''} peças)`)
        }

        await savePecasBibliotecaLocally(fromLite)
        onLoaded(fromLite as PecaLike[])
        onProgress?.('')
        console.info(`[Nonato] Urgent loader: ${fromLite.length} peça(s) carregadas.`)
        return fromLite
      } catch (e) {
        console.error('[Nonato] Urgent loader falhou:', e)
        onProgress?.('')
        doneRef.current = false
        return null
      }
    })

    return () => {
      cancelled = true
    }
  }, [categoriasCount, onLoaded, onProgress, loadingMessage])

  return null
}
