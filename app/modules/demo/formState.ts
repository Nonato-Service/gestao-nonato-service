/** Formulário vazio do destinatário de demonstração. */

import type { DemoModuleMode, DemoPackagePreset } from './tipos'

export type DemoRecipientFormState = {
  nome: string
  email: string
  observacoes: string
  demoDays: number
  demoModules: Record<string, DemoModuleMode>
  demoPreset: DemoPackagePreset | 'custom'
}

export type EmptyDemoRecipientFormOpts = {
  demoDays?: number
  demoPreset?: DemoPackagePreset | 'custom'
}

/** Mapa inicial: hidden / active / teaser conforme as listas de acções. */
export function defaultDemoModulesForActions(
  actionKeys: readonly string[],
  hiddenActions: ReadonlySet<string>,
  allowedActions: ReadonlySet<string>
): Record<string, DemoModuleMode> {
  return Object.fromEntries(
    actionKeys.map((action) => {
      const mode: DemoModuleMode = hiddenActions.has(action)
        ? 'hidden'
        : allowedActions.has(action)
          ? 'active'
          : 'teaser'
      return [action, mode]
    })
  ) as Record<string, DemoModuleMode>
}

export function emptyDemoRecipientForm(
  demoModules: Record<string, DemoModuleMode>,
  opts: EmptyDemoRecipientFormOpts = {}
): DemoRecipientFormState {
  return {
    nome: '',
    email: '',
    observacoes: '',
    demoDays: opts.demoDays ?? 15,
    demoModules,
    demoPreset: opts.demoPreset ?? 'commercial',
  }
}
