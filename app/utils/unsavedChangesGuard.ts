/** Registo global de formulários com alterações por guardar — usado antes de mudar de aba/página. */

export type UnsavedLeaveAction = 'save' | 'discard' | 'cancel'

export type UnsavedGuardEntry = {
  id: string
  label: string
  isDirty: () => boolean
  save: () => Promise<boolean> | boolean
  discard?: () => void
}

const registry = new Map<string, UnsavedGuardEntry>()
const baselines = new Map<string, string>()

let dialogHandler: ((labels: string[]) => Promise<UnsavedLeaveAction>) | null = null

export function setUnsavedChangesDialogHandler(
  handler: ((labels: string[]) => Promise<UnsavedLeaveAction>) | null
): void {
  dialogHandler = handler
}

export function stableStringify(value: unknown): string {
  try {
    return JSON.stringify(value ?? null)
  } catch {
    return String(value)
  }
}

export function registerUnsavedGuard(entry: UnsavedGuardEntry): void {
  registry.set(entry.id, entry)
}

export function unregisterUnsavedGuard(id: string): void {
  registry.delete(id)
  baselines.delete(id)
}

export function setUnsavedFormBaseline(id: string, snapshot: unknown): void {
  baselines.set(id, stableStringify(snapshot))
}

export function markUnsavedFormClean(id: string, snapshot?: unknown): void {
  const entry = registry.get(id)
  if (snapshot !== undefined) {
    baselines.set(id, stableStringify(snapshot))
    return
  }
  if (entry) {
    try {
      baselines.set(id, stableStringify(entry.isDirty() ? null : null))
    } catch {
      /* ignorar */
    }
  }
}

export function isFormDirtyComparedToBaseline(id: string, current: unknown): boolean {
  const base = baselines.get(id)
  if (base === undefined) return false
  return stableStringify(current) !== base
}

export function getActiveDirtyGuards(): UnsavedGuardEntry[] {
  return [...registry.values()].filter((e) => {
    try {
      return e.isDirty()
    } catch {
      return false
    }
  })
}

export function hasUnsavedChanges(): boolean {
  return getActiveDirtyGuards().length > 0
}

/** @returns true se pode continuar (sair); false se o utilizador cancelou. */
export async function confirmBeforeLeaveUnsaved(): Promise<boolean> {
  const dirty = getActiveDirtyGuards()
  if (dirty.length === 0) return true
  if (!dialogHandler) {
    const labels = dirty.map((d) => d.label).join(', ')
    const save = window.confirm(
      `Tem alterações não guardadas (${labels}).\n\nOK = Guardar agora\nCancelar = ficar nesta página`
    )
    if (!save) return false
    for (const d of dirty) {
      const ok = await d.save()
      if (!ok) return false
    }
    return true
  }

  const action = await dialogHandler(dirty.map((d) => d.label))
  if (action === 'cancel') return false

  if (action === 'save') {
    for (const d of dirty) {
      const ok = await d.save()
      if (!ok) return false
    }
    return true
  }

  for (const d of dirty) {
    d.discard?.()
  }
  return true
}
