'use client'

import { useEffect, useRef } from 'react'
import {
  isFormDirtyComparedToBaseline,
  registerUnsavedGuard,
  setUnsavedFormBaseline,
  unregisterUnsavedGuard,
} from '../utils/unsavedChangesGuard'

type Options = {
  id: string
  label: string
  enabled: boolean
  /** Muda quando abre outro registo (ex.: id do relatório). */
  sessionKey: string
  current: unknown
  save: () => Promise<boolean> | boolean
  discard?: () => void
}

/** Regista um formulário no aviso global «Deseja guardar antes de sair?». */
export function useUnsavedFormGuard(opts: Options): void {
  const currentRef = useRef(opts.current)
  currentRef.current = opts.current
  const saveRef = useRef(opts.save)
  saveRef.current = opts.save
  const discardRef = useRef(opts.discard)
  discardRef.current = opts.discard

  useEffect(() => {
    if (!opts.enabled) return
    setUnsavedFormBaseline(opts.id, currentRef.current)
  }, [opts.enabled, opts.sessionKey, opts.id])

  useEffect(() => {
    if (!opts.enabled) {
      unregisterUnsavedGuard(opts.id)
      return
    }

    registerUnsavedGuard({
      id: opts.id,
      label: opts.label,
      isDirty: () => isFormDirtyComparedToBaseline(opts.id, currentRef.current),
      save: () => saveRef.current(),
      discard: () => discardRef.current?.(),
    })

    return () => unregisterUnsavedGuard(opts.id)
  }, [opts.enabled, opts.id, opts.label])
}
