/** Validação e mapeamento puro do botão da barra lateral. */

import type { SidebarButtonFormState } from './buttonForm'
import type { SidebarButton } from './tipos'

/** Nome e acção (sem trim — comportamento legado). */
export function isSidebarButtonFormValid(
  form: Pick<SidebarButtonFormState, 'name' | 'action'>
): boolean {
  return Boolean(form.name && form.action)
}

/** Se o nome coincide com uma chave pt-BR, o botão pode seguir a tradução. */
export function findSidebarButtonTranslationKey(
  name: string,
  ptBR: Record<string, unknown>
): string | undefined {
  const nameLower = name.toLowerCase().trim()
  for (const key of Object.keys(ptBR)) {
    const ptValue = String(ptBR[key]).toLowerCase().trim()
    if (ptValue === nameLower) return key
  }
  return undefined
}

export function isSidebarButtonCustomName(
  formName: string,
  translationKey: string | undefined,
  defaultTranslation: string | null | undefined
): boolean {
  return !translationKey || !defaultTranslation || formName !== defaultTranslation
}

export function createSidebarButtonFromForm(
  form: SidebarButtonFormState,
  opts: { id: string; order: number; translationKey?: string; customName: boolean }
): SidebarButton {
  return {
    id: opts.id,
    name: form.name,
    action: form.action,
    order: opts.order,
    translationKey: opts.translationKey,
    customName: opts.customName,
  }
}

export function updateSidebarButtonFromForm(
  existing: SidebarButton,
  form: SidebarButtonFormState,
  opts: { translationKey?: string; customName: boolean }
): SidebarButton {
  return {
    ...existing,
    name: form.name,
    action: form.action,
    translationKey: opts.translationKey || existing.translationKey,
    customName: opts.customName,
  }
}
