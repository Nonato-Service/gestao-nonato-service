/** Helpers puros de modo de módulo na demo (active / teaser / hidden). */

import type { DemoModuleMode } from './tipos'

export function isDemoModuleMode(value: unknown): value is DemoModuleMode {
  return value === 'active' || value === 'teaser' || value === 'hidden'
}

/** Extrai só modos válidos de um mapa potencialmente sujo (cookie / storage legado). */
export function pickValidDemoModuleModes(
  modules: Record<string, DemoModuleMode | string> | undefined
): Record<string, DemoModuleMode> {
  const base: Record<string, DemoModuleMode> = {}
  if (modules && typeof modules === 'object') {
    for (const [key, value] of Object.entries(modules)) {
      if (isDemoModuleMode(value)) {
        base[key] = value
      }
    }
  }
  return base
}

export function countActiveModules(modules: Record<string, DemoModuleMode>): number {
  return Object.values(modules).filter((m) => m === 'active').length
}
